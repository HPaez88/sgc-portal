// Paginación común para tablas grandes (regla del portal: nada de scroll vertical infinito).
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Páginas a mostrar: primera, última y dos alrededor de la actual, con "…" entre huecos.
export const paginasVisibles = (actual, totalPaginas) => {
  const set = new Set([1, totalPaginas, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= totalPaginas));
  const lista = [...set].sort((a, b) => a - b);
  return lista.flatMap((n, i) => (i > 0 && n - lista[i - 1] > 1 ? ['…', n] : [n]));
};

export default function Paginacion({ pagina, total, porPagina, onCambiar, etiqueta = 'registros' }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) return total ? <p className="text-xs text-slate-600 px-1">{total} {etiqueta}</p> : null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const boton = 'min-w-8 h-8 px-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 px-1" aria-label="Paginación">
      <p className="text-xs text-slate-700">Mostrando <strong>{desde}–{hasta}</strong> de <strong>{total}</strong> {etiqueta}</p>
      <div className="flex items-center gap-1">
        <button type="button" className={`${boton} bg-white border-slate-300 hover:bg-slate-50`} disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)} aria-label="Página anterior">
          <ChevronLeft size={14} />
        </button>
        {paginasVisibles(pagina, totalPaginas).map((n, i) => (n === '…'
          ? <span key={`h${i}`} className="px-1 text-slate-500">…</span>
          : (
            <button key={n} type="button" onClick={() => onCambiar(n)} aria-current={n === pagina ? 'page' : undefined}
              className={`${boton} ${n === pagina ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}>
              {n}
            </button>
          )))}
        <button type="button" className={`${boton} bg-white border-slate-300 hover:bg-slate-50`} disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)} aria-label="Página siguiente">
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
