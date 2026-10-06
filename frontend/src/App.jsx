import React, { useState } from 'react';
import { useSGC } from './SGCContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BackgroundAnimation from './components/layout/BackgroundAnimation';

// Módulos PRIORITARIOS
import DashboardView from './components/dashboard/DashboardView';
import AccionCorrectivaViewExternal from './components/AccionCorrectivaView';
import PlanMejoraViewExternal from './components/PlanMejoraView';
import IndicadoresView from './components/indicadores';
import GestorAprobacionesView from './components/aprobaciones';
import SettingsView from './components/settings';

// Módulos secundarios (para escalar)
import RiesgosView from './components/riesgos';
import DocumentosView from './components/documentos';
import AuditoriasView from './components/auditorias';
import BitacoraView from './components/bitacora';
import AgenteISOView from './components/iso/AgenteISOView';
import RevisionDireccionView from './components/revision/RevisionDireccionView';
import ModalInactividad from './components/common/ModalInactividad';
import LoginView from './components/common/LoginView';
import BannerObligacionesCaptura from './components/common/BannerObligacionesCaptura';
import ErrorBoundary from './components/common/ErrorBoundary';


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const {
    isLoaded,
    accionesCorrectivas,
    setAccionesCorrectivas,
    planesMejora,
    setPlanesMejora,
    indicadoresData,
    setIndicadoresData,
    usuarios,
    setUsuarios,
    riesgos,
    setRiesgos,
    documentos,
    setDocumentos,
    auditorias,
    setAuditorias,
    evidencias,
    setEvidencias,
    usuarioLogueado,
    puedeTodasAreas,
    areaUsuario,
    usuarioActivoId,
    setUsuarioActivoId,
    sesionActiva
  } = useSGC();

  // Si la sesión no está activa (por logout o inactividad de 1 hora), mostrar pantalla de login
  if (!sesionActiva) {
    return <LoginView />;
  }

  // === RENDER MÓDULO ACTIVO ===
  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            accionesCorrectivas={accionesCorrectivas}
            planesMejora={planesMejora}
            documentos={documentos}
            auditorias={auditorias}
            setActiveTab={setActiveTab}
          />
        );
      case 'ac':
        return (
          <AccionCorrectivaViewExternal
            accionesCorrectivas={accionesCorrectivas}
            setAccionesCorrectivas={setAccionesCorrectivas}
            evidencias={evidencias}
            setEvidencias={setEvidencias}
            usuarios={usuarios}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
            usuarioLogueado={usuarioLogueado}
          />
        );
      case 'pm':
        return (
          <PlanMejoraViewExternal
            planesMejora={planesMejora}
            setPlanesMejora={setPlanesMejora}
            usuarios={usuarios}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
            usuarioLogueado={usuarioLogueado}
          />
        );
      case 'indicadores':
        return (
          <IndicadoresView
            indicadoresData={indicadoresData}
            setIndicadoresData={setIndicadoresData}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'revision_direccion':
        return (
          <RevisionDireccionView
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'riesgos':
        return (
          <RiesgosView
            riesgos={riesgos}
            setRiesgos={setRiesgos}
            usuarios={usuarios}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'gestor':
        return (
          <GestorAprobacionesView
            accionesCorrectivas={accionesCorrectivas}
            planesMejora={planesMejora}
            setAccionesCorrectivas={setAccionesCorrectivas}
            setPlanesMejora={setPlanesMejora}
            usuarios={usuarios}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
            usuarioLogueado={usuarioLogueado}
          />
        );
      case 'documents':
        return (
          <DocumentosView
            documentos={documentos}
            setDocumentos={setDocumentos}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'audits':
        return (
          <AuditoriasView
            auditorias={auditorias}
            setAuditorias={setAuditorias}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'agente_iso':
        return <AgenteISOView setActiveTab={setActiveTab} />;
      case 'bitacora':
        return (
          <DocumentosView
            documentos={documentos}
            setDocumentos={setDocumentos}
            puedeTodasAreas={puedeTodasAreas}
            areaUsuario={areaUsuario}
          />
        );
      case 'settings':
        return (
          <SettingsView
            usuarios={usuarios}
            setUsuarios={setUsuarios}
          />
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal' },
    { id: 'ac', label: 'Acciones Correctivas' },
    { id: 'pm', label: 'Planes de Mejora' },
    { id: 'revision_direccion', label: 'Revisión por la Dirección (OOMRSC-04)' },
    { id: 'indicadores', label: 'Indicadores' },
    { id: 'riesgos', label: 'Matriz de Riesgos y Oportunidades' },
    { id: 'gestor', label: 'Aprobaciones' },
    { id: 'documents', label: 'Control Documental' },
    { id: 'audits', label: 'Auditorías' },
    { id: 'agente_iso', label: 'Asesor Normativo ISO' },
    { id: 'settings', label: 'Configuración' },
  ];
  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <ModalInactividad />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        usuarioLogueado={usuarioLogueado}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#001f42]/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveTab={setActiveTab}
          usuarios={usuarios}
          usuarioLogueado={usuarioLogueado}
          setUsuarioActivoId={setUsuarioActivoId}
        />

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
          <div className="relative z-10 w-full">
            <div className="w-full space-y-5">
              {/* Banner de Obligaciones de Captura SGC (Primeros 10 días del mes) */}
              <BannerObligacionesCaptura setActiveTab={setActiveTab} />

              {activeTab !== 'dashboard' && activeTab !== 'agente_iso' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                      <span>SGC Portal</span>
                      <span>/</span>
                      <span className="text-sky-700 font-bold">{activeItem?.label}</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeItem?.label}
                    </h1>
                  </div>
                </div>
              )}
              <ErrorBoundary key={activeTab}>
                {renderModule()}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;