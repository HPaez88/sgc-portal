---
name: work-unit-commits
description: "Trigger: commit, split work, dividir en commits, work units, atomic commits, reviewable diff. Planear commits como unidades reviewables, no como dump al final."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before starting a multi-file implementation. The goal is producing commits that each stand on their own — reviewer can understand and validate each without needing the whole feature.

## Hard Rules

- Every commit does ONE thing (single conceptual change). "Fix X and refactor Y" = 2 commits.
- Every commit compiles. `git bisect` should work.
- Commit message format: imperative present ("Add X", "Fix Y", "Refactor Z"), no past tense.
- Tests and docs for a change go IN THE SAME commit as the code change, not after.
- Never squash unrelated commits at merge — the history is the audit trail.

## Decision Gates

| Situation | Commit strategy |
|-----------|-----------------|
| New file + its tests | 1 commit (both together) |
| Refactor + new feature that depends on refactor | 2 commits (refactor first, feature second) |
| Bug fix + regression test | 1 commit (test proves the fix) |
| Formatting change spanning many files | Separate commit with `[STYLE]` tag |
| Renaming + logic change on same file | 2 commits (rename first, logic second) |
| Dependency upgrade + code adaptation | 2 commits (upgrade first, adaptation second) |

## Execution Steps

1. Before starting, plan the commit series. Write it down (mental or in `plan.md`).
2. Implement one work unit at a time.
3. After each unit: `git add <specific files>` (never `git add -A` without reviewing).
4. `git status` to confirm what's staged.
5. Commit with a descriptive message following format below.
6. Verify the commit compiles/tests pass in isolation (`git stash`, checkout the commit, run build).
7. Continue to next work unit.

## Output Contract

Commit message template:
```
<type>(<scope>): <imperative subject, ≤ 72 chars>

<body: what and why, wrap at 80 chars>

<optional footer: refs, breaking changes, co-authors>
```

Types: `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `style` | `perf` | `ci`.

Example:
```
feat(auth): add refresh token rotation

Rotate refresh tokens on every use to limit blast radius of leaks.
Store previous token hash for 60s grace period during rotation.

Refs: T2.3
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- Related: `_delivery/chained-pr`, `_delivery/branch-pr`
- Inspired by Gentle-Pi's `work-unit-commits`
