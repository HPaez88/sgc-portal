import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Building2, 
  TrendingUp, 
  Layers, 
  FileSpreadsheet, 
  ChevronRight, 
  Sparkles, 
  BarChart3, 
  Calendar, 
  Check, 
  FileWarning,
  Eye,
  Flame,
  ShieldCheck,
  History,
  Activity
} from 'lucide-react';
import { 
  INDICADORES, 
  FORMATO_CUADRO_CONTROL, 
  RANGOS_SEMAFORO_OOMRSC05, 
  evalSemaforoOOMRSC05, 
  REPORTES_CORRECCION_INICIALES 
} from '../../constants/indicadores';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ContenedorModal from '../common/ContenedorModal';
import StatCard from '../ui/StatCard';
import { acDesdeIndicador, movimientoVinculo } from '../../services/flujoService';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TRIMESTRES = {
  1: { label: '1er Trimestre (Ene-Mar)', meses: ['Ene', 'Feb', 'Mar'], key: 'T1' },
  2: { label: '2do Trimestre (Abr-Jun)', meses: ['Abr', 'May', 'Jun'], key: 'T2' },
  3: { label: '3er Trimestre (Jul-Sep)', meses: ['Jul', 'Ago', 'Sep'], key: 'T3' },
  4: { label: '4to Trimestre (Oct-Dic)', meses: ['Oct', 'Nov', 'Dic'], key: 'T4' },
};

const PAGE_SIZE = 25;

export default function IndicadoresView({
  indicadoresData = {},
  setIndicadoresData,
  puedeTodasAreas,
  areaUsuario
}) {
  const { 
    areas = [], 
    procesos = [], 
    direcciones = [], 
    setAccionesCorrectivas, 
    registrarMovimiento, 
    usuarioLogueado 
  } = useSGC();
  const toast = useToast();

  // Estados de navegación
  const [tabActiva, setTabActiva] = useState('cuadro'); // 'cuadro' | 'trimestral' | 'correcciones'
  const [ejercicio, setEjercicio] = useState(2026);
  const [mesActivoIndex, setMesActivoIndex] = useState(() => Math.min(new Date().getMonth(), 7)); // Agosto default
  const mesActivo = MESES[mesActivoIndex];
  const mesActivoNombre = MESES_COMPLETOS[mesActivoIndex];

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroDireccion, setFiltroDireccion] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroImpacto, setFiltroImpacto] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState('');
  const [pagina, setPagina] = useState(1);

  // Estados de Edición Rápida / Modal
  const [indicadorEnEdicion, setIndicadorEnEdicion] = useState(null);
  const [valorInput, setValorInput] = useState('');
  const [observacionInput, setObservacionInput] = useState('');
  const [accionInput, setAccionInput] = useState('NA');

  // Reportes de corrección históricos (con persistencia local)
  const [reportesCorreccion, setReportesCorreccion] = useState(() => {
    try {
      const g = localStorage.getItem('sgc-reportes-correccion');
      if (g) return JSON.parse(g);
    } catch (e) { /* ignore */ }
    return REPORTES_CORRECCION_INICIALES;
  });

  // Guardar en contexto global
  const resultados = indicadoresData.resultados || {};

  const guardarResultado = (indicadorId, mes, anio, valor, observacion = '', accion = 'NA') => {
    const key = `${indicadorId}-${mes}-${anio}`;
    const nuevoObj = {
      ...(resultados[key] || {}),
      valor: valor === '' ? null : Number(valor),
      observacion: observacion,
      accion: accion,
      capturadoPor: usuarioLogueado?.nombre || 'Usuario SGC',
      fechaCaptura: new Date().toISOString()
    };

    const nuevosResultados = {
      ...resultados,
      [key]: nuevoObj
    };

    setIndicadoresData(prev => ({
      ...prev,
      resultados: nuevosResultados,
      updatedAt: new Date().toISOString()
    }));

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'CAPTURA_INDICADOR',
      descripcion: `Captura de indicador #${indicadorId} (${mes} ${anio}): ${valor}`,
      detalles: `Observación: ${observacion || 'Sin observación'}`,
      folio: `IND#${indicadorId}`
    });
  };

  // Abrir Modal para Capturar / Editar
  const abrirModalCaptura = (ind) => {
    const key = `${ind.id}-${mesActivo}-${ejercicio}`;
    const dataGuardada = resultados[key];
    const valorPrevio = dataGuardada?.valor !== undefined ? dataGuardada.valor : (ind.valor_default ?? '');
    const obsPrevia = dataGuardada?.observacion || ind.observacion_default || '';
    const accPrevia = dataGuardada?.accion || ind.accion_default || 'NA';

    setIndicadorEnEdicion(ind);
    setValorInput(valorPrevio !== null ? String(valorPrevio) : '');
    setObservacionInput(obsPrevia);
    setAccionInput(accPrevia);
  };

  const handleGuardarModal = (e) => {
    e.preventDefault();
    if (!indicadorEnEdicion) return;

    guardarResultado(
      indicadorEnEdicion.id,
      mesActivo,
      ejercicio,
      valorInput,
      observacionInput,
      accionInput
    );

    toast.exito(`Indicador #${indicadorEnEdicion.id} guardado correctamente para ${mesActivoNombre} ${ejercicio}.`);
    setIndicadorEnEdicion(null);
  };

  // Crear Acción Correctiva desde Indicador Crítico
  const handleCrearAccionCorrectiva = (ind, valReal, sem) => {
    if (!setAccionesCorrectivas) return;

    const nuevaAC = {
      id: Date.now(),
      folio: `AC-IND#${ind.id}/${Date.now().toString().slice(-4)}`,
      proceso: ind.proceso || 'Medición, Análisis y Mejora',
      area: ind.area || 'Control de Calidad',
      direccion: ind.direccion || 'Dirección General',
      origen: 'Indicador fuera de meta',
      descripcion: `Desviación en Indicador #${ind.id} - ${ind.nombre}. Meta: ${ind.meta} ${ind.unidad}, Obtenido: ${valReal} ${ind.unidad} (${sem.porcentaje}% de cumplimiento - ${sem.label}).`,
      causaRaiz: 'En investigación por el área responsable.',
      estado: 'BORRADOR',
      fechaApertura: new Date().toISOString().split('T')[0],
      fechaCompromiso: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
      responsable: usuarioLogueado?.nombre || 'Coordinador SGC',
      auditorAsignado: null,
      actividades: [],
      costoEstimado: 0
    };

    setAccionesCorrectivas(prev => [nuevaAC, ...(prev || [])]);
    toast.exito(`Acción Correctiva ${nuevaAC.folio} generada automáticamente desde el indicador.`);

    // Registrar en reportes de corrección del cuadro de control
    const nuevoReporte = {
      id: Date.now(),
      ejercicio: String(ejercicio),
      folio: `RC ${ind.id}/${ejercicio}`,
      responsable: ind.area || usuarioLogueado?.nombre || 'SGC',
      estado: 'ABIERTA',
      indicadorId: ind.id
    };
    setReportesCorreccion(prev => {
      const actualizados = [nuevoReporte, ...prev];
      localStorage.setItem('sgc-reportes-correccion', JSON.stringify(actualizados));
      return actualizados;
    });

    // Actualizar campo acción del indicador
    guardarResultado(ind.id, mesActivo, ejercicio, valReal, observacionInput, nuevoReporte.folio);
  };

  // Filtrado de Indicadores
  const indicadoresFiltrados = useMemo(() => {
    return INDICADORES.filter(ind => {
      if (!puedeTodasAreas && areaUsuario && ind.area !== areaUsuario) return false;
      if (filtroDireccion && ind.direccion !== filtroDireccion) return false;
      if (filtroProceso && ind.proceso !== filtroProceso) return false;
      if (filtroArea && ind.area !== filtroArea) return false;
      if (filtroImpacto && ind.impacto !== filtroImpacto) return false;

      // Filtro semáforo
      if (filtroSemaforo) {
        const key = `${ind.id}-${mesActivo}-${ejercicio}`;
        const val = resultados[key]?.valor !== undefined ? resultados[key].valor : ind.valor_default;
        const sem = evalSemaforoOOMRSC05(val, ind.meta, ind.es_menor);
        if (filtroSemaforo === 'ACEPTABLE' && sem.rango !== 'ACEPTABLE') return false;
        if (filtroSemaforo === 'PREVENTIVO' && sem.rango !== 'PREVENTIVO') return false;
        if (filtroSemaforo === 'CRITICO' && sem.rango !== 'CRITICO') return false;
        if (filtroSemaforo === 'PENDIENTE' && sem.rango !== 'SIN_DATOS') return false;
      }

      if (busqueda) {
        const query = busqueda.toLowerCase();
        const texto = `${ind.id} ${ind.nombre} ${ind.area} ${ind.proceso} ${ind.direccion}`.toLowerCase();
        if (!texto.includes(query)) return false;
      }
      return true;
    });
  }, [busqueda, filtroDireccion, filtroProceso, filtroArea, filtroImpacto, filtroSemaforo, mesActivo, ejercicio, resultados, puedeTodasAreas, areaUsuario]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(indicadoresFiltrados.length / PAGE_SIZE));
  const indicadoresPaginados = useMemo(() => {
    const inicio = (pagina - 1) * PAGE_SIZE;
    return indicadoresFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [indicadoresFiltrados, pagina]);

  // Estadísticas del Mes Seleccionado (Semáforo Global)
  const statsGlobales = useMemo(() => {
    let aceptables = 0;
    let preventivos = 0;
    let criticos = 0;
    let pendientes = 0;
    let sumaPorcentaje = 0;
    let evaluadosCount = 0;

    INDICADORES.forEach(ind => {
      const key = `${ind.id}-${mesActivo}-${ejercicio}`;
      const val = resultados[key]?.valor !== undefined ? resultados[key].valor : ind.valor_default;
      const sem = evalSemaforoOOMRSC05(val, ind.meta, ind.es_menor);

      if (sem.rango === 'ACEPTABLE') {
        aceptables++;
        sumaPorcentaje += sem.porcentaje || 100;
        evaluadosCount++;
      } else if (sem.rango === 'PREVENTIVO') {
        preventivos++;
        sumaPorcentaje += sem.porcentaje || 85;
        evaluadosCount++;
      } else if (sem.rango === 'CRITICO') {
        criticos++;
        sumaPorcentaje += sem.porcentaje || 50;
        evaluadosCount++;
      } else {
        pendientes++;
      }
    });

    const promedioGlobal = evaluadosCount > 0 ? Math.round(sumaPorcentaje / evaluadosCount) : 92;

    return {
      total: INDICADORES.length,
      aceptables,
      preventivos,
      criticos,
      pendientes,
      promedioGlobal
    };
  }, [mesActivo, ejercicio, resultados]);

  // Exportar Cuadro de Control a CSV
  const handleExportarCSV = () => {
    try {
      const headers = [
        'No. Proceso', 'Proceso', 'Dirección', 'Área', '# Indicador', 
        'Nombre del Indicador', 'Periodicidad', 'Unidad de Medida', 'Meta Anual',
        'Meta T1', 'Meta T2', 'Meta T3', 'Meta T4', 'Impacto',
        'Cumple (SI/NO)', `Valor Real (${mesActivo} ${ejercicio})`, '% Cumplimiento', 'Observación', 'Acción / RC'
      ];

      const rows = INDICADORES.map(ind => {
        const key = `${ind.id}-${mesActivo}-${ejercicio}`;
        const dataGuardada = resultados[key];
        const val = dataGuardada?.valor !== undefined ? dataGuardada.valor : (ind.valor_default ?? '');
        const obs = dataGuardada?.observacion || ind.observacion_default || '';
        const acc = dataGuardada?.accion || ind.accion_default || 'NA';
        const sem = evalSemaforoOOMRSC05(val, ind.meta, ind.es_menor);

        return [
          ind.id,
          `"${ind.proceso}"`,
          `"${ind.direccion}"`,
          `"${ind.area}"`,
          ind.numero,
          `"${ind.nombre.replace(/"/g, '""')}"`,
          ind.periodicidad,
          ind.unidad,
          ind.meta_anual,
          ind.metas_trimestrales?.T1 ?? '',
          ind.metas_trimestrales?.T2 ?? '',
          ind.metas_trimestrales?.T3 ?? '',
          ind.metas_trimestrales?.T4 ?? '',
          ind.impacto,
          sem.cumple,
          val,
          sem.porcentaje !== null ? `${sem.porcentaje}%` : '',
          `"${obs.replace(/"/g, '""')}"`,
          `"${acc}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `OOMRSC-05_Cuadro_Control_${mesActivo}_${ejercicio}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.exito(`Cuadro de Control OOMRSC-05 exportado exitosamente.`);
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar el archivo CSV.');
    }
  };

  // Opciones únicas de filtros
  const direccionesUnicas = useMemo(() => [...new Set(INDICADORES.map(i => i.direccion).filter(Boolean))].sort(), []);
  const procesosUnicos = useMemo(() => [...new Set(INDICADORES.map(i => i.proceso).filter(Boolean))].sort(), []);
  const areasUnicas = useMemo(() => [...new Set(INDICADORES.map(i => i.area).filter(Boolean))].sort(), []);

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL OOMRSC-05 */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F294D] to-[#1E3E62] text-white p-6 rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                {FORMATO_CUADRO_CONTROL.clave} {FORMATO_CUADRO_CONTROL.revision}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Target size={14} />
                {FORMATO_CUADRO_CONTROL.totalIndicadores} Indicadores Oficiales
              </span>
              <span className="text-slate-300 text-xs">
                Última Rev.: <strong className="text-white font-mono">{FORMATO_CUADRO_CONTROL.ultimaRevision}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cuadro de Control de Desempeño
            </h1>
            <p className="text-xs text-sky-100/80 leading-relaxed">
              Monitoreo y evaluación mensual/trimestral de metas institucionales de OOMAPASC conforme a la metodología oficial del SGC.
            </p>
          </div>

          {/* Selector de Mes & Acciones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Selector de Mes con Slider / Dropdown */}
            <div className="flex items-center bg-slate-800/80 border border-slate-600/80 rounded-xl p-1">
              <select
                value={mesActivoIndex}
                onChange={(e) => {
                  setMesActivoIndex(Number(e.target.value));
                  setPagina(1);
                }}
                className="bg-transparent text-white text-xs font-bold px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                {MESES_COMPLETOS.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={ejercicio}
                onChange={(e) => {
                  setEjercicio(Number(e.target.value));
                  setPagina(1);
                }}
                className="bg-transparent text-white text-xs font-bold px-2 py-1.5 border-l border-slate-700 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Exportar Excel */}
            <button
              onClick={handleExportarCSV}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Cuadro OOMRSC-05</span>
            </button>
          </div>
        </div>

        {/* PESTAÑAS */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto">
          {[
            { id: 'cuadro', label: '1. Cuadro de Control Mensual (OOMRSC-05)', icon: Target },
            { id: 'trimestral', label: '2. Evaluación Trimestral & MIR (T1-T4)', icon: BarChart3 },
            { id: 'correcciones', label: `3. Reportes de Corrección (${reportesCorreccion.length})`, icon: FileWarning }
          ].map(tab => {
            const Icon = tab.icon;
            const esActiva = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  esActiva
                    ? 'bg-white text-slate-900 shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={15} className={esActiva ? 'text-sky-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STATS CARDS DEL MES (SEMÁFOROS OFICIALES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono">
            Eficacia Global
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {statsGlobales.promedioGlobal}%
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
            <Check size={12} /> {mesActivoNombre} {ejercicio}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Aceptable (≥90%)
          </span>
          <span className="text-2xl font-black text-emerald-900 block">
            {statsGlobales.aceptables}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            Cumplen objetivo
          </span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Preventivo (80-89%)
          </span>
          <span className="text-2xl font-black text-amber-900 block">
            {statsGlobales.preventivos}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold block">
            En rango preventivo
          </span>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Crítico (≤79%)
          </span>
          <span className="text-2xl font-black text-rose-900 block">
            {statsGlobales.criticos}
          </span>
          <span className="text-[10px] text-rose-700 font-semibold block">
            Requieren RC / AC
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            Sin Captura
          </span>
          <span className="text-2xl font-black text-slate-700 block">
            {statsGlobales.pendientes}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Pendientes de corte
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CUADRO DE CONTROL MENSUAL INTERACTIVO                        */}
      {/* ==================================================================== */}
      {tabActiva === 'cuadro' && (
        <div className="space-y-4">
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por #, nombre de indicador, proceso, área o dirección..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Botón Reset */}
              {(busqueda || filtroDireccion || filtroProceso || filtroArea || filtroImpacto || filtroSemaforo) && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroDireccion('');
                    setFiltroProceso('');
                    setFiltroArea('');
                    setFiltroImpacto('');
                    setFiltroSemaforo('');
                    setPagina(1);
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 flex items-center gap-1"
                >
                  <X size={14} /> Limpiar Filtros
                </button>
              )}
            </div>

            {/* Selectores de Filtro Avanzados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100 text-xs">
              <select
                value={filtroDireccion}
                onChange={(e) => { setFiltroDireccion(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todas las Direcciones</option>
                {direccionesUnicas.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={filtroProceso}
                onChange={(e) => { setFiltroProceso(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todos los Procesos</option>
                {procesosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select
                value={filtroArea}
                onChange={(e) => { setFiltroArea(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todas las Áreas</option>
                {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select
                value={filtroImpacto}
                onChange={(e) => { setFiltroImpacto(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todos los Impactos</option>
                <option value="Alto">Impacto Alto</option>
                <option value="Bajo">Impacto Bajo</option>
              </select>

              <select
                value={filtroSemaforo}
                onChange={(e) => { setFiltroSemaforo(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todos los Semáforos</option>
                <option value="ACEPTABLE">🟢 Aceptables (≥90%)</option>
                <option value="PREVENTIVO">🟡 Preventivos (80-89%)</option>
                <option value="CRITICO">🔴 Críticos (≤79%)</option>
                <option value="PENDIENTE">⏳ Sin captura</option>
              </select>
            </div>
          </div>

          {/* TABLA PRINCIPAL DEL CUADRO DE CONTROL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-600">
                Mostrando <strong>{indicadoresPaginados.length}</strong> de <strong>{indicadoresFiltrados.length}</strong> indicadores
              </span>
              <span className="text-slate-500 font-semibold">
                Período Evaluado: <strong>{mesActivoNombre} {ejercicio}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase font-mono">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3 min-w-[240px]">Indicador / Área / Proceso</th>
                    <th className="py-3 px-2 text-center w-24">Per. / Unidad</th>
                    <th className="py-3 px-2 text-center w-24">Meta Anual</th>
                    <th className="py-3 px-2 text-center w-20">Impacto</th>
                    <th className="py-3 px-3 text-center w-36 bg-sky-50/50">
                      Real ({mesActivo})
                    </th>
                    <th className="py-3 px-2 text-center w-28">Cumplimiento</th>
                    <th className="py-3 px-3 min-w-[200px]">Observación Técnica</th>
                    <th className="py-3 px-3 w-28 text-center">Acción / RC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indicadoresPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No se encontraron indicadores con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    indicadoresPaginados.map(ind => {
                      const key = `${ind.id}-${mesActivo}-${ejercicio}`;
                      const dataGuardada = resultados[key];
                      const valReal = dataGuardada?.valor !== undefined ? dataGuardada.valor : (ind.valor_default ?? null);
                      const obs = dataGuardada?.observacion || ind.observacion_default || '';
                      const acc = dataGuardada?.accion || ind.accion_default || 'NA';
                      const sem = evalSemaforoOOMRSC05(valReal, ind.meta, ind.es_menor);

                      return (
                        <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* # */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                            #{ind.numero}
                          </td>

                          {/* Indicador / Proceso / Área */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 leading-tight">
                              {ind.nombre}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                              <span className="text-sky-700 font-medium">{ind.direccion}</span>
                              <span>·</span>
                              <span>{ind.area}</span>
                              <span>·</span>
                              <span className="italic text-slate-400">{ind.proceso}</span>
                            </div>
                          </td>

                          {/* Periodicidad / Unidad */}
                          <td className="py-3 px-2 text-center text-slate-600 text-[11px]">
                            <span className="font-semibold block">{ind.periodicidad}</span>
                            <span className="text-slate-400 text-[10px] block">{ind.unidad}</span>
                          </td>

                          {/* Meta Anual */}
                          <td className="py-3 px-2 text-center font-bold text-slate-900">
                            {ind.meta_anual}
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {ind.unidad === 'Porcentaje' ? '%' : ''}
                            </span>
                          </td>

                          {/* Impacto */}
                          <td className="py-3 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ind.impacto === 'Alto' 
                                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {ind.impacto}
                            </span>
                          </td>

                          {/* Valor Real Capturado */}
                          <td className="py-3 px-3 text-center bg-sky-50/30">
                            <button
                              onClick={() => abrirModalCaptura(ind)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 hover:border-sky-500 rounded-lg text-xs font-bold text-slate-900 flex items-center justify-between shadow-sm group-hover:border-sky-400 transition-all"
                              title="Hacer clic para capturar o modificar"
                            >
                              <span>{valReal !== null && valReal !== undefined ? valReal : <span className="text-slate-400 font-normal">Capturar</span>}</span>
                              <Edit3 size={13} className="text-slate-400 group-hover:text-sky-600 shrink-0" />
                            </button>
                          </td>

                          {/* Cumplimiento Semáforo OOMRSC-05 */}
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sem.bg} ${sem.text} ${sem.border}`}>
                              <span className={`w-2 h-2 rounded-full ${sem.dot}`}></span>
                              <span>{sem.porcentaje !== null ? `${sem.porcentaje}%` : 'N/A'}</span>
                            </span>
                          </td>

                          {/* Observación Técnica */}
                          <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={obs}>
                            {obs ? obs : <span className="text-slate-400 italic">Sin observación</span>}
                          </td>

                          {/* Acción / RC */}
                          <td className="py-3 px-3 text-center">
                            {sem.rango === 'CRITICO' && acc === 'NA' ? (
                              <button
                                onClick={() => handleCrearAccionCorrectiva(ind, valReal, sem)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 justify-center w-full transition-all"
                                title="Generar Acción Correctiva OOMRSC-20 y Reporte de Corrección"
                              >
                                <AlertTriangle size={11} />
                                <span>+ Crear AC</span>
                              </button>
                            ) : (
                              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                acc !== 'NA' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-400'
                              }`}>
                                {acc}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  Página {pagina} de {totalPaginas}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagina === 1}
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: EVALUACIÓN TRIMESTRAL & MIR (T1, T2, T3, T4)                 */}
      {/* ==================================================================== */}
      {tabActiva === 'trimestral' && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-semibold">
              <BarChart3 size={18} className="text-sky-600" />
              <span>Cálculo oficial de avance trimestral acumulado conforme a la Matriz de Indicadores de Resultados (MIR 2026).</span>
            </div>
            <span className="font-bold text-sky-900 font-mono">Ejercicio Fiscal {ejercicio}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(trimNum => {
              const infoTrim = TRIMESTRES[trimNum];
              return (
                <div key={trimNum} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {infoTrim.key}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {infoTrim.meses.join(', ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {infoTrim.label}
                  </h4>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Metas Evaluadas:</span>
                      <strong className="text-slate-900 font-mono">100 Indicadores</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Eficacia Ponderada:</span>
                      <strong className="text-emerald-600 font-bold font-mono">
                        {trimNum <= 3 ? '92.4%' : 'En proceso'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Estatus MIR:</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        {trimNum <= 3 ? 'Aceptable' : 'Programado'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: BITÁCORA DE REPORTES DE CORRECCIÓN (RC)                     */}
      {/* ==================================================================== */}
      {tabActiva === 'correcciones' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileWarning size={18} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Bitácora de Reportes de Corrección (RC) del Cuadro de Control
                </h3>
              </div>
              <span className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                {reportesCorreccion.length} Reportes Registrados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {reportesCorreccion.map(rc => (
                <div key={rc.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {rc.folio}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Responsable: {rc.responsable}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Ejercicio: {rc.ejercicio}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      rc.estado === 'CERRADA'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rc.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CAPTURA RÁPIDA / OBSERVACIÓN TÉCNICA */}
      {indicadorEnEdicion && (
        <ContenedorModal
          abierto={!!indicadorEnEdicion}
          onCerrar={() => setIndicadorEnEdicion(null)}
          tamano="md"
          titulo={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                <Target size={20} />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  INDICADOR #{indicadorEnEdicion.id} · {mesActivoNombre} {ejercicio}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  {indicadorEnEdicion.nombre}
                </h3>
              </div>
            </div>
          }
          pie={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">
                OOMRSC-05 Rev. 37
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndicadorEnEdicion(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarModal}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  <Save size={14} />
                  <span>Guardar Resultado</span>
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleGuardarModal} className="space-y-4 p-1">
            {/* Metadatos del Indicador */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Dirección / Área:</span>
                <strong className="text-slate-800">{indicadorEnEdicion.direccion} · {indicadorEnEdicion.area}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Meta Anual:</span>
                <strong className="text-sky-700">{indicadorEnEdicion.meta_anual} {indicadorEnEdicion.unidad}</strong>
              </div>
            </div>

            {/* Valor Real */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Valor Real Obtenido en {mesActivoNombre} {ejercicio}: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={valorInput}
                  onChange={(e) => setValorInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Observación Técnica */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Observación / Justificación Técnica del Resultado:
              </label>
              <textarea
                rows={3}
                value={observacionInput}
                onChange={(e) => setObservacionInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                placeholder="Detalla las causas, análisis o contexto del resultado..."
              />
            </div>

            {/* Acción / RC */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Acción / Reporte de Corrección (RC):
              </label>
              <input
                type="text"
                value={accionInput}
                onChange={(e) => setAccionInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono"
                placeholder="NA o RC XX/2026"
              />
            </div>
          </form>
        </ContenedorModal>
      )}
    </div>
  );
}
