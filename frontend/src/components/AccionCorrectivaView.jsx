import React, { useState } from 'react';
import { AREAS, PROCESOS, ORIGENES_AC } from '../catalogs';

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, evidencias, setEvidencias, usuarios, puedeTodasAreas, areaUsuario }) {
  const [hojaActiva, setHojaActiva] = useState('REGISTRO');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const esAdmin = puedeTodasAreas;
  const areaDefault = esAdmin ? '' : (areaUsuario || '');
  
  const [formData, setFormData] = useState({
    codigo: `AC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    fecha_deteccion: new Date().toISOString().split('T')[0],
    proceso: '',
    area: areaDefault,
    origen: '',
    descripcion_no_conformidad_original: '',
    actividades: [],
    estado: 'BORRADOR'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const agregarActividad = () => {
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, { descripcion: '', responsable: '', fecha_limite: '', estado: 'PENDIENTE' }]
    }));
  };

  const guardar = async (enviar = false) => {
    setLoading(true);
    const nuevaAC = {
      ...formData,
      id: Date.now(),
      estado: enviar ? 'EN_REVISION' : 'BORRADOR',
      fecha_creacion: new Date().toISOString()
    };
    setAccionesCorrectivas(prev => [...prev, nuevaAC]);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      alert(enviar ? 'Enviado a revisión' : 'Guardado como borrador');
      setSuccess(false);
    }, 500);
  };

  const tabs = [
    { id: 'REGISTRO', label: '1. Registro' },
    { id: 'ANALISIS', label: '2. Análisis' },
    { id: 'ACTIVIDADES', label: '3. Actividades' },
    { id: 'AUDITOR', label: '4. Cierre' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002855]">Formulario OOMRSC-20: Acción Correctiva</h2>
      </div>
      
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setHojaActiva(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${hojaActiva === tab.id ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {hojaActiva === 'REGISTRO' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código AC</label>
                <input type="text" value={formData.codigo} className="w-full p-2 border rounded-lg bg-slate-50" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Detección *</label>
                <input type="date" name="fecha_deteccion" value={formData.fecha_deteccion} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
                <select name="area" value={formData.area} onChange={handleChange} className="w-full p-2 border rounded-lg" required>
                  <option value="">Seleccionar área</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proceso *</label>
                <select name="proceso" value={formData.proceso} onChange={handleChange} className="w-full p-2 border rounded-lg" required>
                  <option value="">Seleccionar proceso</option>
                  {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción No Conformidad *</label>
              <textarea name="descripcion_no_conformidad_original" value={formData.descripcion_no_conformidad_original} onChange={handleChange} rows={4} className="w-full p-2 border rounded-lg" required placeholder="Describe la no conformidad..." />
            </div>
          </div>
        )}

        {hojaActiva === 'ANALISIS' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Posibles Causas</label>
              <textarea name="posibles_causas" value={formData.posibles_causas || ''} onChange={handleChange} rows={4} className="w-full p-2 border rounded-lg" placeholder="Lista las posibles causas..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Causa Raíz</label>
              <textarea name="causa_raiz" value={formData.causa_raiz || ''} onChange={handleChange} rows={3} className="w-full p-2 border rounded-lg" placeholder="Identifica la causa raíz..." />
            </div>
          </div>
        )}

        {hojaActiva === 'ACTIVIDADES' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#002855]">Plan de Acciones</h3>
              <button onClick={agregarActividad} className="text-sm text-cyan-600 hover:bg-cyan-50 px-3 py-1.5 rounded">+ Agregar</button>
            </div>
            {formData.actividades.map((act, idx) => (
              <div key={idx} className="p-3 border rounded-lg bg-slate-50 flex gap-2">
                <input type="text" value={act.descripcion} onChange={(e) => {
                  const updated = [...formData.actividades];
                  updated[idx].descripcion = e.target.value;
                  setFormData(prev => ({ ...prev, actividades: updated }));
                }} placeholder="Descripción" className="flex-1 p-2 border rounded" />
                <input type="text" value={act.responsable} onChange={(e) => {
                  const updated = [...formData.actividades];
                  updated[idx].responsable = e.target.value;
                  setFormData(prev => ({ ...prev, actividades: updated }));
                }} placeholder="Responsable" className="w-32 p-2 border rounded" />
                <input type="date" value={act.fecha_limite} onChange={(e) => {
                  const updated = [...formData.actividades];
                  updated[idx].fecha_limite = e.target.value;
                  setFormData(prev => ({ ...prev, actividades: updated }));
                }} className="w-32 p-2 border rounded" />
              </div>
            ))}
          </div>
        )}

        {hojaActiva === 'AUDITOR' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Conclusión del Auditor</label>
              <textarea name="conclusion_auditor" value={formData.conclusion_auditor || ''} onChange={handleChange} rows={3} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg">¡Guardado!</div>
        )}

        <div className="flex justify-between pt-6 border-t border-slate-200">
          <button onClick={() => setHojaActiva('REGISTRO')} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl">Anterior</button>
          <div className="flex gap-3">
            <button onClick={() => guardar(false)} disabled={loading} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl">{loading ? 'Guardando...' : 'Borrador'}</button>
            {hojaActiva !== 'AUDITOR' ? (
              <button onClick={() => setHojaActiva(tabs[tabs.findIndex(t => t.id === hojaActiva) + 1]?.id)} className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl">Siguiente</button>
            ) : (
              <button onClick={() => guardar(true)} disabled={loading} className="px-6 py-2.5 bg-[#002855] text-white rounded-xl">{loading ? 'Enviando...' : 'Enviar'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}