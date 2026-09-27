# Discipline and product-scope expansion

## Context

The current app and block catalogue focus strongly on engineering, PRs, delivery, and operations. Remote branches `feat/electrical` and `feat/electrical-port` contain a much larger expansion into electrical, civil, chemistry, maths, PDF attachments, and additional domain blocks. This is a product scope decision, not routine branch integration.

## Decision questions

Before adopting the work, answer:

1. Which users and repeated workflow are requesting each discipline?
2. Is Klee intended to stay an engineering change/workspace product or become a broad document-generation platform?
3. Which source formats are available and licensed for extraction? How will tables, formulas, schematics, units, and citations be represented?
4. What is the domain accuracy and safety bar, particularly for electrical/civil/chemical advice that may affect physical systems?
5. Can the existing block tree support these outputs through domain-specific templates, or does it require a different editor/source model?
6. What is the support and validation cost per discipline?

## Low-cost validation

- Review the existing branch diff and running examples without merging.
- Interview a few target users or use actual inbound requests to identify a single high-value task.
- Prototype one representative artifact with current prose/table/diagram templates and compare it with the branch implementation.
- Create a fixture set of supplied documents with expected grounded output and known unsupported facts.
- Decide whether to adopt one narrow vertical, not all disciplines at once.

## If approved

- Create a fresh branch from current `main`; do not bring years/merge history wholesale.
- Extract one feature slice with its schemas, renderers, sample fixtures, file handling, and tests.
- Treat uploaded PDFs and scientific/technical source text as untrusted input. Bound file size/pages/extraction length, preserve citations/page numbers, and never imply professional certification.
- Define units and numeric precision; avoid converting values silently.
- Build a domain review checklist and label generated analysis as draft/supporting material.
- Keep domain templates in a discoverable category but do not expose blocks unrelated to the selected discipline.

## Acceptance

- Product decision names a target user/job and measurable reason to expand.
- One vertical has source-backed fixtures and a documented accuracy limit.
- New files/blocks are permission-checked, bounded, and traceable to the source page/record.
- The initial vertical works without changing the main engineering workflow.

## Recommendation

Keep both branches as reference material until this decision is made. Their size and additional formats create a non-trivial maintenance commitment; a narrow pilot is easier to evaluate and reverse.
