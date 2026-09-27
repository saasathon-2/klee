# Reliability and quality baseline

## Goal

Make the current create → generate → edit/share loop dependable and measurable before adding more moving parts. The goal is a small operating baseline, not a general observability rewrite.

## Current touchpoints

- Generation and structured-output validation: `backend/src/artefact-agent.ts`, `backend/src/artefact-agent-instructions.md`.
- Create and stream routes: `backend/src/app.ts` (`/api/artefacts`, `/api/artefacts/stream`).
- Generation commentary/error presentation: `frontend/src/pages/Artefacts.tsx` and `frontend/src/pages/artefact/GenerationCommentary.tsx`.
- Existing backend tests run directly with Node’s test runner from `backend/package.json`.

## Implementation slices

### 1. Write a compact release checklist

Exercise the actual deployed configuration with one test account. Cover:

1. Sign in/out and session persistence.
2. Create from plain text, a pasted GitHub PR, and selected Google Docs/Sheets.
3. Verify generated output, follow-up revision, manual text edit, and version history.
4. Verify private access, shared view/comment access, and access revocation.
5. Verify GitHub webhook refresh and current check status.
6. Verify mobile sidebar, prompt, cards, comments, and loading/error states.

Keep it in the repo as a short checklist with environment prerequisites and a result/date field. Avoid building a full end-to-end test harness until repeated manual failures reveal its highest-value paths.

### 2. Make generation failure recovery explicit

- Keep prompt and selected source chips in the composer after a failed request.
- Show a plain-language error and a retry action that does not silently duplicate an artefact.
- Distinguish cancellation, provider rejection, invalid model output, source read failure, and storage/preview failure. The backend already has typed `ArtefactAgentError` kinds; keep error mapping central.
- Log only redacted diagnostic fields: failure kind, provider status/code, request ID, recipe/model identifier, and timings. Never log OAuth tokens or full source text.
- Treat preview capture as a separate result where possible; a failed thumbnail should not imply content generation was lost.

### 3. Create generation fixtures

Start with small deterministic cases: plain prompt, small PR, large PR, empty checks, failed CI, review disagreement, Google document notes, sheet values, and unsupported/ambiguous request. For each fixture document expected intent, allowed blocks, source facts, and prohibited inventions. Reuse the existing `backend/src/artefact-agent.test.ts` patterns; no new test framework is needed.

### 4. Record a minimal funnel

The existing generation log includes model, timing, and block count. Add only events needed to answer:

- Did generation succeed?
- Did the user reopen or revise the artefact?
- Which known source classes were attached?
- Did a user switch recipe or remove/reorder content?

Prefer existing logs/telemetry. Avoid recording prompt bodies or personal source content. Define retention and user-identity treatment before adding an analytics vendor.

## Acceptance

- A failed generation is retryable without losing the user’s inputs.
- Release checklist covers private/shared permissions and at least one real connected source path.
- Fixture tests fail when output contains unsupported block shapes, fabricated links, or a missing required fact in a defined case.
- Operational logs help find the failing stage without exposing credentials or source text.

## Sequencing and limits

Complete the checklist and fixture corpus before investing in rich analytics. If there are no current operational logs beyond `console`, structured JSON logs are sufficient as an initial improvement; do not add a vendor solely for event counting.
