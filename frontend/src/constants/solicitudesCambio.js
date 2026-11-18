// Solicitudes de cambio de una AC o PM ya aprobada (ISO 9001 §6.3, planificación de los cambios):
// el área propone agregar, corregir o quitar una actividad con su justificación; el SGC aprueba o rechaza.
// Funciones puras: devuelven un registro nuevo, nunca modifican el recibido.
import { leerActividades } from './workflow';

export const TIPOS_CAMBIO = {
  AGREGAR: 'Agregar actividad',
  MODIFICAR: 'Corregir actividad',
  QUITAR: 'Quitar actividad',
};
const MIN_JUSTIFICACION = 10;
const CAMPOS = ['actividad', 'responsable', 'fecha_termino_sugerida', 'evidencia_esperada'];
const NOMBRES = { actividad: 'descripción', responsable: 'responsable', fecha_termino_sugerida: 'fecha compromiso', evidencia_esperada: 'evidencia esperada' };

export const leerSolicitudes = (r) => (Array.isArray(r?.solicitudes_cambio) ? r.solicitudes_cambio : []);
export const solicitudesPendientes = (r) => leerSolicitudes(r).filter((s) => s.estado === 'PENDIENTE');

// AC guarda "actividades_json"; PM guarda "actividades" (mismo orden de lectura que leerActividades).
const conActividades = (r, lista) => (r.actividades !== undefined
  ? { ...r, actividades: JSON.stringify(lista) }
  : { ...r, actividades_json: JSON.stringify(lista) });

const faltaEnPropuesta = (p = {}) => CAMPOS.find((c) => !String(p[c] || '').trim());

export function nuevaSolicitud(registro, { tipo, indice = null, propuesta = null, justificacion = '' }, por, ahora = new Date().toISOString()) {
  const acts = leerActividades(registro);
  if (!TIPOS_CAMBIO[tipo]) return { registro, error: 'Elige qué tipo de cambio solicitas.' };
  if (String(justificacion).trim().length < MIN_JUSTIFICACION) return { registro, error: `Escribe la justificación del cambio (mínimo ${MIN_JUSTIFICACION} caracteres).` };
  const actual = tipo === 'AGREGAR' ? null : acts[indice];
  if (tipo !== 'AGREGAR' && !actual) return { registro, error: 'Elige la actividad que quieres cambiar.' };
  if (tipo === 'QUITAR' && actual.evidencia_real) return { registro, error: 'Esa actividad ya tiene evidencia; no se puede quitar.' };
  if (tipo !== 'QUITAR') {
    const falta = faltaEnPropuesta(propuesta);
    if (falta) return { registro, error: `La actividad propuesta debe tener ${NOMBRES[falta]}.` };
  }
  const solicitud = {
    id: `SC-${Date.parse(ahora) || Date.now()}-${leerSolicitudes(registro).length + 1}`,
    tipo,
    indice: tipo === 'AGREGAR' ? null : indice,
    actividad_actual: actual ? actual.actividad || '' : '',
    propuesta: tipo === 'QUITAR' ? null : { ...propuesta },
    justificacion: String(justificacion).trim(),
    solicitante: por?.nombre || '', solicitante_email: por?.email || '',
    fecha_solicitud: ahora,
    estado: 'PENDIENTE',
  };
  return { registro: { ...registro, solicitudes_cambio: [...leerSolicitudes(registro), solicitud] }, error: null };
}

const resolver = (registro, id, cambios) => ({
  ...registro,
  solicitudes_cambio: leerSolicitudes(registro).map((s) => (s.id === id ? { ...s, ...cambios } : s)),
});

export function aprobarSolicitud(registro, id, por, ahora = new Date().toISOString()) {
  const s = solicitudesPendientes(registro).find((x) => x.id === id);
  if (!s) return { registro, error: 'La solicitud ya fue atendida.' };
  const acts = leerActividades(registro);
  const actual = s.tipo === 'AGREGAR' ? null : acts[s.indice];
  // ponytail: empata por posición + texto; si alguien movió la actividad, el SGC la edita a mano.
  if (s.tipo !== 'AGREGAR' && (!actual || (actual.actividad || '') !== s.actividad_actual)) {
    return { registro, error: 'La actividad cambió desde que se pidió; edítala directamente por sección.' };
  }
  if (s.tipo === 'QUITAR' && actual.evidencia_real) return { registro, error: 'Esa actividad ya tiene evidencia; no se puede quitar.' };
  const lista = s.tipo === 'AGREGAR'
    ? [...acts, { id: `act-${s.id}`, ...s.propuesta, evidencia_real: '', estatus: 'PENDIENTE' }]
    : s.tipo === 'MODIFICAR'
      ? acts.map((a, i) => (i === s.indice ? { ...a, ...s.propuesta, evidencia_real: a.evidencia_real || '' } : a))
      : acts.filter((_, i) => i !== s.indice);
  const resuelto = resolver(registro, id, { estado: 'APROBADA', resuelto_por: por, fecha_resolucion: ahora });
  return { registro: conActividades(resuelto, lista), error: null };
}

export const rechazarSolicitud = (registro, id, por, motivo, ahora = new Date().toISOString()) =>
  resolver(registro, id, { estado: 'RECHAZADA', resuelto_por: por, motivo_rechazo: String(motivo || '').trim(), fecha_resolucion: ahora });
