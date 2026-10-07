import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronRight, Eye } from 'lucide-react';
import { FILTROS_ESTADO, cumpleFiltroEstado, getVencimiento, can } from '../../constants';

export default function PlanesLista({ 
  planesMejora, 
  setVista, 
  setStep, 
  resetForm, 
  handleVer, 
  eliminarPM, 
  usuarioLogueado,
  getEstadoColor,
  getEstadoLabel
}) {
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroVencimiento, setFiltroVencimiento] = useState('');
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);

  // Obtener áreas únicas
  const areas = [...new Set(planesMejora.map(pm => pm.area || pm.gerencia_coordinacion).filter(Boolean))].sort();
  
  // Filtrar planes (estado canónico + búsqueda + vencimiento)
  const planesFiltrados = planesMejora.filter(pm => {
    if (filtroArea && (pm.area || pm.gerencia_coordinacion) !== filtroArea) return false;
    if (!cumpleFiltroEstado(pm.estado, filtroEstado)) return false;

    if (filtroVencimiento && getVencimiento(pm).nivel !== filtroVencimiento) return false;

    if (filtroTexto.trim()) {
      const q = filtroTexto.trim().toLowerCase();
      const texto = [
        pm.folio,
        pm.folio_codigo,
        pm.titulo_mejora,
        pm.area,
        pm.gerencia_coordinacion,
        pm.categoria_mejora,
        pm.periodo_mejora,
        pm.responsable,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!texto.includes(q)) return false;
    }

    return true;
  });

  const filtrosActivosCount = [filtroArea, filtroEstado, filtroVencimiento].filter(Boolean).length;

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Control de Planes de Mejora
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
              OOMRSC-21
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
            Proyectos de mejora continua e innovación bajo ISO 9001:2015 § 10.3
          </p>
        </div>
        <button onClick={() => { resetForm(); setVista('nuevo'); }}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:scale-[1.01]">
          <span>+</span> Nuevo Plan
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
              placeholder="Buscar título, área, categoría..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none"
            />
          </div>
          <button
            onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 shrink-0 ${
              mostrarFiltrosMobile || filtrosActivosCount > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filtros</span>
            {filtrosActivosCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold">
                {filtrosActivosCount}
              </span>
            )}
          </button>
        </div>

        {mostrarFiltrosMobile && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs animate-fade-in-down">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ÁREA / GERENCIA</label>
              <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-md p-1.5 text-xs">
                <option value="">Todas las áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
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
            {filtrosActivosCount > 0 && (
              <div className="col-span-2 pt-1 flex justify-end">
                <button
                  onClick={() => { setFiltroArea(''); setFiltroEstado(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
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
              placeholder="Folio, título, área o categoría..."
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ÁREA / GERENCIA</label>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs outline-none max-w-[180px] truncate">
              <option value="">Todas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
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
          {filtrosActivosCount > 0 && (
            <div>
              <button onClick={() => { setFiltroArea(''); setFiltroEstado(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Conteo de registros */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
        <span>Mostrando {planesFiltrados.length} de {planesMejora.length} planes</span>
      </div>

      {planesFiltrados.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-3xl mb-2 opacity-50">📭</p>
          <p className="text-xs font-bold text-slate-700">No hay planes de mejora con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════
              VISTA MÓVIL (< md): TARJETAS ERGONÓMICAS TÁCTILES
              ════════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-2.5">
            {planesFiltrados.map((pm, idx) => {
              const venc = getVencimiento(pm);
              return (
                <div
                  key={pm.id || idx}
                  onClick={() => handleVer(pm)}
                  className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 active:bg-slate-50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-xs font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {pm.folio || pm.folio_codigo || 'Borrador'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEstadoColor(pm.estado)}`}>
                        {getEstadoLabel(pm.estado)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>
                        {venc.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {pm.titulo_mejora || 'Sin título definido'}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {pm.area || pm.gerencia_coordinacion || '-'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Categoría: <strong className="text-slate-600 font-semibold">{pm.categoria_mejora || 'General'}</strong></span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
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
                    <th className="p-3">Título</th>
                    <th className="p-3">Gerencia / Área</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planesFiltrados.map((pm, idx) => (
                    <tr key={pm.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3 font-mono text-xs font-semibold text-slate-700">
                        {pm.folio || pm.folio_codigo || 'Pendiente'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate" title={pm.titulo_mejora}>
                        {pm.titulo_mejora || '-'}
                      </td>
                      <td className="p-3 text-slate-700">{pm.area || pm.gerencia_coordinacion || '-'}</td>
                      <td className="p-3 text-slate-500">{pm.categoria_mejora || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getEstadoColor(pm.estado)}`}>
                          {getEstadoLabel(pm.estado)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getVencimiento(pm).color}`}>
                          {getVencimiento(pm).label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {pm.created_at ? new Date(pm.created_at).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleVer(pm)}
                            className="text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1">
                            <Eye size={12} /> Ver
                          </button>
                          {can(usuarioLogueado, 'eliminar') && (
                            <button onClick={() => eliminarPM(pm.id)}
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
