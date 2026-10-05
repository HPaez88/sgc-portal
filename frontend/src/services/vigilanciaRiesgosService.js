// ═══════════════════════════
// SERVICIO DE VIGILANCIA ANUAL DE LA MATRIZ DE RIESGOS
// ISO 9001:2015 § 6.1 (Riesgos y oportunidades) y § 9.3 (Revisión por la dirección).
//
// Responsabilidad del titular del módulo: verificar año con año que TODAS las
// áreas del SGC hayan levantado su matriz, y aprobar los planes resultantes.
// ═══════════════════════════

/** Estados del ciclo de vida de la matriz de un área en un ejercicio. */
export const ESTADOS_MATRIZ_AREA = {
  SIN_INICIAR: { label: 'Sin iniciar', color: 'bg-slate-100 text-slate-600 border-slate-200', prioridad: 3 },
  EN_CAPTURA: { label: 'En captura', color: 'bg-amber-100 text-amber-700 border-amber-200', prioridad: 2 },
  ENVIADA: { label: 'Enviada a revisión', color: 'bg-sky-100 text-sky-700 border-sky-200', prioridad: 1 },
  APROBADA: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', prioridad: 0 },
  CON_OBSERVACIONES: { label: 'Con observaciones', color: 'bg-orange-100 text-orange-700 border-orange-200', prioridad: 1 },
};

/** Año del registro: usa la fecha de cierre o la de creación. */
export function anioDeRiesgo(riesgo) {
  const candidatos = [riesgo?.fecha_termino, riesgo?.fecha_creacion, riesgo?.fecha];
  for (const valor of candidatos) {
    if (!valor) continue;
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) return fecha.getFullYear();
  }
  return null;
}

/** Nivel de exposición de un riesgo (probabilidad × impacto). */
export function nivelExposicion(riesgo) {
  return (Number(riesgo?.probabilidad) || 0) * (Number(riesgo?.impacto) || 0);
}

/** Clasificación de criticidad por exposición. */
export function clasificarNivel(nivel) {
  if (nivel >= 15) return 'CRITICO';
  if (nivel >= 10) return 'ALTO';
  if (nivel >= 5) return 'MEDIO';
  return 'BAJO';
}

/**
 * Construye el tablero de vigilancia anual: una fila por área del catálogo,
 * con su estado de levantamiento y las métricas de lo que ha registrado.
 *
 * @param {Array} riesgos Registros de la matriz
 * @param {Array} areas Catálogo de áreas del SGC
 * @param {number} anio Ejercicio a vigilar
 */
export function construirVigilanciaAnual(riesgos = [], areas = [], anio = new Date().getFullYear()) {
  const delAnio = (riesgos || []).filter((r) => anioDeRiesgo(r) === anio);

  return (areas || []).map((area) => {
    const propios = delAnio.filter((r) => (r.area || '') === area);
    const riesgosPuros = propios.filter((r) => r.tipo !== 'Oportunidad');
    const oportunidades = propios.filter((r) => r.tipo === 'Oportunidad');

    const exposiciones = riesgosPuros.map(nivelExposicion);
    const criticos = riesgosPuros.filter((r) => clasificarNivel(nivelExposicion(r)) === 'CRITICO').length;
    const altos = riesgosPuros.filter((r) => clasificarNivel(nivelExposicion(r)) === 'ALTO').length;

    const conPlan = propios.filter((r) => (r.plan_accion || '').trim().length > 0).length;
    const sinPlan = propios.length - conPlan;
    const evaluados = propios.filter((r) => r.evaluacion).length;

    // Estado de la matriz del área: derivado de la aprobación y del avance.
    let estado = 'SIN_INICIAR';
    const aprobaciones = propios.map((r) => r.aprobacion_matriz).filter(Boolean);
    if (aprobaciones.includes('APROBADA')) estado = 'APROBADA';
    else if (aprobaciones.includes('CON_OBSERVACIONES')) estado = 'CON_OBSERVACIONES';
    else if (aprobaciones.includes('ENVIADA')) estado = 'ENVIADA';
    else if (propios.length > 0) estado = 'EN_CAPTURA';

    return {
      area,
      total: propios.length,
      riesgos: riesgosPuros.length,
      oportunidades: oportunidades.length,
      criticos,
      altos,
      exposicionMaxima: exposiciones.length ? Math.max(...exposiciones) : 0,
      exposicionPromedio: exposiciones.length
        ? Math.round(exposiciones.reduce((a, b) => a + b, 0) / exposiciones.length)
        : 0,
      conPlan,
      sinPlan,
      evaluados,
      avancePlan: propios.length ? Math.round((conPlan / propios.length) * 100) : 0,
      estado,
      aprobacion: aprobaciones[0] || null,
      cumple: propios.length > 0,
    };
  });
}

/** Resumen global del ejercicio, para las tarjetas del dashboard. */
export function resumenEjercicio(vigilancia = []) {
  const conMatriz = vigilancia.filter((v) => v.cumple);
  const aprobadas = vigilancia.filter((v) => v.estado === 'APROBADA');
  const enviadas = vigilancia.filter((v) => v.estado === 'ENVIADA');
  const sinIniciar = vigilancia.filter((v) => v.estado === 'SIN_INICIAR');

  return {
    totalAreas: vigilancia.length,
    areasConMatriz: conMatriz.length,
    areasAprobadas: aprobadas.length,
    areasEnviadas: enviadas.length,
    areasSinIniciar: sinIniciar.length,
    porcentajeCumplimiento: vigilancia.length
      ? Math.round((conMatriz.length / vigilancia.length) * 100)
      : 0,
    totalRegistros: vigilancia.reduce((s, v) => s + v.total, 0),
    totalCriticos: vigilancia.reduce((s, v) => s + v.criticos, 0),
    totalSinPlan: vigilancia.reduce((s, v) => s + v.sinPlan, 0),
    areasPendientes: sinIniciar.map((v) => v.area),
    areasPorAprobar: enviadas.map((v) => v.area),
  };
}

/**
 * Ejercicios disponibles para seleccionar.
 *
 * Incluye siempre el año en curso Y el siguiente, porque la planificación de
 * riesgos es prospectiva: ISO 9001:2015 § 6.1 exige que las áreas levanten su
 * matriz ANTES de que inicie el periodo. Si solo se ofreciera el año en curso,
 * en enero ya se estaría capturando tarde.
 *
 * También se agregan los años que ya tengan registros, para no perder historial.
 */
export function aniosDisponibles(riesgos = []) {
  const actual = new Date().getFullYear();
  const anios = new Set([actual + 1, actual]);
  (riesgos || []).forEach((r) => {
    const a = anioDeRiesgo(r);
    if (a) anios.add(a);
  });
  return [...anios].sort((a, b) => b - a);
}

/** Aprobación (o rechazo) de la matriz de un área para un ejercicio. */
export function aplicarAprobacion(riesgos = [], area, anio, decision, comentario = '', usuario = null) {
  return (riesgos || []).map((r) => {
    if ((r.area || '') !== area || anioDeRiesgo(r) !== anio) return r;
    return {
      ...r,
      aprobacion_matriz: decision,
      aprobacion_comentario: comentario,
      aprobacion_fecha: new Date().toISOString(),
      aprobacion_usuario: usuario?.nombre || 'Sistema',
    };
  });
}

export default {
  ESTADOS_MATRIZ_AREA,
  construirVigilanciaAnual,
  resumenEjercicio,
  aniosDisponibles,
  aplicarAprobacion,
  anioDeRiesgo,
  nivelExposicion,
  clasificarNivel,
};