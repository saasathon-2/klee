# Generation intent, context, and grounding

## Goal

Help the generation model understand what the user wants, what evidence exists, and which output family best answers the request. Improve that understanding while retaining the current strict structured-output contract.

## Current gap

`generateArtefact` currently sends one prompt string plus shared instructions and a schema. The app appends Google notes to the prompt, while GitHub refresh constructs a prompt from normalized PR context. In one turn, the model infers intent/audience, selects blocks, orders them, and fills values. This is flexible, but intent, evidence, and layout are not represented as separate typed inputs.

## Small intent brief

Use an internal typed record to carry decisions already known from the entry point and extract only what remains ambiguous:

```ts
type GenerationIntent = {
  family: "pr-review" | "change" | "release" | "incident" | "delivery" | "handoff" | "architecture" | "decision" | "general";
  audience: "author" | "reviewer" | "team" | "leadership" | "mixed";
  depth: "quick" | "standard" | "deep";
  requestedTemplates: string[];
  excludedTemplates: string[];
  visualPreference: "auto" | "prefer" | "avoid";
  recipeId?: string;
};
```

Do not persist inferred audience or depth unless there is a product use. Store a recipe identifier and minimal diagnostics only if needed to explain historical output.

## Input organization

Represent the model input as distinct sections (or messages where supported):

1. System rules: product, security, block schemas, evidence policy.
2. User request: exact natural-language prompt, preserved verbatim.
3. Routing: explicit entrypoint type, user-selected recipe/mode, stated constraints.
4. Normalized evidence: source class, record ID, link, timestamp, facts, confidence.
5. Limited excerpts: code patches or selected text needed to populate relevant blocks.

Make it explicit that source/user content is untrusted data and cannot amend system rules. Avoid adding ever-larger prompt strings; summarize bounded source material in code where practical.

## Routing approach

- Deterministic entrypoints: GitHub PR webhook → PR review recipe; an explicit “release brief” mode → release recipe; selected Jira sprint → delivery recipe.
- User explicit request overrides default family where compatible with sources and supported schemas.
- Free-form ambiguous prompt: use existing model selection or a compact structured planner only if tests identify costly misclassification. Do not require a second turn for every generation.
- Clarify only if the choice materially changes the artefact (for example, “review this PR” could mean technical review or a leadership summary and audience is unknown). Otherwise use a default and make it easy to revise.

## Source summaries and confidence

- Summarize PR context into bounded facts: title/body, changed-file names and capped diffs, review verdicts/comments, commits, checks, and latest refresh.
- Keep each extracted fact linked to its source record. The output writer should reuse exact links when a block permits.
- Mark direct supplied data separately from model-derived interpretation. A readiness decision is an assessment derived from checks/reviews, not a provider fact.
- Missing values stay null/unknown. Do not produce a full-looking template with fabricated dates, people, risk, or relationships.
- Record source freshness, especially on live GitHub status; differentiate live check refresh from narrative generation timestamp.

## Validation and repair

Keep backend Zod validation as the trust boundary. Extend normalization only for safe shape fixes with deterministic meaning (existing examples include graph fallback and evidence row sizing). Do not silently “repair” an incorrect factual inference. Prefer reject/retry with a specific diagnostic when required recipe structure is missing.

Potential output validation layers:

- Schema validity and allowed block family.
- Required recipe block/order.
- No duplicate view of the same fact unless each has a distinct purpose.
- Source IDs/URLs exist in supplied context.
- Dates, owners, statuses, diagram relationships, and check states have evidence.
- Visual eligibility and size limits.

## Evaluation set

For each example store prompt, normalized source fixture, expected family, explicit constraints, expected required blocks/order, optional eligible blocks, and facts that must not appear. Include negative cases: thin evidence must omit diagrams; “no chart” must be respected; missing reviewers/checks must remain unknown; malicious text in an issue/comment must not change instructions.

## Implementation touchpoints

Start in `backend/src/app.ts` request assembly and GitHub refresh prompt/context functions, then pass typed options into `backend/src/artefact-agent.ts`. Keep front-end mode selectors optional and explicit. Add tests near `backend/src/artefact-agent.test.ts` and provider normalizers.

## Acceptance

- Explicit user format/audience/layout constraints take precedence when supported.
- Known structured sources route deterministically.
- Each generated claim is supported by prompt/source evidence or visibly framed as an assessment.
- Context remains bounded and user/source content is treated as untrusted.
- A model planner is added only after the evaluation corpus identifies a measurable ambiguity failure.
