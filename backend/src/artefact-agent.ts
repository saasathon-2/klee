import { z } from "zod";
import { readFileSync } from "node:fs";
import type { ArtefactDocument, ArtefactNode } from "./artefact-model.ts";

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
const softwareDiagramNodeSchema = z
	.object({ id: shortText, label: shortText, detail: detailText })
	.strict();
const softwareDiagramEdgeSchema = z
	.object({
		source: shortText,
		target: shortText,
		label: z.string().trim().max(120).nullable(),
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
] as const;

const generationSchema = z
	.object({
		title: z.string().trim().min(1).max(80),
		icon: artefactIconSchema,
		category: z.enum(["developer-page", "generic-page"]),
		eyebrow: z.string().trim().min(1).max(48),
		summary: z.string().trim().min(1).max(280),
		tags: z.array(z.string().trim().min(1).max(32)).min(1).max(4),
		blocks: z.array(z.union(blockSchemas)).min(1),
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

export function toDocument(generation: Generation): ArtefactDocument {
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
					"glue",
					"task-list",
					"next-steps",
					"code-diff",
					"review-comments",
					"commit-list",
					"check-list",
				])
			: new Set(["prose", "metric-row", "glue", "next-steps"]);
	if (generation.blocks.some((block) => !allowed.has(block.template))) {
		throw new Error("The generated artefact contains an unsupported block");
	}
	const blocks = generation.blocks.filter((block) => {
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
		return true;
	});
	if (blocks.length === 0)
		throw new Error("The generated artefact is incomplete");
	for (const block of blocks) {
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
			if (block.data.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target)))
				throw new Error("Software diagram edges must reference existing nodes");
		}
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
		data: block.data,
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
					verbosity: "low",
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
			content: toDocument(generationSchema.parse(JSON.parse(output))),
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
	} catch {
		throw new ArtefactAgentError("invalid_agent_output");
	}
}
