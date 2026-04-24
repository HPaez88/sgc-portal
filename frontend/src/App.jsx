import React, { useState, useEffect, useCallback } from 'react';
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
  Download,
  Check
} from 'lucide-react';
import { getApiUrl } from './config';
import { AREAS, DIRECCIONES, PROCESOS, ORIGENES_AC, getColorNivel, getNivelRiesgo, getEstadoColor, getRolColor } from './catalogs';
import { useLocalStorage, useFormValidation } from './hooks';

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
        } fixed inset-y-0 left-0 z-50 w-72 bg-[#001f42] text-slate-300 transition-transform duration-400 ease-out md:relative md:translate-x-0 flex flex-col shadow-2xl`}
      >
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

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          
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

            {/* ACCIONES CORRECTIVAS */}
            {activeTab === 'ac' && <AccionCorrectivaView />}

{/* PLANES DE MEJORA */}
            {activeTab === 'pm' && <PlanMejoraView />}

            {/* INDICADORES */}
            {activeTab === 'indicadores' && <IndicadoresView />}

            {/* MATRIZ DE RIESGOS */}
            {activeTab === 'riesgos' && <RiesgosView />}

            {/* CONFIGURACIÓN */}
            {activeTab === 'settings' && <SettingsView />}

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
      `}} />
    </div>
  );
}

function AccionCorrectivaView() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errores, setErrores] = useState({});
  
  const [formData, setFormData] = useState({
    fecha_deteccion: '',
    proceso: '',
    area: '',
    origen: '',
    num_auditoria: '',
    descripcion_nc: '',
    posibles_causas: '',
    causa_raiz: '',
    accion_contencion: '',
    actividades: [],
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
      if (!formData.descripcion_nc) newErrors.descripcion_nc = 'Requerido';
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
      actividades: [...prev.actividades, { descripcion: '', responsable: '', fecha_limite: '', estado: 'PENDIENTE' }]
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
    if (!formData.descripcion_nc) {
      alert('Describe la No Conformidad primero');
      return;
    }
    setGenerando(true);
    try {
      const prompt = `Eres un experto en Sistema de Gestión de Calidad ISO 9001. Analiza la siguiente No Conformidad y genera:
1. Posibles causas (usa los 6M: Método, Máquina, Material, Medio, Mano de obra, Medio Ambiente)
2. Causa raíz identificada
3. Acción de contención inmediata
4. Plan de actividades (3-5 acciones con responsable y fecha sugerida)

No Conformidad: ${formData.descripcion_nc}

Responde en JSON:
{
  "posibles_causas": "...",
  "causa_raiz": "...",
  "accion_contencion": "...",
  "actividades": [{"descripcion": "...", "responsable": "...", "fecha_limite": "...", "estado": "PENDIENTE"}]
}`;
      
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
              accion_contencion: parsed.accion_contencion || '',
              actividades: parsed.actividades?.length ? parsed.actividades : prev.actividades
            }));
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
    
    setLoading(true);
    try {
      const payload = { ...formData, estado: enviar ? 'EN_REVISION' : 'BORRADOR' };
      const resp = await fetch(getApiUrl('/api/v1/acciones-correctivas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          alert(enviar ? 'Enviado a revisión' : 'Guardado como borrador');
          setSuccess(false);
          if (enviar) {
            setFormData({
              fecha_deteccion: '', proceso: '', area: '', origen: '', num_auditoria: '', descripcion_nc: '',
              posibles_causas: '', causa_raiz: '', accion_contencion: '',
              actividades: [], estado: 'BORRADOR'
            });
            setStep(1);
          }
        }, 500);
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(3, s + 1));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
      {/* Steps */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputField label="Fecha Detección" name="fecha_deteccion" type="date" value={formData.fecha_deteccion} onChange={handleChange} />
                {errores.fecha_deteccion && <p className="text-red-500 text-xs mt-1">{errores.fecha_deteccion}</p>}
              </div>
              <div>
                <SelectField label="Área" name="area" value={formData.area} onChange={handleChange} options={AREAS} />
                {errores.area && <p className="text-red-500 text-xs mt-1">{errores.area}</p>}
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
            </div>

            <div>
              <SectionTitle icon="⚠️" title="Descripción de la No Conformidad" required />
              <textarea
                name="descripcion_nc"
                value={formData.descripcion_nc}
                onChange={handleChange}
                placeholder="Describe la no conformidad detectada..."
                className={`w-full p-4 border rounded-xl resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${errores.descripcion_nc ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.descripcion_nc && <p className="text-red-500 text-xs mt-1">{errores.descripcion_nc}</p>}
            </div>

            <button
              onClick={generarConIA}
              disabled={generando || !formData.descripcion_nc}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {generando ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generando ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <SectionTitle icon="🔍" title="Análisis de Causa Raíz (6M)" required />
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Posibles Causas</label>
              <textarea
                name="posibles_causas"
                value={formData.posibles_causas}
                onChange={handleChange}
                placeholder="Lista las posibles causas (Método, Máquina, Material, Medio, Mano de obra, Medio Ambiente)..."
                className={`w-full p-4 border rounded-xl resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${errores.posibles_causas ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.posibles_causas && <p className="text-red-500 text-xs mt-1">{errores.posibles_causas}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Causa Raíz Identificada</label>
              <textarea
                name="causa_raiz"
                value={formData.causa_raiz}
                onChange={handleChange}
                placeholder="¿Cuál es la causa raíz?"
                className={`w-full p-4 border rounded-xl resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${errores.causa_raiz ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errores.causa_raiz && <p className="text-red-500 text-xs mt-1">{errores.causa_raiz}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Acción de Contención</label>
              <textarea
                name="accion_contencion"
                value={formData.accion_contencion}
                onChange={handleChange}
                placeholder="¿Qué acción inmediata se tomó para contener el problema?"
                className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
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
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <input
                      type="date"
                      value={act.fecha_limite}
                      onChange={(e) => actualizarActividad(idx, 'fecha_limite', e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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

function PlanMejoraView() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    fecha_elaboracion: '',
    area: '',
    proceso: '',
    situacion_actual: '',
    situacion_deseada: '',
    beneficios: '',
    equipo_trabajo: '',
    actividades: [],
    estado: 'BORRADOR'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const agregarActividad = () => {
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, { actividad: '', indicador: '', meta: '', responsable: '', fecha_inicio: '', fecha_fin: '', estado: 'PENDIENTE' }]
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
      alert('Describe la situación actual y deseable primero');
      return;
    }
    setGenerando(true);
    try {
      const prompt = `Eres un experto en Sistema de Gestión de Calidad ISO 9001. Analiza el siguiente Plan de Mejora y genera:
1. Beneficios esperados
2. Equipo de trabajo necesario
3. Plan de actividades con indicadores, metas, responsables y fechas

Situación Actual: ${formData.situacion_actual}
Situación Deseada: ${formData.situacion_deseada}

Responde en JSON:
{
  "beneficios": "...",
  "equipo_trabajo": "...",
  "actividades": [{"actividad": "...", "indicador": "...", "meta": "...", "responsable": "...", "fecha_inicio": "...", "fecha_fin": "...", "estado": "PENDIENTE"}]
}`;
      
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
              equipo_trabajo: parsed.equipo_trabajo || '',
              actividades: parsed.actividades?.length ? parsed.actividades : prev.actividades
            }));
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
    setLoading(true);
    try {
      const payload = { ...formData, estado: enviar ? 'EN_REVISION' : 'BORRADOR' };
      const resp = await fetch(getApiUrl('/api/v1/planes-mejora'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.ok) {
        alert(enviar ? 'Enviado a revisión' : 'Guardado como borrador');
        if (enviar) {
          setFormData({
            codigo: '', fecha_elaboracion: '', area: '', proceso: '', situacion_actual: '',
            situacion_deseada: '', beneficios: '', equipo_trabajo: '',
            actividades: [], estado: 'BORRADOR'
          });
          setStep(1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Código" name="codigo" value={formData.codigo} onChange={handleChange} placeholder="PM-2026-001" />
              <InputField label="Fecha Elaboración" name="fecha_elaboracion" type="date" value={formData.fecha_elaboracion} onChange={handleChange} />
              <SelectField label="Área" name="area" value={formData.area} onChange={handleChange} options={AREAS} />
              <SelectField label="Proceso" name="proceso" value={formData.proceso} onChange={handleChange} options={PROCESOS} />
            </div>

            <div>
              <SectionTitle icon="📈" title="Situación Actual" required />
              <textarea
                name="situacion_actual"
                value={formData.situacion_actual}
                onChange={handleChange}
                placeholder="Describe la situación actual que desea mejorar..."
                className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>

            <div>
              <SectionTitle icon="🎯" title="Situación Deseada" required />
              <textarea
                name="situacion_deseada"
                value={formData.situacion_deseada}
                onChange={handleChange}
                placeholder="¿Cuál es el objetivo o situación deseada?"
                className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>

            <button
              onClick={generarConIA}
              disabled={generando || !formData.situacion_actual || !formData.situacion_deseada}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {generando ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generando ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <SectionTitle icon="✨" title="Análisis y Beneficios" />
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Beneficios Esperados</label>
              <textarea
                name="beneficios"
                value={formData.beneficios}
                onChange={handleChange}
                placeholder="¿Qué beneficios se esperan obtener con esta mejora?"
                className="w-full p-4 border border-slate-200 rounded-xl resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Equipo de Trabajo</label>
              <input
                name="equipo_trabajo"
                value={formData.equipo_trabajo}
                onChange={handleChange}
                placeholder="Nombres de los integrantes del equipo..."
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        )}

        {step === 3 && (
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

function IndicadoresView() {
  const [editando, setEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoIndicador, setNuevoIndicador] = useState({ nombre: '', proceso: '', meta: '', unidad: '' });
  
  const procesos = [
    'Comercialización',
    'Comunicación',
    'Gestión de Recursos',
    'Mantenimiento y Calibración',
    'Medición Análisis y Mejora',
    'Producción',
    'Proyectos e Infraestructura',
    'Responsabilidad de la Dirección'
  ];

  const [indicadores, setIndicadores] = useState([
    { id: 1, nombre: 'Turbiedad Promedio', proceso: 'Producción', meta: '< 1.0', unidad: 'NTU' },
    { id: 2, nombre: 'Cloro Residual', proceso: 'Producción', meta: '0.5-1.5', unidad: 'mg/L' },
    { id: 3, nombre: 'Recaudación', proceso: 'Comercialización', meta: '> 95', unidad: '%' },
    { id: 4, nombre: 'Quejas Atendidas', proceso: 'Comunicación', meta: '< 24', unidad: 'hrs' },
    { id: 5, nombre: 'Eficiencia de Bombas', proceso: 'Mantenimiento y Calibración', meta: '> 85', unidad: '%' },
    { id: 6, nombre: 'NC Resueltas', proceso: 'Medición Análisis y Mejora', meta: '> 90', unidad: '%' },
    { id: 7, nombre: 'Cumplimiento de Indicadores', proceso: 'Responsabilidad de la Dirección', meta: '> 80', unidad: '%' },
    { id: 8, nombre: 'Proyectos Terminados', proceso: 'Proyectos e Infraestructura', meta: '> 90', unidad: '%' },
    { id: 9, nombre: 'Capacitaciones', proceso: 'Gestión de Recursos', meta: '100', unidad: '%' },
  ]);
  
  const [resultados, setResultados] = useState({});
  const [anioActual] = useState(2026);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getCumplimiento = (indicadorId) => {
    const valores = meses.map(m => resultados[`${indicadorId}-${m}`]).filter(v => v);
    if (valores.length === 0) return 0;
    const meta = indicadores.find(i => i.id === indicadorId)?.meta || '';
    const esMayor = meta.startsWith('>');
    const esMenor = meta.startsWith('<');
    const numMeta = parseFloat(meta.replace(/[<|>]/g, '').replace(/%/g, ''));
    
    let cumplidos = 0;
    valores.forEach(v => {
      const num = parseFloat(String(v).replace(/%/g, ''));
      if (isNaN(num)) return;
      if (esMayor && num >= numMeta) cumplidos++;
      else if (esMenor && num <= numMeta) cumplidos++;
      else if (!esMayor && !esMenor && num >= numMeta) cumplidos++;
    });
    return Math.round((cumplidos / valores.length) * 100);
  };

  const getCumplimientoColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-100 text-emerald-700';
    if (pct >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getProcesoCumplimiento = (proceso) => {
    const indicadoresProceso = indicadores.filter(i => i.proceso === proceso);
    if (indicadoresProceso.length === 0) return 0;
    const suma = indicadoresProceso.reduce((acc, ind) => acc + getCumplimiento(ind.id), 0);
    return Math.round(suma / indicadoresProceso.length);
  };

  const guardarResultado = (indicadorId, mes, valor) => {
    setResultados(prev => ({ ...prev, [`${indicadorId}-${mes}`]: valor }));
    setEditando(null);
  };

  const agregarIndicador = () => {
    if (!nuevoIndicador.nombre || !nuevoIndicador.proceso || !nuevoIndicador.meta) return;
    setIndicadores(prev => [...prev, { ...nuevoIndicador, id: prev.length + 1 }]);
    setNuevoIndicador({ nombre: '', proceso: '', meta: '', unidad: '' });
    setMostrarModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen por Proceso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {procesos.map(proc => (
          <div key={proc} className={`p-4 rounded-xl border ${getProcesoCumplimiento(proc) >= 80 ? 'bg-emerald-50 border-emerald-200' : getProcesoCumplimiento(proc) >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-slate-500 mb-1 truncate">{proc}</p>
            <p className="text-2xl font-bold text-slate-700">{getProcesoCumplimiento(proc)}%</p>
            <p className="text-xs text-slate-500">cumplimiento</p>
          </div>
        ))}
      </div>

      {/* Tabla de Indicadores */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855]">Registro de Indicadores - {anioActual}</h2>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-all">
            <Plus size={16} />
            Nuevo Indicador
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-3 text-sm font-semibold text-slate-600">Indicador</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Proceso</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Meta</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Unidad</th>
                {meses.map(m => (
                  <th key={m} className="p-2 text-xs font-semibold text-slate-500 text-center">{m}</th>
                ))}
                <th className="p-3 text-sm font-semibold text-slate-600">% Cump.</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map(ind => (
                <tr key={ind.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-[#002855]">{ind.nombre}</td>
                  <td className="p-3 text-sm text-slate-600">{ind.proceso}</td>
                  <td className="p-3 text-sm text-slate-600">{ind.meta}</td>
                  <td className="p-3 text-sm text-slate-600">{ind.unidad}</td>
                  {meses.map(mes => {
                    const key = `${ind.id}-${mes}`;
                    const valor = resultados[key] || '';
                    return (
                      <td key={mes} className="p-1 text-center">
                        {editando === key ? (
                          <input
                            type="text"
                            value={valor}
                            onChange={(e) => guardarResultado(ind.id, mes, e.target.value)}
                            onBlur={() => setEditando(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditando(null)}
                            autoFocus
                            className="w-full p-1 text-center text-xs border border-cyan-500 rounded"
                          />
                        ) : (
                          <span 
                            onClick={() => setEditando(key)}
                            className="cursor-pointer hover:bg-cyan-50 px-1 py-0.5 rounded text-xs block"
                          >
                            {valor || '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getCumplimientoColor(getCumplimiento(ind.id))}`}>
                      {getCumplimiento(ind.id)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                <label className="block text-sm font-semibold text-slate-600 mb-1">Proceso</label>
                <select 
                  value={nuevoIndicador.proceso}
                  onChange={(e) => setNuevoIndicador({...nuevoIndicador, proceso: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  {procesos.map(p => <option key={p} value={p}>{p}</option>)}
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
              <button onClick={agregarIndicador} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiesgosView() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState({ 
    riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, 
    control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '',
    plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN'
  });

  const [riesgos, setRiesgos] = useState([
    { id: 1, riesgo: 'Contaminación del agua', causa: 'Fallas en proceso de potabilización', efecto: 'Problemas de salud', probabilidad: 3, impacto: 4, control: 'Cloración', tipo: 'Riesgo', area: 'Operación', direccion: 'Dir. Técnica', proceso: 'Producción', plan_accion: 'Mejorar monitoreo de cloro', fecha_termino: '2026-06-30', evaluacion: 'En proceso', estado_plan: 'EN_PROCESO' },
    { id: 2, riesgo: 'Falla de bombas', causa: 'Falta de mantenimiento', efecto: 'Sin servicio', probabilidad: 2, impacto: 4, control: 'Mantenimiento preventivo', tipo: 'Riesgo', area: 'Mantenimiento', direccion: 'Dir. Técnica', proceso: 'Mantenimiento y Calibración', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' },
    { id: 3, riesgo: 'Quejas de clientes', causa: 'Atención lenta', efecto: 'Inconformidad', probabilidad: 3, impacto: 2, control: 'Capacitación', tipo: 'Riesgo', area: 'Comercialización', direccion: 'Dir. Comercial', proceso: 'Comercialización', plan_accion: 'Capacitación en atención', fecha_termino: '2026-05-15', evaluacion: 'Bueno', estado_plan: 'COMPLETADO' },
    { id: 4, riesgo: 'Cortocircuito', causa: 'Cables viejas', efecto: 'Incendio', probabilidad: 1, impacto: 5, control: 'Renovación', tipo: 'Riesgo', area: 'Mantenimiento', direccion: 'Dir. Administrativa', proceso: 'Mantenimiento y Calibración', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' },
    { id: 5, riesgo: 'Clientes nuevos', causa: 'Promociones', efecto: 'Más ingresos', probabilidad: 4, impacto: 3, control: '', tipo: 'Oportunidad', area: 'Comercialización', direccion: 'Dir. Comercial', proceso: 'Comercialización', plan_accion: 'Campaña de promo', fecha_termino: '2026-07-01', evaluacion: '', estado_plan: 'EN_PROCESO' },
  ]);

  const getNivel = (prob, imp) => getNivelRiesgo(prob, imp);
  const getColor = (nivel) => getColor(nivel);

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
              <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Dirección</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Proceso</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Prob.</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Imp.</th>
              <th className="p-3 text-sm font-semibold text-slate-600 text-center">Nivel</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Plan de Acción</th>
              <th className="p-3 text-sm font-semibold text-slate-600">Fecha Término</th>
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
                      {[1,2,3,4,5].map(n => <option key={n} value={n}</option>)}
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

function SettingsView() {
  const [mostrarModalUser, setMostrarModalUser] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '' });
  
  const [procesos, setProcesos] = useState([
    'Comercialización', 'Comunicación', 'Gestión de Recursos', 'Mantenimiento y Calibración',
    'Medición Análisis y Mejora', 'Producción', 'Proyectos e Infraestructura', 'Responsabilidad de la Dirección'
  ]);
  
  const [areas, setAreas] = useState([
    'Operación', 'Mantenimiento', 'Comercialización', 'Calidad', 'Administración'
  ]);
  
  const [direcciones, setDirecciones] = useState([
    'Dir. General', 'Dir. Técnica', 'Dir. Administrativa', 'Dir. Órganos de Control Interno', 'Dir. Comercial', 'Dir. Jurídica', 'Dir. Programas Sociales y Cultura del Agua'
  ]);
  
  const [nuevoProceso, setNuevoProceso] = useState('');
  const [nuevaArea, setNuevaArea] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', name: '', action: null });
  
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
  
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre: 'Ing. Juan López', email: 'jlopez@oomapasc.gob.mx', telefono: '6441234567', area: 'Operación', rol: 'Admin', direccion: 'Dir. Técnica' },
    { id: 2, nombre: 'Lic. María García', email: 'mgarcia@oomapasc.gob.mx', telefono: '6442345678', area: 'Comercialización', rol: 'Usuario', direccion: 'Dir. Comercial' },
    { id: 3, nombre: 'Ing. Pedro Martínez', email: 'pmartinez@oomapasc.gob.mx', telefono: '6443456789', area: 'Mantenimiento', rol: 'Encargado', direccion: 'Dir. Técnica' },
    { id: 4, nombre: 'C.P. Ana Hernández', email: 'ahernandez@oomapasc.gob.mx', telefono: '6444567890', area: 'Administración', rol: 'Usuario', direccion: 'Dir. Administrativa' },
    { id: 5, nombre: 'Ing. Roberto Torres', email: 'rtorres@oomapasc.gob.mx', telefono: '6445678901', area: 'Calidad', rol: 'Encargado', direccion: 'Dir. General' },
  ]);

  const agregarUsuario = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.area) return;
    setUsuarios(prev => [...prev, { ...nuevoUsuario, id: prev.length + 1 }]);
    setNuevoUsuario({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '' });
    setMostrarModalUser(false);
  };

  const eliminarUsuario = (id) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const getRolBadge = (rol) => getRolColor(rol);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Usuarios</p>
          <p className="text-2xl font-bold text-[#002855]">{usuarios.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-[#002855]">{usuarios.filter(u => u.rol === 'Admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Encargados</p>
          <p className="text-2xl font-bold text-[#002855]">{usuarios.filter(u => u.rol === 'Encargado').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Áreas</p>
          <p className="text-2xl font-bold text-[#002855]">{areas.length}</p>
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
              <th className="p-3 text-sm font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 font-medium text-[#002855]">{u.nombre}</td>
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
                  <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
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
                  <option value="Usuario">Usuario</option>
                  <option value="Encargado">Encargado (Gerente)</option>
                  <option value="Admin">Admin (Control Total)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalUser(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button onClick={agregarUsuario} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg">Agregar</button>
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

export default App;