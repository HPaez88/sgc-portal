---
name: department
description: "Trigger: agregar departamento, department, org, empresa de agentes, quién es dueño de X, add department not prompt, delegar por dominio de negocio, product/design/finance/marketing/ops agent. Convierte una necesidad de negocio en un sub-agente dueño de una superficie, en vez de inflar el prompt."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a request spans a business domain (product, design, finance, marketing, ops, engineering) and you're tempted to stuff more instructions into the prompt. The rule, borrowed from HeadCount: **don't add more prompt — add a department.** A department is a sub-agent that owns one surface and reports back on a fixed contract.

## Hard Rules

- One department = one owner of one path surface. No two departments write the same path.
- The orchestrator is the sole committer. Departments return work; they never commit.
- A department charter is self-contained: a sub-agent starts cold (see `_agents/delegation`).
- Every department returns on the **Return Contract** (below) — no free-form dumps.
- Do NOT create a department for a task under 3 tool calls — do it yourself.
- Do NOT create overlapping departments. If two need the same surface, the decomposition is wrong (same principle as `_sdd/plan` DAG-no-cycles).
- A new department adds its charter file AND its roster row in the same change (mirrors HeadCount's "one owner per path" guard).

## Decision Gates

| Situation | Action |
|-----------|--------|
| "Design the pricing page" | Delegate to `design` department |
| "Is this margin viable?" | Delegate to `finance` department |
| "Write the landing copy + launch plan" | Delegate to `marketing` department |
| "Build the API for X" | Delegate to `engineering` department |
| "What should the MVP scope be?" | Delegate to `product` department |
| Cross-department decision (e.g. price ↔ feature) | Orchestrator asks each, then decides — never let one department decide another's surface |
| One-file quick fix | Do it yourself, no department |

## Execution Steps

1. Identify the business domain of the request. Map it to a department (default 6: product, design, engineering, finance, marketing, ops).
2. If the department charter doesn't exist yet, generate it from `templates/DEPARTMENT.md.template` into the project's `.claude/agents/<dept>.md` and add its roster row to `STATE.md`.
3. Delegate via `_agents/delegation`: pass the charter's surface + the specific objective. Pick model via `_agents/model-routing`.
4. Receive the department's Return Contract. Verify claims with `_quality/verify-loop` phase 5 if it touched files.
5. Integrate. If the department flagged a cross-surface need, resolve it as orchestrator — do not let the department reach outside its surface.

## Output Contract

Every department returns exactly this (numbered), same as HeadCount charters:

```
1. What changed, by file.
2. Why — the decision or gap it addresses.
3. What was verified, with the command output.
4. Anything left undone, named.
5. Any change needed outside this surface.
6. Open questions for the orchestrator.
```

Default department surfaces (lean builder set):

| Department | Owns (writes) | Loads |
|-----------|---------------|-------|
| product | `specs/**`, `docs/prd/**` | `_sdd/sdd-init`, `_sdd/plan` |
| design | `src/**/*.css`, `components/**`, `styles/**`, design tokens | `_sdd/design-direction` |
| engineering | `src/**`, `server/**`, `api/**`, tests | `_sdd/tasks`, `_quality/verify-loop` |
| finance | `docs/finance/**`, pricing/unit-economics docs | — |
| marketing | `docs/marketing/**`, landing copy, launch plans | — |
| ops | `docs/ops/**`, runbooks, `.github/**` | `_delivery/release` |

## References

- Related: `_agents/delegation`, `_agents/subagent-isolation`, `_core/scope-boundaries`
- Template: `templates/DEPARTMENT.md.template`, examples in `templates/departments/`
- Ported from [cbrock84/headcount](https://github.com/cbrock84/headcount) — "add department, not prompt", one-owner-per-surface, return contract
