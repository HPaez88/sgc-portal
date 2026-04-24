import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  FileUp, 
  X,
  ChevronRight,
  Droplet,
  CheckCircle2,
  Clock,
  FileEdit,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getApiUrl } from './config';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'ac', label: 'Acciones Correctivas', icon: AlertTriangle },
    { id: 'pm', label: 'Planes de Mejora', icon: CheckCircle2 },
    { id: 'gestor', label: 'Aprobaciones', icon: FileEdit },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'audits', label: 'Auditorías', icon: ClipboardCheck },
    { id: 'nc', label: 'No Conformidades', icon: AlertTriangle },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const recentDocuments = [
    { id: 1, title: 'Manual de Calidad del Agua v3.0', status: 'Aprobado', date: '23 Abr 2026', author: 'Ing. López', type: 'Manual' },
    { id: 2, title: 'Procedimiento de Saneamiento', status: 'En Revisión', date: '20 Abr 2026', author: 'Lic. García', type: 'Proceso' },
    { id: 3, title: 'Registro de Mantenimiento de Bombas', status: 'Borrador', date: '18 Abr 2026', author: 'Ing. Martínez', type: 'Registro' },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden">
      <div className="absolute -right-6 -top-6 bg-cyan-50/50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-[#002855]">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform duration-300">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <span className={trendUp ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs mes anterior</span>
        </div>
      )}
    </div>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aprobado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'En Revisión': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Borrador': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-72 bg-[#001f42] text-slate-300 transition-transform duration-400 ease-out md:relative md:translate-x-0 flex flex-col shadow-2xl`}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8 bg-[#00152e] relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Droplet size={120} className="text-cyan-400 -mt-10 -mr-10" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Droplet size={24} className="text-white" fill="currentColor" />
            </div>
            <div>
              <span className="block text-xl font-bold tracking-wide text-white leading-tight">OOMAPASC</span>
              <span className="block text-xs text-cyan-400 font-medium tracking-wider">PORTAL SGC</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-6 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 tracking-widest uppercase mb-4">Menú Principal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 font-semibold border-l-4 border-cyan-400' 
                    : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300 transition-colors'} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="text-cyan-400 animate-pulse" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
           <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold shadow-inner">
             A
           </div>
           <div>
             <p className="text-sm font-medium text-white">Admin. SGC</p>
             <p className="text-xs text-cyan-300">Calidad y Procesos</p>
           </div>
        </div>
      </aside>

      {/* Overlay para móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#001f42]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="mr-4 md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar en el SGC..." 
                className="pl-11 pr-4 py-2.5 w-72 lg:w-96 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 shadow-sm text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <button className="relative p-2.5 rounded-full text-slate-400 hover:text-[#002855] hover:bg-slate-100 transition-all duration-300">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 bg-[#002855] hover:bg-[#00152e] text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 group">
              <FileUp size={18} className="group-hover:animate-bounce" />
              <span className="hidden sm:inline text-sm">Nuevo Documento</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Título */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in-up">
              <div>
                <h1 className="text-3xl font-extrabold text-[#002855] tracking-tight">
                  {activeItem?.label}
                </h1>
                <p className="text-slate-500 mt-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-500" />
                  Sistema de Gestión de Calidad - OOMAPAS de Cajeme
                </p>
              </div>
            </div>

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                    <StatCard title="Documentos Activos" value="1,248" icon={FileText} trend="+12" trendUp={true} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '200ms'}}>
                    <StatCard title="Auditorías Pendientes" value="3" icon={ClipboardCheck} trend="-1" trendUp={true} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '300ms'}}>
                    <StatCard title="No Conformidades" value="5" icon={AlertTriangle} trend="+2" trendUp={false} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '400ms'}}>
                    <StatCard title="Procesos Actualizados" value="98%" icon={CheckCircle2} trend="+5%" trendUp={true} />
                  </div>
                </div>

                {/* Recent Documents */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{animationDelay: '500ms'}}>
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-[#002855] flex items-center gap-2">
                      <Clock size={20} className="text-cyan-500" />
                      Actividad Reciente
                    </h2>
                    <button className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                      Ver todo
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {recentDocuments.map((doc, index) => (
                      <div 
                        key={doc.id} 
                        className="p-6 hover:bg-slate-50/80 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-cyan-100 transition-all">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="text-[#002855] font-semibold group-hover:text-cyan-600 transition-colors">
                              {doc.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                              <span>{doc.type}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>{doc.author}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>Modificado: {doc.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          <button className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <FileEdit size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs - exact same style as reference */}
            {activeTab !== 'dashboard' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-fade-in-up">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  {(() => {
                    const ActiveIcon = navItems.find(item => item.id === activeTab)?.icon;
                    return ActiveIcon ? <ActiveIcon size={40} /> : null;
                  })()}
                </div>
                <h3 className="text-xl font-bold text-[#002855] mb-2">Sección en Construcción</h3>
                <p className="text-slate-500 max-w-md">
                  El módulo de {navItems.find(item => item.id === activeTab)?.label.toLowerCase()} se está adaptando al nuevo diseño institucional de OOMAPAS de Cajeme.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Animaciones CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
}

export default App;