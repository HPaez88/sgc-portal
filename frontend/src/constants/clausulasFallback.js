/**
 * clausulasFallback.js
 * Catálogo estático de reserva inmediata para el Explorador de Cláusulas ISO.
 * Garantiza que el usuario NUNCA vea la pantalla en blanco ni con 0 cláusulas
 * incluso si el backend está reiniciando o hay latencia de red.
 */

export const CLAUSULAS_FALLBACK = {
  'ISO-9001-2026': [
    {
      numero: '4.1',
      titulo: 'Comprensión de la organización y de su contexto',
      requisito: 'La organización debe determinar las cuestiones externas e internas que son pertinentes para su propósito y su dirección estratégica, y que afectan a su capacidad para lograr los resultados previstos de su sistema de gestión de la calidad.',
      interpretacion: 'El organismo operador (OOMAPASC) debe analizar factores externos (marco legal, clima, regulación de CONAGUA/CEA, tarifas, entorno social) e internos (infraestructura hidráulica, tecnología, cultura laboral, finanzas).',
      evidencia_objetiva: 'Matriz FODA/PESTEL actualizada, plan estratégico de calidad, actas de planeación directiva.',
      criterio_auditoria: 'Demostrar revisión periódica de las cuestiones internas y externas y cómo influyen en los objetivos de calidad.'
    },
    {
      numero: '4.2',
      titulo: 'Comprensión de las necesidades y expectativas de las partes interesadas',
      requisito: 'La organización debe determinar las partes interesadas pertinentes al SGC y los requisitos pertinentes de estas partes interesadas.',
      interpretacion: 'Identificar usuarios del servicio de agua potable y saneamiento, autoridades reguladoras (CONAGUA, COFEPRIS), ayuntamiento, proveedores, empleados y sociedad civil, mapeando sus expectativas.',
      evidencia_objetiva: 'Matriz de partes interesadas con necesidades, expectativas, mecanismos de seguimiento y requisitos legales.',
      criterio_auditoria: 'Verificar que los requisitos pertinentes de las partes interesadas se monitorean y revisan anualmente.'
    },
    {
      numero: '4.3',
      titulo: 'Determinación del alcance del sistema de gestión de la calidad',
      requisito: 'La organización debe determinar los límites y la aplicabilidad del SGC para establecer su alcance, considerando cuestiones del 4.1, requisitos del 4.2 y sus productos y servicios.',
      interpretacion: 'El alcance debe estar disponible y mantenerse como información documentada, delimitando los procesos de captación, potabilización, distribución, alcantarillado, saneamiento y atención a usuarios.',
      evidencia_objetiva: 'Documento oficial del Alcance del SGC aprobado por la Dirección General.',
      criterio_auditoria: 'El alcance debe justificar cualquier requisito de la norma que no sea aplicable (sin afectar la conformidad del servicio).'
    },
    {
      numero: '4.4',
      titulo: 'Sistema de gestión de la calidad y sus procesos',
      requisito: 'La organización debe establecer, implementar, mantener y mejorar continuamente un SGC, incluidos los procesos necesarios y sus interacciones.',
      interpretacion: 'Mapear procesos estratégicos, operativos (redes, plantas, comercial) y de apoyo (RH, compras, mantenimiento, TI), definiendo entradas, salidas, criterios, indicadores y responsables.',
      evidencia_objetiva: 'Mapa de procesos, fichas de caracterización de procesos (entradas, salidas, indicadores, riesgos y recursos).',
      criterio_auditoria: 'Comprobar que cada proceso cuenta con indicadores medibles (Cuadro OOMRSC-05) y asignación clara de responsabilidades.'
    },
    {
      numero: '5.1',
      titulo: 'Liderazgo y compromiso',
      requisito: 'La alta dirección debe demostrar liderazgo y compromiso con respecto al SGC asumiendo la responsabilidad y obligación de rendir cuentas con relación a la eficacia del SGC.',
      interpretacion: 'La Dirección General y directores de área deben asegurar la integración de los requisitos del SGC en los procesos de negocio, promover el enfoque en procesos y el pensamiento basado en riesgos.',
      evidencia_objetiva: 'Revisiones por la dirección, asignación de presupuesto para calidad, actas de rendición de cuentas, comunicación directiva.',
      criterio_auditoria: 'Entrevistas a la alta dirección donde demuestren conocimiento activo y apoyo al SGC.'
    },
    {
      numero: '5.2',
      titulo: 'Política de la Calidad',
      requisito: 'La alta dirección debe establecer, implementar y mantener una política de la calidad que sea apropiada al propósito y contexto, proporcione un marco de referencia para los objetivos, incluya compromiso de cumplir requisitos y de mejora continua.',
      interpretacion: 'Debe estar disponible como información documentada, comunicarse, entenderse y aplicarse dentro de la organización y estar disponible para partes interesadas.',
      evidencia_objetiva: 'Documento de Política de Calidad publicado, evidencia de difusión (capacitaciones, tableros, gafetes, intranet).',
      criterio_auditoria: 'El personal operativo y administrativo debe explicar cómo su trabajo contribuye a la política de calidad.'
    },
    {
      numero: '5.3',
      titulo: 'Roles, responsabilidades y autoridades en la organización',
      requisito: 'La alta dirección debe asegurarse de que las responsabilidades y autoridades para los roles pertinentes se asignen, se comuniquen y se entiendan en toda la organización.',
      interpretacion: 'Definir organigramas, descripciones de puestos y asignación formal de roles del SGC (Coordinador de Calidad, Dueños de Procesos, Auditores Internos).',
      evidencia_objetiva: 'Manual de organización, perfiles y descriptivos de puestos firmados, matriz de responsabilidades RACI.',
      criterio_auditoria: 'Verificar que el personal conoce sus responsabilidades y los límites de su autoridad para asegurar la conformidad de los procesos.'
    },
    {
      numero: '6.1',
      titulo: 'Acciones para abordar riesgos y oportunidades',
      requisito: 'Al planificar el SGC, la organización debe considerar las cuestiones del 4.1 y los requisitos del 4.2, y determinar los riesgos y oportunidades que es necesario abordar.',
      interpretacion: 'Identificar riesgos operativos, financieros, ambientales, de infraestructura y de servicio, evaluando probabilidad e impacto, y estableciendo planes de mitigación o contingencia.',
      evidencia_objetiva: 'Matriz de Riesgos del SGC actualizada por área y proceso, planes de acción ante riesgos, seguimiento anual.',
      criterio_auditoria: 'Demostrar proporcionalidad entre el impacto potencial del riesgo y la acción planificada.'
    },
    {
      numero: '6.2',
      titulo: 'Objetivos de la calidad y planificación para lograrlos',
      requisito: 'La organización debe establecer objetivos de la calidad para las funciones y niveles pertinentes y los procesos necesarios. Los objetivos deben ser coherentes con la política, medibles, tener en cuenta requisitos aplicables y ser objeto de seguimiento.',
      interpretacion: 'Cada objetivo debe tener: qué se va a hacer, qué recursos se requerirán, quién será el responsable, cuándo se finalizará y cómo se evaluarán los resultados.',
      evidencia_objetiva: 'Tablero de Indicadores del SGC (Cuadro OOMRSC-05 con 100 indicadores oficiales), metas anuales documentadas, planes de trabajo por área.',
      criterio_auditoria: 'Revisar la medición mensual/trimestral de indicadores y las acciones tomadas cuando una meta no se alcanza.'
    },
    {
      numero: '7.1',
      titulo: 'Recursos (Personas, Infraestructura, Ambiente, Seguimiento y Medición)',
      requisito: 'La organización debe determinar y proporcionar los recursos necesarios para el establecimiento, implementación, mantenimiento y mejora continua del SGC.',
      interpretacion: 'Abarca recursos humanos competentes, infraestructura (redes, plantas de tratamiento, vehículos, software), ambiente de trabajo y equipos de medición calibrados (medidores de flujo, turbidímetros, balanzas).',
      evidencia_objetiva: 'Programas de mantenimiento preventivo, certificados de calibración/verificación de equipos de laboratorio y medición, presupuestos.',
      criterio_auditoria: 'Comprobar la trazabilidad metrológica y el mantenimiento oportuno de la infraestructura crítica.'
    },
    {
      numero: '7.2',
      titulo: 'Competencia',
      requisito: 'La organización debe determinar la competencia necesaria de las personas que realizan trabajos que afectan al desempeño del SGC, asegurarse de que sean competentes con base en educación, formación o experiencia.',
      interpretacion: 'Detectar necesidades de capacitación (DNC), impartir cursos (operación de plantas, atención a usuarios, ISO 9001), evaluar eficacia y conservar registros.',
      evidencia_objetiva: 'Expedientes del personal con títulos/certificados, DNC anual, programa de capacitación ejecutado y evaluaciones de eficacia.',
      criterio_auditoria: 'Verificar que existen evaluaciones post-capacitación que demuestren impacto en el desempeño.'
    },
    {
      numero: '7.5.3',
      titulo: 'Control de la información documentada (Revisión activa periódica)',
      requisito: 'La información documentada requerida por el SGC debe controlarse para asegurar que esté disponible, sea idónea para su uso y esté protegida adecuadamente.',
      interpretacion: 'Control documental en el portal: código de documento (ej. OOMRSC-20), título, versión, fecha de aprobación, control de cambios y revisión periódica activa. Documentos con más de 1 año sin revisar deben ratificarse formalmente.',
      evidencia_objetiva: 'Módulo de Control Documental del portal, lista maestra de documentos vigentes, matriz de trazabilidad, bitácora de cambios y ratificaciones.',
      criterio_auditoria: 'Comprobar que en las áreas de trabajo solo se utilizan versiones vigentes y que los documentos >1 año cuentan con ratificación documentada.'
    },
    {
      numero: '8.1',
      titulo: 'Planificación y control operacional',
      requisito: 'La organización debe planificar, implementar y controlar los procesos necesarios para cumplir los requisitos para la provisión de productos y servicios.',
      interpretacion: 'Definir criterios operativos en procedimientos técnicos (operación de pozos, cloración, reparación de fugas, facturación y cobro), controlando cambios no previstos.',
      evidencia_objetiva: 'Procedimientos operativos estándar (POE), bitácoras de operación de plantas, reportes diarios de producción y distribución.',
      criterio_auditoria: 'Inspección in situ para verificar que la operación sigue los procedimientos documentados.'
    },
    {
      numero: '8.2',
      titulo: 'Requisitos para los productos y servicios',
      requisito: 'Comunicación con el cliente, determinación de requisitos relativos al servicio, revisión de requisitos y control de cambios en requisitos.',
      interpretacion: 'Atención a usuarios, contratos de servicio, tiempos de respuesta a reportes de fugas o falta de agua, cumplimiento de normas NOM-127-SSA1 (calidad de agua potable).',
      evidencia_objetiva: 'Catálogo de trámites y servicios, sistema de atención a reportes (Aquatel / módulo de quejas), contratos de adhesión.',
      criterio_auditoria: 'Revisar el porcentaje de atención oportuna a quejas y solicitudes ciudadanas.'
    },
    {
      numero: '8.5',
      titulo: 'Producción y provisión del servicio (8.5.1 a 8.5.6)',
      requisito: 'Implementar condiciones controladas para la provisión del servicio, trazabilidad, propiedad de clientes o proveedores, preservación de insumos y control de cambios.',
      interpretacion: 'Control riguroso en dosificación de químicos (cloro, sulfato), monitoreo de presiones en red hidráulica, mantenimiento de macromedición y custodia de datos de usuarios.',
      evidencia_objetiva: 'Registros de análisis físico-químicos y bacteriológicos diarios, bitácoras de cloración (REG-CLORO-01), trazabilidad de lotes de químicos.',
      criterio_auditoria: 'Verificar cumplimiento continuo de los parámetros de calidad del agua entregada a la red.'
    },
    {
      numero: '8.7',
      titulo: 'Control de las salidas no conformes',
      requisito: 'La organización debe asegurarse de que las salidas que no sean conformes con sus requisitos se identifican y se controlan para prevenir su uso o entrega no intencionada.',
      interpretacion: 'Identificar agua fuera de norma NOM, facturación incorrecta, obras inconclusas o fallas mayores de drenaje. Aislar, corregir y notificar a partes interesadas.',
      evidencia_objetiva: 'Registros de Producto/Servicio No Conforme, órdenes de desfogue o recloración, ajustes a recibos.',
      criterio_auditoria: 'Verificar que ninguna salida no conforme fue liberada sin autorización formal justificada.'
    },
    {
      numero: '9.1.3',
      titulo: 'Análisis y evaluación de indicadores (Formato OOMRSC-05)',
      requisito: 'La organización debe analizar y evaluar los datos e información apropiados que surgen por el seguimiento y la medición.',
      interpretacion: 'Medición mensual y trimestral del Cuadro de Control OOMRSC-05 (100 indicadores), semáforo institucional, y clasificación de desviaciones en Acción Correctiva (Alto Impacto) o Reporte de Corrección RC (Bajo Impacto).',
      evidencia_objetiva: 'Reportes mensuales de indicadores SGC, bitácoras de Reportes de Corrección (RC), análisis de tendencias trimestrales T1-T4.',
      criterio_auditoria: 'Comprobar que el análisis de datos conduce a toma de decisiones y acciones de mejora concretas.'
    },
    {
      numero: '9.2',
      titulo: 'Auditoría interna',
      requisito: 'La organización debe llevar a cabo auditorías internas a intervalos planificados para proporcionar información acerca de si el SGC es conforme con los requisitos propios y de la norma, y si está implementado y mantenido eficazmente.',
      interpretacion: 'Programa anual de auditorías internas que cubra todos los procesos, auditores independientes del área auditada (ISO 19011), informes de hallazgos y emisión de acciones correctivas.',
      evidencia_objetiva: 'Programa de auditoría anual, planes de auditoría individual, listas de verificación, informes de auditoría y dictámenes de eficacia.',
      criterio_auditoria: 'Comprobar la calificación formal de auditores internos y la imparcialidad del equipo auditor.'
    },
    {
      numero: '9.3',
      titulo: 'Revisión por la dirección (Formato OOMRSC-04)',
      requisito: 'La alta dirección debe revisar el SGC a intervalos planificados para asegurarse de su conveniencia, adecuación, eficacia y alineación continua con la dirección estratégica.',
      interpretacion: 'Reunión directiva periódica analizando entradas (9.3.2) y generando salidas y acuerdos (9.3.3) con captura durante los primeros 10 días.',
      evidencia_objetiva: 'Acta formal de Revisión por la Dirección OOMRSC-04 Rev. 09 con acuerdos, asignación de presupuestos y fechas compromiso.',
      criterio_auditoria: 'Verificar que los compromisos asumidos en la revisión previa fueron implementados.'
    },
    {
      numero: '10.2',
      titulo: 'No conformidad y acción correctiva (Formato OOMRSC-20)',
      requisito: 'Cuando ocurra una no conformidad, la organización debe: reaccionar ante ella (controlar y corregir), evaluar la necesidad de acciones para eliminar las causas (causa raíz 5 Porqués / Ishikawa), implementar acciones, verificar eficacia y actualizar riesgos.',
      interpretacion: 'Módulo de Acciones Correctivas OOMRSC-20: ratificación humana obligatoria (CONFIRMAR), folios oficiales, seguimiento de actividades y dictamen de cierre por auditor.',
      evidencia_objetiva: 'Registros de Acciones Correctivas OOMRSC-20 en estado CERRADO con dictamen del auditor y evidencias adjuntas.',
      criterio_auditoria: 'El auditor evalúa si la causa raíz atacó el origen sistémico y si se verificó la NO recurrencia tras un periodo de seguimiento.'
    },
    {
      numero: '10.3',
      titulo: 'Mejora continua (Formato OOMRSC-21)',
      requisito: 'La organización debe mejorar continuamente la conveniencia, adecuación y eficacia del sistema de gestión de la calidad.',
      interpretacion: 'Módulo de Planes de Mejora OOMRSC-21: Proyectos proactivos originados por análisis de indicadores, nuevas tecnologías, optimización energética o sugerencias del personal con presupuesto asignado.',
      evidencia_objetiva: 'Planes de Mejora OOMRSC-21 ejecutados, reportes de impacto en indicadores y ahorros/eficiencia demostrados.',
      criterio_auditoria: 'Demostrar que el organismo promueve iniciativas de mejora más allá de la mera corrección de errores.'
    }
  ],
  'ISO-14001-2015': [
    {
      numero: '4.1',
      titulo: 'Comprensión de la organización y de su contexto ambiental',
      requisito: 'Determinar cuestiones externas e internas relevantes para su propósito ambiental (sequía, acuíferos, descargas residuales, cambio climático, marco legal SEMARNAT/CONAGUA).',
      interpretacion: 'Identificar el estrés hídrico en el Valle del Yaqui, vulnerabilidad ante ciclones y capacidad de tratamiento de aguas residuales.',
      evidencia_objetiva: 'Diagnóstico ambiental inicial, matriz de contexto ambiental.',
      criterio_auditoria: 'Verificar análisis de condiciones ambientales locales que puedan afectar o ser afectadas por el organismo.'
    },
    {
      numero: '6.1.2',
      titulo: 'Aspectos ambientales e impactos significativos',
      requisito: 'Determinar los aspectos ambientales de sus actividades, productos y servicios que puede controlar e influir, considerando una perspectiva de ciclo de vida.',
      interpretacion: 'Evaluar consumo de energía eléctrica en pozos y plantas, uso de cloro gas/hipoclorito, lodos de plantas de tratamiento, fugas de drenaje y descargas a cuerpos receptores (NOM-001-SEMARNAT).',
      evidencia_objetiva: 'Matriz de identificación y evaluación de aspectos e impactos ambientales significativos.',
      criterio_auditoria: 'Comprobar criterios objetivos de significancia (severidad, frecuencia, probabilidad y requisito legal).'
    },
    {
      numero: '6.1.3',
      titulo: 'Requisitos legales y otros requisitos',
      requisito: 'Determinar y tener acceso a los requisitos legales y otros requisitos relacionados con sus aspectos ambientales.',
      interpretacion: 'Monitoreo continuo de Ley de Aguas Nacionales, NOM-001-SEMARNAT-2021 (descargas), NOM-004-SEMARNAT (lodos y biosólidos) y permisos de extracción.',
      evidencia_objetiva: 'Matriz de cumplimiento legal ambiental con estatus de cumplimiento y vigencia de títulos de concesión y permisos de descarga.',
      criterio_auditoria: 'Verificar que se evalúa el cumplimiento legal al menos una vez al año y se atienden observaciones de PROFEPA/CONAGUA.'
    },
    {
      numero: '8.1',
      titulo: 'Planificación y control operacional ambiental',
      requisito: 'Establecer, implementar, controlar y mantener los procesos necesarios para satisfacer los requisitos del SGA y controlar aspectos significativos.',
      interpretacion: 'Protocolos de dosificación química, manejo integral de residuos peligrosos (aceites, baterías, envases de químicos), confinamiento de lodos de PTAR.',
      evidencia_objetiva: 'Procedimientos ambientales, bitácoras de almacén temporal de residuos peligrosos (ATRP), manifiestos de recolección autorizados.',
      criterio_auditoria: 'Inspección de PTARs y talleres para verificar contención de derrames y gestión de lodos.'
    },
    {
      numero: '8.2',
      titulo: 'Preparación y respuesta ante emergencias ambientales',
      requisito: 'Establecer y mantener procesos necesarios acerca de cómo responder a situaciones de emergencia y accidentes potenciales que puedan tener impacto ambiental.',
      interpretacion: 'Plan de contingencia ante fugas de cloro gas, derrames de reactivos, inundaciones, fallas en colectores principales o cortes de energía en cárcamos.',
      evidencia_objetiva: 'Plan de atención a emergencias ambientales, brigadas capacitadas, registros de simulacros anuales.',
      criterio_auditoria: 'Verificar simulacros documentados con evaluación de tiempos de respuesta y acciones correctivas derivadas.'
    }
  ],
  'ISO-45001-2018': [
    {
      numero: '4.1',
      titulo: 'Contexto de la organización y seguridad laboral',
      requisito: 'Determinar cuestiones internas y externas que afectan los resultados del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SST).',
      interpretacion: 'Condiciones de trabajo en campo de OOMAPASC: altas temperaturas en verano (>40°C), riesgos en zanjas abiertas, manipulación de cloro gas y espacios confinados.',
      evidencia_objetiva: 'Diagnóstico integral de condiciones laborales y mapa de riesgos ocupacionales.',
      criterio_auditoria: 'Comprobar análisis de riesgos por puestos de trabajo operativos y administrativos.'
    },
    {
      numero: '6.1.2',
      titulo: 'Identificación de peligros y evaluación de riesgos y oportunidades SST',
      requisito: 'Establecer y mantener procesos para la identificación continua y proactiva de los peligros laborales.',
      interpretacion: 'Peligros críticos: trabajos en espacios confinados (pozos de visita, tanques, NOM-033-STPS), excavaciones y zanjas sin ademar (NOM-031-STPS), manejo de cloro gas y riesgo biológico por aguas negras.',
      evidencia_objetiva: 'Matriz IPERC (Identificación de Peligros, Evaluación de Riesgos y Controles) por área operativa.',
      criterio_auditoria: 'Comprobar que se aplica la jerarquía de controles: eliminación, sustitución, controles de ingeniería, señalización y EPP.'
    },
    {
      numero: '8.1.2',
      titulo: 'Eliminar peligros y reducir riesgos para la SST',
      requisito: 'La organización debe establecer, implementar y mantener procesos para la eliminación de peligros y la reducción de riesgos para la SST utilizando la jerarquía de controles.',
      interpretacion: 'Permisos de trabajo seguro (PTS) obligatorios para ingreso a espacios confinados, detectores de gases (H2S, CO, O2, explosividad) y equipos de respiración autónoma (ERA).',
      evidencia_objetiva: 'Bitácoras de permisos de trabajo de alto riesgo firmados, registros de calibración de detectores multigás.',
      criterio_auditoria: 'Inspección de campo en cuadrillas de alcantarillado verificando el uso del trípode, arnés y detector de gases.'
    }
  ],
  'ISO-19011-2018': [
    {
      numero: '4.0',
      titulo: 'Principios de auditoría',
      requisito: 'Integridad, presentación ecuánime, debido cuidado profesional, confidencialidad, independencia, enfoque basado en la evidencia y enfoque basado en riesgos.',
      interpretacion: 'Los auditores internos del SGC de OOMAPASC deben ser imparciales y no auditar su propio trabajo o departamento.',
      evidencia_objetiva: 'Declaraciones de imparcialidad y confidencialidad firmadas por el equipo auditor.',
      criterio_auditoria: 'Comprobar la independencia del auditor líder respecto al área auditada.'
    },
    {
      numero: '6.4',
      titulo: 'Realización de las actividades de auditoría y redacción de hallazgos',
      requisito: 'Recopilación y verificación de información para generar hallazgos de auditoría (conformidades, no conformidades, observaciones y oportunidades de mejora).',
      interpretacion: 'Toda No Conformidad debe redactarse con los 3 elementos: Declaración del hecho, Criterio incumplido (cláusula) y Evidencia objetiva tangible.',
      evidencia_objetiva: 'Cédulas de hallazgos de auditoría e informes oficiales con firmas de auditores y auditados.',
      criterio_auditoria: 'Verificar la solidez de la evidencia documental o presencial de cada no conformidad levantada.'
    }
  ]
};
