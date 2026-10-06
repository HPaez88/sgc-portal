import React, { useState, useEffect } from 'react';
import {
  FileWarning,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  History,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import { useSGC } from '../../SGCContext';

export default function ModalGestionarRC({
  isOpen,
  onClose,
  reporte = null,
  onActualizarReporte,
  onEscalarAC,
  usuarioLogueado = null
}) {
  const toast = useToast();
  const { setAccionesCorrectivas, registrarMovimiento } = useSGC();

  const [estado, setEstado] = useState('ABIERTO');
  const [causa, setCausa] = useState('');
  const [accion, setAccion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observacionesVerificacion, setObservacionesVerificacion] = useState('');
  const [verificadoPor, setVerificadoPor] = useState('');
  const [fechaVerificacion, setFechaVerificacion] = useState('');

  useEffect(() => {
    if (reporte) {
      setEstado(reporte.estado || 'ABIERTO');
      setCausa(reporte.causa || '');
      setAccion(reporte.accion || '');
      setResponsable(reporte.responsable || '');
      setFechaCompromiso(reporte.fechaCompromiso || '');
      setObservacionesVerificacion(reporte.observacionesVerificacion || '');
      setVerificadoPor(reporte.verificadoPor || usuarioLogueado?.nombre || 'Coordinador SGC');
      setFechaVerificacion(reporte.fechaVerificacion || new Date().toISOString().split('T')[0]);
    }
  }, [reporte, usuarioLogueado, isOpen]);

  if (!isOpen || !reporte) return null;

  const handleGuardarCambios = (nuevoEstado = estado) => {
    const reporteActualizado = {
      ...reporte,
      estado: nuevoEstado,
      causa,
      accion,
      responsable,
      fechaCompromiso,
      observacionesVerificacion,
      verificadoPor,
      fechaVerificacion,
      fechaUltimaModificacion: new Date().toISOString()
    };

    onActualizarReporte?.(reporteActualizado);
    toast.success(`Reporte de Corrección [${reporte.folio}] actualizado (Estatus: ${nuevoEstado}).`);
    onClose();
  };

  const handleCierreEfectivo = () => {
    if (!observacionesVerificacion.trim()) {
      toast.warning('Por favor ingresa las notas u observaciones de verificación de eficacia.');
      return;
    }
    handleGuardarCambios('CERRADO_EFECTIVO');
  };

  const handleCierreNoEfectivo = () => {
    if (!observacionesVerificacion.trim()) {
      toast.warning('Por favor especifica las razones por las cuales el cierre no resultó efectivo.');
      return;
    }
    handleGuardarCambios('CERRADO_NO_EFECTIVO');
  };

  // Escalamiento a Acción Correctiva formal (OOMRSC-20)
  const handleEjecutarEscalamientoAC = () => {
    const anioActual = reporte.ejercicio || new Date().getFullYear();
    const folioAC = `AC-${anioActual}-RC${reporte.numeroIndicador !== undefined ? reporte.numeroIndicador : (reporte.id % 100)}`;

    const nuevaAccionCorrectiva = {
      id: Date.now(),
      folio: folioAC,
      folio_codigo: folioAC,
      origen: 'INDICADORES_RC',
      tipo: 'NO_CONFORMIDAD',
      proceso: reporte.proceso || 'Responsabilidad de la Dirección',
      area: reporte.area || 'Operativa',
      responsable: reporte.responsable || usuarioLogueado?.nombre || 'Responsable de Área',
      descripcion: `Desviación no subsanada desde Reporte de Corrección ${reporte.folio}. ${reporte.descripcion || ''}`,
      causa_raiz: reporte.causa || 'Causa no resuelta en ciclo de corrección operativa.',
      accion_inmediata: reporte.accion || 'Corrección operativa previa aplicada sin eficacia sostenible.',
      estado: 'BORRADOR',
      fecha_solicitud: new Date().toISOString().split('T')[0],
      fecha_compromiso: fechaCompromiso || new Date().toISOString().split('T')[0],
      reporte_correccion_origen: reporte.folio,
      indicador_relacionado_id: reporte.indicadorId
    };

    // Agregar a la lista de Acciones Correctivas del contexto
    setAccionesCorrectivas?.(prev => [nuevaAccionCorrectiva, ...(prev || [])]);

    // Marcar el RC como escalado
    const reporteEscalado = {
      ...reporte,
      estado: 'ESCALADO_A_AC',
      folio_ac_vinculado: folioAC,
      observacionesVerificacion: observacionesVerificacion || `Escalado a Acción Correctiva formal ${folioAC} por ineficacia de corrección o criticidad.`,
      verificadoPor: verificadoPor || usuarioLogueado?.nombre || 'Coordinador SGC',
      fechaVerificacion: new Date().toISOString().split('T')[0]
    };

    onActualizarReporte?.(reporteEscalado);

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'ESCALAR_RC_A_ACCION_CORRECTIVA',
      descripcion: `Escalamiento de Reporte ${reporte.folio} a Acción Correctiva formal ${folioAC}`,
      detalles: `Área: ${reporte.area} · Responsable: ${reporte.responsable}`,
      folio: folioAC
    });

    toast.success(
      `Reporte escalado con éxito a Acción Correctiva ${folioAC}. Puedes darle seguimiento en el módulo de Acciones Correctivas (OOMRSC-20).`,
      { duracion: 7000 }
    );

    onEscalarAC?.(nuevaAccionCorrectiva);
    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="4xl" anchoMaximo="max-w-[92vw] xl:max-w-[1350px]">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full">
        {/* Cabecera */}
        <div className="bg-[#0B192C] text-white p-5 sm:p-6 flex items-center justify-between border-b border-sky-900/50">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
              <FileWarning size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-lg border border-sky-800">
                  {reporte.folio}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Ejercicio {reporte.ejercicio || '2026'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">
                Gestión y Verificación de Reporte de Corrección (RC)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Banner de Estado */}
          <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold bg-slate-50 border-slate-200">
            <span className="text-slate-700 text-sm">Estatus del Reporte de Corrección:</span>
            <span className={`px-4 py-1.5 rounded-full font-extrabold text-xs border ${
              estado === 'CERRADO_EFECTIVO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              estado === 'CERRADO_NO_EFECTIVO' ? 'bg-rose-100 text-rose-800 border-rose-300' :
              estado === 'ESCALADO_A_AC' ? 'bg-purple-100 text-purple-800 border-purple-300' :
              'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {estado === 'CERRADO_EFECTIVO' && '✓ Cierre Efectivo'}
              {estado === 'CERRADO_NO_EFECTIVO' && '✕ Cierre No Efectivo'}
              {estado === 'ESCALADO_A_AC' && '⚡ Escalado a Acción Correctiva (OOMRSC-20)'}
              {(estado === 'ABIERTO' || estado === 'EN_ATENCION') && '⏳ En Atención Operativa'}
            </span>
          </div>

          {/* Información del Indicador y Área */}
          <div className="p-5 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sky-950 flex items-center gap-2">
                <Building2 size={16} className="text-sky-700" />
                Área Responsable: {reporte.area || 'Operativa'}
              </span>
              <span className="text-slate-500 font-mono font-bold">
                Mes: {reporte.mes || 'Oct'}
              </span>
            </div>
            <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
              <strong className="text-slate-900">Desviación Operativa:</strong> {reporte.descripcion || 'Sin descripción detallada.'}
            </p>
            {reporte.folio_ac_vinculado && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 font-bold flex items-center gap-2.5">
                <Sparkles size={16} className="text-purple-600" />
                <span>Acción Correctiva Oficial Generada: <strong className="font-mono text-purple-800">{reporte.folio_ac_vinculado}</strong></span>
              </div>
            )}
          </div>

          {/* Formulario de Análisis y Corrección en 2 Columnas Espaciosas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Causa Inmediata Identificada
                </label>
                <textarea
                  value={causa}
                  onChange={(e) => setCausa(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
                  placeholder="Explicación detallada de por qué no se alcanzó la meta programada..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Acción de Corrección Implementada
                </label>
                <textarea
                  value={accion}
                  onChange={(e) => setAccion(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
                  placeholder="Acciones correctivas inmediatas que se aplicaron operativamente..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Responsable de Ejecución
                </label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Compromiso
                </label>
                <input
                  type="date"
                  value={fechaCompromiso}
                  onChange={(e) => setFechaCompromiso(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sección de Verificación y Cierre SGC */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck size={15} className="text-emerald-600" />
              Verificación de Eficacia (Auditoría / Coordinación SGC)
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dictamen y Notas de Verificación de Eficacia
              </label>
              <textarea
                value={observacionesVerificacion}
                onChange={(e) => setObservacionesVerificacion(e.target.value)}
                rows={2}
                placeholder="Detalla si la corrección resolvió la desviación y si el indicador volvió a parámetros aceptables..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Verificado por:</label>
                <input
                  type="text"
                  value={verificadoPor}
                  onChange={(e) => setVerificadoPor(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Fecha de Verificación:</label>
                <input
                  type="date"
                  value={fechaVerificacion}
                  onChange={(e) => setFechaVerificacion(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Botones de Dictamen */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCierreEfectivo}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} /> Marcar Cierre Efectivo
              </button>

              <button
                type="button"
                onClick={handleCierreNoEfectivo}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle size={14} /> Marcar Cierre No Efectivo
              </button>

              <button
                type="button"
                onClick={handleEjecutarEscalamientoAC}
                className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Genera automáticamente un registro en Acciones Correctivas (OOMRSC-20)"
              >
                <Sparkles size={14} /> Escalar a Acción Correctiva (OOMRSC-20)
              </button>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={() => handleGuardarCambios(estado)}
            className="px-5 py-2 bg-[#0B192C] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Save size={14} /> Guardar Registro
          </button>
        </div>
      </div>
    </ContenedorModal>
  );
}
