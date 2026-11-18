---
name: skill-security
description: "Trigger: instalar skill, clonar skill, agregar plugin, ¿es segura esta skill?, skill de un YouTuber, MCP nuevo, prompt injection, skill maliciosa, supply chain, antes de instalar. Escanea una skill/plugin/MCP con NVIDIA SkillSpector ANTES de instalarla y bloquea si el riesgo es alto."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before installing, cloning, or enabling ANY third-party skill, plugin, or MCP server — especially ones recommended in a video, tweet, or by a "trusted" source. NVIDIA's dataset: 26.1% of skills carry vulnerabilities, 5.2% are likely malicious. "Recommended" is not "vetted."

## Hard Rules

- Never install a third-party skill/plugin/MCP without a SkillSpector scan first.
- Score > 50 → do NOT install. Report the findings to the human and stop.
- Score 25-50 → install only after the human reads the findings and explicitly approves.
- Score < 25 → safe to install.
- Prefer `--no-llm` mode (deterministic, no API key, no data leaves the machine) for the gate.
- A skill that wants network + filesystem + shell together is high-risk regardless of score — flag it.
- Never disable or bypass the `skill-audit` hook to "just install it."

## Decision Gates

| Situation | Action |
|-----------|--------|
| Skill from unknown author / video recommendation | Scan mandatory before clone into project |
| MCP server with broad tool access | Scan + review declared tool scopes |
| Your own harness skill (this repo) | Scan on PR via CI, not on every local edit |
| Skill already installed months ago | Re-scan if it auto-updates or you never scanned it |
| SkillSpector not installed | Install it first (below) — do not skip the gate |

## Execution Steps

1. Get the skill source (repo URL, zip, or local dir) — do NOT clone into the live skills dir yet; use a scratch dir.
2. Scan:
   ```bash
   skillspector scan <path-or-url> --no-llm --format markdown
   ```
   (Install once: `uv tool install git+https://github.com/NVIDIA/skillspector.git`)
3. Read the 0-100 score + findings across the 17 categories (prompt injection, data exfiltration, supply chain, excessive agency, etc.).
4. Apply the score gate (Hard Rules). If blocked, report findings verbatim to the human; do not install.
5. If approved/safe, move the skill into place and note in `CHANGELOG.md`: `[SKILL-AUDITED]: <name> score=<n>`.

## Output Contract

- A scan ran and its score is recorded before any install.
- Blocked installs report the top findings + category to the human, with the source named.
- `CHANGELOG.md` gets a `[SKILL-AUDITED]` line for every accepted third-party skill.

## References

- Related: `_meta/skill-registry`, `_meta/skill-creator`, `_quality/silent-failure-hunter`
- Hooks: `hooks/skill-audit.js` (SKILL.md via Write) + `hooks/skill-clone-audit.js` (git clone / gh repo clone / degit) — both enforce the gate automatically, covering both install paths
- Tool: [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) — 71 patterns / 17 categories, Apache 2.0
- ECC skills: `skill-scout`, `skill-comply` for broader skill hygiene
