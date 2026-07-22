import React from 'react';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../../supabase';

const Header = ({ sidebarCollapsed, setSidebarCollapsed, setIsSidebarOpen, setActiveTab }) => {
  return (
    <header 
      className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all duration-300 bg-white"
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
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
          className="p-2 rounded-lg text-slate-500 hover:text-[#002855] hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl w-64 border border-slate-200 focus-within:border-cyan-500 focus-within:shadow-sm transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en el SGC..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 placeholder-slate-400 font-['Inter']"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">


        <button className="relative p-2 text-slate-500 hover:text-[#002855] hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button 
          onClick={() => alert('El Centro de Ayuda estará disponible próximamente.')}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: '#002855',
            boxShadow: '0 4px 6px -1px rgba(0, 40, 85, 0.1)'
          }}
        >
          <HelpCircle size={16} className="text-white" />
          Centro de Ayuda
        </button>
      </div>
    </header>
  );
};
export default Header;
