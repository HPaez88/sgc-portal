---
name: skill-resolution-feedback
description: "Trigger: verificar tareas hechas, audit false marks, tarea marcada [x] pero no ejecutada, gap STATE vs disco, sync check pre-deploy. Audita que cada [x] tenga evidencia real en git status."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before every deploy, and after any agent completes a batch of tasks. This skill catches "false marks" — the failure mode where an agent marks `[x]` in `STATE.md` without actually editing the claimed files.

Real incident (2026-09-16): agent marked T5.21 (install playwright) but neither the config nor the `e2e/` folder existed. Skill-resolution-feedback would have caught this before deploy.

## Hard Rules

- Every `[x]` in `STATE.md` since last audit MUST correspond to a file mentioned in a recent `CHANGELOG.md` entry.
- Every file mentioned in a recent CHANGELOG entry MUST exist on disk with a matching mtime.
- Every "installed package" claim MUST show up in `npm list <pkg>` or equivalent.
- Every "created file" claim MUST return a positive result from `ls <path>`.
- Every "removed code" claim MUST return zero hits from `grep <pattern> <old-location>`.
- On mismatch: REVERT the `[x]` to `[ ]` with a note "FALSA MARCA detectada YYYY-MM-DD" and log to CHANGELOG with tag `[AUDIT]`.

## Decision Gates

| Claim in CHANGELOG | Verification command |
|--------------------|---------------------|
| "Creado archivo X" | `ls X && stat -c '%y' X` (mtime dentro de las últimas 24h) |
| "Instalado paquete Y" | `npm list Y 2>&1 \| grep Y@` |
| "Eliminado archivo Z" | `test ! -e Z && echo OK` |
| "Modificado archivo A (agregada función foo)" | `grep -c 'foo' A` (>0) |
| "Configurado hook en settings" | `cat ~/.claude/settings.json \| grep <hook>` |

## Execution Steps

1. Read last N entries of `CHANGELOG.md` (N = number of `[x]` marks in `STATE.md` added since last audit).
2. For each entry: extract file paths and claims from the "Archivos:" and "Notas:" lines.
3. Run the applicable verification command from the Decision Gates table.
4. Compile a report: `✓ Verified` / `✗ Discrepancia` per claim.
5. For each discrepancia: edit `STATE.md` to revert `[x]` → `[ ]` with note "FALSA MARCA detectada <fecha>".
6. Add a new CHANGELOG entry with tag `[AUDIT]` documenting the audit results.
7. Block deploy if any HIGH-priority task shows discrepancia.

## Output Contract

Audit report:
```
### Skill-Resolution-Feedback Audit — YYYY-MM-DD
Tareas [x] revisadas: N
✓ Verified: N (list task IDs)
✗ Discrepancias: N (list task IDs with what's missing)
Acciones aplicadas: <STATE reverts + CHANGELOG entries>
Deploy blocked: SÍ/NO
```

## References

- [`skills/_quality/verify-loop/SKILL.md`](../verify-loop/SKILL.md) — phase 5 (physical evidence) is single-task version of this
- [`skills/_core/protocol-sync/SKILL.md`](../../_core/protocol-sync/SKILL.md) — the 3-file rule this audits
- Real-world incident: CMOM project 2026-09-16, T5.21 playwright false-marked
