---
name: orchestrate
description: "Trigger: construir app, de idea a app, empieza este proyecto, hazme la app, construye esta idea, build from scratch, pipeline completo, orquesta el proyecto, no sé por dónde empezar. El director: toma una idea y la lleva de extremo a extremo (idea → app verificada) encadenando los skills del harness."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when you're handed a **project idea or feature to build end-to-end** and you're the orchestrator. This is the single entry point — it sequences the whole harness from idea to verified build so the person doesn't fight code or design. Do NOT load for a one-file fix (see the first Decision Gate).

## Hard Rules

- Never jump to code. The sequence is law: proposal → constitution → design (if UI) → plan (+diagram) → tasks → delegate by department → verify.
- Each stage gates the next: no plan before an approved proposal; no code before a plan; no `[x]` before `_quality/verify-loop`.
- Two mandatory human gates: after **proposal** (is this the right thing?) and after **plan** (is this the right approach?). Don't build through them.
- The orchestrator is the **sole committer**. Departments return work on their return-contract; they never commit (see `_agents/department`).
- One department owns one surface. Cross-surface needs are resolved by the orchestrator, never by a department reaching out (see `_core/scope-boundaries`).
- The 3-file rule runs throughout (code + `STATE.md` + `CHANGELOG.md`). Degrade gracefully — don't over-orchestrate a tiny task.

## Decision Gates

| Idea | How much pipeline |
|------|-------------------|
| One-file fix / script (<3 files) | Skip orchestration — just build it |
| Single feature | proposal (light) → plan → tasks → engineering → verify |
| Full app from an idea | Full: proposal → constitution → (design via `hp-design-harness` if UI) → plan → departments (parallel) → verify |
| UI-heavy | Hand the visual work to the sibling `hp-design-harness` before any markup |
| Classifies/validates free user text | Evaluate `_quality/data-gate-typesafe` |

## Execution Steps

1. State the idea in one sentence + its audience. If vague, ask before scaffolding anything.
2. **Product** → `_sdd/sdd-init` produces `specs/<slug>/proposal.md`. **Human gate 1.**
3. **Constitution** → confirm or create `CONSTITUTION.md` principles (`_sdd/constitution`).
4. **Design** (if there's UI) → hand off to the sibling **`hp-design-harness`** (its 8-stage design protocol: brief → references → direction → layout → interaction → motion). hpaez-harness does not own design; it delegates.
5. **Plan** → `_sdd/plan` → `plan.md` with phases + a native-Mermaid diagram. **Human gate 2.**
6. **Tasks** → `_sdd/tasks` → atomic `tasks.md`.
7. **Delegate** → for each domain spin a department (`_agents/department`), in parallel where independent (`_agents/delegation`). Collect each return-contract.
8. **Verify** → `_quality/verify-loop` before any `[x]`; `_quality/self-correction` on every correction.
9. **Gate (mandatory before launch)** — all three block the launch/PR until green:
   - Security → `_quality/prelaunch-guard` (6 risks) + full `_quality/security-audit` for anything internet-exposed or touching auth/payments/user-data. A `confirmed` finding blocks until fixed + re-audited.
   - Design (if there's UI) → run the **`hp-design-harness`** design gate (`design-review-gate`: 8-category scorecard, ship only if every category ≥ 7 and average ≥ 8). Below bar blocks.
10. **Close** → `_core/session-summary`.

## Output Contract

- `specs/<slug>/{proposal,plan,tasks}.md` exist and were approved at the two gates.
- Each department's work integrated by the orchestrator (sole committer) and verified with evidence.
- `STATE.md` and `CHANGELOG.md` reflect reality — no `[x]` without a passing build + physical evidence.
- Security gate passed before launch: `prelaunch-guard` recommendation recorded and, where required, a `security-audit` with no open `confirmed` findings.
- Design gate passed (if UI): `hp-design-harness` `design-review-gate` scorecard at or above the bar.
- A runnable app/feature at the end, not a tracker full of unverified checkmarks.

## References

- Chains: `_sdd/sdd-init`, `_sdd/constitution`, `_sdd/plan`, `_sdd/tasks`, `_agents/department`, `_agents/delegation`, `_quality/verify-loop`, `_quality/self-correction`, `_quality/prelaunch-guard`, `_quality/security-audit`, `_core/session-summary`
- Design handed off to the sibling **`hp-design-harness`** (its own 8-stage protocol + `design-review-gate`); hpaez-harness does not own design skills.
- `_core/protocol-sync` — the 3-file rule that runs throughout
- Org model inspired by cbrock84/headcount; pipeline by GitHub Spec Kit + BMAD
