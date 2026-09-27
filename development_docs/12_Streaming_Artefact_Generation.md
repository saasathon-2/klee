# Streaming artefact generation

## Goal

Let an artefact appear and fill in while Klee is generating it. The page should establish its title area, section wrappers, and expected layout quickly; each section replaces its own skeleton as validated content becomes available.

The experience should feel like a document being assembled, not a chat response pasted into a blank page.

## Current state

The app already streams server-sent events from `POST /api/artefacts/stream` and the revision route. The browser currently receives these event types:

- `progress`: short status messages such as “Preparing your brief…” and “Drafting the artefact…”.
- `commentary`: the model’s concise reasoning summary.
- `complete`: the final persisted artefact after one structured JSON response has been parsed and validated.
- `error`: a user-facing generation failure.

`backend/src/artefact-agent.ts` accumulates `response.output_text.delta` into one JSON string, then applies the strict Zod schema and `toDocument` only after the model completes. This protects the document model, but it means the frontend has no usable blocks until the end. `frontend/src/pages/Artefacts.tsx` already has an SSE reader; `ArtefactModal` renders the waiting experience.

## Design principles

1. Show a truthful shell early. A section wrapper should describe the selected artefact structure, not pretend the model has already supplied its facts.
2. Preserve the existing strict final validation boundary. Incomplete JSON text is not a valid artefact block.
3. Replace one section at a time. A slow or failed section must not blank the completed parts of the artefact.
4. Never publish a partial artefact to the normal list, share links, snapshots, comments, or versions.
5. Keep cancellation, retry, and navigation predictable. Leaving the page must abort the active request and avoid a background partial save.
6. Keep motion subtle and respect reduced-motion preferences. Skeletons should indicate where content will arrive, not create visual noise.

## Target interaction

```text
User submits prompt
        │
        ├─ SSE: start { generationId, shell }
        │          └─ render artefact header + section wrappers/skeletons
        │
        ├─ SSE: section { id, node }
        │          └─ validate and replace only that section skeleton
        │
        ├─ SSE: progress/commentary
        │          └─ update compact live status without moving the document
        │
        ├─ SSE: complete { artefact }
        │          └─ reconcile with final validated document, persist once
        │
        └─ SSE: error/cancelled
                   └─ retain completed sections locally; offer retry/discard
```

The `complete` document remains the source of truth. Streaming sections are an optimistic display layer with their own validation and cannot create a saved artefact by themselves.

## Shell-first architecture

### What the shell contains

The server can create a shell without waiting for model text when it knows the entry point or recipe. For a GitHub PR review, the shell can contain:

1. Artefact page and developer-page header wrapper.
2. Summary section placeholder.
3. Scope/status section placeholder.
4. Key changes/diff section placeholder.
5. Review feedback placeholder.
6. CI checks placeholder.
7. Readiness and next-actions placeholder.
8. One optional appendix area, initially hidden or represented by a compact “Additional context” skeleton.

The wrappers receive stable IDs such as `core-summary`, `core-checks`, and `appendix-impact`. They should be recipe slot IDs, not temporary array indexes, so a streamed section can replace its intended skeleton even if an optional section is absent.

For a free-form prompt with no known recipe, start with a neutral header plus a small generic shell: direct answer, supporting evidence, and next actions. Once intent routing/recipe selection is available, replace this generic path with the selected shell before generation starts. Do not show a fake code-diff or diagram skeleton merely because the prompt contains technical words.

### Shell source

Prefer deterministic recipe selection from `08_Consistent_Artifact_Recipes.md`. GitHub PR webhook generation already knows its source type. A manually selected preset or artefact mode also identifies a shell. Ambiguous prompts can use the generic shell initially; a later planner may return a shell, but it should not block the first streaming release.

The shell is display-only and should be generated in backend code near recipe selection. It must use the same category/page wrappers and allowed block choices as the current document tree. No second renderer is needed.

## Streaming protocol

Extend the existing event stream with versioned, JSON payloads. Keep the existing `progress`, `commentary`, `complete`, and `error` events compatible during rollout.

```ts
type GenerationStart = {
	generationId: string;
	shell: {
		title?: string;
		category: "developer-page" | "generic-page";
		recipeId?: string;
		sections: Array<{
			id: string;
			label: string;
			template?: string;
			state: "loading" | "optional";
		}>;
	};
};

type GenerationSection = {
	generationId: string;
	sectionId: string;
	node: ArtefactNode;
};

type GenerationSectionError = {
	generationId: string;
	sectionId: string;
	message: string;
	retryable: boolean;
};
```

Suggested SSE event names:

- `start`: shell available; client creates the temporary document.
- `section`: one validated block or section has arrived.
- `section-error`: only the named section failed; keep its placeholder/error state.
- `progress` and `commentary`: retain current meaning.
- `complete`: final persisted artefact and final document.
- `error`: generation-wide failure before a valid final artefact exists.
- `cancelled`: optional terminal event for a user abort or closed connection where the client is still attached.

All events include `generationId`. The browser must ignore events from an earlier prompt after the user starts another generation.

## How to get valid sections from a structured-output model

The current model response is one strict JSON object. Its text deltas are not safe section events: intermediate JSON can be malformed, a later token can alter an earlier field, and model output has no valid block boundary until final parse.

Choose one of these approaches deliberately.

### Phase 1 recommendation: shell + meaningful progress

Ship the visual shell first. Keep model generation as one final structured response and drive section skeleton state from stable generation phases:

1. Send `start` before the model call.
2. Mark the header/summary skeleton as active during “Shaping the artefact”.
3. Move emphasis to evidence and action skeletons as current progress messages advance.
4. Reconcile all blocks atomically on `complete`.

This is the smallest safe release. The page feels present immediately, has stable geometry, and retains exact current validation/persistence semantics. It does not claim individual sections are final before they are.

### Phase 2: planned sections, then streamed fills

Split generation into a small strict plan and independent section fills:

1. Produce a typed plan containing recipe, title, selected slots, and optional slots.
2. Send `start` with that plan and show accurate wrappers.
3. Generate one or a small bounded batch of slots at a time.
4. Parse and validate every completed slot against its block schema before emitting `section`.
5. Assemble all validated slots, run final `toDocument` validation/order enforcement, and persist once.

This gives true progressive replacement. It costs more model calls and adds coordination; start with sequential or a small concurrency limit so source context and rate limits remain bounded. A plan must not allow the model to invent arbitrary template names or sections outside the recipe.

### Phase 3: provider-supported structured item streaming

If the model/provider can stream independently valid structured items with a documented contract, use that protocol instead of parsing text fragments. Still validate each item server-side and retain final document validation. Do not build a custom incremental JSON parser around `response.output_text.delta` solely to make the UI update sooner.

## Client model and rendering

Create a local generation state separate from persisted `Artefact` state:

```ts
type LiveGeneration = {
	id: string;
	shell: GenerationStart["shell"];
	sections: Record<
		string,
		{
			state: "loading" | "ready" | "error";
			node?: ArtefactNode;
			error?: string;
		}
	>;
	status: string;
	commentary: string;
};
```

The temporary document adapter maps ready sections to existing template renderer nodes and maps loading sections to skeleton components. `ArtefactBody` or a small sibling component should own this rendering so the final `ArtefactBody` continues to render only persisted/validated artefacts.

Avoid embedding `isLoading` branches throughout every block renderer. Use one `StreamingArtefactBody` layer that renders the existing page/category wrappers, then selects either the existing renderer or a section skeleton for each slot. Skeletons use a small set of semantic shapes:

- Header: title and summary lines.
- Text/evidence: short and long paragraph lines.
- Metrics/checks: fixed-size row chips.
- Diff/list: repeated line rows.
- Diagram/chart: bounded canvas/card with a static placeholder.
- Actions: compact button-shaped rows.

Use stable height ranges but do not reserve a full final height; generated content varies. Respect `prefers-reduced-motion`, set `aria-busy` on loading sections, and announce only meaningful state changes through a polite live region. Avoid reading every token or status update aloud.

## Persistence, cancellation, and recovery

- Keep the live generation in browser memory. Only `complete` writes the artefact, records a version, adds it to the sidebar/recent list, and triggers snapshot preparation.
- If an active user cancels before `complete`, abort the request and discard the temporary document by default. Preserve the original prompt and selected sources so retry is one action.
- If some section fills succeeded in Phase 2 but final validation fails, do not auto-save an incomplete document. Offer retry generation; later, an explicit “save draft” feature can be considered with a distinct draft state and access rules.
- If the browser disconnects, abort upstream generation with the existing `AbortController`. If persistence succeeded just before disconnect, normal artefact loading reconciles the result on return.
- For revisions, stream against a copy of the current artefact. Keep the current version visible until the final revision is valid and conflict checks pass; never replace an editable document with partial output.
- Disable conflicting edit/share/comment actions in the temporary stream view unless their semantics are specifically designed. The user may still navigate away or cancel.

## Backend work

1. Add recipe/shell selection as a pure function near generation routing.
2. Send `start` immediately from `/api/artefacts/stream` and revision streaming routes.
3. Add event payload types shared or mirrored carefully between backend and frontend.
4. Implement Phase 1 shell and final reconciliation before changing model request topology.
5. For Phase 2, extract block-schema validation so a completed section can be checked independently, then retain complete-document validation before persistence.
6. Add generation IDs, cancellation handling, and structured terminal events.
7. Record timing for time-to-shell, time-to-first-section, time-to-complete, cancellation, and final validation failure. Do not log raw prompts or source text.

Likely files: `backend/src/app.ts`, `backend/src/artefact-agent.ts`, a new small recipe/streaming helper, `frontend/src/pages/Artefacts.tsx`, `frontend/src/pages/artefact/ArtefactModal.tsx`, and a streaming body/skeleton component near `ArtefactBody.tsx`.

## Verification

Add focused checks alongside existing backend tests and manually test the browser flow:

- `start` has an allowed category and unique, recipe-valid section IDs.
- Section payloads that do not meet their schema are never emitted as ready.
- Events from stale generation IDs cannot update the current view.
- Cancellation aborts upstream work and does not persist a new artefact.
- Final `complete` replaces the temporary shell with the same ordered document used for storage.
- Generic/free-form, GitHub PR, Google source, failure, network disconnect, and revision paths each show useful state.
- Keyboard, screen reader, narrow viewport, reduced-motion, shared/private access, and snapshot behavior remain correct.

Measure time to shell and time to usable result before and after. A faster-looking shell that delays final artefacts or increases invalid generations is not an improvement.

## Release sequence

1. Build the streaming rendering layer behind a feature flag using a static local shell fixture.
2. Send the Phase 1 `start` event from create/revision routes and render skeleton wrappers while preserving atomic final completion.
3. Add deterministic PR-review shell from recipe selection and test it with real PR fixtures.
4. Expand to preset/general shells and improve skeleton shapes from observed layout shifts.
5. Decide whether Phase 2 true section streaming earns its extra model-call and coordination cost from measured user benefit.
6. If approved, add plan/fill section generation with per-section validation, final reconciliation, and explicit cancellation/retry behavior.

## Acceptance criteria

- A user sees the correct artefact shell promptly after submission.
- Every shell wrapper is supported by the selected recipe or an honest generic fallback.
- No partially parsed JSON, unvalidated block, or incomplete artefact is written to the database or exposed through sharing.
- Completed sections remain stable while later sections load or fail.
- Final output has the same validation, access, revision, and snapshot behavior as a non-streamed artefact.
- The client handles cancellation, retries, stale events, and reduced motion cleanly.
