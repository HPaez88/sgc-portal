import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  Eye, 
  Lock, 
  Building2, 
  ArrowLeft, 
  Monitor, 
  Calendar,
  Layers,
  FileCheck,
  Award,
  AlertOctagon,
  LogOut,
  Info
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { INDICADORES, evalSemaforoOOMRSC05 } from '../../constants/indicadores';
import { getVencimiento, getEstadoColor, getEstadoLabel } from '../../constants';
import { AREAS } from '../../constants/areas';
import AgenteISOView from '../iso/AgenteISOView';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MobilePortalView({ onCambiarAModoEscritorio }) {
  const {
    usuarioLogueado,
    puedeTodasAreas,
    areaUsuario,
    accionesCorrectivas = [],
    planesMejora = [],
    indicadoresData = {},
    documentos = [],
    cerrarSesion
  } = useSGC();

  // Pestaña activa en móvil: 'pendientes' | 'indicadores' | 'documentos' | 'ac_pm' | 'asesor'
  const [tabActiva, setTabActiva] = useState('pendientes');

  // Filtro de área activa para consulta
  const [areaConsulta, setAreaConsulta] = useState(areaUsuario || 'Sistema de Gestión de Calidad');

  // Mes seleccionado para indicadores (Octubre por defecto)
  const [mesIndex, setMesIndex] = useState(() => Math.min(new Date().getMonth(), 9));
  const mesActivo = MESES[mesIndex];
  const mesActivoCompleto = MESES_COMPLETOS[mesIndex];
  const anioActivo = 2026;

  // Modales de lectura / consulta
  const [modalAC, setModalAC] = useState(null);
  const [modalPM, setModalPM] = useState(null);
  const [modalIndicador, setModalIndicador] = useState(null);
  const [modalDocumento, setModalDocumento] = useState(null);

  // Estados de búsqueda por pestaña
  const [busquedaIndicador, setBusquedaIndicador] = useState('');
  const [busquedaDoc, setBusquedaDoc] = useState('');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState('TODOS');
  const [subTabACPM, setSubTabACPM] = useState('AC'); // 'AC' | 'PM'
  const [busquedaACPM, setBusquedaACPM] = useState('');

  // ═════════════════════════════════════════════════════════════════════════
  // CÁLCULOS Y DATOS FILTRADOS POR ÁREA
  // ═════════════════════════════════════════════════════════════════════════

  // Acciones correctivas del área activa
  const misAcciones = useMemo(() => {
    return accionesCorrectivas.filter(ac => {
      if (puedeTodasAreas && !areaConsulta) return true;
      return (ac.area || '').toLowerCase().includes((areaConsulta || '').toLowerCase());
    });
  }, [accionesCorrectivas, areaConsulta, puedeTodasAreas]);

  // Planes de mejora del área activa
  const misPlanes = useMemo(() => {
    return planesMejora.filter(pm => {
      if (puedeTodasAreas && !areaConsulta) return true;
      const areaPM = pm.area || pm.gerencia_coordinacion || '';
      return areaPM.toLowerCase().includes((areaConsulta || '').toLowerCase());
    });
  }, [planesMejora, areaConsulta, puedeTodasAreas]);

  // Documentos del área activa
  const misDocumentos = useMemo(() => {
    return documentos.filter(doc => {
      if (puedeTodasAreas && !areaConsulta) return true;
      return (doc.area || '').toLowerCase().includes((areaConsulta || '').toLowerCase());
    });
  }, [documentos, areaConsulta, puedeTodasAreas]);

  // Indicadores del área activa
  const catalogoCustom = indicadoresData?.catalogoPersonalizado || {};
  const resultados = indicadoresData?.resultados || {};

  const misIndicadores = useMemo(() => {
    return INDICADORES.map(ind => {
      const custom = catalogoCustom[ind.id];
      return custom ? { ...ind, ...custom } : ind;
    }).filter(ind => {
      if (puedeTodasAreas && !areaConsulta) return true;
      return (ind.area || '').toLowerCase().includes((areaConsulta || '').toLowerCase());
    });
  }, [catalogoCustom, areaConsulta, puedeTodasAreas]);

  // Métricas del semáforo para el área
  const metricasArea = useMemo(() => {
    let cumplidos = 0;
    let totalConDato = 0;
    let sumaPorcentaje = 0;

    misIndicadores.forEach(ind => {
      const key = `${ind.id}-${mesActivo}-${anioActivo}`;
      const val = resultados[key]?.valor;
      if (val !== undefined && val !== null) {
        const sem = evalSemaforoOOMRSC05(val, ind.meta_anual || ind.meta, ind.es_menor);
        totalConDato++;
        sumaPorcentaje += (sem.porcentaje || 0);
        if (sem.cumple === 'SI') cumplidos++;
      }
    });

    const promedio = totalConDato > 0 ? Math.round(sumaPorcentaje / totalConDato) : null;
    return {
      totalIndicadores: misIndicadores.length,
      evaluados: totalConDato,
      cumplidos,
      promedio
    };
  }, [misIndicadores, mesActivo, anioActivo, resultados]);

  // Pendientes urgentes (ACs por vencer o vencidas, PMs activos)
  const acsUrgentes = useMemo(() => {
    return misAcciones.filter(ac => {
      if (['CERRADA', 'CERRADO_EFECTIVO', 'CERRADO_NO_EFECTIVO'].includes(ac.estado)) return false;
      const v = getVencimiento(ac);
      return v.nivel === 'vencido' || v.nivel === 'por_vencer';
    });
  }, [misAcciones]);

  const pmsActivos = useMemo(() => {
    return misPlanes.filter(pm => !['CERRADO', 'CANCELADO', 'CERRADO_EFECTIVO'].includes(pm.estado));
  }, [misPlanes]);

  const totalAlertas = acsUrgentes.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans pb-20 select-none">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER MÓVIL EJECUTIVO (Fijo, ultra-compacto)
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-[#0B192C] text-white px-3.5 py-2.5 shadow-md flex items-center justify-between gap-2 border-b border-sky-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0 font-black text-xs">
            SGC
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white truncate">
                OOMAPASC
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 flex items-center gap-0.5">
                <Lock size={9} /> Consulta
              </span>
            </div>
            <p className="text-[10px] text-sky-300 truncate font-medium">
              {usuarioLogueado?.nombre || 'Usuario SGC'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Selector de área rápida si tiene permisos */}
          {puedeTodasAreas ? (
            <select
              value={areaConsulta}
              onChange={(e) => setAreaConsulta(e.target.value)}
              className="bg-sky-950 border border-sky-700 text-sky-200 text-[10px] font-bold rounded-lg px-2 py-1 outline-none max-w-[125px] truncate"
              title="Cambiar área de consulta"
              aria-label="Filtrar por Área"
            >
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          ) : (
            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 truncate max-w-[120px]">
              {areaConsulta}
            </span>
          )}

          {/* Botón para cambiar a vista escritorio si se desea */}
          <button
            onClick={onCambiarAModoEscritorio}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            title="Ver versión completa de escritorio"
          >
            <Monitor size={15} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENIDO DINÁMICO SEGÚN PESTAÑA ACTIVA
          ═══════════════════════════════════════════════════════════════════ */}
      <main className={`flex-1 max-w-lg mx-auto w-full ${tabActiva === 'asesor' ? 'p-1 sm:p-2' : 'p-3 space-y-3.5'}`}>
        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA 1: ¿QUÉ TENGO PENDIENTE? (RESUMEN EJECUTIVO)
            ───────────────────────────────────────────────────────────── */}
        {tabActiva === 'pendientes' && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Tarjeta Hero: Semáforo del Área */}
            <div className="bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white p-4 rounded-2xl shadow-sm border border-sky-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold block">
                    {mesActivoCompleto} {anioActivo} · Semáforo Institucional
                  </span>
                  <h1 className="text-sm font-black text-white mt-0.5">
                    {areaConsulta}
                  </h1>
                </div>
                {metricasArea.promedio !== null ? (
                  <div className={`px-2.5 py-1 rounded-xl text-center border font-black ${
                    metricasArea.promedio >= 90
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : metricasArea.promedio >= 80
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}>
                    <span className="text-base leading-none block">{metricasArea.promedio}%</span>
                    <span className="text-[9px] uppercase tracking-tight block">
                      {metricasArea.promedio >= 90 ? 'Aceptable' : metricasArea.promedio >= 80 ? 'Preventivo' : 'Crítico'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">Sin capturas</span>
                )}
              </div>

              {/* Estadísticas rápidas en 3 columnas */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-xs font-black text-white block">{misIndicadores.length}</span>
                  <span className="text-[9px] text-slate-300 block">Indicadores</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className={`text-xs font-black block ${acsUrgentes.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {acsUrgentes.length}
                  </span>
                  <span className="text-[9px] text-slate-300 block">AC Urgentes</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-xs font-black text-sky-300 block">{pmsActivos.length}</span>
                  <span className="text-[9px] text-slate-300 block">PM Activos</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN: Acciones Correctivas que requieren atención */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-500" />
                  Acciones Correctivas Pendientes ({acsUrgentes.length})
                </h2>
                <button
                  onClick={() => { setTabActiva('ac_pm'); setSubTabACPM('AC'); }}
                  className="text-[11px] font-bold text-sky-700 flex items-center gap-0.5"
                >
                  Ver todas →
                </button>
              </div>

              {acsUrgentes.length === 0 ? (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                  <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700">Sin acciones vencidas ni por vencer</p>
                  <p className="text-[11px] text-slate-400">Tu área se encuentra al corriente en el seguimiento del SGC.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acsUrgentes.map(ac => {
                    const venc = getVencimiento(ac);
                    return (
                      <div
                        key={ac.id}
                        onClick={() => setModalAC(ac)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {ac.folio_codigo || 'Borrador'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>
                            {venc.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{ac.area}</p>
                        {ac.descripcion_problema && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {ac.descripcion_problema}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                          <span>Estado: <strong className="text-slate-700">{getEstadoLabel(ac.estado)}</strong></span>
                          <span className="text-sky-700 font-bold flex items-center gap-0.5">
                            Consultar <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN: Procedimientos & Documentos vigentes del área */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <FileText size={13} className="text-sky-600" />
                  Procedimientos Clave del Área ({misDocumentos.length})
                </h2>
                <button
                  onClick={() => setTabActiva('documentos')}
                  className="text-[11px] font-bold text-sky-700 flex items-center gap-0.5"
                >
                  Biblioteca →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {misDocumentos.slice(0, 3).map(doc => (
                  <div
                    key={doc.id || doc.clave}
                    onClick={() => setModalDocumento(doc)}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-black bg-[#0B192C] text-white px-1.5 py-0.5 rounded">
                          {doc.clave}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {doc.version || 'Rev. 01'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mt-1">
                        {doc.titulo}
                      </p>
                    </div>
                    <Eye size={14} className="text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA 2: INDICADORES (SOLO LECTURA)
            ───────────────────────────────────────────────────────────── */}
        {tabActiva === 'indicadores' && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Header de la pestaña: Selector de Mes & Buscador */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    Cuadro de Desempeño
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Formato OOMRSC-05 · {misIndicadores.length} Indicadores
                  </span>
                </div>
                {/* Selector de Mes */}
                <select
                  value={mesIndex}
                  onChange={(e) => setMesIndex(Number(e.target.value))}
                  className="bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                  title="Mes evaluado"
                >
                  {MESES_COMPLETOS.map((m, idx) => (
                    <option key={m} value={idx}>{m} {anioActivo}</option>
                  ))}
                </select>
              </div>

              {/* Buscador de indicador */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={busquedaIndicador}
                  onChange={(e) => setBusquedaIndicador(e.target.value)}
                  placeholder="Buscar por # o nombre de indicador..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Lista de Tarjetas de Indicadores */}
            <div className="space-y-2">
              {misIndicadores
                .filter(ind => {
                  if (!busquedaIndicador.trim()) return true;
                  const q = busquedaIndicador.toLowerCase();
                  return (
                    String(ind.numero ?? ind.id).includes(q) ||
                    (ind.nombre || '').toLowerCase().includes(q) ||
                    (ind.proceso || '').toLowerCase().includes(q)
                  );
                })
                .map(ind => {
                  const key = `${ind.id}-${mesActivo}-${anioActivo}`;
                  const dataGuardada = resultados[key];
                  const valReal = dataGuardada?.valor;
                  const sem = evalSemaforoOOMRSC05(valReal, ind.meta_anual || ind.meta, ind.es_menor);

                  return (
                    <div
                      key={ind.id}
                      onClick={() => setModalIndicador({ ...ind, valReal, sem, mes: mesActivoCompleto })}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-xs font-black text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                            #{ind.numero ?? ind.id}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 truncate">
                            {ind.proceso || 'Proceso SGC'}
                          </span>
                        </div>
                        {/* Pill de Semáforo */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1 ${sem.bg} ${sem.text} ${sem.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sem.dot}`}></span>
                          {sem.porcentaje !== null ? `${sem.porcentaje}%` : 'Sin dato'}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {ind.nombre}
                      </h3>

                      {/* Metas y Resultados en 2 columnas limpias */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-medium">Meta Anual</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {ind.meta_anual || ind.meta || 85} {ind.unidad || '%'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-medium">Valor Real ({mesActivo})</span>
                          <span className="font-mono font-black text-slate-900 text-xs">
                            {valReal !== null && valReal !== undefined ? `${valReal} ${ind.unidad || '%'}` : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>Periodicidad: <strong className="text-slate-600">{ind.periodicidad || 'Trimestral'}</strong></span>
                        <span className="text-sky-700 font-bold flex items-center gap-0.5">
                          Ver ficha técnica <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA 3: PROCEDIMIENTOS Y DOCUMENTOS (BIBLIOTECA SGC)
            ───────────────────────────────────────────────────────────── */}
        {tabActiva === 'documentos' && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Buscador & Filtros por Tipo */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={busquedaDoc}
                  onChange={(e) => setBusquedaDoc(e.target.value)}
                  placeholder="Buscar procedimiento, formato o política..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none"
                />
              </div>

              {/* Chips de filtro rápido */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {['TODOS', 'Procedimiento', 'Registro', 'Manual', 'Política'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipoDoc(tipo)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                      filtroTipoDoc === tipo
                        ? 'bg-[#0B192C] text-white border-[#0B192C]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tipo === 'Registro' ? 'Formatos' : tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Documentos Oficiales */}
            <div className="space-y-2">
              {documentos
                .filter(doc => {
                  if (filtroTipoDoc !== 'TODOS' && doc.tipo !== filtroTipoDoc) return false;
                  if (!busquedaDoc.trim()) return true;
                  const q = busquedaDoc.toLowerCase();
                  return (
                    (doc.clave || '').toLowerCase().includes(q) ||
                    (doc.titulo || '').toLowerCase().includes(q) ||
                    (doc.area || '').toLowerCase().includes(q)
                  );
                })
                .map(doc => (
                  <div
                    key={doc.id || doc.clave}
                    onClick={() => setModalDocumento(doc)}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black bg-[#0B192C] text-white px-2 py-0.5 rounded">
                          {doc.clave}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {doc.tipo}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {doc.version || 'Rev. 01'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug">
                      {doc.titulo}
                    </h3>

                    <p className="text-[11px] text-slate-500 truncate">
                      Área: <strong className="text-slate-700">{doc.area}</strong>
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Emisión: {doc.fecha || '2026-01-15'}</span>
                      <span className="text-sky-700 font-bold flex items-center gap-0.5">
                        Leer documento <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA 4: ACCIONES CORRECTIVAS Y PLANES DE MEJORA
            ───────────────────────────────────────────────────────────── */}
        {tabActiva === 'ac_pm' && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Toggle AC vs PM */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSubTabACPM('AC')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    subTabACPM === 'AC'
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Acciones Correctivas ({misAcciones.length})
                </button>
                <button
                  onClick={() => setSubTabACPM('PM')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    subTabACPM === 'PM'
                      ? 'bg-[#0B192C] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Planes de Mejora ({misPlanes.length})
                </button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={busquedaACPM}
                  onChange={(e) => setBusquedaACPM(e.target.value)}
                  placeholder={`Buscar en ${subTabACPM === 'AC' ? 'acciones...' : 'planes...'}`}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Lista según sub-pestaña */}
            {subTabACPM === 'AC' ? (
              <div className="space-y-2">
                {misAcciones
                  .filter(ac => {
                    if (!busquedaACPM.trim()) return true;
                    const q = busquedaACPM.toLowerCase();
                    return (
                      (ac.folio_codigo || '').toLowerCase().includes(q) ||
                      (ac.area || '').toLowerCase().includes(q) ||
                      (ac.proceso || '').toLowerCase().includes(q) ||
                      (ac.descripcion_problema || '').toLowerCase().includes(q)
                    );
                  })
                  .map(ac => {
                    const venc = getVencimiento(ac);
                    return (
                      <div
                        key={ac.id}
                        onClick={() => setModalAC(ac)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-black text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {ac.folio_codigo || 'Borrador'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(ac.estado)}`}>
                              {getEstadoLabel(ac.estado)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>
                              {venc.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{ac.area}</p>
                        {ac.proceso && <p className="text-[11px] text-slate-500">Proceso: {ac.proceso}</p>}

                        {ac.descripcion_problema && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {ac.descripcion_problema}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>Origen: <strong className="text-slate-600">{ac.origen || '-'}</strong></span>
                          <span className="text-sky-700 font-bold flex items-center gap-0.5">
                            Ver detalle <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {misAcciones.length === 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Sin acciones correctivas</p>
                    <p className="text-[11px] text-slate-500">No hay acciones correctivas registradas para el área seleccionada.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {misPlanes
                  .filter(pm => {
                    if (!busquedaACPM.trim()) return true;
                    const q = busquedaACPM.toLowerCase();
                    return (
                      (pm.folio || pm.folio_codigo || '').toLowerCase().includes(q) ||
                      (pm.titulo_mejora || '').toLowerCase().includes(q) ||
                      (pm.area || '').toLowerCase().includes(q)
                    );
                  })
                  .map(pm => {
                    const venc = getVencimiento(pm);
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setModalPM(pm)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {pm.folio || pm.folio_codigo || 'Borrador'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(pm.estado)}`}>
                              {getEstadoLabel(pm.estado)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>
                              {venc.label}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {pm.titulo_mejora || 'Sin título definido'}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">{pm.area || pm.gerencia_coordinacion || '-'}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>Categoría: <strong className="text-slate-600">{pm.categoria_mejora || 'General'}</strong></span>
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            Ver detalle <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {misPlanes.length === 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Sin planes de mejora</p>
                    <p className="text-[11px] text-slate-500">No hay planes de mejora activos registrados para el área seleccionada.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA 5: ASESOR NORMATIVO ISO (IA)
            ───────────────────────────────────────────────────────────── */}
        {tabActiva === 'asesor' && (
          <div className="animate-fade-in-up">
            <AgenteISOView setActiveTab={setTabActiva} />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE LECTURA LIMPIA: FICHA TÉCNICA DEL INDICADOR
          ═══════════════════════════════════════════════════════════════════ */}
      {modalIndicador && (
        <div className="fixed inset-0 z-50 bg-[#001f42]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-[#0B192C] text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  #{modalIndicador.numero ?? modalIndicador.id}
                </span>
                <span className="text-xs font-bold text-white">Ficha Técnica Oficial</span>
              </div>
              <button
                onClick={() => setModalIndicador(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {modalIndicador.nombre}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Proceso: <strong>{modalIndicador.proceso || 'Calidad'}</strong> · Área: <strong>{modalIndicador.area}</strong>
                </p>
              </div>

              {/* Semáforo del mes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Mes en consulta:</span>
                  <span className="font-bold text-slate-800 text-xs">{modalIndicador.mes}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-center border font-bold ${modalIndicador.sem.bg} ${modalIndicador.sem.text} ${modalIndicador.sem.border}`}>
                  <span className="text-xs block">{modalIndicador.sem.porcentaje !== null ? `${modalIndicador.sem.porcentaje}%` : 'Sin dato'}</span>
                  <span className="text-[9px] uppercase block">{modalIndicador.sem.label || 'Cumplimiento'}</span>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Meta Anual</span>
                  <span className="font-mono font-bold text-slate-800">{modalIndicador.meta_anual || modalIndicador.meta} {modalIndicador.unidad || '%'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Periodicidad</span>
                  <span className="font-bold text-slate-800">{modalIndicador.periodicidad || 'Trimestral'}</span>
                </div>
              </div>

              {modalIndicador.formula && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium mb-1">Método de Cálculo / Fórmula</span>
                  <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {modalIndicador.formula}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setModalIndicador(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE LECTURA LIMPIA: DOCUMENTO / PROCEDIMIENTO SGC
          ═══════════════════════════════════════════════════════════════════ */}
      {modalDocumento && (
        <div className="fixed inset-0 z-50 bg-[#001f42]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-[#0B192C] text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  {modalDocumento.clave}
                </span>
                <span className="text-xs font-bold text-white">Ficha Documental Oficial</span>
              </div>
              <button
                onClick={() => setModalDocumento(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {modalDocumento.tipo} · {modalDocumento.version || 'Rev. 01'}
                </span>
                <h3 className="text-sm font-black text-slate-900 leading-snug mt-0.5">
                  {modalDocumento.titulo}
                </h3>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Área Responsable:</span>
                  <span className="font-bold text-slate-800 text-right">{modalDocumento.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Responsable / Autor:</span>
                  <span className="font-bold text-slate-800 text-right">{modalDocumento.autor || 'Lic. Héctor Páez'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Última Revisión:</span>
                  <span className="font-mono text-slate-700">{modalDocumento.fecha || '2026-01-15'}</span>
                </div>
              </div>

              {modalDocumento.descripcion && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    Objetivo & Alcance
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {modalDocumento.descripcion}
                  </p>
                </div>
              )}

              {modalDocumento.referencias_usadas && modalDocumento.referencias_usadas.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    Formatos y Documentos Asociados
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {modalDocumento.referencias_usadas.map(ref => (
                      <span key={ref} className="font-mono text-[10px] font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setModalDocumento(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE LECTURA LIMPIA: ACCIÓN CORRECTIVA (OOMRSC-20)
          ═══════════════════════════════════════════════════════════════════ */}
      {modalAC && (
        <div className="fixed inset-0 z-50 bg-[#001f42]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-[#0B192C] text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  {modalAC.folio_codigo || 'AC'}
                </span>
                <span className="text-xs font-bold text-white">Consulta de Acción Correctiva</span>
              </div>
              <button onClick={() => setModalAC(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">{modalAC.area}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(modalAC.estado)}`}>
                  {getEstadoLabel(modalAC.estado)}
                </span>
              </div>

              {modalAC.descripcion_problema && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    No Conformidad / Hallazgo
                  </span>
                  <p className="text-slate-800 leading-relaxed">
                    {modalAC.descripcion_problema}
                  </p>
                </div>
              )}

              {modalAC.causa_raiz && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    Causa Raíz Determinada
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {modalAC.causa_raiz}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origen:</span>
                  <span className="font-bold text-slate-800">{modalAC.origen || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proceso:</span>
                  <span className="font-bold text-slate-800">{modalAC.proceso || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha Compromiso:</span>
                  <span className="font-mono font-bold text-slate-800">{modalAC.fecha_compromiso || 'En definición'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setModalAC(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE LECTURA LIMPIA: PLAN DE MEJORA (OOMRSC-21)
          ═══════════════════════════════════════════════════════════════════ */}
      {modalPM && (
        <div className="fixed inset-0 z-50 bg-[#001f42]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-[#0B192C] text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  {modalPM.folio || modalPM.folio_codigo || 'PM'}
                </span>
                <span className="text-xs font-bold text-white">Consulta de Plan de Mejora</span>
              </div>
              <button onClick={() => setModalPM(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {modalPM.titulo_mejora}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Área: <strong>{modalPM.area || modalPM.gerencia_coordinacion}</strong>
                </p>
              </div>

              {modalPM.justificacion && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    Justificación / Beneficio esperado
                  </span>
                  <p className="text-slate-800 leading-relaxed">
                    {modalPM.justificacion}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Categoría:</span>
                  <span className="font-bold text-slate-800">{modalPM.categoria_mejora || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(modalPM.estado)}`}>
                    {getEstadoLabel(modalPM.estado)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Presupuesto Estimado:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ${Number(modalPM.presupuestoEstimado || modalPM.presupuesto || 0).toLocaleString('es-MX')} MXN
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setModalPM(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BARRA DE NAVEGACIÓN INFERIOR (Fixed, ergonómica)
          ═══════════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Navegación Móvil Ejecutiva"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-up px-2 py-1.5 flex items-center justify-around select-none"
      >
        {[
          { id: 'pendientes', label: 'Pendientes', icon: LayoutDashboard, badge: totalAlertas },
          { id: 'indicadores', label: 'Indicadores', icon: Target },
          { id: 'documentos', label: 'Biblioteca', icon: FileText },
          { id: 'ac_pm', label: 'AC & PM', icon: Award },
          { id: 'asesor', label: 'Asesor IA', icon: Sparkles, destacado: true },
        ].map(item => {
          const isActive = tabActiva === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                setTabActiva(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative min-w-[58px] cursor-pointer touch-manipulation active:scale-95 ${
                isActive ? 'text-sky-800 font-black' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${
                isActive ? 'bg-sky-50 text-sky-700 scale-110' : item.destacado ? 'text-purple-600' : ''
              }`}>
                <Icon size={19} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 line-clamp-1">
                {item.label}
              </span>

              {item.badge > 0 && (
                <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
