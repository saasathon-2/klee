import { createHmac, createPrivateKey, createPublicKey, createSign, createVerify, timingSafeEqual } from "node:crypto";
import { env } from "./env.ts";

const apiUrl = "https://api.github.com";
const oidcIssuer = "https://token.actions.githubusercontent.com";
let oidcKeys: { expiresAt: number; keys: JsonWebKey[] } | undefined;

function configured(name: "githubAppId" | "githubPrivateKey" | "githubWebhookSecret") {
	const value = env[name];
	if (!value) throw new Error(`Missing GitHub App configuration: ${name}`);
	return value;
}

function appJwt() {
	const now = Math.floor(Date.now() / 1000);
	const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
	const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iat: now - 60, exp: now + 540, iss: configured("githubAppId") })}`;
	const signer = createSign("RSA-SHA256");
	signer.update(payload);
	return `${payload}.${signer.sign(createPrivateKey(configured("githubPrivateKey").replace(/\\n/g, "\n")), "base64url")}`;
}

async function appRequest(path: string, init?: RequestInit) {
	const response = await fetch(`${apiUrl}${path}`, {
		...init,
		headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${appJwt()}`, "X-GitHub-Api-Version": "2026-03-10", ...init?.headers },
	});
	if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
	return response;
}

export async function githubAppSlug() {
	return ((await appRequest("/app")).json() as Promise<{ slug: string }>).then(({ slug }) => slug);
}

export async function githubInstallation(id: string) {
	return (await appRequest(`/app/installations/${id}`)).json() as Promise<{ account: { login: string; type: string } }>;
}

export async function githubRepositoryInstallation(repository: string) {
	return (await appRequest(`/repos/${repository}/installation`)).json() as Promise<{ id: number }>;
}

export async function githubInstallationRequest(installationId: string, path: string, init?: RequestInit) {
	const { token } = await (await appRequest(`/app/installations/${installationId}/access_tokens`, { method: "POST" })).json() as { token: string };
	const response = await fetch(`${apiUrl}${path}`, {
		...init,
		headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2026-03-10", ...init?.headers },
	});
	if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
	return response;
}

export function validActionsClaims(claims: Record<string, unknown>) {
	const now = Math.floor(Date.now() / 1000);
	const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
	return claims.iss === oidcIssuer && audience.includes(env.betterAuthUrl) && typeof claims.repository === "string" && claims.event_name === "pull_request" && typeof claims.exp === "number" && claims.exp > now && (typeof claims.nbf !== "number" || claims.nbf <= now);
}

export async function githubActionsClaims(token: string) {
	const [encodedHeader, encodedClaims, encodedSignature, ...extra] = token.split(".");
	if (!encodedHeader || !encodedClaims || !encodedSignature || extra.length) throw new Error("Invalid GitHub Actions token");
	const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString()) as { alg?: string; kid?: string };
	const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString()) as Record<string, unknown>;
	if (header.alg !== "RS256" || !header.kid || !validActionsClaims(claims)) throw new Error("Invalid GitHub Actions token");
	if (!oidcKeys || oidcKeys.expiresAt < Date.now()) {
		const response = await fetch(`${oidcIssuer}/.well-known/jwks`).catch((error) => {
			console.error("GitHub Actions signing-key fetch failed", error);
			throw error;
		});
		if (!response.ok) throw new Error("Could not load GitHub Actions signing keys");
		oidcKeys = { expiresAt: Date.now() + 60 * 60 * 1000, keys: ((await response.json()) as { keys: JsonWebKey[] }).keys };
	}
	const key = oidcKeys.keys.find((candidate) => (candidate as JsonWebKey & { kid?: string }).kid === header.kid);
	if (!key) throw new Error("Unknown GitHub Actions signing key");
	const verifier = createVerify("RSA-SHA256");
	verifier.update(`${encodedHeader}.${encodedClaims}`);
	if (!verifier.verify(createPublicKey({ key, format: "jwk" }), Buffer.from(encodedSignature, "base64url"))) throw new Error("Invalid GitHub Actions token");
	return claims as { repository: string };
}

export function validGitHubWebhook(raw: Buffer, signature?: string) {
	if (!signature?.startsWith("sha256=")) return false;
	const expected = Buffer.from(`sha256=${createHmac("sha256", configured("githubWebhookSecret")).update(raw).digest("hex")}`);
	const received = Buffer.from(signature);
	return expected.length === received.length && timingSafeEqual(expected, received);
}
