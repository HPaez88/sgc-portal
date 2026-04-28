import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
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
  TrendingDown,
  Sparkles,
  Save,
  Send,
  Plus,
  Trash2,
  Loader2,
  Target,
  AlertOctagon,
  Users,
  Phone,
  Mail,
  Building,
  Eye,
  Edit,
  Filter,
  Check,
  AlertCircle,
  Download
} from 'lucide-react';
import { getApiUrl } from './config';
import { AGENTS, callAgent, parseAgentResponse, generatePrompt } from './agents';
import { AREAS, DIRECCIONES, PROCESOS, ORIGENES_AC, getColorNivel, getNivelRiesgo, getEstadoColor, getRolColor, INDICADORES, getIndicadoresByArea } from './catalogs';
import { useLocalStorage, useFormValidation } from './hooks';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper para guardar en Supabase
  const saveToSupabase = useCallback(async (table, data) => {
    if (!data || !Array.isArray(data)) return;
    try {
      const items = data.filter(item => item.id).map(({ created_at, ...rest }) => rest);
      if (items.length === 0) return;
      const { error } = await supabase.from(table).upsert(items, { onConflict: 'id' });
      if (error) console.warn(`Save error [${table}]:`, error.message);
      else console.log(`Saved to Supabase [${table}]:`, items.length, 'records');
    } catch (e) {
      console.error(`Save error [${table}]:`, e);
    }
  }, []);

  const [accionesCorrectivas, setAccionesCorrectivas] = useLocalStorage('sgc-acciones-correctivas', []);
  const setAccionesCorrectivasSync = useCallback((data) => {
    setAccionesCorrectivas(data);
    saveToSupabase('acciones_correctivas', Array.isArray(data) ? data : [data]);
  }, [setAccionesCorrectivas, saveToSupabase]);
  
  const [planesMejora, setPlanesMejora] = useLocalStorage('sgc-planes-mejora', []);
  const setPlanesMejoraSync = useCallback((data) => {
    setPlanesMejora(data);
    saveToSupabase('planes_mejora', Array.isArray(data) ? data : [data]);
  }, [setPlanesMejora, saveToSupabase]);
  
  const [indicadoresData, setIndicadoresData] = useLocalStorage('sgc-indicadores-data', {});
  const [usuarios, setUsuarios] = useLocalStorage('sgc-usuarios', [
    { id: 1, nombre: 'Lic. Héctor Manuel Páez León', email: 'hpaez@oomapasc.gob.mx', telefono: '6441894125', area: 'Sistema de Gestión de Calidad', rol: 'Super Admin', direccion: 'Dir. General', password: 'sgc2026' },
    { id: 2, nombre: 'Ing. Juan López', email: 'jlopez@oomapasc.gob.mx', telefono: '6441234567', area: 'Control de Calidad', rol: 'Admin', direccion: 'Dir. Técnica', password: '' },
    { id: 3, nombre: 'Lic. María García', email: 'mgarcia@oomapasc.gob.mx', telefono: '6442345678', area: 'Atención Ciudadana', rol: 'Usuario', direccion: 'Dir. Comercial', password: '' },
    { id: 4, nombre: 'Ing. Pedro Martínez', email: 'pmartinez@oomapasc.gob.mx', telefono: '6443456789', area: 'Mantenimiento de Redes', rol: 'Encargado', direccion: 'Dir. Técnica', password: '' },
    { id: 5, nombre: 'C.P. Ana Hernández', email: 'ahernandez@oomapasc.gob.mx', telefono: '6444567890', area: 'Contabilidad', rol: 'Encargado', direccion: 'Dir. Administrativa', password: '' },
    { id: 6, nombre: 'Ing. Roberto Torres', email: 'rtorres@oomapasc.gob.mx', telefono: '6445678901', area: 'Sistema de Gestión de Calidad', rol: 'Admin', direccion: 'Dir. General', password: '' },
  ]);
  const [riesgos, setRiesgos] = useLocalStorage('sgc-riesgos', [
    { id: 1, riesgo: 'Contaminación del agua', causa: 'Fallas en proceso de potabilización', efecto: 'Problemas de salud', probabilidad: 3, impacto: 4, control: 'Cloración', tipo: 'Riesgo', area: 'Operación', direccion: 'Dir. Técnica', proceso: 'Producción', plan_accion: 'Mejorar monitoreo de cloro', fecha_termino: '2026-06-30', evaluacion: 'En proceso', estado_plan: 'EN_PROCESO' },
    { id: 2, riesgo: 'Falla de bombas', causa: 'Falta de mantenimiento', efecto: 'Sin servicio', probabilidad: 2, impacto: 4, control: 'Mantenimiento preventivo', tipo: 'Riesgo', area: 'Mantenimiento', direccion: 'Dir. Técnica', proceso: 'Mantenimiento y Calibración', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' },
    { id: 3, riesgo: 'Quejas de clientes', causa: 'Atención lenta', efecto: 'Inconformidad', probabilidad: 3, impacto: 2, control: 'Capacitación', tipo: 'Riesgo', area: 'Comercialización', direccion: 'Dir. Comercial', proceso: 'Comercialización', plan_accion: 'Capacitación en atención', fecha_termino: '2026-05-15', evaluacion: 'Bueno', estado_plan: 'COMPLETADO' },
    { id: 4, riesgo: 'Cortocircuito', causa: 'Cables viejas', efecto: 'Incendio', probabilidad: 1, impacto: 5, control: 'Renovación', tipo: 'Riesgo', area: 'Mantenimiento', direccion: 'Dir. Administrativa', proceso: 'Mantenimiento y Calibración', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' },
    { id: 5, riesgo: 'Clientes nuevos', causa: 'Promociones', efecto: 'Más ingresos', probabilidad: 4, impacto: 3, control: '', tipo: 'Oportunidad', area: 'Comercialización', direccion: 'Dir. Comercial', proceso: 'Comercialización', plan_accion: 'Campaña de promo', fecha_termino: '2026-07-01', evaluacion: '', estado_plan: 'EN_PROCESO' },
  ]);
  const setRiesgosSync = useCallback((data) => {
    setRiesgos(data);
    saveToSupabase('riesgos', Array.isArray(data) ? data : [data]);
  }, [setRiesgos, saveToSupabase]);
  
  const [seguimientos, setSeguimientos] = useLocalStorage('sgc-seguimientos', []);
  const [documentos, setDocList] = useLocalStorage('sgc-documentos', [
    { id: 1, titulo: 'Manual de Calidad del Agua v3.0', tipo: 'Manual', estado: 'APROBADO', area: 'Sistema de Gestión de Calidad', version: '3.0', fecha: '2026-01-15', autor: 'Ing. Juan López' },
    { id: 2, titulo: 'Procedimiento de Saneamiento', tipo: 'Procedimiento', estado: 'EN_REVISION', area: 'Alcantarillado y Saneamiento', version: '1.2', fecha: '2026-03-20', autor: 'Lic. García' },
    { id: 3, titulo: 'Registro de Mantenimiento de Bombas', tipo: 'Registro', estado: 'BORRADOR', area: 'Mantenimiento de Redes', version: '2.0', fecha: '2026-04-18', autor: 'Ing. Martínez' },
  ]);
  const setDocListSync = useCallback((data) => {
    setDocList(data);
    saveToSupabase('documentos', Array.isArray(data) ? data : [data]);
  }, [setDocList, saveToSupabase]);
  
  const [auditorias, setAuditorias] = useLocalStorage('sgc-auditorias', [
    { id: 1, numero: 'AUD-2026-001', tipo: 'Interna', area: 'Sistema de Gestión de Calidad', fecha_inicio: '2026-01-15', fecha_fin: '2026-01-17', estado: 'COMPLETADA', hallazgos: 3, no_conformidades: 1 },
    { id: 2, numero: 'AUD-2026-002', tipo: 'Interna', area: 'Control de Calidad', fecha_inicio: '2026-02-20', fecha_fin: '2026-02-22', estado: 'COMPLETADA', hallazgos: 2, no_conformidades: 0 },
  ]);
  const setAuditoriasSync = useCallback((data) => {
    setAuditorias(data);
    saveToSupabase('auditorias', Array.isArray(data) ? data : [data]);
  }, [setAuditorias, saveToSupabase]);
  
  const [evidencias, setEvidencias] = useLocalStorage('sgc-evidencias', []);

  // Helper para sync bidireccional con Supabase
  const syncWithSupabase = useCallback(async (table, data, setData, key) => {
    try {
      // 1. Cargar de Supabase
      const { data: sbData, error: sbError } = await supabase.from(table).select('*').order('id');
      if (sbError) {
        console.warn(`Sync warning [${table}]:`, sbError.message);
      } else if (sbData && sbData.length > 0) {
        // Mapear datos de Supabase (remover metadata)
        const mapped = sbData.map(({ created_at, ...rest }) => rest);
        // Usar datos de Supabase como source of truth
        setData(mapped);
        localStorage.setItem(key, JSON.stringify(mapped));
        console.log(`Synced from Supabase [${table}]:`, mapped.length, 'records');
      }
    } catch (e) {
      console.error(`Sync error [${table}]:`, e);
    }
  }, []);

  // Sync todos los módulos al cargar
  useEffect(() => {
    setIsLoaded(true);
    
    async function syncAllData() {
      await syncWithSupabase('usuarios', usuarios, setUsuarios, 'sgc-usuarios');
      await syncWithSupabase('acciones_correctivas', accionesCorrectivas, setAccionesCorrectivas, 'sgc-acciones-correctivas');
      await syncWithSupabase('planes_mejora', planesMejora, setPlanesMejora, 'sgc-planes-mejora');
      await syncWithSupabase('riesgos', riesgos, setRiesgos, 'sgc-riesgos');
      await syncWithSupabase('documentos', documentos, setDocList, 'sgc-documentos');
      await syncWithSupabase('auditorias', auditorias, setAuditorias, 'sgc-auditorias');
    }
    
    syncAllData();
  }, []);

  const usuarioLogueado = usuarios && usuarios.length > 0 ? usuarios[0] : null;
  const puedeTodasAreas = usuarioLogueado?.rol === 'Admin' || usuarioLogueado?.rol === 'Auditor' || usuarioLogueado?.rol === 'Super Admin';
  const areaUsuario = usuarioLogueado?.area || '';

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'ac', label: 'Acciones Correctivas', icon: AlertTriangle },
    { id: 'pm', label: 'Planes de Mejora', icon: CheckCircle2 },
    { id: 'indicadores', label: 'Indicadores', icon: Target },
    { id: 'riesgos', label: 'Matriz de Riesgos', icon: AlertOctagon },
    { id: 'gestor', label: 'Aprobaciones', icon: FileEdit },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'audits', label: 'Auditorías', icon: ClipboardCheck },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const recentDocuments = [
    { id: 1, title: 'Manual de Calidad del Agua v3.0', status: 'Aprobado', date: '23 Abr 2026', author: 'Ing. López', type: 'Manual' },
    { id: 2, title: 'Procedimiento de Saneamiento', status: 'En Revisión', date: '20 Abr 2026', author: 'Lic. García', type: 'Proceso' },
    { id: 3, title: ' Registro de Mantenimiento de Bombas', status: 'Borrador', date: '18 Abr 2026', author: 'Ing. Martínez', type: 'Registro' },
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
        } fixed inset-y-0 left-0 z-50 bg-[#001f42] text-slate-300 transition-all duration-300 ease-out md:relative md:translate-x-0 flex flex-col shadow-2xl ${
          sidebarCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        <div className={`h-20 flex items-center bg-[#00152e] relative overflow-hidden ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Droplet size={120} className="text-cyan-400 -mt-10 -mr-10" />
          </div>
          {sidebarCollapsed ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Droplet size={24} className="text-white" fill="currentColor" />
            </div>
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Droplet size={24} className="text-white" fill="currentColor" />
              </div>
              <div>
                <span className="block text-xl font-bold tracking-wide text-white leading-tight">OOMAPASC</span>
                <span className="block text-xs text-cyan-400 font-medium tracking-wider">PORTAL SGC</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'px-2' : 'px-4'} py-4`}>
          {!sidebarCollapsed && (
            <p className="px-2 text-xs font-semibold text-slate-500 tracking-widest uppercase mb-4">Menú</p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center rounded-xl transition-all duration-300 group ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-3.5'} ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 font-semibold border-l-4 border-cyan-400' 
                    : 'hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'} />
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-3">{item.label}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto text-cyan-400" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

<div className={`p-3 mx-2 mb-2 rounded-xl bg-white/5 border border-white/10 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
           {sidebarCollapsed ? (
             <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
               A
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                 A
               </div>
               <div>
                 <p className="text-sm font-medium text-white">Admin. SGC</p>
                 <p className="text-xs text-cyan-300">En línea</p>
               </div>
             </div>
           )}
        </div>
      </aside>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#001f42]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        
<header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="mr-2 p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors hover:text-cyan-600"
              title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
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
            <span className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Supabase
            </span>
            
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

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
           
          {/* Fondo animado */}
          <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
            {/* Burbuja 1 grande */}
            <div className="absolute w-80 h-80 rounded-full bg-gradient-to-b from-cyan-300/30 to-blue-400/30 animate-float-1" style={{ left: '-5%', top: '5%' }} />
            {/* Burbuja 2 */}
            <div className="absolute w-60 h-60 rounded-full bg-gradient-to-b from-blue-300/25 to-cyan-400/25 animate-float-2" style={{ right: '-2%', top: '25%' }} />
            {/* Burbuja 3 */}
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-b from-cyan-400/35 to-blue-500/35 animate-float-3" style={{ left: '30%', bottom: '10%' }} />
            {/* Burbuja 4 */}
            <div className="absolute w-32 h-32 rounded-full bg-cyan-500/40 animate-float-1" style={{ right: '25%', bottom: '30%' }} />
            {/* Burbuja 5 */}
            <div className="absolute w-24 h-24 rounded-full bg-blue-400/40 animate-float-2" style={{ left: '60%', bottom: '5%' }} />
            
            {/* Partículas */}
            <div className="absolute inset-0">
              <div className="absolute w-3 h-3 bg-cyan-400/50 rounded-full animate-particle-1" style={{ left: '10%', top: '15%' }} />
              <div className="absolute w-3 h-3 bg-blue-400/50 rounded-full animate-particle-2" style={{ left: '35%', top: '30%' }} />
              <div className="absolute w-3 h-3 bg-cyan-300/50 rounded-full animate-particle-3" style={{ left: '55%', top: '20%' }} />
              <div className="absolute w-3 h-3 bg-blue-300/50 rounded-full animate-particle-1" style={{ left: '75%', top: '40%' }} />
              <div className="absolute w-3 h-3 bg-cyan-500/50 rounded-full animate-particle-2" style={{ left: '90%', top: '50%' }} />
              <div className="absolute w-2 h-2 bg-white/60 rounded-full animate-particle-3" style={{ left: '20%', top: '60%' }} />
              <div className="absolute w-2 h-2 bg-white/60 rounded-full animate-particle-1" style={{ left: '65%', top: '70%' }} />
</div>
          </div>
          
          {/* Contenido principal con z-index para estar encima del fondo */}
          
          {/* Contenido principal con z-index para estar encima del fondo */}
          <div className="relative z-10">
          
          <div className="max-w-7xl mx-auto space-y-8">
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

            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                    <StatCard title="Documentos Activos" value={documentos?.length || 5} icon={FileText} trend="+2" trendUp={true} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '200ms'}}>
                    <StatCard title="Auditorías Pendientes" value={(auditorias || []).filter(a => a.estado === 'PROGRAMADA').length} icon={ClipboardCheck} trend="+1" trendUp={false} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '300ms'}}>
                    <StatCard title="No Conformidades" value={(accionesCorrectivas || []).filter(a => a.estado === 'EN_REVISION' || a.estado === 'BORRADOR').length} icon={AlertTriangle} trend="+1" trendUp={false} />
                  </div>
                  <div className="animate-slide-up" style={{animationDelay: '400ms'}}>
                    <StatCard title="Planes de Mejora" value={(planesMejora || []).length} icon={CheckCircle2} trend="+1" trendUp={true} />
                  </div>
                </div>

                {/* Gráficos de Cumplimiento por Área */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Barras - Cumplimiento por Área */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-cyan-500" />
                      Cumplimiento por Área
                    </h3>
                    <div className="space-y-3">
                      {['Sistema de Gestión de Calidad', 'Control de Calidad', 'Recursos Humanos', 'Mantenimiento de Redes', 'Atención Ciudadana'].map(area => {
                        const random = Math.floor(Math.random() * 40) + 60;
                        const color = random >= 80 ? 'bg-emerald-500' : random >= 50 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={area} className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-32 truncate">{area}</span>
                            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${random}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-600 w-10">{random}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gráfico Circular - Distribución de Estados */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
                      <AlertOctagon size={20} className="text-cyan-500" />
                      Estados AC/PM
                    </h3>
                    <div className="flex items-center justify-center gap-8">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray="40 60" />
                          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-40" />
                          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#ef4444" strokeWidth="3" strokeDasharray="35 65" strokeDashoffset="-65" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-emerald-500 rounded"></span>
                          <span className="text-sm text-slate-600">Aprobados ({Math.floor(Math.random() * 3) + 1})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-amber-500 rounded"></span>
                          <span className="text-sm text-slate-600">En Revisión ({Math.floor(Math.random() * 3) + 1})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-500 rounded"></span>
                          <span className="text-sm text-slate-600">Pendientes ({Math.floor(Math.random() * 3) + 1})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Acciones Recientes */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{animationDelay: '500ms'}}>
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-[#002855] flex items-center gap-2">
                      <Clock size={20} className="text-cyan-500" />
                      Acciones Correctivas Recientes
                    </h2>
                    <button onClick={() => setActiveTab('ac')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                      Ver todo
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {(() => {
                      const recentAC = (accionesCorrectivas || []).slice(-3).reverse();
                      if (recentAC.length === 0) {
                        return (
                          <div className="p-6 text-center text-slate-500">
                            No hay acciones correctivas registradas. Crea una nueva para ver el historial.
                          </div>
                        );
                      }
                      return recentAC.map((doc, index) => (
                        <div 
                          key={doc.id || index} 
                          className="p-6 hover:bg-slate-50/80 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-cyan-100 transition-all">
                              <AlertTriangle size={20} />
                            </div>
                            <div>
                              <h4 className="text-[#002855] font-semibold group-hover:text-cyan-600 transition-colors">
                                {doc.descripcion_nc?.substring(0, 50) || 'Sin descripción'}...
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                                <span>{doc.area}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{doc.proceso}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              doc.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              doc.estado === 'EN_REVISION' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {doc.estado || 'BORRADOR'}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ACCIONES CORRECTIVAS */}
            {activeTab === 'ac' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <AccionCorrectivaView 
                  accionesCorrectivas={accionesCorrectivas} 
                  setAccionesCorrectivas={setAccionesCorrectivasSync}
                  evidencias={evidencias}
                  setEvidencias={setEvidencias}
                  usuarios={usuarios}
                  puedeTodasAreas={puedeTodasAreas}
                  areaUsuario={areaUsuario}
                />
              </div>
            )}

{/* PLANES DE MEJORA */}
            {activeTab === 'pm' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <PlanMejoraView 
                  planesMejora={planesMejora} 
                  setPlanesMejora={setPlanesMejoraSync}
                  usuarios={usuarios}
                  puedeTodasAreas={puedeTodasAreas}
                  areaUsuario={areaUsuario}
                />
              </div>
            )}

{/* INDICADORES */}
            {activeTab === 'indicadores' && <IndicadoresView 
              indicadoresData={indicadoresData}
              setIndicadoresData={setIndicadoresData}
              puedeTodasAreas={puedeTodasAreas}
              areaUsuario={areaUsuario}
            />}

            {/* MATRIZ DE RIESGOS */}
            {activeTab === 'riesgos' && <RiesgosView 
              riesgos={riesgos}
              setRiesgos={setRiesgosSync}
              usuarios={usuarios}
              puedeTodasAreas={puedeTodasAreas}
              areaUsuario={areaUsuario}
            />}

            {/* DOCUMENTOS */}
            {activeTab === 'documents' && <DocumentosView 
              documentos={documentos}
              setDocList={setDocListSync}
              puedeTodasAreas={puedeTodasAreas}
              areaUsuario={areaUsuario}
            />}
            
            {/* AUDITORÍAS */}
            {activeTab === 'audits' && <AuditoriasView 
              auditorias={auditorias}
              setAuditorias={setAuditoriasSync}
              puedeTodasAreas={puedeTodasAreas}
              areaUsuario={areaUsuario}
            />}
            
            {/* GESTOR DE APROBACIONES */}
            {activeTab === 'gestor' && <GestorAprobacionesView 
              accionesCorrectivas={accionesCorrectivas}
              planesMejora={planesMejora}
              usuarios={usuarios}
              puedeTodasAreas={puedeTodasAreas}
              areaUsuario={areaUsuario}
            />}

{/* CONFIGURACIÓN */}
            {activeTab === 'settings' && <SettingsView 
              usuarios={usuarios}
              setUsuarios={setUsuarios}
            />}

            {activeTab !== 'dashboard' && activeTab !== 'ac' && activeTab !== 'pm' && activeTab !== 'indicadores' && activeTab !== 'riesgos' && activeTab !== 'settings' && activeTab !== 'gestor' && (
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
          </div>
        </main>
      </div>

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
        
        /* Burbujas flotantes */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.5; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-20px) scale(0.9); opacity: 0.4; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; }
          50% { transform: translateY(-25px) scale(1.05); opacity: 0.45; }
        }
        .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 8s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
        
        /* Partículas */
        @keyframes particle-1 {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-40px); opacity: 0.6; }
        }
        @keyframes particle-2 {
          0%, 100% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(-30px); opacity: 0.5; }
        }
        @keyframes particle-3 {
          0%, 100% { transform: translateY(0); opacity: 0.25; }
          50% { transform: translateY(-35px); opacity: 0.55; }
        }
        .animate-particle-1 { animation: particle-1 5s ease-in-out infinite; }
        .animate-particle-2 { animation: particle-2 6s ease-in-out infinite; }
        .animate-particle-3 { animation: particle-3 7s ease-in-out infinite; }
        
        /* Gradiente radial animado */
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0,40,85,0.03) 50%, transparent 100%);
          animation: gradient-shift 10s ease-in-out infinite alternate;
        }
        @keyframes gradient-shift {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}} />
    </div>
  );
}

function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, evidencias, setEvidencias, usuarios, puedeTodasAreas, areaUsuario }) {
  const [hojaActiva, setHojaActiva] = useState('REGISTRO');
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errores, setErrores] = useState({});
  
  const esAdmin = puedeTodasAreas;
  const areaDefault = esAdmin ? '' : (areaUsuario || '');
  
  const [formData, setFormData] = useState({
    codigo: `AC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    folio_codigo: '',
    fecha_deteccion: new Date().toISOString().split('T')[0],
    proceso: '',
    area: areaDefault,
    origen: '',
    num_auditoria: '',
    indicador_ref: '',
    descripcion_no_conformidad_original: '',
    descripcion_no_conformidad_mejorada: '',
    impacta_otros_procesos: 'NO',
    otros_procesos_afectados: '',
    posibles_causas: '',
    causa_raiz: '',
    clasificacion: '',
    tipo_accion: '',
    accion_contencion: '',
    actividad_inmediata: '',
    responsable_inmediato: '',
    fecha_inmediata: '',
    causas: [
      { numero: 1, causa: '', puntuacion: 0 },
      { numero: 2, causa: '', puntuacion: 0 },
      { numero: 3, causa: '', puntuacion: 0 },
      { numero: 4, causa: '', puntuacion: 0 }
    ],
    causa_principal: '',
    requiere_matriz_riesgos: 'NO',
    riesgo_modificado: '',
    requiere_cambio_sgc: 'NO',
    actividades: [],
    equipo_trabajo: [
      { nombre: '', puesto: '', area: '', rol: 'Responsable' }
    ],
    evidencia_contencion: '',
    evidencia_objetiva: '',
    conclusion_auditor: '',
    evaluacion_eficacia: '',
    estado: 'BORRADOR'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.fecha_deteccion) newErrors.fecha_deteccion = 'Requerido';
      if (!formData.area) newErrors.area = 'Requerido';
      if (!formData.proceso) newErrors.proceso = 'Requerido';
      if (!formData.origen) newErrors.origen = 'Requerido';
      if (!formData.descripcion_no_conformidad_original) newErrors.descripcion_nc = 'Requerido';
    }
    
    if (currentStep === 2) {
      if (!formData.posibles_causas) newErrors.posibles_causas = 'Requerido';
      if (!formData.causa_raiz) newErrors.causa_raiz = 'Requerido';
    }
    
    if (currentStep === 3) {
      if (formData.actividades.length === 0) {
        newErrors.actividades = 'Agrega al menos una actividad';
      }
    }
    
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const agregarActividad = () => {
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, { 
        descripcion: '', 
        responsable: '', 
        fecha_limite: '',
        tipo: 'CORRECCION',
        evidencia: '',
        evidencia_verificacion: '',
        resultado: '',
        estado: 'PENDIENTE',
        observacion: ''
      }]
    }));
  };

  const actualizarActividad = (index, field, value) => {
    const nuevas = [...formData.actividades];
    nuevas[index][field] = value;
    setFormData(prev => ({ ...prev, actividades: nuevas }));
  };

  const eliminarActividad = (index) => {
    const nuevas = formData.actividades.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, actividades: nuevas }));
  };

  const generarConIA = async () => {
    if (!formData.descripcion_no_conformidad_original) {
      alert('Describe la No Conformidad primero');
      return;
    }
    if (formData.equipo_trabajo.length === 0 || !formData.equipo_trabajo.some(m => m.nombre && m.nombre.trim() !== '')) {
      alert('Agrega al menos un integrante con nombre en el Equipo de Trabajo antes de generar con IA');
      return;
    }
    setGenerando(true);
    try {
      const prompt = `Eres un AGENTE EXPERTO ISO 9001 especializado en análisis de no conformidades y acciones correctivas. Tu rol es generar un análisis completo de causa raíz.

IDENTIDAD DEL AGENTE:
- Eres un auditor interno certificado ISO 9001
- Dominas el análisis de causa raíz (6M, Ishikawa, 5 Porqués)
- Generas acciones correctivas efectivas y medibles

CONTEXTO:
Área: ${formData.area || 'Por asignar'}
Proceso: ${formData.proceso}
Origen: ${formData.origen}

EQUIPO DE TRABAJO (ya definido por el usuario):
${formData.equipo_trabajo.filter(m => m.nombre).map(m => `- ${m.nombre} (${m.puesto || m.rol})`).join('\n')}

NO CONFORMIDAD DETECTADA:
${formData.descripcion_nc}

INSTRUCCIONES:
Analiza la NC y genera un JSON completo con:
- Usa ÚNICAMENTE los nombres del EQUIPO DE TRABAJO proporcionado para los responsables de actividades
- Si ninguna persona del equipo es adecuada para una actividad, usa "Responsable por definir"

{
  "posibles_causas": "Causa 1, Causa 2, Causa 3... (usen metodo 6M)",
  "causa_raiz": "Causa raiz identificada",
  "accion_contencion": "Accion inmediata para contener el problema",
  "clasificacion_nc": "Mayor|Menor|Observacion",
  "tipo_accion": "Accion Correctiva|Accion Preventiva",
  "actividades": [
    {
      "descripcion": "Descripcion detallada",
      "responsable": "Nombre del equipo",
      "fecha_limite": "YYYY-MM-DD",
      "tipo": "CORRECCION|PREVENTIVA|VERIFICACION",
      "evidencia": "Evidencia requerida",
      "estado": "PENDIENTE"
    }
  ]
}

Sé profesional, específico y orientado a la solución inmediata.`;
      
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      
      const data = await resp.json();
      if (data.choices && data.choices[0]?.message?.content) {
        try {
          const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setFormData(prev => ({
              ...prev,
              posibles_causas: parsed.posibles_causas || '',
              causa_raiz: parsed.causa_raiz || '',
              clasificacion: parsed.clasificacion || 'Menor',
              tipo_accion: parsed.tipo_accion || 'Acción Correctiva',
              accion_contencion: parsed.accion_contencion || '',
              evidencia_contencion: parsed.evidencia_contencion || '',
              actividades: parsed.actividades?.length ? parsed.actividades.map(a => ({
                ...a,
                evidencia: a.evidencia || '',
                evidencia_verificacion: a.evidencia_verificacion || '',
                resultado: a.resultado || '',
                estado: 'PENDIENTE',
                observacion: a.observacion || ''
              })) : prev.actividades
            }));
            setStep(2);
          }
        } catch (e) {
          alert('La IA generó una respuesta con formato inválido. Intenta de nuevo.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al generar con IA. Verifica la API key');
    } finally {
      setGenerando(false);
    }
  };

  const guardar = async (enviar = false) => {
    if (enviar && !validateStep(3)) {
      return;
    }
    
    const nuevaAC = {
      ...formData,
      id: Date.now(),
      estado: enviar ? 'EN_REVISION' : 'BORRADOR',
      fecha_creacion: new Date().toISOString().split('T')[0]
    };
    
    setAccionesCorrectivas(prev => [...prev, nuevaAC]);
    setSuccess(true);
    setTimeout(() => {
      alert(enviar ? 'Enviado a revisión' : 'Guardado como borrador');
      setSuccess(false);
      setFormData({
        codigo: `AC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        fecha_deteccion: new Date().toISOString().split('T')[0],
        proceso: '',
        area: puedeTodasAreas ? '' : areaUsuario,
        origen: '',
        num_auditoria: '',
        indicador_ref: '',
        descripcion_nc: '',
        posibles_causas: '',
        causa_raiz: '',
        clasificacion: '',
        tipo_accion: '',
        accion_contencion: '',
        evidencia_contencion: '',
        eficacia: '',
        actividades: [],
        estado: 'BORRADOR'
      });
      setStep(1);
    }, 500);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(3, s + 1));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
      {/* Tabs */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex gap-4">
        {[
          { id: 'REGISTRO', label: '1. Registro' },
          { id: 'ANALISIS', label: '2. Análisis' },
          { id: 'ACTIVIDADES', label: '3. Actividades' },
          { id: 'AUDITOR', label: '4. Auditor' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setHojaActiva(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              hojaActiva === tab.id 
                ? 'bg-cyan-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {hojaActiva === 'REGISTRO' && (
          <div className="space-y-6">
            <SectionTitle icon="📋" title="Datos del Documento" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputField label="Fecha Detección" name="fecha_deteccion" type="date" value={formData.fecha_deteccion} onChange={handleChange} />
                {errores.fecha_deteccion && <p className="text-red-500 text-xs mt-1">{errores.fecha_deteccion}</p>}
              </div>
              <div>
                <SelectField label="Área" name="area" value={formData.area} onChange={handleChange} options={AREAS} />
                {errores.area && <p className="text-red-500 text-xs mt-1">{errores.area}</p>}
                {!puedeTodasAreas && <p className="text-xs text-cyan-600 mt-1">Solo tu área</p>}
              </div>
              <div>
                <SelectField label="Proceso" name="proceso" value={formData.proceso} onChange={handleChange} options={PROCESOS} />
                {errores.proceso && <p className="text-red-500 text-xs mt-1">{errores.proceso}</p>}
              </div>
              <div>
                <SelectField label="Origen de la AC" name="origen" value={formData.origen} onChange={handleChange} options={ORIGENES_AC} />
                {errores.origen && <p className="text-red-500 text-xs mt-1">{errores.origen}</p>}
              </div>
              {formData.origen === 'Auditoría' && (
                <InputField label="No. de Auditoría" name="num_auditoria" value={formData.num_auditoria} onChange={handleChange} placeholder="AUD-2026-XXX" />
              )}
              {formData.origen === 'Indicador' && (
                <div>
                  <SelectField label="Indicador" name="indicador_ref" value={formData.indicador_ref} onChange={handleChange} options={INDICADORES.map(i => i.nombre)} />
                </div>
              )}
            </div>

            <div>
              <SectionTitle icon="⚠️" title="Descripción de la No Conformidad" required />
              <textarea
                name="descripcion_no_conformidad_original"
                value={formData.descripcion_no_conformidad_original}
                onChange={handleChange}
                placeholder="Describe la no conformidad detectada..."
                className={`w-full p-4 border rounded-xl resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${errores.descripcion_nc ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.descripcion_nc && <p className="text-red-500 text-xs mt-1">{errores.descripcion_nc}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">La no conformidad, ¿Impacta en otros procesos?</label>
                <select 
                  name="impacta_otros_procesos" 
                  value={formData.impacta_otros_procesos} 
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded-lg"
                >
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </div>
              {formData.impacta_otros_procesos === 'SI' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Enunciar qué otros procesos se ven afectados</label>
                  <textarea
                    name="otros_procesos_afectados"
                    value={formData.otros_procesos_afectados}
                    onChange={handleChange}
                    placeholder="Procesos afectados..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <button
              onClick={generarConIA}
              disabled={generando || !formData.descripcion_nc}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
{generando ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {generando ? 'Generando...' : 'Generar con IA'}
          </button>

          {/* Evidencias */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <FileUp size={18} />
                  Evidencias (Fotos/Documentos)
                </h4>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 text-white text-sm rounded-lg cursor-pointer hover:bg-cyan-600 transition-colors">
                  <FileUp size={14} />
                  Adjuntar
                  <input type="file" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setEvidencias(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          nombre: file.name,
                          tipo: file.type,
                          data: reader.result,
                          fecha: new Date().toISOString().split('T')[0],
                          documento: 'AC'
                        }]);
                      };
                      reader.readAsDataURL(file);
                    });
                  }} />
                </label>
              </div>
              {(evidencias || []).filter(e => e.documento === 'AC').length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(evidencias || []).filter(e => e.documento === 'AC').map(ev => (
                    <div key={ev.id} className="relative p-2 bg-white rounded-lg border border-slate-200">
                      {ev.tipo.startsWith('image/') ? (
                        <img src={ev.data} alt={ev.nombre} className="w-full h-20 object-cover rounded" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-cyan-500" />
                          <span className="text-xs truncate">{ev.nombre}</span>
                        </div>
                      )}
                      <button onClick={() => setEvidencias(prev => prev.filter(x => x.id !== ev.id))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No hay evidencias adjuntas</p>
              )}
            </div>
          </div>
        )}

        {hojaActiva === 'ANALISIS' && (
          <div className="space-y-6">
            <SectionTitle icon="🔍" title="Análisis de Causa Raíz (6M)" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Clasificación NC *</label>
                <select name="clasificacion" value={formData.clasificacion} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  <option value="Mayor">🔴 Mayor</option>
                  <option value="Menor">🟡 Menor</option>
                  <option value="Observación">🟢 Observación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de Acción</label>
                <select name="tipo_accion" value={formData.tipo_accion} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  <option value="Acción Correctiva">Acción Correctiva</option>
                  <option value="Acción Preventiva">Acción Preventiva</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Posibles Causas (6M: Método, Máquina, Material, Medio, Mano de obra, Medio Ambiente)</label>
              <textarea
                name="posibles_causas"
                value={formData.posibles_causas}
                onChange={handleChange}
                placeholder="Lista las posibles causas..."
                className={`w-full p-4 border rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errores.posibles_causas ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.posibles_causas && <p className="text-red-500 text-xs mt-1">{errores.posibles_causas}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Causa Raíz Identificada *</label>
              <textarea
                name="causa_raiz"
                value={formData.causa_raiz}
                onChange={handleChange}
                placeholder="¿Cuál es la causa raíz?"
                className={`w-full p-4 border rounded-xl resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errores.causa_raiz ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.causa_raiz && <p className="text-red-500 text-xs mt-1">{errores.causa_raiz}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Acción de Contención Inmediata</label>
              <textarea
                name="accion_contencion"
                value={formData.accion_contencion}
                onChange={handleChange}
                placeholder="¿Qué acción inmediata se tomó para contener el problema?"
                className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Evidencia de Contención</label>
              <input
                name="evidencia_contencion"
                value={formData.evidencia_contencion}
                onChange={handleChange}
                placeholder="Evidencia que sustenta la contención..."
                className="w-full p-3 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {hojaActiva === 'ACTIVIDADES' && (
          <div className="space-y-6">
            <SectionTitle icon="📋" title="Plan de Actividades" required />
            {errores.actividades && <p className="text-red-500 text-sm -mt-4">{errores.actividades}</p>}
            
<div className="space-y-4">
              {formData.actividades.map((act, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Actividad {idx + 1}</span>
                    <button onClick={() => eliminarActividad(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={act.descripcion}
                    onChange={(e) => actualizarActividad(idx, 'descripcion', e.target.value)}
                    placeholder="Descripción de la actividad..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={act.responsable}
                      onChange={(e) => actualizarActividad(idx, 'responsable', e.target.value)}
                      placeholder="Responsable"
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <input
                      type="date"
                      value={act.fecha_limite}
                      onChange={(e) => actualizarActividad(idx, 'fecha_limite', e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={act.tipo || 'CORRECCION'} onChange={(e) => actualizarActividad(idx, 'tipo', e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm">
                      <option value="CORRECCION">Corrección</option>
                      <option value="PREVENTIVA">Preventiva</option>
                      <option value="VERIFICACION">Verificación</option>
                      <option value="CIERRE">Cierre</option>
                    </select>
                    <input
                      type="text"
                      value={act.evidencia}
                      onChange={(e) => actualizarActividad(idx, 'evidencia', e.target.value)}
                      placeholder="Evidencia requerida"
                      className="p-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
               
              <button
                onClick={agregarActividad}
                className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-cyan-500 hover:text-cyan-500 transition-all"
              >
                <Plus size={18} />
                Agregar Actividad
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse z-50">
            <Check size={18} />
            ¡Guardado exitosamente!
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium disabled:opacity-50 transition-all">
            Anterior
          </button>
          <div className="flex gap-3">
            <button onClick={() => guardar(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            {step < 3 ? (
              <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl font-medium shadow-md shadow-cyan-500/20 transition-all">
                Siguiente
              </button>
            ) : (
              <button onClick={() => guardar(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#002855] text-white hover:bg-[#00152e] rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {loading ? 'Enviando...' : 'Enviar a Revisión'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanMejoraView({ planesMejora, setPlanesMejora, usuarios, puedeTodasAreas, areaUsuario }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errores, setErrores] = useState({});
  const [mostrarModalIA, setMostrarModalIA] = useState(false);
  
  const esAdmin = puedeTodasAreas;
  const areaDefault = esAdmin ? '' : (areaUsuario || '');
  
  const [formData, setFormData] = useState({
    codigo: `PM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    area: areaDefault,
    proceso: '',
    situacion_actual: '',
    situacion_deseada: '',
    beneficios: '',
    equipo_trabajo: '',
    origen_mejora: '',
    just_beneficios: '',
    impacto_esperado: '',
    recursos_necesarios: '',
    presupuesto: '',
    actividades: [],
    estado: 'BORRADOR'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.area) newErrors.area = 'Requerido';
      if (!formData.proceso) newErrors.proceso = 'Requerido';
      if (!formData.situacion_actual) newErrors.situacion_actual = 'Describe la situación actual';
      if (!formData.situacion_deseada) newErrors.situacion_deseada = 'Describe la situación deseada';
    }
    if (currentStep === 2) {
      if (!formData.beneficios) newErrors.beneficios = 'Required';
      if (!formData.equipo_trabajo) newErrors.equipo_trabajo = 'Required';
    }
    if (currentStep === 3) {
      if (formData.actividades.length === 0) newErrors.actividades = 'Agrega al menos una actividad';
    }
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const agregarActividad = () => {
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, { 
        actividad: '', 
        indicador: '', 
        meta: '', 
        responsable: formData.equipo_trabajo || '',
        fecha_inicio: '', 
        fecha_fin: '', 
        tipo: 'IMPLEMENTACION',
        recursos: '',
        evidencia: '',
        evidencia_verificacion: '',
        resultado: '',
        estado: 'PENDIENTE',
        observacion: ''
      }]
    }));
  };

  const actualizarActividad = (index, field, value) => {
    const nuevas = [...formData.actividades];
    nuevas[index][field] = value;
    setFormData(prev => ({ ...prev, actividades: nuevas }));
  };

  const eliminarActividad = (index) => {
    const nuevas = formData.actividades.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, actividades: nuevas }));
  };

  const generarConIA = async () => {
    if (!formData.situacion_actual || !formData.situacion_deseada) {
      alert('Describe la situación actual y la situación deseable primero');
      return;
    }
    if (formData.integrantes.length === 0 || !formData.integrantes.some(m => m.nombre && m.nombre.trim() !== '')) {
      alert('Agrega al menos un integrante con nombre en el Equipo de Mejora antes de generar con IA');
      return;
    }
    setGenerando(true);
    try {
      const prompt = `Eres un AGENTE EXPERTO ISO 9001 especializado en mejora continua y gestión de calidad. Tu tarea es generar un PLAN DE MEJORA completo y profesional.

IDENTIDAD DEL AGENTE:
- Eres un experto en sistemas de gestión de calidad ISO 9001:2015
- Conoces profundamente el ciclo PHVA (Planificar, Hacer, Verificar, Actuar)
-生成 soluciones prácticas y accionables

CONTEXTO DEL PROYECTO:
Organismo: OOMAPASC de Cajeme (Agua Potable)
Área: ${formData.area || 'Por asignar'}
Proceso: ${formData.proceso}

SITUACIÓN ACTUAL (el problema):
${formData.situacion_actual}

SITUACIÓN DESEADA (el objetivo):
${formData.situacion_deseada}

INSTRUCCIONES DE GENERACIÓN:
Genera un plan completo en JSON con esta estructura exacta. Cada actividad debe seguir el ciclo PHVA:

{
  "beneficios": "Beneficio 1, Beneficio 2, Beneficio 3...",
  "just_beneficios": "Justificación clara y medible",
  "impacto_esperado": "Alto|Medio|Bajo",
  "recursos_necesarios": "Humanos, Materiales, Tec",
  "presupuesto": 0,
  "equipo_trabajo": "Nombre 1, Nombre 2, Nombre 3...",
  "actividades": [
    {
      "actividad": "Descripción detallada",
      "indicador": "Indicador de medición",
      "meta": "Meta cuantificable",
      "responsable": "Nombre responsable",
      "fecha_inicio": "YYYY-MM-DD",
      "fecha_fin": "YYYY-MM-DD",
      "tipo": "PLANIFICACION|IMPLEMENTACION|VERIFICACION|CIERRE",
      "recursos": "Recursos específicos",
      "evidencia": "Evidencia a generar",
      "evidencia_verificacion": "Cómo se verifica",
      "resultado": "Resultado esperado",
      "observacion": "Notas adicionales"
    }
  ]
}

Sé específico, práctico y orientado a resultados. El equipo solo dará la idea inicial, tú generas TODO.`;
      
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      
      const data = await resp.json();
      if (data.choices && data.choices[0]?.message?.content) {
        try {
          const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setFormData(prev => ({
              ...prev,
              beneficios: parsed.beneficios || '',
              just_beneficios: parsed.just_beneficios || '',
              impacto_esperado: parsed.impacto_esperado || 'Medio',
              recursos_necesarios: parsed.recursos_necesarios || '',
              presupuesto: parsed.presupuesto || '',
              equipo_trabajo: parsed.equipo_trabajo || '',
              actividades: parsed.actividades?.length ? parsed.actividades.map(a => ({
                ...a,
                estado: 'PENDIENTE',
                evidencia: a.evidencia || '',
                evidencia_verificacion: a.evidencia_verificacion || '',
                resultado: a.resultado || '',
                observacion: a.observacion || ''
              })) : prev.actividades
            }));
            setMostrarModalIA(false);
            setStep(2);
          }
        } catch (e) {
          alert('La IA generó una respuesta con formato inválido. Intenta de nuevo.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al generar con IA. Verifica la API key');
    } finally {
      setGenerando(false);
      setMostrarModalIA(false);
    }
  };

  const guardar = async (enviar = false) => {
    if (enviar && !validateStep(3)) return;
    setLoading(true);
    
    const nuevoPM = {
      ...formData,
      id: Date.now(),
      estado: enviar ? 'EN_REVISION' : 'BORRADOR',
      fecha_creacion: new Date().toISOString().split('T')[0]
    };
    
    setPlanesMejora(prev => [...prev, nuevoPM]);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      alert(enviar ? 'Enviado a revisión' : 'Guardado como borrador');
      setSuccess(false);
      if (enviar) {
        setFormData({
          codigo: `PM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          fecha_elaboracion: new Date().toISOString().split('T')[0],
          area: puedeTodasAreas ? '' : areaUsuario,
          proceso: '',
          situacion_actual: '',
          situacion_deseada: '',
          beneficios: '',
          just_beneficios: '',
          impacto_esperado: '',
          recursos_necesarios: '',
          presupuesto: '',
          equipo_trabajo: '',
          actividades: [],
          estado: 'BORRADOR'
        });
        setStep(1);
      }
    }, 500);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(3, s + 1));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex gap-4">
        {['1. Describir', '2. Analizar', '3. Plan de Acción'].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setStep(idx + 1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              step === idx + 1 
                ? 'bg-cyan-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <SectionTitle icon="📋" title="Datos del Documento" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField label="Código" name="codigo" value={formData.codigo} onChange={handleChange} placeholder="PM-2026-0001" />
              <InputField label="Fecha Elaboración" name="fecha_elaboracion" type="date" value={formData.fecha_elaboracion} onChange={handleChange} />
              <div>
                <SelectField label="Área" name="area" value={formData.area} onChange={handleChange} options={AREAS} />
                {!puedeTodasAreas && <p className="text-xs text-cyan-600 mt-1">Solo tu área</p>}
              </div>
              <SelectField label="Proceso" name="proceso" value={formData.proceso} onChange={handleChange} options={PROCESOS} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SectionTitle icon="📈" title="Situación Actual" required />
                <textarea
                  name="situacion_actual"
                  value={formData.situacion_actual}
                  onChange={handleChange}
                  placeholder="Describe la situación actual que desea mejorar..."
                  className={`w-full p-4 border rounded-xl resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${errores.situacion_actual ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errores.situacion_actual && <p className="text-red-500 text-xs mt-1">{errores.situacion_actual}</p>}
              </div>
              <div>
                <SectionTitle icon="🎯" title="Situación Deseada" required />
                <textarea
                  name="situacion_deseada"
                  value={formData.situacion_deseada}
                  onChange={handleChange}
                  placeholder="¿Cuál es el objetivo o situación deseada?"
                  className={`w-full p-4 border rounded-xl resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errores.situacion_deseada ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errores.situacion_deseada && <p className="text-red-500 text-xs mt-1">{errores.situacion_deseada}</p>}
              </div>
            </div>

            <button
              onClick={generarConIA}
              disabled={generando || !formData.situacion_actual || !formData.situacion_deseada}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {generando ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generando ? 'Generando Plan Completo con IA...' : '✨ Generar Plan Completo con IA'}
            </button>
          </div>
        )}

        {hojaActiva === 'ANALISIS' && (
          <div className="space-y-6">
            <SectionTitle icon="✨" title="Análisis de Beneficios y Recursos" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Beneficios Esperados *</label>
                <textarea
                  name="beneficios"
                  value={formData.beneficios}
                  onChange={handleChange}
                  placeholder="Lista los beneficios cuantificables..."
                  className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Justificación de Beneficios</label>
                <textarea
                  name="just_beneficios"
                  value={formData.just_beneficios}
                  onChange={handleChange}
                  placeholder="¿Por qué son importantes estos beneficios?"
                  className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Impacto Esperado</label>
                <select name="impacto_esperado" value={formData.impacto_esperado} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  <option value="Alto">🔴 Alto</option>
                  <option value="Medio">🟡 Medio</option>
                  <option value="Bajo">🟢 Bajo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Presupuesto Estimado (MXN)</label>
                <input
                  name="presupuesto"
                  type="number"
                  value={formData.presupuesto}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full p-3 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Equipo de Trabajo (hasta 4 integrantes)</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left font-medium">Nombre</th>
                      <th className="p-2 text-left font-medium">Puesto</th>
                      <th className="p-2 text-left font-medium">Área</th>
                      <th className="p-2 text-left font-medium">Rol</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.equipo_trabajo || []).map((integrante, idx) => (
                      <tr key={idx} className="border-t border-slate-200">
                        <td className="p-1">
                          <input
                            value={integrante.nombre || ''}
                            onChange={(e) => {
                              const nuevo = [...(formData.equipo_trabajo || [])];
                              nuevo[idx] = { ...nuevo[idx], nombre: e.target.value };
                              setFormData(prev => ({ ...prev, equipo_trabajo: nuevo }));
                            }}
                            placeholder="Nombre completo"
                            className="w-full p-1.5 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={integrante.puesto || ''}
                            onChange={(e) => {
                              const nuevo = [...(formData.equipo_trabajo || [])];
                              nuevo[idx] = { ...nuevo[idx], puesto: e.target.value };
                              setFormData(prev => ({ ...prev, equipo_trabajo: nuevo }));
                            }}
                            placeholder="Puesto"
                            className="w-full p-1.5 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={integrante.area || ''}
                            onChange={(e) => {
                              const nuevo = [...(formData.equipo_trabajo || [])];
                              nuevo[idx] = { ...nuevo[idx], area: e.target.value };
                              setFormData(prev => ({ ...prev, equipo_trabajo: nuevo }));
                            }}
                            placeholder="Área"
                            className="w-full p-1.5 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="p-1">
                          <select
                            value={integrante.rol || 'Responsable'}
                            onChange={(e) => {
                              const nuevo = [...(formData.equipo_trabajo || [])];
                              nuevo[idx] = { ...nuevo[idx], rol: e.target.value };
                              setFormData(prev => ({ ...prev, equipo_trabajo: nuevo }));
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded"
                          >
                            <option value="Responsable">Responsable</option>
                            <option value="Coordinador">Coordinador</option>
                            <option value="Enlace SGC">Enlace SGC</option>
                            <option value="Integrante">Integrante</option>
                          </select>
                        </td>
                        <td className="p-1 text-center">
                          {(formData.equipo_trabajo?.length || 0) > 1 && (
                            <button onClick={() => {
                              const nuevo = formData.equipo_trabajo.filter((_, i) => i !== idx);
                              setFormData(prev => ({ ...prev, equipo_trabajo: nuevo }));
                            }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(formData.equipo_trabajo?.length || 0) < 4 && (
                <button onClick={() => setFormData(prev => ({ ...prev, equipo_trabajo: [...(prev.equipo_trabajo || []), { nombre: '', puesto: '', area: '', rol: 'Integrante' }] }))} className="mt-2 text-sm text-cyan-600 hover:bg-cyan-50 px-3 py-1.5 rounded">
                + Agregar integrante
              </button>
              )}
            </div>
          </div>
        )}

        {hojaActiva === 'ACTIVIDADES' && (
          <div className="space-y-6">
            <SectionTitle icon="📋" title="Plan de Actividades" required />
            
            <div className="space-y-4">
              {formData.actividades.map((act, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Actividad {idx + 1}</span>
                    <button onClick={() => eliminarActividad(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={act.actividad}
                    onChange={(e) => actualizarActividad(idx, 'actividad', e.target.value)}
                    placeholder="Descripción de la actividad..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={act.responsable}
                      onChange={(e) => actualizarActividad(idx, 'responsable', e.target.value)}
                      placeholder="Responsable"
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <input
                      type="text"
                      value={act.indicador}
                      onChange={(e) => actualizarActividad(idx, 'indicador', e.target.value)}
                      placeholder="Indicador"
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={act.fecha_inicio} onChange={(e) => actualizarActividad(idx, 'fecha_inicio', e.target.value)} className="p-2 border border-slate-200 rounded-lg focus:outline-none" />
                    <input type="date" value={act.fecha_fin} onChange={(e) => actualizarActividad(idx, 'fecha_fin', e.target.value)} className="p-2 border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                </div>
              ))}
              
              <button
                onClick={agregarActividad}
                className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-cyan-500 hover:text-cyan-500 transition-all"
              >
                <Plus size={18} />
                Agregar Actividad
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-slate-200">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium disabled:opacity-50 transition-all">
            Anterior
          </button>
          <div className="flex gap-3">
            <button onClick={() => guardar(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
              <Save size={18} />
              Guardar Borrador
            </button>
            <button onClick={() => {
              if (!formData.descripcion_no_conformidad_original) { alert('No hay datos'); return; }
              const win = window.open('', '_blank');
              win.document.write(`<html><head><title>AC ${formData.codigo}</title></head><body>
<h1>ACCIÓN CORRECTIVA - ${formData.codigo}</h1>
<table border="1" cellpadding="5"><tr><td><b>Área:</b></td><td>${formData.area}</td></tr>
<tr><td><b>Proceso:</b></td><td>${formData.proceso}</td></tr>
<tr><td><b>Origen:</b></td><td>${formData.origen}</td></tr>
<tr><td><b>Descripción NC:</b></td><td>${formData.descripcion_nc}</td></tr>
<tr><td><b>Posibles Causas:</b></td><td>${formData.posibles_causas}</td></tr>
<tr><td><b>Causa Raíz:</b></td><td>${formData.causa_raiz}</td></tr>
<tr><td><b>Clasificación:</b></td><td>${formData.clasificacion}</td></tr>
<tr><td><b>Tipo Acción:</b></td><td>${formData.tipo_accion}</td></tr></table>
<h2>Equipo de Trabajo</h2><ul>${(formData.equipo_trabajo || []).map(m => `<li>${m.nombre} - ${m.puesto} (${m.rol})</li>`).join('')}</ul>
<h2>Actividades</h2><table border="1" cellpadding="4"><tr><th>Descripción</th><th>Responsable</th><th>Fecha</th><th>Estado</th></tr>
${(formData.actividades || []).map(a => `<tr><td>${a.descripcion}</td><td>${a.responsable}</td><td>${a.fecha_limite}</td><td>${a.estado}</td></tr>`).join('')}
</table></body></html>`);
              win.document.close();
              setTimeout(() => win.print(), 500);
            }} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
              <Download size={18} />
             Exportar
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(s => Math.min(3, s + 1))} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl font-medium shadow-md shadow-cyan-500/20 transition-all">
                Siguiente
              </button>
            ) : (
              <button onClick={() => guardar(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#002855] text-white hover:bg-[#00152e] rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Enviar a Revisión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IndicadoresView({ indicadoresData, setIndicadoresData, puedeTodasAreas, areaUsuario }) {
  const [editando, setEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCaptura, setMostrarModalCaptura] = useState(false);
  const [mostrarModalSeguimiento, setMostrarModalSeguimiento] = useState(false);
  const [indicadorNoCumple, setIndicadorNoCumple] = useState(null);
  const [indicadorCaptura, setIndicadorCaptura] = useState(null);
  const [valorCaptura, setValorCaptura] = useState('');
  const [mesCaptura, setMesCaptura] = useState('Ene');
  const [vista, setVista] = useState('mensual');
  const [trimestre, setTrimestre] = useState(1);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  
  const [indicadores] = useState(INDICADORES);
  const [resultados, setResultados] = useState({});
  const [seguimientos, setSeguimientos] = useState([]);
  const [anioActual] = useState(2026);
  const [nuevoIndicador, setNuevoIndicador] = useState({ nombre: '', area: '', meta: '', unidad: '' });
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const trimestresMap = {
    1: ['Ene', 'Feb', 'Mar'],
    2: ['Abr', 'May', 'Jun'],
    3: ['Jul', 'Ago', 'Sep'],
    4: ['Oct', 'Nov', 'Dic']
  };
  
  // Listas únicas
  const areasUnicas = [...new Set(indicadores.map(i => i.area))].sort();
  const procesosUnicos = [...new Set(indicadores.map(i => i.proceso))].sort();
  
  // Indicadores filtrados
  const indicadoresFiltrados = indicadores.filter(ind => {
    if (filtroArea && ind.area !== filtroArea) return false;
    if (filtroProceso && ind.proceso !== filtroProceso) return false;
    return true;
  });
  
  const getSemaphoreColor = (pct) => {
    if (pct >= 80) return { bg: 'bg-emerald-500', text: 'text-white', icon: '🟢' };
    if (pct >= 50) return { bg: 'bg-amber-500', text: 'text-white', icon: '🟡' };
    return { bg: 'bg-red-500', text: 'text-white', icon: '🔴' };
  };
  
  const getCumplimiento = (indicadorId, mesesEval) => {
    const ind = indicadores.find(i => i.id === indicadorId);
    if (!ind) return 0;
    
    const valores = mesesEval.map(m => resultados[`${indicadorId}-${m}`]).filter(v => v && v !== '');
    if (valores.length === 0) return 0;
    
    const meta = ind.meta;
    const esMenor = ind.es_menor;
    
    let cumplidos = 0;
    valores.forEach(v => {
      const num = parseFloat(String(v).replace(/%/g, '').replace(/,/g, ''));
      if (isNaN(num)) return;
      if (esMenor && num <= meta) cumplidos++;
      else if (!esMenor && num >= meta) cumplidos++;
    });
    return Math.round((cumplidos / valores.length) * 100);
  };
  
  const getCumpTrimestral = (indicadorId, trim) => {
    const mesesTrim = trimestre === 1 ? ['Ene', 'Feb', 'Mar'] : 
                      trimestre === 2 ? ['Abr', 'May', 'Jun'] :
                      trimestre === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getCumplimiento(indicadorId, mesesTrim);
  };
  
  const getAreaCumplimiento = (area, mesesEval) => {
    const indicadoresArea = indicadores.filter(i => i.area === area);
    if (indicadoresArea.length === 0) return 0;
    const suma = indicadoresArea.reduce((acc, ind) => acc + getCumplimiento(ind.id, mesesEval), 0);
    return Math.round(suma / indicadoresArea.length);
  };
  
  const getProcesoCumplimiento = (proceso, mesesEval) => {
    const indicadoresProceso = indicadores.filter(i => i.proceso === proceso);
    if (indicadoresProceso.length === 0) return 0;
    const suma = indicadoresProceso.reduce((acc, ind) => acc + getCumplimiento(ind.id, mesesEval), 0);
    return Math.round(suma / indicadoresProceso.length);
  };
  
  const getAreaTrimestralCump = (area, trim) => {
    const mesesTrim = trim === 1 ? ['Ene', 'Feb', 'Mar'] : 
                  trim === 2 ? ['Abr', 'May', 'Jun'] :
                  trim === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getAreaCumplimiento(area, mesesTrim);
  };
  
  const getProcesoTrimestralCump = (proceso, trim) => {
    const mesesTrim = trim === 1 ? ['Ene', 'Feb', 'Mar'] : 
                  trim === 2 ? ['Abr', 'May', 'Jun'] :
                  trim === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getProcesoCumplimiento(proceso, mesesTrim);
  };
  
  const guardarResultado = (indicadorId, mes, valor) => {
    setResultados(prev => ({ ...prev, [`${indicadorId}-${mes}-${anioActual}`]: valor }));
    setEditando(null);
  };
  
  const getValor = (indicadorId, mes) => {
    return resultados[`${indicadorId}-${mes}-${anioActual}`] || '';
  };
  
  const abrirSeguimiento = (ind) => {
    setIndicadorNoCumple(ind);
    setMostrarModalSeguimiento(true);
  };
  
  const crearSeguimiento = (tipo, descripcion) => {
    if (!indicadorNoCumple || !descripcion) return;
    setSeguimientos(prev => [...prev, {
      id: indicadorNoCumple.id,
      nombre: indicadorNoCumple.nombre,
      area: indicadorNoCumple.area,
      tipo,
      descripcion,
      fecha: new Date().toISOString().split('T')[0]
    }]);
    setMostrarModalSeguimiento(false);
    setIndicadorNoCumple(null);
  };
  
  const getSegumiento = (indicadorId) => {
    return seguimientos.filter(s => s.id === indicadorId);
  };

  // Calculate process statistics for summary cards (more concise)
  const procesoStats = PROCESOS.map(proceso => {
    const inds = indicadores.filter(i => i.proceso === proceso);
    if (inds.length === 0) return { proceso, cumplimiento: 0, count: 0 };
    const cumpleTotal = inds.reduce((acc, ind) => {
      return acc + getCumplimiento(ind.id, meses);
    }, 0);
    return { proceso, cumplimiento: Math.round(cumpleTotal / inds.length), count: inds.length };
  }).filter(p => p.count > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Filtros y Toggle */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setVista('mensual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'mensual' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📅 Mensual
          </button>
          <button 
            onClick={() => setVista('trimestral')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'trimestral' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📊 Trimestral
          </button>
          <button 
            onClick={() => setVista('graficos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'graficos' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📈 Gráficos
          </button>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <select 
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Todas las Áreas</option>
            {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          
          <select 
            value={filtroProceso}
            onChange={e => setFiltroProceso(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Todos los Procesos</option>
            {procesosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          {(filtroArea || filtroProceso) && (
            <button 
              onClick={() => { setFiltroArea(''); setFiltroProceso(''); }}
              className="px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg"
            >
              Limpiar
            </button>
          )}
        </div>
        
        {vista === 'trimestral' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(t => (
              <button 
                key={t}
                onClick={() => setTrimestre(t)}
                className={`px-3 py-1 rounded text-sm ${trimestre === t ? 'bg-cyan-500 text-white' : 'bg-slate-100'}`}
              >
                T{t}
              </button>
            ))}
          </div>
        )}
        
        <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
          <Plus size={16} />
          Nuevo Indicador
        </button>
      </div>

      {vista === 'mensual' ? (
        <>
          {/* Resumen por Proceso */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {procesoStats.map(stat => {
              const sem = getSemaphoreColor(stat.cumplimiento);
              return (
                <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'bg-')}/10 border-${sem.bg.replace('bg-', 'border-')}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate flex-1">{stat.proceso}</p>
                    <span className="text-lg">{sem.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${sem.text}`}>{stat.cumplimiento}%</p>
                  <p className="text-xs text-slate-500">{stat.count} inds.</p>
                </div>
              );
            })}
          </div>

          {/* Tabla Mensual */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855]"> Indicadores {anioActual} - Captura Mensual</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 text-sm font-semibold text-slate-600">Indicador</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Meta</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Und.</th>
                    {meses.map(m => (
                      <th key={m} className="p-2 text-xs font-semibold text-slate-500 text-center">{m}</th>
                    ))}
                    <th className="p-3 text-sm font-semibold text-slate-600">% Cump.</th>
                    <th className="p-2 text-sm font-semibold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {indicadoresFiltrados.map(ind => {
                    const cump = getCumplimiento(ind.id, meses);
                    const sem = getSemaphoreColor(cump);
                    const seg = getSegumiento(ind.id);
                    const noCumple = cump < 50 || (seg && seg.length > 0 && cump < 80);
                    return (
                      <tr key={ind.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${noCumple ? 'bg-red-25' : ''}`}>
                        <td className="p-3 font-medium text-[#002855] text-sm">{ind.nombre}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.area}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.meta}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.unidad}</td>
                        {meses.map(mes => {
                          const key = `${ind.id}-${mes}`;
                          const valor = getValor(ind.id, mes);
                          return (
                            <td key={mes} className="p-1 text-center">
                              {editando === key ? (
                                <input type="text" value={valor} onChange={(e) => guardarResultado(ind.id, mes, e.target.value)} onBlur={() => setEditando(null)} onKeyDown={(e) => e.key === 'Enter' && setEditando(null)} autoFocus className="w-full p-1 text-center text-xs border border-cyan-500 rounded" />
                              ) : (
                                <span onClick={() => setEditando(key)} className="cursor-pointer hover:bg-cyan-50 px-1 py-0.5 rounded text-xs block">{valor || '-'}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${sem.bg}`}>
                            {cump}%
                          </span>
                        </td>
                        <td className="p-2">
                          {seg.length > 0 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" title={seg[0].tipo}>{seg.length}</span>
                          ) : noCumple ? (
                            <button onClick={() => abrirSeguimiento(ind)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">⚠️</button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : vista === 'graficos' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-[#002855] mb-6">Dashboard de Indicadores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {procesoStats.map(stat => {
                const sem = getSemaphoreColor(stat.cumplimiento);
                return (
                  <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'border-')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 truncate">{stat.proceso}</p>
                      <span className="text-xl">{sem.icon}</span>
                    </div>
                    <p className={`text-3xl font-bold ${sem.text}`}>{stat.cumplimiento}%</p>
                    <p className="text-xs text-slate-400">{stat.count} inds.</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-6">
              {procesosUnicos.map(proceso => {
                const indicadoresProceso = indicadores.filter(i => i.proceso === proceso);
                if (indicadoresProceso.length === 0) return null;
                const promedio = procesoStats.find(s => s.proceso === proceso)?.cumplimiento || 0;
                const sem = getSemaphoreColor(promedio);
                return (
                  <div key={proceso} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#002855]">{proceso}</h3>
                      <span className={`text-2xl font-bold ${sem.text}`}>{promedio}%</span>
                    </div>
                    <div className="space-y-2">
                      {indicadoresProceso.map(ind => {
                        const cump = getCumplimiento(ind.id, meses);
                        const semInd = getSemaphoreColor(cump);
                        return (
                          <div key={ind.id} className="flex items-center gap-3">
                            <div className="w-40 flex-shrink-0">
                              <p className="text-xs text-slate-600 truncate">{ind.nombre}</p>
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                              <div className={`h-full ${semInd.bg} transition-all`} style={{ width: `${cump}%` }} />
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-medium">{cump}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vista Trimestral - Resumen por Proceso */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {procesoStats.map(stat => {
              const cump = getProcesoTrimestralCump(stat.proceso, trimestre);
              const sem = getSemaphoreColor(cump);
              return (
                <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'bg-')}/20`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate flex-1">{stat.proceso}</p>
                    <span className="text-lg">{sem.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${sem.text}`}>{cump}%</p>
                  <p className="text-xs text-slate-500">T{trimestre}</p>
                </div>
              );
            })}
          </div>

          {/* Tabla Trimestral */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855]">Indicadores Trimestre {trimestre} ({trimestresMap[trimestre].join('-')})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 text-sm font-semibold text-slate-600">Indicador</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Meta</th>
                    {trimestresMap[trimestre].map(m => (
                      <th key={m} className="p-2 text-xs font-semibold text-slate-500 text-center">{m}</th>
                    ))}
                    <th className="p-3 text-sm font-semibold text-slate-600">% Trim.</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Semáforo</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {indicadoresFiltrados.map(ind => {
                    const cump = getCumpTrimestral(ind.id, trimestre);
                    const sem = getSemaphoreColor(cump);
                    const mesesTrim = trimestresMap[trimestre];
                    const seg = getSegumiento(ind.id);
                    const noCumple = cump < 50 || (seg && seg.length > 0 && cump < 80);
                    return (
                      <tr key={ind.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${noCumple ? 'bg-red-25' : ''}`}>
                        <td className="p-3 font-medium text-[#002855] text-sm">{ind.nombre}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.area}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.meta}</td>
                        {mesesTrim.map(mes => (
                          <td key={mes} className="p-2 text-center text-sm">
                            {getValor(ind.id, mes) || '-'}
                          </td>
                        ))}
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${sem.bg}`}>
                            {cump}%
                          </span>
                        </td>
                        <td className="p-2 text-2xl">{sem.icon}</td>
                        <td className="p-2">
                          {seg.length > 0 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" title={seg[0].tipo}>{seg.length}</span>
                          ) : noCumple ? (
                            <button onClick={() => abrirSeguimiento(ind)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">⚠️</button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Nuevo Indicador */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Indicador</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre</label>
                <input 
                  value={nuevoIndicador.nombre}
                  onChange={(e) => setNuevoIndicador({...nuevoIndicador, nombre: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                <select 
                  value={nuevoIndicador.area}
                  onChange={(e) => setNuevoIndicador({...nuevoIndicador, area: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Meta</label>
                  <input 
                    value={nuevoIndicador.meta}
                    onChange={(e) => setNuevoIndicador({...nuevoIndicador, meta: e.target.value})}
                    placeholder="> 90 o < 5"
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Unidad</label>
                  <input 
                    value={nuevoIndicador.unidad}
                    onChange={(e) => setNuevoIndicador({...nuevoIndicador, unidad: e.target.value})}
                    placeholder="%, mg/L, etc"
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
      )}

      {/* Modal Seguimiento - Cuando indicador no cumple */}
      {mostrarModalSeguimiento && indicadorNoCumple && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-[#002855] mb-2">⚠️ Indicador No Cumple</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-800">{indicadorNoCumple.nombre}</p>
              <p className="text-xs text-red-600 mt-1">Área: {indicadorNoCumple.area} | Meta: {indicadorNoCumple.meta} {indicadorNoCumple.unidad}</p>
            </div>
            
            <p className="text-sm text-slate-600 mb-3">Selecciona el tipo de seguimiento:</p>
            
            <div className="space-y-3">
              <button onClick={() => crearSeguimiento('AC', 'Crear Acción Correctiva para este indicador')} className="w-full p-3 border border-red-200 bg-red-50 rounded-lg text-left hover:bg-red-100 transition-colors">
                <span className="font-medium text-red-700">⚡ Acción Correctiva</span>
                <p className="text-xs text-red-600">Para No Conformidades mayores</p>
              </button>
              
              <button onClick={() => crearSeguimiento('RC', 'Crear Reporte de Corrección para este indicador')} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-lg text-left hover:bg-amber-100 transition-colors">
                <span className="font-medium text-amber-700">🔧 Reporte de Corrección</span>
                <p className="text-xs text-amber-600">Para ajustes menores</p>
              </button>
              
              <button onClick={() => crearSeguimiento('MINUTA', 'Crear Minuta de Reunión para analizar este indicador')} className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                <span className="font-medium text-blue-700">📋 Minuta de Reunión</span>
                <p className="text-xs text-blue-600">Para análisis en comité</p>
              </button>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalSeguimiento(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiesgosView({ riesgos, setRiesgos, usuarios, puedeTodasAreas, areaUsuario }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState({ 
    riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, 
    control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '',
    plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN'
  });

  const getNivel = (prob, imp) => prob * imp;
  const getColor = (nivel) => {
    if (nivel >= 15) return "bg-red-600 text-white";
    if (nivel >= 10) return "bg-orange-500 text-white";
    if (nivel >= 5) return "bg-yellow-400 text-black";
    return "bg-green-400 text-black";
  };

  const agregarRiesgo = () => {
    if (!nuevoRiesgo.riesgo) return;
    setRiesgos(prev => [...prev, { ...nuevoRiesgo, id: prev.length + 1 }]);
    setNuevoRiesgo({ riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' });
    setMostrarModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <p className="text-xs text-red-600">Riesgos Altos</p>
          <p className="text-2xl font-bold text-red-700">{riesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 10).length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <p className="text-xs text-amber-600">Riesgos Medios</p>
          <p className="text-2xl font-bold text-amber-700">{riesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 5 && getNivel(r.probabilidad, r.impacto) < 10).length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <p className="text-xs text-emerald-600">Riesgos Bajos</p>
          <p className="text-2xl font-bold text-emerald-700">{riesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) < 5).length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <p className="text-xs text-blue-600">Oportunidades</p>
          <p className="text-2xl font-bold text-blue-700">{riesgos.filter(r => r.tipo === 'Oportunidad').length}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855]">Matriz de Riesgos y Oportunidades</h2>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
            <Plus size={16} /> Nuevo
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-slate-600">Riesgo/Oportunidad</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Causa</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Proceso</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Prob.</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Imp.</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Nivel</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Plan de Acción</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Fecha</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Evaluación</th>
            </tr>
          </thead>
          <tbody>
            {riesgos.map(r => {
              const nivel = getNivel(r.probabilidad, r.impacto);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.tipo === 'Oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {r.riesgo}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{r.area || '-'}</td>
                  <td className="p-3 text-sm text-slate-600">{r.direccion || '-'}</td>
                  <td className="p-3 text-sm text-slate-600">{r.proceso || '-'}</td>
                  <td className="p-3 text-center">
                    <select 
                      value={r.probabilidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, probabilidad: val} : x));
                      }}
                      className="p-1 text-center text-sm border border-slate-200 rounded"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <select 
                      value={r.impacto}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, impacto: val} : x));
                      }}
                      className="p-1 text-center text-sm border border-slate-200 rounded"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getColor(nivel)}`}>
                      {nivel}
                    </span>
                  </td>
                  <td className="p-3">
                    <input 
                      value={r.plan_accion || ''}
                      onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, plan_accion: e.target.value} : x))}
                      placeholder="Plan de acción..."
                      className="p-1 text-sm border border-slate-200 rounded w-full"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="date"
                      value={r.fecha_termino || ''}
                      onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, fecha_termino: e.target.value} : x))}
                      className="p-1 text-sm border border-slate-200 rounded"
                    />
                  </td>
                  <td className="p-3">
                    <select 
                      value={r.evaluacion || ''}
                      onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, evaluacion: e.target.value} : x))}
                      className="p-1 text-sm border border-slate-200 rounded"
                    >
                      <option value="">-</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Malo">Malo</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Riesgo / Oportunidad</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo</label>
                <select value={nuevoRiesgo.tipo} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, tipo: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="Riesgo">Riesgo</option>
                  <option value="Oportunidad">Oportunidad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Riesgo / Oportunidad</label>
                <input value={nuevoRiesgo.riesgo} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, riesgo: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Descripción..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                  <select value={nuevoRiesgo.area} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, area: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                    <option value="">Seleccionar...</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Dirección</label>
                  <select value={nuevoRiesgo.direccion} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, direccion: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                    <option value="">Seleccionar...</option>
                    {DIRECCIONES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Proceso</label>
                  <select value={nuevoRiesgo.proceso} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, proceso: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                    <option value="">Seleccionar...</option>
                    {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Probabilidad (1-5)</label>
                  <input type="number" min="1" max="5" value={nuevoRiesgo.probabilidad} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, probabilidad: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Impacto (1-5)</label>
                  <input type="number" min="1" max="5" value={nuevoRiesgo.impacto} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, impacto: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={agregarRiesgo} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ usuarios = [], setUsuarios }) {
  const [mostrarModalUser, setMostrarModalUser] = useState(false);
  const [procesos, setProcesos] = useState(PROCESOS);
  const [areas, setAreas] = useState(AREAS);
  const [direcciones, setDirecciones] = useState(DIRECCIONES);
  const [nuevoProceso, setNuevoProceso] = useState('');
  const [nuevaArea, setNuevaArea] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '', password: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', name: '', action: null });
  const [editandoUsuario, setEditandoUsuario] = useState({ show: false, user: null });
  
  const usuariosList = Array.isArray(usuarios) ? usuarios : [];
  
  const safeSetUsuarios = typeof setUsuarios === 'function' ? setUsuarios : () => {};
  
  const guardarEdicionUsuario = () => {
    if (editandoUsuario.user) {
      safeSetUsuarios(usuariosList.map(u => u.id === editandoUsuario.user.id ? editandoUsuario.user : u));
      setEditandoUsuario({ show: false, user: null });
    }
  };
  
  const agregarProceso = () => {
    if (nuevoProceso && !procesos.includes(nuevoProceso)) {
      setProcesos([...procesos, nuevoProceso]);
      setNuevoProceso('');
    }
  };
  
  const eliminarProceso = (p) => {
    setConfirmDelete({ show: true, type: 'proceso', name: p, action: () => {
      setProcesos(procesos.filter(x => x !== p));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarArea = () => {
    if (nuevaArea && !areas.includes(nuevaArea)) {
      setAreas([...areas, nuevaArea]);
      setNuevaArea('');
    }
  };
  
  const eliminarArea = (a) => {
    setConfirmDelete({ show: true, type: 'área', name: a, action: () => {
      setAreas(areas.filter(x => x !== a));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarDireccion = () => {
    if (nuevaDireccion && !direcciones.includes(nuevaDireccion)) {
      setDirecciones([...direcciones, nuevaDireccion]);
      setNuevaDireccion('');
    }
  };
  
  const eliminarDireccion = (d) => {
    setConfirmDelete({ show: true, type: 'dirección', name: d, action: () => {
      setDirecciones(direcciones.filter(x => x !== d));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarUsuario = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.area) return;
    safeSetUsuarios(prev => [...prev, { ...nuevoUsuario, id: prev.length + 1 }]);
    setNuevoUsuario({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '', password: '' });
    setMostrarModalUser(false);
  };

  const eliminarUsuario = (id) => {
    setConfirmDelete({ show: true, type: 'usuario', name: id, action: () => {
      safeSetUsuarios(prev => prev.filter(u => u.id !== id));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };

  const getRolBadge = (rol) => {
    try {
      return getRolColor(rol) || 'bg-slate-100 text-slate-600';
    } catch {
      return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Usuarios</p>
          <p className="text-2xl font-bold text-[#002855]">{usuariosList.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-xs text-yellow-600">Super Admin</p>
          <p className="text-2xl font-bold text-yellow-700">{usuariosList.filter(u => u.rol === 'Super Admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-[#002855]">{usuariosList.filter(u => u.rol === 'Admin').length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-600">Auditores</p>
          <p className="text-2xl font-bold text-blue-700">{usuariosList.filter(u => u.rol === 'Auditor').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Encargados</p>
          <p className="text-2xl font-bold text-[#002855]">{usuariosList.filter(u => u.rol === 'Encargado').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Áreas</p>
          <p className="text-2xl font-bold text-[#002855]">{areas.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Direcciones</p>
          <p className="text-2xl font-bold text-[#002855]">{direcciones.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Procesos</p>
          <p className="text-2xl font-bold text-[#002855]">{procesos.length}</p>
        </div>
      </div>

      {/* Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Users size={20} className="text-cyan-500" />
            Gestión de Usuarios
          </h2>
          <button onClick={() => setMostrarModalUser(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Email</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Teléfono</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Dirección</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Rol</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Contraseña</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosList.map(u => (
              <tr key={u.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${u.rol === 'Super Admin' ? 'bg-purple-50' : ''}`}>
                <td className="p-3 font-medium text-[#002855]">
                  <div className="flex items-center gap-2">
                    {u.rol === 'Super Admin' && <span className="text-yellow-500" title="Super Admin">👑</span>}
                    {u.nombre}
                  </div>
                </td>
                <td className="p-3 text-sm text-slate-600">{u.email}</td>
                <td className="p-3 text-sm text-slate-600">{u.telefono}</td>
                <td className="p-3 text-sm text-slate-600">{u.area}</td>
                <td className="p-3 text-sm text-slate-600">{u.direccion || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRolBadge(u.rol)}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-sm text-slate-500">{u.password ? '••••••••' : '-'}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => { 
                      setEditandoUsuario({ show: true, user: u }); 
                    }} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Editar usuario">
                      <Edit size={16} />
                    </button>
                    {u.rol !== 'Super Admin' ? (
                      <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="p-2 text-slate-300 cursor-not-allowed" title="No se puede eliminar">
                        <Trash2 size={16} />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Áreas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Áreas
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevaArea} 
              onChange={(e) => setNuevaArea(e.target.value)}
              placeholder="Nueva área..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarArea()}
            />
            <button onClick={agregarArea} className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {areas.map(a => (
            <div key={a} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{a}</span>
              </div>
              <button onClick={() => eliminarArea(a)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Direcciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Direcciones
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevaDireccion} 
              onChange={(e) => setNuevaDireccion(e.target.value)}
              placeholder="Nueva dirección..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarDireccion()}
            />
            <button onClick={agregarDireccion} className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {direcciones.map(d => (
            <div key={d} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{d}</span>
              </div>
              <button onClick={() => eliminarDireccion(d)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Procesos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Procesos
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevoProceso} 
              onChange={(e) => setNuevoProceso(e.target.value)}
              placeholder="Nuevo proceso..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarProceso()}
            />
            <button onClick={agregarProceso} className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {procesos.map(p => (
            <div key={p} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{p}</span>
              </div>
              <button onClick={() => eliminarProceso(p)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ideas Futures */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 mb-2">Ideas para Desarrollo Future</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Chatbot para WhatsApp/Telegram por área</li>
          <li>• Notificaciones por correo electrónico automáticas</li>
          <li>• Sistema de alertas por vencimiento de indicadores</li>
          <li>• Dashboard personalizado por usuario</li>
        </ul>
      </div>

      {/* Modal Confirmación Eliminar */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-[#002855] mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 mb-4">¿Estás seguro de eliminar <strong>{confirmDelete.type}</strong>: "{confirmDelete.name}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ show: false, type: '', name: '', action: null })} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={confirmDelete.action} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {mostrarModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre Completo</label>
                <input value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nombre..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="correo@oomapasc.gob.mx" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Teléfono</label>
                <input value={nuevoUsuario.telefono} onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="644XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                <select value={nuevoUsuario.area} onChange={(e) => setNuevoUsuario({...nuevoUsuario, area: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Dirección</label>
                <select value={nuevoUsuario.direccion} onChange={(e) => setNuevoUsuario({...nuevoUsuario, direccion: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Rol</label>
                <select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="Usuario">Usuario (Ver + indicators/evidencias)</option>
                  <option value="Encargado">Encargado (Su área: AC, PM, indicadores)</option>
                  <option value="Auditor">Auditor (Crear AC/PM cualquier área, ver resultados)</option>
                  <option value="Admin">Admin (Compañeros SGC - todas las áreas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Contraseña</label>
                <input type="password" value={nuevoUsuario.password || ''} onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Contraseña inicial..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalUser(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={agregarUsuario} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editandoUsuario.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Editar Usuario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre Completo</label>
                <input value={editandoUsuario.user.nombre} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, nombre: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" value={editandoUsuario.user.email} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, email: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Teléfono</label>
                <input value={editandoUsuario.user.telefono} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, telefono: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="644XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                <select value={editandoUsuario.user.area} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, area: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Dirección</label>
                <select value={editandoUsuario.user.direccion} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, direccion: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Rol</label>
                <select value={editandoUsuario.user.rol} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, rol: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="Usuario">Usuario</option>
                  <option value="Encargado">Encargado</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nueva Contraseña</label>
                <input type="password" value={editandoUsuario.user.newPassword || ''} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, newPassword: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nueva contraseña..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditandoUsuario({ show: false, user: null })} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={guardarEdicionUsuario} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title, required }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-500 mb-4">
      <span className="text-lg">{icon}</span>
      <h3 className="text-base font-bold text-[#002855] m-0">{title}</h3>
      {required && <span className="text-red-500">*</span>}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
      >
        <option value="">Seleccionar...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function DocumentosView({ documentos, setDocumentos, puedeTodasAreas, areaUsuario }) {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoDoc, setNuevoDoc] = useState({ titulo: '', tipo: 'Procedimiento', area: '', version: '1.0', autor: '' });

  const tiposDoc = ['Manual', 'Procedimiento', 'Registro', 'Política', 'Instrucción', 'Formato', 'Guía'];
  const estadosDoc = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'OBSOLETO'];

  const getEstadoBadge = (estado) => {
    const colors = { 'APROBADO': 'bg-emerald-100 text-emerald-700', 'EN_REVISION': 'bg-amber-100 text-amber-700', 'BORRADOR': 'bg-slate-100 text-slate-600', 'OBSOLETO': 'bg-red-100 text-red-600' };
    return colors[estado] || 'bg-slate-100 text-slate-600';
  };

  const exportarDocumento = (doc) => {
    const contenido = `
================================================================================
                    SGC - OOMAPASC de Cajeme
                 Sistema de Gestión de Calidad
================================================================================

DOCUMENTO TÉCNICO
--------------------------------------------------------------------------------
Título:          ${doc.titulo}
Tipo:            ${doc.tipo}
Área:            ${doc.area}
Versión:         ${doc.version}
Estado:          ${doc.estado}
Fecha:           ${doc.fecha}
Autor:           ${doc.autor}

--------------------------------------------------------------------------------
Descripción del Documento:
--------------------------------------------------------------------------------
Documento del Sistema de Gestión de Calidad de OOMAPASC de Cajeme.
Este documento forma parte del control documental de la organización.

--------------------------------------------------------------------------------
Historial de Revisiones
--------------------------------------------------------------------------------
Versión | Fecha      | Autor | Descripción
${doc.version} | ${doc.fecha} | ${doc.autor} | Versión inicial

================================================================================
Generado por el Portal SGC - OOMAPASC de Cajeme
Fecha de exportación: ${new Date().toLocaleDateString('es-MX')}
================================================================================
    `;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.titulo.replace(/\s+/g, '_')}_v${doc.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarAC = (ac) => {
    const contenido = `
================================================================================
                    ACCIÓN CORRECTIVA
                 SGC - OOMAPASC de Cajeme
================================================================================

FOLIO: AC-${ac.id || Date.now()}
================================================================================

1. DATOS GENERALES
--------------------------------------------------------------------------------
Fecha de Detección:  ${ac.fecha_deteccion || 'N/A'}
Área:              ${ac.area || 'N/A'}
Proceso:            ${ac.proceso || 'N/A'}
Origen:            ${ac.origen || 'N/A'}
${ac.num_auditoria ? `No. Auditoría:     ${ac.num_auditoria}` : ''}
${ac.indicador ? `Indicador:        ${ac.indicador}` : ''}

2. DESCRIPCIÓN DE LA NO CONFORMIDAD
--------------------------------------------------------------------------------
${ac.descripcion_nc || 'Sin descripción'}

3. ANÁLISIS DE CAUSA RAÍZ (Método 6M)
--------------------------------------------------------------------------------
Posibles Causas:
${ac.posibles_causas || 'Por determinar'}

Causa Raíz:
${ac.causa_raiz || 'Por determinar'}

Acción de Contención:
${ac.accion_contencion || 'Por determinar'}

4. PLAN DE ACTIVIDADES
--------------------------------------------------------------------------------
${(ac.actividades || []).map((act, i) => `
${i + 1}. ${act.descripcion || 'Sin descripción'}
   Responsable: ${act.responsable || 'N/A'}
   Fecha límite: ${act.fecha_limite || 'N/A'}
   Estado: ${act.estado || 'PENDIENTE'}
`).join('')}

================================================================================
Estado: ${ac.estado || 'BORRADOR'}
Fecha de elaboración: ${ac.fecha_creacion || new Date().toISOString().split('T')[0]}
================================================================================
    `;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AC_${ac.area || 'acci_correctiva'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const agregarDoc = () => {
    if (!nuevoDoc.titulo || !nuevoDoc.area) return;
    setDocList(prev => [...prev, { ...nuevoDoc, id: Date.now(), estado: 'BORRADOR', fecha: new Date().toISOString().split('T')[0] }]);
    setMostrarModal(false);
    setNuevoDoc({ titulo: '', tipo: 'Procedimiento', area: '', version: '1.0', autor: '' });
  };

  const docsFiltrados = documentos.filter(d => {
    if (filtroTipo && d.tipo !== filtroTipo) return false;
    if (filtroEstado && d.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex gap-2">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">Todos los tipos</option>
            {tiposDoc.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {estadosDoc.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
          <Plus size={16} /> Nuevo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docsFiltrados.map(doc => (
          <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">{doc.tipo}</span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoBadge(doc.estado)}`}>{doc.estado}</span>
            </div>
            <h3 className="font-bold text-[#002855] mb-2">{doc.titulo}</h3>
            <div className="text-sm text-slate-500 space-y-1">
              <p>Área: {doc.area}</p>
              <p>Versión: {doc.version} | Fecha: {doc.fecha}</p>
              <p>Autor: {doc.autor}</p>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => exportarDocumento(doc)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                <Download size={14} /> Exportar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                <Eye size={14} /> Ver
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Documento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Título</label>
                <input value={nuevoDoc.titulo} onChange={e => setNuevoDoc({...nuevoDoc, titulo: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Título del documento..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo</label>
                  <select value={nuevoDoc.tipo} onChange={e => setNuevoDoc({...nuevoDoc, tipo: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                    {tiposDoc.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Versión</label>
                  <input value={nuevoDoc.version} onChange={e => setNuevoDoc({...nuevoDoc, version: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                <select value={nuevoDoc.area} onChange={e => setNuevoDoc({...nuevoDoc, area: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Autor</label>
                <input value={nuevoDoc.autor} onChange={e => setNuevoDoc({...nuevoDoc, autor: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nombre del autor..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={agregarDoc} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditoriasView({ auditorias, setAuditorias, puedeTodasAreas, areaUsuario }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [verInformes, setVerInformes] = useState(false);
  const [anioSeleccionado, setAnioSeleccionado] = useState(2026);
  const [informes, setInformes] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(false);
  const [informeSeleccionado, setInformeSeleccionado] = useState(null);

// Cargar informes desde Supabase
  useEffect(() => {
    if (verInformes) {
      async function cargarInformes() {
        setLoadingInformes(true);
        console.log('📋 Iniciando carga de informes...');
        try {
          console.log('🔄 Haciendo query a Supabase...');
          const { data, error } = await supabase
            .from('informes_auditoria')
            .select('*')
            .order('anio', { ascending: false })
            .order('numero', { ascending: true });

          console.log('✅ Query completada');
          console.log('   Data长度:', data?.length || 0);
          console.log('   Error:', error);

          setLoadingInformes(false);

          if (error) {
            console.error('❌ Error cargando informes:', error);
            setInformes(localInformes);
          } else if (data && data.length > 0) {
            console.log('📄 Estableciendo informes desde Supabase:', data);
            setInformes(data);
          } else {
            console.warn('⚠️ No hay datos en Supabase, usando locales');
            setInformes(localInformes);
          }
        } catch (e) {
          console.error('❗ Excepción:', e);
          setInformes(localInformes);
          setLoadingInformes(false);
        }
      }
      cargarInformes();
    }
  }, [verInformes]);

  // Informes locales como fallback (solo si no hay datos en Supabase)
  const localInformes = [
    { anio: 2025, numero: 1, nombre: '01 Informe Responsabilidad Dirección', tipo: 'PDF' },
    { anio: 2025, numero: 2, nombre: '02 Informe MAM', tipo: 'PDF' },
    { anio: 2025, numero: 3, nombre: '03 MC', tipo: 'PDF' },
    { anio: 2025, numero: 4, nombre: '04 Comunicación', tipo: 'PDF' },
    { anio: 2025, numero: 5, nombre: '05 Producción', tipo: 'PDF' },
    { anio: 2025, numero: 6, nombre: '06 Comercialización', tipo: 'PDF' },
    { anio: 2024, numero: 1, nombre: '01 Responsabilidad Dirección', tipo: 'PDF' },
    { anio: 2024, numero: 2, nombre: '02 Gestión Recursos', tipo: 'PDF' },
    { anio: 2024, numero: 3, nombre: '03 Comunicación', tipo: 'PDF' },
    { anio: 2024, numero: 4, nombre: '04 Producción', tipo: 'PDF' },
    { anio: 2024, numero: 5, nombre: '05 Proyectos', tipo: 'PDF' },
    { anio: 2024, numero: 6, nombre: '06 MAM', tipo: 'PDF' },
    { anio: 2024, numero: 7, nombre: '07 MC', tipo: 'PDF' },
    { anio: 2024, numero: 8, nombre: '08 Comercialización', tipo: 'PDF' },
    { anio: 2024, numero: 9, nombre: '09 Comunicación', tipo: 'PDF' },
    { anio: 2024, numero: 10, nombre: '10 Producción', tipo: 'PDF' },
    { anio: 2024, numero: 11, nombre: '11 Comercialización', tipo: 'PDF' },
    { anio: 2024, numero: 12, nombre: '12 Gestión Recursos', tipo: 'PDF' },
    { anio: 2023, numero: 1, nombre: '01 Responsabilidad Dirección', tipo: 'PDF' },
    { anio: 2023, numero: 2, nombre: '02 Medición Análisis', tipo: 'PDF' },
    { anio: 2023, numero: 3, nombre: '03 Comunicación', tipo: 'PDF' },
    { anio: 2023, numero: 4, nombre: '04 Comercialización', tipo: 'PDF' },
    { anio: 2023, numero: 5, nombre: '05 MAM', tipo: 'PDF' },
    { anio: 2023, numero: 6, nombre: '06 Gestión Recursos', tipo: 'PDF' },
    { anio: 2023, numero: 7, nombre: '07 Producción', tipo: 'PDF' },
    { anio: 2023, numero: 8, nombre: '08 Proyectos', tipo: 'PDF' },
    { anio: 2023, numero: 9, nombre: '09 MAM', tipo: 'PDF' },
    { anio: 2023, numero: 10, nombre: '10 Producción', tipo: 'PDF' },
    { anio: 2023, numero: 11, nombre: '11 Comercial', tipo: 'PDF' },
  ];

  // Filtrar informes por año seleccionado
  const informesFiltrados = informes.filter(i => i.anio === anioSeleccionado);

  // Años disponibles
  const aniosDisponibles = [...new Set(informes.map(i => i.anio))].sort((a, b) => b - a);
  if (aniosDisponibles.length === 0) {
    aniosDisponibles.push(2026, 2025, 2024, 2023);
  }

  // Resumen
  const auditoriasResumen = [
    { anio: 2026, total: auditorias.filter(a => a.numero?.includes('2026')).length || 2, informes: informes.filter(i => i.anio === 2026).length || 6 },
    { anio: 2025, total: auditorias.filter(a => a.numero?.includes('2025')).length || 12, informes: informes.filter(i => i.anio === 2025).length || 6 },
    { anio: 2024, total: auditorias.filter(a => a.numero?.includes('2024')).length || 12, informes: informes.filter(i => i.anio === 2024).length || 12 },
    { anio: 2023, total: auditorias.filter(a => a.numero?.includes('2023')).length || 11, informes: informes.filter(i => i.anio === 2023).length || 11 },
  ];

  const getEstadoColor = (estado) => {
    const colors = { 'COMPLETADA': 'bg-emerald-100 text-emerald-700', 'EN_PROCESO': 'bg-blue-100 text-blue-700', 'PROGRAMADA': 'bg-amber-100 text-amber-700', 'CANCELADA': 'bg-red-100 text-red-600' };
    return colors[estado] || 'bg-slate-100 text-slate-600';
  };

  const agregarAuditoria = () => {
    const numero = `AUD-${new Date().getFullYear()}-${String(auditorias.length + 1).padStart(3, '0')}`;
    const nuevaAud = { id: Date.now(), numero, tipo: 'Interna', area: puedeTodasAreas ? 'Sistema de Gestión de Calidad' : areaUsuario, fecha_inicio: '', fecha_fin: '', estado: 'PROGRAMADA', hallazgos: 0, no_conformidades: 0 };
    setAuditorias(prev => [...prev, nuevaAud]);
    setMostrarModal(false);
  };

  const verInforme = (informe) => {
    setInformeSeleccionado(informe);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen por año - Solo informativo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {auditoriasResumen.map(resumen => (
          <div key={resumen.anio} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Año {resumen.anio}</span>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-3xl font-bold text-[#002855]">{resumen.total}</p>
            <p className="text-xs text-slate-500 mt-1">auditorías • {resumen.informes} informes</p>
          </div>
        ))}
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Auditorías</p>
          <p className="text-2xl font-bold text-[#002855]">{auditorias.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <p className="text-xs text-emerald-600">Completadas</p>
          <p className="text-2xl font-bold text-emerald-700">{auditorias.filter(a => a.estado === 'COMPLETADA').length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-600">En Proceso</p>
          <p className="text-2xl font-bold text-blue-700">{auditorias.filter(a => a.estado === 'EN_PROCESO').length}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-600">Programadas</p>
          <p className="text-2xl font-bold text-amber-700">{auditorias.filter(a => a.estado === 'PROGRAMADA').length}</p>
        </div>
      </div>

      {/* Sección de Informes de Auditoría */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2">
            📄 Informes de Auditoría
          </h2>
          <button 
            onClick={() => setVerInformes(!verInformes)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${verInformes ? 'bg-cyan-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {verInformes ? 'Ocultar' : 'Ver Informes'}
          </button>
        </div>
        
        {verInformes && (
          <div className="p-6">
            {loadingInformes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
                <span className="ml-2 text-slate-500">Cargando informes...</span>
              </div>
            ) : (
              <>
                {/* Selector de año */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {aniosDisponibles.map(anio => (
                    <button
                      key={anio}
                      onClick={() => setAnioSeleccionado(anio)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        anioSeleccionado === anio 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {anio}
                    </button>
                  ))}
                </div>
                
                {/* Lista de informes */}
                <div className="grid gap-3">
                  {informesFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-4xl mb-2">📭</p>
                      <p>No hay informes para {anioSeleccionado}</p>
                    </div>
                  ) : informesFiltrados.map((informe, idx) => (
                    <div key={informe.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm">
                          {String(informe.numero || idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-medium text-[#002855]">{informe.nombre}</p>
                          <p className="text-xs text-slate-500">{informe.anio} • {informe.tipo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          informe.tipo === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {informe.tipo}
                        </span>
                        <button 
                          onClick={() => verInforme(informe)}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-300 transition-all"
                          title="Ver informe"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Los informes se almacenan en SharePoint. Contacta al área de SGC para acceder a los documentos originales.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lista simple de auditorías */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-[#002855]">📋 Auditorías Recientes</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {auditorias.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-4xl mb-2">📭</p>
              <p>No hay auditorías registradas</p>
            </div>
          ) : auditorias.slice(0, 5).map(aud => (
            <div key={aud.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#002855]">{aud.numero}</p>
                <p className="text-sm text-slate-500">{aud.area} • {aud.fecha_inicio || 'Sin fecha'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(aud.estado)}`}>
                {aud.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal simple */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nueva Auditoría</h3>
            <p className="text-sm text-slate-600 mb-4">Se creará un registro nuevo de auditoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={agregarAuditoria} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver informe */}
      {informeSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{informeSeleccionado.nombre}</h3>
                <p className="text-sm text-cyan-200">Año {informeSeleccionado.anio}</p>
              </div>
              <button onClick={() => setInformeSeleccionado(null)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {informeSeleccionado?.url ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-blue-800">URL del documento:</p>
                    <p className="text-blue-600 break-all">{informeSeleccionado.url}</p>
                  </div>
                  <iframe 
                    src={informeSeleccionado.url} 
                    className="w-full h-[60vh] rounded-xl border border-slate-200"
                    title={informeSeleccionado.nombre}
                  />
                  <a 
                    href={informeSeleccionado.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    <Download size={20} />
                    Descargar PDF
                  </a>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={64} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600 mb-2">Documento no disponible en línea</p>
                  <p className="text-sm text-slate-500 mb-4">Este informe se encuentra almacenado en SharePoint.</p>
                  <p className="text-xs text-slate-400">Para acceder, contacta al área de Sistema de Gestión de Calidad.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setInformeSeleccionado(null)}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GestorAprobacionesView({ accionesCorrectivas, planesMejora, usuarios, puedeTodasAreas, areaUsuario }) {
  const [aprobaciones, setAprobaciones] = useLocalStorage('sgc-aprobaciones', [
    { id: 1, documento: 'AC-2026-001', tipo: 'Acción Correctiva', area: 'Control de Calidad', solicitante: 'Ing. Juan López', fecha: '2026-04-15', estado: 'PENDIENTE', prioridad: 'Alta' },
    { id: 2, documento: 'PM-2026-002', tipo: 'Plan de Mejora', area: 'Recursos Humanos', solicitante: 'Lic. María García', fecha: '2026-04-18', estado: 'APROBADO', prioridad: 'Media' },
    { id: 3, documento: 'AC-2026-002', tipo: 'Acción Correctiva', area: 'Mantenimiento de Redes', solicitante: 'Ing. Pedro Martínez', fecha: '2026-04-20', estado: 'PENDIENTE', prioridad: 'Alta' },
    { id: 4, documento: 'DOC-2026-005', tipo: 'Documento', area: 'Sistema de Gestión de Calidad', solicitante: 'Ing. Roberto Torres', fecha: '2026-04-22', estado: 'RECHAZADO', prioridad: 'Baja' },
  ]);
  const [filtroEstado, setFiltroEstado] = useState('');

  const getPrioridadColor = (p) => {
    const colors = { 'Alta': 'bg-red-100 text-red-700', 'Media': 'bg-amber-100 text-amber-700', 'Baja': 'bg-emerald-100 text-emerald-700' };
    return colors[p] || 'bg-slate-100 text-slate-600';
  };

  const getEstadoColor = (estado) => {
    const colors = { 'APROBADO': 'bg-emerald-100 text-emerald-700', 'PENDIENTE': 'bg-amber-100 text-amber-700', 'RECHAZADO': 'bg-red-100 text-red-700' };
    return colors[estado] || 'bg-slate-100 text-slate-600';
  };

  const cambiarEstado = (id, nuevoEstado) => {
    setAprobaciones(prev => prev.map(a => a.id === id ? { ...a, estado: nuevoEstado } : a));
  };

  const appsFiltradas = aprobaciones.filter(a => {
    if (filtroEstado && a.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center gap-4">
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-[#002855]">Flujo de Aprobaciones</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-slate-600">Documento</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Tipo</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Solicitante</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Fecha</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Prioridad</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Estado</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appsFiltradas.map(app => (
              <tr key={app.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 font-medium text-[#002855]">{app.documento}</td>
                <td className="p-3 text-sm text-slate-600">{app.tipo}</td>
                <td className="p-3 text-sm text-slate-600">{app.area}</td>
                <td className="p-3 text-sm text-slate-600">{app.solicitante}</td>
                <td className="p-3 text-sm text-slate-600">{app.fecha}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPrioridadColor(app.prioridad)}`}>{app.prioridad}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(app.estado)}`}>{app.estado}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {app.estado === 'PENDIENTE' && (
                      <>
                        <button onClick={() => cambiarEstado(app.id, 'APROBADO')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Aprobar">
                          <Check size={16} />
                        </button>
                        <button onClick={() => cambiarEstado(app.id, 'RECHAZADO')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rechazar">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;