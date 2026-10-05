// ═══════════════════════════
// CLIENTE DE WORKFLOW DEL SGC
// El backend es la fuente única de verdad de estados, transiciones y permisos.
// Este servicio las descarga una vez y las cachea; si el backend no responde,
// usa el respaldo local (frontend/src/constants/workflow.js) para no bloquear la UI.
// ═══════════════════════════
import { api } from './apiClient';
import {
  TRANSICIONES as TRANSICIONES_LOCAL,
  ESTADO_META as ESTADO_META_LOCAL,
  ESTADOS_CERRADOS as ESTADOS_CERRADOS_LOCAL,
  PERMISOS as PERMISOS_LOCAL,
  normalizarEstado as normalizarLocal,
} from '../constants/workflow';

const CACHE_KEY = 'sgc-workflow-cache';

let workflow = {
  transiciones: TRANSICIONES_LOCAL,
  estadosMeta: ESTADO_META_LOCAL,
  estadosCerrados: ESTADOS_CERRADOS_LOCAL,
  permisosRol: PERMISOS_LOCAL,
  normalizacion: {},
  origen: 'local',
};

let promesaCarga = null;
const suscriptores = new Set();

function notificar() {
  suscriptores.forEach((fn) => {
    try { fn(workflow); } catch { /* noop */ }
  });
}

export function suscribirWorkflow(fn) {
  suscriptores.add(fn);
  fn(workflow);
  return () => suscriptores.delete(fn);
}

export function getWorkflow() {
  return workflow;
}

/** Lee el workflow cacheado en localStorage (arranque inmediato sin esperar red). */
function cargarDesdeCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (cache?.transiciones) {
      workflow = { ...workflow, ...cache, origen: 'cache' };
      notificar();
    }
  } catch {
    /* cache corrupto: se ignora y se sigue con el respaldo local */
  }
}

/**
 * Descarga el workflow del backend. Es idempotente: llamadas simultáneas
 * comparten la misma promesa.
 */
export function cargarWorkflow({ forzar = false } = {}) {
  if (promesaCarga && !forzar) return promesaCarga;

  promesaCarga = (async () => {
    const { ok, data } = await api.get('/api/v1/catalogos/workflow');
    if (!ok || !data) {
      // Sin backend disponible: seguimos con el respaldo local.
      return workflow;
    }

    workflow = {
      transiciones: data.transiciones || TRANSICIONES_LOCAL,
      estadosMeta: data.estados_meta || ESTADO_META_LOCAL,
      estadosCerrados: data.estados_cerrados || ESTADOS_CERRADOS_LOCAL,
      permisosRol: data.permisos_rol || PERMISOS_LOCAL,
      normalizacion: data.normalizacion_estados || {},
      acciones: data.acciones_workflow || [],
      origen: 'backend',
    };

    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({
        transiciones: workflow.transiciones,
        estadosMeta: workflow.estadosMeta,
        estadosCerrados: workflow.estadosCerrados,
        permisosRol: workflow.permisosRol,
        normalizacion: workflow.normalizacion,
      }));
    } catch {
      /* cuota de localStorage: el workflow sigue en memoria */
    }

    notificar();
    return workflow;
  })();

  return promesaCarga;
}

/** Transiciones permitidas desde un estado, según la fuente activa. */
export function transicionesDesde(estado) {
  const canonico = normalizarEstado(estado);
  return workflow.transiciones?.[canonico] || [];
}

/** ¿Es válida la transición estado → nuevoEstado? */
export function transicionValida(estadoActual, nuevoEstado) {
  const permitidas = transicionesDesde(estadoActual);
  return permitidas.includes(normalizarEstado(nuevoEstado));
}

/** Normaliza estados heredados usando el mapa del backend si está disponible. */
export function normalizarEstado(estado) {
  if (!estado) return 'BORRADOR';
  const mapa = workflow.normalizacion || {};
  return mapa[estado] || normalizarLocal(estado);
}

/** Metadatos de presentación (label, grupo, color) de un estado. */
export function metaEstado(estado) {
  const canonico = normalizarEstado(estado);
  return workflow.estadosMeta?.[canonico]
    || ESTADO_META_LOCAL[canonico]
    || { label: canonico, grupo: 'abierto', color: 'bg-slate-100 text-slate-600 border-slate-200' };
}

/** ¿El usuario puede ejecutar la acción, según la matriz del backend? */
export function puedeEjecutar(usuario, accion) {
  if (!usuario?.rol) return false;
  const permisos = workflow.permisosRol?.[usuario.rol] || PERMISOS_LOCAL[usuario.rol] || [];
  return permisos.includes(accion);
}

/** ¿El estado pertenece al grupo cerrado? */
export function estadoCerrado(estado) {
  const canonico = normalizarEstado(estado);
  return (workflow.estadosCerrados || ESTADOS_CERRADOS_LOCAL).includes(canonico);
}

// Arranque: cache inmediato, red en segundo plano.
cargarDesdeCache();

export default {
  cargarWorkflow,
  getWorkflow,
  suscribirWorkflow,
  transicionesDesde,
  transicionValida,
  normalizarEstado,
  metaEstado,
  puedeEjecutar,
  estadoCerrado,
};