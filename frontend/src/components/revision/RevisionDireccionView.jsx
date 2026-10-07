import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  Save, 
  Check, 
  X, 
  FileBarChart, 
  Activity, 
  Droplet, 
  PhoneCall, 
  MessageSquare, 
  FlaskConical, 
  Truck, 
  Layers, 
  Edit3, 
  Lock, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { 
  FORMATO_REVISION_DIRECCION, 
  FORMULARIOS_COMPLEMENTARIOS_CONFIG,
  REVISIONES_DIRECCION_INICIALES 
} from '../../constants/revisionDireccion';
import StatCard from '../ui/StatCard';
import StatusBadge from '../ui/StatusBadge';
import FormularioComplementarioModal from './FormularioComplementarioModal';
import AsignacionResponsablesModal from './AsignacionResponsablesModal';
import { exportarRevisionDireccionOOMRSC04 } from '../../services/revisionExporter';
import { useToast } from '../common/Toast';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function RevisionDireccionView({
  puedeTodasAreas,
  areaUsuario
}) {
  const {
    usuarioLogueado,
    usuarios = [],
    accionesCorrectivas = [],
    planesMejora = [],
    indicadoresData = {},
    auditorias = [],
    riesgos = [],
    registrarMovimiento,
    puede
  } = useSGC();
  const toast = useToast();

  const [ejercicio, setEjercicio] = useState(2026);
  const [mesSeleccionado, setMesSeleccionado] = useState('Julio');
  const [tabActiva, setTabActiva] = useState('resumen'); // 'resumen' | 'entradas' | 'salidas' | 'formularios'

  // Almacén de Revisiones por la Dirección (con persistencia local en memoria / contexto)
  const [revisiones, setRevisiones] = useState(() => {
    const guardado = localStorage.getItem('sgc-revisiones-direccion');
    if (guardado) {
      try { return JSON.parse(guardado); } catch (e) { /* ignore */ }
    }
    return REVISIONES_DIRECCION_INICIALES;
  });

  // Asignaciones de formularios complementarios a usuarios responsables
  const [asignacionesResponsables, setAsignacionesResponsables] = useState(() => {
    const guardado = localStorage.getItem('sgc-asignaciones-formularios');
    if (guardado) {
      try { return JSON.parse(guardado); } catch (e) { /* ignore */ }
    }
    const def = {};
    FORMULARIOS_COMPLEMENTARIOS_CONFIG.forEach(f => {
      def[f.id] = f.responsableDefaultId;
    });
    return def;
  });

  const [diaLimiteCaptura, setDiaLimiteCaptura] = useState(() => {
    const guardado = localStorage.getItem('sgc-dia-limite-captura');
    return guardado ? Number(guardado) : 10;
  });

  // Modales
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [formularioConfigActivo, setFormularioConfigActivo] = useState(null);
  const [modalAsignacionAbierto, setModalAsignacionAbierto] = useState(false);

  // Buscar o crear la revisión del mes/ejercicio actual
  const revisionActual = useMemo(() => {
    const encontrada = revisiones.find(
      r => r.ejercicio === Number(ejercicio) && r.mes.toLowerCase() === mesSeleccionado.toLowerCase()
    );
    if (encontrada) return encontrada;

    // Crear plantilla en blanco para el período seleccionado
    return {
      id: `REV-${ejercicio}-${mesSeleccionado.slice(0, 3).toUpperCase()}`,
      ejercicio: Number(ejercicio),
      mes: mesSeleccionado,
      periodoId: 'C2',
      fechaSesion: new Date().toISOString().split('T')[0],
      estado: 'EN_REVISION',
      folio: `OOMRSC-04/${ejercicio}-${mesSeleccionado.slice(0, 3).toUpperCase()}`,
      directorGeneral: 'Dirección General OOMAPASC',
      coordinadorSGC: 'Lic. Héctor Manuel Páez León',
      cambiosContexto: 'Seguimiento continuo al desempeño operativo, resiliencia hídrica y gobernanza de IA según ISO 9001:2026.',
      cobranza: {
        presupuestado: 55000000.0,
        logrado: 44000000.0,
        cumplimiento_pct: 80
      },
      muestreoAgua: {
        programados: 830,
        realizados: 835,
        cumplimiento_pct: 100
      },
      auditoriasInternas: {
        periodo: 'Auditorías 2026',
        procesosAuditados: 'Mantenimiento, Comercialización y Calidad',
        promedioSGC: 92,
        rango: 'Aceptable'
      },
      formulariosComplementarios: {},
      salidasDireccion: {
        oportunidadesMejora: 'Continuar fortaleciendo la micromedición urbana y digitalización de reportes operativos.',
        cambiosSGC: 'Alineación institucional con las nuevas enmiendas de ISO 9001:2026.',
        recursosNecesarios: 'Garantizar presupuesto para reactivos químicos de potabilización y mantenimiento de redes.',
        acuerdosFinales: 'Se aprueba el informe mensual de resultados SGC con el compromiso de la Alta Dirección.'
      }
    };
  }, [revisiones, ejercicio, mesSeleccionado]);

  // Guardar cambios en revisiones
  const guardarRevisionActual = (actualizada) => {
    setRevisiones(prev => {
      const idx = prev.findIndex(r => r.id === actualizada.id);
      let nuevas;
      if (idx >= 0) {
        nuevas = [...prev];
        nuevas[idx] = actualizada;
      } else {
        nuevas = [actualizada, ...prev];
      }
      localStorage.setItem('sgc-revisiones-direccion', JSON.stringify(nuevas));
      return nuevas;
    });
  };

  // Guardar formulario complementario
  const handleGuardarFormulario = (formularioId, datosForm) => {
    const nuevaRevision = {
      ...revisionActual,
      formulariosComplementarios: {
        ...(revisionActual.formulariosComplementarios || {}),
        [formularioId]: datosForm
      }
    };
    guardarRevisionActual(nuevaRevision);

    registrarMovimiento?.({
      modulo: 'REVISION_DIRECCION',
      accion: 'CAPTURA_FORMULARIO',
      descripcion: `Captura de formulario complementario ${formularioId} para la Revisión ${mesSeleccionado} ${ejercicio}`,
      detalles: `Usuario: ${usuarioLogueado?.nombre}, Folio: ${nuevaRevision.folio}`,
      folio: nuevaRevision.folio
    });
  };

  // Guardar asignaciones de responsables
  const handleGuardarAsignaciones = (nuevasAsignaciones) => {
    setAsignacionesResponsables(nuevasAsignaciones);
    localStorage.setItem('sgc-asignaciones-formularios', JSON.stringify(nuevasAsignaciones));
  };

  const handleGuardarDiaLimite = (nuevoDia) => {
    setDiaLimiteCaptura(nuevoDia);
    localStorage.setItem('sgc-dia-limite-captura', String(nuevoDia));
  };

  // Guardar cambios en salidas
  const handleActualizarSalidas = (campo, valor) => {
    const nueva = {
      ...revisionActual,
      salidasDireccion: {
        ...(revisionActual.salidasDireccion || {}),
        [campo]: valor
      }
    };
    guardarRevisionActual(nueva);
  };

  // Cambiar estado (Aprobar y Cerrar Sesión)
  const handleAprobarRevision = () => {
    const aprobada = {
      ...revisionActual,
      estado: 'APROBADA_CERRADA',
      fechaAprobacion: new Date().toISOString()
    };
    guardarRevisionActual(aprobada);
    toast.exito(`Revisión por la Dirección (${revisionActual.folio}) Aprobada y Cerrada Oficialmente.`);
    registrarMovimiento?.({
      modulo: 'REVISION_DIRECCION',
      accion: 'APROBACION_SESION',
      descripcion: `Aprobación y cierre oficial de la Revisión por la Dirección ${mesSeleccionado} ${ejercicio}`,
      detalles: `Folio: ${revisionActual.folio}, Aprobado por: ${usuarioLogueado?.nombre}`,
      folio: revisionActual.folio
    });
  };

  // Exportar PDF
  const handleExportarPDF = () => {
    try {
      const fileName = exportarRevisionDireccionOOMRSC04({
        revisionData: revisionActual,
        ejercicio,
        mes: mesSeleccionado,
        accionesCorrectivas,
        planesMejora,
        indicadoresData,
        auditorias,
        riesgos,
        usuario: usuarioLogueado
      });
      toast.exito(`Informe oficial "${fileName}" generado exitosamente.`);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el informe en PDF.');
    }
  };

  // Permisos
  const esSuperAdminOAdmin = usuarioLogueado?.rol === 'Super Admin' || usuarioLogueado?.rol === 'Admin';

  // Cálculos de Datos en Vivo
  const totalAC = accionesCorrectivas.length;
  const acCerradas = accionesCorrectivas.filter(a => a.estado === 'CERRADA').length;
  const pctCumplimientoAC = totalAC > 0 ? Math.round((acCerradas / totalAC) * 100) : 100;

  const totalPM = planesMejora.length;
  const pmEnProceso = planesMejora.filter(p => p.estado === 'APROBADO' || p.estado === 'EN_SEGUIMIENTO').length;
  const presupuestoTotalPM = planesMejora.reduce((acc, p) => acc + (Number(p.presupuestoEstimado || p.presupuesto || 0)), 0);

  // Estatus de captura de los 5 formularios
  const estatusFormularios = useMemo(() => {
    return FORMULARIOS_COMPLEMENTARIOS_CONFIG.map(form => {
      const datos = revisionActual.formulariosComplementarios?.[form.id];
      const usuarioAsignadoId = asignacionesResponsables[form.id] || form.responsableDefaultId;
      const usuarioAsignado = usuarios.find(u => u.id === usuarioAsignadoId);
      const completado = !!datos;
      const esResponsable = usuarioLogueado?.id === usuarioAsignadoId || esSuperAdminOAdmin;

      return {
        ...form,
        datos,
        usuarioAsignado,
        completado,
        esResponsable
      };
    });
  }, [revisionActual, asignacionesResponsables, usuarios, usuarioLogueado, esSuperAdminOAdmin]);

  const formulariosCompletadosCount = estatusFormularios.filter(f => f.completado).length;

  return (
    <div className="space-y-6">
      {/* HEADER EJECUTIVO & CONTROLES */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F294D] to-[#1E3E62] text-white p-6 rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                {FORMATO_REVISION_DIRECCION.clave} {FORMATO_REVISION_DIRECCION.revision}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <ShieldCheck size={14} />
                ISO 9001:2015 / ISO 9001:2026 § 9.3
              </span>
              <span className="text-slate-300 text-xs">
                Folio: <strong className="text-white font-mono">{revisionActual.folio}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Revisión por la Dirección
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 leading-relaxed">
              Consolidación oficial de desempeño, satisfacción ciudadana, eficacia de procesos, objetivos de calidad y asignación de recursos para la Alta Dirección de OOMAPASC.
            </p>
          </div>

          {/* Selectores de Período & Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Selector de Mes */}
            <div className="flex items-center bg-slate-800/80 border border-slate-600/80 rounded-xl p-1">
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="bg-transparent text-white text-xs font-bold px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                {MESES.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={ejercicio}
                onChange={(e) => setEjercicio(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-bold px-2 py-1.5 border-l border-slate-700 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignar Responsables (Admin) */}
            {esSuperAdminOAdmin && (
              <button
                onClick={() => setModalAsignacionAbierto(true)}
                className="hidden md:flex px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-600 transition-all items-center justify-center gap-2 shadow-sm"
                title="Configurar usuarios responsables de formularios"
              >
                <Users size={15} className="text-purple-400" />
                <span>Asignar Responsables</span>
              </button>
            )}

            {/* Exportar a PDF */}
            <button
              onClick={handleExportarPDF}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Download size={15} />
              <span>Exportar PDF OOMRSC-04</span>
            </button>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto">
          {[
            { id: 'resumen', label: '1. Resumen & Marco Institucional', icon: FileBarChart },
            { id: 'entradas', label: '2. Entradas ISO 9.3.2 (A-F)', icon: Activity },
            { id: 'salidas', label: '3. Salidas ISO 9.3.3 & Acuerdos', icon: Award },
            { 
              id: 'formularios', 
              label: `4. Formularios Complementarios (${formulariosCompletadosCount}/5)`, 
              icon: FileText,
              badge: formulariosCompletadosCount === 5 ? '100%' : 'Pendiente'
            }
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
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    formulariosCompletadosCount === 5 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}

      {/* ==================================================================== */}
      {/* TAB 1: RESUMEN EJECUTIVO & MARCO INSTITUCIONAL                      */}
      {/* ==================================================================== */}
      {tabActiva === 'resumen' && (
        <div className="space-y-6">
          {/* Métricas Globales de la Revisión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Cobranza Comercial"
              value={`$${(Number(revisionActual.cobranza?.logrado || 44470405) / 1000000).toFixed(1)}M`}
              subtitle={`Meta: $${(Number(revisionActual.cobranza?.presupuestado || 55069189) / 1000000).toFixed(1)}M (${revisionActual.cobranza?.cumplimiento_pct || 81}%)`}
              icon={DollarSign}
              trend={{ positive: true, label: `${revisionActual.cobranza?.cumplimiento_pct || 81}% recaudado` }}
            />
            <StatCard
              title="Muestreos Agua Potable"
              value={`${revisionActual.muestreoAgua?.realizados || 844}`}
              subtitle={`NOM-127 · ${revisionActual.muestreoAgua?.programados || 838} programados`}
              icon={Droplet}
              trend={{ positive: true, label: '100% Conforme' }}
            />
            <StatCard
              title="Eficacia SGC en Auditorías"
              value={`${revisionActual.auditoriasInternas?.promedioSGC || 92}%`}
              subtitle={revisionActual.auditoriasInternas?.rango || 'Rango Aceptable'}
              icon={ShieldCheck}
              trend={{ positive: true, label: 'Auditorías 2026' }}
            />
            <StatCard
              title="Acciones Correctivas"
              value={`${pctCumplimientoAC}%`}
              subtitle={`${acCerradas} de ${totalAC} cerradas`}
              icon={CheckCircle2}
              trend={{ positive: true, label: 'OOMRSC-20 al 100%' }}
            />
          </div>

          {/* Tarjeta de Marco Institucional (Misión, Visión, Código de Conducta) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  OOMRSC-04 REV. 09 · SECCIÓN INSTITUCIONAL
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Marco Estratégico y Compromiso con el SGC
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  revisionActual.estado === 'APROBADA_CERRADA' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {revisionActual.estado === 'APROBADA_CERRADA' ? '✓ Sesión Aprobada y Cerrada' : '⏳ En Proceso de Revisión'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
                <h4 className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Droplet size={15} className="text-sky-600" />
                  Misión Institucional
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  El OOMAPAS de Cajeme es un organismo público al servicio de los habitantes del Municipio, que actúa con disciplina y profesionalismo, aplicando altos estándares de calidad para proveer agua potable, alcantarillado y saneamiento, contribuyendo a mejorar la calidad de vida de la sociedad y el medio ambiente, bajo un esquema de cultura del cuidado y pago del agua.
                </p>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Award size={15} className="text-blue-600" />
                  Visión Institucional
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Ser un organismo innovador y sostenible, líder en acciones de vanguardia, comprometido con la eficiencia, el desarrollo humano y la excelencia en los servicios de potabilización, saneamiento, alcantarillado, así como el reúso y reutilización del agua.
                </p>
              </div>
            </div>

            {/* Código de Conducta y Política de Sanciones OOMYOR-16 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldAlert size={16} className="text-amber-600" />
                <span>Cultura de Calidad y Consecuencias del Incumplimiento (Política OOMYOR-16 Rev. 06)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                El SGC no vive en la oficina de Calidad; vive en la toma de lecturas, ventanillas, mantenimiento de redes, facturación y cobranza. Cada colaborador es responsable de conocer sus procedimientos y cumplir compromisos. El incumplimiento genera consecuencias reales como no conformidades mayores, quejas de usuarios, observaciones de entes fiscalizadores y la aplicación de la <strong>Política de Sanciones OOMYOR-16 Rev. 06</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ENTRADAS ISO 9001 (9.3.2 A - F)                                */}
      {/* ==================================================================== */}
      {tabActiva === 'entradas' && (
        <div className="space-y-6">
          {/* A) Acciones previas y B) Contexto 2026 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Clock size={16} className="text-sky-600" />
                <span>A) Estado de Acciones de Revisiones Previas (9.3.2.a)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {revisionActual.formulariosComplementarios?.acuerdos_previos?.resumen_seguimiento || 'Se cumplieron al 100% las acciones acordadas en la sesión previa de la Alta Dirección.'}
              </p>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Acuerdos anteriores concluidos: <strong>{revisionActual.formulariosComplementarios?.acuerdos_previos?.acuerdos_cumplidos ?? 4}</strong></span>
                <span className="text-emerald-600 font-bold">100% Concluido</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles size={16} className="text-purple-600" />
                <span>B) Cambios en Cuestiones Externas e Internas / ISO 2026 (9.3.2.b)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {revisionActual.cambiosContexto}
              </p>
              <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5 pt-1">
                <ShieldCheck size={14} />
                <span>Incluye Enmiendas de Acción Climática y Gobernanza de IA</span>
              </div>
            </div>
          </div>

          {/* C) Desempeño del SGC: C.1 Satisfacción & Quejas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall size={18} className="text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  C.1) Satisfacción del Cliente y Quejas (9.3.2.c.1)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Línea OOMAPASC · OCI · Contratos y Servicios
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Buzón de Quejas OCI</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {revisionActual.formulariosComplementarios?.quejas_oci?.quejas_recibidas ?? 26} Recibidas
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                  ✓ {revisionActual.formulariosComplementarios?.quejas_oci?.quejas_atendidas ?? 26} Atendidas al 100%
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Atención Telefónica</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {revisionActual.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_telefonica_atencion ?? 97}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Meta: 95%</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Solución Comercial</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {revisionActual.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_telefonica_comercial ?? 100}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Meta: 95%</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Atención en Módulos</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {revisionActual.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_modulos_presencial ?? 100}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Meta: 96%</span>
              </div>
            </div>
          </div>

          {/* C.2 a C.6: Objetivos, Auditorías, AC, Proveedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Objetivos de Calidad */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FlaskConical size={16} className="text-emerald-600" />
                <span>C.2) Objetivos de Calidad y Muestreo de Agua (9.3.2.c.2)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">Muestreo Bacteriológico y Fisicoquímico</span>
                    <span className="text-emerald-700 text-[11px]">NOM-127-SSA1 / NOM-179-SSA1</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-900">
                      {revisionActual.muestreoAgua?.realizados || 844} / {revisionActual.muestreoAgua?.programados || 838}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">100% Conforme</span>
                  </div>
                </div>

                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sky-900 block">Ingresos Cobranza Comercial</span>
                    <span className="text-sky-700 text-[11px]">Presupuesto vs Logrado</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-sky-900">
                      {revisionActual.cobranza?.cumplimiento_pct || 81}%
                    </span>
                    <span className="text-[10px] text-sky-700 block font-mono">
                      ${(Number(revisionActual.cobranza?.logrado || 44470405)).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proveedores de Químicos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Truck size={16} className="text-amber-600" />
                <span>C.6) Desempeño de Proveedores Químicos (9.3.2.c.7)</span>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Lotes de Insumos Inspeccionados:</span>
                  <span className="font-bold text-slate-900">
                    {revisionActual.formulariosComplementarios?.proveedores_quimicos?.lotes_aprobados_inspeccion ?? 42} de {revisionActual.formulariosComplementarios?.proveedores_quimicos?.lotes_solicitados ?? 42}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">% de Aprobación al 100%:</span>
                  <span className="font-bold text-emerald-600">100% Conforme</span>
                </div>
                <p className="text-slate-600 text-[11px] pt-1 border-t border-amber-200/60">
                  {revisionActual.formulariosComplementarios?.proveedores_quimicos?.conclusion_proveedores || 'Recepción ininterrumpida de cloro gas e hipoclorito para potabilización.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SALIDAS 9.3.3, ACUERDOS Y FIRMAS                            */}
      {/* ==================================================================== */}
      {tabActiva === 'salidas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ISO 9001:2015 / 2026 § 9.3.3
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Salidas de la Revisión por la Dirección
                </h3>
              </div>
              {revisionActual.estado !== 'APROBADA_CERRADA' ? (
                <button
                  onClick={handleAprobarRevision}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Aprobar y Cerrar Sesión</span>
                </button>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  Acta Oficial Aprobada
                </span>
              )}
            </div>

            {/* Formulario de Salidas */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  a) Oportunidades de Mejora Dictadas por la Dirección:
                </label>
                <textarea
                  rows={3}
                  value={revisionActual.salidasDireccion?.oportunidadesMejora || ''}
                  onChange={(e) => handleActualizarSalidas('oportunidadesMejora', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                  placeholder="Acciones de mejora continua instruidas..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  b) Cualquier Necesidad de Cambio en el Sistema de Gestión de Calidad:
                </label>
                <textarea
                  rows={2}
                  value={revisionActual.salidasDireccion?.cambiosSGC || ''}
                  onChange={(e) => handleActualizarSalidas('cambiosSGC', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                  placeholder="Actualizaciones a manuales, procesos o matrices de riesgo..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  c) Necesidades de Recursos Asignados / Presupuestados:
                </label>
                <textarea
                  rows={2}
                  value={revisionActual.salidasDireccion?.recursosNecesarios || ''}
                  onChange={(e) => handleActualizarSalidas('recursosNecesarios', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                  placeholder="Presupuestos aprobados, infraestructura o personal..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  d) Acuerdos Finales y Compromiso de la Alta Dirección:
                </label>
                <textarea
                  rows={2}
                  value={revisionActual.salidasDireccion?.acuerdosFinales || ''}
                  onChange={(e) => handleActualizarSalidas('acuerdosFinales', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                  placeholder="Acuerdos institucionales y ratificación del SGC..."
                />
              </div>
            </div>

            {/* Firmas Institucionales */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Firmas Digitales de Conformidad
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-300 mb-2 flex items-center justify-center text-xs text-slate-400 italic">
                    Firma Electrónica
                  </div>
                  <span className="font-bold text-xs text-slate-900 block">DIRECCIÓN GENERAL</span>
                  <span className="text-[10px] text-slate-500 block">OOMAPASC de Cajeme</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-300 mb-2 flex items-center justify-center text-xs text-emerald-600 font-mono font-bold">
                    ✓ VALIDADO SGC
                  </div>
                  <span className="font-bold text-xs text-slate-900 block">{revisionActual.coordinadorSGC}</span>
                  <span className="text-[10px] text-slate-500 block">Coordinador General del SGC</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-300 mb-2 flex items-center justify-center text-xs text-slate-400 italic">
                    Firma Electrónica
                  </div>
                  <span className="font-bold text-xs text-slate-900 block">DIRECTORES DE ÁREA</span>
                  <span className="text-[10px] text-slate-500 block">Técnica · Comercial · Administrativa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONTROL DE CAPTURA DE FORMULARIOS COMPLEMENTARIOS           */}
      {/* ==================================================================== */}
      {tabActiva === 'formularios' && (
        <div className="space-y-6">
          {/* Banner Explicativo de los Primeros 10 Días */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 rounded-2xl border border-sky-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                <Clock size={16} className="text-sky-600" />
                <span>Mecanismo de Captura OOMRSC-04 (Primeros {diaLimiteCaptura} Días del Mes)</span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Los usuarios asignados deben capturar su información en los primeros <strong>{diaLimiteCaptura} días naturales</strong> del corte para consolidar la Revisión por la Dirección sin retrasos normativos.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-700">Progreso:</span>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs">
                <span className={formulariosCompletadosCount === 5 ? 'text-emerald-600' : 'text-amber-600'}>
                  {formulariosCompletadosCount} de 5 Capturados
                </span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Formularios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estatusFormularios.map(form => {
              return (
                <div
                  key={form.id}
                  className={`p-5 rounded-2xl border transition-all bg-white shadow-sm flex flex-col justify-between gap-4 ${
                    form.completado ? 'border-emerald-200 hover:border-emerald-300' : 'border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {form.codigo}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        form.completado 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {form.completado ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {form.completado ? 'Capturado' : 'Pendiente'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">
                      {form.nombre}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {form.descripcion}
                    </p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Área Responsable:</span>
                        <strong className="text-slate-900">{form.areaResponsable}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Responsable Asignado:</span>
                        <strong className="text-slate-900">{form.usuarioAsignado?.nombre || 'No asignado'}</strong>
                      </div>
                      {form.datos?.fechaCaptura && (
                        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>Última captura:</span>
                          <span>{form.datos.fechaCaptura} ({form.datos.capturadoPor})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón Llenar / Modificar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {form.campos.length} campos de captura
                    </span>
                    <button
                      onClick={() => {
                        setFormularioConfigActivo(form);
                        setModalFormularioAbierto(true);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        form.completado
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                      }`}
                    >
                      <Edit3 size={13} />
                      <span>{form.completado ? 'Modificar Información' : 'Llenar Formulario'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALES */}
      <FormularioComplementarioModal
        abierto={modalFormularioAbierto}
        onCerrar={() => {
          setModalFormularioAbierto(false);
          setFormularioConfigActivo(null);
        }}
        formularioConfig={formularioConfigActivo}
        datosActuales={revisionActual.formulariosComplementarios?.[formularioConfigActivo?.id] || {}}
        onGuardar={handleGuardarFormulario}
        usuarioLogueado={usuarioLogueado}
        mes={mesSeleccionado}
        ejercicio={ejercicio}
      />

      <AsignacionResponsablesModal
        abierto={modalAsignacionAbierto}
        onCerrar={() => setModalAsignacionAbierto(false)}
        usuarios={usuarios}
        asignacionesActuales={asignacionesResponsables}
        onGuardarAsignaciones={handleGuardarAsignaciones}
        diaLimiteCaptura={diaLimiteCaptura}
        onGuardarDiaLimite={handleGuardarDiaLimite}
      />
    </div>
  );
}
