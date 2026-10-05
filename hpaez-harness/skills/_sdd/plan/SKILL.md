---
name: plan
description: "Trigger: escribir plan, plan.md, roadmap técnico, fases, DAG, dependencias, technical design. Convierte proposal.md aprobado en plan.md con fases + dependencias + decisiones."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill after `_sdd/sdd-init` has produced `proposal.md` and the human approved it. This skill turns the WHY (proposal) into the HOW (plan). Do not load before proposal exists.

## Hard Rules

- Never write code before `plan.md` exists and is reviewed.
- Every phase in the plan must be independently reviewable and testable.
- Phase dependencies form a DAG (no cycles). If cycle → decomposition is wrong.
- Every technical decision has an explicit rationale referencing `CONSTITUTION.md`.
- Estimate risk per phase (low/medium/high) with a mitigation strategy for high-risk ones.
- A plan touching a process or multi-component flow ships a diagram (architecture or process flow) — a phases table alone hides coupling. Use native Mermaid or the `artifact-diagramming` skill.

## Decision Gates

| Situation | Plan structure |
|-----------|----------------|
| Feature is a single vertical slice | 1-3 phases (foundation → feature → polish) |
| Feature spans front + back + DB | 4-6 phases (schema → API → UI → integration → tests → docs) |
| Migration or refactor | Extra "cutover strategy" phase with rollback plan |
| Change touches security/auth/payments | Mandatory `_quality/judgment-day` phase before merge |

## Execution Steps

1. Read `specs/<slug>/proposal.md`. Confirm it's approved.
2. Read `CONSTITUTION.md`. Note which principles the plan will uphold or challenge.
3. Draft `plan.md` in `specs/<slug>/plan.md`:
   - Overview (2-3 sentences)
   - Phases table (name, files touched, risk, dependencies)
   - Technical decisions (each with rationale + rejected alternatives)
   - Risks and mitigations
   - Out of scope (what the plan explicitly does NOT do)
   - Diagram (for process/multi-component plans): architecture or process flow via native Mermaid or `artifact-diagramming`
4. Get human review before advancing to `_sdd/tasks`.
5. If plan is later invalidated (constitution change, discovered constraint), archive it in `specs/<slug>/plan-v1.md` and write `plan-v2.md`.

## Output Contract

`plan.md` template:
```markdown
# Plan: <feature-slug>

## Overview
<2-3 sentences>

## Phases
| # | Name | Files | Risk | Depends on |
|---|------|-------|------|-----------|
| 1 | foundation | ... | low | - |
| 2 | ... | ... | ... | 1 |

## Technical decisions
### Decision 1: <name>
- Chosen: <option>
- Rationale: <why> (refs CONSTITUTION §N)
- Rejected: <alternatives + why not>

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| ... | med | high | ... |

## Out of scope
- <explicit non-goal 1>
- <non-goal 2>
```

## References

- Related: `_sdd/sdd-init`, `_sdd/tasks`, `_sdd/constitution`, `_sdd/design-direction`
- Diagrams: native Mermaid or the ECC `artifact-diagramming` skill. Do NOT install a third-party diagram skill — `diagram-design`, `archify`, and `mcp_excalidraw` were all evaluated and rejected (100/100 CRITICAL via `_meta/skill-security`). See `docs/LESSONS.md`.
- Inspired by GitHub Spec Kit's Plan phase
- Blueprint skill (ECC): [`~/.claude/skills/blueprint/SKILL.md`](file:///~/.claude/skills/blueprint/SKILL.md) — for multi-session plans
