import React from 'react';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { isSupabaseConfigured } from '../../supabase';

const Header = ({ sidebarCollapsed, setSidebarCollapsed, setIsSidebarOpen }) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (window.innerWidth >= 768) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setIsSidebarOpen(true);
            }
          }}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg w-64 border border-slate-200 focus-within:border-cyan-500 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en el SGC..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-xs font-medium">{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Local'}</span>
        </div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#002855] hover:bg-[#00152e] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          Nuevo Documento
        </button>
      </div>
    </header>
  );
};
export default Header;
