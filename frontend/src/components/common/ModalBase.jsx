// ═══════════════════════════
// MODAL BASE DEL SGC
// Extrae el patrón de modal repetido en Documentos, Indicadores y Riesgos.
// Resuelve de raíz: scroll interno, bloqueo de fondo, Escape, clic en backdrop,
// posicionamiento fijo respecto al viewport (no a la posición de scroll).
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
  '6xl': 'max-w-[97vw] xl:max-w-[1850px]',
};

/**
 * Modal accesible y con scroll controlado.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - titulo: ReactNode  (cabecera)
 *  - subtitulo: ReactNode
 *  - icono: ReactNode
 *  - headerClassName: string (por defecto la cabecera azul institucional)
 *  - footer: ReactNode
 *  - size: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl'|'5xl'|'6xl'
 *  - bodyClassName: string
 *  - closeOnBackdrop: boolean (default true)
 *  - closeOnEscape: boolean (default true)
 *  - lockScroll: boolean (default true)
 */
export default function ModalBase({
  isOpen,
  onClose,
  titulo,
  subtitulo,
  icono,
  headerClassName = 'bg-gradient-to-r from-[#0B192C] to-[#1E3E62]',
  footer,
  size = 'lg',
  anchoMaximo,
  bodyClassName = 'p-6',
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockScroll = true,
  ariaLabel,
}) {
  const claseAncho = anchoMaximo || (typeof size === 'string' && size.startsWith('max-w-') 
    ? size 
    : (TAMANOS[size] || TAMANOS.lg));

  // Bloqueo de scroll del documento mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen || !lockScroll) return undefined;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflowPrevio; };
  }, [isOpen, lockScroll]);

  // Cierre con Escape.
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const manejarBackdrop = (event) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) onClose?.();
  };

  /**
   * El modal se renderiza en un PORTAL colgado de document.body.
   *
   * Motivo: cualquier ancestro con `transform` (como las utilidades
   * `animate-fade-in-up` / `animate-slide-up` que usan translateY) se convierte
   * en el containing block de sus descendientes `position: fixed`. Sin portal,
   * el `fixed inset-0` del modal se anclaba al contenedor de la vista en lugar
   * de a la ventana, y el modal aparecía desplazado hacia abajo — con los
   * botones de acción fuera de la pantalla.
   *
   * El portal garantiza que el overlay se posicione siempre contra el viewport,
   * sin importar dónde se use el modal ni qué animaciones tenga su contenedor.
   */
  const contenido = (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={typeof titulo === 'string' ? titulo : ariaLabel}
      onMouseDown={manejarBackdrop}
    >
      {/*
        Centrado seguro, sin depender de la cadena de alturas del padre.

        El contenedor se posiciona en absoluto cubriendo el viewport con
        `inset-0` y centra la tarjeta con flex. Así el centrado se calcula
        siempre contra la altura real de la ventana, nunca contra la altura
        del contenido (que era el origen del bug: el modal aparecía desplazado
        hacia abajo y los botones de acción quedaban fuera de vista).

        Si el contenido es más alto que la pantalla, la tarjeta respeta su
        `max-h` y es su cuerpo interno el que hace scroll: la cabecera y el pie
        de acciones permanecen siempre visibles y alcanzables.
      */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          onMouseDown={(event) => event.stopPropagation()}
          className={`flex max-h-full w-full ${claseAncho} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-up`}
        >
          {/* Cabecera: siempre visible, nunca se desplaza fuera de vista */}
          <div className={`flex shrink-0 items-center justify-between gap-3 px-5 py-3.5 text-white sm:px-6 sm:py-4 ${headerClassName}`}>
            <div className="flex min-w-0 items-center gap-2.5">
              {icono && <div className="shrink-0 text-sky-400">{icono}</div>}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-white">{titulo}</h3>
                {subtitulo && (
                  <div className="mt-0.5 truncate text-[11px] text-slate-300">{subtitulo}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo: es lo único que hace scroll cuando el contenido es largo */}
          <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${bodyClassName}`}>{children}</div>

          {/* Pie de acciones: siempre visible y anclado, sin scroll */}
          {footer && (
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6 sm:py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(contenido, document.body)
    : contenido;
}