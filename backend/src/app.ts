import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.ts";
import { auth } from "./auth.ts";

const app: Express = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));

// Better Auth handles its own body parsing; this must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
	res.send("Hello World!");
});

app.get("/health", (_req: Request, res: Response) => {
	res.sendStatus(204);
});

app.listen(env.port, () => {
	console.log(`API listening on port ${env.port}`);
});
