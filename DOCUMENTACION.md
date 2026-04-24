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
- Interfaz con colores oficiales OOMAPASC
- Menú lateral desplegable
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
| IAsolo genera proceso/área/origen | ✅ Completado | - |
| Export PDF no funciona | 🔴 Media | 2 |
| Colores no son OOMAPASC | 🔴 Media | 3 |
| Menú no es lateral | 🔴 Baja | 3 |
| Formatos no equal oficiales | 🔴 Media | 2 |

---

## 7. Avance (23 abril 2026)

### ✅ IA Mejorada
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
- [ ] **Export:** Agregar PDF además de Word

### Corto Plazo (Priority 2)
- [ ] **UI:** Nuevo diseño con menú lateral
- [ ] **Colores:** Aplicar identidad OOMAPASC
- [ ] **Formatos:** Alinear con archivos oficiales
  - Azul: #2A78B0
  - Amarillo: #dddd26
  - Verde: #28a745
- [ ] **Formatos:** Alinear con archivos oficiales

### Largo Plazo (Priority 3)
- [ ] Autenticación de usuarios
- [ ] Historial completo de cambios
- [ ] Notificaciones por correo
- [ ] Base de datos PostgreSQL

---

## 9. Contacto del Proyecto

- **Desarrollador actual:** opencode AI
- **Dueño del proyecto:** Humberto Páez
- **Repositorio GitHub:** https://github.com/HPaez88/sgc-portal

---

*Documento generado: 23 abril 2026*