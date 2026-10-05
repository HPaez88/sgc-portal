// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES Y MODELO DE FICHAS TÉCNICAS GUBERNAMENTALES (AYUNTAMIENTO DE CAJEME)
// Planeación y Presupuesto de Egresos · Alineación con el Plan Municipal de Desarrollo (PMD)
// ═══════════════════════════════════════════════════════════════════════════

export const CONFIG_AYUNTAMIENTO_CAJEME = {
  dependencia: 'OOMAPAS DE CAJEME',
  organismo: 'Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme',
  municipio: 'H. Ayuntamiento de Cajeme',
  eje_rector_defecto: 'Cajeme Limpio y Ordenado',
  programa_pmd_defecto: 'Desarrollo con Servicios Públicos de Calidad',
  objetivo_pmd_defecto: 'Gestión Moderna y Eficiente del Cobro de Agua',
  estrategia_pmd_defecto: 'Fortalecimiento de la eficiencia comercial, operativa y administrativa con enfoque de mejora continua',
  objetivo_institucional_defecto: 'Procesar y suministrar agua potable, brindando servicios de calidad; aprovechando eficientemente los recursos humanos, financieros y materiales promoviendo la mejora continua, capacitando constantemente a nuestro personal, así como garantizar el alcantarillado y saneamiento para contribuir con el cuidado del medio ambiente, el bienestar y satisfacción de nuestros usuarios.',
  ejercicio_fiscal_default: 2026,
  titular_general: 'Lic. Luis Alberto Ruiz Coronado',
  cargo_titular_general: 'Director General del OOMAPASC',
  titular_sgc: 'Mtra. Mariana Pérez Chávez',
  cargo_titular_sgc: 'Coordinadora del Sistema de Gestión de Calidad'
};

// ═══════════════════════════════════════════════════════════════════════════
// FICHAS TÉCNICAS OFICIALES DETALLADAS (EXTRACTO DEL EXPEDIENTE MUNICIPAL)
// ═══════════════════════════════════════════════════════════════════════════
export const FICHAS_TECNICAS_DETALLADAS = {
  // Ficha 1.1: Cumplimiento Metas Direcciones (Indicador #1)
  1: {
    archivo_origen: '1.1- Ficha Tecnica - Cumplimiento Metas Direcciones.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del Cobro de Agua',
      estrategia_pmd: 'Monitoreo trimestral de metas operativas y administrativas de las Direcciones.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Cumplir las metas establecidas por las direcciones adscritas a la Dirección General',
      definicion_indicador: 'Cumplir al 85% las metas establecidas por las direcciones adscritas a la Dirección General.',
      tipo_indicador: 'Estratégico',
      dimension: 'Eficacia',
      metodo_calculo: 'Promedio del porcentaje de cumplimiento de metas de las direcciones adscritas a la Dirección General.',
      variables_calculo: 'Porcentaje de cumplimiento de metas de cada Dirección adscrita a la Dirección General.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Trimestral',
      meta_anual: '85%',
      linea_base: '89%',
      sentido_indicador: 'Ascendente',
      supuestos: 'La falta de recursos propios y/o federales.',
      distribucion_trimestral: { T1: '20%', T2: '20%', T3: '20%', T4: '25%' }
    },
    atributos_cremaa: {
      claridad: 'Permite ver el cumplimiento de metas por dirección',
      relevancia: 'Permite la toma de decisiones',
      economia: 'Aprovechamiento de los sistemas informáticos institucionales',
      monitoreable: 'Permite llevar un control del cumplimiento de metas',
      adecuado: 'Permite conocer el estado de las metas por dirección',
      aportacion_marginal: 'Contribuye directamente al seguimiento del Plan Municipal de Desarrollo'
    },
    caracteristicas_variables: {
      medios_verificacion: 'PEM-1 Objetivos y Metas y PEM-2 Actividades Públicas Municipales e Indicadores de Medición',
      metodo_recopilacion: 'Correo electrónico y consolidación en el Portal SGC'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Mtra. Mariana Pérez Chávez',
      cargo_titular: 'Coordinador del Sistema de Gestión de Calidad',
      fecha_elaboracion: '08 de Noviembre 2024',
      notas: 'Formato armonizado para entrega a Tesorería Municipal y Secretaría del Ayuntamiento.'
    }
  },

  // Ficha 1.2: Consejo Consultivo (Indicador #2)
  2: {
    archivo_origen: '1.2- Ficha Tecnica - Consejo Consultivo.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua.',
      estrategia_pmd: 'Participación ciudadana y rendición de cuentas ante el Consejo Consultivo.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Mantener una relación de comunicación con el Consejo Consultivo',
      definicion_indicador: 'Mantener una relación de comunicación con el Consejo Consultivo para informar sobre la situación actual del Organismo, y consensuar temas de participación ciudadana.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: 'Sumatoria de actas y reuniones celebradas con el Consejo Consultivo en el ejercicio.',
      variables_calculo: 'Número de actas de sesiones ordinarias y extraordinarias del Consejo Consultivo.',
      unidad_medida: 'Actas',
      frecuencia_medicion: 'Trimestral',
      meta_anual: '11 Actas',
      linea_base: '11 Actas',
      sentido_indicador: 'Ascendente',
      supuestos: 'No contar con el quórum legal para sesionar.',
      distribucion_trimestral: { T1: '3', T2: '3', T3: '2', T4: '3' }
    },
    atributos_cremaa: {
      claridad: 'Permite ver las reuniones pactadas en el año',
      relevancia: 'Permite la toma de decisiones y gobernanza participativa',
      economia: 'Optimización de recursos de sala y comunicación',
      monitoreable: 'Permite llevar un control de los acuerdos tomados',
      adecuado: 'Permite conocer los temas tratados en el Consejo Consultivo',
      aportacion_marginal: 'Valida la legitimidad social y transparencia del organismo'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Actas de sesiones del Consejo Consultivo y listas de asistencia',
      metodo_recopilacion: 'Secretaría Técnica y Dirección General'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Mtra. Mariana Pérez Chávez',
      cargo_titular: 'Coordinador del Sistema de Gestión de Calidad',
      fecha_elaboracion: '08 de Noviembre 2024',
      notas: 'Conforme a la Ley de Agua del Estado de Sonora y reglamento interno.'
    }
  },

  // Ficha 1.3: Grado de Eficacia SGC (Indicador #0)
  0: {
    archivo_origen: '1.3- Ficha Tecnica - Grado Eficacia SGC.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua.',
      estrategia_pmd: 'Mantenimiento del Sistema de Gestión de la Calidad ISO 9001:2015 en todos los procesos.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Lograr el grado de eficacia del SGC determinado por auditorías e indicadores',
      definicion_indicador: 'Promover la mejora continua a través del sistema de gestión de calidad ISO 9001 y de los indicadores de eficiencia y desempeño en los términos del artículo 72 de la Ley.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: '(Promedio de cumplimiento de indicadores + Grado de cumplimiento de auditorías internas) / 2',
      variables_calculo: 'Porcentaje de cumplimiento de indicadores y porcentaje de eficacia en auditorías.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Trimestral',
      meta_anual: '85%',
      linea_base: '89%',
      sentido_indicador: 'Ascendente',
      supuestos: 'Falta de recursos económicos, humanos y/o materiales.',
      distribucion_trimestral: { T1: '20%', T2: '20%', T3: '20%', T4: '25%' }
    },
    atributos_cremaa: {
      claridad: 'Permite la toma de decisiones a corto y mediano plazo',
      relevancia: 'Permite ver el desempeño integral de indicadores y auditorías del Organismo',
      economia: 'Aprovechamiento integral de la plataforma digital SGC',
      monitoreable: 'Permite llevar un control del comportamiento del Organismo apegado al SGC',
      adecuado: 'Permite ver el desempeño de cada una de las áreas del Organismo',
      aportacion_marginal: 'Garantiza la certificación internacional ISO 9001:2015 y cumplimiento del Art. 72'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Cuadro de Control de Desempeño de Procesos (OOMRSC-05) e Informes de Auditoría',
      metodo_recopilacion: 'Informes de auditoría interna y captura de indicadores en el portal'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Mtra. Mariana Pérez Chávez',
      cargo_titular: 'Coordinador del Sistema de Gestión de Calidad',
      fecha_elaboracion: '08 de Noviembre 2024',
      notas: 'Indicador institucional #0 del Cuadro de Control OOMRSC-05.'
    }
  },

  // Ficha 1.4: Riesgos (Indicador #3 o Matriz de Riesgos)
  3: {
    archivo_origen: '1.4- Ficha técnica - Riesgos 2025.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua.',
      estrategia_pmd: 'Gestión preventiva de riesgos operativos, comerciales y administrativos conforme a ISO 9001 § 6.1.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Cumplir en los cierres de planes de acción de Matriz de Riesgos',
      definicion_indicador: 'Cumplir al 100% en los cierres de planes de acción de Matriz de Riesgos por dirección.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: '(Total de planes de acción de mitigación de riesgos cerrados / Total de planes programados) * 100',
      variables_calculo: 'Planes de mitigación de riesgos ejecutados y cerrados vs programados por área.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Trimestral',
      meta_anual: '100%',
      linea_base: '100%',
      sentido_indicador: 'Ascendente',
      supuestos: 'Falta de recursos económicos, humanos y/o materiales.',
      distribucion_trimestral: { T1: '25%', T2: '25%', T3: '25%', T4: '25%' }
    },
    atributos_cremaa: {
      claridad: 'Permite la toma de decisiones preventivas',
      relevancia: 'Permite ver el avance en mitigación de riesgos del Organismo',
      economia: 'Reduce costos por contingencias y fallas operativas',
      monitoreable: 'Permite llevar un control del comportamiento de la matriz de riesgos',
      adecuado: 'Permite ver el nivel de exposición de cada una de las áreas',
      aportacion_marginal: 'Evita interrupciones en el servicio de agua potable y drenaje'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Matriz de Riesgos institucional y minutas de seguimiento trimestral',
      metodo_recopilacion: 'Informes de las Direcciones y validación del SGC'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Mtra. Mariana Pérez Chávez',
      cargo_titular: 'Coordinador del Sistema de Gestión de Calidad',
      fecha_elaboracion: '08 de Noviembre 2024',
      notas: 'Alineado con el módulo de Matriz de Riesgos del Portal SGC.'
    }
  },

  // Ficha 1.5: Acciones y Mejoras (Indicador #4 o Acciones/Planes)
  4: {
    archivo_origen: '1.5- Ficha técnica - Acciones y Mejoras.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua.',
      estrategia_pmd: 'Tratamiento oportuno de no conformidades y ejecución de proyectos de mejora continua.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Estado de acciones y mejoras',
      definicion_indicador: 'Lograr el 100% de cumplimiento de los tiempos de actividades en los planes de mejora (OOMRSC-21) y acciones correctivas (OOMRSC-20) derivado por auditoría e indicadores.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: 'Promedio de los porcentajes de cumplimiento en tiempo de los planes de mejora y acciones correctivas.',
      variables_calculo: 'Porcentaje de cumplimiento en tiempo de acciones correctivas y planes de mejora.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Mensual',
      meta_anual: '100%',
      linea_base: '100%',
      sentido_indicador: 'Ascendente',
      supuestos: 'Falta de recursos económicos, humanos y/o materiales.',
      distribucion_trimestral: { T1: '25%', T2: '25%', T3: '25%', T4: '25%' }
    },
    atributos_cremaa: {
      claridad: 'Permite la toma de decisiones inmediata sobre desvíos',
      relevancia: 'Permite ver el avance en cierre de no conformidades y mejoras',
      economia: 'Disminuye retrabajos y costos por mala calidad',
      monitoreable: 'Trazabilidad digital en folios OOMRSC-20 y OOMRSC-21',
      adecuado: 'Permite evaluar la proactividad de los encargados de proceso',
      aportacion_marginal: 'Asegura la satisfacción del usuario y el cumplimiento ISO 9001 § 10.2 / 10.3'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Formatos OOMRSC-20 (Acciones Correctivas) y OOMRSC-21 (Planes de Mejora)',
      metodo_recopilacion: 'Sistema de Gestión de Calidad (Portal SGC)'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Mtra. Mariana Pérez Chávez',
      cargo_titular: 'Coordinador del Sistema de Gestión de Calidad',
      fecha_elaboracion: '08 de Noviembre 2024',
      notas: 'Consolidación mensual de folios abiertos y cerrados con evidencia documental.'
    }
  },

  // Ficha 1.6: Auditorías Internas (Indicador #5)
  5: {
    archivo_origen: '1.6- Ficha Tecnica - Auditorías Internas.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y Ordenado',
      programa_pmd: 'Desarrollo con Servicios Públicos de Calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua.',
      estrategia_pmd: 'Evaluación periódica y sistemática de procesos conforme a ISO 19011 e ISO 9001 § 9.2.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Cumplimiento'
    },
    identificacion: {
      nombre_indicador: 'Lograr el grado de eficacia derivado de las auditorías internas',
      definicion_indicador: 'El Grado de eficacia del SGC determinado por auditorías internas debe ser igual o mayor al 85%.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: 'Promedio de los porcentajes de eficacia de los procesos del SGC derivado de auditorías internas.',
      variables_calculo: 'Porcentajes de cumplimiento normativo de los procesos evaluados en auditorías internas.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Bimestral',
      meta_anual: '85%',
      linea_base: '89%',
      sentido_indicador: 'Ascendente',
      supuestos: 'Falta de recursos económicos, humanos y/o materiales.',
      distribucion_trimestral: { T1: '20%', T2: '20%', T3: '20%', T4: '25%' }
    },
    atributos_cremaa: {
      claridad: 'Permite la toma de decisiones a corto plazo',
      relevancia: 'Permite ver el desempeño de indicadores y auditorías del Organismo.',
      economia: 'Aprovechamiento del equipo interno de auditores certificados',
      monitoreable: 'Permite llevar un control del comportamiento apegado al Sistema de Gestión de Calidad',
      adecuado: 'Permite ver el desempeño de cada una de las áreas del Organismo',
      aportacion_marginal: 'Previene hallazgos críticos en auditorías de órganos fiscalizadores externos'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Cuadro de Control de Desempeño de Procesos e Informes de Auditoría Interna',
      metodo_recopilacion: 'Informes de auditoría interna y bitácora del auditor líder'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Lic. Vicente Francisco Ivich Cambuston',
      cargo_titular: 'Auditor Líder de Calidad',
      fecha_elaboracion: '08 Noviembre 2024',
      notas: 'Programa anual de auditorías internas del SGC OOMAPASC.'
    }
  },

  // Ficha 2.1: Línea OOMAPASC - Llamadas (Indicador #70 o Atención Ciudadana)
  70: {
    archivo_origen: '2.1- Ficha técnica de indicador LLAMADAS.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y ordenado',
      programa_pmd: 'Desarrollos con servicios públicos de calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua',
      estrategia_pmd: 'Canalización digital e inmediata de reportes de agua y drenaje a cuadrillas operativas.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Informativo'
    },
    identificacion: {
      nombre_indicador: 'Atender las llamadas o mensajes de solicitud de usuarios',
      definicion_indicador: 'Atención telefónica o Mensajes de WhatsApp atendidos por Auxiliar telefónico.',
      tipo_indicador: 'Gestión',
      dimension: 'Eficacia',
      metodo_calculo: 'Sumatoria de llamadas y mensajes atendidos / sumatoria de llamadas y mensajes recibidos * 100',
      variables_calculo: 'Llamadas y mensajes recibidos, llamadas y mensajes atendidos por Auxiliar telefónico.',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Mensual',
      meta_anual: '95%',
      linea_base: '100%',
      sentido_indicador: 'Ascendente',
      supuestos: 'No contar con personal suficiente, fallas en el sistema telefónico o informático.',
      distribucion_trimestral: { T1: '24%', T2: '24%', T3: '24%', T4: '23%' }
    },
    atributos_cremaa: {
      claridad: 'Indica el número de llamadas atendidas',
      relevancia: 'Indica los sectores de la ciudad donde existen problemáticas a resolver',
      economia: 'Ahorro de tiempo para el ciudadano y menor saturación de módulos presenciales',
      monitoreable: 'Trazabilidad en números telefónicos y folios asignados.',
      adecuado: 'Atiende a los usuarios con solicitudes varias (fugas, drenajes, saldos, consumos)',
      aportacion_marginal: 'Canalización directa a los departamentos de Redes y Comercial'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Sistema Conrad, Aquaplus, Sistema TELMEX',
      metodo_recopilacion: 'CONRAD, Sistema TELMEX, WhatsApp y módulos.'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Alejandro Lara Domínguez',
      cargo_titular: 'Jefe de Línea OOMAPASC',
      fecha_elaboracion: '08 Noviembre 2024',
      notas: 'Atención telefónica 073 y canal de WhatsApp 24/7.'
    }
  },

  // Ficha 2.2: Línea OOMAPASC - Encuestas (Indicador #71 o Satisfacción)
  71: {
    archivo_origen: '2.2- Ficha técnica de indicador ENCUESTAS.docx',
    alineacion: {
      eje_rector_pmd: 'Cajeme Limpio y ordenado',
      programa_pmd: 'Desarrollos con servicios públicos de calidad',
      objetivo_pmd: 'Gestión Moderna y Eficiente del cobro del Agua',
      estrategia_pmd: 'Medición permanente de la percepción y satisfacción ciudadana sobre el servicio.',
      objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
      tipo_objetivo: 'Informativo'
    },
    identificacion: {
      nombre_indicador: 'Medir la satisfacción del cliente en atención recibida',
      definicion_indicador: 'Realizar encuestas por los auxiliares telefónicos a los usuarios atendidos para determinar la satisfacción con el trabajo realizado.',
      tipo_indicador: 'Estratégico',
      dimension: 'Eficacia',
      metodo_calculo: 'Total de encuestas con respuesta favorable / total de encuestas realizadas * 100',
      variables_calculo: 'Total de encuestas con respuesta favorable y Total de encuestas realizadas',
      unidad_medida: 'Porcentaje',
      frecuencia_medicion: 'Mensual',
      meta_anual: '95%',
      linea_base: '96%',
      sentido_indicador: 'Ascendente',
      supuestos: 'Falta de recursos, falta de personal.',
      distribucion_trimestral: { T1: '24%', T2: '24%', T3: '24%', T4: '23%' }
    },
    atributos_cremaa: {
      claridad: 'Indica el grado de satisfacción de los usuarios',
      relevancia: 'Permite conocer el grado de satisfacción de los usuarios por el servicio prestado',
      economia: 'Encuestas automatizadas y digitales sin costo de papelería',
      monitoreable: 'Trazabilidad en números telefónicos y folios asignados.',
      adecuado: 'Permite conocer el sentir de los usuarios por los servicios prestados',
      aportacion_marginal: 'Detección oportuna de quejas recurrentes para acciones correctivas'
    },
    caracteristicas_variables: {
      medios_verificacion: 'Intranet y Google Forms',
      metodo_recopilacion: 'Llamadas telefónicas, Google forms, Encuestas vía WhatsApp'
    },
    transversalidad: {
      genero_mujeres: true,
      genero_hombres: true,
      otro: 'No aplica'
    },
    informacion_adicional: {
      titular_unidad: 'Alejandro Lara Domínguez',
      cargo_titular: 'Jefe de Línea OOMAPASC',
      fecha_elaboracion: '08 Noviembre 2024',
      notas: 'Muestra representativa mensual de usuarios que reportaron incidencias.'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FORMATOS DE PRESENTACIÓN DE PROYECTOS (PRESUPUESTO DE EGRESOS 2026)
// ═══════════════════════════════════════════════════════════════════════════
export const PROYECTOS_PRESUPUESTO_EGRESOS = [
  {
    id: 'PP10-DIR-GRAL',
    clave_programa: 'PP10',
    nombre_programa: 'PP10 GESTIÓN Y FORTALECIMIENTO DEL OOMAPASC',
    unidad_responsable: 'DIRECCIÓN GENERAL',
    eje_rector_pmd: 'CAJEME LIMPIO Y ORDENADO',
    programa_pmd: 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD',
    tipo_proyecto: 'Operación Básica del Área',
    nombre_proyecto: 'Coordinar las funciones que ejercen las diversas direcciones para controlar y dirigir los procesos que integran al OOMAPAS de Cajeme.',
    resumen_ejecutivo: 'Contribuir a la mejora y el incremento de la infraestructura para el abastecimiento de agua potable, alcantarillado y saneamiento que demandan los distintos usos y usuarios, bajo principios de equidad social mediante el aseguramiento del desempeño operacional de las áreas del OOMAPAS de Cajeme en el cumplimiento de los objetivos del Organismo, a través de la mejora continua.',
    justificacion: 'El OOMAPAS de Cajeme es un organismo público al servicio de los habitantes del Municipio, que actúa con disciplina y profesionalismo aplicando altos estándares de calidad para proveer agua potable, alcantarillado y saneamiento, contribuyendo a mejorar la calidad de vida de la sociedad y el medio ambiente, bajo un esquema de cultura del cuidado y pago del agua.',
    objetivo: 'Coordinar las funciones que ejercen las direcciones para controlar y dirigir los procesos que integran al OOMAPAS de Cajeme.',
    fecha_inicio: '1 de enero 2026',
    fecha_conclusion: '31 de diciembre 2026',
    actividades_indicadores: [
      {
        actividad: 'Cumplir al 85% las metas establecidas por las direcciones adscritas a la Dirección General.',
        indicador: 'Cumplir las metas establecidas por las direcciones adscritas a la Dirección General',
        unidad_medida: 'Porcentaje',
        meta: '85%',
        trimestres: { t1: '20%', t2: '20%', t3: '20%', t4: '25%' }
      },
      {
        actividad: 'Mantener una relación de comunicación con el Consejo Consultivo para informar sobre la situación actual del Organismo, y consensuar temas de participación ciudadana.',
        indicador: 'Mantener una relación de comunicación con el Consejo Consultivo',
        unidad_medida: 'Actas',
        meta: '11 Actas',
        trimestres: { t1: '3', t2: '3', t3: '2', t4: '3' }
      },
      {
        actividad: 'Promover la mejora continua a través del sistema de gestión de calidad ISO 9001 y de los indicadores de eficiencia y desempeño en los términos del artículo 72 de la Ley.',
        indicador: 'Lograr el grado de eficacia del SGC determinado por auditorías e indicadores',
        unidad_medida: 'Porcentaje',
        meta: '85%',
        trimestres: { t1: '20%', t2: '20%', t3: '20%', t4: '25%' }
      },
      {
        actividad: 'Cumplir al 100% en los cierres de planes de acción de Matriz de Riesgos por dirección.',
        indicador: 'Cumplir en los cierres de planes de acción de Matriz de Riesgos',
        unidad_medida: 'Porcentaje',
        meta: '100%',
        trimestres: { t1: '25%', t2: '25%', t3: '25%', t4: '25%' }
      },
      {
        actividad: 'Lograr el 100% de cumplimiento en los tiempos de los planes de mejora y acciones correctivas.',
        indicador: 'Estado de acciones y mejoras',
        unidad_medida: 'Porcentaje',
        meta: '100%',
        trimestres: { t1: '25%', t2: '25%', t3: '25%', t4: '25%' }
      },
      {
        actividad: 'El Grado de eficacia del SGC determinado por auditorias debe ser igual o mayor al 85%.',
        indicador: 'Lograr el grado de eficacia derivado de las auditorías internas',
        unidad_medida: 'Porcentaje',
        meta: '85%',
        trimestres: { t1: '20%', t2: '20%', t3: '20%', t4: '25%' }
      }
    ],
    presupuesto_capitulos: {
      c1000: { capitulo: '1000 Servicios Personales', anual: 13124316, t1: 3296271, t2: 3276015, t3: 3276015, t4: 3276015 },
      c2000: { capitulo: '2000 Materiales y Suministros', anual: 378900, t1: 126900, t2: 84000, t3: 84000, t4: 84000 },
      c3000: { capitulo: '3000 Servicios Generales', anual: 1076396, t1: 231099, t2: 199099, t3: 415099, t4: 231099 },
      c4000: { capitulo: '4000 Transferencias, Asignaciones, Subsidios y Otras Ayudas', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c5000: { capitulo: '5000 Bienes Muebles, Inmuebles e Intangibles', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c7000: { capitulo: '7000 Inversiones Financ y Otras Provisiones', anual: 3000000, t1: 0, t2: 0, t3: 3000000, t4: 0 },
      total: { capitulo: 'Monto solicitado total', anual: 17579612, t1: 3654270, t2: 3559114, t3: 6775114, t4: 3591114 }
    },
    titular: 'LIC. LUIS ALBERTO RUIZ CORONADO',
    cargo_titular: 'DIRECTOR GENERAL'
  },
  {
    id: 'PP09-LINEA-OOMAPASC',
    clave_programa: 'PP09',
    nombre_programa: 'PP09. SERVICIO DE AGUA POTABLE, ALCANTARILLADO Y SANEAMIENTO',
    unidad_responsable: 'DIRECCIÓN GENERAL / LÍNEA OOMAPASC',
    eje_rector_pmd: 'CAJEME LIMPIO Y ORDENADO',
    programa_pmd: 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD',
    tipo_proyecto: 'Operación Básica del Área',
    nombre_proyecto: 'Atención telefónica y mensajería instantánea vía WhatsApp',
    resumen_ejecutivo: 'Línea OOMAPASC atiende a los usuarios a través de la atención telefónica canalizando su problemática al área correspondiente mediante un número de folio, ya sea área de redes como fugas de agua, reparaciones de descarga, anomalías y saneamiento correspondiente a drenajes tapados así mismo del área comercial como consulta de saldos, consumos, lecturas ofreciendo una atención de calidad al usuario.',
    justificacion: 'Ahorro de tiempo y la necesidad de atender a usuarios que por diferentes razones no pueden asistir a los módulos o sufren de alguna discapacidad física. Agilizando trámites, evitando saturación y aglomeraciones de espacios públicos y módulos de atención.',
    objetivo: 'Brindar atención telefónica y dar seguimiento a las solicitudes de la mayor cantidad de usuarios OOMAPAS de Cajeme.',
    fecha_inicio: '01-enero-2026',
    fecha_conclusion: '31-diciembre-2026',
    actividades_indicadores: [
      {
        actividad: 'Atención telefónica o medios electrónicos a usuarios.',
        indicador: 'Atender las llamadas o mensajes de solicitud de usuarios.',
        unidad_medida: 'Porcentaje',
        meta: '95%',
        trimestres: { t1: '24%', t2: '24%', t3: '24%', t4: '23%' }
      },
      {
        actividad: 'Toma de encuestas de satisfacción a usuario y calidad.',
        indicador: 'Medir la satisfacción del cliente en atención recibida.',
        unidad_medida: 'Porcentaje',
        meta: '95%',
        trimestres: { t1: '24%', t2: '24%', t3: '24%', t4: '23%' }
      }
    ],
    presupuesto_capitulos: {
      c1000: { capitulo: '1000 Servicios Personales', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c2000: { capitulo: '2000 Materiales y Suministros', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c3000: { capitulo: '3000 Servicios Generales', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c4000: { capitulo: '4000 Transferencias, Asignaciones, Subsidios y Otras Ayudas', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      c5000: { capitulo: '5000 Bienes Muebles, Inmuebles e Intangibles', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 },
      total: { capitulo: 'Monto solicitado total', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 }
    },
    titular: 'ALEJANDRO LARA DOMÍNGUEZ / LIC. LUIS ALBERTO RUIZ CORONADO',
    cargo_titular: 'JEFE DE LÍNEA OOMAPASC / DIRECTOR GENERAL'
  }
];

/**
 * Obtiene la Ficha Técnica Completa para CUALQUIERA de los 100 indicadores del catálogo OOMRSC-05.
 * Si el indicador tiene ficha oficial municipal específica en FICHAS_TECNICAS_DETALLADAS la usa,
 * y en caso contrario genera dinámicamente la ficha técnica estructurada al 100% con los criterios CREMAA.
 */
export function obtenerFichaTecnicaIndicador(indicador, customFichasData = {}) {
  if (!indicador) return null;
  const idNum = Number(indicador.numero !== undefined ? indicador.numero : indicador.id);

  // 1. Verificar si hay datos guardados personalizados por el usuario
  const custom = customFichasData?.[idNum];

  // 2. Verificar si hay ficha base en el extracto oficial
  const baseDetallada = FICHAS_TECNICAS_DETALLADAS[idNum];

  // Metas trimestrales
  const t1 = indicador.metas_trimestrales?.T1 ?? 25;
  const t2 = indicador.metas_trimestrales?.T2 ?? 25;
  const t3 = indicador.metas_trimestrales?.T3 ?? 25;
  const t4 = indicador.metas_trimestrales?.T4 ?? 25;
  const unidad = indicador.unidad || 'Porcentaje';
  const metaTxt = `${indicador.meta_anual || indicador.meta || 100} ${unidad === 'Porcentaje' ? '%' : unidad}`;

  const defaultAlineacion = {
    eje_rector_pmd: CONFIG_AYUNTAMIENTO_CAJEME.eje_rector_defecto,
    programa_pmd: CONFIG_AYUNTAMIENTO_CAJEME.programa_pmd_defecto,
    objetivo_pmd: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_pmd_defecto,
    estrategia_pmd: `Monitoreo continuo y aseguramiento de la calidad en los procesos de ${indicador.area || indicador.proceso}`,
    objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
    tipo_objetivo: indicador.impacto === 'Alto' ? 'Estratégico' : (unidad === 'Porcentaje' ? 'Cumplimiento' : 'Gestión')
  };

  const defaultIdentificacion = {
    nombre_indicador: indicador.nombre,
    definicion_indicador: `Medir y controlar el desempeño del indicador #${idNum} (${indicador.nombre}) asignado al proceso de ${indicador.proceso} en el área de ${indicador.area}.`,
    tipo_indicador: indicador.impacto === 'Alto' ? 'Estratégico' : 'Gestión',
    dimension: 'Eficacia',
    metodo_calculo: indicador.unidad === 'Porcentaje' 
      ? `(Valor real obtenido / Meta programada de ${indicador.meta_anual || indicador.meta}) * 100`
      : `Sumatoria mensual de ${indicador.unidad} registrados en el período evaluado`,
    variables_calculo: `Valores capturados en el Cuadro de Control OOMRSC-05 y registros operativos del área de ${indicador.area}.`,
    unidad_medida: indicador.unidad || 'Porcentaje',
    frecuencia_medicion: indicador.periodicidad || 'Mensual',
    meta_anual: metaTxt,
    linea_base: metaTxt,
    sentido_indicador: indicador.es_menor ? 'Descendente' : 'Ascendente',
    supuestos: 'Falta de recursos materiales, fallas mecánicas/eléctricas o contingencias climatológicas en el municipio de Cajeme.',
    distribucion_trimestral: {
      T1: `${t1}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
      T2: `${t2}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
      T3: `${t3}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
      T4: `${t4}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`
    }
  };

  const defaultCREMAA = {
    claridad: `Permite evaluar de manera precisa el desempeño del proceso de ${indicador.proceso}`,
    relevancia: `Indispensable para el control operativo, satisfacción ciudadana y rendición de cuentas en ${indicador.area}`,
    economia: 'Generación digital mediante el Portal SGC y sistemas comerciales/operativos sin costo extra',
    monitoreable: `Trazabilidad auditable en el formato institucional OOMRSC-05 y bitácora del sistema`,
    adecuado: `Refleja fielmente la capacidad institucional del área de ${indicador.area}`,
    aportacion_marginal: 'Alineado a los compromisos del Plan Municipal de Desarrollo y la norma ISO 9001:2015'
  };

  const defaultVariables = {
    medios_verificacion: `Cuadro de Control de Desempeño OOMRSC-05, bitácoras operativas del área de ${indicador.area} y reportes del sistema.`,
    metodo_recopilacion: `Reporte mensual del encargado del área de ${indicador.area} y consolidación en el Portal SGC.`
  };

  const defaultTransversalidad = {
    genero_mujeres: true,
    genero_hombres: true,
    otro: 'No aplica'
  };

  const defaultInfoAdicional = {
    titular_unidad: `Encargado de ${indicador.area}`,
    cargo_titular: `Titular del Área de ${indicador.area}`,
    fecha_elaboracion: '08 de Noviembre 2024',
    notas: 'Alineado al Cuadro de Control Oficial OOMRSC-05 y Presupuesto de Egresos.'
  };

  return {
    indicador_id: idNum,
    indicador_numero: idNum,
    indicador_original: indicador,
    alineacion: {
      ...defaultAlineacion,
      ...(baseDetallada?.alineacion || {}),
      ...(custom?.alineacion || {})
    },
    identificacion: {
      ...defaultIdentificacion,
      ...(baseDetallada?.identificacion || {}),
      ...(custom?.identificacion || {})
    },
    atributos_cremaa: {
      ...defaultCREMAA,
      ...(baseDetallada?.atributos_cremaa || {}),
      ...(custom?.atributos_cremaa || {})
    },
    caracteristicas_variables: {
      ...defaultVariables,
      ...(baseDetallada?.caracteristicas_variables || {}),
      ...(custom?.caracteristicas_variables || {})
    },
    transversalidad: {
      ...defaultTransversalidad,
      ...(baseDetallada?.transversalidad || {}),
      ...(custom?.transversalidad || {})
    },
    informacion_adicional: {
      ...defaultInfoAdicional,
      ...(baseDetallada?.informacion_adicional || {}),
      ...(custom?.informacion_adicional || {})
    }
  };
}
