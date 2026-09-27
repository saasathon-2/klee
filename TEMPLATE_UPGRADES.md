# Klee template and generation upgrades

_Prepared 2026-09-27 from the current schema-driven generation flow. This roadmap makes artefacts more intentional, consistent, visual, and grounded without replacing the existing renderer, block catalogue, or validation boundary._

## Current generation flow

Today, Klee takes a user prompt plus selected context and sends it to one structured-output model turn. The turn selects a `developer-page` or `generic-page`, a title/header, and one to eight blocks. Backend Zod schemas validate the result; `toDocument` removes empty blocks, repairs a few recoverable shapes, validates diagram references, inserts one editorial glue block for larger artefacts, and stores the resulting document tree. The frontend renders that tree through a broad, typed catalogue.

This is a strong foundation. The current system already has:

- Trusted, reusable visual blocks for code, PR reviews, commits, checks, Git history, architecture, dependencies, impact, work, delivery, risks, evidence, decisions, trends, incidents, and handoffs.
- Rules that prefer specialised blocks over prose, avoid invented source facts, and constrain generic pages.
- GitHub PR context covering PR metadata, changed files/patches, reviews/comments, commits, and CI checks; selected Google Docs/Sheets contribute bounded note context and evidence references.
- Strict schemas, normalisation, version history, manual text editing, sharing, comments, and preview snapshots.

The next problem is not a shortage of blocks. It is that the model must infer the user’s goal, source confidence, template family, section order, and optional visuals in one step from a largely concatenated prompt/context string. That makes two artefacts about the same PR capable of looking materially different even when users expect the same dependable review surface.

## Product principles

1. **Intent before decoration.** First determine what the user is trying to decide, understand, or communicate; then choose a template and blocks.
2. **Stable core, relevant tail.** Recognisable artefact types have a fixed, useful spine. Context-specific sections are appended only when they earn their space.
3. **Evidence decides visuals.** A diagram is the default for sufficiently evidenced relationships, not an aesthetic reward for any technical prompt.
4. **One representation per question.** Do not show the same facts as prose, a table, and a chart unless each answers a different reader question.
5. **User intent wins.** An explicit request such as “only show CI”, “put the diff first”, “use two columns”, or “make this a handoff” overrides the normal template order where safe.
6. **Existing document tree is the contract.** Templates, compositions, and future components compile to the current typed nodes. Do not introduce a second page model.
7. **Safe and accessible motion.** Animation may clarify change or sequence, never hide facts, startle users, or make a document unusable when reduced motion is enabled.

## Target generation pipeline

| Stage | Responsibility | Smallest practical implementation |
| --- | --- | --- |
| 1. Gather | Fetch bounded, permission-checked user-selected and provider context. | Keep current GitHub/Google bounds; add typed source metadata alongside plain prompt text. |
| 2. Normalise | Convert provider records into source-agnostic facts, links, timestamps, and confidence. | Reuse current GitHub and Google normalisers; do not expose raw provider payloads to templates. |
| 3. Classify | Identify request intent, audience, desired depth, source types, explicit layout requests, and missing information. | Deterministic routing for known flows (GitHub PR webhook, selected Google files); a compact structured planning pass only for ambiguous free-form prompts. |
| 4. Select skeleton | Pick an artefact family, ordered required sections, permitted optional sections, and a visual budget. | Backend-owned template recipes keyed by intent/source; user wording can request a supported override. |
| 5. Fill | Ask the model to populate the skeleton only with grounded data, flagging unknowns rather than filling gaps. | Reuse current strict block schemas and model call, but constrain output to the selected recipe. |
| 6. Validate | Check schema, evidence links, required core sections, order, duplicates, and visual eligibility. | Extend `toDocument` with recipe validation; keep existing empty-block and graph checks. |
| 7. Present | Render a readable document and a compact preview; show sources and update state. | Reuse renderer/snapshot path and current editing/version flows. |
| 8. Learn | Measure successful completion, manual changes, and regeneration without storing unnecessary source content. | Log recipe id, block choices, validation repairs, latency, and anonymised outcome events. |

For P1, avoid a compulsory second model request. Known entry points already convey strong intent: a GitHub PR refresh is a PR artefact; a selected Jira board is a delivery artefact; an incident source is an incident artefact. Use deterministic route selection there. Introduce a small planner only when a free-form request genuinely has competing interpretations, and return its plan in a schema that can be inspected and tested.

## Intent and context contract

Before a model fills content, represent the request as a compact internal brief. It is not user-facing and must never be trusted as evidence on its own.

```ts
type GenerationBrief = {
  intent: "pr-review" | "change-brief" | "release" | "incident" | "delivery" | "handoff" | "architecture" | "decision" | "general";
  audience: "author" | "reviewers" | "engineering-team" | "leadership" | "mixed";
  depth: "quick" | "standard" | "deep";
  requested: { blocks: string[]; layout?: "single" | "two-column"; visuals?: "auto" | "prefer" | "avoid" };
  sources: Array<{ kind: string; id: string; url?: string; freshness?: string; confidence: "direct" | "derived" }>;
  recipe: string;
};
```

This is deliberately small. It should describe the prompt and available evidence, not reproduce it. The user’s literal constraints (for example, “compare these two options” or “no diagram”) remain visible to the filling turn. Provider facts retain their source URL/ID so blocks can cite them.

### Prompt understanding improvements

- Parse explicit instructions before classification: requested output type, audience, time window, decision to make, desired length, blocks/layout, and prohibitions. An explicit request is stronger than a heuristic.
- Keep user intent, provider data, and system instructions in clearly delimited fields/messages rather than one long interpolated string. Mark connected content as untrusted reference material that cannot change system behaviour.
- Create concise source summaries before generation when a source is large: changed-file facts, review consensus, check roll-up, work-item counts, and timestamps. Preserve raw bounded excerpts only where a block needs them (for example a code diff).
- Track source freshness. A live PR/check artefact should name the latest refresh time and distinguish current check status from the generated narrative.
- Ask one targeted clarification only when it would change the output family materially and no sensible default exists. Otherwise use the best known recipe and show missing fields/unknowns honestly.
- Let the user choose a visible “Make a…” mode later (review, plan, handoff, decision) as a shortcut, but do not require it to get a good result.

### Grounding policy

- Every factual block item must be attributable to direct user text or a normalised connected record. URL-capable blocks receive the source link whenever available.
- Derived statements must be phrased as assessment, not fact: “The checks indicate…” rather than “The change is safe.”
- Unknown owner, date, risk, relationship, and status remain `null`/omitted. Never create visually convincing fake certainty to complete a template.
- If context cannot support a required section, retain the section only when an explicit “Not provided” state helps the decision; otherwise omit it and record the reason in internal telemetry.

## Recipe system: consistent artefacts with relevant extensions

A recipe is backend-owned data: intent/source match, ordered required block slots, optional slots with eligibility rules, category, maximum visual density, and user-override policy. It is not a new frontend renderer and it is not an LLM-generated template definition.

All recipes follow this order:

1. Header: title, one-sentence answer, source/freshness, tags.
2. Decision or orientation: what matters now.
3. Evidence and visual explanation: primary source-specific blocks.
4. Implications: risk, impact, ownership, or delivery state when supported.
5. Actions: next steps, links, or handoff.
6. Optional appendix: additional relevant blocks, never inserted ahead of the core narrative.

`glue` remains an editorial transition only. It must not become an accidental substitute for recipe sectioning; recipes define order and headings explicitly.

### PR artefact recipes

PRs are the highest-value consistency target because the current GitHub path reliably supplies PR metadata, files, reviews, commits, and checks.

| Recipe | Required ordered core | Append only when evidence supports it | Rules |
| --- | --- | --- | --- |
| PR review | Summary/prose, metric row (scope + review/check state), code diff, review comments, check list, delivery readiness, next steps | Change-impact map, software/dependency diagram, commit list/Git graph, evidence table | Diff focuses on key changed files, not all files. Readiness comes after detailed checks. |
| PR change brief | Summary/prose, metric row (scope), code diff, change-impact map or architecture diagram, test/check list, next steps | Review comments, commits, dependency graph | Use when user asks what changed or how it works, rather than whether to merge. |
| PR merge decision | Summary/prose with clear decision, check list, review comments, delivery readiness, next steps | Code diff, impact map, risks, evidence table | Lead with the decision and blockers; do not bury failed checks below a diagram. |
| PR release handoff | Summary/prose, release timeline or handoff brief, check list, change impact, next steps | Git graph, risks, ownership/runbook, decision record | Use when the audience is release/on-call, not routine reviewer feedback. |

For every PR recipe, additional blocks belong after the required spine in this order: source-specific detail, system impact, delivery/risk, then appendix/reference. A model may not reorder the required core merely because it found an optional block it likes.

### Other first-class recipes

| Recipe | Stable core | Optional extensions |
| --- | --- | --- |
| Architecture/change | Direct answer, software diagram or architecture flow, dependency graph/change impact, decision/risks, next steps | Evidence table, ownership, code diff |
| Delivery/sprint | Orientation, delivery progress, work-item board or sprint timeline, blockers/risks, next steps | Activity trend, ownership, decision record |
| Incident | Impact and current status, incident timeline, confirmed/suspected cause, mitigations/follow-ups, handoff | Activity trend, ownership/runbook, evidence table, decision record |
| Release readiness | Readiness verdict, check list, delivery readiness, release timeline, next steps | Change impact, risks, ownership, trend |
| Handoff | Handoff brief, current work/risks, source links, next actions | Board, timeline, ownership, evidence table |
| Decision | Decision question, options/decision record, evidence, consequences/risks, review date/next action | Architecture diagram, trend, two-column evidence/detail |
| General brief | Direct summary, one best-fit specialised block or prose, next steps | Metric row, flowchart, evidence table |

Recipes should be versioned (`pr-review/v1`) and persisted with generated artefacts. This allows a later recipe improvement to be trialled on new generations without mutating historical documents or making a version diff impossible to interpret.

## Visual system and diagram policy

Klee should become more visual by improving information compression, not by adding illustration for its own sake.

### Use existing visuals more deliberately

- **Code diff:** show the smallest representative set of changes, with a concise narrative before it. Do not emit a large diff simply because patches are available.
- **Review comments and checks:** present as parallel evidence of merge confidence; pair in two columns only when both are compact and the viewport remains readable.
- **Software diagram / architecture flow:** use when the source establishes at least two components and their relationships. Prefer `architecture-flow` for 2–3 linear stages; use a graph for multiple dependencies/cycles.
- **Git graph:** use only when commit parent relationships establish branch/merge topology; otherwise use a commit list.
- **Dependency graph vs. change-impact map:** use the former for what a component depends on and its health, the latter for what the proposed change affects. Do not show both unless they answer different questions.
- **Timeline/chart:** use only supplied dated events or values. A compact chart needs a stated unit, a readable legend, and a non-visual textual summary for accessibility.
- **Two columns:** pair one primary visual with its immediately relevant evidence, not unrelated panels. Collapse to a sensible reading order on mobile.

### Visual eligibility and budget

- Standard artefacts get at most one primary diagram/chart and one supporting compact visual before the appendix. Deep artefacts may add one more only when each represents distinct evidence.
- A PR with one changed file and no established system relationships normally needs diff + checks/review, not an architecture diagram.
- A multi-service PR or an architecture prompt with sourced dependencies should normally include one appropriate diagram unless the user says to avoid visuals.
- Before rendering a diagram, validate minimum node/edge evidence, unique IDs, referential integrity, node URL provenance, size limits, and a readable fallback summary. The backend already validates several of these; recipes make their selection deterministic.
- Every visual gets a concise title and text alternative. Do not rely on colour alone for status, causality, or health.

### New block candidates, in order

1. **Source/citation strip:** linked source chips plus generated/refresh timestamp. This improves trust across every recipe more than a new decorative widget.
2. **PR summary panel:** a compact visual roll-up of scope, review consensus, checks, and merge recommendation. It should be a stable composition of current metric/review/check/readiness data before becoming a new block.
3. **Change narrative / file map:** only if real PR tests show users cannot understand multi-file changes from current diff + impact blocks.
4. **Media embed block:** an explicitly attached, sanitised image/video with caption, transcript/description, source URL, permissions, loading state, and responsive fallback. This is not model-generated arbitrary media.

Do not add a generic “card”, carousel, hero animation, or chart type without a source-backed question that current blocks cannot answer.

## Motion, animation, and future video

Motion can help diagrams explain sequence, but it must remain optional and purely presentational in early versions.

### Near term: progressive enhancement

- Add subtle, CSS-only staged highlighting for supported diagrams: trace a selected dependency path, reveal a flowchart edge after a user action, or animate status transitions on refresh.
- Default to a static, fully informative first frame. Respect `prefers-reduced-motion`; provide pause/replay controls whenever motion runs longer than a brief transition.
- Do not couple meaning to animation timing. A screenshot, exported PDF, and screen reader must preserve the same conclusion.
- Cap animation complexity and avoid layout shifts so generated artefacts stay fast in share previews and on mobile.

### Later: media/video decision gate

Consider narrated or generated video only after static/template quality is proven and the product can support: explicit user initiation, visible generation cost/progress, source attribution, media moderation, duration/size caps, captions/transcript, poster image, download/export rules, provider failure states, privacy/retention controls, and a static artefact fallback. Video must be an optional companion to a structured artefact, never the sole record of a decision or incident.

Do not execute model-generated scripts, embed arbitrary third-party iframes, or make autoplay the default.

## Implementation roadmap

### P0 — establish repeatability (first)

- Build a fixed corpus of representative inputs: small/large PRs, failing/pending/passing CI, review disagreement, architecture request with/without evidence, delivery board, incident, release, handoff, Google notes, and ambiguous prompts.
- For each corpus entry, define expected intent, recipe, required blocks/order, prohibited blocks, source grounding, and whether a diagram is eligible. Store concise fixtures, not production customer data.
- Add `recipeId` and generation brief metadata to the artefact/version record using a new migration. Keep raw context out of this metadata.
- Implement deterministic routing for existing GitHub PR generation and user-explicit artefact modes. Keep current unconstrained selection as the fallback while recipes are in shadow evaluation.
- Extend backend tests to assert recipe order, mandatory core sections, duplicate prevention, user override precedence, and diagram eligibility in addition to existing schema checks.

Success criteria: the same PR context reliably yields the same core order and never loses review/check/readiness evidence to optional decoration.

### P1 — ship PR template families

- Implement `pr-review/v1`, `pr-change/v1`, and `pr-merge-decision/v1` as backend-owned recipes mapping to current blocks.
- Present a small chooser only when the user starts from a generic PR link; webhook-generated PR artefacts default to PR review and can be switched/regenerated deliberately.
- Constrain fill output to the selected recipe’s required and eligible optional slots; append eligible extras after the core.
- Add source/freshness display and a compact PR summary composition. Test shared/private previews and CI refresh behaviour.

Success criteria: reviewers can scan every PR artefact in the same order and locate the merge decision, checks, comments, and key code change immediately.

### P2 — expand recipes and visual quality

- Add the architecture, delivery, incident, release, handoff, and decision recipes in that order, only when their fixture corpus is ready.
- Improve diagram selection and accessibility; add CSS-only progressive highlights behind a reduced-motion-safe feature flag.
- Introduce a citation strip and only the new block candidates justified by observed editing/usage data.
- Allow users to save a preferred recipe/preset, reusing the roadmap’s existing preset/component work rather than creating another template store.

Success criteria: artefact type is predictable enough that a team recognises its purpose before reading every word, while optional source-specific insight still appears when valuable.

### P3 — adaptive and custom compositions

- Connect the safe “vibeable components” work to recipes: users can request an optional component, preview it, and save it only as a composition of trusted blocks.
- Permit recipe-level slots for approved custom compositions; they remain below the stable core unless the user explicitly moves them.
- Consider planner-assisted routing for ambiguous prompts after deterministic routing and fixtures expose real misclassification cases.
- Revisit media/video only at the decision gate above.

## Evaluation and release gates

| Dimension | Check | Release bar |
| --- | --- | --- |
| Consistency | Same fixture and recipe preserves required section order. | 100% in deterministic test corpus. |
| Grounding | Fact/link fields correspond to supplied source records. | No invented source URLs, dates, owners, or checks. |
| Relevance | Optional blocks add a distinct question/answer. | No duplicate representation in reviewed fixture outputs. |
| Visual quality | Diagram/chart meets evidence and accessibility policy. | Static fallback and text alternative always present. |
| User control | Explicit block/layout/type request is honoured or clearly explained. | No silent override of supported request. |
| Resilience | Partial/empty provider data still produces a useful truthful artefact. | Required missing-data behaviour verified. |
| Performance | Generation/preview remains responsive at current context bounds. | Measure latency and payload before enabling richer motion/media. |

Review sampled artefacts with a simple human rubric: direct answer first, consistent core order, correct source facts, useful visual/no gratuitous visual, clear next action. Feed recurring failures into the specific recipe/eligibility rule rather than endlessly expanding the global prompt.

## Guardrails and non-goals

- Do not move template ordering solely into prompt prose; enforce recipe order in backend validation so it survives model variation.
- Do not create one giant universal template. A small set of purpose-built recipes plus a general fallback is easier to test and revise.
- Do not create a new design system or renderer. Current catalogue, category pages, two-column layout, document patches, version history, and snapshots remain the foundation.
- Do not create diagrams from filenames, guessed dependencies, or generic architecture tropes. Missing relationship evidence means no graph.
- Do not use animation/video to compensate for unclear information architecture.
- Do not make raw connected-source data publicly visible through share links. Access, revocation, snapshot, and export checks remain mandatory.

## Suggested first three work items

1. **Recipe test corpus and PR review contract:** define fixtures plus required/optional order and add backend assertions. This turns “consistent PR template” into an enforceable behaviour.
2. **Deterministic PR routing:** have the existing GitHub PR generation select `pr-review/v1`, fill the established core, and append only evidence-eligible blocks.
3. **Visual/source polish:** add a provenance/freshness strip and improve the existing PR summary composition before adding any new diagram or media block.

This sequence enriches what Klee already generates while keeping the shortest path: trusted data in, stable structured artefacts out, and richer visual language only where it materially improves the decision.
