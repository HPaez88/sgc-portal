// Conexión proyecto anual → Cuadro de Control / fichas PMD (una sola captura).
// El proyecto APROBADO del año manda en nombre, unidad, meta, metas T1–T4, periodicidad, impacto y ficha de sus indicadores;
// el Cuadro, la evaluación trimestral, las fichas PMD y los avisos solo leen.

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[%,$\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// Mes del resultado (1–12) que se reporta según periodicidad; igual que backend/services/avisos_motor.py.
const MESES_POR_PERIODICIDAD = {
  mensual: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], bimestral: [2, 4, 6, 8, 10, 12], trimestral: [3, 6, 9, 12],
  semestral: [6, 12], anual: [12],
};

/** ¿Este indicador entrega resultado del mes indicado (índice 0–11)? Mensual siempre. */
export function tocaReportar(ind, mesIdx) {
  const meses = MESES_POR_PERIODICIDAD[String(ind?.periodicidad || 'mensual').toLowerCase()] || MESES_POR_PERIODICIDAD.mensual;
  return meses.includes(mesIdx + 1);
}

const esDescendente = (a) => /descend/i.test(a?.ficha?.sentido || '');

/** Actividades de proyectos aprobados del año ligadas a un indicador: { [indicador_id]: { proyecto, actividad } }. */
export function vinculosProyecto(proyectos = [], anio) {
  const mapa = {};
  (proyectos || []).filter((p) => p.anio === anio && p.estado === 'APROBADO').forEach((p) => {
    (p.actividades || []).forEach((a) => {
      if (a.indicador_id !== '' && a.indicador_id != null) mapa[String(a.indicador_id)] = { proyecto: p, actividad: a };
    });
  });
  return mapa;
}

/** Lo que el proyecto le pone al indicador del Cuadro (solo lo que trae valor). */
export function datosDesdeProyecto({ proyecto: p, actividad: a }) {
  const meta = num(a.meta);
  const t = (a.trimestres || []).map(num);
  const out = {
    nombre: a.indicador || undefined, unidad: a.unidad || undefined, periodicidad: a.periodicidad || undefined,
    impacto: a.impacto || undefined, proyecto: { id: p.id, nombre: p.nombre, area: p.area, anio: p.anio },
  };
  if (meta !== null) { out.meta = meta; out.meta_anual = meta; }
  if (t.some((x) => x !== null)) out.metas_trimestrales = { T1: t[0] ?? 0, T2: t[1] ?? 0, T3: t[2] ?? 0, T4: t[3] ?? 0 };
  if (a.ficha?.sentido) out.es_menor = esDescendente(a);
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

/** Catálogo del año: catálogo base (+ personalizaciones) con lo del proyecto aprobado encima. */
export function aplicarProyectos(lista, proyectos, anio) {
  const v = vinculosProyecto(proyectos, anio);
  if (!Object.keys(v).length) return lista;
  return lista.map((ind) => (v[String(ind.id)] ? { ...ind, ...datosDesdeProyecto(v[String(ind.id)]) } : ind));
}

/** Ficha PMD (estructura de fichasGubernamentales) armada con lo capturado en el proyecto. */
export function fichaDesdeProyecto({ proyecto: p, actividad: a }) {
  const f = a.ficha || {};
  const limpio = (o) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined && x !== null && String(x).trim() !== ''));
  const pct = /porcent/i.test(a.unidad || '') ? '%' : '';
  return {
    origen_proyecto: p.id,
    alineacion: limpio({ eje_rector_pmd: p.eje_rector, programa_pmd: p.programa_pmd, objetivo_pmd: p.objetivo_pmd, estrategia_pmd: p.estrategia_pmd,
      objetivo_institucional: p.objetivo_institucional, tipo_objetivo: p.tipo_objetivo }),
    identificacion: limpio({ nombre_indicador: a.indicador, definicion_indicador: f.definicion, tipo_indicador: f.tipo_indicador, dimension: f.dimension,
      metodo_calculo: f.metodo, variables_calculo: f.variables, unidad_medida: a.unidad, frecuencia_medicion: a.periodicidad,
      meta_anual: a.meta !== '' && a.meta != null ? `${a.meta}${pct}` : undefined, linea_base: f.linea_base, sentido_indicador: f.sentido, supuestos: f.supuestos }),
    atributos_cremaa: limpio({ claridad: f.claridad, relevancia: f.relevancia, economia: f.economia, monitoreable: f.monitoreable, adecuado: f.adecuado,
      aportacion_marginal: f.aportacion }),
    caracteristicas_variables: limpio({ medios_verificacion: f.medios, metodo_recopilacion: f.recopilacion }),
    transversalidad: limpio({ otro: f.otro }),
    informacion_adicional: limpio({ titular_unidad: p.titular?.nombre, cargo_titular: p.titular?.cargo, fecha_elaboracion: p.fecha_elaboracion, notas: f.notas }),
  };
}

/** Fichas personalizadas + las que vienen del proyecto (el proyecto manda). */
export function fichasConProyecto(fichasPersonalizadas = {}, proyectos, anio, lista = []) {
  const v = vinculosProyecto(proyectos, anio);
  const out = { ...fichasPersonalizadas };
  Object.entries(v).forEach(([id, vin]) => {
    const ind = lista.find((i) => String(i.id) === id);
    const clave = ind?.numero ?? id;
    const prev = out[clave] || {};
    const pf = fichaDesdeProyecto(vin);
    out[clave] = Object.fromEntries(Object.entries({ ...prev, ...pf }).map(([k, val]) => [k, typeof val === 'object' && !Array.isArray(val) ? { ...(prev[k] || {}), ...val } : val]));
  });
  return out;
}

/** Al aprobar: cada actividad sin indicador ligado da de alta uno nuevo en el catálogo personalizado. */
export function altasAlAprobar(proyecto, lista = [], direccionDeArea = () => '') {
  let siguiente = Math.max(0, ...lista.map((i) => Number(i.id)).filter(Number.isFinite)) + 1;
  const nuevos = {};
  const actividades = (proyecto.actividades || []).map((a) => {
    if ((a.indicador_id !== '' && a.indicador_id != null) || !String(a.indicador || '').trim()) return a;
    const id = siguiente++;
    nuevos[id] = {
      id, numero: id, nombre: a.indicador.trim(), area: proyecto.area, direccion: direccionDeArea(proyecto.area) || '', proceso: proyecto.area,
      unidad: a.unidad || 'Porcentaje', periodicidad: a.periodicidad || 'Mensual', impacto: a.impacto || 'Bajo', ...datosDesdeProyecto({ proyecto, actividad: a }),
    };
    delete nuevos[id].proyecto;
    return { ...a, indicador_id: id };
  });
  return { actividades, nuevos };
}

/** Promedio trimestral del Cuadro (referencia para el avance del PEMS). */
export function promedioTrimestreCuadro(resultados = {}, indicadorId, anio, ti, meses) {
  if (indicadorId === '' || indicadorId == null) return null;
  const vals = meses.slice(ti * 3, ti * 3 + 3).map((m) => resultados[`${indicadorId}-${m}-${anio}`]?.valor).filter((v) => v !== null && v !== undefined && v !== '');
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, v) => s + Number(v), 0) / vals.length) * 10) / 10;
}
