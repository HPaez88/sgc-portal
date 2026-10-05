import React, { useState } from 'react';
import { ORIGENES_AC, ROLES_EQUIPO } from '../../constants';
import { useSGC } from '../../SGCContext';
import { generarPropuestaIA } from './AccionesAI';
import { 
  Sparkles, 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Trash2,
  FileCheck2,
  Lock
} from 'lucide-react';

export default function AccionesWizard({
  step, setStep, form, setForm, error, setError, mensaje, setMensaje,
  equipo, setEquipo, causas, setCausas, actividades, setActividades,
  loading, guardarBorrador, setVista, getBotonesWorkflow, getEstadoColor, getEstadoLabel
}) {
  const { areas, procesos, usuarioLogueado, puedeTodasAreas } = useSGC();
  const [generandoIA, setGenerandoIA] = useState(false);

  // Si el usuario es Encargado o Usuario, fijar obligatoriamente su área
  React.useEffect(() => {
    if (!puedeTodasAreas && usuarioLogueado?.area && form.area !== usuarioLogueado.area) {
      setForm(f => ({ ...f, area: usuarioLogueado.area }));
    }
  }, [puedeTodasAreas, usuarioLogueado, form.area, setForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value});
    setError('');
  };

  const agregarIntegrante = () => {
    if (equipo.length < 10) {
      setEquipo([...equipo, { 
        id: Date.now(), nombre: '', puesto: '', area: '', 
        rol: 'Integrante área involucrada', es_responsable_principal: false, firma_digital: '' 
      }]);
    }
  };

  const eliminarIntegrante = (id) => {
    if (equipo.length > 1) {
      setEquipo(equipo.filter(e => e.id !== id));
    }
  };

  const actualizarIntegrante = (id, campo, valor) => {
    const nuevo = equipo.map(e => {
      if (e.id === id) {
        const updated = { ...e, [campo]: valor };
        if (campo === 'es_responsable_principal' && valor) {
          updated.es_responsable_principal = true;
        }
        return updated;
      }
      if (campo === 'es_responsable_principal' && valor) {
        return { ...e, es_responsable_principal: false };
      }
      return e;
    });
    setEquipo(nuevo);
    setError('');
  };

  // === VALIDACIONES ESTRICTAS (TODOS LOS CAMPOS OBLIGATORIOS) ===
  const validarPaso1 = () => {
    if (!form.area?.trim()) return 'Debe seleccionar el Área responsable.';
    if (!form.proceso?.trim()) return 'Debe seleccionar el Proceso afectado.';
    if (!form.origen?.trim()) return 'Debe seleccionar el Origen de la no conformidad.';
    if (form.origen === 'Auditoría' && !form.numero_auditoria?.trim()) {
      return 'El Número de Auditoría es obligatorio cuando el origen es Auditoría.';
    }
    if (!form.descripcion_no_conformidad_original?.trim() || form.descripcion_no_conformidad_original.trim().length < 10) {
      return 'Debe capturar la Descripción de la No Conformidad (mínimo 10 caracteres).';
    }
    if (form.impacta_otros_procesos === 'SI' && !form.otros_procesos_afectados?.trim()) {
      return 'Debe especificar qué otros procesos se ven afectados.';
    }
    return null;
  };
  const paso1Completo = !validarPaso1();

  const validarPaso2 = () => {
    if (!equipo || equipo.length < 3) {
      return 'Se requiere un mínimo de 3 integrantes en el equipo de análisis (ISO 9001).';
    }
    for (let i = 0; i < equipo.length; i++) {
      const m = equipo[i];
      if (!m.nombre?.trim()) return `El integrante #${i + 1} debe tener nombre capturado.`;
      if (!m.puesto?.trim()) return `El integrante #${i + 1} (${m.nombre}) debe tener puesto capturado.`;
      if (!m.area?.trim()) return `El integrante #${i + 1} (${m.nombre}) debe tener área capturada.`;
      if (!m.rol?.trim()) return `El integrante #${i + 1} (${m.nombre}) debe tener rol asignado.`;
    }
    const numResp = equipo.filter(e => e.es_responsable_principal).length;
    if (numResp === 0) {
      return 'Debe marcar a uno de los integrantes como Responsable Principal.';
    }
    return null;
  };
  const paso2Completo = !validarPaso2();

  const validarPaso3 = () => {
    if (!form.accion_contenedora?.trim()) return 'Debe capturar la Acción Inmediata de Contención.';
    if (!form.responsable_actividad_inmediata?.trim()) return 'Debe asignar el Responsable de la acción inmediata.';
    if (!form.fecha_actividad_inmediata?.trim()) return 'Debe indicar la Fecha de Ejecución de la acción inmediata.';
    
    // Causas
    if (!causas || causas.length === 0 || causas.some(c => !c.causa?.trim())) {
      return 'Todas las causas potenciales deben tener texto capturado.';
    }
    if (!causas.some(c => c.es_causa_principal)) {
      return 'Debe seleccionar cuál de las causas es la Causa Principal.';
    }
    
    // Actividades
    if (!actividades || actividades.length === 0) {
      return 'Debe registrar al menos una actividad correctiva.';
    }
    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      if (!act.actividad?.trim()) return `La actividad correctiva #${i + 1} debe tener descripción.`;
      if (!act.responsable?.trim()) return `La actividad #${i + 1} debe tener responsable asignado.`;
      if (!act.fecha_termino_sugerida?.trim()) return `La actividad #${i + 1} debe tener fecha compromiso.`;
      if (!act.evidencia_esperada?.trim()) return `La actividad #${i + 1} debe tener evidencia esperada.`;
    }
    return null;
  };

  const handleAvanzarPaso2 = () => {
    const errorP1 = validarPaso1();
    if (errorP1) {
      setError(errorP1);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleAvanzarPaso3Manual = () => {
    const errorP2 = validarPaso2();
    if (errorP2) {
      setError(errorP2);
      return;
    }
    setError('');
    setStep(3);
  };

  const procesarGeneracionIA = async () => {
    const errorP1 = validarPaso1();
    if (errorP1) { setError(errorP1); setStep(1); return; }
    
    const errorP2 = validarPaso2();
    if (errorP2) { setError(errorP2); return; }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const iaData = await generarPropuestaIA(form, equipo);
      
      setForm(f => ({
        ...f,
        descripcion_no_conformidad_ia: iaData.registro?.descripcion_no_conformidad_mejorada || form.descripcion_no_conformidad_original,
        descripcion_no_conformidad_final: iaData.registro?.descripcion_no_conformidad_mejorada || form.descripcion_no_conformidad_original,
        impacta_otros_procesos: iaData.registro?.impacta_otros_procesos || 'NO',
        otros_procesos_afectados: iaData.registro?.otros_procesos_afectados || '',
        accion_contenedora: iaData.analisis?.accion_contenedora || 'Contención inmediata de la desviación en campo.',
        actividad_inmediata: iaData.analisis?.actividad_inmediata?.actividad || 'Verificación y mitigación emergente.',
        responsable_actividad_inmediata: iaData.analisis?.actividad_inmediata?.responsable || equipo.find(e => e.es_responsable_principal)?.nombre || equipo[0]?.nombre || '',
        fecha_actividad_inmediata: iaData.analisis?.actividad_inmediata?.fecha_sugerida || new Date().toISOString().split('T')[0],
        herramienta_analisis: 'Lluvia de ideas / Ishikawa',
        requiere_actualizar_matriz_riesgos: iaData.analisis?.requiere_actualizar_matriz_riesgos || 'SI',
        descripcion_riesgo_oportunidad: iaData.analisis?.descripcion_riesgo_oportunidad || 'Riesgo de recurrencia operacional.',
        requiere_cambio_sgc: iaData.actividades?.requiere_cambio_sgc || 'SI',
        estado: 'BORRADOR',
        fecha_generacion_ia: new Date().toISOString()
      }));
      
      if (iaData.analisis?.causas && iaData.analisis.causas.length > 0) {
        setCausas(iaData.analisis.causas);
      }
      
      if (iaData.actividades?.actividades_correctivas && iaData.actividades.actividades_correctivas.length > 0) {
        const respPrincipal = equipo.find(e => e.es_responsable_principal)?.nombre || equipo[0]?.nombre || '';
        const nuevasActividades = iaData.actividades.actividades_correctivas.map((a, i) => ({
          id: i + 1,
          actividad: a.actividad || '',
          responsable: a.responsable || respPrincipal,
          indicador_progreso: a.indicador_progreso || '100% implementado',
          fecha_termino_sugerida: a.fecha_termino_sugerida || '',
          evidencia_esperada: a.evidencia_esperada || 'Reporte firmado y evidencia objetiva',
          evidencia_cargada: '',
          resultado_verificado_auditor: '',
          estatus: 'PENDIENTE',
          primer_replanteo_fecha: '',
          primer_replanteo_justificacion: '',
          segundo_replanteo_fecha: '',
          segundo_replanteo_justificacion: ''
        }));
        setActividades(nuevasActividades);
      }
      
      setMensaje('✨ Estructura de Acción Correctiva generada exitosamente conforme a ISO 9001:2015.');
      setStep(3);
    } catch (err) {
      console.error('Error generando propuesta:', err);
      setError(`No se pudo completar el análisis: ${err.message}`);
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleGuardarValidado = () => {
    const errorP3 = validarPaso3();
    if (errorP3) {
      setError(errorP3);
      return;
    }
    setError('');
    guardarBorrador();
  };

  const pasos = [
    { num: 1, titulo: '1. Detección del Hallazgo', subtitulo: 'Datos del área y no conformidad' },
    { num: 2, titulo: '2. Equipo de Trabajo', subtitulo: 'Integrantes requeridos' },
    { num: 3, titulo: '3. Plan y Causa Raíz', subtitulo: 'Acciones correctivas y evidencias' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Stepper */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-card-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
                FORMATO OFICIAL OOMRSC-20
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">ISO 9001:2015 §10.2</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Registro de Acción Correctiva
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Etapa:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#0B192C] text-white">
              Paso {step} de 3
            </span>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {pasos.map((p) => {
            const isCompleted = step > p.num;
            const isCurrent = step === p.num;
            const canNavigate = p.num === 1 || (p.num === 2 && paso1Completo) || (p.num === 3 && paso1Completo && paso2Completo);
            return (
              <button
                key={p.num}
                type="button"
                onClick={() => {
                  if (canNavigate) {
                    setError('');
                    setStep(p.num);
                  }
                }}
                disabled={!canNavigate}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isCurrent 
                    ? 'bg-sky-50/80 border-sky-400 text-sky-950 shadow-2xs ring-2 ring-sky-500/10' 
                    : isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70 cursor-pointer'
                      : 'bg-white border-slate-200/60 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  isCurrent 
                    ? 'bg-sky-600 text-white shadow-2xs' 
                    : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? <CheckCircle2 size={16} /> : p.num}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-slate-900">{p.titulo}</p>
                  <p className="text-[11px] text-slate-500 truncate">{p.subtitulo}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-xl shadow-2xs flex items-center justify-between gap-3 animate-slide-down">
          <p className="text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            {error}
          </p>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-700 text-xs font-bold">✕</button>
        </div>
      )}

      {mensaje && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl shadow-2xs flex items-center justify-between gap-3 animate-slide-down">
          <p className="text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {mensaje}
          </p>
          <button onClick={() => setMensaje('')} className="text-emerald-400 hover:text-emerald-700 text-xs font-bold">✕</button>
        </div>
      )}

      {/* STEP 1: Datos Generales y Detección */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ClipboardList size={18} className="text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">1. Clasificación del Hallazgo (Campos Obligatorios)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Área Responsable <span className="text-rose-500">*</span></span>
                  {!puedeTodasAreas && usuarioLogueado?.area && (
                    <span className="text-[10px] text-amber-700 font-mono font-bold flex items-center gap-1">
                      <Lock size={11} /> Delimitado a tu área
                    </span>
                  )}
                </label>
                {!puedeTodasAreas && usuarioLogueado?.area ? (
                  <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>{usuarioLogueado.area}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-mono">
                      {usuarioLogueado.rol}
                    </span>
                  </div>
                ) : (
                  <select 
                    name="area" 
                    value={form.area} 
                    onChange={handleChange} 
                    className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                      !form.area ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Seleccionar área obligatoria --</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Proceso Afectado <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="proceso" 
                  value={form.proceso} 
                  onChange={handleChange} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                    !form.proceso ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Seleccionar proceso obligatorio --</option>
                  {procesos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Origen de la No Conformidad <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="origen" 
                  value={form.origen} 
                  onChange={handleChange} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                    !form.origen ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Seleccionar origen obligatorio --</option>
                  {ORIGENES_AC.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Número de Auditoría {form.origen === 'Auditoría' && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="text" 
                  name="numero_auditoria" 
                  value={form.numero_auditoria} 
                  onChange={handleChange}
                  placeholder={form.origen === 'Auditoría' ? 'Ej. AUD-INT-2026-01 (Obligatorio)' : 'Solo si proviene de auditoría'}
                  disabled={form.origen !== 'Auditoría'} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                    form.origen === 'Auditoría' && !form.numero_auditoria ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                2. Descripción de la No Conformidad <span className="text-rose-500">*</span>
              </h3>
            </div>

            <textarea 
              name="descripcion_no_conformidad_original" 
              value={form.descripcion_no_conformidad_original} 
              onChange={handleChange}
              rows={4} 
              className={`w-full p-3 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                !form.descripcion_no_conformidad_original ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
              placeholder="Capture detalladamente el hecho, la desviación detectada y la evidencia objetiva observada..." 
            />

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700">¿Esta situación impacta a otros procesos del organismo?</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="radio" name="impacta_otros_procesos" value="NO" checked={form.impacta_otros_procesos === 'NO'} onChange={handleChange} className="w-4 h-4 text-sky-600" />
                  No impacta
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="radio" name="impacta_otros_procesos" value="SI" checked={form.impacta_otros_procesos === 'SI'} onChange={handleChange} className="w-4 h-4 text-sky-600" />
                  Sí impacta
                </label>
              </div>
            </div>

            {form.impacta_otros_procesos === 'SI' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procesos Afectados <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  name="otros_procesos_afectados" 
                  value={form.otros_procesos_afectados} 
                  onChange={handleChange}
                  rows={2} 
                  className={`w-full p-3 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none ${
                    !form.otros_procesos_afectados ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Especifique qué otros procesos se ven afectados..." 
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-between items-center border-t border-slate-200 pt-4">
            <button onClick={() => setVista('lista')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAvanzarPaso2}
                disabled={!paso1Completo}
                className={`px-6 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                  paso1Completo 
                    ? 'bg-[#0B192C] hover:bg-[#152e4d] text-white cursor-pointer' 
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {!paso1Completo && <Lock size={13} />}
                Continuar a Equipo de Trabajo <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Equipo de Trabajo y Asistente SGC */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-sky-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    Equipo de Trabajo Multidisciplinario <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Requisito ISO 9001: Mínimo 3 integrantes con todos los campos capturados y exactamente un Responsable Principal.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Nombre Completo *</th>
                    <th className="p-3">Puesto *</th>
                    <th className="p-3">Área *</th>
                    <th className="p-3">Rol *</th>
                    <th className="p-3 text-center">Responsable Principal *</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipo.map((integrante, i) => (
                    <tr key={integrante.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={integrante.nombre} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !integrante.nombre?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Nombre y apellido..." 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={integrante.puesto} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'puesto', e.target.value)}
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !integrante.puesto?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Puesto oficial..." 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={integrante.area} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'area', e.target.value)}
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !integrante.area?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Área de adscripción..." 
                        />
                      </td>
                      <td className="p-2">
                        <select 
                          value={integrante.rol} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:border-sky-500 outline-none"
                        >
                          {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center align-middle">
                        <input 
                          type="checkbox" 
                          checked={integrante.es_responsable_principal} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'es_responsable_principal', e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 cursor-pointer" 
                        />
                      </td>
                      <td className="p-2 text-center align-middle">
                        <button 
                          onClick={() => eliminarIntegrante(integrante.id)} 
                          disabled={equipo.length <= 3}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded disabled:opacity-20 transition-colors"
                          title={equipo.length <= 3 ? 'Mínimo 3 integrantes requeridos' : 'Eliminar'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-1">
              <button 
                onClick={agregarIntegrante} 
                disabled={equipo.length >= 10}
                className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-lg border border-sky-200/80 transition-colors disabled:opacity-50"
              >
                + Agregar otro integrante al equipo
              </button>
              <span className={`text-xs font-mono font-bold ${paso2Completo ? 'text-emerald-600' : 'text-amber-600'}`}>
                {paso2Completo ? '✓ Equipo completo y válido' : '⚠️ Faltan datos por capturar en el equipo'}
              </span>
            </div>
          </div>

          {/* Acciones del Asistente */}
          <div className="bg-gradient-to-r from-[#0A1424] via-[#0E2038] to-[#122A4C] p-6 rounded-2xl text-white shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles size={16} /> Asistente de Calidad ISO 9001:2015
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Estructurar Plan y Causa Raíz
            </h3>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              El asistente estructurará la contención inmediata, ponderará las causas raíz y formulará las actividades con evidencias verificables.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button 
                onClick={procesarGeneracionIA} 
                disabled={generandoIA || !paso2Completo}
                className={`px-6 py-3 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  paso2Completo && !generandoIA
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {generandoIA ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Estructurando Acción Correctiva...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Estructurar con Asistente SGC
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={handleAvanzarPaso3Manual}
                disabled={!paso2Completo}
                className={`px-4 py-3 text-xs font-semibold rounded-xl border transition-colors ${
                  paso2Completo 
                    ? 'bg-white/10 hover:bg-white/15 text-white border-white/15 cursor-pointer' 
                    : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                }`}
              >
                Continuar a captura manual →
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-between items-center border-t border-slate-200 pt-4">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Volver a Detección
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Análisis y Plan de Actividades */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Contención Inmediata */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  1. Acción Contenedora / Inmediata <span className="text-rose-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500">¿Qué se hizo de forma emergente para evitar que el problema continúe?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acción Inmediata de Contención <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  name="accion_contenedora" 
                  value={form.accion_contenedora} 
                  onChange={handleChange}
                  rows={2} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none ${
                    !form.accion_contenedora?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Acción ejecutada de inmediato para mitigar el impacto..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Responsable Inmediato <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="responsable_actividad_inmediata" 
                  value={form.responsable_actividad_inmediata} 
                  onChange={handleChange}
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none mb-2 ${
                    !form.responsable_actividad_inmediata?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Nombre del responsable" 
                />
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Ejecución <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="fecha_actividad_inmediata" 
                  value={form.fecha_actividad_inmediata} 
                  onChange={handleChange}
                  className={`w-full p-2 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none ${
                    !form.fecha_actividad_inmediata?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Análisis de Causas Raíz (Ishikawa) */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-sky-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    2. Análisis de Causa Raíz (Ishikawa / 5 Porqués) <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Capture todas las causas potenciales y seleccione la Causa Principal.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {causas.map((c, i) => (
                <div key={c.id || i} className={`p-3.5 rounded-xl border transition-all ${
                  c.es_causa_principal 
                    ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-400/40' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <label className="text-xs font-bold text-slate-800">
                        Causa potencial #{i + 1} <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-sky-800">
                      <input 
                        type="radio" 
                        name="causa_principal_select" 
                        checked={c.es_causa_principal} 
                        onChange={() => {
                          const actualizadas = causas.map((item, idx) => ({
                            ...item,
                            es_causa_principal: idx === i
                          }));
                          setCausas(actualizadas);
                        }} 
                        className="w-4 h-4 text-sky-600" 
                      />
                      Causa Principal
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={c.causa} 
                    onChange={(e) => {
                      const actualizadas = [...causas];
                      actualizadas[i].causa = e.target.value;
                      setCausas(actualizadas);
                    }}
                    className={`w-full p-2 bg-white border rounded text-xs font-medium focus:border-sky-500 outline-none ${
                      !c.causa?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                    placeholder="Descripción obligatoria de la causa..." 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actividades Correctivas */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    3. Plan de Actividades Correctivas <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Todos los campos son obligatorios por actividad (ISO 9001 §10.2).</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3 min-w-[240px]">Actividad Correctiva *</th>
                    <th className="p-3 min-w-[140px]">Responsable *</th>
                    <th className="p-3 min-w-[120px]">Fecha Compromiso *</th>
                    <th className="p-3 min-w-[180px]">Evidencia Esperada *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actividades.map((act, i) => (
                    <tr key={act.id || i} className="hover:bg-slate-50/60">
                      <td className="p-3 text-center font-mono font-bold text-slate-500">{i + 1}</td>
                      <td className="p-2">
                        <textarea 
                          rows={2} 
                          value={act.actividad} 
                          onChange={(e) => {
                            const nuevo = [...actividades]; 
                            nuevo[i].actividad = e.target.value; 
                            setActividades(nuevo);
                          }} 
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !act.actividad?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Descripción obligatoria..." 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={act.responsable} 
                          onChange={(e) => {
                            const nuevo = [...actividades]; 
                            nuevo[i].responsable = e.target.value; 
                            setActividades(nuevo);
                          }} 
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !act.responsable?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Responsable..." 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="date" 
                          value={act.fecha_termino_sugerida} 
                          onChange={(e) => {
                            const nuevo = [...actividades]; 
                            nuevo[i].fecha_termino_sugerida = e.target.value; 
                            setActividades(nuevo);
                          }} 
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none ${
                            !act.fecha_termino_sugerida?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                        />
                      </td>
                      <td className="p-2">
                        <textarea 
                          rows={2} 
                          value={act.evidencia_esperada} 
                          onChange={(e) => {
                            const nuevo = [...actividades]; 
                            nuevo[i].evidencia_esperada = e.target.value; 
                            setActividades(nuevo);
                          }} 
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-sky-500 outline-none resize-none ${
                            !act.evidencia_esperada?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Documento probatorio (minuta, foto, reporte)..." 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Action Bar */}
          <div className="flex gap-3 justify-between items-center border-t border-slate-200 pt-4">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Volver a Equipo
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGuardarValidado} 
                disabled={loading} 
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar Borrador'}
              </button>
              {getBotonesWorkflow()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
