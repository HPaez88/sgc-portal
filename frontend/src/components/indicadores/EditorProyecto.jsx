// Editor del proyecto anual de un área: una sola captura que alimenta el Formato de Presentación de Proyectos,
// las fichas técnicas, el PEMS (PEM-1/PEM-2) y el avance trimestral por actividad.
import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  CAPITULOS, TRIMESTRES, LIMITE_PALABRAS, palabras, nuevaActividad, totalesPresupuesto, cumpleTrimestre, justificacionAutomatica,
} from '../../constants/proyectosIndicadores';

const SECCIONES = [
  ['datos', '1. Datos del proyecto'], ['actividades', '2. Actividades e indicadores'], ['presupuesto', '3. Presupuesto'],
  ['fichas', '4. Fichas técnicas'], ['pems', '5. PEMS y firmas'], ['avance', '6. Avance trimestral (PEMS)'],
];
const ENTRADA = 'w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-50 disabled:text-slate-600';
const pesos = (n) => `$${Math.round(n || 0).toLocaleString('es-MX')}`;

function Campo({ etiqueta, valor, onChange, multi, limite, disabled, ayuda, tipo = 'text' }) {
  const n = limite ? palabras(valor) : 0;
  return (
    <label className="block">
      <span className="flex justify-between gap-2 text-xs font-bold text-slate-800 mb-1">
        <span>{etiqueta}</span>
        {limite && <span className={n > limite ? 'text-rose-700' : 'text-slate-500 font-semibold'}>{n}/{limite} palabras</span>}
      </span>
      {multi
        ? <textarea rows={2} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} />
        : <input type={tipo} value={valor || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ENTRADA} />}
      {ayuda && <span className="block text-[11px] text-slate-500 mt-0.5">{ayuda}</span>}
    </label>
  );
}

export default function EditorProyecto({ proyecto: p, onCambio, editable, indicadoresCatalogo = [] }) {
  const [seccion, setSeccion] = useState('datos');
  const [fichaIdx, setFichaIdx] = useState(0);
  const set = (campo, valor) => onCambio({ ...p, [campo]: valor });
  const setSub = (campo, sub, valor) => onCambio({ ...p, [campo]: { ...(p[campo] || {}), [sub]: valor } });
  const acts = p.actividades || [];
  const setAct = (i, cambios) => set('actividades', acts.map((a, j) => (j === i ? { ...a, ...cambios } : a)));
  const tot = totalesPresupuesto(p.presupuesto);
  const pond = acts.reduce((s, a) => s + (parseFloat(a.ponderado) || 0), 0);

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap gap-1.5" aria-label="Secciones del proyecto">
        {SECCIONES.map(([id, t]) => (
          <button key={id} type="button" aria-pressed={seccion === id} onClick={() => setSeccion(id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${seccion === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>{t}</button>
        ))}
      </nav>

      <h3 className="text-base font-extrabold text-marca-azul-oscuro border-b-2 border-marca-azul-oscuro/30 pb-1.5">
        {SECCIONES.find(([id]) => id === seccion)?.[1]}
        {seccion === 'actividades' && <span className="ml-2 text-sm font-bold text-slate-600">({acts.length})</span>}
      </h3>

      {seccion === 'datos' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Campo disabled={!editable} etiqueta="Dependencia / Entidad paramunicipal" valor={p.dependencia} onChange={(v) => set('dependencia', v)} />
          <Campo disabled={!editable} etiqueta="Unidad responsable" valor={p.unidad_responsable} onChange={(v) => set('unidad_responsable', v)} ayuda="Ej. DIRECCIÓN ADMINISTRATIVA / GERENCIA DE INFORMÁTICA" />
          <Campo disabled={!editable} etiqueta="Eje rector PMD" valor={p.eje_rector} onChange={(v) => set('eje_rector', v)} />
          <Campo disabled={!editable} etiqueta="Programa PMD" valor={p.programa_pmd} onChange={(v) => set('programa_pmd', v)} />
          <Campo disabled={!editable} etiqueta="Programa presupuestario" valor={p.programa_presupuestario} onChange={(v) => set('programa_presupuestario', v)} />
          <Campo disabled={!editable} etiqueta="Folio (uso exclusivo Tesorería)" valor={p.folio_tesoreria} onChange={(v) => set('folio_tesoreria', v)} />
          <fieldset className="md:col-span-2">
            <legend className="text-xs font-bold text-slate-800 mb-1">Tipo de proyecto</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {[['OPERACION', 'Operación básica del área'], ['CRECIMIENTO', 'Crecimiento o desarrollo']].map(([v, t]) => (
                <label key={v} className="inline-flex items-center gap-1.5"><input type="radio" disabled={!editable} checked={p.tipo === v} onChange={() => set('tipo', v)} />{t}</label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2"><Campo disabled={!editable} etiqueta="Nombre del proyecto" valor={p.nombre} onChange={(v) => set('nombre', v)} /></div>
          <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Resumen ejecutivo" limite={LIMITE_PALABRAS.resumen} valor={p.resumen} onChange={(v) => set('resumen', v)} /></div>
          <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Justificación" limite={LIMITE_PALABRAS.justificacion} valor={p.justificacion} onChange={(v) => set('justificacion', v)} /></div>
          <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Objetivo" limite={LIMITE_PALABRAS.objetivo} valor={p.objetivo} onChange={(v) => set('objetivo', v)} /></div>
          <Campo disabled={!editable} tipo="date" etiqueta="Fecha de inicio" valor={p.fecha_inicio} onChange={(v) => set('fecha_inicio', v)} />
          <Campo disabled={!editable} tipo="date" etiqueta="Fecha de conclusión" valor={p.fecha_conclusion} onChange={(v) => set('fecha_conclusion', v)} />
        </div>
      )}

      {seccion === 'actividades' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">Cada actividad lleva su indicador (con su ficha técnica) y su clave de actividad pública para el PEMS. Los porcentajes se capturan como número (95 = 95%).
            <span className={`ml-2 font-bold ${Math.round(pond) === 100 ? 'text-emerald-700' : 'text-rose-700'}`}>Ponderado: {pond}%</span></p>
          {acts.map((a, i) => (
            <div key={a.id || i} className="rounded-lg border-2 border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between gap-2 bg-marca-azul-oscuro text-white px-3 py-2">
                <h4 className="text-sm font-extrabold truncate">Actividad {i + 1}{a.indicador ? ` · ${a.indicador}` : ''}</h4>
                {editable && acts.length > 1 && <button type="button" onClick={() => set('actividades', acts.filter((_, j) => j !== i))} className="text-xs text-white/90 inline-flex items-center gap-1 hover:underline shrink-0"><Trash2 size={13} /> Quitar</button>}
              </div>
              <div className="p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Campo disabled={!editable} multi etiqueta="Actividad" valor={a.actividad} onChange={(v) => setAct(i, { actividad: v })} />
                <Campo disabled={!editable} multi etiqueta="Indicador" valor={a.indicador} onChange={(v) => setAct(i, { indicador: v })} />
              </div>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                <Campo disabled={!editable} etiqueta="Unidad de medida" valor={a.unidad} onChange={(v) => setAct(i, { unidad: v })} />
                <Campo disabled={!editable} etiqueta="Meta anual" valor={a.meta} onChange={(v) => setAct(i, { meta: v })} />
                {TRIMESTRES.map((t, ti) => (
                  <Campo disabled={!editable} key={t} etiqueta={`Meta ${t}`} valor={a.trimestres?.[ti]} onChange={(v) => setAct(i, { trimestres: (a.trimestres || ['', '', '', '']).map((x, k) => (k === ti ? v : x)) })} />
                ))}
                <Campo disabled={!editable} etiqueta="Ponderado %" valor={a.ponderado} onChange={(v) => setAct(i, { ponderado: v })} />
                <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Frecuencia</span>
                  <select disabled={!editable} value={a.periodicidad || 'Mensual'} onChange={(e) => setAct(i, { periodicidad: e.target.value })} className={ENTRADA}>
                    {['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'].map((x) => <option key={x}>{x}</option>)}
                  </select></label>
              </div>
              <div className="grid gap-2 md:grid-cols-[120px_1fr_1fr]">
                <Campo disabled={!editable} etiqueta="Clave act. pública" valor={a.ap_clave} onChange={(v) => setAct(i, { ap_clave: v })} />
                <Campo disabled={!editable} etiqueta="Actividad pública (PEM-2)" valor={a.ap_nombre} onChange={(v) => setAct(i, { ap_nombre: v })} />
                <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Indicador en el Cuadro de Control</span>
                  <select disabled={!editable} value={a.indicador_id ?? ''} onChange={(e) => setAct(i, { indicador_id: e.target.value })} className={ENTRADA}>
                    <option value="">— Sin ligar (se liga al aprobarse) —</option>
                    {indicadoresCatalogo.map((x) => <option key={x.id} value={x.id}>#{x.id} {x.nombre}</option>)}
                  </select></label>
              </div>
              </div>
            </div>
          ))}
          {editable && <button type="button" onClick={() => set('actividades', [...acts, nuevaActividad()])} className="px-3 py-2 text-xs font-bold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50 inline-flex items-center gap-1.5"><Plus size={14} /> Agregar actividad</button>}
        </div>
      )}

      {seccion === 'presupuesto' && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs tablas-marcadas">
            <caption className="sr-only">Cuantificación de recursos por capítulo</caption>
            <thead><tr><th scope="col" className="p-2 text-left">Capítulo</th><th scope="col" className="p-2 text-right">Anual</th>{['1er.', '2do.', '3er.', '4to.'].map((t) => <th key={t} scope="col" className="p-2 text-right">{t} trimestre</th>)}</tr></thead>
            <tbody>
              {CAPITULOS.map(([c, nombre]) => {
                const q = p.presupuesto?.[c] || ['', '', '', ''];
                const anual = q.reduce((s, v) => s + (parseFloat(String(v).replace(/[$,]/g, '')) || 0), 0);
                return (
                  <tr key={c}>
                    <th scope="row" className="p-2 text-left font-semibold">{c} {nombre}</th>
                    <td className="p-2 text-right font-bold">{pesos(anual)}</td>
                    {q.map((v, ti) => (
                      <td key={ti} className="p-1"><input inputMode="decimal" disabled={!editable} value={v} aria-label={`${c} trimestre ${ti + 1}`}
                        onChange={(e) => setSub('presupuesto', c, q.map((x, k) => (k === ti ? e.target.value.replace(/[^\d.]/g, '') : x)))} className={`${ENTRADA} text-right`} /></td>
                    ))}
                  </tr>
                );
              })}
              <tr className="font-extrabold"><th scope="row" className="p-2 text-left">Monto solicitado total</th><td className="p-2 text-right">{pesos(tot.anual)}</td>{tot.trimestres.map((v, i) => <td key={i} className="p-2 text-right">{pesos(v)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}

      {seccion === 'fichas' && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="md:col-span-2 text-xs text-slate-700">Alineación común a todas las fichas del proyecto (eje rector y programa PMD se toman de los datos del proyecto).</p>
            <Campo disabled={!editable} multi etiqueta="Objetivo PMD" valor={p.objetivo_pmd} onChange={(v) => set('objetivo_pmd', v)} />
            <Campo disabled={!editable} multi etiqueta="Estrategia PMD" valor={p.estrategia_pmd} onChange={(v) => set('estrategia_pmd', v)} />
            <Campo disabled={!editable} multi etiqueta="Objetivo institucional" valor={p.objetivo_institucional} onChange={(v) => set('objetivo_institucional', v)} />
            <Campo disabled={!editable} etiqueta="Tipo de objetivo" valor={p.tipo_objetivo} onChange={(v) => set('tipo_objetivo', v)} />
            <Campo disabled={!editable} etiqueta="Titular de la unidad responsable" valor={p.titular?.nombre} onChange={(v) => setSub('titular', 'nombre', v)} />
            <Campo disabled={!editable} etiqueta="Cargo del titular" valor={p.titular?.cargo} onChange={(v) => setSub('titular', 'cargo', v)} />
            <Campo disabled={!editable} tipo="date" etiqueta="Fecha de elaboración" valor={p.fecha_elaboracion} onChange={(v) => set('fecha_elaboracion', v)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {acts.map((a, i) => (
              <button key={a.id || i} type="button" aria-pressed={fichaIdx === i} onClick={() => setFichaIdx(i)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold text-left max-w-xs truncate ${fichaIdx === i ? 'bg-sky-50 border-marca-azul text-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}>Ficha {i + 1}: {a.indicador || 'sin indicador'}</button>
            ))}
          </div>
          {acts[fichaIdx] && (() => {
            const a = acts[fichaIdx];
            const f = a.ficha || {};
            const setF = (k, v) => setAct(fichaIdx, { ficha: { ...f, [k]: v } });
            return (
              <div className="grid gap-3 md:grid-cols-2 rounded-lg border border-slate-200 bg-white p-3">
                <p className="md:col-span-2 text-xs text-slate-600">Nombre, unidad, meta y frecuencia vienen de la actividad. El cumplimiento mensual se llena con los resultados del Cuadro de Control.</p>
                <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Definición del indicador" valor={f.definicion} onChange={(v) => setF('definicion', v)} /></div>
                <Campo disabled={!editable} etiqueta="Tipo de indicador" valor={f.tipo_indicador} onChange={(v) => setF('tipo_indicador', v)} ayuda="Ej. GESTIÓN, ESTRATÉGICO" />
                <Campo disabled={!editable} etiqueta="Dimensión" valor={f.dimension} onChange={(v) => setF('dimension', v)} ayuda="Ej. EFICACIA, EFICIENCIA, CALIDAD, ECONOMÍA" />
                <Campo disabled={!editable} multi etiqueta="Método de cálculo" valor={f.metodo} onChange={(v) => setF('metodo', v)} />
                <Campo disabled={!editable} multi etiqueta="Variables para el cálculo" valor={f.variables} onChange={(v) => setF('variables', v)} />
                <Campo disabled={!editable} etiqueta="Línea base" valor={f.linea_base} onChange={(v) => setF('linea_base', v)} />
                <Campo disabled={!editable} etiqueta="Sentido del indicador" valor={f.sentido} onChange={(v) => setF('sentido', v)} ayuda="ASCENDENTE o DESCENDENTE" />
                <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Supuestos" valor={f.supuestos} onChange={(v) => setF('supuestos', v)} /></div>
                {[['claridad', 'Claridad'], ['relevancia', 'Relevancia'], ['economia', 'Economía'], ['monitoreable', 'Monitoreable'], ['adecuado', 'Adecuado'], ['aportacion', 'Aportación marginal']].map(([k, t]) => (
                  <Campo disabled={!editable} key={k} multi etiqueta={`Atributo: ${t}`} valor={f[k]} onChange={(v) => setF(k, v)} />
                ))}
                <Campo disabled={!editable} etiqueta="Medios de verificación" valor={f.medios} onChange={(v) => setF('medios', v)} />
                <Campo disabled={!editable} etiqueta="Método de recopilación" valor={f.recopilacion} onChange={(v) => setF('recopilacion', v)} />
                <Campo disabled={!editable} etiqueta="Transversalidad: Mujeres" valor={f.mujeres} onChange={(v) => setF('mujeres', v)} />
                <Campo disabled={!editable} etiqueta="Transversalidad: Hombres" valor={f.hombres} onChange={(v) => setF('hombres', v)} />
                <Campo disabled={!editable} etiqueta="Otro (especificar)" valor={f.otro} onChange={(v) => setF('otro', v)} />
                <Campo disabled={!editable} multi etiqueta="Notas" valor={f.notas} onChange={(v) => setF('notas', v)} />
              </div>
            );
          })()}
        </div>
      )}

      {seccion === 'pems' && (
        <div className="grid gap-3 md:grid-cols-2">
          {[['municipio', 'Municipio'], ['finalidad', 'Finalidad'], ['funcion', 'Función'], ['subfuncion', 'Subfunción'], ['dependencia', 'Dependencia'],
            ['clave_subdependencia', 'Clave subdependencia (ej. 05 03)'], ['subdependencia', 'Subdependencia'], ['programa', 'Programa'], ['subprograma', 'Subprograma'],
            ['clave_grupo', 'Clave del grupo de actividades (PEM-2, ej. 600)']].map(([k, t]) => (
            <Campo disabled={!editable} key={k} etiqueta={t} valor={p.pems?.[k]} onChange={(v) => setSub('pems', k, v)} />
          ))}
          <p className="md:col-span-2 text-xs text-slate-600 pt-2 border-t border-slate-200">Firmas del Formato de Presentación de Proyectos</p>
          <Campo disabled={!editable} etiqueta="Director General (nombre con título)" valor={p.firmas?.director_general?.nombre} onChange={(v) => set('firmas', { ...p.firmas, director_general: { ...p.firmas?.director_general, nombre: v } })} />
          <Campo disabled={!editable} etiqueta="Cargo" valor={p.firmas?.director_general?.cargo} onChange={(v) => set('firmas', { ...p.firmas, director_general: { ...p.firmas?.director_general, cargo: v } })} />
          <Campo disabled={!editable} etiqueta="Director del área (nombre con título)" valor={p.firmas?.director_area?.nombre} onChange={(v) => set('firmas', { ...p.firmas, director_area: { ...p.firmas?.director_area, nombre: v } })} />
          <Campo disabled={!editable} etiqueta="Cargo" valor={p.firmas?.director_area?.cargo} onChange={(v) => set('firmas', { ...p.firmas, director_area: { ...p.firmas?.director_area, cargo: v } })} />
        </div>
      )}

      {seccion === 'avance' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">Avance real de cada actividad contra su meta trimestral. Si no se cumple, el formato exige justificación: el portal propone una que cumple (editable).</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-xs tablas-marcadas">
              <caption className="sr-only">Avance trimestral por actividad</caption>
              <thead><tr><th scope="col" className="p-2 text-left min-w-[220px]">Actividad</th>{TRIMESTRES.map((t) => <th key={t} scope="col" className="p-2 text-left min-w-[200px]">{t}: meta / avance</th>)}</tr></thead>
              <tbody>
                {acts.map((a, i) => (
                  <tr key={a.id || i}>
                    <th scope="row" className="p-2 text-left font-semibold align-top">{a.actividad || `Actividad ${i + 1}`}</th>
                    {TRIMESTRES.map((t, ti) => {
                      const av = a.avances?.[t] || {};
                      const cumple = cumpleTrimestre(a, ti);
                      const setAv = (cambios) => setAct(i, { avances: { ...(a.avances || {}), [t]: { ...av, ...cambios } } });
                      return (
                        <td key={t} className="p-2 align-top space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 whitespace-nowrap">Meta {a.trimestres?.[ti] || '—'}</span>
                            <input inputMode="decimal" aria-label={`Avance ${t}`} value={av.avance ?? ''} onChange={(e) => {
                              const avance = e.target.value;
                              const tmp = { ...a, avances: { ...(a.avances || {}), [t]: { ...av, avance } } };
                              const falla = cumpleTrimestre(tmp, ti) === false;
                              setAv({ avance, justificacion: falla && !av.justificacion ? justificacionAutomatica(tmp, ti) : (falla ? av.justificacion : '') });
                            }} className={`${ENTRADA} w-20`} />
                            {cumple === true && <CheckCircle2 size={15} className="text-emerald-600" aria-label="Cumple" />}
                            {cumple === false && <AlertTriangle size={15} className="text-rose-600" aria-label="No cumple" />}
                          </div>
                          {cumple === false && (
                            <div>
                              <textarea rows={2} aria-label={`Justificación ${t}`} value={av.justificacion || ''} onChange={(e) => setAv({ justificacion: e.target.value })} className={`${ENTRADA} text-xs`} />
                              <button type="button" onClick={() => setAv({ justificacion: justificacionAutomatica(a, ti) })} className="text-[11px] text-marca-azul-oscuro inline-flex items-center gap-1 hover:underline"><Sparkles size={11} /> Proponer justificación</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
