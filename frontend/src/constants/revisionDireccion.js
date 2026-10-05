// Constantes y Estructura Oficial para el Módulo de Revisión por la Dirección
// Formato Institucional: OOMRSC-04 REV. 09 (Enero 2026)
// Alineado con ISO 9001:2015 / ISO 9001:2026 Cláusula 9.3

export const FORMATO_REVISION_DIRECCION = {
  clave: 'OOMRSC-04',
  revision: 'REV. 09',
  fechaRevision: 'Enero 2026',
  titulo: 'REVISIÓN POR LA DIRECCIÓN - SISTEMA DE GESTIÓN DE CALIDAD',
  organismo: 'Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme (OOMAPASC)',
  normasAplicables: [
    'ISO 9001:2015 / ISO 9001:2026 (Sistemas de Gestión de la Calidad)',
    'ISO 14001:2015 (Sistemas de Gestión Ambiental)',
    'ISO 45001:2018 (Sistemas de Gestión de Seguridad y Salud en el Trabajo)',
    'ISO 19011:2018 (Directrices para Auditorías de Sistemas de Gestión)',
    'ISO/IEC 42001:2023 (Sistemas de Gestión de Inteligencia Artificial)'
  ]
};

// Formulario complementarios asignables a usuarios responsables
export const FORMULARIOS_COMPLEMENTARIOS_CONFIG = [
  {
    id: 'quejas_oci',
    codigo: 'COMP-OCI-01',
    nombre: 'Buzón de Quejas y Denuncias (OCI)',
    descripcion: 'Reporte mensual de quejas y denuncias ciudadanas recibidas, atendidas y concluidas.',
    areaResponsable: 'Órgano de Control Interno',
    rolSugerido: 'Encargado',
    responsableDefaultId: 1, // Modificable por el administrador
    indicadorRelacionado: 58,
    campos: [
      { id: 'quejas_recibidas', label: 'Quejas / Denuncias Recibidas en el Mes', tipo: 'numero', default: 26 },
      { id: 'quejas_atendidas', label: 'Quejas / Denuncias Atendidas en Tiempo', tipo: 'numero', default: 26 },
      { id: 'quejas_pendientes', label: 'Quejas en Trámite o Pendientes', tipo: 'numero', default: 0 },
      { id: 'tiempo_promedio_dias', label: 'Tiempo Promedio de Respuesta (Días hábiles)', tipo: 'numero', default: 4 },
      { id: 'analisis_oci', label: 'Análisis Causal y Medidas Preventivas', tipo: 'texto_largo', default: 'Se atendió el 100% de las inconformidades turnadas al Órgano de Control Interno sin quejas recurrentes graves.' }
    ]
  },
  {
    id: 'satisfaccion_usuarios',
    codigo: 'COMP-ATN-02',
    nombre: 'Satisfacción del Cliente (Línea OOMAPASC y Módulos)',
    descripcion: 'Resultados de encuestas de satisfacción telefónica (atención, solución comercial, solución técnica) y presencial en ventanillas.',
    areaResponsable: 'Atención Ciudadana',
    rolSugerido: 'Usuario',
    responsableDefaultId: 3, // Lic. María García
    indicadorRelacionado: 45,
    campos: [
      { id: 'satisfaccion_telefonica_atencion', label: '% Satisfacción en Atención Telefónica (Línea OOMAPASC)', tipo: 'porcentaje', meta: 95, default: 97 },
      { id: 'satisfaccion_telefonica_comercial', label: '% Satisfacción en Solución Operativa Comercial', tipo: 'porcentaje', meta: 95, default: 100 },
      { id: 'satisfaccion_telefonica_tecnica', label: '% Satisfacción en Solución Operativa Técnica', tipo: 'porcentaje', meta: 95, default: 97 },
      { id: 'satisfaccion_modulos_presencial', label: '% Satisfacción en Módulos de Contratos y Servicios', tipo: 'porcentaje', meta: 96, default: 100 },
      { id: 'observaciones_satisfaccion', label: 'Observaciones y retroalimentación de usuarios', tipo: 'texto_largo', default: 'Los tiempos de espera en ventanilla y call center se mantuvieron dentro de los parámetros de calidad del SGC.' }
    ]
  },
  {
    id: 'calidad_agua',
    codigo: 'COMP-TEC-03',
    nombre: 'Muestreo y Calidad del Agua Potable (NOM-127/179)',
    descripcion: 'Cumplimiento analítico de muestreos físico-químicos y bacteriológicos conforme a normatividad sanitaria.',
    areaResponsable: 'Control de Calidad',
    rolSugerido: 'Admin',
    responsableDefaultId: 2, // Ing. Juan López
    indicadorRelacionado: 46,
    campos: [
      { id: 'muestreos_programados', label: 'Muestreos Programados en el Mes', tipo: 'numero', default: 838 },
      { id: 'muestreos_realizados', label: 'Muestreos Efectivamente Realizados', tipo: 'numero', default: 844 },
      { id: 'analisis_conformes_pct', label: '% de Cumplimiento de Parámetros Permisibles', tipo: 'porcentaje', meta: 99.5, default: 100 },
      { id: 'fuentes_monitoreadas', label: 'Pozos y Plantas Potabilizadoras Verificados', tipo: 'numero', default: 38 },
      { id: 'dictamen_calidad', label: 'Dictamen Técnico de Calidad del Agua', tipo: 'texto_largo', default: 'El agua suministrada a la red de Cajeme cumple a cabalidad con la NOM-127-SSA1-2021 sin presencia de coliformes ni anomalías fisicoquímicas.' }
    ]
  },
  {
    id: 'proveedores_quimicos',
    codigo: 'COMP-MAT-04',
    nombre: 'Evaluación de Proveedores de Insumos Químicos Críticos',
    descripcion: 'Evaluación de lotes y contenedores de cloro gas, hipoclorito de sodio, sulfato de aluminio y polímeros recibidos.',
    areaResponsable: 'Recursos Materiales',
    rolSugerido: 'Encargado',
    responsableDefaultId: 5, // C.P. Ana Hernández
    indicadorRelacionado: 8,
    campos: [
      { id: 'lotes_solicitados', label: 'Lotes / Contenedores Solicitados en el Mes', tipo: 'numero', default: 42 },
      { id: 'lotes_aprobados_inspeccion', label: 'Lotes Inspeccionados y Aprobados al 100%', tipo: 'numero', default: 42 },
      { id: 'lotes_rechazados', label: 'Lotes Rechazados o con Incidencias', tipo: 'numero', default: 0 },
      { id: 'calificacion_proveedores_pct', label: '% Promedio de Desempeño de Proveedores Químicos', tipo: 'porcentaje', meta: 100, default: 100 },
      { id: 'conclusion_proveedores', label: 'Conclusión y Estado de Abastecimiento', tipo: 'texto_largo', default: 'Se cumplió al 100% con la evaluación de los insumos químicos garantizando la continuidad ininterrumpida de la potabilización.' }
    ]
  },
  {
    id: 'acuerdos_previos',
    codigo: 'COMP-SGC-05',
    nombre: 'Seguimiento a Acuerdos de la Dirección Previa',
    descripcion: 'Revisión y estatus de los compromisos y salidas dictadas en la sesión de Revisión por la Dirección anterior.',
    areaResponsable: 'Sistema de Gestión de Calidad',
    rolSugerido: 'Super Admin',
    responsableDefaultId: 1, // Lic. Héctor Páez
    indicadorRelacionado: 1,
    campos: [
      { id: 'total_acuerdos_anteriores', label: 'Total de Acuerdos del Período Anterior', tipo: 'numero', default: 4 },
      { id: 'acuerdos_cumplidos', label: 'Acuerdos Concluidos al 100%', tipo: 'numero', default: 4 },
      { id: 'acuerdos_en_proceso', label: 'Acuerdos en Seguimiento', tipo: 'numero', default: 0 },
      { id: 'resumen_seguimiento', label: 'Resumen Ejecutivo de Acciones Previas', tipo: 'texto_largo', default: 'Se concluyeron las acciones previas de actualización del Manual de Calidad y la armonización de objetivos con ISO 9001:2026.' }
    ]
  }
];

// Datos históricos iniciales basados en los 3 PDFs presentados (Mayo, Junio y Julio 2026)
export const REVISIONES_DIRECCION_INICIALES = [
  {
    id: 'REV-2026-07',
    ejercicio: 2026,
    mes: 'Julio',
    periodoId: 'C2',
    fechaSesion: '2026-07-28',
    estado: 'APROBADA_CERRADA',
    folio: 'OOMRSC-04/2026-07',
    directorGeneral: 'Dirección General OOMAPASC',
    coordinadorSGC: 'Lic. Héctor Manuel Páez León',
    cambiosContexto: 'Alineación institucional a los lineamientos de ISO 9001:2026 sobre cambio climático, gestión hídrica preventiva y gobernanza de IA.',
    cobranza: {
      presupuestado: 55069189.0,
      logrado: 44470405.0,
      cumplimiento_pct: 81
    },
    muestreoAgua: {
      programados: 838,
      realizados: 844,
      cumplimiento_pct: 100
    },
    auditoriasInternas: {
      periodo: 'Mayo - Junio 2026',
      procesosAuditados: 'Mantenimiento y Calibración (87%), Gestión de Recursos (100%)',
      promedioSGC: 92,
      rango: 'Aceptable'
    },
    formulariosComplementarios: {
      quejas_oci: {
        quejas_recibidas: 26,
        quejas_atendidas: 26,
        quejas_pendientes: 0,
        tiempo_promedio_dias: 3,
        analisis_oci: '100% de quejas atendidas mediante conciliación y aclaración técnica oportuna.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-08-05'
      },
      satisfaccion_usuarios: {
        satisfaccion_telefonica_atencion: 97,
        satisfaccion_telefonica_comercial: 100,
        satisfaccion_telefonica_tecnica: 97,
        satisfaccion_modulos_presencial: 100,
        observaciones_satisfaccion: 'Excelente percepción ciudadana en trámites y tiempos de resolución técnica.',
        capturadoPor: 'Lic. María García',
        fechaCaptura: '2026-08-04'
      },
      calidad_agua: {
        muestreos_programados: 838,
        muestreos_realizados: 844,
        analisis_conformes_pct: 100,
        fuentes_monitoreadas: 38,
        dictamen_calidad: 'Calidad certificada bajo NOM-127-SSA1-2021 en todo el municipio de Cajeme.',
        capturadoPor: 'Ing. Juan López',
        fechaCaptura: '2026-08-06'
      },
      proveedores_quimicos: {
        lotes_solicitados: 42,
        lotes_aprobados_inspeccion: 42,
        lotes_rechazados: 0,
        calificacion_proveedores_pct: 100,
        conclusion_proveedores: 'Evaluación de lotes de cloro e insumos de potabilización con 100% de conformidad.',
        capturadoPor: 'C.P. Ana Hernández',
        fechaCaptura: '2026-08-03'
      },
      acuerdos_previos: {
        total_acuerdos_anteriores: 3,
        acuerdos_cumplidos: 3,
        acuerdos_en_proceso: 0,
        resumen_seguimiento: 'Cumplimiento total de acuerdos de la sesión de Junio 2026.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-08-02'
      }
    },
    salidasDireccion: {
      oportunidadesMejora: 'Continuar reforzando la micromedición urbana y la digitalización de reportes operativos.',
      cambiosSGC: 'Implementar el módulo interactivo de Revisión por la Dirección OOMRSC-04 y la política de Gobernanza de IA.',
      recursosNecesarios: 'Mantener presupuesto asignado para reactivos de potabilización y mantenimiento preventivo vehicular.',
      acuerdosFinales: 'Se ratifica el compromiso de la Alta Dirección con el SGC y la mejora continua del servicio de agua potable y saneamiento en Cajeme.'
    }
  },
  {
    id: 'REV-2026-06',
    ejercicio: 2026,
    mes: 'Junio',
    periodoId: 'C2',
    fechaSesion: '2026-06-25',
    estado: 'APROBADA_CERRADA',
    folio: 'OOMRSC-04/2026-06',
    directorGeneral: 'Dirección General OOMAPASC',
    coordinadorSGC: 'Lic. Héctor Manuel Páez León',
    cambiosContexto: 'Actualización en Manual de la Calidad y revisión de metas cuatrimestrales.',
    cobranza: {
      presupuestado: 52100000.0,
      logrado: 43200000.0,
      cumplimiento_pct: 83
    },
    muestreoAgua: {
      programados: 820,
      realizados: 830,
      cumplimiento_pct: 100
    },
    auditoriasInternas: {
      periodo: 'Abril - Mayo 2026',
      procesosAuditados: 'Comercialización y Producción',
      promedioSGC: 91,
      rango: 'Aceptable'
    },
    formulariosComplementarios: {
      quejas_oci: {
        quejas_recibidas: 22,
        quejas_atendidas: 22,
        quejas_pendientes: 0,
        tiempo_promedio_dias: 4,
        analisis_oci: 'Se atendieron las quejas dentro de los plazos normativos.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-07-04'
      },
      satisfaccion_usuarios: {
        satisfaccion_telefonica_atencion: 96,
        satisfaccion_telefonica_comercial: 98,
        satisfaccion_telefonica_tecnica: 95,
        satisfaccion_modulos_presencial: 99,
        observaciones_satisfaccion: 'Retroalimentación positiva en atención y módulos.',
        capturadoPor: 'Lic. María García',
        fechaCaptura: '2026-07-03'
      },
      calidad_agua: {
        muestreos_programados: 820,
        muestreos_realizados: 830,
        analisis_conformes_pct: 100,
        fuentes_monitoreadas: 38,
        dictamen_calidad: 'Cumplimiento normativo total en muestreos bacteriológicos.',
        capturadoPor: 'Ing. Juan López',
        fechaCaptura: '2026-07-05'
      },
      proveedores_quimicos: {
        lotes_solicitados: 39,
        lotes_aprobados_inspeccion: 39,
        lotes_rechazados: 0,
        calificacion_proveedores_pct: 100,
        conclusion_proveedores: 'Lotes de cloro recibidos y validados satisfactoriamente.',
        capturadoPor: 'C.P. Ana Hernández',
        fechaCaptura: '2026-07-02'
      },
      acuerdos_previos: {
        total_acuerdos_anteriores: 2,
        acuerdos_cumplidos: 2,
        acuerdos_en_proceso: 0,
        resumen_seguimiento: 'Acuerdos de Mayo concluidos.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-07-01'
      }
    },
    salidasDireccion: {
      oportunidadesMejora: 'Optimización de rutas de lectura y facturación.',
      cambiosSGC: 'Ajuste de indicadores de eficiencia comercial.',
      recursosNecesarios: 'Adquisición de insumos de laboratorio para control de cloro.',
      acuerdosFinales: 'Aprobación del informe mensual de resultados SGC Junio 2026.'
    }
  },
  {
    id: 'REV-2026-05',
    ejercicio: 2026,
    mes: 'Mayo',
    periodoId: 'C2',
    fechaSesion: '2026-05-27',
    estado: 'APROBADA_CERRADA',
    folio: 'OOMRSC-04/2026-05',
    directorGeneral: 'Dirección General OOMAPASC',
    coordinadorSGC: 'Lic. Héctor Manuel Páez León',
    cambiosContexto: 'Cambio en objetivo de calidad de Dirección Técnica.',
    cobranza: {
      presupuestado: 50400000.0,
      logrado: 39800000.0,
      cumplimiento_pct: 79
    },
    muestreoAgua: {
      programados: 810,
      realizados: 815,
      cumplimiento_pct: 100
    },
    auditoriasInternas: {
      periodo: 'Marzo - Abril 2026',
      procesosAuditados: 'Responsabilidad de la Dirección y SGC',
      promedioSGC: 94,
      rango: 'Aceptable'
    },
    formulariosComplementarios: {
      quejas_oci: {
        quejas_recibidas: 19,
        quejas_atendidas: 19,
        quejas_pendientes: 0,
        tiempo_promedio_dias: 3,
        analisis_oci: 'Quejas solventadas en conciliación.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-06-03'
      },
      satisfaccion_usuarios: {
        satisfaccion_telefonica_atencion: 95,
        satisfaccion_telefonica_comercial: 97,
        satisfaccion_telefonica_tecnica: 96,
        satisfaccion_modulos_presencial: 98,
        observaciones_satisfaccion: 'Resultados por encima de la meta del 95%.',
        capturadoPor: 'Lic. María García',
        fechaCaptura: '2026-06-02'
      },
      calidad_agua: {
        muestreos_programados: 810,
        muestreos_realizados: 815,
        analisis_conformes_pct: 100,
        fuentes_monitoreadas: 38,
        dictamen_calidad: 'Cumplimiento normativo certificado.',
        capturadoPor: 'Ing. Juan López',
        fechaCaptura: '2026-06-04'
      },
      proveedores_quimicos: {
        lotes_solicitados: 35,
        lotes_aprobados_inspeccion: 35,
        lotes_rechazados: 0,
        calificacion_proveedores_pct: 100,
        conclusion_proveedores: 'Recepción al 100% de lotes de insumos químicos.',
        capturadoPor: 'C.P. Ana Hernández',
        fechaCaptura: '2026-06-02'
      },
      acuerdos_previos: {
        total_acuerdos_anteriores: 2,
        acuerdos_cumplidos: 2,
        acuerdos_en_proceso: 0,
        resumen_seguimiento: 'Seguimiento completado.',
        capturadoPor: 'Lic. Héctor Manuel Páez León',
        fechaCaptura: '2026-06-01'
      }
    },
    salidasDireccion: {
      oportunidadesMejora: 'Refuerzo de mantenimiento preventivo en bombas de pozos.',
      cambiosSGC: 'Integración de matrices de trazabilidad.',
      recursosNecesarios: 'Refuerzo de cuadrillas de alcantarillado.',
      acuerdosFinales: 'Aprobación del informe mensual de resultados SGC Mayo 2026.'
    }
  }
];
