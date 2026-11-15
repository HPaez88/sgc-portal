// Folios oficiales AC#n/aaaa y OM#n/aaaa: los asigna el servidor con bloqueo de fila (POST /api/v1/folios),
// así dos aprobaciones simultáneas nunca reciben el mismo número. Devuelve { numero, anio, codigo }.
import { api } from './apiClient';

export async function asignarFolios(tipo, cantidad = 1) {
  const r = await api.post(`/api/v1/folios/${tipo}?cantidad=${cantidad}`, {});
  if (!r.ok) throw new Error(r.error?.message || r.error?.detail || 'No se pudo asignar el folio. Revisa tu conexión e intenta de nuevo.');
  return r.data.folios;
}

export async function asignarFolio(tipo) {
  return (await asignarFolios(tipo, 1))[0];
}
