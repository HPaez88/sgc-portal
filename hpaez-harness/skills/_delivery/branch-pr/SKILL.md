---
name: branch-pr
description: "Trigger: crear PR, abrir PR, pull request, mandar review, gh pr create, issue first, PR template. Crea PR con issue-first checks y descripción reviewable."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before creating any PR (via `gh pr create` or web UI). Applies whether it's a single PR or part of a chain (see `chained-pr`).

## Hard Rules

- Never create a PR without a matching issue (or `[FEATURE]`/`[FIX]` entry in `STATE.md` linking to the work).
- PR title: imperative, ≤ 60 chars, no ticket ID in title (belongs in body).
- PR body follows the template below — no exceptions.
- Draft PR if any of: tests failing, docs pending, feature-flagged rollout, chain not complete.
- Never push to `main` directly. Every change goes through PR.

## Decision Gates

| Situation | PR type |
|-----------|---------|
| Bug fix < 50 lines | Regular PR |
| Feature ≥ 50 lines but ≤ 400 | Regular PR |
| Feature > 400 lines OR > 8 files | Chain (see `_delivery/chained-pr`) |
| Emergency hotfix | Regular PR + `[URGENT]` label + fast-track review |
| Docs-only change | Regular PR + `[DOCS]` label |
| Dependency bump | Regular PR + `[CHORE]` label, list changelog of upgraded package |

## Execution Steps

1. Verify `verify-loop` passes on your branch.
2. Push branch: `git push -u origin <branch>`.
3. Create PR: `gh pr create --title "<title>" --body "$(cat <<'EOF'\n<body>\nEOF\n)"`.
4. Add appropriate labels: `[type]`, `[priority]`, chain metadata if applicable.
5. Request review from role-owner (see `_agents/agent-team`).
6. Link the PR back to `STATE.md` (edit the task line to include PR number).

## Output Contract

PR body template:
```markdown
## Summary
<1-3 bullet points, what this PR does>

## Related
- Refs: T#.# (from STATE.md)
- Issue: #NN (if applicable)
- Chain: N/M (if part of chained-pr)

## Test plan
- [ ] Manual: <steps>
- [ ] Automated: <which test file / command>
- [ ] Deploy verification: <what to check post-merge>

## Notes for reviewer
<anything non-obvious, deliberate tradeoffs, TODOs>

## Screenshots / demos
<if UI change>
```

## References

- Related: `_delivery/work-unit-commits`, `_delivery/chained-pr`
- `gh` CLI: https://cli.github.com/
- Inspired by Gentle-Pi's `branch-pr`
