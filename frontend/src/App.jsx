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

const COLORES = {
  azul: '#2A78B0',
  azulOscuro: '#1e5a84',
  amarillo: '#dddd26',
  verde: '#28a745',
  blanco: '#ffffff',
  grisClaro: '#f8f9fa',
  grisMedio: '#e9ecef',
  grisOscuro: '#495057',
  negro: '#212529',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: COLORES.grisClaro,
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        background: COLORES.azul,
        color: COLORES.blanco,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo OOMAPASC */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: '8px',
              background: COLORES.amarillo,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              💧
            </div>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>OOMAPASC</p>
              <p style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: 1 }}>Portal SGC</p>
            </div>
          </div>
        </div>

        {/* Menú */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {TABS.map(tab => (
            <button key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id);
                if (windowWidth < 768) setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: COLORES.blanco,
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', opacity: 0.7 }}>
          <p>ISO 9001 · v3.1</p>
          <p style={{ marginTop: 4 }}>OOMAPASC de Cajeme</p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen && windowWidth >= 768 ? 260 : 0,
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Header superior */}
        <header style={{
          background: COLORES.blanco,
          borderBottom: `1px solid ${COLORES.grisMedio}`,
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          {/* Botón menú */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: 40, height: 40,
              border: 'none',
              background: 'transparent',
              fontSize: '1.25rem',
              cursor: 'pointer',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {sidebarOpen ? '◀' : '☰'}
          </button>

          {/* Título de sección */}
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: COLORES.negro,
            margin: 0,
            flex: 1,
            textAlign: 'center',
          }}>
            {activeTabData?.label}
          </h1>

          {/* Badge estado */}
          <div style={{
            padding: '0.35rem 0.75rem',
            background: `${COLORES.verde}15`,
            border: `1px solid ${COLORES.verde}`,
            borderRadius: 999,
            fontSize: '0.7rem',
            fontWeight: 600,
            color: COLORES.verde,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORES.verde }} />
            Sistema Activo
          </div>
        </header>

        {/* Contenido principal */}
        <main style={{ 
          flex: 1, 
          padding: '1.5rem',
          overflow: 'auto',
        }}>
          {activeTab === 'dashboard' && <Dashboard />}
          
          {activeTab === 'ac' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <AccionCorrectivaForm onSuccess={() => {}} />
            </div>
          )}

          {activeTab === 'pm' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <PlanMejoraForm onSuccess={() => {}} />
            </div>
          )}

          {activeTab === 'gestor' && <GestorAprobaciones />}
        </main>
      </div>
    </div>
  );
}

export default App;