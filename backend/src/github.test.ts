import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET ??= "test";
process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

const { githubArtefactComment, validActionsClaims, validGitHubWebhook } = await import("./github.ts");
const body = Buffer.from('{"action":"created"}');
const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
assert.equal(validGitHubWebhook(body, signature), true);
assert.equal(validGitHubWebhook(body, "sha256=wrong"), false);
assert.equal(validActionsClaims({ iss: "https://token.actions.githubusercontent.com", aud: "http://localhost:3000", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), true);
assert.equal(validActionsClaims({ iss: "wrong", aud: "http://localhost:3000", repository: "acme/repo", event_name: "pull_request", exp: Math.floor(Date.now() / 1000) + 60 }), false);
const artefactUrl = "https://www.orcastrate.net/artefacts/shared/example";
assert.match(
	githubArtefactComment(artefactUrl),
	new RegExp(`^<a href="${artefactUrl}" target="_blank"><img src="https://image\\.thum\\.io/get/width/1200/crop/900/noanimate/${artefactUrl}\\?_cb=\\d+" alt="klee artefact"></a>$`),
);
