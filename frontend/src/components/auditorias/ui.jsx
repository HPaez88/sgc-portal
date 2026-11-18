// Piezas visuales compartidas del módulo de Auditorías (regla visual: bloques con título, tablas marcadas).
import React from 'react';
import { ESTADOS_AUDITORIA, RANGOS } from '../../constants/auditorias';

// Mismo código visual que el resto del portal: lista (azul) ≠ texto (blanco) ≠ bloqueado (gris).
import { CAMPO_TEXTO, CAMPO_LISTA } from '../common/estilosCampos';
export const ENTRADA = CAMPO_TEXTO;
export const LISTA = CAMPO_LISTA;

export const Bloque = ({ titulo, ayuda, derecha, children, className = '' }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#1E3E62] text-white">
      <h4 className="text-sm font-extrabold">{titulo}</h4>
      {derecha}
    </div>
    <div className="p-3">
      {ayuda && <p className="text-xs text-slate-600 mb-2">{ayuda}</p>}
      {children}
    </div>
  </section>
);

export const Campo = ({ etiqueta, valor, onChange, multi, disabled, tipo = 'text', ayuda, ...resto }) => (
  <label className="block">
    <span className="block text-xs font-bold text-slate-800 mb-1">{etiqueta}</span>
    {multi
      ? <textarea rows={2} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} {...resto} />
      : <input type={tipo} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} {...resto} />}
    {ayuda && <span className="block text-xs text-slate-500 mt-0.5">{ayuda}</span>}
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
