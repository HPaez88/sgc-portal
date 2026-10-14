# Tasks: control-documental

## Phase 0: identidad mínima
### T0.1 — Tabla `usuarios` y migración de `constants/usuarios.js` (hash bcrypt, rol, área, organismo_id)
- **Archivos:** backend/models.py, backend/database.py, scripts/seed_usuarios.py
- **Acceptance:** `SELECT count(*) FROM usuarios` = usuarios actuales; ninguna contraseña en claro en el repo
- **Owner:** @claude-code · **Depends on:** —
### T0.2 — `POST /api/v1/auth/login` + dependencia `usuario_actual` (token firmado, expiración 8 h)
- **Archivos:** backend/auth.py, backend/routers/auth.py, tests/test_auth.py
- **Acceptance:** login correcto 200 con token; token inválido 401; test pasa
- **Depends on:** T0.1
### T0.3 — Frontend: login contra API, token en apiClient, quitar pista de contraseña
- **Archivos:** frontend/src/services/apiClient.js, LoginView, SGCContext.jsx
- **Acceptance:** sin contraseña visible; recarga mantiene sesión; cierre de sesión invalida
- **Depends on:** T0.2

## Phase 1: modelo y API de documentos
### T1.1 — Modelos: `documentos`, `documento_secciones`, `documento_revisiones`, `documento_proceso`, `documento_clausula`, `documento_relacion`, `documento_aprobaciones`
- **Archivos:** backend/models.py, backend/database.py
- **Acceptance:** tablas creadas al arrancar; clave única por organismo; índices por organismo_id
- **Depends on:** T0.1
### T1.2 — Servicio de archivos: subida a B2, validación (magic bytes, PDF seguro, ClamAV), URL firmada
- **Archivos:** backend/services/archivos_service.py, docker-compose.yml (clamav), requirements.txt (boto3, pikepdf, Pillow, clamd), tests/test_archivos.py
- **Acceptance:** PDF con /JavaScript → 422; EICAR → 422; JPG se re-codifica a WebP ≤1600px; URL firmada expira
- **Depends on:** bucket B2 + llave en .env
### T1.3 — Extracción de texto a secciones (docx por encabezado numerado, xlsx por tabla, pdf texto)
- **Archivos:** backend/services/extraccion_service.py, tests/test_extraccion.py
- **Acceptance:** el Manual real produce ≥ 60 secciones con numeración 4 a 10 correcta
- **Depends on:** —
### T1.4 — Router `/api/v1/documentos`: CRUD con permisos por rol/área, enviar a revisión, aprobar/rechazar, publicar (snapshot + hash), historial, diff
- **Archivos:** backend/routers/documentos.py, tests/test_documentos.py
- **Acceptance:** Usuario → 403 al editar; Encargado de otra área → 403; publicar sin proceso → 422; enviar a revisión sin motivo → 422; publicar crea revisión con hash; cambiar proceso/área/cláusulas genera entrada en historial
- **Depends on:** T1.1, T0.2

## Phase 2: semilla real y limpieza
### T2.1 — Seed con los 8 documentos de `formatos/Docus Sistema` (archivo a B2 + secciones + metadatos + procesos/cláusulas)
- **Archivos:** scripts/seed_documentos.py
- **Acceptance:** 8 documentos PUBLICADOS en organismo 1 con clave y revisión reales
- **Depends on:** T1.2, T1.3, T1.4; archivos A10 y A15 re-guardados como xlsx/docx
### T2.2 — Eliminar catálogo ficticio y conocimiento ficticio
- **Archivos:** frontend/src/services/trazabilidadService.js, backend/knowledge/isos/documentacion_interna_sgc_oomapasc.md, SGCContext.jsx (clave `sgc-documentos`)
- **Acceptance:** grep de `MC-01|PR-CAL-01|REG-CLORO-01` en src = 0 (salvo tests históricos)
- **Depends on:** T2.1

## Phase 3: UI
### T3.1 — Catálogo: lista por tipo/área/proceso/estado, búsqueda; Usuario solo ve publicados
- **Archivos:** components/documentos/CatalogoDocumentos.jsx, services/documentosService.js
- **Depends on:** T1.4
### T3.2 — Ficha + visor: metadatos, procesos, cláusulas, documentos relacionados, secciones legibles, descarga del original
- **Archivos:** components/documentos/FichaDocumento.jsx, VisorDocumento.jsx
- **Depends on:** T3.1
### T3.3 — Editor de borrador por secciones + asignación de proceso/cláusulas/relaciones + enviar a revisión
- **Archivos:** components/documentos/EditorDocumento.jsx
- **Acceptance:** botón "Enviar a revisión" deshabilitado sin proceso asignado
- **Depends on:** T3.2
### T3.4 — Bandeja de aprobación SGC (aprobar/rechazar con comentario) e historial con diff por sección
- **Archivos:** components/documentos/BandejaAprobacion.jsx, HistorialDocumento.jsx
- **Depends on:** T3.3

## Phase 4: matrices derivadas
### T4.1 — Tablas específicas: comunicaciones (A19), salidas no conformes (A20), propiedad del cliente (A18), partes interesadas (A10), ligadas a proceso/documento
- **Archivos:** backend/models.py, routers/matrices.py
- **Depends on:** T1.1
### T4.2 — Matriz de Procesos (A21) derivada de `documento_proceso` × `documento_clausula`; alerta "documento sin proceso"
- **Archivos:** routers/matrices.py, components/documentos/MatrizProcesos.jsx
- **Acceptance:** documento publicado nuevo aparece en A21 sin captura adicional
- **Depends on:** T2.1
### T4.3 — Exportación a Excel con formato oficial (encabezado, clave, revisión, fecha)
- **Archivos:** backend/services/excel_service.py
- **Acceptance:** el A19 exportado abre en Excel con las mismas columnas que el original
- **Depends on:** T4.1, T4.2

## Phase 5: RAG real
### T5.1 — Asesor ISO indexa `documento_secciones` publicadas del organismo activo; cita clave + revisión
- **Archivos:** backend/services/iso_rag_service.py
- **Acceptance:** pregunta "¿qué dice el manual sobre 8.7?" cita OOMLSC-01 Rev 75 § 8.7
- **Depends on:** T2.2
