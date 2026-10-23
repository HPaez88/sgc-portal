# Tasks: multiempresa

**Estado:** PLAN — no implementar hasta indicación de @human.

## Phase 0: cierre de fugas y pruebas
### T0.1 — `GET /api/v1/organismos` devuelve solo el organismo del usuario (lista completa solo rol Plataforma)
- **Acceptance:** usuario de A recibe solo A
### T0.2 — Índice único `(organismo_id, email)` en usuarios; login resuelve organismo por correo + selector si pertenece a varios
- **Acceptance:** mismo correo en dos empresas permitido
### T0.3 — `tests/test_aislamiento.py`: dos organismos, lectura/escritura cruzada en cada router de datos → 403/404
- **Acceptance:** falla si un endpoint nuevo no filtra

## Phase 1: configuración por organismo
### T1.1 — Modelo `OrganismoConfig` (nombre corto, logo en B2, colores, nomenclatura formatos/folios, zona horaria)
### T1.2 — `GET /api/v1/organismos/actual/config` y carga en `SGCContext` al iniciar sesión
### T1.3 — Semilla del organismo 1 con la configuración actual de OOMAPASC

## Phase 2: catálogos desde el servidor
### T2.1 — Áreas, direcciones, procesos, orígenes, indicadores por organismo (semilla = constants actuales para org 1)
### T2.2 — Frontend deja de leer `constants/*` para catálogos de negocio (solo valores por defecto vacíos)
- **Acceptance:** org 2 sin catálogos ve listas vacías, no las de OOMAPASC

## Phase 3: marca y nomenclatura
### T3.1 — Header, Login, Sidebar, PDFs y correos toman nombre/logo de la config
### T3.2 — `folio.js` y formatos (OOMRSC-20/21) desde la config del organismo
### T3.3 — Check en CI: "OOMAPASC" no aparece fuera de la semilla del organismo 1

## Phase 3b: módulos activables e indicadores ligeros
### T3b.1 — `OrganismoConfig.modulos` con catálogo de paquetes (`nucleo` siempre; `gobierno_municipal` opcional)
### T3b.2 — Indicadores: pestañas `cuadro` y `procesos` en el núcleo; `fichas`, `proyectos`, `trimestral` y control presupuestal solo con `gobierno_municipal`
- **Acceptance:** organismo sin el paquete no ve esas pestañas ni puede llamar `/api/v1/fichas/*` (403)
### T3b.3 — Sidebar, Panel principal y revisión por la dirección se adaptan a los paquetes activos
### T3b.4 — OOMAPASC (org 1) queda con `gobierno_municipal` activo: sin cambios visibles

## Phase 4: manual y Asesor ISO
### T4.1 — Manual y anexos por organismo (documentos ya tienen `organismo_id`; semilla solo para org 1)
### T4.2 — Asesor ISO: normas ISO compartidas; conocimiento interno (manual, procedimientos) filtrado por organismo

## Phase 5: alta de empresa
### T5.1 — Rol `Plataforma` y router `/api/v1/plataforma/organismos` (crear, suspender)
### T5.2 — Alta: nombre, slug, primer Super Admin (contraseña temporal), catálogos iniciales vacíos o de plantilla
### T5.3 — Vista de alta para el dueño del producto
- **Acceptance:** empresa nueva operando en < 10 min sin acceso a la base de datos

## Phase 6 (opcional): integraciones por organismo
### T6.1 — Remitente de correo y llave de IA por organismo (con valores de plataforma por defecto)
### T6.2 — Subdominio por cliente vía Traefik
