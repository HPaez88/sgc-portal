// Mapa de calor 5×5 (probabilidad × impacto, o viabilidad × beneficio en oportunidades).
// Cada celda muestra cuántos registros caen ahí; al dar clic se filtra la lista con esa celda.
import React from 'react';
import { ESCALAS, clasificar } from '../../constants/riesgos';

const COLOR = {
  Riesgo: { Bajo: 'bg-emerald-200 hover:bg-emerald-300', Medio: 'bg-amber-200 hover:bg-amber-300', Alto: 'bg-rose-300 hover:bg-rose-400' },
  // En oportunidades lo "alto" es lo deseable: verde intenso.
  Oportunidad: { Bajo: 'bg-slate-100 hover:bg-slate-200', Medio: 'bg-sky-200 hover:bg-sky-300', Alto: 'bg-emerald-300 hover:bg-emerald-400' },
};

export default function MapaCalor({ tipo = 'Riesgo', items = [], seleccion, onSeleccionar, titulo }) {
  const escala = ESCALAS[tipo];
  const cuenta = (p, i) => items.filter((r) => Number(r.probabilidad) === p && Number(r.impacto) === i).length;

  return (
    <figure className="bg-white rounded-xl border border-slate-200 p-4">
      <figcaption className="flex items-baseline justify-between mb-3">
        <span className="text-sm font-extrabold text-slate-900">{titulo || (tipo === 'Riesgo' ? 'Mapa de riesgos' : 'Mapa de oportunidades')}</span>
        <span className="text-[11px] text-slate-500">{items.length} registro(s)</span>
      </figcaption>
      <div className="flex">
        <div className="flex items-center mr-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">{escala.ejeY}</span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1">
            {[5, 4, 3, 2, 1].map((p) => (
              <React.Fragment key={p}>
                <span className="text-[10px] text-slate-500 pr-1 flex items-center justify-end" title={escala.probabilidad[p - 1][2]}>
                  {p} · {escala.probabilidad[p - 1][1]}
                </span>
                {[1, 2, 3, 4, 5].map((i) => {
                  const n = cuenta(p, i);
                  const nivel = clasificar(p * i).nivel;
                  const activa = seleccion && seleccion.p === p && seleccion.i === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSeleccionar?.(activa ? null : { p, i })}
                      title={`${escala.ejeY} ${p} × ${escala.ejeX} ${i} = ${p * i} (${nivel}) · ${n} registro(s)`}
                      className={`h-12 rounded-md text-sm font-extrabold transition-all ${COLOR[tipo][nivel]} ${n ? 'text-slate-900' : 'text-slate-900/25'} ${activa ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
                    >
                      {n || '·'}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            <span />
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-[10px] text-slate-500 text-center leading-tight pt-1" title={escala.impacto[i - 1][2]}>
                {i}<br />{escala.impacto[i - 1][1]}
              </span>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{escala.ejeX}</p>
        </div>
      </div>
    </figure>
  );
}
