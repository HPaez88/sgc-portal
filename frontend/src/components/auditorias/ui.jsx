// Piezas visuales compartidas del módulo de Auditorías (regla visual: bloques con título, tablas marcadas).
import React from 'react';
import { ESTADOS_AUDITORIA, RANGOS } from '../../constants/auditorias';

export const ENTRADA = 'w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-50 disabled:text-slate-600';

export const Bloque = ({ titulo, ayuda, derecha, children, className = '' }) => (
  <section className={`rounded-lg border border-slate-200 bg-white p-3 ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-2">
      <h4 className="text-xs font-extrabold uppercase tracking-wide text-marca-azul-oscuro">{titulo}</h4>
      {derecha}
    </div>
    {ayuda && <p className="text-[11px] text-slate-600 mb-2">{ayuda}</p>}
    {children}
  </section>
);

export const Campo = ({ etiqueta, valor, onChange, multi, disabled, tipo = 'text', ayuda, ...resto }) => (
  <label className="block">
    <span className="block text-xs font-bold text-slate-800 mb-1">{etiqueta}</span>
    {multi
      ? <textarea rows={2} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} {...resto} />
      : <input type={tipo} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} {...resto} />}
    {ayuda && <span className="block text-[11px] text-slate-500 mt-0.5">{ayuda}</span>}
  </label>
);

export const EstadoAuditoria = ({ estado }) => {
  const e = ESTADOS_AUDITORIA[estado] || ESTADOS_AUDITORIA.PLANEACION;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${e.cls}`}>{e.label}</span>;
};

export const Rango = ({ rango, pct }) => {
  if (!rango) return <span className="text-slate-500">—</span>;
  const r = RANGOS[rango];
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${r.cls}`}>{pct != null ? `${pct}% · ` : ''}{r.label}</span>;
};

export const tituloAuditoria = (a) => `Auditoría interna #${a?.numero}/${a?.anio}`;
