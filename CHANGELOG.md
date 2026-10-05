# CHANGELOG — SGC Portal OOMAPASC de Cajeme

> Timeline append-only. Entradas nuevas **arriba**, nunca se borra ni reordena el historial.
> Formato: `## YYYY-MM-DDTHH:MMZ · @autor · [TAG] · Título corto`

## 2026-10-05T07:30Z · @antigravity · [FEATURE/GOVERNANCE] · Protocolo de Supervisión y Ratificación Humana (POL-TI-01 & ISO 9001/42001) e Interacción Operativa Bidireccional del Agente ISO

- **Gobernanza Human-in-the-Loop Obligatoria (`ModalConfirmacionResponsabilidadHumana.jsx`):**
  - Implementación de barrera de control en **Acciones Correctivas (OOMRSC-20)** y **Planes de Mejora (OOMRSC-21)** para evitar envíos automáticos o desatendidos asistidos por IA.
  - El usuario debe leer el resumen, suscribir la Declaración Jurada de Responsabilidad Operativa, marcar la casilla de verificación y escribir textualmente la palabra **`CONFIRMAR`** para habilitar el envío al SGC.
  - Persistencia de metadatos oficiales: `ratificacion_humana: true`, `ratificado_por`, `fecha_ratificacion_humana`, `declaracion_responsabilidad` e inyección de auditoría en `bitacora_movimientos` (`ENVIO_SGC_RATIFICADO_HUMANO`).
- **Asistente Normativo ISO Bidireccional (`AgenteISOView.jsx` + `ModalesAccionIA.jsx`):**
  - Diagnóstico ejecutivo en tiempo real por área (*"¿Qué tengo pendiente?"*).
  - Captura directa en el Cuadro de Control OOMRSC-05 (100 indicadores oficiales) con semáforo institucional en tiempo real.
  - Gestión y subida segura de evidencias a actividades de AC (archivos PDF/imágenes validados con `processEvidenceFile`).
  - Ratificación activa de procedimientos con >1 año sin revisión conforme a ISO 9001 § 7.5.3.
- **Auditoría Integral Hpaez Harness:**
  - 70/70 pruebas unitarias aprobadas en Vitest.
  - Cero diálogos nativos bloqueantes (`alert`/`confirm`) en frontend.
  - Compilación de producción en Vite en 1.42s sin errores.
  - Documentación técnica y operativa actualizada en `DOCUMENTACION.md` v5.0.0, `CONSTITUTION.md` y `AGENTS.md`.

## 2026-10-02T19:30Z · @antigravity · [FEATURE/DASHBOARD] · Torre de Control Estratégica y Panel de Revisión por la Dirección (ISO 9001 § 9.3)

- **Panel Ejecutivo de Dirección Completo (`DashboardView.jsx`):** Rediseño exhaustivo para la Alta Dirección y Consejo Directivo, integrando filtros multi-período por Ejercicio (2025, 2026, 2027), Corte Temporal (Acumulado Anual, Cuatrimestres C1/C2/C3, Trimestres T1-T4) y Ámbito por Dirección (General, Técnica, Comercial, Administrativa, Programas Sociales, Órgano de Control Interno).
- **6 KPIs Estratégicos Institucionales:** Cumplimiento de los 86 indicadores, Vigilancia de Riesgos (ISO § 6.1), Eficacia de Acciones Correctivas (OOMRSC-20 / ISO § 10.2), Presupuesto Ejercido vs Asignado de Planes de Mejora (OOMRSC-21 / ISO § 10.3), Avance del Programa Anual de Auditorías (ISO § 9.2) e Índice Ponderado de Salud Global del SGC (0-100% con clasificación por nivel cualitativo A/B/C).
- **Pestañas de Análisis en Profundidad:**
  1. `Resumen & Radar`: Evaluación de salud y metas por cada una de las 6 direcciones, alerta de focos rojos críticos y bitácora de incidentes recientes.
  2. `Indicadores (86)`: Semáforo dinámico (Verde/Amarillo/Rojo/Sin Captura), buscador en tiempo real y botón de acción rápida para levantar Acciones Correctivas automáticas.
  3. `Riesgos`: Clasificación por severidad (Extremo ≥15, Alto 10-14, Moderado 5-9) y porcentaje de planes de contingencia asignados.
  4. `Acciones Correctivas`: Resumen de ciclo de vida (Borrador, Aprobado, Seguimiento, Cerrado) y tasa de eficacia.
  5. `Planes de Mejora`: Control presupuestal ($ MXN) y balance de proyectos concluidos vs activos.
  6. `Auditorías`: Avance del calendario anual y hallazgos/no conformidades.
- **Diagnóstico Ejecutivo con IA:** Integración con el Asesor Normativo ISO para formular dictámenes estratégicos estructurados de Revisión por la Dirección en 1 clic.
- **Informe Institucional en PDF (`dashboardExporter.js`):** Descarga de reporte formal con encabezado OOMAPASC, matrices, foco rojo, síntesis ejecutiva de IA y bloque de 3 firmas de validación (Coordinador SGC, Director de Área, Director General).
- **Sincronización:** Espejo 100% sincronizado en ambos directorios y validación con 64/64 tests aprobados.

## 2026-10-02T19:20Z · @antigravity · [FEATURE/EXPORT] · Descarga de Dictámenes en PDF y Archivos Markdown (.md) desde el Asesor Normativo ISO

- **Generador de Dictámenes Técnicos en PDF (`isoExporter.js`):** Implementación de exportación formal institucional con `jsPDF` y `autoTable` (membrete oficial OOMAPASC, metadatos de emisión, tabla de cláusulas citadas, tablas comparativas estructuradas y pie de página con paginación automática).
- **Descarga Individual por Consulta:** Botones interactivos en cada respuesta del agente para **"Descargar PDF"** (Dictamen formal) y **"Descargar .MD"** (archivo Markdown nativo).
- **Exportación Consolidada de Sesión:** Botones en la cabecera del chat para **"Descargar Sesión (PDF)"** (minuta y bitácora completa) y **"Exportar .MD"** (historial consolidado).
- **Sincronización:** Espejo 100% actualizado en ambos directorios de trabajo.

## 2026-10-02T19:15Z · @antigravity · [FEATURE/AI] · Integración de Documentación Interna SGC y Catálogo Activo en Asesor Normativo

- **Base de Conocimiento de Documentación Interna:** Creación de `backend/knowledge/isos/documentacion_interna_sgc_oomapasc.md` documentando la pirámide documental completa (MC-01 Rev. 04, PR-CAL-01 Rev. 06, OOMRSC-20 Rev. 18, PR-MEJ-01 Rev. 03, OOMRSC-21 Rev. 02, PR-POT-01 Rev. 05, REG-CLORO-01 Rev. 02, PR-AUD-01 Rev. 04, Mapa de los 8 Procesos PR-DIR-01 al PR-MED-08 y 32 Áreas del organismo).
- **Inyección Dinámica de Catálogo Activo:** Endpoint `/api/v1/iso/consultar` y `AgenteISOView.jsx` integrados para enviar el catálogo activo en tiempo real (`documentos` y `procesosDetalle` desde `SGCContext`), permitiendo consultar documentos existentes y nuevos en el portal con 100% de consistencia.
- **Groundedness Estricto SGC:** El Asesor Normativo responde fundamentado estrictamente en la documentación real y vigente del portal, citando claves exactas, revisiones, citas fuertes/débiles, reglas de bloqueo de eliminación (§ 7.5.3) y puentes entre módulos (Auditorías→AC, Indicadores→AC, Riesgos→PM).
- **Optimización de Token Limits:** Ajuste de ventana de contexto en RAG para garantizar respuestas rápidas y fluidas sin superar límites de cuota TPM.

## 2026-10-02T19:10Z · @antigravity · [UI/REDESIGN] · Asesor Normativo ISO a Pantalla Completa con Pestañas Informativas y Transición 2026

- **Rediseño Completo a Pantalla Completa:** `AgenteISOView.jsx` ahora ofrece un área de interacción amplia al 100% de la pantalla para el chat con chips rápidos, visor de tablas Markdown enriquecidas y citas directas de cláusulas.
- **Pestañas Informativas Modulares:**
  1. `💬 Asesor Normativo (Pantalla Completa)`: Chat RAG con filtro por norma y chips de consulta inmediata.
  2. `❓ Consultas Frecuentes`: Banco categorizado de consultas de auditoría con ejecución directa en 1 clic.
  3. `📚 Base Indexada & Normas`: Panel informativo de documentos indexados, normas ISO y guías cargadas con badges grounded.
  4. `🔍 Explorador de Cláusulas`: Buscador interactivo de requisitos oficiales, interpretaciones OOMAPASC y evidencia de auditoría.
- **Base de Conocimiento de Transición ISO 9001:2015 a 2026:** Creación de `transicion_iso_9001_2015_a_2026.md` integrando enmiendas de Acción Climática (§4.1/4.2), Resiliencia (§6.1), Ciberseguridad/SCADA (§7.1.3), Trazabilidad Digital (§7.5) y Cadena de Suministro (§8.4).
- **Sincronización:** Espejo 100% actualizado en ambos directorios de trabajo.

## 2026-10-02T19:00Z · @antigravity · [SYNC/STABILITY] · Sincronización Espejo de Proyectos y Blindaje de Modales

- **Sincronización Total de Proyectos:** Alineación de `C:\Users\hmpl_\CodeGPT\sgc-portal` y `C:\Users\hmpl_\Documents\ChatGPT Proyectos\SGC Portal`. Ambas copias quedaron 100% idénticas en archivos de código, base de conocimiento RAG, pruebas y dependencias.
- **Blindaje de Modales (`createPortal`):** Migración de `ModalInactividad.jsx`, `BitacoraView.jsx` y `AuditoriasView.jsx` a renderizado directo en `document.body` mediante portales para evitar recortes y desplazamientos por transformaciones CSS.
- **Git & GitHub:** Verificación con `git fetch origin` contra `https://github.com/HPaez88/sgc-portal.git` (rama `main` sincronizada).
- **Verificación:** `npm run build` (1800 módulos OK), `npm test` (64/64 pruebas OK) ejecutado y verificado en ambos proyectos.

## 2026-10-02T18:45Z · @antigravity · [FEATURE/AI] · Asesor Normativo ISO con Base de Conocimiento y Bitácora como Pestaña

- **Control Documental:** Integración de la Bitácora de Movimientos y Auditoría como 3ra pestaña en `DocumentosView.jsx` (Catálogo | Matriz de Trazabilidad | Bitácora de Auditoría).
- **Asesor & Auditor Normativo ISO (IA):**
  - Creación del servicio RAG estricto en backend (`backend/services/iso_rag_service.py`) y endpoints `/api/v1/iso`.
  - Creación de base de conocimiento estructurada en `backend/knowledge/isos/` (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, ISO 19011:2018) y carpeta `custom/` para documentos personalizados.
  - Nuevo módulo frontend `AgenteISOView.jsx` con chat, explorador de cláusulas, preguntas frecuentes y citas de evidencias para auditorías.
  - Navegación actualizada en `Sidebar.jsx`, `Header.jsx` y `App.jsx`.
- **Verificación:** `npm run build` (1800 módulos OK), `npm test` (64/64 pruebas pasadas).

## 2026-09-27T23:55Z · @codegpt · [SECURITY] · Clave de Groq eliminada del frontend (CRÍTICA)

El bundle servido en producción contenía una clave de API de Groq en texto plano
(`gsk_...` en `aiClient.js:12`), expuesta a cualquier visitante del sitio. Se eliminó
la clave y la llamada directa a `api.groq.com` desde el cliente: la IA se consume
únicamente vía backend, que es donde vive `GROQ_API_KEY`.

**ACCIÓN REQUERIDA POR EL @human:** revocar la clave expuesta en la consola de Groq
y emitir una nueva. Cualquier clave que haya estado en un bundle público debe
considerarse comprometida, aunque se retire del código.

- Archivos: `frontend/src/services/aiClient.js`
- Tareas STATE: A1.1
- Deploy: SÍ (el bundle actual sigue exponiendo la clave)
- Notas: Verificado con `grep`: 0 ocurrencias de `gsk_` en `src/` y en `dist/assets/*.js`.

## 2026-09-27T23:50Z · @codegpt · [SECURITY] · Auditoría aplicada: fetch crudo, descargas y diálogos nativos

Se aplicaron los hallazgos de la auditoría del harness:

- **fetch crudo → apiClient:** 3 llamadas en `aiClient.js` y 1 en `agents.js` migradas.
  Ahora heredan timeout, extracción de `detail` de FastAPI y header de organismo.
- **Descargas inseguras:** 4 usos de `URL.revokeObjectURL` inmediato tras `click()`
  en `exporters.js` sustituidos por `descargarBlob`, que respeta el ciclo de vida
  del objectURL (en Safari/Firefox la descarga podía cancelarse).
- **Diálogos nativos:** 12 usos de `confirm()` y `prompt()` sustituidos por el nuevo
  componente `Dialogos` + hook `useDialogos`, que usa `ModalBase` (portal) y respeta
  el diseño visual. Ya no queda ningún `alert()`, `confirm()` ni `prompt()` nativo.

- Archivos: `frontend/src/services/aiClient.js`, `frontend/src/agents.js`, `frontend/src/exporters.js`, `frontend/src/components/common/Dialogos.jsx`, `frontend/src/components/AccionCorrectivaView.jsx`, `frontend/src/components/PlanMejoraView.jsx`, `frontend/src/components/acciones/AccionesDetalle.jsx`, `frontend/src/components/planes/PlanesDetalle.jsx`, `frontend/src/components/aprobaciones/GestorAprobacionesView.jsx`
- Tareas STATE: A1.1
- Deploy: NO
- Notas: verify-loop completo — build 1798 módulos OK, 64/64 tests pasando.

## 2026-09-27T23:30Z · @codegpt · [INFRA] · Consolidación de directorios duplicados del proyecto

Se detectaron dos copias del proyecto con 23 archivos divergentes. Se verificó hash y fecha
de cada archivo común: los 23 eran más recientes en `CodeGPT\sgc-portal` (sin excepción).
Se consolidó ahí y se trajo lo único que faltaba (el harness).

- Archivos: `hpaez-harness-full.zip`, `hpaez-harness/**`
- Tareas STATE: A0.1, A0.2
- Deploy: NO
- Notas: Respaldo completo de ambos directorios en `Documents\SGC-Backup-<timestamp>` antes de tocar nada. Copiar la copia equivocada habría destruido ~20 horas de trabajo.

## 2026-09-27T23:15Z · @codegpt · [DOCS] · Instalación de la disciplina del harness hpaez

Se extrajo y leyó el harness (30 skills). Se instalaron los archivos de disciplina que
faltaban en el proyecto, adaptados al stack real del SGC Portal.

- Archivos: `CONSTITUTION.md`, `STATE.md`, `CHANGELOG.md`, `SKILLS.md`
- Tareas STATE: A0.3, A0.4, A0.5
- Deploy: NO
- Notas: `AGENTS.md` ya existía con codificación rota (mojibake); se documentó como pendiente.

## 2026-09-27T22:50Z · @codegpt · [LESSON] · Los modales deben renderizarse en portal

`animate-fade-in-up` aplica `transform`, y un `transform` convierte al elemento en el
containing block de sus descendientes `position: fixed`. El modal se anclaba al contenedor
de la vista en lugar de a la ventana. Corrección: `createPortal` a `document.body`.

- Archivos: `frontend/src/components/common/ModalBase.jsx`, `frontend/src/components/riesgos/RiesgosView.jsx`
- Tareas STATE: R6
- Deploy: NO
- Notas: Verificado en navegador: modal cabe en viewport, Cancelar y Registrar visibles y clicables, Escape y backdrop funcionan.

## 2026-09-27T22:20Z · @codegpt · [FEATURE] · Ejercicio siguiente disponible en los selectores

Los selectores de ejercicio solo ofrecían el año en curso más los años con registros.
Se añadió el año siguiente con la etiqueta "(en planeación)", porque la norma exige
levantar la matriz antes de que inicie el periodo.

- Archivos: `frontend/src/services/vigilanciaRiesgosService.js`, `frontend/src/components/riesgos/DashboardRiesgos.jsx`, `frontend/src/components/riesgos/RiesgosView.jsx`
- Tareas STATE: R5
- Deploy: NO

## 2026-09-27T21:45Z · @codegpt · [FEATURE] · Dashboard de vigilancia anual y filtro por área en Riesgos

El módulo se rediseñó en dos pestañas: un dashboard de gestión para el titular (vigilancia
anual por área, aprobación de matrices) y la matriz de captura con filtro obligatorio de área.

- Archivos: `frontend/src/components/riesgos/DashboardRiesgos.jsx`, `frontend/src/services/vigilanciaRiesgosService.js`, `frontend/src/components/riesgos/RiesgosView.jsx`, `frontend/src/components/riesgos/CampoPlanAccion.jsx`
- Tareas STATE: R1, R2, R3, R4
- Deploy: NO
- Notas: La matriz no muestra datos hasta elegir área. En móvil se convierte en tarjetas: cero scroll horizontal verificado en 375/768/1440 px.

## 2026-09-27T19:00Z · @codegpt · [CLEANUP] · Fase 5 — Errores, permisos y calidad

Se eliminaron los 40+ `alert()` nativos del sistema, sustituidos por el sistema de toasts.
Permisos unificados a través de `puede()` del contexto. Se añadieron 4 suites de pruebas.

- Archivos: `frontend/src/components/settings/SettingsView.jsx`, `frontend/src/components/AccionCorrectivaView.jsx`, `frontend/src/components/PlanMejoraView.jsx`, `frontend/src/components/GestorAprobaciones.jsx`, `frontend/src/constants/__tests__/workflow.test.js`, `frontend/src/services/__tests__/*.test.js`
- Tareas STATE: F5
- Deploy: NO
- Notas: 64 pruebas pasando.

## 2026-09-27T18:00Z · @codegpt · [FEATURE] · Fases 0-4 — Cimientos, sincronización, trazabilidad y puentes

- **Fase 0:** `apiClient`, `Toast`, `ModalBase`, `validacion`
- **Fase 1:** `syncService` con debounce de 800 ms y resolución de conflictos por marca de tiempo
- **Fase 2:** trazabilidad documental con citas fuertes vs menciones débiles
- **Fase 3:** `flujoService` con los puentes ISO 9.1.3→10.2, 9.2→10.2, 6.1→10.3, 7.5.3→10.2
- **Fase 4:** endpoint `/api/v1/catalogos/workflow` como fuente única de verdad

- Archivos: `frontend/src/services/apiClient.js`, `frontend/src/services/syncService.js`, `frontend/src/services/flujoService.js`, `frontend/src/services/validacion.js`, `frontend/src/services/workflowService.js`, `frontend/src/components/common/Toast.jsx`, `frontend/src/components/common/ModalBase.jsx`, `backend/models.py`, `backend/routers/catalogo.py`
- Tareas STATE: F0-F4
- Deploy: NO

## 2026-09-27T16:30Z · @codegpt · [FIX] · Correcciones en backend y módulo de indicadores

- `crear_ac` estaba truncado (el decorador `@router.get` quedó dentro de la función)
- Restaurado el endpoint `GET /api/v1/acciones-correctivas` que faltaba
- `listar_pm` pasaba argumentos desordenados a `_listar_sgc`
- `_exportar_sgc_word` usaba funciones sin importar (NameError garantizado)
- Indicadores: paginación, búsqueda, selector de año, validación de captura

- Archivos: `backend/routers/acciones.py`, `backend/routers/planes.py`, `backend/routers/_sgc_common.py`, `frontend/src/components/indicadores/IndicadoresView.jsx`
- Tareas STATE: (sesión previa)
- Deploy: NO