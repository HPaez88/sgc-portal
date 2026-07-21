import React from 'react';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { isSupabaseConfigured } from '../../supabase';

const Header = ({ sidebarCollapsed, setSidebarCollapsed, setIsSidebarOpen, setActiveTab }) => {
  return (
    <header 
      className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all duration-300"
      style={{
        background: 'rgba(0, 21, 46, 0.3)', // dark blue transparent
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(34, 211, 238, 0.15)'
      }}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (window.innerWidth >= 768) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setIsSidebarOpen(true);
            }
          }}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl w-64 border border-cyan-400/20 focus-within:border-cyan-400/60 focus-within:bg-black/40 transition-all shadow-inner">
          <Search size={18} className="text-cyan-400/70" />
          <input 
            type="text" 
            placeholder="Buscar en el SGC..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-200 placeholder-slate-500 font-['Inter']"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">


        <button className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#00152e]"></span>
        </button>

        <button 
          onClick={() => setActiveTab('documents')}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(0, 132, 201, 0.4)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            boxShadow: 'inset 0 2px 10px rgba(34,211,238,0.2), 0 0 15px rgba(0,132,201,0.3)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <Plus size={16} className="text-cyan-300" />
          Nuevo Documento
        </button>
      </div>
    </header>
  );
};
export default Header;
