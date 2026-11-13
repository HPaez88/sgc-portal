// Seguimiento de riesgos y oportunidades: su plan de mejora ligado, vencimiento y estado.
// Cuando el auditor cierra el PM, el SGC dictamina la eficacia reevaluando el riesgo (segunda confirmación).
import React, { useState } from 'react';
import { Gavel, RotateCcw } from 'lucide-react';
import Dialogos, { useDialogos } from '../common/Dialogos';
import ModalConfirmacionResponsabilidadHumana from '../common/ModalConfirmacionResponsabilidadHumana';
import { useToast } from '../common/Toast';
import { getVencimiento, formatearFecha, esAdminSGC } from '../../constants/workflow';
import { getEstadoLabel } from '../../constants';
import { ESCALAS, ESTADOS_RIESGO, nivelDe, puntaje, estadoRiesgo, sugerirEficacia } from '../../constants/riesgos';

function Chips({ titulo, opciones, valor, onElegir }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">{titulo}</p>
      <div className="flex gap-1">
        {opciones.map(([n, nombre]) => (
          <button key={n} type="button" title={nombre} onClick={() => onElegir(n)}
            className={`w-9 h-9 rounded-lg border text-sm font-bold ${valor === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

export default function SeguimientoRiesgos({ items, setRiesgos, planesMejora, usuarioLogueado, registrarMovimiento, onVerPM, onReplantear }) {
  const toast = useToast();
  const { solicitar, props: propsDialogos } = useDialogos();
  const pedirReplanteo = async (r) => {
    const { ok, valor } = await solicitar({ titulo: 'Replantear con un nuevo plan', etiqueta: 'Motivo (le llega al área como observación)', textoAceptar: 'Regresar al área' });
    if (!ok) return;
    if (String(valor).trim().length < 10) { toast.warning('Escribe el motivo (mínimo 10 caracteres).'); return; }
    onReplantear?.(r, String(valor).trim());
    toast.success('El registro regresó al área para definir un nuevo plan.');
  };
  const [filtroEstado, setFiltroEstado] = useState('ACTIVOS');
  const [dictamen, setDictamen] = useState(null); // { r, probabilidad, impacto, resultado, nota }
  const [confirmar, setConfirmar] = useState(false);
  const esAdmin = esAdminSGC(usuarioLogueado);

  const todas = items.map((r) => {
    const pm = planesMejora.find((p) => String(p.id) === String(r.pm_id));
    return { r, pm, estado: estadoRiesgo(r, planesMejora), venc: pm ? getVencimiento(pm) : null };
  }).filter((f) => f.estado !== 'IDENTIFICADO'); // lo que sigue en captura vive en la matriz, no aquí
  const pasa = (f, filtro) => {
    if (filtro === 'ACTIVOS') return !String(f.estado).startsWith('CERRADO') && f.estado !== 'MONITOREO';
    if (filtro === 'TODOS') return true;
    return f.estado === filtro;
  };
  const filas = todas.filter((f) => pasa(f, filtroEstado)).sort((a, b) => (a.estado === 'PENDIENTE_DICTAMEN' ? -1 : 0) - (b.estado === 'PENDIENTE_DICTAMEN' ? -1 : 0) || puntaje(b.r) - puntaje(a.r));

  const abrirDictamen = (r) => setDictamen({ r, probabilidad: Number(r.probabilidad), impacto: Number(r.impacto), resultado: '', nota: '' });
  const sugerido = dictamen ? sugerirEficacia(dictamen.r, dictamen) : null;

  const dictaminar = (ratificacion) => {
    const { r } = dictamen;
    const resultado = dictamen.resultado || sugerido;
    const cambio = {
      estado: resultado === 'EFICAZ' ? 'CERRADO_EFICAZ' : 'CERRADO_NO_EFICAZ',
      residual: { probabilidad: dictamen.probabilidad, impacto: dictamen.impacto },
      dictamen: { resultado, nota: dictamen.nota.trim(), por: usuarioLogueado?.nombre || 'SGC', fecha: new Date().toISOString(), ratificacion },
    };
    setRiesgos((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...cambio } : x)));
    registrarMovimiento?.({
      modulo: 'RIESGOS', accion: 'DICTAMEN_EFICACIA',
      descripcion: `${r.tipo} "${r.descripcion}" (${r.area}) dictaminado ${resultado === 'EFICAZ' ? 'EFICAZ' : 'NO EFICAZ'}: nivel ${puntaje(r)} → ${dictamen.probabilidad * dictamen.impacto}`,
      detalles: dictamen.nota.trim(), folio: r.pm_folio || '',
    });
    setConfirmar(false); setDictamen(null);
    toast.success('Dictamen registrado.');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mostrar</span>
        {[['ACTIVOS', 'En curso'], ['PENDIENTE_DICTAMEN', 'Por dictaminar'], ['PM_NO_ENCONTRADO', 'Sin plan de mejora'], ['MONITOREO', 'En monitoreo'], ['CERRADO_EFICAZ', 'Eficaces'], ['CERRADO_NO_EFICAZ', 'No eficaces'], ['TODOS', 'Todos']]
          .map(([v, l]) => [v, l, todas.filter((f) => pasa(f, v)).length])
          .filter(([v, , n]) => n > 0 || ['ACTIVOS', 'TODOS', filtroEstado].includes(v)) // no mostrar filtros vacíos
          .map(([v, l, n]) => (
          <button key={v} type="button" onClick={() => setFiltroEstado(v)}
            aria-pressed={filtroEstado === v}
            className={`px-3 py-1 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 ${filtroEstado === v ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>
            {l}<span className={`text-[10px] font-extrabold ${filtroEstado === v ? 'text-white/80' : 'text-slate-500'}`}>{n}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
            <tr><th scope="col" className="p-3">Nivel</th><th scope="col" className="p-3">Riesgo / oportunidad</th><th scope="col" className="p-3">Área</th><th scope="col" className="p-3">Plan de mejora</th><th scope="col" className="p-3">Vencimiento</th><th scope="col" className="p-3">Estado</th><th scope="col" className="p-3 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center">
                {todas.length === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Todavía no hay riesgos ni oportunidades en seguimiento.</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">Aparecen aquí cuando el SGC acepta la matriz de un área: cada riesgo u oportunidad con plan se vuelve un Plan de Mejora y se sigue desde esta lista hasta su dictamen de eficacia.</p>
                  </>
                ) : <p className="text-sm text-slate-500">No hay registros con este filtro.</p>}
              </td></tr>
            )}
            {filas.map(({ r, pm, estado, venc }) => (
              <tr key={r.id} className={estado === 'PENDIENTE_DICTAMEN' ? 'bg-violet-50/50' : ''}>
                <td className="p-3"><span className={`inline-block w-14 text-center px-1.5 py-0.5 rounded-md font-black border ${nivelDe(r)?.suave || ''}`}>{puntaje(r)}<span className="block text-[9px] font-bold">{nivelDe(r)?.nivel || ''}</span></span></td>
                <td className="p-3 max-w-md"><span className="text-[10px] font-bold uppercase text-slate-500">{r.tipo}</span><br /><span className="text-slate-900 font-medium">{r.descripcion}</span></td>
                <td className="p-3 text-slate-700">{r.area}<span className="block text-[11px] text-slate-500">{r.anio}</span></td>
                <td className="p-3">
                  {pm ? (
                    <button type="button" onClick={() => onVerPM?.(pm)} className="font-mono font-bold text-sky-700 hover:underline text-left">
                      {pm.folio_codigo}<br /><span className="font-sans font-normal text-[11px] text-slate-600">{getEstadoLabel(pm.estado)}{pm.resultado_cierre ? ` · auditor: ${pm.resultado_cierre}` : ''}</span>
                    </button>
                  ) : <span className="text-slate-500">{r.tratamiento || '—'}</span>}
                </td>
                <td className="p-3">{venc && venc.nivel !== 'cerrado' ? <span className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-bold border ${venc.color}`}>{venc.label}</span> : <span className="text-slate-400">—</span>}</td>
                <td className="p-3"><span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_RIESGO[estado]?.color || ''}`}>{ESTADOS_RIESGO[estado]?.label || estado}</span>
                  {r.dictamen && <span className="block text-[10px] text-slate-500 mt-0.5">{formatearFecha(r.dictamen.fecha)} · nivel {puntaje(r)} → {puntaje(r.residual)}</span>}
                </td>
                <td className="p-3 text-right">
                  {estado === 'CERRADO_NO_EFICAZ' && esAdmin && onReplantear && (
                    <button type="button" onClick={() => pedirReplanteo(r)} className="px-2.5 py-1 rounded-md font-bold text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 inline-flex items-center gap-1"><RotateCcw size={12} /> Replantear</button>
                  )}
                  {['PENDIENTE_DICTAMEN', 'PM_NO_ENCONTRADO'].includes(estado) && esAdmin && (
                    <button type="button" onClick={() => abrirDictamen(r)} className="px-2.5 py-1 rounded-md font-bold text-white bg-violet-700 hover:bg-violet-800 inline-flex items-center gap-1"><Gavel size={12} /> Dictaminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dictamen && (
        <section className="bg-white rounded-xl border-2 border-violet-200 p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Dictamen de eficacia · {dictamen.r.descripcion}</h3>
          <p className="text-xs text-slate-600">El auditor cerró el plan de mejora. {dictamen.r.tipo === 'Riesgo' ? 'Reevalúa el riesgo después de las acciones: si su nivel bajó, el tratamiento fue eficaz.' : 'Indica si la oportunidad se aprovechó.'}</p>
          <div className="flex flex-wrap items-end gap-4">
            <Chips titulo={ESCALAS[dictamen.r.tipo].ejeY + ' (ahora)'} opciones={ESCALAS[dictamen.r.tipo].probabilidad} valor={dictamen.probabilidad} onElegir={(n) => setDictamen({ ...dictamen, probabilidad: n })} />
            <Chips titulo={ESCALAS[dictamen.r.tipo].ejeX + ' (ahora)'} opciones={ESCALAS[dictamen.r.tipo].impacto} valor={dictamen.impacto} onElegir={(n) => setDictamen({ ...dictamen, impacto: n })} />
            <p className="text-sm text-slate-700">Nivel <strong>{puntaje(dictamen.r)}</strong> → <strong>{dictamen.probabilidad * dictamen.impacto}</strong>{sugerido && <> · sugerido: <strong>{sugerido === 'EFICAZ' ? 'Eficaz' : 'No eficaz'}</strong></>}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[['EFICAZ', 'Eficaz'], ['NO_EFICAZ', 'No eficaz']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setDictamen({ ...dictamen, resultado: v })}
                className={`px-4 py-1.5 rounded-lg border text-xs font-bold ${(dictamen.resultado || sugerido) === v ? (v === 'EFICAZ' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-rose-700 text-white border-rose-700') : 'bg-white text-slate-700 border-slate-200'}`}>{l}</button>
            ))}
          </div>
          <textarea rows={2} value={dictamen.nota} onChange={(e) => setDictamen({ ...dictamen, nota: e.target.value })} placeholder="Fundamento del dictamen (evidencia revisada, resultado del auditor)" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDictamen(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="button" disabled={!(dictamen.resultado || sugerido) || dictamen.nota.trim().length < 10}
              onClick={() => setConfirmar(true)} className="px-4 py-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-40 rounded-lg">Registrar dictamen</button>
          </div>
        </section>
      )}

      <Dialogos {...propsDialogos} />
      {dictamen && (
        <ModalConfirmacionResponsabilidadHumana
          isOpen={confirmar}
          onClose={() => setConfirmar(false)}
          onConfirmar={dictaminar}
          tipo="MATRIZ_RIESGOS"
          registro={{ folio: dictamen.r.pm_folio || '', area: dictamen.r.area, proceso: 'Dictamen de eficacia (segunda confirmación)', titulo_mejora: `${dictamen.r.descripcion} · ${(dictamen.resultado || sugerido) === 'EFICAZ' ? 'EFICAZ' : 'NO EFICAZ'} · nivel ${puntaje(dictamen.r)} → ${dictamen.probabilidad * dictamen.impacto}` }}
          usuarioLogueado={usuarioLogueado}
          textoBoton="Confirmar dictamen"
          declaracion="como responsable del Sistema de Gestión de la Calidad, declaro que revisé el cierre del plan de mejora y la evidencia presentada, y que el dictamen de eficacia que registro refleja la reevaluación real del riesgo u oportunidad."
        />
      )}
    </div>
  );
}
