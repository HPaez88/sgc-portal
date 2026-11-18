---
name: tasks
description: "Trigger: escribir tasks, tasks.md, atomic tasks, T1.1, task breakdown, backlog inicial. Convierte plan.md en tasks.md — tareas atómicas listas para STATE.md."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill after `_sdd/plan` has produced `plan.md`. This skill decomposes phases into atomic, executable tasks with acceptance criteria. Do not load before plan exists.

## Hard Rules

- Every task must be atomic: one clear objective, testable in isolation, executable by one agent in one session.
- Every task must have an acceptance criterion — how you know it's done, not just "implemented".
- Task IDs follow `T<phase>.<index>` (e.g. `T1.1`, `T2.3`).
- Tasks copied into `STATE.md` MUST match `tasks.md` exactly (no divergence).
- If a task grows during execution → stop, split it, update both `tasks.md` and `STATE.md`.

## Decision Gates

| Task feels too big | Split by |
|--------------------|----------|
| Touches > 3 files | File boundaries |
| Would take > 2 hours | Time boundaries |
| Has "and" in the description | Conceptual boundaries |
| Requires human decision mid-flight | Insert a `[BLOCKED-ON-HUMAN]` task before |

## Execution Steps

1. Read `specs/<slug>/plan.md`. For each phase:
2. Enumerate concrete tasks needed to complete the phase.
3. Assign IDs `T<phase>.<index>`.
4. For each task, write:
   - **Task ID**
   - **Descripción** (imperative, ≤ 100 chars)
   - **Archivos afectados** (paths)
   - **Acceptance criteria** (how to verify done)
   - **Owner role** (from `_agents/agent-team`)
   - **Depends on** (other T#.# if any)
5. Write to `specs/<slug>/tasks.md`.
6. Copy the task list into `STATE.md` under a new section for this feature slug.
7. Get human review before implementation starts.

## Output Contract

`tasks.md` template:
```markdown
# Tasks: <feature-slug>

## Phase 1: <name>
### T1.1 — <descripción>
- **Archivos:** src/x.ts, tests/x.test.ts
- **Acceptance:** `npm test` shows new test passing; endpoint returns 200 on valid input
- **Owner:** @coder
- **Depends on:** —

### T1.2 — <descripción>
...

## Phase 2: <name>
### T2.1 — <descripción>
- ...
- **Depends on:** T1.1
```

`STATE.md` entry format:
```markdown
### Feature <slug> — Phase 1
- [ ] `T1.1` @coder — <one-line descripción>
- [ ] `T1.2` @coder — <one-line descripción>
```

## References

- Related: `_sdd/plan`, `_sdd/sdd-init`, `_core/protocol-sync`
- Inspired by GitHub Spec Kit's Tasks phase + OpenSpec's tasks.md
