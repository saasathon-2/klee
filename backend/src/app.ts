import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { env } from "./env.ts";
import { auth } from "./auth.ts";
import { pool } from "./db.ts";
import { githubActionsClaims, githubAppSlug, githubInstallation, githubInstallationRequest, githubRepositoryInstallation, validGitHubWebhook } from "./github.ts";

const app: Express = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));

// Better Auth handles its own body parsing; this must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.post("/api/integrations/github/webhook", express.raw({ type: "application/json" }), async (req, res) => {
	if (!Buffer.isBuffer(req.body) || !validGitHubWebhook(req.body, req.header("x-hub-signature-256"))) return res.sendStatus(401);
	const payload = JSON.parse(req.body.toString()) as { action?: string; installation?: { id?: number } };
	if (req.header("x-github-event") === "installation" && ["deleted", "suspend"].includes(payload.action ?? "")) {
		const { installation } = payload;
		if (installation?.id) await pool.query("delete from github_installation where installation_id = $1", [String(installation.id)]);
	}
	res.sendStatus(204);
});

app.use(express.json());

async function sessionUser(req: Request, res: Response) {
	const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
	if (!session?.user) {
		res.sendStatus(401);
		return;
	}
	return session.user;
}

app.get("/api/integrations/github/install", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const state = randomUUID();
	await pool.query("delete from github_installation_state where expires_at < current_timestamp");
	await pool.query("insert into github_installation_state (state, owner_id, expires_at) values ($1, $2, current_timestamp + interval '10 minutes')", [state, user.id]);
	res.redirect(`https://github.com/apps/${await githubAppSlug()}/installations/new?state=${state}`);
});

async function completeGitHubInstallation(req: Request, res: Response) {
	const user = await sessionUser(req, res); if (!user) return;
	const state = typeof req.query.state === "string" ? req.query.state : "";
	const installationId = typeof req.query.installation_id === "string" && /^\d+$/.test(req.query.installation_id) ? req.query.installation_id : "";
	const { rows } = await pool.query("delete from github_installation_state where state = $1 and owner_id = $2 and expires_at > current_timestamp returning state", [state, user.id]);
	if (!rows[0] || !installationId) return res.status(400).send("This GitHub installation link is invalid or expired.");
	const installation = await githubInstallation(installationId);
	const saved = await pool.query("insert into github_installation (installation_id, owner_id, account_login, account_type) values ($1, $2, $3, $4) on conflict (installation_id) do update set account_login = excluded.account_login, account_type = excluded.account_type, updated_at = current_timestamp where github_installation.owner_id = excluded.owner_id returning installation_id", [installationId, user.id, installation.account.login, installation.account.type]);
	if (!saved.rows[0]) return res.status(409).send("This GitHub installation is connected to another Orcastrate account.");
	res.redirect(`${env.corsOrigin}/profile?github=connected`);
}

app.get("/api/integrations/github/setup", completeGitHubInstallation);
app.get("/api/integrations/github/callback", completeGitHubInstallation);

app.get("/api/integrations/github", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const { rows } = await pool.query("select installation_id as \"installationId\", account_login as \"accountLogin\", account_type as \"accountType\" from github_installation where owner_id = $1 order by created_at", [user.id]);
	res.json(rows);
});

app.post("/api/integrations/github/actions/artefacts", async (req, res) => {
	const token = typeof req.body?.token === "string" ? req.body.token : "";
	const pullRequest = Number(req.body?.pullRequest);
	if (!token || !Number.isInteger(pullRequest) || pullRequest < 1) return res.status(400).json({ error: "A GitHub Actions token and pull request number are required." });
	const { repository } = await githubActionsClaims(token);
	if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) return res.status(400).json({ error: "Invalid repository." });
	const { id: installationId } = await githubRepositoryInstallation(repository);
	const installation = await pool.query("select owner_id from github_installation where installation_id = $1", [String(installationId)]);
	if (!installation.rows[0]) return res.sendStatus(403);
	const id = randomUUID();
	const createdAt = new Date().toISOString();
	const prompt = `CI placeholder artefact\nCreation ID: ${id}\nCreated at: ${createdAt}`;
	await pool.query("insert into artefact (id, owner_id, is_shared, prompt, title) values ($1, $2, true, $3, $4)", [id, installation.rows[0].owner_id, prompt, "CI artefact"]);
	const url = `${env.corsOrigin}/artefacts/shared/${id}`;
	await githubInstallationRequest(String(installationId), `/repos/${repository}/issues/${pullRequest}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: `Orcastrate created an artefact: ${url}` }) });
	res.status(201).json({ id, url, createdAt });
});

app.get("/api/artefacts", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const { rows } = await pool.query("select id, is_shared as \"isShared\", prompt, title, created_at as \"createdAt\", updated_at as \"updatedAt\" from artefact where owner_id = $1 order by updated_at desc", [user.id]);
	res.json(rows);
});

app.post("/api/artefacts", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
	if (!prompt) return res.status(400).json({ error: "prompt is required" });
	const artefact = { id: randomUUID(), isShared: false, prompt, title: "New artefact" };
	await pool.query("insert into artefact (id, owner_id, prompt, title) values ($1, $2, $3, $4)", [artefact.id, user.id, artefact.prompt, artefact.title]);
	res.status(201).json(artefact);
});

app.get("/api/artefacts/:id", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const { rows } = await pool.query("select id, is_shared as \"isShared\", prompt, title, created_at as \"createdAt\", updated_at as \"updatedAt\" from artefact where id = $1 and owner_id = $2", [req.params.id, user.id]);
	if (!rows[0]) return res.sendStatus(404);
	const revisions = await pool.query("select id, content, created_at as \"createdAt\" from artefact_revision where artefact_id = $1 order by created_at", [req.params.id]);
	res.json({ ...rows[0], revisions: revisions.rows });
});

app.post("/api/artefacts/:id/share", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const { rows } = await pool.query("update artefact set is_shared = true where id = $1 and owner_id = $2 returning id, is_shared as \"isShared\"", [req.params.id, user.id]);
	if (!rows[0]) return res.sendStatus(404);
	res.json(rows[0]);
});

app.get("/api/shared/artefacts/:id", async (req, res) => {
	const { rows } = await pool.query("select id, is_shared as \"isShared\", prompt, title, created_at as \"createdAt\", updated_at as \"updatedAt\" from artefact where id = $1", [req.params.id]);
	if (!rows[0]) return res.sendStatus(404);
	if (!rows[0].isShared) return res.status(403).json({ error: "not_shared" });
	const revisions = await pool.query("select id, content, created_at as \"createdAt\" from artefact_revision where artefact_id = $1 order by created_at", [rows[0].id]);
	res.json({ ...rows[0], revisions: revisions.rows });
});

app.post("/api/artefacts/:id/revisions", async (req, res) => {
	const user = await sessionUser(req, res); if (!user) return;
	const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
	if (!content) return res.status(400).json({ error: "content is required" });
	const owned = await pool.query("select id from artefact where id = $1 and owner_id = $2", [req.params.id, user.id]);
	if (!owned.rows[0]) return res.sendStatus(404);
	const revision = { id: randomUUID(), content };
	await pool.query("insert into artefact_revision (id, artefact_id, content) values ($1, $2, $3)", [revision.id, req.params.id, content]);
	await pool.query("update artefact set updated_at = current_timestamp where id = $1", [req.params.id]);
	res.status(201).json(revision);
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
