// Lista de verificación (OOMRSC-15): una pregunta estándar por cláusula + las que agregue el auditor.
// Calificación vigente: C (conforme) · NC (no conforme) · OM (oportunidad de mejora).
import React, { useRef, useState } from 'react';
import { Paperclip, Plus, Trash2, X, Send, History, RotateCcw } from 'lucide-react';
import { useToast } from '../common/Toast';
import Dialogos, { useDialogos } from '../common/Dialogos';
import { processEvidenceFile } from '../../utils/fileSecurity';
import { urlArchivo } from '../../services/archivosService';
import { BANCO_PREGUNTAS } from '../../constants/auditoriaPreguntas';
import { CAPITULOS, FORMATOS, LETRAS, TIPOS_HALLAZGO, criterioDe, faltanteLista, preguntaExtra, preguntasDeClausula, resumenPreguntas } from '../../constants/auditorias';
import { Bloque, ENTRADA, Rango, tituloAuditoria, LISTA } from './ui';
import { Leyenda } from '../common/estilosCampos';
import { AnalisisIA } from './Evaluaciones';

const COLOR = { C: 'bg-emerald-600 text-white border-emerald-700', NC: 'bg-rose-600 text-white border-rose-700', OM: 'bg-sky-600 text-white border-sky-700' };
const TIPO_DE = { NO_CONFORMIDAD: 'NC', CORRECCION: 'CORRECCION', OPORTUNIDAD: 'OM' };

export default function ListaVerificacion({ lista, auditoria, onCambio, onEntregar, onReabrir, onCerrar, editable, esAdmin, previos = [], usuarioLogueado }) {
  const toast = useToast();
  const { confirmar, props: dialogos } = useDialogos();
  const [clausulaExtra, setClausulaExtra] = useState('');
  const [subiendo, setSubiendo] = useState(null);
  const archivo = useRef(null);
  const destino = useRef(null);
  const puede = editable && lista.estado !== 'ENTREGADA';
  const preguntas = lista.preguntas || [];
  const r = resumenPreguntas(preguntas);
  const setQ = (id, cambios) => onCambio({ ...lista, preguntas: preguntas.map((q) => (q.id === id ? { ...q, ...cambios } : q)) });

  const adjuntar = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    const q = preguntas.find((x) => x.id === destino.current);
    if (!f || !q) return;
    setSubiendo(q.id);
    const res = await processEvidenceFile(f, usuarioLogueado?.nombre || 'Auditor', { entidad: 'auditoria', referencia: String(lista.id) });
    setSubiendo(null);
    if (!res.success) { toast.error(res.error || 'No se pudo adjuntar el archivo.'); return; }
    setQ(q.id, { evidencias: [...(q.evidencias || []), { archivo_id: res.evidencia.archivo_id, nombre: res.evidencia.nombre || f.name }] });
  };

  const entregar = async () => {
    const falta = faltanteLista(preguntas);
    if (falta) { toast.warning(`Para entregar la lista: ${falta}.`); return; }
    const { ok } = await confirmar({ titulo: 'Entregar la lista de verificación', mensaje: `Se generan los reportes de hallazgo (${r.noConformidades} NC, ${r.correcciones} corrección(es), ${r.oportunidades} OM) y la lista ya no se podrá modificar. ¿Entregar?`, textoAceptar: 'Entregar lista' });
    if (ok) onEntregar(lista);
  };

  const fila = (q) => {
    const cr = criterioDe(q);
    const noAplica = q.aplica === false;
    const opciones = q.estandar ? preguntasDeClausula(q.clausula) : [];
    return (
      <tr key={q.id} className={noAplica ? 'opacity-60' : ''}>
        <td className="p-2 align-top font-bold text-marca-azul-oscuro whitespace-nowrap">{q.clausula || '—'}<span className="block text-[11px] font-normal text-slate-600 whitespace-normal max-w-[130px]">{q.titulo}</span>
          {!q.estandar && <span className="inline-block mt-1 px-1.5 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">Agregada</span>}</td>
        <td className="p-2 align-top min-w-[240px]">
          {q.estandar && (puede && opciones.length > 1
            ? <select aria-label={`Pregunta de la cláusula ${q.clausula}`} value={q.pregunta} onChange={(e) => setQ(q.id, { pregunta: e.target.value })} className={LISTA}>{opciones.map((p) => <option key={p}>{p}</option>)}</select>
            : <p className="text-sm text-slate-900">{q.pregunta}</p>)}
          {q.estandar && <p className="text-[11px] text-slate-700 mt-1">{puede && opciones.length > 1 ? q.pregunta : ''}</p>}
          {!q.estandar && <textarea aria-label="Pregunta agregada" rows={2} disabled={!puede} value={q.pregunta} onChange={(e) => setQ(q.id, { pregunta: e.target.value })} placeholder="Escribe la pregunta o el requisito a verificar" className={ENTRADA} />}
        </td>
        <td className="p-2 align-top whitespace-nowrap">
          <div className="flex gap-1" role="group" aria-label={`Calificación de ${q.clausula}`}>
            {Object.keys(LETRAS).map((l) => (
              <button key={l} type="button" title={LETRAS[l]} aria-pressed={q.criterio === l} disabled={!puede || noAplica}
                onClick={() => setQ(q.id, { criterio: q.criterio === l ? '' : l, correccion_menor: l === 'NC' ? Boolean(q.correccion_menor) : false })}
                className={`w-9 py-1 rounded-md border text-xs font-black ${q.criterio === l ? COLOR[l] : 'bg-white text-slate-700 border-slate-300 hover:border-marca-azul'} disabled:cursor-not-allowed`}>{l}</button>))}
          </div>
          {q.criterio === 'NC' && <label className="flex items-center gap-1 mt-1 text-[11px] text-slate-800"><input type="checkbox" disabled={!puede} checked={Boolean(q.correccion_menor)} onChange={(e) => setQ(q.id, { correccion_menor: e.target.checked })} /> Corrección menor (RC)</label>}
          <label className="flex items-center gap-1 mt-1 text-[11px] text-slate-600"><input type="checkbox" disabled={!puede} checked={noAplica} onChange={(e) => setQ(q.id, { aplica: !e.target.checked, criterio: e.target.checked ? '' : q.criterio })} /> No aplica</label>
          {cr && !noAplica && <span className="block mt-1 text-[10px] font-semibold text-slate-600">{TIPOS_HALLAZGO[TIPO_DE[cr]]?.label || 'Conforme'}</span>}
        </td>
        <td className="p-2 align-top min-w-[150px]"><textarea aria-label="Documentos y registros revisados" rows={2} disabled={!puede || noAplica} value={q.documentos || ''} onChange={(e) => setQ(q.id, { documentos: e.target.value })} className={ENTRADA} /></td>
        <td className="p-2 align-top min-w-[220px]">
          <textarea aria-label="Evidencia u observación" rows={2} disabled={!puede || noAplica} value={q.comentario || ''} onChange={(e) => setQ(q.id, { comentario: e.target.value })}
            placeholder={['NC', 'OM'].includes(q.criterio) ? 'Obligatorio: describe el hallazgo y su evidencia' : ''} className={ENTRADA} />
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {(q.evidencias || []).map((ev, i) => (
              <span key={ev.archivo_id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                <a href={urlArchivo(ev.archivo_id)} target="_blank" rel="noreferrer" className="text-marca-azul-oscuro underline max-w-[130px] truncate">{ev.nombre}</a>
                {puede && <button type="button" aria-label={`Quitar ${ev.nombre}`} onClick={() => setQ(q.id, { evidencias: q.evidencias.filter((_, j) => j !== i) })} className="text-rose-700"><X size={11} /></button>}
              </span>))}
            {puede && !noAplica && <button type="button" disabled={subiendo === q.id} onClick={() => { destino.current = q.id; archivo.current?.click(); }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-marca-azul-oscuro hover:underline"><Paperclip size={11} /> {subiendo === q.id ? 'Subiendo…' : 'Adjuntar'}</button>}
            {puede && !q.estandar && <button type="button" onClick={() => onCambio({ ...lista, preguntas: preguntas.filter((x) => x.id !== q.id) })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:underline ml-auto"><Trash2 size={11} /> Quitar pregunta</button>}
          </div>
        </td>
      </tr>);
  };

  return (
    <div className="space-y-3">
      <Dialogos {...dialogos} />
      <input ref={archivo} type="file" className="hidden" onChange={adjuntar} accept="image/*,application/pdf" />
      <header className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-marca-azul-oscuro">Lista de verificación ({FORMATOS.lista}) · {tituloAuditoria(auditoria)}</p>
          <h3 className="text-base font-extrabold text-slate-900">{lista.area}</h3>
          <p className="text-[11px] text-slate-600">Auditor: {lista.auditor || lista.auditor_email || 'sin asignar'} · {lista.estado === 'ENTREGADA' ? 'Entregada' : 'En captura'}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-semibold text-slate-800">
            <span>{r.auditadas} de {r.total} calificadas</span>
            <span className="px-1.5 rounded bg-emerald-100 text-emerald-800">C {r.conformes}</span>
            <span className="px-1.5 rounded bg-rose-100 text-rose-800">NC {r.noConformidades}</span>
            <span className="px-1.5 rounded bg-amber-100 text-amber-900">Corrección {r.correcciones}</span>
            <span className="px-1.5 rounded bg-sky-100 text-sky-800">OM {r.oportunidades}</span>
            <Rango rango={r.rango} pct={r.cumplimiento} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {puede && <button type="button" onClick={entregar} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg inline-flex items-center gap-1.5"><Send size={14} /> Entregar lista</button>}
          {esAdmin && lista.estado === 'ENTREGADA' && auditoria?.estado === 'EN_EJECUCION' && <button type="button" onClick={() => onReabrir(lista)} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RotateCcw size={14} /> Reabrir</button>}
          <button type="button" onClick={onCerrar} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><X size={14} /> Cerrar</button>
        </div>
      </header>

      <Leyenda />

      {previos.length > 0 && (
        <Bloque titulo={`Antecedentes: hallazgos de auditorías anteriores del área (${previos.length})`} ayuda="Da seguimiento a estos puntos durante la entrevista.">
          <ul className="space-y-1 text-xs text-slate-800">
            {previos.slice(0, 15).map((h) => <li key={h.id} className="flex gap-2"><History size={12} className="mt-0.5 shrink-0 text-slate-500" /><span><b>{h.ref}</b> · {TIPOS_HALLAZGO[h.tipo]?.label} · cláusula {h.clausula}: {h.hallazgo}</span></li>)}
          </ul>
        </Bloque>)}
      {previos.length > 0 && puede && (
        <AnalisisIA titulo="Qué revisar en esta auditoría (IA)" boton="Sugerir seguimiento" ayuda="Con los hallazgos anteriores del área, la IA propone a qué dar seguimiento."
          construirPrompt={() => `Vas a auditar el área ${lista.area} (ISO 9001:2015). Hallazgos de sus auditorías anteriores: ${previos.slice(0, 30).map((h) => `[${h.tipo}] ${h.ref}, cláusula ${h.clausula}: ${String(h.hallazgo).slice(0, 220)}`).join(' | ')}. Indica qué se esperaría revisar y a qué dar seguimiento en esta nueva auditoría.`} />)}

      {Object.keys(CAPITULOS).map((cap) => {
        const filas = preguntas.filter((q) => Number(q.capitulo) === Number(cap));
        if (!filas.length) return null;
        return (
          <Bloque key={cap} titulo={`Capítulo ${cap}. ${CAPITULOS[cap]}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th scope="col" className="p-2 text-left">Cláusula</th><th scope="col" className="p-2 text-left">Pregunta</th><th scope="col" className="p-2 text-left">Calificación</th><th scope="col" className="p-2 text-left">Documentos revisados</th><th scope="col" className="p-2 text-left">Evidencia / observación</th></tr></thead>
                <tbody>{filas.map(fila)}</tbody>
              </table>
            </div>
          </Bloque>);
      })}

      {puede && (
        <Bloque titulo="Agregar una pregunta a criterio del auditor">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block flex-1 min-w-[220px]"><span className="block text-xs font-bold text-slate-800 mb-1">Cláusula</span>
              <select value={clausulaExtra} onChange={(e) => setClausulaExtra(e.target.value)} className={LISTA}>
                <option value="">Selecciona la cláusula…</option>{BANCO_PREGUNTAS.map((c) => <option key={c.clausula} value={c.clausula}>{c.clausula} {c.titulo}</option>)}</select></label>
            <button type="button" disabled={!clausulaExtra} onClick={() => { onCambio({ ...lista, preguntas: [...preguntas, preguntaExtra(clausulaExtra)] }); setClausulaExtra(''); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"><Plus size={14} /> Agregar pregunta</button>
          </div>
        </Bloque>)}
    </div>
  );
}
