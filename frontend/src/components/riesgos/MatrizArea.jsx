// Matriz anual de riesgos y oportunidades de un área (OOMRSC-37): captura, envío al SGC y observaciones.
// La matriz solo enlista; cada registro se captura o consulta en una ventana emergente (regla del portal: lo que se trabaja, en ventana).
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Send, ChevronRight, Trash2, MessageSquareWarning, ShieldAlert, Lightbulb } from 'lucide-react';
import ModalBase from '../common/ModalBase';
import FormRiesgo from './FormRiesgo';
import PanelSugerenciasIA from './PanelSugerenciasIA';
import ModalConfirmacionResponsabilidadHumana from '../common/ModalConfirmacionResponsabilidadHumana';
import Dialogos, { useDialogos } from '../common/Dialogos';
import { useToast } from '../common/Toast';
import { formatearFecha } from '../../constants/workflow';
import { CLAVE_MATRIZ, ESTADOS_MATRIZ, nivelDe, puntaje, faltante, nuevoRiesgo, idMatriz, llevaPM } from '../../constants/riesgos';

export default function MatrizArea({ area, direccion, anio, riesgos, setRiesgos, matriz, guardarMatriz, procesos, usuarioLogueado, registrarMovimiento, puedeEditar = false, puedeEnviar: permisoEnviar = false, onVerPM, accionInicial = null, onAccionHecha }) {
  const toast = useToast();
  const { confirmar: pedirConfirmacion, props: propsDialogos } = useDialogos();
  const [abierto, setAbierto] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const items = riesgos.filter((r) => r.area === area && Number(r.anio) === Number(anio));
  const estado = matriz?.estado || 'BORRADOR';
  // Solo el área (o sus encargados SGC) y el SGC capturan; los registros que ya tienen plan de mejora no se tocan.
  const editable = puedeEditar && (estado === 'BORRADOR' || estado === 'OBSERVADA');
  const editableRegistro = (r) => editable && !r.pm_id;

  const agregar = (tipo) => {
    const r = nuevoRiesgo({ tipo, area, direccion, anio, por: usuarioLogueado?.nombre });
    setRiesgos((prev) => [...prev, r]);
    setAbierto(r.id);
  };
  const actualizar = (r) => setRiesgos((prev) => prev.map((x) => (x.id === r.id ? r : x)));
  const quitar = async (r) => {
    if ((r.historial_pm || []).length) { toast.warning('Este registro ya tuvo planes de mejora; no se quita, se replantea.'); return; }
    const { ok } = await pedirConfirmacion({ titulo: `Quitar ${r.tipo.toLowerCase()}`, mensaje: `¿Quitar "${r.descripcion || 'sin descripción'}" de la matriz ${anio}?`, textoAceptar: 'Quitar', peligro: true });
    if (!ok) return;
    setAbierto(null);
    setRiesgos((prev) => prev.filter((x) => x.id !== r.id));
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'QUITAR_REGISTRO', descripcion: `${r.tipo} "${r.descripcion || 'sin descripción'}" quitado de la matriz ${anio} de ${area}`, folio: `${CLAVE_MATRIZ}-${anio}` });
  };

  // Alta desde Seguimiento: agrega el registro (o arranca la IA) y lo deja abierto a la vista.
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
  const puedeEnviar = editable && permisoEnviar && items.length > 0 && pendientes.length === 0;

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
    setConfirmar(false);
    toast.success('Matriz enviada al SGC para revisión.');
  };

  const grupos = [['Riesgo', 'Riesgos'], ['Oportunidad', 'Oportunidades']];
  const enVentana = items.find((r) => r.id === abierto) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{CLAVE_MATRIZ} · {anio}</p>
          <h3 className="text-lg font-extrabold text-slate-900">{area}</h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_MATRIZ[estado].color}`}>{ESTADOS_MATRIZ[estado].label}</span>
          {matriz?.fecha_envio && <span className="ml-2 text-[11px] text-slate-500">Enviada {formatearFecha(matriz.fecha_envio)}</span>}
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2 justify-end">
            <PanelSugerenciasIA area={area} direccion={direccion} anio={anio} riesgos={riesgos} setRiesgos={setRiesgos}
              procesos={procesos} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} autoIniciar={iaAuto} />
            <button type="button" onClick={() => agregar('Riesgo')} className="px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 inline-flex items-center gap-1"><Plus size={14} /> Riesgo</button>
            <button type="button" onClick={() => agregar('Oportunidad')} className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-1"><Plus size={14} /> Oportunidad</button>
            <button type="button" disabled={!puedeEnviar} onClick={() => setConfirmar(true)}
              title={puedeEnviar ? '' : (permisoEnviar ? 'Completa todos los registros para enviar' : 'Solo el encargado del área o el SGC envían la matriz')}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:opacity-40 inline-flex items-center gap-1"><Send size={14} /> Enviar al SGC</button>
          </div>
        )}
      </div>

      {estado === 'OBSERVADA' && (matriz?.observaciones || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5"><MessageSquareWarning size={15} /> Observaciones del SGC</p>
          <ol className="mt-1 space-y-2">
            {[...matriz.observaciones].reverse().map((o, i) => (
              <li key={i} className={i ? 'opacity-70' : ''}>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{o.texto}</p>
                <p className="text-[11px] text-amber-800">{o.por} · {formatearFecha(o.fecha)}{i === 0 ? ' · la más reciente' : ''}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {editable && pendientes.length > 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Para enviar falta completar {pendientes.length} registro(s): {pendientes.slice(0, 3).map((x) => `"${x.r.descripcion || 'sin descripción'}" (${x.falta})`).join('; ')}{pendientes.length > 3 ? '…' : ''}
        </p>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Aún no hay riesgos ni oportunidades para {anio}. Agrega el primero con los botones de arriba.
        </div>
      )}

      {grupos.map(([tipo, titulo]) => {
        const lista = items.filter((r) => r.tipo === tipo).sort((a, b) => puntaje(b) - puntaje(a));
        if (!lista.length) return null;
        return (
          <section key={tipo} className="space-y-2">
            <h4 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-extrabold border-l-4 ${tipo === 'Riesgo' ? 'bg-rose-50 text-rose-900 border-l-rose-500' : 'bg-emerald-50 text-emerald-900 border-l-emerald-500'}`}>{titulo}<span className="text-xs font-bold opacity-80">({lista.length})</span></h4>
            {lista.map((r) => {
              const nivel = nivelDe(r);
              return (
                <article key={r.id} className="bg-white rounded-xl border border-slate-200 hover:border-marca-azul">
                  <button type="button" onClick={() => setAbierto(r.id)} aria-haspopup="dialog" className="w-full flex items-center gap-3 p-3 text-left">
                    <span className={`shrink-0 w-12 text-center px-2 py-1 rounded-lg text-xs font-black border ${nivel ? nivel.suave : 'bg-white text-slate-600 border-slate-200'}`}>{puntaje(r) || '—'}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 truncate">{r.descripcion || 'Sin descripción'}</span>
                      <span className="block text-[11px] text-slate-500">{[r.proceso, r.tratamiento, (r.plan || []).length ? `${r.plan.length} actividad(es)` : ''].filter(Boolean).join(' · ') || 'Por completar'}</span>
                    </span>
                    {faltante(r) && editableRegistro(r) && <span className="text-[11px] font-semibold text-amber-700 hidden sm:inline">{faltante(r)}</span>}
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-marca-azul-oscuro">{editableRegistro(r) ? 'Capturar' : 'Ver'}<ChevronRight size={15} /></span>
                  </button>
                </article>
              );
            })}
          </section>
        );
      })}

      {enVentana && (
        <ModalBase isOpen onClose={() => setAbierto(null)} size="2xl" closeOnBackdrop={false} bodyClassName="p-4 sm:p-6 bg-slate-50"
          icono={enVentana.tipo === 'Riesgo' ? <ShieldAlert size={20} /> : <Lightbulb size={20} />}
          titulo={`${enVentana.tipo}: ${enVentana.descripcion || 'nuevo registro'}`}
          subtitulo={`${CLAVE_MATRIZ} ${anio} · ${area} · ${editableRegistro(enVentana) ? 'En captura: los cambios se guardan al escribir' : 'Solo consulta'}`}
          footer={<>
            {editableRegistro(enVentana) && <button type="button" onClick={() => quitar(enVentana)} className="mr-auto text-xs font-semibold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg inline-flex items-center gap-1"><Trash2 size={13} /> Quitar de la matriz</button>}
            {editableRegistro(enVentana) && faltante(enVentana) && <span className="self-center text-xs font-semibold text-amber-800">Pendiente: {faltante(enVentana)}</span>}
            <button type="button" onClick={() => setAbierto(null)} className="px-5 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90">{editableRegistro(enVentana) ? 'Listo, volver a la matriz' : 'Cerrar'}</button>
          </>}>
          <FormRiesgo valor={enVentana} onChange={actualizar} procesos={procesos} soloLectura={!editableRegistro(enVentana)} onVerPM={onVerPM} />
        </ModalBase>
      )}

      <Dialogos {...propsDialogos} />
      <ModalConfirmacionResponsabilidadHumana
        isOpen={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirmar={enviar}
        tipo="MATRIZ_RIESGOS"
        registro={{ folio: `${CLAVE_MATRIZ} ${anio}`, area, proceso: 'Riesgos y oportunidades (§ 6.1)', titulo_mejora: `${items.filter((r) => r.tipo === 'Riesgo').length} riesgo(s) y ${items.filter((r) => r.tipo === 'Oportunidad').length} oportunidad(es) con ${items.filter(llevaPM).reduce((n, r) => n + r.plan.length, 0)} actividad(es) de plan` }}
        actividades={items.filter(llevaPM).flatMap((r) => r.plan || [])}
        usuarioLogueado={usuarioLogueado}
      />
    </div>
  );
}
