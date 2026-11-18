---
name: silent-failure-hunter
description: "Trigger: audit, silent failures, try catch vacío, catch sin propagar, fetch sin ok check, JSON.parse sin try, promise sin await, fallo silencioso, error tragado. Encuentra errores que se comen silenciosamente."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before every sync to production, before major refactors, and when the user reports "algo no está funcionando pero no sale error". Silent failures are the #1 cause of ghost bugs.

## Hard Rules

- Report severity `CRITICAL` if the swallowed error is in a payment, auth, audit, data-persistence or user-reported-flow path.
- Never propose "add `console.log`" as a fix — logs still hide the issue. Propose `throw`, `notify.error(...)`, or a proper error boundary.
- Every finding must include file:line + reproducible scenario + concrete fix (2-5 lines of code).
- Exclude findings already known and logged in `STATE.md` under "Fuera de la auditoría".

## Decision Gates

| Pattern | Severity | Typical fix |
|---------|----------|-------------|
| `try { … } catch {}` (empty catch) | HIGH | Log + rethrow, or user-visible feedback |
| `.catch(() => {})` | HIGH | Same as above |
| `.catch(err => console.log(err))` | MEDIUM | Escalate to notify.error + log with context |
| `await fetch(…)` without `if (!res.ok) throw` | HIGH | Add response.ok check |
| `JSON.parse(x)` without try/catch on external x | HIGH | Wrap in try/catch |
| `prisma.x.create(...)` without await | CRITICAL | Add await, this is fire-and-forget |
| `useEffect(async () => {})` uncaught | HIGH | Wrap in try/catch inside the effect |
| Optional chaining hiding null (`data?.results?.[0]?.geometry?.location?.lat`) | MEDIUM | Explicit fallback or error branch |

## Execution Steps

1. Grep for each pattern in the Decision Gates table across `src/`, `server/`, `api/` (or project's source root).
2. For each hit, read 10 lines of context to confirm it's a real silent failure (not a deliberate no-op).
3. Trace what the surrounding function is called from — is it in a user-visible flow? A background job? An audit log?
4. Classify severity per the table.
5. Produce a Markdown report grouped by severity, with file:line + reproducible scenario + code fix.

## Output Contract

Findings report format:
```
### <SEVERITY> — <short title>
**Archivo:** path/file.ext:line
**Problema:** 1 sentence.
**Escenario reproducible:** input → observable damage.
**Fix:** 2-5 lines of code, copy-pasteable.
```

Grouped by severity (CRITICAL first). Include a "Dominios revisados y limpios" section at the end naming what you checked and found nothing.

## References

- OWASP Top 10 — error handling section
- [`skills/_quality/verify-loop/SKILL.md`](../verify-loop/SKILL.md) — physical verification of fixes
- Inspired by Anthropic's `silent-failure-hunter` subagent
