// ═══════════════════════════
// SERVICIO DE FLUJO INTER-MÓDULOS DEL SGC
// Convierte los módulos en un sistema conectado (ISO 9001:2015):
//   Indicador no cumplido  → Acción Correctiva   (§9.1.3 → §10.2)
//   Auditoría / hallazgo   → Acción Correctiva   (§9.2 → §10.2)
//   Riesgo sin plan        → Plan de Mejora      (§6.1 → §10.3)
//   Documento crítico      → Acción Correctiva   (§7.5.3 → §10.2)
// Toda la lógica de precarga vive aquí para no duplicarla en cada vista.
// ═══════════════════════════

/** Genera un folio de borrador legible y único por módulo. */
export function folioBorrador(prefijo, origen) {
  const ahora = new Date();
  const anio = String(ahora.getFullYear()).slice(-2);
  const secuencia = String(ahora.getTime()).slice(-5);
  return `${prefijo}-${origen}-${anio}${secuencia}`;
}

/** Fecha ISO (YYYY-MM-DD) a N días de hoy. */
export function fechaEnDias(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split('T')[0];
}

/** Estructura base de una AC en borrador, alineada con el formato OOMRSC-20. */
function baseAccionCorrectiva(overrides = {}) {
  const hoy = new Date().toISOString();
  return {
    id: Date.now(),
    folio_codigo: folioBorrador('AC', overrides.origen_tipo || 'SGC'),
    folio: null,
    estado: 'BORRADOR',
    fecha_creacion_borrador: hoy,
    fecha_apertura: hoy.split('T')[0],
    fecha_cierre_estimada: fechaEnDias(180),
    generado_por: 'SGC Portal',
    equipo_json: '[]',
    causas_json: '[]',
    actividades_json: '[]',
    actividades_contenedoras: [],
    procesos_afectados: '',
    impacta_otros_procesos: false,
    actualiza_matriz_riesgos: false,
    requiere_cambio_sgc: 'NO',
    // Campos de vínculo inter-módulo (trazabilidad del origen)
    origen_modulo: null,
    origen_referencia: null,
    ...overrides,
  };
}

/** Estructura base de un PM en borrador, alineada con el formato OOMRSC-21. */
function basePlanMejora(overrides = {}) {
  const hoy = new Date().toISOString();
  return {
    id: Date.now(),
    folio_codigo: folioBorrador('PM', overrides.origen_tipo || 'SGC'),
    folio: null,
    estado: 'BORRADOR',
    fecha_creacion_borrador: hoy,
    fecha_elaboracion: hoy.split('T')[0],
    fecha_cierre_estimada: fechaEnDias(180),
    generado_por: 'SGC Portal',
    integrantes_json: '[]',
    actividades_json: '[]',
    presupuesto: 0,
    origen_modulo: null,
    origen_referencia: null,
    ...overrides,
  };
}

/**
 * ACCIÓN CORRECTIVA desde un INDICADOR fuera de meta o sin captura.
 * Origen ISO: 9.1.3 Análisis y evaluación → 10.2 No conformidad y acción correctiva.
 */
export function acDesdeIndicador(indicador, { cumplimiento = null, anio = null, meses = [] } = {}) {
  const meta = indicador?.meta ?? 'N/D';
  const unidad = indicador?.unidad || '';
  const estadoTexto = cumplimiento === null
    ? 'sin captura de resultados'
    : `con cumplimiento de ${cumplimiento}% frente a la meta de ${meta} ${unidad}`.trim();

  return baseAccionCorrectiva({
    origen: 'Indicador',
    origen_tipo: 'IND',
    area: indicador?.area || '',
    proceso: indicador?.proceso || '',
    direccion: indicador?.direccion || '',
    descripcion_no_conformidad_original:
      `Incumplimiento del indicador "${indicador?.nombre || 'sin nombre'}" (${estadoTexto}). `
      + `Periodo evaluado: ${meses.length ? meses.join(', ') : 'N/D'} ${anio || ''}`.trim(),
    evidencia:
      `Registro del indicador "${indicador?.nombre || ''}" en el módulo de Indicadores del SGC. `
      + `Meta: ${meta} ${unidad}. Cumplimiento calculado: ${cumplimiento === null ? 'sin datos' : `${cumplimiento}%`}.`,
    accion_contenedora:
      `Notificar al responsable del área ${indicador?.area || ''} y revisar la causa del desvío del indicador.`,
    origen_modulo: 'INDICADORES',
    origen_referencia: String(indicador?.id ?? ''),
  });
}

/**
 * ACCIÓN CORRECTIVA desde un HALLAZGO / NO CONFORMIDAD DE AUDITORÍA.
 * Origen ISO: 9.2 Auditoría interna → 10.2 No conformidad y acción correctiva.
 */
export function acDesdeAuditoria(auditoria, hallazgo = {}) {
  const numero = auditoria?.numero || auditoria?.folio || 'S/A';
  const descripcion = hallazgo.descripcion || hallazgo.hallazgo || '';

  return baseAccionCorrectiva({
    origen: 'Auditoría',
    origen_tipo: 'AUD',
    numero_auditoria: numero,
    area: hallazgo.area || auditoria?.area || '',
    proceso: hallazgo.proceso || auditoria?.proceso || '',
    direccion: hallazgo.direccion || auditoria?.direccion || '',
    descripcion_no_conformidad_original:
      descripcion || `Hallazgo detectado en la auditoría ${numero} (${auditoria?.tipo || 'Interna'}).`,
    evidencia:
      hallazgo.evidencia
      || `Informe de auditoría ${numero}, con fecha ${auditoria?.fecha_fin || auditoria?.fecha_inicio || 'N/D'}.`,
    accion_contenedora: 'Contener el hallazgo y documentar la evidencia en el expediente de la auditoría.',
    origen_modulo: 'AUDITORIAS',
    origen_referencia: String(auditoria?.id ?? numero),
  });
}

/**
 * ACCIÓN CORRECTIVA desde un DOCUMENTO con impacto crítico.
 * Origen ISO: 7.5.3 Control de la información documentada → 10.2.
 */
export function acDesdeDocumento(doc, impacto = {}) {
  return baseAccionCorrectiva({
    origen: 'Proceso',
    origen_tipo: 'DOC',
    area: doc?.area || '',
    descripcion_no_conformidad_original:
      `Incumplimiento de control documental (ISO 9001:2015 § 7.5.3) asociado al documento `
      + `[${doc?.clave || ''}] ${doc?.titulo || ''}. `
      + `Es citado por ${impacto?.cantidadUsos ?? 0} documento(s) del catálogo.`,
    evidencia:
      `Matriz de trazabilidad documental del SGC. Documentos dependientes: `
      + `${(impacto?.utilizadoEn || []).map(u => u.clave).join(', ') || 'ninguno'}.`,
    accion_contenedora: 'Suspender cambios sobre el documento y evaluar el impacto en la trazabilidad antes de actuar.',
    requiere_cambio_sgc: 'SI',
    origen_modulo: 'DOCUMENTOS',
    origen_referencia: String(doc?.clave ?? ''),
  });
}

/**
 * PLAN DE MEJORA desde un RIESGO sin plan de acción.
 * Origen ISO: 6.1 Riesgos y oportunidades → 10.3 Mejora continua.
 */
export function pmDesdeRiesgo(riesgo) {
  const nivel = (Number(riesgo?.probabilidad) || 0) * (Number(riesgo?.impacto) || 0);

  return basePlanMejora({
    origen: 'Objetivo de Calidad',
    origen_tipo: 'RIE',
    gerencia_coordinacion: riesgo?.area || '',
    direccion: riesgo?.direccion || '',
    proceso: riesgo?.proceso || '',
    titulo_mejora:
      `Mitigación del riesgo: ${(riesgo?.riesgo || 'sin descripción').slice(0, 90)}`,
    descripcion_situacion_actual:
      `Riesgo identificado en la matriz: "${riesgo?.riesgo || ''}". `
      + `Causa: ${riesgo?.causa || 'por determinar'}. Efecto: ${riesgo?.efecto || 'por determinar'}. `
      + `Nivel de exposición (probabilidad × impacto): ${nivel}. Sin plan de acción definido.`,
    situacion_deseada:
      `Riesgo controlado con plan de acción implementado y seguimiento documentado, `
      + `reduciendo la exposición por debajo del umbral aceptable del SGC.`,
    beneficios:
      `Reducción de la probabilidad y el impacto del riesgo "${riesgo?.riesgo || ''}" `
      + `sobre los procesos del área ${riesgo?.area || ''}.`,
    responsable: riesgo?.responsable || '',
    origen_modulo: 'RIESGOS',
    origen_referencia: String(riesgo?.id ?? ''),
  });
}

/**
 * Registra el vínculo inter-módulo en la bitácora.
 * Devuelve el objeto de movimiento listo para `registrarMovimiento`.
 */
export function movimientoVinculo({ origenModulo, destinoModulo, referencia, folio, detalle }) {
  return {
    modulo: destinoModulo,
    accion: 'VINCULO_MODULO',
    descripcion: `Se generó ${destinoModulo === 'ACCIONES_CORRECTIVAS' ? 'una Acción Correctiva' : 'un Plan de Mejora'} desde ${origenModulo}`,
    detalles: detalle || `Origen: ${referencia}`,
    folio: folio || '',
  };
}

export const FLUJO = {
  acDesdeIndicador,
  acDesdeAuditoria,
  acDesdeDocumento,
  pmDesdeRiesgo,
  movimientoVinculo,
  fechaEnDias,
  folioBorrador,
};

export default FLUJO;