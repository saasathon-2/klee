# Klee development roadmap

_Prepared 2026-09-27 from `main` at `1434351`. This is an execution plan, not a commitment to build every idea. Klee's current advantage is turning connected engineering context into an editable, shareable artefact; next work should deepen that loop before broadening into a general-purpose editor._

## Current product baseline

Klee already supports the core loop:

1. A signed-in user creates an artefact from a prompt, pasted links, GitHub PR context, and up to five Google Docs/Sheets.
2. The backend asks the generation agent for a validated document tree and persists its revisions and manual edits.
3. The frontend renders a mature catalogue of engineering/delivery blocks: diffs, review feedback, commits, checks, flowcharts, software and dependency diagrams, timelines, work boards, risk/readiness, ownership, decisions, evidence, trends, and handoff briefs.
4. Users can organise artefacts in folders, share them with people or organisations, comment, inspect versions, and follow linked GitHub check status.

Existing integrations are GitHub App, Google Drive/Docs/Sheets, Slack, and Jira. The GitHub and Google paths are product-connected; Slack and Jira currently link out to installation pages, so making their context available to generation is a meaningful next integration milestone.

The main opportunity is discoverability and reuse. Artefacts are already valuable once created, but the home screen is centred on starting a new one. The next release should make it easy to reopen, understand, refine, and reuse work before introducing new content primitives.

## Product direction and sequencing

| Priority | Outcome                                | Why now                                                                 | Smallest useful release                           | Exit signal                                  |
| -------- | -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| P0       | Reliable existing workflow             | Avoid accumulating feature debt in an active, integration-heavy product | Release checks, error visibility, branch clean-up | Core flows work on a production-like account |
| P1       | A useful workspace home                | Let users return to valuable work instead of recreating it              | Recent artefact cards below the composer          | Users open/revise existing work regularly    |
| P2       | Repeatable artefact patterns           | Turn successful one-off artefacts into reusable starting points         | Saved presets and richer starter prompts          | Users create from a preset more than once    |
| P3       | Vibeable components, safely            | Let users request and tailor layouts without arbitrary code execution   | Prompt-generated compositions of trusted blocks   | Users save/reuse generated compositions      |
| P4       | Connected team operating system        | Bring planning and conversation data into the same artefact loop        | One real Slack or Jira ingest path                | Generated artefacts cite connected records   |
| P5       | Broader disciplines / advanced tooling | Expand only after the developer loop is measured                        | A separately validated vertical                   | Clear demand and a supportable quality bar   |

## Phase 0 — stabilise and make the roadmap measurable

Do this before new surface area. It is intentionally unglamorous, but it makes the later releases cheaper to operate.

- Run the documented backend tests/typecheck, frontend lint/build, and migration guard against the deployment configuration. Fix only failures that affect current workflows; do not perform a drive-by refactor.
- Add a short manual release checklist for: anonymous/shared/private access, GitHub App installation and PR generation, Google-file selection, revision/edit, comment creation, and mobile sidebar behaviour.
- Make generation failures actionable: preserve the source prompt/context, show a retry affordance, and record a redacted server-side failure reason. Keep secrets and raw provider tokens out of UI, logs, and artefacts.
- Instrument a minimal funnel before adding analytics machinery: artefact created, generation completed/failed, artefact reopened, follow-up revision submitted, share link opened, and integration context used. Use the application’s existing logging/telemetry destination if one exists; do not add an analytics vendor just for these events.
- Establish content-quality fixtures for the current agent schemas (GitHub PR, Google document, Google sheet, blank prompt). The existing `codex/github-context-fixtures` branch can inform the GitHub fixture work after review.

Success criteria: the team can answer which inputs lead to successful generations and whether users return to an artefact after creating it.

## Phase 1 — workspace home: recent artefacts and search

### Recent artefacts beneath the composer

Ship this first. It directly addresses the requested “recent artifacts” experience and reuses data that already exists (`title`, `description`, `icon`, project, folder, timestamps, and artefact content).

- Show 4–6 recently updated artefacts beneath the prompt on the empty/home state, sorted by `updatedAt` and excluding the currently open artefact.
- Each compact card should include icon/type, title, one-line summary, relative update time, project/folder context, and a preview. Clicking opens the artefact; keyboard navigation and an accessible label are required.
- Start with a deterministic preview: render an existing artefact thumbnail/summary from its document tree using the current renderer or a dedicated compact preview, not a second model call. Use the existing R2 snapshot path only if a visual screenshot is actually needed after testing the lightweight preview.
- Add loading skeletons and an empty state that keeps the composer as the primary action. On small screens, use a horizontally scrollable row or a short stacked list rather than shrinking cards into illegibility.
- Keep the initial query bounded. The existing `GET /api/artefacts` list is already ordered by `updated_at`; add an explicit `limit`/lightweight feed response only if sending full document content is necessary for previews. Do not fetch every artefact body one-by-one.

### Search and retrieval

Search should follow recent artefacts, not block the initial release.

- Add a workspace search affordance with title, summary, project, and folder matching first. Debounce input client-side and return capped results ordered by recency.
- Add filters for folder/project and an “updated by me / shared with me” scope only after the base query is useful.
- Use PostgreSQL full-text/trigram indexing only when real artefact counts or measured latency require it. Do not introduce a separate search service.
- Later, index generated text and source metadata for semantic retrieval. That needs explicit source/permission scoping and a clear deletion/reindex path; it is not a P1 feature.

Success criteria: a returning user can reopen a prior artefact in two interactions, and search finds known work without page-level scanning.

## Phase 2 — templates, reuse, and faster creation

Klee already has a substantial block catalogue. The next move is packaging useful combinations rather than adding blocks indiscriminately.

- Add a small curated preset gallery next to the starter prompt chips: PR review brief, release readiness, incident timeline, engineering handoff, sprint plan, architecture decision, and executive update.
- Represent a preset as a title, prompt scaffold, allowed trusted-block composition, and optional source requirements. Reuse the current template catalogue and Zod schemas; avoid a parallel rendering model.
- Allow an owner to save an artefact as a personal/team preset, then create a new artefact from it with placeholders for project, date range, or source links. Do not make a global marketplace yet.
- Add “duplicate as starting point” and “apply this layout” to the existing version/artefact menus. Preserve source attribution and do not copy collaborators or share permissions by default.
- Add a handful of high-confidence blocks only when a real source supplies reliable data. Candidate sequence: release notes/change log, decision log, and test/quality summary. Avoid decorative blocks that duplicate prose or metrics already available.
- Review generation instructions after each new preset: the model should select a few coherent blocks, not fill the page with every supported template.

Success criteria: the common developer, delivery, and operations artefacts can start from a recognisable preset with less editing than a blank prompt.

## Phase 3 — vibeable components and component editor

Treat this as a progression. “Prompt an LLM to create a component” must not mean running arbitrary generated React/HTML/JS in users’ artefacts.

### V1: prompt-generated compositions of trusted blocks

- Add a “Create component” entry point from the composer and artefact editor. The user describes the desired information/layout; the model returns a validated composition of existing blocks and supported fields.
- Show a draft preview with editable title, labels, items, and block order before saving. Reuse the established structured-output validation, document tree, editable text, and version patch flow.
- Let users save the composition as a named personal/team component (for example, “PR health panel” or “weekly delivery summary”) and insert it into future artefacts.
- Scope component data to explicit inputs: prompt text, selected integration records, or manually entered values. Surface missing data as placeholders rather than hallucinating values.

### V2: constrained visual/textual editor

- Add a block inspector for supported fields, visibility, order, and simple layout options (one/two columns, emphasis, labels). Support a textual JSON-like/DSL editing mode only if it round-trips through the same schema validator.
- Introduce reusable component definitions with immutable published versions and per-artefact copies/overrides. A component change must not silently rewrite existing artefacts.
- Add a “regenerate this component” action that proposes a diff and keeps the user in control of applying it.

### Explicit non-goals for V1/V2

- No arbitrary JSX, CSS, npm packages, browser scripts, or server-side code execution.
- No cross-workspace component marketplace, public sharing, or billing model.
- No new rendering engine: component definitions compile to the existing artefact node tree.

### V3 decision gate

Only consider a richer custom renderer after V1 shows repeat use and the team can specify a safe sandbox, resource limits, data-access model, export policy, moderation, audit logs, and a migration format. A constrained declarative component DSL is preferable to user-supplied executable code.

Success criteria: a user can create, edit, save, and reuse a bespoke presentation without sacrificing rendering safety, access control, or version history.

## Phase 4 — integrations that add grounded context

Prioritise sources that make existing blocks more accurate, rather than integrations as badges.

1. **Slack (recommended first):** select a channel/thread and bounded date range; ingest message text, authors, timestamps, and permalinks; generate handoffs, decisions, incident summaries, and release updates. Respect channel membership and private-channel access at fetch time and when sharing an artefact.
2. **Jira:** select a project/board/filter or pasted issue links; normalise issue, status, owner, priority, sprint, and links into the existing source-agnostic work-item/timeline shapes. This directly powers the work-item board, sprint timeline, delivery progress, and risk blocks.
3. **GitHub depth:** add issue/discussion context, repository selection, and user-configurable PR refresh behaviour. Keep refresh deduplication, bounded file/context size, and the existing live-check approach; do not regenerate an artefact for every webhook event without a user-visible policy.
4. **Google depth:** support explicit Drive search/select beyond Docs/Sheets and clearly display which selected files influenced each artefact. Consider Slides/PDF extraction only after a quality/security review.
5. **Optional later sources:** Linear, Notion, PagerDuty, and deployment/observability systems should be driven by a customer workflow and mapped to existing normalised records before adding their UI.

For every integration, ship: OAuth/install/disconnect, least-privilege scopes, connection status, a bounded picker, source citations/links in generated output, permission-aware refresh, provider error states, and deletion/revocation behaviour. Reuse the existing integration modal and backend normalisation pattern; do not let provider-specific payloads leak into block schemas.

Success criteria: a generated artefact can link every factual operational/work item back to a source record the viewer is entitled to see.

## Phase 5 — collaboration, publishing, and lifecycle

- Improve artefact lifecycle with pin/archive, duplicate, restore, and explicit ownership/transfers. Folders are already present; tags should wait until folders/projects and search prove insufficient.
- Add notification signals for mentions, replies, access changes, and failed integration refreshes. Start in-app; add email/Slack notifications only when users ask for them and preferences/unsubscribe behaviour are defined.
- Add export/share formats based on demonstrated use: printable PDF/image snapshot, Markdown, then external posting. Exports must respect permissions, redact private source context where appropriate, and label the snapshot time/version.
- Add an artefact activity log showing generation, edits, source refreshes, shares, and comments. Keep the existing revision timeline as the content-change view instead of duplicating it.
- Add team-owned template/component administration only once organisation usage requires it: roles, publishing permissions, deprecation, and auditability.

## Quality, safety, and operating constraints

- Keep the backend’s schema validation as the trust boundary for model output. Every new block or component needs a frontend model type, renderer, catalogue metadata, backend Zod schema, agent instruction, and a focused validation/rendering test.
- Keep provider credentials and private source text out of client bundles, share URLs, snapshots, and logs. Re-check artefact access on every content, comment, refresh, and export endpoint.
- Never alter migrations already on `main`; new persistence for presets/components/integration sources must use a new timestamped migration with indexes and a rollback/data-retention plan.
- Keep generation context bounded and attributable. Persist source IDs/URLs and content hashes where needed, not opaque provider dumps.
- Test the real browser paths for component editing, access permissions, comments, and previews. Existing Node tests cover key backend models/access/snapshots; expand them next to changed behaviour rather than adding a new test framework.
- Maintain accessibility in every new workspace control: semantic buttons/links, keyboard focus/order, concise labels, contrast, loading/error states, and mobile layouts.

## Branch and repository hygiene

`main` is clean and matches `origin/main`. Do not merge old branches blindly: most predate substantial work now on `main`, so merge commits would create conflict-heavy, low-value history. Rebase/cherry-pick only a verified unique commit into a focused PR, then run the documented checks.

| Branch / group                                                                                                                                                         | Assessment                                                                                                                         | Action                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `origin/codex/github-context-fixtures`                                                                                                                                 | Small, unmerged test-fixture work (19 lines) relevant to Phase 0.                                                                  | Review/cherry-pick if the fixtures still match current GitHub context; otherwise recreate the minimal fixture beside current tests. |
| `origin/feat/comments`                                                                                                                                                 | Old comment-anchor fix, based on an earlier branch; similar comment work has landed.                                               | Reproduce the resize-anchor issue on current `main`; cherry-pick only if still failing, then close.                                 |
| `origin/feat/software-diagram-generation`                                                                                                                              | Original diagram-generation implementation; diagrams and their editing are already represented in current `main` history.          | Verify no unique behaviour with a focused diff, then close as superseded.                                                           |
| `origin/feat/components`, `origin/feat/docs`, `origin/feat/versions`                                                                                                   | Stale branches whose useful product work appears to have landed; their remaining divergence is naming/docs/OAuth-era history.      | Do not merge. Close after confirming no documentation wording is still desired.                                                     |
| `origin/feat/electrical`, `origin/feat/electrical-port`                                                                                                                | Large 3,078/4,756-line discipline expansion with PDF/electrical/civil/chemistry/maths blocks. It changes product scope materially. | Create a separate product/RFC decision and a fresh branch if approved. Do not merge into the developer artefact roadmap by default. |
| `origin/test-pr`, `origin/test2`                                                                                                                                       | Test/experiment branches, not a feature path.                                                                                      | Inspect for a single intentional test; otherwise close/delete.                                                                      |
| Remote branches already merged into `main` (for example GitHub integration, live status, Google file selection, sidebar, comments, versioning, docs, deployment fixes) | Historical branches retained after merged PRs.                                                                                     | Prune from the remote once the team confirms no active PR or worktree relies on them.                                               |
| Local branches tracking deleted remotes: `chore/fix-artefact-gen-speed`, `feat/artefact-generation`                                                                    | Local history only; remotes are gone.                                                                                              | Confirm no unpushed work is needed, then delete locally.                                                                            |

Before deleting any branch: verify it has no open PR, no active worktree, and no unique commits worth retaining. This repository currently has multiple local and remote branch references; clean-up should be its own small, reversible housekeeping task rather than part of a product feature merge.

## Suggested first three work items

1. **Recent artefacts home strip:** bounded recent feed + accessible preview cards below the composer, reusing current artefact metadata and renderer. Validate desktop/mobile, loading/empty states, and private/shared access.
2. **Generation reliability baseline:** run the release checklist, add the smallest useful fixture coverage, and make failed generations retryable/actionable.
3. **Preset gallery:** package current blocks into 5–7 high-confidence templates and support duplicate/save-as-preset. This is the proving ground for V1 vibeable components.

Do not start arbitrary-code component generation, a component marketplace, semantic search infrastructure, or the electrical discipline port until the preceding release has demonstrated returning/reuse behaviour and there is an explicit product decision.
