import React from 'react';
import { Menu, Search, Bell, HelpCircle, ShieldCheck, ChevronDown, History, LogOut, Sparkles } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import { getRolColor, puedeVerTodasAreas } from '../../constants';

const Header = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  setIsSidebarOpen, 
  setActiveTab, 
  usuarios = [], 
  usuarioLogueado, 
  setUsuarioActivoId 
}) => {
  const { cerrarSesion, estadoSync } = useSGC();
  const toast = useToast();

  // Badge de sincronización: refleja si hay cambios pendientes o errores de red.
  const syncInfo = (() => {
    if (estadoSync?.ultimoError) {
      return { label: 'Error de sync', dot: 'bg-rose-500', ping: 'bg-rose-400', texto: 'text-rose-700', title: estadoSync.ultimoError };
    }
    if ((estadoSync?.pendientes || 0) > 0) {
      return { label: 'Sincronizando…', dot: 'bg-amber-500', ping: 'bg-amber-400', texto: 'text-amber-700', title: `${estadoSync.pendientes} cambio(s) pendientes de subir` };
    }
    return { label: 'Sincronizado', dot: 'bg-emerald-500', ping: 'bg-emerald-400', texto: 'text-emerald-700', title: estadoSync?.ultimaSync ? `Última sincronización: ${new Date(estadoSync.ultimaSync).toLocaleTimeString('es-MX')}` : 'Sin cambios pendientes' };
  })();

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Left section: Toggle & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (window.innerWidth >= 768) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setIsSidebarOpen(true);
            }
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Colapsar / Expandir Menú"
        >
          <Menu size={20} />
        </button>

        {/* ISO 9001 System Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-600 font-bold">ISO 9001:2015</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">OOMAPASC En Línea</span>
        </div>

        {/* Estado de sincronización con Supabase */}
        <div
          className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] font-semibold ${syncInfo.texto}`}
          title={syncInfo.title}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncInfo.ping} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${syncInfo.dot}`}></span>
          </span>
          <span>{syncInfo.label}</span>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-white rounded-lg w-72 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/15 transition-all">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar folios, auditorías, normas..."
            className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-700 placeholder-slate-400"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right section: User Pill & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Executive User Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 pr-2 py-1.5 bg-slate-50/90 border border-slate-200/90 rounded-xl hover:border-slate-300 transition-colors min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {usuarioLogueado?.nombre ? usuarioLogueado.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Usuario en línea"
            />
          </div>

          <div className="text-left min-w-0 max-w-[120px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[300px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <select
                value={usuarioLogueado?.id ?? ''}
                onChange={(e) => setUsuarioActivoId?.(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer truncate w-full max-w-full pr-1 hover:text-sky-700 transition-colors"
                title="Cambiar usuario de simulación"
                aria-label="Usuario activo"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.rol})
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
              <span className="font-medium text-slate-600 truncate">{usuarioLogueado?.area || 'Sin área asignada'}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Online
              </span>
            </div>
          </div>

          <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs whitespace-nowrap ${getRolColor(usuarioLogueado?.rol)}`}>
            {usuarioLogueado?.rol || 'Invitado'}
          </span>
        </div>

        {/* Asesor Normativo ISO IA */}
        <button
          onClick={() => setActiveTab?.('agente_iso')}
          className="p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors relative"
          title="Consultar al Asesor & Auditor Normativo ISO (IA)"
        >
          <Sparkles size={18} />
        </button>

        {/* Control Documental & Bitácora */}
        <button
          onClick={() => setActiveTab?.('documents')}
          className="p-2 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
          title="Ver Control Documental & Bitácora de Auditoría SGC"
        >
          <History size={18} />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notificaciones"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Help Button */}
        <button
          onClick={() => toast.info('SGC Portal OOMAPASC - Guía de Operaciones ISO 9001:2015 disponible.')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all hover:border-slate-300"
        >
          <HelpCircle size={15} className="text-slate-500" />
          <span>Manual</span>
        </button>

        {/* Logout Button */}
        <button 
          onClick={() => cerrarSesion('Cierre de sesión manual')}
          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          title="Cerrar Sesión del Portal"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
