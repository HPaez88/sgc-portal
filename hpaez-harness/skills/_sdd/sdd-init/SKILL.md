---
name: sdd-init
description: "Trigger: nueva feature, empezar implementación grande, más de 3 archivos, más de 1 sesión, spec-driven, arquitectura, planear antes de codear. Crea proposal.md + plan.md + tasks.md antes de tocar código."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when the task at hand meets any of:
- Touches >3 files
- Will span >1 session
- Introduces a new module or major refactor
- Has architectural implications
- User explicitly asks for a plan, spec, blueprint, or roadmap

Do NOT load for: bug fixes < 5 minutes, single-file edits, "just do it" tasks.

## Hard Rules

- Never write implementation code before the 3 artifacts exist: `proposal.md`, `plan.md`, `tasks.md`.
- Each artifact lives under `specs/<slug>/` (or `openspec/proposals/<slug>/` if using OpenSpec conventions).
- Update the artifacts before code, not after. If code drifts from spec → update spec first, then code.
- Archive completed specs to `specs/archived/<slug>-<YYYY-MM-DD>/` — never delete.
- The plan must respect `CONSTITUTION.md` — cite which principles it upholds/challenges.

## Decision Gates

| Artifact | Contains |
|----------|----------|
| `proposal.md` | Problem statement, user need, acceptance criteria (what "done" looks like), non-goals, alternatives considered |
| `plan.md` | Phases with dependencies (DAG), file paths to touch, technical decisions with rationale, risks |
| `tasks.md` | Ordered `T#.#` tasks with 1-line description each, ready to paste into STATE.md |

## Execution Steps

1. Create directory `specs/<kebab-case-slug>/`.
2. Write `proposal.md` first (5-15 min of thinking + writing). If you can't articulate the problem, you can't code the solution.
3. Get human review of `proposal.md` before advancing to plan.
4. Write `plan.md` — break the work into phases; each phase should be independently reviewable.
5. Write `tasks.md` — decompose the plan into atomic tasks (`T1.1`, `T1.2`, etc.) with clear acceptance.
6. Copy the tasks from `tasks.md` into `STATE.md` under a new section for this feature.
7. NOW you can start writing code, one task at a time, following `protocol-sync`.
8. When feature is done, move `specs/<slug>/` to `specs/archived/<slug>-<YYYY-MM-DD>/`.

## Output Contract

- Three artifacts exist under `specs/<slug>/` before any implementation edit.
- `STATE.md` contains a section referencing the spec slug with the derived tasks.
- CHANGELOG entry tagged `[DOCS]` for each artifact created.

## References

- [GitHub Spec Kit](https://github.com/github/spec-kit) — Constitution → Plan → Tasks → Implement pipeline
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — proposal + delta specs + design + tasks pattern
- [`CONSTITUTION.md`](../../../CONSTITUTION.md) — project's immutable principles this plan must respect
- [`skills/_core/protocol-sync/SKILL.md`](../../_core/protocol-sync/SKILL.md) — how to execute the tasks once created
