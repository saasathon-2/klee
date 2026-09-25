import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET ??= "test";
process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

const { githubArtefactComment, githubPullRequestPrompt, validActionsClaims, validGitHubWebhook } = await import("./github.ts");
const body = Buffer.from('{"action":"created"}');
const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
assert.equal(validGitHubWebhook(body, signature), true);
assert.equal(validGitHubWebhook(body, "sha256=wrong"), false);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "http://localhost:3000", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "http://localhost:3000", repository: "acme/repo", event_name: "workflow_run", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "wrong", aud: "http://localhost:3000", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), false);
const artefactUrl = "https://klee.work/artefacts/shared/example";
assert.match(
	githubArtefactComment(artefactUrl),
	new RegExp(`^<a href="${artefactUrl}" target="_blank"><img src="https://image\\.thum\\.io/get/width/1200/crop/900/noanimate/${artefactUrl}\\?_cb=\\d+" alt="klee artefact"></a>$`),
);
const prompt = githubPullRequestPrompt("acme/repo", 12, {
	title: "Add context",
	body: "Generate a focused review.",
	url: "https://github.com/acme/repo/pull/12",
	author: "octo",
	base: "main",
	head: "feature/context",
	additions: 4,
	deletions: 1,
	files: [{ filename: "src/context.ts", url: "https://github.com/acme/repo/blob/feature/context/src/context.ts", status: "added", additions: 4, deletions: 0, patch: "+export const context = true;" }],
	feedback: [{ author: "reviewer", state: "approved", body: "Ship it", path: "" }],
	commits: [{ sha: "123456789", author: "author", message: "Add context" }],
	checks: [{ name: "Unit tests", url: "https://github.com/acme/repo/actions/runs/1", status: "completed", conclusion: "success" }],
});
assert.match(prompt, /Title: Add context/);
assert.match(prompt, /added: src\/context\.ts/);
assert.match(prompt, /https:\/\/github\.com\/acme\/repo\/actions\/runs\/1/);
assert.match(prompt, /Reviewer feedback:/);
assert.match(prompt, /CI checks:/);
const largePrompt = githubPullRequestPrompt("acme/repo", 13, {
	title: "Large change",
	body: "",
	url: "",
	author: "",
	base: "main",
	head: "feature/large",
	additions: 9,
	deletions: 1,
	files: Array.from({ length: 9 }, (_, index) => ({ filename: `src/${index}.ts`, url: "", status: "modified", additions: 1, deletions: 0, patch: "secret diff" })),
	feedback: [],
	commits: [],
	checks: [],
});
assert.match(largePrompt, /Prioritize architecture-flow/);
assert.doesNotMatch(largePrompt, /secret diff/);
