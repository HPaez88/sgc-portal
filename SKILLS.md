 # SKILLS — Catálogo de técnicas del equipo SGC Portal

> Técnicas y patrones que este proyecto usa de forma consistente. Cuando alguien
> (humano o agente) trabaja en el SGC Portal, aplica estas técnicas.
> Origen: harness `hpaez` + prácticas establecidas en este proyecto.

---

## Core — disciplina de trabajo

| Skill | Cuándo se usa | Qué obliga |
|---|---|---|
| **protocol-sync** | Antes de cualquier edición | Regla de 3 archivos: código + `STATE.md` + `CHANGELOG.md`. Nada está "hecho" hasta que está en disco. |
| **verify-loop** | Antes de marcar una tarea `[x]` | Build + tests + evidencia física. Un todo interno no es prueba. Si el build falla, no se marca. |
| **scope-boundaries** | Antes de editar un archivo dudoso | No tocar `.env`, deploy, `dist/`, `node_modules/`, `.git/`. Bug ajeno → se registra en STATE, no se arregla en línea. |
| **self-correction** | Cuando el @human corrige algo | Convertir la corrección en regla escrita en `CONSTITUTION.md` en el mismo turno. |

## Calidad — antes de entregar

| Skill | Cuándo se usa | Qué busca |
|---|---|---|
| **silent-failure-hunter** | Antes de cada release | `catch {}` vacíos, `fetch` sin `if (!res.ok)`, `JSON.parse` sin try, promesas sin `await`. |
| **judgment-day** | En cambios arquitectónicos | Revisión adversarial: buscar activamente por qué el cambio está mal. |
| **rdd** (README-Driven Development) | Al crear o cambiar un módulo | El README explica el módulo antes que el código. |

## Frontend — patrones obligatorios del SGC Portal

| Patrón | Regla | Archivo de referencia |
|---|---|---|
| **Notificaciones** | Nunca `alert()` ni `confirm()`. Usar `useToast()`. | `components/common/Toast.jsx` |
| **Modales** | Siempre `ModalBase` (renderiza en portal). Nunca un `fixed inset-0` a mano. | `components/common/ModalBase.jsx` |
| **Llamadas HTTP** | Siempre `apiClient`. Nunca `fetch` crudo. | `services/apiClient.js` |
| **Descargas** | Siempre `descargarBlob`. Nunca `revokeObjectURL` inmediato. | `services/apiClient.js` |
| **Persistencia** | Escritura remota agrupada por debounce. Nunca un upsert por tecla. | `services/syncService.js` |
| **Tablas anchas** | En móvil se convierten en tarjetas apiladas. Cero scroll horizontal. | `components/riesgos/RiesgosView.jsx` |
| **Campos de texto libre** | Auto-crecen con el contenido (`ResizeObserver`). | `components/riesgos/CampoPlanAccion.jsx` |
| **Validación** | Reglas compartidas en `validacion.js`, nunca lógica suelta por componente. | `services/validacion.js` |

## Backend — patrones obligatorios

| Patrón | Regla |
|---|---|
| **Workflow** | Estados y transiciones viven en `backend/models.py`. El frontend los consume vía API, no los duplica. |
| **Multi-tenant** | Toda consulta filtra por `organismo_id` vía `Depends(get_organismo_id)`. |
| **Errores de IA** | `_extraer_json` lanza `HTTPException 502` con contexto, nunca `ValueError` crudo. |
| **Transacciones** | `get_session` hace rollback ante excepción y cierra en `finally`. |
| **Duplicación** | Los catálogos compartidos viven en `routers/_sgc_common.py`. Nunca copiarlos por router. |

## Integración entre módulos (ISO 9001)

| Puente | Requisito | Servicio |
|---|---|---|
| Indicador fuera de meta → AC | §9.1.3 → §10.2 | `flujoService.acDesdeIndicador` |
| Hallazgo de auditoría → AC | §9.2 → §10.2 | `flujoService.acDesdeAuditoria` |
| Riesgo sin plan → PM | §6.1 → §10.3 | `flujoService.pmDesdeRiesgo` |
| Documento con impacto crítico → AC | §7.5.3 → §10.2 | `flujoService.acDesdeDocumento` |

Todo vínculo registra el movimiento en la bitácora con `movimientoVinculo`.

## Pruebas

| Suite | Cubre |
|---|---|
| `services/__tests__/trazabilidadService.test.js` | Impacto documental, referencias rotas, falsos positivos |
| `services/__tests__/validacion.test.js` | Clave única, parseo numérico, referencias |
| `services/__tests__/flujoService.test.js` | Puentes inter-módulos y folios de borrador |
| `constants/__tests__/workflow.test.js` | Transiciones, permisos, semáforo de vencimiento |

Comando: `npm test` (Vitest).

---

## Añadir una skill nueva

1. Crear la carpeta en `skills/<categoría>/<nombre>/`
2. Escribir `SKILL.md` con frontmatter (`name`, `description`, `license`, `metadata`)
3. Incluir: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References
4. Registrar la skill en esta tabla
5. Anotar en `CHANGELOG.md` con tag `[SKILL]`