import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AccionCorrectivaForm from './components/AccionCorrectivaForm';
import PlanMejoraForm from './components/PlanMejoraForm';
import GestorAprobaciones from './components/GestorAprobaciones';

const COLORES = {
  azul: '#2A78B0',
  azulOscuro: '#002855',
  cyan: '#06b6d4',
  verde: '#10b981',
  rojo: '#ef4444',
  naranja: '#f59e0b',
  blanco: '#ffffff',
  grisClaro: '#f8fafc',
  grisBorde: '#e5e7eb',
  texto: '#475569',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNewDocMenu, setShowNewDocMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: '📊' },
    { id: 'documents', label: 'Documentos', icon: '📄' },
    { id: 'audits', label: 'Auditorías', icon: '🔍' },
    { id: 'nc', label: 'No Conformidades', icon: '⚠️' },
    { id: 'gestor', label: 'Aprobaciones', icon: '✅' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
  ];

  const handleNewDoc = (type) => {
    setShowNewDocMenu(false);
    if (type === 'ac') setActiveTab('ac');
    if (type === 'pm') setActiveTab('pm');
  };

  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORES.grisClaro, fontFamily: "'Poppins', sans-serif", overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isSidebarOpen ? 0 : -280,
        top: 0, bottom: 0,
        width: 280,
        background: COLORES.azulOscuro,
        transition: 'transform 0.4s ease',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 2rem', background: '#00152e', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <span style={{ fontSize: '5rem' }}>💧</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #2A78B0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(6,182,212,0.3)',
            }}>
              <span style={{ fontSize: '1.5rem' }}>💧</span>
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORES.blanco, lineHeight: 1.2, display: 'block' }}>OOMAPASC</span>
              <span style={{ fontSize: '0.65rem', color: COLORES.cyan, letterSpacing: 2, fontWeight: 600 }}>PORTAL SGC</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ 
            position: 'absolute', right: 16, top: 16, 
            background: 'none', border: 'none', color: COLORES.blanco, 
            fontSize: '1.25rem', cursor: 'pointer', display: 'none' 
          }}>✕</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '2rem 1rem', overflow: 'auto' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: '1rem', paddingLeft: '1rem' }}>MENÚ PRINCIPAL</p>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: 'none',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                  color: isActive ? COLORES.cyan : 'rgba(255,255,255,0.7)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  transition: 'all 0.3s',
                  borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span style={{ marginLeft: 'auto', animation: 'pulse 2s infinite' }}>›</span>}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem', margin: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: COLORES.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORES.blanco, fontWeight: 700 }}>
            A
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORES.blanco, margin: 0 }}>Admin. SGC</p>
            <p style={{ fontSize: '0.7rem', color: COLORES.cyan, margin: 0 }}>Calidad y Procesos</p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,47,85,0.4)', zIndex: 40 }} />
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 0, transition: 'margin-left 0.3s' }}>
        
        {/* Header */}
        <header style={{
          background: COLORES.blanco,
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 2.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setIsSidebarOpen(true)} style={{ 
              background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer',
              padding: '0.5rem', borderRadius: 8, color: COLORES.texto 
            }}>☰</button>
            
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Buscar en el SGC..." style={{
                padding: '0.625rem 1rem 0.625rem 2.75rem',
                borderRadius: '999px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                width: 320,
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            <button style={{ position: 'relative', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
              🔔
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: COLORES.rojo, borderRadius: '50%', border: '2px solid #fff' }} />
            </button>
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNewDocMenu(!showNewDocMenu)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: COLORES.azulOscuro,
                  color: COLORES.blanco,
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,40,85,0.3)',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>📄</span>
                <span>Nuevo Documento</span>
              </button>

              {/* Dropdown */}
              {showNewDocMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: COLORES.blanco, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  overflow: 'hidden', zIndex: 100, minWidth: 220,
                  border: '1px solid #e2e8f0',
                }}>
                  <button onClick={() => handleNewDoc('ac')} style={{
                    width: '100%', padding: '1rem 1.25rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    fontSize: '0.9rem', color: COLORES.texto,
                    transition: 'background 0.2s',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>⚡</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>Acción Correctiva</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Registrar NC</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: '#e2e8f0' }} />
                  <button onClick={() => handleNewDoc('pm')} style={{
                    width: '100%', padding: '1rem 1.25rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    fontSize: '0.9rem', color: COLORES.texto,
                    transition: 'background 0.2s',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🎯</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>Plan de Mejora</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nueva mejora</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '2.5rem', overflow: 'auto' }}>
          {/* Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: COLORES.azulOscuro, margin: 0 }}>
              {activeItem?.label}
            </h1>
            <p style={{ fontSize: '0.9rem', color: COLORES.texto, margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: COLORES.cyan }}>✓</span>
              Sistema de Gestión de Calidad - OOMAPASC de Cajeme
            </p>
          </div>

          {/* Views */}
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

          {activeTab === 'documents' && (
            <div style={{ background: COLORES.blanco, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORES.azulOscuro, marginBottom: '0.5rem' }}>Módulo de Documentos</h3>
              <p style={{ color: COLORES.texto }}>Sección en construcción</p>
            </div>
          )}

          {activeTab === 'audits' && (
            <div style={{ background: COLORES.blanco, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORES.azulOscuro, marginBottom: '0.5rem' }}>Módulo de Auditorías</h3>
              <p style={{ color: COLORES.texto }}>Sección en construcción</p>
            </div>
          )}

          {activeTab === 'nc' && (
            <div style={{ background: COLORES.blanco, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORES.azulOscuro, marginBottom: '0.5rem' }}>No Conformidades</h3>
              <p style={{ color: COLORES.texto }}>Sección en construcción</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ background: COLORES.blanco, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORES.azulOscuro, marginBottom: '0.5rem' }}>Configuración</h3>
              <p style={{ color: COLORES.texto }}>Sección en construcción</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;