---
name: parallel-worktrees
description: "Trigger: trabajar en paralelo, varias sesiones, git worktree, frontend y backend a la vez, correr departamentos en paralelo, acelerar con agentes simultáneos, merge de tracks. Cómo correr tracks/departamentos independientes en git worktrees aislados y fusionarlos sin pisarse."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when 2+ independent tracks of a project can advance at once (e.g. frontend, backend, auth) — typically when `_sdd/orchestrate` delegates several departments in parallel. Git worktrees give each track its own working directory on its own branch, so parallel agents never overwrite each other's files.

## Hard Rules

- One worktree = one branch = one track/department surface. Never two tracks in the same worktree.
- A track only writes inside its department surface (see `_agents/department`, `_core/scope-boundaries`). Worktrees isolate the filesystem; they do not excuse crossing surfaces.
- The orchestrator is the sole merger. Tracks push their branch / return their diff; they never merge each other.
- Branch names encode the track: `track/<department>-<slug>` (e.g. `track/engineering-auth`).
- Merge order follows the plan's DAG — a track that depends on another merges after it. Resolve conflicts at merge time, in the main worktree, not inside a track.
- Do NOT worktree a task that touches shared files across tracks — that's a serialization point; do it in one track.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Front + back + auth, independent | One worktree per track, parallel |
| Tracks share a schema/types file | Do the shared file first in one track, then branch the rest |
| Single vertical slice | No worktrees — one branch |
| Exploration / throwaway | Worktree so main stays clean; delete after |

## Execution Steps

1. From the plan, list independent tracks (the DAG nodes with no pending dependency).
2. For each track, create an isolated worktree + branch:
   ```bash
   git worktree add ../wt-<department>-<slug> -b track/<department>-<slug>
   ```
3. Delegate each track to its department (`_agents/department`) pointed at its worktree path. Launch in parallel (`_agents/delegation`).
4. Each track runs the 3-file rule + `_quality/verify-loop` inside its worktree before returning.
5. Orchestrator merges in DAG order into the main branch, running `verify-loop` after each merge.
6. Clean up: `git worktree remove ../wt-<department>-<slug>` once merged.

## Output Contract

- Each track lived in its own worktree/branch; no cross-track file overwrites.
- Merges done by the orchestrator in DAG order, each verified before the next.
- Worktrees removed after merge; `git worktree list` is clean.
- `STATE.md`/`CHANGELOG.md` reflect each merged track.

## References

- Related: `_sdd/orchestrate`, `_agents/department`, `_agents/delegation`, `_quality/verify-loop`
- `git worktree` docs — https://git-scm.com/docs/git-worktree
- Pattern from Boris/Claude Code: parallel sessions + worktrees for 3-5x throughput
