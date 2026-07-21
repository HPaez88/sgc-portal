import React, { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { getEstadoColor, getEstadoLabel } from '../../constants';

export default function GestorAprobacionesView({ 
  accionesCorrectivas, 
  planesMejora, 
  setAccionesCorrectivas, 
  setPlanesMejora, 
  usuarios, 
  puedeTodasAreas, 
  areaUsuario 
}) {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Agregar los registros de Acciones Correctivas que requieren aprobación
  const accionesPendientes = accionesCorrectivas
    .filter(ac => ac.estado === 'EN_REVISION' || ac.estado === 'REVISION_AUDITOR')
    .map(ac => ({
      id_original: ac.id,
      documento: ac.folio_codigo || 'Borrador',
      tipo: 'Acción Correctiva',
      area: ac.area,
      fecha: ac.fecha_envio_sgc || ac.fecha_creacion_borrador,
      estado: ac.estado,
      prioridad: 'Alta', // Las AC siempre son prioridad alta
      objeto_original: ac
    }));

  // Agregar los registros de Planes de Mejora que requieren aprobación
  const planesPendientes = planesMejora
    .filter(pm => pm.estado === 'ENVIADO_SGC' || pm.estado === 'EN_REVISION' || pm.estado === 'REVISION_AUDITOR')
    .map(pm => ({
      id_original: pm.id,
      documento: pm.folio_codigo || pm.folio || 'Borrador',
      tipo: 'Plan de Mejora',
      area: pm.gerencia_coordinacion,
      fecha: pm.fecha_envio_sgc || pm.created_at,
      estado: pm.estado,
      prioridad: 'Media',
      objeto_original: pm
    }));

  const aprobaciones = [...accionesPendientes, ...planesPendientes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const appsFiltradas = aprobaciones.filter(a => {
    if (!puedeTodasAreas && a.area !== areaUsuario) return false;
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    return true;
  });

  const getPrioridadColor = (p) => {
    const colors = { 'Alta': 'bg-red-100 text-red-700 border-red-200', 'Media': 'bg-amber-100 text-amber-700 border-amber-200', 'Baja': 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return colors[p] || 'bg-[#00152e]/50 text-slate-300 border-cyan-500/20';
  };

  const aprobarDocumento = (app) => {
    if (!confirm(`¿Aprobar el documento ${app.documento}?`)) return;

    if (app.tipo === 'Acción Correctiva') {
      const folioNumero = accionesCorrectivas.filter(a => a.folio_codigo !== 'Pendiente de aprobación').length + 1;
      const anio = new Date().getFullYear().toString().slice(-2);
      const folioCodigo = `AC#${folioNumero}/${anio}`;
      
      const nuevoObj = {
        ...app.objeto_original,
        estado: 'APROBADO',
        folio_numero: folioNumero,
        folio_codigo: folioCodigo,
        anio_folio: anio,
        fecha_aprobacion_sgc: new Date().toISOString(),
        fecha_apertura: new Date().toISOString()
      };
      
      setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
      mostrarMensaje(`✅ Acción Correctiva aprobada. Folio: ${folioCodigo}`);
      
    } else if (app.tipo === 'Plan de Mejora') {
      const folioNumero = planesMejora.filter(p => p.folio).length + 1;
      const anio = new Date().getFullYear().toString().slice(-2);
      const folioCodigo = `PM#${folioNumero}/${anio}`;
      
      const nuevoObj = {
        ...app.objeto_original,
        estado: 'APROBADO',
        folio: folioCodigo,
        fecha_apertura: new Date().toISOString()
      };
      
      setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
      mostrarMensaje(`✅ Plan de Mejora aprobado. Folio: ${folioCodigo}`);
    }
  };

  const rechazarDocumento = (app) => {
    const obs = prompt(`Indique el motivo del rechazo para ${app.documento}:`);
    if (!obs) return;

    if (app.tipo === 'Acción Correctiva') {
      const nuevoObj = {
        ...app.objeto_original,
        estado: 'RECHAZADO',
        observaciones_sgc: obs
      };
      setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
      mostrarMensaje(`❌ Acción Correctiva devuelta al usuario con observaciones.`);
      
    } else if (app.tipo === 'Plan de Mejora') {
      const nuevoObj = {
        ...app.objeto_original,
        estado: 'RECHAZADO',
        observaciones_sgc: obs
      };
      setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
      mostrarMensaje(`❌ Plan de Mejora devuelto al usuario con observaciones.`);
    }
  };

  const mostrarMensaje = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center glass-card-dark p-4 rounded-xl shadow-sm border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl bg-cyan-100 p-2 rounded-lg">✅</span>
          <div>
            <h2 className="text-xl font-bold text-white">Gestor de Aprobaciones</h2>
            <p className="text-sm text-slate-400 font-medium">Bandeja de entrada del SGC</p>
          </div>
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-4 py-2 glass-card-dark-header border border-cyan-500/20 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
          <option value="">Todos los tipos</option>
          <option value="Acción Correctiva">Acciones Correctivas</option>
          <option value="Plan de Mejora">Planes de Mejora</option>
        </select>
      </div>

      {mensaje && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-lg shadow-sm font-medium animate-fade-in">
          {mensaje}
        </div>
      )}

      {appsFiltradas.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass-card-dark rounded-xl shadow-sm border border-cyan-500/20">
          <p className="text-5xl mb-4 opacity-50">🎉</p>
          <p className="text-lg font-bold text-slate-300">¡Bandeja Limpia!</p>
          <p className="font-medium mt-1">No hay documentos pendientes de aprobación por el momento.</p>
        </div>
      ) : (
        <div className="glass-card-dark rounded-xl shadow-sm border border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="glass-card-dark-header border-b border-cyan-500/20">
                <tr>
                  <th className="p-4 text-sm font-bold text-slate-300">Documento</th>
                  <th className="p-4 text-sm font-bold text-slate-300">Tipo</th>
                  <th className="p-4 text-sm font-bold text-slate-300">Área</th>
                  <th className="p-4 text-sm font-bold text-slate-300">Fecha Envío</th>
                  <th className="p-4 text-sm font-bold text-slate-300">Prioridad</th>
                  <th className="p-4 text-sm font-bold text-slate-300">Estado</th>
                  <th className="p-4 text-sm font-bold text-slate-300 text-center">Acciones SGC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {appsFiltradas.map(app => (
                  <tr key={`${app.tipo}-${app.id_original}`} className="hover:bg-white/5/50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      {app.documento}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${app.tipo === 'Acción Correctiva' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {app.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-300 font-medium">{app.area}</td>
                    <td className="p-4 text-sm text-slate-400">
                      {app.fecha ? new Date(app.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPrioridadColor(app.prioridad)}`}>
                        {app.prioridad}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(app.estado)}`}>
                        {getEstadoLabel(app.estado)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {(app.estado === 'ENVIADO_SGC' || app.estado === 'EN_REVISION') && puedeTodasAreas ? (
                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => aprobarDocumento(app)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <Check size={16} strokeWidth={3} /> Aprobar
                          </button>
                          <button onClick={() => rechazarDocumento(app)} className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <X size={16} strokeWidth={3} /> Devolver
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Solo lectura</span>
                      )}
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