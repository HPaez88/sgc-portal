// ═══════════════════════════
// CLIENTE HTTP ÚNICO DEL SGC
// Centraliza: base URL, headers, multi-organismo, timeout, errores de FastAPI.
// Toda llamada al backend debe pasar por aquí para tener manejo consistente.
// ═══════════════════════════
import { getApiUrl } from '../config';

const TIMEOUT_MS = 20000;

/** Error tipado con el status HTTP y el detalle ya extraído del backend. */
export class ApiError extends Error {
  constructor(message, { status = 0, detail = '', path = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.path = path;
  }
}

/**
 * Extrae un mensaje legible de una respuesta de error.
 * FastAPI devuelve { detail: string } o { detail: [{ msg, loc }] } (validación 422).
 */
function extraerDetalle(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  const detail = payload.detail ?? payload.message ?? payload.error;
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        const campo = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body').join('.') : '';
        return campo ? `${campo}: ${item.msg || 'valor inválido'}` : item.msg || 'valor inválido';
      })
      .join(' · ');
  }
  return '';
}

/** Organismo activo para el header multi-tenant del backend. */
let organismoActivo = null;

export function setOrganismoActivo(id) {
  organismoActivo = id ?? null;
}

// ───────────── Sesión (token firmado por el backend) ─────────────
const TOKEN_KEY = 'sgc-token';
export const EVENTO_SESION_EXPIRADA = 'sgc:sesion-expirada';

export function getToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch { /* almacenamiento bloqueado: la sesión dura lo que dure la pestaña */ }
}

function construirHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  if (organismoActivo != null) {
    headers['X-Organismo-Id'] = String(organismoActivo);
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Varias pantallas usan fetch() directo a /api (Asesor ISO, exportadores). En vez de tocar cada una,
 * se agrega la sesión a toda petición same-origin hacia /api que no traiga Authorization.
 */
if (typeof window !== 'undefined' && !window.__sgcFetchConSesion) {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const esApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
    const token = getToken();
    if (esApi && token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      return fetchOriginal(input, { ...init, headers });
    }
    return fetchOriginal(input, init);
  };
  window.__sgcFetchConSesion = true;
}

/** Un 401 con token presente significa sesión caducada o revocada: se avisa al contexto una sola vez. */
function notificarSesionExpirada(path) {
  if (!getToken() || path.includes('/auth/login')) return;
  setToken(null);
  try { window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA)); } catch { /* sin window */ }
}

/**
 * Petición genérica. Nunca lanza por status: devuelve siempre
 * { ok, status, data, error } para que el llamador decida.
 */
export async function request(path, { method = 'GET', body, headers, signal, timeoutMs = TIMEOUT_MS } = {}) {
  const url = getApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Permite cancelación externa además del timeout propio.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await fetch(url, {
      method,
      headers: construirHeaders(
        body && !esFormData ? { 'Content-Type': 'application/json' } : {},
      ),
      body: body ? (esFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const esJson = contentType.includes('application/json');
    const payload = esJson ? await response.json().catch(() => null) : null;
    if (response.status === 401) notificarSesionExpirada(path);

    if (!response.ok) {
      const detalle = extraerDetalle(payload) || `Error HTTP ${response.status}`;
      return {
        ok: false,
        status: response.status,
        data: null,
        error: new ApiError(detalle, { status: response.status, detail: detalle, path }),
      };
    }

    return { ok: true, status: response.status, data: payload, error: null };
  } catch (err) {
    const abortado = err?.name === 'AbortError';
    const mensaje = abortado
      ? 'La operación tardó demasiado. Verifica tu conexión e inténtalo de nuevo.'
      : 'No se pudo conectar con el servidor del SGC.';
    return {
      ok: false,
      status: 0,
      data: null,
      error: new ApiError(mensaje, { status: 0, detail: err?.message || '', path }),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Descarga binaria (Word/PDF) devolviendo un Blob o un error tipado. */
export async function requestBlob(path, { timeoutMs = 60000 } = {}) {
  const url = getApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: construirHeaders(), signal: controller.signal });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detalle = extraerDetalle(payload) || `Error HTTP ${response.status}`;
      return { ok: false, blob: null, error: new ApiError(detalle, { status: response.status, detail: detalle, path }) };
    }
    return { ok: true, blob: await response.blob(), error: null };
  } catch (err) {
    const abortado = err?.name === 'AbortError';
    return {
      ok: false,
      blob: null,
      error: new ApiError(
        abortado ? 'La generación del documento tardó demasiado.' : 'No se pudo conectar con el servidor del SGC.',
        { status: 0, detail: err?.message || '', path },
      ),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Descarga un Blob respetando el ciclo de vida del objectURL (evita descargas canceladas). */
export function descargarBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // El navegador necesita el objectURL vivo hasta que arranca la descarga.
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  blob: requestBlob,
};