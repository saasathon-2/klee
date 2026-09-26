import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET ??= "test";

const { artefactPermissionSql, can, canAccessArtefact, orgRefreshMs, refreshGitHubOrgs } = await import("./artefact-access.ts");

test("owners and org members can access an artefact", () => {
	const artefact = { ownerId: "owner", projectLogin: "Acme" };
	assert.equal(canAccessArtefact(artefact, "owner", []), true);
	assert.equal(canAccessArtefact(artefact, "member", ["acme"]), true, "logins match case-insensitively");
	assert.equal(canAccessArtefact(artefact, "outsider", ["other-org"]), false);
	assert.equal(canAccessArtefact({ ownerId: "owner", projectLogin: null }, "member", ["acme"]), false);
});

test("organisation grants only allow their configured permission level", () => {
	assert.equal(can("view", "view"), true);
	assert.equal(can("view", "comment"), false);
	assert.equal(can("comment", "comment"), true);
	assert.equal(can("comment", "edit"), false);
	assert.equal(can("edit", "edit"), true);
	assert.equal(can(undefined, "view"), false);
	assert.match(artefactPermissionSql("$1"), /artefact_organisation_permission/);
});

/** A fake database that answers the refresh queries and records writes. */
function fakeDatabase({ token, refreshedAt }: { token?: string; refreshedAt?: Date }) {
	const writes: { text: string; values?: unknown[] }[] = [];
	const query = async (text: string, values?: unknown[]) => {
		if (text.includes("from account")) return { rows: token ? [{ accessToken: token }] : [] };
		if (text.includes("min(refreshed_at)")) return { rows: [{ refreshedAt: refreshedAt ?? null }] };
		writes.push({ text, values });
		return { rows: [] };
	};
	return {
		writes,
		deps: {
			query,
			transaction: async <T>(work: (client: { query: typeof query }) => Promise<T>) =>
				work({ query }),
			now: () => new Date("2026-09-26T00:00:00Z"),
		},
	};
}

function fakeGitHub(responses: Record<string, { status: number; body?: unknown }>) {
	const calls: string[] = [];
	const doFetch = (async (url: string) => {
		const path = url.replace("https://api.github.com", "").replace(/\?.*$/, "");
		calls.push(path);
		const response = responses[path] ?? { status: 404 };
		return new Response(JSON.stringify(response.body ?? {}), { status: response.status });
	}) as typeof fetch;
	return { calls, doFetch };
}

test("stores the user's own login and orgs when the cache is stale", async () => {
	const db = fakeDatabase({ token: "gho_token" });
	const github = fakeGitHub({
		"/user": { status: 200, body: { login: "octo" } },
		"/user/orgs": { status: 200, body: [{ login: "acme" }, { login: "widgets" }] },
	});
	await refreshGitHubOrgs("user-1", { ...db.deps, fetch: github.doFetch });
	const inserted = db.writes.filter((write) => write.text.startsWith("insert")).map((write) => write.values?.[1]);
	assert.deepEqual(inserted, ["octo", "acme", "widgets"]);
});

test("skips GitHub while the cached list is fresh", async () => {
	const db = fakeDatabase({ token: "gho_token", refreshedAt: new Date(Date.parse("2026-09-26T00:00:00Z") - orgRefreshMs / 2) });
	const github = fakeGitHub({});
	await refreshGitHubOrgs("user-1", { ...db.deps, fetch: github.doFetch });
	assert.deepEqual(github.calls, []);
	assert.deepEqual(db.writes, []);
});

test("clears org access when there is no GitHub token", async () => {
	const db = fakeDatabase({});
	await refreshGitHubOrgs("user-1", { ...db.deps, fetch: fakeGitHub({}).doFetch });
	assert.equal(db.writes.length, 1);
	assert.match(db.writes[0].text, /^delete from github_user_org/);
});

test("clears org access when GitHub rejects the token", async () => {
	const db = fakeDatabase({ token: "revoked" });
	const github = fakeGitHub({ "/user": { status: 401 } });
	await refreshGitHubOrgs("user-1", { ...db.deps, fetch: github.doFetch });
	assert.equal(db.writes.length, 1);
	assert.match(db.writes[0].text, /^delete from github_user_org/);
});

test("keeps the cached list when GitHub is temporarily unavailable", async () => {
	const db = fakeDatabase({ token: "gho_token" });
	const github = fakeGitHub({ "/user": { status: 503 } });
	await refreshGitHubOrgs("user-1", { ...db.deps, fetch: github.doFetch });
	assert.deepEqual(db.writes, []);
});
