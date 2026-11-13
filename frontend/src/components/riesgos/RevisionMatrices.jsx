// Bandeja del SGC: estado de la matriz de cada área en el año; revisar, devolver con observaciones o aceptar.
// Al aceptar, cada riesgo/oportunidad con plan genera su Plan de Mejora ligado (con folio y actividades).
import React, { useState } from 'react';
import { CheckCircle2, Undo2, Eye, RotateCcw, Search, Mail } from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { api } from '../../services/apiClient';
import { TIPOS_UNIDAD } from '../../constants/unidades';
import ModalConfirmacionResponsabilidadHumana from '../common/ModalConfirmacionResponsabilidadHumana';
import { useToast } from '../common/Toast';
import { asignarFolio } from '../../services/folioService';
import { formatearFecha } from '../../constants/workflow';
import { CLAVE_MATRIZ, ESTADOS_MATRIZ, nivelDe, puntaje, llevaPM, pmDesdeRiesgo, idMatriz } from '../../constants/riesgos';

export default function RevisionMatrices({ anio, areas, riesgos, setRiesgos, matrices, guardarMatriz, planesMejora, setPlanesMejora, usuarioLogueado, registrarMovimiento }) {
  const toast = useToast();
  const [abierta, setAbierta] = useState(null); // nombre del área
  const [observacion, setObservacion] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  // Filtros: estado (al tocar una tarjeta), búsqueda, dirección y tipo de unidad.
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [filtroDir, setFiltroDir] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [recordar, setRecordar] = useState(null); // { unidades, titulo, mensaje, enviando, resultado }

  const filas = areas.map((a) => {
    const m = matrices.find((x) => x.id === idMatriz(a.nombre, anio));
    const items = riesgos.filter((r) => r.area === a.nombre && Number(r.anio) === Number(anio));
    return { area: a.nombre, direccion: a.direccion, tipo: a.tipo || 'area', estado: m?.estado || (items.length ? 'BORRADOR' : null), m, items,
      correos: [...new Set([a.correo, ...(a.encargados_sgc || [])].filter(Boolean))] };
  });
  const orden = { ENVIADA: 0, OBSERVADA: 1, BORRADOR: 2, null: 3, ACEPTADA: 4 };
  filas.sort((a, b) => orden[a.estado] - orden[b.estado] || a.area.localeCompare(b.area, 'es'));
  const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = sinAcentos(busqueda.trim());
  // Los conteos de las tarjetas respetan búsqueda, dirección y tipo (no el estado).
  const base = filas.filter((f) => (!q || sinAcentos(`${f.area} ${f.direccion}`).includes(q))
    && (!filtroDir || f.direccion === filtroDir) && (!filtroTipo || f.tipo === filtroTipo));
  const conteo = (e) => base.filter((f) => f.estado === e).length;
  const visibles = filtroEstado === 'TODAS' ? base : base.filter((f) => String(f.estado) === filtroEstado);
  const direccionesLista = [...new Set(filas.map((f) => f.direccion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const pendientes = base.filter((f) => [null, 'BORRADOR', 'OBSERVADA'].includes(f.estado));
  const fila = filas.find((f) => f.area === abierta);

  const abrirRecordatorio = () => setRecordar({
    unidades: pendientes.map((f) => ({ ...f, elegida: f.correos.length > 0 })),
    titulo: `Matriz de riesgos y oportunidades ${anio}`,
    mensaje: `Les recordamos registrar y enviar al SGC su matriz de riesgos y oportunidades ${anio} (formato ${CLAVE_MATRIZ}) en el Portal SGC: al menos un riesgo con su evaluación y, si es medio o alto, su plan de acción. Si tienen dudas, respondan este correo.`,
  });
  const enviarRecordatorio = async () => {
    const envios = recordar.unidades.filter((u) => u.elegida && u.correos.length).map((u) => ({ unidad: u.area, destinatarios: u.correos }));
    if (!envios.length) return toast.warning('Elige al menos una unidad con correo.');
    setRecordar({ ...recordar, enviando: true });
    const r = await api.post('/api/v1/notificaciones/recordatorios', { titulo: recordar.titulo.trim(), mensaje: recordar.mensaje.trim(), envios }, { timeoutMs: 180000 });
    if (!r.ok) { setRecordar({ ...recordar, enviando: false }); return toast.error(r.error?.message || r.error?.detail || 'No se pudieron enviar los recordatorios.'); }
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'RECORDATORIO_MANUAL', descripcion: `Recordatorio manual de la matriz ${anio} a ${r.data.enviados} unidad(es)`, detalles: r.data.resultados.map((x) => `${x.unidad}: ${x.enviado ? 'enviado' : x.error}`).join('; '), folio: `${CLAVE_MATRIZ}-${anio}` });
    setRecordar({ ...recordar, enviando: false, resultado: r.data });
  };

  const devolver = () => {
    if (observacion.trim().length < 10) { toast.warning('Escribe la observación para el área (mínimo 10 caracteres).'); return; }
    const obs = [...(fila.m?.observaciones || []), { texto: observacion.trim(), por: usuarioLogueado?.nombre || 'SGC', fecha: new Date().toISOString() }];
    guardarMatriz({ ...fila.m, estado: 'OBSERVADA', observaciones: obs });
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'OBSERVACION_MATRIZ', descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${fila.area} devuelta con observaciones`, detalles: observacion.trim(), folio: `${CLAVE_MATRIZ}-${anio}` });
    setObservacion(''); setAbierta(null);
    toast.success('Matriz devuelta al área con observaciones.');
  };

  const aceptar = (ratificacion) => {
    // Evita aceptar dos veces (doble clic u otro administrador con la pantalla abierta).
    const vigente = matrices.find((x) => x.id === idMatriz(fila.area, anio));
    if (aceptando || vigente?.estado !== 'ENVIADA') { toast.warning('Esta matriz ya no está en revisión.'); setConfirmar(false); return; }
    setAceptando(true);
    const por = usuarioLogueado?.nombre || 'SGC';
    const ficha = areas.find((a) => a.nombre === fila.area) || {};
    const correos = [...new Set([ficha.correo, ...(ficha.encargados_sgc || [])].filter(Boolean))];
    let lista = [...planesMejora];
    const nuevos = [];
    const cambios = {};
    fila.items.forEach((r) => {
      if (llevaPM(r) && !r.pm_id) {
        const folio = asignarFolio('PM', lista);
        const pm = pmDesdeRiesgo(r, { folio, por, correos });
        lista = [...lista, pm];
        nuevos.push(pm);
        cambios[r.id] = { estado: 'EN_TRATAMIENTO', pm_id: pm.id, pm_folio: pm.folio_codigo };
      } else if (!r.pm_id) {
        cambios[r.id] = { estado: 'MONITOREO' };
      }
    });
    if (nuevos.length) setPlanesMejora((prev) => [...prev, ...nuevos]);
    setRiesgos((prev) => prev.map((r) => (cambios[r.id] ? { ...r, ...cambios[r.id] } : r)));
    guardarMatriz({ ...fila.m, estado: 'ACEPTADA', aceptado_por: por, fecha_aceptacion: new Date().toISOString(), ratificacion_aceptacion: ratificacion });
    registrarMovimiento?.({
      modulo: 'RIESGOS', accion: 'ACEPTACION_MATRIZ',
      descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${fila.area} aceptada; ${nuevos.length} plan(es) de mejora generados (${nuevos.map((p) => p.folio_codigo).join(', ') || 'ninguno'})`,
      folio: `${CLAVE_MATRIZ}-${anio}`,
    });
    setConfirmar(false); setAbierta(null); setAceptando(false);
    toast.success(`Matriz aceptada. ${nuevos.length} plan(es) de mejora generados.`);
  };

  // Reabrir una matriz aceptada (p. ej. agregar un riesgo a mitad de año). Lo que ya tiene PM no se edita.
  const reabrir = () => {
    if (observacion.trim().length < 10) { toast.warning('Escribe el motivo para reabrir (mínimo 10 caracteres).'); return; }
    const obs = [...(fila.m?.observaciones || []), { texto: `Matriz reabierta: ${observacion.trim()}`, por: usuarioLogueado?.nombre || 'SGC', fecha: new Date().toISOString() }];
    guardarMatriz({ ...fila.m, estado: 'OBSERVADA', observaciones: obs });
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'REAPERTURA_MATRIZ', descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${fila.area} reabierta por el SGC`, detalles: observacion.trim(), folio: `${CLAVE_MATRIZ}-${anio}` });
    setObservacion(''); setAbierta(null);
    toast.success('Matriz reabierta: el área puede agregar o corregir registros y volver a enviarla.');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {[['TODAS', 'Todas', null], ['ENVIADA', 'Por revisar', 'ENVIADA'], ['OBSERVADA', 'Con observaciones', 'OBSERVADA'], ['BORRADOR', 'En captura', 'BORRADOR'], ['null', 'Sin iniciar', null], ['ACEPTADA', 'Aceptadas', 'ACEPTADA']].map(([id, l, e]) => (
          <button key={id} type="button" aria-pressed={filtroEstado === id} onClick={() => setFiltroEstado(id)}
            className={`text-left rounded-xl border-2 p-3 transition-colors ${filtroEstado === id ? 'border-marca-azul-oscuro bg-sky-50' : 'border-slate-200 bg-white hover:border-marca-azul'}`}>
            <p className="text-2xl font-black text-slate-900">{id === 'TODAS' ? base.length : conteo(e)}</p>
            <p className="text-[11px] font-semibold text-slate-600">{l}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <label className="relative flex-1 min-w-[14rem]">
          <span className="sr-only">Buscar unidad</span>
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar área, subdirección o dirección…" className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg" />
        </label>
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">Dirección
          <select value={filtroDir} onChange={(e) => setFiltroDir(e.target.value)} className="p-2 bg-white border rounded-lg text-xs font-semibold max-w-[14rem]">
            <option value="">Todas</option>
            {direccionesLista.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">Tipo
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="p-2 bg-white border rounded-lg text-xs font-semibold">
            <option value="">Todos</option>
            {Object.entries(TIPOS_UNIDAD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button type="button" onClick={abrirRecordatorio} disabled={!pendientes.length}
          className="px-3.5 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5">
          <Mail size={14} /> Recordar a pendientes ({pendientes.length})
        </button>
      </div>

      {fila && (
        <section className="bg-white rounded-xl border-2 border-sky-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">{fila.area} · {CLAVE_MATRIZ} {anio}</h3>
            <button type="button" onClick={() => setAbierta(null)} className="text-xs text-slate-600 hover:underline">Cerrar</button>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <caption className="sr-only">Registros de la matriz de {fila.area}</caption>
              <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
                <tr>
                  <th scope="col" className="p-2">Nivel</th><th scope="col" className="p-2">Tipo</th><th scope="col" className="p-2">Descripción</th>
                  <th scope="col" className="p-2">Proceso</th><th scope="col" className="p-2">Contexto</th><th scope="col" className="p-2">Causa / consecuencia</th>
                  <th scope="col" className="p-2">Tratamiento</th><th scope="col" className="p-2">Plan (responsable, fecha)</th><th scope="col" className="p-2">Plan de mejora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {[...fila.items].sort((a, b) => puntaje(b) - puntaje(a)).map((r) => (
                  <tr key={r.id}>
                    <td className="p-2"><span className={`inline-block w-14 text-center px-1.5 py-0.5 rounded-md font-black border ${nivelDe(r)?.suave || 'bg-white text-slate-600 border-slate-200'}`}>{puntaje(r) || '—'}<span className="block text-[9px] font-bold">{nivelDe(r)?.nivel || ''}</span></span></td>
                    <td className="p-2 font-semibold">{r.tipo}{r.sugerido_ia && <span className="block text-[10px] font-normal text-violet-700">sugerido IA</span>}</td>
                    <td className="p-2 text-slate-900 min-w-[12rem]">{r.descripcion}</td>
                    <td className="p-2 text-slate-700">{r.proceso || '—'}</td>
                    <td className="p-2 text-slate-700">{r.contexto || '—'}{r.contexto_resultado && <span className="block text-slate-500">{r.contexto_resultado}</span>}</td>
                    <td className="p-2 text-slate-700 min-w-[10rem]">{r.causa || '—'}{r.consecuencia && <span className="block text-slate-500">{r.tipo === 'Riesgo' ? 'Consecuencia' : 'Beneficio'}: {r.consecuencia}</span>}</td>
                    <td className="p-2 text-slate-700">{r.tratamiento || '—'}</td>
                    <td className="p-2 text-slate-700 min-w-[12rem]">{(r.plan || []).length ? <ul className="list-disc pl-4">{r.plan.map((a, k) => <li key={k}>{a.actividad} ({a.responsable || <span className="font-bold text-amber-700">sin responsable</span>}, {a.fecha_termino_sugerida ? formatearFecha(a.fecha_termino_sugerida) : <span className="font-bold text-amber-700">sin fecha</span>})</li>)}</ul> : '—'}</td>
                    <td className="p-2">{r.pm_folio
                      ? <span className="font-mono font-bold text-sky-700">{r.pm_folio}</span>
                      : llevaPM(r)
                        ? <span className="text-[11px] font-semibold text-slate-700">Se genera con folio al aceptar la matriz</span>
                        : <span className="text-[11px] text-slate-500">No lleva (monitoreo)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {['BORRADOR', 'OBSERVADA'].includes(fila.estado) && (
            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Esta matriz sigue en captura del área: los planes son la propuesta. Cuando el área la envíe y el SGC la acepte, cada plan se convierte en un Plan de Mejora con folio para su seguimiento.
            </p>
          )}
          {fila.estado === 'ACEPTADA' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Motivo para reabrir la matriz
                <textarea rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} className="mt-1 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs normal-case font-normal tracking-normal" />
              </label>
              <button type="button" onClick={reabrir} className="px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1"><RotateCcw size={14} /> Reabrir</button>
            </div>
          )}
          {fila.estado === 'ENVIADA' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Observaciones para el área (si se devuelve)
                <textarea rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} className="mt-1 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs normal-case font-normal tracking-normal" />
              </label>
              <div className="flex md:flex-col gap-2">
                <button type="button" onClick={devolver} className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 inline-flex items-center gap-1"><Undo2 size={14} /> Devolver</button>
                <button type="button" disabled={aceptando} onClick={() => setConfirmar(true)} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 disabled:opacity-40 rounded-lg hover:bg-emerald-800 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Aceptar</button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
            <tr><th scope="col" className="p-3">Unidad</th><th scope="col" className="p-3">Dirección</th><th scope="col" className="p-3">Estado</th><th scope="col" className="p-3 text-center">Riesgos</th><th scope="col" className="p-3 text-center">Oportunidades</th><th scope="col" className="p-3 text-center">Altos</th><th scope="col" className="p-3">Enviada</th><th scope="col" className="p-3 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">Ninguna unidad coincide con los filtros.</td></tr>}
            {visibles.map((f) => (
              <tr key={f.area} className={f.estado === 'ENVIADA' ? 'bg-sky-50/40' : ''}>
                <td className="p-3 font-semibold text-slate-900">{f.area}<span className="block text-[11px] font-normal text-slate-500">{TIPOS_UNIDAD[f.tipo] || 'Área'}</span></td>
                <td className="p-3 text-slate-600">{(f.direccion || '').replace(/^Dir\.\s*/, '')}</td>
                <td className="p-3">{f.estado ? <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_MATRIZ[f.estado].color}`}>{ESTADOS_MATRIZ[f.estado].label}</span> : <span className="text-slate-500">Sin iniciar</span>}</td>
                <td className="p-3 text-center">{f.items.filter((r) => r.tipo === 'Riesgo').length}</td>
                <td className="p-3 text-center">{f.items.filter((r) => r.tipo === 'Oportunidad').length}</td>
                <td className="p-3 text-center font-bold text-rose-700">{f.items.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').length || ''}</td>
                <td className="p-3 text-slate-600">{f.m?.fecha_envio ? formatearFecha(f.m.fecha_envio) : '—'}</td>
                <td className="p-3 text-right">
                  {f.items.length > 0 && (
                    <button type="button" onClick={() => { setAbierta(f.area); setObservacion(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1"><Eye size={12} /> {f.estado === 'ENVIADA' ? 'Revisar' : 'Ver'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {fila && (
        <ModalConfirmacionResponsabilidadHumana
          isOpen={confirmar}
          onClose={() => setConfirmar(false)}
          onConfirmar={aceptar}
          tipo="MATRIZ_RIESGOS"
          registro={{ folio: `${CLAVE_MATRIZ} ${anio}`, area: fila.area, proceso: 'Aceptación SGC', titulo_mejora: `Se aceptará la matriz y se generarán ${fila.items.filter((r) => llevaPM(r) && !r.pm_id).length} plan(es) de mejora ligados a sus riesgos y oportunidades.` }}
          actividades={fila.items.flatMap((r) => r.plan || [])}
          usuarioLogueado={usuarioLogueado}
          textoBoton="Confirmar y aceptar la matriz"
          declaracion="como responsable del Sistema de Gestión de la Calidad, declaro que revisé la matriz OOMRSC-37 del área, que sus riesgos y oportunidades están identificados y evaluados conforme a los criterios del formato, y que los planes de mejora que se generan tendrán seguimiento del SGC hasta su cierre y dictamen de eficacia."
        />
      )}
      {recordar && (
        <ContenedorModal isOpen onClose={() => !recordar.enviando && setRecordar(null)} titulo="Recordatorio manual a unidades pendientes" anchoMaximo="max-w-2xl">
          {recordar.resultado ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">{recordar.resultado.enviados} de {recordar.resultado.resultados.length} recordatorio(s) enviados.</p>
              <ul className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {recordar.resultado.resultados.map((x) => <li key={x.unidad} className="px-3 py-1.5"><strong>{x.unidad}</strong> · {x.enviado ? 'enviado' : <span className="text-rose-700">{x.error}</span>}</li>)}
              </ul>
              <div className="flex justify-end"><button type="button" onClick={() => setRecordar(null)} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg">Listo</button></div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">Asunto
                <input value={recordar.titulo} onChange={(e) => setRecordar({ ...recordar, titulo: e.target.value })} className="mt-1 w-full p-2 text-sm border rounded-lg" />
              </label>
              <label className="block text-xs font-bold text-slate-800">Mensaje
                <textarea rows={4} value={recordar.mensaje} onChange={(e) => setRecordar({ ...recordar, mensaje: e.target.value })} className="mt-1 w-full p-2 text-sm border rounded-lg font-normal" />
              </label>
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">Unidades ({recordar.unidades.filter((u) => u.elegida).length} de {recordar.unidades.length})</p>
                <ul className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {recordar.unidades.map((u, i) => (
                    <li key={u.area} className="px-3 py-1.5 text-xs flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5" disabled={!u.correos.length} checked={u.elegida}
                        onChange={(e) => setRecordar({ ...recordar, unidades: recordar.unidades.map((x, k) => (k === i ? { ...x, elegida: e.target.checked } : x)) })} />
                      <span><strong className="text-slate-900">{u.area}</strong> · {u.estado ? ESTADOS_MATRIZ[u.estado].label : 'Sin iniciar'}
                        <span className="block text-slate-500">{u.correos.join(', ') || 'Sin correo registrado en el catálogo'}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRecordar(null)} disabled={recordar.enviando} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="button" onClick={enviarRecordatorio} disabled={recordar.enviando} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"><Mail size={14} /> {recordar.enviando ? 'Enviando…' : 'Enviar recordatorios'}</button>
              </div>
            </div>
          )}
        </ContenedorModal>
      )}
    </div>
  );
}
