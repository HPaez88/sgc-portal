import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  AlertOctagon, 
  FileEdit, 
  FileText, 
  ClipboardCheck, 
  Settings, 
  Droplet, 
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Award
} from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  usuarioLogueado 
}) => {
  const navSections = [
    {
      title: 'OPERACIÓN Y MEJORA',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Panel Principal' },
        { id: 'ac', icon: AlertTriangle, label: 'Acciones Correctivas', badge: 'OOMRSC-20' },
        { id: 'pm', icon: CheckCircle2, label: 'Planes de Mejora', badge: 'OOMRSC-21' },
        { id: 'gestor', icon: FileEdit, label: 'Aprobaciones' },
      ]
    },
    {
      title: 'DESEMPEÑO Y CONTROL',
      items: [
        { id: 'revision_direccion', icon: Award, label: 'Revisión Dirección', badge: 'OOMRSC-04' },
        { id: 'indicadores', icon: Target, label: 'Indicadores SGC', count: 86 },
        { id: 'riesgos', icon: AlertOctagon, label: 'Matriz de Riesgos' },
        { id: 'audits', icon: ClipboardCheck, label: 'Auditorías' },
      ]
    },
    {
      title: 'GOBERNANZA E INTELIGENCIA',
      items: [
        { id: 'documents', icon: FileText, label: 'Control Documental', badge: 'Trazabilidad' },
        { id: 'agente_iso', icon: Sparkles, label: 'Asesor Normativo ISO', badge: 'IA ISO' },
        { id: 'settings', icon: Settings, label: 'Configuración' },
      ]
    }
  ];

  return (
    <aside 
      className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:relative z-50 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } h-screen flex flex-col transition-all duration-200 ease-out bg-[#0A1424] border-r border-slate-800/80 shadow-xl`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center shrink-0 shadow-md">
            <Droplet className="text-white fill-white/20" size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className="leading-tight truncate">
              <span className="font-extrabold text-sm tracking-wide text-white block">
                OOMAPASC <span className="text-sky-400 font-medium">SGC</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                PORTAL DE CALIDAD
              </span>
            </div>
          )}
        </div>
        <button 
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg" 
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { 
                    setActiveTab(item.id); 
                    setIsSidebarOpen(false); 
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group text-xs font-semibold ${
                    isActive 
                      ? 'bg-sky-500/15 text-white border border-sky-500/30 shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <item.icon 
                      size={18} 
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} 
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed && item.count && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                      {item.count}
                    </span>
                  )}
                  {!sidebarCollapsed && item.badge && !isActive && (
                    <span className="text-[9px] font-mono text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Institutional Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          {!sidebarCollapsed && (
            <div className="truncate text-left leading-tight">
              <p className="text-[11px] font-semibold text-slate-300 truncate">ISO 9001:2015</p>
              <p className="text-[9px] text-slate-400 font-mono">Certificación Vigente</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
