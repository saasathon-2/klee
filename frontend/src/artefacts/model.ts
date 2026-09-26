export type Metric = { label: string; value: string; detail: string };
export type FlowNode = { label: string; detail: string };
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

export type ArtefactNode = {
	id: string;
	template:
		| "artefact-page"
		| "developer-page"
		| "generic-page"
		| "metric-row"
		| "code-diff"
		| "architecture-flow"
		| "glue"
		| "task-list"
		| "next-steps"
		| "prose"
		| "review-comments"
		| "commit-list"
		| "check-list";
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
