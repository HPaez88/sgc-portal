# STATE — Tablero de tareas del SGC Portal

> Fuente de verdad del avance. El tracker interno del agente no cuenta: **lo que está en disco es lo que vale**.
> Regla de 3 archivos: cada tarea tocada actualiza el código + `STATE.md` + `CHANGELOG.md`.

**Última actualización:** 2026-10-02 · @antigravity

---

## Fase IA & Gobernanza 2026-10-02

- [x] I1 — Integración de Bitácora de Movimientos como 3ra pestaña en Control Documental (Catálogo | Matriz | Bitácora)
- [x] I2 — Base de conocimiento oficial ISO estructurada (`backend/knowledge/isos/`: ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, ISO 19011:2018) y carpeta `custom/`
- [x] I3 — Motor RAG estricto y servicio de IA normativo (`iso_rag_service.py` y router `/api/v1/iso`)
- [x] I4 — Interfaz visual completa del Asesor Normativo ISO (`AgenteISOView.jsx`) con explorador interactivo de cláusulas y consultas fundamentadas
- [x] I5 — Actualización de navegación en Sidebar y Header (acceso directo a Asesor Normativo ISO)
- [x] I6 — Migración de modales (`ModalInactividad`, `BitacoraView`, `AuditoriasView`) a renderizado de portal en body (`createPortal`)
- [x] I7 — Sincronización bidireccional espejo entre directorios locales (`CodeGPT\sgc-portal` y `Documents\ChatGPT Proyectos\SGC Portal`) y verificación con GitHub
- [x] I8 — Validación completa de build y tests (1800 módulos OK, 64/64 tests aprobados en ambos proyectos)
- [x] I9 — Guía y base de conocimiento de transición ISO 9001:2015 a ISO 9001:2026 (`transicion_iso_9001_2015_a_2026.md`) con renderizado de tablas comparativas
- [x] I10 — Rediseño del Asesor Normativo ISO a pantalla completa (100% width) con navegación modular por pestañas (Chat, Consultas Frecuentes, Base Indexada, Explorador de Cláusulas)
- [x] I11 — Integración y Groundedness estricto de Documentación Interna SGC (`documentacion_interna_sgc_oomapasc.md`), Procedimientos (PR-CAL-01, PR-MEJ-01, PR-POT-01, PR-AUD-01), Registros/Formatos (OOMRSC-20, OOMRSC-21, REG-CLORO-01), Mapa de Procesos y Matriz de Trazabilidad dinámicos en el Asesor IA
- [x] I12 — Sistema de exportación y descarga de dictámenes normativos en PDF (`jsPDF`/`autoTable`) y Markdown (.md) para respuestas individuales y sesiones consolidadas (`isoExporter.js`)
- [x] I13 — Torre de Control Estratégica y Panel de Revisión por la Dirección (ISO 9001:2015 / 2026 § 9.3) con filtros por Ejercicio/Cuatrimestre/Dirección, 6 KPIs ejecutivos, semáforo institucional de 86 indicadores con levantamiento de AC con 1-click, radar de salud por dirección, diagnóstico ejecutivo con IA y exportación formal en PDF (`dashboardExporter.js`)

## Auditoría completa 2026-09-27

- [x] A0.1 — Consolidar directorios duplicados del proyecto (28 archivos exclusivos de `CodeGPT\sgc-portal`; 23 divergentes, todos más nuevos aquí)
- [x] A0.2 — Respaldo completo de ambos directorios antes de consolidar
- [x] A0.3 — Instalar disciplina del harness: `CONSTITUTION.md`
- [x] A0.4 — Instalar disciplina del harness: `STATE.md`, `CHANGELOG.md`, `SKILLS.md`
- [x] A0.5 — Extraer y leer reglas de `hpaez-harness` (protocol-sync, scope-boundaries, verify-loop, self-correction, silent-failure-hunter)
- [x] A1.1 — Auditoría: cazador de fallos silenciosos — **1 CRÍTICO** (clave Groq expuesta) + fetch crudo + descargas inseguras + diálogos nativos
- [ ] A1.2 — Auditoría: verificar que todo modal use `ModalBase` (17 modales con el patrón antiguo; 3 migrados)
- [x] A1.3 — Auditoría: verificar que toda llamada HTTP use `apiClient` — 4 migradas, 0 restantes fuera de apiClient
- [x] A1.4 — Auditoría: verificar que no queden `alert()` ni `confirm()` nativos — 0 restantes
- [x] A1.5 — Auditoría: cobertura de pruebas de la lógica crítica — 4 suites, 64 pruebas
- [x] A2.1 — Verificación final: build 1798 módulos OK + 64/64 tests + evidencia física

### Pendiente crítico para el @human

- [ ] **Revocar la clave de Groq expuesta** en la consola de Groq y emitir una nueva.
      El bundle de producción la sirvió públicamente hasta este cambio.

## Trabajo previo (Fases 0-5, sesión anterior)

- [x] F0 — Cimientos: `apiClient.js`, `Toast.jsx`, `ModalBase.jsx`, `validacion.js`
- [x] F1 — Persistencia: `syncService.js` con debounce y resolución de conflictos
- [x] F2 — Trazabilidad documental: impacto con citas fuertes vs menciones débiles
- [x] F3 — Puentes inter-módulos: `flujoService.js` (Indicador→AC, Auditoría→AC, Riesgo→PM, Documento→AC)
- [x] F4 — Backend como fuente de verdad: `/api/v1/catalogos/workflow`
- [x] F5 — Errores y calidad: 40+ `alert()` → toasts, 4 suites de pruebas

## Rediseño del módulo de Riesgos

- [x] R1 — Dashboard de vigilancia anual por área con aprobación
- [x] R2 — Pestaña Matriz con filtro obligatorio de área
- [x] R3 — `CampoPlanAccion` con auto-crecimiento (ResizeObserver)
- [x] R4 — Responsividad total: tarjetas en móvil, tabla en escritorio, cero scroll horizontal
- [x] R5 — Ejercicio siguiente (2027) disponible para planeación
- [x] R6 — Corrección del modal en portal (containing block por `transform`)

---

## Fuera de la auditoría

> Hallazgos detectados pero NO corregidos por estar fuera del alcance de la tarea actual.
> Se registran aquí; no se arreglan en línea.

- (vacío por ahora)

---

## Pendientes conocidos (backlog)

- [ ] Migrar los 14 modales restantes a `ModalBase` (los 3 de Riesgos/AC/PM ya están)
- [ ] Rotar la clave de Groq expuesta (acción del @human)
- [ ] Añadir campo explícito `ejercicio` a los registros de riesgo (hoy se deriva de `fecha_termino`)
- [ ] Mover los scripts `qa-*.mjs` a una carpeta `qa/` o eliminarlos del proyecto
- [ ] Conectar `DashboardView` al endpoint `/api/v1/dashboard` del backend para métricas reales
- [ ] Sustituir el login simulado por autenticación real
- [ ] Reemplazar `localStorage` como base de datos por persistencia exclusiva en Supabase