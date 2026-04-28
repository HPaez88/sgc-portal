# SGC Portal - Estructura de Agentes

## CEO/Orquestador (Orchestrator)
Coordina toda la estrategia y delega a sub-agentes.

## Agentes Especializados

| Agent | Rol | Área de Expertise |
|-------|-----|-------------------|
| `sgc-frontend` | Desarrollador Frontend | React, Tailwind, UI |
| `sgc-backend` | Desarrollador Backend | Node.js, Express, API |
| `sgc-database` | DBA | PostgreSQL, Supabase, RLS |
| `sgc-qa` | QA/Testing | Validación, Debugging |
| `sgc-seo` | SEO | Performance, Búsqueda |

## Cómo Usar

### Para desarrollar una nueva característica:

1. **Frontend Agent** → Crea componentes UI
2. **Backend Agent** → Crea endpoints API
3. **Database Agent** → Diseña tablas si es necesario
4. **QA Agent** → Valida que todo funcione
5. **SEO Agent** → Optimiza si hay cambios visibles

### Para arreglar un bug:

1. QA identifica el problema
2. Frontend o Backend según corresponda arregla
3. QA verifica la corrección
4. SEO revisa si afecta rendimiento

##召唤 Agentes

Cada agente tiene un archivo JSON con su configuración. El orquestador decide a quién llamar según el tipo de tarea.

## current_status.txt
última actualización: 2026-04-27
estado del proyecto:Funcional pero con problemas de renderizado en Acciones Correctivas/Planes de Mejora
módulos implementados: Dashboard, Documentos, Acciones Correctivas, Planes de Mejora, Indicadores, Auditorías
módulos pendientes: Mejora Continua, Control de Documentos, Encuestas Satisfacción