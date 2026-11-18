import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { getEstadoColor, getEstadoLabel, getVencimiento, can } from '../../constants';
import { fechaSeguimientoInicial, formatearFecha, leerActividades } from '../../constants/workflow';
import { useDialogos, Dialogos } from '../common/Dialogos';
import { LISTA_FILTRO } from '../common/estilosCampos';
import { TIPOS_CAMBIO, solicitudesPendientes, aprobarSolicitud, rechazarSolicitud } from '../../constants/solicitudesCambio';
import { asignarFolio } from '../../services/folioService';

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
      if (solicitudesPendientes(ac).length) return true;
      const acts = leerActividades(ac);
      return acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
    })
    .map(ac => {
      const acts = leerActividades(ac);
      const tieneReplanteo = acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
      const cambio = !tieneReplanteo ? solicitudesPendientes(ac)[0] || null : null;
      const subtipo = ac.estado === 'SOLICITUD_CIERRE' 
        ? 'Solicitud de Cierre' 
        : tieneReplanteo 
          ? 'Prórroga de Actividad' 
          : cambio
            ? 'Solicitud de Cambio'
            : 'Aprobación de Folio';
      return {
        id_original: ac.id,
        documento: ac.folio_codigo || 'Borrador',
        tipo: 'Acción Correctiva',
        subtipo,
        area: ac.area,
        fecha: cambio?.fecha_solicitud || ac.fecha_solicitud_cierre || ac.fecha_envio_sgc || ac.fecha_creacion_borrador,
        estado: ac.estado,
        prioridad: 'Alta',
        tieneReplanteo,
        cambio,
        objeto_original: ac
      };
    });

  // Agregar los registros de Planes de Mejora que requieren atención de SGC
  const planesPendientes = planesMejora
    .filter(pm => {
      if (pm.estado === 'ENVIADO_SGC' || pm.estado === 'EN_REVISION' || pm.estado === 'SOLICITUD_CIERRE' || pm.estado === 'REVISION_AUDITOR') return true;
      if (solicitudesPendientes(pm).length) return true;
      const acts = leerActividades(pm);
      return acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
    })
    .map(pm => {
      const acts = leerActividades(pm);
      const tieneReplanteo = acts.some(a => a.solicitud_replanteo?.estado === 'PENDIENTE');
      const cambio = !tieneReplanteo ? solicitudesPendientes(pm)[0] || null : null;
      const subtipo = pm.estado === 'SOLICITUD_CIERRE' 
        ? 'Solicitud de Cierre' 
        : tieneReplanteo 
          ? 'Prórroga de Actividad' 
          : cambio
            ? 'Solicitud de Cambio'
            : 'Aprobación de Folio';
      return {
        id_original: pm.id,
        documento: pm.folio_codigo || pm.folio || 'Borrador',
        tipo: 'Plan de Mejora',
        subtipo,
        area: pm.area || pm.gerencia_coordinacion,
        fecha: cambio?.fecha_solicitud || pm.fecha_solicitud_cierre || pm.fecha_envio_sgc || pm.created_at,
        estado: pm.estado,
        prioridad: 'Media',
        tieneReplanteo,
        cambio,
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

  // Solicitud de cambio del área sobre una AC/PM aprobada: el SGC la aplica o la rechaza.
  const guardarRegistro = (app, nuevoObj) => {
    if (app.tipo === 'Acción Correctiva') setAccionesCorrectivas(accionesCorrectivas.map(a => a.id === app.id_original ? nuevoObj : a));
    else setPlanesMejora(planesMejora.map(p => p.id === app.id_original ? nuevoObj : p));
  };
  const moduloDe = (app) => (app.tipo === 'Acción Correctiva' ? 'ACCIONES_CORRECTIVAS' : 'PLANES_MEJORA');

  const aprobarCambio = async (app) => {
    const c = app.cambio;
    const { ok } = await confirmar({
      titulo: `Aprobar: ${TIPOS_CAMBIO[c.tipo]}`,
      mensaje: `${app.documento}${c.actividad_actual ? ` · Actividad: ${c.actividad_actual}` : ''}${c.propuesta?.actividad ? ` · Queda: ${c.propuesta.actividad} (${c.propuesta.responsable}, ${formatearFecha(c.propuesta.fecha_termino_sugerida)})` : ''} · Justificación: ${c.justificacion}`,
      textoAceptar: 'Aprobar cambio',
    });
    if (!ok) return;
    const { registro, error } = aprobarSolicitud(app.objeto_original, c.id, usuarioLogueado?.nombre || 'SGC');
    if (error) { mostrarMensaje(`No se aplicó: ${error}`); return; }
    guardarRegistro(app, registro);
    mostrarMensaje(`✓ Cambio aprobado y aplicado en ${app.documento}`);
    registrarMovimiento({ modulo: moduloDe(app), accion: 'APROBACION_CAMBIO', descripcion: `${TIPOS_CAMBIO[c.tipo]} aprobado en ${app.documento}`,
      detalles: `Solicitó ${c.solicitante}. Justificación: ${c.justificacion}`, folio: app.documento });
  };

  const rechazarCambio = async (app) => {
    const c = app.cambio;
    const { ok, valor: motivo } = await solicitar({
      titulo: `Rechazar: ${TIPOS_CAMBIO[c.tipo]}`, subtitulo: app.documento, etiqueta: 'Motivo del rechazo',
      placeholder: 'Indica al área por qué no procede el cambio...', textoAceptar: 'Rechazar', peligro: true,
    });
    if (!ok || !motivo) return;
    guardarRegistro(app, rechazarSolicitud(app.objeto_original, c.id, usuarioLogueado?.nombre || 'SGC', motivo));
    mostrarMensaje(`✕ Solicitud de cambio rechazada en ${app.documento}`);
    registrarMovimiento({ modulo: moduloDe(app), accion: 'RECHAZO_CAMBIO', descripcion: `${TIPOS_CAMBIO[c.tipo]} rechazado en ${app.documento}`,
      detalles: `Motivo: ${motivo}`, folio: app.documento });
  };

  const aprobarDocumento = async (app) => {
    if (!puedeAprobar) {
      mostrarMensaje('No tienes permiso para aprobar documentos en el SGC.');
      return;
    }

    if (app.tieneReplanteo) {
      // Aprobar replanteamiento de fecha de actividad
      if (app.tipo === 'Acción Correctiva') {
        const acts = leerActividades(app.objeto_original);
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
        const acts = leerActividades(app.objeto_original);
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

    // Solo se aprueba (y se asigna folio) lo que está en revisión. Una solicitud de cierre o revisión de auditor
    // tiene su propio paso en el módulo; aprobarla aquí reasignaba folio y borraba la solicitud.
    if (app.estado !== 'EN_REVISION') {
      mostrarMensaje(`${app.documento} está en "${app.subtipo}". Ese paso se atiende desde el módulo de ${app.tipo === 'Acción Correctiva' ? 'Acciones Correctivas' : 'Planes de Mejora'} (asignar auditor o dictamen).`);
      return;
    }
    if (app.tipo === 'Acción Correctiva') {
      let folioNumero, anio, folioCodigo;
      try { ({ numero: folioNumero, anio, codigo: folioCodigo } = await asignarFolio('AC')); } catch (e) { mostrarMensaje(`❌ ${e.message}`); return; }

      const nuevoObj = {
        ...app.objeto_original,
        estado: 'EN_SEGUIMIENTO',
        folio_numero: folioNumero,
        folio_codigo: folioCodigo,
        folio_sgc: folioCodigo,
        anio_folio: anio,
        fecha_aprobacion_sgc: new Date().toISOString(),
        fecha_apertura: new Date().toISOString(),
        aprobado_por_sgc: usuarioLogueado?.nombre || 'SGC',
        ...(fechaSeguimientoInicial(app.objeto_original) ? { fecha_seguimiento: fechaSeguimientoInicial(app.objeto_original) } : {})
      };

      setAccionesCorrectivas((prev) => (prev || []).map(a => a.id === app.id_original ? { ...a, ...nuevoObj, id: a.id } : a));
      mostrarMensaje(`✅ Acción Correctiva aprobada y en seguimiento. Folio: ${folioCodigo}`);
      registrarMovimiento({
        modulo: 'ACCIONES_CORRECTIVAS',
        accion: 'APROBACION',
        descripcion: `Aprobación oficial de Acción Correctiva y asignación de folio SGC ${folioCodigo}`,
        detalles: `Aprobado por ${usuarioLogueado?.nombre || 'SGC'} | Área: ${app.area || 'N/A'}`,
        folio: folioCodigo
      });

    } else if (app.tipo === 'Plan de Mejora') {
      let folioNumero, anio, folioCodigo;
      try { ({ numero: folioNumero, anio, codigo: folioCodigo } = await asignarFolio('PM')); } catch (e) { mostrarMensaje(`❌ ${e.message}`); return; }

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
        aprobado_por_sgc: usuarioLogueado?.nombre || 'SGC',
        ...(fechaSeguimientoInicial(app.objeto_original) ? { fecha_seguimiento: fechaSeguimientoInicial(app.objeto_original) } : {})
      };

      setPlanesMejora((prev) => (prev || []).map(p => p.id === app.id_original ? { ...p, ...nuevoObj, id: p.id } : p));
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
        const acts = leerActividades(app.objeto_original);
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
        const acts = leerActividades(app.objeto_original);
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

    const destino = app.estado === 'EN_REVISION' ? 'RECHAZADO' : 'EN_SEGUIMIENTO';
    const cambios = { estado: destino, observaciones_sgc: obs, comentarios_revision: obs };
    if (app.tipo === 'Acción Correctiva') {
      setAccionesCorrectivas((prev) => (prev || []).map(a => a.id === app.id_original ? { ...a, ...cambios } : a));
      mostrarMensaje(destino === 'RECHAZADO' ? 'Acción Correctiva devuelta al área con observaciones.' : 'Acción Correctiva regresada a seguimiento con observaciones.');
    } else if (app.tipo === 'Plan de Mejora') {
      setPlanesMejora((prev) => (prev || []).map(p => p.id === app.id_original ? { ...p, ...cambios } : p));
      mostrarMensaje(destino === 'RECHAZADO' ? 'Plan de Mejora devuelto al área con observaciones.' : 'Plan de Mejora regresado a seguimiento con observaciones.');
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
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo" className={LISTA_FILTRO}>
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
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Documento</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Tipo</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Área</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Fecha Envío</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Prioridad</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Estado</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700">Vencimiento</th>
                  <th scope="col" className="p-4 text-sm font-bold text-slate-700 text-center">Acciones SGC</th>
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
                                : app.subtipo === 'Solicitud de Cambio'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {app.subtipo === 'Prórroga de Actividad' && '🕒 '}
                            {app.subtipo === 'Solicitud de Cierre' && '🚀 '}
                            {app.subtipo}
                          </span>
                        )}
                        {app.cambio && (
                          <span className="mt-1 max-w-xs font-sans text-xs font-normal text-slate-700 whitespace-normal">
                            <strong>{TIPOS_CAMBIO[app.cambio.tipo]}</strong>{app.cambio.actividad_actual ? `: ${app.cambio.actividad_actual}` : app.cambio.propuesta?.actividad ? `: ${app.cambio.propuesta.actividad}` : ''}
                            <span className="block text-slate-600">“{app.cambio.justificacion}” · {app.cambio.solicitante}</span>
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
                      {formatearFecha(app.fecha) || '-'}
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
                      ) : app.cambio && puedeAprobar ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => aprobarCambio(app)} className="bg-sky-700 hover:bg-sky-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <Check size={14} strokeWidth={3} /> Aprobar cambio
                          </button>
                          <button onClick={() => rechazarCambio(app)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <X size={14} strokeWidth={3} /> Rechazar
                          </button>
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