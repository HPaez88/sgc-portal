---
name: design-direction
description: "Trigger: diseñar UI, dirección visual, cómo se ve, paleta, tipografía, look and feel, evitar diseño genérico, template feo, frontend nuevo, no batallar con diseño. Fija una dirección visual concreta ANTES de escribir markup, para que la app se vea intencional desde el principio."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill BEFORE any UI markup or CSS is written — it is the design department's first step (`templates/departments/design.md`). Its job: kill the generic-template look before it happens. If UI already exists and you're only tweaking, load it only when re-directing the visual language.

## Hard Rules

- Never write UI without a named direction, palette, and type pairing recorded in `docs/design/direction.md` first.
- No "clean minimal" as a direction — that's a non-decision. Pick a specific one (see gates).
- Do NOT default to dark mode. Choose the mode the product actually wants.
- Design tokens as CSS custom properties on `:root`. Never hardcode palette/spacing repeatedly.
- Animate only compositor-friendly props (transform, opacity, clip-path). Never width/height/top/left.
- The result must pass the component checklist: hierarchy via scale contrast, intentional hover/focus/active states, not-a-template.

## Decision Gates

| Product feel | Direction to reach for |
|-------------|------------------------|
| Premium / trust (fintech, consulting) | Dark luxury or light luxury, disciplined contrast |
| Editorial / content-heavy | Editorial / magazine, real type pairing |
| Bold / attention (launch, campaign) | Neo-brutalism or bento layout |
| Data / dashboard | Swiss / International, dataviz as part of the system |
| Story / scroll | Scrollytelling |
| Depth / modern app | Glassmorphism with real depth |

## Execution Steps

1. Read `specs/<slug>/proposal.md` and the product's audience — the direction serves them, not taste.
2. Pick ONE direction from the gates. Write `docs/design/direction.md`:
   - Direction name + one-line rationale
   - Palette as OKLCH tokens (surface, text, accent, + semantic states)
   - Type pairing (max 2 families, named weights) with rationale
   - 2-3 real references
3. Gather references. If deeper visual work is needed, delegate to the ECC `impeccable` or `frontend-design-direction` skill.
4. Only then write tokens (`styles/tokens.css`) → components. Every meaningful surface shows ≥4 required qualities from the design-quality checklist.
5. Verify against the component checklist before handing back.

## Output Contract

`docs/design/direction.md`:
```markdown
# Design direction: <slug>

## Direction
<named direction> — <why it fits this product + audience>

## Palette (OKLCH tokens)
--color-surface: ...; --color-text: ...; --color-accent: ...;
--color-success/-warning/-danger: ...

## Type
Display: <family / weight> — <why>
Body: <family / weight>

## References
- <ref 1> · <ref 2> · <ref 3>

## Mode
light | dark | both — <reason>
```

## References

- Related: `_sdd/plan` (diagrams step), `templates/departments/design.md`
- Reuses ECC rules: `~/.claude/rules/ecc/web/design-quality.md`, `web/coding-style.md`, `web/performance.md`
- ECC skills: `impeccable`, `frontend-design-direction`, `emil-design-eng`, `apple-design`
