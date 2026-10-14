import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Building2,
  Download,
  Edit3,
  Save,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  PieChart,
  Calendar,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  CAPITULOS_CONAC,
  PRESUPUESTOS_AREAS_INICIALES,
  calcularConsolidadoCapitulos,
  exportarControlPresupuestalCSV
} from '../../constants/presupuestoAreas';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';

const STORAGE_KEY = 'sgc-control-presupuestal-areas';

export default function ControlPresupuestalAreasTab({ esAdminOSGC = false, ejercicio = 2026 }) {
  const toast = useToast();
  const { registrarMovimiento } = useSGC();

  const [presupuestos, setPresupuestos] = useState(() => {
    try {
      const g = localStorage.getItem(STORAGE_KEY);
      if (g) {
        const parsed = JSON.parse(g);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error cargando presupuestos de áreas', e);
    }
    return PRESUPUESTOS_AREAS_INICIALES;
  });

  const [areaSeleccionadaId, setAreaSeleccionadaId] = useState(1);
  const [filtroDireccion, setFiltroDireccion] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [editandoArea, setEditandoArea] = useState(false);
  const [formDataCapitulos, setFormDataCapitulos] = useState(null);

  // Áreas filtradas para la lista lateral
  const areasFiltradas = useMemo(() => {
    return presupuestos.filter(p => {
      const coincideDir = filtroDireccion === 'TODAS' || p.direccion === filtroDireccion;
      const coincideBusqueda = !busqueda || 
        p.areaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.encargado.toLowerCase().includes(busqueda.toLowerCase());
      return coincideDir && coincideBusqueda;
    });
  }, [presupuestos, filtroDireccion, busqueda]);

  // Área activa seleccionada
  const areaActiva = useMemo(() => {
    return presupuestos.find(p => p.areaId === areaSeleccionadaId) || presupuestos[0];
  }, [presupuestos, areaSeleccionadaId]);

  // Consolidado global de todo OOMAPASC
  const consolidadoGlobal = useMemo(() => {
    return calcularConsolidadoCapitulos(presupuestos);
  }, [presupuestos]);

  const persistirPresupuestos = (nuevos) => {
    setPresupuestos(nuevos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
    } catch (e) {
      console.error('Error guardando presupuestos', e);
    }
  };

  // Iniciar edición de capítulos para el área activa
  const handleIniciarEdicion = () => {
    if (!areaActiva) return;
    setFormDataCapitulos(JSON.parse(JSON.stringify(areaActiva.capitulos)));
    setEditandoArea(true);
  };

  const handleCancelarEdicion = () => {
    setEditandoArea(false);
    setFormDataCapitulos(null);
  };

  const handleCambioValor = (codigoCapitulo, campo, valor) => {
    const num = Math.max(0, parseFloat(valor) || 0);
    setFormDataCapitulos(prev => {
      const cap = { ...prev[codigoCapitulo], [campo]: num };
      cap.disponible = Math.max(0, cap.asignado - cap.ejercido - cap.comprometido);
      cap.pctEjercido = cap.asignado > 0 ? Math.round((cap.ejercido / cap.asignado) * 100) : 0;
      return {
        ...prev,
        [codigoCapitulo]: cap
      };
    });
  };

  const handleGuardarEdicion = () => {
    if (!formDataCapitulos || !areaActiva) return;

    const nuevosCapitulos = formDataCapitulos;
    const totalAsignado = Object.values(nuevosCapitulos).reduce((s, c) => s + (c.asignado || 0), 0);
    const totalEjercido = Object.values(nuevosCapitulos).reduce((s, c) => s + (c.ejercido || 0), 0);
    const totalComprometido = Object.values(nuevosCapitulos).reduce((s, c) => s + (c.comprometido || 0), 0);
    const totalDisponible = Math.max(0, totalAsignado - totalEjercido - totalComprometido);
    const totalPctEjercido = totalAsignado > 0 ? Math.round((totalEjercido / totalAsignado) * 100) : 0;

    const areaActualizada = {
      ...areaActiva,
      capitulos: nuevosCapitulos,
      totales: {
        asignado: totalAsignado,
        ejercido: totalEjercido,
        comprometido: totalComprometido,
        disponible: totalDisponible,
        pctEjercido: totalPctEjercido
      },
      ultimaActualizacion: new Date().toISOString()
    };

    const nuevosPresupuestos = presupuestos.map(p => p.areaId === areaActiva.areaId ? areaActualizada : p);
    persistirPresupuestos(nuevosPresupuestos);
    setEditandoArea(false);
    setFormDataCapitulos(null);

    toast.success(`Presupuesto por capítulos de [${areaActiva.areaNombre}] actualizado correctamente.`);

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'ACTUALIZAR_PRESUPUESTO_AREA',
      descripcion: `Actualización de capítulos de gasto de ${areaActiva.areaNombre}`,
      detalles: `Asignado: $${totalAsignado.toLocaleString('es-MX')} · Ejercido: $${totalEjercido.toLocaleString('es-MX')} (${totalPctEjercido}%)`,
      folio: `PRESUP-${areaActiva.areaId}`
    });
  };

  const handleRestablecerBase = () => {
    if (window.confirm('¿Deseas restablecer los presupuestos por área a los valores originales de plantilla?')) {
      persistirPresupuestos(PRESUPUESTOS_AREAS_INICIALES);
      setEditandoArea(false);
      setFormDataCapitulos(null);
      toast.success('Presupuestos restablecidos al catálogo inicial.');
    }
  };

  const fmtMoneda = (val) => {
    const n = Number(val) || 0;
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtMonedaCorta = (val) => {
    const n = Number(val) || 0;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
  };

  const getSemaforoAvance = (pct) => {
    if (pct > 95) return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Sobregiro / Crítico', bar: 'bg-rose-500' };
    if (pct >= 70) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'En Rango Normal', bar: 'bg-emerald-500' };
    return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Sub-ejercicio', bar: 'bg-amber-500' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Superior Institucional */}
      <div className="bg-gradient-to-r from-[#001f42] via-[#0B192C] to-[#1E3E62] text-white p-6 rounded-2xl shadow-lg border border-sky-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 size={16} />
              <span>OOMAPASC de Cajeme · Armonización CONAC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Control de Presupuesto por Áreas y Capítulos de Gasto
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Desglose operativo de los 6 capítulos de gasto presupuestario (1000 a 6000) por cada una de las 33 áreas del organismo, alineado al Cuadro de Control OOMRSC-05 y Fichas PMD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => exportarControlPresupuestalCSV(presupuestos)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} /> Exportar Excel / CSV
            </button>
            {esAdminOSGC && (
              <button
                onClick={handleRestablecerBase}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Restablecer valores originales"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Cifras Globales Consolidadas del Organismo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-sky-800/50">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-sky-200 block uppercase font-bold tracking-wide">Presupuesto Asignado</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">{fmtMonedaCorta(consolidadoGlobal.totales.asignado)}</span>
            <span className="text-[10px] text-sky-300 block">33 Áreas Operativas</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold tracking-wide">Presupuesto Ejercido</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">{fmtMonedaCorta(consolidadoGlobal.totales.ejercido)}</span>
            <span className="text-[10px] text-emerald-200 block">{consolidadoGlobal.totales.pctEjercido}% acumulado</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-200 block uppercase font-bold tracking-wide">Comprometido</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">{fmtMonedaCorta(consolidadoGlobal.totales.comprometido)}</span>
            <span className="text-[10px] text-amber-200 block">Contratos en proceso</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-cyan-200 block uppercase font-bold tracking-wide">Saldo Disponible</span>
            <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono">{fmtMonedaCorta(consolidadoGlobal.totales.disponible)}</span>
            <span className="text-[10px] text-cyan-200 block">Por ejercer</span>
          </div>
        </div>
      </div>

      {/* Contenedor Principal: Lista de Áreas a la Izquierda y Desglose Detallado a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Barra Lateral de Selección de Áreas */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Layers size={16} className="text-sky-600" />
              Áreas Operativas ({areasFiltradas.length})
            </h3>
            <span className="text-[11px] font-bold text-slate-500 font-mono">Ejercicio {ejercicio}</span>
          </div>

          {/* Filtros de la lista */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar área o encargado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <select
              value={filtroDireccion}
              onChange={(e) => setFiltroDireccion(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="TODAS">Todas las Direcciones</option>
              <option value="Dir. General">Dir. General</option>
              <option value="Dir. Técnica">Dir. Técnica</option>
              <option value="Dir. Comercial">Dir. Comercial</option>
              <option value="Dir. Administrativa">Dir. Administrativa</option>
              <option value="Dir. Órgano de Control Interno">Órgano de Control Interno</option>
              <option value="Dir. Jurídica">Dir. Jurídica</option>
              <option value="Dir. Programas Sociales y Cultura del Agua">Programas Sociales & Cultura del Agua</option>
            </select>
          </div>

          {/* Lista scrolleable de áreas */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {areasFiltradas.map((area) => {
              const esActiva = area.areaId === areaSeleccionadaId;
              const pct = area.totales?.pctEjercido || 0;
              const sem = getSemaforoAvance(pct);

              return (
                <button
                  key={area.areaId}
                  onClick={() => {
                    setAreaSeleccionadaId(area.areaId);
                    setEditandoArea(false);
                    setFormDataCapitulos(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                    esActiva
                      ? 'bg-sky-50 border-sky-400 shadow-sm text-sky-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {area.direccion}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold leading-tight truncate text-slate-900">
                      {area.areaNombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <User size={10} className="text-slate-400" />
                      {area.encargado}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-extrabold text-slate-900 block">
                      {fmtMonedaCorta(area.totales?.asignado)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border inline-block mt-1 ${sem.bg}`}>
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Detallado del Área Seleccionada */}
        <div className="lg:col-span-8 space-y-5">
          {areaActiva && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Encabezado del Área */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200 uppercase">
                      {areaActiva.direccion}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID #{areaActiva.areaId}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {areaActiva.areaNombre}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User size={13} className="text-sky-600" />
                      <strong>Titular:</strong> {areaActiva.encargado}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      {areaActiva.correo}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      {areaActiva.telefono}
                    </span>
                  </div>
                </div>

                {/* Acciones de edición */}
                <div className="flex items-center gap-2">
                  {!editandoArea ? (
                    esAdminOSGC && (
                      <button
                        onClick={handleIniciarEdicion}
                        className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition-all border border-sky-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit3 size={14} /> Editar Montos
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelarEdicion}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGuardarEdicion}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Save size={14} /> Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas Resumen del Área */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Asignado Anual</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {fmtMoneda(areaActiva.totales?.asignado)}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block uppercase">Ejercido</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {fmtMoneda(areaActiva.totales?.ejercido)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                    {areaActiva.totales?.pctEjercido}% ejecutado
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block uppercase">Comprometido</span>
                  <span className="text-lg font-black text-amber-700 font-mono">
                    {fmtMoneda(areaActiva.totales?.comprometido)}
                  </span>
                </div>
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-800 block uppercase">Saldo Disponible</span>
                  <span className="text-lg font-black text-sky-900 font-mono">
                    {fmtMoneda(areaActiva.totales?.disponible)}
                  </span>
                </div>
              </div>

              {/* Tabla Detallada por Capítulos de Gasto CONAC */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-sky-600" />
                    Desglose por Capítulos de Gasto (Armonización CONAC)
                  </h4>
                  {editandoArea && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Modo Edición Activo
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Capítulo</th>
                        <th className="py-2.5 px-3">Concepto CONAC</th>
                        <th className="py-2.5 px-3 text-right">Asignado</th>
                        <th className="py-2.5 px-3 text-right">Ejercido</th>
                        <th className="py-2.5 px-3 text-right">Comprometido</th>
                        <th className="py-2.5 px-3 text-right">Disponible</th>
                        <th className="py-2.5 px-3 text-center">% Avance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {CAPITULOS_CONAC.map((cap) => {
                        const fuente = editandoArea ? formDataCapitulos : areaActiva.capitulos;
                        const data = fuente?.[cap.codigo] || { asignado: 0, ejercido: 0, comprometido: 0, disponible: 0, pctEjercido: 0 };
                        const sem = getSemaforoAvance(data.pctEjercido);

                        return (
                          <tr key={cap.codigo} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              Cap. {cap.codigo}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{cap.nombre}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">{cap.descripcion}</span>
                            </td>

                            {/* Asignado */}
                            <td className="py-3 px-3 text-right font-mono">
                              {editandoArea ? (
                                <input
                                  type="number"
                                  value={data.asignado}
                                  onChange={(e) => handleCambioValor(cap.codigo, 'asignado', e.target.value)}
                                  className="w-28 p-1 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <span className="font-bold text-slate-800">{fmtMoneda(data.asignado)}</span>
                              )}
                            </td>

                            {/* Ejercido */}
                            <td className="py-3 px-3 text-right font-mono">
                              {editandoArea ? (
                                <input
                                  type="number"
                                  value={data.ejercido}
                                  onChange={(e) => handleCambioValor(cap.codigo, 'ejercido', e.target.value)}
                                  className="w-28 p-1 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 text-emerald-700"
                                />
                              ) : (
                                <span className="font-bold text-emerald-700">{fmtMoneda(data.ejercido)}</span>
                              )}
                            </td>

                            {/* Comprometido */}
                            <td className="py-3 px-3 text-right font-mono">
                              {editandoArea ? (
                                <input
                                  type="number"
                                  value={data.comprometido}
                                  onChange={(e) => handleCambioValor(cap.codigo, 'comprometido', e.target.value)}
                                  className="w-28 p-1 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500 text-amber-700"
                                />
                              ) : (
                                <span className="font-bold text-amber-700">{fmtMoneda(data.comprometido)}</span>
                              )}
                            </td>

                            {/* Disponible */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-sky-900">
                              {fmtMoneda(data.disponible)}
                            </td>

                            {/* % Avance */}
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${sem.bg}`}>
                                {data.pctEjercido}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Distribución Trimestral T1 - T4 del Área */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-sky-600" />
                  Calendario de Ejercicio Trimestral 2026
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['T1', 'T2', 'T3', 'T4'].map(tKey => {
                    const trimData = areaActiva.distribucionTrimestral?.[tKey] || { programado: 0, ejercido: 0 };
                    const pct = trimData.programado > 0 ? Math.round((trimData.ejercido / trimData.programado) * 100) : 0;
                    return (
                      <div key={tKey} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-mono text-sky-800">{tKey}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{pct}%</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Prog: <strong className="font-mono text-slate-800">{fmtMonedaCorta(trimData.programado)}</strong>
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Ejer: <strong className="font-mono">{fmtMonedaCorta(trimData.ejercido)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
