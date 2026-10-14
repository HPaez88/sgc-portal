import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  Sparkles,
  Bot,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  X,
  Send,
  Lock,
  Info
} from 'lucide-react';
import ContenedorModal from './ContenedorModal';

/**
 * ModalConfirmacionResponsabilidadHumana
 * Cumplimiento normativo ISO 9001 § 10.2 / § 10.3, ISO 42001 & POL-TI-01 (Gobernanza de IA)
 * Exige revisión humana obligatoria, lectura integral, aceptación de responsabilidad operativa
 * y escritura exacta de la palabra "CONFIRMAR" antes de remitir un expediente al SGC.
 */
export default function ModalConfirmacionResponsabilidadHumana({
  isOpen,
  onClose,
  onConfirmar,
  tipo = 'ACCION_CORRECTIVA', // 'ACCION_CORRECTIVA' | 'PLAN_MEJORA'
  registro = {},
  equipo = [],
  actividades = [],
  causas = [],
  usuarioLogueado = {},
  loading = false
}) {
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [checkboxAcepto, setCheckboxAcepto] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Resetear estados al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setTextoConfirmacion('');
      setCheckboxAcepto(false);
      setErrorValidacion('');
    }
  }, [isOpen]);

  const esAccionCorrectiva = tipo === 'ACCION_CORRECTIVA';
  const claveFormato = esAccionCorrectiva ? 'OOMRSC-20' : 'OOMRSC-21';
  const nombreFormato = esAccionCorrectiva
    ? 'Acción Correctiva (No Conformidad)'
    : 'Plan de Mejora Continua';
  const clausulaISO = esAccionCorrectiva ? 'ISO 9001:2026 § 10.2' : 'ISO 9001:2026 § 10.3';

  const tieneContenidoIA = Boolean(
    registro.fecha_generacion_ia ||
    registro.descripcion_no_conformidad_ia ||
    registro.es_generado_ia ||
    registro.diagnostico_ia
  );

  const esTextoValido = textoConfirmacion.trim().toUpperCase() === 'CONFIRMAR';
  const formularioValido = esTextoValido && checkboxAcepto;

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!checkboxAcepto) {
      setErrorValidacion('Debes marcar la casilla de ratificación y aceptación de responsabilidad.');
      return;
    }
    if (!esTextoValido) {
      setErrorValidacion('Debes escribir textualmente la palabra CONFIRMAR en el campo indicado.');
      return;
    }

    setErrorValidacion('');
    onConfirmar({
      ratificacion_humana: true,
      ratificado_por: usuarioLogueado?.nombre || 'Titular / Responsable',
      ratificado_email: usuarioLogueado?.email || '',
      fecha_ratificacion: new Date().toISOString(),
      declaracion: 'Supervisión y ratificación humana completada conforme a ISO & POL-TI-01'
    });
  };

  const nombreUsuario = usuarioLogueado?.nombre || 'Usuario Responsable';
  const areaUsuario = registro.area || usuarioLogueado?.area || 'Área Operativa';

  return (
    <ContenedorModal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      anchoMaximo="max-w-[94vw] xl:max-w-[1400px]"
      backdropClassName="bg-black/70 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER INSTITUCIONAL */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  GOBERNANZA POL-TI-01
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs font-bold text-sky-300">{clausulaISO}</span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white mt-0.5">
                Supervisión Humana y Envío para Aprobación SGC
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE EN 2 COLUMNAS AMPLIAS */}
        <form onSubmit={handleEnviar} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: RESUMEN NORMATIVO Y EXPEDIENTE */}
            <div className="space-y-4">
              {/* BANNER INFORMATIVO DE CUMPLIMIENTO ISO */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 rounded-xl flex items-start gap-3">
                <Scale size={20} className="text-sky-700 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-950 space-y-1">
                  <p className="font-bold text-sky-900">
                    Requisito Oficial de Supervisión Humana (Human-in-the-Loop):
                  </p>
                  <p className="text-sky-800 leading-relaxed">
                    Conforme a la Política Institucional de Gobernanza de IA (<strong>POL-TI-01</strong>) y las normas <strong>ISO 9001</strong> e <strong>ISO 42001</strong>, todo expediente generado o estructurado con apoyo de Inteligencia Artificial debe ser validado por el personal responsable antes de ingresar al flujo oficial de aprobación del SGC.
                  </p>
                </div>
              </div>

              {/* FICHA RESUMEN DEL EXPEDIENTE A ENVIAR */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#002855]" />
                    <span className="font-extrabold text-xs text-slate-800">
                      {claveFormato} · {nombreFormato}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                    {registro.folio_codigo || registro.folio || 'Borrador'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Área / Coordinación:</span>
                    <span className="font-bold text-slate-800">{registro.area || registro.gerencia_coordinacion || 'Área no definida'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Proceso Afectado / Categoría:</span>
                    <span className="font-bold text-slate-800">{registro.proceso || registro.categoria_mejora || 'General'}</span>
                  </div>
                </div>

                {/* Resumen del hallazgo o mejora */}
                <div className="pt-2 border-t border-slate-200/70 text-xs space-y-1.5">
                  <span className="text-slate-500 font-semibold block text-[11px]">
                    {esAccionCorrectiva ? 'Descripción de la No Conformidad y Causa Raíz:' : 'Situación Actual y Título de la Mejora:'}
                  </span>
                  <p className="font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed max-h-36 overflow-y-auto text-xs">
                    {esAccionCorrectiva
                      ? (registro.descripcion_no_conformidad_final || registro.descripcion_no_conformidad_original || registro.descripcion_no_conformidad_ia || 'Sin descripción')
                      : (registro.titulo_mejora || registro.descripcion_situacion_actual || 'Sin título')}
                  </p>
                </div>

                {/* Conteos de equipo y actividades */}
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <UserCheck size={14} className="text-sky-600" />
                    Equipo: <strong>{equipo.length} integrante(s)</strong>
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar size={14} className="text-emerald-600" />
                    Plan de Acción: <strong>{actividades.length} actividad(es)</strong>
                  </span>
                  {tieneContenidoIA && (
                    <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                      <Sparkles size={12} /> Análisis con IA
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: DECLARACIÓN JURADA Y RATIFICACIÓN ESCRITA */}
            <div className="space-y-4">
              {/* DECLARACIÓN JURADA Y COMPROMISO OPERATIVO */}
              <div className="p-4 bg-amber-50/70 border border-amber-300/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>DECLARACIÓN DE RESPONSABILIDAD OPERATIVA Y SEGUIMIENTO</span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed italic bg-white/90 p-3.5 rounded-lg border border-amber-200">
                  "Yo, <strong>{nombreUsuario}</strong>, adscrito(a) a <strong>{areaUsuario}</strong>, declaro formalmente que he revisado en su totalidad la información técnica contenida en este formato {claveFormato}, validando que las causas identificadas y el plan de actividades son viables, veraces y corresponden a la realidad operativa. Asumo el compromiso de dar seguimiento oportuno a las fechas límite, ejecutar las acciones preventivas/correctivas y recopilar las evidencias documentales requeridas para las auditorías del SGC."
                </p>

                {/* Checkbox de aceptación explícita */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 bg-white/60 p-2 rounded-lg border border-amber-200/60">
                  <input
                    type="checkbox"
                    checked={checkboxAcepto}
                    onChange={(e) => {
                      setCheckboxAcepto(e.target.checked);
                      if (e.target.checked) setErrorValidacion('');
                    }}
                    className="mt-0.5 w-4 h-4 text-[#002855] rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 select-none">
                    He leído y verificado la información técnica generada y acepto la responsabilidad de seguimiento y ejecución operativa.
                  </span>
                </label>
              </div>

              {/* PALABRA DE CONFIRMACIÓN ESTRICTA */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Para autorizar el envío a revisión del SGC, escribe la palabra <span className="text-rose-600 font-mono tracking-wider font-black px-1.5 py-0.5 bg-rose-50 rounded border border-rose-200">CONFIRMAR</span> en el campo:
                </label>
                <input
                  type="text"
                  value={textoConfirmacion}
                  onChange={(e) => {
                    setTextoConfirmacion(e.target.value);
                    if (e.target.value.trim().toUpperCase() === 'CONFIRMAR') {
                      setErrorValidacion('');
                    }
                  }}
                  placeholder="Escribe CONFIRMAR aquí..."
                  className={`w-full px-4 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl border transition-all outline-hidden ${
                    esTextoValido
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500'
                  }`}
                />
                {esTextoValido && (
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Palabra de ratificación válida. Listo para enviar al SGC.
                  </p>
                )}
              </div>

              {/* MENSAJE DE ERROR SI FALTA ALGO */}
              {errorValidacion && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>{errorValidacion}</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar / Regresar a Editar
            </button>

            <button
              type="submit"
              disabled={!formularioValido || loading}
              className="px-7 py-3 text-xs font-black text-white bg-gradient-to-r from-[#002855] to-[#1E3E62] hover:from-[#001d40] hover:to-[#0B192C] rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} />
              <span>{loading ? 'Enviando al SGC...' : 'Confirmar y Enviar al SGC para Aprobación'}</span>
            </button>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}
