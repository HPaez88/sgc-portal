# Portal SGC - OOMAPASC de Cajeme
## Documentación del Proyecto

---

## 1. Resumen del Proyecto

**Nombre:** Portal SGC (Sistema de Gestión de Calidad)  
**Organización:** OOMAPASC de Cajeme (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme)  
**Versión:** 4.1.0  
**Tecnología:** React + Vite (Frontend with localStorage persistence)  
**URL en producción:** https://sgc-portal-933s.onrender.com  
**Repositorio GitHub:** https://github.com/HPaez88/sgc-portal

---

## 2. Estado Actual del Proyecto (24 abril 2026)

### ✅ IMPLEMENTADO Y FUNCIONAL

| Módulo | Estado | Notas |
|--------|---------|-------|
| Dashboard | ✅ | Stats con trend indicadores |
| Acciones Correctivas (AC) | ✅ | Formulario 3 pasos, IA Groq, validación, localStorage |
| Planes de Mejora (PM) | ✅ | Formulario 3 pasos, IA Groq, localStorage |
| Indicadores | ✅ | Vista mensual y trimestral, semáforo,localStorage |
| Matriz de Riesgos | ✅ | Con plan de acción y evaluación, localStorage |
| Gestión de Usuarios | ✅ | CRUD completo con roles, localStorage |
| Configuración | ✅ | Catálogos editables (Áreas, Direcciones, Procesos) |
| Aprobaciones | ✅ | Workflow de aprobación completo |
| Documentos | ✅ | Catálogo, exportar, CRUD |
| Auditorías | ✅ | Registro completo de auditorías |
| Evidencias | ✅ | Sistema de evidencia por AC/PM (basic) |

### 🟡 MEJORAS IMPLEMENTADAS v4.1.0
- localStorage funciona correctamente
- Módulos Documents y Audits completados
- Persistencia de datos real

### 🔴 PENDIENTE / NO IMPLEMENTADO

| Módulo | Estado | Notas |
|--------|---------|-------|
| Backend API | 🔴 | No hay server - localStorage |
| Autenticación/Login real | 🔴 | Solo simulado |
| Export documentos | 🔴 | Solo txt basic |
| Notificaciones email | 🔴 | No implementado |
| Gráficos charts | 🔴 | No implementado |

---

## 3. Catálogos del Sistema

### ÁREAS (33 áreas de OOMAPASC)
```
- Agencia Esperanza, Agencia Marte R. Gómez, Agencia Providencia, Agencia Pueblo Yaqui
- Alcantarillado y Saneamiento, Atención Ciudadana, Comunicación e Imagen Institucional
- Contabilidad, Contratos y Servicios, Control de Calidad, Control y Servicios
- Cultura del Agua, Informática, Jurídico, Licitaciones, Línea OOMAPASC
- Mantenimiento de Redes, Mantenimiento y Servicios Generales, Órgano de Control Interno
- Padrón de Usuarios, Plantas Potabilizadoras, Programas Sociales, Proyectos e Infraestructura
- Recursos Humanos, Recursos Materiales, Sectorización Hidrométrica e Innovación
- Seguridad Industrial, Sistema de Gestión de Calidad, Suburbano Técnico
- Supervisión y Control de Obras, Trabajo Social, Trámites Técnicos, Verificación y Lectura
```

### DIRECCIONES
```
- Dir. General, Dir. Técnica, Dir. Administrativa
- Dir. Órganos de Control Interno, Dir. Comercial
- Dir. Jurídica, Dir. Programas Sociales y Cultura del Agua
```

### PROCESOS (ISO 9001)
```
- Comercialización, Comunicación, Gestión de Recursos
- Mantenimiento y Calibración, Medición Análisis y Mejora
- Producción, Proyectos e Infraestructura
- Responsabilidad de la Dirección
```

### ROLES (Jerarquía)
```
1. Super Admin (indestructible, solo 1 - Lic. Héctor Páez)
2. Admin (compis área SGC, pueden nutrir info en todas las áreas)
3. Auditor (crear AC/PM para cualquier área, no modifica indicadores)
4. Encargado (solo su área: AC, PM, indicadores)
5. Usuario (ver + indicators/evidencias, no documentos)
```

### INDICADORES (12 indicadores base)
```
- Turbiedad Promedio (Plantas Potabilizadoras)
- Cloro Residual (Plantas Potabilizadoras)
- Recaudación (Contabilidad)
- Quejas Atendidas (Atención Ciudadana)
- Eficiencia de Bombas (Mantenimiento de Redes)
- NC Resueltas (Sistema de Gestión de Calidad)
- Cumplimiento de Indicadores (Sistema de Gestión de Calidad)
- Proyectos Terminados (Proyectos e Infraestructura)
- Capacitaciones (Recursos Humanos)
- Lectura de Medidores (Verificación Y Lectura)
- Tiempo de Respuesta (Línea OOMAPASC)
- Contratos Activos (Contratos y Servicios)
```

---

## 4. Arquitectura Técnica

```
SGC page/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Todo el código React (2000+ líneas)
│   │   ├── catalogs.js      # Catálogos centralizados
│   │   ├── hooks.js         # useLocalStorage, useFormValidation
│   │   └── config.js        # API URL
│   ├── package.json        # Dependencias
│   └── dist/               # Build de producción
├── formatos/                 # Archivos oficiales Excel
│   ├── formato acción correctiva.xlsx
│   ├── plan de mejora.xlsx
│   ├── Control 6.xlsx
│   └── Cuadro de Control Marzo 2026.xlsx
└── DOCUMENTACION.md
```

### Colores Institucionales
- **Azul OOMAPASC:** #002855 (principal)
- **Cyan-accent:** #06b6d4
- **Fondo:** #f8fafc (slate-50)

---

## 5. Módulos del Frontend

### 5.1 Acciones Correctivas
- **Pasos:** 1. Describir → 2. Analizar → 3. Plan de Acción
- **Campos:** Fecha detección, Área, Proceso, Origen (Auditoría/Indicador/Queja/Otra)
- **Origen Auditoría:** Número de auditoría
- **Origen Indicador:** Selector de indicadores
- **IA:** Generatescause raiz (6M), containment action, actividades
- **Validación:** Campos requeridos paso a paso

### 5.2 Planes de Mejora
- **Pasos:** 1. Describir → 2. Análisis → 3.Plan
- **Campos:** Situación actual/deseada, beneficios, equipo de trabajo
- **IA:** Genera contenido completo

### 5.3 Indicadores
- **Vista Mensual:** Tabla con 12 columnas (Ene-Dic), captura inline
- **Vista Trimestral:** Selector T1/T2/T3/T4, stats por área
- **Semáforo:** 🟢 ≥80%, 🟡 50-79%, 🔴 <50%
- **Cálculo:** Compara vs meta (>, <, =)

### 5.4 Matriz de Riesgos
- **Campos:** Área, Dirección, Proceso, Probabilidad(1-5), Impacto(1-5)
- **Nivel:** Probabilidad × Impacto
- **Plan de Acción:** editable en tabla
- **Fecha término y Evaluación:** Bueno/Regular/Malo

### 5.5 Gestión de Usuarios
- **CRUD completo:** Nombre, Email, Teléfono, Área, Dirección, Rol, Contraseña
- **Protección:** Super Admin no se puede eliminar
- **Edición:** Modal completo

### 5.6 Configuración
- **Catálogos editables:** Áreas, Direcciones, Procesos
- **Confirmación:** Al eliminar cualquier elemento

---

## 6. Dependencias npm

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "lucide-react": "^0.400.0",
  "tailwindcss": "^3.4.17",
  "vite": "^5.4.21"
}
```

---

## 7. IA Groq Integration

- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `llama-3.1-8b-instant`
- **API Key:** Configurar en `.env` como `VITE_GROQ_API_KEY`
- Fallback hardcodeado en código (DEBE CAMBIARSE antes de producción)

---

## 8. Pendientes y Mejoras Detectadas

### PRIORIDAD 1 - CRÍTICO
- [ ] **Backend API real** - Necesario para persistencia de datos
- [ ] **Autenticación real** - Login con passwords encriptadas
- [ ] **Base de datos** - PostgreSQL o MySQL

### PRIORIDAD 2 - ALTA
- [ ] **Export documentos** - Word/PDF
- [ ] **Notificaciones email** - Alertas por vencimiento
- [ ] **Evidencias** - Subir archivos (fotos, docs)

### PRIORIDAD 3 - MEDIA
- [ ] **Historial de cambios** - Auditoría ISO 9001
- [ ] **Dashboard personalizado** - Por usuario/área/dirección
- [ ] **Chatbot** - WhatsApp/Telegram

---

## 9. Para Continuar el Desarrollo

### Setup Local
```bash
cd SGC page/frontend
npm install
npm run dev  # Desarrollo localhost:5173
npm run build # Producción
```

### Build y Deploy
```bash
git add -A
git commit -m "descripción"
git push origin main
# Render automáticamente hace build y deploy
```

### Variables de Entorno Needed
```
VITE_GROQ_API_KEY=gsk_xxxx...  # API key de Groq
```

---

## 10. Contacto y Referencias

- **Dueño del proyecto:** Lic. Héctor Manuel Páez León (hpaez@oomapasc.gob.mx)
- **Desarrollador actual:** opencode AI
- **Repositorio:** https://github.com/HPaez88/sgc-portal
- **Producción:** https://sgc-portal-933s.onrender.com

---

*Documento actualizado: 24 abril 2026*
*Versión: 4.0.0*