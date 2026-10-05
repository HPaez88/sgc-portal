# SGC Portal - OOMAPASC de Cajeme
## Documentación Técnica y Operativa Completa

---

## 1. RESUMEN DEL PROYECTO

- **Nombre Oficial:** Portal SGC (Sistema de Gestión de la Calidad)
- **Organismo:** OOMAPASC de Cajeme (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme)
- **Versión:** 5.0.0 (Release con Gobernanza de IA & Supervisión Humana Activa)
- **Líder de Proyecto:** Lic. Héctor Manuel Páez León
- **Tecnología Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons + Vitest
- **Tecnología Backend:** Python 3 + FastAPI + SQLModel + RAG Multi-Normas ISO (9001:2026, 14001:2015, 45001:2018, 19011:2018)
- **Base de Datos:** SQLite (Entorno local de desarrollo) / Supabase PostgreSQL (Producción)
- **URL Producción:** https://sgc-portal-933s.onrender.com
- **Repositorio Oficial:** https://github.com/HPaez88/sgc-portal

---

## 2. GOBERNANZA DE IA Y PROTOCOLO DE SUPERVISIÓN HUMANA (POL-TI-01 & ISO/IEC 42001)

### 2.1 Principio de Supervisión Humana Obligatoria (*Human-in-the-Loop*)
Conforme a la **Política Institucional de Gobernanza de IA (POL-TI-01)** y las normas internacionales **ISO 9001:2026 (§ 10.2 / § 10.3)** e **ISO/IEC 42001 (Sistemas de Gestión de Inteligencia Artificial)**:
> **Ningún expediente generado, redactado o asistido por herramientas de Inteligencia Artificial puede enviarse o aprobarse de forma desatendida o automática.**

Todo contenido estructurado por la IA (análisis de 5 Porqués, diagramas de Ishikawa, planes de actividades correctivas o metas de mejora) funge exclusivamente como **borrador técnico de apoyo**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   PROTOCOLO DE RATIFICACIÓN Y TRAZABILIDAD HUMANA                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Generación Asistida  ──▶  2. Revisión Técnica  ──▶  3. Modal de Ratificación │
│     (IA sugiere causa,       (Titular ajusta          (Lectura obligatoria y     │
│      equipo y plan)           fechas y contexto)       Declaración Jurada)       │
│                                                                 │                │
│                                                                 ▼                │
│  6. Envío Formal al SGC  ◀──  5. Trazabilidad DB   ◀──  4. Palabra Clave Estricta│
│     (Estado EN_REVISION       (Timestamp, usuario      (Escribir textualmente    │
│      y notificación)           y log de auditoría)      la palabra: CONFIRMAR)   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Modal de Supervisión y Responsabilidad Humana (`ModalConfirmacionResponsabilidadHumana.jsx`)
Al hacer clic en **"📤 Enviar a SGC"** en los módulos de Acciones Correctivas (OOMRSC-20) o Planes de Mejora (OOMRSC-21):
1. **Ficha Resumen del Expediente:** Se presenta el folio, área, proceso, resumen del hallazgo/mejora, número de integrantes del equipo y total de actividades programadas.
2. **Distintivo de Asistencia de IA:** Si el registro utilizó IA, se destaca visualmente con el badge `✨ Análisis con IA`.
3. **Declaración Jurada de Responsabilidad Operativa:**
   > *"Yo, [Nombre del Usuario], adscrito(a) a [Área], declaro formalmente que he revisado en su totalidad la información técnica contenida en este formato, validando que las causas identificadas y el plan de actividades son viables, veraces y corresponden a la realidad operativa. Asumo el compromiso de dar seguimiento oportuno a las fechas límite, ejecutar las acciones y recopilar las evidencias documentales requeridas para las auditorías del SGC."*
4. **Casilla de Verificación:** `[X] He leído y verificado la información técnica generada y acepto la responsabilidad de seguimiento y ejecución operativa.`
5. **Palabra Clave de Ratificación:** El usuario debe teclear exactamente la palabra **`CONFIRMAR`** para desbloquear el botón de envío.

### 2.3 Trazabilidad Inmutable en Base de Datos y Bitácora
Cada expediente ratificado guarda los siguientes metadatos oficiales:
```json
{
  "estado": "EN_REVISION",
  "fecha_envio_sgc": "2026-10-05T07:22:00.000Z",
  "ratificacion_humana": true,
  "ratificado_por": "Ing. Juan Pérez (Titular de Área)",
  "ratificado_email": "jperez@oomapasc.gob.mx",
  "fecha_ratificacion_humana": "2026-10-05T07:22:00.000Z",
  "declaracion_responsabilidad": "Supervisión y ratificación humana completada conforme a ISO & POL-TI-01"
}
```
Asimismo, se inyecta un registro en la tabla `bitacora_movimientos` con el evento `ENVIO_SGC_RATIFICADO_HUMANO`, accesible desde la pestaña oficial de Trazabilidad y Bitácora de Auditoría.

---

## 3. ASESOR NORMATIVO ISO & AGENTE CONVERSACIONAL (RAG)

### 3.1 Arquitectura del Agente Asesor (`AgenteISOView.jsx` + `iso_rag_service.py`)
El módulo del Asesor ISO no es un simple chatbot: es un **Asistente Operativo Bidireccional** con groundedness estricto conectado al SGC y a las normas oficiales:
- **Base de Conocimiento Indexada:**
  - `ISO-9001-2026` — Sistemas de Gestión de la Calidad (Requisitos con enfoque 2026).
  - `ISO-14001-2015` — Gestión Ambiental.
  - `ISO-45001-2018` — Seguridad y Salud en el Trabajo.
  - `ISO-19011-2018` — Directrices para Auditorías de Sistemas de Gestión.
  - Catálogo interno de documentos, matriz de trazabilidad y manuales OOMAPASC.

### 3.2 Capacidades Operativas e Interactivas desde el Chat
1. **Diagnóstico Ejecutivo en Tiempo Real (*"¿Qué tengo pendiente?"*):**
   - El agente analiza el área del usuario y calcula en vivo: ACs pendientes, Planes de Mejora activos y próximos a vencer, estado de los indicadores del mes (cumplen / críticos) y documentos con más de 1 año sin revisar.
2. **Captura Directa de Indicadores (OOMRSC-05):**
   - El usuario puede escribir *"actualizar indicador #70 con 92%"* y el agente abre la ventana interactiva pre-cargada, evaluando el semáforo institucional en tiempo real y persistiendo el dato en el Cuadro de Control.
3. **Gestión de Actividades y Subida de Evidencias de AC (OOMRSC-20):**
   - Con comandos como *"subir evidencia a AC#1"*, el agente despliega el panel de actividades para marcar estatus (Completada/En proceso) y adjuntar archivos PDF o imágenes protegidas (`processEvidenceFile`).
4. **Ratificación Activa de Documentos > 1 Año (ISO § 7.5.3):**
   - Permite ratificar procedimientos y registros para eliminar alertas de obsolescencia en el portal.

---

## 4. CATÁLOGO OFICIAL DE MÓDULOS SGC

### 4.1 Acciones Correctivas (OOMRSC-20 Rev. 18 / ISO 9001 § 10.2)
- **Workflow:** `BORRADOR` → `EN_REVISION` (con ratificación humana `CONFIRMAR`) → `EN_SEGUIMIENTO` (con asignación de folio oficial `AC#X/AA`) → `REVISION_AUDITOR` → `CERRADO_EFECTIVO` / `CERRADO_NO_EFECTIVO`.
- **Estructura:** Detección de hallazgo, análisis de causa raíz (Ishikawa / 5 Porqués), equipo multidisciplinario (mínimo 3 integrantes con responsable principal), plan de acción con fechas compromiso y evidencias documentales obligatorias.
- **Exportación:** Generación de dictámenes oficiales en PDF y Markdown.

### 4.2 Planes de Mejora Continua (OOMRSC-21 Rev. 12 / ISO 9001 § 10.3)
- **Workflow:** `BORRADOR` → `EN_REVISION` (con ratificación humana `CONFIRMAR`) → `EN_SEGUIMIENTO` (folio `PM#X/AA`) → `SOLICITUD_CIERRE` → `REVISION_AUDITOR` → `CERRADO_EFECTIVO`.
- **Estructura:** Situación actual diagnosticada, situación deseada cuantificable, cálculo de beneficios, equipo de trabajo y cronograma de actividades con responsables y evidencias.

### 4.3 Cuadro de Control de Indicadores de Desempeño (OOMRSC-05 Rev. 37)
- **Total:** 100 Indicadores Oficiales (#0 a #99) clasificados por Área y Dirección.
- **Metodología de Evaluación:**
  - 🟢 **Aceptable:** Cumplimiento $\ge 90\%$.
  - 🟡 **Preventivo:** Cumplimiento entre $80\%$ y $89\%$.
  - 🔴 **Crítico / Incumplido:** Cumplimiento $\le 79\%$ (Dispara Reporte de Corrección RC obligatorio).
- **Control Trimestral:** Matriz MIR integrada para T1, T2, T3 y T4 con metas acumuladas y promedios anuales.

### 4.4 Revisión por la Dirección (OOMRSC-04 Rev. 09 / ISO 9001 § 9.3)
- **Cláusula 9.3.2 (Entradas de Revisión):** Sub-secciones A a F con formularios complementarios y regla de captura de los primeros 10 días del periodo.
- **Cláusula 9.3.3 (Salidas de Revisión):** Acuerdos directivos, asignación de responsables, recursos y compromisos institucionales.

### 4.5 Control Documental y Matriz de Trazabilidad (ISO 9001 § 7.5)
- Catálogo de información documentada (Manuales, Procedimientos, Instrucciones de Trabajo, Formatos y Registros).
- Detección proactiva de documentos con más de 1 año sin revisión activa.
- Bitácora de auditoría inmutable con filtros por módulo, usuario, fecha y folio.

---

## 5. REGLAS DE DESARROLLO Y CALIDAD (HPAEZ HARNESS)

1. **Verify-Loop Obligatorio:** Antes de cada release o commit:
   - `npm test -- --run` debe pasar 70/70 pruebas unitarias.
   - `npm run build` debe compilar en Vite sin errores ni advertencias de sintaxis.
2. **Cero Diálogos Nativos:** Prohibido el uso de `alert()` o `confirm()`; toda interacción usa `useToast()` y `ModalBase`/`ContenedorModal` en Portals de `document.body`.
3. **Seguridad Total:** Cero claves de API, secretos o credenciales en código fuente compilable al cliente.

---

## 6. COMANDOS OPERATIVOS

```bash
# Frontend
cd frontend
npm install
npm run dev        # Servidor de desarrollo
npm test -- --run  # Batería de pruebas unitarias (Vitest)
npm run build      # Compilación para producción

# Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

---

## 7. CONTACTOS Y CRÉDITOS

- **Titular del Proyecto:** Lic. Héctor Manuel Páez León (`hpaez@oomapasc.gob.mx`)
- **Organismo:** OOMAPASC de Cajeme
- **Desarrollo:** AI Assistant + SGC Agents Team
- **Última Actualización:** 5 de octubre de 2026
- **Versión de Documento:** 5.0.0
