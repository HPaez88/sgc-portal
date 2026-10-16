// ═══════════════════════════════════════════════════════════════
// estadoService — estado operativo del organismo sincronizado con el servidor.
//
// El servidor (/api/v1/estado) es la fuente de verdad; localStorage queda como caché
// para arranque rápido y para seguir trabajando si se cae la red.
//   - Al iniciar sesión: se descarga todo el estado y se aplica a las claves montadas.
//   - Claves que solo existen en este navegador se suben una vez (migración de lo capturado antes).
//   - Cada cambio se guarda en servidor con debounce; si falla, queda pendiente y se reintenta.
// ═══════════════════════════════════════════════════════════════
import { api, getToken } from './apiClient';

const DEBOUNCE_MS = 800;
const REINTENTO_MS = 15000;
// Claves de sesión/preferencia local que NO se sincronizan.
const CLAVES_LOCALES = new Set(['sgc-token', 'sgc-usuario-sesion', 'sgc-sesion-activa', 'sgc-usuario-activo']);

export const esClaveSincronizada = (clave) => typeof clave === 'string' && clave.startsWith('sgc-') && !CLAVES_LOCALES.has(clave);

let servidor = null;            // Map clave -> valor (lo último conocido del servidor); null = aún no cargado
const setters = new Map();      // clave -> set de setters React para aplicar valores del servidor
const pendientes = new Map();   // clave -> valor por enviar
const timers = new Map();
let reintento = null;
let estadoSync = { pendientes: 0, ultimoError: null, ultimaSync: null, cargado: false };
const suscriptores = new Set();

function notificar() {
  suscriptores.forEach((fn) => { try { fn(estadoSync); } catch { /* un suscriptor roto no detiene al resto */ } });
}
function actualizarEstado(patch) { estadoSync = { ...estadoSync, ...patch }; notificar(); }

export function suscribirEstadoSync(fn) { suscriptores.add(fn); fn(estadoSync); return () => suscriptores.delete(fn); }
export function getEstadoSync() { return estadoSync; }

export function leerCache(clave) {
  try { const v = window.localStorage.getItem(clave); return v == null ? undefined : JSON.parse(v); } catch { return undefined; }
}
function escribirCache(clave, valor) {
  try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* cuota llena o bloqueado: el servidor sigue siendo la verdad */ }
}

/** Registra el setter de una clave montada. Si el servidor ya cargó y tiene valor, se aplica de inmediato. */
export function registrar(clave, setter, valorLocal) {
  if (!setters.has(clave)) setters.set(clave, new Set());
  setters.get(clave).add(setter);
  if (servidor) {
    if (servidor.has(clave)) setter(servidor.get(clave));
    else if (valorLocal !== undefined && valorLocal !== null) guardar(clave, valorLocal); // migración de lo capturado localmente
  }
  return () => setters.get(clave)?.delete(setter);
}

/** Guarda en caché y programa el envío al servidor. */
export function guardar(clave, valor) {
  escribirCache(clave, valor);
  if (!esClaveSincronizada(clave) || !getToken()) return;
  pendientes.set(clave, valor);
  actualizarEstado({ pendientes: pendientes.size });
  clearTimeout(timers.get(clave));
  timers.set(clave, setTimeout(() => enviar(clave), DEBOUNCE_MS));
}

async function enviar(clave) {
  if (!pendientes.has(clave) || !getToken()) return;
  const valor = pendientes.get(clave);
  const r = await api.put(`/api/v1/estado/${clave}`, { valor }, { timeoutMs: 30000 });
  if (r.ok) {
    if (pendientes.get(clave) === valor) pendientes.delete(clave); // si cambió mientras tanto, se reenviará
    servidor?.set(clave, valor);
    actualizarEstado({ pendientes: pendientes.size, ultimoError: null, ultimaSync: new Date().toISOString() });
  } else {
    actualizarEstado({ pendientes: pendientes.size, ultimoError: r.error?.message || r.error?.detail || 'Sin conexión con el servidor' });
    programarReintento();
  }
}

function programarReintento() {
  if (reintento) return;
  reintento = setTimeout(() => { reintento = null; [...pendientes.keys()].forEach(enviar); }, REINTENTO_MS);
}

/** Descarga el estado del organismo y lo aplica. Llamar al iniciar sesión (y al recargar con sesión vigente). */
export async function cargarDesdeServidor() {
  if (!getToken()) return false;
  const r = await api.get('/api/v1/estado', { timeoutMs: 30000 });
  if (!r.ok) { actualizarEstado({ ultimoError: r.error?.message || 'No se pudo cargar el estado' }); return false; }
  servidor = new Map(Object.entries(r.data || {}).map(([k, v]) => [k, v.valor]));
  for (const [clave, fns] of setters) {
    if (servidor.has(clave)) {
      const valor = servidor.get(clave);
      const local = leerCache(clave);
      // Red de seguridad: si este equipo tenía algo distinto, se conserva una copia local antes de que mande el servidor.
      if (local !== undefined && JSON.stringify(local) !== JSON.stringify(valor)) {
        try { window.localStorage.setItem(`respaldo:${clave}:${Date.now()}`, JSON.stringify(local)); } catch { /* sin espacio */ }
      }
      escribirCache(clave, valor);
      fns.forEach((fn) => fn(valor));
    } else {
      const local = leerCache(clave);
      if (local !== undefined && local !== null) guardar(clave, local); // este navegador tenía capturas: se suben
    }
  }
  actualizarEstado({ cargado: true, ultimoError: null, ultimaSync: new Date().toISOString() });
  return true;
}

/** Al cerrar sesión: se olvida el estado del servidor (no la caché, que es de este equipo). */
export function limpiarSesionSync() {
  servidor = null;
  pendientes.clear();
  timers.forEach(clearTimeout); timers.clear();
  actualizarEstado({ pendientes: 0, cargado: false });
}

/** Lectura/escritura directa para componentes que no usan el hook (mismo caché + sincronización). */
export function leerEstado(clave, porDefecto = null) {
  if (servidor?.has(clave)) return servidor.get(clave);
  const v = leerCache(clave);
  return v === undefined ? porDefecto : v;
}
export function escribirEstado(clave, valor) {
  guardar(clave, valor);
  setters.get(clave)?.forEach((fn) => fn(valor));
}

/** Compatibilidad con código que leía/escribía JSON en texto desde localStorage. */
export function leerEstadoTexto(clave) {
  const v = leerEstado(clave, undefined);
  if (v === undefined || v === null) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}
export function escribirEstadoTexto(clave, texto) {
  let valor = texto;
  if (typeof texto === 'string') { try { valor = JSON.parse(texto); } catch { valor = texto; } }
  escribirEstado(clave, valor);
}
