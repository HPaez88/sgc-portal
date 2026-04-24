# Portal SGC - OOMAPASC de Cajeme
## Documentación del Proyecto

---

## 1. Resumen del Proyecto

**Nombre:** Portal SGC (Sistema de Gestión de Calidad)  
**Organización:** OOMAPASC de Cajeme  
**Versión:** 3.1.0  
** Tecnología:** FastAPI (Backend) + React (Frontend) + SQLite  

**URL en producción:** https://sgc-portal-933s.onrender.com

---

## 2. Funcionalidad Actual

### ✅ Implementado y Funcional
- Dashboard con métricas de Control 6
- Crear/Aprobar Acciones Correctivas
- Crear/Aprobar Planes de Mejora
- Gestión de estados (BORRADOR → EN_REVISION → APROBADO → EN_SEGUIMIENTO → CERRADO)
- Export a Word (.docx)
- API REST con catálogos
- **IA con Groq:** ✅ Mejorada (ahora genera documento completo)

### ❌ Pendiente/No Funcional
- Export a PDF (solo Word)
- Formatos exactos a los oficiales (formatos/*.xlsx)

---

## 3. Arquitectura Técnica

```
Frontend (React + Vite)
    ↓ fetch API
Backend (FastAPI)
    ↓ SQLModel
SQLite (sgc_portal.db)
    ↓
IA (Groq - modelo: llama-3.1-8b-instant)
```

### Endpoints Principales
- `GET /api/v1/dashboard` - Estadísticas
- `GET /api/v1/catalogos` - Listas desplegables
- `GET/POST /api/v1/acciones-correctivas` - AC
- `GET/POST /api/v1/planes-mejora` - PM
- `POST /api/v1/ai/generar-ac` - IA para AC
- `POST /api/v1/ai/generar-pm` - IA para PM

---

## 4. Credenciales y Variables

### Groq (IA)
- **Key en Render:** configurar como variable de entorno `GROQ_API_KEY`
- **Modelo:** `llama-3.1-8b-instant`
- Obtener key en: https://console.groq.com/keys

### Render (Hosting)
- **URL:** https://sgc-portal-933s.onrender.com
- **Repositorio:** https://github.com/HPaez88/sgc-portal

---

## 5. Estructura de Archivos

```
SGC page/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── models.py        # Modelos SQLModel
│   ├── database.py    # Conexión DB
│   ├── routers/       # Endpoints API
│   └── services/      # AI y documentos
├── frontend/
│   ├── src/
│   │   ├── App.jsx   # Componente principal
│   │   ├── config.js # URL del API
│   │   └── components/
│   └── dist/         # Build de producción
├── formatos/                  # Formatos oficiales
│   ├── formato acción correctiva.xlsx
│   ├── plan de mejora.xlsx
│   └── Control 6.xlsx
├── render.yaml        # Config Render
└── requirements.txt # Dependencias Python
```

---

## 6. Problemas Conocidos

| Problema | Estado | Prioridad |
|---------|--------|----------|
| IA genera documento completo | ✅ Completado | - |
| UI con colores OOMAPASC | ✅ Completado | - |
| Menú lateral | ✅ Completado | - |
| Formularios mejorados | ✅ Completado | - |
| Export PDF no funciona | 🔴 Media | 2 |
| Formatos no equal oficiales | 🔴 Media | 2 |

---

## 7. Avance (24 abril 2026)

### ✅ UI Mejorada (24 abril)
- Menú lateral desplegable con colores OOMAPASC
- Nuevo diseño con header y sidebar
- Colores institucionales: Azul #2A78B0, Amarillo #dddd26
- Formularios redesigned:
  - Pasos claros (1. Describir → 2. Revisar)
  - Secciones con encabezados visuales
  - Fechas tipo date
  - Actividades dinámicas

### ✅ IA Mejorada (23 abril)
- Prompt de Acción Correctiva ahora genera:
  - Análisis de causa raíz (técnica 6M)
  - Mínimo 3 posibles causas con categorías
  - Causa raíz seleccionada
  - Acción contención + actividades immediatas
  - Plan de actividades completo
  
- Prompt de Plan de Mejora ahora genera:
  - Situación actual + deseada
  - Beneficios esperados
  - Equipo de trabajo
  - 3 actividades con indicadores, responsables y fechas

---

## 8. Planes Futuros

### Inmediato (Priority 1)
- [x] **IA:** Mejorar prompt para generar documento completo
- [x] **UI:** Nuevo diseño con menú lateral
- [x] **Colores:** Aplicar identidad OOMAPASC
- [ ] **Export:** Agregar PDF además de Word

### Corto Plazo (Priority 2)
- [ ] **Formatos:** Alinear con archivos oficiales

### Largo Plazo (Priority 3)
- [ ] Autenticación de usuarios
- [ ] Historial completo de cambios
- [ ] Notificaciones por correo
- [ ] Base de datos PostgreSQL

---

## 9. Referencias UI

- https://dribbble.com/shots/27307815-UI-UX-Design-for-Viora-Health-Tracking-Platform
- https://dribbble.com/shots/26408113-Chartmogul-CRM-platform-redesign

---

## 10. Contacto del Proyecto

- **Desarrollador actual:** opencode AI
- **Dueño del proyecto:** Humberto Páez
- **Repositorio GitHub:** https://github.com/HPaez88/sgc-portal

---

*Documento generado: 23 abril 2026*