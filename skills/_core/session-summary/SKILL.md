---
name: session-summary
description: "Trigger: fin de sesión, cerrar, terminar, done for today, hasta mañana, rate limit alcanzado. Registra estado final y contexto de compactación para la próxima sesión (propia o de otro agente)."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill at the end of every session (whether you finished all tasks or got interrupted). Also load when you sense rate limit approaching or when the human says "cerramos", "por hoy", "hasta mañana".

## Hard Rules

- Never close a session without writing a summary entry to `CHANGELOG.md` with tag `[SESSION-END]`.
- The summary must be actionable — a fresh agent (or you tomorrow) should be able to resume cold from it.
- Include unfinished tasks with their exact state (in-progress, blocked, pending review).
- Include any decisions the human still owes.
- Do not mark `[x]` tasks that are only partially done — split them or leave them `[ ]`.

## Decision Gates

| Session ended by | Summary emphasis |
|-------------------|------------------|
| Task completion (green path) | What shipped, what's next in queue |
| Rate limit or crash | What was mid-flight, what needs re-verification (see `verify-loop`) |
| Human said "cerramos" | What decisions the human still needs to make, what's blocked on them |
| Handoff to another agent | Exact next step for that agent, files to touch first |

## Execution Steps

1. Review the current session — what tasks you completed, what you started but didn't finish, what you learned that's new.
2. Verify `STATE.md` reflects reality (run `verify-loop` phase 5 for each recent `[x]`).
3. If any `[x]` is actually incomplete, revert it to `[ ]` with a note.
4. Append this entry to `CHANGELOG.md` at the top:

```markdown
## YYYY-MM-DDTHH:MMZ · @agent · [SESSION-END] · Resumen de sesión
Completado en esta sesión: T#.#, T#.#, ...
En curso al cerrar: <descripción del estado exacto de lo que quedó mid-flight>
Bloqueadores para próxima sesión: <lista>
Decisiones pendientes del @human: <lista>
Próximo paso recomendado: <exactamente qué archivo tocar primero al reabrir>
- Deploy pendiente: SÍ / NO
- Notas: (opcional)
```

5. If working with persistent memory (Claude Code `.claude/memory/` or `ck` or Engram), also update the "current session" note there so the next session's discovery phase picks it up automatically.

## Output Contract

- Entry in CHANGELOG.md with tag `[SESSION-END]`.
- STATE.md accurately reflects disk state (no false `[x]`).
- If handoff to another agent, mention the target agent explicitly in the entry.

## References

- [`skills/_core/protocol-sync/SKILL.md`](../protocol-sync/SKILL.md) — 3-file rule
- [`skills/_quality/verify-loop/SKILL.md`](../../_quality/verify-loop/SKILL.md) — phase 5 (physical evidence) to verify `[x]` claims before closing
- Inspired by Gentle-Pi's Session Summary / Compaction Recovery Harness (#30 in Alan's video)
