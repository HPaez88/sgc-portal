// Síntesis estratégica de una dirección o del organismo: FODA consolidado, riesgos y oportunidades
// prioritarios (de todos los niveles) y plan con líneas de acción. La IA propone, el SGC edita y guarda.
import React, { useEffect, useState } from 'react';
import { Sparkles, Save, Plus, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import FodaEditor from './FodaEditor';
import { api } from '../../services/apiClient';
import { useToast } from '../common/Toast';
import { promptSintesis, normalizarSintesis, SINTESIS_VACIA } from '../../constants/sintesisIA';
import { normalizarFoda, fodaVacio } from '../../constants/foda';
import { formatearFecha } from '../../constants/workflow';

const campo = 'w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-50';
const CONTEXTO_IA = 'Eres asesor experto en ISO 9001:2015 del SGC de OOMAPAS de Cajeme. Responde únicamente con JSON válido.';
const NIVEL_CLS = { Alto: 'bg-rose-100 text-rose-800 border-rose-200', Medio: 'bg-amber-100 text-amber-800 border-amber-200', Bajo: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

function Bloque({ titulo, nota, children, onAgregar, puedeEditar }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-extrabold text-slate-900">{titulo}</h4>
        <span className="flex items-center gap-2">
          {nota && <span className="text-[11px] text-slate-600">{nota}</span>}
          {puedeEditar && onAgregar && <button type="button" onClick={onAgregar} className="text-xs font-bold text-marca-azul-oscuro inline-flex items-center gap-1 hover:underline"><Plus size={13} /> Agregar</button>}
        </span>
      </div>
      {children}
    </section>
  );
}

export default function SintesisPanel({ nivel, nombre, anio, unidades, valor, onGuardar, puedeEditar, usuarioLogueado }) {
  const toast = useToast();
  const [s, setS] = useState(valor || SINTESIS_VACIA);
  const [revisado, setRevisado] = useState(valor?.estado === 'revisado');
  const [pensando, setPensando] = useState(false);
  useEffect(() => { setS(valor || SINTESIS_VACIA); setRevisado(valor?.estado === 'revisado'); }, [valor, nombre, anio]);
  const conInfo = unidades.filter((u) => !fodaVacio(u.foda) || (u.registros || []).length);
  const unidad = nivel === 'organismo' ? 'direcciones' : 'áreas';

  const sugerir = async () => {
    setPensando(true);
    const r = await api.post('/api/v1/ai/generar-json', { prompt: promptSintesis({ nivel, nombre, anio, unidades }), context: CONTEXTO_IA }, { timeoutMs: 120000 });
    setPensando(false);
    if (!r.ok) return toast.error('La IA no respondió. Intenta de nuevo en un momento.');
    setS(normalizarSintesis(r.data));
    setRevisado(false);
    toast.success('Propuesta lista: revísala, ajústala y guarda.');
  };

  const guardar = () => {
    onGuardar({ ...s, foda: normalizarFoda(s.foda), estado: revisado ? 'revisado' : 'borrador', actualizado: new Date().toISOString(), por: usuarioLogueado?.nombre || '' });
    toast.success('Síntesis guardada.');
  };

  const editarLista = (clave, i, patch) => setS({ ...s, [clave]: s[clave].map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const quitar = (clave, i) => setS({ ...s, [clave]: s[clave].filter((_, k) => k !== i) });
  const ro = !puedeEditar;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Síntesis {anio} · {conInfo.length} de {unidades.length} {unidad} con información</p>
          <h3 className="text-lg font-extrabold text-slate-900">{nombre}</h3>
          <p className="text-xs mt-0.5">
            {valor?.estado === 'revisado'
              ? <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 size={13} /> Revisada · {formatearFecha(valor.actualizado)}</span>
              : valor ? <span className="inline-flex items-center gap-1 text-amber-700 font-semibold"><AlertTriangle size={13} /> Borrador · {formatearFecha(valor.actualizado)}</span>
                : <span className="text-slate-500">Aún no se arma la síntesis de {anio}.</span>}
          </p>
        </div>
        {puedeEditar && (
          <button type="button" onClick={sugerir} disabled={pensando || !conInfo.length}
            className="px-4 py-2 text-sm font-bold text-violet-800 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 inline-flex items-center gap-1.5">
            <Sparkles size={15} /> {pensando ? 'Armando la síntesis…' : `Proponer con IA desde sus ${unidad}`}
          </button>
        )}
      </div>

      <Bloque titulo="FODA consolidado" nota="Solo lo de mayor peso (máx. 5 por cuadrante)">
        <FodaEditor foda={s.foda} soloLectura={ro} onChange={(foda) => setS({ ...s, foda })} />
      </Bloque>

      <Bloque titulo="Riesgos prioritarios" nota="De todos los niveles" puedeEditar={puedeEditar}
        onAgregar={() => setS({ ...s, riesgos: [...s.riesgos, { descripcion: '', nivel: 'Medio', unidades: [], razon: '' }] })}>
        {!s.riesgos.length && <p className="text-sm text-slate-500">Sin riesgos priorizados.</p>}
        <ol className="space-y-2">
          {s.riesgos.map((r, i) => (
            <li key={i} className="grid grid-cols-1 lg:grid-cols-[110px_1fr_1fr_auto] gap-2 items-start border border-slate-200 rounded-lg p-2">
              <select value={r.nivel} disabled={ro} onChange={(e) => editarLista('riesgos', i, { nivel: e.target.value })} aria-label="Nivel" className={`${campo} font-bold ${NIVEL_CLS[r.nivel] || ''}`}>
                {['Alto', 'Medio', 'Bajo'].map((n) => <option key={n}>{n}</option>)}
              </select>
              <label className="block text-[11px] font-bold text-slate-700">Riesgo
                <textarea rows={2} value={r.descripcion} disabled={ro} onChange={(e) => editarLista('riesgos', i, { descripcion: e.target.value })} className={`${campo} mt-0.5 font-normal`} />
              </label>
              <label className="block text-[11px] font-bold text-slate-700">Por qué importa · {unidad}: {r.unidades.join(', ') || '—'}
                <textarea rows={2} value={r.razon} disabled={ro} onChange={(e) => editarLista('riesgos', i, { razon: e.target.value })} className={`${campo} mt-0.5 font-normal`} />
              </label>
              {puedeEditar && <button type="button" onClick={() => quitar('riesgos', i)} aria-label="Quitar riesgo" className="p-1.5 text-slate-400 hover:text-rose-600"><X size={15} /></button>}
            </li>
          ))}
        </ol>
      </Bloque>

      <Bloque titulo="Oportunidades prioritarias" puedeEditar={puedeEditar}
        onAgregar={() => setS({ ...s, oportunidades: [...s.oportunidades, { descripcion: '', unidades: [], razon: '' }] })}>
        {!s.oportunidades.length && <p className="text-sm text-slate-500">Sin oportunidades priorizadas.</p>}
        <ol className="space-y-2">
          {s.oportunidades.map((o, i) => (
            <li key={i} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-2 items-start border border-slate-200 rounded-lg p-2">
              <label className="block text-[11px] font-bold text-slate-700">Oportunidad
                <textarea rows={2} value={o.descripcion} disabled={ro} onChange={(e) => editarLista('oportunidades', i, { descripcion: e.target.value })} className={`${campo} mt-0.5 font-normal`} />
              </label>
              <label className="block text-[11px] font-bold text-slate-700">Por qué importa · {unidad}: {o.unidades.join(', ') || '—'}
                <textarea rows={2} value={o.razon} disabled={ro} onChange={(e) => editarLista('oportunidades', i, { razon: e.target.value })} className={`${campo} mt-0.5 font-normal`} />
              </label>
              {puedeEditar && <button type="button" onClick={() => quitar('oportunidades', i)} aria-label="Quitar oportunidad" className="p-1.5 text-slate-400 hover:text-rose-600"><X size={15} /></button>}
            </li>
          ))}
        </ol>
      </Bloque>

      <Bloque titulo={`Plan ${nivel === 'organismo' ? 'del organismo' : 'de la dirección'}`} nota="Líneas de acción" puedeEditar={puedeEditar}
        onAgregar={() => setS({ ...s, plan: [...s.plan, { tema: '', objetivo: '', acciones: [], responsable: '', plazo: '', atiende: '' }] })}>
        {!s.plan.length && <p className="text-sm text-slate-500">Sin líneas de acción.</p>}
        <ol className="space-y-3">
          {s.plan.map((l, i) => (
            <li key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_auto] gap-2 items-start">
                <label className="block text-[11px] font-bold text-slate-700">{i + 1}. Tema<input value={l.tema} disabled={ro} onChange={(e) => editarLista('plan', i, { tema: e.target.value })} className={`${campo} mt-0.5 font-normal`} /></label>
                <label className="block text-[11px] font-bold text-slate-700">Responsable sugerido<input value={l.responsable} disabled={ro} onChange={(e) => editarLista('plan', i, { responsable: e.target.value })} className={`${campo} mt-0.5 font-normal`} /></label>
                <label className="block text-[11px] font-bold text-slate-700">Plazo<input value={l.plazo} disabled={ro} onChange={(e) => editarLista('plan', i, { plazo: e.target.value })} className={`${campo} mt-0.5 font-normal`} /></label>
                {puedeEditar && <button type="button" onClick={() => quitar('plan', i)} aria-label="Quitar línea" className="p-1.5 mt-4 text-slate-400 hover:text-rose-600"><X size={15} /></button>}
              </div>
              <label className="block text-[11px] font-bold text-slate-700">Objetivo<textarea rows={2} value={l.objetivo} disabled={ro} onChange={(e) => editarLista('plan', i, { objetivo: e.target.value })} className={`${campo} mt-0.5 font-normal`} /></label>
              <label className="block text-[11px] font-bold text-slate-700">Acciones (una por renglón)<textarea rows={3} value={l.acciones.join('\n')} disabled={ro} onChange={(e) => editarLista('plan', i, { acciones: e.target.value.split('\n') })} className={`${campo} mt-0.5 font-normal`} /></label>
              <label className="block text-[11px] font-bold text-slate-700">Qué riesgos u oportunidades atiende<input value={l.atiende} disabled={ro} onChange={(e) => editarLista('plan', i, { atiende: e.target.value })} className={`${campo} mt-0.5 font-normal`} /></label>
            </li>
          ))}
        </ol>
      </Bloque>

      <Bloque titulo="Conclusión para el informe">
        <textarea rows={3} value={s.conclusion} disabled={ro} onChange={(e) => setS({ ...s, conclusion: e.target.value })} className={campo} />
      </Bloque>

      {puedeEditar && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" className="mt-1" checked={revisado} onChange={(e) => setRevisado(e.target.checked)} />
            <span><strong>Revisada y lista para el informe</strong><span className="block text-[11px] text-slate-600">Mientras sea borrador, el informe la muestra marcada como preliminar.</span></span>
          </label>
          <button type="button" onClick={guardar} className="px-4 py-2 text-sm font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><Save size={15} /> Guardar síntesis {anio}</button>
        </div>
      )}
    </div>
  );
}
