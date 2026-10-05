# Roadmap

## v0.0.1 (current, 2026-09-16) — Foundational release

**Included (7 skills):**
- `_core/protocol-sync` — 3-file rule
- `_core/coordination` — multi-agent role split
- `_core/scope-boundaries` — off-limits files & commands
- `_core/session-summary` — closing every session properly
- `_quality/verify-loop` — 6-phase verification before `[x]`
- `_sdd/sdd-init` — proposal + plan + tasks before code
- `_meta/skill-creator` — how to add new skills

**Included tooling:**
- `bin/hpaez.js` CLI: init, skill list, skill new, verify, version
- `hooks/verify-build.js` — PostToolUse hook for Claude Code
- Templates for AGENTS.md, STATE.md, CHANGELOG.md, SKILLS.md, CONSTITUTION.md

## v0.1.0 — Quality suite (target: 1-2 weeks)

- `_quality/silent-failure-hunter` — try/catch vacíos, .catch() sin propagar
- `_quality/judgment-day` — dual blind review adversarial
- `_quality/skill-resolution-feedback` — audit what actually shipped vs claimed
- `_quality/rdd` — Receipt-Driven Development lite

## v0.2.0 — Delivery suite (target: 2-3 weeks)

- `_delivery/work-unit-commits` — commits as reviewable units
- `_delivery/chained-pr` — stacked PRs for large changes
- `_delivery/branch-pr` — issue-first PR creation
- `_delivery/release` — semver + changelog + tag

## v0.3.0 — Agent coordination (target: 3-4 weeks)

- `_agents/agent-team` — role definitions
- `_agents/delegation` — when to spawn subagents
- `_agents/model-routing` — model selection by task
- `_agents/subagent-isolation` — context boundaries

## v0.4.0 — Full SDD (target: 1 month)

- `_sdd/constitution` — how to write immutable principles
- `_sdd/plan` — turning proposal into phases with dependencies
- `_sdd/tasks` — atomic task breakdown
- `_sdd/delta-specs` — spec changes tracked separately
- `_sdd/archive` — moving completed specs to `archived/`

## v0.5.0 — Meta expansion (target: 5-6 weeks)

- `_meta/skill-improver` — audit/refactor existing skills
- `_meta/skill-registry` — auto-regenerate AGENTS.md skill table

## v1.0.0 — Stable release (target: 2 months)

- Extensions for Claude Code, Cursor, OpenSpec, Aider fully cabled
- `hpaez registry refresh` implemented
- `hpaez emit --format=cursor` generates `.cursor/rules/*.mdc` from skills
- `hpaez emit --format=aider` generates `CONVENTIONS.md` from skills
- Full test suite
- Published on npm
- GitHub repo with issue templates, contributing guide, examples

## Contribution welcome

Each skill in the roadmap is a good first PR. Pick one, read the design pattern in [`docs/philosophy.md`](philosophy.md), follow [`_meta/skill-creator`](../skills/_meta/skill-creator/SKILL.md), submit.
