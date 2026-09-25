import assert from "node:assert/strict";
import test from "node:test";
import {
	applyPatch,
	describeChanges,
	diffDocuments,
	documentAtVersion,
	isTextOnlyEdit,
} from "./artefact-versions.ts";

const document = {
	version: 1,
	root: {
		id: "root",
		template: "artefact-page",
		data: { title: "PR #482" },
		children: [
			{
				id: "category",
				template: "developer-page",
				data: { title: "PR #482", summary: "Adds auth", tags: ["Backend"] },
				children: [
					{
						id: "tasks",
						template: "task-list",
						data: {
							title: "Next up",
							tasks: [
								{ id: "1", title: "Review", status: "Open" },
								{ id: "2", title: "Merge", status: "Blocked" },
							],
						},
					},
				],
			},
		],
	},
};

const withTaskTitle = (title: string) => {
	const copy = structuredClone(document);
	copy.root.children[0].children[0].data.tasks[0].title = title;
	return copy;
};

test("a diff replays to the new document", () => {
	const after = withTaskTitle("Review the diff");
	after.root.children[0].data.tags.push("Auth");
	const patch = diffDocuments(document, after);
	assert.deepEqual(applyPatch(document, patch), after);
});

test("identical documents produce an empty diff", () => {
	assert.deepEqual(diffDocuments(document, structuredClone(document)), []);
});

test("an undefined starting point replaces the whole document", () => {
	assert.deepEqual(diffDocuments(undefined, document), [{ op: "replace", path: [], value: document }]);
});

test("arrays of a different length are replaced whole", () => {
	const after = structuredClone(document);
	after.root.children[0].data.tags = ["Backend", "Auth"];
	assert.deepEqual(diffDocuments(document, after), [
		{ op: "replace", path: ["root", "children", 0, "data", "tags"], value: ["Backend", "Auth"] },
	]);
});

test("added and removed keys round-trip", () => {
	const after = structuredClone(document) as Record<string, unknown>;
	delete after.version;
	after.extra = { note: "hi" };
	assert.deepEqual(applyPatch(document, diffDocuments(document, after)), after);
});

test("rebuilds any version by replaying patches", () => {
	const second = withTaskTitle("Review the diff");
	const third = withTaskTitle("Review again");
	const patches = [
		diffDocuments(undefined, document),
		diffDocuments(document, second),
		diffDocuments(second, third),
	];
	assert.deepEqual(documentAtVersion(patches, 1), document);
	assert.deepEqual(documentAtVersion(patches, 2), second);
	assert.deepEqual(documentAtVersion(patches, 3), third);
});

test("text edits are allowed, structural edits are not", () => {
	assert.equal(isTextOnlyEdit(diffDocuments(document, withTaskTitle("Ship it")), document), true);

	const retemplated = structuredClone(document);
	retemplated.root.children[0].children[0].template = "prose";
	assert.equal(isTextOnlyEdit(diffDocuments(document, retemplated), document), false);

	const newId = structuredClone(document);
	newId.root.children[0].children[0].id = "other";
	assert.equal(isTextOnlyEdit(diffDocuments(document, newId), document), false);

	const added = structuredClone(document);
	added.root.children[0].children[0].data.tasks.push({ id: "3", title: "Deploy", status: "Open" });
	assert.equal(isTextOnlyEdit(diffDocuments(document, added), document), false);

	const retyped = structuredClone(document) as unknown as { version: unknown };
	retyped.version = "1";
	assert.equal(isTextOnlyEdit(diffDocuments(document, retyped), document), false);
});

test("describes changes with readable labels", () => {
	const after = withTaskTitle("Ship it");
	assert.deepEqual(describeChanges(diffDocuments(document, after), document), [
		{ label: "Task list › tasks › 1 › title", before: "Review", after: "Ship it" },
	]);
});
