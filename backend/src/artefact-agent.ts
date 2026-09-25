import { z } from "zod";
import type { ArtefactDocument, ArtefactNode } from "./artefact-model.ts";

const shortText = z.string().trim().min(1).max(120);
const detailText = z.string().trim().min(1).max(280);

const metricSchema = z.object({
	label: shortText,
	value: shortText,
	detail: shortText,
}).strict();
const flowNodeSchema = z.object({ label: shortText, detail: shortText }).strict();
const taskSchema = z.object({
	id: shortText,
	key: shortText,
	title: shortText,
	detail: detailText,
	meta: shortText,
	status: shortText,
}).strict();
const actionSchema = z.object({
	label: shortText,
	description: shortText,
	action: shortText,
}).strict();

const blockSchemas = [
	z.object({ template: z.literal("prose"), data: z.object({ title: shortText, body: detailText }).strict() }).strict(),
	z.object({ template: z.literal("metric-row"), data: z.object({ items: z.array(metricSchema).min(2).max(3) }).strict() }).strict(),
	z.object({ template: z.literal("architecture-flow"), data: z.object({ title: shortText, description: shortText, nodes: z.array(flowNodeSchema).min(2).max(3) }).strict() }).strict(),
	z.object({ template: z.literal("glue"), data: z.object({ label: shortText }).strict() }).strict(),
	z.object({ template: z.literal("task-list"), data: z.object({ title: shortText, description: shortText, tasks: z.array(taskSchema).min(1).max(3) }).strict() }).strict(),
	z.object({ template: z.literal("next-steps"), data: z.object({ title: shortText, actions: z.array(actionSchema).min(1).max(3) }).strict() }).strict(),
] as const;

const generationSchema = z.object({
	title: z.string().trim().min(1).max(80),
	category: z.enum(["developer-page", "generic-page"]),
	eyebrow: z.string().trim().min(1).max(48),
	summary: z.string().trim().min(1).max(280),
	tags: z.array(z.string().trim().min(1).max(32)).min(1).max(4),
	blocks: z.array(z.union(blockSchemas)).min(1).max(4),
}).strict();

const jsonSchema = generationSchema.toJSONSchema({ target: "draft-7" });
delete jsonSchema.$schema;

const instructions = `Create a concise, useful first-pass artefact. Return only the requested structured output, with no markdown. Choose developer-page for engineering work and generic-page otherwise. Use 2-3 blocks by default and never more than 4. Answer simple requests directly with one prose block; do not add generic metrics, architecture diagrams, task lists, or next steps unless the prompt supplies or clearly asks for that information. Keep every field short and specific. Blocks are prose (title/body), metric-row (2-3 comparable items), architecture-flow (2-3 ordered nodes), glue (short transition), task-list (ordered tasks with id/key/title/detail/meta/status), and next-steps (concrete follow-up suggestions). Only choose blocks that fit the category: developer-page supports all blocks; generic-page supports prose, metric-row, glue, and next-steps. Never invent fetched or connected data; work only from the user's prompt. Do not claim that an integration or action has been performed.`;

export class ArtefactAgentError extends Error {
	readonly kind: string;
	readonly details: { status?: number; code?: string; type?: string; param?: string; requestId?: string; eventType?: string };
	constructor(kind: string, details: { status?: number; code?: string; type?: string; param?: string; requestId?: string; eventType?: string } = {}) {
		super(kind);
		this.kind = kind;
		this.details = details;
	}
}

type Generation = z.infer<typeof generationSchema>;

function toDocument(generation: Generation): ArtefactDocument {
	if (generation.blocks.length === 0 || generation.blocks.length > 4 || generation.tags.length === 0) {
		throw new Error("The generated artefact is incomplete");
	}
	const allowed = generation.category === "developer-page"
		? new Set(["prose", "metric-row", "architecture-flow", "glue", "task-list", "next-steps"])
		: new Set(["prose", "metric-row", "glue", "next-steps"]);
	if (generation.blocks.some((block) => !allowed.has(block.template))) {
		throw new Error("The generated artefact contains an unsupported block");
	}
	for (const block of generation.blocks) {
		if (block.template === "metric-row" && block.data.items.length < 2) throw new Error("Metric rows need at least two items");
		if (block.template === "architecture-flow" && block.data.nodes.length < 2) throw new Error("Architecture flows need at least two nodes");
		if (block.template === "task-list" && block.data.tasks.length === 0) throw new Error("Task lists cannot be empty");
		if (block.template === "next-steps" && block.data.actions.length === 0) throw new Error("Next steps cannot be empty");
	}
	const nodes: ArtefactNode[] = generation.blocks.map((block, index) => ({
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
			children: [{
				id: "category",
				template: generation.category,
				data: {
					eyebrow: generation.eyebrow,
					title: generation.title,
					summary: generation.summary,
					tags: generation.tags,
				},
				children: nodes,
			}],
		},
	};
}

type Progress = (message: string) => void;

export async function generateArtefact(
	prompt: string,
	apiKey: string | undefined,
	model: string,
	options: { onProgress?: Progress; signal?: AbortSignal } = {},
) {
	if (!apiKey) throw new ArtefactAgentError("missing_api_key");
	const startedAt = performance.now();
	const reasoningEffort = model.includes("astra") ? "low" : "none";
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
				instructions,
				reasoning: { effort: reasoningEffort },
				max_output_tokens: 800,
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
		throw new ArtefactAgentError(options.signal?.aborted ? "cancelled" : "network_error");
	}
	options.onProgress?.("Drafting the artefact…");
	if (!response.ok || !response.body) {
		const body = await response.json().catch(() => ({})) as {
			error?: { code?: string; type?: string; param?: string };
		};
		throw new ArtefactAgentError("openai_http_error", {
			status: response.status,
			code: body.error?.code,
			type: body.error?.type,
			param: body.error?.param,
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
	let failure: ArtefactAgentError | undefined;
	const consume = (frame: string) => {
		const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
		if (!data || data === "[DONE]") return;
		firstEventMs ??= Math.round(performance.now() - startedAt);
		let event: { type?: string; response?: { id?: string }; delta?: string; text?: string; error?: { code?: string } };
		try {
			event = JSON.parse(data);
		} catch {
			throw new ArtefactAgentError("invalid_stream_event");
		}
		sessionId ||= event.response?.id ?? "";
		switch (event.type) {
			case "response.created":
				options.onProgress?.("Shaping the artefact…");
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
	if (!completed || !sessionId || !output) throw new ArtefactAgentError("incomplete_agent_response");
	try {
		return {
			content: toDocument(generationSchema.parse(JSON.parse(output))),
			sessionId,
			telemetry: {
				model,
				reasoningEffort,
				requestId: response.headers.get("x-request-id") ?? undefined,
				firstEventMs,
				providerMs: Math.round(performance.now() - startedAt),
			},
		};
	} catch {
		throw new ArtefactAgentError("invalid_agent_output");
	}
}
