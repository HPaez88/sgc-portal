---
name: agent-team
description: "Trigger: lanzar auditoría, subagente, especialista, quién revisa esto, pre-deploy check, code review automático, agent role. Mapa de agentes especializados por evento del ciclo de vida."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when acting as the deployer/orchestrator deciding which subagent to launch, or when the human requests an audit. Code agents load only for reference — they never invoke subagents themselves.

## Hard Rules

- Only the deployer/orchestrator role invokes subagents. Coder agents (@antigravity, @cursor, etc.) never do.
- No deploy proceeds if any triggered subagent returns severity ≥ HIGH unresolved.
- Every finding follows the Output Contract format below — no free-form reports.
- Exclude from every report: password strength policies (unless project is in prod-hardened mode), MFA UX bikeshedding, stack change proposals.

## Decision Gates

| Trigger event | Subagents to launch | Parallel or sequential |
|---------------|---------------------|----------------------|
| Coder marks `[x]` a batch of code tasks | `code-reviewer` + `typescript-reviewer` (or language-appropriate) | Parallel |
| Edit to `schema.prisma` or DB queries | `database-reviewer` | Solo |
| Before every deploy | `security-reviewer` + `silent-failure-hunter` + `skill-resolution-feedback` | Parallel |
| Build or tests fail | `build-error-resolver` | Solo |
| Design system or large UI added | `a11y-architect` + `impeccable` (skill) | Parallel |
| Quarterly or "feels bad" | `refactor-cleaner` + `performance-optimizer` | Parallel |
| High-risk change (auth, payments, migrations) | `judgment-day` (see `_quality/judgment-day`) | Its own protocol |

## Execution Steps

1. Identify the trigger event from the table.
2. Launch matching subagents in parallel (unless dependencies).
3. Wait for all to complete.
4. Consolidate findings into a single Markdown report grouped by severity.
5. Add corresponding `T#.#` tasks to `STATE.md` for the coder agent to execute.
6. Block deploy if any HIGH/CRITICAL survives without resolution or explicit human override.

## Output Contract

Each subagent finding must include:
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **File:line** — exact location
- **Problema**: 1 sentence
- **Escenario reproducible**: input → damaging result
- **Fix**: 2-5 lines of code, copy-pasteable

Consolidated report lands in the project's `INSTRUCCIONES-AUDITORIA.md` (or equivalent) under a new phase section, with corresponding tasks in `STATE.md`.

## References

- Project's `SKILLS.md` — team-wide techniques (agent-agnostic)
- Related: `_agents/delegation`, `_agents/model-routing`, `_agents/subagent-isolation`
- Inspired by ECC's specialized reviewer agents ecosystem
