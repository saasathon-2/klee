# Hanging branch review and cleanup

## Goal

Identify valuable unmerged work, reduce confusion from stale branches, and preserve anything still in progress. This note is a review procedure; it does not authorize deleting branches or closing pull requests.

## Safe review sequence

1. Refresh remote refs with the repository’s normal fetch process.
2. List local and remote branches, tracking status, last commit date, ahead/behind relation, and open PR association.
3. Check active worktrees and active tasks before changing any ref.
4. Compare branch commits and file diffs against current `main`; commit messages alone do not establish whether the work landed.
5. Classify each branch as: merged; useful unique commit; superseded; experiment; or active.
6. For unique work, create a small PR/branch from current `main` and cherry-pick only the needed commit(s), resolving against current tests and migrations.
7. After verification and owner confirmation, close stale PRs and delete remote/local refs as appropriate.

Keep cleanup separate from feature implementation so it is easy to review and undo.

## Known branch groups from the roadmap audit

| Branch(es) | Initial assessment | Review action |
| --- | --- | --- |
| `origin/codex/github-context-fixtures` | Small fixture/test work appears useful to generation quality. | Compare test data to current `github.ts` output and salvage only current coverage. |
| `origin/feat/comments` | Old comment anchor resize work; much comment code has since landed. | Reproduce against current main; salvage only if a current bug remains. |
| `origin/feat/software-diagram-generation` | Diagram generation work predates current graph catalogue. | Verify any unique behavior; otherwise mark superseded. |
| `origin/feat/components`, `origin/feat/docs`, `origin/feat/versions` | Remaining divergence appears old naming/docs/OAuth history; most core work landed. | Do not merge wholesale; close after a focused unique-commit check. |
| `origin/feat/electrical`, `origin/feat/electrical-port` | Large discipline and PDF expansion with real product-scope implications. | Retain as reference pending the decision in `10_Discipline_Expansion.md`. |
| `origin/test-pr`, `origin/test2` | Experiment/test branches. | Inspect for intentional content and active PRs; otherwise close/remove. |
| Local `chore/fix-artefact-gen-speed`, `feat/artefact-generation` | Local branches track deleted remotes. | Check for unpushed unique commits/worktree use before local deletion. |
| Historical merged branches | PRs/features already integrated in `main`. | Prune remote refs only when no open PR/worktree depends on them. |

These are starting classifications based on the 2026-09-27 snapshot. Recheck branch state before acting; remote and PR state can change.

## Migrations and special handling

- Never cherry-pick a migration rename or rewrite into a path that changes an already-applied migration’s identity.
- Verify `MIGRATIONS_BASE_REF=origin/main pnpm --dir backend migrations:check` after any migration salvage.
- Preserve active work even if it appears stale; ask its owner through the normal team process before deleting their branch or closing their PR.
- Archive/delete branch refs only after its commits are merged, intentionally abandoned, or safely preserved elsewhere.

## Completion record

For each branch, record decision, unique commits preserved/discarded, PR status, worktree status, and cleanup date. Keep this ledger short; do not turn it into a permanent branch inventory once clean-up is complete.
