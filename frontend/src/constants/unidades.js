// Unidades que pueden tener matriz de riesgos y oportunidades (2026-11-14): áreas, direcciones y subdirecciones.
// El FODA es solo de las áreas; las direcciones y el organismo se consolidan en los informes.
import { normalizarDireccion } from './areas';

export const TIPOS_UNIDAD = { direccion: 'Dirección', subdireccion: 'Subdirección', area: 'Área' };
const ORDEN = { direccion: 0, subdireccion: 1, area: 2 };

export function unidadesDeRiesgo(areasDetalle = [], direccionesDetalle = []) {
  const out = [];
  direccionesDetalle.forEach((d) => {
    if (!d?.nombre) return;
    const dir = normalizarDireccion(d.nombre);
    out.push({ nombre: d.nombre, tipo: 'direccion', direccion: dir, correo: d.correo || '', encargados_sgc: d.encargados_sgc || [], titular: d.director || '' });
    (d.subdirecciones || []).filter((s) => s?.nombre).forEach((s) => out.push({
      nombre: s.nombre, tipo: 'subdireccion', direccion: dir, correo: s.correo || '', encargados_sgc: [], titular: s.encargado || '',
    }));
  });
  areasDetalle.forEach((a) => {
    if (!a?.nombre) return;
    out.push({ nombre: a.nombre, tipo: 'area', direccion: normalizarDireccion(a.direccion || ''), correo: a.correo || '', encargados_sgc: a.encargados_sgc || [], titular: a.encargado || '', proposito: a.proposito, foda: a.foda });
  });
  // Sin duplicados por nombre (si un área se llama igual que una subdirección, gana la primera).
  const vistos = new Set();
  return out.filter((u) => (vistos.has(u.nombre) ? false : vistos.add(u.nombre)))
    .sort((a, b) => ORDEN[a.tipo] - ORDEN[b.tipo] || a.nombre.localeCompare(b.nombre, 'es'));
}
