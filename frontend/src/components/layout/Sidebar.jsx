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
    <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 ${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen bg-[#001f42] text-white flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-6 bg-[#00152e]">
        <div className="flex items-center gap-3">
          <Droplet className="text-cyan-400 shrink-0" size={28} />
          {!sidebarCollapsed && <span className="font-extrabold text-xl tracking-wide whitespace-nowrap">SGC <span className="text-cyan-400">Portal</span></span>}
        </div>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400 shadow-sm' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={22} className={`shrink-0 ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="font-medium whitespace-nowrap text-left">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 bg-[#00152e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center shrink-0">
            {usuarioLogueado?.nombre ? usuarioLogueado.nombre.charAt(0) : 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{usuarioLogueado?.nombre || 'Usuario'}</p>
              <p className="text-xs text-cyan-400 truncate">{usuarioLogueado?.rol || 'Invitado'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
