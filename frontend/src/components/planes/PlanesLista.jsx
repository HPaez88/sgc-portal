import React, { useState } from 'react';
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

  // Obtener áreas únicas
  const areas = [...new Set(planesMejora.map(pm => pm.gerencia_coordinacion).filter(Boolean))].sort();
  
  // Filtrar planes (estado canónico + búsqueda + vencimiento)
  const planesFiltrados = planesMejora.filter(pm => {
    if (filtroArea && pm.gerencia_coordinacion !== filtroArea) return false;
    if (!cumpleFiltroEstado(pm.estado, filtroEstado)) return false;

    if (filtroVencimiento && getVencimiento(pm).nivel !== filtroVencimiento) return false;

    if (filtroTexto.trim()) {
      const q = filtroTexto.trim().toLowerCase();
      const texto = [
        pm.folio,
        pm.folio_codigo,
        pm.titulo_mejora,
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

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#002855]">🚀 Planes de Mejora</h2>
        <button onClick={() => { resetForm(); setVista('nuevo'); }}
          className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40] transition-colors">
          + Nuevo Plan de Mejora
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
              placeholder="Folio, título, área o categoría..."
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ÁREA / GERENCIA</label>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
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
          <div className="flex items-end">
            <button onClick={() => { setFiltroArea(''); setFiltroEstado(''); setFiltroTexto(''); setFiltroVencimiento(''); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              Limpiar filtros
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 font-medium">Mostrando {planesFiltrados.length} de {planesMejora.length} planes</p>
      </div>
      
      {planesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-4 opacity-50">📭</p>
          <p className="font-medium">No hay planes de mejora con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Título</th>
                  <th className="p-4">Gerencia / Área</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planesFiltrados.map((pm, idx) => (
                  <tr key={pm.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                      {pm.folio || pm.folio_codigo || 'Pendiente'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 max-w-xs truncate" title={pm.titulo_mejora}>
                      {pm.titulo_mejora || '-'}
                    </td>
                    <td className="p-4 text-slate-700">{pm.gerencia_coordinacion || '-'}</td>
                    <td className="p-4 text-slate-500">{pm.categoria_mejora || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(pm.estado)}`}>
                        {getEstadoLabel(pm.estado)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getVencimiento(pm).color}`}>
                        {getVencimiento(pm).label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {pm.created_at ? new Date(pm.created_at).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleVer(pm)}
                          className="text-cyan-600 bg-cyan-50 hover:bg-cyan-100 hover:text-cyan-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                          👁️ Ver
                        </button>
                        {can(usuarioLogueado, 'eliminar') && (
                          <button onClick={() => eliminarPM(pm.id)}
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
