---
name: security-audit
description: "Trigger: auditar seguridad, pentest, buscar vulnerabilidades, antes de lanzar, impenetrable, hackeen mi app, revisión de seguridad profunda, security audit, find vulns, trust boundaries, antes de exponer a internet. Auditoría de seguridad app-level en 6 fases con hunters aislados y verificadores que refutan cada hallazgo."
license: MIT
metadata:
  author: hpael
  version: "1.0"
  upstream: "Cloudflare security-audit skill (MIT) — references/METHODOLOGY.md"
---

## Activation Contract

Load this skill for a **deep security audit** of a project — before exposing it to the internet, before a launch, or when the task is "find the vulnerabilities / make it hard to break into". Heavier and more rigorous than a quick review; for a light pass use ECC `security-review`. The full 6-phase methodology lives in `references/` (vendored from Cloudflare's skill, MIT); this SKILL.md is the harness contract that drives it.

## Hard Rules

- No project ships to production / internet without a passing `security-audit` run. It is a mandatory gate in `_sdd/orchestrate` and a check in `_quality/prelaunch-guard`.
- Every candidate finding goes to a **fresh verifier that tries to disprove it**. Only `confirmed` (complete source trace + bounded observed result) is reported as real; `needs_validation` and `rejected` are tracked separately. No unproven claim is sold as a vulnerability.
- Hunters are **isolated** (see `_agents/subagent-isolation`) and assigned from the coverage ledger — no "I looked at everything" hand-waving; coverage is deterministic and recorded.
- Run the validators: `references/validate-coverage-ledger.cjs` after creating/updating the ledger, `references/validate-findings.cjs` in Phase 4 and after every Phase 5 replacement. Findings must validate against `references/report-schema.json`.
- Report is **target-neutral**: describe the flaw, file, line, and a bounded repro — never editorialize or inflate severity.
- Fixing a finding is a separate, confirmed step (builder fixes → re-audit). The auditor never silently patches.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Pre-launch / pre-internet-exposure | Full audit — mandatory, blocks launch on `confirmed` findings |
| Touched auth, payments, user data, file/network I/O | Full audit of the changed surface |
| Quick sanity pass on a small change | ECC `security-review` is enough; escalate to full audit if it flags anything |
| LLM/agent-backed target | Load `references/AI-AND-LLM.md` (prompt injection, tool/agent, output handling) |
| Choosing which attack classes apply | Pick the matching `references/*.md` by target type (web, client, cloud, supply-chain, RPC, data-isolation…) |

## Execution Steps

Follow `references/METHODOLOGY.md` + the phase files. Summary:
1. **Reconnaissance** (`RECONNAISSANCE.md`) — map architecture, trust boundaries, input surfaces → `architecture.md` + `coverage-ledger.json`.
2. **Coverage-led hunting** (`HUNTING.md` + the attack-class files) — isolated hunters from ledger units; coverage critics find gaps.
3. **Candidate validation** — a fresh verifier tries to disprove each unique candidate.
4. **Structured output** — `confirmed` / `needs_validation` / `rejected` → `findings.json`, validated against `report-schema.json`.
5. **Independent record verification** — fresh agents re-verify source claims; material replacements get another verifier.
6. **Target-neutral reporting** (`VALIDATION-AND-REPORTING.md`) — derive `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`.

Record the run per the 3-file rule; mark the `prelaunch-guard` security item only when the audit is green.

## Output Contract

- `findings.json` validated against the schema; `confirmed` findings each carry file+line+bounded repro.
- `REPORT.md` + detail files derived from verified records, target-neutral.
- Launch/PR blocked while any `confirmed` finding is open; `CHANGELOG.md` records the audit (`[SECURITY-AUDIT]: <n> confirmed, <n> needs_validation`).
- No silent fixes; remediation is a separate confirmed change that triggers a re-audit of the touched surface.

## References

- `references/METHODOLOGY.md` + phase files (vendored from Cloudflare's security-audit skill, MIT — `references/LICENSE-cloudflare`). Blog: "Build your own vulnerability harness".
- Related: `_quality/prelaunch-guard`, `_sdd/orchestrate`, `_agents/subagent-isolation`, `_quality/judgment-day`, `_meta/skill-security` (vets skills, not apps)
- Lighter alternative: ECC `security-review`, `security-bounty-hunter`
