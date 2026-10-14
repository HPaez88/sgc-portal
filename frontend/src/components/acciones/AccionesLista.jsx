import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronRight, Eye } from 'lucide-react';
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
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);

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

  const filtrosActivosCount = [filtroAnio, filtroEstado, filtroOrigen, filtroVencimiento].filter(Boolean).length;

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Control de Acciones Correctivas
            </h2>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/70">
              OOMRSC-20
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
            Gestión y trazabilidad de no conformidades bajo ISO 9001:2015
          </p>
        </div>
        <button onClick={() => { resetForm(); setVista('nuevo'); }}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:scale-[1.01]">
          <span>+</span> Nueva Acción
        </button>
      </div>
      
      {/* ── FILTROS MÓVILES COMPACTOS (< md) ── */}
      <div className="md:hidden bg-white p-2.5 rounded-xl shadow-2xs border border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar folio, área, proceso..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none"
            />
          </div>
          <button
            onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 shrink-0 ${
              mostrarFiltrosMobile || filtrosActivosCount > 0
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filtros</span>
            {filtrosActivosCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-sky-700 text-white text-[9px] flex items-center justify-center font-bold">
                {filtrosActivosCount}
              </span>
            )}
          </button>
        </div>

        {mostrarFiltrosMobile && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs animate-fade-in-down">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">AÑO</label>
              <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-md p-1.5 text-xs">
                <option value="">Todos</option>
                {años.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ESTADO</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-md p-1.5 text-xs">
                {FILTROS_ESTADO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">VENCIMIENTO</label>
              <select value={filtroVencimiento} onChange={(e) => setFiltroVencimiento(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-md p-1.5 text-xs">
                <option value="">Todos</option>
                <option value="vencido">Vencidos</option>
                <option value="por_vencer">Por vencer</option>
                <option value="en_tiempo">En tiempo</option>
                <option value="sin_fecha">Sin fecha</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ORIGEN</label>
              <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-md p-1.5 text-xs">
                <option value="">Todos</option>
                {ORIGENES_AC.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {filtrosActivosCount > 0 && (
              <div className="col-span-2 pt-1 flex justify-end">
                <button
                  onClick={() => { setFiltroAnio(''); setFiltroEstado(''); setFiltroOrigen(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
                  className="text-[11px] font-bold text-rose-600 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw size={11} /> Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FILTROS ESCRITORIO (>= md) ── */}
      <div className="hidden md:block bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px] flex-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">BUSCAR</label>
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Folio, área, proceso o descripción..."
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">AÑO</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs outline-none">
              <option value="">Todos</option>
              {años.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ESTADO</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs outline-none">
              {FILTROS_ESTADO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">VENCIMIENTO</label>
            <select value={filtroVencimiento} onChange={(e) => setFiltroVencimiento(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs outline-none">
              <option value="">Todos</option>
              <option value="vencido">Vencidos</option>
              <option value="por_vencer">Por vencer (≤15 días)</option>
              <option value="en_tiempo">En tiempo</option>
              <option value="sin_fecha">Sin fecha compromiso</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ORIGEN</label>
            <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs outline-none">
              <option value="">Todos</option>
              {ORIGENES_AC.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {filtrosActivosCount > 0 && (
            <div>
              <button onClick={() => { setFiltroAnio(''); setFiltroEstado(''); setFiltroOrigen(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Conteo de registros */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
        <span>Mostrando {accionesFiltradas.length} de {accionesCorrectivas.length} acciones</span>
      </div>

      {accionesFiltradas.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-3xl mb-2 opacity-50">📭</p>
          <p className="text-xs font-bold text-slate-700">No hay acciones correctivas con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════
              VISTA MÓVIL (< md): TARJETAS ERGONÓMICAS TÁCTILES
              ════════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-2.5">
            {accionesFiltradas.map((ac, idx) => {
              const venc = getVencimiento(ac);
              return (
                <div
                  key={ac.id || idx}
                  onClick={() => handleVer(ac)}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-xs font-black text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {ac.folio_codigo || 'Borrador'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(ac.estado)}`}>
                        {getEstadoLabel(ac.estado)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>
                        {venc.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                      {ac.area || 'Sin área asignada'}
                    </h3>
                    {ac.proceso && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Proceso: {ac.proceso}
                      </p>
                    )}
                  </div>

                  {ac.descripcion_problema && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {ac.descripcion_problema}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Origen: <strong className="text-slate-600 font-semibold">{ac.origen || '-'}</strong></span>
                    <span className="text-sky-700 font-bold flex items-center gap-0.5">
                      Ver detalle <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════
              VISTA ESCRITORIO (>= md): TABLA COMPLETA
              ════════════════════════════════════════════════════════════ */}
          <div className="hidden md:block bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-mono">Folio</th>
                    <th className="p-3">Área</th>
                    <th className="p-3">Proceso</th>
                    <th className="p-3">Origen</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accionesFiltradas.map((ac, idx) => (
                    <tr key={ac.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3 font-mono text-xs font-semibold text-slate-700">
                        {ac.folio_codigo || 'Pendiente'}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">{ac.area || '-'}</td>
                      <td className="p-3 text-slate-700">{ac.proceso || '-'}</td>
                      <td className="p-3 text-slate-500">{ac.origen || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getEstadoColor(ac.estado)}`}>
                          {getEstadoLabel(ac.estado)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getVencimiento(ac).color}`}>
                          {getVencimiento(ac).label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleVer(ac)}
                            className="text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1">
                            <Eye size={12} /> Ver
                          </button>
                          {can(usuarioLogueado, 'eliminar') && (
                            <button onClick={() => eliminarAC(ac.id)}
                              className="text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
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
        </>
      )}
    </div>
  );
}
