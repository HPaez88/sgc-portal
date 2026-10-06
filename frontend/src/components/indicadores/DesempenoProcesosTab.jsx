import React, { useState, useMemo } from 'react';
import {
  Layers,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  ArrowRight,
  Activity,
  Edit3,
  Sparkles,
  Building2,
  Target,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { evalSemaforoOOMRSC05 } from '../../constants/indicadores';

const MESES = [
  { clave: 'Ene', nombre: 'Enero' },
  { clave: 'Feb', nombre: 'Febrero' },
  { clave: 'Mar', nombre: 'Marzo' },
  { clave: 'Abr', nombre: 'Abril' },
  { clave: 'May', nombre: 'Mayo' },
  { clave: 'Jun', nombre: 'Junio' },
  { clave: 'Jul', nombre: 'Julio' },
  { clave: 'Ago', nombre: 'Agosto' },
  { clave: 'Sep', nombre: 'Septiembre' },
  { clave: 'Oct', nombre: 'Octubre' },
  { clave: 'Nov', nombre: 'Noviembre' },
  { clave: 'Dic', nombre: 'Diciembre' }
];

const TRIMESTRES_CONFIG = {
  T1: { label: '1er Trimestre (T1)', meses: ['Ene', 'Feb', 'Mar'], descripcion: 'Enero - Marzo' },
  T2: { label: '2do Trimestre (T2)', meses: ['Abr', 'May', 'Jun'], descripcion: 'Abril - Junio' },
  T3: { label: '3er Trimestre (T3)', meses: ['Jul', 'Ago', 'Sep'], descripcion: 'Julio - Septiembre' },
  T4: { label: '4to Trimestre (T4)', meses: ['Oct', 'Nov', 'Dic'], descripcion: 'Octubre - Diciembre' }
};

export default function DesempenoProcesosTab({
  indicadores = [],
  resultados = {},
  ejercicio = 2026,
  setEjercicio,
  mesActivoIndex = 9,
  setMesActivoIndex,
  onAbrirCaptura,
  onCrearAccionCorrectiva,
  onCrearReporteCorreccion,
  esAdminOSGC = false,
  onEditarIndicador,
  onAbrirFichaAyuntamiento
}) {
  // Modo de filtro temporal: 'mes' | 'trimestre' | 'anual'
  const [modoTemporal, setModoTemporal] = useState('mes');
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState('T1');
  const [busquedaProceso, setBusquedaProceso] = useState('');
  const [procesosExpandidos, setProcesosExpandidos] = useState({});

  const mesActivo = MESES[mesActivoIndex]?.clave || 'Oct';
  const mesActivoNombre = MESES[mesActivoIndex]?.nombre || 'Octubre';

  // Alternar expansión de un proceso
  const toggleProceso = (procNombre) => {
    setProcesosExpandidos(prev => ({
      ...prev,
      [procNombre]: !prev[procNombre]
    }));
  };

  // Expandir / colapsar todos
  const toggleTodos = (expandir) => {
    const nuevoEstado = {};
    if (expandir) {
      const listaProcesos = [...new Set(indicadores.map(i => i.proceso).filter(Boolean))];
      listaProcesos.forEach(p => { nuevoEstado[p] = true; });
    }
    setProcesosExpandidos(nuevoEstado);
  };

  // Helper para calcular el valor real y semáforo de un indicador según el modo temporal
  const calcularMetricaIndicador = (ind) => {
    if (modoTemporal === 'mes') {
      const key = `${ind.id}-${mesActivo}-${ejercicio}`;
      const dataGuardada = resultados[key];
      const val = dataGuardada?.valor !== undefined ? dataGuardada.valor : null;
      const obs = dataGuardada?.observacion || ind.observacion_default || '';
      const acc = dataGuardada?.accion || ind.accion_default || 'NA';
      const sem = evalSemaforoOOMRSC05(val, ind.meta, ind.es_menor);
      return { val, obs, acc, sem, metaEvaluada: ind.meta, periodoEtiqueta: `${mesActivoNombre} ${ejercicio}` };
    }

    if (modoTemporal === 'trimestre') {
      const configTrim = TRIMESTRES_CONFIG[trimestreSeleccionado];
      const metaTrim = ind.metas_trimestrales?.[trimestreSeleccionado] ?? ind.meta;
      const valoresEnTrimestre = configTrim.meses.map(m => {
        const key = `${ind.id}-${m}-${ejercicio}`;
        return resultados[key]?.valor;
      }).filter(v => v !== null && v !== undefined);

      let valPromedio = null;
      if (valoresEnTrimestre.length > 0) {
        valPromedio = Math.round((valoresEnTrimestre.reduce((a, b) => a + Number(b), 0) / valoresEnTrimestre.length) * 10) / 10;
      }

      const sem = evalSemaforoOOMRSC05(valPromedio, metaTrim, ind.es_menor);
      return {
        val: valPromedio,
        obs: `Promedio de ${valoresEnTrimestre.length} meses capturados en ${configTrim.label}`,
        acc: ind.accion_default || 'NA',
        sem,
        metaEvaluada: metaTrim,
        periodoEtiqueta: `${configTrim.label} ${ejercicio}`
      };
    }

    // Modo Anual (Todo el año)
    const metaAnual = ind.meta_anual || ind.meta;
    const valoresAnuales = MESES.map(m => {
      const key = `${ind.id}-${m.clave}-${ejercicio}`;
      return resultados[key]?.valor;
    }).filter(v => v !== null && v !== undefined);

    let valPromedioAnual = null;
    if (valoresAnuales.length > 0) {
      valPromedioAnual = Math.round((valoresAnuales.reduce((a, b) => a + Number(b), 0) / valoresAnuales.length) * 10) / 10;
    }

    const sem = evalSemaforoOOMRSC05(valPromedioAnual, metaAnual, ind.es_menor);
    return {
      val: valPromedioAnual,
      obs: `Acumulado anual de ${valoresAnuales.length || 'estimación base'} meses evaluados`,
      acc: ind.accion_default || 'NA',
      sem,
      metaEvaluada: metaAnual,
      periodoEtiqueta: `Ejercicio Anual ${ejercicio}`
    };
  };

  // Agrupar y procesar indicadores por Proceso
  const procesosEvaluados = useMemo(() => {
    const mapa = {};

    indicadores.forEach(ind => {
      const procNombre = ind.proceso || 'Sin Proceso Asignado';
      if (!mapa[procNombre]) {
        mapa[procNombre] = {
          nombre: procNombre,
          direccion: ind.direccion || 'General',
          area: ind.area || 'Diversas Áreas',
          indicadores: []
        };
      }
      mapa[procNombre].indicadores.push(ind);
    });

    // Calcular estadísticas por cada proceso
    const lista = Object.values(mapa).map(proc => {
      let sumaPorcentaje = 0;
      let evaluados = 0;
      let aceptables = 0;
      let preventivos = 0;
      let criticos = 0;
      let pendientes = 0;

      const itemsConMetrica = proc.indicadores.map(ind => {
        const metrica = calcularMetricaIndicador(ind);
        if (metrica.sem.rango === 'ACEPTABLE') {
          aceptables++;
          sumaPorcentaje += metrica.sem.porcentaje || 100;
          evaluados++;
        } else if (metrica.sem.rango === 'PREVENTIVO') {
          preventivos++;
          sumaPorcentaje += metrica.sem.porcentaje || 85;
          evaluados++;
        } else if (metrica.sem.rango === 'CRITICO') {
          criticos++;
          sumaPorcentaje += metrica.sem.porcentaje || 50;
          evaluados++;
        } else {
          pendientes++;
        }
        return {
          ...ind,
          ...metrica
        };
      });

      const promedio = evaluados > 0 ? Math.round(sumaPorcentaje / evaluados) : 0;
      let semaforoProceso = 'ACEPTABLE';
      if (promedio < 80) semaforoProceso = 'CRITICO';
      else if (promedio < 90) semaforoProceso = 'PREVENTIVO';

      return {
        ...proc,
        indicadores: itemsConMetrica,
        total: proc.indicadores.length,
        evaluados,
        aceptables,
        preventivos,
        criticos,
        pendientes,
        promedioEficacia: promedio,
        semaforoProceso
      };
    });

    // Ordenar procesos: primero los de menor eficacia o con más críticos para visibilidad inmediata
    return lista.sort((a, b) => b.criticos - a.criticos || a.promedioEficacia - b.promedioEficacia);
  }, [indicadores, resultados, modoTemporal, mesActivo, trimestreSeleccionado, ejercicio]);

  // Filtrar procesos por término de búsqueda
  const procesosFiltrados = useMemo(() => {
    if (!busquedaProceso.trim()) return procesosEvaluados;
    const term = busquedaProceso.toLowerCase();
    return procesosEvaluados.filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      p.direccion.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term) ||
      p.indicadores.some(i => i.nombre.toLowerCase().includes(term) || String(i.numero).includes(term))
    );
  }, [procesosEvaluados, busquedaProceso]);

  // Estadísticas globales del modo temporal seleccionado
  const resumenGlobal = useMemo(() => {
    const totalProcesos = procesosEvaluados.length;
    const procesosVerdes = procesosEvaluados.filter(p => p.semaforoProceso === 'ACEPTABLE').length;
    const procesosAmarillos = procesosEvaluados.filter(p => p.semaforoProceso === 'PREVENTIVO').length;
    const procesosRojos = procesosEvaluados.filter(p => p.semaforoProceso === 'CRITICO').length;

    const totalIndicadores = indicadores.length;
    let sumaEficacia = 0;
    let criticosTotal = 0;
    let preventivosTotal = 0;
    let aceptablesTotal = 0;

    procesosEvaluados.forEach(p => {
      sumaEficacia += p.promedioEficacia;
      criticosTotal += p.criticos;
      preventivosTotal += p.preventivos;
      aceptablesTotal += p.aceptables;
    });

    const promedioGlobal = totalProcesos > 0 ? Math.round(sumaEficacia / totalProcesos) : 0;

    return {
      totalProcesos,
      procesosVerdes,
      procesosAmarillos,
      procesosRojos,
      promedioGlobal,
      totalIndicadores,
      criticosTotal,
      preventivosTotal,
      aceptablesTotal
    };
  }, [procesosEvaluados, indicadores.length]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BARRA DE CONTROL TEMPORAL & FILTROS DE PROCESO */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B192C] text-sky-400 flex items-center justify-center font-bold shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Desempeño por Enfoque de Procesos SGC
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Evaluación integral de eficacia por proceso según ISO 9001:2015 § 4.4 y OOMRSC-05
              </p>
            </div>
          </div>

          {/* Selector de Modo Temporal (Mes / Trimestre / Todo el Año) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              onClick={() => setModoTemporal('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                modoTemporal === 'mes'
                  ? 'bg-white text-[#002855] shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={13} />
              <span>Por Mes</span>
            </button>

            <button
              onClick={() => setModoTemporal('trimestre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                modoTemporal === 'trimestre'
                  ? 'bg-white text-[#002855] shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Por Trimestre</span>
            </button>

            <button
              onClick={() => setModoTemporal('anual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                modoTemporal === 'anual'
                  ? 'bg-white text-[#002855] shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={13} />
              <span>Todo el Año</span>
            </button>
          </div>
        </div>

        {/* SELECTORES DE SUBCORTE SEGÚN EL MODO TEMPORAL */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 font-mono text-[11px] uppercase">
              Período Evaluado:
            </span>

            {modoTemporal === 'mes' && (
              <div className="flex items-center gap-2">
                <select
                  value={mesActivoIndex}
                  onChange={(e) => setMesActivoIndex(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {MESES.map((m, idx) => (
                    <option key={m.clave} value={idx}>
                      {m.nombre} ({m.clave})
                    </option>
                  ))}
                </select>
                <select
                  value={ejercicio}
                  onChange={(e) => setEjercicio?.(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {modoTemporal === 'trimestre' && (
              <div className="flex items-center gap-2">
                <select
                  value={trimestreSeleccionado}
                  onChange={(e) => setTrimestreSeleccionado(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {Object.entries(TRIMESTRES_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({v.descripcion})
                    </option>
                  ))}
                </select>
                <select
                  value={ejercicio}
                  onChange={(e) => setEjercicio?.(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {modoTemporal === 'anual' && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg font-extrabold text-xs">
                  Corte Anual Completo (12 Meses Ene - Dic)
                </span>
                <select
                  value={ejercicio}
                  onChange={(e) => setEjercicio?.(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Búsqueda dentro de procesos y botones expandir/colapsar */}
          <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaProceso}
                onChange={(e) => setBusquedaProceso(e.target.value)}
                placeholder="Filtrar procesos o indicadores..."
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={() => toggleTodos(true)}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
              title="Expandir todos los procesos"
            >
              Expandir
            </button>
            <button
              onClick={() => toggleTodos(false)}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
              title="Colapsar todos los procesos"
            >
              Colapsar
            </button>
          </div>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE PROCESOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase font-mono block">
            Eficacia Media de Procesos
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {resumenGlobal.promedioGlobal}%
          </span>
          <span className="text-[10px] text-sky-700 font-bold block">
            {resumenGlobal.totalProcesos} Procesos Evaluados
          </span>
        </div>

        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[10.5px] font-bold text-emerald-800 uppercase font-mono block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Procesos Conformes (≥90%)
          </span>
          <span className="text-2xl font-black text-emerald-950 block">
            {resumenGlobal.procesosVerdes}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium block">
            {resumenGlobal.aceptablesTotal} indicadores en verde
          </span>
        </div>

        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[10.5px] font-bold text-amber-800 uppercase font-mono block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Procesos en Riesgo (80-89%)
          </span>
          <span className="text-2xl font-black text-amber-950 block">
            {resumenGlobal.procesosAmarillos}
          </span>
          <span className="text-[10px] text-amber-700 font-medium block">
            {resumenGlobal.preventivosTotal} indicadores preventivos
          </span>
        </div>

        <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-sm space-y-1">
          <span className="text-[10.5px] font-bold text-rose-800 uppercase font-mono block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Procesos Críticos (≤79%)
          </span>
          <span className="text-2xl font-black text-rose-950 block">
            {resumenGlobal.procesosRojos}
          </span>
          <span className="text-[10px] text-rose-700 font-bold block">
            {resumenGlobal.criticosTotal} indicadores requieren AC / RC
          </span>
        </div>
      </div>

      {/* LISTADO DE PROCESOS CON ACORDEÓN Y DESGLOSE */}
      <div className="space-y-4">
        {procesosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No se encontraron procesos que coincidan con la búsqueda "{busquedaProceso}".
          </div>
        ) : (
          procesosFiltrados.map((proc) => {
            const estaExpandido = !!procesosExpandidos[proc.nombre];
            const esCritico = proc.semaforoProceso === 'CRITICO';
            const esPreventivo = proc.semaforoProceso === 'PREVENTIVO';

            const barraBg = esCritico
              ? 'bg-rose-500'
              : esPreventivo
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            const badgeBg = esCritico
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : esPreventivo
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={proc.nombre}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* ENCABEZADO DEL PROCESO */}
                <div
                  onClick={() => toggleProceso(proc.nombre)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform ${
                        estaExpandido ? 'rotate-90 bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <ChevronRight size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                          {proc.nombre}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black border ${badgeBg}`}>
                          {proc.promedioEficacia}% Eficacia
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-medium text-[#002855]">{proc.direccion}</span>
                        <span>•</span>
                        <span>{proc.total} Indicadores Oficiales</span>
                        {proc.criticos > 0 && (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                            {proc.criticos} fuera de meta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Semáforos y Barra de Progreso del Proceso */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Aceptables">
                        🟢 {proc.aceptables}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Preventivos">
                        🟡 {proc.preventivos}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Críticos">
                        🔴 {proc.criticos}
                      </span>
                    </div>

                    {/* Mini Barra de Progreso */}
                    <div className="w-28 sm:w-36 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
                        <span>Meta SGC</span>
                        <span>{proc.promedioEficacia}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barraBg}`}
                          style={{ width: `${Math.min(100, proc.promedioEficacia)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLA DE INDICADORES DEL PROCESO (ACORDEÓN EXPANDIDO) */}
                {estaExpandido && (
                  <div className="border-t border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[10.5px] uppercase font-mono">
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[220px]">Nombre del Indicador / Área</th>
                            <th className="py-2.5 px-2 text-center w-24">Meta</th>
                            <th className="py-2.5 px-2 text-center w-24">Impacto</th>
                            <th className="py-2.5 px-3 text-center w-32 bg-sky-50/40">
                              Resultado ({modoTemporal === 'mes' ? mesActivo : modoTemporal === 'trimestre' ? trimestreSeleccionado : 'Anual'})
                            </th>
                            <th className="py-2.5 px-2 text-center w-28">Cumplimiento</th>
                            <th className="py-2.5 px-3 text-center w-36">Acción Correctiva / RC</th>
                            <th className="py-2.5 px-2 text-center w-16" title="Configuración Integral & Ficha PMD">Config.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {proc.indicadores.map(ind => {
                            const sem = ind.sem;
                            const esFalla = sem.rango === 'CRITICO';
                            const esAltoImpacto = ind.impacto === 'Alto';

                            return (
                              <tr key={ind.id} className="hover:bg-slate-50 transition-colors">
                                {/* # */}
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                                  #{ind.numero}
                                </td>

                                {/* Nombre & Área */}
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900 leading-tight">
                                    {ind.nombre}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                    📍 {ind.area} • <span className="italic text-slate-400">{ind.periodicidad}</span>
                                  </div>
                                </td>

                                {/* Meta */}
                                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                                  {ind.metaEvaluada} {ind.unidad === 'Porcentaje' ? '%' : ind.unidad}
                                </td>

                                {/* Impacto */}
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    esAltoImpacto
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {ind.impacto}
                                  </span>
                                </td>

                                {/* Resultado / Captura */}
                                <td className="py-2.5 px-3 text-center bg-sky-50/20">
                                  {modoTemporal === 'mes' ? (
                                    <button
                                      onClick={() => onAbrirCaptura?.(ind)}
                                      className="w-full px-2.5 py-1 bg-white border border-slate-300 hover:border-sky-500 rounded-lg text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs cursor-pointer transition-all"
                                      title="Capturar o modificar resultado"
                                    >
                                      <span>{ind.val !== null && ind.val !== undefined ? ind.val : <span className="text-slate-400 font-normal">Capturar</span>}</span>
                                      <Edit3 size={11} className="text-slate-400" />
                                    </button>
                                  ) : (
                                    <span className="font-bold font-mono text-slate-900 text-xs">
                                      {ind.val !== null ? ind.val : 'N/D'}
                                    </span>
                                  )}
                                </td>

                                {/* Cumplimiento */}
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${sem.bg} ${sem.text} ${sem.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sem.dot}`} />
                                    <span>{sem.porcentaje !== null ? `${sem.porcentaje}%` : 'N/A'}</span>
                                  </span>
                                </td>

                                {/* Acción / RC */}
                                <td className="py-2.5 px-3 text-center">
                                  {esFalla ? (
                                    esAltoImpacto ? (
                                      <button
                                        onClick={() => onCrearAccionCorrectiva?.(ind, ind.val, sem)}
                                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 justify-center w-full cursor-pointer transition-all"
                                        title="Indicador de Alto Impacto fuera de meta: Requiere Acción Correctiva OOMRSC-20"
                                      >
                                        <AlertTriangle size={11} />
                                        <span>+ Generar AC</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => onCrearReporteCorreccion?.(ind, ind.val, sem)}
                                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 justify-center w-full cursor-pointer transition-all"
                                        title="Indicador de Bajo Impacto fuera de meta: Requiere Reporte de Corrección (RC)"
                                      >
                                        <AlertOctagon size={11} />
                                        <span>+ Generar RC</span>
                                      </button>
                                    )
                                  ) : (
                                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                      ind.acc !== 'NA'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'text-slate-400'
                                    }`}>
                                      {ind.acc}
                                    </span>
                                  )}
                                </td>

                                {/* Configuración Integral & Ficha PMD */}
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    onClick={() => onEditarIndicador ? onEditarIndicador(ind) : onAbrirFichaAyuntamiento?.(ind)}
                                    className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer border border-transparent hover:border-sky-200"
                                    title="Configuración Integral & Ficha PMD (SGC + PMD)"
                                  >
                                    <Settings size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
