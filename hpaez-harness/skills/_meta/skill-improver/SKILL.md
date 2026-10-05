---
name: skill-improver
description: "Trigger: mejorar skill, auditar skills, refactor skill, skill quality, skill review, skill audit. Audita y mejora SKILL.md existentes preservando intención del autor."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when auditing, refactoring, normalizing, or improving existing `SKILL.md` files in `skills/`. Use `_meta/skill-creator` for brand-new skills.

## Hard Rules

- Read `docs/skill-style-guide.md` first (or Anthropic Skills best practices). It's the normative style contract.
- Preserve author intent, critical Hard Rules, activation semantics, and Output Contract — never delete meaningful content silently.
- Move long explanations, examples, or templates to `references/` or `assets/` — don't inline in SKILL.md.
- Default to audit-only mode. Modify files only when the user explicitly asks to apply improvements.
- Do not invent triggers, policies, or domain rules. Mark ambiguities for human review.
- Refresh the AGENTS.md registry after applying changes (run `hpaez registry refresh`).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Missing or invalid frontmatter | Fix `name`, one-line `description`, `license`, `metadata` |
| Skill reads like a tutorial | Convert to runtime instructions; move background to `references/` |
| Body exceeds 1000 tokens | Move examples to `assets/`, keep rules in SKILL.md |
| Branching logic hidden in prose | Convert to a compact Decision Gates table |
| Rules conflict or intent unclear | Report the issue; do not rewrite that rule automatically |
| Skill uses old section names | Rename to standard: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References |

## Execution Steps

1. Read `docs/skill-style-guide.md` (or the Anthropic Skills spec).
2. List all skills to audit: `find skills -name SKILL.md`.
3. For each skill, audit:
   - Frontmatter validity (name, description trigger-rich, license, metadata)
   - Section order (6 canonical sections)
   - Body length (target 180-450, hard max 1000 tokens)
   - Trigger clarity in description
   - Actionability (imperative, not descriptive)
   - Decision Gates present (table, not prose)
   - Output Contract concrete (not vague)
   - References complete
4. Return an audit report grouped by skill, with severity + proposed changes.
5. In apply mode: edit only safe issues (frontmatter fixes, section reorder, moving long content to `references/`). Preserve controversial content, flag for human.
6. After edits, refresh registry.

## Output Contract

Audit report format:
```markdown
## Skill: <name>
- Path: skills/<category>/<name>/SKILL.md
- Issues found:
  - [severity] <issue description> — proposed fix
- Ambiguities for human review:
  - <ambiguity>
- Applied (if apply mode): <list of concrete edits>
```

Overall report:
```markdown
# Skills Audit — YYYY-MM-DD
Skills audited: N
Issues found: N (grouped by severity)
Applied: N (if apply mode)
Registry refresh needed: SÍ/NO
```

## References

- [Anthropic Skills best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [`docs/skill-style-guide.md`](../../../docs/skill-style-guide.md) — local normative style
- Related: `_meta/skill-creator`, `_meta/skill-registry`
- Inspired by Gentle-Pi's `skill-improver`
