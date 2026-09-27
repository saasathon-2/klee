# Vibeable components and constrained editor

## Goal

Let users describe a useful block or layout in plain language, then edit and reuse the result. The first implementation should compose existing trusted blocks into the current artefact tree.

## Product boundary

“Vibeable” means prompt-assisted composition, content, and configuration. It does not mean running generated React, HTML, CSS, JavaScript, plugins, or arbitrary network requests. Generated UI code would require a dedicated sandbox, permission model, resource controls, review, and export policy; that is a separate decision gate.

## V1: generate a trusted composition

### User flow

1. User selects “Create a component” and describes its purpose, audience, available data, and desired layout.
2. The model returns a composition using supported block names and validated fields.
3. Klee renders a preview inside the existing artefact shell.
4. The user adjusts labels, content, block order, and one/two-column arrangement.
5. The user inserts the composition into an artefact or saves it as a personal component.

Use a small structured response such as `{ name, description, blocks }`, where `blocks` use the same schemas as normal generation. Do not create a parallel component AST in V1.

### Inputs and provenance

- Allow prompt text, manually entered fields, and explicitly selected integration records.
- Include source URLs/IDs where block types support them.
- Represent missing inputs as editable placeholders or omit the dependent optional block.
- Keep provider-specific payloads out of the component definition. Map them into the same normalized shapes used for artefact generation.
- User-provided descriptions and source content are data, not instructions.

## V2: constrained editor

- Provide field controls generated from existing schemas: title, text, items, status, links, and layout.
- Allow reorder, hide/remove optional block, and duplicate block. Lock required recipe sections where a component is inserted in a stable recipe.
- If a text/DSL mode is requested, use a small declarative format that round-trips exactly through the same schema validator. JSON editor support is optional; do not build a custom language without a user need.
- Regeneration should produce a preview/diff. Applying it creates an artefact revision; it must not overwrite prior content silently.
- Accessibility: keyboard reorder controls, clear focus, non-drag alternative, semantic form labels, mobile form layout.

## Reuse and versioning

When saved components are proven useful, store:

- Owner or organisation scope and access policy.
- Name/description, validated block composition, and compatible schema version.
- Immutable published version plus creation/update metadata.
- Optional input-field declarations, default values, and source-kind requirements.

Insertion copies a component version into the artefact tree. Later component edits do not rewrite existing artefacts. Add migration and access tests before exposing organisation sharing.

## Implementation touchpoints

- Model and render tree: `frontend/src/artefacts/model.ts`, template catalogue and renderer.
- Editing/version patches: artefact editor and current revision endpoints.
- Generation schemas/normalisation: `backend/src/artefact-agent.ts`.
- Persistence/access: new component routes/table only after saved reuse is in scope.
- Preset coordination: `03_Templates_and_Presets.md` and recipes in `08_Consistent_Artifact_Recipes.md`.

## Acceptance

- Generated compositions pass the same backend validation as model-generated artefacts.
- A user can inspect and change the draft before insertion.
- No generated code is executed in the browser or server.
- Saving and reinserting a component preserves version identity and never copies artefact permissions.
- Removing one invalid/empty optional component block does not invalidate unrelated content.

## Upgrade gate

Only evaluate arbitrary custom rendering if users repeatedly hit limits of trusted block compositions. Before it is considered, specify sandboxing, data access, network policy, CPU/memory/time bounds, moderation, audit trail, export/snapshot behavior, migration and rollback. A declarative schema extension is preferred if it solves the observed need.
