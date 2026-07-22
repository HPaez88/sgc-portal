import React from 'react';
import { LayoutDashboard, AlertTriangle, CheckCircle2, Target, AlertOctagon, FileEdit, FileText, ClipboardCheck, Settings, Droplet, LogOut, X } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, sidebarCollapsed, setSidebarCollapsed, usuarioLogueado }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel Principal' },
    { id: 'ac', icon: AlertTriangle, label: 'Acciones Correctivas' },
    { id: 'pm', icon: CheckCircle2, label: 'Planes de Mejora' },
    { id: 'indicadores', icon: Target, label: 'Indicadores' },
    { id: 'riesgos', icon: AlertOctagon, label: 'Matriz de Riesgos' },
    { id: 'gestor', icon: FileEdit, label: 'Aprobaciones' },
    { id: 'documents', icon: FileText, label: 'Documentos' },
    { id: 'audits', icon: ClipboardCheck, label: 'Auditorías' },
    { id: 'settings', icon: Settings, label: 'Configuración' }
  ];

  return (
    <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 ${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen flex flex-col transition-all duration-300 ease-in-out bg-[#002855]`}
           style={{
             borderRight: '1px solid rgba(255, 255, 255, 0.1)'
           }}
    >
      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-cyan-400/10">
        <div className="flex items-center gap-3">
          <Droplet className="text-cyan-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={28} />
          {!sidebarCollapsed && <span className="font-['Fustat'] font-extrabold text-xl tracking-wide text-white whitespace-nowrap">SGC <span className="text-cyan-400">Portal</span></span>}
        </div>
        <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-cyan-500/10 text-white shadow-[inset_4px_0_0_0_#22d3ee] border border-cyan-500/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <item.icon size={22} className={`shrink-0 transition-colors ${activeTab === item.id ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-slate-500 group-hover:text-cyan-200'}`} />
            {!sidebarCollapsed && <span className="font-['Inter'] font-medium whitespace-nowrap text-left">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-cyan-400/10 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <span className="text-white font-bold">{usuarioLogueado?.nombre ? usuarioLogueado.nombre.charAt(0) : 'U'}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-['Inter'] font-semibold text-white truncate">{usuarioLogueado?.nombre || 'Usuario'}</p>
              <p className="text-xs font-['Inter'] text-cyan-400 truncate">{usuarioLogueado?.rol || 'Invitado'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
