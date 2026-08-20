import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Headphones,
  LayoutDashboard,
  LogIn,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Navigation,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  Radio,
  Receipt,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  ThermometerSun,
  Timer,
  TrendingUp,
  UserCheck,
  UsersRound,
  Wind,
  Wrench,
  X,
} from 'lucide-react';

const COLORS = {
  ink: '#0d2d46',
  navy: '#123d5a',
  blue: '#1d6f96',
  teal: '#1b9aaa',
  gold: '#c9a227',
  surface: '#f7fafb',
};

const ROLE_PROFILES = [
  {
    id: 'coordinator',
    label: 'Coordinación',
    email: 'coord@temarqsa.com.mx',
    name: 'Mariana Ortega',
    initials: 'MO',
    description: 'Control operativo y despacho',
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    email: 'supervisor@temarqsa.com.mx',
    name: 'Jorge Valenzuela',
    initials: 'JV',
    description: 'Calidad, cierres y evidencias',
  },
  {
    id: 'technician',
    label: 'Técnico',
    email: 'tecnico@temarqsa.com.mx',
    name: 'Luis Mendoza',
    initials: 'LM',
    description: 'Órdenes asignadas en campo',
  },
  {
    id: 'client',
    label: 'Cliente',
    email: 'compras@grupoalameda.com',
    name: 'Ana Torres',
    initials: 'AT',
    description: 'Portal de seguimiento',
  },
];

const STATUS_META = {
  nueva: { label: 'Nueva', tone: 'blue', dot: 'bg-sky-500' },
  programada: { label: 'Programada', tone: 'violet', dot: 'bg-violet-500' },
  traslado: { label: 'En traslado', tone: 'amber', dot: 'bg-amber-500' },
  sitio: { label: 'En sitio', tone: 'teal', dot: 'bg-teal-500' },
  revision: { label: 'En revisión', tone: 'indigo', dot: 'bg-indigo-500' },
  cerrada: { label: 'Cerrada', tone: 'green', dot: 'bg-emerald-500' },
};

const ORDERS_SEED = [
  {
    id: 'OT-2026-0148',
    customer: 'Grupo Alameda',
    contact: 'Ana Torres',
    service: 'Mantenimiento preventivo',
    category: 'Aire acondicionado',
    asset: 'Mini Split York · MS-04-8812',
    location: 'Plaza Alameda · Ciudad Obregón',
    branch: 'Cedis Obregón',
    priority: 'Alta',
    status: 'sitio',
    progress: 68,
    due: 'Hoy · 14:30',
    updated: 'Hace 8 min',
    technician: 'Luis Mendoza',
    initials: 'LM',
    sla: '2 h 12 min',
    amount: '$8,450',
    description: 'Limpieza profunda, revisión de presión y validación de drenaje en unidad de comedor principal.',
    checklist: ['Inspección visual', 'Limpieza de filtros', 'Medición de presión', 'Prueba de temperatura'],
    events: [
      ['09:12', 'Luis Mendoza inició el traslado', 'traslado'],
      ['09:36', 'Técnico llegó al sitio', 'sitio'],
      ['09:48', 'Checklist de mantenimiento iniciado', 'sitio'],
    ],
  },
  {
    id: 'OT-2026-0147',
    customer: 'Constructora del Pacífico',
    contact: 'Raúl Beltrán',
    service: 'Instalación de equipo',
    category: 'Aire acondicionado',
    asset: 'Mini Split Carrier · Obra 22-B',
    location: 'Residencial Las Palmas · Mexicali',
    branch: 'Mexicali',
    priority: 'Media',
    status: 'programada',
    progress: 32,
    due: '20 ago · 09:00',
    updated: 'Hace 27 min',
    technician: 'Equipo Mexicali',
    initials: 'EM',
    sla: '18 h 40 min',
    amount: '$24,800',
    description: 'Instalación de dos equipos Inverter de 2 toneladas, con materiales y puesta en marcha.',
    checklist: ['Validar materiales', 'Confirmar acceso', 'Instalar equipos', 'Puesta en marcha'],
    events: [['08:55', 'Visita confirmada con cliente', 'programada']],
  },
  {
    id: 'OT-2026-0146',
    customer: 'Hotel Costa Azul',
    contact: 'Mónica Ruiz',
    service: 'Diagnóstico correctivo',
    category: 'Refrigeración',
    asset: 'Condensadora York · HVAC-07',
    location: 'Hotel Costa Azul · Playa del Carmen',
    branch: 'Playa del Carmen',
    priority: 'Crítica',
    status: 'traslado',
    progress: 51,
    due: 'Hoy · 16:00',
    updated: 'Hace 42 min',
    technician: 'Carlos Pérez',
    initials: 'CP',
    sla: '1 h 05 min',
    amount: '$6,200',
    description: 'Falla intermitente en condensadora del área de cocina. Requiere diagnóstico y propuesta de refacción.',
    checklist: ['Revisión de alimentación', 'Lectura de presiones', 'Diagnóstico de tarjeta', 'Cotización'],
    events: [['08:21', 'Orden asignada a Carlos Pérez', 'programada'], ['08:55', 'Técnico en camino al hotel', 'traslado']],
  },
  {
    id: 'OT-2026-0145',
    customer: 'Alimentos del Norte',
    contact: 'Pedro Salas',
    service: 'Mantenimiento preventivo',
    category: 'Aire acondicionado',
    asset: 'Carrier Inverter · Sucursal 18',
    location: 'Parque Industrial · Durango',
    branch: 'Durango',
    priority: 'Baja',
    status: 'revision',
    progress: 92,
    due: 'Completada · 19 ago',
    updated: 'Hace 1 h',
    technician: 'Sofía Ríos',
    initials: 'SR',
    sla: 'Cumplido',
    amount: '$5,900',
    description: 'Servicio preventivo mensual con reporte fotográfico y recomendaciones de eficiencia energética.',
    checklist: ['Inspección visual', 'Limpieza de filtros', 'Medición de amperaje', 'Reporte fotográfico'],
    events: [['Ayer', 'Sofía Ríos completó el checklist', 'revision'], ['Ayer', 'Pendiente de validación del supervisor', 'revision']],
  },
  {
    id: 'OT-2026-0144',
    customer: 'Grupo Alameda',
    contact: 'Ana Torres',
    service: 'Garantía y seguimiento',
    category: 'Aire acondicionado',
    asset: 'LG Inverter · MS-02-1140',
    location: 'Plaza Alameda · Ciudad Obregón',
    branch: 'Cedis Obregón',
    priority: 'Media',
    status: 'cerrada',
    progress: 100,
    due: '18 ago · 12:00',
    updated: 'Ayer',
    technician: 'Luis Mendoza',
    initials: 'LM',
    sla: 'Cumplido',
    amount: '$0',
    description: 'Revisión posterior a instalación y corrección de vibración en unidad interior.',
    checklist: ['Validar instalación', 'Ajuste de soportes', 'Prueba de operación', 'Firma de conformidad'],
    events: [['18 ago', 'Cliente aprobó el servicio', 'cerrada']],
  },
  {
    id: 'OT-2026-0143',
    customer: 'Logística Yaqui',
    contact: 'Gustavo Leal',
    service: 'Limpieza técnica',
    category: 'Aire acondicionado',
    asset: 'York 5 ton · Bodega 02',
    location: 'Cedis Logística · Ciudad Obregón',
    branch: 'Cedis Obregón',
    priority: 'Media',
    status: 'nueva',
    progress: 8,
    due: '21 ago · 11:00',
    updated: 'Ayer',
    technician: 'Por asignar',
    initials: 'PA',
    sla: '34 h 05 min',
    amount: '$3,800',
    description: 'Limpieza de serpentines y revisión de flujo de aire en bodega de almacenamiento.',
    checklist: ['Confirmar alcance', 'Asignar técnico', 'Ejecutar limpieza', 'Enviar reporte'],
    events: [['Ayer', 'Solicitud recibida desde el portal del cliente', 'nueva']],
  },
];

const NAV_INTERNAL = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'orders', label: 'Órdenes de trabajo', icon: ClipboardList, count: 24 },
  { id: 'dispatch', label: 'Tablero operativo', icon: Activity },
  { id: 'calendar', label: 'Agenda y despacho', icon: CalendarDays },
  { id: 'customers', label: 'Clientes y activos', icon: UsersRound },
  { id: 'reports', label: 'Reportes', icon: TrendingUp },
];

const NAV_CLIENT = [
  { id: 'dashboard', label: 'Mi resumen', icon: LayoutDashboard },
  { id: 'orders', label: 'Mis órdenes', icon: ClipboardList },
  { id: 'assets', label: 'Mis equipos', icon: ThermometerSun },
  { id: 'support', label: 'Centro de ayuda', icon: Headphones },
];

const toneClasses = {
  blue: 'bg-sky-50 text-sky-700 border-sky-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function BrandMark({ compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d2d46] shadow-lg shadow-slate-900/10">
        <span className="absolute h-5 w-5 rounded-full border-[3px] border-[#c9a227] border-l-transparent rotate-[-24deg]" />
        <span className="relative text-[13px] font-black tracking-tight text-white">T</span>
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-[21px] font-extrabold tracking-[-0.04em] text-[#0d2d46]">TEMARQ</p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-[#c9a227]">Service Hub</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, compact = false }) {
  const meta = STATUS_META[status] || STATUS_META.nueva;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneClasses[meta.tone]} ${compact ? 'px-2 py-0.5' : ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    Crítica: 'bg-rose-50 text-rose-700 border-rose-100',
    Alta: 'bg-orange-50 text-orange-700 border-orange-100',
    Media: 'bg-sky-50 text-sky-700 border-sky-100',
    Baja: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles[priority]}`}>{priority}</span>;
}

function Avatar({ initials, size = 'md', tone = 'navy' }) {
  const sizes = { sm: 'h-7 w-7 text-[9px]', md: 'h-9 w-9 text-[11px]', lg: 'h-11 w-11 text-xs' };
  const tones = {
    navy: 'bg-[#0d2d46] text-white',
    teal: 'bg-[#d9f2f1] text-[#147b7e]',
    gold: 'bg-[#f6edcc] text-[#8d7117]',
    violet: 'bg-[#eee9ff] text-[#6e55bd]',
    coral: 'bg-[#ffebe7] text-[#b35746]',
  };
  return <div className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${sizes[size]} ${tones[tone]}`}>{initials}</div>;
}

function Sidebar({ profile, activeTab, setActiveTab, open, setOpen, collapsed, setCollapsed, onLogout }) {
  const isClient = profile.id === 'client';
  const nav = isClient ? NAV_CLIENT : NAV_INTERNAL;
  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-[78px]' : 'w-[264px]'}`}>
        <div className={`flex h-[86px] items-center border-b border-slate-100 px-5 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <BrandMark compact={collapsed} />
          {!collapsed && <button onClick={() => setCollapsed(true)} className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-[#0d2d46] md:block"><PanelLeftClose size={17} /></button>}
        </div>
        {!collapsed && (
          <div className="mx-4 mt-5 rounded-2xl bg-[#f4f8fa] px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#1d6f96] shadow-sm"><ShieldCheck size={16} /></div>
              <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1d6f96]">Espacio seguro</p><p className="truncate text-[11px] text-slate-500">{isClient ? 'Portal privado de cliente' : 'Operación Temarqsa'}</p></div>
            </div>
          </div>
        )}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{isClient ? 'Mi servicio' : 'Centro de control'}</p>}
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${active ? 'bg-[#0d2d46] text-white shadow-lg shadow-[#0d2d46]/15' : 'text-slate-500 hover:bg-[#f4f8fa] hover:text-[#0d2d46]'} ${collapsed ? 'justify-center px-0' : ''}`} title={collapsed ? item.label : undefined}>
                <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                {!collapsed && <><span className="flex-1">{item.label}</span>{item.count && <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.count}</span>}</>}
              </button>
            );
          })}
          {!collapsed && !isClient && <div className="mt-7 border-t border-slate-100 pt-6"><p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Administración</p><button onClick={() => setActiveTab('settings')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold ${activeTab === 'settings' ? 'bg-[#0d2d46] text-white' : 'text-slate-500 hover:bg-[#f4f8fa] hover:text-[#0d2d46]'}`}><Settings2 size={17} /><span>Configuración</span></button></div>}
        </nav>
        {!collapsed && (
          <div className="border-t border-slate-100 p-4">
            <div className="rounded-2xl bg-[#0d2d46] p-4 text-white">
              <div className="mb-3 flex items-start justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10"><Sparkles size={15} className="text-[#e7c54d]" /></div><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-300">En línea</span></div>
              <p className="text-[12px] font-bold">Asistente TEMARQ IA</p><p className="mt-1 text-[10px] leading-relaxed text-slate-300">Resuelve dudas de clientes y consulta órdenes al instante.</p>
              <button onClick={() => setActiveTab(isClient ? 'support' : 'dashboard')} className="mt-3 text-[10px] font-bold text-[#e7c54d]">Abrir asistente <ArrowUpRight size={12} className="ml-1 inline" /></button>
            </div>
            <button onClick={onLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-rose-600"><LogIn size={16} className="rotate-180" />Cerrar sesión</button>
          </div>
        )}
      </aside>
      {collapsed && <button onClick={() => setCollapsed(false)} className="fixed bottom-5 left-5 z-50 hidden h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0d2d46] shadow-xl ring-1 ring-slate-200 md:flex"><PanelLeftOpen size={17} /></button>}
    </>
  );
}

function Topbar({ profile, activeTab, setActiveTab, setOpen, onOpenAssistant }) {
  const isClient = profile.id === 'client';
  const labels = [...NAV_INTERNAL, ...NAV_CLIENT].reduce((acc, item) => ({ ...acc, [item.id]: item.label }), {});
  return (
    <header className="flex h-[86px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 md:hidden"><Menu size={20} /></button><div><div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400"><span>{isClient ? 'Portal de clientes' : 'Operación'}</span><ChevronRight size={12} /><span className="text-[#1d6f96]">{labels[activeTab] || 'Resumen'}</span></div><h1 className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[#0d2d46] md:text-[21px]">{isClient ? 'Hola, Ana' : 'Buenos días, Mariana'}</h1></div></div>
      <div className="flex items-center gap-2 md:gap-4"><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-400 md:flex"><Search size={15} /><input className="w-40 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400" placeholder="Buscar folio, cliente..." /></div><button onClick={onOpenAssistant} className="relative flex h-10 items-center gap-2 rounded-xl bg-[#f4f8fa] px-3 text-[#1d6f96] transition hover:bg-[#eaf3f6]"><Bot size={17} /><span className="hidden text-xs font-bold sm:inline">Asistente IA</span><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" /></button><button className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-[#0d2d46]"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" /></button><div className="hidden h-8 w-px bg-slate-200 sm:block" /><Avatar initials={profile.initials} tone={isClient ? 'gold' : 'navy'} /></div>
    </header>
  );
}

function StatCard({ label, value, helper, icon: Icon, accent = 'blue', trend }) {
  const accents = { blue: 'bg-sky-50 text-sky-700', teal: 'bg-teal-50 text-teal-700', gold: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
  return <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,43,65,0.08)]"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent]}`}><Icon size={18} /></div>{trend && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"><TrendingUp size={11} />{trend}</span>}</div><p className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p><p className="mt-3 text-[10px] font-medium text-slate-400">{helper}</p></div>;
}

function HeroPulse({ profile, onViewOrders }) {
  const isClient = profile.id === 'client';
  return <div className="relative overflow-hidden rounded-3xl bg-[#0d2d46] p-6 text-white shadow-[0_18px_45px_rgba(13,45,70,0.15)] md:p-8"><div className="absolute -right-20 -top-32 h-72 w-72 rounded-full border-[38px] border-[#1d6f96]/35" /><div className="absolute -bottom-28 right-24 h-52 w-52 rounded-full border-[28px] border-[#c9a227]/15" /><div className="relative max-w-xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#dbeef1]"><Radio size={12} className="text-emerald-300" /> {isClient ? 'Servicio visible en tiempo real' : 'Centro de control activo'}</div><h2 className="max-w-lg text-2xl font-extrabold leading-tight tracking-[-0.04em] md:text-3xl">{isClient ? 'Todo el estado de tu servicio, en un solo lugar.' : 'La operación se mueve mejor cuando todos ven lo mismo.'}</h2><p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{isClient ? 'Consulta avances, próximas visitas y reportes de servicio sin llamadas ni correos perdidos.' : 'Coordina cuadrillas, prioriza incidencias y mantén informados a tus clientes desde una única vista.'}</p><button onClick={onViewOrders} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e4bd3f] px-4 py-2.5 text-xs font-extrabold text-[#173851] transition hover:bg-[#f0cf57]">{isClient ? 'Ver mis órdenes' : 'Abrir tablero operativo'}<ArrowUpRight size={15} /></button></div><div className="absolute bottom-7 right-8 hidden w-44 md:block"><div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-300">SLA promedio</span><Timer size={14} className="text-[#e4bd3f]" /></div><p className="mt-2 text-2xl font-extrabold">94.8%</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[94.8%] rounded-full bg-[#e4bd3f]" /></div><p className="mt-2 text-[9px] text-slate-400">+6.2% contra el mes anterior</p></div></div></div>;
}

function OrderCard({ order, onSelect, compact = false }) {
  return <button onClick={() => onSelect(order)} className={`group w-full rounded-2xl border border-slate-200/80 bg-white text-left shadow-[0_5px_20px_rgba(15,43,65,0.03)] transition hover:-translate-y-0.5 hover:border-[#b7d9df] hover:shadow-[0_12px_28px_rgba(15,43,65,0.09)] ${compact ? 'p-3.5' : 'p-4'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-[10px] font-bold text-[#1d6f96]">{order.id}</span><PriorityBadge priority={order.priority} /></div><p className="mt-2 truncate text-[13px] font-extrabold text-[#0d2d46]">{order.service}</p><p className="mt-1 truncate text-[11px] font-medium text-slate-500">{order.customer}</p></div><MoreHorizontal size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500" /></div><div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-slate-500"><MapPin size={12} className="text-[#1d6f96]" /><span className="truncate">{order.location}</span></div><div className="mt-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Avatar initials={order.initials} size="sm" tone={order.technician === 'Por asignar' ? 'gold' : 'teal'} /><span className="truncate text-[10px] font-bold text-slate-500">{order.technician}</span></div><span className="shrink-0 text-[10px] font-bold text-slate-400">{order.due}</span></div>{!compact && <div className="mt-4"><div className="mb-1.5 flex justify-between text-[9px] font-bold text-slate-400"><span>Avance</span><span>{order.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${order.status === 'cerrada' ? 'bg-emerald-500' : order.status === 'revision' ? 'bg-indigo-500' : 'bg-[#1d6f96]'}`} style={{ width: `${order.progress}%` }} /></div></div>}</button>;
}

function SectionHeader({ eyebrow, title, action, onAction }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">{eyebrow}</p><h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-[#0d2d46]">{title}</h3></div>{action && <button onClick={onAction} className="flex items-center gap-1 text-[11px] font-extrabold text-[#1d6f96] hover:text-[#0d2d46]">{action}<ChevronRight size={14} /></button>}</div>;
}

function OperationsBoard({ orders, onSelect }) {
  const columns = ['nueva', 'programada', 'traslado', 'sitio', 'revision', 'cerrada'];
  return <div className="overflow-x-auto pb-3"><div className="grid min-w-[1120px] grid-cols-6 gap-3">{columns.map((status) => { const meta = STATUS_META[status]; const items = orders.filter((order) => order.status === status); return <div key={status} className="min-h-[280px] rounded-2xl bg-[#f4f8fa] p-2.5"><div className="mb-3 flex items-center justify-between px-1.5"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${meta.dot}`} /><span className="text-[11px] font-extrabold text-[#0d2d46]">{meta.label}</span></div><span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-500">{items.length}</span></div><div className="space-y-2.5">{items.map((order) => <OrderCard key={order.id} order={order} onSelect={onSelect} compact />)}{items.length === 0 && <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 text-[10px] font-semibold text-slate-400">Sin órdenes</div>}</div></div>; })}</div></div>;
}

function ActivityFeed({ orders }) {
  const entries = [
    { icon: CircleCheck, tone: 'green', title: 'Orden completada', text: 'OT-2026-0144 aprobada por Grupo Alameda', time: 'Hace 1 h' },
    { icon: Navigation, tone: 'amber', title: 'Técnico en traslado', text: 'Carlos Pérez va rumbo a Hotel Costa Azul', time: 'Hace 42 min' },
    { icon: MessageSquareText, tone: 'blue', title: 'Nueva solicitud', text: 'Logística Yaqui creó OT-2026-0143', time: 'Ayer · 17:20' },
    { icon: ClipboardCheck, tone: 'violet', title: 'Revisión pendiente', text: 'OT-2026-0145 espera validación de supervisor', time: 'Ayer · 16:45' },
  ];
  const tone = { green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className="divide-y divide-slate-100">{entries.map((entry, index) => { const Icon = entry.icon; return <div key={index} className="flex gap-3 py-3 first:pt-0 last:pb-0"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone[entry.tone]}`}><Icon size={15} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-extrabold text-[#0d2d46]">{entry.title}</p><span className="shrink-0 text-[9px] font-semibold text-slate-400">{entry.time}</span></div><p className="mt-1 truncate text-[10px] font-medium text-slate-500">{entry.text}</p></div></div>; })}</div>;
}

function BranchLoad() {
  const branches = [['Cedis Obregón', 78, '12 órdenes'], ['Mexicali', 54, '7 órdenes'], ['Durango', 41, '4 órdenes'], ['Playa del Carmen', 63, '6 órdenes']];
  return <div className="space-y-4">{branches.map(([name, value, detail]) => <div key={name}><div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-bold text-[#0d2d46]">{name}</span><span className="text-[10px] font-semibold text-slate-400">{detail}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${value > 70 ? 'bg-[#1b9aaa]' : value > 50 ? 'bg-[#c9a227]' : 'bg-[#8db4c1]'}`} style={{ width: `${value}%` }} /></div></div>)}</div>;
}

function Dashboard({ profile, orders, onSelect, onViewOrders, setActiveTab }) {
  const isClient = profile.id === 'client';
  const visibleOrders = isClient ? orders.filter((order) => order.customer === 'Grupo Alameda') : orders;
  if (isClient) return <ClientDashboard profile={profile} orders={visibleOrders} onSelect={onSelect} onViewOrders={onViewOrders} setActiveTab={setActiveTab} />;
  return <div className="space-y-7"><HeroPulse profile={profile} onViewOrders={onViewOrders} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Órdenes activas" value="24" helper="6 requieren atención hoy" icon={ClipboardList} accent="blue" trend="12.4%" /><StatCard label="En campo ahora" value="08" helper="3 técnicos en traslado" icon={Navigation} accent="teal" trend="2.1%" /><StatCard label="SLA cumplido" value="94.8%" helper="Meta operativa: 90%" icon={ShieldCheck} accent="gold" trend="6.2%" /><StatCard label="Satisfacción" value="4.8/5" helper="Últimas 30 órdenes" icon={CircleCheck} accent="rose" trend="0.4" /></div><div><SectionHeader eyebrow="Operación en vivo" title="Tablero de órdenes activas" action="Ver todas las órdenes" onAction={onViewOrders} /><OperationsBoard orders={orders.filter((o) => o.status !== 'cerrada')} onSelect={onSelect} /></div><div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Rendimiento" title="Carga por sucursal" action="Abrir reporte" onAction={() => setActiveTab('reports')} /><BranchLoad /></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Actividad" title="Actualizaciones recientes" action="Ver bitácora" onAction={() => setActiveTab('orders')} /><ActivityFeed orders={orders} /></div></div></div>;
}

function ClientDashboard({ profile, orders, onSelect, onViewOrders, setActiveTab }) {
  const active = orders.find((order) => order.status !== 'cerrada');
  return <div className="space-y-7"><HeroPulse profile={profile} onViewOrders={onViewOrders} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Órdenes abiertas" value="02" helper="Una visita programada hoy" icon={ClipboardList} accent="blue" /><StatCard label="Equipos registrados" value="18" helper="En 3 ubicaciones" icon={ThermometerSun} accent="teal" /><StatCard label="SLA de atención" value="96%" helper="Dentro de lo acordado" icon={ShieldCheck} accent="gold" /></div><div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="En seguimiento" title="Tu servicio más reciente" action="Ver historial" onAction={onViewOrders} />{active && <OrderCard order={active} onSelect={onSelect} />}<div className="mt-4 flex items-center justify-between rounded-xl bg-[#f4f8fa] p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1d6f96]"><MessageCircle size={15} /></div><p className="text-[11px] font-semibold text-slate-600">¿Tienes una pregunta sobre tu orden?</p></div><button onClick={() => setActiveTab('support')} className="text-[11px] font-extrabold text-[#1d6f96]">Preguntar a TEMARQ IA</button></div></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Próxima visita" title="Agenda confirmada" /><div className="rounded-2xl bg-[#0d2d46] p-4 text-white"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">Jueves 20 de agosto</p><p className="mt-2 text-xl font-extrabold">09:00 — 11:00</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><CalendarDays size={18} className="text-[#e4bd3f]" /></div></div><div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4"><Avatar initials="LM" size="sm" tone="teal" /><div><p className="text-[11px] font-bold">Luis Mendoza</p><p className="text-[10px] text-slate-300">Mantenimiento preventivo · OT-2026-0148</p></div></div><div className="mt-4 flex items-center gap-2 text-[10px] text-slate-300"><MapPin size={12} className="text-[#e4bd3f]" /> Plaza Alameda, Ciudad Obregón</div></div></div></div></div>;
}

function OrdersView({ profile, orders, onSelect, setOrders }) {
  const isClient = profile.id === 'client';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => orders.filter((order) => (!isClient || order.customer === 'Grupo Alameda')).filter((order) => `${order.id} ${order.customer} ${order.service} ${order.location}`.toLowerCase().includes(query.toLowerCase())).filter((order) => status === 'all' || order.status === status), [orders, query, status, isClient]);
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">{isClient ? 'Historial y seguimiento' : 'Gestión de servicio'}</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">{isClient ? 'Mis órdenes de trabajo' : 'Órdenes de trabajo'}</h2><p className="mt-2 text-sm text-slate-500">{isClient ? 'Consulta avances, citas y reportes de tus servicios.' : 'Administra solicitudes, asignaciones y cierres desde un solo lugar.'}</p></div>{!isClient && <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d2d46] px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-[#0d2d46]/15 transition hover:bg-[#174b6b]"><Plus size={15} />Nueva orden</button>}</div><div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,43,65,0.03)] md:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl bg-[#f4f8fa] px-3 py-2.5"><Search size={15} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por folio, cliente, servicio o ubicación" className="w-full bg-transparent text-xs font-medium text-[#0d2d46] outline-none placeholder:text-slate-400" /></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"><Filter size={14} className="text-slate-400" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none"><option value="all">Todos los estados</option>{Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select></div><button className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-500 md:flex"><Download size={14} />Exportar</button></div></div><div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="border-b border-slate-100 bg-[#fbfcfd]"><tr>{['Orden', 'Cliente / sitio', 'Servicio', 'Responsable', 'Estado', 'Compromiso', ''].map((head) => <th key={head} className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((order) => <tr key={order.id} onClick={() => onSelect(order)} className="cursor-pointer transition hover:bg-[#fbfdfe]"><td className="px-5 py-4"><p className="font-mono text-[11px] font-extrabold text-[#1d6f96]">{order.id}</p><p className="mt-1 text-[10px] font-medium text-slate-400">Actualizada {order.updated.toLowerCase()}</p></td><td className="px-5 py-4"><p className="text-xs font-extrabold text-[#0d2d46]">{order.customer}</p><p className="mt-1 max-w-[190px] truncate text-[10px] font-medium text-slate-400">{order.location}</p></td><td className="px-5 py-4"><p className="text-xs font-bold text-slate-600">{order.service}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{order.category}</p></td><td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar initials={order.initials} size="sm" tone="teal" /><span className="text-[10px] font-bold text-slate-500">{order.technician}</span></div></td><td className="px-5 py-4"><StatusBadge status={order.status} /></td><td className="px-5 py-4"><p className="text-[11px] font-bold text-slate-600">{order.due}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">SLA: {order.sla}</p></td><td className="px-5 py-4 text-right"><ChevronRight size={16} className="ml-auto text-slate-300" /></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No encontramos órdenes con esos filtros.</div>}<div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-[10px] font-semibold text-slate-400">Mostrando {filtered.length} de {orders.length} órdenes</p><div className="flex gap-1"><button className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0d2d46] text-[10px] font-bold text-white">1</button><button className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-50">2</button></div></div></div></div>;
}

function DispatchView({ orders, onSelect }) {
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Visibilidad en tiempo real</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Tablero operativo</h2><p className="mt-2 text-sm text-slate-500">Coordina prioridades, técnicos y capacidad de cada sucursal.</p></div><div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Actualizado hace 30 s</div></div><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Técnicos activos" value="18/22" helper="4 disponibles para asignar" icon={UsersRound} accent="teal" /><StatCard label="Visitas hoy" value="31" helper="8 en proceso ahora" icon={CalendarDays} accent="blue" /><StatCard label="Riesgo de SLA" value="03" helper="Requieren decisión" icon={CircleAlert} accent="rose" /></div><div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-extrabold text-[#0d2d46]">Flujo de órdenes activas</p><p className="mt-1 text-[10px] text-slate-400">Arrastra en producción · filtros por sucursal y prioridad</p></div><button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500"><Filter size={13} />Filtros</button></div><OperationsBoard orders={orders} onSelect={onSelect} /></div></div>;
}

function CalendarView({ orders }) {
  const visits = [{ day: '20', month: 'AGO', time: '09:00', name: 'Grupo Alameda', service: 'Mantenimiento preventivo', tech: 'Luis Mendoza', tone: 'teal' }, { day: '20', month: 'AGO', time: '11:30', name: 'Hotel Costa Azul', service: 'Diagnóstico correctivo', tech: 'Carlos Pérez', tone: 'amber' }, { day: '21', month: 'AGO', time: '11:00', name: 'Logística Yaqui', service: 'Limpieza técnica', tech: 'Por asignar', tone: 'violet' }, { day: '22', month: 'AGO', time: '08:30', name: 'Constructora del Pacífico', service: 'Instalación de equipo', tech: 'Equipo Mexicali', tone: 'blue' }];
  return <div className="space-y-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Planeación de recursos</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Agenda y despacho</h2><p className="mt-2 text-sm text-slate-500">Visualiza visitas, disponibilidad y ventanas de atención.</p></div><div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold text-[#0d2d46]">Semana del 18 al 24 de agosto</p><p className="mt-1 text-[10px] font-medium text-slate-400">Cedis Obregón · Todas las regiones</p></div><div className="flex gap-2"><button className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500">Hoy</button><button className="rounded-lg bg-[#0d2d46] px-3 py-2 text-[10px] font-bold text-white">Semana</button></div></div><div className="mt-6 grid grid-cols-7 gap-2">{['Lun 18', 'Mar 19', 'Mié 20', 'Jue 21', 'Vie 22', 'Sáb 23', 'Dom 24'].map((day, idx) => <div key={day} className={`rounded-xl border p-2 ${idx === 2 ? 'border-[#1d6f96] bg-[#f1f8fa]' : 'border-slate-100'}`}><p className={`text-center text-[9px] font-extrabold uppercase ${idx === 2 ? 'text-[#1d6f96]' : 'text-slate-400'}`}>{day}</p><div className="mt-4 h-56 space-y-2">{idx === 2 && <div className="rounded-lg border-l-2 border-teal-500 bg-teal-50 p-2"><p className="text-[9px] font-extrabold text-teal-700">09:00</p><p className="mt-1 truncate text-[9px] font-bold text-teal-800">Grupo Alameda</p></div>}{idx === 2 && <div className="rounded-lg border-l-2 border-amber-500 bg-amber-50 p-2"><p className="text-[9px] font-extrabold text-amber-700">11:30</p><p className="mt-1 truncate text-[9px] font-bold text-amber-800">Hotel Costa Azul</p></div>}{idx === 3 && <div className="rounded-lg border-l-2 border-violet-500 bg-violet-50 p-2"><p className="text-[9px] font-extrabold text-violet-700">11:00</p><p className="mt-1 truncate text-[9px] font-bold text-violet-800">Logística Yaqui</p></div>}{idx === 4 && <div className="rounded-lg border-l-2 border-sky-500 bg-sky-50 p-2"><p className="text-[9px] font-extrabold text-sky-700">08:30</p><p className="mt-1 truncate text-[9px] font-bold text-sky-800">Constructora</p></div>}</div></div>)}</div></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Próximas visitas" title="Ruta de hoy" /><div className="space-y-3">{visits.map((visit) => <div key={`${visit.day}-${visit.time}`} className="flex gap-3 rounded-xl border border-slate-100 p-3"><div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f4f8fa]"><span className="text-[9px] font-extrabold text-[#1d6f96]">{visit.month}</span><span className="text-base font-extrabold leading-none text-[#0d2d46]">{visit.day}</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-extrabold text-[#0d2d46]">{visit.time} · {visit.name}</p><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{visit.service}</p><p className="mt-2 text-[9px] font-bold text-slate-400">{visit.tech}</p></div></div>)}</div></div></div></div>;
}

function CustomersView() {
  const customers = [{ name: 'Grupo Alameda', sites: '3 sitios', assets: '18 equipos', open: '2 abiertas', initials: 'GA', tone: 'teal' }, { name: 'Hotel Costa Azul', sites: '1 sitio', assets: '12 equipos', open: '1 crítica', initials: 'HC', tone: 'coral' }, { name: 'Constructora del Pacífico', sites: '4 sitios', assets: '27 equipos', open: '1 programada', initials: 'CP', tone: 'violet' }, { name: 'Alimentos del Norte', sites: '2 sitios', assets: '9 equipos', open: '0 abiertas', initials: 'AN', tone: 'gold' }];
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Relaciones de servicio</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Clientes y activos</h2><p className="mt-2 text-sm text-slate-500">Una ficha viva de cada cuenta, sitio y equipo atendido.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d2d46] px-4 py-3 text-xs font-extrabold text-white"><Plus size={15} />Nuevo cliente</button></div><div className="grid gap-4 md:grid-cols-2">{customers.map((customer) => <div key={customer.name} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,43,65,0.08)]"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><Avatar initials={customer.initials} size="lg" tone={customer.tone} /><div><p className="text-sm font-extrabold text-[#0d2d46]">{customer.name}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">Cuenta estratégica · SLA premium</p></div></div><button className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-50 hover:text-slate-500"><MoreHorizontal size={17} /></button></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><div><p className="text-sm font-extrabold text-[#0d2d46]">{customer.sites}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Sitios</p></div><div><p className="text-sm font-extrabold text-[#0d2d46]">{customer.assets}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Activos</p></div><div><p className="text-sm font-extrabold text-[#1d6f96]">{customer.open}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Servicio</p></div></div></div>)}</div></div>;
}

function ReportsView() {
  const bars = [['Mantenimiento', 82, '38 órdenes'], ['Instalación', 61, '17 órdenes'], ['Correctivo', 47, '12 órdenes'], ['Garantía', 29, '8 órdenes']];
  return <div className="space-y-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Inteligencia operativa</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Reportes y desempeño</h2><p className="mt-2 text-sm text-slate-500">Decisiones basadas en cumplimiento, capacidad y rentabilidad.</p></div><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Tiempo promedio de ciclo" value="2.6 días" helper="-0.4 días vs. mes anterior" icon={Timer} accent="blue" trend="13.2%" /><StatCard label="Primera visita efectiva" value="87.4%" helper="Meta operativa: 85%" icon={CircleCheck} accent="teal" trend="4.8%" /><StatCard label="Reincidencia" value="6.1%" helper="-1.7 pp vs. trimestre anterior" icon={Activity} accent="gold" trend="Mejora" /></div><div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Mix de servicio" title="Órdenes por categoría" action="Descargar reporte" /><div className="space-y-5">{bars.map(([label, value, detail]) => <div key={label}><div className="mb-2 flex items-center justify-between"><span className="text-xs font-extrabold text-[#0d2d46]">{label}</span><span className="text-[10px] font-semibold text-slate-400">{detail}</span></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-full rounded-full ${label === 'Mantenimiento' ? 'bg-[#1d6f96]' : label === 'Instalación' ? 'bg-[#1b9aaa]' : label === 'Correctivo' ? 'bg-[#c9a227]' : 'bg-[#8aa5b4]'}`} style={{ width: `${value}%` }} /></div><p className="mt-1 text-right text-[10px] font-extrabold text-slate-400">{value}%</p></div>)}</div></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><SectionHeader eyebrow="Resumen ejecutivo" title="Lo que necesita atención" /><div className="space-y-3"><div className="rounded-xl border border-rose-100 bg-rose-50 p-3"><div className="flex gap-2"><CircleAlert size={15} className="mt-0.5 shrink-0 text-rose-600" /><div><p className="text-[11px] font-extrabold text-rose-800">3 órdenes en riesgo de SLA</p><p className="mt-1 text-[10px] leading-relaxed text-rose-700">Hotel Costa Azul y dos cuentas de la región norte requieren ajuste de agenda.</p></div></div></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><div className="flex gap-2"><Package size={15} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-[11px] font-extrabold text-amber-800">5 refacciones por confirmar</p><p className="mt-1 text-[10px] leading-relaxed text-amber-700">El inventario preventivo puede evitar una segunda visita.</p></div></div></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex gap-2"><TrendingUp size={15} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-[11px] font-extrabold text-emerald-800">Satisfacción arriba de meta</p><p className="mt-1 text-[10px] leading-relaxed text-emerald-700">El promedio de las últimas 30 órdenes es 4.8 sobre 5.</p></div></div></div></div></div></div></div>;
}

function AssetsView() {
  const assets = [{ asset: 'Mini Split York · MS-04-8812', site: 'Plaza Alameda · Comedor', status: 'Servicio en curso', last: '19 ago 2026', next: '20 nov 2026', tone: 'teal' }, { asset: 'LG Inverter · MS-02-1140', site: 'Plaza Alameda · Local 02', status: 'Garantía activa', last: '18 ago 2026', next: '18 nov 2026', tone: 'gold' }, { asset: 'Carrier 3 ton · MS-03-2201', site: 'Plaza Alameda · Oficinas', status: 'Operativo', last: '07 jul 2026', next: '07 oct 2026', tone: 'blue' }, { asset: 'York 5 ton · HVAC-01', site: 'Cedis Alameda', status: 'Operativo', last: '11 jun 2026', next: '11 sep 2026', tone: 'violet' }];
  return <div className="space-y-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Inventario técnico</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Mis equipos</h2><p className="mt-2 text-sm text-slate-500">Conoce el historial y el próximo mantenimiento de cada activo.</p></div><div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,43,65,0.03)]"><div className="divide-y divide-slate-100">{assets.map((asset) => <div key={asset.asset} className="flex flex-col gap-4 p-5 md:flex-row md:items-center"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${asset.tone === 'teal' ? 'bg-teal-50 text-teal-700' : asset.tone === 'gold' ? 'bg-amber-50 text-amber-700' : asset.tone === 'blue' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}><Wind size={20} /></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#0d2d46]">{asset.asset}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{asset.site}</p></div><div className="grid grid-cols-2 gap-6 text-left md:flex md:items-center"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Estado</p><p className="mt-1 text-[11px] font-extrabold text-[#1d6f96]">{asset.status}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Último servicio</p><p className="mt-1 text-[11px] font-bold text-slate-600">{asset.last}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Siguiente visita</p><p className="mt-1 text-[11px] font-bold text-slate-600">{asset.next}</p></div></div><button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-[#1d6f96]"><ChevronRight size={17} /></button></div>)}</div></div></div>;
}

function DetailModal({ order, onClose, onAdvance, onOpenAssistant }) {
  if (!order) return null;
  const nextStatus = { nueva: 'programada', programada: 'traslado', traslado: 'sitio', sitio: 'revision', revision: 'cerrada', cerrada: 'cerrada' }[order.status];
  const nextLabel = order.status === 'cerrada' ? 'Orden cerrada' : `Avanzar a ${STATUS_META[nextStatus].label}`;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071d2d]/45 p-0 backdrop-blur-sm md:items-center md:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur md:px-7"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f8fa] text-[#1d6f96]"><ClipboardList size={18} /></div><div><div className="flex items-center gap-2"><span className="font-mono text-[11px] font-extrabold text-[#1d6f96]">{order.id}</span><StatusBadge status={order.status} compact /></div><p className="mt-1 text-[11px] font-semibold text-slate-400">Última actualización: {order.updated}</p></div></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-[#0d2d46]"><X size={19} /></button></div><div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]"><div className="p-5 md:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#1d6f96]">{order.category}</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">{order.service}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">{order.description}</p></div><PriorityBadge priority={order.priority} /></div><div className="mt-7 rounded-2xl bg-[#f4f8fa] p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Avance del servicio</p><p className="mt-1 text-xl font-extrabold text-[#0d2d46]">{order.progress}%</p></div><p className="text-right text-[10px] font-bold text-slate-500">SLA restante<br /><span className="text-[#1d6f96]">{order.sla}</span></p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#1d6f96]" style={{ width: `${order.progress}%` }} /></div><div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400"><span>Solicitud</span><span>En campo</span><span>Revisión</span><span>Cierre</span></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2 text-slate-400"><Building2 size={15} /><span className="text-[10px] font-extrabold uppercase tracking-wide">Cliente</span></div><p className="mt-2 text-xs font-extrabold text-[#0d2d46]">{order.customer}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{order.contact}</p></div><div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2 text-slate-400"><MapPin size={15} /><span className="text-[10px] font-extrabold uppercase tracking-wide">Sitio de servicio</span></div><p className="mt-2 text-xs font-extrabold text-[#0d2d46]">{order.location}</p><p className="mt-1 text-[10px] font-medium text-slate-400">Activo: {order.asset}</p></div></div><div className="mt-7"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-extrabold text-[#0d2d46]">Checklist de ejecución</p><span className="text-[10px] font-bold text-emerald-600">{Math.round(order.progress / 25)}/4 completados</span></div><div className="space-y-2">{order.checklist.map((item, idx) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3"><div className={`flex h-6 w-6 items-center justify-center rounded-lg ${idx < Math.round(order.progress / 25) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>{idx < Math.round(order.progress / 25) ? <Check size={14} /> : <CircleDot size={14} />}</div><span className={`text-[11px] font-bold ${idx < Math.round(order.progress / 25) ? 'text-slate-600' : 'text-slate-400'}`}>{item}</span></div>)}</div></div><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => onAdvance(order.id)} disabled={order.status === 'cerrada'} className="inline-flex items-center gap-2 rounded-xl bg-[#0d2d46] px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={15} />{nextLabel}</button><button onClick={onOpenAssistant} className="inline-flex items-center gap-2 rounded-xl border border-[#b7d9df] bg-[#f4f8fa] px-4 py-3 text-[11px] font-extrabold text-[#1d6f96]"><Bot size={15} />Consultar a la IA</button><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[11px] font-extrabold text-slate-500"><FileText size={15} />Reporte de servicio</button></div></div><div className="border-t border-slate-100 bg-[#fbfcfd] p-5 md:p-7 lg:border-l lg:border-t-0"><div className="flex items-center justify-between"><p className="text-sm font-extrabold text-[#0d2d46]">Línea de tiempo</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">Auditable</span></div><div className="mt-5 space-y-5">{order.events.map(([time, text, status], idx) => <div key={`${time}-${text}`} className="relative flex gap-3">{idx < order.events.length - 1 && <div className="absolute left-[7px] top-5 h-[calc(100%+12px)] w-px bg-slate-200" />}<span className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-4 border-white shadow-sm ${STATUS_META[status]?.dot || 'bg-slate-400'}`} /><div><p className="text-[10px] font-extrabold text-[#1d6f96]">{time}</p><p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-600">{text}</p></div></div>)}</div><div className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Responsable asignado</p><div className="mt-3 flex items-center gap-3"><Avatar initials={order.initials} tone="teal" /><div><p className="text-xs font-extrabold text-[#0d2d46]">{order.technician}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{order.branch} · Técnico certificado</p></div></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[10px] font-extrabold text-slate-600"><MessageCircle size={14} />Abrir conversación</button></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><Camera size={15} className="text-[#1d6f96]" /><p className="mt-2 text-lg font-extrabold text-[#0d2d46]">06</p><p className="text-[9px] font-bold text-slate-400">Evidencias</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><Package size={15} className="text-[#c9a227]" /><p className="mt-2 text-lg font-extrabold text-[#0d2d46]">04</p><p className="text-[9px] font-bold text-slate-400">Materiales</p></div></div></div></div></div></div>;
}

function AiAssistant({ profile, selectedOrder, open, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'ai', text: profile.id === 'client' ? 'Hola, Ana. Soy el asistente de TEMARQ. Puedo consultar el avance de tus órdenes, próxima visita y reportes autorizados.' : 'Hola, Mariana. Puedo ayudarte a consultar órdenes, resumir la operación y preparar una respuesta para un cliente.' }]);
  const isClient = profile.id === 'client';
  const quicks = isClient ? ['¿Cuál es el estado de mi orden?', '¿Cuándo viene el técnico?', 'Quiero solicitar una visita'] : ['Órdenes en riesgo de SLA', 'Resume la operación de hoy', '¿Qué necesita atención?'];
  const send = (text = input) => {
    if (!text.trim()) return;
    const clean = text.trim();
    let response = isClient ? 'Puedo ayudarte con tus órdenes de Grupo Alameda. Selecciona una orden para ver su línea de tiempo o dime qué necesitas consultar.' : 'Detecté 3 órdenes que requieren atención: una crítica en Playa del Carmen y dos visitas sin técnico confirmado. ¿Quieres que abra el tablero operativo?';
    if (/estado|orden|avance/i.test(clean)) response = selectedOrder ? `La orden ${selectedOrder.id} está en estado “${STATUS_META[selectedOrder.status].label}” con un avance del ${selectedOrder.progress}%. Última actualización: ${selectedOrder.updated}.` : 'Tu orden activa OT-2026-0148 está “En sitio” con 68% de avance. El técnico reportó llegada a Plaza Alameda y se encuentra ejecutando el checklist.';
    if (/técnico|visita|cuándo|cuando/i.test(clean)) response = 'La próxima visita está confirmada para el jueves 20 de agosto, de 09:00 a 11:00, en Plaza Alameda, Ciudad Obregón. El técnico asignado es Luis Mendoza.';
    if (/riesgo|atención|atencion/i.test(clean)) response = 'Hay 3 órdenes en riesgo de SLA. La prioridad más alta es OT-2026-0146 de Hotel Costa Azul, con 1 h 05 min restantes y técnico en traslado.';
    if (/solicitar|nueva|visita/i.test(clean)) response = 'Puedo dejar lista una nueva solicitud de servicio. Para enviarla necesito sitio, equipo, tipo de problema y ventana de atención. Un coordinador confirmará la cita.';
    setMessages((prev) => [...prev, { from: 'user', text: clean }, { from: 'ai', text: response }]);
    setInput('');
  };
  if (!open) return null;
  return <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(13,45,70,0.28)] ring-1 ring-slate-200"><div className="flex items-center justify-between bg-[#0d2d46] px-5 py-4 text-white"><div className="flex items-center gap-3"><div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Bot size={19} className="text-[#e4bd3f]" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d2d46] bg-emerald-400" /></div><div><p className="text-xs font-extrabold">TEMARQ IA</p><p className="mt-0.5 text-[9px] font-semibold text-slate-300">Asistente de servicio · En línea</p></div></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16} /></button></div><div className="max-h-[340px] space-y-3 overflow-y-auto bg-[#fbfcfd] p-4">{messages.map((message, idx) => <div key={idx} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-[11px] font-medium leading-relaxed ${message.from === 'user' ? 'rounded-br-md bg-[#0d2d46] text-white' : 'rounded-bl-md bg-white text-slate-600 shadow-sm ring-1 ring-slate-100'}`}>{message.from === 'ai' && <div className="mb-1.5 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-[#1d6f96]"><Sparkles size={10} />Asistente</div>}{message.text}</div></div>)}{messages.length === 1 && <div className="pt-1"><p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Preguntas rápidas</p><div className="flex flex-wrap gap-2">{quicks.map((quick) => <button key={quick} onClick={() => send(quick)} className="rounded-full border border-[#b7d9df] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#1d6f96] hover:bg-[#f1f8fa]">{quick}</button>)}</div></div>}</div><div className="border-t border-slate-100 bg-white p-3"><div className="flex items-center gap-2 rounded-xl bg-[#f4f8fa] px-3 py-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Escribe tu pregunta..." className="min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-400" /><button onClick={() => send()} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0d2d46] text-white transition hover:bg-[#174b6b]"><Send size={13} /></button></div><p className="mt-2 text-center text-[9px] font-medium text-slate-400">La IA consulta únicamente información autorizada.</p></div></div>;
}

function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState('coordinator');
  const profile = ROLE_PROFILES.find((item) => item.id === selected);

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-[#0d2d46]">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden overflow-hidden bg-[#0d2d46] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-36 -top-36 h-[520px] w-[520px] rounded-full border-[70px] border-[#1d6f96]/30" />
          <div className="absolute -bottom-44 -left-24 h-[400px] w-[400px] rounded-full border-[48px] border-[#c9a227]/15" />
          <div className="relative">
            <BrandMark />
            <div className="mt-28 max-w-lg">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#e4bd3f]">Operación que se siente humana</p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-[-0.055em]">Más visibilidad.<br /><span className="text-[#8dd0d2]">Mejor servicio.</span></h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">TEMARQ Service Hub conecta a tu equipo, tus técnicos y tus clientes en cada orden de trabajo.</p>
            </div>
          </div>
          <div className="relative flex items-end justify-between border-t border-white/10 pt-5">
            <p className="text-[11px] font-medium text-slate-400">“Treat people as people”</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Temarqsa · 1992—2026</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-[460px]">
            <div className="mb-10 lg:hidden"><BrandMark /></div>
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d2d46] text-[#e4bd3f] shadow-lg"><LogIn size={21} /></div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1d6f96]">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#0d2d46]">Bienvenido a tu centro de servicio.</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">Inicia sesión para gestionar órdenes o consultar el avance de tus servicios.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,43,65,0.06)] sm:p-6">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Correo de acceso</label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4f8fa] text-[#1d6f96]"><UsersRound size={14} /></div><input value={profile.email} readOnly className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#0d2d46] outline-none" /></div>
              <label className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Contraseña</label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4f8fa] text-[#1d6f96]"><ShieldCheck size={14} /></div><input value="••••••••••••" readOnly className="min-w-0 flex-1 bg-transparent text-xs font-bold tracking-[0.18em] text-[#0d2d46] outline-none" /></div>
              <div className="mt-6">
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Explorar como</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_PROFILES.map((item) => (
                    <button key={item.id} onClick={() => setSelected(item.id)} className={`rounded-xl border p-3 text-left transition ${selected === item.id ? 'border-[#1d6f96] bg-[#f1f8fa] ring-2 ring-[#1d6f96]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-2"><Avatar initials={item.initials} size="sm" tone={item.id === 'client' ? 'gold' : 'navy'} /><div className="min-w-0"><p className="truncate text-[10px] font-extrabold text-[#0d2d46]">{item.label}</p><p className="truncate text-[9px] font-medium text-slate-400">{item.description}</p></div></div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onLogin(profile)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2d46] py-3.5 text-xs font-extrabold text-white shadow-lg shadow-[#0d2d46]/15 transition hover:bg-[#174b6b]">Entrar a TEMARQ Service Hub<ArrowUpRight size={16} /></button>
              <p className="mt-4 text-center text-[9px] font-medium text-slate-400">Modo demostración · La versión productiva conectará tu proveedor de identidad.</p>
            </div>
            <p className="mt-6 text-center text-[10px] font-medium text-slate-400">¿Necesitas ayuda? <span className="font-bold text-[#1d6f96]">support@temarqsa.com.mx</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState(ORDERS_SEED);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = (nextProfile) => { setProfile(nextProfile); setActiveTab('dashboard'); };
  const handleLogout = () => { setProfile(null); setSelectedOrder(null); setAssistantOpen(false); };
  const handleAdvance = (orderId) => {
    const statusOrder = ['nueva', 'programada', 'traslado', 'sitio', 'revision', 'cerrada'];
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) return order;
      const next = statusOrder[Math.min(statusOrder.indexOf(order.status) + 1, statusOrder.length - 1)];
      const progress = next === 'cerrada' ? 100 : next === 'revision' ? 92 : next === 'sitio' ? 68 : next === 'traslado' ? 51 : next === 'programada' ? 32 : 8;
      return { ...order, status: next, progress, updated: 'Ahora mismo', events: [...order.events, ['Ahora', `Estado actualizado a ${STATUS_META[next].label}`, next]] };
    }));
    setSelectedOrder((current) => current ? { ...current, status: statusOrder[Math.min(statusOrder.indexOf(current.status) + 1, statusOrder.length - 1)], updated: 'Ahora mismo' } : current);
  };

  if (!profile) return <LoginScreen onLogin={handleLogin} />;
  const visibleOrders = profile.id === 'client' ? orders.filter((order) => order.customer === 'Grupo Alameda') : orders;
  const view = activeTab === 'dashboard' ? <Dashboard profile={profile} orders={visibleOrders} onSelect={setSelectedOrder} onViewOrders={() => setActiveTab('orders')} setActiveTab={setActiveTab} /> : activeTab === 'orders' ? <OrdersView profile={profile} orders={visibleOrders} onSelect={setSelectedOrder} setOrders={setOrders} /> : activeTab === 'dispatch' ? <DispatchView orders={orders} onSelect={setSelectedOrder} /> : activeTab === 'calendar' ? <CalendarView orders={orders} /> : activeTab === 'customers' ? <CustomersView /> : activeTab === 'reports' ? <ReportsView /> : activeTab === 'assets' ? <AssetsView /> : activeTab === 'support' ? <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-dashed border-[#b7d9df] bg-white"><div className="max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1f8fa] text-[#1d6f96]"><Bot size={30} /></div><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-[#0d2d46]">Centro de ayuda TEMARQ</h2><p className="mt-3 text-sm leading-relaxed text-slate-500">Pregunta por el estado de tus órdenes, próximas visitas o solicita una nueva atención. El asistente está listo para ayudarte.</p><button onClick={() => setAssistantOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0d2d46] px-5 py-3 text-xs font-extrabold text-white"><MessageCircle size={15} />Abrir asistente IA</button></div></div> : <ReportsView />;
  return <div className="flex min-h-screen bg-[#f7fafb] text-slate-800"><Sidebar profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} open={sidebarOpen} setOpen={setSidebarOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={handleLogout} />{sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-[#071d2d]/30 md:hidden" />}<div className="min-w-0 flex-1"><Topbar profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} setOpen={setSidebarOpen} onOpenAssistant={() => setAssistantOpen(true)} /><main className="mx-auto max-w-[1600px] p-5 md:p-8">{view}</main></div><AiAssistant profile={profile} selectedOrder={selectedOrder} open={assistantOpen} onClose={() => setAssistantOpen(false)} />{selectedOrder && <DetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onAdvance={handleAdvance} onOpenAssistant={() => { setSelectedOrder(null); setAssistantOpen(true); }} />}</div>;
}

export default App;
