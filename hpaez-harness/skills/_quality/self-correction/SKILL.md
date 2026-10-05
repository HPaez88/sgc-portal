---
name: self-correction
description: "Trigger: el human me corrige, no hagas eso otra vez, ya te dije, volviste a fallar, mismo error, regresión, build falló por lo mismo dos veces, aprendiste mal, actualiza tu contexto. Convierte cada corrección o error repetido en una regla escrita en CONSTITUTION.md para no repetirlo nunca."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill the moment you're corrected or you catch yourself repeating a mistake. A lesson that lives only in this session's context is lost at session end — the same error returns next time. This skill makes the lesson persist as a rule. (Boris/Claude Code: "cada vez que la IA se equivoca, que actualice su propio contexto para no repetir el error" — here that context is `CONSTITUTION.md`, not a chat.)

## Hard Rules

- Every correction from the human that reveals a preference, a wrong assumption, or a repeatable failure → write a rule. Do it in the SAME turn, before continuing the task.
- Generalize the incident into a rule. Record the specific incident once, in parentheses, as evidence — never as the rule itself.
- Rules go in `CONSTITUTION.md` under "Lecciones aprendidas en sesión", dated. Tag the change in `CHANGELOG.md` with `[LESSON]`.
- Do NOT record one-off typos, transient tool errors, or anything already covered by an existing rule (check first — no duplicates).
- A lesson that recurs 3+ times or is architectural → promote it from "Lecciones" to a formal principle (see `_sdd/constitution`), not just an append.
- Apply the new rule immediately in the current task — writing it down without acting on it is theater.

## Decision Gates

| Signal | Action |
|--------|--------|
| Human says "no hagas X" / "ya te dije" / "otra vez lo mismo" | Write a rule now |
| Same build/test failed twice for the same root cause | Write a rule naming the root cause + guard |
| You discover an assumption you made was wrong | Write a rule stating the real constraint |
| Human states a preference (naming, style, tool, flow) | Write a rule; consider a `feedback` memory too |
| One-off slip, unique to this task, won't recur | No rule — YAGNI applies to lessons too |
| Lesson recurs 3+ times / is architectural | Promote to a formal `CONSTITUTION.md` principle |

## Execution Steps

1. Name the mistake in one sentence: what you did, what was expected.
2. Find the root cause, not the symptom (same discipline as a bug fix — one rule at the shared cause beats N rules per symptom).
3. Check `CONSTITUTION.md` — is this already a rule? If yes, it wasn't followed; strengthen wording, don't duplicate.
4. Append to `CONSTITUTION.md` → "Lecciones aprendidas en sesión":
   `- YYYY-MM-DD — <regla general>. (incidente: <qué pasó una vez>)`
5. Add a `CHANGELOG.md` line: `[LESSON]: <regla en 1 línea>`.
6. Apply the rule to the current work immediately.
7. If it's a personal/cross-project preference (not project-specific), also write a `feedback` auto-memory.

## Output Contract

- `CONSTITUTION.md` gained a dated, generalized lesson line (not a raw incident report).
- `CHANGELOG.md` has a `[LESSON]` entry.
- The current task now reflects the corrected behavior.
- No duplicate of an existing rule; recurring/architectural lessons promoted to formal principles.

## References

- Related: `_sdd/constitution`, `_meta/skill-improver`, `_quality/skill-resolution-feedback`, `_quality/verify-loop`
- Writes to: `CONSTITUTION.md` (Lecciones section), `CHANGELOG.md`
- Ported idea: self-updating agent context (Boris / Claude Code) — persist lessons, don't re-learn them
