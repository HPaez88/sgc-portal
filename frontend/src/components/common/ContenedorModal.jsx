// ═══════════════════════════
// CONTENEDOR DE MODAL (equivalente ligero de ModalBase)
//
// Existe para migrar los modales que ya tienen su propia cabecera y estilos
// internos: en lugar de reescribir todo el JSX, se envuelve el contenido con
// este componente y obtiene las dos garantías que hoy faltan en 17 modales:
//
//   1. PORTAL — se renderiza en document.body, así que `position: fixed` se
//      ancla al viewport y no al contenedor animado. Sin esto, cualquier
//      ancestro con `transform` (animate-fade-in-up, animate-slide-up) desplaza
//      el modal fuera de la pantalla y sus botones quedan inalcanzables.
//
//   2. ALTURA SEGURA — el contenido nunca excede el viewport; si es más alto,
//      hace scroll internamente y los botones de acción siguen visibles.
// ═══════════════════════════
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const TAMANOS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  auto: '',
};

/**
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - size: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl'|'5xl'|'auto'
 *    (solo se aplica si no se pasa `className` en el hijo)
 *  - closeOnBackdrop: boolean (default true)
 *  - closeOnEscape: boolean (default true)
 *  - backdropClassName: string (para variantes: bg-black/60, bg-slate-950/50, …)
 *  - lockScroll: boolean (default true)
 *  - children: el contenido del modal (normalmente el div de la tarjeta)
 */
export default function ContenedorModal({
  isOpen,
  onClose,
  size = 'lg',
  closeOnBackdrop = true,
  closeOnEscape = true,
  backdropClassName = 'bg-slate-950/60 backdrop-blur-xs',
  lockScroll = true,
  children,
  ariaLabel,
}) {
  // Bloqueo del scroll de fondo mientras el modal está abierto.
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

  const contenido = (
    <div
      className={`fixed inset-0 z-50 animate-fade-in ${backdropClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={manejarBackdrop}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          onMouseDown={(event) => event.stopPropagation()}
          className={`flex max-h-full w-full ${TAMANOS[size] ?? TAMANOS.lg} flex-col`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(contenido, document.body)
    : contenido;
}