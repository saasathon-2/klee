import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost/test";

const { generateArtefact, jsonSchema, toDocument } = await import("./artefact-agent.ts");

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
	icon: "git-pull-request",
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
	icon: "rocket",
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
			{ label: "Share", description: "Send the release brief.", action: "share", url: null },
		] } },
	],
});
assert.equal(
	richDocument.root.children?.[0]?.children?.filter((node) => node.template === "glue").length,
	1,
);

// Structured outputs cap strict schemas at 5,000 properties and 10 levels of nesting.
function schemaStats(value: unknown, depth = 0): { properties: number; depth: number } {
	if (!value || typeof value !== "object") return { properties: 0, depth };
	const record = value as Record<string, unknown>;
	const own = record.properties && typeof record.properties === "object"
		? Object.keys(record.properties).length
		: 0;
	const nested = record.type === "object" ? depth + 1 : depth;
	return Object.values(record)
		.map((child) => schemaStats(child, nested))
		.reduce(
			(total, child) => ({ properties: total.properties + child.properties, depth: Math.max(total.depth, child.depth) }),
			{ properties: own, depth: nested },
		);
}
const stats = schemaStats(jsonSchema);
assert.ok(stats.properties <= 5000, `schema has ${stats.properties} properties`);
assert.ok(stats.depth <= 10, `schema nests ${stats.depth} levels`);

const blocksOf = (blocks: unknown[], category: "developer-page" | "generic-page" = "developer-page") =>
	toDocument({
		title: "Delivery brief",
		icon: "calendar-check",
		category,
		eyebrow: "Delivery",
		summary: "A delivery brief",
		tags: ["Delivery"],
		blocks: blocks as never,
	}).root.children?.[0]?.children ?? [];

const commit = (sha: string, parents: string[]) => ({
	sha,
	message: `Commit ${sha}`,
	author: "sam",
	date: "2026-09-20",
	parents,
	branchIds: ["main"],
	url: null,
});
const graph = (commits: unknown[]) => ({
	template: "git-graph",
	data: {
		title: "History",
		description: "Branch history",
		branches: [{ id: "main", name: "main", url: null }],
		commits,
	},
});
assert.equal(blocksOf([graph([commit("b", ["a"]), commit("a", [])])])[0]?.template, "git-graph");
const flattened = blocksOf([graph([commit("b", ["x"]), commit("a", ["y"])])])[0];
assert.equal(flattened?.template, "commit-list");
assert.equal((flattened?.data.commits as { detail: string }[])[0]?.detail, "2026-09-20");
assert.throws(() => blocksOf([graph([{ ...commit("b", ["a"]), branchIds: ["release"] }, commit("a", [])])]));

const table = blocksOf([
	{
		template: "evidence-table",
		data: {
			title: "Evidence",
			description: "Linked records",
			columns: ["Record", "Source", "State"],
			rows: [{ cells: ["INC-12", "Pager", "Open", "extra"], url: null }, { cells: ["PR #4"], url: null }],
		},
	},
])[0];
assert.deepEqual(
	(table?.data.rows as { cells: string[] }[]).map((row) => row.cells.length),
	[3, 3],
);

const impactNode = (id: string) => ({ id, label: id, detail: `${id} service`, change: "modified", owner: null, url: null });
assert.throws(() =>
	blocksOf([
		{
			template: "change-impact-map",
			data: {
				title: "Impact",
				description: "Affected systems",
				nodes: [impactNode("api"), impactNode("db")],
				edges: [{ source: "api", target: "cache", label: null }],
			},
		},
	]),
);
assert.throws(() =>
	blocksOf([
		{
			template: "sprint-timeline",
			data: { title: "Sprint", start: "2026-10-10", end: "2026-10-01", today: null, milestones: [], items: [] },
		},
	]),
);
assert.equal(
	blocksOf([{ template: "delivery-progress", data: { title: "Progress", unit: null, completed: 0, inProgress: 0, blocked: 0, notStarted: 0, forecast: null, scopeChange: null, summary: "Nothing yet." } }, { template: "prose", data: { title: "Note", body: "Kept." } }]).length,
	1,
);
assert.equal(
	blocksOf([{ template: "handoff-brief", data: { title: "Handoff", from: "Ana", to: null, status: "on-track", completed: [], active: [], risks: [], nextActions: [{ title: "Ship", detail: null, owner: null, url: null }] } }], "generic-page")[0]?.template,
	"handoff-brief",
);
assert.throws(() =>
	blocksOf([{ template: "work-item-board", data: { title: "Board", description: "Work", columns: [] } }], "generic-page"),
);

const trend = {
	template: "activity-trend",
	data: {
		title: "Deploys",
		description: "Daily deploys",
		unit: "deploys",
		chart: "bar",
		series: [{ label: "Deploys", points: [{ at: "2026-09-25", value: 3 }, { at: "2026-09-26", value: 5 }] }],
		annotation: null,
	},
};
const checks = (items: unknown[]) => ({ template: "check-list", data: { title: "Checks", checks: items } });
const passed = { name: "Unit tests", url: null, status: "passed", detail: "412 tests" };
const row = blocksOf([{ template: "two-column", children: [trend, checks([passed])] }])[0];
assert.equal(row?.template, "two-column");
assert.deepEqual(row?.children?.map((child) => [child.id, child.template]), [
	["block-1-1", "activity-trend"],
	["block-1-2", "check-list"],
]);
// A side that comes back empty leaves its partner as an ordinary block.
assert.deepEqual(
	blocksOf([{ template: "two-column", children: [trend, checks([])] }]).map((node) => node.template),
	["activity-trend"],
);
assert.equal(
	blocksOf([{ template: "two-column", children: [trend, trend] }], "generic-page")[0]?.template,
	"two-column",
);
assert.throws(() =>
	blocksOf([{ template: "two-column", children: [trend, checks([passed])] }], "generic-page"),
);

const originalFetch = globalThis.fetch;
let requestBody: Record<string, unknown> | undefined;
const output = JSON.stringify({
	title: "PR review",
	icon: "git-pull-request",
	category: "developer-page",
	eyebrow: "GitHub",
	summary: "A review",
	tags: ["PR"],
	blocks: [{ template: "prose", data: { title: "Summary", body: "Relevant change." } }],
});
globalThis.fetch = async (_input, init) => {
	requestBody = JSON.parse(String(init?.body));
	return new Response(
		[
			{ type: "response.created", response: { id: "resp_test" } },
			{ type: "response.reasoning_summary_text.done", text: "I’m outlining the key changes." },
			{ type: "response.output_text.delta", delta: output },
			{ type: "response.completed" },
		].map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
		{ headers: { "Content-Type": "text/event-stream" } },
	);
};
try {
	const commentary: string[] = [];
	await generateArtefact("Review this pull request", "test-key", "test-model", {
		onCommentary: (text) => commentary.push(text),
	});
	assert.equal(commentary.join(""), "I’m outlining the key changes.");
	assert.deepEqual(requestBody?.reasoning, { effort: "low", summary: "concise" });
} finally {
	globalThis.fetch = originalFetch;
}
