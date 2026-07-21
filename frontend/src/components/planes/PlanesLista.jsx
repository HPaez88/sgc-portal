import React, { useState } from 'react';

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

  // Obtener áreas únicas
  const areas = [...new Set(planesMejora.map(pm => pm.gerencia_coordinacion).filter(Boolean))].sort();
  
  // Filtrar planes
  const planesFiltrados = planesMejora.filter(pm => {
    if (filtroArea && pm.gerencia_coordinacion !== filtroArea) return false;
    if (filtroEstado) {
      if (filtroEstado === 'CERRADA') {
        if (pm.estado !== 'CERRADO_EFECTIVO' && pm.estado !== 'CERRADO_NO_EFECTIVO') return false;
      } else if (filtroEstado === 'ABIERTA') {
        if (pm.estado !== 'EN_PROCESO' && pm.estado !== 'EN_SEGUIMIENTO') return false;
      } else if (pm.estado !== filtroEstado) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">🚀 Planes de Mejora</h2>
        <button onClick={() => { resetForm(); setVista('nuevo'); }}
          className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40] transition-colors">
          + Nuevo Plan de Mejora
        </button>
      </div>
      
      {/* Filtros */}
      <div className="glass-card-dark p-4 rounded-xl shadow-sm border border-cyan-500/20">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">ÁREA / GERENCIA</label>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
              className="border border-cyan-500/20 glass-card-dark-header rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">ESTADO</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-cyan-500/20 glass-card-dark-header rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all">
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="APROBADO">Aprobado / Pendiente</option>
              <option value="ABIERTA">En Seguimiento</option>
              <option value="REVISION_AUDITOR">En Cierre</option>
              <option value="CERRADA">Cerrado</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFiltroArea(''); setFiltroEstado(''); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 hover:bg-[#00152e]/50 rounded-lg transition-colors">
              Limpiar filtros
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">Mostrando {planesFiltrados.length} de {planesMejora.length} planes</p>
      </div>
      
      {planesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-slate-400 glass-card-dark rounded-xl border border-cyan-500/20">
          <p className="text-4xl mb-4 opacity-50">📭</p>
          <p className="font-medium">No hay planes de mejora con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="glass-card-dark rounded-xl shadow-sm border border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="glass-card-dark-header text-slate-300 font-semibold border-b border-cyan-500/20">
                <tr>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Título</th>
                  <th className="p-4">Gerencia / Área</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {planesFiltrados.map((pm, idx) => (
                  <tr key={pm.id || idx} className="hover:bg-white/5/50 transition-colors group">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-300">
                      {pm.folio || pm.folio_codigo || 'Pendiente'}
                    </td>
                    <td className="p-4 font-semibold text-white max-w-xs truncate" title={pm.titulo_mejora}>
                      {pm.titulo_mejora || '-'}
                    </td>
                    <td className="p-4 text-slate-300">{pm.gerencia_coordinacion || '-'}</td>
                    <td className="p-4 text-slate-400">{pm.categoria_mejora || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(pm.estado)}`}>
                        {getEstadoLabel(pm.estado)}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">
                      {pm.created_at ? new Date(pm.created_at).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleVer(pm)}
                          className="text-cyan-600 bg-cyan-50 hover:bg-cyan-100 hover:text-cyan-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                          👁️ Ver
                        </button>
                        {(usuarioLogueado?.rol === 'Admin' || usuarioLogueado?.rol === 'Super Admin') && (
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
