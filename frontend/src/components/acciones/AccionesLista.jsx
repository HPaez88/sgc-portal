import React, { useState } from 'react';
import { ORIGENES_AC, FILTROS_ESTADO, cumpleFiltroEstado, getVencimiento, can } from '../../constants';

export default function AccionesLista({ 
  accionesCorrectivas, 
  setForm, 
  setEquipo, 
  setCausas, 
  setActividades, 
  setVista, 
  setStep, 
  resetForm, 
  eliminarAC, 
  usuarioLogueado,
  getEstadoColor,
  getEstadoLabel
}) {
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroVencimiento, setFiltroVencimiento] = useState('');

  // Obtener años únicos de las acciones
  const aniosRaw = accionesCorrectivas.map(ac => ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).getFullYear() : null).filter(Boolean);
  const años = [...new Set(aniosRaw)].sort((a,b) => b - a);
  
  // Filtrar acciones (estado canónico + búsqueda + vencimiento)
  const accionesFiltradas = accionesCorrectivas.filter(ac => {
    const anioAC = ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).getFullYear() : null;
    if (filtroAnio && anioAC !== parseInt(filtroAnio)) return false;
    if (!cumpleFiltroEstado(ac.estado, filtroEstado)) return false;
    if (filtroOrigen && ac.origen !== filtroOrigen) return false;

    if (filtroVencimiento) {
      const nivel = getVencimiento(ac).nivel;
      if (nivel !== filtroVencimiento) return false;
    }

    if (filtroTexto.trim()) {
      const q = filtroTexto.trim().toLowerCase();
      const texto = [
        ac.folio_codigo,
        ac.folio,
        ac.area,
        ac.proceso,
        ac.origen,
        ac.numero_auditoria,
        ac.descripcion_no_conformidad_original,
        ac.descripcion_no_conformidad_final,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!texto.includes(q)) return false;
    }

    return true;
  });

  const handleVer = (ac) => {
    setForm(ac); 
    // Cargar equipo
    if (ac.equipo_json) {
      try { setEquipo(JSON.parse(ac.equipo_json)); } catch(e) { 
        if (ac.equipo && Array.isArray(ac.equipo)) setEquipo(ac.equipo);
      }
    } else if (ac.equipo && Array.isArray(ac.equipo)) {
      setEquipo(ac.equipo);
    } else {
      setEquipo([{ id: 1, nombre: ac.responsable_actividad_inmediata || '', puesto: '', area: ac.area || '', rol: 'Responsable principal', es_responsable_principal: true, firma_digital: '' }]);
    }
    
    // Cargar causas
    if (ac.causas_json) {
      try { setCausas(JSON.parse(ac.causas_json)); } catch(e) { 
        if (ac.causa) setCausas([{ id: 1, numero: 1, causa: ac.causa, puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: true }]);
      }
    } else if (ac.causa) {
      setCausas([{ id: 1, numero: 1, causa: ac.causa, puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: true }]);
    }
    
    // Cargar actividades
    let acts = [];
    if (ac.actividades_json) {
      try { 
        const parsed = JSON.parse(ac.actividades_json);
        if (Array.isArray(parsed)) acts = parsed;
        else if (parsed.actividades_correctivas) acts = parsed.actividades_correctivas;
        else if (parsed.actividad) acts = [parsed];
      } catch(e) { console.log('Error parse:', e); }
    }
    if (acts.length === 0 && ac.actividades && Array.isArray(ac.actividades)) {
      acts = ac.actividades;
    }
    if (acts.length === 0 && ac.actividad_inmediata) {
      acts = [{ id: 1, actividad: ac.actividad_inmediata, responsable: ac.responsable_actividad_inmediata || '', indicador_progreso: '', fecha_termino_sugerida: ac.fecha_actividad_inmediata || '', evidencia_esperada: '' }];
    }
    
    setActividades(acts.length > 0 ? acts : []);
    setVista('ver'); 
    setStep(1);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Control de Acciones Correctivas
            <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/70">
              Formato OOMRSC-20
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestión y trazabilidad de no conformidades bajo ISO 9001:2015</p>
        </div>
        <button onClick={() => { resetForm(); setVista('nuevo'); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-[1.01]">
          <span>+</span> Nueva Acción Correctiva
        </button>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">BUSCAR</label>
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Folio, área, proceso o descripción..."
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">AÑO</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todos</option>
              {años.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ESTADO</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              {FILTROS_ESTADO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">VENCIMIENTO</label>
            <select value={filtroVencimiento} onChange={(e) => setFiltroVencimiento(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todos</option>
              <option value="vencido">Vencidos</option>
              <option value="por_vencer">Por vencer (≤15 días)</option>
              <option value="en_tiempo">En tiempo</option>
              <option value="sin_fecha">Sin fecha compromiso</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ORIGEN</label>
            <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todos</option>
              {ORIGENES_AC.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFiltroAnio(''); setFiltroEstado(''); setFiltroOrigen(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              Limpiar filtros
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 font-medium">Mostrando {accionesFiltradas.length} de {accionesCorrectivas.length} acciones</p>
      </div>
      
      {accionesFiltradas.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-4 opacity-50">📭</p>
          <p className="font-medium">No hay acciones correctivas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Área</th>
                  <th className="p-4">Proceso</th>
                  <th className="p-4">Origen</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accionesFiltradas.map((ac, idx) => (
                  <tr key={ac.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                      {ac.folio_codigo || 'Pendiente'}
                    </td>
                    <td className="p-4 text-slate-800 font-medium">{ac.area || '-'}</td>
                    <td className="p-4 text-slate-700">{ac.proceso || '-'}</td>
                    <td className="p-4 text-slate-500">{ac.origen || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(ac.estado)}`}>
                        {getEstadoLabel(ac.estado)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getVencimiento(ac).color}`}>
                        {getVencimiento(ac).label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleVer(ac)}
                          className="text-cyan-600 bg-cyan-50 hover:bg-cyan-100 hover:text-cyan-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                          👁️ Ver
                        </button>
                        {can(usuarioLogueado, 'eliminar') && (
                          <button onClick={() => eliminarAC(ac.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition-colors">
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
