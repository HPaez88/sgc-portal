# Delta: manual-aprobacion-dos-pasos
**Date:** 2026-10-15
**Original spec:** specs/control-documental/proposal.md
**Affects:** proposal § Usuarios y permisos, plan § Decision 3, tasks T1.1, T1.4, T3.2–T3.4

## Change
El Manual de la Calidad (y sus anexos) lo editan los **administradores** desde el portal y su ruta de
aprobación es de **dos pasos**: revisa otro administrador distinto del autor y aprueba/publica el
**Director General** (rol nuevo `Director`; Super Admin puede suplir). El resto del control documental
conserva la ruta simple (autor de área → aprobación SGC).

## Reason
@human: "los usuarios administrativos sí pueden modificar estos archivos... enviando a nuestro director
que sería el general... una ruta de aprobación: otro administrador y el director general para este tipo
de documento en especial; para el control documental no se ocupa tanto." Además la lectura del Manual
se ve en un cuadro pequeño: se amplía la columna de lectura y se renderiza Markdown.

## Impact
- Shipped code: el módulo Manual (solo lectura desde JSON) pasa a leer de Postgres; el JSON queda como
  semilla inicial. Se agrega el rol `Director`.
- Remaining tasks: T1.1/T1.4 se implementan primero para el Manual (documento + revisiones con
  contenido Markdown por sección); T3.2–T3.4 se entregan como modo lectura/edición/aprobación dentro
  de la vista del Manual. Las matrices derivadas (fase 4) no cambian.
- Tests: test_documentos (flujo borrador → revisión → aprobado por admin → publicado por Director; el
  autor no puede revisarse a sí mismo; Usuario no edita).
- Docs: STATE (M5 → tareas D-M1..D-M4), CHANGELOG [SPEC-DELTA].

## Rollback plan
Volver a leer el Manual desde backend/knowledge/manual/manual.json (router manual.py se conserva).

## New tasks
- D-M1 — Modelos `documentos` y `documento_revisiones` (contenido Markdown por sección, hash, estados)
- D-M2 — Router `/api/v1/documentos`: ver vigente, crear borrador, editar secciones, enviar a revisión
  (motivo obligatorio), revisar (Admin ≠ autor), publicar (Director), rechazar, historial, diff
- D-M3 — Semilla del Manual y anexos desde manual.json como revisión publicada (Rev. 75)
- D-M4 — Vista Manual: lectura amplia con Markdown, edición por sección para Admin, barra de flujo,
  bandeja de revisión/aprobación según rol, historial con diff

## Approval
Approved by @human 2026-10-15 (mensaje en sesión); registrado en CHANGELOG entry [SPEC-DELTA].
