---
name: model-routing
description: "Trigger: qué modelo usar, model selection, cambiar modelo, costo, latency, multimodal, image, backend heavy, MiMo, Nemotron, Sonnet, Opus, GPT, Gemini. Recomienda modelo por tipo de tarea."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when picking a model for a new task, or when a task feels slow/expensive and you want to check if a smaller model would work. Applies to human orchestrators AND agents that can switch models mid-session.

## Hard Rules

- Never use the most expensive model for tasks the cheapest handles well (waste).
- Never use the cheapest model for high-risk paths (auth, payments, migrations) — accuracy > cost there.
- If the task needs images, must use a multimodal model — no exceptions.
- If the task needs strict adherence to a long instruction set, prefer instruction-tuned models (Nemotron, Sonnet) over creative ones (Opus, GPT-4o).
- Log the chosen model in CHANGELOG for tasks where model choice matters (post-mortem clarity).

## Decision Gates

| Task type | Recommended model tier |
|-----------|------------------------|
| Visual work (screenshots, mockups, design review) | Multimodal: MiMo V2.5, Gemini 2.5 Pro, GPT-4o, Claude Sonnet |
| Structured backend refactor, strict instructions | Nemotron 3 Ultra, Claude Sonnet 4.5, GPT-4-turbo |
| Meta / architecture / big-picture reasoning | Claude Opus, GPT-5, Gemini Pro (max reasoning) |
| Quick audits, simple lint, boilerplate | Haiku 4.5, Ling 3.0 Flash, GPT-4o-mini |
| Long-context reading (100k+ tokens) | Claude Sonnet/Opus (200k), Gemini Pro (1M) |
| Codegen from spec, TDD implementation | Claude Sonnet, Nemotron Ultra, Gemini 2.5 Pro |
| Documentation, prose writing | Claude Sonnet, GPT-4o (voice-preserving) |
| Deep research (multi-source synthesis) | Claude Opus, GPT-5, Gemini Pro |

## Execution Steps

1. Classify the task against the table above.
2. Pick the model tier. If multiple options in a tier, pick the one you have credits for or best latency.
3. If mid-session on wrong model, switch: `/model <name>` in Claude Code, model selector in Antigravity/OpenCode.
4. Log the choice in CHANGELOG entry if the task was model-sensitive (e.g. multimodal work, complex refactor).

## Output Contract

For model-sensitive tasks, CHANGELOG entry includes a line:
```
- Model used: <name>, reason: <one phrase>
```

Example:
```
- Model used: MiMo V2.5, reason: needed to interpret screenshot of GPS console error
```

## References

- Related: `_agents/delegation`, `_agents/subagent-isolation`
- OpenRouter model catalog: https://openrouter.ai/models
- Inspired by Gentle-Pi's Model Routing Harness
