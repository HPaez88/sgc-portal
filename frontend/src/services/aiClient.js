/**
 * aiClient.js — Motor Unificado de Inteligencia Artificial para el SGC Portal (OOMAPASC)
 * 
 * Estrategia multi-capa (Zero-Failure Guarantee):
 * 1. Intento primario: Backend FastAPI (/api/v1/ai/generar-json)
 * 2. Nivel de respaldo (Offline): Generador Experto de Calidad ISO 9001
 *
 * Garantiza que las Acciones Correctivas y Planes de Mejora NUNCA fallen.
 *
 * SEGURIDAD: la clave de Groq vive únicamente en el backend (variable de entorno
 * GROQ_API_KEY). El cliente NUNCA llama a api.groq.com directamente: cualquier
 * clave embebida en el bundle queda expuesta a cualquiera que abra el sitio.
 */
import { api } from './apiClient';

const GROQ_MODELS = ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

/**
 * Limpia y extrae JSON seguro de cualquier texto (incluso con markdown o think tags)
 */
function extraerJsonSeguro(texto) {
  if (!texto || typeof texto !== 'string') return null;
  
  // Eliminar bloques <think> de modelos razonadores
  let limpio = texto.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  
  // Eliminar bloques de código markdown ```json ... ```
  limpio = limpio.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();
  
  // Buscar primer objeto JSON
  const match = limpio.match(/\{[\s\S]*\}/);
  if (!match) return null;
  
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.warn('Error al parsear bloque JSON extraído:', e);
    return null;
  }
}

/**
 * Llamada a la IA a través del backend.
 *
 * El backend es el único que conoce GROQ_API_KEY. Si el backend no responde,
 * se retorna null y el llamador usa el generador experto offline.
 */
async function llamarGroqDirecto(prompt, systemContext) {
  const { ok, data } = await api.post('/api/v1/ai/generar-json', {
    prompt,
    context: systemContext
      || 'Eres un auditor líder y experto en ISO 9001:2015 del Organismo Operador de Agua (OOMAPASC). Responde ÚNICAMENTE en JSON válido.',
  });

  if (!ok) {
    console.warn('El servicio de IA del backend no respondió; se usará el generador local.');
    return null;
  }

  // El backend puede devolver el objeto ya parseado o el texto crudo.
  if (data && typeof data === 'object' && !data.choices) return data;
  const contenido = data?.choices?.[0]?.message?.content ?? (typeof data === 'string' ? data : null);
  return extraerJsonSeguro(contenido);
}

/**
 * Generador Experto Offline para Acciones Correctivas (OOMRSC-20)
 * Diseñado conforme a la norma ISO 9001:2015 y procedimientos de OOMAPASC.
 */
function generarAccionOffline(form, equipo) {
  const desc = (form.descripcion_no_conformidad_original || '').toLowerCase();
  const area = form.area || 'Operación';
  const proceso = form.proceso || 'Distribución y Mantenimiento';
  
  // Detectar contexto específico
  let tipoTema = 'procedimiento';
  if (desc.includes('cloro') || desc.includes('agua') || desc.includes('pozo') || desc.includes('bombeo')) {
    tipoTema = 'potabilizacion';
  } else if (desc.includes('fuga') || desc.includes('tuberia') || desc.includes('red') || desc.includes('alcantarillado') || desc.includes('drenaje')) {
    tipoTema = 'redes';
  } else if (desc.includes('factura') || desc.includes('cobro') || desc.includes('usuario') || desc.includes('recibo') || desc.includes('medidor')) {
    tipoTema = 'comercial';
  } else if (desc.includes('compra') || desc.includes('proveedor') || desc.includes('material') || desc.includes('almacen')) {
    tipoTema = 'compras';
  }

  // Responsables
  const respPrincipal = equipo.find(e => e.es_responsable_principal)?.nombre || equipo[0]?.nombre || 'Coordinador del Área';
  const respApoyo = equipo[1]?.nombre || 'Responsable de Aseguramiento de Calidad';
  const respExterno = equipo[2]?.nombre || 'Auditor Interno SGC';

  // Fechas relativas
  const hoy = new Date();
  const fechaInmediata = new Date(hoy.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const fechaAct1 = new Date(hoy.getTime() + (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const fechaAct2 = new Date(hoy.getTime() + (20 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const fechaAct3 = new Date(hoy.getTime() + (35 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  const plantillas = {
    potabilizacion: {
      descMejorada: `Desviación en parámetros de control de potabilización respecto a especificaciones normativas. Evidencia: ${form.descripcion_no_conformidad_original}. Requisito ISO 9001:2015 §8.5.1 (Control de la producción y provisión del servicio).`,
      accionContenedora: 'Ajuste inmediato de dosificación y verificación física de reactivos en estación de bombeo con toma de muestra testigo.',
      actInmediata: 'Calibración emergente de equipos de medición y monitoreo analítico en línea.',
      causas: [
        { numero: 1, causa: 'Ausencia de calibración periódica programada en sensores de monitoreo continuo', puntuacion_sugerida: 85, porcentaje_sugerido: 50, es_causa_principal: true },
        { numero: 2, causa: 'Variación en la calidad o concentración de reactivos entregados por el proveedor', puntuacion_sugerida: 45, porcentaje_sugerido: 25, es_causa_principal: false },
        { numero: 3, causa: 'Falta de capacitación del operador de turno en la bitácora de muestreo emergente', puntuacion_sugerida: 25, porcentaje_sugerido: 15, es_causa_principal: false },
        { numero: 4, causa: 'Procedimiento de supervisión no especifica tolerancias de ajuste rápido', puntuacion_sugerida: 15, porcentaje_sugerido: 10, es_causa_principal: false }
      ],
      actividades: [
        { actividad: 'Revisión y calibración integral de instrumentos de dosificación con reporte de laboratorio', responsable: respPrincipal, indicador_progreso: 'Certificado de calibración emitido', fecha_termino_sugerida: fechaAct1, evidencia_esperada: 'Reporte de calibración y análisis fisicoquímico' },
        { actividad: 'Actualizar la instrucción de trabajo IT-POT-02 con rangos de tolerancia y ajustes por turno', responsable: respApoyo, indicador_progreso: 'Procedimiento formalizado en SGC', fecha_termino_sugerida: fechaAct2, evidencia_esperada: 'Documento firmado y cargado al catálogo' },
        { actividad: 'Capacitación y evaluación práctica a operadores de planta en protocolo de contingencia', responsable: respExterno, indicador_progreso: '100% personal de turno evaluado', fecha_termino_sugerida: fechaAct3, evidencia_esperada: 'Lista de asistencia y evaluaciones aprobadas' }
      ]
    },
    redes: {
      descMejorada: `Incumplimiento en tiempo de respuesta y atención a reportes de fugas en red de distribución. Hallazgo: ${form.descripcion_no_conformidad_original}. Requisito ISO 9001:2015 §8.2.1 y §8.5.1.`,
      accionContenedora: 'Despacho de cuadrilla de guardia para contención y seccionamiento de válvula para mitigar el derrame de agua.',
      actInmediata: 'Reparación emergente de la línea afectada y restablecimiento del suministro en el sector.',
      causas: [
        { numero: 1, causa: 'Falta de trazabilidad y priorización en el sistema de órdenes de servicio de campo', puntuacion_sugerida: 80, porcentaje_sugerido: 45, es_causa_principal: true },
        { numero: 2, causa: 'Desabasto temporal de abrazaderas y refacciones de reposición inmediata en almacén', puntuacion_sugerida: 50, porcentaje_sugerido: 30, es_causa_principal: false },
        { numero: 3, causa: 'Falta de comunicación directa entre el centro de atención telefónica y cuadrillas operativas', puntuacion_sugerida: 30, porcentaje_sugerido: 15, es_causa_principal: false },
        { numero: 4, causa: 'Presiones elevadas en la red hidráulica durante horario nocturno', puntuacion_sugerida: 15, porcentaje_sugerido: 10, es_causa_principal: false }
      ],
      actividades: [
        { actividad: 'Implementar checklist de inventario mínimo de refacciones críticas para reparación de fugas', responsable: respPrincipal, indicador_progreso: 'Stock crítico restablecido al 100%', fecha_termino_sugerida: fechaAct1, evidencia_esperada: 'Vale de almacén y reporte de existencias' },
        { actividad: 'Estandarizar el protocolo de canalización de reportes urgentes entre Aquacall y Cuadrillas', responsable: respApoyo, indicador_progreso: 'Protocolo de coordinación aprobado', fecha_termino_sugerida: fechaAct2, evidencia_esperada: 'Instrucción de trabajo difundida y firmada' },
        { actividad: 'Verificación en campo de los tiempos de respuesta durante 30 días consecutivos', responsable: respExterno, indicador_progreso: 'Reducción de tiempo de atención a < 24 hrs', fecha_termino_sugerida: fechaAct3, evidencia_esperada: 'Reporte mensual de métricas de servicio' }
      ]
    },
    comercial: {
      descMejorada: `Discrepancia en proceso de lectura, facturación o atención a aclaraciones comerciales. Hallazgo: ${form.descripcion_no_conformidad_original}. Requisito ISO 9001:2015 §8.2.3.`,
      accionContenedora: 'Revisión y refacturación del caso en ventanilla de atención personalizada al usuario.',
      actInmediata: 'Inspección técnica física del medidor y verificación de lectura real en predio.',
      causas: [
        { numero: 1, causa: 'Falta de validación previa de lecturas atípicas antes de emitir la facturación mensual', puntuacion_sugerida: 80, porcentaje_sugerido: 50, es_causa_principal: true },
        { numero: 2, causa: 'Medidores antiguos con desgaste que generan variaciones de lectura', puntuacion_sugerida: 40, porcentaje_sugerido: 25, es_causa_principal: false },
        { numero: 3, causa: 'Procedimiento de aclaraciones no establece tiempos límites de resolución en sistema', puntuacion_sugerida: 25, porcentaje_sugerido: 15, es_causa_principal: false },
        { numero: 4, causa: 'Capacitación insuficiente a personal de nuevo ingreso en cajas', puntuacion_sugerida: 15, porcentaje_sugerido: 10, es_causa_principal: false }
      ],
      actividades: [
        { actividad: 'Configurar filtro automático en el sistema comercial para bloquear consumos con variación >50%', responsable: respPrincipal, indicador_progreso: 'Algoritmo de alerta implementado', fecha_termino_sugerida: fechaAct1, evidencia_esperada: 'Captura de pantalla de configuración y prueba' },
        { actividad: 'Auditoría a ruta de lectura con inspección visual de medidores del sector', responsable: respApoyo, indicador_progreso: '100% de tomas auditadas', fecha_termino_sugerida: fechaAct2, evidencia_esperada: 'Acta de supervisión de campo' },
        { actividad: 'Taller de actualización al personal de atención y cajas sobre catálogo de servicios', responsable: respExterno, indicador_progreso: 'Personal acreditado', fecha_termino_sugerida: fechaAct3, evidencia_esperada: 'Lista de asistencia y evaluación' }
      ]
    },
    procedimiento: {
      descMejorada: `Incumplimiento documentado en controles operativos y registros de calidad del proceso de ${proceso}. Evidencia: ${form.descripcion_no_conformidad_original}. Requisito ISO 9001:2015 §7.5 (Información documentada) y §10.2 (No conformidad y acción correctiva).`,
      accionContenedora: 'Revisión y rescate de la información faltante con validación del titular del área.',
      actInmediata: 'Establecer formato provisional validado para asegurar la continuidad del control del proceso.',
      causas: [
        { numero: 1, causa: 'Procedimiento operativo no refleja los pasos actuales de ejecución del área', puntuacion_sugerida: 85, porcentaje_sugerido: 50, es_causa_principal: true },
        { numero: 2, causa: 'Omisión de supervisión y firma de bitácora en los cambios de turno', puntuacion_sugerida: 45, porcentaje_sugerido: 25, es_causa_principal: false },
        { numero: 3, causa: 'Falta de difusión formal de las revisiones vigentes del documento en el SGC', puntuacion_sugerida: 30, porcentaje_sugerido: 15, es_causa_principal: false },
        { numero: 4, causa: 'Formatos físicos no estandarizados disponibles en el punto de trabajo', puntuacion_sugerida: 15, porcentaje_sugerido: 10, es_causa_principal: false }
      ],
      actividades: [
        { actividad: `Actualizar y alinear el procedimiento formal del proceso de ${proceso}`, responsable: respPrincipal, indicador_progreso: 'Procedimiento revisado y aprobado', fecha_termino_sugerida: fechaAct1, evidencia_esperada: 'Procedimiento formal en el portal SGC' },
        { actividad: 'Difundir la versión vigente al personal involucrado mediante sesión presencial', responsable: respApoyo, indicador_progreso: 'Personal del área capacitado', fecha_termino_sugerida: fechaAct2, evidencia_esperada: 'Minuta de reunión y lista de firmas' },
        { actividad: 'Monitoreo de cumplimiento del registro durante dos meses por calidad', responsable: respExterno, indicador_progreso: '0 incidencias en auditoría de seguimiento', fecha_termino_sugerida: fechaAct3, evidencia_esperada: 'Reporte de verificación de auditor interno' }
      ]
    }
  };

  const seleccion = plantillas[tipoTema] || plantillas.procedimiento;

  return {
    registro: {
      descripcion_no_conformidad_mejorada: seleccion.descMejorada,
      impacta_otros_procesos: form.impacta_otros_procesos || 'NO',
      otros_procesos_afectados: form.otros_procesos_afectados || ''
    },
    analisis: {
      accion_contenedora: seleccion.accionContenedora,
      actividad_inmediata: {
        actividad: seleccion.actInmediata,
        responsable: respPrincipal,
        fecha_sugerida: fechaInmediata
      },
      herramienta_analisis: 'Lluvia de ideas / Ishikawa',
      causas: seleccion.causas,
      requiere_actualizar_matriz_riesgos: 'SI',
      descripcion_riesgo_oportunidad: `Riesgo de recurrencia en ${proceso} por desactualización de controles o fallas en el seguimiento preventivo.`
    },
    actividades: {
      causa_principal: seleccion.causas[0].causa,
      requiere_cambio_sgc: 'SI',
      actividades_correctivas: seleccion.actividades
    }
  };
}

/**
 * Generador Experto Offline para Planes de Mejora (OOMRSC-21)
 */
function generarPlanMejoraOffline(descripcion, area = 'Organismo Operador', proceso = 'Mejora Continua') {
  const desc = (descripcion || '').toLowerCase();
  const hoy = new Date();
  const f1 = new Date(hoy.getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const f2 = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const f3 = new Date(hoy.getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  let categoria = 'Eficiencia Operativa';
  if (desc.includes('usuario') || desc.includes('cliente') || desc.includes('atencion')) {
    categoria = 'Servicio al Usuario';
  } else if (desc.includes('energia') || desc.includes('costo') || desc.includes('gasto') || desc.includes('ahorro')) {
    categoria = 'Optimización de Recursos y Ahorro';
  } else if (desc.includes('sistema') || desc.includes('digital') || desc.includes('software')) {
    categoria = 'Innovación Tecnológica';
  }

  return {
    titulo_mejora: `Optimización y Eficiencia en ${proceso} — SGC 2026`,
    categoria_mejora: categoria,
    beneficios: `Mejora en tiempos de ciclo, trazabilidad digital conforme a ISO 9001:2015, reducción de retrabajos e incremento en la satisfacción del ciudadano.`,
    situacion_deseada: `Lograr un desempeño superior al 90% en los indicadores del proceso, con controles estandarizados y registros digitales auditables en tiempo real.`,
    integrantes: [
      { nombre: 'Líder del Proyecto de Mejora', puesto: 'Coordinador del Área', rol: 'Responsable General' },
      { nombre: 'Analista de Procesos SGC', puesto: 'Especialista de Calidad', rol: 'Facilitador Metodológico' },
      { nombre: 'Responsable Operativo', puesto: 'Supervisor de Área', rol: 'Ejecutor de Campo' }
    ],
    actividades: [
      {
        actividad: 'Diagnóstico detallado y mapeo de cuellos de botella en el proceso actual',
        responsable: 'Líder del Proyecto de Mejora',
        indicador: 'Diagrama de flujo AS-IS validado',
        fecha_termino_sugerida: f1,
        evidencia_esperada: 'Reporte de diagnóstico firmado'
      },
      {
        actividad: 'Diseño e implementación de la nueva metodología estandarizada',
        responsable: 'Analista de Procesos SGC',
        indicador: 'Procedimiento actualizado y formatos emitidos',
        fecha_termino_sugerida: f2,
        evidencia_esperada: 'Documentación aprobada en portal SGC'
      },
      {
        actividad: 'Medición de resultados y evaluación de efectividad del plan de mejora',
        responsable: 'Responsable Operativo',
        indicador: 'Incremento medible vs línea base',
        fecha_termino_sugerida: f3,
        evidencia_esperada: 'Reporte final de desempeño y comparativa de indicadores'
      }
    ]
  };
}

/**
 * Función Maestra: Generar Propuesta de Acción Correctiva con Fallback Garantizado
 */
export async function generarPropuestaACInfalible(form, equipo) {
  const prompt = `Eres asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.
Genera una propuesta de Acción Correctiva conforme al formato oficial OOMRSC-20 Rev. 18.
Área: ${form.area}
Proceso: ${form.proceso}
Origen: ${form.origen}
Descripción de no conformidad: ${form.descripcion_no_conformidad_original}
Equipo: ${JSON.stringify(equipo.filter(e => e.nombre?.trim()).map(e => ({nombre: e.nombre, puesto: e.puesto, rol: e.rol})))}

Responde ESTRICTAMENTE con JSON válido con esta estructura:
{
  "registro": {
    "descripcion_no_conformidad_mejorada": "",
    "impacta_otros_procesos": "NO",
    "otros_procesos_afectados": ""
  },
  "analisis": {
    "accion_contenedora": "",
    "actividad_inmediata": { "actividad": "", "responsable": "", "fecha_sugerida": "" },
    "herramienta_analisis": "Lluvia de ideas",
    "causas": [
      { "numero": 1, "causa": "", "puntuacion_sugerida": 80, "porcentaje_sugerido": 50, "es_causa_principal": true },
      { "numero": 2, "causa": "", "puntuacion_sugerida": 40, "porcentaje_sugerido": 25, "es_causa_principal": false },
      { "numero": 3, "causa": "", "puntuacion_sugerida": 20, "porcentaje_sugerido": 15, "es_causa_principal": false },
      { "numero": 4, "causa": "", "puntuacion_sugerida": 10, "porcentaje_sugerido": 10, "es_causa_principal": false }
    ],
    "requiere_actualizar_matriz_riesgos": "SI",
    "descripcion_riesgo_oportunidad": ""
  },
  "actividades": {
    "causa_principal": "",
    "requiere_cambio_sgc": "SI",
    "actividades_correctivas": [
      { "actividad": "", "responsable": "", "indicador_progreso": "", "fecha_termino_sugerida": "", "evidencia_esperada": "" }
    ]
  }
}`;

  // Intentar IA vía backend. El backend es el único que conoce la clave de Groq;
  // el cliente nunca llama a api.groq.com. Si falla, se usa el motor experto local.
  try {
    const cloudResult = await llamarGroqDirecto(prompt);
    if (cloudResult?.registro && cloudResult?.analisis && cloudResult?.actividades) {
      return cloudResult;
    }
  } catch (err) {
    console.info('IA del backend no disponible, activando Motor SGC Experto Offline...', err.message);
  }
  // Respaldo: motor experto local, siempre responde con datos de calidad industrial.
  return generarAccionOffline(form, equipo);
}

/**
 * Función Maestra: Generar Plan de Mejora con Fallback Garantizado
 */
export async function generarPlanMejoraInfalible(descripcion, area = '', proceso = '') {
  const prompt = `Eres asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.
Genera una propuesta de Plan de Mejora conforme al formato OOMRSC-21 basada en: "${descripcion}".
Área: ${area}, Proceso: ${proceso}.

Responde estrictamente con JSON válido:
{
  "titulo_mejora": "",
  "categoria_mejora": "",
  "beneficios": "",
  "situacion_deseada": "",
  "integrantes": [
    { "nombre": "Por definir", "puesto": "Coordinador", "rol": "Responsable General" }
  ],
  "actividades": [
    { "actividad": "", "indicador": "", "responsable": "Por definir", "fecha_termino_sugerida": "", "evidencia_esperada": "" }
  ]
}`;

  // Intentar IA vía backend. El backend es el único que conoce la clave de Groq;
  // el cliente nunca llama a api.groq.com. Si falla, se usa el motor experto local.
  try {
    const cloudResult = await llamarGroqDirecto(prompt);
    if (cloudResult?.titulo_mejora && cloudResult?.actividades) {
      return cloudResult;
    }
  } catch (err) {
    console.info('IA del backend no disponible para PM, activando Motor SGC Experto Offline...', err.message);
  }

  // Respaldo: motor experto local, siempre responde.
  return generarPlanMejoraOffline(descripcion, area, proceso);
}
