import React from 'react';
import { FileText, ClipboardCheck, AlertTriangle, CheckCircle2, TrendingUp, Activity, Users, FileBarChart } from 'lucide-react';
import { getEstadoColor, getEstadoLabel } from '../../constants';

export default function DashboardView({ accionesCorrectivas, planesMejora, documentos, auditorias, setActiveTab }) {
  const safeAC = accionesCorrectivas || [];
  const safePM = planesMejora || [];
  const safeDocs = documentos || [];
  const safeAuditorias = auditorias || [];

  // Cálculos de KPIs
  const pendientesAuditorias = safeAuditorias.filter(a => a.estado === 'PROGRAMADA').length;
  const auditoriasCompletadas = safeAuditorias.filter(a => a.estado === 'COMPLETADA').length;
  
  const acAbiertas = safeAC.filter(ac => ac.estado !== 'CERRADO' && ac.estado !== 'RECHAZADO').length;
  const pmAbiertos = safePM.filter(pm => pm.estado !== 'CERRADO' && pm.estado !== 'RECHAZADO').length;
  
  // Elementos Recientes (Top 5 combinados)
  const actividadesRecientes = [
    ...safeAC.map(ac => ({ ...ac, tipoDoc: 'AC', fechaOrden: new Date(ac.fecha_apertura || ac.fecha_creacion_borrador || 0) })),
    ...safePM.map(pm => ({ ...pm, tipoDoc: 'PM', fechaOrden: new Date(pm.created_at || 0) }))
  ].sort((a, b) => b.fechaOrden - a.fechaOrden).slice(0, 5);

  // Estadísticas por estado para Acción Correctiva
  const acEstadosStats = safeAC.reduce((acc, ac) => {
    acc[ac.estado] = (acc[ac.estado] || 0) + 1;
    return acc;
  }, {});

  // Top áreas con más hallazgos (AC)
  const areasStats = safeAC.reduce((acc, ac) => {
    if (ac.area) {
      acc[ac.area] = (acc[ac.area] || 0) + 1;
    }
    return acc;
  }, {});
  const topAreas = Object.entries(areasStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const KPICard = ({ title, value, icon: Icon, colorClass, bgClass, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${bgClass} opacity-20 group-hover:scale-150 transition-transform`}></div>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-3xl font-black ${colorClass.replace('text-', 'text-').split(' ')[0]}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002855] to-[#00152e] rounded-2xl p-6 text-white shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Activity className="text-cyan-400" /> Panel de Control SGC
          </h1>
          <p className="text-slate-300 text-sm">Resumen en tiempo real del Sistema de Gestión de Calidad</p>
        </div>
        <div className="hidden md:block bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
          <p className="text-xs text-slate-300 font-medium">Fecha Actual</p>
          <p className="font-bold">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          title="Acciones Abiertas" value={acAbiertas} icon={AlertTriangle} 
          colorClass="text-red-600" bgClass="bg-red-100" onClick={() => setActiveTab('ac')}
        />
        <KPICard 
          title="Planes Activos" value={pmAbiertos} icon={TrendingUp} 
          colorClass="text-emerald-600" bgClass="bg-emerald-100" onClick={() => setActiveTab('pm')}
        />
        <KPICard 
          title="Auditorías Prog." value={pendientesAuditorias} icon={ClipboardCheck} 
          colorClass="text-amber-600" bgClass="bg-amber-100" onClick={() => setActiveTab('audits')}
        />
        <KPICard 
          title="Documentos" value={safeDocs.length} icon={FileText} 
          colorClass="text-blue-600" bgClass="bg-blue-100" onClick={() => setActiveTab('documents')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-[#002855] flex items-center gap-2"><FileBarChart size={18} className="text-cyan-600"/> Actividad Reciente</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {actividadesRecientes.length > 0 ? actividadesRecientes.map((act) => (
              <div key={`${act.tipoDoc}-${act.id}`} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab(act.tipoDoc === 'AC' ? 'ac' : 'pm')}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${act.tipoDoc === 'AC' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {act.tipoDoc}
                  </div>
                  <div>
                    <p className="font-bold text-[#002855] group-hover:text-cyan-600 transition-colors">
                      {act.folio_codigo || act.folio || `${act.tipoDoc} Borrador`}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{act.area || act.gerencia_coordinacion || 'Sin área asignada'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getEstadoColor(act.estado)}`}>
                    {getEstadoLabel(act.estado)}
                  </span>
                  <span className="text-slate-500 group-hover:text-cyan-500">→</span>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <div className="bg-slate-100 p-4 rounded-full mb-3"><FileText size={32} className="text-slate-500"/></div>
                <p className="font-bold text-slate-700">No hay actividad reciente</p>
                <p className="text-sm">Comienza creando una Acción Correctiva o Plan de Mejora.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Lateral: Áreas con más AC y Estado de Auditorías */}
        <div className="space-y-6">
          {/* Top Áreas */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855] flex items-center gap-2"><Users size={18} className="text-cyan-600"/> Áreas con más Hallazgos</h2>
            </div>
            <div className="p-5 space-y-4">
              {topAreas.length > 0 ? topAreas.map(([area, count], idx) => (
                <div key={area} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[150px]" title={area}>{area}</span>
                  </div>
                  <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {count}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-2">No hay datos de áreas</p>
              )}
            </div>
          </div>

          {/* Resumen de Auditorías */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855] flex items-center gap-2"><CheckCircle2 size={18} className="text-cyan-600"/> Avance de Auditorías</h2>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-3xl font-black text-[#002855]">{auditoriasCompletadas} <span className="text-sm text-slate-500 font-medium">/ {safeAuditorias.length}</span></p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Completadas</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-500">
                    {safeAuditorias.length > 0 ? Math.round((auditoriasCompletadas / safeAuditorias.length) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${safeAuditorias.length > 0 ? (auditoriasCompletadas / safeAuditorias.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
