---
name: constitution
description: "Trigger: constitution, principios inmutables, decisiones arquitecturales, ADR, principles, stack decision, immutable rules, project charter. Escribe y mantiene CONSTITUTION.md del proyecto."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when creating a new project (writing initial `CONSTITUTION.md`) or when proposing a change to existing principles. The constitution is the project's immutable law — every skill and plan must respect it.

## Hard Rules

- Constitution changes are the ONLY changes that require a formal `proposals/` doc + explicit human approval + `[CONSTITUTION-CHANGE]` CHANGELOG tag.
- Never silently rewrite constitution language. Additions and removals both need proposals.
- Constitution rules bind ALL agents equally — no exceptions per role.
- Every rule must be violateable and detectable. Vague rules ("write good code") are useless — replace with specific, testable rules.
- Constitution lives at project root, versioned in git, never in `.gitignore`.

## Decision Gates

| Rule type | Include in constitution? |
|-----------|--------------------------|
| Stack choice (React vs Vue) | YES — high-value invariant |
| Coding style (spaces vs tabs) | NO — belongs in `.editorconfig` |
| Non-negotiable security rule (no secrets in code) | YES |
| Framework version | YES (with review cadence) |
| Ephemeral convention that might change monthly | NO — belongs in a skill or SKILLS.md |
| Business rule ("users own their data") | YES if it shapes architecture |

## Execution Steps

1. On new project: copy `templates/CONSTITUTION.md.template` (from hpaez-harness) → root.
2. Fill sections: Identity, Stack, Technical Principles, Product Principles, Strict Constraints, How-to-change process, Review cadence.
3. Get explicit human sign-off on initial version.
4. For subsequent changes:
   - Create `proposals/YYYY-MM-DD-<slug>.md` with the change + rationale + tradeoffs
   - Wait for human `[CONSTITUTION-CHANGE]` approval in CHANGELOG
   - Edit `CONSTITUTION.md`
   - Notify affected skills (if a rule change makes an existing skill obsolete, deprecate that skill)

## Output Contract

`CONSTITUTION.md` structure:
```markdown
# Constitution — <project name>
## Identity
## Stack (no cambia sin propuesta formal)
## Principios técnicos (numbered, testable)
## Principios de producto (numbered)
## Restricciones estrictas (nunca)
## Cómo se cambia esta constitución
## Revisión (fecha + próxima programada)
```

Proposal doc: `proposals/YYYY-MM-DD-<slug>.md` — problem, proposed change, alternatives, impact on existing skills, human approval line.

## References

- Related: `_sdd/sdd-init`, `_sdd/plan`
- Inspired by GitHub Spec Kit's Constitution concept
- Complementary to: [Architecture Decision Records (ADRs)](https://adr.github.io/)
