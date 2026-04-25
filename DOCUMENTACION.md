# SGC Portal - OOMAPASC de Cajeme
## Documentación Técnica Completa

---

## 1. RESUMEN DEL PROYECTO

**Nombre:** Portal SGC (Sistema de Gestión de Calidad)  
**Organización:** OOMAPASC de Cajeme (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme)  
**Versión:** 4.3.6  
**Tecnología:** React + Vite + TailwindCSS + Supabase
**URL Producción:** https://sgc-portal-933s.onrender.com
**Repositorio:** https://github.com/HPaez88/sgc-portal

---

## 2. ARQUITECTURA DEL PROYECTO

```
SGC page/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente principal (~3200 líneas)
│   │   ├── catalogs.js      # Catálogos (áreas, procesos, indicadores)
│   │   ├── hooks.js         # useLocalStorage, useFormValidation
│   │   ├── supabase.js      # Cliente Supabase
│   │   ├── exporters.js     # Exportar AC/PM
│   │   ├── config.js        # Configuración API
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── dist/               # Build producción
├── formatos/              # Excel/PDF formatos
│   └── supabase-tables.sql # Schema DB
└── DOCUMENTACION.md
```

---

## 3. ESTADO ACTUAL (24 abril 2026)

### ✅ MÓDULOS FUNCIONALES
- Dashboard
- Acciones Correctivas (AC)
- Planes de Mejora (PM)
- Indicadores (86 indicadores)
- Matriz de Riesgos
- Configuración (Usuarios)
- Documentos
- Auditorías
- Aprobaciones

### ✅ DISEÑO VISUAL ACTUAL
- Tarjetas de indicadores con estados visuales (verde/amarillo/rojo)
- Badges de estado (BORRADOR, EN_REVISION, APROBADO, etc.)
- Efectos hover en tablas y tarjetas
- Scrollbar personalizada
- Gradientes en botones y stat cards

### ✅ INTEGRACIONES
- Supabase conectado (URL: https://yrjlmqxpakjiwrfwhgaj.supabase.co)
- Tablas creadas en Supabase (8 tablas)
- localStorage como fallback

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
```

### 4.2 ÁREAS (39 áreas)
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

### 4.3 Roles
- Super Admin (indestructible)
- Admin
- Auditor
- Encargado
- Usuario

---

## 5. COMPONENTES PRINCIPALES

### 5.1 App.jsx
Contiene TODOS los componentes en un solo archivo:
- App() - Componente raíz
- AccionCorrectivaView()
- PlanMejoraView()
- IndicadoresView()
- RiesgosView()
- SettingsView()
- DocumentosView()
- AuditoriasView()
- GestorAprobacionesView()
- Componentes auxiliares (StatCard, SectionTitle, etc)

### 5.2 Props que deben PASARSE a cada componente:
```javascript
// App.jsx - estados principales
const [accionesCorrectivas, setAccionesCorrectivas]
const [planesMejora, setPlanesMejora]
const [indicadoresData, setIndicadoresData]
const [usuarios, setUsuarios]
const [riesgos, setRiesgos]
const [documentos, setDocumentos]
const [auditorias, setAuditorias]
const [evidencias, setEvidencias]
const usuarioLogueado = usuarios[0]
const puedeTodasAreas = es Admin/Auditor/Super Admin
const areaUsuario = usuarioLogueado.area
```

### 5.3 Ejemplo de renderizado correcto:
```jsx
{activeTab === 'ac' && <AccionCorrectivaView 
  accionesCorrectivas={accionesCorrectivas}
  setAccionesCorrectivas={setAccionesCorrectivas}
  evidencias={evidencias}
  setEvidencias={setEvidencias}
  usuarios={usuarios}
  puedeTodasAreas={puedeTodasAreas}
  areaUsuario={areaUsuario}
/>}
```

---

## 6. PROBLEMAS COMUNES Y SOLUCIONES

### 6.1 Pantalla Blanca
**Causa:** Variables no pasadas como props
**Solución:** Siempre pasar props desde App() a componentes hijos

### 6.2 setDocumentos undefined
**Causa:** Se usaba setDocumentos que no existe
**Solución:** Componente SettingsView NO debe recibir documentos como prop

### 6.3 setEditandoUsuario mal usado
**Causa:** setEditandoUsuario({...u, show: true})
**Solución:** setEditandoUsuario({ show: true, user: u })

### 6.4 SelectField indicador_ref
**Causa:** name="indicador" en lugar de name="indicador_ref"
**Solución:** Verificar que el name coincida con formData

---

## 7. FUNCIONALIDADES IMPLEMENTADAS

### 7.1 Acciones Correctivas
- Formulario 3 pasos (Describir → Analizar → Plan)
- Generación con IA (Groq API)
- Evidencias adjuntas
- Workflow de aprobación

### 7.2 Planes de Mejora
- Formulario 3 pasos
- Situación actual/deseada
- Beneficios y presupuesto
- Actividades

### 7.3 Indicadores
- Captura mensual
- Vista trimestral
- Semáforo (verde/amarillo/rojo)

### 7.4 Matriz de Riesgos
- Probabilidad × Impacto
- Plan de acción
- Evaluación

---

## 8. VARIABLES DE ENTORNO

```
VITE_SUPABASE_URL=https://yrjlmqxpakjiwrfwhgaj.supabase.co
VITE_GROQ_API_KEY=... (para IA)
```

---

## 9. PENDIENTES Y MEJORAS

### 🔴 PRIORIDAD ALTA
- [ ] Sincronización automática con Supabase (guardar/cargar datos)
- [ ] Login real con Supabase Auth
- [ ] Export Word/PDF real (docx, pdf)

### 🟡 PRIORIDAD MEDIA  
- [ ] Notificaciones email
- [ ] Evidencias en cloud storage (Supabase Storage)
- [ ] Gráficos/Charts para indicadores

### 🟢 COMPLETADOS
- [x] Diseño visual de tarjetas indicadores
- [x] Badges de estado
- [x] Efectos hover
- [x] Scrollbar personalizada

---

## 10. COMANDOS ÚTILES

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

## 11. CONTACTOS

- **Proyecto:** Lic. Héctor Manuel Páez León (hpaez@oomapasc.gob.mx)
- **Desarrollo:** opencode AI
- **Producción:** https://sgc-portal-933s.onrender.com
- **Supabase:** https://yrjlmqxpakjiwrfwhgaj.supabase.co

---

*Documento actualizado: 25 abril 2026*
*Versión: 4.3.6*