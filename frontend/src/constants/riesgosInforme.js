// Informes de riesgos y oportunidades por área, por dirección y del organismo (etapa 3, 2026-11-13).
// Lógica pura: cifras, desglose, comparativo contra años anteriores y hallazgos para decidir.
import { nivelDe, puntaje, estadoRiesgo } from './riesgos';
import { getVencimiento } from './workflow';

const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
const prom = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

export function resumenRiesgos(items = [], planes = []) {
  const riesgos = items.filter((r) => r.tipo === 'Riesgo');
  const oportunidades = items.filter((r) => r.tipo === 'Oportunidad');
  const nivel = (n) => riesgos.filter((r) => nivelDe(r)?.nivel === n).length;
  const conPM = items.filter((r) => r.pm_id);
  const vencidos = conPM.filter((r) => {
    const pm = planes.find((p) => String(p.id) === String(r.pm_id));
    return pm && getVencimiento(pm).nivel === 'vencido';
  });
  const dictaminados = items.filter((r) => r.dictamen);
  const eficaces = dictaminados.filter((r) => r.dictamen.resultado === 'EFICAZ');
  const reducciones = riesgos.filter((r) => r.dictamen && r.residual).map((r) => puntaje(r) - puntaje(r.residual));
  return {
    total: items.length,
    riesgos: riesgos.length,
    oportunidades: oportunidades.length,
    altos: nivel('Alto'), medios: nivel('Medio'), bajos: nivel('Bajo'),
    nivelPromedio: prom(riesgos.map(puntaje).filter(Boolean)),
    conPM: conPM.length,
    vencidos: vencidos.length,
    porDictaminar: items.filter((r) => estadoRiesgo(r, planes) === 'PENDIENTE_DICTAMEN').length,
    dictaminados: dictaminados.length,
    eficaces: eficaces.length,
    eficacia: pct(eficaces.length, dictaminados.length),
    reduccionPromedio: prom(reducciones),
    // Riesgos altos que el área decidió aceptar (sin plan): la dirección debe conocerlos.
    altosAceptados: riesgos.filter((r) => nivelDe(r)?.nivel === 'Alto' && !r.pm_id && r.tratamiento === 'Aceptar').length,
  };
}

// Una fila por grupo (área o dirección), ordenadas por riesgos altos y luego total.
export function desgloseRiesgos(items, planes, claveDe) {
  const grupos = new Map();
  items.forEach((r) => {
    const k = claveDe(r) || 'Sin asignar';
    grupos.set(k, [...(grupos.get(k) || []), r]);
  });
  return [...grupos.entries()]
    .map(([nombre, lista]) => ({ nombre, ...resumenRiesgos(lista, planes) }))
    .sort((a, b) => b.altos - a.altos || b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}

// Cifras por año (del más antiguo al más reciente) para comparar contra años pasados.
export function comparativoAnual(items, planes, anios) {
  return [...anios].sort((a, b) => a - b).map((anio) => ({
    anio, ...resumenRiesgos(items.filter((r) => Number(r.anio) === Number(anio)), planes),
  }));
}

// Hallazgos en lenguaje llano para la toma de decisiones (orden: lo más urgente primero).
export function hallazgosRiesgos({ actual, anterior, desglose = [], cobertura, anio }) {
  const h = [];
  if (!actual.total) return [{ tono: 'info', texto: `No hay riesgos ni oportunidades registrados para ${anio}.` }];
  if (actual.vencidos) h.push({ tono: 'alerta', texto: `${actual.vencidos} plan(es) de mejora de riesgos están vencidos: solicitar replanteo o dictaminar.` });
  if (actual.porDictaminar) h.push({ tono: 'alerta', texto: `${actual.porDictaminar} registro(s) con plan cerrado por el auditor esperan el dictamen de eficacia del SGC.` });
  if (actual.altosAceptados) h.push({ tono: 'alerta', texto: `${actual.altosAceptados} riesgo(s) alto(s) se aceptaron sin plan de acción: confirmar con la dirección.` });
  if (anterior?.total) {
    const d = actual.altos - anterior.altos;
    if (d > 0) h.push({ tono: 'alerta', texto: `Los riesgos altos subieron de ${anterior.altos} a ${actual.altos} respecto a ${anio - 1}.` });
    else if (d < 0) h.push({ tono: 'bien', texto: `Los riesgos altos bajaron de ${anterior.altos} a ${actual.altos} respecto a ${anio - 1}.` });
    if (actual.nivelPromedio != null && anterior.nivelPromedio != null && actual.nivelPromedio !== anterior.nivelPromedio) {
      h.push({ tono: actual.nivelPromedio < anterior.nivelPromedio ? 'bien' : 'info', texto: `El nivel promedio de riesgo pasó de ${anterior.nivelPromedio} en ${anio - 1} a ${actual.nivelPromedio} en ${anio}.` });
    }
  } else {
    h.push({ tono: 'info', texto: `No hay datos de ${anio - 1} para comparar; este año sirve de línea base.` });
  }
  const top = desglose.filter((g) => g.altos > 0).slice(0, 3);
  if (top.length) h.push({ tono: 'info', texto: `Concentran los riesgos altos: ${top.map((g) => `${g.nombre} (${g.altos})`).join(', ')}.` });
  if (actual.eficacia != null) {
    h.push({ tono: actual.eficacia >= 80 ? 'bien' : 'alerta', texto: `Eficacia de los tratamientos: ${actual.eficacia}% (${actual.eficaces} de ${actual.dictaminados} dictaminados)${actual.reduccionPromedio != null ? `; el nivel bajó en promedio ${actual.reduccionPromedio} puntos` : ''}.` });
  }
  if (actual.riesgos && !actual.oportunidades) h.push({ tono: 'info', texto: 'No se identificaron oportunidades: la norma pide atender riesgos y oportunidades (§ 6.1).' });
  if (cobertura && cobertura.total) {
    const faltan = cobertura.total - cobertura.aceptadas;
    h.push({ tono: faltan ? 'info' : 'bien', texto: `${cobertura.aceptadas} de ${cobertura.total} área(s) tienen su matriz ${anio} aceptada por el SGC${faltan ? `; faltan ${faltan}` : ''}.` });
  }
  return h;
}
