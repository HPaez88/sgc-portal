import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const COLORES = {
  azul: '#2A78B0',
  azulClaro: '#4a9fc9',
  azulOscuro: '#1e5a84',
  amarillo: '#f4c430',
  amarilloClaro: '#fff59d',
  verde: '#2e7d32',
  verdeClaro: '#a5d6a7',
  rojo: '#c62828',
  rojoClaro: '#ef9a9a',
  naranja: '#f57c00',
  naranjaClaro: '#ffcc80',
  grisClaro: '#f5f5f5',
  grisBorde: '#e0e0e0',
  blanco: '#ffffff',
  negro: '#212121',
  texto: '#424242',
};

const ESTADO_LABELS = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

const ESTADO_COLORS = {
  BORRADOR: COLORES.grisClaro,
  EN_REVISION: COLORES.naranja,
  APROBADO: COLORES.verde,
  RECHAZADO: COLORES.rojo,
};

const ESTADO_BG = {
  BORRADOR: '#f5f5f5',
  EN_REVISION: '#fff3e0',
  APROBADO: '#e8f5e9',
  RECHAZADO: '#ffebee',
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(getApiUrl('/api/v1/dashboard'));
      if (resp.ok) setData(await resp.json());
      else setError('No se pudo cargar el dashboard.');
    } catch {
      setError('Error de conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${COLORES.grisBorde}`, borderTopColor: COLORES.azul, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: COLORES.texto, fontSize: '0.9rem' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: COLORES.rojo, fontSize: '1rem' }}>⚠️ {error}</p>
        <button onClick={fetchDashboard} style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', background: COLORES.azul, color: COLORES.blanco, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const totales = data?.totales || {};
  const acPorEstado = data?.ac_por_estado || {};
  const pmPorEstado = data?.pm_por_estado || {};
  const recientes = data?.recientes || [];
  const topAreas = data?.top_areas || [];

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORES.negro, margin: '0 0 0.5rem' }}>
          📊 Dashboard SGC
        </h1>
        <p style={{ fontSize: '0.9rem', color: COLORES.texto, margin: 0 }}>
          Sistema de Gestión de Calidad - OOMAPASC de Cajeme
        </p>
      </div>

      {/* ===== KPI Cards ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KPICard title="Acciones Correctivas" value={totales.acciones_correctivas || 0} icon="⚡" />
        <KPICard title="Planes de Mejora" value={totales.planes_mejora || 0} icon="🎯" />
        <KPICard title="Documentos Abiertos" value={totales.abiertos || 0} icon="📂" />
        <KPICard title="Documentos Cerrados" value={totales.cerradas || 0} icon="✅" />
      </div>

      {/* ===== Charts Row ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card title="Acciones Correctivas">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1.5rem 1rem' }}>
            {Object.keys(ESTADO_LABELS).map(estado => {
              const count = acPorEstado[estado] || 0;
              return (
                <EstadoBadge key={estado} label={ESTADO_LABELS[estado]} count={count} color={ESTADO_COLORS[estado]} bg={ESTADO_BG[estado]} />
              );
            })}
          </div>
        </Card>

        <Card title="Planes de Mejora">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1.5rem 1rem' }}>
            {Object.keys(ESTADO_LABELS).map(estado => {
              const count = pmPorEstado[estado] || 0;
              return (
                <EstadoBadge key={estado} label={ESTADO_LABELS[estado]} count={count} color={ESTADO_COLORS[estado]} bg={ESTADO_BG[estado]} />
              );
            })}
          </div>
        </Card>
      </div>

      {/* ===== Actividad Reciente ===== */}
      <Card title="Actividad Reciente">
        {recientes.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: COLORES.texto, fontSize: '0.9rem' }}>
            No hay actividad reciente
          </p>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {recientes.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderBottom: i < recientes.length - 1 ? `1px solid ${COLORES.grisBorde}` : 'none',
                background: i % 2 === 0 ? COLORES.grisClaro : COLORES.blanco,
              }}>
                <span style={{ 
                  width: 10, height: 10, borderRadius: '50%', 
                  background: item.tipo === 'AC' ? COLORES.azul : COLORES.verde 
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORES.negro, margin: 0 }}>
                    {item.tipo === 'AC' ? 'Acción Correctiva' : 'Plan de Mejora'} #{item.folio || item.id}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: COLORES.texto, margin: '0.2rem 0 0' }}>
                    {item.area}
                  </p>
                </div>
                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: ESTADO_BG[item.estado] || COLORES.grisClaro,
                  color: ESTADO_COLORS[item.estado] || COLORES.texto,
                }}>
                  {ESTADO_LABELS[item.estado] || item.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ===== Top Áreas ===== */}
      {topAreas.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORES.negro, marginBottom: '1rem' }}>
            📊 Áreas con Más Registros
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {topAreas.map((area, i) => (
              <div key={i} style={{ 
                background: COLORES.blanco, 
                border: `2px solid ${COLORES.azul}`, 
                borderRadius: '10px', 
                padding: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.9rem', color: COLORES.negro, fontWeight: 500 }}>{area.area}</span>
                <span style={{ 
                  background: COLORES.azul, color: COLORES.blanco,
                  padding: '0.25rem 0.75rem', borderRadius: '16px',
                  fontSize: '0.85rem', fontWeight: 700
                }}>
                  {area.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ title, children }) => (
  <div style={{
    background: COLORES.blanco,
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '1rem 1.5rem',
      borderBottom: `2px solid ${COLORES.azul}`,
      background: `${COLORES.azul}08`,
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: COLORES.azul, margin: 0 }}>
        {title}
      </h3>
    </div>
    <div>{children}</div>
  </div>
);

const KPICard = ({ title, value, icon }) => (
  <div style={{
    background: COLORES.blanco,
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: '1rem',
    borderLeft: `4px solid ${COLORES.azul}`,
  }}>
    <div style={{
      width: 52, height: 52,
      borderRadius: '12px',
      background: `${COLORES.azul}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.5rem',
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.8rem', color: COLORES.texto, margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>
        {title}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: COLORES.negro, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  </div>
);

const EstadoBadge = ({ label, count, color, bg }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      width: 52, height: 52,
      borderRadius: '50%',
      background: count > 0 ? bg : COLORES.grisClaro,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 0.5rem',
      border: `3px solid ${count > 0 ? color : COLORES.grisBorde}`,
    }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: count > 0 ? color : '#999' }}>
        {count}
      </span>
    </div>
    <p style={{ fontSize: '0.75rem', color: COLORES.texto, margin: 0, fontWeight: 500 }}>{label}</p>
  </div>
);

export default Dashboard;