---
name: data-gate-typesafe
description: "Trigger: TypeSafe, Jev, System One, compuerta de datos, juicio tipado, clasificar texto libre del usuario, priorizar, validar entrada, score/choice/probabilidad, ¿debería la IA decidir esto?, reemplazar un prompt-and-parse. Cuándo y cómo usar TypeSafe (modelo Jev) como compuerta de calidad de DATOS en runtime."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a feature receives **free text from the user that today a person classifies, validates, or prioritizes by hand** and you're considering an AI judgment for it. TypeSafe (model Jev, API System One) returns typed judgments code can use directly. This is a DATA gate, not a code gate.

## Hard Rules

- Jev is NOT code quality. Never propose it to "make the program more solid" — for that use `_quality/verify-loop`, tests, and review agents. Jev decides about **data at runtime**.
- It only suggests or warns; it never writes, deletes, or blocks silently. The person confirms.
- `TYPESAFE_API_KEY` lives **server-side only** — never `VITE_`-prefixed, never in the client. Without the key the feature turns off cleanly (hidden button / response `disponible:false`), never breaks.
- Minimal client with native `fetch` (`POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`, retry on 429/529, timeout). No new dependency unless the SDK is actually needed.
- Pure logic separated from the network (build questions / interpret answers) with its own test. Initial thresholds marked with a `ponytail:` comment and a task in `STATE.md` to calibrate them with real data.
- One live check `scripts/check-typesafe.ts` that sends a real case and fails if the response isn't the expected one.
- Before writing a question, load the `typesafe:typesafe-ai` skill and read https://docs.typesafe.ai/llms.txt.

## Decision Gates

| ¿Qué necesito? | Primitiva |
|----------------|-----------|
| Una opción de un conjunto cerrado | `choice` |
| Probabilidad de sí/no | `noul` |
| Nivel en una escala descrita | `score` |
| Cálculos, reglas conocidas, búsquedas exactas, generación de texto | **No uses Jev** — usa código, reglas, índice, o un LLM normal |

## Execution Steps

(The order followed in CMOM and TEMARQ.)
1. **Env opcional** — validate `TYPESAFE_API_KEY` at startup, server-only; if absent, feature off (no throw).
2. **Cliente** — native `fetch` wrapper: `POST .../v1/systemone`, `jev-latest`, retry 429/529, timeout.
3. **Lógica pura + test** — build-questions / interpret-answers functions, no network; thresholds as named constants with `ponytail:` + a `STATE.md` calibration task.
4. **Endpoint / sub-router** — expose behind the right role and a rate limit.
5. **Botón** — UI only pre-fills or warns; never writes/deletes/blocks; hidden when `disponible:false`.
6. **Check vivo + 3 archivos** — `scripts/check-typesafe.ts` + update code, `STATE.md`, `CHANGELOG.md`.

## Output Contract

- Key server-side only; feature degrades cleanly without it.
- Pure logic unit-tested; `scripts/check-typesafe.ts` runnable and green on a real case.
- Every Jev output reaches the user as a suggestion/warning they confirm — never a silent mutation.
- `STATE.md` carries the threshold-calibration task; `CHANGELOG.md` records the integration.

## References

- `typesafe:typesafe-ai` skill · https://docs.typesafe.ai/llms.txt (live docs — read before writing questions)
- Reference impl 1 (CMOM): `CONRAD 5X/Programa/backend/src/utils/typesafe.ts` + `utils/sugerenciasTipo.ts`
- Reference impl 2 (TEMARQ): `TEMARQ-HUB/server/_core/typesafe.ts` + `shared/quoteRequestAnalysis.ts`
- Related: `_quality/verify-loop` (code gate, not data gate), ECC rule `common/ai-data-gates.md`
