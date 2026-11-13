// Captura de un riesgo u oportunidad: descripción (tal cual la escribe el área), evaluación con dos clics,
// tratamiento y plan de acción (que al aceptar la matriz se vuelve un Plan de Mejora ligado).
import React from 'react';
import { Plus, X } from 'lucide-react';
import CampoFecha from '../common/CampoFecha';
import { ESCALAS, TRATAMIENTOS, CONTEXTOS, nivelDe, puntaje, requierePlan } from '../../constants/riesgos';

const campo = 'w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none';

function Escala({ titulo, opciones, valor, onElegir, deshabilitado }) {
  return (
    <fieldset disabled={deshabilitado}>
      <legend className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">{titulo}</legend>
      <div className="grid grid-cols-5 gap-1">
        {opciones.map(([n, nombre, ayuda]) => (
          <button key={n} type="button" title={ayuda} onClick={() => onElegir(n)}
            className={`px-1 py-1.5 rounded-lg border text-[11px] leading-tight transition-colors ${valor === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}>
            <strong className="block text-sm">{n}</strong>{nombre}
          </button>
        ))}
      </div>
      {valor > 0 && <p className="text-[11px] text-slate-500 mt-1">{opciones.find(([n]) => n === valor)?.[2]}</p>}
    </fieldset>
  );
}

export default function FormRiesgo({ valor, onChange, procesos = [], soloLectura }) {
  const r = valor;
  const set = (patch) => onChange({ ...r, ...patch, ...(patch.descripcion !== undefined ? { riesgo: patch.descripcion } : {}) });
  const escala = ESCALAS[r.tipo];
  const nivel = nivelDe(r);
  const plan = r.plan || [];
  const setAct = (i, patch) => set({ plan: plan.map((a, k) => (k === i ? { ...a, ...patch } : a)) });
  const esRiesgo = r.tipo === 'Riesgo';

  return (
    <div className="space-y-4">
      <fieldset className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <legend className="px-1 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Identificación</legend>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Contexto (¿de dónde se identificó?) *
          <select value={r.contexto || ''} disabled={soloLectura} onChange={(e) => set({ contexto: e.target.value })} className={`${campo} mt-1 normal-case font-normal tracking-normal`}>
            <option value="">— Seleccionar —</option>
            {CONTEXTOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Resultado (qué se encontró en ese análisis)
          <textarea rows={2} value={r.contexto_resultado || ''} disabled={soloLectura} onChange={(e) => set({ contexto_resultado: e.target.value })}
            placeholder="Ej. El indicador #26 quedó en 70% en el segundo trimestre" className={`${campo} mt-1 normal-case font-normal tracking-normal`} />
        </label>
      </fieldset>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {esRiesgo ? 'Riesgo identificado' : 'Oportunidad identificada'}
          <textarea rows={2} value={r.descripcion} disabled={soloLectura} onChange={(e) => set({ descripcion: e.target.value })}
            placeholder={esRiesgo ? '¿Qué podría salir mal?' : '¿Qué se podría aprovechar o mejorar?'} className={`${campo} mt-1 normal-case font-normal tracking-normal`} />
        </label>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Proceso *
          <select value={r.proceso} disabled={soloLectura} onChange={(e) => set({ proceso: e.target.value })} className={`${campo} mt-1 normal-case font-normal tracking-normal`}>
            <option value="">— Seleccionar —</option>
            {procesos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          ['causa', esRiesgo ? 'Causa / origen' : 'Qué la origina'],
          ['consecuencia', esRiesgo ? 'Consecuencia si ocurre' : 'Beneficio esperado'],
          ['controles', esRiesgo ? 'Controles que ya existen' : 'Recursos con los que se cuenta'],
        ].map(([k, etiqueta]) => (
          <label key={k} className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {etiqueta}
            <textarea rows={2} value={r[k]} disabled={soloLectura} onChange={(e) => set({ [k]: e.target.value })} className={`${campo} mt-1 normal-case font-normal tracking-normal`} />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px] gap-4 items-start">
        <Escala titulo={escala.ejeY} opciones={escala.probabilidad} valor={Number(r.probabilidad)} deshabilitado={soloLectura} onElegir={(n) => set({ probabilidad: n })} />
        <Escala titulo={escala.ejeX} opciones={escala.impacto} valor={Number(r.impacto)} deshabilitado={soloLectura} onElegir={(n) => set({ impacto: n })} />
        <div className={`rounded-xl border p-3 text-center ${nivel ? nivel.suave : 'bg-white text-slate-600 border-slate-200'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider">Nivel</p>
          <p className="text-3xl font-black">{puntaje(r) || '—'}</p>
          <p className="text-xs font-bold">{nivel?.nivel || 'Sin evaluar'}</p>
          {nivel && <p className="text-[10px] leading-snug mt-1">{nivel.importancia[r.tipo]}</p>}
        </div>
      </div>

      {nivel && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Tratamiento{requierePlan(r) ? ' *' : ''}</span>
            {TRATAMIENTOS[r.tipo].map((t) => (
              <button key={t} type="button" disabled={soloLectura} onClick={() => set({ tratamiento: t })}
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${r.tratamiento === t ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}>
                {t}
              </button>
            ))}
            {!requierePlan(r) && <span className="text-[11px] text-slate-500">Nivel bajo: puede quedarse en monitoreo sin plan.</span>}
          </div>
          {r.tratamiento && !['Aceptar', 'Posponer'].includes(r.tratamiento) && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Plan de acción <span className="normal-case font-normal text-slate-500">· se dará seguimiento como Plan de Mejora</span></p>
              {plan.map((a, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_150px_1fr_auto] gap-2 items-center">
                  <input className={campo} placeholder="Actividad" value={a.actividad || ''} disabled={soloLectura} onChange={(e) => setAct(i, { actividad: e.target.value })} />
                  <input className={campo} placeholder="Responsable" value={a.responsable || ''} disabled={soloLectura} onChange={(e) => setAct(i, { responsable: e.target.value })} />
                  <CampoFecha className={campo} value={a.fecha_termino_sugerida || ''} disabled={soloLectura} onChange={(e) => setAct(i, { fecha_termino_sugerida: e.target.value })} />
                  <input className={campo} placeholder="Evidencia esperada" value={a.evidencia_esperada || ''} disabled={soloLectura} onChange={(e) => setAct(i, { evidencia_esperada: e.target.value })} />
                  {!soloLectura && (
                    <button type="button" onClick={() => set({ plan: plan.filter((_, k) => k !== i) })} title="Quitar actividad" className="p-1.5 text-slate-400 hover:text-rose-600"><X size={14} /></button>
                  )}
                </div>
              ))}
              {!soloLectura && (
                <button type="button" onClick={() => set({ plan: [...plan, { actividad: '', responsable: '', fecha_termino_sugerida: '', evidencia_esperada: '' }] })}
                  className="text-xs font-semibold text-sky-700 bg-white hover:bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 inline-flex items-center gap-1">
                  <Plus size={13} /> Agregar actividad
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
