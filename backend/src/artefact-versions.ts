import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type PatchPath = (string | number)[];
export type PatchOp =
	| { op: "replace"; path: PatchPath; value: Json }
	| { op: "add"; path: PatchPath; value: Json }
	| { op: "remove"; path: PatchPath };
export type VersionSource = "generated" | "edit" | "revision" | "github";
export type VersionChange = {
	label: string;
	before: string | null;
	after: string | null;
};

const isObject = (value: unknown): value is Record<string, Json> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function isEqual(a: unknown, b: unknown) {
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Forward diff from `before` to `after`. Objects are compared key by key,
 * arrays element by element when their length is unchanged, and anything
 * else is replaced whole. An undefined `before` replaces the root.
 */
export function diffDocuments(before: unknown, after: unknown, path: PatchPath = []): PatchOp[] {
	if (before === undefined) return [{ op: "replace", path, value: after as Json }];
	if (isEqual(before, after)) return [];
	if (isObject(before) && isObject(after)) {
		const ops: PatchOp[] = [];
		for (const key of Object.keys(before))
			if (!(key in after)) ops.push({ op: "remove", path: [...path, key] });
		for (const [key, value] of Object.entries(after))
			ops.push(
				...(key in before
					? diffDocuments(before[key], value, [...path, key])
					: [{ op: "add" as const, path: [...path, key], value }]),
			);
		return ops;
	}
	if (Array.isArray(before) && Array.isArray(after) && before.length === after.length)
		return before.flatMap((item, index) => diffDocuments(item, after[index], [...path, index]));
	return [{ op: "replace", path, value: after as Json }];
}

function valueAt(document: unknown, path: PatchPath): unknown {
	return path.reduce<unknown>(
		(value, key) => (value as Record<string | number, unknown> | undefined)?.[key],
		document,
	);
}

export function applyPatch(document: unknown, patch: PatchOp[]): unknown {
	let result = structuredClone(document);
	for (const operation of patch) {
		if (operation.path.length === 0) {
			result = operation.op === "remove" ? undefined : structuredClone(operation.value);
			continue;
		}
		const parent = valueAt(result, operation.path.slice(0, -1)) as Record<string | number, unknown>;
		const key = operation.path[operation.path.length - 1];
		if (operation.op === "remove") delete parent[key];
		else parent[key] = structuredClone(operation.value);
	}
	return result;
}

/** Rebuilds a document by replaying every patch up to and including `version`. */
export function documentAtVersion(patches: PatchOp[][], version: number) {
	return patches
		.slice(0, version)
		.reduce<unknown>((document, patch) => applyPatch(document, patch), undefined);
}

/**
 * True when a patch only swaps existing strings for other strings inside a
 * node's `data`, so ids, templates and structure can't change.
 */
export function isTextOnlyEdit(patch: PatchOp[], before: unknown) {
	return patch.every(
		(operation) =>
			operation.op === "replace" &&
			operation.path.includes("data") &&
			typeof operation.value === "string" &&
			typeof valueAt(before, operation.path) === "string",
	);
}

const isFiniteNumber = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value);

function isSoftwareDiagram(value: unknown) {
	if (!isObject(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges))
		return false;
	const ids = new Set<string>();
	for (const node of value.nodes) {
		if (
			!isObject(node) ||
			typeof node.id !== "string" ||
			!node.id ||
			typeof node.label !== "string" ||
			typeof node.detail !== "string" ||
			ids.has(node.id)
		)
			return false;
		if (
			node.position !== undefined &&
			(!isObject(node.position) ||
				!isFiniteNumber(node.position.x) ||
				!isFiniteNumber(node.position.y))
		)
			return false;
		if (
			(node.width !== undefined && (!isFiniteNumber(node.width) || node.width <= 0)) ||
			(node.height !== undefined && (!isFiniteNumber(node.height) || node.height <= 0))
		)
			return false;
		ids.add(node.id);
	}
	for (const edge of value.edges) {
		if (
			!isObject(edge) ||
			typeof edge.source !== "string" ||
			typeof edge.target !== "string" ||
			!ids.has(edge.source) ||
			!ids.has(edge.target) ||
			edge.source === edge.target ||
			![edge.sourceHandle, edge.targetHandle, edge.label].every(
				(field) => field === undefined || field === null || typeof field === "string",
			)
		)
			return false;
	}
	return true;
}

/** Allows graph edits only within a well-formed software-diagram node. */
export function isTextOrDiagramEdit(
	patch: PatchOp[],
	before: unknown,
	after: unknown,
) {
	return patch.every((operation) => {
		if (isTextOnlyEdit([operation], before)) return true;
		const dataIndex = operation.path.indexOf("data");
		if (dataIndex < 0 || !["nodes", "edges"].includes(String(operation.path[dataIndex + 1])))
			return false;
		const node = valueAt(before, operation.path.slice(0, dataIndex));
		const data = valueAt(after, operation.path.slice(0, dataIndex + 1));
		return isObject(node) && node.template === "software-diagram" && isSoftwareDiagram(data);
	});
}

const templateName = (template: string) =>
	template.charAt(0).toUpperCase() + template.slice(1).replaceAll("-", " ");

/** Human-readable label for a path, e.g. "Task list › tasks 1 › title". */
function describePath(document: unknown, path: PatchPath) {
	let node: unknown = document;
	let label = "Artefact";
	let index = 0;
	// Walk down through the node tree: root → children[i] → … → data.
	while (index < path.length && path[index] !== "data") {
		node = (node as Record<string | number, unknown> | undefined)?.[path[index]];
		const template = (node as { template?: unknown } | undefined)?.template;
		if (typeof template === "string") label = templateName(template);
		index++;
	}
	const field = path
		.slice(index + 1)
		.map((key) => (typeof key === "number" ? String(key + 1) : key));
	return [label, ...field].join(" › ");
}

const asText = (value: unknown) =>
	typeof value === "string" || typeof value === "number" || typeof value === "boolean"
		? String(value)
		: null;

export function describeChanges(patch: PatchOp[], before: unknown): VersionChange[] {
	return patch
		.filter((operation) => operation.path.length > 0)
		.map((operation) => ({
			label: describePath(before ?? ("value" in operation ? operation.value : undefined), operation.path),
			before: asText(valueAt(before, operation.path)),
			after: "value" in operation ? asText(operation.value) : null,
		}));
}

/**
 * Appends the next version for an artefact. Call it inside a transaction,
 * after updating the artefact row, so the row lock keeps versions linear.
 * Returns the new version number, or the current one if nothing changed.
 */
export async function recordVersion(
	client: PoolClient,
	{
		artefactId,
		before,
		after,
		authorId,
		source,
	}: {
		artefactId: string;
		before: unknown;
		after: unknown;
		authorId: string | null;
		source: VersionSource;
	},
) {
	const { rows } = await client.query(
		"select coalesce(max(version), 0) as version from artefact_version where artefact_id = $1",
		[artefactId],
	);
	const latest = Number(rows[0].version);
	// Content from before versioning existed has no version 1 yet, so store it whole.
	const patch = diffDocuments(latest === 0 ? undefined : before, after);
	if (patch.length === 0) return latest;
	await client.query(
		"insert into artefact_version (id, artefact_id, version, author_id, source, patch) values ($1, $2, $3, $4, $5, $6)",
		[randomUUID(), artefactId, latest + 1, authorId, source, JSON.stringify(patch)],
	);
	return latest + 1;
}
