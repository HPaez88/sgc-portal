import React, { useState } from 'react';
import { AREAS, PROCESOS, ORIGENES_AC } from '../../constants';
import { generarPropuestaIA } from './AccionesAI';

const ROLES_EQUIPO = [
  "Responsable principal", "Integrante área involucrada", "Integrante externo", 
  "Enlace SGC", "Apoyo técnico", "Responsable de evidencias", "Auditor asignado"
];

export default function AccionesWizard({
  step, setStep, form, setForm, error, setError, mensaje, setMensaje,
  equipo, setEquipo, causas, setCausas, actividades, setActividades,
  loading, guardarBorrador, setVista, getBotonesWorkflow, getEstadoColor, getEstadoLabel
}) {
  const [generandoIA, setGenerandoIA] = useState(false);

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
  };

  const validarCapturaInicial = () => {
    if (!form.area) return 'Selecciona el área';
    if (!form.proceso) return 'Selecciona el proceso';
    if (!form.origen) return 'Selecciona el origen';
    if (form.origen === 'Auditoría' && !form.numero_auditoria) return 'Ingresa el número de auditoría';
    if (!form.descripcion_no_conformidad_original) return 'Describe la no conformidad';
    return null;
  };

  const validarEquipo = () => {
    const equipoValido = equipo.filter(e => e.nombre.trim());
    if (equipoValido.length < 3) return 'Mínimo 3 integrantes: 1 responsable + 1 del área + 1 externo';
    const tieneResponsable = equipoValido.some(e => e.es_responsable_principal);
    if (!tieneResponsable) return 'Debes definir un responsable principal';
    return null;
  };

  const procesarGeneracionIA = async () => {
    const errorCaptura = validarCapturaInicial();
    if (errorCaptura) { setError(errorCaptura); return; }
    
    const errorEquipo = validarEquipo();
    if (errorEquipo) { setError(errorEquipo); return; }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const iaData = await generarPropuestaIA(form, equipo);
      
      setForm(f => ({
        ...f,
        descripcion_no_conformidad_ia: iaData.registro?.descripcion_no_conformidad_mejorada || '',
        descripcion_no_conformidad_final: iaData.registro?.descripcion_no_conformidad_mejorada || '',
        impacta_otros_procesos: iaData.registro?.impacta_otros_procesos || 'NO',
        otros_procesos_afectados: iaData.registro?.otros_procesos_afectados || '',
        accion_contenedora: iaData.analisis?.accion_contenedora || '',
        actividad_inmediata: iaData.analisis?.actividad_inmediata?.actividad || '',
        responsable_actividad_inmediata: iaData.analisis?.actividad_inmediata?.responsable || '',
        fecha_actividad_inmediata: iaData.analisis?.actividad_inmediata?.fecha_sugerida || '',
        herramienta_analisis: 'Lluvia de ideas',
        requiere_actualizar_matriz_riesgos: iaData.analisis?.requiere_actualizar_matriz_riesgos || 'NO',
        descripcion_riesgo_oportunidad: iaData.analisis?.descripcion_riesgo_oportunidad || '',
        requiere_cambio_sgc: iaData.actividades?.requiere_cambio_sgc || 'NO',
        estado: 'BORRADOR',
        fecha_generacion_ia: new Date().toISOString()
      }));
      
      if (iaData.analisis?.causas) {
        const nuevasCausas = causas.map((c, i) => {
          const causaIA = iaData.analisis.causas[i];
          return {
            ...c,
            causa: causaIA?.causa || '',
            puntuacion_sugerida: causaIA?.puntuacion_sugerida || 0,
            porcentaje_sugerido: causaIA?.porcentaje_sugerido || 0,
            es_causa_principal: causaIA?.es_causa_principal || false
          };
        });
        setCausas(nuevasCausas);
      }
      
      if (iaData.actividades?.actividades_correctivas) {
        const nuevasActividades = iaData.actividades.actividades_correctivas.map((a, i) => ({
          id: i + 1,
          actividad: a.actividad || '',
          responsable: a.responsable || 'Responsable por definir',
          indicador_progreso: a.indicador_progreso || '',
          fecha_termino_sugerida: a.fecha_termino_sugerida || '',
          evidencia_esperada: a.evidencia_esperada || '',
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
      
      setStep(3);
    } catch (err) {
      console.error('Error IA:', err);
      setError(`Error de IA: ${err.message}`);
    }
    
    setGenerandoIA(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Encabezado y alertas */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Nueva Acción Correctiva</h2>
        <span className="text-sm font-medium text-slate-400 bg-[#00152e]/50 px-3 py-1 rounded-full border border-cyan-500/20">
          Paso {step} de 3
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
          <p className="font-medium flex items-center gap-2">⚠️ {error}</p>
        </div>
      )}

      {mensaje && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg shadow-sm">
          <p className="font-medium">{mensaje}</p>
        </div>
      )}

      {/* STEP 1: Datos Generales */}
      {step === 1 && (
        <>
          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-5 border-b pb-2">📋 Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Área *</label>
                <select name="area" value={form.area} onChange={handleChange} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar área</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Proceso *</label>
                <select name="proceso" value={form.proceso} onChange={handleChange} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar proceso</option>
                  {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Origen *</label>
                <select name="origen" value={form.origen} onChange={handleChange} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar origen</option>
                  {ORIGENES_AC.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Número de Auditoría</label>
                <input type="text" name="numero_auditoria" value={form.numero_auditoria} onChange={handleChange}
                  placeholder={form.origen === 'Auditoría' ? 'Obligatorio' : 'Solo si origen es auditoría'}
                  disabled={form.origen !== 'Auditoría'} 
                  className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-4 border-b pb-2 flex items-center gap-2">⚠️ Descripción de la No Conformidad</h3>
            <textarea name="descripcion_no_conformidad_original" value={form.descripcion_no_conformidad_original} onChange={handleChange}
              rows={4} className="w-full p-3 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" placeholder="Describe la no conformidad encontrada de manera detallada..." />
            
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="impacta_otros_procesos" value="SI" checked={form.impacta_otros_procesos === 'SI'} onChange={handleChange} className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-300">¿Impacta otros procesos? - SI</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="impacta_otros_procesos" value="NO" checked={form.impacta_otros_procesos === 'NO'} onChange={handleChange} className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-slate-300">NO</span>
              </label>
            </div>
            {form.impacta_otros_procesos === 'SI' && (
              <textarea name="otros_procesos_afectados" value={form.otros_procesos_afectados} onChange={handleChange}
                rows={2} className="w-full p-3 glass-card-dark-header border border-cyan-500/20 rounded-lg mt-3 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" placeholder="Especifica qué otros procesos se ven afectados..." />
            )}
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <button onClick={() => setVista('lista')} className="px-6 py-2.5 glass-card-dark border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors">
              Cancelar
            </button>
            <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2.5 glass-card-dark border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors">
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            <button onClick={() => { const err = validarCapturaInicial(); if (err) setError(err); else setStep(2); }}
              className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001d40] shadow-md transition-all">
              Continuar a Equipo →
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Equipo de Trabajo */}
      {step === 2 && (
        <>
          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-2 border-b pb-2 flex items-center gap-2">👥 Integrantes del Equipo</h3>
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100 mb-4 font-medium">Mínimo requerido: 1 responsable + 1 del área + 1 externo (total 3)</p>
            
            <div className="overflow-x-auto rounded-lg border border-cyan-500/20">
              <table className="w-full text-sm text-left">
                <thead className="glass-card-dark-header text-slate-300 font-semibold border-b border-cyan-500/20">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Puesto</th>
                    <th className="p-3">Área</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3 text-center">Responsable</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {equipo.map((integrante) => (
                    <tr key={integrante.id} className="hover:glass-card-dark-header transition-colors">
                      <td className="p-2">
                        <input type="text" value={integrante.nombre} onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                          className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none transition-all" placeholder="Nombre completo" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={integrante.puesto} onChange={(e) => actualizarIntegrante(integrante.id, 'puesto', e.target.value)}
                          className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none transition-all" placeholder="Puesto" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={integrante.area} onChange={(e) => actualizarIntegrante(integrante.id, 'area', e.target.value)}
                          className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none transition-all" placeholder="Área" />
                      </td>
                      <td className="p-2">
                        <select value={integrante.rol} onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                          className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none transition-all">
                          {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center align-middle">
                        <input type="checkbox" checked={integrante.es_responsable_principal} onChange={(e) => actualizarIntegrante(integrante.id, 'es_responsable_principal', e.target.checked)}
                          className="w-5 h-5 text-cyan-600 rounded border-cyan-500/30 cursor-pointer" />
                      </td>
                      <td className="p-2 text-center align-middle">
                        <button onClick={() => eliminarIntegrante(integrante.id)} disabled={equipo.length === 1}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg disabled:opacity-30 transition-colors">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={agregarIntegrante} disabled={equipo.length >= 10}
              className="mt-4 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1">
              + Agregar miembro al equipo
            </button>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100 shadow-sm">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-lg">🤖 Autocompletado Inteligente</h3>
            <p className="text-sm text-purple-800 mb-5">
              Utiliza la IA para generar la descripción mejorada, el análisis de causa raíz y el plan de actividades automáticamente.
            </p>
            <button onClick={procesarGeneracionIA} disabled={generandoIA} 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto flex items-center justify-center gap-2">
              {generandoIA ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando Análisis...
                </>
              ) : '✨ Generar Propuesta con IA'}
            </button>
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 glass-card-dark border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors mr-auto">
              ← Atrás
            </button>
            <button onClick={() => { const err = validarEquipo(); if (err) setError(err); else setStep(3); }}
              className="px-6 py-2.5 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 shadow-sm transition-all">
              Saltar IA (Manual) →
            </button>
          </div>
        </>
      )}

      {/* STEP 3: Propuesta IA / Manual */}
      {step === 3 && (
        <>
          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-4 border-b pb-2">📝 Descripción Mejorada</h3>
            <textarea value={form.descripcion_no_conformidad_ia || form.descripcion_no_conformidad_original} 
              onChange={(e) => setForm({...form, descripcion_no_conformidad_ia: e.target.value, descripcion_no_conformidad_final: e.target.value})}
              rows={4} className="w-full p-3 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
          </div>

          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-4 border-b pb-2">🛡️ Acción Contenedora Inmediata</h3>
            <textarea name="accion_contenedora" value={form.accion_contenedora} onChange={handleChange}
              rows={2} className="w-full p-3 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Actividad Específica</label>
                <input type="text" name="actividad_inmediata" value={form.actividad_inmediata} onChange={handleChange}
                  className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Responsable</label>
                <input type="text" name="responsable_actividad_inmediata" value={form.responsable_actividad_inmediata} onChange={handleChange}
                  className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Fecha de término</label>
                <input type="date" name="fecha_actividad_inmediata" value={form.fecha_actividad_inmediata} onChange={handleChange}
                  className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-4 border-b pb-2 flex items-center justify-between">
              <span>💡 Análisis de Causas (Lluvia de Ideas)</span>
              <span className="text-xs font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded">Marca 1 causa principal</span>
            </h3>
            <div className="overflow-x-auto border border-cyan-500/20 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="glass-card-dark-header text-slate-300 font-semibold border-b border-cyan-500/20">
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Descripción de la causa</th>
                    <th className="p-3 text-center w-28">Puntuación</th>
                    <th className="p-3 text-center w-28">Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {causas.map((c, i) => (
                    <tr key={c.id} className={`${c.es_causa_principal ? 'bg-amber-50' : 'hover:bg-white/5'} transition-colors`}>
                      <td className="p-2 text-center font-medium text-slate-400">{i + 1}</td>
                      <td className="p-2">
                        <input type="text" value={c.causa} onChange={(e) => {
                          const nuevo = [...causas]; nuevo[i].causa = e.target.value; setCausas(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none transition-all" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={c.puntuacion_sugerida} onChange={(e) => {
                          const nuevo = [...causas]; nuevo[i].puntuacion_sugerida = parseInt(e.target.value) || 0; setCausas(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded text-center focus:border-cyan-500 outline-none transition-all" />
                      </td>
                      <td className="p-2 text-center align-middle">
                        <input type="radio" name="causa_principal" checked={c.es_causa_principal} onChange={(e) => {
                          const nuevo = causas.map((causa, idx) => ({
                            ...causa, es_causa_principal: idx === i
                          }));
                          setCausas(nuevo);
                        }} className="w-5 h-5 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-5 glass-card-dark-header p-4 border border-cyan-500/20 rounded-lg flex flex-col md:flex-row md:items-center gap-4">
              <label className="font-semibold text-slate-300 whitespace-nowrap">¿Actualizar matriz de riesgos?</label>
              <select name="requiere_actualizar_matriz_riesgos" value={form.requiere_actualizar_matriz_riesgos} onChange={handleChange}
                className="p-2 glass-card-dark border border-cyan-500/30 rounded-lg font-medium w-full md:w-auto">
                <option value="NO">NO</option>
                <option value="SI">SÍ</option>
              </select>
              {form.requiere_actualizar_matriz_riesgos === 'SI' && (
                <input type="text" name="descripcion_riesgo_oportunidad" value={form.descripcion_riesgo_oportunidad} onChange={handleChange}
                  className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded-lg focus:border-cyan-500 outline-none" placeholder="Descripción breve..." />
              )}
            </div>
          </div>

          <div className="glass-card-dark p-6 rounded-xl shadow-sm border border-cyan-500/20">
            <h3 className="font-bold text-white mb-4 border-b pb-2 flex items-center justify-between">
              <span>📋 Plan de Actividades Correctivas</span>
            </h3>
            <div className="overflow-x-auto border border-cyan-500/20 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="glass-card-dark-header text-slate-300 font-semibold border-b border-cyan-500/20">
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Actividad correctiva (para eliminar causa raíz)</th>
                    <th className="p-3 w-40">Responsable</th>
                    <th className="p-3 w-36">Fecha Límite</th>
                    <th className="p-3">Evidencia Esperada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {actividades.map((act, i) => (
                    <tr key={act.id} className="hover:glass-card-dark-header transition-colors">
                      <td className="p-2 text-center font-medium text-slate-400">{i + 1}</td>
                      <td className="p-2">
                        <textarea rows={2} value={act.actividad} onChange={(e) => {
                          const nuevo = [...actividades]; nuevo[i].actividad = e.target.value; setActividades(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none resize-none" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={act.responsable} onChange={(e) => {
                          const nuevo = [...actividades]; nuevo[i].responsable = e.target.value; setActividades(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none" />
                      </td>
                      <td className="p-2">
                        <input type="date" value={act.fecha_termino_sugerida} onChange={(e) => {
                          const nuevo = [...actividades]; nuevo[i].fecha_termino_sugerida = e.target.value; setActividades(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none" />
                      </td>
                      <td className="p-2">
                        <textarea rows={2} value={act.evidencia_esperada} onChange={(e) => {
                          const nuevo = [...actividades]; nuevo[i].evidencia_esperada = e.target.value; setActividades(nuevo);
                        }} className="w-full p-2 glass-card-dark border border-cyan-500/30 rounded focus:border-cyan-500 outline-none resize-none" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex gap-4 items-center glass-card-dark-header p-3 rounded-lg border border-cyan-500/20 w-max">
              <label className="font-medium text-slate-300">¿Requiere cambio en SGC?</label>
              <select name="requiere_cambio_sgc" value={form.requiere_cambio_sgc} onChange={handleChange}
                className="p-1.5 glass-card-dark border border-cyan-500/30 rounded">
                <option value="NO">NO</option>
                <option value="SI">SÍ</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 glass-card-dark border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors mr-auto">
              ← Atrás
            </button>
            <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2.5 glass-card-dark border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors">
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            {getBotonesWorkflow()}
          </div>
        </>
      )}
    </div>
  );
}
