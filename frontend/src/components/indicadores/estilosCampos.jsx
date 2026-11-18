// Estilo común de los formularios de Indicadores: se distingue a simple vista dónde se ELIGE de una lista,
// dónde se ESCRIBE y qué está BLOQUEADO; cada sección lleva título con color y cada subtema su subtítulo.
import React, { useState } from 'react';
import { ChevronDown, PencilLine, Lock } from 'lucide-react';

// Lista: fondo azul claro y borde marcado. Texto libre: fondo blanco. Bloqueado: gris.
export const CAMPO_LISTA = 'w-full px-3 py-2 text-sm font-semibold bg-sky-50 border-2 border-sky-300 rounded-lg text-sky-950 cursor-pointer hover:border-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed';
export const CAMPO_TEXTO = 'w-full px-3 py-2 text-sm bg-white border border-slate-400 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-600';

// Botón de opción (elegir una entre pocas): la elegida resalta en color sólido.
export const opcion = (activa, color = 'bg-marca-azul-oscuro border-marca-azul-oscuro') => `px-3 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${activa ? `${color} text-white shadow` : 'bg-white text-slate-700 border-slate-300 hover:border-marca-azul'}`;

export function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      <span className="font-bold text-slate-800">Cómo leer el formulario:</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 border-sky-300 bg-sky-50 text-sky-950 font-semibold">Lista <ChevronDown size={12} /></span> eliges una opción</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-400 bg-white font-semibold">Texto <PencilLine size={12} /></span> escribes</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-600 font-semibold">Bloqueado <Lock size={12} /></span> viene de otro lugar</span>
    </div>
  );
}

// Encabezado de sección: franja de color a todo lo ancho (la sección tiene p-5).
export function Encabezado({ n, titulo, ayuda, color = 'bg-[#1E3E62]', extra = null }) {
  return (
    <div className={`-mx-5 -mt-5 mb-1 px-5 py-3 rounded-t-2xl text-white flex flex-wrap items-center justify-between gap-2 ${color}`}>
      <div className="min-w-0">
        <h3 className="text-base font-extrabold flex items-center gap-2">
          <span className="w-7 h-7 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">{n}</span>{titulo}
        </h3>
        {ayuda && <p className="text-xs text-white/85 mt-0.5 sm:ml-9">{ayuda}</p>}
      </div>
      {extra}
    </div>
  );
}

export const Sub = ({ titulo, ayuda }) => (
  <div className="border-b-2 border-slate-200 pb-1 pt-1">
    <h4 className="text-sm font-extrabold text-slate-800">{titulo}</h4>
    {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
  </div>
);

export const AvisoBloqueo = () => (
  <p className="text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 inline-flex items-center gap-2">
    <Lock size={14} /> Sección bloqueada: estos datos vienen del proyecto del área y se modifican en Proyectos y fichas.
  </p>
);

// ── Dinero: siempre con formato de moneda ($1,234,567.00); al escribir se ve el número sin formato. ──
const numero = (v) => parseFloat(String(v ?? '').replace(/[$,\s]/g, ''));
export const moneda = (v) => {
  const n = numero(v);
  return Number.isFinite(n) ? n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }) : '';
};
export function CampoMoneda({ value, onChange, disabled, className = '', ...props }) {
  const [foco, setFoco] = useState(false);
  return (
    <input {...props} inputMode="decimal" disabled={disabled} value={foco ? String(value ?? '') : moneda(value)}
      onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
      className={`${CAMPO_TEXTO} text-right tabular-nums ${className}`} />
  );
}

// ── Catálogo: el mismo nombre aunque cambie el título (Lic., Ing., C.P.) o los acentos. ──
const TITULOS = /\b(lic|ing|c\.?\s?p|mtro|mtra|dr|dra|doc|arq|prof|profa)\.?\s+/gi;
export const mismoNombre = (a, b) => {
  const n = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(TITULOS, '').replace(/\s+/g, ' ').trim().toUpperCase();
  return n(a) === n(b);
};
// Sugerencia del catálogo junto a un campo: aparece solo si el catálogo dice otra cosa.
export function DelCatalogo({ valor, catalogo, origen, onUsar, editable }) {
  if (!catalogo || mismoNombre(valor, catalogo)) return null;
  return (
    <p className="mt-1 text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-md px-2 py-1 flex flex-wrap items-center gap-2">
      <span>{origen}: <strong>{catalogo}</strong></span>
      {editable && <button type="button" onClick={onUsar} className="px-2 py-0.5 rounded bg-sky-700 text-white font-bold hover:bg-sky-800">Usar este</button>}
    </p>
  );
}
