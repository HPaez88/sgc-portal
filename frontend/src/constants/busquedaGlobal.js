// Buscador global del portal (2026-11-14): busca en módulos, acciones, planes, reportes de corrección,
// riesgos, indicadores, documentos, áreas y usuarios. Sin acentos y por varias palabras.
// Respeta el alcance: quien no ve todas las áreas solo encuentra registros de la suya. Lógica pura (probada).
const sinAcentos = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const MAX_POR_GRUPO = 6;

const coincide = (palabras, ...campos) => {
  const texto = sinAcentos(campos.filter((c) => c != null).join(' '));
  return palabras.every((p) => texto.includes(p));
};
const corto = (t, n = 90) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n)}…` : s; };

export function buscarGlobal(texto, {
  modulos = [], acciones = [], planes = [], reportes = [], riesgos = [], indicadores = [], documentos = [], areas = [], usuarios = [],
  puedeTodasAreas = true, areaUsuario = '', esAdmin = false,
} = {}) {
  const palabras = sinAcentos(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length || sinAcentos(texto).trim().length < 2) return [];
  const delAlcance = (r) => puedeTodasAreas || !areaUsuario || r.area === areaUsuario || r.gerencia_coordinacion === areaUsuario;
  const grupos = [
    ['Módulos', modulos.filter((m) => coincide(palabras, m.label)).map((m) => ({ titulo: m.label, detalle: 'Ir al módulo', destino: { tab: m.id } }))],
    ['Acciones correctivas', acciones.filter(delAlcance).filter((a) => coincide(palabras, a.folio_codigo, a.area, a.proceso, a.origen, a.descripcion_no_conformidad_final, a.descripcion_no_conformidad_original))
      .map((a) => ({ titulo: a.folio_codigo || 'AC sin folio', detalle: `${a.area || ''} · ${corto(a.descripcion_no_conformidad_final || a.descripcion_no_conformidad_original)}`, destino: { tab: 'ac', abrir: { clave: 'sgc-abrir-ac', id: a.id } } }))],
    ['Planes de mejora', planes.filter(delAlcance).filter((p) => coincide(palabras, p.folio_codigo, p.area, p.titulo_mejora, p.origen, p.proceso))
      .map((p) => ({ titulo: p.folio_codigo || 'PM sin folio', detalle: `${p.area || ''} · ${corto(p.titulo_mejora)}`, destino: { tab: 'pm', abrir: { clave: 'sgc-abrir-pm', id: p.id } } }))],
    ['Reportes de corrección', reportes.filter(delAlcance).filter((r) => coincide(palabras, r.folio, r.area, r.descripcion, r.origen, r.origen_referencia))
      .map((r) => ({ titulo: r.folio, detalle: `${r.area || ''} · ${corto(r.descripcion)}`, destino: { tab: 'ac', abrir: { clave: 'sgc-abrir-rc', id: r.id } } }))],
    ['Riesgos y oportunidades', riesgos.filter((r) => r.anio && delAlcance(r)).filter((r) => coincide(palabras, r.descripcion, r.area, r.proceso, r.tipo, r.pm_folio))
      .map((r) => ({ titulo: `${r.tipo} ${r.anio}`, detalle: `${r.area} · ${corto(r.descripcion)}`, destino: { tab: 'riesgos' } }))],
    ['Indicadores', indicadores.filter(delAlcance).filter((i) => coincide(palabras, `#${i.id}`, i.id, i.nombre, i.area, i.proceso))
      .map((i) => ({ titulo: `Indicador #${i.id}`, detalle: `${corto(i.nombre)} · ${i.area || ''}`, destino: { tab: 'indicadores' } }))],
    ['Documentos', documentos.filter((d) => coincide(palabras, d.clave, d.nombre, d.titulo, d.tipo))
      .map((d) => ({ titulo: d.clave || d.nombre || d.titulo, detalle: corto(d.nombre || d.titulo), destino: { tab: 'documents' } }))],
    ...(esAdmin ? [
      ['Áreas', areas.filter((a) => coincide(palabras, a.nombre, a.direccion, a.encargado)).map((a) => ({ titulo: a.nombre, detalle: a.direccion || '', destino: { tab: 'settings' } }))],
      ['Usuarios', usuarios.filter((u) => coincide(palabras, u.nombre, u.email, u.area, u.rol)).map((u) => ({ titulo: u.nombre, detalle: `${u.email} · ${u.area || ''}`, destino: { tab: 'settings' } }))],
    ] : []),
  ];
  return grupos.filter(([, items]) => items.length).map(([grupo, items]) => ({ grupo, total: items.length, items: items.slice(0, MAX_POR_GRUPO) }));
}
