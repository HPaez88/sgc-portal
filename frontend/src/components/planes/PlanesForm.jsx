import React, { useState } from 'react';
import { AREAS, CATEGORIAS_MEJORA, PERIODOS, ORIGENES_PM } from '../../constants';
import { generarPlanMejoraIA } from './PlanesAI';

const ROLES_EQUIPO = [
  "Responsable principal", "Integrante área involucrada", "Integrante externo", 
  "Enlace SGC", "Apoyo técnico", "Responsable de evidencias"
];

export default function PlanesForm({
  step, setStep, form, setForm, error, setError, mensaje, setMensaje,
  equipo, setEquipo, actividades, setActividades,
  loading, guardarBorrador, setVista, getBotonesWorkflow
}) {
  const [generandoIA, setGenerandoIA] = useState(false);
  const [descripcionSA, setDescripcionSA] = useState('');

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
  };

  const procesarGeneracionIA = async () => {
    if (!descripcionSA || descripcionSA.trim().length < 15) {
      setError('Describe la situación actual con al menos 15 caracteres.');
      return;
    }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const iaData = await generarPlanMejoraIA(descripcionSA);
      
      setForm(f => ({
        ...f,
        titulo_mejora: iaData.titulo_mejora || '',
        categoria_mejora: iaData.categoria_mejora || '',
        descripcion_situacion_actual: descripcionSA,
        situacion_deseada: iaData.situacion_deseada || '',
        beneficios: iaData.beneficios || '',
        estado: 'BORRADOR',
        fecha_creacion: new Date().toISOString()
      }));
      
      if (iaData.integrantes && iaData.integrantes.length > 0) {
        const nuevosIntegrantes = iaData.integrantes.map((i, idx) => ({
          id: idx + 1,
          nombre: i.nombre || '',
          puesto: i.puesto || '',
          rol: i.rol || 'Integrante área involucrada'
        }));
        setEquipo(nuevosIntegrantes);
      }
      
      if (iaData.actividades && iaData.actividades.length > 0) {
        const nuevasActividades = iaData.actividades.map((a, idx) => ({
          id: idx + 1,
          actividad: a.actividad || '',
          responsable: a.responsable || 'Responsable por definir',
          indicador: a.indicador || '',
          fecha_termino_sugerida: a.fecha_termino_sugerida || '',
          evidencia_esperada: a.evidencia_esperada || '',
          evidencia_cargada: '',
          estatus: 'PENDIENTE'
        }));
        setActividades(nuevasActividades);
      }
      
      setMensaje('✅ IA generó el Plan de Mejora completo.');
      setStep(2);
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
        <h2 className="text-xl font-bold text-[#002855]">Nuevo Plan de Mejora</h2>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Paso {step} de 2
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

      {/* STEP 1: Generación con IA */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#002855] to-[#004a80] p-6 text-white">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-lg font-bold m-0">Asistente Inteligente</h2>
                <p className="text-sm text-cyan-100 opacity-90 mt-1">
                  Describe la situación que deseas mejorar y la IA estructurará el plan completo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Situación Actual a Mejorar *</label>
            <textarea
              value={descripcionSA}
              onChange={e => { setDescripcionSA(e.target.value); setError(''); }}
              placeholder="Ej: Los tiempos de respuesta en atención de fallas técnicas son mayores a 48 horas debido a la falta de un sistema centralizado..."
              rows={6}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none resize-y mb-2"
            />
            <p className="text-xs text-slate-500 mb-6 font-medium">
              {descripcionSA.length} caracteres · Mínimo 15 recomendado
            </p>

            <div className="flex gap-4">
              <button onClick={() => setVista('lista')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors w-full md:w-auto">
                Cancelar
              </button>
              <button onClick={procesarGeneracionIA} disabled={generandoIA || descripcionSA.trim().length < 15} 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2">
                {generandoIA ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Estructurando Plan...
                  </>
                ) : '✨ Generar Plan de Mejora Completo'}
              </button>
            </div>
            
            <div className="mt-6 text-center border-t pt-4">
              <button onClick={() => setStep(2)} className="text-sm font-medium text-slate-500 hover:text-cyan-600 transition-colors">
                Saltar IA e ingresar manualmente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Revisión Manual / Captura de Plan */}
      {step === 2 && (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#002855] mb-5 border-b pb-2">📋 Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Título de la Mejora *</label>
                <input type="text" name="titulo_mejora" value={form.titulo_mejora} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" placeholder="Ej: Implementación de sistema de tickets" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Área / Gerencia *</label>
                <select name="gerencia_coordinacion" value={form.gerencia_coordinacion} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar área</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Categoría *</label>
                <select name="categoria_mejora" value={form.categoria_mejora} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS_MEJORA.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Origen *</label>
                <select name="origen" value={form.origen} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar origen</option>
                  {ORIGENES_PM.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Período</label>
                <select name="periodo_mejora" value={form.periodo_mejora} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none">
                  <option value="">Seleccionar período</option>
                  {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            
            <h3 className="font-bold text-[#002855] mb-4 border-b pb-2 mt-6">📝 Descripción y Beneficios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Situación Actual *</label>
                <textarea name="descripcion_situacion_actual" value={form.descripcion_situacion_actual} onChange={handleChange}
                  rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Situación Deseada *</label>
                <textarea name="situacion_deseada" value={form.situacion_deseada} onChange={handleChange}
                  rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Beneficios Esperados</label>
                <textarea name="beneficios" value={form.beneficios} onChange={handleChange}
                  rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#002855] mb-4 border-b pb-2">👥 Equipo de Trabajo</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Puesto</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipo.map((integrante) => (
                    <tr key={integrante.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2">
                        <input type="text" value={integrante.nombre} onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded focus:border-cyan-500 outline-none transition-all" placeholder="Nombre completo" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={integrante.puesto} onChange={(e) => actualizarIntegrante(integrante.id, 'puesto', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded focus:border-cyan-500 outline-none transition-all" placeholder="Puesto" />
                      </td>
                      <td className="p-2">
                        <select value={integrante.rol} onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded focus:border-cyan-500 outline-none transition-all">
                          {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
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
              className="text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1">
              + Agregar miembro
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#002855] mb-4 border-b pb-2">📋 Plan de Actividades</h3>
            <div className="space-y-4">
              {actividades.map((act, i) => (
                <div key={act.id || i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-700">Actividad {i + 1}</span>
                    {actividades.length > 1 && (
                      <button onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700 text-sm font-medium">
                        ✕ Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Descripción de la actividad" value={act.actividad}
                        onChange={(e) => { const n = [...actividades]; n[i].actividad = e.target.value; setActividades(n); }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <input type="text" placeholder="Indicador" value={act.indicador}
                        onChange={(e) => { const n = [...actividades]; n[i].indicador = e.target.value; setActividades(n); }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <input type="date" value={act.fecha_termino_sugerida}
                        onChange={(e) => { const n = [...actividades]; n[i].fecha_termino_sugerida = e.target.value; setActividades(n); }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="lg:col-span-2">
                      <input type="text" placeholder="Responsable" value={act.responsable}
                        onChange={(e) => { const n = [...actividades]; n[i].responsable = e.target.value; setActividades(n); }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="lg:col-span-2">
                      <input type="text" placeholder="Evidencia Esperada" value={act.evidencia_esperada}
                        onChange={(e) => { const n = [...actividades]; n[i].evidencia_esperada = e.target.value; setActividades(n); }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:border-cyan-500 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActividades([...actividades, { id: Date.now(), actividad: '', responsable: '', indicador: '', fecha_termino_sugerida: '', evidencia_esperada: '' }])}
              className="mt-4 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 border-dashed w-full py-3 rounded-lg transition-colors inline-flex items-center justify-center gap-1">
              + Agregar Actividad
            </button>
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors mr-auto">
              ← Atrás (IA)
            </button>
            <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            {getBotonesWorkflow()}
          </div>
        </>
      )}
    </div>
  );
}
