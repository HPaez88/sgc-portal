---
name: delegation
description: "Trigger: delegar, subagente, exploration, más de 4 archivos, big task, parallel work, workload split. Cuándo spawn un subagente vs hacer el trabajo tú mismo."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before deciding whether to spawn a subagent. Applies to any agent that has subagent-spawning capability (Claude Code Task tool, Cursor sub-agents, etc.).

## Hard Rules

- Delegate exploration when the answer requires reading > 4 files or > 500 lines of code.
- Delegate parallel work when 2+ independent tracks can run simultaneously.
- Do NOT delegate for tasks < 3 tool calls — round-trip overhead beats parallelism.
- Do NOT delegate destructive operations (deletes, force pushes) — those need human context.
- Subagent prompts must be self-contained — a subagent starts cold, no shared context.
- Never delegate the same task to two subagents unless doing `judgment-day` (dual blind).

## Decision Gates

| Situation | Action |
|-----------|--------|
| "Find where X is used in the codebase" (unknown result size) | Delegate to explore subagent |
| "Refactor these 3 files I already read" | Do it yourself |
| Multiple independent audits (security + typescript + dead-code) | Delegate 3 in parallel |
| Deep research (multi-source, multi-page) | Delegate to research subagent |
| One-off scripts, quick fixes | Do it yourself |
| Task > 1 hour of estimated work | Delegate + split into subtasks |

## Execution Steps

1. Estimate task complexity: file count, tool calls, unknown-vs-known scope.
2. Match against Decision Gates table.
3. If delegating:
   - Write a self-contained prompt (see Output Contract).
   - Choose the right subagent type (see `_agents/agent-team`).
   - Choose the right model (see `_agents/model-routing`).
   - Launch. Continue with other work if independent.
4. When subagent completes, integrate its output. Don't blindly trust — verify with `verify-loop` phase 5 if the subagent made claims.

## Output Contract

Subagent prompt template:
```
You are working on <project name>.

Your task: <one clear objective>.

Context you need (subagent starts cold):
- Location of relevant code: <paths>
- What was already tried: <if applicable>
- Constraints: <do not touch X, do respect Y>

Deliverable format:
<exact shape of what you want back — table? report? code diff?>

Report length: <under N words>.
```

Never write "based on your findings, do X" — that pushes synthesis onto the subagent. Write "return findings only" and integrate yourself.

## References

- Related: `_agents/agent-team`, `_agents/subagent-isolation`, `_agents/model-routing`
- Anthropic Claude Code Task tool docs
- Inspired by Gentle-Pi's Delegation Harness
