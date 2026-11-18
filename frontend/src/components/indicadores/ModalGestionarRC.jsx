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
import CampoFecha from '../common/CampoFecha';
import { CAMPO_TEXTO, Leyenda, Seccion } from '../common/estilosCampos';
import { acDesdeReporteCorreccion } from '../../services/flujoService';
import { estadoRC, etiquetaRC, puedeDictaminarRC, hoyISO } from '../../constants/reportesCorreccion';
import { formatearFecha } from '../../constants/workflow';

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

  const [estado, setEstado] = useState('EN_ATENCION');
  const [causa, setCausa] = useState('');
  const [accion, setAccion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observacionesVerificacion, setObservacionesVerificacion] = useState('');
  const [verificadoPor, setVerificadoPor] = useState('');
  const [fechaVerificacion, setFechaVerificacion] = useState('');

  useEffect(() => {
    if (reporte) {
      setEstado(estadoRC(reporte));
      setCausa(reporte.causa || '');
      setAccion(reporte.accion || '');
      setResponsable(reporte.responsable || '');
      setFechaCompromiso(reporte.fechaCompromiso || '');
      setObservacionesVerificacion(reporte.observacionesVerificacion || '');
      setVerificadoPor(reporte.verificadoPor || usuarioLogueado?.nombre || 'Coordinador SGC');
      setFechaVerificacion(reporte.fechaVerificacion || hoyISO());
    }
  }, [reporte?.id, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- solo al abrir: no borra lo que se escribe

  if (!isOpen || !reporte) return null;
  const abierto = estadoRC(reporte) === 'EN_ATENCION';
  const dictamina = puedeDictaminarRC(usuarioLogueado);
  // El área captura la corrección mientras está abierto; el dictamen (cierre o escalado) es del SGC / auditor.
  const puedeEditar = abierto || dictamina;

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
    toast.success(`Reporte ${reporte.folio} guardado (${etiquetaRC({ estado: nuevoEstado }).label}).`);
    onClose();
  };

  const handleCierreEfectivo = () => {
    if (!observacionesVerificacion.trim()) {
      toast.warning('Por favor ingresa las notas u observaciones de verificación de eficacia.');
      return;
    }
    handleGuardarCambios('CERRADO_EFECTIVO');
  };

  // Regla: un RC no efectivo escala a Acción Correctiva (análisis de causa raíz). Una sola vez.
  const handleCierreNoEfectivo = () => {
    if (!observacionesVerificacion.trim()) {
      toast.warning('Especifica por qué la corrección no resultó efectiva.');
      return;
    }
    if (reporte.folio_ac_vinculado) {
      toast.warning(`Este reporte ya generó la acción ${reporte.folio_ac_vinculado}.`);
      return;
    }
    handleEjecutarEscalamientoAC();
  };

  // Escalamiento a Acción Correctiva formal (OOMRSC-20)
  const handleEjecutarEscalamientoAC = () => {
    const nuevaAccionCorrectiva = acDesdeReporteCorreccion({ ...reporte, causa, accion, responsable, observacionesVerificacion });
    const folioAC = nuevaAccionCorrectiva.folio_provisional;

    // Agregar a la lista de Acciones Correctivas del contexto
    setAccionesCorrectivas?.(prev => [nuevaAccionCorrectiva, ...(prev || [])]);

    // Marcar el RC como escalado
    const reporteEscalado = {
      ...reporte,
      estado: 'ESCALADO_A_AC',
      folio_ac_vinculado: folioAC,
      resultado_cierre: 'NO_EFECTIVO', causa, accion, responsable, fechaCompromiso,
      observacionesVerificacion, verificadoPor: verificadoPor || usuarioLogueado?.nombre || '',
      fechaVerificacion: fechaVerificacion || hoyISO(), fechaUltimaModificacion: new Date().toISOString(),
    };

    onActualizarReporte?.(reporteEscalado);

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'ESCALAR_RC_A_ACCION_CORRECTIVA',
      descripcion: `Escalamiento de Reporte ${reporte.folio} a Acción Correctiva formal ${folioAC}`,
      detalles: `Área: ${reporte.area} · Responsable: ${reporte.responsable}`,
      folio: folioAC
    });

    toast.success(`Reporte ${reporte.folio} cerrado como no efectivo. Se abrió el borrador de Acción Correctiva ${folioAC} en Acciones Correctivas → Por abrir.`, { duracion: 7000 });

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
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-slate-50">
          <Leyenda />

          <Seccion n={1} titulo="Resultado que originó el reporte" ayuda="Datos registrados al emitir el RC; no se editan aquí."
            extra={<span className={`px-3 py-1 rounded-full font-extrabold text-xs border ${etiquetaRC({ estado }).cls}`}>{etiquetaRC({ estado }).label}</span>}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Área responsable', reporte.area || 'Operativa'],
                ['Periodo', [reporte.mes, reporte.ejercicio].filter(Boolean).join(' ') || '—'],
                ['Registrado', formatearFecha(reporte.fechaRegistro) || '—'],
              ].map(([etq, v]) => (
                <label key={etq} className="block">
                  <span className="block text-xs font-bold text-slate-800 mb-1">{etq}</span>
                  <input disabled value={v} className={CAMPO_TEXTO} />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="block text-xs font-bold text-slate-800 mb-1">Desviación</span>
              <textarea disabled rows={2} value={reporte.descripcion || 'Sin descripción detallada.'} className={CAMPO_TEXTO} />
            </label>
            {reporte.folio_ac_vinculado && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-sm font-bold flex items-center gap-2.5">
                <Sparkles size={16} className="text-purple-600" />
                <span>Acción Correctiva generada: <strong className="font-mono text-purple-800">{reporte.folio_ac_vinculado}</strong></span>
              </div>
            )}
          </Seccion>

          <Seccion n={2} titulo="Corrección del área" ayuda="Por qué no se alcanzó la meta y qué se hizo para subsanarlo." color="bg-amber-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-bold text-slate-800">Causa inmediata identificada
                <textarea disabled={!puedeEditar} value={causa} onChange={(e) => setCausa(e.target.value)} rows={4} className={`${CAMPO_TEXTO} mt-1 font-normal`}
                  placeholder="Explicación detallada de por qué no se alcanzó la meta programada..." />
              </label>
              <label className="block text-sm font-bold text-slate-800">Acción de corrección implementada
                <textarea disabled={!puedeEditar} value={accion} onChange={(e) => setAccion(e.target.value)} rows={4} className={`${CAMPO_TEXTO} mt-1 font-normal`}
                  placeholder="Acciones inmediatas que se aplicaron operativamente..." />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm font-bold text-slate-800">Responsable de ejecución
                <input type="text" disabled={!puedeEditar} value={responsable} onChange={(e) => setResponsable(e.target.value)} className={`${CAMPO_TEXTO} mt-1 font-normal`} />
              </label>
              <label className="block text-sm font-bold text-slate-800">Fecha compromiso
                <CampoFecha disabled={!puedeEditar} value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} className={`${CAMPO_TEXTO} mt-1 font-normal`} />
              </label>
            </div>
          </Seccion>

          <Seccion n={3} titulo="Verificación de eficacia" ayuda="La registra el SGC o un auditor: ¿la corrección resolvió la desviación?" color="bg-emerald-700">
            <label className="block text-sm font-bold text-slate-800">Dictamen y notas de verificación
              <textarea disabled={!dictamina} value={observacionesVerificacion} onChange={(e) => setObservacionesVerificacion(e.target.value)} rows={2}
                placeholder="Detalla si la corrección resolvió la desviación y si el indicador volvió a parámetros aceptables..." className={`${CAMPO_TEXTO} mt-1 font-normal`} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm font-bold text-slate-800">Verificado por
                <input type="text" disabled={!dictamina} value={verificadoPor} onChange={(e) => setVerificadoPor(e.target.value)} className={`${CAMPO_TEXTO} mt-1 font-normal`} />
              </label>
              <label className="block text-sm font-bold text-slate-800">Fecha de verificación
                <CampoFecha disabled={!dictamina} value={fechaVerificacion} onChange={(e) => setFechaVerificacion(e.target.value)} className={`${CAMPO_TEXTO} mt-1 font-normal`} />
              </label>
            </div>

            {/* Botones de dictamen: SGC o auditor, y solo mientras el reporte está en atención */}
            {!dictamina && <p className="text-xs text-slate-600">El dictamen de eficacia lo registra el SGC o un auditor.</p>}
            {dictamina && !abierto && <p className="text-xs text-slate-600">Este reporte ya tiene dictamen ({etiquetaRC(reporte).label}); no se modifica.</p>}
            {dictamina && abierto && <div className="pt-2 flex flex-wrap gap-2">
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
                <AlertTriangle size={14} /> No efectivo: escalar a Acción Correctiva
              </button>
            </div>}
          </Seccion>
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

          {puedeEditar && <button
            type="button"
            onClick={() => handleGuardarCambios(estado)}
            className="px-5 py-2 bg-[#0B192C] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Save size={14} /> Guardar Registro
          </button>}
        </div>
      </div>
    </ContenedorModal>
  );
}
