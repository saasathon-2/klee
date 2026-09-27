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
	allowedTemplates: [
		"delivery-readiness",
		"prose",
		"review-comments",
		"check-list",
		"code-diff",
		"commit-list",
		"next-steps",
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
	return `Create ${intent.recipeId} for a ${intent.audience}. Lead with the merge decision or uncertainty, then explain the consequential change, grounded impact, validation or blockers, and the next owner. Keep raw diffs, commit history, and individual checks as linked evidence or an appendix. Do not use git-graph by default, and omit impact diagrams when the supplied context does not establish relationships.`;
}

/** Reject generic PR pages before they can be stored as a change walkthrough. */
export function validateRecipe(intent: GenerationIntent, templates: string[]) {
	if (intent.recipeId !== changeWalkthroughRecipe.id) return;
	if (templates[0] !== "delivery-readiness")
		throw new Error("Change walkthroughs must lead with the merge decision");
	if (!templates.includes("prose"))
		throw new Error("Change walkthroughs must explain what changed");
	if (templates.at(-1) !== "next-steps")
		throw new Error("Change walkthroughs must end with the next owner action");
	if (templates.some((template) => !changeWalkthroughRecipe.allowedTemplates.includes(template as never)))
		throw new Error("Change walkthroughs contain a disallowed block");
}
