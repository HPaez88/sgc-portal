# SGC Portal - OOMAPAS de Cajeme

## Estado del Proyecto: 🟡 EN DESARROLLO
**Última actualización:** 2026-04-27

## URLs
- **Producción:** https://sgc-portal-933s.onrender.com
- **Repositorio:** https://github.com/HPaez88/sgc-portal

---

## Arquitectura

###Tech Stack
| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de Datos | Supabase (PostgreSQL) |
| Despliegue | Render |
| AI | OpenAI GPT-4 |

### Estructura de Archivos
```
SGC page/
├── frontend/          # React app
├── backend/           # Express API
├── agentes/          # Configuración de agentes
│   ├── modules/       # Agentes por módulo
│   └── README.md     # Este archivo
├── formatos/         # Esquemas SQL
└── SEO/              # Optimización
```

---

## Módulos Implementados

### 1. Dashboard
- Estadísticas generales
- Gráficos de cumplimiento por área
- Lista de acciones recientes

### 2. Documentos (Ctrl. Doc. ISO)
- Listado de documentos controladas
- Código, versión, fecha
- Filtros por tipo y área

### 3. Acciones Correctivas (OOMRSC-20)
- Formato: OOMRSC-20
- Estados: BORRADOR → EN_REVISION → APROBADO → CERRADO
- Tabs: REGISTRO | ANÁLISIS | ACTIVIDADES | AUDITOR

### 4. Planes de Mejora (OOMRSC-21)
- Formato: OOMRSC-21
- Oportunidades de mejora
- Seguimiento y cierre

### 5. Indicadores
- KPIs por área
- Gráficos de trend

### 6. Auditorías
- Programación
- Hallazgos

---

## Módulos Pendientes
- [ ] Mejora Continua
- [ ] Control de Documentos (avanzado)
- [ ] Encuestas de Satisfacción
- [ ] Gestión de Proveedores

---

## Base de Datos (Supabase)

### Tablas Principales
- `areas` - Catálogo de 33 áreas
- `procesos` - Procesos de negocio
- `usuarios` - Personal autorizados
- `documentos` - Documentos ISO
- `acciones_correctivas` - AC OOMRSC-20
- `planes_mejora` - PM OOMRSC-21
- `evidencias` - Evidencias adjuntas
- `indicadores` - Indicadores de gestión
- `auditorias` - Programación y hallazgos

### RLS Habilitado
Políticas por área de usuario.

---

## Equipos de Desarrollo

### Orquestador (CEO)
- **Rol:** Coordina estrategia y delega

### Agentes Especializados
| Agent | Rol | Expertise |
|-------|-----|-----------|
| frontend | UI/UX | React, Tailwind |
| backend | API | Node, Express |
| database | DBA | PostgreSQL, Supabase |
| qa | Testing | Validación |
| seo | SEO | Performance |

### Agentes por Módulo
| Agent | Módulo |
|-------|--------|
| dashboard | Dashboard |
| documentos | Control Documentos |
| acciones-correctivas | OOMRSC-20 |
| planes-mejora | OOMRSC-21 |
| indicadores | Indicadores |
| auditorias | Auditorías |

---

## Workflow de Desarrollo

1. **Planificación** → Orquestador define tarea
2. **Desarrollo** → Agent especializado implementa
3. **QA** → Agent valida
4. **Deploy** → Push a main → Render despliega
5. **Verificación** → QA confirma en producción

---

## Normas Aplicadas
- ISO 9001:2015
- OOMRSC-20 (Acciones Correctivas)
- OOMRSC-21 (Planes de Mejora)

---

## Contacto
- **Desarrollado por:** Hugo Páez / OOMAPAS de Cajeme
- **Soporte:** issues@github.com/HPaez88/sgc-portal