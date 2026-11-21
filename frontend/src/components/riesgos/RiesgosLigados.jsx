// Riesgos y oportunidades ligados a un indicador o a una acción correctiva (la liga se hace desde el riesgo).
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { riesgosLigados, nivelDe, puntaje } from '../../constants/riesgos';

export default function RiesgosLigados({ campo, id, className = '' }) {
  const { riesgos = [] } = useSGC();
  const lista = riesgosLigados(riesgos, campo, id).sort((a, b) => Number(b.anio) - Number(a.anio));
  if (!lista.length) return null;
  return (
    <div className={`rounded-lg border-2 border-rose-200 bg-rose-50/60 px-3 py-2 text-sm ${className}`}>
      <p className="font-extrabold text-rose-950 flex items-center gap-2"><ShieldAlert size={15} /> Riesgos y oportunidades ligados ({lista.length})</p>
      <ul className="mt-1 space-y-0.5">
        {lista.map((r) => {
          const nv = nivelDe(r);
          return (
            <li key={r.id} className="text-slate-800">
              <strong>{r.tipo} {r.anio}</strong> · {r.area} · {r.descripcion || 'sin descripción'}
              {nv && <span className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-bold ${nv.suave}`}>{nv.nivel} ({puntaje(r)})</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
