import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost/test";

const { jsonSchema, toDocument } = await import("./artefact-agent.ts");

function schemaFormats(value: unknown): string[] {
	if (!value || typeof value !== "object") return [];
	const record = value as Record<string, unknown>;
	return [
		...(typeof record.format === "string" ? [record.format] : []),
		...Object.values(record).flatMap(schemaFormats),
	];
}

assert.deepEqual(schemaFormats(jsonSchema), []);
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

const richDocument = toDocument({
	title: "Release brief",
	category: "generic-page",
	eyebrow: "Update",
	summary: "A release overview",
	tags: ["Release"],
	blocks: [
		{ template: "prose", data: { title: "What changed", body: "The release is ready." } },
		{ template: "metric-row", data: { items: [
			{ label: "Coverage", value: "High", detail: "Core paths are included." },
			{ label: "Risk", value: "Low", detail: "Changes are isolated." },
		] } },
		{ template: "next-steps", data: { title: "Next", actions: [
			{ label: "Share", description: "Send the release brief.", action: "share" },
		] } },
	],
});
assert.equal(
	richDocument.root.children?.[0]?.children?.filter((node) => node.template === "glue").length,
	1,
);
