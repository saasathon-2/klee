import assert from "node:assert/strict";

import {
	changeWalkthroughRecipe,
	githubPullRequestIntent,
	recipeInstructions,
	validateRecipe,
} from "./artefact-recipes.ts";

const intent = githubPullRequestIntent();
assert.equal(intent.recipeId, "change-walkthrough/v1");
assert.deepEqual(changeWalkthroughRecipe.sections.slice(0, 2), ["Merge decision", "What changed"]);
assert.match(recipeInstructions(intent), /Do not use git-graph by default/);
validateRecipe(intent, ["delivery-readiness", "prose", "check-list", "next-steps"]);
assert.throws(() => validateRecipe(intent, ["prose", "next-steps"]));
assert.throws(() => validateRecipe(intent, ["delivery-readiness", "prose", "git-graph", "next-steps"]));
