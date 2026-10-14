// ═══════════════════════════════════════════════════════════════
// archivosService — subida y consulta de archivos (evidencias) vía backend.
// El backend valida tipo real, pasa antivirus, sanea y guarda en Backblaze B2.
// La URL de lectura redirige a un enlace firmado que caduca; usar siempre urlArchivo(id).
// ═══════════════════════════════════════════════════════════════
import { api } from './apiClient';
import { getApiUrl } from '../config';

export const urlArchivo = (id, { descargar = false } = {}) =>
  getApiUrl(`/api/v1/archivos/${id}/url${descargar ? '?descargar=true' : ''}`);

/**
 * Sube un archivo ya validado en el navegador. Devuelve { ok, data, error }.
 * data = registro del backend (id, nombre, mime, tipo, bytes, sha256, fecha_subida, ...).
 */
export async function subirArchivo(file, { entidad = 'evidencia', referencia, descripcion, subidoPor } = {}) {
  const form = new FormData();
  form.append('archivo', file, file.name);
  form.append('entidad', entidad);
  if (referencia) form.append('referencia', String(referencia));
  if (descripcion) form.append('descripcion', descripcion);
  if (subidoPor) form.append('subido_por', subidoPor);
  return api.post('/api/v1/archivos', form, { timeoutMs: 120000 });
}

export const listarArchivos = (entidad, referencia) =>
  api.get(`/api/v1/archivos?entidad=${encodeURIComponent(entidad)}${referencia ? `&referencia=${encodeURIComponent(referencia)}` : ''}`);

export const borrarArchivo = (id) => api.delete(`/api/v1/archivos/${id}`);
