import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { env } from "./env.ts";
import { auth } from "./auth.ts";
import { pool } from "./db.ts";
import { ArtefactAgentError, generateArtefact } from "./artefact-agent.ts";
import {
    githubActionsClaims,
    githubArtefactComment,
    githubAppSlug,
    githubInstallation,
    githubInstallationRequest,
    githubRepositoryInstallation,
    validGitHubWebhook,
} from "./github.ts";

const app: Express = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));

// Better Auth handles its own body parsing; this must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.post(
    "/api/integrations/github/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        if (
            !Buffer.isBuffer(req.body) ||
            !validGitHubWebhook(req.body, req.header("x-hub-signature-256"))
        )
            return res.sendStatus(401);
        const payload = JSON.parse(req.body.toString()) as {
            action?: string;
            installation?: { id?: number };
        };
        if (
            req.header("x-github-event") === "installation" &&
            ["deleted", "suspend"].includes(payload.action ?? "")
        ) {
            const { installation } = payload;
            if (installation?.id)
                await pool.query(
                    "delete from github_installation where installation_id = $1",
                    [String(installation.id)],
                );
        }
        res.sendStatus(204);
    },
);

app.use(express.json());

async function sessionUser(req: Request, res: Response) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
        res.sendStatus(401);
        return;
    }
    return session.user;
}

async function createGeneratedArtefact(
    ownerId: string,
    prompt: string,
    isShared = false,
    options: { onProgress?: (message: string) => void; signal?: AbortSignal } = {},
) {
    const startedAt = performance.now();
    const { content, sessionId, telemetry } = await generateArtefact(
        prompt,
        env.openAiApiKey,
        env.openAiModel,
        options,
    );
    const artefact = {
        id: randomUUID(),
        isShared,
        prompt,
        title: String(content.root.data.title),
        content,
        createdAt: new Date().toISOString(),
    };
    await pool.query(
        "insert into artefact (id, owner_id, share_id, is_shared, prompt, title, content, agent_session_id) values ($1, $2, $1, $3, $4, $5, $6, $7)",
        [
            artefact.id,
            ownerId,
            artefact.isShared,
            artefact.prompt,
            artefact.title,
            artefact.content,
            sessionId,
        ],
    );
    console.info("artefact_generation", {
        ...telemetry,
        blocks: content.root.children?.[0]?.children?.length ?? 0,
        totalMs: Math.round(performance.now() - startedAt),
    });
    return artefact;
}

app.get("/api/integrations/github/install", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const state = randomUUID();
    await pool.query(
        "delete from github_installation_state where expires_at < current_timestamp",
    );
    await pool.query(
        "insert into github_installation_state (state, owner_id, expires_at) values ($1, $2, current_timestamp + interval '10 minutes')",
        [state, user.id],
    );
    res.redirect(
        `https://github.com/apps/${await githubAppSlug()}/installations/new?state=${state}`,
    );
});

async function completeGitHubInstallation(req: Request, res: Response) {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const installationId =
        typeof req.query.installation_id === "string" &&
        /^\d+$/.test(req.query.installation_id)
            ? req.query.installation_id
            : "";
    const { rows } = await pool.query(
        "delete from github_installation_state where state = $1 and expires_at > current_timestamp returning owner_id",
        [state],
    );
    if (!rows[0] || !installationId)
        return res
            .status(400)
            .send("This GitHub installation link is invalid or expired.");
    const installation = await githubInstallation(installationId);
    const saved = await pool.query(
        "insert into github_installation (installation_id, owner_id, account_login, account_type) values ($1, $2, $3, $4) on conflict (installation_id) do update set account_login = excluded.account_login, account_type = excluded.account_type, updated_at = current_timestamp where github_installation.owner_id = excluded.owner_id returning installation_id",
        [
            installationId,
            rows[0].owner_id,
            installation.account.login,
            installation.account.type,
        ],
    );
    if (!saved.rows[0])
        return res
            .status(409)
            .send(
                "This GitHub installation is connected to another Orcastrate account.",
            );
    res.redirect(`${env.corsOrigin}/profile?github=connected`);
}

app.get("/api/integrations/github/setup", completeGitHubInstallation);
app.get("/api/integrations/github/callback", completeGitHubInstallation);

app.get("/api/integrations/github", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        'select installation_id as "installationId", account_login as "accountLogin", account_type as "accountType" from github_installation where owner_id = $1 order by created_at',
        [user.id],
    );
    res.json(rows);
});

app.post("/api/integrations/github/actions/artefacts", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const pullRequest = Number(req.body?.pullRequest);
    if (!token || !Number.isInteger(pullRequest) || pullRequest < 1)
        return res
            .status(400)
            .json({
                error: "A GitHub Actions token and pull request number are required.",
            });
    const { repository } = await githubActionsClaims(token);
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
        return res.status(400).json({ error: "Invalid repository." });
    const { id: installationId } =
        await githubRepositoryInstallation(repository);
    const installation = await pool.query(
        "select owner_id from github_installation where installation_id = $1",
        [String(installationId)],
    );
    if (!installation.rows[0]) return res.sendStatus(403);
    const artefact = await createGeneratedArtefact(
        installation.rows[0].owner_id,
        `Create a useful artefact for pull request #${pullRequest} in ${repository}.`,
        true,
    );
    const url = `${env.corsOrigin}/artefacts/shared/${artefact.id}`;
    await githubInstallationRequest(
        String(installationId),
        `/repos/${repository}/issues/${pullRequest}/comments`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                body: githubArtefactComment(url),
            }),
        },
    );
    res.status(201).json({ id: artefact.id, url, createdAt: new Date().toISOString() });
});

app.get("/api/artefacts", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        'select id, is_shared as "isShared", prompt, title, created_at as "createdAt", updated_at as "updatedAt" from artefact where owner_id = $1 order by updated_at desc',
        [user.id],
    );
    res.json(rows);
});

app.post("/api/artefacts", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const prompt =
        typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    let artefact;
    try {
        artefact = await createGeneratedArtefact(
            user.id,
            prompt,
        );
    } catch (error) {
        if (!(error instanceof ArtefactAgentError)) throw error;
        console.error("Artefact generation failed", {
            kind: error.kind,
            ...error.details,
        });
        return res.status(502).json({ error: "Could not generate artefact." });
    }
    res.status(201).json(artefact);
});

app.post("/api/artefacts/stream", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    res.status(200).set({
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
    });
    res.flushHeaders();
    const controller = new AbortController();
    res.on("close", () => {
        if (!res.writableEnded) controller.abort();
    });
    const send = (event: string, data: unknown) =>
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
        const artefact = await createGeneratedArtefact(user.id, prompt, false, {
            signal: controller.signal,
            onProgress: (message) => send("progress", { message }),
        });
        send("complete", { artefact });
    } catch (error) {
        const kind = error instanceof ArtefactAgentError ? error.kind : "unknown";
        if (kind !== "cancelled") {
            console.error("Artefact generation failed", { kind });
            send("error", { error: "Could not generate artefact." });
        }
    } finally {
        res.end();
    }
});

app.get("/api/artefacts/:id", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        'select id, is_shared as "isShared", prompt, title, content, created_at as "createdAt", updated_at as "updatedAt" from artefact where id = $1 and owner_id = $2',
        [req.params.id, user.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    const revisions = await pool.query(
        'select id, content, generated_content as "generatedContent", created_at as "createdAt" from artefact_revision where artefact_id = $1 order by created_at',
        [req.params.id],
    );
    res.json({ ...rows[0], revisions: revisions.rows });
});

app.post("/api/artefacts/:id/share", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        'update artefact set is_shared = true where id = $1 and owner_id = $2 returning id, is_shared as "isShared"',
        [req.params.id, user.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
});

app.get("/api/shared/artefacts/:id", async (req, res) => {
    const { rows } = await pool.query(
        'select id, is_shared as "isShared", prompt, title, content, created_at as "createdAt", updated_at as "updatedAt" from artefact where id = $1',
        [req.params.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    if (!rows[0].isShared) return res.status(403).json({ error: "not_shared" });
    const revisions = await pool.query(
        'select id, content, generated_content as "generatedContent", created_at as "createdAt" from artefact_revision where artefact_id = $1 order by created_at',
        [rows[0].id],
    );
    res.json({ ...rows[0], revisions: revisions.rows });
});

app.post("/api/artefacts/:id/revisions", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const content =
        typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ error: "content is required" });
    const owned = await pool.query(
        "select id, prompt, content from artefact where id = $1 and owner_id = $2",
        [req.params.id, user.id],
    );
    if (!owned.rows[0]) return res.sendStatus(404);
    let generated;
    try {
        generated = await generateArtefact(
            `Update the artefact below according to the requested change. Keep useful existing details unless the request replaces them.\n\nRequested change:\n${content}\n\nExisting artefact JSON:\n${JSON.stringify(owned.rows[0].content)}`,
            env.openAiApiKey,
            env.openAiModel,
        );
    } catch (error) {
        if (!(error instanceof ArtefactAgentError)) throw error;
        console.error("Artefact revision failed", { kind: error.kind, ...error.details });
        return res.status(502).json({ error: "Could not revise artefact." });
    }
    const revision = { id: randomUUID(), content, generatedContent: generated.content };
    await pool.query(
        "insert into artefact_revision (id, artefact_id, content, generated_content) values ($1, $2, $3, $4)",
        [revision.id, req.params.id, content, revision.generatedContent],
    );
    const updated = await pool.query(
        'update artefact set title = $2, content = $3, updated_at = current_timestamp where id = $1 returning title, content, updated_at as "updatedAt"',
        [req.params.id, String(generated.content.root.data.title), generated.content],
    );
    res.status(201).json({ revision, artefact: updated.rows[0] });
});

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World!");
});

app.get("/health", (_req: Request, res: Response) => {
    res.sendStatus(204);
});

app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
});
