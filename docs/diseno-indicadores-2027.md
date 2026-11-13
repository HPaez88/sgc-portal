# Diseño: módulo de Indicadores 2027 (proyectos → fichas → PEMS → cuadro de control)

Estado: **propuesta para aprobación de @human** (2026-11-14). No se programa hasta aprobarla.
Arranque operativo: **enero 2027**; la captura de proyectos, fichas y metas 2027 se habilita desde ya.
Ejemplo analizado: Informática 2027 (Formato de Presentación de Proyectos, 3 fichas técnicas, PEMS PEM-1/PEM-2).

## Principio
Una sola captura. El **Formato de Presentación de Proyectos** es la fuente; las fichas, el PEMS y el Cuadro de
Control toman sus datos de ahí (hoy se captura lo mismo 4 veces y ya hay inconsistencias).

## Flujo anual
1. **Proyectos (oct–dic del año anterior)** — por área; normalmente uno, pero se permiten varios
   (operación básica / crecimiento o desarrollo). Captura: el encargado del área. Revisión y aprobación: administradores
   del SGC (después se integran Dirección Administrativa / Tesorería).
   Contenido: dependencia, unidad responsable, eje rector PMD, programa PMD, programa presupuestario, folio Tesorería,
   tipo, nombre, resumen (150 palabras), justificación (350), objetivo (50), fechas, tabla **actividad → indicador →
   unidad → meta anual → metas T1–T4**, ponderado % y clave de actividad pública (para PEMS), presupuesto por capítulo
   1000–5000 con calendario trimestral, firmas (Director General y director del área).
2. **Fichas técnicas** — una por indicador, **prellenadas** desde el proyecto (alineación, nombre, unidad, meta,
   periodicidad). El área completa: definición, tipo, dimensión, método de cálculo, variables, línea base, sentido,
   supuestos, atributos (claridad, relevancia, economía, monitoreable, adecuado, aportación marginal), medios de
   verificación, método de recopilación, transversalidad, titular. Revisión SGC.
3. **PEMS** — PEM-1 (objetivos y metas) y PEM-2 (actividades públicas e indicadores) **generados** del proyecto.
4. **Catálogo del año** — al aprobarse los proyectos, sus indicadores forman el catálogo 2027 del Cuadro de Control
   (meta, unidad, periodicidad, metas trimestrales, sentido, responsable). Los cambios del catálogo quedan en bitácora.
5. **Cuadro de Control mensual (OOMRSC-05)** — **se queda como está** (pantalla aprobada). Cada mes el encargado del
   área (o de la dirección, según el indicador) captura resultado y observación; el SGC puede capturar también.
   El SGC **valida** el resultado (queda oficial). Avisos: día 1, 5, 10 (vence), 11 (incumplimiento) y 16 (oficio).
6. **Incumplimiento** — si el resultado del mes queda por debajo de lo esperado: indicador de **bajo impacto →
   Reporte de corrección**; **alto impacto → Acción correctiva** (se generan desde el cuadro, ligados al indicador).
7. **Dos líneas de seguimiento** (aclarado por @human):
   - **PEMS → por actividades**: cada trimestre se reporta el avance de cada actividad del proyecto contra su meta
     trimestral; si una actividad no se cumple, el formato exige **justificación**. Por ahora el portal propone una
     justificación automática que cumpla el formato (editable); después se define cómo se solventa.
   - **Cuadro de Control, fichas e informes → por el cumplimiento del indicador**.
8. **Evaluación trimestral e informes** — acumulado contra metas T1–T4 del proyecto; por área, dirección y organismo.

## Documentos con el formato exacto
Los archivos oficiales (Word del proyecto, Word de la ficha técnica, Excel PEMS) se guardan como **plantillas** en el
servidor y el portal los llena: mismo diseño, logos, tablas y firmas. Si cambia un formato (normalmente solo fechas),
se reemplaza la plantilla. Descarga en Word/Excel y PDF.

## Evidencia (se define después)
Compacta: no guardar muchos archivos. Opción a evaluar: a partir del resultado capturado, generar un reporte con
gráficas como evidencia, y adjuntar archivo solo cuando el medio de verificación lo exija.

## Inconsistencias detectadas en el ejemplo (las evita la captura única)
- PEM-1 "cantidad anual 1" vs proyecto "100%".
- Ficha: "Tipo de objetivo" OPERACIONES vs OPERATIVO.
- Ficha de Informática con objetivo PMD de la red hidráulica (copiado de otra área).
- "Programa PMD" vacío; programa "03 Apoyo a la operación" (PEMS) vs "PP10" (proyecto).

## Pestañas propuestas del módulo
1. Cuadro mensual (sin cambios) · 2. Proyectos y fichas (captura anual) · 3. Validación SGC · 4. Evaluación trimestral
· 5. Informes · (Reportes de corrección y acciones: en Acciones Correctivas). "Por procesos", "Fichas PMD" y
"Presupuesto CONAC" actuales se absorben en Proyectos y fichas / Informes.

## Datos de todas las áreas
@human pasará la documentación de todas las áreas: se precargan proyectos, fichas y PEMS 2027 y se corrobora contra
lo que ya está en el sistema (catálogo actual del Cuadro de Control). Cumplir **exactamente** con los formatos.

## Por definir con @human
- Catálogo de ejes, programas PMD, programas presupuestarios y claves de actividad pública (lista oficial).
- Si el proyecto 2027 de cada área se precarga con los indicadores actuales del cuadro (2026) para agilizar.
- Formato de evidencia y gráficas.
- Formato oficial del **seguimiento trimestral del PEMS** (avance por actividad con justificación).
