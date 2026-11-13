// Editor del FODA: 4 cuadrantes como listas numeradas (una fila por punto) con el total en el título.
import React, { useLayoutEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { CUADRANTES } from '../../constants/foda';

function Fila({ n, valor, onChange, onQuitar, onEnter, soloLectura, autoFoco }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
    if (autoFoco) el.focus();
  }, [valor, autoFoco]);
  return (
    <li className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
      <span className="shrink-0 w-6 h-6 mt-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">{n}</span>
      {soloLectura ? (
        <span className="flex-1 text-sm text-slate-900 py-0.5">{valor}</span>
      ) : (
        <>
          <textarea ref={ref} rows={1} value={valor} aria-label={`Punto ${n}`}
            onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } }}
            className="flex-1 text-sm bg-transparent resize-none overflow-hidden leading-snug py-0.5 outline-none focus:bg-sky-50/40 rounded" />
          <button type="button" onClick={onQuitar} aria-label={`Quitar punto ${n}`} className="shrink-0 p-1 text-slate-400 hover:text-rose-600 rounded"><X size={14} /></button>
        </>
      )}
    </li>
  );
}

function Cuadro({ cuadrante, valor = [], onChange, soloLectura }) {
  const lista = Array.isArray(valor) ? valor : [];
  const llenos = lista.filter((x) => String(x).trim()).length;
  const ultimoVacio = lista.length > 0 && !String(lista[lista.length - 1]).trim();
  const agregar = () => { if (!ultimoVacio) onChange([...lista, '']); };
  return (
    <section className={`rounded-xl border-2 p-3 space-y-2 ${cuadrante.color}`}>
      <header className="flex items-baseline justify-between gap-2">
        <h5 className={`text-sm font-extrabold ${cuadrante.texto}`}>
          {cuadrante.titulo} <span className="ml-1 inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-white/80 border border-current text-xs align-middle">{llenos}</span>
        </h5>
        <span className="text-[11px] text-slate-700">{cuadrante.ayuda}</span>
      </header>
      {lista.length === 0 && <p className="text-sm text-slate-500">Sin puntos capturados.</p>}
      <ol className="space-y-1.5">
        {lista.map((x, i) => (soloLectura && !String(x).trim() ? null : (
          <Fila key={i} n={i + 1} valor={x} soloLectura={soloLectura} autoFoco={!soloLectura && i === lista.length - 1 && !String(x)}
            onChange={(v) => onChange(lista.map((y, k) => (k === i ? v : y)))}
            onQuitar={() => onChange(lista.filter((_, k) => k !== i))}
            onEnter={agregar} />
        )))}
      </ol>
      {!soloLectura && (
        <button type="button" onClick={agregar} disabled={ultimoVacio}
          className="text-xs font-bold text-marca-azul-oscuro bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-sky-50 disabled:opacity-40 inline-flex items-center gap-1">
          <Plus size={13} /> Agregar {cuadrante.singular}
        </button>
      )}
    </section>
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
