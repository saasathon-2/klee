import { z } from "zod";
import type { ArtefactDocument, ArtefactNode } from "./artefact-model.ts";

const metricSchema = z.object({
	label: z.string(),
	value: z.string(),
	detail: z.string(),
}).strict();
const flowNodeSchema = z.object({ label: z.string(), detail: z.string() }).strict();
const taskSchema = z.object({
	id: z.string(),
	key: z.string(),
	title: z.string(),
	detail: z.string(),
	meta: z.string(),
	status: z.string(),
}).strict();
const actionSchema = z.object({
	label: z.string(),
	description: z.string(),
	action: z.string(),
}).strict();

const blockSchemas = [
	z.object({ template: z.literal("prose"), data: z.object({ title: z.string(), body: z.string() }).strict() }).strict(),
	z.object({ template: z.literal("metric-row"), data: z.object({ items: z.array(metricSchema) }).strict() }).strict(),
	z.object({ template: z.literal("architecture-flow"), data: z.object({ title: z.string(), description: z.string(), nodes: z.array(flowNodeSchema) }).strict() }).strict(),
	z.object({ template: z.literal("glue"), data: z.object({ label: z.string() }).strict() }).strict(),
	z.object({ template: z.literal("task-list"), data: z.object({ title: z.string(), description: z.string(), tasks: z.array(taskSchema) }).strict() }).strict(),
	z.object({ template: z.literal("next-steps"), data: z.object({ title: z.string(), actions: z.array(actionSchema) }).strict() }).strict(),
] as const;

const generationSchema = z.object({
	title: z.string().min(1),
	category: z.enum(["developer-page", "generic-page"]),
	eyebrow: z.string().min(1),
	summary: z.string().min(1),
	tags: z.array(z.string().min(1)),
	blocks: z.array(z.union(blockSchemas)),
}).strict();

const jsonSchema = generationSchema.toJSONSchema({ target: "draft-7" });
delete jsonSchema.$schema;

const instructions = `Create a useful artefact by selecting and filling only these supported blocks. Return the requested structured output, with no markdown. Choose developer-page for engineering work and generic-page otherwise. Use prose for unsupported artefact types. Blocks are prose (title/body), metric-row (2-3 comparable items), architecture-flow (2-3 ordered nodes), glue (short transition), task-list (ordered tasks with id/key/title/detail/meta/status), and next-steps (concrete follow-up suggestions). Only choose blocks that fit the category: developer-page supports all blocks; generic-page supports prose, metric-row, glue, and next-steps. Never invent fetched or connected data; work only from the user's prompt. Do not claim that an integration or action has been performed.`;

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
	if (generation.blocks.length === 0 || generation.blocks.length > 8 || generation.tags.length === 0) {
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

export async function generateArtefact(prompt: string, apiKey: string | undefined, model: string) {
	if (!apiKey) throw new ArtefactAgentError("missing_api_key");
	let response: Response;
	try {
		response = await fetch("https://api.openai.com/v1/agents/sessions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				Accept: "text/event-stream",
				"OpenAI-Beta": "agents=v1",
			},
			body: JSON.stringify({
				agent: {
					model,
					instructions,
					multi_agent: { enabled: false },
					text: {
					format: {
						type: "json_schema",
						schema: jsonSchema,
						},
					},
				},
				environment: { type: "none" },
				input: prompt,
				stream: true,
			}),
		});
	} catch {
		throw new ArtefactAgentError("network_error");
	}
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
	let failure: ArtefactAgentError | undefined;
	const consume = (frame: string) => {
		const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
		if (!data || data === "[DONE]") return;
		let event: { type?: string; session?: { id?: string }; session_id?: string; text?: string; error?: { code?: string }; turn?: { subagent_id?: string | null; error?: { code?: string } } };
		try {
			event = JSON.parse(data);
		} catch {
			throw new ArtefactAgentError("invalid_stream_event");
		}
		sessionId ||= event.session?.id ?? event.session_id ?? "";
		switch (event.type) {
			case "agent.session.created":
				break;
			case "agent.session.turn.output_text.done":
				output = event.text ?? output;
				break;
			case "agent.session.turn.completed":
				if (!event.turn?.subagent_id) completed = true;
				break;
			case "agent.session.turn.failed":
			case "agent.session.turn.cancelled":
			case "agent.session.failed":
			case "agent.session.environment.failed":
			case "agent.session.action_required":
			case "agent.session.requires_action":
			case "error":
				failure = new ArtefactAgentError("agent_turn_error", {
					code: event.error?.code ?? event.turn?.error?.code,
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
		return { content: toDocument(generationSchema.parse(JSON.parse(output))), sessionId };
	} catch {
		throw new ArtefactAgentError("invalid_agent_output");
	}
}
