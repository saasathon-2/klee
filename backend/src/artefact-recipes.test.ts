import assert from "node:assert/strict";

import {
	changeWalkthroughRecipe,
	githubPullRequestIntent,
	recipeInstructions,
} from "./artefact-recipes.ts";

const intent = githubPullRequestIntent();
assert.equal(intent.recipeId, "change-walkthrough/v1");
assert.deepEqual(changeWalkthroughRecipe.sections.slice(0, 2), ["Merge decision", "What changed"]);
assert.match(recipeInstructions(intent), /Do not use git-graph by default/);
assert.match(recipeInstructions(intent), /Lead with delivery-readiness/);
assert.match(recipeInstructions(intent), /finish with next-steps/);
assert.match(recipeInstructions(intent), /at most one primary diagram/);
