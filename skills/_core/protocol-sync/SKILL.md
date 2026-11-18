---
name: protocol-sync
description: "Trigger: antes de cualquier edición al proyecto, marcar tarea hecha, terminé, listo, done. Sincroniza STATE.md y CHANGELOG.md después de cada archivo tocado — regla de 3 archivos por tarea."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before writing to any file in the project. Your internal todo list does not count as "done" — only what is on disk counts. The team sees `STATE.md` and `CHANGELOG.md`, not your tracker.

## Hard Rules

- Every task = 3 files edited: the code file + `STATE.md` + `CHANGELOG.md`. No exceptions.
- Update `STATE.md` and `CHANGELOG.md` **immediately** after each edit, not batched at end of turn.
- Never start a new task while the previous is unmarked in `STATE.md`.
- Do not delete or reorder past entries in `CHANGELOG.md` — append-only, newest at top.
- Never claim a task done without first running the applicable build/test (see `verify-loop`).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Just edited a code file | Run verify-loop, then mark `[x]` in STATE + append CHANGELOG entry |
| Previous task not yet in STATE | Stop, update it, then continue |
| Discovered work outside scope | Add `[ ]` under "Fuera de la auditoría" in STATE, do not fix it |
| Rate limit / crash mid-batch | On next turn, first check STATE vs actual disk state, sync gap |
| Build fails after edit | Do NOT mark `[x]`. Fix or roll back first. |

## Execution Steps

1. Edit the code file.
2. Run the applicable build/test (see `verify-loop`).
3. If build passes, open `STATE.md`, mark `[x]` on the matching task line.
4. Open `CHANGELOG.md`, insert new entry at top (after header) using the format in Output Contract.
5. Only now proceed to next task.

## Output Contract

CHANGELOG entry format:

```markdown
## YYYY-MM-DDTHH:MMZ · @autor · [TAG] · Título corto
Descripción en 1-4 líneas.
- Archivos: ruta1.ext, ruta2.ext
- Tareas STATE: T0.2
- Deploy: SÍ / NO
- Notas: (opcional)
```

Valid tags: `[FIX]` `[FEATURE]` `[CLEANUP]` `[DOCS]` `[SECURITY]` `[DEPLOY]` `[INFRA]` `[AUDIT]` `[MEMORY]`.

Author: use your own agent identifier prefixed with `@` (e.g. `@claude-code`, `@antigravity`, `@opencode`, `@cursor`, `@human`).

## References

- `STATE.md` — task board
- `CHANGELOG.md` — timeline
- `AGENTS.md` — skill index
- [`skills/_quality/verify-loop/SKILL.md`](../../_quality/verify-loop/SKILL.md) — pre-mark verification
