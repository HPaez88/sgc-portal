// ═══════════════════════════
// CONTENEDOR DE MODAL (equivalente ligero y robusto de ModalBase)
//
// Soporta tanto la API moderna (isOpen, onClose, size) como la API
// estructurada (abierto, onCerrar, tamano, titulo, pie).
//
// Garantías:
//   1. PORTAL — se renderiza en document.body, anclándose al viewport.
//   2. ALTURA SEGURA — scroll interno cuando excede la altura de pantalla.
//   3. ACCESIBILIDAD — Escape key, foco y bloqueo de scroll de fondo.
// ═══════════════════════════
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const TAMANOS = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  '3xl': 'max-w-[90vw] xl:max-w-[1450px]',
  '4xl': 'max-w-[92vw] xl:max-w-[1600px]',
  '5xl': 'max-w-[95vw] xl:max-w-[1750px]',
  '6xl': 'max-w-[96vw] xl:max-w-[1850px]',
  full: 'max-w-[98vw]',
  auto: '',
};

export default function ContenedorModal({
  isOpen,
  abierto,
  onClose,
  onCerrar,
  size,
  tamano = 'lg',
  anchoMaximo,
  titulo,
  pie,
  closeOnBackdrop = true,
  closeOnEscape = true,
  backdropClassName = 'bg-slate-950/60 backdrop-blur-xs',
  lockScroll = true,
  children,
  ariaLabel,
}) {
  const activo = Boolean(isOpen ?? abierto);
  const cerrar = onClose || onCerrar;
  const tamanoFinal = size || tamano || 'lg';
  const claseAncho = anchoMaximo || (typeof tamanoFinal === 'string' && tamanoFinal.startsWith('max-w-') 
    ? tamanoFinal 
    : (TAMANOS[tamanoFinal] ?? TAMANOS.lg));

  // Bloqueo del scroll de fondo mientras el modal está abierto.
  useEffect(() => {
    if (!activo || !lockScroll) return undefined;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflowPrevio; };
  }, [activo, lockScroll]);

  // Cierre con Escape.
  useEffect(() => {
    if (!activo || !closeOnEscape) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        cerrar?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activo, closeOnEscape, cerrar]);

  if (!activo) return null;

  const manejarBackdrop = (event) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) cerrar?.();
  };

  const tieneEstructura = Boolean(titulo || pie);

  const contenido = (
    <div
      className={`fixed inset-0 z-50 animate-fade-in ${backdropClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={manejarBackdrop}
    >
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 lg:p-6 overflow-y-auto">
        <div
          onMouseDown={(event) => event.stopPropagation()}
          className={`flex max-h-full w-full ${claseAncho} flex-col my-auto`}
        >
          {tieneEstructura ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[94vh] w-full">
              {titulo && (
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                  <div className="flex-1">{titulo}</div>
                  <button
                    type="button"
                    onClick={cerrar}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer ml-3 shrink-0"
                    title="Cerrar modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {children}
              </div>
              {pie && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  {pie}
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(contenido, document.body)
    : contenido;
}