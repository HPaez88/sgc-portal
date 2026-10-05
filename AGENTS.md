# SGC Portal - Sistema de Agentes

**Versión:** 2.0
**Basado en:** Everything Claude Code (ECC)
**Fecha:** 2026-05-07

---

## Arquitectura de Agentes

```
                    ┌─────────────────────┐
                    │   ORCHESTRATOR     │
                    │  (Chief Execute)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
   │FRONTEND │        │ DATABASE │       │ BACKEND │
   └────┬────┘        └──────┬───┘       └───┬────┘
        │                   │               │
   ┌────┴────┐        ┌────┴────┐    ┌────┴────┐
   │  QA    │        │   SEO   │    │  AI    │
   └────────┘        └─────────┘    └────────┘
        │
   ┌────┴───────┬───────────┬──────────┬──────────┐
   │           │           │          │          │
┌──▼──┐  ┌───▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──────┐
│ AC  │  │ PM  │ │ Indic│ │RIESG│ │ DOC │ │AUDIT │
└─────┘  └─────┘ └─────┘ └─────┘ └─────┘ └──────┘
```

---

## Agentes Core

| Agente | Rol | Responsabilidad Principal |
|--------|-----|---------------------|
| orchestrator | Chief | Coordinar flujo de trabajo, aprobar changes |
| frontend | UI Dev | Componentes React, build, estilos |
| backend | API Dev | Endpoints FastAPI, lógica de negocio |
| database | DB Architect | Esquemas Supabase, RLS, sync |
| qa | Quality | Testing, flujos de usuario |
| seo | SEO | Metadata, schema.org, performance |

---

## Agentes por Módulo

### AC (Acciones Correctivas)
- **Agente:** sgc-ac-agent
- **Componente:** `AccionCorrectivaView.jsx`
- **Formulario:** OOMRSC-20
- **Estados:** BORRADOR → RECHAZADO → APROBADO → EN_SEGUIMIENTO → CERRADO (con transiciones para: actualizar, reabrir, aprobar, cerrar, asignar auditor, solicitar replanteo)

### PM (Planes de Mejora)
- **Agente:** sgc-pm-agent
- **Componente:** `PlanMejoraView.jsx`
- **Formulario:** OOMRSC-21

### Indicadores
- **Agente:** sgc-indicadores-agent
- **Componente:** `IndicadoresView.jsx`
- **Formulario:** OOMRSC-05 Rev. 37 (Cuadro de Control de Desempeño)
- **CANTIDAD:** 100 indicadores oficiales (#0 a #99)
- **Metodología:** Semáforo institucional (🟢 ≥90% | 🟡 80-89% | 🔴 ≤79%), metas trimestrales T1-T4 y bitácora de Reportes de Corrección (RC).

### Revisión por la Dirección
- **Agente:** sgc-revision-agent
- **Componente:** `RevisionDireccionView.jsx`
- **Formulario:** OOMRSC-04 Rev. 09
- **Cláusulas ISO:** 9.3.2 (Entradas A-F) y 9.3.3 (Salidas y Acuerdos) con formularios complementarios y regla de captura de los primeros 10 días.

### Riesgos
- **Agente:** sgc-riesgos-agent
- **Componente:** `RiesgosView.jsx`

### Documentos & Trazabilidad
- **Agente:** sgc-documentos-agent
- **Componente:** `DocumentosView.jsx`
- **Pestañas:** Catálogo de Documentos, Matriz de Trazabilidad, Bitácora de Auditoría, Gobernanza de IA & TI (POL-TI-01)

### Auditorías
- **Agente:** sgc-auditorias-agent
- **Componente:** `AuditoriasView.jsx`

### Asesor Normativo ISO (IA)
- **Agente:** sgc-iso-advisor-agent
- **Componente:** `AgenteISOView.jsx`
- **Backend Service:** `iso_rag_service.py`
- **Base de Conocimiento:** `backend/knowledge/isos/` (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, ISO 19011:2018) y `backend/knowledge/custom/`

---

## Flujo de Validación Cruzada

### Regla Principal
> **TODO cambio debe ser validado por TODOS los agentes relevantes ANTES de producción**

### Orden de Validación

1. **Frontend** → Verifica build, imports, sintaxis
2. **Database** → Verifica esquemas compatibles
3. **Backend** → Verifica APIs y endpoints
4. **QA** → Verifica flujos de usuario
5. **SEO** → Verifica metadata (si aplica)

### Commands de Validación

```bash
# Frontend
npm run build

# Verificar imports
grep -n "import.*from" src/App.jsx | head -20

# Database
# Verificar que tablas existen en Supabase
```

---

## Skills y Comandos

### Comandos Disponibles

| Comando | Descripción |
|---------|------------|
| /build | Ejecutar build de frontend |
| /test | Ejecutar pruebas |
| /audit | Auditoría completa del sistema |
| /deploy | Desplegar a producción |

### Skills por Módulo

- **AC:** Generar con IA, Export PDF, Workflow estados
- **PM:** Generación automática, Presupuesto
- **Indicadores:** Semáforo, Captura mensual

---

## Checklist de Release

- [ ] `npm run build` pasa sin errores
- [ ] No hay funciones duplicadas
- [ ] Schemas de DB son compatibles
- [ ] APIs funcionan con nuevos campos
- [ ] Testing cubre el cambio
- [ ] Metadata SEO actualizada

---

## Contactos

- **Proyecto:** Lic. Héctor Manuel Páez León
- **Desarrollo:** opencode AI + Agentes SGC
- **Producción:** https://sgc-portal-933s.onrender.com
- **Supabase:** https://yrjlmqxpakjiwrfwhgaj.supabase.co

---

*Documento actualizado: 7 mayo 2026*
*Versión: 2.0*