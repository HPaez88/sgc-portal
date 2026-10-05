import React, { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { getEstadoColor, getEstadoLabel, getVencimiento, can } from '../../constants';
import { useDialogos, Dialogos } from '../common/Dialogos';

export default function GestorAprobacionesView({
  accionesCorrectivas,
  planesMejora,
  setAccionesCorrectivas,
  setPlanesMejora,
  usuarios,
  puedeTodasAreas,
  areaUsuario,
  usuarioLogueado
}) {
  const { registrarMovimiento } = useSGC();
  const { confirmar, solicitar, props: propsDialogos } = useDialogos();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Permisos del workflow: solo quien puede aprobar ve los botones de decisión
  const puedeAprobar = can(usuarioLogueado, 'aprobar');
  const puedeRechazar = can(usuarioLogueado, 'rechazar');

  // Agregar los registros de Acciones Correctivas que requieren atención de SGC
  const accionesPendientes = accionesCorrectivas
    .filter(ac => {
      if (ac.estado === 'EN_REVISION' || ac.estado === 'SOLICITUD_CIERRE' || ac.estado === 'REVISION_AUDITOR') return true;
      let acts = [];
      try { acts = JSON.parse(ac.actividades_json || '[]'); } catch(e){}
      return acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
    })
    .map(ac => {
      let acts = [];
      try { acts = JSON.parse(ac.actividades_json || '[]'); } catch(e){}
      const tieneReplanteo = acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
      const subtipo = ac.estado === 'SOLICITUD_CIERRE' 
        ? 'Solicitud de Cierre' 
        : tieneReplanteo 
          ? 'Prórroga de Actividad' 
          : 'Aprobación de Folio';
      return {
        id_original: ac.id,
        documento: ac.folio_codigo || 'Borrador',
        tipo: 'Acción Correctiva',
        subtipo,
        area: ac.area,
        fecha: ac.fecha_solicitud_cierre || ac.fecha_envio_sgc || ac.fecha_creacion_borrador,
        estado: ac.estado,
        prioridad: 'Alta',
        tieneReplanteo,
        objeto_original: ac
      };
    });

  // Agregar los registros de Planes de Mejora que requieren atención de SGC
  const planesPendientes = planesMejora
    .filter(pm => {
      if (pm.estado === 'ENVIADO_SGC' || pm.estado === 'EN_REVISION' || pm.estado === 'SOLICITUD_CIERRE' || pm.estado === 'REVISION_AUDITOR') return true;
      let acts = [];
      try { acts = typeof pm.actividades === 'string' ? JSON.parse(pm.actividades || '[]') : (pm.actividades || []); } catch(e){}
      return acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
    })
    .map(pm => {
      let acts = [];
      try { acts = typeof pm.actividades === 'string' ? JSON.parse(pm.actividades || '[]') : (pm.actividades || []); } catch(e){}
      const tieneReplanteo = acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
      const subtipo = pm.estado === 'SOLICITUD_CIERRE' 
        ? 'Solicitud de Cierre' 
        : tieneReplanteo 
          ? 'Prórroga de Actividad' 
          : 'Aprobación de Folio';
      return {
        id_original: pm.id,
        documento: pm.folio_codigo || pm.folio || 'Borrador',
        tipo: 'Plan de Mejora',
        subtipo,
        area: pm.area || pm.gerencia_coordinacion,
        fecha: pm.fecha_solicitud_cierre || pm.fecha_envio_sgc || pm.created_at,
        estado: pm.estado,
        prioridad: 'Media',
        tieneReplanteo,
        objeto_original: pm
      };
    });

  const aprobaciones = [...accionesPendientes, ...planesPendientes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const appsFiltradas = aprobaciones.filter(a => {
    if (!puedeTodasAreas && a.area !== areaUsuario) return false;
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    return true;
  });

  const getPrioridadColor = (p) => {
    const colors = { 'Alta': 'bg-red-100 text-red-700 border-red-200', 'Media': 'bg-amber-100 text-amber-700 border-amber-200', 'Baja': 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return colors[p] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const aprobarDocumento = async (app) => {
    if (!puedeAprobar) {
      mostrarMensaje('No tienes permiso para aprobar documentos en el SGC.');
      return;
    }

    if (app.tieneReplanteo) {
      // Aprobar replanteamiento de fecha de actividad
      if (app.tipo === 'Acción Correctiva') {
        let acts = [];
        try { acts = JSON.parse(app.objeto_original.actividades_json || '[]'); } catch(e){}
        const updatedActs = acts.map(a => {
          if (a.solicitud_replanteo?.estado === 'PENDIENTE') {
            const req = a.solicitud_replanteo;
            const replanteosCount = (a.replantamientos_count || 0) + 1;
            const historial = Array.isArray(a.historial_replanteos) ? [...a.historial_replanteos] : [];
            historial.push({
              fecha_anterior: a.fecha_termino_sugerida,
              nueva_fecha: req.nueva_fecha,
              justificacion: req.justificacion,
              aprobado_por: usuarioLogueado?.nombre || 'SGC Admin',
              fecha_aprobacion: new Date().toISOString(),
              intento_numero: replanteosCount
            });
            return {
              ...a,
              fecha_termino_sugerida: req.nueva_fecha,
              replantamientos_count: replanteosCount,
              historial_replanteos: historial,
              solicitud_replanteo: null
            };
          }
          return a;
        });
        const nuevoObj = {
          ...app.objeto_original,
          actividades_json: JSON.stringify(updatedActs)
        };
        setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
        mostrarMensaje(`✓ Prórroga aprobada para ${app.documento}`);
        registrarMovimiento({
          modulo: 'ACCIONES_CORRECTIVAS',
          accion: 'APROBACION_PRORROGA',
          descripcion: `Prórroga de fecha autorizada para actividad en ${app.documento}`,
          detalles: `Autorizado por ${usuarioLogueado?.nombre || 'SGC'}`,
          folio: app.documento
        });
      } else {
        let acts = [];
        try { acts = typeof app.objeto_original.actividades === 'string' ? JSON.parse(app.objeto_original.actividades || '[]') : (app.objeto_original.actividades || []); } catch(e){}
        const updatedActs = acts.map(a => {
          if (a.solicitud_replanteo?.estado === 'PENDIENTE') {
            const req = a.solicitud_replanteo;
            const replanteosCount = (a.replantamientos_count || 0) + 1;
            const historial = Array.isArray(a.historial_replanteos) ? [...a.historial_replanteos] : [];
            historial.push({
              fecha_anterior: a.fecha_termino_sugerida,
              nueva_fecha: req.nueva_fecha,
              justificacion: req.justificacion,
              aprobado_por: usuarioLogueado?.nombre || 'SGC Admin',
              fecha_aprobacion: new Date().toISOString(),
              intento_numero: replanteosCount
            });
            return {
              ...a,
              fecha_termino_sugerida: req.nueva_fecha,
              replantamientos_count: replanteosCount,
              historial_replanteos: historial,
              solicitud_replanteo: null
            };
          }
          return a;
        });
        const nuevoObj = {
          ...app.objeto_original,
          actividades: Array.isArray(app.objeto_original.actividades) ? updatedActs : JSON.stringify(updatedActs)
        };
        setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
        mostrarMensaje(`✓ Prórroga aprobada para ${app.documento}`);
        registrarMovimiento({
          modulo: 'PLANES_MEJORA',
          accion: 'APROBACION_PRORROGA',
          descripcion: `Prórroga de fecha autorizada para actividad en ${app.documento}`,
          detalles: `Autorizado por ${usuarioLogueado?.nombre || 'SGC'}`,
          folio: app.documento
        });
      }
      return;
    }

    const { ok: confirma } = await confirmar({
      titulo: 'Aprobar documento',
      mensaje: `¿Aprobar el documento ${app.documento}?`,
      textoAceptar: 'Aprobar',
    });
    if (!confirma) return;

    if (app.tipo === 'Acción Correctiva') {
      const folioNumero = accionesCorrectivas.filter(a => a.folio_codigo !== 'Pendiente de aprobación').length + 1;
      const anio = new Date().getFullYear().toString().slice(-2);
      const folioCodigo = `AC#${folioNumero}/${anio}`;

      const nuevoObj = {
        ...app.objeto_original,
        estado: 'EN_SEGUIMIENTO',
        folio_numero: folioNumero,
        folio_codigo: folioCodigo,
        folio_sgc: folioCodigo,
        anio_folio: anio,
        fecha_aprobacion_sgc: new Date().toISOString(),
        fecha_apertura: new Date().toISOString(),
        aprobado_por_sgc: usuarioLogueado?.nombre || 'SGC'
      };

      setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
      mostrarMensaje(`✅ Acción Correctiva aprobada y en seguimiento. Folio: ${folioCodigo}`);
      registrarMovimiento({
        modulo: 'ACCIONES_CORRECTIVAS',
        accion: 'APROBACION',
        descripcion: `Aprobación oficial de Acción Correctiva y asignación de folio SGC ${folioCodigo}`,
        detalles: `Aprobado por ${usuarioLogueado?.nombre || 'SGC'} | Área: ${app.area || 'N/A'}`,
        folio: folioCodigo
      });

    } else if (app.tipo === 'Plan de Mejora') {
      const folioNumero = planesMejora.filter(p => p.folio || p.folio_codigo).length + 1;
      const anio = new Date().getFullYear().toString().slice(-2);
      const folioCodigo = `PM#${folioNumero}/${anio}`;

      const nuevoObj = {
        ...app.objeto_original,
        estado: 'EN_SEGUIMIENTO',
        folio: folioCodigo,
        folio_codigo: folioCodigo,
        folio_sgc: folioCodigo,
        folio_numero: folioNumero,
        anio_folio: anio,
        fecha_aprobacion_sgc: new Date().toISOString(),
        fecha_apertura: new Date().toISOString(),
        aprobado_por_sgc: usuarioLogueado?.nombre || 'SGC'
      };

      setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
      mostrarMensaje(`✅ Plan de Mejora aprobado y en seguimiento. Folio: ${folioCodigo}`);
      registrarMovimiento({
        modulo: 'PLANES_MEJORA',
        accion: 'APROBACION',
        descripcion: `Aprobación oficial de Plan de Mejora y asignación de folio SGC ${folioCodigo}`,
        detalles: `Aprobado por ${usuarioLogueado?.nombre || 'SGC'} | Área: ${app.area || 'N/A'}`,
        folio: folioCodigo
      });
    }
  };

  const rechazarDocumento = async (app) => {
    if (!puedeRechazar) {
      mostrarMensaje('No tienes permiso para devolver documentos en el SGC.');
      return;
    }
    const { ok, valor: obs } = await solicitar({
      titulo: 'Devolver con observaciones',
      subtitulo: app.documento,
      etiqueta: 'Motivo de la observación',
      placeholder: 'Indica qué debe corregir el área antes de reenviar...',
      textoAceptar: 'Devolver',
      peligro: true,
      filas: 5,
    });
    if (!ok || !obs) return;

    if (app.tieneReplanteo) {
      // Rechazar prórroga
      if (app.tipo === 'Acción Correctiva') {
        let acts = [];
        try { acts = JSON.parse(app.objeto_original.actividades_json || '[]'); } catch(e){}
        const updatedActs = acts.map(a => {
          if (a.solicitud_replanteo?.estado === 'PENDIENTE') {
            return { ...a, solicitud_replanteo: null };
          }
          return a;
        });
        const nuevoObj = { ...app.objeto_original, actividades_json: JSON.stringify(updatedActs) };
        setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
        mostrarMensaje(`✕ Prórroga rechazada para ${app.documento}`);
      } else {
        let acts = [];
        try { acts = typeof app.objeto_original.actividades === 'string' ? JSON.parse(app.objeto_original.actividades || '[]') : (app.objeto_original.actividades || []); } catch(e){}
        const updatedActs = acts.map(a => {
          if (a.solicitud_replanteo?.estado === 'PENDIENTE') {
            return { ...a, solicitud_replanteo: null };
          }
          return a;
        });
        const nuevoObj = { 
          ...app.objeto_original, 
          actividades: Array.isArray(app.objeto_original.actividades) ? updatedActs : JSON.stringify(updatedActs) 
        };
        setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
        mostrarMensaje(`✕ Prórroga rechazada para ${app.documento}`);
      }
      return;
    }

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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl bg-cyan-100 p-2 rounded-lg">✅</span>
          <div>
            <h2 className="text-xl font-bold text-[#002855]">Gestor de Aprobaciones</h2>
            <p className="text-sm text-slate-500 font-medium">Bandeja de entrada del SGC</p>
          </div>
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
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
        <div className="text-center py-16 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-5xl mb-4 opacity-50">🎉</p>
          <p className="text-lg font-bold text-slate-700">¡Bandeja Limpia!</p>
          <p className="font-medium mt-1">No hay documentos pendientes de aprobación por el momento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-sm font-bold text-slate-700">Documento</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Tipo</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Área</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Fecha Envío</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Prioridad</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Estado</th>
                  <th className="p-4 text-sm font-bold text-slate-700">Vencimiento</th>
                  <th className="p-4 text-sm font-bold text-slate-700 text-center">Acciones SGC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appsFiltradas.map(app => (
                  <tr key={`${app.tipo}-${app.id_original}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-slate-800 text-sm">
                      <div className="flex flex-col">
                        <span>{app.documento}</span>
                        {app.subtipo && (
                          <span className={`inline-block mt-1 w-fit text-[11px] font-sans px-2 py-0.5 rounded-full font-semibold border ${
                            app.subtipo === 'Prórroga de Actividad'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : app.subtipo === 'Solicitud de Cierre'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {app.subtipo === 'Prórroga de Actividad' && '🕒 '}
                            {app.subtipo === 'Solicitud de Cierre' && '🚀 '}
                            {app.subtipo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${app.tipo === 'Acción Correctiva' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {app.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700 font-medium">{app.area}</td>
                    <td className="p-4 text-sm text-slate-500">
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
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getVencimiento(app.objeto_original).color}`}>
                        {getVencimiento(app.objeto_original).label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {app.tieneReplanteo && puedeAprobar ? (
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => aprobarDocumento(app)} 
                              title="Aprobar nueva fecha límite sugerida"
                              className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Check size={14} strokeWidth={3} /> Aprobar Prórroga
                            </button>
                            <button 
                              onClick={() => rechazarDocumento(app)} 
                              title="Rechazar solicitud de prórroga"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <X size={14} strokeWidth={3} /> Rechazar
                            </button>
                          </div>
                          <span className="text-[10px] text-amber-700 font-medium">Solicitud de prórroga</span>
                        </div>
                      ) : (app.estado === 'ENVIADO_SGC' || app.estado === 'EN_REVISION') && puedeAprobar ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => aprobarDocumento(app)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <Check size={16} strokeWidth={3} /> Aprobar
                          </button>
                          <button onClick={() => rechazarDocumento(app)} className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <X size={16} strokeWidth={3} /> Devolver
                          </button>
                        </div>
                      ) : app.estado === 'SOLICITUD_CIERRE' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Auditoría Requerida
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">Asignar auditor en vista del módulo</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium italic">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Dialogos {...propsDialogos} />
    </div>
  );
}