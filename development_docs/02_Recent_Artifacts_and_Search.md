# Recent artefacts and workspace search

## Goal

Help returning users find and continue useful work from the home screen. Recent items should appear beneath the main prompt, with previews that explain what each artefact contains at a glance.

## Existing foundation

`frontend/src/pages/Artefacts.tsx` loads the authenticated artefact list and renders the empty/home composer. `backend/src/app.ts` already returns list metadata ordered by `updated_at`, including title, description, icon, project, folder, and timestamps. `ArtefactNav` already shows a pointer-triggered preview in the sidebar. The artefact document tree and R2 snapshot path can support richer previews later.

## V1: recent cards beneath the composer

### Data

- Reuse current list data if it is light enough. Inspect the actual `/api/artefacts` response before adding an endpoint: avoid loading every full document just to make a row of cards.
- If the current response contains full artefact bodies, add a small `GET /api/artefacts/recent?limit=6`-style projection (or a `limit` query on the existing list) selecting metadata plus one compact preview descriptor.
- Keep access filtering in the existing artefact query helper. Recent results must never include content the signed-in viewer cannot open.
- Exclude the active artefact from the home strip; sort by `updatedAt`, not `createdAt`, so recently revised/shared work resurfaces.

### Preview options

1. **V1 recommendation:** deterministic preview card with title, summary, type icon, last-updated time, project/folder, and up to one compact block label/snippet. Derive from the stored document tree server-side or reuse list metadata.
2. **V1.5:** render a small live thumbnail using a dedicated compact frontend renderer. Keep charts/diagrams static and clip to a bounded height.
3. **Later:** use existing R2 snapshots when a real visual thumbnail materially improves selection. Do not trigger one browser render per card on every home load.

### UI behaviour

- Show four to six cards. Keep “Create” as the primary action.
- Support click/tap, keyboard focus and activation, concise accessible labels, truncation, and a clear selected/open state.
- Include loading skeletons, empty state, and fetch failure handling. Failed recents should not block prompt submission.
- On mobile, use a scrollable horizontal strip with visible edge affordance or a short vertical list. Avoid tiny two-row cards.
- Provide a “View all” destination only when the app has a usable full-list/search surface; do not add a dead-end link.

## V2: title and summary search

- Add a search input in the workspace header or sidebar that works from both home and an open artefact.
- Search title, summary, project name, and folder name first. Preserve the same access conditions as the list endpoint.
- Debounce requests, cap result count, cancel stale requests, show no-results/loading/error states, and keep keyboard navigation predictable.
- Start with Postgres `ILIKE` or existing indexed columns. Measure query time and result counts before adding full-text search/trigram indexes.
- Add project/folder filters after basic search proves useful. Shared/private filters need clear semantics because users may own, receive, or publicly view work.

## V3: richer retrieval

Index document text only if title/summary search fails to find artefacts users expect. Define source text extraction, index updates on every revision, delete/revocation handling, access scopes, and migration/rebuild behavior before adding semantic search. Do not send a user’s full workspace to a model for search unless the user explicitly asks for semantic retrieval.

## Acceptance

- A returning user can open a recent artefact within two interactions.
- Recent cards are sourced from the current accessible result set and do not add per-card network requests.
- The cards remain usable at narrow mobile width and with keyboard-only navigation.
- Search results are capped, ordered by recency, and permission-safe.
- Home remains useful when recents fail to load.

## Open measurement

Track card opens and follow-up revisions using the minimal funnel in `01_Reliability_and_Quality.md`. If users do not open recents, test placement and preview usefulness before building advanced search.
