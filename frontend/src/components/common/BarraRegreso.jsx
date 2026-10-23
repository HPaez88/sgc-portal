import React from 'react';
import { ArrowLeft } from 'lucide-react';

/** Barra fija arriba para volver a la lista del módulo sin pasar por el menú. */
export default function BarraRegreso({ onVolver, texto = 'Volver a la lista', detalle }) {
  return (
    <div className="sticky top-0 z-30 -mx-1 mb-3 px-1 py-1.5 bg-slate-50/90 backdrop-blur-sm flex items-center gap-3">
      <button onClick={onVolver}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 shadow-2xs cursor-pointer">
        <ArrowLeft size={14} /> {texto}
      </button>
      {detalle && <span className="text-xs text-slate-500 truncate">{detalle}</span>}
    </div>
  );
}
