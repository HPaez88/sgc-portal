# Base de Conocimiento Oficial: Documentación Interna, Procedimientos y Registros del SGC (OOMAPASC)

**Organismo:** Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme (OOMAPASC)  
**Sistema:** Sistema de Gestión de Calidad (SGC)  
**Norma Base:** ISO 9001:2015 / ISO 9001:2026 (Cláusula 7.5 Información Documentada, Cláusula 8 Control Operacional, Cláusula 9 Evaluación del Desempeño y Cláusula 10 Mejora)  
**Estado:** VIGENTE / AUDITABLE (100% Grounded)

---

## 1. Estructura Jerárquica y Pirámide Documental del SGC

El SGC de OOMAPASC de Cajeme organiza su información documentada en 4 niveles controlados conforme al requisito 7.5.3 de ISO 9001:

```
                      ┌───────────────────────────────┐
                      │    NIVEL 1: MANUAL SGC        │
                      │    MC-01 (Rev. 04)            │
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │    NIVEL 2: PROCEDIMIENTOS    │
                      │    PR-CAL-01, PR-MEJ-01,      │
                      │    PR-POT-01, PR-AUD-01       │
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │    NIVEL 3: MAPA DE PROCESOS  │
                      │    PR-DIR-01 al PR-MED-08     │
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │    NIVEL 4: REGISTROS SGC     │
                      │    OOMRSC-20, OOMRSC-21,      │
                      │    REG-CLORO-01, INFORMES     │
                      └───────────────────────────────┘
```

---

## 2. Catálogo Oficial de Procedimientos y Formatos/Registros Institucionales

### 2.1. `MC-01` — Manual del Sistema de Gestión de Calidad
- **Clave:** `MC-01`
- **Tipo de Documento:** Manual Maestro (Nivel 1)
- **Área Responsable:** Sistema de Gestión de Calidad
- **Versión/Revisión:** Rev. 04 (Vigencia 2026)
- **Autor / Administrador:** Lic. Héctor Manuel Páez León
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 / ISO 9001:2026 (Cláusulas 4, 5, 6, 7, 8, 9 y 10)
- **Objetivo y Alcance:** Documento maestro que define la política de calidad institucional, alcance geográfico y operativo del SGC en el municipio de Cajeme (Ciudad Obregón, Esperanza, Providencia, Pueblo Yaqui y Marte R. Gómez), mapa general de procesos y gobernanza de auditorías.
- **Referencias que Usa (Citas Fuertes):** `OOMRSC-20`, `OOMRSC-21`, `PR-CAL-01`, `PR-AUD-01`.
- **Interacción Operativa:** Es la cúspide documental; articula el ciclo PHVA institucional y establece las directrices que rigen a los procedimientos operativos.

---

### 2.2. `PR-CAL-01` — Procedimiento de Acciones Correctivas y No Conformidades
- **Clave:** `PR-CAL-01`
- **Tipo de Documento:** Procedimiento Obligatorio de Calidad (Nivel 2)
- **Área Responsable:** Sistema de Gestión de Calidad
- **Versión/Revisión:** Rev. 06 (Vigencia 2026)
- **Autor / Administrador:** Lic. Héctor Manuel Páez León
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 / ISO 9001:2026 § 10.2 (No conformidad y acción correctiva)
- **Objetivo:** Establecer la metodología formal y obligatoria para identificar, registrar, investigar la causa raíz, implementar acciones correctivas y evaluar la eficacia para evitar la recurrencia de no conformidades detectadas en auditorías, indicadores en rojo, quejas de usuarios o desviaciones de proceso.
- **Metodología de Causa Raíz Exigida:**
  1. *5 Porqués (5 Why's):* Indagación iterativa hasta llegar al fallo de origen o factor sistémico.
  2. *Diagrama de Ishikawa (Causa-Efecto / 6M):* Mano de obra, Maquinaria/Equipos, Métodos, Materiales/Químicos, Medio ambiente/Clima, Medición.
  3. *Metodología 8D:* Para fallas operativas graves en plantas o redes.
- **Formato/Registro que Genera y Utiliza:** `OOMRSC-20` (Formato institucional de Acción Correctiva).
- **Referencias que Usa:** `OOMRSC-20`.

---

### 2.3. `OOMRSC-20` — Formato Institucional de Control de Acciones Correctivas
- **Clave:** `OOMRSC-20`
- **Tipo de Documento:** Registro Oficial de Calidad (Nivel 4)
- **Área Responsable:** Sistema de Gestión de Calidad
- **Versión/Revisión:** Rev. 18 (Vigencia 2026)
- **Autor / Administrador:** Lic. Héctor Manuel Páez León
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 § 10.2 / ISO 9001:2026 § 10.2
- **Estructura del Registro:**
  - **Encabezado:** Folio único institucional (`AC-YYYY-XXX`), fecha de emisión, proceso afectado, área responsable.
  - **Origen de la No Conformidad:** Auditoría interna/externa, Indicador SGC (desviación), Queja ciudadana/Línea OOMAPASC, Falla de proceso, Producto no conforme (cloración/turbidez), Otro.
  - **Descripción del Hallazgo / No Conformidad:** Declaración fáctica y objetiva del incumplimiento, citando la cláusula o norma afectada.
  - **Evidencia Objetiva Inicial:** Archivos PDF, fotos de campo, bitácoras o reportes de laboratorio.
  - **Corrección Inmediata / Contención:** Acciones inmediatas ejecutadas para mitigar el impacto inmediato.
  - **Investigación de Causa Raíz:** Aplicación documentada de los 5 Porqués y/o Ishikawa.
  - **Plan de Acción Correctiva:** Tabla de actividades, responsables designados, fechas compromiso y recursos asignados.
  - **Seguimiento y Cierre:** Dictamen de cierre por Auditor Interno calificado, verificación de eficacia y evidencia de no recurrencia (a los 30/60/90 días posteriores).
- **Flujo de Estados:**
  `BORRADOR` → `RECHAZADO` (con solicitud de replanteo) → `APROBADO` → `EN_SEGUIMIENTO` → `CERRADO`.

---

### 2.4. `PR-MEJ-01` — Procedimiento de Mejora Continua
- **Clave:** `PR-MEJ-01`
- **Tipo de Documento:** Procedimiento de Calidad (Nivel 2)
- **Área Responsable:** Sistema de Gestión de Calidad / Innovación
- **Versión/Revisión:** Rev. 03 (Vigencia 2026)
- **Autor / Administrador:** Ing. Calidad SGC
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 § 10.3 / ISO 9001:2026 § 10.3 (Mejora continua)
- **Objetivo:** Definir los lineamientos para la formulación, evaluación técnico-financiera, aprobación, asignación presupuestal y seguimiento de proyectos de mejora en los procesos operativos, comerciales y administrativos.
- **Formato/Registro que Genera y Utiliza:** `OOMRSC-21` (Plan de Mejora Continua).
- **Referencias que Usa:** `OOMRSC-21`.

---

### 2.5. `OOMRSC-21` — Formato de Plan de Mejora Continua
- **Clave:** `OOMRSC-21`
- **Tipo de Documento:** Registro Oficial de Calidad (Nivel 4)
- **Área Responsable:** Sistema de Gestión de Calidad
- **Versión/Revisión:** Rev. 02 (Vigencia 2026)
- **Autor / Administrador:** Lic. Héctor Manuel Páez León
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 § 10.3 / ISO 9001:2026 § 10.3
- **Estructura del Registro:**
  - **Folio y Clasificación:** Folio institucional (`PM-YYYY-XXX`), Área líder, Categoría de Mejora.
  - **Categorías de Mejora Institucionales:**
    1. Fortalecimiento de la Gestión Interna y Mejora Continua.
    2. Desarrollo y Profesionalización del Recurso Humano.
    3. Innovación Tecnológica y Modernización Institucional (ej. Telemetría y SCADA).
    4. Mejora de los Servicios y Atención al Usuario.
    5. Seguridad Operativa y Sostenibilidad Ambiental.
  - **Presupuesto:** Presupuesto Estimado vs Presupuesto Ejercido Real.
  - **Cronograma y Metas:** Actividades por cuatrimestre (1er Cuatri Ene-Abr, 2do Cuatri May-Ago, 3er Cuatri Sep-Dic).
  - **Indicadores Asociados:** Medición del antes y después de la implementación.

---

### 2.6. `PR-POT-01` — Procedimiento Operativo de Potabilización y Cloración
- **Clave:** `PR-POT-01`
- **Tipo de Documento:** Procedimiento Operativo (Nivel 2)
- **Área Responsable:** Operación / Plantas Potabilizadoras
- **Versión/Revisión:** Rev. 05 (Vigencia 2026)
- **Autor / Administrador:** Ing. Pedro Martínez
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 § 8.5.1 (Control de la producción), ISO 14001:2015 § 6.1.2 y NOM-127-SSA1-2021
- **Objetivo:** Instruir las actividades de coagulación, floculación, sedimentación, filtración y desinfección mediante cloro gas e hipoclorito de sodio para garantizar que el agua suministrada cumpla con límites de cloro residual libre (0.2 a 1.5 mg/L) y turbidez (< 4 NTU).
- **Referencias que Usa:** `REG-CLORO-01`, `OOMRSC-20`.
- **Interacción:** Las lecturas fuera de norma registradas en `REG-CLORO-01` disparan inmediatamente una Acción Correctiva en `OOMRSC-20`.

---

### 2.7. `REG-CLORO-01` — Bitácora Diaria de Cloro Residual en Red
- **Clave:** `REG-CLORO-01`
- **Tipo de Documento:** Registro Operativo Diario (Nivel 4)
- **Área Responsable:** Operación / Control de Calidad
- **Versión/Revisión:** Rev. 02 (Vigencia 2026)
- **Autor / Administrador:** Ing. Pedro Martínez
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 9001:2015 § 8.5.1, § 8.6 y NOM-127-SSA1-2021
- **Objetivo:** Registrar diariamente en cada turno las lecturas colorimétricas DPD de cloro libre en tomas domiciliarias y puntos testigo de todos los sectores hidráulicos de Ciudad Obregón y comisarías.

---

### 2.8. `PR-AUD-01` — Procedimiento de Auditorías Internas de Calidad
- **Clave:** `PR-AUD-01`
- **Tipo de Documento:** Procedimiento de Evaluación (Nivel 2)
- **Área Responsable:** Sistema de Gestión de Calidad / Órgano de Control Interno
- **Versión/Revisión:** Rev. 04 (Vigencia 2026)
- **Autor / Administrador:** Lic. Roberto Torres
- **Estado:** APROBADO
- **Norma ISO Asociada:** ISO 19011:2018 (Directrices de Auditoría) e ISO 9001 § 9.2
- **Objetivo:** Regular la planificación anual, elaboración de planes de auditoría, criterios de independencia y competencia de auditores, ejecución de auditorías internas in situ/remotas, elaboración de informes de auditoría y seguimiento de hallazgos.
- **Referencias que Usa:** `OOMRSC-20`, `MC-01`.
- **Interacción:** Todo hallazgo de No Conformidad en los Informes de Auditoría se canaliza directamente a `OOMRSC-20`.

---

## 3. Mapa de los 8 Procesos Institucionales (Nivel 3)

| Clave | Proceso | Tipo | Área Responsable | Áreas que Interactúan | Registros Vinculados |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PR-DIR-01** | Responsabilidad de la Dirección | Estratégico | Sistema de Gestión de Calidad | OCI, Comunicación, Línea OOMAPASC, Cultura del Agua | MC-01, Actas de Revisión por la Dirección |
| **PR-PROD-02** | Producción | Operativo | Plantas Potabilizadoras | Control de Calidad, Sectorización, Suburbano, Seguridad Industrial | PR-POT-01, REG-CLORO-01, OOMRSC-20 |
| **PR-MNT-03** | Mantenimiento y Calibración | Operativo | Mantenimiento de Redes | Alcantarillado, Control de Calidad, Serv. Generales, Seguridad Industrial | Órdenes de Trabajo, Bitácoras de Mantenimiento |
| **PR-COM-04** | Comercialización | Operativo | Padrón de Usuarios | Atención Ciudadana, Contratos, Verificación/Lectura, Agencias | Contratos, Facturas, Reportes de Padrón |
| **PR-REC-05** | Gestión de Recursos | Apoyo | Recursos Humanos | Recursos Materiales, Contabilidad, Licitaciones, Informática | Evaluaciones de Competencia, Registros de Compras |
| **PR-COM-06** | Comunicación | Apoyo | Comunicación e Imagen | Cultura del Agua, Programas Sociales, Trabajo Social | Campañas de Ahorro, Registros de Difusión |
| **PR-INF-07** | Proyectos e Infraestructura | Operativo | Proyectos e Infraestructura | Supervisión de Obras, Trámites Técnicos, Licitaciones | Expedientes Técnicos de Obra, Estimaciones |
| **PR-MED-08** | Medición, Análisis y Mejora | Evaluación | Control de Calidad | SGC, Órgano de Control Interno, Informática | Tablero de 86 Indicadores, OOMRSC-20, OOMRSC-21 |

---

## 4. Matriz de Trazabilidad Cruzada y Reglas de Control Documental (§ 7.5.3)

### 4.1. Red de Citas Fuertes e Interacción Documental
- `MC-01` cita y fundamenta a: `OOMRSC-20`, `OOMRSC-21`, `PR-CAL-01`, `PR-AUD-01`.
- `PR-CAL-01` cita y gobierna a: `OOMRSC-20`.
- `PR-MEJ-01` cita y gobierna a: `OOMRSC-21`.
- `PR-POT-01` cita y gobierna a: `REG-CLORO-01`, `OOMRSC-20`.
- `PR-AUD-01` cita y gobierna a: `OOMRSC-20`, `MC-01`.

### 4.2. Reglas de Validación de Trazabilidad en el Portal
1. **Regla de Bloqueo de Eliminación:** Ningún documento o registro que esté declarado como "Cita Fuerte" en `referencias_usadas` de otro documento activo puede ser eliminado del catálogo. Su eliminación rompería la trazabilidad requerida por ISO 9001:2015/2026 § 7.5.3.
2. **Detección de Referencias Rotas:** Si un procedimiento o formato hace referencia a una clave que no existe en el catálogo institucional, el portal genera una alerta de inconsistencia documental para corrección inmediata.
3. **Clave Única Normalizada:** No pueden coexistir dos documentos con la misma clave institucional normalizada (sin espacios ni guiones diferenciados).

---

## 5. Puentes Inter-Módulos del SGC Portal

El portal integra flujos automáticos de gobernanza entre módulos:

```
    ┌──────────────────────┐         ┌───────────────────────────────┐
    │  MÓDULO AUDITORÍAS   ├────────►│                               │
    └──────────────────────┘         │                               │
    ┌──────────────────────┐         │   ACCIONES CORRECTIVAS        │
    │  TABLERO INDICADORES ├────────►│   Formato OOMRSC-20 (Rev. 18) │
    │  (Semáforo Rojo)     │         │   (ISO 9001 § 10.2)           │
    └──────────────────────┘         │                               │
    ┌──────────────────────┐         │                               │
    │  CONTROL DOCUMENTAL  ├────────►│                               │
    │  (Inconsistencias)   │         └───────────────────────────────┘
    └──────────────────────┘                         ▲
                                                     │
    ┌──────────────────────┐         ┌───────────────┴───────────────┐
    │  MÓDULO DE RIESGOS   ├────────►│   PLANES DE MEJORA CONTINUA   │
    │  (Nivel Extremo/Alto)│         │   Formato OOMRSC-21 (Rev. 02) │
    └──────────────────────┘         │   (ISO 9001 § 10.3)           │
                                     └───────────────────────────────┘
```

1. **Auditorías → Acciones Correctivas:** Cuando se concluye una auditoría interna (vía `PR-AUD-01`), cada No Conformidad identificada genera de forma automática un folio `OOMRSC-20`, precargando el proceso auditado, auditor asignado, cláusula incumplida y evidencias fotográficas/documentales.
2. **Tablero de Indicadores (86 Indicadores) → Acciones Correctivas:** Si un indicador clave (ej. Cloración en Red, Eficiencia de Cobranza, Tiempo de Reparación de Fugas) registra semáforo rojo en su captura mensual, el sistema habilita la apertura automática de un `OOMRSC-20` con origen 'Indicador'.
3. **Gestión de Riesgos → Planes de Mejora / Acciones Preventivas:** Los riesgos calificados con nivel 'Extremo' o 'Alto' en la Matriz de Riesgos institucional derivan en un Plan de Mitigación estructurado mediante el formato `OOMRSC-21` o `OOMRSC-20`.
4. **Control Documental → Matriz de Trazabilidad:** Permite auditar en tiempo real qué documentos impactan a cuáles y quién es el custodio de cada registro en el organismo.

---

## 6. Estructura de Direcciones y Áreas del Organismo (OOMAPASC)

El SGC abarca 7 Direcciones y 32 Áreas operativas y de apoyo:
- **Dirección General:** SGC, Órgano de Control Interno, Comunicación e Imagen Institucional.
- **Dirección Técnica:** Plantas Potabilizadoras, Mantenimiento de Redes, Alcantarillado y Saneamiento, Control de Calidad, Proyectos e Infraestructura, Sectorización Hidrométrica e Innovación, Seguridad Industrial, Supervisión y Control de Obras, Trámites Técnicos, Suburbano Técnico.
- **Dirección Comercial:** Padrón de Usuarios, Atención Ciudadana, Contratos y Servicios, Verificación y Lectura, Control y Servicios, Línea OOMAPASC, Agencias (Esperanza, Providencia, Pueblo Yaqui, Marte R. Gómez).
- **Dirección Administrativa:** Recursos Humanos, Recursos Materiales, Contabilidad, Licitaciones, Informática, Mantenimiento y Servicios Generales.
- **Dirección Jurídica:** Jurídico.
- **Dirección Órgano de Control Interno:** OCI.
- **Dirección Programas Sociales y Cultura del Agua:** Programas Sociales, Trabajo Social, Cultura del Agua.

---

## 7. Instrucciones de Groundedness para el Asesor Normativo

Al responder consultas sobre procedimientos, registros, formatos o interacciones del portal SGC:
1. **Cita siempre la clave exacta del documento** (`MC-01`, `PR-CAL-01`, `OOMRSC-20`, `PR-MEJ-01`, `OOMRSC-21`, `PR-POT-01`, `REG-CLORO-01`, `PR-AUD-01`, etc.).
2. **Menciona la revisión oficial vigente** (ej. OOMRSC-20 Rev. 18, OOMRSC-21 Rev. 02, MC-01 Rev. 04).
3. **Indica el área responsable y el proceso del portal** al que pertenece el documento.
4. **Detalla las interacciones cruzadas** (qué otros documentos cita o qué formatos genera).
5. **Indica el requisito de la norma ISO** con el que cumple (ej. ISO 9001:2015 / ISO 9001:2026 § 10.2 para OOMRSC-20).
6. **No inventes claves ni procedimientos:** Si el usuario pregunta por un documento que no figura en el catálogo oficial o en la base indexada, aclara que dicho documento no se encuentra registrado en el SGC de OOMAPASC.
