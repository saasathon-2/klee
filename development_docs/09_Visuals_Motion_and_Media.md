# Visuals, diagrams, motion, and media

## Goal

Make artefacts easier to scan and understand by using diagrams and structured views when they compress real evidence. Consider motion/video only after static meaning, exports, and accessibility are dependable.

## Existing visual vocabulary

Klee already renders metric rows, flowcharts, architecture/software diagrams, dependency graphs, Git graphs, impact maps, timelines, work boards, readiness, evidence tables, and two-column rows. Most quality gains should come from selecting the right current block, sourcing data, and ordering it consistently.

## Diagram selection guide

- **Linear two/three stages:** `architecture-flow`.
- **Multi-component relationships:** `software-diagram`, with sourced nodes/edges.
- **Process branches:** `flowchart`, with decision edges labeled.
- **Package/module/service dependencies:** `dependency-graph`.
- **Affected components from a change:** `change-impact-map`.
- **Branch ancestry:** `git-graph` only when parent SHAs establish topology.
- **Chronological events:** timeline blocks.
- **Supplied dated numeric values:** `activity-trend`.

Do not infer relationships from file names or generic engineering conventions. If the evidence does not support edges, use prose or a list and say relationships were not supplied.

## Visual budget

For a standard artefact, use at most one primary diagram/chart and one compact supporting visual before optional appendix material. A deep technical request can earn another visual if each answers a different question. A one-file PR usually needs a focused diff and checks, not an architecture diagram. A multi-service change with explicit relationships should normally show a diagram unless the user asks for text-only output.

This budget is a selection rule, not a CSS limit. Backend recipe validation should enforce block counts/eligibility; renderers should handle responsive sizing and clipping.

## Accessibility and fallback

- Give each diagram a concise title and a text summary/list of nodes and relationships.
- Use labels and icons as well as color for status, health, and causality.
- Preserve a logical reading order in two-column layouts; stack on narrow screens.
- Provide text descriptions for charts with unit and date range.
- Keep all meaning present in static HTML. A screenshot/PDF and reduced-motion view must express the same conclusion.
- Test keyboard interaction in React Flow/diagram controls; generated artefacts should remain readable even if interactive graph features are unavailable.

## New visual work in order

### Source and freshness strip

Show linked source records and last-refresh time near the artifact heading or source-specific section. Reuse source IDs/URLs already attached during generation. Decide how to handle revoked/inaccessible links and shared artefacts before showing excerpts.

### PR summary composition

Try a composition of current metric row, review, check list, and readiness blocks before adding a new primitive. This tests whether a stable visual summary helps reviewers.

### File/impact map

Only add if PR fixtures and user edits show a gap between changed files and system impact. The new view should connect files to sourced components and include provenance, not merely draw a file tree.

### Media embed

An image/video embed must be user-selected or source-backed, have a sanitized URL/type, caption/description/transcript, permission behavior, responsive rendering, and a failure fallback. No arbitrary iframes or model-generated script embed.

## Motion proposal

Start with brief CSS transitions or user-triggered highlights: trace a selected dependency path, step through a flowchart, or show a changed status. Use static-first rendering and `prefers-reduced-motion`. Provide pause/replay for anything that persists. Avoid autoplay and layout shift. Ensure motion is decorative or explanatory, never necessary to reveal a blocker or final state.

## Video decision gate

Generated/narrated video is a separate feature, not another block in the first pass. Before prototyping, establish:

- User explicitly starts generation and sees progress/cost.
- Duration, resolution, file size, retention, and provider error bounds.
- Captions, transcript, descriptive poster, and static artefact fallback.
- Source attribution and permission checks for every included record.
- Moderation, export rules, deletion, and whether media appears in public previews.
- No autoplay and no hidden generated code execution.

First test a hand-authored demo/video embed in a private artefact with captions before introducing AI-generated video. If few users consume it, stop at static diagrams and lightweight highlights.

## Acceptance

- The generated diagram is supported by source records and passes existing node/edge validation.
- Every visual has a textual equivalent and responsive behavior.
- Reduced-motion preference leaves the entire artefact understandable.
- Snapshot/export does not depend on transient animation state.
- New media respects access controls and offers a useful unavailable/error fallback.
