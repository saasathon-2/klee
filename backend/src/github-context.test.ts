import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET ??= "test";

const { githubAccountContext, githubAccountContextPrompt, githubContextStatus, githubIdentityStatus, githubLinks, githubPromptContext } = await import("./github-context.ts");

function dependencies(scope = "repo read:org", accessToken: string | null = "stored-token") {
	const calls: string[] = [];
	const fetch = (async (url: string) => {
		const path = new URL(url).pathname;
		calls.push(`${path}${new URL(url).search}`);
		if (path === "/user") return new Response(JSON.stringify({ login: "octo" }));
		if (path === "/user/repos") return new Response(JSON.stringify([
			{ full_name: "acme/api", description: "The API", html_url: "https://github.com/acme/api", language: "TypeScript" },
		]));
		if (path === "/search/issues") return new Response(JSON.stringify({ items: [
			new URL(url).searchParams.get("q")?.includes("type:issue")
				? { title: "Improve account context", state: "open", html_url: "https://github.com/acme/api/issues/9", repository: { full_name: "acme/api" } }
				: { title: "Add account context", state: "open", html_url: "https://github.com/acme/api/pull/8", repository: { full_name: "acme/api" } },
		] }));
		if (path === "/repos/acme/api/commits") return new Response(JSON.stringify([
			{ html_url: "https://github.com/acme/api/commit/a", commit: { message: "Connect GitHub", author: { date: "2026-09-28T00:00:00Z" } } },
		]));
		if (path === "/repos/acme/api/pulls/8") return new Response(JSON.stringify({
			title: "Add account context", state: "open", additions: 4, deletions: 1,
			body: "Adds direct GitHub context.", html_url: "https://github.com/acme/api/pull/8",
		}));
		return new Response("{}", { status: 404 });
	}) as typeof globalThis.fetch;
	return {
		calls,
		deps: {
			query: async () => ({ rows: [{ id: "account-1", scope, accessToken }] }),
			accessToken: async () => "token",
			fetch,
		},
	};
}

test("uses the existing GitHub OAuth account for bounded artefact context", async () => {
	const { deps, calls } = dependencies();
	const context = await githubAccountContext("user-1", deps);
	assert.deepEqual(context?.repositories, [{ name: "acme/api", description: "The API", url: "https://github.com/acme/api", language: "TypeScript" }]);
	assert.deepEqual(context?.pullRequests.map((pullRequest) => pullRequest.title), ["Add account context"]);
	assert.deepEqual(context?.issues.map((issue) => issue.title), ["Improve account context"]);
	assert.deepEqual(context?.commits.map((commit) => commit.message), ["Connect GitHub"]);
	assert.ok(calls.some((path) => path.startsWith("/search/issues?")));
	assert.match(githubAccountContextPrompt(context), /untrusted source material/);
	assert.match(githubAccountContextPrompt(context), /https:\/\/github.com\/acme\/api\/pull\/8/);
});

test("uses pasted GitHub resource links directly and leaves unrelated prompts alone", async () => {
	const direct = dependencies();
	const prompt = await githubPromptContext("user-1", "Summarise https://github.com/acme/api/pull/8", direct.deps);
	assert.match(prompt, /Pull request: acme\/api#8/);
	assert.ok(direct.calls.some((path) => path.startsWith("/repos/acme/api/pulls/8")));
	assert.equal(direct.calls.some((path) => path.startsWith("/user/repos")), false);
	assert.deepEqual(githubLinks("https://github.com/acme/api/tree/feature/context"), [{
		kind: "branch", repository: "acme/api", value: "feature/context", url: "https://github.com/acme/api/tree/feature/context",
	}]);
	const unrelated = dependencies();
	assert.equal(await githubPromptContext("user-1", "Write a release update from this text.", unrelated.deps), "");
	assert.deepEqual(unrelated.calls, []);
	const mentionedOnly = dependencies();
	assert.equal(await githubPromptContext("user-1", "Write a GitHub-themed release update.", mentionedOnly.deps), "");
	assert.deepEqual(mentionedOnly.calls, []);
	const supplied = dependencies();
	assert.equal(await githubPromptContext("user-1", "PR data:\nTitle: Ship context\nChanges: Add a source", supplied.deps), "");
	assert.deepEqual(supplied.calls, []);
	const recent = dependencies();
	assert.match(await githubPromptContext("user-1", "Show my recent issues", recent.deps), /Improve account context/);
	assert.match(await githubPromptContext("user-1", "Recent repositories", dependencies().deps), /Recently updated repositories/);
});

test("requires explicit private-repository consent", async () => {
	const { deps } = dependencies("read:org");
	assert.deepEqual(await githubContextStatus("user-1", deps), { connected: false });
	assert.equal(await githubAccountContext("user-1", deps), undefined);
	assert.deepEqual(await githubIdentityStatus("user-1", deps), { connected: true });
	const disconnected = dependencies("read:org", null);
	assert.deepEqual(await githubIdentityStatus("user-1", disconnected.deps), { connected: false });
});
