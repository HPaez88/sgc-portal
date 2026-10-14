# Plan: control-documental

## Overview
Sustituir el catálogo documental ficticio (localStorage) por un módulo real en Postgres con
archivos en Backblaze, flujo borrador → aprobación SGC → publicado, historial por documento y
relaciones proceso/cláusula/documento que alimentan las matrices ISO. Multi-organismo desde el
primer día.

## Phases
| # | Name | Files | Risk | Depends on |
|---|------|-------|------|-----------|
| 0 | identidad mínima | backend/auth.py, backend/models.py (Usuario), routers/auth.py, frontend apiClient.js, LoginView | med | - |
| 1 | modelo y API de documentos | backend/models.py, routers/documentos.py, services/archivos_service.py (B2 + antivirus + extracción), docker-compose (clamav) | med | 0, bucket B2 |
| 2 | semilla real y limpieza | scripts/seed_documentos.py, knowledge/isos/documentacion_interna_*.md (eliminar), trazabilidadService.js (eliminar catálogo ficticio) | low | 1 |
| 3 | UI: catálogo, ficha, visor, editor, aprobación, historial | components/documentos/* | med | 1 |
| 4 | matrices derivadas + exportación Excel oficial | routers/matrices.py, services/excel_service.py, components/documentos/Matriz*.jsx | med | 2, 3 |
| 5 | RAG sobre documentos reales | services/iso_rag_service.py | low | 2 |

## Technical decisions

### Decision 1: contenido como secciones estructuradas, no como blob Word
- Chosen: cada documento tiene `secciones[]` (número, título, texto markdown, cláusulas). El archivo
  original se conserva en B2 como evidencia y para descarga; la edición ocurre sobre las secciones.
- Rationale: permite diff por sección, lectura cómoda en pantalla, RAG por fragmento y exportación a
  Word/Excel con plantilla. El Manual ya viene numerado por cláusula ISO (4.1 a 10.3).
- Rejected: editar el .docx en línea (OnlyOffice/Collabora): un servicio pesado más en el VPS y
  sin diff semántico. Guardar solo PDF: no editable ni consultable.

### Decision 2: las matrices se derivan, no se capturan
- Chosen: A19/A20/A21/A18/A10 son vistas sobre `documento_proceso`, `documento_clausula`,
  `documento_relacion` y tablas pequeñas específicas (comunicaciones, salidas no conformes,
  propiedad del cliente, partes interesadas) ligadas a documento o proceso.
- Rationale: resuelve el problema raíz (procedimiento sin matriz). Una sola captura, muchas salidas.
- Rejected: importar los Excel y editarlos como hojas: reproduce la dispersión actual.

### Decision 3: flujo de estados fijo
- `BORRADOR → EN_REVISION → PUBLICADO | RECHAZADO → BORRADOR`, más `OBSOLETO`.
- Publicar crea una `revision` inmutable (snapshot JSON + hash SHA-256 + aprobador). Editar un
  documento publicado abre un nuevo borrador a partir del snapshot vigente.
- Al enviar a revisión es obligatorio el **motivo del cambio** (auditoría, hallazgo, mejora, cambio normativo,
  acción correctiva) y, si aplica, el folio de AC o auditoría que lo origina.
- Los cambios de **metadatos de la ficha** (proceso, área, cláusulas, relaciones) se registran igual que los de
  contenido: toda edición genera entrada en el historial del documento.
- Rationale: ISO 9001 § 7.5.3 (control de cambios, versión vigente identificable, evidencia).

### Decision 4: identidad mínima en servidor antes que todo
- Chosen: tabla `usuarios` (organismo_id, email, hash bcrypt, rol, área, activo), login que
  devuelve token firmado, dependencia `usuario_actual` en FastAPI. Se migran los usuarios actuales
  de `constants/usuarios.js`; la contraseña visible en el login desaparece.
- Rationale: la ruta de aprobación exige saber quién aprobó. Sin esto el módulo es decorativo.
- Rejected: Supabase Auth (contradice mantener todo en el VPS). OAuth institucional (no hay IdP hoy).

### Decision 5: archivos en Backblaze B2 con pipeline de seguridad
- Chosen: bucket privado `sgc-documentos`, llaves solo en `.env` del VPS, entrega por URL firmada,
  magic bytes + re-codificación de imágenes + rechazo de PDF con JavaScript/EmbeddedFiles + ClamAV.
- Rationale: ya acordado con @human; durable, barato, fuera del disco del VPS.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Extracción de texto imperfecta del Manual (tablas, numeración) | high | med | Semilla revisada a mano por sección; el original queda en B2 |
| Gerentes editan fuera del portal y suben Word nuevo | med | high | La ficha permite "nueva revisión desde archivo" que re-extrae y marca diff; el vigente siempre es el del portal |
| RAG con 200+ secciones por organismo | low | med | Indexar por sección con límite de tokens por consulta |
| Auth mínima vista como suficiente para siempre | med | med | Documentar en CONSTITUTION que es fase 0; 2FA/SSO en roadmap |
| ClamAV consume ~1.2 GB RAM | low | low | VPS tiene 6.6 GB libres; monitorear con docker stats |

## Out of scope
- Diagramas de flujo por servicio (siguiente spec; este módulo expone `/api/v1/procesos/{id}/documentos`).
- Firma electrónica avanzada.
- Edición colaborativa simultánea.
- Revisión de redacción del Manual con IA (spec aparte, puede correr en paralelo).
