# Design review — sgc-portal

_Etapa D7 · skill `design-review-gate` · 2026-11-18 (H3)_
Regla: cada categoría ≥ 7 y promedio ≥ 8 para publicar (`hpd gate`).
Medición sobre una copia local en modo producción, con 13 módulos en escritorio y 5 pestañas en móvil.

| Category | Score | Evidence | Top fix |
|----------|-------|----------|---------|
| Hierarchy | 8 | Títulos de módulo `text-lg`, secciones en bandas de color con subtemas (formularios AC/PM/Riesgos/Indicadores), "Actividad N de M" | Llevar las bandas a Auditorías, Revisión y Configuración (U1) |
| Layout & balance | 8 | Sin desborde horizontal en 1440 y 768 (13 módulos) ni en 375 (5 pestañas móviles); captura siempre en modal | Igualar el espaciado de las listas de Auditorías con el resto |
| Typography | 8 | 2 familias (Plus Jakarta Sans + JetBrains Mono), base 16px, 0 textos debajo de 12px, cifras tabulares | — |
| Color | 8 | Color semántico (semáforo institucional, azul OOMAPAS #005B86); contraste bajo en 2.9% de 2282 textos medidos, casi todos falsos positivos sobre degradados | Revisar a mano los textos sobre degradado del Panel |
| Interaction | 8 | `:focus-visible` global, 0 botones sin nombre, campos de lista/libre/bloqueado distinguibles, montos con formato de moneda | U1 en los tres módulos que faltan |
| Motion | 8 | Movimiento mínimo y funcional (modales, avisos); `prefers-reduced-motion` respetado | — |
| Content & trust | 8 | Lenguaje ISO en español, formatos oficiales intactos, 0 imágenes sin alt, cabeceras de seguridad y CSP | 4 avisos de lint en imágenes de evidencia dinámicas |
| Responsive & perf | 8 | Carga diferida de 14 módulos: archivo inicial 892 KB → 263 KB comprimido (presupuesto de app 300 KB); CSS 18 KB; logos con ancho y alto fijos | Separar las librerías de PDF (html2canvas, jsPDF) del archivo inicial |

## Screenshots
- 1440: 13 módulos recorridos, sin desborde (medido por script, no guardado en el repo).
- 768: igual.
- 375: vista móvil de 5 pestañas, sin desborde.

## Pending fixes (ordered)
1. U1: estilo de formularios en Auditorías, Revisión por la Dirección y Configuración.
2. Cargar las librerías de PDF solo al exportar.
3. Revisar el contraste sobre degradados del Panel.
