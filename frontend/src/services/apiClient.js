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

function construirHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  if (organismoActivo != null) {
    headers['X-Organismo-Id'] = String(organismoActivo);
  }
  return headers;
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