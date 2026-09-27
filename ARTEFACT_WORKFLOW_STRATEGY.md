# Artefact Workflow Strategy

## Decision

Position Klee as the asynchronous explanation layer for engineering work, not an AI page generator.

Loom makes it cheap to explain work without scheduling a meeting. Klee should make it cheap to give a teammate the evidence, system context, and required decision without making them reconstruct the story across GitHub, Jira, Slack, and operational tools.

An artefact succeeds when a person other than its author can understand a situation faster and take the intended action. A polished summary that does not change a decision or action is not a useful product outcome.

## Product thesis

Engineering work already produces fragments: a ticket explains intent, a pull request contains implementation, CI contains verification, Slack contains decisions, and a runbook contains operational context. The reader has to assemble those fragments mentally.

Klee turns selected, attributable fragments into a short, living walkthrough for a specific person and job. It should be the place to answer the question that none of the individual source tools can answer alone:

> What does this mean, what is the evidence, and what do I need to do next?

The artefact is not a replacement for source tools. GitHub remains the best place to inspect every line of a diff and commit. Jira remains the system of record for work. Klee adds the cross-source explanation and decision layer.

## The artefact quality bar

Every generated artefact must make five things immediately clear:

| Requirement | Reader-facing question              | Example                                                           |
| ----------- | ----------------------------------- | ----------------------------------------------------------------- |
| Job         | What am I here to do?               | Review this change, approve this release, take an on-call handoff |
| Audience    | Who was this made for?              | Reviewer, delivery lead, on-call engineer, future maintainer      |
| Story       | What is the causal narrative?       | Why this exists, what changed, and what it affects                |
| Action      | What happens next, and who owns it? | Approve, investigate, notify an owner, monitor, decide            |
| Freshness   | Can I trust this now?               | Source links, current status, and what changed since my last view |

The standard narrative is:

`Why → What changed → What it touches → Proof / uncertainty → Decision → Next owner`

This is the structured, source-linked equivalent of a good Loom recording. It is more skimmable, updateable, and durable than a video while retaining the essential walkthrough: a person can see the intent, consequence, evidence, and ask in one place.

## Initial product families

Do not create one generic artefact experience with many optional blocks. Ship three recognisable walkthroughs, each with a stable job and reader.

| Walkthrough         | Primary reader and job                                    | Lead with                                                              | Valid sources                                                          | Keep as evidence or appendix                          |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Change walkthrough  | Reviewer or affected team: understand and assess a change | Intent, system/contract impact, key risk, validation, merge/review ask | PR, linked ticket, repository map, CI, release/deploy status           | Full diff, commit history, raw CI detail              |
| Decision brief      | Team or lead: make a decision asynchronously              | Question, recommendation, options, evidence, owner, deadline           | Ticket, selected docs, Slack thread, incident/release context          | Background material that does not affect the decision |
| Operational handoff | On-call or delivery owner: safely continue work           | Current state, what changed, known risk, watchpoints, next operator    | Slack thread, incident data, deployment/observability, runbook, ticket | Historical detail without a current action            |

A PR-generated artefact is a change walkthrough. It is an important automatic entry point, but it must not define the entire product.

Later families, such as architecture/change, delivery status, release readiness, incidents, and design decisions, should only be added when they satisfy the same quality bar and have a repeated user workflow. Existing supported blocks can compose these families; adding a block is not a product strategy.

## Product experience

### Start with a job, not a blank page

At creation, Klee should know or ask for the smallest useful intent:

- purpose: review, change explanation, decision, handoff, release, incident, delivery, or architecture;
- audience: author, reviewer, team, leadership, on-call, or mixed;
- depth: quick, standard, or deep;
- explicit inclusions/exclusions, such as “no diff” or “include deployment risk”; and
- the selected evidence and freshness expectation.

Known entry points route deterministically. A GitHub webhook starts a change walkthrough; a selected Jira sprint starts a delivery view; a Slack incident thread starts a handoff or incident view. An explicit user choice overrides a default when the available evidence supports it. Ambiguous free-form prompts can use the general path until evaluation proves a planner is needed.

The generator should fill an approved, backend-owned recipe rather than invent the purpose, audience, layout, and content in one turn. Recipes define a required order, evidence gates, and allowed optional sections. The model writes and selects facts within that contract; the application validates it.

### Make the reader experience active

The first screen answers the job in seconds:

1. Current recommendation or state.
2. The few reasons that justify it, with links to evidence.
3. The affected people or systems when grounded context establishes them.
4. One clear next action and owner.
5. Freshness and a concise “changed since last update” section.

Raw source views remain one click away. They should not lead unless the reader explicitly asks for a technical deep dive.

The owner can revise the walkthrough, correct its interpretation, and create a visible revision. A revision must not silently turn a review brief into a release handoff; changing family or recipe is a deliberate, visible action.

### Distribute work, not pages

Klee belongs where the decision occurs: a PR, ticket, Slack thread, release channel, or handoff surface. An integration update should be sparse and useful:

> Merge decision changed to waiting: CI is now green; Payments acknowledgement is still needed for the API contract change.

Do not post an update for unchanged material or merely because a refresh ran. A link and visual preview are secondary to the changed verdict, risk, or action. The full artefact remains the durable context behind that update.

## Grounded system context

Useful impact and architecture views cannot be reliably inferred from filenames or a PR patch. Decorative diagrams reduce trust.

Build a small, curated repository map before promising automatic architecture explanation. It can begin with explicit services, dependencies, contracts, owners, runbooks, and CODEOWNERS-derived ownership where available. A change walkthrough may show an architecture or impact diagram only when its changed files and source facts establish a relationship to that map.

When the evidence is insufficient, say that impact is unknown or omit the diagram. Preserve the distinction between a supplied fact and Klee’s assessment. Every factual operational or work item should link back to a source the viewer is entitled to access.

Integrations are therefore context providers, not badges:

- GitHub provides implementation, checks, reviews, and PR lifecycle.
- Jira or equivalent work tracking provides intent, acceptance criteria, priority, and delivery ownership.
- Slack provides discussion, handoffs, and the decisions that are otherwise lost in conversation.
- Deployment, observability, and runbooks provide operational state, watchpoints, and recovery context.
- Docs provide architecture, decision history, and explicitly selected supporting evidence.

Add one source only when it supplies a missing, repeated part of a walkthrough. Do not index whole workspaces or add provider-specific pages that bypass the common evidence model.

## Living artefacts and automation

An automated artefact should become more useful as work moves, not be a new static report on every event.

- Keep a stable artefact for the underlying PR, incident, release, or decision.
- Compare source facts with the prior revision and surface only material deltas: a changed recommendation, new blocker, resolved risk, new review, failed check, changed owner, or changed rollout state.
- Distinguish live source status from the time the explanatory narrative was generated.
- Preserve history so a reader can answer “what changed, when, and why?”
- Require a user-visible refresh policy for noisy integrations. Coalesce transient events and wait for known settling states such as CI completion.

This turns automation into a sanity check and an ongoing shared context, rather than an unsolicited AI summary.

## Go-to-market and positioning

Start with teams that already pay the coordination cost: product engineering teams with multi-service changes, distributed reviews, release ownership, or on-call handoffs. The message is not “generate beautiful engineering documents.” It is:

> Make the next engineering decision without a meeting or a scavenger hunt.

Demonstrate this with one concrete before/after story per walkthrough:

- A reviewer sees intent, contract impact, validation, and the unresolved ask without reading every PR comment first.
- A lead receives a decision brief that names the recommendation and evidence, instead of a long Slack thread.
- An on-call engineer receives a live handoff with current state and watchpoints, rather than a pile of links.

Use the PR integration as an acquisition and habit loop: an embedded, useful change walkthrough introduces Klee to reviewers. The broader value comes when the same team also uses decision briefs and handoffs. Do not lead marketing with AI-generated diagrams or a generic prompt canvas.

Pricing should follow demonstrated recurring team value, not document generation volume. Validate a team-oriented paid boundary around connected sources, durable shared walkthroughs, refresh/history, and team recipes only after teams repeatedly use the same workflows. Avoid a premature per-page or decorative-feature pricing model.

## Metrics and decision gates

The north-star metric is:

> The share of artefacts opened by someone other than the author that lead to the intended action being completed.

Track the smallest supporting funnel using existing telemetry/logging before adding an analytics product:

| Stage            | Measure                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Creation quality | Generation completed, required evidence present, no unsupported architecture/ownership claims             |
| Reader value     | Non-author open, time to first meaningful action, source-link use, follow-up question avoided or resolved |
| Workflow outcome | Review approved/changes requested, decision recorded, handoff acknowledged, release gate resolved         |
| Retention        | Team creates or revises the same walkthrough family again; artefact is reopened after a source update     |
| Trust            | Manual corrections, regeneration rate, source freshness failures, unsupported-claim reports               |

Do not optimise creation count, block count, time on page, or shares in isolation. Those can increase while usefulness falls.

## Delivery plan

### Phase 0: prove the quality bar (2 weeks)

1. Assemble representative fixtures for PRs, decisions, handoffs, thin-evidence cases, and malicious/untrusted source text.
2. Define expected job, audience, required sections, acceptable optional evidence, forbidden claims, and intended action for each fixture.
3. Audit current generated artefacts against the five requirements. Identify duplication and unsupported inferred architecture.
4. Instrument creation, completion/failure, non-author opening, revision, source refresh, and outbound-context use.

Exit: the team can evaluate whether a generated artefact helps a defined reader complete a defined action.

### Phase 1: make one change walkthrough indispensable (4–6 weeks)

1. Add a backend-owned `change-walkthrough/v1` recipe and a small typed generation intent.
2. Make the default PR result a merge/review decision: recommendation, blockers/risks, affected contracts/systems when evidenced, validation, next owner/action, and freshness.
3. Move code diffs, commit history, and raw checks behind evidence links or an appendix. Do not create a git graph by default.
4. Add a stable “changed since last update” section and only post a PR update when the verdict, blocker, risk, or action changes.
5. Test recipes and output validation against the fixture set; reject or retry missing required structure rather than silently producing a generic report.

Exit: reviewers reopen the artefact after meaningful PR updates, and teams report that it reduces context reconstruction before a merge decision.

### Phase 2: ground impact and reuse the model (4–8 weeks)

1. Pilot a bounded repository map for a small number of repositories: services, contracts, dependencies, owners, runbooks, and source links.
2. Add grounded change-impact views only for mapped evidence; omit them otherwise.
3. Ship the decision brief and operational handoff recipes using selected Slack, ticket, doc, and runbook context.
4. Add explicit audience and walkthrough-type controls to the composer and revision flow, without requiring them for known automatic entry points.

Exit: at least one team uses more than one walkthrough family in a repeated weekly workflow.

### Phase 3: scale only proven workflows

1. Add the next integration only where it closes a verified evidence gap for an existing walkthrough.
2. Package successful recipes as team presets with source requirements and clear ownership.
3. Validate the paid team boundary from recurring shared-workflow usage.
4. Expand to release readiness, incident, delivery, and architecture families only when their source quality and reader action are defined.

## Explicit non-goals

- A generic prompt-to-page experience as the primary product proposition.
- Filling an artefact with every available block to make it appear comprehensive.
- Architecture diagrams inferred from filenames, patches, or unstated relationships.
- Workspace-wide ingestion, automatic indexing, or noisy refresh notifications.
- New rendering engines, arbitrary generated code, or a component marketplace before repeat workflow value is proven.
- Measuring success by pages generated, visual novelty, or superficial sharing.

## Immediate next decision

Approve Phase 0 and the `change-walkthrough/v1` scope. It is the smallest test of the thesis: can Klee turn an existing, high-frequency PR workflow into a source-grounded walkthrough that changes how a reviewer makes a decision? If it cannot, broader integrations and more blocks should wait.
