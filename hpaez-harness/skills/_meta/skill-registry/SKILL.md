---
name: skill-registry
description: "Trigger: refresh registry, actualizar skills, regenerar AGENTS.md, skill registry, skill index, hpaez registry refresh. Regenera la tabla de skills en AGENTS.md leyendo frontmatter."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill after any of: installing a new skill, removing a skill, renaming a skill, changing a skill's `description` frontmatter. Ensures `AGENTS.md` is always in sync with the actual `skills/` folder.

## Hard Rules

- The registry is an INDEX, not a compiler. `SKILL.md` files remain the source of truth.
- Do not paraphrase or summarize `description` — use it verbatim from frontmatter.
- Always write to `AGENTS.md` skill table between the markers `<!-- SKILLS-TABLE-START -->` and `<!-- SKILLS-TABLE-END -->` (see Output Contract). Everything outside those markers is human-authored and preserved.
- Skip `_shared/`, hidden folders (starting with `.` or `_`), and any skill named `skill-registry` itself.
- If two skills have the same name (project-level vs global), keep project-level.

## Decision Gates

| Situation | Action |
|-----------|--------|
| New skill added | Regenerate table |
| Skill removed | Regenerate table (row disappears) |
| Frontmatter description changed | Regenerate table (updated row) |
| Skill body changed but frontmatter didn't | No regeneration needed |
| Category folder empty | Skip that category header in table |
| No skills at all | Write empty table with a comment "no skills yet" |

## Execution Steps

1. Scan `skills/` recursively for `**/SKILL.md`.
2. For each: parse YAML frontmatter, extract `name`, `description`, and category (parent folder name).
3. Sort by category then by name.
4. Generate the Markdown table with columns: Skill, Trigger, Path.
5. Read `AGENTS.md`, find the markers `<!-- SKILLS-TABLE-START -->` and `<!-- SKILLS-TABLE-END -->`.
6. Replace content between markers with the new table.
7. If markers don't exist yet, add them after the first `## Skills` heading and populate.
8. Write `AGENTS.md`.
9. Log the action in `CHANGELOG.md` with tag `[DOCS]`.

## Output Contract

Between `<!-- SKILLS-TABLE-START -->` and `<!-- SKILLS-TABLE-END -->`:

```markdown
| Skill | Trigger | Path |
|-------|---------|------|
| `protocol-sync` | (first line of description) | [`skills/_core/protocol-sync/SKILL.md`](skills/_core/protocol-sync/SKILL.md) |
| `coordination` | ... | ... |
```

CHANGELOG entry:
```
## YYYY-MM-DDTHH:MMZ · @<agent> · [DOCS] · skill-registry refresh
Regenerada tabla de skills en AGENTS.md. Skills: N (added: X, removed: Y, updated: Z).
- Archivos: AGENTS.md
```

## References

- Related: `_meta/skill-creator`, `_meta/skill-improver`
- CLI command: `hpaez registry refresh` (v1.0.0 will implement — for now, do it manually or via script)
- Inspired by Gentle-Pi's `skill-registry`
