// Editor del FODA de un área: 4 cuadrantes, un punto por renglón; los cuadros crecen al escribir.
import React, { useLayoutEffect, useRef } from 'react';
import { CUADRANTES } from '../../constants/foda';

function Cuadro({ cuadrante, valor, onChange, soloLectura }) {
  const ref = useRef(null);
  const texto = (valor || []).join('\n');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight + 2, 96)}px`;
  }, [texto]);
  return (
    <label className={`block rounded-xl border-2 p-3 ${cuadrante.color}`}>
      <span className={`block text-sm font-extrabold ${cuadrante.texto}`}>{cuadrante.titulo}</span>
      <span className="block text-[11px] text-slate-700 mb-1.5">{cuadrante.ayuda} · un punto por renglón</span>
      {soloLectura ? (
        <ul className="list-disc pl-5 text-sm text-slate-900 space-y-0.5">
          {(valor || []).length ? valor.map((x, i) => <li key={i}>{x}</li>) : <li className="list-none -ml-5 text-slate-500">Sin puntos capturados</li>}
        </ul>
      ) : (
        <textarea ref={ref} value={texto} onChange={(e) => onChange(e.target.value.split('\n'))}
          className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg resize-none overflow-hidden leading-snug focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none" />
      )}
    </label>
  );
}

export default function FodaEditor({ foda = {}, onChange, soloLectura = false }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CUADRANTES.map((c) => (
        <Cuadro key={c.id} cuadrante={c} valor={foda[c.id]} soloLectura={soloLectura}
          onChange={(lineas) => onChange?.({ ...foda, [c.id]: lineas })} />
      ))}
    </div>
  );
}
