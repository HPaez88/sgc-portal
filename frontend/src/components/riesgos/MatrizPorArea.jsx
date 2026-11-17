// Matriz por área (quien ve todas): una sola lista de unidades con buscador y filtro por situación.
// Cada unidad se despliega y muestra su matriz (MatrizArea); cada registro se trabaja en ventana.
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import MatrizArea from './MatrizArea';
import { ESTADOS_MATRIZ, nivelDe, faltante, idMatriz } from '../../constants/riesgos';
import { TIPOS_UNIDAD } from '../../constants/unidades';

const FILTROS = [
  ['CON_REGISTROS', 'Con registros'], ['ENVIADA', 'Por revisar'], ['OBSERVADA', 'Con observaciones'],
  ['ACEPTADA', 'Aceptadas'], ['SIN_INICIAR', 'Sin iniciar'], ['TODAS', 'Todas'],
];
const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function MatrizPorArea({ areas, anio, riesgos, matrices, areaInicial, accionInicial, onAccionHecha, propsMatriz }) {
  const [abierta, setAbierta] = useState(areaInicial || null);
  // Se empieza por las unidades que ya tienen algo capturado; si no hay ninguna, por todas.
  const [filtro, setFiltro] = useState(() => (riesgos.some((r) => Number(r.anio) === Number(anio)) ? 'CON_REGISTROS' : 'TODAS'));
  const [busqueda, setBusqueda] = useState('');
  // "Dar de alta" desde Seguimiento abre directo la unidad elegida.
  useEffect(() => {
    if (!(accionInicial && areaInicial)) return;
    setAbierta(areaInicial); setFiltro('TODAS'); setBusqueda(areaInicial);
  }, [accionInicial, areaInicial]);

  const filas = useMemo(() => areas.map((a) => {
    const items = riesgos.filter((r) => r.area === a.nombre && Number(r.anio) === Number(anio));
    const m = matrices.find((x) => x.id === idMatriz(a.nombre, anio));
    return {
      area: a, items, m, estado: m?.estado || (items.length ? 'BORRADOR' : null),
      riesgos: items.filter((r) => r.tipo === 'Riesgo').length,
      oportunidades: items.filter((r) => r.tipo === 'Oportunidad').length,
      altos: items.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').length,
      incompletos: items.filter((r) => faltante(r)).length,
    };
  }), [areas, riesgos, matrices, anio]);

  const pasa = (f, id) => (id === 'CON_REGISTROS' ? f.items.length > 0 : id === 'SIN_INICIAR' ? !f.estado : id === 'TODAS' ? true : f.estado === id);
  const q = sinAcentos(busqueda.trim());
  // La unidad abierta no desaparece aunque deje de cumplir el filtro (p. ej. al quitar su último registro).
  const visibles = filas.filter((f) => f.area.nombre === abierta || ((!q || sinAcentos(`${f.area.nombre} ${f.area.direccion}`).includes(q)) && pasa(f, filtro)))
    .sort((a, b) => (b.items.length > 0) - (a.items.length > 0) || a.area.nombre.localeCompare(b.area.nombre, 'es'));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <label className="relative flex-1 min-w-[14rem]">
          <span className="sr-only">Buscar área o dirección</span>
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar área, subdirección o dirección…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map(([id, texto]) => (
            <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 ${filtro === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>
              {texto}<span className={`text-[11px] font-extrabold ${filtro === id ? 'text-white/80' : 'text-slate-500'}`}>{filas.filter((f) => pasa(f, id)).length}</span>
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 && <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">Ninguna unidad coincide. Prueba con "Todas" o cambia la búsqueda.</p>}

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
                  <span className="block text-xs text-slate-500">
                    <span className="font-bold text-marca-azul-oscuro">{TIPOS_UNIDAD[f.area.tipo] || 'Área'}</span>
                    {f.area.tipo !== 'direccion' && ` · ${String(f.area.direccion || '').replace(/^Dir\.\s*/, 'Dirección ')}`}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  {f.items.length > 0 && <span className="text-slate-600 font-semibold">{f.riesgos} riesgo(s) · {f.oportunidades} oportunidad(es)</span>}
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
