import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { env } from "./env.ts";
import { auth } from "./auth.ts";
import { pool, transaction } from "./db.ts";
import { accessibleArtefactSql, refreshGitHubOrgs } from "./artefact-access.ts";
import {
    applyPatch,
    describeChanges,
    diffDocuments,
    documentAtVersion,
    isTextOnlyEdit,
    recordVersion,
    type PatchOp,
    type VersionSource,
} from "./artefact-versions.ts";
import { ArtefactAgentError, generateArtefact } from "./artefact-agent.ts";
import { captureArtefactSnapshot, snapshotUrl, validSnapshotToken } from "./artefact-snapshot.ts";
import { getArtefactPreview, putArtefactPreview } from "./r2.ts";
import {
    githubActionsClaims,
    githubArtefactComment,
    githubAppSlug,
    githubInstallation,
    removeGitHubInstallation,
    githubInstallationRequest,
    githubPullRequestFingerprint,
    githubPullRequestContext,
    githubPullRequestPrompt,
    githubRepositoryInstallation,
    validGitHubWebhook,
} from "./github.ts";

const app: Express = express();
const githubRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>();
const githubRefreshDelayMs = 30_000;
const previewFallback = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#fbf463"/><text x="96" y="278" fill="#1e1e1e" font-family="Arial, sans-serif" font-size="68" font-weight="700">Klee artefact</text><text x="96" y="350" fill="#4f503e" font-family="Arial, sans-serif" font-size="30">Preparing preview…</text>
</svg>`);

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
            repository?: { full_name?: string };
            check_run?: { pull_requests?: { number?: number }[] };
        };
        const event = req.header("x-github-event");
        if (
            event === "installation" &&
            ["deleted", "suspend"].includes(payload.action ?? "")
        ) {
            const { installation } = payload;
            if (installation?.id)
                await pool.query(
                    "delete from github_installation where installation_id = $1",
                    [String(installation.id)],
                );
        }
        if (event === "check_run" && payload.action === "completed" && payload.repository?.full_name && payload.installation?.id) {
            res.sendStatus(204);
            for (const { number } of payload.check_run?.pull_requests ?? []) {
                if (Number.isInteger(number) && number! > 0)
                    queueGitHubPullRequestRefresh(
                        String(payload.installation.id),
                        payload.repository.full_name,
                        number!,
                    );
            }
            return;
        }
        res.sendStatus(204);
    },
);

// Manual edits send the whole artefact document, which can exceed the 100kb default.
app.use(express.json({ limit: "1mb" }));

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
    options: { onProgress?: (message: string) => void; signal?: AbortSignal; serviceTier?: "fast" } = {},
    id?: string,
    history: { authorId: string | null; source: VersionSource; installationId?: string } = {
        authorId: ownerId,
        source: "generated",
    },
) {
    const startedAt = performance.now();
    const { content, sessionId, telemetry } = await generateArtefact(
        prompt,
        env.openAiApiKey,
        env.openAiModel,
        options,
    );
    const artefact = {
        id: id ?? randomUUID(),
        isShared,
        prompt,
        title: String(content.root.data.title),
        content,
        createdAt: new Date().toISOString(),
    };
    const values = [
        artefact.id,
        ownerId,
        artefact.isShared,
        artefact.prompt,
        artefact.title,
        artefact.content,
        sessionId,
        history.installationId ?? null,
    ];
    await transaction(async (client) => {
        const before = id
            ? (await client.query("select content from artefact where id = $1 for update", [id])).rows[0]?.content
            : undefined;
        if (id) await client.query(
            "update artefact set is_shared = $3, prompt = $4, title = $5, content = $6, agent_session_id = $7, github_installation_id = coalesce($8, github_installation_id), updated_at = current_timestamp where id = $1 and owner_id = $2",
            values,
        );
        else await client.query(
            "insert into artefact (id, owner_id, share_id, is_shared, prompt, title, content, agent_session_id, github_installation_id) values ($1, $2, $1, $3, $4, $5, $6, $7, $8)",
            values,
        );
        await recordVersion(client, {
            artefactId: artefact.id,
            before: before ?? undefined,
            after: artefact.content,
            authorId: history.authorId,
            source: history.source,
        });
    });
    console.info("artefact_generation", {
        ...telemetry,
        blocks: content.root.children?.[0]?.children?.length ?? 0,
        totalMs: Math.round(performance.now() - startedAt),
    });
    const previewReady = await uploadArtefactSnapshot(artefact.id, isShared);
    return { ...artefact, previewReady };
}

async function uploadArtefactSnapshot(artefactId: string, isShared: boolean) {
    return captureArtefactSnapshot(snapshotUrl(env.corsOrigin, artefactId, isShared))
        .then((snapshot) => putArtefactPreview(artefactId, snapshot))
        .catch((error) => {
            console.error("Artefact snapshot upload failed", error);
            return false;
        });
}

async function reserveGitHubPullRequestArtefact(
    installationId: string,
    repository: string,
    pullRequest: number,
    ownerId: string,
) {
    return transaction(async (client) => {
        await client.query("select pg_advisory_xact_lock(hashtext($1))", [
            `${repository}#${pullRequest}`,
        ]);
        const { rows } = await client.query(
            'select artefact_id as "artefactId" from github_pull_request_artefact where repository = $1 and pull_request = $2',
            [repository, pullRequest],
        );
        if (rows[0]) return { id: rows[0].artefactId as string, created: false };
        const artefactId = randomUUID();
        await client.query(
            "insert into artefact (id, owner_id, share_id, is_shared, prompt, title, github_installation_id) values ($1, $2, $1, true, $3, $4, $5)",
            [artefactId, ownerId, "GitHub PR artefact refresh in progress.", "Generating PR artefact", installationId],
        );
        await client.query(
            "insert into github_pull_request_artefact (repository, pull_request, installation_id, owner_id, artefact_id, comment_id) values ($1, $2, $3, $4, $5, null)",
            [repository, pullRequest, installationId, ownerId, artefactId],
        );
        return { id: artefactId, created: true };
    });
}

async function refreshGitHubPullRequestArtefact(
    installationId: string,
    repository: string,
    pullRequest: number,
    ownerId?: string,
    artefactId?: string,
) {
    const lock = await pool.connect();
    try {
        await lock.query("select pg_advisory_lock(hashtext($1))", [
            `${repository}#${pullRequest}`,
        ]);
        const { rows } = await pool.query(
            'select owner_id as "ownerId", artefact_id as "artefactId", comment_id as "commentId", context_hash as "contextHash" from github_pull_request_artefact where repository = $1 and pull_request = $2',
            [repository, pullRequest],
        );
        const current = rows[0];
        const owner = ownerId ?? current?.ownerId;
        if (!owner) return;
        const context = await githubPullRequestContext(installationId, repository, pullRequest);
        const contextHash = githubPullRequestFingerprint(context);
        if (current?.contextHash === contextHash) return;
        // Initial generation is immediate; subsequent updates wait for CI to settle.
        if (current?.contextHash && context.checks.some((check) => check.status !== "completed")) {
            queueGitHubPullRequestRefresh(installationId, repository, pullRequest);
            return;
        }
        const artefact = await createGeneratedArtefact(
            owner,
            githubPullRequestPrompt(repository, pullRequest, context),
            true,
            {},
            current?.artefactId ?? artefactId,
            { authorId: null, source: "github", installationId },
        );
        const url = `${env.corsOrigin}/artefacts/shared/${artefact.id}`;
        const previewUrl = `${env.corsOrigin}/api/shared/artefacts/${artefact.id}/preview?v=${Date.now()}`;
        let commentId = current?.commentId;
        if (commentId) {
            await githubInstallationRequest(
                installationId,
                `/repos/${repository}/issues/comments/${commentId}`,
                { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: githubArtefactComment(url, previewUrl) }) },
            );
        } else {
            const comment = await githubInstallationRequest(
                installationId,
                `/repos/${repository}/issues/${pullRequest}/comments`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: githubArtefactComment(url, previewUrl) }) },
            );
            commentId = String((await comment.json() as { id: number }).id);
        }
        await pool.query(
            "update github_pull_request_artefact set installation_id = $3, owner_id = $4, artefact_id = $5, comment_id = $6, context_hash = $7, updated_at = current_timestamp where repository = $1 and pull_request = $2",
            [
                repository,
                pullRequest,
                installationId,
                owner,
                artefact.id,
                commentId,
                contextHash,
            ],
        );
        return { artefact, url };
    } finally {
        await lock.query("select pg_advisory_unlock(hashtext($1))", [
            `${repository}#${pullRequest}`,
        ]);
        lock.release();
    }
}

/** Coalesces a burst of CI and Actions events before refreshing a PR artefact. */
function queueGitHubPullRequestRefresh(installationId: string, repository: string, pullRequest: number) {
    const key = `${repository}#${pullRequest}`;
    const existing = githubRefreshTimers.get(key);
    if (existing) clearTimeout(existing);
    githubRefreshTimers.set(key, setTimeout(() => {
        githubRefreshTimers.delete(key);
        void refreshGitHubPullRequestArtefact(installationId, repository, pullRequest)
            .catch((error) => console.error("GitHub PR artefact refresh failed", error));
    }, githubRefreshDelayMs));
}

/** Which social sign-in providers have credentials, so the UI only offers working ones. */
app.get("/api/auth-providers", (_req, res) => {
    res.json({
        google: Boolean(env.googleClientId && env.googleClientSecret),
        github: Boolean(env.githubClientId && env.githubClientSecret),
    });
});

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
                "This GitHub installation is connected to another Klee account.",
            );
    res.redirect(`${env.corsOrigin}/integrations?github=connected`);
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

app.delete("/api/integrations/github/:installationId", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const installationId = req.params.installationId;
    const { rows } = await pool.query(
        "select installation_id from github_installation where installation_id = $1 and owner_id = $2",
        [installationId, user.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    await removeGitHubInstallation(installationId);
    await pool.query(
        "delete from github_installation where installation_id = $1 and owner_id = $2",
        [installationId, user.id],
    );
    res.sendStatus(204);
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
    let repository: string;
    try {
        ({ repository } = await githubActionsClaims(token));
    } catch (error) {
        console.warn("Invalid GitHub Actions token", error);
        return res.status(401).json({ error: "Invalid GitHub Actions token." });
    }
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
        return res.status(400).json({ error: "Invalid repository." });
    try {
        const { id: installationId } =
            await githubRepositoryInstallation(repository);
        const installation = await pool.query(
            "select owner_id from github_installation where installation_id = $1",
            [String(installationId)],
        );
        if (!installation.rows[0])
            return res.status(403).json({ error: "GitHub App is not installed for this repository." });
        const reservation = await reserveGitHubPullRequestArtefact(
            String(installationId),
            repository,
            pullRequest,
            installation.rows[0].owner_id,
        );
        const url = `${env.corsOrigin}/artefacts/shared/${reservation.id}`;
        res.status(202).json({ id: reservation.id, url, createdAt: new Date().toISOString() });
        if (reservation.created)
            void refreshGitHubPullRequestArtefact(
                String(installationId),
                repository,
                pullRequest,
                installation.rows[0].owner_id,
                reservation.id,
            ).catch((error) => console.error("GitHub Action artefact refresh failed", error));
        else queueGitHubPullRequestRefresh(String(installationId), repository, pullRequest);
    } catch (error) {
        console.error("Failed to create GitHub Actions artefact", error);
        if (error instanceof Error && error.message === "GitHub API request failed (404)")
            return res.status(404).json({ error: "Repository is unavailable to the GitHub App." });
        return res.status(500).json({ error: "Failed to create artefact." });
    }
});

/** Refreshes cached GitHub org membership; a GitHub outage keeps the cached list. */
async function refreshAccess(userId: string) {
    await refreshGitHubOrgs(userId).catch((error) =>
        console.error("GitHub org refresh failed", error),
    );
}

const artefactColumns = (userParam: string) => `artefact.id, artefact.is_shared as "isShared", artefact.prompt, artefact.title,
    artefact.created_at as "createdAt", artefact.updated_at as "updatedAt",
    artefact.owner_id = ${userParam} as "isOwner", project.account_login as "project",
    artefact.github_installation_id as "installationId", folder_entry.folder_id as "folderId"`;

/** Joins the project (GitHub org) and the folder the user filed the artefact in. */
const artefactJoins = (userParam: string) => `left join github_installation project on project.installation_id = artefact.github_installation_id
        left join artefact_folder_entry folder_entry on folder_entry.artefact_id = artefact.id and folder_entry.user_id = ${userParam}`;

/** Loads an artefact the user may access, or undefined (answer 404 so existence isn't leaked). */
async function accessibleArtefact(artefactId: string, userId: string) {
    const { rows } = await pool.query(
        `select ${artefactColumns("$2")}, artefact.content,
            (select coalesce(max(version), 0) from artefact_version where artefact_id = artefact.id) as version
        from artefact
        ${artefactJoins("$2")}
        where artefact.id = $1 and ${accessibleArtefactSql("$2")}`,
        [artefactId, userId],
    );
    return rows[0];
}

async function artefactPatches(artefactId: string) {
    const { rows } = await pool.query(
        `select version.version, version.source, version.patch, version.created_at as "createdAt",
            author.id as "authorId", author.name as "authorName", author.image as "authorImage"
        from artefact_version version
        left join "user" author on author.id = version.author_id
        where version.artefact_id = $1
        order by version.version`,
        [artefactId],
    );
    return rows as {
        version: number;
        source: VersionSource;
        patch: PatchOp[];
        createdAt: string;
        authorId: string | null;
        authorName: string | null;
        authorImage: string | null;
    }[];
}

app.get("/api/artefacts", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    await refreshAccess(user.id);
    const { rows } = await pool.query(
        `select ${artefactColumns("$1")}
        from artefact
        ${artefactJoins("$1")}
        where ${accessibleArtefactSql("$1")}
        order by artefact.updated_at desc`,
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
            false,
            { serviceTier: env.openAiServiceTier },
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
            serviceTier: env.openAiServiceTier,
        });
        send("complete", { artefact });
    } catch (error) {
        const agentError = error instanceof ArtefactAgentError ? error : undefined;
        const kind = agentError?.kind ?? "unknown";
        if (kind !== "cancelled") {
            console.error("Artefact generation failed", {
                kind,
                ...agentError?.details,
            });
            send("error", { error: "Could not generate artefact." });
        }
    } finally {
        res.end();
    }
});

app.get("/api/artefacts/:id", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    await refreshAccess(user.id);
    const artefact = await accessibleArtefact(req.params.id, user.id);
    if (!artefact) return res.sendStatus(404);
    const revisions = await pool.query(
        'select id, content, generated_content as "generatedContent", created_at as "createdAt" from artefact_revision where artefact_id = $1 order by created_at',
        [req.params.id],
    );
    res.json({ ...artefact, revisions: revisions.rows });
});

app.post("/api/artefacts/:id/share", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        `update artefact set is_shared = true where id = $1 and ${accessibleArtefactSql("$2")} returning id, is_shared as "isShared"`,
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

/** Private data is available to the screenshot browser only via a short-lived signature. */
app.get("/api/artefacts/:id/snapshot", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : undefined;
    if (!validSnapshotToken(req.params.id, token)) return res.sendStatus(404);
    const { rows } = await pool.query(
        'select id, is_shared as "isShared", prompt, title, content, created_at as "createdAt", updated_at as "updatedAt" from artefact where id = $1',
        [req.params.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    const revisions = await pool.query(
        'select id, content, generated_content as "generatedContent", created_at as "createdAt" from artefact_revision where artefact_id = $1 order by created_at',
        [rows[0].id],
    );
    res.json({ ...rows[0], revisions: revisions.rows });
});

/** Gives GitHub a stable public image while R2 remains private. */
app.get("/api/shared/artefacts/:id/preview", async (req, res) => {
    const { rows } = await pool.query(
        "select id from artefact where id = $1 and is_shared = true",
        [req.params.id],
    );
    if (!rows[0]) return res.sendStatus(404);
    try {
        const preview = await getArtefactPreview(req.params.id);
        if (preview) {
            res.set({ "Content-Type": "image/png", "Cache-Control": "public, max-age=300" });
            return res.send(Buffer.from(preview));
        }
    } catch (error) {
        console.error("Artefact preview read failed", error);
    }
    res.set({ "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
    res.send(previewFallback);
});

app.post("/api/artefacts/:id/revisions", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const content =
        typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ error: "content is required" });
    const artefact = await accessibleArtefact(req.params.id, user.id);
    if (!artefact) return res.sendStatus(404);
    let generated;
    try {
        generated = await generateArtefact(
            `Update the artefact below according to the requested change. Keep useful existing details unless the request replaces them.\n\nRequested change:\n${content}\n\nExisting artefact JSON:\n${JSON.stringify(artefact.content)}`,
            env.openAiApiKey,
            env.openAiModel,
            { serviceTier: env.openAiServiceTier },
        );
    } catch (error) {
        if (!(error instanceof ArtefactAgentError)) throw error;
        console.error("Artefact revision failed", { kind: error.kind, ...error.details });
        return res.status(502).json({ error: "Could not revise artefact." });
    }
    const revision = { id: randomUUID(), content, generatedContent: generated.content };
    const updated = await transaction(async (client) => {
        const before = (await client.query("select content from artefact where id = $1 for update", [req.params.id])).rows[0]?.content;
        await client.query(
            "insert into artefact_revision (id, artefact_id, content, generated_content) values ($1, $2, $3, $4)",
            [revision.id, req.params.id, content, revision.generatedContent],
        );
        const { rows } = await client.query(
            'update artefact set title = $2, content = $3, updated_at = current_timestamp where id = $1 returning title, content, updated_at as "updatedAt"',
            [req.params.id, String(generated.content.root.data.title), generated.content],
        );
        const version = await recordVersion(client, {
            artefactId: req.params.id,
            before,
            after: generated.content,
            authorId: user.id,
            source: "revision",
        });
        return { ...rows[0], version };
    });
    await uploadArtefactSnapshot(req.params.id, Boolean(artefact.isShared));
    res.status(201).json({ revision, artefact: updated });
});

app.put("/api/artefacts/:id/content", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const content = req.body?.content;
    const baseVersion = Number(req.body?.baseVersion);
    if (typeof content !== "object" || content === null || !Number.isInteger(baseVersion))
        return res.status(400).json({ error: "content and baseVersion are required" });
    const artefact = await accessibleArtefact(req.params.id, user.id);
    if (!artefact) return res.sendStatus(404);
    const result = await transaction(async (client) => {
        const current = await client.query(
            `select content, (select coalesce(max(version), 0) from artefact_version where artefact_id = $1) as version
            from artefact where id = $1 for update`,
            [req.params.id],
        );
        const before = current.rows[0].content;
        if (Number(current.rows[0].version) !== baseVersion) return { status: 409 as const };
        if (!isTextOnlyEdit(diffDocuments(before, content), before)) return { status: 400 as const };
        const title = String(content.root?.children?.[0]?.data?.title ?? content.root?.data?.title ?? artefact.title);
        const { rows } = await client.query(
            'update artefact set title = $2, content = $3, updated_at = current_timestamp where id = $1 returning title, content, updated_at as "updatedAt"',
            [req.params.id, title, content],
        );
        const version = await recordVersion(client, {
            artefactId: req.params.id,
            before,
            after: content,
            authorId: user.id,
            source: "edit",
        });
        return { status: 200 as const, artefact: { ...rows[0], version } };
    });
    if (result.status === 409)
        return res.status(409).json({ error: "This artefact changed since you started editing." });
    if (result.status === 400)
        return res.status(400).json({ error: "Only text can be edited." });
    res.json({ artefact: result.artefact });
});

app.get("/api/artefacts/:id/versions", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    if (!(await accessibleArtefact(req.params.id, user.id))) return res.sendStatus(404);
    let document: unknown;
    const versions = (await artefactPatches(req.params.id)).map((row) => {
        const changes = row.version === 1 ? [] : describeChanges(row.patch, document);
        document = applyPatch(document, row.patch);
        return {
            version: row.version,
            source: row.source,
            createdAt: row.createdAt,
            author: row.authorId
                ? { id: row.authorId, name: row.authorName, image: row.authorImage }
                : null,
            changes,
        };
    });
    res.json(versions);
});

app.get("/api/artefacts/:id/versions/:version", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    if (!(await accessibleArtefact(req.params.id, user.id))) return res.sendStatus(404);
    const version = Number(req.params.version);
    const patches = await artefactPatches(req.params.id);
    if (!Number.isInteger(version) || version < 1 || version > patches.length)
        return res.sendStatus(404);
    res.json({ version, content: documentAtVersion(patches.map((row) => row.patch), version) });
});

const folderName = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, 80) : "";

app.get("/api/folders", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rows } = await pool.query(
        'select id, name from artefact_folder where owner_id = $1 order by lower(name)',
        [user.id],
    );
    res.json(rows);
});

app.post("/api/folders", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const name = folderName(req.body?.name);
    if (!name) return res.status(400).json({ error: "A folder name is required." });
    const { rows } = await pool.query(
        "insert into artefact_folder (id, owner_id, name) values ($1, $2, $3) returning id, name",
        [randomUUID(), user.id, name],
    );
    res.status(201).json(rows[0]);
});

app.patch("/api/folders/:id", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const name = folderName(req.body?.name);
    if (!name) return res.status(400).json({ error: "A folder name is required." });
    const { rows } = await pool.query(
        "update artefact_folder set name = $3, updated_at = current_timestamp where id = $1 and owner_id = $2 returning id, name",
        [req.params.id, user.id, name],
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
});

/** Deletes the folder only; its artefacts become unfiled. */
app.delete("/api/folders/:id", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const { rowCount } = await pool.query(
        "delete from artefact_folder where id = $1 and owner_id = $2",
        [req.params.id, user.id],
    );
    if (!rowCount) return res.sendStatus(404);
    res.sendStatus(204);
});

app.put("/api/artefacts/:id/folder", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const folderId = typeof req.body?.folderId === "string" ? req.body.folderId : null;
    if (!(await accessibleArtefact(req.params.id, user.id))) return res.sendStatus(404);
    if (!folderId) {
        await pool.query(
            "delete from artefact_folder_entry where user_id = $1 and artefact_id = $2",
            [user.id, req.params.id],
        );
        return res.json({ folderId: null });
    }
    const folder = await pool.query(
        "select 1 from artefact_folder where id = $1 and owner_id = $2",
        [folderId, user.id],
    );
    if (!folder.rows[0]) return res.status(404).json({ error: "Folder not found." });
    await pool.query(
        `insert into artefact_folder_entry (user_id, artefact_id, folder_id) values ($1, $2, $3)
        on conflict (user_id, artefact_id) do update set folder_id = excluded.folder_id`,
        [user.id, req.params.id, folderId],
    );
    res.json({ folderId });
});

app.get("/api/projects", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    await refreshAccess(user.id);
    const { rows } = await pool.query(
        `select installation_id as "installationId", account_login as "login" from github_installation
        where owner_id = $1 or lower(account_login) in (select lower(org_login) from github_user_org where user_id = $1)
        order by account_login`,
        [user.id],
    );
    res.json(rows);
});

app.patch("/api/artefacts/:id/project", async (req, res) => {
    const user = await sessionUser(req, res);
    if (!user) return;
    const installationId =
        typeof req.body?.installationId === "string" ? req.body.installationId : null;
    if (installationId) {
        const allowed = await pool.query(
            `select 1 from github_installation where installation_id = $1
            and (owner_id = $2 or lower(account_login) in (select lower(org_login) from github_user_org where user_id = $2))`,
            [installationId, user.id],
        );
        if (!allowed.rows[0]) return res.status(403).json({ error: "You are not a member of that project." });
    }
    const { rows } = await pool.query(
        `update artefact set github_installation_id = $3 where id = $1 and owner_id = $2
        returning github_installation_id as "installationId",
            (select account_login from github_installation where installation_id = $3) as "project"`,
        [req.params.id, user.id, installationId],
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
});

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World!");
});

app.get("/health", (_req: Request, res: Response) => {
    res.sendStatus(204);
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (
        req.path === "/api/integrations/github/actions/artefacts" &&
        error instanceof SyntaxError
    )
        return res.status(400).json({ error: "Invalid JSON body." });
    next(error);
});

app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
});
