---
name: archive
description: "Trigger: feature terminada, mergeada, cerrar spec, archive, mover a archived, feature done, cleanup specs. Mueve specs completadas a archived/ preservando historia."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a feature is fully implemented, merged, and considered "done" for a release. Archives the spec so `specs/` only contains in-flight work.

## Hard Rules

- Never delete a spec — always move to `specs/archived/`.
- Archive AFTER merge, not before. In-flight specs stay in `specs/<slug>/`.
- Archived path format: `specs/archived/<YYYY-MM-DD>-<slug>/` (date is archival date, not creation date).
- Archive includes ALL files from the original spec (proposal, plan, tasks, deltas, notes).
- Add a `resolution.md` on archival with: shipped in version, PR links, lessons learned.
- Never re-open an archived spec — if the feature comes back, write a new spec that references the archived one.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Feature merged and released | Archive after 1 week of production stability |
| Feature abandoned | Archive with `resolution.md` marking as "abandoned" + why |
| Feature superseded by another | Archive both with cross-references |
| Feature partially shipped | Do NOT archive — either finish or write delta marking scope reduction |

## Execution Steps

1. Confirm feature is merged (check PR merged, `[x]` all its tasks in STATE).
2. Confirm no in-flight deltas or open bugs referencing the spec.
3. Create `specs/archived/YYYY-MM-DD-<slug>/`.
4. `git mv specs/<slug>/* specs/archived/YYYY-MM-DD-<slug>/`.
5. Create `resolution.md` in the archived folder:
   - Shipped in: version X.Y.Z
   - PRs: #NN, #NN, ...
   - Total effort: N sessions / N hours (if tracked)
   - Lessons learned: what went well, what to improve
   - Follow-ups: bugs found, tech debt introduced (link to STATE if any)
6. Remove the feature's section from `STATE.md` if all tasks `[x]`.
7. CHANGELOG entry with `[DOCS]` tag: "Archived spec <slug>".

## Output Contract

`resolution.md` template:
```markdown
# Resolution: <slug>

**Archived:** YYYY-MM-DD
**Shipped in:** vX.Y.Z (or "abandoned" / "superseded by <other-slug>")
**PRs:** #NN, #NN

## Summary
<what shipped, one paragraph>

## Effort
- Sessions: N
- Estimated hours: N

## Lessons learned
- ✓ What went well
- ⚠ What to improve next time
- 🐛 Bugs found post-ship

## Follow-ups
- Bugs: (link to STATE entries)
- Tech debt: (link to STATE entries)
```

## References

- Related: `_sdd/plan`, `_sdd/delta-specs`, `_sdd/sdd-init`
- Inspired by OpenSpec's `archived/` folder pattern
