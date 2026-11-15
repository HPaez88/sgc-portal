// Descarga de los formatos oficiales del Ayuntamiento (proyecto, ficha técnica, PEMS) llenos con el Proyecto anual.
// El servidor vierte los datos en la plantilla original sin modificarla; 'pdf' la convierte tal cual.
import { requestBlob, descargarBlob } from './apiClient';
import { getEstadoSync } from './estadoService';

export async function esperarSincronizacion(maxMs = 6000) {
  const inicio = Date.now();
  while (getEstadoSync().pendientes > 0 && Date.now() - inicio < maxMs) await new Promise((r) => setTimeout(r, 300));
  return getEstadoSync().pendientes === 0;
}

const EXTENSION = { proyecto: 'docx', ficha: 'docx', pems: 'xlsx' };

// Devuelve null si salió bien o el mensaje de error.
export async function descargarFormatoOficial(proyecto, tipo, { actividad = 0, formato = 'original' } = {}) {
  if (!(await esperarSincronizacion())) return 'Aún no se sincroniza con el servidor. Intenta en unos segundos.';
  const r = await requestBlob(`/api/v1/indicadores/formatos/${encodeURIComponent(proyecto.id)}/${tipo}?actividad=${actividad}&formato=${formato}`);
  if (!r.ok) return r.error?.message || 'No se pudo generar el formato.';
  const base = `${proyecto.anio} ${proyecto.area}`;
  const nombre = { proyecto: `Formato de Presentación de Proyectos ${base}`, pems: `PEMS ${base}`, ficha: `${actividad + 1}- Ficha técnica de indicador ${base}` }[tipo];
  descargarBlob(r.blob, `${nombre}.${formato === 'pdf' ? 'pdf' : EXTENSION[tipo]}`);
  return null;
}

// Proyecto y número de actividad de donde sale la ficha oficial de un indicador del Cuadro.
export function origenFicha(indicador, proyectos = []) {
  if (!indicador?.proyecto?.id) return null;
  const p = proyectos.find((x) => x.id === indicador.proyecto.id);
  const i = (p?.actividades || []).findIndex((a) => String(a.indicador_id) === String(indicador.id));
  return p && i >= 0 ? { proyecto: p, actividad: i } : null;
}
