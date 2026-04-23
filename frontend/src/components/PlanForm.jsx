import React, { useState } from 'react';
import { getApiUrl } from '../config';

const PlanForm = () => {
  const [formData, setFormData] = useState({
    tipo: 'Accion Correctiva', // Por defecto
    area: '',
    descripcion: '',
    causa_raiz: '',
    propuesta_mejora: '',
    responsable: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (tipoSeleccionado) => {
    setFormData((prev) => ({ 
      ...prev, 
      tipo: tipoSeleccionado,
      // Limpiar campos que no aplican
      causa_raiz: tipoSeleccionado === 'Plan de Mejora' ? '' : prev.causa_raiz,
      propuesta_mejora: tipoSeleccionado === 'Accion Correctiva' ? '' : prev.propuesta_mejora
    }));
    setStatus({ type: '', message: '' });
  };

  const handleAISuggestion = async () => {
    if (!formData.descripcion || formData.descripcion.length < 10) {
      setStatus({ type: 'error', message: 'Escribe al menos una descripción breve primero (10 caracteres) para que la IA la analice.' });
      return;
    }

    setAILoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Mock IA response para Fase 1 (hasta implementar Fase 3)
      await new Promise(r => setTimeout(r, 1500));
      if (formData.tipo === 'Accion Correctiva') {
        setFormData(prev => ({ ...prev, causa_raiz: 'Análisis IA: Falla por fatiga de material debido a falta de mantenimiento preventivo calendarizado.' }));
      } else {
        setFormData(prev => ({ ...prev, propuesta_mejora: 'Sugerencia IA: Implementar un software de calendario automatizado para generar alertas de mantenimiento.' }));
      }
      setStatus({ type: 'success', message: '✨ Sugerencia generada con IA' });
    } catch (error) {
      setStatus({ type: 'error', message: 'El servicio AI falló.' });
    } finally {
      setAILoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Endpoint del Backend de FastAPI (MVP Phase 1)
      const response = await fetch(getApiUrl('/api/v1/planes/nuevo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({ 
          type: 'success', 
          message: `¡Guardado exitosamente! ID: ${data.id} - Estado: ${data.estado}` 
        });
        setFormData({ tipo: formData.tipo, area: '', descripcion: '', causa_raiz: '', propuesta_mejora: '', responsable: '' });
      } else {
        const errorData = await response.json();
        setStatus({ type: 'error', message: 'Error validando los datos en el backend.' });
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: 'No se pudo conectar al servidor. Asegúrate de ejecutar el backend (FastAPI) en el puerto 8000.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Generador de Formatos</h3>
          <p className="text-sm text-slate-500 mt-1">Selecciona el tipo de documento a capturar.</p>
        </div>
        
        {/* Selector de Tipo */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          <button 
            type="button"
            onClick={() => handleTipoChange('Accion Correctiva')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.tipo === 'Accion Correctiva' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            No Conformidad
          </button>
          <button 
            type="button"
            onClick={() => handleTipoChange('Plan de Mejora')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.tipo === 'Plan de Mejora' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Plan de Mejora
          </button>
        </div>
      </div>

      <div className="p-6">
        {status.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'
          }`}>
            <span className="mr-3 mt-0.5">{status.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Campos Comunes */}
            <div className="md:col-span-1">
              <label htmlFor="area" className="block text-sm font-medium text-slate-700 mb-1">Área o Departamento <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm"
                placeholder="Ej. Operaciones / Mantenimiento"
              />
            </div>
            
            <div className="md:col-span-1">
              <label htmlFor="responsable" className="block text-sm font-medium text-slate-700 mb-1">Responsable <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
                className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm"
                placeholder="Nombre del responsable"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700">
                  {formData.tipo === 'Accion Correctiva' ? 'Descripción de la No Conformidad' : 'Descripción de lo que se quiere mejorar'} <span className="text-red-500">*</span>
                </label>
              </div>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows="3"
                className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm"
                placeholder={formData.tipo === 'Accion Correctiva' ? "Describe el problema detectado..." : "Describe la oportunidad de mejora..."}
              />
            </div>

            {/* Campos Dinámicos según el tipo */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label htmlFor={formData.tipo === 'Accion Correctiva' ? "causa_raiz" : "propuesta_mejora"} className="block text-sm font-medium text-slate-700">
                  {formData.tipo === 'Accion Correctiva' ? 'Análisis de Causa Raíz' : 'Llenado sugerido del Plan'} <span className="text-slate-400 font-normal text-xs">(Auto-completado)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAISuggestion}
                  disabled={aiLoading}
                  className="group px-3 py-1 text-[11px] font-bold tracking-wide rounded-full text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center shadow-sm disabled:opacity-50"
                >
                  {aiLoading ? 'Pensando...' : '✨ Autocompletar Formato (IA)'}
                </button>
              </div>
              
              {formData.tipo === 'Accion Correctiva' ? (
                <textarea
                  id="causa_raiz"
                  name="causa_raiz"
                  value={formData.causa_raiz}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm font-mono text-slate-700 ${aiLoading ? 'animate-pulse bg-purple-50 border-purple-300' : 'border-slate-300'}`}
                  placeholder={aiLoading ? "Generando el formato completo..." : "¿Por qué ocurrió el problema?"}
                />
              ) : (
                <textarea
                  id="propuesta_mejora"
                  name="propuesta_mejora"
                  value={formData.propuesta_mejora}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm font-mono text-slate-700 ${aiLoading ? 'animate-pulse bg-purple-50 border-purple-300' : 'border-slate-300'}`}
                  placeholder={aiLoading ? "Estructurando el formato..." : "Detalla la propuesta y los beneficios..."}
                />
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-md transition-all
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed opacity-70' 
                  : formData.tipo === 'Accion Correctiva' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {loading ? 'Guardando en BD...' : `Guardar ${formData.tipo}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanForm;

