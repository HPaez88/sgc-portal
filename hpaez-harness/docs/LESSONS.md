# Lessons (harness-level)

Decisions learned while building/using the harness. Project-specific lessons go in each project's `CONSTITUTION.md` (see `skills/_quality/self-correction`). These are the ones that shape the harness itself.

## Diagrams: use native, not third-party skills

- **2026-09-27** — Diagrams are drawn with **native Mermaid or the `artifact-diagramming` skill**, never a third-party diagram skill. (incidente: three community diagram tools — `diagram-design`, `archify` (71k⭐), `mcp_excalidraw` (2.5k⭐) — each scored **100/100 CRITICAL** in `_meta/skill-security` / NVIDIA SkillSpector. Native tools cover architecture, sequence, and flow diagrams safely.)

## Security gate: `--no-llm` is noisy on real JS/TS repos

- **2026-09-27** — The SkillSpector `--no-llm` deterministic gate over-flags real JavaScript/TypeScript codebases (e.g. it flagged a `.dockerignore` mentioning `.env` as "Credential Access"). Treat a `--no-llm` CRITICAL as "stop and look", not "definitely malicious". For a genuine keep/reject on a repo you actually want, rescan in LLM mode. The fail-closed default (block > 50) stays — better a false stop than a silent install.
