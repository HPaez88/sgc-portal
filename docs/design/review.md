# Design review — sgc-portal

_Etapa D7 · skill `design-review-gate` · 2026-11-18 (H3)_
Regla: cada categoría ≥ 7 y promedio ≥ 8 para publicar (`hpd gate`).
Medición sobre una copia local en modo producción, con 13 módulos en escritorio y 5 pestañas en móvil.

| Category | Score | Evidence | Top fix |
|----------|-------|----------|---------|
| Hierarchy | 8 | Títulos de módulo `text-lg`, secciones en bandas de color con subtemas en todos los formularios (incluye Auditorías y Revisión), "Actividad N de M" | — |
| Layout & balance | 8 | Sin desborde horizontal en 1440 y 768 (13 módulos) ni en 375 (5 pestañas móviles); captura siempre en modal | Igualar el espaciado de las listas de Auditorías con el resto |
| Typography | 8 | 2 familias (Plus Jakarta Sans + JetBrains Mono), base 16px, 0 textos debajo de 12px, cifras tabulares | — |
| Color | 8 | Color semántico (semáforo institucional, azul OOMAPAS #005B86); Panel medido contra el color real del degradado: todo ≥ 4.5 (botón IA 4.1 → 5.9, cifras ámbar 3.1 → ámbar-700) | — |
| Interaction | 8 | `:focus-visible` global, 0 botones sin nombre, lista/texto/bloqueado distinguibles con leyenda en todos los módulos de captura (U1 hecho), montos con formato de moneda | — |
| Motion | 8 | Movimiento mínimo y funcional (modales, avisos); `prefers-reduced-motion` respetado | — |
| Content & trust | 8 | Lenguaje ISO en español, formatos oficiales intactos, 0 imágenes sin alt, cabeceras de seguridad y CSP | 4 avisos de lint en imágenes de evidencia dinámicas |
| Responsive & perf | 8 | Carga diferida de 14 módulos y de jsPDF (solo al exportar): archivo inicial 2.4 MB → 113 KB comprimido (presupuesto de app 300 KB); CSS 18 KB; logos con ancho y alto fijos | — |

## Screenshots
- 1440: 13 módulos recorridos, sin desborde (medido por script, no guardado en el repo).
- 768: igual.
- 375: vista móvil de 5 pestañas, sin desborde.

## Pending fixes (ordered)
Ninguno abierto (U1, PDF diferido y contraste del Panel cerrados el 2026-11-18).
