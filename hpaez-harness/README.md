# hpaez-harness

**Discipline for AI coding, portable to any agent.**

A curated agent harness that combines the best patterns from Gentle-Pi, GitHub Spec Kit, OpenSpec, BMAD-METHOD, Anthropic Skills, and Claude Code hooks — packaged as an install-and-forget harness for any project.

## Why

An agent without a harness is speed without direction. A prompt is a hope. A harness is a contract.

This harness gives every project on your machine (no matter which AI you use — Claude Code, Antigravity, OpenCode, Cursor, GPT via OpenRouter, Aider, Continue, Cline, Devin, etc.):

- A shared **AGENTS.md** manifest all 30+ agents read on start.
- A **3-file discipline** (STATE + CHANGELOG + code) so nothing is "done" until it's on disk.
- **Skills as runtime contracts** with progressive disclosure (Anthropic spec).
- **Automated verification hooks** so build failures block `[x]` marks.
- **Spec-driven artifacts** (proposal → plan → tasks → implement) before any code.
- **Multi-agent coordination** via role split (@architect, @coder, @reviewer, @deployer).

## Install

```bash
npm install -g hpaez-harness
```

## Quickstart

In any project directory:

```bash
hpaez init
```

Answer 3 questions and you get:
- `AGENTS.md` — skill index at the root
- `STATE.md` — task board
- `CHANGELOG.md` — append-only timeline
- `SKILLS.md` — team techniques catalog
- `CONSTITUTION.md` — project's immutable principles
- `skills/_core/*` — 6 core skills already wired
- Hooks in `~/.claude/settings.json` for auto-verification

Then work as usual with any agent. The harness enforces discipline automatically.

## Skills included in v0.7.0

**Core (4)** — protocol-sync, coordination, scope-boundaries, session-summary
**Quality (6)** — verify-loop, silent-failure-hunter, judgment-day, skill-resolution-feedback, rdd, self-correction
**SDD (7)** — sdd-init, constitution, plan, tasks, delta-specs, archive, design-direction
**Delivery (4)** — work-unit-commits, chained-pr, branch-pr, release
**Agents (5)** — agent-team, delegation, model-routing, subagent-isolation, department
**Meta (4)** — skill-creator, skill-improver, skill-registry, skill-security

**30 skills.** Add your own with `hpaez skill new <name>`.

New in v0.7.0:
- **self-correction** (`_quality`) + Lessons section in `CONSTITUTION.md.template` — every human correction or repeated mistake becomes a written rule so it never recurs (self-updating agent context, per Boris/Claude Code).

New in v0.6.0 (ported from studied open-source repos):
- **department** + `templates/DEPARTMENT.md.template` + 6 example charters — "add department, not prompt", one-owner-per-surface + return contract (from [cbrock84/headcount](https://github.com/cbrock84/headcount)).
- **design-direction** + diagrams step in `plan` — visual direction before markup, no generic-template look (diagrams via native Mermaid / `artifact-diagramming`; the `diagram-design` repo was scanned and rejected as CRITICAL).
- **skill-security** + `hooks/skill-audit.js` (Write) + `hooks/skill-clone-audit.js` (git clone / gh repo clone / degit) — gate third-party skill installs through [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) on both install paths (fail-closed on score > 50).

## Compatibility

Reads and writes AGENTS.md (Linux Foundation Agentic AI Foundation standard, adopted by 60,000+ repos and 30+ agents). Any AI that respects AGENTS.md gets the discipline automatically.

Explicit adapters for: Claude Code (hooks + subagents), Cursor (.cursor/rules generation), OpenSpec (proposal/plan/tasks templates), Aider (CONVENTIONS.md emit).

## Philosophy

- **Boring wins.** Predictable protocols over clever prompts.
- **Disk is truth.** Internal tracker doesn't count.
- **Small skills.** Under 500 lines each, Progressive Disclosure.
- **Agent-agnostic.** No lock-in to one AI provider.
- **Iterate.** Every project can add new skills back to the harness.

## Credits

This harness stands on the shoulders of:
- [Gentle-Pi](https://github.com/Gentleman-Programming/gentle-pi) by Alan Buscaglia — SDD + Judgment Day + RDD patterns.
- [GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) — Constitution → Plan → Tasks → Implement pipeline.
- [BMAD-METHOD](https://github.com/bmad-code/bmad-method) — agile role split for agents.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — proposal + delta specs artifact layout.
- [Anthropic Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — SKILL.md format and Progressive Disclosure.
- [AGENTS.md standard](https://agents.md) — Linux Foundation Agentic AI Foundation.

Full acknowledgments in [docs/philosophy.md](docs/philosophy.md).

## License

MIT © Hpael (2026)
