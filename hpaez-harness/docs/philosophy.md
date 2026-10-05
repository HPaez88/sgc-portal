# Philosophy

## Why hpaez-harness exists

An AI agent without a harness is speed without direction. It produces plausible code that drifts from intent, hallucinates APIs, and decays as the project scales. The industry response in 2026 was "vibe coding" — spray-prompt and pray. It doesn't work.

The alternative is **discipline**: encoding the workflow rules into runtime contracts the agent can't ignore. That's what a harness is.

## The three lessons that shaped this harness

### 1. The tracker doesn't count

In September 2026, working on a real municipal project, we handed a task list to an agent. It marked every task "done" in its internal UI. We celebrated. Then we checked the disk: **zero files touched**.

The tracker is a hope. Files on disk are the truth. `hpaez-harness` enforces this with the **3-file rule** (protocol-sync) and the **verify-loop** skill: no `[x]` without physical evidence + passing build.

### 2. Compilation ≠ correctness

Same project, next day. Agent added `useRef` to a React component without importing it. Build compiled fine (Vite doesn't catch undefined globals until runtime). Deploy went out. Users saw a blank error screen with "useRef is not defined."

`verify-loop` phase 5 (physical evidence) catches this: after every hook add, `grep -q "use[A-Z]"` for each new hook confirms it's in the React import line.

### 3. Prompts are hopes

We wrote a beautiful prompt with the 3-file rule and the verify steps. Agent read it. Then ignored it and marked tasks done without editing anything.

**Prompts are politeness. Hooks are enforcement.** `hpaez-harness` ships hooks (`hooks/verify-build.js`, `hooks/check-state-sync.js`) that block the agent from claiming completion when the disk contradicts the claim. The agent can't ignore what runs automatically.

## The 4 pillars

1. **AGENTS.md as manifesto** — one file at the root, 30+ agents respect it. Portability by design.
2. **Skills with progressive disclosure** — small SKILL.md contracts (180-450 tokens), loaded only when their trigger fires. Anthropic's spec.
3. **Spec-driven artifacts** — proposal → plan → tasks live in `specs/` before any implementation. Adapted from GitHub Spec Kit and OpenSpec.
4. **Automatic verification** — hooks running on every tool use. Failure blocks the task, not just warns.

## What we borrow, and from whom

- **Gentle-Pi** (Alan Buscaglia) — the 20 harnesses framing, Judgment Day, RDD, delegated verification, chained PRs, the very idea that a harness is a code artifact, not documentation.
- **GitHub Spec Kit** — Constitution as immutable principles, Plan → Tasks → Implement pipeline.
- **OpenSpec** (Fission-AI) — proposal + delta specs + design + tasks + archived artifacts layout.
- **BMAD-METHOD** — agile role split (Architect, Coder, Reviewer, Deployer, Human).
- **Anthropic Skills** — SKILL.md format, progressive disclosure, description-as-routing-rule.
- **Claude Code hooks** — PostToolUse, PreToolUse, Stop lifecycle events for automatic enforcement.
- **AGENTS.md** (Linux Foundation Agentic AI Foundation) — the universal manifest standard.
- **Aider** — `/read CONVENTIONS.md` with prompt caching pattern.
- **Cursor `.mdc` rules** — glob-based auto-attach as an inspiration for future adapter.

## What we don't do

- **No lock-in to one AI.** Any agent that respects AGENTS.md gets the discipline for free.
- **No opinion on framework or language.** The harness is language-agnostic; project-specific rules live in `CONSTITUTION.md`.
- **No mandatory tools.** Redis, S3, Docker are all optional. The harness works with a plain file system.
- **No "trust me" defaults.** Every rule has a Hard Rule and a Decision Gate that names the failure mode.

## The name

Named after Hpael (Hpaez), who commissioned this harness after watching too many agents ship broken code and mark it "done."

The harness is the accountability layer between an agent's confidence and a project's reality.
