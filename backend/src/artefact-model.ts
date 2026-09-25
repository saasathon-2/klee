export type ArtefactNode = {
	id: string;
	template: string;
	data: Record<string, unknown>;
	children?: ArtefactNode[];
};

export type ArtefactDocument = {
	version: 1;
	root: ArtefactNode;
};

const engineeringPrompt = /\b(pr|pull request|branch|repo|code|architecture|github|jira|sprint|ticket|deploy|api)\b/i;

function titleFromPrompt(prompt: string) {
	if (/\b(sprint|jira|ticket|task)\b/i.test(prompt)) return "Sprint focus";
	if (/\b(pr|pull request|branch|code|architecture|github)\b/i.test(prompt)) return "Change brief";
	return "Working brief";
}

/**
 * Produces the same contract a future structured-output model will return.
 * Keeping selection here means the renderer never needs to know where data came from.
 */
export function createArtefactDocument(prompt: string): ArtefactDocument {
	const title = titleFromPrompt(prompt);
	const developer = engineeringPrompt.test(prompt);
	const children: ArtefactNode[] = developer
		? [
			{
				id: "snapshot",
				template: "metric-row",
				data: {
					items: [
						{ label: "Scope", value: "Focused", detail: "One review path" },
						{ label: "Confidence", value: "High", detail: "Context is actionable" },
						{ label: "Status", value: "Ready", detail: "For team review" },
					],
				},
			},
			{
				id: "flow",
				template: "architecture-flow",
				data: {
					title: "How the change moves",
					description: "A compact view of the context, implementation, and expected outcome.",
					nodes: [
						{ label: "Context", detail: "Prompt and connected work" },
						{ label: "Change", detail: "Implementation under review" },
						{ label: "Outcome", detail: "A shareable decision" },
					],
				},
			},
			{
				id: "bridge",
				template: "glue",
				data: { label: "So here’s what deserves attention next" },
			},
			{
				id: "tasks",
				template: "task-list",
				data: {
					title: "Review plan",
					description: "A practical pass through the work, ordered by dependency.",
					tasks: [
						{ id: "context", key: "01", title: "Confirm the source context", detail: "Link the relevant PR, issue, or branch so every claim can be traced back to source.", meta: "5 min", status: "First" },
						{ id: "impact", key: "02", title: "Review behavior and dependencies", detail: "Check the affected surfaces, data flow, and downstream consumers before approving the change.", meta: "15 min", status: "Core review" },
						{ id: "share", key: "03", title: "Share the decision", detail: "Capture open questions and send the final brief to the people who need to act on it.", meta: "5 min", status: "Wrap up" },
					],
				},
			},
			{
				id: "next",
				template: "next-steps",
				data: {
					title: "Keep the work moving",
					actions: [
						{ label: "Create follow-up task", description: "Turn an open question into trackable work", action: "create-task" },
						{ label: "Explore the architecture", description: "Generate a deeper system diagram", action: "new-artefact" },
					],
				},
			},
		]
		: [
			{
				id: "summary",
				template: "prose",
				data: {
					title: "A useful starting point",
					body: "This brief turns the request into a clear shared frame. Add source material or ask a follow-up to make it more specific.",
				},
			},
			{
				id: "next",
				template: "next-steps",
				data: {
					title: "Make it more useful",
					actions: [
						{ label: "Add source context", description: "Connect a file, issue, or conversation", action: "add-context" },
						{ label: "Create a follow-up", description: "Ask for a more detailed version", action: "new-artefact" },
					],
				},
			},
		];

	return {
		version: 1,
		root: {
			id: "root",
			template: "artefact-page",
			data: { title },
			children: [
				{
					id: "category",
					template: developer ? "developer-page" : "generic-page",
					data: {
						eyebrow: developer ? "Developer artefact" : "Generated artefact",
						title,
						summary: prompt,
						tags: developer ? ["Engineering", "Decision brief", "Private"] : ["Brief", "Private"],
					},
					children,
				},
			],
		},
	};
}
