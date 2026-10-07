import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Sparkles, 
  Menu,
  Award
} from 'lucide-react';

export default function MobileBottomNav({ 
  activeTab, 
  setActiveTab, 
  setIsSidebarOpen,
  alertasCount = 0
}) {
  const items = [
    { id: 'dashboard', label: 'Mi Panel', icon: LayoutDashboard },
    { id: 'indicadores', label: 'Indicadores', icon: Target },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'revision_direccion', label: 'Revisión Dir.', icon: Award },
    { id: 'agente_iso', label: 'Asesor IA', icon: Sparkles, destacado: true },
  ];

  return (
    <nav 
      aria-label="Navegación Móvil" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-up px-2 py-1.5 flex items-center justify-around"
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
              isActive 
                ? 'text-sky-700 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${
              isActive 
                ? 'bg-sky-50 text-sky-700 scale-110' 
                : item.destacado 
                ? 'text-purple-600' 
                : ''
            }`}>
              <Icon size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 line-clamp-1">
              {item.label}
            </span>

            {/* Badge de alertas en dashboard */}
            {item.id === 'dashboard' && alertasCount > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        );
      })}

      {/* Botón Más / Menú completo lateral */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all cursor-pointer min-w-[56px]"
      >
        <div className="p-1 rounded-lg">
          <Menu size={19} />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">
          Más
        </span>
      </button>
    </nav>
  );
}
