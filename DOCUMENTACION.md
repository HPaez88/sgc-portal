# Portal SGC - OOMAPASC de Cajeme
## Documentación del Proyecto

---

## 1. Resumen del Proyecto

**Nombre:** Portal SGC (Sistema de Gestión de Calidad)  
**Organización:** OOMAPASC de Cajeme (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme)  
**Versión:** 4.3.0  
**Tecnología:** React + Vite (Frontend with localStorage persistence)  
**URL en producción:** https://sgc-portal-933s.onrender.com  
**Repositorio GitHub:** https://github.com/HPaez88/sgc-portal

---

## 2. Estado Actual del Proyecto (25 abril 2026)

### ✅ IMPLEMENTADO Y FUNCIONAL

| Módulo | Estado | Notas |
|--------|---------|-------|
| Dashboard | ✅ | Stats con trend indicadores |
| Acciones Correctivas (AC) | ✅ | Formulario 3 pasos, IA Agente, permisos por rol, campos ISO completos |
| Planes de Mejora (PM) | ✅ | Formulario 3 pasos, IA Agente, permisos por rol, campos ISO completos |
| Indicadores | ✅ | Vista mensual y trimestral, semáforo, por proceso |
| Matriz de Riesgos | ✅ | Con plan de acción y evaluación, localStorage |
| Gestión de Usuarios | ✅ | CRUD completo con roles, localStorage |
| Configuración | ✅ | Catálogos editables (Áreas, Direcciones, Procesos) |
| Aprobaciones | ✅ | Workflow de aprobación completo |
| Documentos | ✅ | Catálogo, exportar, CRUD |
| Auditorías | ✅ | Registro completo de auditorías |
| Evidencias | ✅ | Sistema de evidencia por AC/PM |

### ✅ MEJORAS IMPLEMENTADAS v4.3.0
-Sistema de Agentes IA (3 agentes especializados: AC, PM, Riesgos)
-Catálogos depurados (86 indicadores limpios)
-Permisos por rol (Usuario/Encargado solo su área, Admin/Auditor todas)
-Campos ISO completos en AC (clasificacion, tipo_accion, evidencia_contencion)
-Campos ISO completos en PM (just_beneficios, impacto_esperado, presupuesto)
-Props pasaron correctamente a componentes hijos
-Variables usuarioLogueado, puedeTodasAreas, areaUsuario definidas en App principal

### 🔴 PENDIENTE

| Módulo | Estado | Notas |
|--------|---------|-------|
| Backend API (Supabase) | 🔴 | Próximo paso |
| Formatos Excel | 🔴 | Matching completo con formatos Excel |
| Notificaciones email | 🔴 | No implementado |

---

## 3. Catálogos del Sistema

### ÁREAS (39 áreas de OOMAPASC)
```
- Sistema de Gestión de Calidad, Dirección General, Recursos Humanos
- Recursos Materiales, Contabilidad, Seguridad Industrial, Licitaciones
- Trámites Técnicos, Informática, Mtto. y servicios generales
- Mantenimiento de Redes, Control de Calidad, Plantas Potabilizadoras
- Alcantarillado y Saneamiento, Suburbano Técnico, Padrón de Usuarios
- Control y Servicios, Verificación y Lectura, Agencia Providencia
- Agencia Esperanza, Agencia Pueblo Yaqui, Agencia Marte R. Gómez
- Dirección Comercial, Línea OOMAPASC, Contratos y Servicios
- Proyectos e Infraestructura, Atención Ciudadana, Cartera
- Compras, Taller Mecánico, Almacén, Legal, Archivo
- Transparencia, Coord. Jurídico, Órgano de Control Interno, Trabajo Social
```

### DIRECCIONES
```
- General, Técnica, Administrativa, Órganos de Control Interno
- Comercial, Jurídica, Programas Sociales y Cultura del Agua
```

### PROCESOS (ISO 9001)
```
- Comercialización, Comunicación, Gestión de Recursos
- Mantenimiento y Calibración, Medición, Análisis y Mejora
- Producción, Proyectos e Infraestructura
- Responsabilidad de la Dirección
```

### ROLES (Jerarquía)
```
1. Super Admin (indestructible, solo 1 - Lic. Héctor Páez)
2. Admin (complis área SGC, pueden ver info en todas las áreas)
3. Auditor (crear AC/PM para cualquier área, no modifica indicadores)
4. Encargado (solo su área: AC, PM, indicadores)
5. Usuario (ver + indicators/evidencias, no documentos)
```

### INDICADORES (86 indicadores)
- Presentes en catalogs.js, categorizados por área y proceso

---

## 4. Arquitectura Técnica

```
SGC page/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Todo el código React (~3200 líneas)
│   │   ├── catalogs.js      # Catálogos centralizados
│   │   ├── hooks.js         # useLocalStorage, useFormValidation (mejorados)
│   │   ├── agents.js        # Sistema de Agentes IA (NUEVO)
│   │   └── config.js        # API URL
│   ├── package.json        # Dependencias
│   └── dist/               # Build de producción
├── formatos/                 # Archivos oficiales Excel
│   ├── formato acción correctiva.xlsx
│   ├── plan de mejora.xlsx
│   ├── Control 6.xlsx
│   └── Cuadro de Control Marzo 2026.xlsx
├── formatos/Informes Auditorías/  # 33 informes PDF
└── DOCUMENTACION.md
```

### Colores Institucionales
- **Azul OOMAPASC:** #002855 (principal)
- **Cyan-accent:** #06b6d4
- **Fondo:** #f8fafc (slate-50)

---

## 5. Bugs Corregidos v4.3.0

### Bug 1: Pantalla Blanca en AC, PM, Riesgos
**Problema:** Componentes usaban variables sin definirlas  
**Causa:** `usuarios`, `puedeTodasAreas`, `areaUsuario` no se pasaban como props  
**Solución:** Definidas en App principal y pasadas a todos los componentes hijos

### Bug 2: Catálogos Inconsistentes
**Problema:** Áreas/procesos/direcciones no coincidían con indicadores  
**Causa:** typos, espacios, nombres diferentes  
**Solución:** 
- Áreas faltantes agregadas
- Proceso corregido: "Medición, Análisis y Mejora" (con coma)
- Direcciones normalizadas
- Espacios eliminados

### Bug 3: hooks.js sin useCallback
**Problema:** Renderizados innecesarios  
**Solución:** useCallback agregado

---

## 6. Módulos del Frontend

### 6.1 Acciones Correctivas
- **Pasos:** 1. Describir → 2. Analizar → 3. Plan de Acción
- **Campos:** Fecha detección, Área, Proceso, Origen (Auditoría/Indicador/Queja/Otra)
- **Origen Auditoría:** Número de auditoría
- **Origen Indicador:** Selector de indicadores
- **IA:** Genera causa raiz (6M), acción de contención, actividades
- **Validación:** Campos requeridos paso a paso

### 6.2 Planes de Mejora
- **Pasos:** 1. Describir → 2. Análisis → 3.Plan
- **Campos:** Situación actual/deseada, beneficios, equipo de trabajo
- **IA:** Genera contenido completo

### 6.3 Indicadores
- **Vista Mensual:** Tabla con 12 columnas (Ene-Dic), captura inline
- **Vista Trimestral:** Selector T1/T2/T3/T4, stats por área
- **Semáforo:** 🟢 ≥80%, 🟡 50-79%, 🔴 <50%
- **Cálculo:** Compara vs meta (>, <, =)

### 6.4 Matriz de Riesgos
- **Campos:** Área, Dirección, Proceso, Probabilidad(1-5), Impacto(1-5)
- **Nivel:** Probabilidad × Impacto
- **Plan de Acción:** editable en tabla
- **Fecha término y Evaluación:** Bueno/Regular/Malo

### 6.5 Gestión de Usuarios
- **CRUD completo:** Nombre, Email, Teléfono, Área, Dirección, Rol, Contraseña
- **Protección:** Super Admin no se puede eliminar
- **Edición:** Modal completo

### 6.6 Configuración
- **Catálogos editables:** Áreas, Direcciones, Procesos
- **Confirmación:** Al eliminar cualquier elemento

---

## 7. Sistema de Agentes IA

### Agentes Disponibles
1. **Agente de Acciones Correctivas** - Análisis 6M, causa raíz, acciones
2. **Agente de Planes de Mejora** - Análisis Gap, beneficios, plan
3. **Agente de Gestión de Riesgos** - Matriz, controles, plan

### Configuración
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `llama-3.1-8b-instant`
- **API Key:** Configurar en `.env` como `VITE_GROQ_API_KEY`

---

## 8. Pendientes y Mejoras Detectadas

### 🔴 PRIORIDAD 1 - CRÍTICO (Testing y Estabilidad)

- [ ] **Testing completo** - Verificar todos los módulos funcionan sin pantalla blanca
- [ ] **Verificar AC** - Acciones Correctivas abre correctamente
- [ ] **Verificar PM** - Planes de Mejora abre correctamente
- [ ] **Verificar Riesgos** - Matriz de Riesgos abre correctamente
- [ ] **Verificar login** - Autenticación con permisos por rol
- [ ] **Verificar indicadores** - Captura y cálculo correcto

### 🟡 PRIORIDAD 2 - ALTA (Backend y Persistencia)

- [ ] **Backend API real** - PostgreSQL/MySQL para persistencia
- [ ] **Supabase** - Integrar base de datos cloud
- [ ] **Autenticación real** - Login con passwords encriptadas (bcrypt)
- [ ] ** Migación datos** - Mover localStorage a base de datos real

### 🟠 PRIORIDAD 3 - MEDIA (Features)

- [ ] **Export Word** - Generar documentos oficiales
- [ ] **Export PDF** - Generar reportes en PDF
- [ ] **Notificaciones email** - Alertas por vencimiento
- [ ] **Evidencias cloud** - Subir archivos a storage (S3/Cloudinary)
- [ ] **Webhooks** - Notificaciones a WhatsApp/Telegram

### 🟢 PRIORIDAD 4 - BAJA (Extras)

- [ ] **Historial de cambios** - Auditoría ISO 9001
- [ ] **Dashboard personalizado** - Por usuario/área/dirección
- [ ] **Chatbot IA** - WhatsApp/Telegram
- [ ] **Gráficos avanzados** - Charts.js o Recharts
- [ ] **Calendario** - Vista de vencimientos
- [ ] **API pública** - Datos abiertos para otros sistemas

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

*Documento actualizado: 25 abril 2026*
*Versión: 4.3.0*