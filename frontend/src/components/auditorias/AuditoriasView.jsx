// Auditorías internas ISO 9001:2015 (procedimiento OOMPSC-08): programa, equipo auditor, listas de verificación,
// hallazgos y resultados. Las reglas viven en constants/auditorias.js y en el servidor (flujo_reglas.py).
import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Plus, Trash2, Eye, CheckCircle2, MailCheck } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { useLocalStorage } from '../../hooks';
import { api } from '../../services/apiClient';
import { recargarClave } from '../../services/estadoService';
import { useToast } from '../common/Toast';
import Dialogos, { useDialogos } from '../common/Dialogos';
import ModalBase from '../common/ModalBase';
import { esAdminSGC, formatearFecha } from '../../constants/workflow';
import { puedeCapturarArea } from '../../constants/riesgos';
import { getDireccionDeArea } from '../../constants/direcciones';
import { siguienteHabil } from '../../constants/fechasHabiles';
import { CLAVE_RC, enDiasISO, folioRC, hoyISO } from '../../constants/reportesCorreccion';
import { acDesdeAuditoria } from '../../services/flujoService';
import {
  CLAVE_AUDITORIAS, CLAVE_LISTAS, CLAVE_HALLAZGOS, CLAVE_EVALUACIONES, CLAVE_HISTORICO, BIMESTRES, FORMATOS, bimestreDe, calendarioAnual, hallazgosDeLista,
  listaAutomatica, nuevaAuditoria, numeroSiguiente, plazoApertura, resumenPreguntas, auditoresRequeridos,
} from '../../constants/auditorias';
import { Bloque, EstadoAuditoria, Rango, tituloAuditoria, LISTA } from './ui';
import EditorAuditoria from './EditorAuditoria';
import ListaVerificacion from './ListaVerificacion';
import { CalendarioPanel, HallazgosPanel, ResultadosPanel } from './Paneles';
import EvaluacionesPanel from './Evaluaciones';
import HistoricoPanel from './Historico';

const minus = (t) => String(t || '').toLowerCase();
const folioAud = (a) => `AUD-${a.numero}/${a.anio}`;

export default function AuditoriasView() {
  const { areasDetalle = [], usuarios = [], usuarioLogueado, registrarMovimiento, accionesCorrectivas = [], setAccionesCorrectivas, puedeTodasAreas } = useSGC();
  const toast = useToast();
  const { confirmar, solicitar, props: dialogos } = useDialogos();
  const [auditorias, setAuditorias] = useLocalStorage(CLAVE_AUDITORIAS, []);
  const [listas, setListas] = useLocalStorage(CLAVE_LISTAS, []);
  const [hallazgos, setHallazgos] = useLocalStorage(CLAVE_HALLAZGOS, []);
  const [reportesRC, setReportesRC] = useLocalStorage(CLAVE_RC, []);
  const [evaluaciones, setEvaluaciones] = useLocalStorage(CLAVE_EVALUACIONES, []);
  const [historico] = useLocalStorage(CLAVE_HISTORICO, []);   // informes anteriores al portal: solo lectura
  const [pestana, setPestana] = useState('programa');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [abiertaId, setAbiertaId] = useState(null);
  const [listaId, setListaId] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const esAdmin = esAdminSGC(usuarioLogueado);
  const miCorreo = minus(usuarioLogueado?.email);
  const puedeAuditar = ['Auditor', 'Admin', 'Super Admin'].includes(usuarioLogueado?.rol);
  const areas = useMemo(() => areasDetalle.map((x) => x.nombre).filter(Boolean), [areasDetalle]);
  const auditores = useMemo(() => usuarios.filter((u) => u.rol === 'Auditor' && u.activo !== false), [usuarios]);
  const esMiArea = (area) => puedeCapturarArea(usuarioLogueado, area, areasDetalle);
  const veArea = (area) => puedeTodasAreas || esAdmin || esMiArea(area);
  const esMiLista = (l) => miCorreo && (minus(l.auditor_email) === miCorreo || (l.coauditores || []).map(minus).includes(miCorreo));

  // Liga del correo de invitación: /?auditoria=ID abre esa auditoría.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('auditoria');
    if (id) { setAbiertaId(id); recargarClave(CLAVE_AUDITORIAS); }
  }, []);

  const abierta = auditorias.find((x) => String(x.id) === String(abiertaId));
  const listaAbierta = listas.find((l) => l.id === listaId);
  const antecedentes = useMemo(() => Object.fromEntries(calendarioAnual({ areas, auditorias, listas, hallazgos, historico }).map((f) => [f.area, f])), [areas, auditorias, listas, hallazgos, historico]);
  const delAnio = auditorias.filter((x) => Number(x.anio) === Number(anio)).sort((x, y) => x.numero - y.numero);
  const anios = [...new Set([new Date().getFullYear(), new Date().getFullYear() + 1, ...auditorias.map((x) => Number(x.anio))])].sort((x, y) => y - x);
  const invitaciones = puedeAuditar ? auditorias.filter((x) => x.estado === 'INVITACION') : [];
  const listasVisibles = listas.filter((l) => esAdmin || esMiLista(l)).sort((x, y) => String(y.fecha_creacion).localeCompare(String(x.fecha_creacion)));
  const hallazgosVisibles = hallazgos.filter((h) => veArea(h.area) || minus(h.auditor_email) === miCorreo);
  const bitacora = (a, accion, descripcion) => registrarMovimiento?.({ modulo: 'AUDITORIAS', accion, descripcion, folio: folioAud(a) });

  const crear = () => {
    const nueva = nuevaAuditoria({ anio, numero: numeroSiguiente(auditorias, anio), bimestre: Number(anio) === new Date().getFullYear() ? bimestreDe(hoyISO()) : 0, por: usuarioLogueado?.nombre || '' });
    setAuditorias((prev) => [...prev, nueva]);
    setAbiertaId(nueva.id);
    bitacora(nueva, 'AUDITORIA_CREADA', `Se programa la ${tituloAuditoria(nueva)}`);
  };

  const eliminar = async (a) => {
    const { ok } = await confirmar({ titulo: 'Eliminar auditoría', mensaje: `Se eliminará la ${tituloAuditoria(a)} que está en planeación. Esta acción no se puede deshacer.`, textoAceptar: 'Eliminar', peligro: true });
    if (!ok) return;
    setAuditorias((prev) => prev.filter((x) => x.id !== a.id));
    bitacora(a, 'AUDITORIA_ELIMINADA', `Se elimina la ${tituloAuditoria(a)} en planeación`);
  };

  // Al iniciar la auditoría se genera una lista por área (una pregunta por cláusula, tomada del banco).
  // ponytail: una lista por área que comparte el equipo (líder + apoyo); una por auditor si el SGC lo pide.
  const generarListas = (a) => {
    const nombreDe = (correo) => usuarios.find((u) => minus(u.email) === minus(correo))?.nombre || correo;
    const nuevas = (a.areas || []).filter((x) => !listas.some((l) => l.id === `${a.id}-${x.area}`)).map((x) => {
      const equipo = [x.auditor_lider, ...(x.auditores || [])].filter(Boolean).map(minus);
      return { id: `${a.id}-${x.area}`, auditoria_id: a.id, area: x.area, direccion: x.direccion || '', auditor_email: equipo[0] || '', auditor: nombreDe(equipo[0] || ''), coauditores: equipo.slice(1),
        estado: 'EN_CAPTURA', preguntas: listaAutomatica(`${a.id}|${x.area}`), fecha_creacion: new Date().toISOString() };
    });
    if (nuevas.length) setListas((prev) => [...prev, ...nuevas]);
  };

  const guardarAuditoria = (nueva, opciones) => {
    if (opciones?.soloLocal) return;
    const previa = auditorias.find((x) => x.id === nueva.id);
    setAuditorias((prev) => prev.map((x) => (x.id === nueva.id ? nueva : x)));
    if (previa?.estado === 'PROGRAMADA' && nueva.estado === 'EN_EJECUCION') { generarListas(nueva); toast.success('Auditoría iniciada: se generó la lista de verificación de cada área.'); }
  };

  // Informe: cada NC genera su acción correctiva "Por abrir" (límite 5 días hábiles) y cada corrección menor su RC.
  const emitirInforme = (a) => {
    const hoy = hoyISO();
    const limite = plazoApertura(hoy);
    const propios = hallazgos.filter((h) => h.auditoria_id === a.id);
    const nuevasAC = []; const nuevosRC = []; const ligas = {};
    propios.forEach((h, i) => {
      const texto = `Cláusula ${h.clausula} ${h.requisito}. ${h.hallazgo}`.trim();
      if (h.tipo === 'NC' && !h.ac_id) {
        const ac = { ...acDesdeAuditoria(a, { area: h.area, direccion: getDireccionDeArea(h.area) || '', hallazgo: texto, evidencia: h.documentos || undefined }), hallazgo_id: h.id, clausula: h.clausula, fecha_limite_apertura: limite };
        ac.id += i * 1000;
        nuevasAC.push(ac); ligas[h.id] = { ac_id: ac.id, limite_apertura: limite };
      }
      if (h.tipo === 'CORRECCION' && !h.rc_folio) {
        const folio = folioRC([...reportesRC, ...nuevosRC], new Date().getFullYear());
        nuevosRC.push({ id: Date.now() + i, folio, origen: 'Auditoría', auditoria_id: a.id, hallazgo_id: h.id, numeroIndicador: folioAud(a), ejercicio: String(a.anio), mes: '', area: h.area, proceso: '', responsable: '',
          descripcion: texto, causa: '', accion: '', fechaCompromiso: siguienteHabil(enDiasISO(15)), fechaRegistro: hoy, estado: 'EN_ATENCION' });
        ligas[h.id] = { rc_folio: folio };
      }
    });
    if (nuevasAC.length) setAccionesCorrectivas((prev) => [...nuevasAC, ...prev]);
    if (nuevosRC.length) setReportesRC((prev) => [...prev, ...nuevosRC]);
    if (Object.keys(ligas).length) setHallazgos((prev) => prev.map((h) => (ligas[h.id] ? { ...h, ...ligas[h.id] } : h)));
    setAuditorias((prev) => prev.map((x) => (x.id === a.id ? { ...x, estado: 'INFORME', fecha_informe: hoy } : x)));
    bitacora(a, 'AUDITORIA_INFORME', `Informe de la ${tituloAuditoria(a)}: ${nuevasAC.length} acción(es) correctiva(s) por abrir y ${nuevosRC.length} reporte(s) de corrección`);
    toast.success(`Informe emitido. ${nuevasAC.length} acción(es) correctiva(s) quedaron en "Por abrir" (límite ${formatearFecha(limite)}) y ${nuevosRC.length} reporte(s) de corrección.`, { duracion: 9000 });
  };

  const guardarLista = (l) => setListas((prev) => prev.map((x) => (x.id === l.id ? l : x)));
  const entregarLista = (l) => {
    const ahora = new Date().toISOString();
    const entregada = { ...l, estado: 'ENTREGADA', fecha_entrega: ahora, entregada_por: usuarioLogueado?.nombre || '' };
    const generados = hallazgosDeLista(entregada, { por: usuarioLogueado?.nombre || '', ahora }).map((h) => ({ ...h, auditor_email: miCorreo }));
    guardarLista(entregada);
    // Si la lista se reabrió y se vuelve a entregar: se actualizan los hallazgos sin firma y se conservan los firmados.
    setHallazgos((prev) => {
      const ids = new Set(generados.map((h) => h.id));
      const conservados = prev.filter((h) => h.lista_id !== l.id || h.aceptado_por || h.ac_id || h.rc_folio || ids.has(h.id))
        .map((h) => { const n = generados.find((g) => g.id === h.id); return n && !h.aceptado_por ? { ...n, auditor_email: h.auditor_email || n.auditor_email } : h; });
      return [...conservados, ...generados.filter((g) => !prev.some((h) => h.id === g.id))];
    });
    const a = auditorias.find((x) => x.id === l.auditoria_id);
    if (a) bitacora(a, 'LISTA_ENTREGADA', `Lista de verificación de ${l.area} entregada con ${generados.length} hallazgo(s)`);
    toast.success(`Lista entregada. Se generaron ${generados.length} reporte(s) de hallazgo.`);
    setListaId(null);
  };
  const reabrirLista = (l) => { guardarLista({ ...l, estado: 'EN_CAPTURA' }); toast.info?.('Lista reabierta para corrección del auditor.'); };

  const responder = async (a, accion) => {
    setOcupado(true);
    const r = await api.post(`/api/v1/auditorias/${a.id}/${accion}`, {});
    setOcupado(false);
    if (!r.ok) { toast.error(r.error?.message || 'No se pudo registrar tu respuesta.'); return; }
    await recargarClave(CLAVE_AUDITORIAS);
    toast.success(accion === 'confirmar' ? `Participación confirmada. Tu lugar en el orden de confirmación: ${r.data.orden}.` : 'Se retiró tu confirmación.');
  };

  const firmar = async (h) => {
    const { ok, valor } = await solicitar({ titulo: 'Firmar de enterado', subtitulo: `${h.area} · cláusula ${h.clausula}`, etiqueta: 'Comentario del área auditada (opcional)', textoAceptar: 'Firmar de enterado', filas: 3, requerido: false });
    if (!ok) return;
    setHallazgos((prev) => prev.map((x) => (x.id === h.id ? { ...x, aceptado_por: usuarioLogueado?.nombre || '', fecha_aceptacion: new Date().toISOString(), comentario_auditado: valor || '' } : x)));
  };

  // El área evalúa cada auditoría suya una vez entregado el informe (OOMRSC-19).
  const pendientesEval = esAdmin ? [] : auditorias.filter((a) => ['INFORME', 'CERRADA'].includes(a.estado))
    .flatMap((a) => (a.areas || []).filter((x) => esMiArea(x.area) && !evaluaciones.some((e) => e.id === `EV-${a.id}-${x.area}`)).map((x) => ({ auditoria: a, area: x.area })));
  const guardarEvaluacion = (ev) => {
    const completa = { ...ev, por: usuarioLogueado?.nombre || '', fecha: new Date().toISOString() };
    setEvaluaciones((prev) => (prev.some((e) => e.id === ev.id) ? prev.map((e) => (e.id === ev.id ? completa : e)) : [...prev, completa]));
    if (ev.tipo === 'AUDITADO') toast.success('Evaluación enviada. Gracias por tu opinión.');
  };

  const previosDe = (l) => hallazgos.filter((h) => h.area === l.area && h.auditoria_id !== l.auditoria_id && h.tipo !== 'OM')
    .map((h) => { const a = auditorias.find((x) => x.id === h.auditoria_id); return { ...h, ref: a ? `Auditoría #${a.numero}/${a.anio}` : 'Auditoría anterior' }; });

  // Los informes anteriores traen hallazgos de todas las áreas: los consulta el SGC, los auditores y quien ve todas las áreas.
  const veHistorico = esAdmin || puedeTodasAreas || puedeAuditar;
  const PESTANAS = [['programa', 'Programa'], ['calendario', 'Calendario anual'], ...(esAdmin || listasVisibles.length ? [['listas', `Listas de verificación (${listasVisibles.length})`]] : []),
    ['hallazgos', `Hallazgos (${hallazgosVisibles.length})`], ['resultados', 'Resultados'], ['evaluaciones', `Evaluaciones${pendientesEval.length ? ` (${pendientesEval.length} pendiente)` : ''}`],
    ...(veHistorico ? [['historico', `Histórico (${(historico || []).length})`]] : [])];

  const cuerpo = () => {
    if (listaAbierta) {
      const a = auditorias.find((x) => x.id === listaAbierta.auditoria_id);
      return <ListaVerificacion lista={listaAbierta} auditoria={a} onCambio={guardarLista} onEntregar={entregarLista} onReabrir={reabrirLista} onCerrar={() => setListaId(null)}
        editable={(esAdmin || esMiLista(listaAbierta)) && a?.estado === 'EN_EJECUCION'} esAdmin={esAdmin} previos={previosDe(listaAbierta)} usuarioLogueado={usuarioLogueado} />;
    }
    return null;
  };
  const ventanaAuditoria = () => {
      const suyas = listas.filter((l) => l.auditoria_id === abierta.id);
      return <EditorAuditoria auditoria={abierta} onCambio={guardarAuditoria} editable={esAdmin} areas={areas} auditores={auditores} antecedentes={antecedentes}
        usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} listasEntregadas={{ total: suyas.length, entregadas: suyas.filter((l) => l.estado === 'ENTREGADA').length }} onEmitirInforme={emitirInforme} />;
  };
  const cuerpoPestana = () => {
    if (pestana === 'calendario') return <CalendarioPanel areas={areas.filter(veArea)} auditorias={auditorias} listas={listas} hallazgos={hallazgos} historico={historico} anio={anio} onAbrir={setAbiertaId} />;
    if (pestana === 'hallazgos') return <HallazgosPanel hallazgos={hallazgosVisibles} auditorias={auditorias} acciones={accionesCorrectivas} puedeFirmar={(h) => !esAdmin && esMiArea(h.area)} onFirmar={firmar} />;
    if (pestana === 'resultados') return <ResultadosPanel auditorias={auditorias} listas={listas} hallazgos={hallazgos} areasVisibles={puedeTodasAreas || esAdmin || puedeAuditar ? null : areas.filter(esMiArea)} />;
    if (pestana === 'evaluaciones') return <EvaluacionesPanel auditorias={auditorias} evaluaciones={evaluaciones.filter((e) => esAdmin || puedeTodasAreas || (e.tipo === 'AUDITADO' && esMiArea(e.area)))} pendientes={pendientesEval} onGuardar={guardarEvaluacion} esAdmin={esAdmin} usuarios={usuarios} />;
    if (pestana === 'historico' && veHistorico) return <HistoricoPanel informes={historico || []} />;
    if (pestana === 'listas') return (
      <Bloque titulo={`Listas de verificación (${FORMATOS.lista})`} ayuda="Se generan al iniciar la auditoría: una pregunta por cláusula tomada del banco. El auditor puede cambiarla por otra del banco y agregar las suyas.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Auditoría</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Auditor</th><th scope="col" className="p-2 text-left">Avance</th><th scope="col" className="p-2 text-left">Resultado</th><th scope="col" className="p-2 text-left">Estado</th><th scope="col" className="p-2 text-right">Acción</th></tr></thead>
            <tbody>
              {listasVisibles.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Aún no hay listas. Se generan cuando el SGC inicia una auditoría.</td></tr>}
              {listasVisibles.map((l) => { const a = auditorias.find((x) => x.id === l.auditoria_id); const r = resumenPreguntas(l.preguntas); return (
                <tr key={l.id}>
                  <td className="p-2 font-semibold whitespace-nowrap">{a ? `#${a.numero}/${a.anio}` : '—'}</td><td className="p-2 font-semibold text-slate-900">{l.area}</td><td className="p-2">{l.auditor || l.auditor_email || 'Sin asignar'}</td>
                  <td className="p-2">{r.auditadas} de {r.total}</td><td className="p-2"><Rango rango={r.rango} pct={r.cumplimiento} /></td>
                  <td className="p-2">{l.estado === 'ENTREGADA' ? <span className="inline-flex items-center gap-1 text-emerald-800 font-bold"><CheckCircle2 size={12} /> Entregada {formatearFecha(l.fecha_entrega)}</span> : <span className="text-amber-800 font-bold">En captura</span>}</td>
                  <td className="p-2 text-right"><button type="button" onClick={() => setListaId(l.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-marca-azul-oscuro text-white font-bold"><Eye size={12} /> {l.estado === 'ENTREGADA' ? 'Ver' : 'Capturar'}</button></td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </Bloque>);
    return (
      <Bloque titulo={`Programa de auditorías ${anio} (${FORMATOS.programa})`} ayuda="Las auditorías se programan por bimestre. Cada una sigue estas etapas: planeación, invitación a auditores, programada, en ejecución, informe y cierre."
        derecha={esAdmin && <button type="button" onClick={crear} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg inline-flex items-center gap-1.5"><Plus size={14} /> Nueva auditoría</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Auditoría</th><th scope="col" className="p-2 text-left">Bimestre</th><th scope="col" className="p-2 text-left">Fechas</th><th scope="col" className="p-2 text-left min-w-[200px]">Áreas</th><th scope="col" className="p-2 text-left">Auditores</th><th scope="col" className="p-2 text-left">Etapa</th><th scope="col" className="p-2 text-right">Acción</th></tr></thead>
            <tbody>
              {delAnio.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No hay auditorías programadas en {anio}.{esAdmin ? ' Usa "Nueva auditoría" para programar la del bimestre.' : ''}</td></tr>}
              {delAnio.map((a) => (
                <tr key={a.id}>
                  <td className="p-2 font-bold text-slate-900 whitespace-nowrap">#{a.numero}/{a.anio}<span className="block font-normal text-slate-600">{a.tipo}</span></td>
                  <td className="p-2">{BIMESTRES[a.bimestre]}</td>
                  <td className="p-2 whitespace-nowrap">{a.fecha_inicio ? `${formatearFecha(a.fecha_inicio)} a ${formatearFecha(a.fecha_fin)}` : 'Por definir'}</td>
                  <td className="p-2">{(a.areas || []).map((x) => x.area).join(', ') || 'Por definir'}</td>
                  <td className="p-2">{(a.confirmaciones || []).length} confirmados de {auditoresRequeridos(a)}</td>
                  <td className="p-2"><EstadoAuditoria estado={a.estado} /></td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setAbiertaId(a.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-marca-azul-oscuro text-white font-bold"><Eye size={12} /> {esAdmin && a.estado !== 'CERRADA' ? 'Gestionar' : 'Ver'}</button>
                    {esAdmin && a.estado === 'PLANEACION' && <button type="button" onClick={() => eliminar(a)} aria-label={`Eliminar auditoría ${a.numero}`} className="ml-2 text-rose-700 inline-flex items-center gap-1 hover:underline"><Trash2 size={12} /> Eliminar</button>}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Bloque>);
  };

  return (
    <div className="tablas-marcadas space-y-3">
      <Dialogos {...dialogos} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={22} className="text-marca-azul-oscuro" />
          <div><h2 className="text-lg font-extrabold text-slate-900">Auditorías internas</h2><p className="text-xs text-slate-600">ISO 9001:2015 · procedimiento OOMPSC-08</p></div>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800">Año
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className={`${LISTA} w-auto`}>{anios.map((x) => <option key={x}>{x}</option>)}</select></label>
      </header>

      {invitaciones.map((a) => { const mia = (a.confirmaciones || []).find((c) => minus(c.email) === miCorreo); return (
        <div key={a.id} className="rounded-xl border border-sky-300 bg-sky-50 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2"><MailCheck size={18} className="text-sky-700 mt-0.5" />
            <div><p className="text-sm font-extrabold text-slate-900">Invitación a auditores: {tituloAuditoria(a)}</p>
              <p className="text-xs text-slate-700">Del {formatearFecha(a.fecha_inicio)} al {formatearFecha(a.fecha_fin)} · {(a.areas || []).map((x) => x.area).join(', ')} · se requieren {auditoresRequeridos(a)} auditor(es). El equipo se integra en el orden de confirmación.</p>
              {mia && <p className="text-xs font-bold text-emerald-800 mt-0.5">Ya confirmaste. Tu lugar: {mia.orden}º</p>}</div></div>
          {mia ? <button type="button" disabled={ocupado} onClick={() => responder(a, 'retirar')} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 bg-white rounded-lg">Retirar mi confirmación</button>
            : <button type="button" disabled={ocupado} onClick={() => responder(a, 'confirmar')} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg">Confirmar mi participación</button>}
        </div>); })}

      {!listaAbierta && (
        <nav className="flex flex-wrap gap-1.5" aria-label="Secciones de auditorías">
          {PESTANAS.map(([id, t]) => (
            <button key={id} type="button" aria-pressed={pestana === id} onClick={() => setPestana(id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${pestana === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>{t}</button>))}
        </nav>)}
      {cuerpo() || cuerpoPestana()}
      {abierta && !listaAbierta && (
        <ModalBase isOpen onClose={() => setAbiertaId(null)} size="3xl" closeOnBackdrop={false} icono={<ClipboardCheck size={20} />} bodyClassName="tablas-marcadas p-4 bg-slate-50"
          titulo={tituloAuditoria(abierta)} subtitulo={`${esAdmin && abierta.estado !== 'CERRADA' ? 'Gestión de la auditoría' : 'Consulta'} · los cambios se guardan al capturar`}>
          {ventanaAuditoria()}
        </ModalBase>
      )}
    </div>
  );
}
