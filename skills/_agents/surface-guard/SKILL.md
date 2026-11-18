---
name: surface-guard
description: "Trigger: dueño de ruta, un owner por archivo, no escribir fuera de mi superficie, enforcement de departamento, AGENT-SURFACES, cross-surface, quién puede tocar este archivo. Enforcement determinista de que cada departamento solo escribe en su superficie."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when departments/tracks write in parallel and you need to guarantee each one stays inside its surface (the "one owner per path" rule from `_agents/department`). This is **deterministic** enforcement — a path/glob rule, never a judgment call. Do NOT use Jev here (that would be a probabilistic security gate; see `task-router` for the legit Jev use).

## Hard Rules

- Enforcement is a known rule → pure glob matching, fail-closed. No model decides permissions.
- `AGENT-SURFACES.md` maps every writable glob to exactly one owner. No path belongs to two owners; a path with no owner is a gap to fix, not a free-for-all.
- A new department adds its surface row AND its charter in the same change (mirrors headcount).
- The orchestrator sets `ACTIVE_SURFACE` (glob(s)) before delegating to a department; the `surface-guard` hook blocks any Write/Edit outside it.
- Post-hoc, `scripts/check-surfaces.js` verifies a change set didn't cross surfaces, wired into `_quality/verify-loop` and pre-commit.
- If `ACTIVE_SURFACE` is unset, the live hook no-ops (opt-in) — but the pre-commit check still runs, so nothing crosses a surface silently into a commit.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Delegating to a department | Orchestrator sets `ACTIVE_SURFACE=<dept globs>` first |
| Write inside active surface | Allowed |
| Write outside active surface | Blocked by hook (exit 2) — coordinate via orchestrator |
| Path maps to no owner | Stop; add it to `AGENT-SURFACES.md` under one owner |
| Change set spans 2 owners | Split into per-owner commits (one owner per commit) |

## Execution Steps

1. Ensure `AGENT-SURFACES.md` exists (shipped by `hpaez init`); fill each department's writable globs.
2. Before delegating: `export ACTIVE_SURFACE="specs/**,docs/prd/**"` (that department's globs), or write them to `.active-surface`.
3. The department works; the `surface-guard` hook blocks any write outside those globs.
4. Before `[x]`/commit: run `node scripts/check-surfaces.js --owner <dept>` to confirm the change set stayed in one surface.
5. On a cross-surface need, the department reports it; the orchestrator resolves it (never the department reaching out).

## Output Contract

- Every write landed inside the active department's surface; cross-surface writes blocked, not silently merged.
- `AGENT-SURFACES.md` has exactly one owner per path; no gaps for touched paths.
- `check-surfaces.js` green before commit; each commit is single-owner.

## References

- Related: `_agents/department`, `_core/scope-boundaries`, `_sdd/orchestrate`, `_quality/verify-loop`
- Tooling: `scripts/check-surfaces.js`, `hooks/surface-guard.js`, `templates/AGENT-SURFACES.md.template`
- "One owner per path" from cbrock84/headcount
