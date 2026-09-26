import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET ??= "test";
process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

const { githubArtefactComment, githubPullRequestFingerprint, githubPullRequestPrompt, isGitHubBot, validActionsClaims, validGitHubWebhook } = await import("./github.ts");
const body = Buffer.from('{"action":"created"}');
const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
assert.equal(validGitHubWebhook(body, signature), true);
assert.equal(validGitHubWebhook(body, "sha256=wrong"), false);
assert.equal(isGitHubBot({ login: "orca-klee[bot]" }), true);
assert.equal(isGitHubBot({ login: "reviewer", type: "User" }), false);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "klee-github-actions", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "klee-github-actions", repository: "acme/repo", event_name: "pull_request_target", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "klee-github-actions", repository: "acme/repo", event_name: "workflow_run", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "http://localhost:3000", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "wrong", aud: "klee-github-actions", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), false);
const artefactUrl = "https://klee.work/artefacts/shared/example";
const previewUrl = "https://klee.work/api/shared/artefacts/example/preview?v=1";
assert.equal(githubArtefactComment(artefactUrl, previewUrl), `<a href="${artefactUrl}" target="_blank"><img src="${previewUrl}" alt="Klee artefact"></a>`);
const prompt = githubPullRequestPrompt("acme/repo", 12, {
	headSha: "abcdef",
	title: "Add context",
	body: "Generate a focused review.",
	url: "https://github.com/acme/repo/pull/12",
	author: "octo",
	base: "main",
	head: "feature/context",
	additions: 4,
	deletions: 1,
	files: [{ filename: "src/context.ts", url: "https://github.com/acme/repo/blob/feature/context/src/context.ts", status: "added", additions: 4, deletions: 0, patch: "+export const context = true;" }],
	feedback: [{ author: "reviewer", avatarUrl: "https://github.com/reviewer.png", url: "https://github.com/acme/repo/pull/12#pullrequestreview-1", state: "approved", body: "Ship it", path: "" }],
	commits: [{ sha: "123456789", author: "author", avatarUrl: "https://github.com/author.png", url: "https://github.com/acme/repo/commit/123456789", message: "Add context" }],
	checks: [{ name: "Unit tests", url: "https://github.com/acme/repo/actions/runs/1", status: "completed", conclusion: "success" }],
});
assert.match(prompt, /Title: Add context/);
assert.match(prompt, /added: src\/context\.ts/);
assert.match(prompt, /https:\/\/github\.com\/acme\/repo\/actions\/runs\/1/);
assert.match(prompt, /Reviewer feedback:/);
assert.match(prompt, /CI checks:/);
const minorContext = {
	headSha: "abcdef",
	title: "Minor wording",
	body: "Edited description",
	url: "",
	author: "",
	base: "main",
	head: "feature",
	additions: 1,
	deletions: 0,
	files: [],
	feedback: [],
	commits: [],
	checks: [],
};
assert.equal(
	githubPullRequestFingerprint(minorContext),
	githubPullRequestFingerprint({ ...minorContext, title: "Different wording", body: "Also edited" }),
);
assert.notEqual(githubPullRequestFingerprint(minorContext), githubPullRequestFingerprint({
	headSha: "123456",
	title: "Minor wording",
	body: "Edited description",
	url: "",
	author: "",
	base: "main",
	head: "feature",
	additions: 1,
	deletions: 0,
	files: [],
	feedback: [],
	commits: [],
	checks: [],
}));
const largePrompt = githubPullRequestPrompt("acme/repo", 13, {
	headSha: "abcdef",
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
