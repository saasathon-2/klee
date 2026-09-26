export type Metric = { label: string; value: string; detail: string };
export type FlowNode = { label: string; detail: string };
export type SoftwareDiagramNode = {
	id: string;
	label: string;
	detail: string;
};
export type SoftwareDiagramEdge = {
	source: string;
	target: string;
	label?: string | null;
};
export type ArtefactTask = {
	id: string;
	key: string;
	title: string;
	detail: string;
	meta: string;
	status: string;
};
export type SuggestedAction = {
	label: string;
	description: string;
	action: string;
};
export type DiffLine = {
	kind: "context" | "add" | "remove";
	content: string;
};
export type DiffHunk = {
	header: string;
	oldStart: number;
	newStart: number;
	lines: DiffLine[];
};
export type ReviewComment = {
	author: string;
	avatarUrl?: string;
	url?: string;
	verdict: "approved" | "changes-requested" | "commented";
	body: string;
};
export type Commit = {
	sha: string;
	message: string;
	author: string;
	avatarUrl?: string;
	url?: string;
	detail: string;
};
export type Check = {
	name: string;
	url?: string | null;
	status: "passed" | "failed" | "pending";
	detail: string;
};

/** One step of a risk axis, e.g. { value: 4, label: "Likely" }. */
export type RiskLevel = { value: number; label: string };
/** Scores from `min` to `max` inclusive; `level` 1 (lowest) to 5 picks the colour. */
export type RiskBand = {
	label: string;
	min: number;
	max: number;
	level: number;
	tolerance: string;
};
export type RiskHazard = {
	id: string;
	label: string;
	likelihood: number;
	impact: number;
	residualLikelihood: number | null;
	residualImpact: number | null;
};
export type RegisterHazard = {
	id: string;
	hazard: string;
	likelihood: number;
	impact: number;
	controls: string;
	owner: string | null;
	residualLikelihood: number | null;
	residualImpact: number | null;
};
export type TreeNode = {
	id: string;
	parentId: string | null;
	label: string;
	detail: string | null;
};
export type SignOffResponse = "yes" | "no" | "pending";
export type SpecValue = {
	min: number | null;
	typ: number | null;
	max: number | null;
	note: string | null;
};
export type SpecRow = {
	parameter: string;
	conditions: string | null;
	unit: string | null;
	values: SpecValue[];
};
export type Pin = {
	number: number;
	name: string;
	description: string;
	side: "left" | "bottom" | "right" | "top";
};
export type PinPackage = { name: string; pins: Pin[] };
export type ChartAxis = {
	label: string;
	unit: string | null;
	scale: "linear" | "log";
};
export type ChartSeries = { name: string; points: { x: number; y: number }[] };
/** Region of a page as fractions of its width and height, from the top left. */
export type FigureCrop = { x: number; y: number; width: number; height: number };

export type ArtefactNode = {
	id: string;
	template:
		| "artefact-page"
		| "developer-page"
		| "generic-page"
		| "metric-row"
		| "code-diff"
		| "architecture-flow"
		| "software-diagram"
		| "glue"
		| "task-list"
		| "next-steps"
		| "prose"
		| "review-comments"
		| "commit-list"
		| "check-list"
		| "risk-matrix"
		| "hazard-register"
		| "hierarchy-tree"
		| "sign-off-grid"
		| "spec-table"
		| "pinout"
		| "curve-chart"
		| "comparison-table"
		| "source-figure";
	data: Record<string, unknown>;
	children?: ArtefactNode[];
};

export type ArtefactDocument = {
	version: 1;
	root: ArtefactNode;
};

export function fallbackDocument(prompt: string, title: string): ArtefactDocument {
	return {
		version: 1,
		root: {
			id: "root",
			template: "artefact-page",
			data: { title },
			children: [
				{
					id: "category",
					template: "generic-page",
					data: {
						eyebrow: "Generated artefact",
						title,
						summary: prompt,
						tags: ["Brief", "Private"],
					},
					children: [
						{
							id: "summary",
							template: "prose",
							data: {
								title: "A useful starting point",
								body: "This brief turns the request into a clear shared frame. Add source material or ask a follow-up to make it more specific.",
							},
						},
					],
				},
			],
		},
	};
}

/** Returns a copy of `document` with one text field of one node's data replaced. */
export function withEditedText(
	document: ArtefactDocument,
	nodeId: string,
	path: (string | number)[],
	value: string,
): ArtefactDocument {
	const update = (node: ArtefactNode): ArtefactNode => {
		if (node.id === nodeId) {
			const data = structuredClone(node.data);
			const parent = path
				.slice(0, -1)
				.reduce<Record<string | number, unknown>>(
					(current, key) => current[key] as Record<string | number, unknown>,
					data,
				);
			parent[path[path.length - 1]] = value;
			return { ...node, data };
		}
		return node.children
			? { ...node, children: node.children.map(update) }
			: node;
	};
	return { ...document, root: update(document.root) };
}
