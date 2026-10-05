---
name: delta-specs
description: "Trigger: spec change, delta spec, cambio a feature aprobada, scope creep, change request, requirements shift. Documenta cambios a specs ya aprobadas sin reescribir el original."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a feature's spec needs to change AFTER `proposal.md` was approved and implementation has started (or completed). Do not use for uncommitted specs — those you edit directly.

## Hard Rules

- Never edit approved `proposal.md`, `plan.md`, or `tasks.md` directly after implementation started.
- Every scope change → new file `specs/<slug>/deltas/YYYY-MM-DD-<change-slug>.md`.
- Delta must reference the original spec section it modifies and the reason for change.
- If the delta invalidates already-shipped code → include rollback plan.
- Human approval required for every delta.
- Deltas are additive to spec history — don't delete old ones even if superseded.

## Decision Gates

| Change type | Action |
|-------------|--------|
| Typo in original spec | Edit inline; no delta needed |
| Small scope adjustment (± 20% effort) | Delta doc |
| Major scope change (new requirement, dropped requirement) | Delta doc + human sign-off |
| Spec found to be wrong (bad assumption) | Delta doc + note in analysis section |
| Spec obsolete (feature abandoned) | Delta doc marking spec deprecated; archive spec |

## Execution Steps

1. Verify original spec is post-approval (check CHANGELOG for original `[DOCS]` entry).
2. Create `specs/<slug>/deltas/YYYY-MM-DD-<change-slug>.md`:
   - **Change:** 1-sentence description
   - **Affected sections:** references to original spec sections
   - **Reason:** why this change is needed now
   - **Impact:** on already-implemented code, on remaining tasks, on tests, on docs
   - **Rollback plan:** if change invalidates shipped work
   - **New tasks:** if change adds to `tasks.md`, list them here → add to `STATE.md`
3. Human approval — record in CHANGELOG with `[SPEC-DELTA]` tag.
4. Update `STATE.md` — add/remove/modify tasks as the delta requires.
5. Do NOT rewrite `proposal.md` — the delta is the record of change.

## Output Contract

Delta doc structure:
```markdown
# Delta: <change-slug>
**Date:** YYYY-MM-DD
**Original spec:** specs/<slug>/proposal.md
**Affects:** proposal § X, plan § Y, tasks T#.#

## Change
<one sentence>

## Reason
<why now>

## Impact
- Shipped code: <what changes / stays>
- Remaining tasks: <what changes>
- Tests: <what needs updating>
- Docs: <what needs updating>

## Rollback plan (if applicable)
<how to revert if this delta was wrong>

## New tasks
- T#.#-delta — <description>

## Approval
Approved by @human YYYY-MM-DD in CHANGELOG entry [SPEC-DELTA].
```

## References

- Related: `_sdd/plan`, `_sdd/tasks`, `_sdd/archive`
- Inspired by OpenSpec's delta specs pattern
