// ═══════════════════════════
// SERVICIO DE FLUJO INTER-MÓDULOS DEL SGC
// Convierte los módulos en un sistema conectado (ISO 9001:2015):
//   Indicador no cumplido  → Acción Correctiva   (§9.1.3 → §10.2)
//   Auditoría / hallazgo   → Acción Correctiva   (§9.2 → §10.2)
//   RC no efectivo         → Acción Correctiva   (§10.2)
//   (El PM desde un riesgo vive en constants/riesgos.js: pmDesdeRiesgo)
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
    id: Date.now() + Math.floor(Math.random() * 1000),
    // El folio oficial AC#n/aaaa lo asigna el SGC al aprobar; mientras, el borrador solo lleva una referencia provisional.
    folio_codigo: 'Pendiente de aprobación',
    folio_provisional: folioBorrador('AC', overrides.origen_tipo || 'SGC'),
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
 * ACCIÓN CORRECTIVA desde un REPORTE DE CORRECCIÓN cerrado como NO efectivo (la corrección no bastó).
 * Origen ISO: 10.2 — la no conformidad persiste y requiere análisis de causa raíz.
 */
export function acDesdeReporteCorreccion(rc) {
  return baseAccionCorrectiva({
    origen: 'Indicador',
    origen_tipo: 'RC',
    area: rc?.area || '',
    proceso: rc?.proceso || '',
    responsable: rc?.responsable || '',
    descripcion_no_conformidad_original:
      `La corrección aplicada en el Reporte de Corrección ${rc?.folio || ''} no fue efectiva. ${rc?.descripcion || ''}`.trim(),
    evidencia: `Reporte de Corrección ${rc?.folio || ''}: corrección "${rc?.accion || ''}"; verificación: ${rc?.observacionesVerificacion || 'sin eficacia comprobada'}.`,
    accion_contenedora: rc?.accion || '',
    causa_inmediata_rc: rc?.causa || '',
    origen_modulo: 'INDICADORES',
    origen_referencia: rc?.indicadorId != null && rc?.indicadorId !== '' ? String(rc.indicadorId) : null,
    reporte_correccion_origen: rc?.folio || '',
    reporte_correccion_id: rc?.id ?? null,
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
  acDesdeReporteCorreccion,
  movimientoVinculo,
  fechaEnDias,
  folioBorrador,
};

export default FLUJO;