import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AccionCorrectivaForm from './components/AccionCorrectivaForm';
import PlanMejoraForm from './components/PlanMejoraForm';
import GestorAprobaciones from './components/GestorAprobaciones';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ac', label: 'Acción Correctiva', icon: '⚡' },
  { id: 'pm', label: 'Plan de Mejora', icon: '🎯' },
  { id: 'gestor', label: 'Aprobaciones', icon: '🔍' },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 60 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '2rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(29,78,216,0.4)',
            }}>
              💧
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-text)' }}>OOMAPASC</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', lineHeight: 1, marginTop: 2 }}>
                Portal SGC · ISO 9001
              </p>
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 24, background: 'var(--color-border)', marginRight: '1.5rem' }} />

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}>
                <span>{tab.icon}</span>
                <span style={{ display: windowWidth < 640 ? 'none' : undefined }}>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              padding: '0.25rem 0.65rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--color-success)',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
              API Online
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
        {activeTab === 'dashboard' && <Dashboard />}

        {activeTab === 'ac' && (
          <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            <AccionCorrectivaForm onSuccess={() => {}} />
          </div>
        )}

        {activeTab === 'pm' && (
          <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            <PlanMejoraForm onSuccess={() => {}} />
          </div>
        )}

        {activeTab === 'gestor' && <GestorAprobaciones />}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '1rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--color-text-faint)',
      }}>
        OOMAPASC de Cajeme · Sistema de Gestión de Calidad ISO 9001 · Portal SGC v3.0
      </footer>
    </div>
  );
}

export default App;
