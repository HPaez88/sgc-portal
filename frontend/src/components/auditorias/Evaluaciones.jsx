// Evaluaciones de la auditoría: la del auditado (OOMRSC-19) y la de auditores para el bono bimestral (OOMRSC-34).
// También el análisis con IA: solo sugiere; no escribe ni cambia registros.
import React, { useState } from 'react';
import { Sparkles, Save } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useToast } from '../common/Toast';
import { formatearFecha } from '../../constants/workflow';
import { ASPECTOS_AUDITOR, ASPECTOS_AUDITORIA, CRITERIOS_BONO, ESCALA_EVALUACION, FORMATOS, MINIMO_BONO, promedioEvaluacion, puntosBono } from '../../constants/auditorias';
import { Bloque, ENTRADA, tituloAuditoria } from './ui';

const CONTEXTO_IA = 'Eres auditor líder experto en ISO 9001:2015 de un organismo operador de agua. Responde únicamente con JSON válido, en español, sin inventar datos que no estén en la información recibida.';

/** Análisis con IA: recibe una función que arma el texto con los datos reales y muestra la respuesta como sugerencia. */
export function AnalisisIA({ titulo, ayuda, construirPrompt, boton = 'Analizar con IA' }) {
  const toast = useToast();
  const [estado, setEstado] = useState('inicio');
  const [res, setRes] = useState(null);
  const pedir = async () => {
    setEstado('cargando');
    const prompt = `${construirPrompt()}\n\nResponde con este JSON: {"resumen": "texto de 3 a 5 oraciones", "puntos": ["hallazgo o tendencia relevante"], "recomendaciones": ["qué revisar o dar seguimiento"]}`;
    const r = await api.post('/api/v1/ai/generar-json', { prompt, context: CONTEXTO_IA }, { timeoutMs: 120000 });
    if (!r.ok || !r.data || (!r.data.resumen && !Array.isArray(r.data.recomendaciones))) { setEstado('inicio'); toast.error('El servicio de IA no respondió. Intenta más tarde.'); return; }
    setRes(r.data); setEstado('listo');
  };
  const lista = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);
  return (
    <Bloque titulo={titulo} ayuda={ayuda}
      derecha={<button type="button" disabled={estado === 'cargando'} onClick={pedir} className="px-3 py-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 rounded-lg disabled:opacity-60 inline-flex items-center gap-1.5"><Sparkles size={14} /> {estado === 'cargando' ? 'Analizando…' : boton}</button>}>
      {estado !== 'listo' ? <p className="text-xs text-slate-600">La IA lee los resultados registrados en el portal y propone un análisis. Es una sugerencia: revísala antes de usarla.</p> : (
        <div className="space-y-2 text-sm text-slate-900">
          {res.resumen && <p>{String(res.resumen)}</p>}
          {lista(res.puntos).length > 0 && <div><p className="text-xs font-extrabold uppercase text-marca-azul-oscuro">Puntos relevantes</p><ul className="list-disc pl-5 text-xs space-y-0.5">{lista(res.puntos).map((p) => <li key={p}>{p}</li>)}</ul></div>}
          {lista(res.recomendaciones).length > 0 && <div><p className="text-xs font-extrabold uppercase text-marca-azul-oscuro">Qué revisar o dar seguimiento</p><ul className="list-disc pl-5 text-xs space-y-0.5">{lista(res.recomendaciones).map((p) => <li key={p}>{p}</li>)}</ul></div>}
          <p className="text-[11px] text-slate-500">Sugerencia generada por IA con los datos del portal. No sustituye el juicio del auditor.</p>
        </div>)}
    </Bloque>
  );
}

const Escala = ({ valor, onChange, etiqueta }) => (
  <select aria-label={etiqueta} value={valor || ''} onChange={(e) => onChange(Number(e.target.value) || '')} className={`${ENTRADA} w-auto`}>
    <option value="">—</option>{ESCALA_EVALUACION.map(([n, t]) => <option key={n} value={n}>{n} · {t}</option>)}</select>);

function FormularioAuditado({ pendiente, onGuardar }) {
  const toast = useToast();
  const [aud, setAud] = useState({});
  const [auditor, setAuditor] = useState({});
  const [comentario, setComentario] = useState('');
  const enviar = () => {
    if (Object.keys(aud).length < ASPECTOS_AUDITORIA.length || Object.keys(auditor).length < ASPECTOS_AUDITOR.length || [...Object.values(aud), ...Object.values(auditor)].some((v) => !v)) { toast.warning('Califica todos los aspectos antes de enviar.'); return; }
    onGuardar({ id: `EV-${pendiente.auditoria.id}-${pendiente.area}`, tipo: 'AUDITADO', auditoria_id: pendiente.auditoria.id, area: pendiente.area, auditoria: aud, auditor, comentario: comentario.trim() });
  };
  const tabla = (titulo, aspectos, valores, set) => (
    <table className="w-full text-xs mb-3">
      <thead><tr><th scope="col" className="p-2 text-left">{titulo}</th><th scope="col" className="p-2 text-left w-44">Calificación</th></tr></thead>
      <tbody>{aspectos.map((t, i) => <tr key={t}><td className="p-2 text-slate-900">{i + 1}. {t}</td><td className="p-2"><Escala etiqueta={t} valor={valores[i]} onChange={(v) => set({ ...valores, [i]: v })} /></td></tr>)}</tbody>
    </table>);
  return (
    <Bloque titulo={`Evalúa la auditoría de tu área: ${pendiente.area} · ${tituloAuditoria(pendiente.auditoria)} (${FORMATOS.evaluacion})`} ayuda="Tu opinión ayuda a mejorar el proceso de auditoría. Una vez enviada no se modifica.">
      {tabla('A. La auditoría', ASPECTOS_AUDITORIA, aud, setAud)}
      {tabla('B. El auditor', ASPECTOS_AUDITOR, auditor, setAuditor)}
      <label className="block mb-2"><span className="block text-xs font-bold text-slate-800 mb-1">C. Comentarios o sugerencias</span><textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} className={ENTRADA} /></label>
      <button type="button" onClick={enviar} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg inline-flex items-center gap-1.5"><Save size={14} /> Enviar evaluación</button>
    </Bloque>
  );
}

export default function EvaluacionesPanel({ auditorias, evaluaciones, pendientes, onGuardar, esAdmin, usuarios = [] }) {
  const concluidas = auditorias.filter((a) => ['INFORME', 'CERRADA'].includes(a.estado)).sort((a, b) => (b.anio - a.anio) || (b.numero - a.numero));
  const [elegida, setElegida] = useState('');
  const a = concluidas.find((x) => String(x.id) === elegida) || concluidas[0];
  const delAuditado = evaluaciones.filter((e) => e.tipo === 'AUDITADO');
  const refDe = (id) => { const x = auditorias.find((y) => y.id === id); return x ? `#${x.numero}/${x.anio}` : '—'; };
  const nombreDe = (correo) => usuarios.find((u) => String(u.email).toLowerCase() === String(correo).toLowerCase())?.nombre || correo;
  const equipo = a ? [...new Set((a.areas || []).flatMap((x) => [x.auditor_lider, ...(x.auditores || [])]).filter(Boolean).map((c) => String(c).toLowerCase()))] : [];
  const bonoDe = (correo) => evaluaciones.find((e) => e.id === `BONO-${a.id}-${correo}`);
  // Sugerencia para el criterio "evaluación de la realización": 1 punto si el auditado lo calificó con 8 o más.
  const sugerido = (correo) => {
    const areasSuyas = (a.areas || []).filter((x) => [x.auditor_lider, ...(x.auditores || [])].map((c) => String(c).toLowerCase()).includes(correo)).map((x) => x.area);
    const proms = delAuditado.filter((e) => e.auditoria_id === a.id && areasSuyas.includes(e.area)).map((e) => promedioEvaluacion(e.auditor)).filter((n) => n != null);
    return proms.length ? proms.reduce((s, n) => s + n, 0) / proms.length : null;
  };
  const setBono = (correo, k, v, max) => {
    const previa = bonoDe(correo) || { id: `BONO-${a.id}-${correo}`, tipo: 'BONO', auditoria_id: a.id, auditor_email: correo, auditor: nombreDe(correo), valores: {} };
    const valores = { ...previa.valores, [k]: Math.min(max, Math.max(0, Number(v) || 0)) };
    onGuardar({ ...previa, valores, total: puntosBono(valores) });
  };
  return (
    <div className="space-y-3">
      {pendientes.map((p) => <FormularioAuditado key={`${p.auditoria.id}-${p.area}`} pendiente={p} onGuardar={onGuardar} />)}
      <Bloque titulo={`A. Evaluación de la auditoría por el auditado (${FORMATOS.evaluacion})`} ayuda="Escala: 2 deficiente, 4 regular, 6 bueno, 8 muy bueno, 10 excelente.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Auditoría</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-center">Promedio de la auditoría</th><th scope="col" className="p-2 text-center">Promedio del auditor</th><th scope="col" className="p-2 text-left min-w-[200px]">Comentarios</th><th scope="col" className="p-2 text-left">Evaluó</th></tr></thead>
            <tbody>
              {delAuditado.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Aún no hay evaluaciones. Las áreas evalúan cuando se entrega el informe.</td></tr>}
              {delAuditado.map((e) => <tr key={e.id}><td className="p-2 font-semibold">{refDe(e.auditoria_id)}</td><td className="p-2">{e.area}</td><td className="p-2 text-center font-bold">{promedioEvaluacion(e.auditoria) ?? '—'}</td><td className="p-2 text-center font-bold">{promedioEvaluacion(e.auditor) ?? '—'}</td><td className="p-2">{e.comentario || '—'}</td><td className="p-2">{e.por}<span className="block text-slate-600">{formatearFecha(e.fecha)}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </Bloque>
      {esAdmin && a && (
        <Bloque titulo={`B. Evaluación de auditores para el bono (${FORMATOS.bono})`} ayuda={`Total de 10 puntos; el bono procede con ${MINIMO_BONO} o más. Se guarda al capturar.`}
          derecha={<select aria-label="Auditoría" value={String(a.id)} onChange={(e) => setElegida(e.target.value)} className={`${ENTRADA} w-auto`}>{concluidas.map((x) => <option key={x.id} value={String(x.id)}>{tituloAuditoria(x)}</option>)}</select>}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr><th scope="col" className="p-2 text-left">Auditor</th>{CRITERIOS_BONO.map(([k, t, max]) => <th key={k} scope="col" className="p-2 text-center max-w-[110px]">{t} ({max})</th>)}<th scope="col" className="p-2 text-center">Total</th><th scope="col" className="p-2 text-left">Bono</th></tr></thead>
              <tbody>
                {equipo.length === 0 && <tr><td colSpan={CRITERIOS_BONO.length + 3} className="p-6 text-center text-slate-500">Esta auditoría no tiene auditores asignados.</td></tr>}
                {equipo.map((correo) => { const ev = bonoDe(correo); const total = puntosBono(ev?.valores); const sug = sugerido(correo); return (
                  <tr key={correo}>
                    <td className="p-2 font-semibold text-slate-900">{nombreDe(correo)}{sug != null && <span className="block text-[11px] font-normal text-slate-600">El auditado lo calificó con {Math.round(sug * 10) / 10}</span>}</td>
                    {CRITERIOS_BONO.map(([k, t, max]) => <td key={k} className="p-2 text-center"><input aria-label={`${t} de ${nombreDe(correo)}`} type="number" min={0} max={max} step={1} value={ev?.valores?.[k] ?? ''} onChange={(e) => setBono(correo, k, e.target.value, max)} className={`${ENTRADA} w-16 text-center`} /></td>)}
                    <td className="p-2 text-center font-black">{ev ? total : '—'}</td>
                    <td className="p-2">{!ev ? '—' : total >= MINIMO_BONO ? <span className="font-bold text-emerald-800">Procede</span> : <span className="font-bold text-rose-700">No procede</span>}</td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </Bloque>)}
    </div>
  );
}
