// Matriz por área (quien ve todas las áreas): nivel 1 = área (con su resumen), al desplegar
// nivel 2 = Riesgos / Oportunidades, nivel 3 = cada registro y nivel 4 = su desarrollo (MatrizArea).
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import MatrizArea from './MatrizArea';
import { ESTADOS_MATRIZ, nivelDe, faltante, idMatriz } from '../../constants/riesgos';

const FILTROS = [
  ['TODAS', 'Todas'], ['CON_REGISTROS', 'Con registros'], ['ENVIADA', 'Por revisar'], ['OBSERVADA', 'Con observaciones'],
  ['ACEPTADA', 'Aceptadas'], ['SIN_INICIAR', 'Sin iniciar'],
];
const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function MatrizPorArea({ areas, anio, riesgos, matrices, areaInicial, accionInicial, onAccionHecha, propsMatriz }) {
  const [abierta, setAbierta] = useState(areaInicial || null);
  const [filtro, setFiltro] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  // "Dar de alta" desde Seguimiento abre directo el área elegida.
  useEffect(() => { if (accionInicial && areaInicial) setAbierta(areaInicial); }, [accionInicial, areaInicial]);

  const filas = useMemo(() => areas.map((a) => {
    const items = riesgos.filter((r) => r.area === a.nombre && Number(r.anio) === Number(anio));
    const m = matrices.find((x) => x.id === idMatriz(a.nombre, anio));
    const estado = m?.estado || (items.length ? 'BORRADOR' : null);
    return {
      area: a, items, m, estado,
      riesgos: items.filter((r) => r.tipo === 'Riesgo').length,
      oportunidades: items.filter((r) => r.tipo === 'Oportunidad').length,
      altos: items.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').length,
      incompletos: items.filter((r) => faltante(r)).length,
    };
  }), [areas, riesgos, matrices, anio]);

  const q = sinAcentos(busqueda.trim());
  const visibles = filas.filter((f) => {
    if (q && !sinAcentos(`${f.area.nombre} ${f.area.direccion}`).includes(q)) return false;
    if (filtro === 'CON_REGISTROS') return f.items.length > 0;
    if (filtro === 'SIN_INICIAR') return !f.estado;
    if (filtro !== 'TODAS') return f.estado === filtro;
    return true;
  });
  const cuenta = (id) => filas.filter((f) => (id === 'CON_REGISTROS' ? f.items.length > 0 : id === 'SIN_INICIAR' ? !f.estado : id === 'TODAS' ? true : f.estado === id)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <label className="relative flex-1 min-w-[14rem]">
          <span className="sr-only">Buscar área o dirección</span>
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar área o dirección…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map(([id, texto]) => (
            <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 ${filtro === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>
              {texto}<span className={`text-[10px] font-extrabold ${filtro === id ? 'text-white/80' : 'text-slate-500'}`}>{cuenta(id)}</span>
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 && <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">Ninguna área coincide con el filtro.</p>}

      <ul className="space-y-2">
        {visibles.map((f) => {
          const abiertaEsta = abierta === f.area.nombre;
          return (
            <li key={f.area.nombre} className={`bg-white rounded-xl border ${abiertaEsta ? 'border-marca-azul-oscuro/50 shadow-sm' : 'border-slate-200'}`}>
              <button type="button" aria-expanded={abiertaEsta} onClick={() => setAbierta(abiertaEsta ? null : f.area.nombre)}
                className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left">
                {abiertaEsta ? <ChevronDown size={18} className="text-marca-azul-oscuro shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                <span className="flex-1 min-w-[12rem]">
                  <span className="block text-sm font-extrabold text-slate-900">{f.area.nombre}</span>
                  <span className="block text-[11px] text-slate-500">{String(f.area.direccion || '').replace(/^Dir\.\s*/, 'Dirección ')}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">{f.riesgos} riesgo(s)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">{f.oportunidades} oportunidad(es)</span>
                  {f.altos > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white">{f.altos} alto(s)</span>}
                  {f.incompletos > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">{f.incompletos} por completar</span>}
                  {f.estado
                    ? <span className={`px-2 py-0.5 rounded-full border ${ESTADOS_MATRIZ[f.estado].color}`}>{ESTADOS_MATRIZ[f.estado].label}</span>
                    : <span className="px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">Sin iniciar</span>}
                </span>
              </button>
              {abiertaEsta && (
                <div className="border-t border-slate-100 p-3 sm:p-4 bg-slate-50/50 rounded-b-xl">
                  <MatrizArea {...propsMatriz(f.area)} area={f.area.nombre} anio={anio} matriz={f.m}
                    accionInicial={areaInicial === f.area.nombre ? accionInicial : null} onAccionHecha={onAccionHecha} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
