// Matriz por área (quien ve todas las áreas): pestañas por nivel (Direcciones, Subdirecciones, Áreas); las subdirecciones y
// áreas se agrupan por dirección y cada grupo se despliega. Nivel 1 = unidad (con su resumen), al desplegar
// nivel 2 = Riesgos / Oportunidades, nivel 3 = cada registro y nivel 4 = su desarrollo (MatrizArea).
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import MatrizArea from './MatrizArea';
import { ESTADOS_MATRIZ, nivelDe, faltante, idMatriz } from '../../constants/riesgos';
import { TIPOS_UNIDAD } from '../../constants/unidades';

const FILTROS = [
  ['TODAS', 'Todas'], ['CON_REGISTROS', 'Con registros'], ['ENVIADA', 'Por revisar'], ['OBSERVADA', 'Con observaciones'],
  ['ACEPTADA', 'Aceptadas'], ['SIN_INICIAR', 'Sin iniciar'],
];
const NIVELES = [['direccion', 'Direcciones'], ['subdireccion', 'Subdirecciones'], ['area', 'Áreas']];
const nombreDireccion = (d) => String(d || 'Sin dirección').replace(/^Dir\.\s*/, 'Dirección ');
const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function MatrizPorArea({ areas, anio, riesgos, matrices, areaInicial, accionInicial, onAccionHecha, propsMatriz }) {
  const [abierta, setAbierta] = useState(areaInicial || null);
  const [filtro, setFiltro] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [nivel, setNivel] = useState(areas.find((a) => a.nombre === areaInicial)?.tipo || 'direccion');
  const [grupos, setGrupos] = useState([]);   // direcciones desplegadas en Subdirecciones y Áreas
  // "Dar de alta" desde Seguimiento abre directo el área elegida.
  useEffect(() => {
    if (!(accionInicial && areaInicial)) return;
    setAbierta(areaInicial);
    const tipo = areas.find((a) => a.nombre === areaInicial)?.tipo;
    if (tipo) setNivel(tipo);
  }, [accionInicial, areaInicial, areas]);

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
  const delNivel = visibles.filter((f) => (f.area.tipo || 'area') === nivel);
  const porDireccion = [...new Set(delNivel.map((f) => f.area.direccion || ''))].sort((a, b) => a.localeCompare(b, 'es')).map((d) => [d, delNivel.filter((f) => (f.area.direccion || '') === d)]);
  const filtrando = Boolean(q) || filtro !== 'TODAS';
  const cuenta = (id) => filas.filter((f) => (id === 'CON_REGISTROS' ? f.items.length > 0 : id === 'SIN_INICIAR' ? !f.estado : id === 'TODAS' ? true : f.estado === id)).length;

  const fila = (f) => {
      const abiertaEsta = abierta === f.area.nombre;
      return (
        <li key={f.area.nombre} className={`bg-white rounded-xl border ${abiertaEsta ? 'border-marca-azul-oscuro/50 shadow-sm' : 'border-slate-200'}`}>
          <button type="button" aria-expanded={abiertaEsta} onClick={() => setAbierta(abiertaEsta ? null : f.area.nombre)}
            className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left">
            {abiertaEsta ? <ChevronDown size={18} className="text-marca-azul-oscuro shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
            <span className="flex-1 min-w-[12rem]">
              <span className="block text-sm font-extrabold text-slate-900">{f.area.nombre}</span>
              <span className="block text-[11px] text-slate-500">
                <span className="font-bold text-marca-azul-oscuro">{TIPOS_UNIDAD[f.area.tipo] || 'Área'}</span>
                {f.area.tipo !== 'direccion' && ` · ${String(f.area.direccion || '').replace(/^Dir\.\s*/, 'Dirección ')}`}
              </span>
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
  };

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

      <div role="tablist" aria-label="Nivel" className="flex flex-wrap gap-1 border-b border-slate-200">
        {NIVELES.map(([id, texto]) => (
          <button key={id} type="button" role="tab" aria-selected={nivel === id} onClick={() => setNivel(id)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${nivel === id ? 'border-marca-azul-oscuro text-marca-azul-oscuro' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
            {texto} <span className="text-[11px] font-extrabold text-slate-500">{visibles.filter((f) => (f.area.tipo || 'area') === id).length}</span>
          </button>
        ))}
      </div>

      {delNivel.length === 0 && visibles.length > 0 && <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">Nada en este nivel con el filtro actual; revisa las otras pestañas.</p>}

      {nivel === 'direccion' && <ul className="space-y-2">{delNivel.map(fila)}</ul>}

      {nivel !== 'direccion' && porDireccion.map(([dir, lista]) => {
        const abierto = filtrando || grupos.includes(dir) || lista.some((f) => f.area.nombre === abierta);
        const suma = (campo) => lista.reduce((t, f) => t + f[campo], 0);
        return (
          <section key={dir} className="rounded-xl border border-slate-200 bg-slate-100/60">
            <button type="button" aria-expanded={abierto} onClick={() => setGrupos(grupos.includes(dir) ? grupos.filter((g) => g !== dir) : [...grupos, dir])}
              className="w-full flex flex-wrap items-center gap-3 px-4 py-2.5 text-left">
              {abierto ? <ChevronDown size={18} className="text-marca-azul-oscuro shrink-0" /> : <ChevronRight size={18} className="text-slate-500 shrink-0" />}
              <span className="flex-1 min-w-[12rem] text-sm font-extrabold uppercase tracking-wide text-marca-azul-oscuro">{nombreDireccion(dir)}</span>
              <span className="text-[11px] font-bold text-slate-600">{lista.length} {nivel === 'area' ? 'área(s)' : 'subdirección(es)'} · {suma('riesgos')} riesgo(s) · {suma('oportunidades')} oportunidad(es) · {lista.filter((f) => !f.estado).length} sin iniciar</span>
            </button>
            {abierto && <ul className="space-y-2 p-2 pt-0">{lista.map(fila)}</ul>}
          </section>
        );
      })}
    </div>
  );
}
