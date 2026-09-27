# Integrations and grounded context

## Goal

Connect sources because they improve an artefact workflow. Each new integration should feed the existing source-agnostic block types with attributable records and respect provider permissions on every fetch and refresh.

## Current state

- GitHub App supplies PR, changed-file patches, review/comment data, commits, and checks; webhook refreshes are deduplicated and can update a linked artefact.
- Google Drive OAuth and Picker select Docs/Sheets. The backend bounds selected files, text, sheet tabs, and ranges, and adds note evidence.
- Slack and Jira are presented as integration destinations/links, but are not yet full context-ingestion paths in the main app.
- Existing models include work items, boards, timelines, incidents, checks, evidence, risks, ownership, and source URLs.

## Integration selection rule

Choose the next source from one concrete repeated job (for example, “summarise a Slack incident thread” or “turn a Jira sprint into a delivery brief”). Define the target recipe and blocks first, then implement the narrowest provider picker and read path that can supply them.

## Slack: suggested first new ingest

### Thin slice

- OAuth/install with the smallest scopes needed to read user-selected public/private channels and thread replies.
- User chooses a channel/thread and bounded date/time range; do not pull an entire workspace history.
- Normalize messages into `{ id, text, author, timestamp, url, threadId }` with provider links and source freshness.
- Create a handoff, decision, incident, or release artefact from that bounded selection.
- Keep private-channel membership checks at fetch time; recheck permission on refresh and before presenting copied source content.

### UX and operations

Show the connected workspace, selectable channels the current account can access, selected range, message count, truncation notice, and a clear disconnect/revoke state. Handle rate limits, deleted messages, bot noise, empty threads, and revoked scopes. Avoid automatic workspace-wide indexing in the first release.

## Jira: source-agnostic work records

Start with selected issue URLs or one project/board/filter. Map to existing `WorkItem`/`BoardItem` fields: key/title/status/owner/priority/start/end/URL. Normalize status vocabulary using an explicit mapping table and preserve unknown statuses rather than guessing. Add sprint, estimate, and timestamps only when the source provides them.

The same records can populate work-item board, sprint timeline, delivery progress, and risk blocks. Keep Jira field names out of the LLM-facing schema. Support pagination with a strict upper bound and provider attribution.

## Deepen existing integrations

- GitHub: user-selected issues/discussions, repository picker, configurable refresh policy, and explicit “updated at” on generated content. Avoid re-generating on every event when content has not meaningfully changed.
- Google: selected-file provenance, explicit supported formats, and bounded extraction. Slides/PDF are a later decision with quality and security checks.
- Linear, Notion, PagerDuty, deployment/observability: defer until a workflow demands them; map into current normalized shapes before making bespoke block types.

## Shared implementation pattern

1. Configure credentials/scopes and callback using existing auth conventions.
2. Add connection status/disconnect to the existing integration surface.
3. Add an explicit bounded picker or accept a validated user-selected URL.
4. Fetch only authorized records and normalize to source-agnostic types.
5. Pass content with source IDs/URLs, timestamps, and untrusted-data delimiters.
6. Generate blocks with evidence links and preserve source references on refresh.
7. Recheck artefact and provider permissions for refresh, sharing, and export.
8. Test disconnect, scope revocation, inaccessible private records, rate limit, and deletion.

## Acceptance

- Every source fact in the generated artefact can link to the source record when a URL exists.
- The app never claims to have read data outside the user-selected and authorized scope.
- Source revocation prevents future fetch/refresh; stored content-retention behavior is explicit.
- Context is capped and failures do not erase the prompt or partially create misleading output.
- Provider-specific JSON never becomes the generic block schema.

## Decision gates

Ship one integration end-to-end before adding another. Do not treat a marketing integration link or OAuth connection as completed product integration until source selection, generation, provenance, refresh, permission, and disconnect behavior all work.
