import React from 'react';
import { Eye, Lock } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { AREAS } from '../../constants/areas';

export default function MobileExecutiveBar({
  areaFiltroMobile,
  setAreaFiltroMobile
}) {
  const { usuarioLogueado, puedeTodasAreas } = useSGC();
  const areaDefault = usuarioLogueado?.area || 'General';

  return (
    <div className="md:hidden bg-[#0B192C] text-white px-3 py-1.5 rounded-xl shadow-xs border border-sky-900/60 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1 shrink-0">
          <Eye size={11} /> Consulta
        </span>
        <span className="text-slate-500 text-[10px] shrink-0">•</span>
        <span className="text-[11px] font-bold text-slate-100 truncate">
          {areaFiltroMobile || areaDefault}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Lock size={9} /> Lectura
        </span>

        {puedeTodasAreas && (
          <select
            value={areaFiltroMobile || ''}
            onChange={(e) => setAreaFiltroMobile?.(e.target.value)}
            className="bg-sky-950 border border-sky-700/60 text-sky-200 text-[10px] font-bold rounded-md px-1.5 py-0.5 outline-none max-w-[110px] truncate"
            title="Cambiar área de consulta"
            aria-label="Filtrar por Área"
          >
            <option value="">Todas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
