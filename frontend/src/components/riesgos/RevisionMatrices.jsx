// Bandeja del SGC: estado de la matriz de cada área en el año; revisar, devolver con observaciones o aceptar.
// Al aceptar, cada riesgo/oportunidad con plan genera su Plan de Mejora ligado (con folio y actividades).
import React, { useState } from 'react';
import { CheckCircle2, Undo2, Eye } from 'lucide-react';
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

  const filas = areas.map((a) => {
    const m = matrices.find((x) => x.id === idMatriz(a.nombre, anio));
    const items = riesgos.filter((r) => r.area === a.nombre && Number(r.anio) === Number(anio));
    return { area: a.nombre, direccion: a.direccion, estado: m?.estado || (items.length ? 'BORRADOR' : null), m, items };
  });
  const orden = { ENVIADA: 0, OBSERVADA: 1, BORRADOR: 2, null: 3, ACEPTADA: 4 };
  filas.sort((a, b) => orden[a.estado] - orden[b.estado] || a.area.localeCompare(b.area, 'es'));
  const conteo = (e) => filas.filter((f) => f.estado === e).length;
  const fila = filas.find((f) => f.area === abierta);

  const devolver = () => {
    if (observacion.trim().length < 10) { toast.warning('Escribe la observación para el área (mínimo 10 caracteres).'); return; }
    const obs = [...(fila.m?.observaciones || []), { texto: observacion.trim(), por: usuarioLogueado?.nombre || 'SGC', fecha: new Date().toISOString() }];
    guardarMatriz({ ...fila.m, estado: 'OBSERVADA', observaciones: obs });
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'OBSERVACION_MATRIZ', descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${fila.area} devuelta con observaciones`, detalles: observacion.trim(), folio: `${CLAVE_MATRIZ}-${anio}` });
    setObservacion(''); setAbierta(null);
    toast.success('Matriz devuelta al área con observaciones.');
  };

  const aceptar = (ratificacion) => {
    const por = usuarioLogueado?.nombre || 'SGC';
    let lista = [...planesMejora];
    const nuevos = [];
    const cambios = {};
    fila.items.forEach((r) => {
      if (llevaPM(r) && !r.pm_id) {
        const folio = asignarFolio('PM', lista);
        const pm = pmDesdeRiesgo(r, { folio, por });
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
    setConfirmar(false); setAbierta(null);
    toast.success(`Matriz aceptada. ${nuevos.length} plan(es) de mejora generados.`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[['ENVIADA', 'Por revisar'], ['OBSERVADA', 'Con observaciones'], ['BORRADOR', 'En captura'], [null, 'Sin iniciar'], ['ACEPTADA', 'Aceptadas']].map(([e, l]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-2xl font-black text-slate-900">{conteo(e)}</p>
            <p className="text-[11px] font-semibold text-slate-600">{l}</p>
          </div>
        ))}
      </div>

      {fila && (
        <section className="bg-white rounded-xl border-2 border-sky-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">{fila.area} · {CLAVE_MATRIZ} {anio}</h3>
            <button type="button" onClick={() => setAbierta(null)} className="text-xs text-slate-600 hover:underline">Cerrar</button>
          </div>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {[...fila.items].sort((a, b) => puntaje(b) - puntaje(a)).map((r) => (
              <li key={r.id} className="p-3 flex gap-3">
                <span className={`shrink-0 w-12 h-fit text-center px-2 py-1 rounded-lg text-xs font-black border ${nivelDe(r)?.suave || 'bg-white text-slate-600 border-slate-200'}`}>{puntaje(r) || '—'}</span>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-slate-900">{r.tipo}: {r.descripcion}</p>
                  <p className="text-slate-600">{[r.causa && `Causa: ${r.causa}`, r.consecuencia && `${r.tipo === 'Riesgo' ? 'Consecuencia' : 'Beneficio'}: ${r.consecuencia}`].filter(Boolean).join(' · ')}</p>
                  <p className="text-slate-600">{r.tratamiento || 'Sin tratamiento'}{(r.plan || []).length ? ` · ${r.plan.map((a) => `${a.actividad} (${a.responsable}, ${formatearFecha(a.fecha_termino_sugerida)})`).join('; ')}` : ''}</p>
                  {r.pm_folio && <p className="text-sky-700 font-semibold">Plan de mejora {r.pm_folio}</p>}
                </div>
              </li>
            ))}
          </ul>
          {fila.estado === 'ENVIADA' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Observaciones para el área (si se devuelve)
                <textarea rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} className="mt-1 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs normal-case font-normal tracking-normal" />
              </label>
              <div className="flex md:flex-col gap-2">
                <button type="button" onClick={devolver} className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 inline-flex items-center gap-1"><Undo2 size={14} /> Devolver</button>
                <button type="button" onClick={() => setConfirmar(true)} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Aceptar</button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
            <tr><th className="p-3">Área</th><th className="p-3">Dirección</th><th className="p-3">Estado</th><th className="p-3 text-center">Riesgos</th><th className="p-3 text-center">Oportunidades</th><th className="p-3 text-center">Altos</th><th className="p-3">Enviada</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((f) => (
              <tr key={f.area} className={f.estado === 'ENVIADA' ? 'bg-sky-50/40' : ''}>
                <td className="p-3 font-semibold text-slate-900">{f.area}</td>
                <td className="p-3 text-slate-600">{(f.direccion || '').replace(/^Dir\.\s*/, '')}</td>
                <td className="p-3">{f.estado ? <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_MATRIZ[f.estado].color}`}>{ESTADOS_MATRIZ[f.estado].label}</span> : <span className="text-slate-500">Sin iniciar</span>}</td>
                <td className="p-3 text-center">{f.items.filter((r) => r.tipo === 'Riesgo').length}</td>
                <td className="p-3 text-center">{f.items.filter((r) => r.tipo === 'Oportunidad').length}</td>
                <td className="p-3 text-center font-bold text-rose-700">{f.items.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').length || ''}</td>
                <td className="p-3 text-slate-600">{f.m?.fecha_envio ? formatearFecha(f.m.fecha_envio) : '—'}</td>
                <td className="p-3 text-right">
                  {f.items.length > 0 && (
                    <button type="button" onClick={() => { setAbierta(f.area); setObservacion(''); }} className="text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1"><Eye size={12} /> {f.estado === 'ENVIADA' ? 'Revisar' : 'Ver'}</button>
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
        />
      )}
    </div>
  );
}
