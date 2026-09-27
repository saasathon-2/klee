# Collaboration, publishing, and artefact lifecycle

## Goal

Make team artefacts easier to revisit, maintain, and hand off while reusing existing folders, permissions, comments, versions, and snapshots.

## Current capabilities to build on

Klee already supports folders, organisation and person sharing, link access, view/comment/edit grants, threaded comments/reactions, revisions/version history, and static previews. New lifecycle work should attach to these paths rather than duplicate them.

## Proposed order

### 1. Pin and archive

- Add `archived_at` and optionally `pinned_at` only if users need a durable distinction beyond folders/recent order.
- Default list excludes archived artefacts; add an archive view and restore action.
- Pinning can start as a small user-scoped relation or reuse an existing per-user preference pattern if one exists. Do not encode pin state in shared artefact content.
- Archive/restore must not change ownership, share grants, or comments.

### 2. Duplicate and create from existing

- Add a duplicate action creating a new private artefact with copied document content and a new identity.
- Do not copy share IDs/grants, collaborators, comment threads, external installation linkage, or live refresh subscriptions.
- Preserve source links as content references and label the duplicate’s origin if useful.
- Record the duplicate event in the new artefact’s history.

### 3. Activity view

The version timeline already captures content change. Add an activity log only for events not represented there: shares/grant changes, comments/replies, source refresh state, and exports. Define event retention and whether users can see each event before adding a generic event bus.

### 4. Notifications

Start with in-app indicators for mentions, replies, permission changes, and failed refreshes. Define user preferences, deduplication, and mute/unsubscribe before adding email or Slack delivery. Keep notification content permission-safe and avoid sending private artefact text in notification payloads.

### 5. Export

Use existing snapshot rendering for PDF/image only when quality is adequate. Add Markdown export if structured data transfers better than a screenshot. Label exported version and timestamp; recheck access at export time; remove private source text if the viewer is not entitled to it.

## Data and permissions

- Continue using centralized `artefact-access` rules for private/shared/organisation access.
- User preferences (pin, notification settings) belong to the user, not the shared document.
- Archive/duplicate/export endpoints require owner/editor checks as appropriate.
- A share revocation should affect future views/exports; do not assume an old exported artifact can be recalled.
- New persistence requires timestamped migrations and tests for owner, org, and link access.

## Acceptance

- Archive is reversible and hidden from normal recent/search views by default.
- Duplicate is isolated: new ID, private access defaults, no copied comments/grants/live GitHub linkage.
- Activity records are understandable, permission-scoped, and do not duplicate revision history.
- Export reflects a known version and cannot expose information through a stale public snapshot.
- Notifications are actionable and user-controlled before external delivery is enabled.

## Sequencing signal

Build the feature users repeatedly try to approximate through folders, copy/paste, or asking teammates for links. Avoid adding tags, notifications, activity feeds, and exports as one broad “collaboration upgrade.”
