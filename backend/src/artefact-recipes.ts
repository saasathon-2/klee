export type GenerationIntent = {
	family: "change-walkthrough";
	audience: "reviewer";
	depth: "standard";
	recipeId: "change-walkthrough/v1";
};

export const changeWalkthroughRecipe = {
	id: "change-walkthrough/v1",
	sections: [
		"Merge decision",
		"What changed",
		"Grounded impact",
		"Validation and blockers",
		"Next owner",
	],
} as const;

/** GitHub PRs have a known reader and job, so they never need generic routing. */
export function githubPullRequestIntent(): GenerationIntent {
	return {
		family: "change-walkthrough",
		audience: "reviewer",
		depth: "standard",
		recipeId: changeWalkthroughRecipe.id,
	};
}

export function recipeInstructions(intent: GenerationIntent) {
	return `Create ${intent.recipeId} for a ${intent.audience}. Lead with delivery-readiness, include prose explaining the consequential change and grounded impact, and finish with next-steps for the next owner. Use review-comments, check-list, code-diff, and commit-list only as supporting evidence. Keep raw diffs, commit history, and individual checks as linked evidence or an appendix. Do not use git-graph by default, and omit impact diagrams when the supplied context does not establish relationships.`;
}
