// ═══════════════════════════
// CAMPO DE PLAN DE ACCIÓN (RIESGOS)
// Extraído para reutilizarlo en la tabla (escritorio) y en las tarjetas (móvil)
// sin duplicar la lógica de edición. Auto-crece con el contenido: el usuario
// nunca tiene que desplazarse dentro del campo para leer lo que escribió.
// ═══════════════════════════
import React, { useEffect, useRef } from 'react';

export default function CampoPlanAccion({
  valor = '',
  onChange,
  placeholder = 'Describir la acción de control, responsable y seguimiento...',
  minFilas = 4,
  className = '',
}) {
  const ref = useRef(null);

  /**
   * Ajusta la altura al contenido real.
   *
   * Se ejecuta en el efecto y además desde un ResizeObserver porque el campo
   * puede estar dentro de un contenedor oculto en el primer render (por
   * ejemplo la vista móvil cuando la ventana es de escritorio): medir
   * scrollHeight sobre un elemento con display:none devuelve 0 y el campo
   * quedaría colapsado al hacerse visible.
   */
  const ajustarAltura = () => {
    const el = ref.current;
    if (!el) return;
    if (el.offsetParent === null && el.getClientRects().length === 0) return; // oculto
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    ajustarAltura();
  }, [valor]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => ajustarAltura());
    observer.observe(el);
    // Observar también el padre detecta el cambio de display:none a visible.
    if (el.parentElement) observer.observe(el.parentElement);

    return () => observer.disconnect();
  }, []);

  return (
    <textarea
      ref={ref}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minFilas}
      className={`w-full resize-y p-3 text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors min-h-[6.5rem] max-h-96 ${className}`}
    />
  );
}