// Agrupa registros históricos para consultarlos sin scroll infinito (regla del portal):
// días del mes en curso, meses ya cerrados del año en curso y años anteriores. Fechas en hora local.
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dos = (n) => String(n).padStart(2, '0');

export function periodoDe(fecha, hoy = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return { id: 'sin-fecha', tipo: 'anio', etiqueta: 'Sin fecha' };
  const [a, m, dia] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
  if (a === hoy.getFullYear() && m === hoy.getMonth() + 1) return { id: `${a}-${dos(m)}-${dos(dia)}`, tipo: 'dia', etiqueta: `${dos(dia)}/${dos(m)}/${a}` };
  if (a === hoy.getFullYear()) return { id: `${a}-${dos(m)}`, tipo: 'mes', etiqueta: `${MESES[m - 1]} ${a}` };
  return { id: String(a), tipo: 'anio', etiqueta: `Año ${a}` };
}

// [{id, tipo, etiqueta, items}] del más reciente al más antiguo; los items conservan su orden.
export function agruparPorPeriodo(items, fechaDe, hoy = new Date()) {
  const grupos = new Map();
  for (const it of items || []) {
    const p = periodoDe(fechaDe(it), hoy);
    if (!grupos.has(p.id)) grupos.set(p.id, { ...p, items: [] });
    grupos.get(p.id).items.push(it);
  }
  return [...grupos.values()].sort((x, y) => (x.id < y.id ? 1 : -1));
}
