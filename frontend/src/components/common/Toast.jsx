// ═══════════════════════════
// SISTEMA DE NOTIFICACIONES NO BLOQUEANTES DEL SGC
// Sustituye a los alert() nativos, respetando el diseño visual actual.
// ═══════════════════════════
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800', iconColor: 'text-emerald-600' },
  error: { icon: XCircle, ring: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-800', iconColor: 'text-rose-600' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800', iconColor: 'text-amber-600' },
  info: { icon: Info, ring: 'border-sky-200', bg: 'bg-sky-50', text: 'text-sky-800', iconColor: 'text-sky-600' },
};

const DURACION_POR_DEFECTO = 4500;

function ToastItem({ toast, onClose }) {
  const estilo = ESTILOS[toast.tipo] || ESTILOS.info;
  const Icono = estilo.icon;

  useEffect(() => {
    if (toast.persistente) return undefined;
    const id = setTimeout(() => onClose(toast.id), toast.duracion ?? DURACION_POR_DEFECTO);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  return (
    <div
      role={toast.tipo === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl border ${estilo.ring} ${estilo.bg} px-4 py-3 shadow-lg animate-fade-in-up`}
    >
      <Icono size={18} className={`${estilo.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {toast.titulo && (
          <p className={`text-xs font-extrabold ${estilo.text}`}>{toast.titulo}</p>
        )}
        <p className={`text-xs ${estilo.text} ${toast.titulo ? 'mt-0.5' : ''} break-words`}>
          {toast.mensaje}
        </p>
        {toast.accion && (
          <button
            type="button"
            onClick={() => {
              toast.accion.onClick?.();
              onClose(toast.id);
            }}
            className={`mt-2 text-[11px] font-bold underline ${estilo.text} hover:opacity-80`}
          >
            {toast.accion.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Cerrar notificación"
        className={`shrink-0 p-1 rounded-lg ${estilo.text} hover:bg-black/5 transition-colors`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);

  const cerrar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notificar = useCallback((mensaje, opciones = {}) => {
    const id = `toast-${Date.now()}-${(contador.current += 1)}`;
    const tipo = typeof opciones === 'string' ? opciones : (opciones.tipo || 'info');
    const resto = typeof opciones === 'string' ? {} : opciones;
    setToasts((prev) => [...prev, { id, mensaje: String(mensaje ?? ''), tipo, ...resto }].slice(-4));
    return id;
  }, []);

  const api = useMemo(() => ({
    notificar,
    cerrar,
    success: (mensaje, opciones) => notificar(mensaje, { ...(opciones || {}), tipo: 'success' }),
    error: (mensaje, opciones) => notificar(mensaje, { ...(opciones || {}), tipo: 'error' }),
    warning: (mensaje, opciones) => notificar(mensaje, { ...(opciones || {}), tipo: 'warning' }),
    info: (mensaje, opciones) => notificar(mensaje, { ...(opciones || {}), tipo: 'info' }),
  }), [notificar, cerrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Devuelve el API de notificaciones. Si no hay provider, degrada a consola. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  return {
    notificar: (m) => console.warn('[toast]', m),
    cerrar: () => { },
    success: (m) => console.info('[toast:success]', m),
    error: (m) => console.error('[toast:error]', m),
    warning: (m) => console.warn('[toast:warning]', m),
    info: (m) => console.info('[toast:info]', m),
  };
}

export default ToastProvider;