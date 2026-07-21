import React, { useState } from 'react';
import { useSGC } from './SGCContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BackgroundAnimation from './components/layout/BackgroundAnimation';
import LandingView from './components/landing/LandingView';

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


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [haIngresado, setHaIngresado] = useState(false);

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
    areaUsuario
  } = useSGC();

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
    { id: 'indicadores', label: 'Indicadores' },
    { id: 'riesgos', label: 'Matriz de Riesgos' },
    { id: 'gestor', label: 'Aprobaciones' },
    { id: 'documents', label: 'Documentos' },
    { id: 'audits', label: 'Auditorías' },
    { id: 'settings', label: 'Configuración' },
  ];
  const activeItem = navItems.find(item => item.id === activeTab);

  if (!haIngresado) {
    return <LandingView onEnter={() => setHaIngresado(true)} />;
  }

  return (
    <div className="flex h-screen bg-transparent font-sans text-slate-200 overflow-hidden">
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveTab={setActiveTab}
        />

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
          <BackgroundAnimation />

          <div className="relative z-10">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {activeItem?.label}
                  </h1>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    Sistema de Gestión de Calidad - OOMAPAS de Cajeme
                  </p>
                </div>
              </div>
              {renderModule()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;