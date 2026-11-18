// Programa (OOMRSC-13), equipo auditor por orden de confirmación y plan (OOMRSC-14) de una auditoría interna.
import React, { useEffect, useState } from 'react';
import { Trash2, Send, Users, Wand2, ArrowRight, X, History, Mail, RefreshCw } from 'lucide-react';
import { api } from '../../services/apiClient';
import { recargarClave, getEstadoSync } from '../../services/estadoService';
import { useToast } from '../common/Toast';
import Dialogos, { useDialogos } from '../common/Dialogos';
import CampoFecha from '../common/CampoFecha';
import { formatearFecha } from '../../constants/workflow';
import { getDireccionDeArea } from '../../constants/direcciones';
import {
  CLAVE_AUDITORIAS, BIMESTRES, TIPOS_AUDITORIA, CRITERIOS_AUDITORIA, RIESGOS_AUDITORIA, ESTADOS_AUDITORIA, ORDEN_ESTADOS, FORMATOS,
  nuevaAreaAuditada, auditoresRequeridos, proponerEquipo, conflictoDeInteres, faltantePrograma, faltantePlan,
} from '../../constants/auditorias';
import { Bloque, Campo, ENTRADA, EstadoAuditoria, Rango, tituloAuditoria, LISTA } from './ui';
import { Leyenda } from '../common/estilosCampos';

const SECCIONES = [['programa', '1. Programa'], ['areas', '2. Áreas a auditar'], ['equipo', '3. Equipo auditor'], ['plan', '4. Plan de auditoría']];

async function esperarSync(maxMs = 6000) {
  const t = Date.now();
  while (getEstadoSync().pendientes > 0 && Date.now() - t < maxMs) await new Promise((r) => setTimeout(r, 300));
  return getEstadoSync().pendientes === 0;
}

export default function EditorAuditoria({ auditoria: a, onCambio, editable, areas = [], auditores = [], antecedentes = {}, usuarioLogueado, registrarMovimiento, listasEntregadas = { total: 0, entregadas: 0 }, onEmitirInforme }) {
  const toast = useToast();
  const { confirmar, solicitar, props: dialogos } = useDialogos();
  const [seccion, setSeccion] = useState('programa');
  const [ocupado, setOcupado] = useState(false);
  // Las confirmaciones las registra el servidor: se releen al entrar a la sección del equipo.
  useEffect(() => { if (seccion === 'equipo' && a.estado === 'INVITACION') recargarClave(CLAVE_AUDITORIAS); }, [seccion, a.estado]);
  const set = (campo, valor) => onCambio({ ...a, [campo]: valor });
  const setArea = (i, cambios) => set('areas', a.areas.map((x, j) => (j === i ? { ...x, ...cambios } : x)));
  const alternar = (campo, v) => set(campo, (a[campo] || []).includes(v) ? a[campo].filter((x) => x !== v) : [...(a[campo] || []), v]);
  const puedeEditar = editable && a.estado !== 'CERRADA';
  const nombreDe = (email) => auditores.find((u) => String(u.email).toLowerCase() === String(email).toLowerCase())?.nombre || email;
  const confirmaciones = [...(a.confirmaciones || [])].sort((x, y) => String(x.fecha).localeCompare(String(y.fecha)));
  const disponibles = areas.filter((n) => !(a.areas || []).some((x) => x.area === n));

  const agregarArea = (nombre) => {
    if (!nombre) return;
    const ficha = areas.find((x) => x === nombre);
    set('areas', [...(a.areas || []), nuevaAreaAuditada(ficha, { direccion: getDireccionDeArea(nombre) })]);
  };

  const invitar = async () => {
    const falta = faltantePrograma(a);
    if (falta) return toast.warning(`Antes de invitar: ${falta}.`);
    const { ok, valor } = await solicitar({ titulo: 'Invitar a los auditores internos', subtitulo: `${tituloAuditoria(a)} · se requieren ${auditoresRequeridos(a)} auditor(es)`, etiqueta: 'Mensaje adicional para el correo (opcional)', textoAceptar: 'Abrir invitación', filas: 3, requerido: false });
    if (!ok) return;
    setOcupado(true);
    if (!(await esperarSync())) { setOcupado(false); return toast.error('Aún no se sincroniza con el servidor. Intenta en unos segundos.'); }
    const r = await api.post(`/api/v1/auditorias/${a.id}/invitar`, { mensaje: valor || '', enviar_correo: true });
    setOcupado(false);
    if (!r.ok) return toast.error(r.error?.message || 'No se pudo abrir la invitación.');
    await recargarClave(CLAVE_AUDITORIAS);
    onCambio(r.data.auditoria, { soloLocal: true });
    registrarMovimiento?.({ modulo: 'AUDITORIAS', accion: 'INVITACION_AUDITORES', descripcion: `Invitación a auditores para ${tituloAuditoria(a)} (${r.data.auditores} en el catálogo, ${r.data.correos_enviados} correo(s) enviados)`, folio: `AUD-${a.numero}/${a.anio}` });
    toast.success(r.data.correo_configurado ? `Invitación enviada a ${r.data.correos_enviados} auditor(es).` : `Invitación abierta. El correo aún no está activo: los ${r.data.auditores} auditores la verán al entrar al portal.`, { duracion: 8000 });
    setSeccion('equipo');
  };

  const proponer = () => {
    const { asignacion, sinCubrir } = proponerEquipo(a, confirmaciones, getDireccionDeArea);
    set('areas', a.areas.map((x) => { const eq = asignacion[x.area] || []; return { ...x, auditor_lider: eq[0] || '', auditores: eq.slice(1) }; }));
    if (sinCubrir.length) toast.warning(`Sin auditores suficientes para: ${sinCubrir.join(', ')}. Faltan confirmaciones o hay conflicto de interés.`, { duracion: 8000 });
    else toast.success('Equipo propuesto en el orden de confirmación. Puedes ajustarlo.');
  };

  const avanzar = async () => {
    const i = ORDEN_ESTADOS.indexOf(a.estado);
    const sig = ORDEN_ESTADOS[i + 1];
    if (!sig) return;
    if (a.estado === 'PLANEACION') return invitar();
    if (a.estado === 'INVITACION') {
      const falta = faltantePlan(a);
      if (falta) { setSeccion(falta.includes('auditor') ? 'equipo' : 'plan'); return toast.warning(`Para programarla: ${falta}.`); }
    }
    if (a.estado === 'EN_EJECUCION') {
      if (listasEntregadas.entregadas < listasEntregadas.total || !listasEntregadas.total) return toast.warning(`Faltan listas de verificación por entregar (${listasEntregadas.entregadas} de ${listasEntregadas.total}).`);
      const { ok } = await confirmar({ titulo: 'Emitir el informe de auditoría', mensaje: 'Se registra la fecha del informe y cada no conformidad genera su acción correctiva en "Por abrir" (el área tiene 5 días hábiles para abrirla). ¿Continuar?', textoAceptar: 'Emitir informe' });
      if (!ok) return;
      return onEmitirInforme?.(a);
    }
    const { ok } = await confirmar({ titulo: ESTADOS_AUDITORIA[a.estado].sig, mensaje: `${tituloAuditoria(a)} pasará a "${ESTADOS_AUDITORIA[sig].label}".`, textoAceptar: 'Continuar' });
    if (!ok) return;
    onCambio({ ...a, estado: sig });
    registrarMovimiento?.({ modulo: 'AUDITORIAS', accion: `AUDITORIA_${sig}`, descripcion: `${tituloAuditoria(a)} pasa a ${ESTADOS_AUDITORIA[sig].label}`, folio: `AUD-${a.numero}/${a.anio}` });
  };

  const SelectAuditor = ({ valor, onElegir, area, etiqueta }) => (
    <select aria-label={etiqueta} disabled={!puedeEditar} value={valor || ''} onChange={(e) => onElegir(e.target.value)} className={LISTA}>
      <option value="">— Sin asignar —</option>
      {auditores.map((u) => { const c = conflictoDeInteres(u, area, getDireccionDeArea); const conf = confirmaciones.find((x) => x.email === String(u.email).toLowerCase());
        return <option key={u.email} value={String(u.email).toLowerCase()} disabled={Boolean(c)}>{conf ? `${conf.orden}º · ` : ''}{u.nombre}{c ? ` (${c})` : conf ? '' : ' (sin confirmar)'}</option>; })}
    </select>
  );

  return (
    <div className="space-y-3">
      <Dialogos {...dialogos} />
      <header className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-marca-azul-oscuro">{a.tipo} · bimestre {BIMESTRES[a.bimestre]} {a.anio}</p>
          <h3 className="text-base font-extrabold text-slate-900">{tituloAuditoria(a)}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1"><EstadoAuditoria estado={a.estado} />
            <span className="text-[11px] text-slate-600">{(a.areas || []).length} área(s) · {auditoresRequeridos(a)} auditor(es) requeridos · {confirmaciones.length} confirmación(es)</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeEditar && ESTADOS_AUDITORIA[a.estado].sig && (
            <button type="button" disabled={ocupado} onClick={avanzar} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
              {a.estado === 'PLANEACION' ? <Mail size={14} /> : <ArrowRight size={14} />} {ocupado ? 'Enviando…' : ESTADOS_AUDITORIA[a.estado].sig}</button>
          )}
        </div>
      </header>

      <nav className="flex flex-wrap gap-1.5" aria-label="Secciones de la auditoría">
        {SECCIONES.map(([id, t]) => (
          <button key={id} type="button" aria-pressed={seccion === id} onClick={() => setSeccion(id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${seccion === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>{t}</button>
        ))}
      </nav>

      <Leyenda />

      {seccion === 'programa' && (
        <div className="space-y-3">
          <Bloque titulo={`A. Datos de la auditoría (${FORMATOS.programa})`}>
            <div className="grid gap-3 md:grid-cols-4">
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Tipo</span>
                <select disabled={!puedeEditar} value={a.tipo} onChange={(e) => set('tipo', e.target.value)} className={LISTA}>{TIPOS_AUDITORIA.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Bimestre</span>
                <select disabled={!puedeEditar} value={a.bimestre} onChange={(e) => set('bimestre', Number(e.target.value))} className={LISTA}>{BIMESTRES.map((b, i) => <option key={b} value={i}>{b}</option>)}</select></label>
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Fecha de inicio</span><CampoFecha disabled={!puedeEditar} value={a.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} className={ENTRADA} /></label>
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Fecha de término</span><CampoFecha disabled={!puedeEditar} value={a.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} className={ENTRADA} /></label>
            </div>
          </Bloque>
          <Bloque titulo="B. Objetivo y alcance">
            <div className="grid gap-3 md:grid-cols-2">
              <Campo disabled={!puedeEditar} multi etiqueta="Objetivo de la auditoría" valor={a.objetivo} onChange={(v) => set('objetivo', v)} />
              <Campo disabled={!puedeEditar} multi etiqueta="Alcance" valor={a.alcance} onChange={(v) => set('alcance', v)} />
            </div>
          </Bloque>
          <div className="grid gap-3 md:grid-cols-2">
            <Bloque titulo="C. Criterios de auditoría">
              <div className="space-y-1">{CRITERIOS_AUDITORIA.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-slate-800"><input type="checkbox" disabled={!puedeEditar} checked={(a.criterios || []).includes(c)} onChange={() => alternar('criterios', c)} /> {c}</label>))}</div>
            </Bloque>
            <Bloque titulo="D. Riesgos y cambios">
              <div className="space-y-1 mb-2">{RIESGOS_AUDITORIA.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-slate-800"><input type="checkbox" disabled={!puedeEditar} checked={(a.riesgos || []).includes(c)} onChange={() => alternar('riesgos', c)} /> {c}</label>))}</div>
              <Campo disabled={!puedeEditar} multi etiqueta="Cambios que afectan al sistema auditado" valor={a.cambios} onChange={(v) => set('cambios', v)} />
            </Bloque>
          </div>
        </div>
      )}

      {seccion === 'areas' && (
        <Bloque titulo={`Áreas o procesos a auditar (${(a.areas || []).length})`} ayuda="La cantidad de auditores depende de las áreas. En áreas grandes o muy técnicas se piden dos o más. Se muestran los resultados de la auditoría anterior de cada área."
          derecha={puedeEditar && ['PLANEACION', 'INVITACION'].includes(a.estado) && (
            <select aria-label="Agregar área" value="" onChange={(e) => agregarArea(e.target.value)} className={`${LISTA} w-auto text-xs`}>
              <option value="">+ Agregar área…</option>{disponibles.map((n) => <option key={n}>{n}</option>)}</select>)}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <caption className="sr-only">Áreas a auditar</caption>
              <thead><tr><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left min-w-[160px]">Proceso</th><th scope="col" className="p-2 text-left">Auditores requeridos</th>
                <th scope="col" className="p-2 text-left">Auditoría anterior</th><th scope="col" className="p-2 text-left">Resultado anterior</th><th scope="col" className="p-2 text-right">Acción</th></tr></thead>
              <tbody>
                {(a.areas || []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Agrega las áreas que se auditarán en este bimestre.</td></tr>}
                {(a.areas || []).map((x, i) => { const ant = antecedentes[x.area]; return (
                  <tr key={x.area}>
                    <td className="p-2 font-semibold text-slate-900">{x.area}<span className="block text-[11px] font-normal text-slate-600">{x.direccion}</span></td>
                    <td className="p-2"><input aria-label="Proceso" disabled={!puedeEditar} value={x.proceso || ''} onChange={(e) => setArea(i, { proceso: e.target.value })} className={ENTRADA} /></td>
                    <td className="p-2"><input aria-label="Auditores requeridos" type="number" min={1} max={5} disabled={!puedeEditar} value={x.auditores_requeridos || 1} onChange={(e) => setArea(i, { auditores_requeridos: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })} className={`${ENTRADA} w-20`} /></td>
                    <td className="p-2">{ant?.ultima ? <><span className="font-semibold">#{ant.ultima.numero}/{ant.ultima.anio}</span><span className="block text-slate-600">{formatearFecha(ant.fecha)}</span></> : <span className="text-slate-500">Sin auditoría previa en el portal</span>}</td>
                    <td className="p-2">{ant?.ultima ? <><Rango rango={ant.rango} pct={ant.cumplimiento} /><span className="block mt-0.5 text-slate-700"><History size={11} className="inline" /> {ant.nc} NC · {ant.om} OM · siguiente a {ant.frecuencia} meses</span></> : '—'}</td>
                    <td className="p-2 text-right">{puedeEditar && ['PLANEACION', 'INVITACION'].includes(a.estado) && <button type="button" onClick={() => set('areas', a.areas.filter((_, j) => j !== i))} className="text-rose-700 inline-flex items-center gap-1 hover:underline"><Trash2 size={12} /> Quitar</button>}</td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </Bloque>
      )}

      {seccion === 'equipo' && (
        <div className="space-y-3">
          <Bloque titulo={`A. Confirmaciones en orden de llegada (${confirmaciones.length} de ${auditoresRequeridos(a)} requeridos)`}
            ayuda="El equipo se integra en el orden en que los auditores confirman (procedimiento OOMPSC-08). La hora la registra el servidor."
            derecha={puedeEditar && a.estado === 'INVITACION' && <span className="flex flex-wrap gap-2"><button type="button" onClick={() => recargarClave(CLAVE_AUDITORIAS)} className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RefreshCw size={12} /> Actualizar</button><button type="button" disabled={ocupado} onClick={invitar} className="px-2.5 py-1 text-xs font-semibold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50 inline-flex items-center gap-1.5"><Send size={12} /> Reenviar invitación</button></span>}>
            {a.estado === 'PLANEACION' ? <p className="text-sm text-slate-600">Aún no se abre la invitación. Completa el programa y las áreas, y usa "Invitar auditores".</p> : (
              <table className="w-full text-xs">
                <thead><tr><th scope="col" className="p-2 text-left w-16">Orden</th><th scope="col" className="p-2 text-left">Auditor</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Confirmó</th></tr></thead>
                <tbody>
                  {confirmaciones.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">Todavía nadie confirma. Invitación enviada el {formatearFecha(a.invitacion?.fecha)} a {(a.invitacion?.destinatarios || []).length} auditor(es).</td></tr>}
                  {confirmaciones.map((c) => <tr key={c.email}><td className="p-2 font-black text-marca-azul-oscuro">{c.orden}º</td><td className="p-2 font-semibold text-slate-900">{c.nombre}<span className="block font-normal text-slate-600">{c.email}</span></td><td className="p-2">{c.area}</td><td className="p-2 whitespace-nowrap">{formatearFecha(c.fecha)} {String(c.fecha).slice(11, 16)}</td></tr>)}
                </tbody>
              </table>)}
          </Bloque>
          <Bloque titulo="B. Equipo por área" ayuda="Nadie audita su propia área ni su dirección. Cada auditor entrega su lista de verificación."
            derecha={puedeEditar && confirmaciones.length > 0 && <button type="button" onClick={proponer} className="px-2.5 py-1 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg inline-flex items-center gap-1.5"><Wand2 size={12} /> Proponer por orden de confirmación</button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left min-w-[220px]">Auditor líder del área</th><th scope="col" className="p-2 text-left min-w-[220px]">Auditores de apoyo</th></tr></thead>
                <tbody>
                  {(a.areas || []).map((x, i) => (
                    <tr key={x.area}>
                      <td className="p-2 font-semibold text-slate-900">{x.area}<span className="block font-normal text-slate-600"><Users size={11} className="inline" /> requiere {x.auditores_requeridos || 1}</span></td>
                      <td className="p-2"><SelectAuditor etiqueta={`Auditor líder de ${x.area}`} valor={x.auditor_lider} area={x} onElegir={(v) => setArea(i, { auditor_lider: v })} /></td>
                      <td className="p-2 space-y-1">
                        {(x.auditores || []).map((em, k) => <div key={em} className="flex items-center gap-1"><span className="flex-1 px-2 py-1 rounded bg-slate-50 border border-slate-200">{nombreDe(em)}</span>{puedeEditar && <button type="button" aria-label={`Quitar a ${nombreDe(em)}`} onClick={() => setArea(i, { auditores: x.auditores.filter((_, j) => j !== k) })} className="text-rose-700"><X size={14} /></button>}</div>)}
                        {puedeEditar && <SelectAuditor etiqueta={`Agregar auditor a ${x.area}`} valor="" area={x} onElegir={(v) => v && v !== x.auditor_lider && !(x.auditores || []).includes(v) && setArea(i, { auditores: [...(x.auditores || []), v] })} />}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Bloque>
        </div>
      )}

      {seccion === 'plan' && (
        <div className="space-y-3">
          <Bloque titulo={`A. Plan de auditoría (${FORMATOS.plan})`}>
            <div className="grid gap-3 md:grid-cols-2">
              <Campo disabled={!puedeEditar} multi etiqueta="Documentos de referencia" valor={a.documentos_referencia} onChange={(v) => set('documentos_referencia', v)} ayuda="Manual de calidad, procedimientos, programas, planes…" />
              <Campo disabled={!puedeEditar} multi etiqueta="Recursos requeridos" valor={a.recursos} onChange={(v) => set('recursos', v)} />
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Reunión de apertura</span><CampoFecha disabled={!puedeEditar} value={a.fecha_reunion_apertura} onChange={(e) => set('fecha_reunion_apertura', e.target.value)} className={ENTRADA} /></label>
              <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Reunión para entregar el informe</span><CampoFecha disabled={!puedeEditar} value={a.fecha_reunion_cierre} onChange={(e) => set('fecha_reunion_cierre', e.target.value)} className={ENTRADA} /></label>
            </div>
          </Bloque>
          <Bloque titulo="B. Agenda por área" ayuda="Fecha y horario acordados con el responsable del área; no se mueven salvo causa justificada.">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th scope="col" className="p-2 text-left">Área / auditor</th><th scope="col" className="p-2 text-left">Fecha</th><th scope="col" className="p-2 text-left">Inicio</th><th scope="col" className="p-2 text-left">Término</th>
                  <th scope="col" className="p-2 text-left min-w-[160px]">Auditado (cargo, nombre)</th><th scope="col" className="p-2 text-left min-w-[120px]">Lugar</th><th scope="col" className="p-2 text-left min-w-[130px]">Cláusulas más probables</th></tr></thead>
                <tbody>
                  {(a.areas || []).map((x, i) => (
                    <tr key={x.area}>
                      <td className="p-2 font-semibold text-slate-900">{x.area}<span className="block font-normal text-slate-600">{[x.auditor_lider, ...(x.auditores || [])].filter(Boolean).map(nombreDe).join(', ') || 'Sin auditor'}</span></td>
                      <td className="p-2 min-w-[130px]"><CampoFecha disabled={!puedeEditar} value={x.fecha} min={a.fecha_inicio} max={a.fecha_fin} onChange={(e) => setArea(i, { fecha: e.target.value })} className={ENTRADA} /></td>
                      <td className="p-2"><input aria-label="Hora de inicio" type="time" disabled={!puedeEditar} value={x.hora_inicio || ''} onChange={(e) => setArea(i, { hora_inicio: e.target.value })} className={ENTRADA} /></td>
                      <td className="p-2"><input aria-label="Hora de término" type="time" disabled={!puedeEditar} value={x.hora_fin || ''} onChange={(e) => setArea(i, { hora_fin: e.target.value })} className={ENTRADA} /></td>
                      <td className="p-2"><input aria-label="Auditado" disabled={!puedeEditar} value={x.auditado || ''} onChange={(e) => setArea(i, { auditado: e.target.value })} className={ENTRADA} /></td>
                      <td className="p-2"><input aria-label="Lugar" disabled={!puedeEditar} value={x.lugar || ''} onChange={(e) => setArea(i, { lugar: e.target.value })} className={ENTRADA} /></td>
                      <td className="p-2"><input aria-label="Cláusulas" disabled={!puedeEditar} value={x.clausulas || ''} onChange={(e) => setArea(i, { clausulas: e.target.value })} placeholder="5.1, 6.1…" className={ENTRADA} /></td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Bloque>
        </div>
      )}
    </div>
  );
}
