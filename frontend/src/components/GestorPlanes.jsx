import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import { COLORES, ESTADO_LABELS, ESTADO_COLORS, ESTADO_BG } from '../constants';

const GestorPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
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

  const abrirModalEstado = (plan) => {
    setSelectedPlan(plan);
    setNuevoEstado(plan.estado);
    setComentarios('');
    setShowUpdateModal(true);
  };

  const actualizarEstado = async () => {
    if (!selectedPlan || !nuevoEstado) return;

    try {
      const resp = await fetch(getApiUrl(`/api/v1/planes-mejora/${selectedPlan.id}/estado`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, comentarios_revision: comentarios }),
      });
      if (resp.ok) {
        setShowUpdateModal(false);
        setSelectedPlan(null);
        setComentarios('');
        fetchPlanes();
      } else {
        const errData = await resp.json().catch(() => ({}));
        alert(`Error: ${errData.detail || 'No se pudo actualizar el estado.'}`);
      }
    } catch (error) {
      alert('Error de conexión.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${COLORES.grisBorde}`, borderTopColor: COLORES.azul, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: COLORES.texto, fontSize: '0.9rem' }}>Cargando planes de mejora...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: COLORES.rojo, fontSize: '1rem' }}>⚠️ {error}</p>
        <button onClick={fetchPlanes} style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', background: COLORES.azul, color: COLORES.blanco, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORES.negro, margin: '0 0 0.25rem' }}>
          📋 Gestor de Planes de Mejora
        </h2>
        <p style={{ fontSize: '0.85rem', color: COLORES.texto, margin: 0 }}>
          {planes.length} plan{planes.length !== 1 ? 'es' : ''} registrado{planes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!loading && planes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: COLORES.texto }}>
          <p style={{ fontSize: '1rem', margin: 0 }}>No hay planes de mejora registrados.</p>
        </div>
      )}

      {/* Plan List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {planes.map((plan) => (
          <div key={plan.id} style={{
            background: COLORES.blanco,
            border: `1px solid ${COLORES.grisBorde}`,
            borderRadius: 10,
            padding: '1rem 1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORES.azul }}>{plan.folio || `PM-${plan.id}`}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: COLORES.negro, margin: 0 }}>
                  {plan.titulo_mejora}
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: COLORES.texto, margin: '0 0 0.25rem' }}>
                {plan.gerencia_coordinacion}
              </p>
              {plan.responsable && (
                <p style={{ fontSize: '0.75rem', color: COLORES.texto, margin: 0 }}>
                  Responsable: {plan.responsable}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '16px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: ESTADO_BG[plan.estado] || COLORES.grisClaro,
                color: ESTADO_COLORS[plan.estado] || COLORES.texto,
              }}>
                {ESTADO_LABELS[plan.estado] || plan.estado}
              </span>
              <button
                onClick={() => abrirModalEstado(plan)}
                style={{
                  padding: '0.35rem 0.65rem',
                  background: COLORES.azul,
                  color: COLORES.blanco,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Actualizar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: COLORES.blanco,
            borderRadius: 12,
            padding: '1.5rem',
            width: '90%',
            maxWidth: 420,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORES.negro, margin: '0 0 1rem' }}>
              Actualizar Estado — {selectedPlan.folio}
            </h3>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: COLORES.texto, marginBottom: '0.35rem' }}>
              Nuevo Estado
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORES.grisBorde}`, borderRadius: 6,
                fontSize: '0.9rem', marginBottom: '1rem',
              }}
            >
              {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: COLORES.texto, marginBottom: '0.35rem' }}>
              Comentarios de Revisión
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                border: `1px solid ${COLORES.grisBorde}`, borderRadius: 6,
                fontSize: '0.9rem', marginBottom: '1rem', resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowUpdateModal(false); setSelectedPlan(null); }}
                style={{
                  padding: '0.5rem 1rem',
                  background: COLORES.grisClaro,
                  color: COLORES.texto,
                  border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarEstado}
                style={{
                  padding: '0.5rem 1rem',
                  background: COLORES.azul,
                  color: COLORES.blanco,
                  border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorPlanes;