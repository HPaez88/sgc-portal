import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabase';
import { useSGC } from '../../SGCContext';
import {  useToast } from '../common/Toast';
import { acDesdeAuditoria, movimientoVinculo } from '../../services/flujoService';
import {
  Loader2,
  Eye,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  ClipboardList,
  X,
  GitBranch,
  Building,
  CheckSquare,
  Calendar,
  UserCheck,
  Users,
  ShieldCheck,
  Info,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';

export default function AuditoriasView({ auditorias, setAuditorias, puedeTodasAreas, areaUsuario }) {
  const {
    procesosDetalle = [],
    areas = [],
    usuarios = [],
    setAccionesCorrectivas,
    registrarMovimiento
  } = useSGC();
  const toast = useToast();

  const safeAuditorias = auditorias || [];
  const [mostrarModal, setMostrarModal] = useState(false);
  const [auditoriaDetalleModal, setAuditoriaDetalleModal] = useState(null);
  const [verInformes, setVerInformes] = useState(false);
  const [anioSeleccionado, setAnioSeleccionado] = useState(2026);
  const [informes, setInformes] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(false);

  // Formulario de nueva auditoría
  const [nuevaModalidad, setNuevaModalidad] = useState('proceso'); // 'proceso' | 'area'
  const [procesoIdSel, setProcesoIdSel] = useState('');
  const [areaSel, setAreaSel] = useState(puedeTodasAreas ? (areas[0] || '') : (areaUsuario || ''));
  const [tipoAuditoria, setTipoAuditoria] = useState('Interna');
  const [auditorLider, setAuditorLider] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [objetivo, setObjetivo] = useState('');

  // Proceso seleccionado actualmente
  const procesoSeleccionado = procesosDetalle.find(p => String(p.id) === String(procesoIdSel)) || procesosDetalle[0] || null;

  useEffect(() => {
    if (procesosDetalle.length > 0 && !procesoIdSel) {
      setProcesoIdSel(procesosDetalle[0].id);
    }
  }, [procesosDetalle, procesoIdSel]);

  // Cargar informes desde Supabase o usar fallback
  useEffect(() => {
    if (verInformes) {
      async function cargarInformes() {
        setLoadingInformes(true);
        try {
          const { data, error } = await supabase
            .from('informes_auditoria')
            .select('*')
            .order('anio', { ascending: false })
            .order('numero', { ascending: true });

          if (error) {
            console.error('Error Supabase:', error);
            setInformes(localInformes);
          } else if (data && data.length > 0) {
            setInformes(data);
          } else {
            setInformes(localInformes);
          }
        } catch (e) {
          setInformes(localInformes);
        } finally {
          setLoadingInformes(false);
        }
      }
      cargarInformes();
    }
  }, [verInformes]);

  const localInformes = [
    { anio: 2026, numero: 1, nombre: '01 Informe Auditoría Interna Semestral', tipo: 'PDF' },
    { anio: 2025, numero: 1, nombre: '01 Informe Responsabilidad Dirección', tipo: 'PDF' },
    { anio: 2025, numero: 2, nombre: '02 Informe MAM', tipo: 'PDF' },
    { anio: 2025, numero: 3, nombre: '03 MC', tipo: 'PDF' },
  ];

  const informesFiltrados = informes.filter(i => i.anio === anioSeleccionado);

  const aniosDisponibles = [...new Set(informes.map(i => i.anio))].sort((a, b) => b - a);
  if (aniosDisponibles.length === 0) {
    aniosDisponibles.push(2026, 2025, 2024, 2023);
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      'COMPLETADA': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'EN_PROCESO': 'bg-blue-100 text-blue-700 border-blue-200',
      'PROGRAMADA': 'bg-amber-100 text-amber-700 border-amber-200',
      'CANCELADA': 'bg-red-100 text-red-600 border-red-200'
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const agregarAuditoria = (e) => {
    if (e) e.preventDefault();
    const numero = `AUD-${new Date().getFullYear()}-${String(safeAuditorias.length + 1).padStart(3, '0')}`;

    let areaFinal = '';
    let procesoFinal = '';
    let areasInvolucradasFinal = [];

    if (nuevaModalidad === 'proceso' && procesoSeleccionado) {
      procesoFinal = procesoSeleccionado.nombre;
      areaFinal = procesoSeleccionado.areaResponsable || 'Dirección de Calidad';
      areasInvolucradasFinal = Array.isArray(procesoSeleccionado.areasInvolucradas) && procesoSeleccionado.areasInvolucradas.length > 0
        ? procesoSeleccionado.areasInvolucradas
        : [areaFinal];
    } else {
      areaFinal = areaSel || (areas[0] || 'Área General');
      areasInvolucradasFinal = [areaFinal];
    }

    const nuevaAud = {
      id: Date.now(),
      numero,
      modalidad: nuevaModalidad,
      proceso: procesoFinal,
      procesoClave: procesoSeleccionado?.clave || '',
      area: areaFinal,
      areasInvolucradas: areasInvolucradasFinal,
      tipo: tipoAuditoria,
      auditorLider: auditorLider.trim() || 'Auditor Interno SGC',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || fechaInicio,
      objetivo: objetivo.trim() || `Auditoría ${tipoAuditoria} conforme al estándar ISO 9001:2015`,
      estado: 'PROGRAMADA',
      hallazgos: 0,
      no_conformidades: 0
    };

    setAuditorias(prev => [...(prev || []), nuevaAud]);
    registrarMovimiento({
      modulo: 'AUDITORIAS',
      accion: 'CREACION',
      descripcion: `Programación de auditoría ${numero} (${tipoAuditoria})`,
      detalles: `Modalidad: ${nuevaModalidad}. Proceso: ${procesoFinal}. Área: ${areaFinal}.`,
      folio: numero,
    });
    setMostrarModal(false);
    setObjetivo('');
    toast.success(`Auditoría ${numero} programada.`);
  };

  // ── PUENTE INTER-MÓDULOS: Hallazgo de auditoría → Acción Correctiva ──
  // ISO 9001:2015 § 9.2 (Auditoría interna) → § 10.2 (No conformidad y acción correctiva)
  const abrirAccionCorrectiva = (auditoria, hallazgo = {}) => {
    if (typeof setAccionesCorrectivas !== 'function') {
      toast.error('El módulo de Acciones Correctivas no está disponible en esta sesión.');
      return;
    }
    const nueva = acDesdeAuditoria(auditoria, hallazgo);
    setAccionesCorrectivas(prev => [nueva, ...(prev || [])]);
    registrarMovimiento(movimientoVinculo({
      origenModulo: 'AUDITORIAS',
      destinoModulo: 'ACCIONES_CORRECTIVAS',
      referencia: auditoria?.numero || auditoria?.folio || '',
      folio: nueva.folio_codigo,
      detalle: `Hallazgo de la auditoría ${auditoria?.numero || ''} convertido en Acción Correctiva.`,
    }));
    toast.success(
      `Acción Correctiva ${nueva.folio_codigo} creada en borrador desde la auditoría ${auditoria?.numero || ''}.`,
      { titulo: 'Vínculo ISO 9.2 → 10.2', duracion: 6000 },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen de Auditorías - Estilo Premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-slate-500 mb-1">Total Auditorías</p>
          <p className="text-3xl font-black text-slate-800">{safeAuditorias.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-emerald-600 mb-1">Completadas</p>
          <p className="text-3xl font-black text-emerald-700">{safeAuditorias.filter(a => a.estado === 'COMPLETADA').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-blue-600 mb-1">En Proceso</p>
          <p className="text-3xl font-black text-blue-700">{safeAuditorias.filter(a => a.estado === 'EN_PROCESO').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-amber-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-amber-600 mb-1">Programadas</p>
          <p className="text-3xl font-black text-amber-700">{safeAuditorias.filter(a => a.estado === 'PROGRAMADA').length}</p>
        </div>
      </div>

      {/* Visor de Informes Anuales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] flex justify-between items-center text-white">
          <h2 className="font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-sky-400" /> Informes de Auditoría Anuales
          </h2>
          <button 
            onClick={() => setVerInformes(!verInformes)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer ${verInformes ? 'bg-sky-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'}`}
          >
            {verInformes ? 'Ocultar Visor' : 'Consultar Informes'}
          </button>
        </div>
        
        {verInformes && (
          <div className="p-6 bg-slate-50 border-b border-slate-200 animate-slide-down">
            {loadingInformes ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-sky-500 mb-3" size={32} />
                <span className="font-medium text-slate-500">Conectando con la base de datos...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-slate-200 inline-flex">
                  {aniosDisponibles.map(anio => (
                    <button
                      key={anio}
                      onClick={() => setAnioSeleccionado(anio)}
                      className={`px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                        anioSeleccionado === anio 
                          ? 'bg-sky-600 text-white shadow-sm' 
                          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {anio}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {informesFiltrados.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-4xl mb-3 opacity-50">📭</p>
                      <p className="font-bold text-slate-700">No hay informes disponibles para el año {anioSeleccionado}</p>
                    </div>
                  ) : (
                    informesFiltrados.map((inf, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow group">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#002855] text-sm leading-tight mb-1">{inf.nombre}</h4>
                          <p className="text-xs font-bold text-slate-500">ID: {inf.numero} • Formato: {inf.tipo}</p>
                        </div>
                        <button className="text-slate-500 hover:text-sky-600 p-2 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer">
                          <Download size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Plan Anual de Auditorías */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-[#002855] text-base flex items-center gap-2">
              <ClipboardCheck className="text-sky-600" size={20} />
              Plan Anual de Auditorías {new Date().getFullYear()}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditorías organizadas por procesos (ISO 9001:2015) y por áreas operativas
            </p>
          </div>
          <button 
            onClick={() => setMostrarModal(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-[#002855] hover:bg-[#003875] text-white rounded-lg text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Programar Auditoría
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Número</th>
                <th className="p-3.5">Modalidad / Objeto</th>
                <th className="p-3.5">Áreas a Auditar (Alcance)</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Fechas Programadas</th>
                <th className="p-3.5 text-center">Hallazgos</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAuditorias.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    No hay auditorías programadas. Utiliza el botón superior para crear una nueva.
                  </td>
                </tr>
              ) : safeAuditorias.map(aud => {
                const esProceso = aud.modalidad === 'proceso' || aud.proceso;
                const areasAuditadas = Array.isArray(aud.areasInvolucradas) && aud.areasInvolucradas.length > 0
                  ? aud.areasInvolucradas
                  : [aud.area || 'Sistema SGC'];

                return (
                  <tr key={aud.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {aud.numero}
                    </td>
                    <td className="p-3.5">
                      {esProceso ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                            <GitBranch size={11} className="text-emerald-600" /> Auditoría por Proceso
                          </span>
                          <p className="font-bold text-slate-900 text-xs leading-tight">
                            {aud.proceso || aud.area}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building size={11} className="text-slate-400" /> Líder: {aud.area}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-1">
                            <Building size={11} className="text-slate-500" /> Auditoría por Área
                          </span>
                          <p className="font-bold text-slate-900 text-xs">
                            {aud.area}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200">
                          <CheckSquare size={12} className="text-sky-600" />
                          {areasAuditadas.length} {areasAuditadas.length === 1 ? 'área a auditar' : 'áreas a auditar'}
                        </span>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {areasAuditadas.slice(0, 2).map((a, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200/70">
                              {a}
                            </span>
                          ))}
                          {areasAuditadas.length > 2 && (
                            <span 
                              className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded cursor-help"
                              title={areasAuditadas.join(', ')}
                            >
                              +{areasAuditadas.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {aud.tipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700 font-medium whitespace-nowrap">
                      {aud.fecha_inicio ? `${aud.fecha_inicio} al ${aud.fecha_fin || aud.fecha_inicio}` : 'Por definir'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${aud.hallazgos > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {aud.hallazgos}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(aud.estado)}`}>
                        {aud.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button 
                        onClick={() => setAuditoriaDetalleModal(aud)}
                        className="text-slate-500 hover:text-sky-600 p-2 hover:bg-sky-50 rounded-lg transition-colors inline-flex cursor-pointer"
                        title="Ver detalle del alcance y áreas"
                      >
                        <Eye size={18} />
                      </button>

                      {/* PUENTE ISO 9.2 → 10.2: hallazgo → Acción Correctiva */}
                      {(aud.hallazgos > 0 || aud.no_conformidades > 0) && (
                        <button
                          onClick={() => abrirAccionCorrectiva(aud, {
                            area: aud.area,
                            proceso: aud.proceso,
                            descripcion: aud.observaciones || aud.conclusiones || '',
                          })}
                          className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors inline-flex cursor-pointer"
                          title="Abrir Acción Correctiva por los hallazgos de esta auditoría (ISO 9001 § 9.2 → § 10.2)"
                        >
                          <AlertTriangle size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: PROGRAMAR AUDITORÍA (CON SELECCIÓN POR PROCESO) */}
      {/* ============================================================ */}
      {mostrarModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] flex justify-between items-center text-white shrink-0">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Plus size={18} className="text-sky-400" /> Programar Auditoría del SGC
              </h3>
              <button 
                onClick={() => setMostrarModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={agregarAuditoria} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Selector de Modalidad */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Modalidad de Auditoría <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNuevaModalidad('proceso')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      nuevaModalidad === 'proceso'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GitBranch size={18} className={nuevaModalidad === 'proceso' ? 'text-emerald-600' : 'text-slate-400'} />
                    <div>
                      <p className="font-extrabold text-xs">Por Proceso (ISO 9001)</p>
                      <p className="text-[10px] text-slate-500">Audita todas las áreas que interactúan en el proceso</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevaModalidad('area')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      nuevaModalidad === 'area'
                        ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building size={18} className={nuevaModalidad === 'area' ? 'text-sky-600' : 'text-slate-400'} />
                    <div>
                      <p className="font-extrabold text-xs">Por Área Individual</p>
                      <p className="text-[10px] text-slate-500">Audita un departamento o área específica</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Si es POR PROCESO */}
              {nuevaModalidad === 'proceso' && (
                <div className="space-y-3 p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Seleccionar Proceso a Auditar <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={procesoIdSel}
                      onChange={(e) => setProcesoIdSel(e.target.value)}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      {procesosDetalle.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.clave} - {p.nombre} ({p.tipo})
                        </option>
                      ))}
                    </select>
                  </div>

                  {procesoSeleccionado && (
                    <div className="bg-white rounded-lg p-3.5 border border-emerald-200 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Área Líder Responsable:</span>
                        <strong className="text-slate-800 font-bold">{procesoSeleccionado.areaResponsable || 'Sin asignar'}</strong>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckSquare size={13} className="text-emerald-600" />
                            Áreas que Interactúan y Serán Auditadas:
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {(procesoSeleccionado.areasInvolucradas || []).length} áreas en alcance
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {(procesoSeleccionado.areasInvolucradas || []).map((areaInvol, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200 flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {areaInvol}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Si es POR ÁREA */}
              {nuevaModalidad === 'area' && (
                <div className="p-4 bg-sky-50/40 rounded-xl border border-sky-200/80">
                  <label className="block text-xs font-bold text-sky-900 uppercase tracking-wider mb-1">
                    Área Operativa a Auditar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={areaSel}
                    onChange={(e) => setAreaSel(e.target.value)}
                    disabled={!puedeTodasAreas}
                    className="w-full p-2.5 bg-white border border-sky-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}

              {/* Parámetros Generales */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Tipo de Auditoría <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tipoAuditoria}
                    onChange={(e) => setTipoAuditoria(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                  >
                    <option value="Interna">Interna (Semestral)</option>
                    <option value="Seguimiento">Seguimiento a No Conformidades</option>
                    <option value="Certificación">Certificación / Recertificación Externa</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Auditor Líder Responsable
                  </label>
                  <input
                    type="text"
                    value={auditorLider}
                    onChange={(e) => setAuditorLider(e.target.value)}
                    placeholder="Ej. Ing. Héctor Manuel Páez"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Fecha de Inicio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Fecha de Cierre
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Objetivo / Criterios de Auditoría
                </label>
                <textarea
                  rows={2}
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="Evaluar el cumplimiento de los requisitos de la norma ISO 9001:2015 en los procesos..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white font-extrabold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> Programar Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* MODAL: VER DETALLE DE AUDITORÍA Y ALCANCE */}
      {/* ============================================================ */}
      {auditoriaDetalleModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] flex justify-between items-center text-white">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ClipboardCheck size={18} className="text-sky-400" />
                Auditoría {auditoriaDetalleModal.numero}
              </h3>
              <button 
                onClick={() => setAuditoriaDetalleModal(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 block text-[11px]">Modalidad</span>
                  <span className="font-extrabold text-slate-900">
                    {auditoriaDetalleModal.modalidad === 'proceso' ? '🎯 Por Proceso SGC' : '🏢 Por Área Operativa'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tipo de Auditoría</span>
                  <span className="font-extrabold text-slate-900">{auditoriaDetalleModal.tipo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Estado</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${getEstadoBadge(auditoriaDetalleModal.estado)}`}>
                    {auditoriaDetalleModal.estado}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Auditor Líder</span>
                  <span className="font-bold text-slate-800">{auditoriaDetalleModal.auditorLider || 'No asignado'}</span>
                </div>
              </div>

              {auditoriaDetalleModal.proceso && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">Proceso Auditado</span>
                  <p className="font-extrabold text-emerald-950 text-sm">{auditoriaDetalleModal.proceso}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Área Líder: {auditoriaDetalleModal.area}</p>
                </div>
              )}

              {/* Lista de Áreas Involucradas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-sky-600" />
                    Áreas Auditadas en este Alcance ({(auditoriaDetalleModal.areasInvolucradas || [auditoriaDetalleModal.area]).length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {(auditoriaDetalleModal.areasInvolucradas || [auditoriaDetalleModal.area]).map((areaNombre, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200/80 text-[11px] font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                      <span className="truncate">{areaNombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              {auditoriaDetalleModal.objetivo && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Objetivo / Criterios</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 italic">
                    "{auditoriaDetalleModal.objetivo}"
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setAuditoriaDetalleModal(null)}
                  className="px-5 py-2 bg-[#0B192C] text-white font-extrabold rounded-lg hover:bg-[#152e4d] cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}