---
name: task-router
description: "Trigger: qué departamento hace esto, a quién delego, clasificar tarea, enrutar, elegir el mejor agente para el trabajo, no sé qué especialista toca, router de tareas. Usa Jev (choice) para clasificar una tarea entrante al departamento correcto de un conjunto cerrado."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a task arrives and it's not obvious which department/specialist owns it, and you want a consistent routing decision instead of guessing. This is the legit Jev use: classifying a task into a **closed set** of departments (`choice` primitive). It complements `_agents/model-routing` (which model) by answering **which department**.

## Hard Rules

- Routing is a DATA decision over a closed set → use Jev `choice` (see `_quality/data-gate-typesafe`). Never use Jev for the surface-permission check — that's a known rule, handled deterministically by `_agents/surface-guard`.
- Jev only suggests the department; the orchestrator confirms before delegating. Never auto-delegate a destructive or cross-surface task on a routing guess alone.
- The option set is fixed and explicit (the project's departments). Never let Jev invent a department outside the set.
- If `TYPESAFE_API_KEY` is absent, degrade cleanly to the deterministic keyword table below — routing never hard-fails.
- A task that spans 2+ departments is NOT routed to one — the orchestrator splits it (see `_sdd/orchestrate`).

## Decision Gates

| Signal | Route |
|--------|-------|
| Scope, PRD, "what should we build" | `product` |
| Visual, UI, palette, layout | `design` |
| Code, API, refactor, tests | `engineering` |
| Pricing, margins, unit economics | `finance` |
| Positioning, copy, go-to-market | `marketing` |
| CI, runbooks, release, process | `ops` |
| Spans 2+ of the above | Don't route — orchestrator splits |
| No `TYPESAFE_API_KEY` | Use this table directly (deterministic fallback) |

## Execution Steps

1. Load `_quality/data-gate-typesafe` and read the live docs before writing the question.
2. Build a `choice` call: options = the project's departments; context = the task text + any state.
3. Send via the TypeSafe client (`POST .../v1/systemone`, `jev-latest`). Read the chosen option + probability.
4. If probability is low/ambiguous or the task spans departments → do not route; hand back to `_sdd/orchestrate` to split.
5. Present the suggested department to the human/orchestrator; on confirm, delegate via `_agents/department` + `_agents/delegation`.
6. Log the routing decision in `CHANGELOG.md` (`[ROUTED]: <task> → <department> p=<n>`).

## Output Contract

- A single department suggested from the closed set, with its probability — never an invented one.
- Clean degradation to the keyword table when the key is absent.
- The orchestrator confirms before any delegation; cross-surface tasks are split, not force-routed.

## References

- Related: `_quality/data-gate-typesafe` (the Jev client + rules), `_agents/department`, `_agents/model-routing`, `_agents/surface-guard`, `_sdd/orchestrate`
- `typesafe:typesafe-ai` skill · https://docs.typesafe.ai/llms.txt
