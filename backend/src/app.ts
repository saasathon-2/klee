import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { env } from "./env.ts";
import { auth } from "./auth.ts";
import { pool } from "./db.ts";

const app: Express = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));

// Better Auth handles its own body parsing; this must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

async function sessionUser(req: Request, res: Response) {
	const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
	if (!session?.user) {
		res.sendStatus(401);
		return;
	}
	return session.user;
}

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
