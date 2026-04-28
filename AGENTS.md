# AGENTS.md - Sistema de Agentes SGC Portal

## Visión General

Este proyecto utiliza un sistema de agentes especializados para escalar el desarrollo sin romper funcionalidad existente.

---

## Estructura de Agentes

```
Orquestador (CEO)
    │
    ├── Frontend Agent
    │       ├── Dashboard Agent
    │       ├── Documentos Agent
    │       ├── Acciones Correctivas Agent
    │       ├── Planes Mejora Agent
    │       ├── Indicadores Agent
    │       └── Auditorías Agent
    │
    ├── Backend Agent
    │
    ├── Database Agent
    │
    ├── QA Agent
    │
    └── SEO Agent
```

---

## Agentes Configurados

### Agentes Core
| Archivo | Rol |
|--------|-----|
| `agents/orchestrator.json` | CEO - Orquestador |
| `agents/frontend.json` | Desarrollador Frontend |
| `agents/backend.json` | Desarrollador Backend |
| `agents/database.json` | DBA - Base de Datos |
| `agents/qa.json` | QA - Testing |
| `agents/seo.json` | SEO Specialist |

### Agentes por Módulo
| Archivo | Módulo |
|--------|--------|
| `agents/modules/dashboard.json` | Dashboard |
| `agents/modules/documentos.json` | Control Documentos |
| `agents/modules/acciones-correctivas.json` | OOMRSC-20 |
| `agents/modules/planes-mejora.json` | OOMRSC-21 |
| `agents/modules/indicadores.json` | Indicadores |
| `agents/modules/auditorias.json` | Auditorías |

---

## Guía de Uso

### Antes de hacer cambios:

1. **Identificar qué módulo se ve afectado**
2. **Llamar al agente apropiado**
3. **QA valida antes de deploy**

### Llamadas típicas:

| Escenario | Agent a llamar |
|-----------|---------------|
| Nuevo campo en AC | `acciones-correctivas` + `frontend` |
| Nueva API | `backend` + `database` |
| Nueva tabla | `database` |
| Bug de UI | `frontend` |
| Error de API | `backend` |
| Deploy roto | `qa` (investiga) + agente necesario |
| Performance lenta | `seo` |

---

## current_status.txt

```
fecha: 2026-04-28
Build: PASS ✓
Test: VERIFICANDO
Deploy: OK (Render)

bugs_activos:
  - Pantalla blanca al seleccionar Acciones Correctivas (FIXED en 7d9c65a)
  - Formulario no guarda en Supabase (PENDIENTE)

proximos Cambios:
  - Verificar que AC y PM rendericen correctamente
  - Agregar guardado a Supabase
  - Mejorar UX de tabs
```