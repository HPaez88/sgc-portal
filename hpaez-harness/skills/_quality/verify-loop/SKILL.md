---
name: verify-loop
description: "Trigger: antes de marcar tarea done, marcar [x], commit, deploy, PR, verify, ensure passes. Verificación multi-fase antes de considerar tarea completada — build, tests, sync check, evidencia física."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before marking any task `[x]` in `STATE.md`. Also load before creating a PR, before deploy, and after any refactor. Applies to all agents. This skill is the antidote to "false marks" — tasks claimed done without proof.

## Hard Rules

- A tracker/todo mark is NOT proof of completion. Files on disk + passing build IS proof.
- If any phase below fails, DO NOT mark `[x]`. Fix the failure or roll back, then re-verify.
- Never skip phases with "it probably works" — check.
- If you claimed to install a package, verify with `npm list <pkg>`. If you claimed to create a file, verify with `ls <path>`. If you claimed to remove code, verify with `grep -c <pattern>`.

## Decision Gates

| Phase | Command (example) | Pass criteria |
|-------|-------------------|---------------|
| 1. Build | `npm run build` / `cargo build` / `go build` | exit 0, no errors printed |
| 2. Type check | `tsc --noEmit` / `pyright` / `mypy` | exit 0 |
| 3. Tests | `npm test` / `pytest` / `cargo test` | all passing |
| 4. Lint | `npm run lint` / `ruff` / `clippy` | 0 errors (warnings ok) |
| 5. Physical evidence | Files claimed exist? `ls <path>` returns them. Packages claimed installed? `npm list <pkg>` shows version. Code claimed removed? `grep <pattern>` returns nothing. | 100% match with claim |
| 6. Sync check | `STATE.md` `[x]` count vs `CHANGELOG.md` recent entries | No large discrepancy (each `[x]` has a matching CHANGELOG entry) |

## Execution Steps

1. Determine which phases apply to this task (frontend edit → 1+2+4+5; backend edit → all 6; docs edit → 5 only).
2. Run each applicable phase. Capture the output.
3. For any phase that fails: STOP, log the failure in your response, do not mark `[x]`.
4. For phase 5 (physical evidence): for each claim you made in your task description, run the verification command.
5. Only when ALL applicable phases pass: mark `[x]` in STATE and add CHANGELOG entry.

## Output Contract

- If all phases pass: proceed with `protocol-sync` to mark `[x]`.
- If any fail: response includes:
  - Which phase failed
  - Exact command run
  - First 20 lines of output
  - What you did to try to fix (or "requires human review")
- Never silently mark `[x]` when a phase failed.

## References

- [`skills/_core/protocol-sync/SKILL.md`](../../_core/protocol-sync/SKILL.md) — what to do after verification passes
- Anthropic Claude Code hooks — `PostToolUse` can automate phases 1+2+4 (see `hooks/verify-build.js`)
- Inspired by ECC's `verification-loop` skill
