# Development notes index

These notes expand the proposals in [NEXT_STEPS.md](../NEXT_STEPS.md) and [TEMPLATE_UPGRADES.md](../TEMPLATE_UPGRADES.md) into implementation-sized workstreams. They describe options and sequencing; they are not all approved commitments.

## Workstreams

| Note                                                                           | Covers                                                                         | Suggested order               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------- |
| [01_Reliability_and_Quality.md](01_Reliability_and_Quality.md)                 | Release checks, generation failures, quality fixtures, minimal product signals | First                         |
| [02_Recent_Artifacts_and_Search.md](02_Recent_Artifacts_and_Search.md)         | Recent cards/previews, bounded feed, workspace search                          | First user-facing improvement |
| [03_Templates_and_Presets.md](03_Templates_and_Presets.md)                     | Curated recipes as creation presets, duplicate/save/reuse                      | After recent work             |
| [04_Vibeable_Components.md](04_Vibeable_Components.md)                         | Prompt-built trusted block compositions and constrained editing                | After recipes prove reuse     |
| [05_Integrations_and_Context.md](05_Integrations_and_Context.md)               | Slack/Jira context ingest, source mapping, provider roadmap                    | One source at a time          |
| [06_Collaboration_and_Lifecycle.md](06_Collaboration_and_Lifecycle.md)         | Archive/pin/duplicate/export/activity/notifications                            | As repeated team use appears  |
| [07_Generation_Intent_and_Grounding.md](07_Generation_Intent_and_Grounding.md) | Better prompt interpretation, typed context, evidence and source freshness     | Foundation for template work  |
| [08_Consistent_Artifact_Recipes.md](08_Consistent_Artifact_Recipes.md)         | Stable PR and other artefact section order with optional appendices            | PR recipe first               |
| [09_Visuals_Motion_and_Media.md](09_Visuals_Motion_and_Media.md)               | Diagram policy, visual density, accessible motion, possible video              | Static quality first          |
| [10_Discipline_Expansion.md](10_Discipline_Expansion.md)                       | Electrical/civil/chemistry/maths or other product verticals                    | Separate product decision     |
| [11_Branch_Hygiene.md](11_Branch_Hygiene.md)                                   | Review, salvage, close, or prune hanging branches                              | Small housekeeping task       |

## Suggested dependency path

```text
01 Quality baseline ──┬──> 02 Recent work ──> 03 Presets ──> 04 Components
                      └──> 07 Intent/grounding ──> 08 Recipes ──> 09 Visuals
                                                └──> 05 Integrations
06 Lifecycle can follow demonstrated team usage; 10 requires a product decision.
11 Branch review can be done independently.
```

## Shared implementation rules

- Reuse the existing artefact document tree and renderer. The backend validates generated blocks in `backend/src/artefact-agent.ts`; the frontend model and catalogue live under `frontend/src/artefacts/`.
- For any new block, update the frontend model, renderer/catalogue, backend schema and allowed sets, agent instructions, and a nearby backend test together.
- Keep connected-source data bounded, attributable, permission-checked, and free of secrets. Preserve source identifiers/links without storing opaque provider payloads unnecessarily.
- Add persistence with a new timestamped migration; migrations already on `main` are immutable.
- Start with deterministic rules at known entry points, and add model planning or infrastructure only where a measured failure calls for it.
- Make accessibility, keyboard use, mobile layout, permission checks, and truthful empty/error states part of each workstream’s acceptance criteria.

## Status

All notes are proposals. No feature implementation or branch mutation is implied by creating this folder.
