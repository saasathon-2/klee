import assert from "node:assert/strict";
import test from "node:test";
import { checkRunLinks, liveCheckStatuses, toLiveStatus } from "./live-status.ts";

const now = new Date("2026-09-27T10:00:00Z");

test("finds check run and Actions job links anywhere in the document", () => {
	const links = checkRunLinks({
		root: {
			children: [
				{ data: { checks: [{ url: "https://github.com/acme/api/runs/101" }, { url: "https://github.com/acme/api/runs/101" }] } },
				{ data: { gates: [{ url: "https://github.com/acme/api/actions/runs/9/job/202?pr=4" }] } },
				{ data: { url: "https://github.com/acme/api/pull/4" } },
				{ data: { url: "https://evil.example/acme/api/runs/5" } },
			],
		},
	});
	assert.deepEqual(
		links.map((link) => [link.owner, link.repo, link.checkRunId]),
		[["acme", "api", "101"], ["acme", "api", "202"]],
	);
});

test("maps GitHub check run states onto check statuses", () => {
	assert.equal(toLiveStatus({ status: "in_progress" }, now).status, "pending");
	assert.equal(toLiveStatus({ status: "queued" }, now).detail, "Queued");
	assert.equal(toLiveStatus({ status: "completed", conclusion: "success" }, now).status, "passed");
	assert.equal(toLiveStatus({ status: "completed", conclusion: "skipped" }, now).status, "passed");
	assert.equal(toLiveStatus({ status: "completed", conclusion: "timed_out" }, now).detail, "Completed (timed out)");
});

test("only looks up runs in the owner's installations", async () => {
	const paths: string[] = [];
	const statuses = await liveCheckStatuses(
		{
			checks: [
				{ url: "https://github.com/Acme/web/runs/1" },
				{ url: "https://github.com/someone-else/secret/runs/2" },
			],
		},
		{
			installations: [{ installationId: "11", accountLogin: "acme" }],
			request: async (installationId, path) => {
				paths.push(`${installationId}${path}`);
				return Response.json({ status: "completed", conclusion: "failure" });
			},
			now: () => now,
		},
	);
	assert.deepEqual(paths, ["11/repos/Acme/web/check-runs/1"]);
	assert.deepEqual(Object.keys(statuses), ["https://github.com/Acme/web/runs/1"]);
	assert.equal(statuses["https://github.com/Acme/web/runs/1"].status, "failed");
});
