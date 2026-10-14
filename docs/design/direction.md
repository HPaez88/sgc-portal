# Design direction: sgc-portal

## Direction
Swiss / International (dashboard de datos) — el portal es una herramienta de trabajo diario para
auditores y titulares de área: densidad de información controlada, jerarquía por escala y peso,
color solo con significado (semáforo institucional). Nada de "hero" decorativo que robe altura
a los datos.

## Escala base
- `html { font-size: 15px }` fijo en todos los anchos. No se infla por breakpoint.
- Escala Tailwind estándar: xs 12 · sm 13 · base 15 · lg 17 · xl 19 · 2xl 22 · 3xl 28 (px aprox).
- Mínimo legible 11px. Los `text-[9px..13px]` se normalizan a 11–13px fijos en `index.css`.
- Regla: un título de módulo = `text-lg` máximo. El contenido manda; el encabezado cede altura.

## Palette (OKLCH tokens)
--color-surface: oklch(98.5% 0.003 240)   /* slate-50 */
--color-text:    oklch(27% 0.03 260)      /* slate-800 */
--color-brand:   oklch(55% 0.17 245)      /* oomapas-600 #0272c4 */
--color-navy:    oklch(22% 0.05 255)      /* #0B192C encabezados */
--color-success: oklch(65% 0.17 155)
--color-warning: oklch(78% 0.16 75)
--color-danger:  oklch(58% 0.21 25)

## Type
Display: Plus Jakarta Sans 700/800 — geométrica, institucional, buena a tamaños pequeños.
Body: Plus Jakarta Sans 400/500 (Inter como respaldo).
Datos y claves: JetBrains Mono 500/600, `font-tabular` en métricas.

## References
- Linear (densidad + jerarquía) · Vercel dashboard (Swiss, color semántico) · Stripe docs (tablas y chat de ayuda)

## Mode
light — uso en oficina con luz; la navegación lateral y los encabezados en navy dan el contraste.
