---
name: coordination
description: "Trigger: iniciar sesión, empezar tarea, primer contacto con el proyecto, qué toca hacer, quién hace qué. Cómo colaboran múltiples agentes en el mismo proyecto sin choques."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill at the start of every session, before reading code or planning edits. Applies to all agents (Claude Code, Antigravity, OpenCode, Cursor, Aider, Continue, Cline, GPT via OpenRouter, etc.).

## Hard Rules

- Never repeat a task already marked `[x]` in `STATE.md`.
- Do not invoke deploy commands (`docker`, `ssh`, `scp`, `prisma migrate`, `kubectl apply`) unless your role explicitly owns infra.
- When you find bugs outside your current task, log them under "Fuera de la auditoría" in STATE — do not fix them mid-batch.
- If your model has a native equivalent of a documented skill, use yours and log `[TECHNIQUE-USED] your-skill vs documented-skill` in CHANGELOG.
- Respect the role split defined in the project (typically: @architect plans, @coder implements, @reviewer audits, @deployer syncs to server, @human decides).

## Decision Gates

| Role split (typical) | Owns | Never touches |
|----------------------|------|---------------|
| `@architect` / planner agent | High-level design, ADRs, breaking down features into tasks | Implementation details |
| `@coder` (Antigravity, Cursor, etc.) | Business logic, UI, tests | Infra (docker, .env, deploy scripts) |
| `@reviewer` / audit agent | Code review, security review, silent-failure hunting | Direct edits (proposes, doesn't apply) |
| `@deployer` (typically Claude Code) | Docker, deploy, `.env`, scripts, audits, memory | Business logic |
| `@human` | Strategic decisions, destructive approvals, tie-breaks | — |

Project can add/remove roles. Document in `CONSTITUTION.md`.

## Execution Steps

1. Read `STATE.md` — find open `[ ]` tasks assigned to your role (or unassigned if you're the only agent).
2. Scan last 3-5 entries of `CHANGELOG.md` — avoid repeating recent work.
3. Consult `SKILLS.md` if the task involves audit, refactor, design, a11y, or performance.
4. Load `skills/_core/protocol-sync/SKILL.md` — sync rules apply from the first edit.
5. Load `skills/_core/scope-boundaries/SKILL.md` if planning to touch anything outside typical safe zones.
6. Load `skills/_quality/verify-loop/SKILL.md` before marking any task done.

## Output Contract

- Every completed task = 3 files edited (see `protocol-sync`).
- Deploy requests: update STATE + CHANGELOG, then stop. The deployer agent handles the actual sync.
- End-of-session summary: mention what remains and any blockers for the next agent (see `session-summary`).

## References

- `AGENTS.md` — full skill index
- [`skills/_core/protocol-sync/SKILL.md`](../protocol-sync/SKILL.md) — sync rules
- [`skills/_quality/verify-loop/SKILL.md`](../../_quality/verify-loop/SKILL.md) — pre-mark verification
- `CONSTITUTION.md` — project's role split and immutable rules
- `SKILLS.md` — team techniques catalog
