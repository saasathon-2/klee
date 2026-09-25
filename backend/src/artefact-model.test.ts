import assert from "node:assert/strict";
import test from "node:test";
import { createArtefactDocument } from "./artefact-model.ts";

test("selects the developer branch and its nested blocks for engineering prompts", () => {
	const document = createArtefactDocument("Explain this pull request architecture");
	const category = document.root.children?.[0];

	assert.equal(category?.template, "developer-page");
	assert.deepEqual(category.children?.map((node) => node.template), [
		"metric-row",
		"architecture-flow",
		"glue",
		"task-list",
		"next-steps",
	]);
});
