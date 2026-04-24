import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const COLORES = {
  azul: '#2A78B0',
  azulClaro: '#3d8cc2',
  azulOscuro: '#1e5a84',
  amarillo: '#dddd26',
  verde: '#10b981',
  rojo: '#ef4444',
  naranja: '#f59e0b',
  gris: '#6b7280',
  blanco: '#ffffff',
  grisClaro: '#f3f4f6',
  grisBorde: '#e5e7eb',
  negro: '#1f2937',
};

const ESTADO_LABELS = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

const ESTADO_COLORS = {
  BORRADOR: COLORES.gris,
  EN_REVISION: COLORES.naranja,
  APROBADO: COLORES.verde,
  RECHAZADO: COLORES.rojo,
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${COLORES.grisClaro}`, borderTopColor: COLORES.azul, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: COLORES.gris, fontSize: '0.9rem' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: COLORES.rojo, fontSize: '1rem' }}>⚠️ {error}</p>
        <button onClick={fetchDashboard} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: COLORES.azul, color: COLORES.blanco, border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
      {/* ===== KPI Cards ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KPICard title="Total AC" value={totales.acciones_correctivas || 0} icon="⚡" color={COLORES.azul} />
        <KPICard title="Total PM" value={totales.planes_mejora || 0} icon="🎯" color={COLORES.azul} />
        <KPICard title="Abiertos" value={totales.abiertos || 0} icon="📂" color={COLORES.naranja} />
        <KPICard title="Cerrados" value={totales.cerradas || 0} icon="✅" color={COLORES.verde} />
      </div>

      {/* ===== Charts Row ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* ACCIONES CORRECTIVAS */}
        <Card title="Acciones Correctivas por Estado">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem' }}>
            {Object.keys(ESTADO_LABELS).map(estado => {
              const count = acPorEstado[estado] || 0;
              return (
                <EstadoBadge key={estado} label={ESTADO_LABELS[estado]} count={count} color={ESTADO_COLORS[estado]} />
              );
            })}
          </div>
        </Card>

        {/* PLANES DE MEJORA */}
        <Card title="Planes de Mejora por Estado">
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem' }}>
            {Object.keys(ESTADO_LABELS).map(estado => {
              const count = pmPorEstado[estado] || 0;
              return (
                <EstadoBadge key={estado} label={ESTADO_LABELS[estado]} count={count} color={ESTADO_COLORS[estado]} />
              );
            })}
          </div>
        </Card>
      </div>

      {/* ===== Recent Activity ===== */}
      <Card title="Actividad Reciente">
        {recientes.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: COLORES.gris }}>No hay actividad reciente</p>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {recientes.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem',
                borderBottom: i < recientes.length - 1 ? `1px solid ${COLORES.grisBorde}` : 'none'
              }}>
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: item.tipo === 'AC' ? COLORES.azul : COLORES.verde 
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORES.negro, margin: 0 }}>
                    {item.tipo === 'AC' ? 'AC' : 'PM'} #{item.folio || item.id}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: COLORES.gris, margin: '0.2rem 0 0' }}>
                    {item.area}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: `${ESTADO_COLORS[item.estado] || COLORES.gris}20`,
                  color: ESTADO_COLORS[item.estado] || COLORES.gris,
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
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: COLORES.negro, marginBottom: '1rem' }}>
            📊 Top Áreas con Más Registros
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {topAreas.map((area, i) => (
              <div key={i} style={{ 
                background: COLORES.blanco, 
                border: `1px solid ${COLORES.grisBorde}`, 
                borderRadius: '8px', 
                padding: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.85rem', color: COLORES.negro }}>{area.area}</span>
                <span style={{ 
                  background: COLORES.azul, color: COLORES.blanco,
                  padding: '0.2rem 0.6rem', borderRadius: '12px',
                  fontSize: '0.8rem', fontWeight: 700
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

// Componentes
const Card = ({ title, children }) => (
  <div style={{
    background: COLORES.blanco,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '1rem 1.25rem',
      borderBottom: `1px solid ${COLORES.grisBorde}`,
    }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: COLORES.negro, margin: 0 }}>
        {title}
      </h3>
    </div>
    <div>{children}</div>
  </div>
);

const KPICard = ({ title, value, icon, color }) => (
  <div style={{
    background: COLORES.blanco,
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex', alignItems: 'center', gap: '1rem',
  }}>
    <div style={{
      width: 48, height: 48,
      borderRadius: '10px',
      background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.5rem',
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.75rem', color: COLORES.gris, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: COLORES.negro, margin: 0 }}>
        {value}
      </p>
    </div>
  </div>
);

const EstadoBadge = ({ label, count, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      width: 40, height: 40,
      borderRadius: '50%',
      background: count > 0 ? `${color}15` : COLORES.grisClaro,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 0.5rem',
      border: `2px solid ${count > 0 ? color : COLORES.grisBorde}`,
    }}>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: count > 0 ? color : COLORES.gris }}>
        {count}
      </span>
    </div>
    <p style={{ fontSize: '0.7rem', color: COLORES.gris, margin: 0 }}>{label}</p>
  </div>
);

export default Dashboard;