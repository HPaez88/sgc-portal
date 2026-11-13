// ═══════════════════════════════════════════════════════════════
// Riesgos y oportunidades (ISO 9001:2015 § 6.1) — matriz OOMRSC-37 y control OOMRSC-51.
// Diseño 2026-11-13 (decidido con @human): escala 5×5, la matriz anual del área se envía al SGC,
// el SGC la acepta con confirmación; cada plan de acción se lleva como un Plan de Mejora ligado
// (nace con sus actividades), el auditor cierra el PM y el SGC dictamina la eficacia
// reevaluando el riesgo (segunda confirmación).
// ═══════════════════════════════════════════════════════════════

import { fechaSeguimientoInicial } from './workflow';

export const CLAVE_MATRIZ = 'OOMRSC-37';
export const CLAVE_CONTROL = 'OOMRSC-51';
export const ORIGEN_PM_RIESGOS = 'Matriz de riesgos y oportunidades';

// Escala oficial OOMRSC-37 Rev. 06 (hoja "Criterios"): Impacto 2-10 × Probabilidad 1-5 = nivel 2 a 50.
// Se ve como un mapa 5×5 y los niveles se comparan con los años anteriores.
export const ESCALAS = {
  Riesgo: {
    ejeX: 'Impacto', ejeY: 'Probabilidad',
    probabilidad: [
      [1, 'Baja', 'Casi no ocurre en el año'],
      [2, 'Media-Baja', 'Podría ocurrir, pero no se espera'],
      [3, 'Media', 'Puede ocurrir alguna vez en el año'],
      [4, 'Media-Alta', 'Ocurre varias veces al año'],
      [5, 'Alta', 'Ocurre con frecuencia (mensual o más)'],
    ],
    impacto: [
      [2, 'Marginal', 'No afecta el servicio ni los indicadores'],
      [4, 'Débil', 'Retrabajo o retraso interno sin efecto en el usuario'],
      [6, 'Importante', 'Afecta parcialmente un indicador o un servicio'],
      [8, 'Crítico', 'Incumple metas u objetivos, o afecta a usuarios'],
      [10, 'Catastrófico', 'Salud, suspensión del servicio, sanción legal o financiera'],
    ],
  },
  Oportunidad: {
    ejeX: 'Impacto', ejeY: 'Probabilidad',
    probabilidad: [
      [1, 'Baja', 'Requiere recursos o autorizaciones que no se tienen'],
      [2, 'Media-Baja', 'Requiere apoyo de otras áreas y presupuesto'],
      [3, 'Media', 'Se puede con gestión y algo de recurso'],
      [4, 'Media-Alta', 'Depende casi solo del área'],
      [5, 'Alta', 'Se puede hacer ya con lo que se tiene'],
    ],
    impacto: [
      [2, 'Bajo', 'Mejora apenas perceptible'],
      [4, 'Medio-Bajo', 'Mejora interna del área'],
      [6, 'Medio', 'Mejora un indicador o un proceso'],
      [8, 'Medio-Alto', 'Mejora notable para el usuario o el organismo'],
      [10, 'Alto', 'Cambio relevante en servicio, ingresos o cumplimiento'],
    ],
  },
};

// Rangos oficiales: Bajo 0-19 · Medio 20-29 · Alto 30-50, con la importancia que marca el formato.
export const RANGOS_NIVEL = [
  { nivel: 'Bajo', max: 19, color: 'bg-emerald-500', suave: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    importancia: { Riesgo: 'Seguimiento por parte de los supervisores.', Oportunidad: 'Identificada; aún sin actividades para alcanzarla.' } },
  { nivel: 'Medio', max: 29, color: 'bg-amber-400', suave: 'bg-amber-100 text-amber-800 border-amber-200',
    importancia: { Riesgo: 'Seguimiento adecuado por parte de los niveles medios.', Oportunidad: 'El área lleva seguimiento para alcanzarla.' } },
  { nivel: 'Alto', max: 50, color: 'bg-rose-500', suave: 'bg-rose-100 text-rose-800 border-rose-200',
    importancia: { Riesgo: 'Se informa a los directores y lleva seguimiento permanente.', Oportunidad: 'Con seguimiento y resultados; por alcanzarse.' } },
];

// Hoja "Identificación" del OOMRSC-37: de dónde sale cada riesgo u oportunidad.
export const CONTEXTOS = ['Objetivos del área', 'Indicadores', 'Análisis interno y externo', 'Partes interesadas'];

export const puntaje = (r) => (Number(r?.probabilidad) || 0) * (Number(r?.impacto) || 0);

export const clasificar = (valor) => {
  if (!valor) return null;
  return RANGOS_NIVEL.find((x) => valor <= x.max) || RANGOS_NIVEL[RANGOS_NIVEL.length - 1];
};

export const nivelDe = (r) => clasificar(puntaje(r));

// Bajo puede quedarse en monitoreo; medio y alto llevan tratamiento con plan.
export const requierePlan = (r) => ['Medio', 'Alto'].includes(nivelDe(r)?.nivel);

export const TRATAMIENTOS = {
  Riesgo: ['Mitigar', 'Evitar', 'Transferir', 'Aceptar'],
  Oportunidad: ['Aprovechar', 'Posponer'],
};

// Estados de la matriz anual de un área
export const ESTADOS_MATRIZ = {
  BORRADOR: { label: 'En captura', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ENVIADA: { label: 'En revisión SGC', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  OBSERVADA: { label: 'Con observaciones', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ACEPTADA: { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

// Estados de cada riesgo/oportunidad
export const ESTADOS_RIESGO = {
  IDENTIFICADO: { label: 'Identificado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  MONITOREO: { label: 'En monitoreo', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  EN_TRATAMIENTO: { label: 'En tratamiento', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  PENDIENTE_DICTAMEN: { label: 'Por dictaminar SGC', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  CERRADO_EFICAZ: { label: 'Eficaz', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CERRADO_NO_EFICAZ: { label: 'No eficaz', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const idMatriz = (area, anio) => `${area}|${anio}`;

const pmDe = (r, planes = []) => planes.find((p) => String(p.id) === String(r?.pm_id));

// Estado real: si el auditor ya cerró el PM ligado, el riesgo queda esperando el dictamen del SGC.
export const estadoRiesgo = (r, planes = []) => {
  if (!r) return 'IDENTIFICADO';
  if (r.estado === 'EN_TRATAMIENTO') {
    const pm = pmDe(r, planes);
    if (pm && String(pm.estado || '').startsWith('CERRADO')) return 'PENDIENTE_DICTAMEN';
  }
  return r.estado || 'IDENTIFICADO';
};

// Plan de Mejora que nace del riesgo con sus actividades (no queda vacío).
export const pmDesdeRiesgo = (r, { folio, por, ahora = new Date().toISOString() }) => {
  const actividades = (r.plan || []).map((a, i) => ({
    id: i + 1,
    actividad: a.actividad,
    responsable: a.responsable,
    indicador: '',
    indicador_progreso: '',
    fecha_termino_sugerida: a.fecha_termino_sugerida,
    evidencia_esperada: a.evidencia_esperada || '',
    evidencia_cargada: '',
    estatus: 'PENDIENTE',
  }));
  const fechas = actividades.map((a) => a.fecha_termino_sugerida).filter(Boolean).sort();
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    folio: folio.codigo, folio_codigo: folio.codigo, folio_numero: folio.numero, anio_folio: folio.anio,
    estado: 'EN_SEGUIMIENTO',
    titulo_mejora: r.descripcion,
    area: r.area, gerencia_coordinacion: r.area, direccion: r.direccion || '', proceso: r.proceso || '',
    categoria_mejora: '', periodo_mejora: String(r.anio || ''),
    origen: ORIGEN_PM_RIESGOS, origen_referencia: String(r.id), riesgo_id: r.id, riesgo_tipo: r.tipo,
    descripcion_situacion_actual: [
      `${r.tipo} (${CLAVE_MATRIZ} ${r.anio}) · nivel ${puntaje(r)} ${nivelDe(r)?.nivel || ''} · tratamiento: ${r.tratamiento || '-'}`,
      r.contexto ? `Contexto: ${r.contexto}${r.contexto_resultado ? ` — ${r.contexto_resultado}` : ''}` : '',
      r.causa ? `Causa: ${r.causa}` : '',
      r.consecuencia ? `${r.tipo === 'Oportunidad' ? 'Beneficio esperado' : 'Consecuencia'}: ${r.consecuencia}` : '',
    ].filter(Boolean).join('\n'),
    situacion_deseada: '', beneficios: '',
    integrantes: '[]',
    actividades: JSON.stringify(actividades),
    ...(fechas.length ? { fecha_limite: fechas[fechas.length - 1] } : {}),
    // Fecha de seguimiento fija (actividad más tardía + 2 semanas, día hábil), igual que al aprobar un PM.
    ...(fechaSeguimientoInicial({ actividades }) ? { fecha_seguimiento: fechaSeguimientoInicial({ actividades }) } : {}),
    creado_por: por, fecha_creacion_borrador: ahora, created_at: ahora,
    fecha_envio_sgc: ahora, fecha_aprobacion_sgc: ahora, fecha_apertura: ahora,
    aprobado_por_sgc: `${por} (aceptación de ${CLAVE_MATRIZ})`,
    clave_formato: 'OOMRSC-21', revision_formato: 'Rev. 02',
  };
};

// Dictamen del SGC: en riesgos reevalúa (residual) y sugiere eficaz si el nivel bajó; el SGC confirma o corrige.
export const sugerirEficacia = (r, residual) => {
  const antes = puntaje(r);
  const despues = puntaje(residual);
  if (!antes || !despues) return null;
  if (r.tipo === 'Oportunidad') return null; // en oportunidades el SGC decide si se aprovechó
  return despues < antes ? 'EFICAZ' : 'NO_EFICAZ';
};

export const nuevoRiesgo = ({ tipo = 'Riesgo', area, direccion, anio, por }) => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  tipo, area, direccion: direccion || '', anio, proceso: '',
  contexto: '', contexto_resultado: '',
  descripcion: '', causa: '', consecuencia: '', controles: '',
  probabilidad: 0, impacto: 0, tratamiento: '', plan: [],
  estado: 'IDENTIFICADO', creado_por: por || '', fecha_creacion: new Date().toISOString(),
});

// Qué le falta a un riesgo para poder enviar la matriz (null = completo).
export const faltante = (r) => {
  if (!r.contexto) return 'falta el contexto (de dónde se identificó)';
  if (!r.proceso) return 'falta el proceso';
  if (!r.descripcion?.trim()) return 'falta la descripción';
  if (!r.probabilidad || !r.impacto) return 'falta evaluarlo';
  if (requierePlan(r)) {
    if (!r.tratamiento) return 'falta el tratamiento';
    if (r.tratamiento !== 'Aceptar' && r.tratamiento !== 'Posponer') {
      if (!(r.plan || []).length) return 'falta el plan de acción';
      if ((r.plan || []).some((a) => !a.actividad?.trim() || !a.responsable?.trim() || !a.fecha_termino_sugerida)) {
        return 'el plan tiene actividades incompletas';
      }
    }
  }
  return null;
};

// Lleva plan de mejora: tiene actividades y el tratamiento no es aceptar/posponer.
export const llevaPM = (r) => (r.plan || []).length > 0 && !['Aceptar', 'Posponer'].includes(r.tratamiento);
