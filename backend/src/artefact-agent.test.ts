import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost/test";

const { agentInput, generateArtefact, jsonSchema, toDocument } = await import("./artefact-agent.ts");

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

const originalFetch = globalThis.fetch;
let requestBody: Record<string, unknown> | undefined;
const output = JSON.stringify({
	title: "PR review",
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

// Document blocks: cleaned up rather than trusted.
const blocksOf = (doc: ReturnType<typeof toDocument>) => doc.root.children?.[0]?.children ?? [];
const base = { title: "Risk", category: "generic-page" as const, eyebrow: "Safety", summary: "A review", tags: ["Risk"] };
const band = { label: "Minor", min: 1, max: 25, level: 1, tolerance: "Acceptable." };
const levels = (...values: number[]) => values.map((value) => ({ value, label: `L${value}` }));

const riskDocument = toDocument({
	...base,
	blocks: [
		{
			template: "risk-matrix",
			data: {
				title: "Matrix",
				description: "Where hazards sit",
				likelihoodLabel: "Likelihood",
				impactLabel: "Consequence",
				likelihoodLevels: levels(3, 1, 2, 2),
				impactLevels: levels(1, 2, 3, 5, 8),
				bands: [band],
				hazards: [
					{ id: "1", label: "On scale", likelihood: 2, impact: 8, residualLikelihood: 1, residualImpact: 3 },
					{ id: "2", label: "Off scale", likelihood: 4, impact: 8, residualLikelihood: null, residualImpact: null },
					{ id: "3", label: "Half residual", likelihood: 1, impact: 1, residualLikelihood: 1, residualImpact: null },
				],
			},
		},
		{
			template: "hierarchy-tree",
			data: {
				title: "Parts",
				description: "Breakdown",
				nodes: [
					{ id: "a", parentId: "b", label: "A", detail: null },
					{ id: "b", parentId: "a", label: "B", detail: null },
					{ id: "c", parentId: "missing", label: "C", detail: null },
				],
			},
		},
		{
			template: "source-figure",
			data: { title: "Schematic", caption: "Flyback", fileIndex: 1, page: 9, crop: null },
		},
		{
			template: "source-figure",
			data: { title: "Beyond the file", caption: "No page 30", fileIndex: 1, page: 30, crop: null },
		},
	],
}, { attachments: [{ id: "att-1", filename: "UC3843.pdf", pages: 24 }] });
const [matrix, tree, figure, ...rest] = blocksOf(riskDocument).filter((node) => node.template !== "glue");
const matrixData = matrix.data as { likelihoodLevels: { value: number }[]; hazards: { id: string; residualImpact: number | null }[] };
assert.deepEqual(matrixData.likelihoodLevels.map((level) => level.value), [1, 2, 3], "levels are unique and ascending");
assert.deepEqual(matrixData.hazards.map((hazard) => hazard.id), ["1", "3"], "off-scale hazards are dropped");
assert.equal(matrixData.hazards[1].residualImpact, null, "half a residual score is cleared");
const treeNodes = (tree.data as { nodes: { id: string; parentId: string | null }[] }).nodes;
assert.ok(treeNodes.some((node) => node.parentId === null && node.id !== "c"), "a cycle is broken");
assert.equal(treeNodes.find((node) => node.id === "c")?.parentId, null, "unknown parents become roots");
assert.deepEqual(figure.data, { title: "Schematic", caption: "Flyback", page: 9, crop: null, attachmentId: "att-1", filename: "UC3843.pdf" });
assert.equal(rest.length, 0, "figures beyond the file's pages are dropped");

const noFileDocument = toDocument({
	...base,
	blocks: [
		{ template: "prose", data: { title: "Summary", body: "Text." } },
		{ template: "source-figure", data: { title: "Figure", caption: "Made up", fileIndex: 2, page: 1, crop: null } },
	],
});
assert.deepEqual(blocksOf(noFileDocument).map((node) => node.template), ["prose"], "figures need an attached file");

const specDocument = toDocument({
	...base,
	blocks: [
		{
			template: "spec-table",
			data: {
				title: "Specs",
				description: "Reference",
				conditions: null,
				variants: ["UC184x", "UC384x"],
				sections: [{ name: "Reference", rows: [{ parameter: "Output voltage", conditions: null, unit: "V", values: [{ min: 4.95, typ: 5, max: 5.05, note: null }] }] }],
			},
		},
		{
			template: "curve-chart",
			data: {
				title: "Frequency",
				description: "Against timing resistance",
				xAxis: { label: "Frequency", unit: "Hz", scale: "log" },
				yAxis: { label: "RT", unit: "kΩ", scale: "linear" },
				series: [
					{ name: "CT = 1 nF", points: [{ x: 1000, y: 30 }, { x: 0, y: 20 }, { x: 100, y: 40 }] },
					{ name: "Only one point left", points: [{ x: -5, y: 1 }, { x: 10, y: 2 }] },
				],
				approximate: true,
				source: "Figure 1",
			},
		},
	],
});
const [spec, curve] = blocksOf(specDocument);
const specRow = (spec.data as { sections: { rows: { values: unknown[] }[] }[] }).sections[0].rows[0];
assert.equal(specRow.values.length, 2, "each row has one value per variant");
const curveSeries = (curve.data as { series: { points: { x: number }[] }[] }).series;
assert.equal(curveSeries.length, 1, "series with fewer than two usable points are dropped");
assert.deepEqual(curveSeries[0].points.map((point) => point.x), [100, 1000], "log axes drop non-positive values; points are sorted");

// Files go to the model as a user message: the PDFs, then a numbered list and the prompt.
assert.equal(agentInput("Just text", []), "Just text");
const fileInput = agentInput("Summarise it", [
	{ id: "att-1", filename: "UC3843.pdf", pages: 24, bytes: new TextEncoder().encode("%PDF-1.4") },
]) as { role: string; content: { type: string; filename?: string; file_data?: string; text?: string }[] }[];
assert.equal(fileInput[0].role, "user");
assert.equal(fileInput[0].content[0].type, "input_file");
assert.equal(fileInput[0].content[0].file_data, `data:application/pdf;base64,${Buffer.from("%PDF-1.4").toString("base64")}`);
assert.match(fileInput[0].content[1].text ?? "", /File 1: UC3843\.pdf \(24 pages\)[\s\S]*Summarise it/);
