// Matriz anual de riesgos y oportunidades de una unidad (OOMRSC-37): captura, envío al SGC y observaciones.
// La matriz solo enlista (tabla por tipo); cada registro se captura o consulta en una ventana emergente.
// El SGC puede ajustar cualquier registro no dictaminado y aceptar la matriz aquí mismo (genera los planes de mejora).
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Send, CheckCircle2, Trash2, MessageSquareWarning, ShieldAlert, Lightbulb, Pencil, Eye } from 'lucide-react';
import ModalBase from '../common/ModalBase';
import FormRiesgo from './FormRiesgo';
import PanelSugerenciasIA from './PanelSugerenciasIA';
import ModalConfirmacionResponsabilidadHumana from '../common/ModalConfirmacionResponsabilidadHumana';
import Dialogos, { useDialogos } from '../common/Dialogos';
import { useToast } from '../common/Toast';
import { asignarFolios } from '../../services/folioService';
import { formatearFecha } from '../../constants/workflow';
import { CLAVE_MATRIZ, ESTADOS_MATRIZ, ESTADOS_RIESGO, nivelDe, puntaje, faltante, nuevoRiesgo, idMatriz, llevaPM, aceptacionDe, pmSincronizado } from '../../constants/riesgos';

const DECLARACION_ACEPTACION = 'como responsable del Sistema de Gestión de la Calidad, declaro que revisé la matriz OOMRSC-37 del área, que sus riesgos y oportunidades están identificados y evaluados conforme a los criterios del formato, y que los planes de mejora que se generan tendrán seguimiento del SGC hasta su cierre y dictamen de eficacia.';

export default function MatrizArea({ area, direccion, anio, riesgos, setRiesgos, matriz, guardarMatriz, procesos, usuarioLogueado, registrarMovimiento, puedeEditar = false, puedeEnviar: permisoEnviar = false, esAdmin = false, setPlanesMejora, correos = [], onVerPM, accionInicial = null, onAccionHecha }) {
  const toast = useToast();
  const { confirmar: pedirConfirmacion, props: propsDialogos } = useDialogos();
  const [abierto, setAbierto] = useState(null);
  const [borrador, setBorrador] = useState(null); // registro nuevo: no entra a la matriz hasta que se captura algo
  const [confirmar, setConfirmar] = useState(null); // 'enviar' | 'aceptar'
  const [aceptando, setAceptando] = useState(false);
  const items = riesgos.filter((r) => r.area === area && Number(r.anio) === Number(anio));
  const estado = matriz?.estado || 'BORRADOR';
  // El área captura mientras la matriz está en captura u observada y el registro no tiene plan de mejora.
  // El SGC ajusta cualquier registro que no esté dictaminado; si ya tiene plan de mejora, el plan refleja el ajuste.
  const capturable = puedeEditar && (estado === 'BORRADOR' || estado === 'OBSERVADA');
  const editable = capturable || esAdmin;
  const editableRegistro = (r) => (esAdmin ? !String(r.estado || '').startsWith('CERRADO') : capturable && !r.pm_id);

  const agregar = (tipo) => {
    const r = nuevoRiesgo({ tipo, area, direccion, anio, por: usuarioLogueado?.nombre });
    setBorrador(r);
    setAbierto(r.id);
  };
  const actualizar = (r) => {
    if (borrador && r.id === borrador.id) { setBorrador(null); setRiesgos((prev) => [...prev, r]); return; }
    setRiesgos((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    if (r.pm_id) setPlanesMejora?.((prev) => prev.map((p) => (String(p.id) === String(r.pm_id) ? pmSincronizado(p, r) : p)));
  };
  const cerrarVentana = () => { setAbierto(null); setBorrador(null); };
  const quitar = async (r) => {
    if ((r.historial_pm || []).length) { toast.warning('Este registro ya tuvo planes de mejora; no se quita, se replantea.'); return; }
    const { ok } = await pedirConfirmacion({ titulo: `Quitar ${r.tipo.toLowerCase()}`, mensaje: `¿Quitar "${r.descripcion || 'sin descripción'}" de la matriz ${anio}?`, textoAceptar: 'Quitar', peligro: true });
    if (!ok) return;
    cerrarVentana();
    setRiesgos((prev) => prev.filter((x) => x.id !== r.id));
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'QUITAR_REGISTRO', descripcion: `${r.tipo} "${r.descripcion || 'sin descripción'}" quitado de la matriz ${anio} de ${area}`, folio: `${CLAVE_MATRIZ}-${anio}` });
  };

  // Alta desde Seguimiento: abre el registro nuevo (o arranca la IA).
  const [iaAuto, setIaAuto] = useState(0); // contador: cada clic en "Sugerir con IA" vuelve a arrancar
  const accionAtendida = useRef(false); // evita duplicar el alta si el efecto corre dos veces
  useEffect(() => {
    if (!accionInicial) { accionAtendida.current = false; return; }
    if (accionAtendida.current) return;
    accionAtendida.current = true;
    if (!editable) {
      toast.warning(puedeEditar
        ? `La matriz ${anio} de ${area} está "${ESTADOS_MATRIZ[estado].label}". Para agregar registros el SGC debe reabrirla.`
        : 'No tienes permiso para capturar en la matriz de esta área.');
    } else if (accionInicial === 'IA') {
      setIaAuto((n) => n + 1);
    } else {
      agregar(accionInicial);
    }
    onAccionHecha?.();
  }, [accionInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendientes = items.map((r) => ({ r, falta: faltante(r) })).filter((x) => x.falta);
  const completa = items.length > 0 && pendientes.length === 0;
  const puedeEnviar = capturable && permisoEnviar && completa;
  // El SGC acepta directo: mientras no esté aceptada, o si después se agregaron registros sin aceptar.
  const porAceptar = esAdmin && (estado !== 'ACEPTADA' || items.some((r) => !r.oficial));
  const sinPlanGenerado = items.filter((r) => llevaPM(r) && !r.pm_id);

  const enviar = (ratificacion) => {
    guardarMatriz({
      ...(matriz || {}),
      id: idMatriz(area, anio), area, anio, direccion, estado: 'ENVIADA',
      enviado_por: usuarioLogueado?.nombre || '', fecha_envio: new Date().toISOString(), ratificacion_envio: ratificacion,
    });
    registrarMovimiento?.({
      modulo: 'RIESGOS', accion: 'ENVIO_MATRIZ',
      descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${area} enviada al SGC (${items.length} registros)`, folio: `${CLAVE_MATRIZ}-${anio}`,
    });
    setConfirmar(null);
    toast.success('Matriz enviada al SGC para revisión.');
  };

  const aceptar = async (ratificacion) => {
    if (aceptando || !completa) { setConfirmar(null); return; }
    setAceptando(true);
    const por = usuarioLogueado?.nombre || 'SGC';
    const ahora = new Date().toISOString();
    let folios = [];
    try { if (sinPlanGenerado.length) folios = await asignarFolios('PM', sinPlanGenerado.length); } catch (e) { toast.error(e.message); setAceptando(false); return; }
    const { nuevos, cambios } = aceptacionDe(items, { folios, por, correos, ahora });
    if (nuevos.length) setPlanesMejora((prev) => [...prev, ...nuevos]);
    setRiesgos((prev) => prev.map((r) => (cambios[r.id] ? { ...r, ...cambios[r.id] } : r)));
    guardarMatriz({
      ...(matriz || {}), id: idMatriz(area, anio), area, anio, direccion, estado: 'ACEPTADA',
      ...(matriz?.fecha_envio ? {} : { enviado_por: por, fecha_envio: ahora }),
      aceptado_por: por, fecha_aceptacion: ahora, ratificacion_aceptacion: ratificacion,
    });
    registrarMovimiento?.({
      modulo: 'RIESGOS', accion: 'ACEPTACION_MATRIZ',
      descripcion: `Matriz ${CLAVE_MATRIZ} ${anio} de ${area} aceptada; ${nuevos.length} plan(es) de mejora generados (${nuevos.map((p) => p.folio_codigo).join(', ') || 'ninguno'})`,
      folio: `${CLAVE_MATRIZ}-${anio}`,
    });
    setConfirmar(null); setAceptando(false);
    toast.success(`Matriz aceptada. ${nuevos.length} plan(es) de mejora generados; su avance se ve en Seguimiento.`);
  };

  const grupos = [['Riesgo', 'Riesgos', 'bg-rose-700', 'border-rose-200'], ['Oportunidad', 'Oportunidades', 'bg-emerald-700', 'border-emerald-200']];
  const enVentana = (borrador && abierto === borrador.id ? borrador : items.find((r) => r.id === abierto)) || null;
  const ajusteConPM = enVentana?.pm_id && editableRegistro(enVentana);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{CLAVE_MATRIZ} · {anio}</p>
          <h3 className="text-lg font-extrabold text-slate-900">{area}</h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold border ${ESTADOS_MATRIZ[estado].color}`}>{ESTADOS_MATRIZ[estado].label}</span>
          {matriz?.fecha_envio && <span className="ml-2 text-xs text-slate-500">Enviada {formatearFecha(matriz.fecha_envio)}</span>}
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2 justify-end">
            <PanelSugerenciasIA area={area} direccion={direccion} anio={anio} riesgos={riesgos} setRiesgos={setRiesgos}
              procesos={procesos} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} autoIniciar={iaAuto} />
            <button type="button" onClick={() => agregar('Riesgo')} className="px-3 py-2 text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 inline-flex items-center gap-1"><Plus size={15} /> Riesgo</button>
            <button type="button" onClick={() => agregar('Oportunidad')} className="px-3 py-2 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-1"><Plus size={15} /> Oportunidad</button>
            {porAceptar ? (
              <button type="button" disabled={!completa || aceptando} onClick={() => setConfirmar('aceptar')}
                title={completa ? '' : 'Completa todos los registros para aceptar'}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-40 inline-flex items-center gap-1"><CheckCircle2 size={15} /> {estado === 'ACEPTADA' ? 'Aceptar lo agregado' : 'Aceptar y generar planes'}</button>
            ) : capturable && (
              <button type="button" disabled={!puedeEnviar} onClick={() => setConfirmar('enviar')}
                title={puedeEnviar ? '' : (permisoEnviar ? 'Completa todos los registros para enviar' : 'Solo el encargado del área o el SGC envían la matriz')}
                className="px-4 py-2 text-sm font-bold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:opacity-40 inline-flex items-center gap-1"><Send size={15} /> Enviar al SGC</button>
            )}
          </div>
        )}
      </div>

      {porAceptar && items.length > 0 && (
        <p className="text-sm text-sky-900 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          Las actividades planteadas todavía <strong>no son plan de mejora</strong>. Al aceptar la matriz se generan {sinPlanGenerado.length} plan(es) de mejora con folio y su avance se sigue en la pestaña Seguimiento.
        </p>
      )}

      {estado === 'OBSERVADA' && (matriz?.observaciones || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5"><MessageSquareWarning size={15} /> Observaciones del SGC</p>
          <ol className="mt-1 space-y-2">
            {[...matriz.observaciones].reverse().map((o, i) => (
              <li key={i} className={i ? 'opacity-70' : ''}>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{o.texto}</p>
                <p className="text-xs text-amber-800">{o.por} · {formatearFecha(o.fecha)}{i === 0 ? ' · la más reciente' : ''}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {editable && pendientes.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Falta completar {pendientes.length} registro(s): {pendientes.slice(0, 3).map((x) => `"${x.r.descripcion || 'sin descripción'}" (${x.falta})`).join('; ')}{pendientes.length > 3 ? '…' : ''}
        </p>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Aún no hay riesgos ni oportunidades para {anio}.{editable ? ' Agrega el primero con los botones de arriba.' : ''}
        </div>
      )}

      {grupos.map(([tipo, titulo, colorTitulo, colorBorde]) => {
        const lista = items.filter((r) => r.tipo === tipo).sort((a, b) => puntaje(b) - puntaje(a));
        if (!lista.length) return null;
        return (
          <section key={tipo} className={`bg-white rounded-xl border ${colorBorde} overflow-hidden`}>
            <h4 className={`px-4 py-2 text-sm font-extrabold text-white ${colorTitulo}`}>{titulo} ({lista.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{titulo} de {area}, {anio}</caption>
                <thead className="bg-slate-100 text-slate-700 text-left text-xs uppercase tracking-wide">
                  <tr>
                    <th scope="col" className="px-3 py-2 w-20">Nivel</th>
                    <th scope="col" className="px-3 py-2">Descripción</th>
                    <th scope="col" className="px-3 py-2">Proceso</th>
                    <th scope="col" className="px-3 py-2">Tratamiento y plan</th>
                    <th scope="col" className="px-3 py-2">Situación</th>
                    <th scope="col" className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 align-top">
                  {lista.map((r) => {
                    const nivel = nivelDe(r);
                    const falta = editableRegistro(r) && faltante(r);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5"><span className={`inline-block w-16 text-center px-1.5 py-0.5 rounded-md font-black border ${nivel ? nivel.suave : 'bg-white text-slate-600 border-slate-200'}`}>{puntaje(r) || '—'}<span className="block text-[11px] font-bold">{nivel?.nivel || 'Sin evaluar'}</span></span></td>
                        <td className="px-3 py-2.5 text-slate-900 font-medium min-w-[14rem]">{r.descripcion || <span className="text-slate-400 font-normal">Sin descripción</span>}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.proceso || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.tratamiento || '—'}
                          <span className="block text-xs text-slate-500">{r.pm_folio ? <span className="font-mono font-bold text-sky-700">{r.pm_folio}</span> : (r.plan || []).length ? `${r.plan.length} actividad(es) planteadas` : 'Sin plan'}</span></td>
                        <td className="px-3 py-2.5">{falta
                          ? <span className="text-xs font-semibold text-amber-700">Pendiente: {falta}</span>
                          : <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-bold border ${ESTADOS_RIESGO[r.estado || 'IDENTIFICADO']?.color || ''}`}>{ESTADOS_RIESGO[r.estado || 'IDENTIFICADO']?.label || r.estado}</span>}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button type="button" onClick={() => setAbierto(r.id)} aria-haspopup="dialog" className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-marca-azul-oscuro hover:opacity-90 inline-flex items-center gap-1 whitespace-nowrap">
                            {editableRegistro(r) ? <><Pencil size={13} /> {r.pm_id || estado !== 'BORRADOR' ? 'Ajustar' : 'Capturar'}</> : <><Eye size={13} /> Ver</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {enVentana && (
        <ModalBase isOpen onClose={cerrarVentana} size="2xl" closeOnBackdrop={false} bodyClassName="p-4 sm:p-6 bg-slate-50"
          icono={enVentana.tipo === 'Riesgo' ? <ShieldAlert size={20} /> : <Lightbulb size={20} />}
          titulo={`${enVentana.tipo}: ${enVentana.descripcion || 'nuevo registro'}`}
          subtitulo={`${CLAVE_MATRIZ} ${anio} · ${area} · ${!editableRegistro(enVentana) ? 'Solo consulta' : ajusteConPM ? `Ajuste del SGC: los cambios se reflejan en el Plan de Mejora ${enVentana.pm_folio || ''}` : 'Los cambios se guardan al escribir'}`}
          footer={<>
            {editableRegistro(enVentana) && !enVentana.pm_id && enVentana !== borrador && <button type="button" onClick={() => quitar(enVentana)} className="mr-auto text-xs font-semibold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg inline-flex items-center gap-1"><Trash2 size={13} /> Quitar de la matriz</button>}
            {editableRegistro(enVentana) && faltante(enVentana) && <span className="self-center text-xs font-semibold text-amber-800">Pendiente: {faltante(enVentana)}</span>}
            <button type="button" onClick={cerrarVentana} className="px-5 py-2 text-sm font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90">{editableRegistro(enVentana) ? 'Listo, volver a la matriz' : 'Cerrar'}</button>
          </>}>
          <FormRiesgo valor={enVentana} onChange={actualizar} procesos={procesos} soloLectura={!editableRegistro(enVentana)} onVerPM={onVerPM} />
        </ModalBase>
      )}

      <Dialogos {...propsDialogos} />
      <ModalConfirmacionResponsabilidadHumana
        isOpen={Boolean(confirmar)}
        onClose={() => setConfirmar(null)}
        onConfirmar={confirmar === 'aceptar' ? aceptar : enviar}
        tipo="MATRIZ_RIESGOS"
        registro={confirmar === 'aceptar'
          ? { folio: `${CLAVE_MATRIZ} ${anio}`, area, proceso: 'Aceptación SGC', titulo_mejora: `Se aceptará la matriz y se generarán ${sinPlanGenerado.length} plan(es) de mejora ligados a sus riesgos y oportunidades.` }
          : { folio: `${CLAVE_MATRIZ} ${anio}`, area, proceso: 'Riesgos y oportunidades (§ 6.1)', titulo_mejora: `${items.filter((r) => r.tipo === 'Riesgo').length} riesgo(s) y ${items.filter((r) => r.tipo === 'Oportunidad').length} oportunidad(es) con ${items.filter(llevaPM).reduce((n, r) => n + r.plan.length, 0)} actividad(es) de plan` }}
        actividades={(confirmar === 'aceptar' ? sinPlanGenerado : items.filter(llevaPM)).flatMap((r) => r.plan || [])}
        usuarioLogueado={usuarioLogueado}
        {...(confirmar === 'aceptar' ? { textoBoton: 'Confirmar y aceptar la matriz', declaracion: DECLARACION_ACEPTACION } : {})}
      />
    </div>
  );
}
