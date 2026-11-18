---
name: skill-creator
description: "Trigger: crear skill, nuevo skill, agregar skill, skill nueva, patrón reusable. Crea SKILL.md con estructura estándar Anthropic + refresca AGENTS.md registry."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when creating a new reusable skill for the harness. Do NOT create a skill for one-off tasks or generic docs — see the "when to skip" gate below.

## Hard Rules

- Every SKILL.md follows the 6-section order: `Activation Contract` → `Hard Rules` → `Decision Gates` → `Execution Steps` → `Output Contract` → `References`.
- Body target: 180-450 tokens, hard max 1000 tokens.
- Frontmatter required: `name` (kebab-case), `description` (one line, trigger-rich, quoted), `license`, `metadata` (author, version).
- Description must be a routing rule, not a summary — include the words users/agents actually say to trigger it.
- Long content (rationale, examples, templates) goes into `assets/` or `references/` subdirs, not the SKILL.md body.
- Refresh AGENTS.md's skill table after creating a new skill (or run `hpaez registry refresh`).

## Decision Gates

| Situation | Action |
|-----------|--------|
| Reusable workflow across sessions | Create skill |
| One-off task | Don't create — just do it |
| Existing skill covers 80%+ | Update existing, don't fork |
| Template/schema is long | Move to `assets/` |
| Rationale is long | Move to `references/` |
| Ambiguous trigger | Ask human before creating |

## Execution Steps

1. Choose kebab-case name matching the trigger (e.g. `chained-pr`, not `chainedPRSkill`).
2. Pick category folder: `_core`, `_sdd`, `_quality`, `_delivery`, `_agents`, or `_meta`. If none fits, propose adding a new category via `CONSTITUTION.md` update.
3. Run `hpaez skill new <name>` to scaffold, OR manually create `skills/<category>/<name>/SKILL.md`.
4. Fill in frontmatter — description must have "Trigger: <words>. <what it does>." as the pattern.
5. Fill in the 6 sections. Keep it tight.
6. If you have templates/examples/schemas, put them in `skills/<category>/<name>/assets/`.
7. If you have longer rationale, put it in `skills/<category>/<name>/references/`.
8. Add row to `AGENTS.md` skill table.
9. Commit + `[FEATURE]` entry in CHANGELOG.

## Output Contract

- `skills/<category>/<name>/SKILL.md` exists with valid frontmatter and 6 sections.
- `AGENTS.md` skill table updated with new row.
- CHANGELOG entry with tag `[FEATURE]` describing what the skill does.
- Optional: `assets/` or `references/` populated.

## References

- [Anthropic Skills best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — normative style guide
- [Gentle-Pi skill-creator](https://github.com/Gentleman-Programming/gentle-pi/blob/main/skills/skill-creator/SKILL.md) — Alan's version, inspiration
- [`docs/skill-style-guide.md`](../../../docs/skill-style-guide.md) — full local style contract
