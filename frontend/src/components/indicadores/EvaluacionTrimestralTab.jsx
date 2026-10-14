import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { evalSemaforoOOMRSC05, RANGOS_SEMAFORO_OOMRSC05 } from '../../constants/indicadores';
import { DIRECCIONES } from '../../constants/areas';
import { useToast } from '../common/Toast';

const MESES_POR_TRIMESTRE = {
  T1: ['Ene', 'Feb', 'Mar'],
  T2: ['Abr', 'May', 'Jun'],
  T3: ['Jul', 'Ago', 'Sep'],
  T4: ['Oct', 'Nov', 'Dic']
};

const NOMBRES_TRIMESTRES = {
  T1: '1er Trimestre (Enero - Marzo)',
  T2: '2do Trimestre (Abril - Junio)',
  T3: '3er Trimestre (Julio - Septiembre)',
  T4: '4to Trimestre (Octubre - Diciembre)'
};

const ORDEN_TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];

export default function EvaluacionTrimestralTab({
  listaIndicadores = [],
  resultados = {},
  ejercicio = 2026,
  onAbrirCaptura,
  onAbrirGenerarRC
}) {
  const toast = useToast();
  const [trimestreActivo, setTrimestreActivo] = useState('T3');
  const [filtroDireccion, setFiltroDireccion] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const mesesDelTrimestre = MESES_POR_TRIMESTRE[trimestreActivo] || ['Ene', 'Feb', 'Mar'];

  // Trimestres transcurridos hasta el trimestre activo (ej. para T3: ['T1', 'T2', 'T3'])
  const trimestresTranscurridos = useMemo(() => {
    const idx = ORDEN_TRIMESTRES.indexOf(trimestreActivo);
    return ORDEN_TRIMESTRES.slice(0, idx >= 0 ? idx + 1 : 1);
  }, [trimestreActivo]);

  // Cálculo individual y agrupado por indicador para el trimestre seleccionado y acumulado anual
  const evaluacionIndicadores = useMemo(() => {
    return listaIndicadores.map(ind => {
      const esPorcentual = ind.unidad === 'Porcentaje' || ind.unidad === 'Índice' || ind.unidad === 'Ratio';

      // Evaluar cada uno de los 4 trimestres (T1..T4) para permitir acumulación progresiva real
      const trimestresDesglose = ORDEN_TRIMESTRES.map(tKey => {
        const mesesT = MESES_POR_TRIMESTRE[tKey];
        const valoresMesesT = mesesT.map(m => {
          const k = `${ind.id}-${m}-${ejercicio}`;
          const res = resultados[k];
          if (res && res.valor !== undefined && res.valor !== null) {
            return { mes: m, valor: Number(res.valor), tieneDato: true };
          }
          return { mes: m, valor: Number(ind.valor_default ?? 0), tieneDato: false };
        });

        const mesesConDatoT = valoresMesesT.filter(v => v.tieneDato);
        const fuenteT = mesesConDatoT.length > 0 ? mesesConDatoT : valoresMesesT;

        // Logro del trimestre tKey
        let logroRealT = 0;
        if (esPorcentual) {
          const suma = fuenteT.reduce((acc, curr) => acc + curr.valor, 0);
          logroRealT = Math.round((suma / (fuenteT.length || 1)) * 10) / 10;
        } else {
          logroRealT = fuenteT.reduce((acc, curr) => acc + curr.valor, 0);
        }

        // Metas y ponderación de tKey
        let metaProgramadaT = 0;
        let pesoTrimestralT = 0;
        let pctCumplimientoT = 0;
        let puntosAporteT = 0;

        if (esPorcentual) {
          pesoTrimestralT = Number(ind.metas_trimestrales?.[tKey]) || 25;
          metaProgramadaT = pesoTrimestralT;

          if (ind.es_menor) {
            const metaLimite = Number(ind.meta) || 10;
            pctCumplimientoT = logroRealT <= metaLimite ? 100 : Math.max(0, Math.round((metaLimite / (logroRealT || 1)) * 100));
          } else {
            const metaBase = (ind.meta && ind.meta >= 50 && ind.meta <= 100 && ind.periodicidad !== 'Trimestral') ? Number(ind.meta) : 100;
            pctCumplimientoT = Math.min(100, Math.round((logroRealT / metaBase) * 100));
          }

          // Aporte de puntos porcentuales al avance anual logrado en este trimestre
          puntosAporteT = Math.round((pesoTrimestralT * (pctCumplimientoT / 100)) * 10) / 10;
        } else {
          if (ind.metas_trimestrales && ind.metas_trimestrales[tKey] !== undefined) {
            metaProgramadaT = Number(ind.metas_trimestrales[tKey]) || 0;
          } else if (ind.periodicidad === 'Anual') {
            const baseAnual = Number(ind.meta_anual || ind.meta) || 100;
            metaProgramadaT = Math.round((baseAnual / 4) * 10) / 10;
          } else if (ind.periodicidad === 'Mensual') {
            metaProgramadaT = (Number(ind.meta) || 0) * 3;
          } else {
            metaProgramadaT = Number(ind.meta) || 100;
          }

          pesoTrimestralT = metaProgramadaT;
          if (ind.es_menor) {
            pctCumplimientoT = logroRealT <= metaProgramadaT ? 100 : Math.max(0, Math.round((metaProgramadaT / (logroRealT || 1)) * 100));
          } else {
            pctCumplimientoT = metaProgramadaT > 0 ? Math.round((logroRealT / metaProgramadaT) * 100) : (logroRealT > 0 ? 100 : 0);
          }
          puntosAporteT = logroRealT;
        }

        return {
          trimestre: tKey,
          valoresMeses: valoresMesesT,
          mesesConDato: mesesConDatoT,
          logroReal: logroRealT,
          metaProgramada: metaProgramadaT,
          pesoTrimestral: pesoTrimestralT,
          pctCumplimiento: pctCumplimientoT,
          puntosAporte: puntosAporteT
        };
      });

      // Evaluación del trimestre activo en particular
      const evalActual = trimestresDesglose.find(d => d.trimestre === trimestreActivo) || trimestresDesglose[0];

      // Trimestres transcurridos hasta el activo (ej: T1 en T1; T1+T2 en T2; T1+T2+T3 en T3; T1+T2+T3+T4 en T4)
      const transcurridos = trimestresDesglose.filter(d => trimestresTranscurridos.includes(d.trimestre));

      // AVANCE ANUAL ACUMULADO: Suma de los aportes logrados de trimestres pasados + trimestre actual
      const avanceAnualAcumulado = Math.round(
        transcurridos.reduce((acc, curr) => acc + curr.puntosAporte, 0) * 10
      ) / 10;

      // META PROGRAMADA ACUMULADA: Suma de las metas de los trimestres transcurridos
      const metaAcumuladaCorte = Math.round(
        transcurridos.reduce((acc, curr) => acc + curr.metaProgramada, 0) * 10
      ) / 10;

      // META ANUAL TOTAL: Suma de los 4 trimestres del año
      const metaAnualTotal = Math.round(
        trimestresDesglose.reduce((acc, curr) => acc + curr.metaProgramada, 0) * 10
      ) / 10;

      // % de avance respecto a la meta programada acumulada al corte
      const pctAvanceVsMetaCorte = metaAcumuladaCorte > 0
        ? Math.min(100, Math.round((avanceAnualAcumulado / metaAcumuladaCorte) * 100))
        : 0;

      // Desglose textual de la suma acumulativa: ej. "T1: 18% + T2: 18% + T3: 18%"
      const formulaAcumulada = transcurridos
        .map(t => `${t.trimestre}: ${t.puntosAporte}${esPorcentual ? '%' : ''}`)
        .join(' + ');

      // Determinar método explicativo
      let metodoMeta = '';
      if (esPorcentual) {
        metodoMeta = `Meta 100% de ${trimestreActivo} (Ponderación: ${evalActual.pesoTrimestral}%)`;
      } else if (ind.metas_trimestrales && ind.metas_trimestrales[trimestreActivo] !== undefined) {
        metodoMeta = 'Metas Trimestrales (Cuadro Control)';
      } else if (ind.periodicidad === 'Anual') {
        metodoMeta = 'Reparto 25% Anual';
      } else if (ind.periodicidad === 'Mensual') {
        metodoMeta = 'Acumulado 3 Meses';
      } else {
        metodoMeta = 'Meta Periódica';
      }

      // Evaluar semáforo del trimestre activo con los rangos institucionales OOMRSC-05
      let semaforo;
      if (evalActual.pctCumplimiento >= 90) {
        semaforo = { ...RANGOS_SEMAFORO_OOMRSC05.ACEPTABLE, rango: 'ACEPTABLE', porcentaje: evalActual.pctCumplimiento, valor: evalActual.logroReal, cumple: 'SI' };
      } else if (evalActual.pctCumplimiento >= 80) {
        semaforo = { ...RANGOS_SEMAFORO_OOMRSC05.PREVENTIVO, rango: 'PREVENTIVO', porcentaje: evalActual.pctCumplimiento, valor: evalActual.logroReal, cumple: 'SI' };
      } else {
        semaforo = { ...RANGOS_SEMAFORO_OOMRSC05.CRITICO, rango: 'CRITICO', porcentaje: evalActual.pctCumplimiento, valor: evalActual.logroReal, cumple: 'NO' };
      }

      return {
        ...ind,
        metaTrimestre: evalActual.metaProgramada,
        pesoTrimestral: evalActual.pesoTrimestral,
        metodoMeta,
        logroReal: evalActual.logroReal,
        puntosAporteTrimestre: evalActual.puntosAporte,
        avanceAnualAcumulado,
        metaAcumuladaCorte,
        metaAnualTotal,
        pctAvanceVsMetaCorte,
        formulaAcumulada,
        trimestresDesglose,
        esPorcentual,
        valoresMeses: evalActual.valoresMeses,
        mesesConDatoCount: evalActual.mesesConDato.length,
        semaforo,
        porcentaje: evalActual.pctCumplimiento
      };
    });
  }, [listaIndicadores, resultados, ejercicio, trimestreActivo, trimestresTranscurridos]);

  // Filtrado
  const indicadoresFiltrados = useMemo(() => {
    return evaluacionIndicadores.filter(ind => {
      const matchDir = !filtroDireccion || ind.direccion === filtroDireccion;
      const matchProc = !filtroProceso || ind.proceso === filtroProceso;
      const matchSem = !filtroSemaforo || ind.semaforo.rango === filtroSemaforo;
      const matchTxt = !busqueda || 
        ind.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        ind.area.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(ind.numero).includes(busqueda);
      return matchDir && matchProc && matchSem && matchTxt;
    });
  }, [evaluacionIndicadores, filtroDireccion, filtroProceso, filtroSemaforo, busqueda]);

  // Métricas Consolidadas
  const metricasGlobales = useMemo(() => {
    const total = evaluacionIndicadores.length || 1;
    const aceptables = evaluacionIndicadores.filter(i => i.semaforo.rango === 'ACEPTABLE').length;
    const preventivos = evaluacionIndicadores.filter(i => i.semaforo.rango === 'PREVENTIVO').length;
    const criticos = evaluacionIndicadores.filter(i => i.semaforo.rango === 'CRITICO').length;

    const sumaPcts = evaluacionIndicadores.reduce((acc, i) => acc + (i.porcentaje || 0), 0);
    const promedioEficacia = Math.round(sumaPcts / total);

    // Promedio de avance anual acumulado para indicadores porcentuales
    const porcentuales = evaluacionIndicadores.filter(i => i.esPorcentual);
    const sumaAvanceAcum = porcentuales.reduce((acc, i) => acc + (i.avanceAnualAcumulado || 0), 0);
    const sumaMetaCorte = porcentuales.reduce((acc, i) => acc + (i.metaAcumuladaCorte || 0), 0);
    const promedioAvanceAcumulado = porcentuales.length > 0
      ? Math.round((sumaAvanceAcum / porcentuales.length) * 10) / 10
      : 0;
    const promedioMetaAcumulada = porcentuales.length > 0
      ? Math.round((sumaMetaCorte / porcentuales.length) * 10) / 10
      : 0;

    return {
      total,
      aceptables,
      preventivos,
      criticos,
      promedioEficacia,
      promedioAvanceAcumulado,
      promedioMetaAcumulada
    };
  }, [evaluacionIndicadores]);

  // Exportar a CSV
  const handleExportarCSV = () => {
    const encabezados = [
      'Trimestre Evaluado',
      'Numero',
      'Indicador',
      'Proceso',
      'Direccion',
      'Area',
      'Periodicidad',
      'Unidad',
      'Meta Trimestre',
      'Metodo Meta',
      'Mes 1',
      'Mes 2',
      'Mes 3',
      'Logro Trimestre',
      '% Cumplimiento Trimestre',
      'Semaforo Trimestre',
      'Aporte Trimestre',
      `Avance Anual Acumulado (al corte de ${trimestreActivo})`,
      `Meta Acumulada (al corte de ${trimestreActivo})`,
      'Meta Anual Total',
      '% Avance vs Meta al Corte',
      'Desglose Trimestral Acumulado'
    ];

    const filas = evaluacionIndicadores.map(i => [
      `"${trimestreActivo}"`,
      i.numero,
      `"${i.nombre.replace(/"/g, '""')}"`,
      `"${i.proceso}"`,
      `"${i.direccion}"`,
      `"${i.area}"`,
      `"${i.periodicidad}"`,
      `"${i.unidad}"`,
      i.esPorcentual ? `${i.pesoTrimestral}%` : i.metaTrimestre,
      `"${i.metodoMeta}"`,
      i.valoresMeses[0]?.valor ?? 0,
      i.valoresMeses[1]?.valor ?? 0,
      i.valoresMeses[2]?.valor ?? 0,
      i.esPorcentual ? `${i.logroReal}%` : i.logroReal,
      `${i.porcentaje}%`,
      `"${i.semaforo.rango}"`,
      i.esPorcentual ? `${i.puntosAporteTrimestre}%` : i.puntosAporteTrimestre,
      i.esPorcentual ? `${i.avanceAnualAcumulado}%` : i.avanceAnualAcumulado,
      i.esPorcentual ? `${i.metaAcumuladaCorte}%` : i.metaAcumuladaCorte,
      i.esPorcentual ? `${i.metaAnualTotal}%` : i.metaAnualTotal,
      `${i.pctAvanceVsMetaCorte}%`,
      `"${i.formulaAcumulada}"`
    ]);

    const csvContent = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Evaluacion_Trimestral_${trimestreActivo}_Acumulado_OOMAPASC_${ejercicio}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Evaluación de ${trimestreActivo} y acumulado anual exportado a CSV con éxito.`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Selector de Trimestres y Encabezado */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <BarChart3 size={16} />
              <span>Cuadro de Control de Desempeño OOMRSC-05</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Evaluación Trimestral y Concentrado MIR {ejercicio}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fórmula de reparto ponderado de metas mensuales y anuales por trimestre, conforme a la Matriz de Indicadores para Resultados del Organismo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportarCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} /> Exportar Trimestre a Excel
            </button>
          </div>
        </div>

        {/* Botones de Selección T1 a T4 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {['T1', 'T2', 'T3', 'T4'].map(tKey => {
            const esActivo = trimestreActivo === tKey;
            const mesesStr = MESES_POR_TRIMESTRE[tKey].join(', ');
            return (
              <button
                key={tKey}
                onClick={() => setTrimestreActivo(tKey)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  esActivo
                    ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black">{tKey}</span>
                  <span className={`text-[10px] font-bold ${esActivo ? 'text-sky-300' : 'text-slate-400'}`}>
                    {mesesStr}
                  </span>
                </div>
                <div className="text-xs font-bold mt-1 truncate">
                  {NOMBRES_TRIMESTRES[tKey]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjetas de Métricas del Trimestre Activo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Eficacia {trimestreActivo}</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
            {metricasGlobales.promedioEficacia}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Cumplimiento del trimestre</span>
        </div>

        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-800 block uppercase">Avance Anual Acumulado</span>
          <span className="text-2xl font-black text-sky-900 font-mono mt-0.5 block">
            {metricasGlobales.promedioAvanceAcumulado}%
          </span>
          <span className="text-[10px] text-sky-700 block mt-1">
            De {metricasGlobales.promedioMetaAcumulada}% programado al corte {trimestreActivo}
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 block uppercase">🟢 Aceptable (≥90%)</span>
          <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
            {metricasGlobales.aceptables}
          </span>
          <span className="text-[10px] text-emerald-700 block mt-1">Cumplimiento satisfactorio</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 block uppercase">🟡 Preventivo (80-89%)</span>
          <span className="text-2xl font-black text-amber-700 font-mono mt-0.5 block">
            {metricasGlobales.preventivos}
          </span>
          <span className="text-[10px] text-amber-700 block mt-1">Requiere monitoreo</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-800 block uppercase">🔴 Crítico (≤79%)</span>
          <span className="text-2xl font-black text-rose-700 font-mono mt-0.5 block">
            {metricasGlobales.criticos}
          </span>
          <span className="text-[10px] text-rose-700 block mt-1">Requiere Reporte RC / AC</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por #, indicador o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <select
          value={filtroDireccion}
          onChange={(e) => setFiltroDireccion(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">Todas las Direcciones</option>
          {DIRECCIONES.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={filtroSemaforo}
          onChange={(e) => setFiltroSemaforo(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="">Todos los Semáforos</option>
          <option value="ACEPTABLE">🟢 Aceptable (≥90%)</option>
          <option value="PREVENTIVO">🟡 Preventivo (80-89%)</option>
          <option value="CRITICO">🔴 Crítico (≤79%)</option>
        </select>
      </div>

      {/* Tabla Oficial de Evaluación Trimestral */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Nombre del Indicador</th>
                <th className="py-2.5 px-3">Área / Proceso</th>
                <th className="py-2.5 px-3 text-center">Periodicidad</th>
                <th className="py-2.5 px-3 text-right">Meta {trimestreActivo}</th>
                <th className="py-2.5 px-3 text-center">
                  Meses ({mesesDelTrimestre.join(', ')})
                </th>
                <th className="py-2.5 px-3 text-right">Logro {trimestreActivo}</th>
                <th className="py-2.5 px-3 text-center">% Desempeño</th>
                <th className="py-2.5 px-3 text-right min-w-[200px]">
                  <span>Avance Anual Acumulado</span>
                  <span className="block text-[10px] font-normal text-slate-500">
                    Suma hasta {trimestreActivo}
                  </span>
                </th>
                <th className="py-2.5 px-3 text-center">Acción SGC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {indicadoresFiltrados.map((ind) => {
                const sem = ind.semaforo;
                const esCritico = sem.rango === 'CRITICO';

                return (
                  <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Número */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                      #{ind.numero}
                    </td>

                    {/* Nombre */}
                    <td className="py-3 px-3 max-w-xs">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {ind.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Unidad: {ind.unidad}
                      </span>
                    </td>

                    {/* Área / Proceso */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {ind.area}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {ind.proceso}
                      </span>
                    </td>

                    {/* Periodicidad */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {ind.periodicidad}
                      </span>
                    </td>

                    {/* Meta Trimestral */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {ind.esPorcentual ? (
                        <>
                          <span>{ind.pesoTrimestral}%</span>
                          <span className="text-[10px] text-slate-400 block font-normal truncate" title={ind.metodoMeta}>
                            Ponderación {trimestreActivo}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{ind.metaTrimestre}</span>
                          <span className="text-[10px] text-slate-400 block font-normal truncate" title={ind.metodoMeta}>
                            {ind.metodoMeta}
                          </span>
                        </>
                      )}
                    </td>

                    {/* Desglose de los 3 meses */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex gap-1">
                        {ind.valoresMeses.map((v, idx) => (
                          <span
                            key={idx}
                            title={`${v.mes}: ${v.valor}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              v.tieneDato ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {v.valor}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Logro Real Trimestre */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      <div>{ind.logroReal} {ind.esPorcentual ? '%' : ''}</div>
                      {ind.esPorcentual && (
                        <span className="text-[10px] text-sky-700 block font-bold font-mono">
                          +{ind.puntosAporteTrimestre}% en {trimestreActivo}
                        </span>
                      )}
                    </td>

                    {/* % Cumplimiento y Semáforo */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] border inline-block font-mono ${sem.bg} ${sem.text} ${sem.border}`}
                      >
                        {ind.porcentaje}%
                      </span>
                    </td>

                    {/* Avance Anual Acumulado (Suma de trimestres pasados + activo) */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-black text-slate-900 text-xs">
                        <span>
                          {ind.avanceAnualAcumulado}{ind.esPorcentual ? '%' : ''}
                        </span>
                        <span className="text-slate-400 font-semibold text-[11px]">
                          {' '}/ {ind.metaAcumuladaCorte}{ind.esPorcentual ? '%' : ''}
                        </span>
                      </div>

                      {/* Fórmula y desglose sumatorio */}
                      <div
                        className="text-[10px] text-sky-800 font-mono font-bold truncate max-w-[230px] ml-auto mt-0.5"
                        title={`Suma acumulada: ${ind.formulaAcumulada}`}
                      >
                        {ind.formulaAcumulada}
                      </div>

                      {/* Mini barra de progreso respecto a la meta acumulada al corte */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden flex ml-auto max-w-[160px]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ind.pctAvanceVsMetaCorte >= 90
                              ? 'bg-emerald-500'
                              : ind.pctAvanceVsMetaCorte >= 80
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, ind.pctAvanceVsMetaCorte)}%` }}
                        />
                      </div>
                    </td>

                    {/* Acción SGC */}
                    <td className="py-3 px-3 text-center">
                      {esCritico ? (
                        <button
                          type="button"
                          onClick={() => onAbrirGenerarRC?.(ind, ind.logroReal, sem)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition-all border border-rose-200 flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <AlertOctagon size={11} /> Emitir RC
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} /> Conforme
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
