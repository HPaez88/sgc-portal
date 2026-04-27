# SGC Portal - OOMAPASC de Cajeme
## Documentación Técnica Completa

---

## 1. RESUMEN DEL PROYECTO

**Nombre:** Portal SGC (Sistema de Gestión de Calidad)  
**Organización:** OOMAPASC de Cajeme (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme)  
**Versión:** 4.4.0  
**Tecnología:** React + Vite + TailwindCSS + Supabase
**URL Producción:** https://sgc-portal-933s.onrender.com
**Repositorio:** https://github.com/HPaez88/sgc-portal

---

## 2. ARQUITECTURA DEL PROYECTO

```
SGC page/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Componente principal (~3400 líneas)
│   │   ├── catalogs.js           # Catálogos (áreas, procesos, indicadores)
│   │   ├── hooks.js             # useLocalStorage, useFormValidation
│   │   ├── supabase.js         # Cliente Supabase
│   │   ├── useSupabaseSync.js  # Hook para sync automático
│   │   ├── exporters.js         # Exportar AC/PM
│   │   ├── agents.js           # IA para AC, PM, Riesgos
│   │   ├── config.js           # Configuración API
│   │   ├── index.css          # Estilos globales
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── dist/                  # Build producción
├── formatos/
│   ├── supabase-tables.sql    # Schema DB
│   └── catalogos-sgc.json     # Catálogos backup
└── DOCUMENTACION.md
```

---

## 3. ESTADO ACTUAL (26 abril 2026)

### ✅ MÓDULOS FUNCIONALES
- Dashboard
- Acciones Correctivas (AC) - con IA
- Planes de Mejora (PM) - con IA
- Indicadores (86 indicadores)
- Matriz de Riesgos - con IA
- Configuración (Usuarios)
- Documentos
- Auditorías + Informes
- Aprobaciones

### ✅ DISEÑO VISUAL
- Tarjetas con estados visuales (verde/amarillo/rojo)
- Badges de estado (BORRADOR, EN_REVISION, APROBADO, etc.)
- Efectos hover en tablas y tarjetas
- Scrollbar personalizada
- Gradientes en botones y stat cards
- Indicador "Supabase" en header
- Diseño responsive

### ✅ INTEGRACIONES
- Supabase conectado (URL: https://yrjlmqxpakjiwrfwhgaj.supabase.co)
- **Sync automático** al cargar: usuarios, AC, PM, Riesgos, Documentos, Auditorías
- **Guardado automático**: cambios se guardan en Supabase
- localStorage como fallback
- IA Groq para generar AC, PM y Riesgos

---

## 4. ESTRUCTURA DE DATOS

### 4.1 Tablas Supabase
```sql
usuarios
acciones_correctivas
planes_mejora
indicadores_data
riesgos
documentos
auditorias
evidencias
informes_auditoria     -- NEW: Lista de informes
```

### 4.2 ÁREAS (33 áreas)
```
Agencia Esperanza
Agencia Marte R. Gómez
Agencia Providencia
Agencia Pueblo Yaqui
Alcantarillado y Saneamiento
Atención Ciudadana
Comunicación e Imagen Institucional
Contabilidad
Contratos y Servicios
Control de Calidad
Control y Servicios
Cultura del agua
Informática
Jurídico
Licitaciones
Línea OOMAPASC
Mantenimiento de Redes
Mantenimiento y Servicios Generales
Órgano de Control Interno
Padrón de Usuarios
Plantas Potabilizadoras
Programas Sociales
Proyectos e Infraestructura
Recursos Humanos
Recursos Materiales
Sectorización hidrométrica e innovación
Seguridad Industrial
Sistema de Gestión de Calidad
Suburbano Técnico
Supervisión y control de obras
Trabajo Social
Trámites Técnicos
Verificación Y Lectura
```

### 4.3 DIRECCIONES (7 direcciones)
```
Dir. General
Dir. Técnica
Dir. Jurídica
Dir. Órgano de Control Interno
Dir. Comercial
Dir. Administrativa
Dir. Programas Sociales y Cultura del Agua
```

### 4.4 PROCESOS (8 procesos ISO 9001)
```
Comercialización
Comunicación
Gestión de Recursos
Mantenimiento y Calibración
Medición, Análisis y Mejora
Producción
Proyectos e Infraestructura
Responsabilidad de la Dirección
```

### 4.5 INDICADORES (86 indicadores)
Los indicadores están definidos en catalogs.js con:
- id, nombre, área, proceso, dirección
- meta, unidad, periodicidad, es_menor

### 4.6 ROLES
```
Super Admin (indestructible - Lic. Héctor Páez)
Admin
Auditor
Encargado
Usuario
```

### 4.7 ORIGENES AC
```
Auditoría
Indicador
Queja
Otra
```

---

## 5. PENDIENTES Y MEJORAS

### 🔴 PRIORIDAD ALTA
- [ ] Export Word/PDF real (docx, pdf)
- [ ] Subir PDFs de informes a Supabase Storage
- [ ] Configurar URLs de informes en DB

### 🟡 PRIORIDAD MEDIA  
- [ ] Notificaciones email
- [ ] Evidencias en cloud storage (Supabase Storage)
- [ ] Gráficos/Charts para indicadores
- [ ] Login real con Supabase Auth
- [ ] Dashboard con gráficos estadísticos

### 🟢 COMPLETADOS
- [x] Diseño visual de tarjetas indicadores
- [x] Badges de estado
- [x] Efectos hover
- [x] Scrollbar personalizada
- [x] Sync Supabase (carga y guarda datos automáticamente)
- [x] Módulo Auditorías con lista de informes
- [x] Modal visor de informes
- [x] IA para generar AC, PM y Riesgos

---

## 6. CÓMO AGREGAR INFORMES DE AUDITORÍA

### Opción A: Supabase Storage (Recomendado)

1. **Crear bucket:**
   - Ir a https://supabase.com/dashboard/project/yrjlmqxpakjiwrfwhgaj/storage
   - New bucket → nombre: `informes-auditoria`
   - Marcar **Public bucket**

2. **Subir archivos:**
   - Crear carpetas: `2026/`, `2025/`, `2024/`, `2023/`
   - Subir PDFs organizados

3. **Agregar URLs a la base de datos:**
```sql
INSERT INTO informes_auditoria (anio, numero, nombre, tipo, url) VALUES
(2026, 1, '01 Informe Responsabilidad Dirección', 'PDF', 'https://yrjlmqxpakjiwrfwhgaj.supabase.co/storage/v1/object/public/informes-auditoria/2026/01.pdf'),
(2026, 2, '02 Informe MAM', 'PDF', 'https://...'),
-- etc
```

### Opción B: SharePoint
- Obtener links compartidos de cada PDF
- Insertarlos en la tabla `informes_auditoria`

---

## 7. MÓDULOS IMPLEMENTADOS

### 7.1 Acciones Correctivas
- Formulario 3 pasos (Describir → Analizar → Plan)
- Generación con IA (Groq API)
- Evidencias adjuntas
- Workflow de aprobación
- Sync automático a Supabase

### 7.2 Planes de Mejora
- Formulario 3 pasos
- Situación actual/deseada
- Beneficios y presupuesto
- Actividades
- Sync automático a Supabase

### 7.3 Indicadores
- 86 indicadores definidos
- Captura mensual
- Vista trimestral
- Semáforo (verde/amarillo/rojo)
- Estados visuales mejorado

### 7.4 Matriz de Riesgos
- Probabilidad × Impacto
- Plan de acción
- Evaluación
- Generación con IA

### 7.5 Auditorías
- Resumen por año (2023-2026)
- Lista de auditorías recientes
- Sección de Informes con modal visor
- Sync automático a Supabase

---

## 8. VARIABLES DE ENTORNO

```
VITE_SUPABASE_URL=https://yrjlmqxpakjiwrfwhgaj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROQ_API_KEY=... (para IA)
```

---

## 9. COMANDOS ÚTILES

```bash
# Desarrollo
cd frontend
npm install
npm run dev

# Producción
npm run build

# Deploy (auto en Render)
git add -A
git commit -m "descripcion"
git push origin main
```

---

## 10. CONTACTOS

- **Proyecto:** Lic. Héctor Manuel Páez León (hpaez@oomapasc.gob.mx)
- **Desarrollo:** opencode AI
- **Producción:** https://sgc-portal-933s.onrender.com
- **Supabase:** https://yrjlmqxpakjiwrfwhgaj.supabase.co

---

*Documento actualizado: 26 abril 2026*
*Versión: 4.4.0*
