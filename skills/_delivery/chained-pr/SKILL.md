---
name: chained-pr
description: "Trigger: PR grande, más de 400 líneas, split PR, stacked PR, chained PR, revisión imposible, feature branch. Divide un cambio grande en cadena de PRs revisables independientemente."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when the change to ship exceeds 400 lines (adds + deletes) OR touches more than 8 files. Load also when the human explicitly asks to "split the PR" or "chain it".

## Hard Rules

- Hard limit: 400 lines per PR (adds + deletes combined). Above this → chain or split.
- Each PR in the chain must compile and pass tests on its own (`git bisect` works).
- Each PR has its own reviewable summary — reviewer should not need to read the whole chain.
- Never merge partial chains to `main` if strategy is "feature branch" (see Decision Gates).
- Chain metadata: each PR body cites its position (e.g. "2/5" and links to previous/next).

## Decision Gates

| Strategy | When | Behavior |
|----------|------|----------|
| **Stacked to main** | Startup, small team, high trust | Each PR merges to main as approved. Fast, but breaks main if middle PR is wrong. |
| **Feature branch** | Established team, review discipline | All PRs stack on a `feature/<slug>` branch. Merges to main only when the whole feature is approved and green. Safer. |
| **Single PR (skip chaining)** | Change is atomic and cannot be split (e.g. migration + code that depends on migration) | Justify in PR description. Get explicit human approval. |

## Execution Steps

1. Count lines: `git diff --stat main...HEAD | tail -1`.
2. If > 400 OR > 8 files: pause implementation, plan the chain.
3. Design chain in `chain-plan.md`:
   - PR 1: <foundation/refactor>
   - PR 2: <first vertical slice>
   - PR 3: <second slice + shared components>
   - PR N: <finishing touches, docs>
4. Create branches accordingly: `feat/<slug>-1-foundation`, `feat/<slug>-2-first-slice`, etc.
5. First branch off `main` (or `feature/<slug>` if that strategy). Each subsequent off the previous.
6. Open PRs in order; body includes: chain position, previous/next PR links, summary of THIS slice only.
7. Reviewer approves each. Merge in order.
8. Delete intermediate branches after merge.

## Output Contract

Per-PR body template:
```markdown
## Chain: <slug> — PR N/M

**Previous:** #<prev PR>
**Next:** #<next PR> (or "final")
**Base:** <branch this stacks on>

## What this PR does
<one paragraph, this slice only>

## What it does NOT do
<explicit non-goals, deferred to later PRs>

## Testing
<how to verify this slice in isolation>
```

## References

- Inspired by Gentle-Pi's `chained-pr`
- Related: `_delivery/work-unit-commits`, `_delivery/branch-pr`
- Stacked PR tools: [Graphite](https://graphite.dev/), `git-town`, [Sapling](https://sapling-scm.com/)
