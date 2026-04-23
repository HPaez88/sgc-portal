import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const GestorPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [comentarios, setComentarios] = useState('');

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl('/api/v1/planes-mejora'));
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
      const resp = await fetch(getApiUrl(`/api/v1/planes-mejora/${selectedPlan.id}/estado`), {
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
    const colors = {
      BORRADOR: 'bg-slate-100 text-slate-600',
      EN_REVISION: 'bg-yellow-100 text-yellow-700',
      APROBADO: 'bg-green-100 text-green-700',
      EN_SEGUIMIENTO: 'bg-blue-100 text-blue-700',
      RECHAZADO: 'bg-red-100 text-red-700',
      CERRADO: 'bg-gray-100 text-gray-600',
    };
    return colors[estado] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestor de Planes de Mejora</h2>
      
      {loading && <p className="text-gray-500">Cargando...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      
      {!loading && planes.length === 0 && (
        <p className="text-gray-500">No hay planes de mejora registrados.</p>
      )}
      
      <div className="space-y-3">
        {planes.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{plan.titulo_mejora}</h3>
                <p className="text-sm text-gray-600">{plan.gerencia_coordinacion}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${parseEstadoColor(plan.estado)}`}>
                {plan.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestorPlanes;