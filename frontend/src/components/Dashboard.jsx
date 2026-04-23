import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const ESTADO_LABELS = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
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

  const DonutChart = ({ data: segData, label }) => {
    const estados = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO'];
    const colors = { BORRADOR: '#64748b', EN_REVISION: '#f59e0b', APROBADO: '#10b981', RECHAZADO: '#ef4444' };
    const total = Object.values(segData).reduce((a, b) => a + b, 0);
    if (total === 0) return <div className="empty-state"><p>Sin registros</p></div>;

    let acc = 0;
    const segments = estados.map(e => {
      const count = segData[e] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const startAngle = acc;
      acc += pct;
      return { estado: e, count, pct, startAngle, color: colors[e] };
    }).filter(s => s.count > 0);

    const polarToCartesian = (cx, cy, r, angleDeg) => {
      const a = ((angleDeg - 90) * Math.PI) / 180;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };
    const describeArc = (cx, cy, r, startPct, endPct) => {
      const start = polarToCartesian(cx, cy, r, (startPct / 100) * 360);
      const end = polarToCartesian(cx, cy, r, (endPct / 100) * 360);
      const largeArc = (endPct - startPct) > 50 ? 1 : 0;
      return `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y} Z`;
    };

    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>{label}</p>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block', margin: '0 auto' }}>
          {segments.map((seg, i) => (
            <path
              key={i}
              d={describeArc(60, 60, 50, seg.startAngle, seg.startAngle + seg.pct)}
              fill={seg.color}
              stroke="var(--color-bg)"
              strokeWidth="2"
            />
          ))}
          <circle cx="60" cy="60" r="28" fill="var(--color-surface)" />
          <text x="60" y="64" textAnchor="middle" fill="var(--color-text)" fontSize="18" fontWeight="700">{total}</text>
        </svg>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {segments.map(seg => (
            <div key={seg.estado} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-muted)' }}>{ESTADO_LABELS[seg.estado]}</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem' }} />
      <p>Cargando estadísticas...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-error">{error}</div>
  );

  if (!data) return null;

  const { totales, ac_por_estado, pm_por_estado, top_areas, recientes } = data;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          Dashboard SGC
        </h2>
        <p className="text-muted text-sm mt-1">Sistema de Gestión de Calidad · OOMAPASC de Cajeme</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">📋</div>
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '0.15rem' }}>Total Registros</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{totales.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-cyan">⚡</div>
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '0.15rem' }}>Acciones Correctivas</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{totales.acciones_correctivas}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">🎯</div>
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '0.15rem' }}>Planes de Mejora</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{totales.planes_mejora}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">✅</div>
          <div>
            <p className="text-xs text-muted" style={{ marginBottom: '0.15rem' }}>Aprobados AC+PM</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>
              {(ac_por_estado['APROBADO'] || 0) + (pm_por_estado['APROBADO'] || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-3">
        <div className="card p-4">
          <DonutChart data={ac_por_estado} label="Acciones Correctivas" />
        </div>
        <div className="card p-4">
          <DonutChart data={pm_por_estado} label="Planes de Mejora" />
        </div>

        {/* Top áreas */}
        <div className="card">
          <div className="card-header">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              Top Áreas con Más Registros
            </p>
          </div>
          <div className="p-4">
            {top_areas.length === 0 ? (
              <p className="text-faint text-sm">Sin datos</p>
            ) : top_areas.map((a, i) => {
              const max = top_areas[0].total;
              const pct = (a.total / max) * 100;
              return (
                <div key={i} style={{ marginBottom: '0.85rem' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm truncate" style={{ maxWidth: '75%' }}>{a.area}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{a.total}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Actividad Reciente</p>
          <button className="btn btn-ghost btn-sm" onClick={fetchDashboard}>🔄 Actualizar</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recientes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No hay registros aún. Crea tu primera Acción Correctiva o Plan de Mejora.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Tipo', 'Folio', 'Área', 'Estado', 'Fecha'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recientes.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <span className={`badge badge-${r.tipo === 'AC' ? 'ac' : 'pm'}`}>{r.tipo}</span>
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.folio}</td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: 200 }}>
                      <span className="truncate" style={{ display: 'block' }}>{r.area}</span>
                    </td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <span className={`badge badge-${r.estado === 'EN_REVISION' ? 'revision' : r.estado.toLowerCase()}`}>
                        {ESTADO_LABELS[r.estado]}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
