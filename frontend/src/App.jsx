import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AccionCorrectivaForm from './components/AccionCorrectivaForm';
import PlanMejoraForm from './components/PlanMejoraForm';
import GestorAprobaciones from './components/GestorAprobaciones';
import { getApiUrl } from './config';

const COLORES = {
  azul: '#2A78B0',
  azulOscuro: '#002855',
  cyan: '#06b6d4',
  blanco: '#ffffff',
  grisClaro: '#f8fafc',
  negro: '#002855',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: '📊' },
    { id: 'ac', label: 'Acciones Correctivas', icon: '⚡' },
    { id: 'pm', label: 'Planes de Mejora', icon: '🎯' },
    { id: 'gestor', label: 'Aprobaciones', icon: '🔍' },
  ];

  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORES.grisClaro, fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: sidebarOpen ? 0 : -280,
        top: 0, bottom: 0,
        width: 280,
        background: COLORES.azulOscuro,
        color: COLORES.blanco,
        transition: 'left 0.3s ease',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #2A78B0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              💧
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2, display: 'block' }}>OOMAPASC</span>
              <span style={{ fontSize: '0.65rem', color: '#06b6d4', letterSpacing: 2, fontWeight: 600 }}>PORTAL SGC</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '2rem 1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: '1rem', paddingLeft: '1rem' }}>MENÚ PRINCIPAL</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: 'none',
                borderRadius: '12px',
                background: activeTab === item.id ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: activeTab === item.id ? '#06b6d4' : 'rgba(255,255,255,0.7)',
                fontWeight: activeTab === item.id ? 600 : 400,
                fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                transition: 'all 0.2s',
                borderLeft: activeTab === item.id ? '3px solid #06b6d4' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activeTab === item.id && <span style={{ marginLeft: 'auto' }}>›</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem', margin: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
            A
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Admin. SGC</p>
            <p style={{ fontSize: '0.7rem', color: '#06b6d4', margin: 0 }}>Calidad y Procesos</p>
          </div>
        </div>

        {/* Close button mobile */}
        <button onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>
          ✕
        </button>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,47,85,0.4)', zIndex: 40, display: 'none' }} />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 0, transition: 'margin-left 0.3s' }}>
        
        {/* Header */}
        <header style={{
          background: COLORES.blanco,
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', display: 'none' }}>
              ☰
            </button>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Buscar en el SGC..." style={{
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                background: '#f8fafc',
                width: 280,
                fontSize: '0.85rem',
              }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ position: 'relative', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
              🔔
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              background: COLORES.azulOscuro,
              color: COLORES.blanco,
              border: 'none',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>📄</span>
              <span>Nuevo Documento</span>
            </button>
          </div>
        </header>

        {/* Work Area */}
        <main style={{ flex: 1, padding: '2rem', overflow: 'auto', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s' }}>
          
          {/* Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: COLORES.azulOscuro, margin: 0 }}>
              {activeItem?.label}
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✓</span>
              Sistema de Gestión de Calidad - OOMAPASC de Cajeme
            </p>
          </div>

          {/* Content */}
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