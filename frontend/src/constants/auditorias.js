// Auditorías internas ISO 9001:2015 — reglas del procedimiento OOMPSC-08 Rev 42 (lógica pura, probada).
// Formatos que cubre: OOMRSC-12 calendario anual · 13 programa · 14 plan · 15 lista de verificación ·
// 16 informe · 17 reporte de hallazgo · 19 evaluación de la auditoría · 34 evaluación de auditores (bono).
import { BANCO_PREGUNTAS } from './auditoriaPreguntas';
import { siguienteHabil } from './fechasHabiles';

export const CLAVE_AUDITORIAS = 'sgc-auditorias-internas';   // programa: una entrada por auditoría bimestral
export const CLAVE_LISTAS = 'sgc-auditorias-listas';          // listas de verificación (una por área y auditor)
export const CLAVE_HALLAZGOS = 'sgc-auditorias-hallazgos';    // reportes de hallazgo
export const CLAVE_EVALUACIONES = 'sgc-auditorias-evaluaciones'; // evaluación del auditado (OOMRSC-19) y de auditores (OOMRSC-34)

export const FORMATOS = {
  calendario: 'OOMRSC-12', programa: 'OOMRSC-13', plan: 'OOMRSC-14', lista: 'OOMRSC-15',
  informe: 'OOMRSC-16', hallazgo: 'OOMRSC-17', evaluacion: 'OOMRSC-19', bono: 'OOMRSC-34',
};
export const BIMESTRES = ['Ene–Feb', 'Mar–Abr', 'May–Jun', 'Jul–Ago', 'Sep–Oct', 'Nov–Dic'];
export const bimestreDe = (fechaISO) => (fechaISO ? Math.floor((Number(String(fechaISO).slice(5, 7)) - 1) / 2) : null);

export const ESTADOS_AUDITORIA = {
  PLANEACION: { label: 'En planeación', cls: 'bg-slate-100 text-slate-700 border-slate-200', sig: 'Invitar auditores' },
  INVITACION: { label: 'Invitación a auditores', cls: 'bg-sky-100 text-sky-800 border-sky-200', sig: 'Cerrar equipo y plan' },
  PROGRAMADA: { label: 'Programada', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', sig: 'Iniciar auditoría' },
  EN_EJECUCION: { label: 'En ejecución', cls: 'bg-amber-100 text-amber-800 border-amber-200', sig: 'Emitir informe' },
  INFORME: { label: 'Informe entregado', cls: 'bg-violet-100 text-violet-800 border-violet-200', sig: 'Cerrar auditoría' },
  CERRADA: { label: 'Cerrada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', sig: null },
};
export const ORDEN_ESTADOS = Object.keys(ESTADOS_AUDITORIA);
export const TIPOS_AUDITORIA = ['Programada', 'No programada'];
export const CRITERIOS_AUDITORIA = ['ISO 9001:2015', 'Manual de Calidad', 'Procedimientos del SGC', 'Procedimientos y registros del área', 'Matriz de requisitos'];
export const RIESGOS_AUDITORIA = ['Contingencias ambientales', 'Contingencias de seguridad', 'Planificación inadecuada de la auditoría'];

// ───────────── Calificación ─────────────
// Operación actual (formato OOMRSC-15): cada requisito se califica C (conforme), NC (no conforme) u OM (oportunidad de mejora).
// Evolución prevista por el SGC: puntos 0–10 por requisito para medir la eficiencia de cada área. Ya está soportado;
// se enciende con USAR_PUNTOS (los puntos deducen solos el criterio oficial).
export const USAR_PUNTOS = false;
export const LETRAS = { C: 'Conforme', NC: 'No conforme', OM: 'Oportunidad de mejora' };
export const CRITERIOS = {
  EXCELENTE: { label: 'Excelente', letra: 'C', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', rango: '10' },
  CONFORME: { label: 'Conformidad', letra: 'C', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', rango: '9 a 8' },
  OPORTUNIDAD: { label: 'Oportunidad de mejora', letra: 'OM', cls: 'bg-sky-50 text-sky-800 border-sky-200', rango: '7 a 6' },
  CORRECCION: { label: 'Corrección', letra: 'NC', cls: 'bg-amber-50 text-amber-900 border-amber-300', rango: '5' },
  NO_CONFORMIDAD: { label: 'No conformidad', letra: 'NC', cls: 'bg-rose-50 text-rose-800 border-rose-300', rango: '4 o menos' },
};
export const criterioDePuntos = (puntos) => {
  if (puntos === '' || puntos === null || puntos === undefined || !Number.isFinite(Number(puntos))) return null;
  const p = Number(puntos);
  if (p >= 10) return 'EXCELENTE';
  if (p >= 8) return 'CONFORME';
  if (p >= 6) return 'OPORTUNIDAD';
  if (p >= 5) return 'CORRECCION';
  return 'NO_CONFORMIDAD';
};
/** Criterio de una pregunta: el capturado (C / NC / OM; la NC puede marcarse como corrección menor) o el deducido de los puntos. */
export const criterioDe = (q) => {
  if (q?.criterio === 'C') return 'CONFORME';
  if (q?.criterio === 'OM') return 'OPORTUNIDAD';
  if (q?.criterio === 'NC') return q.correccion_menor ? 'CORRECCION' : 'NO_CONFORMIDAD';
  return criterioDePuntos(q?.puntos);
};
export const letraDe = (q) => CRITERIOS[typeof q === 'object' && q !== null ? criterioDe(q) : criterioDePuntos(q)]?.letra || '';

// ───────────── Rango y frecuencia (OOMRSC-12) ─────────────
export const RANGOS = {
  ACEPTABLE: { label: 'Aceptable', desc: 'Igual o mayor a 90%', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  RIESGO: { label: 'Riesgo', desc: 'De 80% a menos de 90%', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  CRITICO: { label: 'Crítico', desc: 'Menor que 80%', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
};
export const rangoDe = (pct) => (pct === null || pct === undefined ? null : pct >= 90 ? 'ACEPTABLE' : pct >= 80 ? 'RIESGO' : 'CRITICO');
/** Meses para la siguiente auditoría del proceso según las NC de la anterior. */
export const frecuenciaMeses = (nc) => { const n = Number(nc) || 0; return n === 0 ? 12 : n <= 3 ? 8 : n <= 8 ? 6 : 4; };
export const sumarMeses = (fechaISO, meses) => {
  if (!fechaISO) return '';
  const [a, m, d] = String(fechaISO).slice(0, 10).split('-').map(Number);
  const f = new Date(a, m - 1 + meses, 1);
  const ultimo = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
};

// ───────────── Lista de verificación estandarizada ─────────────
const hash = (t) => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
/**
 * Una pregunta por cláusula tomada del banco. La semilla (auditoría + área) hace que varíe entre auditorías
 * pero salga siempre igual para la misma auditoría y área (estandarizada y con dinamismo).
 */
export const listaAutomatica = (semilla, banco = BANCO_PREGUNTAS) => banco.map((c) => {
  const i = hash(`${semilla}|${c.clausula}`) % c.preguntas.length;
  return { id: `std-${c.clausula}`, clausula: c.clausula, titulo: c.titulo, capitulo: c.capitulo, pregunta: c.preguntas[i], estandar: true, aplica: true, criterio: '', puntos: '', documentos: '', comentario: '', evidencias: [] };
});
export const preguntasDeClausula = (clausula, banco = BANCO_PREGUNTAS) => banco.find((c) => c.clausula === clausula)?.preguntas || [];
export const preguntaExtra = (clausula = '', banco = BANCO_PREGUNTAS) => {
  const c = banco.find((x) => x.clausula === clausula);
  return { id: `ext-${Date.now()}-${Math.floor(Math.random() * 1000)}`, clausula, titulo: c?.titulo || '', capitulo: c?.capitulo || Number(String(clausula).split('.')[0]) || 0, pregunta: '', estandar: false, aplica: true, criterio: '', puntos: '', documentos: '', comentario: '', evidencias: [] };
};

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
/** Resumen de una o varias listas: cumplimiento oficial (C × 100 / auditadas), conteos y, si hay puntos, eficiencia. */
export function resumenPreguntas(preguntas = []) {
  const auditadas = preguntas.filter((q) => q.aplica !== false && criterioDe(q));
  const cuenta = (...cr) => auditadas.filter((q) => cr.includes(criterioDe(q))).length;
  const conformes = cuenta('EXCELENTE', 'CONFORME');
  const conPuntos = auditadas.filter((q) => q.puntos !== '' && q.puntos !== null && q.puntos !== undefined && Number.isFinite(Number(q.puntos)));
  const eficiencia = pct(conPuntos.reduce((s, q) => s + Number(q.puntos), 0), conPuntos.length * 10);
  const cumplimiento = pct(conformes, auditadas.length);
  return {
    total: preguntas.filter((q) => q.aplica !== false).length, auditadas: auditadas.length, noAplica: preguntas.filter((q) => q.aplica === false).length,
    conformes, oportunidades: cuenta('OPORTUNIDAD'), correcciones: cuenta('CORRECCION'), noConformidades: cuenta('NO_CONFORMIDAD'),
    eficiencia, cumplimiento, rango: rangoDe(cumplimiento),
    completa: auditadas.length > 0 && auditadas.length === preguntas.filter((q) => q.aplica !== false).length,
  };
}
export const CAPITULOS = { 4: 'Contexto de la organización', 5: 'Liderazgo', 6: 'Planificación', 7: 'Apoyo', 8: 'Operación', 9: 'Evaluación del desempeño', 10: 'Mejora' };
export const resumenPorCapitulo = (preguntas = []) => Object.keys(CAPITULOS).map((cap) => ({
  capitulo: Number(cap), nombre: CAPITULOS[cap], ...resumenPreguntas(preguntas.filter((q) => Number(q.capitulo) === Number(cap))),
}));
/** Qué le falta a una lista para entregarse (null = completa). Toda NC u OM debe llevar evidencia u observación. */
export const faltanteLista = (preguntas = []) => {
  const aplican = preguntas.filter((q) => q.aplica !== false);
  if (!aplican.length) return 'la lista no tiene preguntas';
  const sinCalificar = aplican.filter((q) => !criterioDe(q)).length;
  if (sinCalificar) return `faltan ${sinCalificar} pregunta(s) por calificar`;
  if (aplican.some((q) => !String(q.pregunta || '').trim())) return 'hay preguntas agregadas sin texto';
  const sinEvidencia = aplican.filter((q) => !['EXCELENTE', 'CONFORME'].includes(criterioDe(q)) && String(q.comentario || '').trim().length < 10).length;
  if (sinEvidencia) return `${sinEvidencia} requisito(s) NC u OM no tienen evidencia u observación`;
  return null;
};

// ───────────── Hallazgos (OOMRSC-17) ─────────────
export const TIPOS_HALLAZGO = {
  NC: { label: 'No conformidad', accion: 'AC', obligatoria: true, cls: 'bg-rose-50 text-rose-800 border-rose-300' },
  CORRECCION: { label: 'Corrección menor', accion: 'RC', obligatoria: true, cls: 'bg-amber-50 text-amber-900 border-amber-300' },
  OM: { label: 'Oportunidad de mejora', accion: 'PM', obligatoria: false, cls: 'bg-sky-50 text-sky-800 border-sky-200' },
};
/** Hallazgos que salen de una lista entregada: todo lo calificado NC (o corrección menor) u OM. */
export const hallazgosDeLista = (lista, { por = '', ahora = new Date().toISOString() } = {}) => (lista?.preguntas || [])
  .filter((q) => q.aplica !== false && ['NO_CONFORMIDAD', 'CORRECCION', 'OPORTUNIDAD'].includes(criterioDe(q)))
  .map((q, i) => ({
    id: `${lista.id}-${q.id}`, auditoria_id: lista.auditoria_id, lista_id: lista.id, pregunta_id: q.id, area: lista.area, auditor: lista.auditor || por,
    tipo: { NO_CONFORMIDAD: 'NC', CORRECCION: 'CORRECCION', OPORTUNIDAD: 'OM' }[criterioDe(q)],
    clausula: q.clausula, requisito: q.titulo || '', pregunta: q.pregunta, hallazgo: q.comentario || '', documentos: q.documentos || '', puntos: q.puntos === '' || q.puntos == null ? null : Number(q.puntos),
    evidencias: q.evidencias || [], estado: 'ABIERTO', orden: i + 1, fecha: ahora,
  }));
/** NC: la acción debe abrirse a más tardar 5 días hábiles después de la entrega del informe. */
export const DIAS_HABILES_APERTURA = 5;
export const plazoApertura = (fechaInformeISO, dias = DIAS_HABILES_APERTURA) => {
  if (!fechaInformeISO) return '';
  let f = String(fechaInformeISO).slice(0, 10);
  for (let i = 0; i < dias; i += 1) {
    const [a, m, d] = f.split('-').map(Number);
    const sig = new Date(a, m - 1, d + 1);
    f = siguienteHabil(`${sig.getFullYear()}-${String(sig.getMonth() + 1).padStart(2, '0')}-${String(sig.getDate()).padStart(2, '0')}`);
  }
  return f;
};

// ───────────── Programa y equipo auditor ─────────────
export const numeroSiguiente = (auditorias = [], anio) => Math.max(0, ...auditorias.filter((a) => Number(a.anio) === Number(anio)).map((a) => Number(a.numero) || 0)) + 1;
export const nuevaAuditoria = ({ anio, numero, bimestre = 0, por = '' }) => ({
  id: Date.now() + Math.floor(Math.random() * 1000), anio, numero, bimestre, tipo: 'Programada', estado: 'PLANEACION',
  objetivo: '', alcance: '', criterios: [...CRITERIOS_AUDITORIA], riesgos: [], cambios: '', documentos_referencia: '', recursos: '',
  fecha_inicio: '', fecha_fin: '', fecha_reunion_apertura: '', fecha_reunion_cierre: '', fecha_informe: '',
  auditor_lider_calidad: por, areas: [], invitacion: null, confirmaciones: [], creado_por: por, fecha_creacion: new Date().toISOString(),
});
export const nuevaAreaAuditada = (area, extra = {}) => ({
  area, proceso: '', direccion: '', auditores_requeridos: 1, auditor_lider: '', auditores: [], observadores: [],
  fecha: '', hora_inicio: '', hora_fin: '', auditado: '', lugar: '', clausulas: '', ...extra,
});
/** Total de auditores que pide el programa (suma de los requeridos por área). */
export const auditoresRequeridos = (auditoria) => (auditoria?.areas || []).reduce((s, a) => s + (Number(a.auditores_requeridos) || 1), 0);
/**
 * Propuesta de equipo en el orden en que confirmaron (procedimiento § 6): cada área recibe a los primeros
 * auditores disponibles que no sean de su misma área ni de su dirección (imparcialidad). No repite auditor
 * mientras haya otros sin asignar. Devuelve { asignacion: { área: [correos] }, sinCubrir: [áreas] }.
 */
export function proponerEquipo(auditoria, confirmaciones = [], direccionDe = () => '') {
  const orden = [...confirmaciones].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const carga = Object.fromEntries(orden.map((c) => [c.email, 0]));
  const asignacion = {}; const sinCubrir = [];
  (auditoria?.areas || []).forEach((ar) => {
    const dirArea = ar.direccion || direccionDe(ar.area) || '';
    const elegibles = orden.filter((c) => c.area !== ar.area && !(dirArea && (c.direccion || direccionDe(c.area)) === dirArea));
    const n = Number(ar.auditores_requeridos) || 1;
    const elegidos = [...elegibles].sort((a, b) => carga[a.email] - carga[b.email] || orden.indexOf(a) - orden.indexOf(b)).slice(0, n);
    elegidos.forEach((c) => { carga[c.email] += 1; });
    asignacion[ar.area] = elegidos.map((c) => c.email);
    if (elegidos.length < n) sinCubrir.push(ar.area);
  });
  return { asignacion, sinCubrir };
}
/** Motivo por el que un auditor no puede auditar un área (null = sí puede). */
export const conflictoDeInteres = (auditor, area, direccionDe = () => '') => {
  if (!auditor || !area) return null;
  if (auditor.area === area.area) return 'es de la misma área';
  const d = area.direccion || direccionDe(area.area);
  if (d && (auditor.direccion || direccionDe(auditor.area)) === d) return 'pertenece a la misma dirección';
  return null;
};
/** Qué le falta al programa para pasar a la siguiente etapa (null = listo). */
export const faltantePrograma = (a) => {
  if (!a.objetivo?.trim()) return 'falta el objetivo de la auditoría';
  if (!a.alcance?.trim()) return 'falta el alcance';
  if (!a.fecha_inicio || !a.fecha_fin) return 'faltan las fechas de la auditoría';
  if (!(a.areas || []).length) return 'agrega al menos un área o proceso a auditar';
  return null;
};
export const faltantePlan = (a) => {
  const sinEquipo = (a.areas || []).filter((x) => !x.auditor_lider && !(x.auditores || []).length);
  if (sinEquipo.length) return `${sinEquipo.length} área(s) sin auditor asignado`;
  const sinFecha = (a.areas || []).filter((x) => !x.fecha);
  if (sinFecha.length) return `${sinFecha.length} área(s) sin fecha en el plan`;
  if (!a.fecha_reunion_cierre) return 'falta la fecha de la reunión de entrega del informe';
  return null;
};

// ───────────── Calendario anual (OOMRSC-12) ─────────────
/** Última auditoría cerrada de cada área con sus resultados, frecuencia y fecha tentativa de la siguiente. */
export function calendarioAnual({ areas = [], auditorias = [], listas = [], hallazgos = [] }) {
  return areas.map((nombre) => {
    const previas = auditorias.filter((a) => ['INFORME', 'CERRADA'].includes(a.estado) && (a.areas || []).some((x) => x.area === nombre))
      .sort((a, b) => String(b.fecha_fin || b.fecha_inicio).localeCompare(String(a.fecha_fin || a.fecha_inicio)));
    const ultima = previas[0] || null;
    if (!ultima) return { area: nombre, ultima: null, nc: null, om: null, c: null, cumplimiento: null, eficiencia: null, rango: null, frecuencia: 12, proxima: '' };
    const preguntas = listas.filter((l) => l.auditoria_id === ultima.id && l.area === nombre).flatMap((l) => l.preguntas || []);
    const r = resumenPreguntas(preguntas);
    const delArea = hallazgos.filter((h) => h.auditoria_id === ultima.id && h.area === nombre);
    const nc = delArea.filter((h) => h.tipo === 'NC').length;
    const fecha = (ultima.areas.find((x) => x.area === nombre)?.fecha) || ultima.fecha_fin || ultima.fecha_inicio;
    return { area: nombre, ultima, fecha, nc, om: delArea.filter((h) => h.tipo === 'OM').length, c: r.conformes,
      cumplimiento: r.cumplimiento, eficiencia: r.eficiencia, rango: r.rango, frecuencia: frecuenciaMeses(nc), proxima: sumarMeses(fecha, frecuenciaMeses(nc)) };
  });
}

// ───────────── Evaluaciones ─────────────
// OOMRSC-19: el auditado evalúa la auditoría y al auditor (escala 2, 4, 6, 8, 10).
export const ESCALA_EVALUACION = [[2, 'Deficiente'], [4, 'Regular'], [6, 'Bueno'], [8, 'Muy bueno'], [10, 'Excelente']];
export const ASPECTOS_AUDITORIA = [
  'Oportunidad en la notificación del proyecto de auditoría (agenda de reuniones).', 'Claridad en la notificación de la auditoría.',
  'Coherencia entre la metodología utilizada y el alcance planteado.', 'Enfoque y orientación de la auditoría.', 'Horario de la auditoría.', 'Cómo calificaría la auditoría en general.',
];
export const ASPECTOS_AUDITOR = [
  'Cumplimiento del horario de las reuniones de auditoría.', 'Claridad y coherencia de las preguntas realizadas en la entrevista de auditoría.',
  'Organizó y recopiló información durante las entrevistas, revisando documentos, registros, escuchando y observando.',
  'Capacidad de análisis y observación de los procesos auditados.', 'Eficiencia en el uso del tiempo de auditoría.', 'Ecuanimidad y respeto en el trato con los entrevistados.',
];
export const promedioEvaluacion = (respuestas = {}) => {
  const v = Object.values(respuestas).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
// OOMRSC-34: evaluación de auditores para el bono bimestral (10 puntos; mínimo 8).
export const CRITERIOS_BONO = [
  ['reunion_programa', 'Asistencia a la reunión de programa', 1], ['reunion_apertura', 'Asistencia a reunión de apertura', 1],
  ['seguimiento_hallazgos', 'Seguimiento de apertura de hallazgos', 2], ['entrega_documentos', 'Entrega en tiempo de documentos', 1],
  ['cierre_acciones', 'Cierre de acciones', 2], ['reunion_cierre', 'Asistencia a reunión de cierre', 1],
  ['llenado_documentos', 'Correcto llenado de documentos', 1], ['evaluacion_realizacion', 'Evaluación de la realización de la auditoría', 1],
];
export const MINIMO_BONO = 8;
export const puntosBono = (ev = {}) => CRITERIOS_BONO.reduce((s, [k, , max]) => s + Math.min(max, Math.max(0, Number(ev[k]) || 0)), 0);

// ───────────── Enlace con el resto del portal (Panel y Revisión por la Dirección solo leen) ─────────────
export const resumenParaPortal = ({ auditorias = [], listas = [], hallazgos = [] }) => auditorias.map((a) => {
  const h = hallazgos.filter((x) => x.auditoria_id === a.id);
  const r = resumenPreguntas(listas.filter((l) => l.auditoria_id === a.id).flatMap((l) => l.preguntas || []));
  return { id: a.id, numero: `AUD-${a.numero}/${a.anio}`, anio: a.anio, tipo: 'Interna', area: (a.areas || []).map((x) => x.area).join(', '), fecha_inicio: a.fecha_inicio, fecha_fin: a.fecha_fin,
    estado: ['INFORME', 'CERRADA'].includes(a.estado) ? 'COMPLETADA' : a.estado === 'EN_EJECUCION' ? 'EN_PROCESO' : 'PROGRAMADA',
    hallazgos: h.length, no_conformidades: h.filter((x) => x.tipo === 'NC').length, cumplimiento: r.cumplimiento, rango: r.rango };
});
/** Promedio de cumplimiento de las auditorías concluidas del año (null si no hay). */
export const promedioAuditorias = (resumen = [], anio) => {
  const v = resumen.filter((a) => String(a.anio) === String(anio) && a.estado === 'COMPLETADA' && a.cumplimiento != null).map((a) => a.cumplimiento);
  const pct = v.length ? Math.round((v.reduce((s, n) => s + n, 0) / v.length) * 10) / 10 : null;
  return { pct, rango: rangoDe(pct), total: v.length };
};
