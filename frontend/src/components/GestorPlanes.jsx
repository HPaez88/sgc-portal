import React, { useState, useEffect } from 'react';

const GestorPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [comentarios, setComentarios] = useState('');

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/api/v1/planes');
      if (resp.ok) {
        const data = await resp.json();
        setPlanes(data);
      } else {
        setError('Error al obtener planes del servidor.');
      }
    } catch (err) {
      setError('Fallo de conexión al backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const actualizarEstado = async (nuevoEstado) => {
    if (!selectedPlan) return;
    
    try {
      const resp = await fetch(`http://localhost:8000/api/v1/planes/${selectedPlan.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, comentarios_revision: comentarios }),
      });
      if (resp.ok) {
        setSelectedPlan(null);
        setComentarios('');
        fetchPlanes();
      } else {
        alert('Error al actualizar el estado.');
      }
    } catch (error) {
      alert('Error de conexión.');
    }
  };

  const parseEstadoColor = (estado) => {
    switch(estado) {
      case 'BORRADOR': return 'bg-slate-200 text-slate-800';
      case 'EN_REVISION': return 'bg-yellow-200 text-yellow-800';
      case 'APROBADO': return 'bg-green-200 text-green-800';
      case 'RECHAZADO': return 'bg-red-200 text-red-800';
      default: return 'bg-slate-100';
    }
  };

  const renderColumn = (title, estadoFiltro) => {
    const list = planes.filter(p => p.estado === estadoFiltro);
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-slate-700">{title}</h4>
          <span className="bg-white rounded-full px-2 text-sm text-slate-500 font-medium shadow-sm">{list.length}</span>
        </div>
        <div className="space-y-3">
          {list.map(plan => (
            <div 
              key={plan.id} 
              onClick={() => setSelectedPlan(plan)}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-slate-400">#{plan.id}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${parseEstadoColor(plan.estado)}`}>
                  {plan.estado}
                </span>
              </div>
              <h5 className="font-medium text-sm text-slate-800 line-clamp-2">{plan.titulo}</h5>
              <p className="text-xs text-slate-500 mt-2">Área: {plan.area_responsable}</p>
            </div>
          ))}
          {list.length === 0 && <p className="text-xs text-center text-slate-400 py-4">No hay planes</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Aprobaciones</h2>
          <p className="text-sm text-slate-500 mt-1">Arrastra flujos o selecciona un plan para evaluar.</p>
        </div>
        <button onClick={fetchPlanes} className="p-2 bg-white border border-slate-200 shadow-sm rounded-md hover:bg-slate-50 text-slate-600">
          🔄 Actualizar
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      ) : loading ? (
        <div className="text-center py-10 text-slate-500">Cargando planes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderColumn('Borradores', 'BORRADOR')}
          {renderColumn('En Revisión', 'EN_REVISION')}
          {renderColumn('Aprobados', 'APROBADO')}
          {renderColumn('Rechazados', 'RECHAZADO')}
        </div>
      )}

      {/* MODAL DE REVISIÓN */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Revisión de Plan #{selectedPlan.id}</h3>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Título</p>
                <p className="text-slate-800 font-medium">{selectedPlan.titulo}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Creación</p>
                  <p className="text-sm text-slate-700">{new Date(selectedPlan.fecha_creacion).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Área Responsable</p>
                  <p className="text-sm text-slate-700">{selectedPlan.area_responsable}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Causa Raíz</p>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-slate-700 font-mono">
                  {selectedPlan.causa_raiz}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedPlan.descripcion}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">Comentarios de Revisión (Obligatorio para Rechazo)</label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Escribe tus observaciones para el autor del plan..."
                  className="w-full rounded-lg border-slate-300 border p-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows="3"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              {selectedPlan.estado === 'BORRADOR' && (
                <button onClick={() => actualizarEstado('EN_REVISION')} className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600">
                  Pasar a Revisión
                </button>
              )}
              
              <button disabled={!comentarios.trim() && selectedPlan.estado !== 'RECHAZADO'} onClick={() => actualizarEstado('RECHAZADO')} className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 disabled:opacity-50">
                Rechazar
              </button>
              
              <button onClick={() => actualizarEstado('APROBADO')} className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm">
                ✅ Aprobar Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorPlanes;
