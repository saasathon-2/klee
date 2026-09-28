import { z } from "zod";
import { readFileSync } from "node:fs";
import type { ArtefactDocument, ArtefactNode } from "./artefact-model.ts";
import type { GenerationIntent } from "./artefact-recipes.ts";

const shortText = z.string().trim().min(1).max(120);
const detailText = z.string().trim().min(1).max(280);

const metricSchema = z
	.object({
		label: shortText,
		value: shortText,
		detail: shortText,
	})
	.strict();
const flowNodeSchema = z
	.object({ label: shortText, detail: shortText })
	.strict();
const softwareDiagramKindSchema = z.enum([
	"client",
	"service",
	"database",
	"cache",
	"queue",
	"external",
]);
const softwareDiagramNodeSchema = z
	.object({
		id: shortText,
		label: shortText,
		kind: softwareDiagramKindSchema,
		detail: detailText,
		url: z.string().nullable(),
	})
	.strict();
const softwareDiagramEdgeSchema = z
	.object({
		source: shortText,
		target: shortText,
		label: z.string().trim().max(120).nullable(),
		url: z.string().nullable(),
	})
	.strict();
const taskSchema = z
	.object({
		id: shortText,
		key: shortText,
		title: shortText,
		detail: detailText,
		meta: shortText,
		status: shortText,
	})
	.strict();
const actionSchema = z
	.object({
		label: shortText,
		description: shortText,
		action: shortText,
		url: z.string().nullable(),
	})
	.strict();
const artefactIconSchema = z.enum([
	"git-pull-request",
	"git-branch",
	"workflow",
	"message-square",
	"calendar-check",
	"rocket",
	"chart-no-axes-combined",
	"lightbulb",
	"list-todo",
	"file-text",
]);

const diffHunkSchema = z
	.object({
		header: z.string(),
		oldStart: z.number().int(),
		newStart: z.number().int(),
		lines: z.array(
			z
				.object({
					kind: z.enum(["context", "add", "remove"]),
					content: z.string(),
				})
				.strict(),
		),
	})
	.strict();
const reviewCommentSchema = z
	.object({
		author: z.string(),
		avatarUrl: z.string().nullable(),
		url: z.string().nullable(),
		verdict: z.enum(["approved", "changes-requested", "commented"]),
		body: z.string(),
	})
	.strict();
const commitSchema = z
	.object({
		sha: z.string(),
		message: z.string(),
		author: z.string(),
		avatarUrl: z.string().nullable(),
		url: z.string().nullable(),
		detail: z.string(),
	})
	.strict();
const checkSchema = z
	.object({
		name: z.string(),
		url: z.string().nullable(),
		status: z.enum(["passed", "failed", "pending"]),
		detail: z.string(),
	})
	.strict();

/*
 * Delivery and operations records. Every shape is source-agnostic: the
 * integration layer (or the user's pasted prompt) supplies normalised records
 * such as { title, status, dates, owner, url }, never Jira- or GitHub-shaped
 * payloads. Dates are ISO 8601 strings; a missing optional value is null.
 */
const isoDate = z.string().trim().min(1).max(40);
const link = z.string().nullable();
const optionalText = shortText.nullable();
const workStatus = z.enum(["planned", "active", "blocked", "done"]);
const level = z.enum(["high", "medium", "low"]);
const count = z.number().int().min(0);
const linkedItemSchema = z
	.object({ title: shortText, detail: optionalText, owner: optionalText, url: link })
	.strict();

const sprintItemSchema = z
	.object({
		id: shortText,
		title: shortText,
		status: workStatus,
		start: isoDate.nullable(),
		end: isoDate.nullable(),
		estimate: optionalText,
		url: link,
	})
	.strict();
const boardItemSchema = z
	.object({
		key: shortText,
		title: shortText,
		owner: optionalText,
		priority: z.enum(["urgent", "high", "medium", "low"]).nullable(),
		meta: optionalText,
		url: link,
	})
	.strict();
const graphCommitSchema = z
	.object({
		sha: shortText,
		message: shortText,
		author: shortText,
		date: isoDate,
		parents: z.array(shortText).max(4),
		branchIds: z.array(shortText).min(1).max(4),
		url: link,
	})
	.strict();
const impactNodeSchema = z
	.object({
		id: shortText,
		label: shortText,
		kind: softwareDiagramKindSchema,
		detail: detailText,
		change: z.enum(["added", "modified", "at-risk", "unchanged"]),
		owner: optionalText,
		url: link,
	})
	.strict();
const flowchartStepSchema = z
	.object({
		id: shortText,
		label: shortText,
		kind: z.enum(["start", "end", "step", "decision"]),
		detail: optionalText,
		url: link,
	})
	.strict();
const dependencyNodeSchema = z
	.object({
		id: shortText,
		label: shortText,
		kind: z.enum(["package", "module", "service", "database", "external"]),
		detail: detailText,
		version: optionalText,
		health: z.enum(["current", "outdated", "vulnerable"]).nullable(),
		url: link,
	})
	.strict();
const releaseEventSchema = z
	.object({
		time: isoDate,
		label: shortText,
		kind: z.enum(["build", "deploy", "gate", "rollout", "rollback", "note"]),
		environment: optionalText,
		status: z.enum(["succeeded", "failed", "in-progress", "pending", "skipped"]),
		detail: z.string().trim().max(280),
		url: link,
	})
	.strict();
const incidentEventSchema = z
	.object({
		time: isoDate,
		type: z.enum(["alert", "deploy", "log", "update", "mitigation", "resolution"]),
		severity: z.enum(["critical", "major", "minor", "info"]),
		status: z.enum(["confirmed", "suspected"]).nullable(),
		summary: detailText,
		evidence: detailText.nullable(),
		url: link,
	})
	.strict();
const riskSchema = z
	.object({
		title: shortText,
		type: z.enum(["dependency", "assumption", "risk"]),
		impact: level,
		likelihood: level,
		owner: optionalText,
		mitigation: detailText,
		status: z.enum(["open", "mitigating", "accepted", "closed"]),
		url: link,
	})
	.strict();
const serviceSchema = z
	.object({
		name: shortText,
		owner: optionalText,
		repository: z.string().trim().max(280).nullable(),
		runbook: link,
		onCall: optionalText,
		environment: optionalText,
		health: z.enum(["healthy", "degraded", "down", "unknown"]).nullable(),
		url: link,
	})
	.strict();
const trendSeriesSchema = z
	.object({
		label: shortText,
		points: z
			.array(z.object({ at: isoDate, value: z.number() }).strict())
			.min(2)
			.max(60),
	})
	.strict();

const blockSchemas = [
	z
		.object({
			template: z.literal("prose"),
			data: z.object({ title: shortText, body: detailText }).strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("metric-row"),
			data: z
				.object({ items: z.array(metricSchema).min(2).max(3) })
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("architecture-flow"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					nodes: z.array(flowNodeSchema).min(2).max(3),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("software-diagram"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					nodes: z.array(softwareDiagramNodeSchema).min(2).max(10),
					edges: z.array(softwareDiagramEdgeSchema).min(1).max(16),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("glue"),
			data: z.object({ label: shortText }).strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("task-list"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					tasks: z.array(taskSchema).min(1).max(3),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("next-steps"),
			data: z
				.object({
					title: shortText,
					actions: z.array(actionSchema).min(1).max(3),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("code-diff"),
			data: z
				.object({
					title: z.string(),
					description: z.string(),
					file: z.string(),
					url: z.string().nullable(),
					hunks: z.array(diffHunkSchema),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("review-comments"),
			data: z
				.object({
					title: z.string(),
					summary: z.string(),
					comments: z.array(reviewCommentSchema),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("commit-list"),
			data: z
				.object({
					title: z.string(),
					description: z.string(),
					commits: z.array(commitSchema),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("check-list"),
			data: z
				.object({ title: z.string(), checks: z.array(checkSchema) })
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("sprint-timeline"),
			data: z
				.object({
					title: shortText,
					start: isoDate,
					end: isoDate,
					today: isoDate.nullable(),
					milestones: z
						.array(z.object({ label: shortText, date: isoDate }).strict())
						.max(6),
					items: z.array(sprintItemSchema).min(1).max(12),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("delivery-progress"),
			data: z
				.object({
					title: shortText,
					unit: optionalText,
					completed: count,
					inProgress: count,
					blocked: count,
					notStarted: count,
					forecast: isoDate.nullable(),
					scopeChange: z
						.object({ added: count, removed: count, detail: detailText })
						.strict()
						.nullable(),
					summary: detailText,
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("work-item-board"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					columns: z
						.array(
							z
								.object({
									id: workStatus,
									label: shortText,
									total: count.nullable(),
									items: z.array(boardItemSchema).max(8),
								})
								.strict(),
						)
						.min(3)
						.max(4),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("git-graph"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					branches: z
						.array(z.object({ id: shortText, name: shortText, url: link }).strict())
						.min(1)
						.max(6),
					commits: z.array(graphCommitSchema).min(2).max(24),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("flowchart"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					steps: z.array(flowchartStepSchema).min(3).max(14),
					edges: z.array(softwareDiagramEdgeSchema).min(2).max(20),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("dependency-graph"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					nodes: z.array(dependencyNodeSchema).min(2).max(14),
					edges: z.array(softwareDiagramEdgeSchema).min(1).max(24),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("change-impact-map"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					nodes: z.array(impactNodeSchema).min(2).max(12),
					edges: z.array(softwareDiagramEdgeSchema).min(1).max(20),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("release-timeline"),
			data: z
				.object({
					title: shortText,
					release: optionalText,
					currentStage: optionalText,
					nextGate: optionalText,
					events: z.array(releaseEventSchema).min(1).max(16),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("incident-timeline"),
			data: z
				.object({
					title: shortText,
					startedAt: isoDate,
					resolvedAt: isoDate.nullable(),
					impact: detailText,
					events: z.array(incidentEventSchema).min(1).max(20),
					rootCause: z
						.object({ summary: detailText, status: z.enum(["confirmed", "suspected"]) })
						.strict()
						.nullable(),
					followUps: z.array(linkedItemSchema).max(8),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("delivery-readiness"),
			data: z
				.object({
					title: shortText,
					subject: shortText,
					summary: detailText,
					gates: z
						.array(
							z
								.object({
									name: shortText,
									status: z.enum(["passed", "failed", "pending"]),
									detail: shortText,
									url: link,
								})
								.strict(),
						)
						.min(1)
						.max(12),
					signals: z
						.array(
							z
								.object({
									label: shortText,
									detail: shortText,
									tone: z.enum(["positive", "caution"]),
								})
								.strict(),
						)
						.max(6),
					blockers: z.array(linkedItemSchema).max(6),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("dependency-risk-register"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					items: z.array(riskSchema).min(1).max(12),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("service-ownership"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					services: z.array(serviceSchema).min(1).max(12),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("decision-record"),
			data: z
				.object({
					title: shortText,
					question: detailText,
					decision: detailText,
					status: z.enum(["proposed", "accepted", "rejected", "superseded"]),
					options: z
						.array(
							z
								.object({
									label: shortText,
									pros: z.array(shortText).max(4),
									cons: z.array(shortText).max(4),
									selected: z.boolean(),
								})
								.strict(),
						)
						.min(2)
						.max(4),
					rationale: detailText,
					consequences: z.array(detailText).max(5),
					reviewDate: isoDate.nullable(),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("evidence-table"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					columns: z.array(shortText).min(2).max(6),
					rows: z
						.array(
							z
								.object({ cells: z.array(z.string().trim().max(280)).min(1).max(6), url: link })
								.strict(),
						)
						.min(1)
						.max(20),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("activity-trend"),
			data: z
				.object({
					title: shortText,
					description: shortText,
					unit: shortText,
					chart: z.enum(["line", "bar"]),
					series: z.array(trendSeriesSchema).min(1).max(4),
					annotation: z.object({ at: isoDate, label: shortText }).strict().nullable(),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("handoff-brief"),
			data: z
				.object({
					title: shortText,
					from: shortText,
					to: optionalText,
					status: z.enum(["on-track", "at-risk", "blocked"]),
					completed: z.array(linkedItemSchema).max(6),
					active: z.array(linkedItemSchema).max(6),
					risks: z.array(linkedItemSchema).max(6),
					nextActions: z.array(linkedItemSchema).min(1).max(6),
				})
				.strict(),
		})
		.strict(),
	z
		.object({
			template: z.literal("note-evidence"),
			data: z
				.object({
					items: z
						.array(
							z
								.object({
									sourceId: z.string().trim().min(1).max(200),
									change: z.string().trim().min(1).max(120),
									justification: z.string().trim().min(1).max(280),
								})
								.strict(),
						)
						.min(1)
						.max(5),
				})
				.strict(),
		})
		.strict(),
] as const;

/** Blocks compact enough to share a row, e.g. a trend chart beside a table. */
const columnTemplates = new Set<string>([
	"prose",
	"activity-trend",
	"evidence-table",
	"check-list",
	"commit-list",
	"task-list",
	"delivery-progress",
	"delivery-readiness",
	"service-ownership",
]);
const columnBlockSchemas = blockSchemas.filter((schema) =>
	columnTemplates.has(schema.shape.template.value),
) as unknown as [
	(typeof blockSchemas)[number],
	(typeof blockSchemas)[number],
	...(typeof blockSchemas)[number][],
];
const twoColumnSchema = z
	.object({
		template: z.literal("two-column"),
		children: z.array(z.union(columnBlockSchemas)).length(2),
	})
	.strict();

const generationSchema = z
	.object({
		title: z.string().trim().min(1).max(80),
		icon: artefactIconSchema,
		category: z.enum(["developer-page", "generic-page"]),
		eyebrow: z.string().trim().min(1).max(48),
		summary: z.string().trim().min(1).max(280),
		tags: z.array(z.string().trim().min(1).max(32)).min(1).max(4),
		blocks: z.array(z.union([...blockSchemas, twoColumnSchema])).min(1),
	})
	.strict();

export const jsonSchema = generationSchema.toJSONSchema({ target: "draft-7" });
delete jsonSchema.$schema;

const instructions = readFileSync(
	new URL("./artefact-agent-instructions.md", import.meta.url),
	"utf8",
).trim();

export class ArtefactAgentError extends Error {
	readonly kind: string;
	readonly details: {
		status?: number;
		code?: string;
		type?: string;
		param?: string;
		message?: string;
		requestId?: string;
		eventType?: string;
	};
	constructor(
		kind: string,
		details: {
			status?: number;
			code?: string;
			type?: string;
			param?: string;
			message?: string;
			requestId?: string;
			eventType?: string;
		} = {},
	) {
		super(kind);
		this.kind = kind;
		this.details = details;
	}
}

type Generation = z.infer<typeof generationSchema>;

type Block = Generation["blocks"][number];
type ContentBlock = Exclude<Block, { template: "two-column" }>;

/**
 * Repairs recoverable shapes before validation: a git graph without any
 * in-slice parent relationships becomes a commit list, and evidence rows are
 * padded or trimmed to their column count.
 */
function normaliseBlock(block: ContentBlock): ContentBlock {
	if (block.template === "git-graph") {
		const shas = new Set(block.data.commits.map((commit) => commit.sha));
		const linked = block.data.commits.some((commit) =>
			commit.parents.some((parent) => shas.has(parent)),
		);
		if (linked) return block;
		return {
			template: "commit-list",
			data: {
				title: block.data.title,
				description: block.data.description,
				commits: block.data.commits.map((commit) => ({
					sha: commit.sha,
					message: commit.message,
					author: commit.author,
					avatarUrl: null,
					url: commit.url,
					detail: commit.date,
				})),
			},
		};
	}
	if (block.template === "evidence-table") {
		const width = block.data.columns.length;
		return {
			...block,
			data: {
				...block.data,
				rows: block.data.rows.map((row) => ({
					...row,
					cells: Array.from({ length: width }, (_, index) => row.cells[index] ?? ""),
				})),
			},
		};
	}
	return block;
}

export function toDocument(generation: Generation, intent?: GenerationIntent): ArtefactDocument {
	if (generation.blocks.length === 0 || generation.tags.length === 0) {
		throw new Error("The generated artefact is incomplete");
	}
	const allowed =
		generation.category === "developer-page"
			? new Set([
					"prose",
					"metric-row",
					"architecture-flow",
					"software-diagram",
					"flowchart",
					"dependency-graph",
					"glue",
					"task-list",
					"next-steps",
					"code-diff",
					"review-comments",
					"commit-list",
					"check-list",
					"sprint-timeline",
					"delivery-progress",
					"work-item-board",
					"git-graph",
					"change-impact-map",
					"release-timeline",
					"incident-timeline",
					"delivery-readiness",
					"dependency-risk-register",
					"service-ownership",
					"decision-record",
					"evidence-table",
					"activity-trend",
					"handoff-brief",
					"note-evidence",
					"two-column",
				])
			: new Set([
					"prose",
					"flowchart",
					"metric-row",
					"glue",
					"next-steps",
					"decision-record",
					"evidence-table",
					"activity-trend",
					"handoff-brief",
					"two-column",
				]);
	const templates = generation.blocks.flatMap((block) =>
		block.template === "two-column"
			? [block.template, ...block.children.map((child) => child.template)]
			: [block.template],
	);
	if (templates.some((template) => !allowed.has(template))) {
		throw new Error("The generated artefact contains an unsupported block");
	}
	const keep = (block: ContentBlock) => {
		if (block.template === "task-list") return block.data.tasks.length > 0;
		if (block.template === "next-steps")
			return block.data.actions.length > 0;
		if (block.template === "code-diff")
			return block.data.hunks.some((hunk) => hunk.lines.length > 0);
		if (block.template === "review-comments")
			return block.data.comments.length > 0;
		if (block.template === "commit-list")
			return block.data.commits.length > 0;
		if (block.template === "check-list")
			return block.data.checks.length > 0;
		if (block.template === "work-item-board")
			return block.data.columns.some((column) => column.items.length > 0);
		if (block.template === "delivery-progress")
			return block.data.completed + block.data.inProgress + block.data.blocked + block.data.notStarted > 0;
		return true;
	};
	// A two-column row that loses a side to an empty block falls back to the
	// remaining block on its own.
	const blocks = generation.blocks.flatMap((block): Block[] => {
		if (block.template !== "two-column") {
			const normalised = normaliseBlock(block);
			return keep(normalised) ? [normalised] : [];
		}
		const children = block.children.map(normaliseBlock).filter(keep);
		return children.length === 2 ? [{ ...block, children }] : children;
	});
	if (blocks.length === 0)
		throw new Error("The generated artefact is incomplete");
	const contentBlocks = blocks.flatMap((block) =>
		block.template === "two-column" ? block.children : [block],
	);
	for (const block of contentBlocks) {
		if (block.template === "metric-row" && block.data.items.length < 2)
			throw new Error("Metric rows need at least two items");
		if (
			block.template === "architecture-flow" &&
			block.data.nodes.length < 2
		)
			throw new Error("Architecture flows need at least two nodes");
		if (block.template === "software-diagram") {
			const ids = new Set(block.data.nodes.map((node) => node.id));
			if (ids.size !== block.data.nodes.length)
				throw new Error("Software diagram node IDs must be unique");
			if (block.data.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target))
				throw new Error("Software diagram edges must reference existing nodes");
		}
		if (block.template === "change-impact-map" || block.template === "dependency-graph") {
			const ids = new Set(block.data.nodes.map((node) => node.id));
			if (ids.size !== block.data.nodes.length)
				throw new Error("Diagram node IDs must be unique");
			if (block.data.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target))
				throw new Error("Diagram edges must reference existing nodes");
		}
		if (block.template === "flowchart") {
			const ids = new Set(block.data.steps.map((step) => step.id));
			if (ids.size !== block.data.steps.length)
				throw new Error("Flowchart step IDs must be unique");
			if (block.data.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target))
				throw new Error("Flowchart edges must reference existing steps");
		}
		if (block.template === "git-graph") {
			const branches = new Set(block.data.branches.map((branch) => branch.id));
			if (block.data.commits.some((commit) => !commit.branchIds.every((id) => branches.has(id))))
				throw new Error("Git graph commits must reference existing branches");
		}
		if (
			block.template === "sprint-timeline" &&
			!(Date.parse(block.data.end) > Date.parse(block.data.start))
		)
			throw new Error("Sprint timelines need a start before their end");
	}
	if (
		blocks.filter((block) => block.template !== "glue").length >= 3 &&
		!blocks.some((block) => block.template === "glue")
	) {
		blocks.splice(Math.ceil(blocks.length / 2), 0, {
			template: "glue",
			data: {
				label: "Which means the next detail is worth a closer look",
			},
		});
	}
	const nodes: ArtefactNode[] = blocks.map((block, index) => ({
		id: `block-${index + 1}`,
		template: block.template,
		data: block.template === "two-column" ? {} : block.data,
		...(block.template === "two-column" && {
			children: block.children.map((child, column) => ({
				id: `block-${index + 1}-${column + 1}`,
				template: child.template,
				data: child.data,
			})),
		}),
	}));
	return {
		version: 1,
		root: {
			id: "root",
			template: "artefact-page",
			data: { title: generation.title },
			children: [
				{
					id: "category",
					template: generation.category,
					data: {
						eyebrow: generation.eyebrow,
						icon: generation.icon,
						title: generation.title,
						summary: generation.summary,
						tags: generation.tags,
					},
					children: nodes,
				},
			],
		},
	};
}

type Progress = (message: string) => void;

export async function generateArtefact(
	prompt: string,
	apiKey: string | undefined,
	model: string,
	options: {
		onProgress?: Progress;
		onCommentary?: (text: string) => void;
		signal?: AbortSignal;
		serviceTier?: "fast";
		intent?: GenerationIntent;
	} = {},
) {
	if (!apiKey) throw new ArtefactAgentError("missing_api_key");
	const startedAt = performance.now();
	const reasoningEffort = "low";
	options.onProgress?.("Preparing your brief…");
	let response: Response;
	try {
		response = await fetch("https://api.openai.com/v1/responses", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				Accept: "text/event-stream",
			},
			body: JSON.stringify({
				model,
				...(options.serviceTier
					? { service_tier: options.serviceTier }
					: {}),
				instructions,
				reasoning: { effort: reasoningEffort, summary: "concise" },
				text: {
					verbosity: "medium",
					format: {
						type: "json_schema",
						name: "artefact",
						strict: true,
						schema: jsonSchema,
					},
				},
				input: prompt,
				stream: true,
				store: false,
			}),
			signal: options.signal,
		});
	} catch (error) {
		throw new ArtefactAgentError(
			options.signal?.aborted ? "cancelled" : "network_error",
		);
	}
	options.onProgress?.("Drafting the artefact…");
	if (!response.ok || !response.body) {
		const body = (await response.json().catch(() => ({}))) as {
			error?: {
				code?: string;
				type?: string;
				param?: string;
				message?: string;
			};
		};
		throw new ArtefactAgentError("openai_http_error", {
			status: response.status,
			code: body.error?.code,
			type: body.error?.type,
			param: body.error?.param,
			message: body.error?.message,
			requestId: response.headers.get("x-request-id") ?? undefined,
		});
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let sessionId = "";
	let output = "";
	let completed = false;
	let firstEventMs: number | undefined;
	let servedServiceTier: string | undefined;
	let failure: ArtefactAgentError | undefined;
	const consume = (frame: string) => {
		const data = frame
			.split(/\r?\n/)
			.filter((line) => line.startsWith("data:"))
			.map((line) => line.slice(5).trimStart())
			.join("\n");
		if (!data || data === "[DONE]") return;
		firstEventMs ??= Math.round(performance.now() - startedAt);
		let event: {
			type?: string;
			response?: { id?: string; service_tier?: string };
			delta?: string;
			text?: string;
			error?: { code?: string };
		};
		try {
			event = JSON.parse(data);
		} catch {
			throw new ArtefactAgentError("invalid_stream_event");
		}
		sessionId ||= event.response?.id ?? "";
		servedServiceTier ||= event.response?.service_tier;
		switch (event.type) {
			case "response.created":
				options.onProgress?.("Shaping the artefact…");
				break;
			case "response.reasoning_summary_text.done":
				if (event.text) options.onCommentary?.(event.text);
				break;
			case "response.output_text.delta":
				output += event.delta ?? "";
				break;
			case "response.output_text.done":
				output = event.text ?? output;
				break;
			case "response.completed":
				completed = true;
				break;
			case "response.failed":
			case "response.incomplete":
			case "error":
				failure = new ArtefactAgentError("agent_turn_error", {
					code: event.error?.code,
					eventType: event.type,
				});
				break;
		}
	};

	try {
		while (!completed && !failure) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const frames = buffer.split(/\r?\n\r?\n/);
			buffer = frames.pop() ?? "";
			for (const frame of frames) consume(frame);
		}
		if (buffer.trim()) consume(buffer);
	} finally {
		await reader.cancel().catch(() => {});
	}
	if (failure) throw failure;
	if (!completed || !sessionId || !output)
		throw new ArtefactAgentError("incomplete_agent_response");
	try {
		return {
			content: toDocument(generationSchema.parse(JSON.parse(output)), options.intent),
			sessionId,
			telemetry: {
				model,
				reasoningEffort,
				requestedServiceTier: options.serviceTier ?? "default",
				servedServiceTier,
				requestId: response.headers.get("x-request-id") ?? undefined,
				firstEventMs,
				providerMs: Math.round(performance.now() - startedAt),
			},
		};
	} catch (error) {
		throw new ArtefactAgentError("invalid_agent_output", {
			message: error instanceof Error ? error.message : "Artefact validation failed",
		});
	}
}
