import React, { useState, useEffect } from 'react';
import { CATEGORIAS_MEJORA, PERIODOS, ORIGENES_PM, ROLES_EQUIPO } from '../../constants';
import { useSGC } from '../../SGCContext';
import { generarPlanMejoraIA } from './PlanesAI';
import { 
  Sparkles, 
  Target, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Trash2,
  FileCheck,
  Award,
  Lock
} from 'lucide-react';

export default function PlanesForm({
  step, setStep, form, setForm, error, setError, mensaje, setMensaje,
  equipo, setEquipo, actividades, setActividades,
  loading, guardarBorrador, setVista, getBotonesWorkflow
}) {
  const { areas, procesos, usuarioLogueado, puedeTodasAreas } = useSGC();
  const [generandoIA, setGenerandoIA] = useState(false);
  const [descripcionSA, setDescripcionSA] = useState(form.descripcion_situacion_actual || '');

  // Si el usuario es Encargado o Usuario, fijar obligatoriamente su área
  useEffect(() => {
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
        id: Date.now(), nombre: '', puesto: '', rol: 'Integrante área involucrada'
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
        return { ...e, [campo]: valor };
      }
      return e;
    });
    setEquipo(nuevo);
    setError('');
  };

  // === VALIDACIONES ESTRICTAS (TODOS LOS CAMPOS OBLIGATORIOS) ===
  const validarPaso1 = () => {
    if (!form.area?.trim()) return 'Debe seleccionar el Área líder de la mejora.';
    if (!form.categoria_mejora?.trim()) return 'Debe seleccionar la Categoría de la mejora.';
    const desc = descripcionSA || form.descripcion_situacion_actual;
    if (!desc?.trim() || desc.trim().length < 15) {
      return 'Debe describir la Situación Actual a mejorar (mínimo 15 caracteres).';
    }
    return null;
  };
  const paso1Completo = !validarPaso1();

  const validarPaso2 = () => {
    if (!form.titulo_mejora?.trim()) return 'Debe capturar el Título de la Mejora.';
    if (!form.categoria_mejora?.trim()) return 'Debe seleccionar la Categoría.';
    if (!form.situacion_deseada?.trim()) return 'Debe capturar la Situación Deseada (Objetivo).';
    if (!form.beneficios?.trim()) return 'Debe capturar los Beneficios Esperados.';

    if (!equipo || equipo.length === 0) {
      return 'Debe registrar al menos a un integrante en el equipo del plan.';
    }
    for (let i = 0; i < equipo.length; i++) {
      const m = equipo[i];
      if (!m.nombre?.trim()) return `El integrante #${i + 1} debe tener nombre capturado.`;
      if (!m.puesto?.trim()) return `El integrante #${i + 1} (${m.nombre}) debe tener puesto capturado.`;
      if (!m.rol?.trim()) return `El integrante #${i + 1} (${m.nombre}) debe tener rol asignado.`;
    }

    if (!actividades || actividades.length === 0) {
      return 'Debe registrar al menos una actividad en el cronograma.';
    }
    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      if (!act.actividad?.trim()) return `La actividad #${i + 1} debe tener descripción.`;
      if (!act.responsable?.trim()) return `La actividad #${i + 1} debe tener responsable asignado.`;
      if (!act.indicador?.trim()) return `La actividad #${i + 1} debe tener indicador de logro.`;
      if (!act.fecha_termino_sugerida?.trim()) return `La actividad #${i + 1} debe tener fecha compromiso.`;
      if (!act.evidencia_esperada?.trim()) return `La actividad #${i + 1} debe tener evidencia esperada.`;
    }

    return null;
  };

  const handleAvanzarPaso2Manual = () => {
    const errorP1 = validarPaso1();
    if (errorP1) {
      setError(errorP1);
      return;
    }
    setError('');
    setStep(2);
  };

  const procesarGeneracionIA = async () => {
    const errorP1 = validarPaso1();
    if (errorP1) {
      setError(errorP1);
      return;
    }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const descFinal = descripcionSA || form.descripcion_situacion_actual;
      const iaData = await generarPlanMejoraIA(descFinal, form.area, form.proceso);
      
      setForm(f => ({
        ...f,
        titulo_mejora: iaData.titulo_mejora || f.titulo_mejora || 'Plan de Mejora Continua',
        categoria_mejora: iaData.categoria_mejora || f.categoria_mejora || 'Eficiencia Operativa',
        descripcion_situacion_actual: descFinal,
        situacion_deseada: iaData.situacion_deseada || 'Lograr un estándar operativo de excelencia con indicadores medibles.',
        beneficios: iaData.beneficios || 'Optimización de recursos, reducción de tiempos y cumplimiento normativo ISO 9001:2015.',
        estado: 'BORRADOR',
        fecha_creacion: new Date().toISOString()
      }));
      
      if (iaData.integrantes && iaData.integrantes.length > 0) {
        const nuevosIntegrantes = iaData.integrantes.map((i, idx) => ({
          id: idx + 1,
          nombre: i.nombre || `Responsable ${idx + 1}`,
          puesto: i.puesto || 'Coordinador',
          rol: i.rol || 'Integrante área involucrada'
        }));
        setEquipo(nuevosIntegrantes);
      }
      
      if (iaData.actividades && iaData.actividades.length > 0) {
        const nuevasActividades = iaData.actividades.map((a, idx) => ({
          id: idx + 1,
          actividad: a.actividad || '',
          responsable: a.responsable || 'Responsable por definir',
          indicador: a.indicador || 'Meta cumplida',
          fecha_termino_sugerida: a.fecha_termino_sugerida || '',
          evidencia_esperada: a.evidencia_esperada || 'Reporte de implementación',
          evidencia_cargada: '',
          estatus: 'PENDIENTE'
        }));
        setActividades(nuevasActividades);
      }
      
      setMensaje('✨ Plan de Mejora estructurado exitosamente conforme al formato oficial OOMRSC-21.');
      setStep(2);
    } catch (err) {
      console.error('Error IA:', err);
      setError(`No se pudo estructurar el plan: ${err.message}`);
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleGuardarValidado = () => {
    const errorP2 = validarPaso2();
    if (errorP2) {
      setError(errorP2);
      return;
    }
    setError('');
    guardarBorrador();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Stepper */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-card-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                FORMATO OFICIAL OOMRSC-21
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">ISO 9001:2015 §10.3</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Registro de Plan de Mejora
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Etapa:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#0B192C] text-white">
              {step === 1 ? 'Paso 1 de 2: Diagnóstico' : 'Paso 2 de 2: Plan y Cronograma'}
            </span>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              step === 1 
                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-2xs ring-2 ring-emerald-500/10' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70 cursor-pointer'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">1. Diagnóstico y Situación Actual</p>
              <p className="text-[11px] text-slate-500">Área, categoría y problemática</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (paso1Completo) setStep(2);
              else setError('Debe completar todos los datos del Paso 1 para continuar.');
            }}
            disabled={!paso1Completo}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              step === 2 
                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-2xs ring-2 ring-emerald-500/10' 
                : paso1Completo
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70 cursor-pointer'
                  : 'bg-white border-slate-200/60 text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">2. Estructura y Actividades</p>
              <p className="text-[11px] text-slate-500">Cronograma, responsables y metas</p>
            </div>
          </button>
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

      {/* STEP 1: Situación Actual y Asistente SGC */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Target size={18} className="text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Datos del Diagnóstico (Campos Obligatorios)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Área Líder de la Mejora <span className="text-rose-500">*</span></span>
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
                    className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                      !form.area ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Seleccionar área obligatoria --</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Categoría de Mejora <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="categoria_mejora" 
                  value={form.categoria_mejora} 
                  onChange={handleChange} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                    !form.categoria_mejora ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Seleccionar categoría obligatoria --</option>
                  {CATEGORIAS_MEJORA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Situación Actual a Mejorar <span className="text-rose-500">*</span>
              </label>
              <textarea 
                value={descripcionSA}
                onChange={(e) => {
                  setDescripcionSA(e.target.value);
                  setForm({...form, descripcion_situacion_actual: e.target.value});
                  setError('');
                }}
                rows={4}
                className={`w-full p-3 bg-slate-50 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none ${
                  !descripcionSA?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
                placeholder="Capture detalladamente el problema, cuello de botella o proceso que se requiere optimizar..."
              />
            </div>
          </div>

          {/* Asistente SGC Ejecutivo */}
          <div className="bg-gradient-to-r from-[#0A1424] via-[#0E2038] to-[#122A4C] p-6 rounded-2xl text-white shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles size={16} /> Inteligencia de Calidad ISO 9001:2015
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Estructurar Plan de Mejora
            </h3>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              El sistema redactará el objetivo cuantitativo (Situación Deseada), los beneficios esperados, el equipo y el cronograma de actividades con evidencias verificables.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button 
                onClick={procesarGeneracionIA} 
                disabled={generandoIA || !paso1Completo}
                className={`px-6 py-3 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  paso1Completo && !generandoIA
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {generandoIA ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Estructurando Plan OOMRSC-21...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Estructurar con Asistente SGC
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={handleAvanzarPaso2Manual}
                disabled={!paso1Completo}
                className={`px-4 py-3 text-xs font-semibold rounded-xl border transition-colors ${
                  paso1Completo 
                    ? 'bg-white/10 hover:bg-white/15 text-white border-white/15 cursor-pointer' 
                    : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                }`}
              >
                Continuar a captura manual →
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-4">
            <button onClick={() => setVista('lista')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button 
              onClick={handleAvanzarPaso2Manual}
              disabled={!paso1Completo}
              className={`px-6 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                paso1Completo 
                  ? 'bg-[#0B192C] hover:bg-[#152e4d] text-white cursor-pointer' 
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {!paso1Completo && <Lock size={13} />}
              Continuar a Estructura del Plan <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Estructura del Plan y Cronograma */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Ficha General de la Mejora */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award size={18} className="text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                1. Definición del Plan de Mejora <span className="text-rose-500">*</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título de la Mejora <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="titulo_mejora" 
                  value={form.titulo_mejora} 
                  onChange={handleChange}
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:border-emerald-500 outline-none ${
                    !form.titulo_mejora?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Título descriptivo del proyecto de mejora..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría de Mejora <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="categoria_mejora" 
                  value={form.categoria_mejora} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  {CATEGORIAS_MEJORA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Situación Deseada (Objetivo SMART) <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  name="situacion_deseada" 
                  value={form.situacion_deseada} 
                  onChange={handleChange}
                  rows={3} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:border-emerald-500 outline-none ${
                    !form.situacion_deseada?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Meta cuantificable a alcanzar con el proyecto..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Beneficios Esperados <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  name="beneficios" 
                  value={form.beneficios} 
                  onChange={handleChange}
                  rows={3} 
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-medium focus:border-emerald-500 outline-none ${
                    !form.beneficios?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Impacto en calidad, ahorro, tiempos o satisfacción de usuarios..."
                />
              </div>
            </div>
          </div>

          {/* Equipo Responsable */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  2. Equipo del Proyecto de Mejora <span className="text-rose-500">*</span>
                </h3>
              </div>
              <button 
                type="button" 
                onClick={agregarIntegrante}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/80"
              >
                + Agregar Integrante
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Nombre Completo *</th>
                    <th className="p-3">Puesto *</th>
                    <th className="p-3">Rol en el Plan *</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipo.map((integrante) => (
                    <tr key={integrante.id} className="hover:bg-slate-50/70">
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={integrante.nombre} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
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
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
                            !integrante.puesto?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Puesto oficial..." 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={integrante.rol} 
                          onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
                            !integrante.rol?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Rol asignado..." 
                        />
                      </td>
                      <td className="p-2 text-center align-middle">
                        <button 
                          onClick={() => eliminarIntegrante(integrante.id)} 
                          disabled={equipo.length === 1}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded disabled:opacity-20 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actividades del Plan */}
          <div className="bg-white p-6 rounded-xl shadow-card-subtle border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  3. Plan de Actividades y Entregables (OOMRSC-21) <span className="text-rose-500">*</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3 min-w-[220px]">Actividad / Tarea *</th>
                    <th className="p-3 min-w-[130px]">Responsable *</th>
                    <th className="p-3 min-w-[130px]">Indicador de Logro *</th>
                    <th className="p-3 min-w-[120px]">Fecha Compromiso *</th>
                    <th className="p-3 min-w-[160px]">Evidencia Esperada *</th>
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
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
                            !act.actividad?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Descripción obligatoria de la actividad..."
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
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
                            !act.responsable?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Responsable..."
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={act.indicador} 
                          onChange={(e) => {
                            const nuevo = [...actividades]; 
                            nuevo[i].indicador = e.target.value; 
                            setActividades(nuevo);
                          }} 
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
                            !act.indicador?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Indicador..."
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
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none ${
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
                          className={`w-full p-2 bg-white border rounded text-xs focus:border-emerald-500 outline-none resize-none ${
                            !act.evidencia_esperada?.trim() ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          placeholder="Entregable o evidencia objetiva..."
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
            <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Volver a Diagnóstico
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
