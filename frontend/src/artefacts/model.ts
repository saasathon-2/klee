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
	verdict: "approved" | "changes-requested" | "commented";
	body: string;
};
export type Commit = {
	sha: string;
	message: string;
	author: string;
	detail: string;
};
export type Check = {
	name: string;
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
		| "architecture-flow"
		| "glue"
		| "task-list"
		| "next-steps"
		| "prose"
		| "code-diff"
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
