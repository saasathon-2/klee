# Templates, presets, and reusable starting points

## Goal

Make strong artefacts repeatable by packaging useful combinations of existing blocks as named starting points. A preset should shorten the prompt and improve output consistency without creating a second template/rendering system.

## Starting catalogue

Begin with a small set aligned to current blocks and available sources:

- PR review brief: review comments, diff, checks/readiness, next steps.
- Change explanation: summary, diff, impact or software diagram, tests.
- Release readiness: checks, readiness, release timeline, next steps.
- Incident update: incident timeline, current impact, mitigation and handoff.
- Engineering handoff: handoff brief, risks, ownership, next actions.
- Sprint/delivery brief: work-item board or timeline, progress, blockers.
- Architecture decision: decision record, evidence, diagram, follow-up.

Keep the public starter set curated. Do not display every possible block or source combination as a separate template.

## V1 implementation

### Preset shape

Keep the first preset representation simple and versionable:

```ts
type ArtefactPreset = {
	id: string;
	name: string;
	description: string;
	prompt: string;
	recipeId?: string;
	sourceKinds: string[];
	visibility: "personal" | "organisation";
};
```

The preset describes intent and required context; it does not persist model-created executable UI. `recipeId` becomes useful when the recipe workstream lands. Before then, use a prompt scaffold and supported template suggestions.

### UI and flow

1. Show a few curated presets near starter prompts with a short outcome label.
2. Choosing one pre-fills the prompt and leaves it editable; optional source requirements explain what will improve the result.
3. Add “Save as preset” to an owner’s artefact menu only after the user can choose which source-specific data should be removed from the reusable prompt.
4. When creating from an artefact/preset, create a new document. Do not copy sharing grants, comments, collaborators, or provider credentials.
5. Offer rename/delete for personal presets. Add organisation management only when organisation use requires roles and publishing.

### Persistence

For the initial curated gallery, static TypeScript definitions are enough. Add a database table only when users can save their own presets. That table should store owner/organisation, name, description, prompt scaffold, recipe version, timestamps, and visibility. Add owner-scoped access checks and a new migration.

## Implementation touchpoints

- Composer: `frontend/src/pages/Artefacts.tsx` and `frontend/src/artefacts/examplePrompts.ts`.
- Artefact menus: `frontend/src/pages/artefact/ArtefactNav.tsx` or the existing artefact action/menu surface.
- Prompt generation: `backend/src/app.ts` and `backend/src/artefact-agent.ts`.
- Block choices: `frontend/src/artefacts/templates/catalogue.ts` and backend schema/instructions.
- Persistence/access: backend routes and migrations, following existing folder and organisation access patterns.

## Acceptance

- Each built-in preset generates a recognisable result from its supported context.
- Presets do not invent missing source data and state what is needed.
- Saving/reusing a preset creates a new artefact and never copies permissions/comments.
- Users can edit the preset prompt before generation.
- Preset changes are versioned or frozen so edits do not unexpectedly change an existing user’s saved starting point.

## Decision gates

- Add personal persistence only after users ask to save or reuse a successful artefact.
- Add organisation presets after role/permission semantics are clear.
- Do not add a public template marketplace until usage and curation needs are demonstrated.
- Coordinate recipe-backed presets with `08_Consistent_Artifact_Recipes.md`; there should be one recipe definition source.
