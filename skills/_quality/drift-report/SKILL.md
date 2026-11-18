---
name: drift-report
description: "Trigger: el doc sigue reflejando el código?, drift, deriva doc vs código, el spec ya no coincide, docs desactualizados, antes de release revisar docs, CONSTITUTION vs realidad, README miente, plan vs implementado. Compara specs/docs contra el código actual y reporta dónde divergieron."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill to check whether the project's `specs/`, `docs/`, `CONSTITUTION.md`, and `README` still match the code — after a feature lands, before a release, periodically, or whenever someone asks "does the doc still reflect reality?". Catches the slow divergence that `verify-loop` (one task) and `skill-resolution-feedback` (claimed vs shipped) don't: doc↔code drift over the life of the project.

## Hard Rules

- Report drift, **do not auto-fix**. Each item names which side is probably wrong (update the doc, or fix the code) — the human decides. Docs and code can both be right for different reasons.
- Every drift item cites **both** anchors: the doc location (file:line / section) AND the code location (file:line / symbol). No claim without both.
- Read with **fresh eyes**: prefer an isolated subagent (`_agents/subagent-isolation`) that sees only the doc + the code, not this conversation's assumptions. That's the "goldfish" that catches what the drafter normalized.
- Verify against the code on disk, not memory or the doc's own claims (`verify-loop` phase 5 discipline). A doc saying "we use X" is a hypothesis until grep confirms X.
- Do not mark docs "up to date" without re-running the check and attaching evidence.

## Decision Gates

| What to compare | Drift signal |
|-----------------|--------------|
| `CONSTITUTION.md` principles (stack, constraints) | Code uses a lib/pattern the constitution forbids or doesn't list |
| `specs/<slug>/plan.md` phases | A phase marked done has no matching code; code exists for a non-planned feature |
| API docs / `README` endpoints | Route documented but absent, or a live route undocumented |
| README setup / commands | Documented command/script missing from `package.json` or fails |
| Config/env docs | `.env.example` / docs list vars the code never reads, or code reads vars no doc mentions |
| Data model docs | Schema/migrations diverge from documented entities |

## Execution Steps

1. Scope it: which docs and which code area (whole repo, or one feature's `specs/<slug>/` vs its module).
2. Enumerate the **claims** in the docs (each principle, phase, endpoint, command, env var, entity).
3. For each claim, locate the code (grep/read). Classify: `match`, `drift` (differs), `doc-only` (doc claims it, code lacks it), `code-only` (code has it, doc omits it).
4. For drift/doc-only/code-only, recommend the fix side with a one-line rationale.
5. Write `docs/drift/<YYYY-MM-DD>.md` (Output Contract). Present to the human; they choose per item.
6. Fixes go through normal tasks (update doc OR change code), each verified with `verify-loop`; then re-run drift-report to confirm it's clean.

## Output Contract

`docs/drift/<YYYY-MM-DD>.md`:
```markdown
# Drift report — <scope> — <date>

| Claim | Doc anchor | Code anchor | Status | Recommended fix |
|-------|-----------|-------------|--------|-----------------|
| "uses Zod at boundaries" | CONSTITUTION §3 | — | doc-only | add Zod, or drop the claim |
| POST /export | README#api | api/export.ts:12 | match | — |
| phase 3 "email" done | plan.md | — | drift | code missing; reopen phase |

Summary: <n> match · <n> drift · <n> doc-only · <n> code-only
Decision (@human): per row above
```

## References

- Related: `_quality/judgment-day`, `_agents/subagent-isolation`, `_quality/skill-resolution-feedback`, `_quality/verify-loop`, `_sdd/plan`, `_sdd/constitution`
- Idea source: Google's EGM (`egm-drift-report`), Apache-2.0 — adapted agent-agnostic, not vendored
