# Consistent artefact recipes

## Goal

Make artefacts of the same type recognizable and reliable. A recipe defines an ordered core of sections plus evidence-gated optional sections that follow the core.

## Recipe shape

Start with backend-owned configuration, not LLM-authored page definitions:

```ts
type Recipe = {
  id: string; // e.g. pr-review/v1
  category: "developer-page" | "generic-page";
  core: Array<{ slot: string; template: string; required: boolean }>;
  optional: Array<{ slot: string; template: string; evidence: string }>;
  maxVisuals: number;
  userOverrides: { order: boolean; include: boolean; exclude: boolean };
};
```

Implementation may choose a smaller concrete TypeScript type. Persist recipe ID/version on generation metadata only if historical interpretation or comparisons need it.

The generator fills selected slots. The backend orders core slots and appends eligible extras in configured groups. A generated `two-column` node counts as one section; its children must satisfy the recipe’s slot rules.

## First recipe: GitHub PR review

The webhook path already knows it is generating a PR artefact and supplies rich context. Use this stable order:

1. Direct summary and review framing.
2. Compact scope/status metrics when count/review/check evidence exists.
3. Key code diff.
4. Review feedback.
5. CI/check list.
6. Readiness assessment and blockers.
7. Next actions with source links.
8. Optional appendix in this order: system impact/diagram, commit/Git history, risk/evidence.

Required sections should be conditional on source availability. For example, an absent review should not become a fabricated “no concerns” block; the recipe can render an explicit missing-data line only if that fact matters to reviewers. Define those semantics per slot.

### Other PR modes

- **Change brief:** answer what changed; lead with summary, then diff, impact/architecture only where source establishes relationships, checks, next steps.
- **Merge decision:** lead with recommendation and blockers, followed by checks and review evidence; technical diff comes later or in appendix.
- **Release handoff:** lead with change/release state, then timeline/checks/impact, owner/runbook and next actions.

Selection: webhook-created artefact defaults to review. User prompt or a mode control can choose other modes. A follow-up prompt may change recipe, but applying the new recipe should create a visible revision.

## Additional recipes

| Family | Required reading path | Optional evidence-gated material |
| --- | --- | --- |
| Architecture/change | Answer → component/dependency diagram → impact/decision → next actions | Code diff, ownership, risks, evidence |
| Delivery/sprint | Status → board or timeline → blockers → next actions | Trend, ownership, decision |
| Incident | Current impact/state → timeline → known/possible cause → mitigation → handoff | Runbook/owner, evidence, trend |
| Release readiness | Verdict → checks → release timeline → blockers → actions | Impact, risks, ownership, trend |
| Handoff | Handoff brief → in-flight/risks → source links → actions | Board/timeline, ownership, evidence |
| Decision | Question → options/decision → evidence → consequences → review/action | Architecture, trend, risk |
| General | Direct answer → one best-fit block → next action | Metric, flowchart, evidence table |

## Building the recipe pipeline

1. Define fixtures and expected structure before adding recipe code.
2. Add pure recipe selection from entrypoint + explicit user intent + available evidence.
3. Supply selected recipe and eligible slot list to the model fill step.
4. Validate required slots, ordering, evidence rules, and duplicate blocks after schema parsing.
5. Reorder safe optional blocks deterministically; reject missing mandatory structure or unsupported output.
6. Keep a fallback general recipe during rollout and compare generated output in shadow mode where possible.
7. Version recipe IDs (`pr-review/v1`, then `/v2`) rather than rewriting old artefact documents.

Do not leave order solely in prompt prose: prompt variation is not a reliable ordering contract.

## User override policy

- Explicitly requested supported blocks should be included if evidence exists.
- Explicit exclusions should be honored unless the block is a necessary safety/accessibility explanation; explain if a required element cannot be removed.
- Users can request a different supported family. An unsupported family should degrade to a truthful general brief.
- Reordering the core can be a later editor capability; V1 should let model and backend guarantee stable order.

## Evaluation and acceptance

- Same fixture + recipe yields the same section sequence regardless of optional evidence ordering.
- Every required section has a clear missing-data policy.
- Optional sections appear only when evidence meets the recipe rule, and are appended after core.
- No duplicate summary of checks/reviews/impact without distinct reader value.
- Explicit supported overrides are honored.
- Version history records recipe-driven regeneration as a visible revision.

## Implementation touchpoints

`backend/src/artefact-agent.ts` already owns JSON schema and `toDocument`; add recipe eligibility/order there or in a nearby pure module. `backend/src/app.ts` knows whether generation is a webhook refresh or a user request. Frontend blocks remain unchanged for recipes that compose existing templates. New blocks require normal model/catalogue/schema/instruction/test updates.
