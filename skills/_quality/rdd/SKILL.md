---
name: rdd
description: "Trigger: RDD, receipt-driven, evidencia inmutable, incident report, defect workflow, recovery, kill switch, delivery gate. Bounded review defects con receipts inmutables ligados al candidate exacto."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when handling a defect that needs immutable audit trail — incidents in production, compliance-required corrections, security patches. Do NOT load for normal bug fixes; use `_quality/silent-failure-hunter` + regular workflow.

## Hard Rules

- Review evidence is review-only. RDD never mints delivery authority — deploys still follow repo policy.
- Every finding is bound to the EXACT candidate (commit hash + file hashes) — no floating claims.
- One issue = one PR = one invariant. Do not merge independent causes.
- Every fix requires a fresh candidate hash — never edit in place after review.
- Failed reviews escalate; there is no third-round loop.
- Communication is evidence-based and humane. No blame in metadata.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Defect in production, user-visible | Open RDD ticket with reproduction + timestamp |
| Defect crosses independent invariants | Split into multiple RDD tickets |
| Fix candidate exceeds 400 lines | STOP — use `chained-pr` to split |
| Review says "regression" on fix | New candidate, re-review; do not patch existing |
| Two rounds pass without resolution | Escalate to human; freeze the flow |

## Execution Steps

1. Create `incidents/YYYY-MM-DD-<slug>/` directory.
2. Write `report.md` with: what happened, when, user impact, reproduction steps, expected vs actual.
3. Snapshot the target: `git rev-parse HEAD > candidate.hash` + list affected files with `sha256sum > files.hash`.
4. Root cause analysis (5 whys) → document in `analysis.md`.
5. Design fix in `fix-proposal.md` — respect `CONSTITUTION.md`.
6. Implement fix on a new branch tied to the incident slug.
7. Run `_quality/verify-loop` on fix candidate.
8. Optional but recommended: run `_quality/judgment-day` on fix.
9. Update `STATE.md` + `CHANGELOG.md` with tag `[SECURITY]` or `[FIX]` referencing the incident slug.
10. After merge, archive `incidents/<slug>/` to `incidents/archived/<slug>/` with `resolution.md`.

## Output Contract

Incident folder structure:
```
incidents/<slug>/
├── report.md            (what happened)
├── analysis.md          (why)
├── fix-proposal.md      (how)
├── candidate.hash       (commit ref)
├── files.hash           (sha256 per affected file)
└── resolution.md        (after merge)
```

CHANGELOG entry references the slug and cites the candidate hash.

## References

- Inspired by Gentle-Pi's `rdd-defect-workflow`
- Compatible with SOC 2, ISO 27001 audit requirements for immutable incident trails
- Related: `_quality/judgment-day`, `_delivery/chained-pr`
