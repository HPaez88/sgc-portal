# Plan: multiempresa

**Estado:** PLAN — no implementar hasta indicación de @human.

## Overview
Mantener una sola base de datos con aislamiento por `organismo_id` (el cimiento ya existe) y mover a
datos por organismo todo lo que hoy está fijo en el código. OOMAPASC se migra como organismo 1 con su
configuración actual, así que no nota el cambio.

## Phases
| # | Name | Files | Risk | Depends on |
|---|------|-------|------|-----------|
| 0 | cierre de fugas + pruebas de aislamiento | routers/organismos.py, models.py (email por organismo), tests/test_aislamiento.py | low | - |
| 1 | configuración por organismo | models.py (OrganismoConfig), routers/organismos.py, SGCContext.jsx | med | 0 |
| 2 | catálogos desde el servidor | constants/* → semilla; areas/direcciones/procesos/indicadores por organismo | med | 1 |
| 3 | marca y nomenclatura | Header, Login, Sidebar, PDFs, folio.js, formatos | med | 1 |
| 4 | manual y Asesor ISO por organismo | seed_documentos.py, iso_rag_service.py, knowledge/ | med | 1 |
| 5 | alta de empresa + rol de plataforma | routers/plataforma.py, vista de alta, auth (rol Plataforma) | high | 0–4 |
| 6 | integraciones por organismo (opcional) | remitente de correo, llave de IA, subdominio | low | 5 |

## Technical decisions

### Decision 1: una base de datos con aislamiento por fila
- Chosen: seguir con `organismo_id` en cada tabla y filtrar en el servidor desde el token.
- Rationale: ya implementado y probado; un solo backup, un solo despliegue, costo mínimo en el VPS.
- Rejected: base de datos por cliente (multiplica respaldos, migraciones y RAM); esquema por cliente
  (complica SQLModel y migraciones sin beneficio a esta escala).

### Decision 2: configuración como datos, no como código
- Chosen: tabla `organismo_config` (nombre corto, logo, colores, nomenclatura de formatos y folios,
  zona horaria) + catálogos por organismo vía `estado_portal` o tablas propias.
- Rationale: dar de alta un cliente no debe requerir desplegar código.

### Decision 3: rol de plataforma separado
- Chosen: rol `Plataforma` (dueño del producto) que crea empresas y su primer Super Admin; no ve datos
  operativos de los clientes salvo soporte explícito y registrado.
- Rationale: hoy Super Admin es el administrador de OOMAPASC; mezclar ambos papeles rompe el aislamiento.

### Decision 4: pruebas de aislamiento obligatorias
- Chosen: una prueba que crea dos organismos y verifica 403/404 cruzados en cada endpoint de datos.
  Se agrega al CI y bloquea cualquier endpoint nuevo sin filtro.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Endpoint nuevo sin filtro de organismo | med | high | Prueba de aislamiento por endpoint en CI |
| Migrar catálogos de OOMAPASC altera datos vivos | low | high | Semilla idéntica a lo actual, respaldo previo, verificación por conteo |
| Textos "OOMAPASC" olvidados en PDFs/exportes | high | med | `grep` en CI que falle si aparece fuera de la semilla del organismo 1 |
| Email único global impide usuarios en dos empresas | med | low | Índice único (organismo_id, email) |

## Out of scope
- Facturación, planes y cobros.
- Base de datos o servidor dedicado por cliente.
- Dominios personalizados por cliente (posible fase 6+).
