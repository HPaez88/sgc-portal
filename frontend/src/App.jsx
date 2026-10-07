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
import MobileBottomNav from './components/layout/MobileBottomNav';
import MobileExecutiveBar from './components/layout/MobileExecutiveBar';
import MobilePortalView from './components/mobile/MobilePortalView';
import { useIsMobile } from './hooks';


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [areaFiltroMobile, setAreaFiltroMobile] = useState('');
  const { isMobile } = useIsMobile();
  const [forzarModoEscritorio, setForzarModoEscritorio] = useState(() => {
    try {
      return sessionStorage.getItem('sgc_forzar_desktop') === 'true';
    } catch {
      return false;
    }
  });

  const cambiarModoEscritorio = (val) => {
    setForzarModoEscritorio(val);
    try {
      sessionStorage.setItem('sgc_forzar_desktop', val ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

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

  // Si estamos en un dispositivo móvil (< 768px) y no se ha forzado el modo de escritorio,
  // mostrar la vista ejecutiva móvil exclusiva (Opción 1: consulta, pendientes y procedimientos).
  if (isMobile && !forzarModoEscritorio) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
        <ModalInactividad />
        <ErrorBoundary>
          <MobilePortalView onCambiarAModoEscritorio={() => cambiarModoEscritorio(true)} />
        </ErrorBoundary>
      </div>
    );
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

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-3 pb-24 sm:p-5 sm:pb-6 lg:p-6 lg:pb-6 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
          <div className="relative z-10 w-full">
            <div className="w-full space-y-4">
              {/* Barra Ejecutiva de Consulta Móvil (Sólo visible en pantallas móviles) */}
              <MobileExecutiveBar
                areaFiltroMobile={areaFiltroMobile}
                setAreaFiltroMobile={setAreaFiltroMobile}
              />

              {/* Banner de Obligaciones de Captura SGC (Sólo en escritorio donde se captura) */}
              <div className="hidden md:block">
                <BannerObligacionesCaptura setActiveTab={setActiveTab} />
              </div>

              <ErrorBoundary key={activeTab}>
                {renderModule()}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>

      {/* Navegación ergonómica inferior en móviles */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Botón flotante para regresar a Vista Móvil Ejecutiva si se forzó la versión de escritorio */}
      {isMobile && forzarModoEscritorio && (
        <button
          onClick={() => cambiarModoEscritorio(false)}
          className="fixed bottom-20 right-4 z-50 bg-[#001f42] hover:bg-sky-900 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-2xl border border-sky-400/60 flex items-center gap-1.5 transition-transform active:scale-95 animate-fade-in-up"
          title="Regresar a Vista Móvil Ejecutiva"
        >
          <span>📱</span>
          <span>Volver a Vista Móvil</span>
        </button>
      )}
    </div>
  );
}

export default App;