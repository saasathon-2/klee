import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost/test";

const { toDocument } = await import("./artefact-agent.ts");
const document = toDocument({
	title: "PR review",
	category: "developer-page",
	eyebrow: "GitHub",
	summary: "A review",
	tags: ["PR"],
	blocks: [
		{ template: "prose", data: { title: "Summary", body: "Relevant change." } },
		{ template: "check-list", data: { title: "Checks", checks: [] } },
	],
});
assert.equal(document.root.children?.[0]?.children?.length, 1);
