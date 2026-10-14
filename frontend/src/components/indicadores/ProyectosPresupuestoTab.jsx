import React, { useState, useMemo } from 'react';
import {
  Layers,
  Download,
  FileDown,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Target,
  ChevronDown
} from 'lucide-react';
import {
  PROYECTOS_PRESUPUESTO_EGRESOS
} from '../../constants/fichasGubernamentales';
import {
  exportarProyectoPresupuestoPDF,
  descargarProyectoPresupuestoDocx,
  exportarCuantificacionRecursosCONAC_PDF,
  exportarConsolidadoCONAC_PDF,
  exportarCuantificacionCONAC_CSV
} from '../../services/fichaTecnicaExporter';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ModalGestionProyectoPresupuestario from './ModalGestionProyectoPresupuestario';

const STORAGE_KEY = 'sgc-proyectos-presupuesto-2026';

export default function ProyectosPresupuestoTab({ esAdminOSGC = false, ejercicio = 2026 }) {
  const toast = useToast();
  const { registrarMovimiento } = useSGC();

  // Estado con persistencia local
  const [proyectos, setProyectos] = useState(() => {
    try {
      const g = localStorage.getItem(STORAGE_KEY);
      if (g) {
        const parsed = JSON.parse(g);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error leyendo proyectos de localStorage', e);
    }
    return PROYECTOS_PRESUPUESTO_EGRESOS;
  });

  const [proyectoActivoId, setProyectoActivoId] = useState(() => {
    return proyectos[0]?.id || 'PP10-DIR-GRAL';
  });

  const [descargandoDocx, setDescargandoDocx] = useState(false);
  const [menuExportarAbierto, setMenuExportarAbierto] = useState(false);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoParaEditar, setProyectoParaEditar] = useState(null);

  // Proyecto activo seleccionado
  const proyectoActivo = useMemo(() => {
    return proyectos.find(p => p.id === proyectoActivoId) || proyectos[0] || null;
  }, [proyectos, proyectoActivoId]);

  // Guardar en Storage
  const persistirProyectos = (nuevosProyectos) => {
    setProyectos(nuevosProyectos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosProyectos));
    } catch (e) {
      console.error('Error guardando proyectos en localStorage', e);
    }
  };

  // Guardar Creación o Edición
  const handleGuardarProyecto = (proyectoGuardado, esEdicion) => {
    let actualizados;
    if (esEdicion) {
      actualizados = proyectos.map(p => p.id === proyectoGuardado.id ? proyectoGuardado : p);
      toast.success(`Ficha de Proyecto [${proyectoGuardado.clave_programa}] actualizada correctamente.`);
    } else {
      actualizados = [...proyectos, proyectoGuardado];
      setProyectoActivoId(proyectoGuardado.id);
      toast.success(`Nuevo Proyecto Presupuestario [${proyectoGuardado.clave_programa}] creado con éxito.`);
    }

    persistirProyectos(actualizados);

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: esEdicion ? 'ACTUALIZAR_PROYECTO_PRESUPUESTARIO' : 'CREAR_PROYECTO_PRESUPUESTARIO',
      descripcion: `${esEdicion ? 'Modificación' : 'Alta'} de Formato de Proyecto Presupuestario ${proyectoGuardado.clave_programa} (${proyectoGuardado.unidad_responsable})`,
      detalles: `Presupuesto Solicitado: $${(proyectoGuardado.presupuesto_capitulos?.total?.anual || 0).toLocaleString('es-MX')} · Eje PMD: ${proyectoGuardado.eje_rector_pmd}`,
      folio: proyectoGuardado.clave_programa
    });
  };

  // Eliminar Proyecto
  const handleEliminarProyecto = (proy) => {
    if (proyectos.length <= 1) {
      toast.error('Debe existir al menos un proyecto presupuestario en el catálogo oficial.');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar el formato del Proyecto [${proy.clave_programa}] - ${proy.unidad_responsable}?`)) {
      const filtrados = proyectos.filter(p => p.id !== proy.id);
      persistirProyectos(filtrados);
      setProyectoActivoId(filtrados[0]?.id);
      toast.info(`Proyecto [${proy.clave_programa}] eliminado.`);

      registrarMovimiento?.({
        modulo: 'INDICADORES',
        accion: 'ELIMINAR_PROYECTO_PRESUPUESTARIO',
        descripcion: `Eliminación de Proyecto Presupuestario ${proy.clave_programa}`,
        detalles: `Unidad Responsable: ${proy.unidad_responsable}`,
        folio: proy.clave_programa
      });
    }
  };

  // Restablecer catálogo inicial
  const handleRestablecerOriginales = () => {
    if (window.confirm('¿Deseas restablecer los proyectos presupuestarios a los formatos iniciales de Tesorería Municipal?')) {
      persistirProyectos(PROYECTOS_PRESUPUESTO_EGRESOS);
      setProyectoActivoId(PROYECTOS_PRESUPUESTO_EGRESOS[0].id);
      toast.success('Formatos de proyectos restablecidos a sus valores base.');
    }
  };

  // Exportaciones
  const handleDescargarPDFCompleto = (proy) => {
    try {
      exportarProyectoPresupuestoPDF(proy);
      toast.success(`Formato Oficial de Presentación [${proy.clave_programa}] descargado en PDF`);
    } catch (err) {
      toast.error(`Error al generar PDF: ${err.message}`);
    }
  };

  const handleDescargarWord = async (proy) => {
    setDescargandoDocx(true);
    try {
      await descargarProyectoPresupuestoDocx(proy);
      toast.success(`Formato de Proyecto [${proy.clave_programa}] descargado en Word (.docx)`);
    } catch (err) {
      toast.error(`Error al generar Word: ${err.message}`);
    } finally {
      setDescargandoDocx(false);
    }
  };

  const handleExportarCONAC_Individual = (proy) => {
    try {
      exportarCuantificacionRecursosCONAC_PDF(proy);
      toast.success(`Cuantificación CONAC de [${proy.clave_programa}] exportada en PDF oficial`);
    } catch (err) {
      toast.error(`Error al exportar CONAC PDF: ${err.message}`);
    }
  };

  const handleExportarCONAC_Consolidado = () => {
    try {
      exportarConsolidadoCONAC_PDF(proyectos);
      toast.success(`Reporte Consolidado CONAC de todas las ${proyectos.length} fichas exportado en PDF`);
    } catch (err) {
      toast.error(`Error al exportar Consolidado CONAC: ${err.message}`);
    }
  };

  const handleExportarCONAC_CSV_General = () => {
    try {
      exportarCuantificacionCONAC_CSV(proyectos, null);
      toast.success(`Cuantificación CONAC de todas las fichas exportada en archivo CSV / Excel`);
    } catch (err) {
      toast.error(`Error al exportar CSV: ${err.message}`);
    }
  };

  const handleExportarCONAC_CSV_Individual = (proy) => {
    try {
      exportarCuantificacionCONAC_CSV(proyectos, proy);
      toast.success(`Cuantificación CONAC de [${proy.clave_programa}] exportada en CSV / Excel`);
    } catch (err) {
      toast.error(`Error al exportar CSV: ${err.message}`);
    }
  };

  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (m || '$0.00');

  // Estadísticas globales consolidadas
  const totalPresupuestoGeneral = useMemo(() => {
    return proyectos.reduce((sum, p) => sum + (Number(p.presupuesto_capitulos?.total?.anual) || 0), 0);
  }, [proyectos]);

  const totalActividadesGeneral = useMemo(() => {
    return proyectos.reduce((sum, p) => sum + (p.actividades_indicadores?.length || 0), 0);
  }, [proyectos]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Principal de Presentación de Proyectos */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white shadow-xl border border-slate-700/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-sky-400/20 text-sky-300 border border-sky-400/30">
              TESORERÍA MUNICIPAL · CAJEME
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              PRESUPUESTO DE EGRESOS {ejercicio}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck size={13} /> {proyectos.length} Fichas Registradas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Layers size={22} className="text-sky-400" />
            Formatos Oficiales de Presentación de Proyectos Presupuestarios
          </h2>
          <p className="text-xs text-sky-100/80 leading-relaxed">
            Estructuración obligatoria institucional por unidad responsable con cuantificación por Capítulos de Gasto CONAC (1000 a 7000), calendario trimestral y matriz de metas.
          </p>
        </div>

        {/* Acciones de Gestión y Exportación */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Botón Crear Nuevo Proyecto */}
          <button
            onClick={() => {
              setProyectoParaEditar(null);
              setModalAbierto(true);
            }}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            title="Dar de alta una nueva Ficha de Proyecto Presupuestario"
          >
            <Plus size={16} />
            <span>+ Nuevo Proyecto</span>
          </button>

          {/* Menú de Exportación Oficial CONAC */}
          <div className="relative">
            <button
              onClick={() => setMenuExportarAbierto(!menuExportarAbierto)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Download size={15} />
              <span>Exportar CONAC</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${menuExportarAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuExportarAbierto && (
              <>
                <div 
                  className="fixed inset-0 z-20 cursor-default" 
                  onClick={() => setMenuExportarAbierto(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Exportaciones de la Ficha Activa ({proyectoActivo?.clave_programa})
                  </div>

                  <button
                    onClick={() => {
                      setMenuExportarAbierto(false);
                      if (proyectoActivo) handleDescargarPDFCompleto(proyectoActivo);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download size={15} className="text-sky-600 shrink-0" />
                    <div>
                      <div className="text-xs">Formato Oficial Completo (PDF)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Incluye datos, narrativa, metas y CONAC</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMenuExportarAbierto(false);
                      if (proyectoActivo) handleExportarCONAC_Individual(proyectoActivo);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <DollarSign size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs">Cuantificación CONAC - Ficha (PDF)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Desglose de Capítulos 1000-7000 en PDF</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMenuExportarAbierto(false);
                      if (proyectoActivo) handleDescargarWord(proyectoActivo);
                    }}
                    disabled={descargandoDocx}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileDown size={15} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs">Descargar en Word (.docx)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Generación institucional editable</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMenuExportarAbierto(false);
                      if (proyectoActivo) handleExportarCONAC_CSV_Individual(proyectoActivo);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold text-slate-800 hover:bg-teal-50 hover:text-teal-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-teal-600 shrink-0" />
                    <div>
                      <div className="text-xs">Cuantificación Ficha (Excel / CSV)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Hoja de cálculo de la ficha activa</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <div className="px-3 py-1 text-[10px] font-mono font-bold text-sky-800 uppercase tracking-wider">
                      Exportaciones Consolidadas (Todas las Fichas)
                    </div>

                    <button
                      onClick={() => {
                        setMenuExportarAbierto(false);
                        handleExportarCONAC_Consolidado();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl font-bold text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/80 transition-colors flex items-center gap-2.5 cursor-pointer mt-1"
                    >
                      <Layers size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-black">Consolidado CONAC (PDF - Todas)</div>
                        <div className="text-[10px] text-indigo-700/80 font-normal">Gran total OOMAPASC + Fichas por separado</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setMenuExportarAbierto(false);
                        handleExportarCONAC_CSV_General();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl font-bold text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/80 transition-colors flex items-center gap-2.5 cursor-pointer mt-1"
                    >
                      <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-black">Consolidado CONAC (Excel / CSV)</div>
                        <div className="text-[10px] text-emerald-700/80 font-normal">Todas las fichas en matriz para Tesorería</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas Resumen Presupuestal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase font-mono block">
            Gran Total Institucional
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#002855] block">
            {fmtMonto(totalPresupuestoGeneral)}
          </span>
          <span className="text-[10px] text-slate-400 block">Presupuesto consolidado solicitado</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase font-mono block">
            Fichas de Proyectos
          </span>
          <span className="text-xl sm:text-2xl font-black text-sky-700 block">
            {proyectos.length}
          </span>
          <span className="text-[10px] text-slate-400 block">Unidades responsables asignadas</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase font-mono block">
            Actividades & Metas
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 block">
            {totalActividadesGeneral}
          </span>
          <span className="text-[10px] text-slate-400 block">Metas calendarizadas trimestralmente</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase font-mono block">
            Ficha en Consulta
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block truncate" title={proyectoActivo?.clave_programa}>
            {proyectoActivo?.clave_programa || 'PP'}
          </span>
          <span className="text-[10px] text-slate-400 block truncate" title={proyectoActivo?.unidad_responsable}>
            {proyectoActivo?.unidad_responsable || 'Sin selección'}
          </span>
        </div>
      </div>

      {/* Selector de Fichas de Proyectos y Acciones de Edición */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pills de Proyectos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 font-mono uppercase mr-1 shrink-0 flex items-center gap-1">
            <Building2 size={14} className="text-sky-600" /> Fichas:
          </span>
          {proyectos.map(p => {
            const esActivo = proyectoActivoId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setProyectoActivoId(p.id)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                  esActivo
                    ? 'bg-[#002855] text-white border-[#002855] shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 border-slate-200'
                }`}
              >
                <span>{p.clave_programa}</span>
                <span className={`text-[10.5px] font-normal truncate max-w-[150px] ${esActivo ? 'text-sky-200' : 'text-slate-500'}`}>
                  {p.unidad_responsable}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acciones para la Ficha Activa (Modificar, Eliminar, Restablecer) */}
        {proyectoActivo && (
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => {
                setProyectoParaEditar(proyectoActivo);
                setModalAbierto(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Modificar los datos, objetivos, metas y cuantificación CONAC de este proyecto"
            >
              <Edit3 size={13} />
              <span>Modificar Ficha</span>
            </button>

            {proyectos.length > 1 && (
              <button
                onClick={() => handleEliminarProyecto(proyectoActivo)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                title="Eliminar este proyecto presupuestario"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              onClick={handleRestablecerOriginales}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Restablecer formatos de catálogo oficial a valores iniciales"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Visualizador de Formato Oficial del Proyecto Seleccionado */}
      {proyectoActivo ? (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200 p-6 space-y-6">
          {/* Encabezado del Formato */}
          <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10.5px] font-mono font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                PROGRAMA: {proyectoActivo.clave_programa}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1.5">
                {proyectoActivo.nombre_programa}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unidad Responsable: <strong>{proyectoActivo.unidad_responsable}</strong> · Eje PMD: <strong>{proyectoActivo.eje_rector_pmd}</strong> · Tipo: <strong>{proyectoActivo.tipo_proyecto}</strong>
              </p>
            </div>

            <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Presupuesto Anual Solicitado</span>
              <span className="text-2xl font-black text-[#002855]">
                {fmtMonto(proyectoActivo.presupuesto_capitulos?.total?.anual || 0)}
              </span>
            </div>
          </div>

          {/* Resumen, Justificación y Objetivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Resumen Ejecutivo</span>
              <p className="text-xs text-slate-700 leading-relaxed">{proyectoActivo.resumen_ejecutivo || 'Sin resumen registrado.'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Justificación</span>
              <p className="text-xs text-slate-700 leading-relaxed">{proyectoActivo.justificacion || 'Sin justificación registrada.'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Objetivo General</span>
              <p className="text-xs text-slate-800 leading-relaxed font-bold">{proyectoActivo.objetivo || 'Sin objetivo registrado.'}</p>
            </div>
          </div>

          {/* Matriz de Actividades e Indicadores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#002855] flex items-center gap-2">
                <Target size={17} className="text-sky-600" />
                Matriz Oficial de Actividades, Metas y Calendario Trimestral
              </h4>
              <span className="text-xs font-mono text-slate-500">
                {proyectoActivo.actividades_indicadores?.length || 0} actividades
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-[#0B192C] text-white">
                  <tr>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px]">Actividad Programada</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px]">Indicador de Medición</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-center">Unidad</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-center">Meta Anual</th>
                    <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">I</th>
                    <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">II</th>
                    <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">III</th>
                    <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">IV</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {proyectoActivo.actividades_indicadores?.map((act, idx) => {
                    const t = act.trimestres || {};
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-3 py-2.5 text-slate-800 font-medium text-[11.5px] max-w-xs">{act.actividad}</td>
                        <td className="px-3 py-2.5 text-slate-800 font-bold text-[11.5px] max-w-xs">{act.indicador}</td>
                        <td className="px-3 py-2.5 text-slate-600 text-center text-[11px]">{act.unidad_medida}</td>
                        <td className="px-3 py-2.5 text-sky-900 font-black text-center text-[11.5px]">{act.meta}</td>
                        <td className="px-2.5 py-2.5 text-slate-700 text-center text-[11px] font-bold">{t.t1}</td>
                        <td className="px-2.5 py-2.5 text-slate-700 text-center text-[11px] font-bold">{t.t2}</td>
                        <td className="px-2.5 py-2.5 text-slate-700 text-center text-[11px] font-bold">{t.t3}</td>
                        <td className="px-2.5 py-2.5 text-slate-700 text-center text-[11px] font-bold">{t.t4}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cuantificación de Recursos por Capítulo CONAC */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#002855] flex items-center gap-2">
                <DollarSign size={17} className="text-emerald-600" />
                Cuantificación de Recursos Presupuestarios por Capítulos de Gasto (Armonización CONAC)
              </h4>
              <button
                onClick={() => handleExportarCONAC_Individual(proyectoActivo)}
                className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} /> Exportar Tabla CONAC PDF
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-[#1E3E62] text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-bold uppercase text-[10.5px]">Capítulo de Gasto CONAC</th>
                    <th className="px-4 py-2.5 font-bold uppercase text-[10.5px] text-right">Presupuesto Anual</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">1er. Trimestre</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">2do. Trimestre</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">3er. Trimestre</th>
                    <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">4to. Trimestre</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {Object.keys(proyectoActivo.presupuesto_capitulos || {}).map((k) => {
                    const cap = proyectoActivo.presupuesto_capitulos[k];
                    const isTotal = k === 'total';
                    return (
                      <tr key={k} className={isTotal ? 'bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300' : 'hover:bg-slate-50'}>
                        <td className={`px-4 py-2.5 ${isTotal ? 'text-xs uppercase font-black text-[#002855]' : 'text-slate-800 text-[11.5px]'}`}>
                          {cap.capitulo}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{fmtMonto(cap.anual)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{fmtMonto(cap.t1)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{fmtMonto(cap.t2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{fmtMonto(cap.t3)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{fmtMonto(cap.t4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firmas Oficiales */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-[11px] pt-6">
            <div className="space-y-1">
              <div className="w-52 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
                TITULAR DE LA UNIDAD RESPONSABLE
              </div>
              <p className="text-slate-800 font-bold">{proyectoActivo.titular}</p>
              <p className="text-slate-500 text-[10.5px]">{proyectoActivo.cargo_titular}</p>
            </div>

            <div className="space-y-1">
              <div className="w-52 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
                VALIDACIÓN TESORERÍA MUNICIPAL
              </div>
              <p className="text-slate-800 font-bold">LIC. LUIS ALBERTO RUIZ CORONADO</p>
              <p className="text-slate-500 text-[10.5px]">DIRECTOR GENERAL OOMAPASC</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No hay proyectos registrados en este catálogo. Pulsa <strong>+ Nuevo Proyecto</strong> para dar de alta uno.
        </div>
      )}

      {/* Modal para Crear y Modificar Proyecto Presupuestario */}
      {modalAbierto && (
        <ModalGestionProyectoPresupuestario
          abierto={modalAbierto}
          onCerrar={() => {
            setModalAbierto(false);
            setProyectoParaEditar(null);
          }}
          proyecto={proyectoParaEditar}
          onGuardar={handleGuardarProyecto}
        />
      )}
    </div>
  );
}
