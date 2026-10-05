// ═══════════════════════════
// SINCRONIZACIÓN CON SUPABASE
// Agrupa las escrituras (debounce) y resuelve conflictos por marca de tiempo.
// Problema que resuelve: antes cada pulsación de tecla disparaba un upsert
// completo de la tabla, y una recarga podía pisar datos locales más recientes.
// ═══════════════════════════
import { isSupabaseConfigured, supabase } from '../supabase';

const DEBOUNCE_MS = 800;

/** Cola de escrituras pendientes por tabla (solo el último valor cuenta). */
const pendientes = new Map();
const temporizadores = new Map();

/** Estado observable para indicar al usuario si hay cambios sin sincronizar. */
let estadoSync = { pendientes: 0, ultimoError: null, ultimaSync: null };
const suscriptores = new Set();

function notificar() {
  suscriptores.forEach((fn) => {
    try { fn(estadoSync); } catch { /* un suscriptor roto no debe romper la app */ }
  });
}

export function suscribirEstadoSync(fn) {
  suscriptores.add(fn);
  fn(estadoSync);
  return () => suscriptores.delete(fn);
}

export function getEstadoSync() {
  return estadoSync;
}

function actualizarEstado(patch) {
  estadoSync = { ...estadoSync, ...patch };
  notificar();
}

/** Marca de tiempo de un registro, para resolver conflictos. */
export function timestampRegistro(registro) {
  if (!registro || typeof registro !== 'object') return 0;
  const candidatos = [
    registro.updatedAt,
    registro.updated_at,
    registro.fecha_modificacion,
    registro.timestamp,
  ];
  for (const valor of candidatos) {
    if (!valor) continue;
    const t = new Date(valor).getTime();
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

/** ¿Los datos locales son más recientes que los remotos? */
export function localesMasRecientes(local, remoto) {
  const tLocal = timestampRegistro(local);
  const tRemoto = timestampRegistro(remoto);
  if (!tLocal) return false;
  if (!tRemoto) return true;
  return tLocal > tRemoto;
}

/** Limpia metadatos de Supabase antes de usar el registro en la app. */
export function mapearRegistroRemoto(registro) {
  if (!registro || typeof registro !== 'object') return registro;
  const { created_at, ...resto } = registro;
  return resto;
}

/**
 * Encola una escritura de tabla (array de registros) con debounce.
 * Múltiples llamadas seguidas solo producen una petición con el último estado.
 */
export function encolarGuardadoTabla(tabla, registros) {
  if (!isSupabaseConfigured || !supabase) return;
  if (!Array.isArray(registros)) return;

  const items = registros
    .filter((item) => item && item.id != null)
    .map(({ created_at, ...resto }) => resto);

  if (items.length === 0) return;

  pendientes.set(tabla, items);
  actualizarEstado({ pendientes: pendientes.size });

  if (temporizadores.has(tabla)) clearTimeout(temporizadores.get(tabla));

  const timer = setTimeout(async () => {
    temporizadores.delete(tabla);
    const lote = pendientes.get(tabla);
    pendientes.delete(tabla);
    if (!lote) return;

    try {
      const { error } = await supabase.from(tabla).upsert(lote, { onConflict: 'id' });
      if (error) {
        actualizarEstado({ ultimoError: `[${tabla}] ${error.message}`, pendientes: pendientes.size });
        console.warn(`Sync error [${tabla}]:`, error.message);
        return;
      }
      actualizarEstado({ ultimoError: null, ultimaSync: new Date().toISOString(), pendientes: pendientes.size });
    } catch (e) {
      actualizarEstado({ ultimoError: `[${tabla}] ${e?.message || 'error desconocido'}`, pendientes: pendientes.size });
      console.error(`Sync error [${tabla}]:`, e);
    }
  }, DEBOUNCE_MS);

  temporizadores.set(tabla, timer);
}

/** Encola una escritura de tabla de objeto (clave → JSON) con debounce. */
export function encolarGuardadoObjeto(tabla, clave, valor) {
  if (!isSupabaseConfigured || !supabase) return;
  if (valor == null) return;

  const claveCola = `${tabla}::${clave}`;
  pendientes.set(claveCola, { tabla, clave, valor });
  actualizarEstado({ pendientes: pendientes.size });

  if (temporizadores.has(claveCola)) clearTimeout(temporizadores.get(claveCola));

  const timer = setTimeout(async () => {
    temporizadores.delete(claveCola);
    const item = pendientes.get(claveCola);
    pendientes.delete(claveCola);
    if (!item) return;

    try {
      const { error } = await supabase
        .from(item.tabla)
        .upsert(
          [{ key: item.clave, data: JSON.stringify(item.valor), updated_at: new Date().toISOString() }],
          { onConflict: 'key' },
        );
      if (error) {
        actualizarEstado({ ultimoError: `[${item.tabla}] ${error.message}`, pendientes: pendientes.size });
        console.warn(`Sync object error [${item.tabla}]:`, error.message);
        return;
      }
      actualizarEstado({ ultimoError: null, ultimaSync: new Date().toISOString(), pendientes: pendientes.size });
    } catch (e) {
      actualizarEstado({ ultimoError: `[${item.tabla}] ${e?.message || 'error desconocido'}`, pendientes: pendientes.size });
      console.error(`Sync object error [${item.tabla}]:`, e);
    }
  }, DEBOUNCE_MS);

  temporizadores.set(claveCola, timer);
}

/** Escritura inmediata (sin debounce) para eventos críticos como la bitácora. */
export async function guardarInmediato(tabla, registros) {
  if (!isSupabaseConfigured || !supabase) return { ok: false };
  const items = (Array.isArray(registros) ? registros : [registros])
    .filter((item) => item && item.id != null)
    .map(({ created_at, ...resto }) => resto);
  if (items.length === 0) return { ok: false };
  try {
    const { error } = await supabase.from(tabla).upsert(items, { onConflict: 'id' });
    if (error) {
      actualizarEstado({ ultimoError: `[${tabla}] ${error.message}` });
      return { ok: false, error: error.message };
    }
    actualizarEstado({ ultimoError: null, ultimaSync: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    actualizarEstado({ ultimoError: `[${tabla}] ${e?.message || 'error'}` });
    return { ok: false, error: e?.message };
  }
}

/** Fuerza el vaciado inmediato de todas las colas pendientes. */
export function vaciarColas() {
  temporizadores.forEach((timer) => clearTimeout(timer));
  temporizadores.clear();
  pendientes.clear();
  actualizarEstado({ pendientes: 0 });
}