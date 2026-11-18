// Editor del proyecto anual de un área: una sola captura que alimenta el Formato de Presentación de Proyectos,
// las fichas técnicas, el PEMS (PEM-1/PEM-2) y el avance trimestral por actividad.
import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, AlertTriangle, CheckCircle2, Lock, Pencil } from 'lucide-react';
import { UNIDADES } from './ModalGestionarIndicador';
import { CAMPO_LISTA, Leyenda, CampoMoneda, moneda, DelCatalogo } from './estilosCampos';
import { useSGC } from '../../SGCContext';
import { normalizarDireccion } from '../../constants/areas';
import {
  CAPITULOS, TRIMESTRES, LIMITE_PALABRAS, palabras, nuevaActividad, totalesPresupuesto, cumpleTrimestre, justificacionAutomatica,
} from '../../constants/proyectosIndicadores';
import { promedioTrimestreCuadro } from '../../constants/catalogoIndicadores';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
/** Reparte la meta anual en 4 trimestres como en el formato: 95 → 24, 24, 24, 23. */
export const repartirMeta = (meta) => {
  const n = parseFloat(String(meta).replace(/[%,]/g, ''));
  if (!Number.isFinite(n)) return ['', '', '', ''];
  const t = Math.round(n / 4);
  return [t, t, t, Math.round((n - 3 * t) * 100) / 100].map(String);
};

// Orden de llenado: el proyecto → sus actividades e indicadores → la ficha de cada indicador → claves y firmas → el avance → el presupuesto al final.
const SECCIONES = [
  ['datos', '1. Datos del proyecto'], ['actividades', '2. Actividades e indicadores'], ['fichas', '3. Fichas técnicas'],
  ['pems', '4. PEMS y firmas'], ['avance', '5. Avance trimestral (PEMS)'], ['presupuesto', '6. Presupuesto'],
];
// Bloque con título dentro de una sección (regla visual: títulos marcados, cada grupo de datos separado).
const Bloque = ({ titulo, ayuda, children, className = '', color = 'bg-marca-azul-oscuro' }) => (
  <section className={`rounded-lg border border-slate-300 bg-white overflow-hidden ${className}`}>
    <h5 className={`px-3 py-1.5 text-sm font-extrabold text-white ${color}`}>{titulo}</h5>
    <div className="p-3">
      {ayuda && <p className="text-xs text-slate-600 mb-3">{ayuda}</p>}
      {children}
    </div>
  </section>
);
// Catálogos de la ficha técnica (los que pide el formato del Ayuntamiento).
const TIPOS_INDICADOR = ['ESTRATÉGICO', 'GESTIÓN'];
const DIMENSIONES = ['EFICACIA', 'EFICIENCIA', 'CALIDAD', 'ECONOMÍA'];
const SENTIDOS = ['ASCENDENTE', 'DESCENDENTE'];
const TIPOS_OBJETIVO = ['ESTRATÉGICO', 'OPERATIVO', 'DE GESTIÓN'];
// Campos que el área llena en cada ficha: sirven para decir cuánto lleva cada una.
const CAMPOS_FICHA = ['definicion', 'tipo_indicador', 'dimension', 'metodo', 'variables', 'linea_base', 'sentido', 'supuestos',
  'claridad', 'relevancia', 'economia', 'monitoreable', 'adecuado', 'aportacion', 'medios', 'recopilacion'];
const ENTRADA = 'w-full px-2.5 py-1.5 text-sm border border-slate-400 rounded-md bg-white focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-50 disabled:text-slate-600';
const pesos = (n) => moneda(n || 0);

// Campo de catálogo: solo se eligen los valores de la lista (un valor ya capturado fuera de la lista se conserva).
function Lista({ etiqueta, valor, onChange, opciones, disabled }) {
  const v = String(valor || '');
  const actual = opciones.find((o) => o.toUpperCase() === v.toUpperCase()) || v;
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-800 mb-1">{etiqueta}</span>
      <select value={actual} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={CAMPO_LISTA}>
        <option value="">— Seleccionar —</option>
        {[...opciones, ...(actual && !opciones.includes(actual) ? [actual] : [])].map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

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
      {ayuda && <span className="block text-xs text-slate-500 mt-0.5">{ayuda}</span>}
    </label>
  );
}

export default function EditorProyecto({ proyecto: p, onCambio, editable, editableAvance = editable, resultados = {} }) {
  const [seccion, setSeccion] = useState('datos');
  const [fichaIdx, setFichaIdx] = useState(0);
  const set = (campo, valor) => onCambio({ ...p, [campo]: valor });
  const setSub = (campo, sub, valor) => onCambio({ ...p, [campo]: { ...(p[campo] || {}), [sub]: valor } });
  const acts = p.actividades || [];
  const setAct = (i, cambios) => set('actividades', acts.map((a, j) => (j === i ? { ...a, ...cambios } : a)));
  const tot = totalesPresupuesto(p.presupuesto);
  const pond = acts.reduce((s, a) => s + (parseFloat(a.ponderado) || 0), 0);
  // Ligado a los catálogos: Director General, director de la dirección del área y encargado del área.
  const { areasDetalle = [], direccionesDetalle = [] } = useSGC();
  const fichaArea = areasDetalle.find((x) => x.nombre === p.area);
  const dirArea = direccionesDetalle.find((d) => normalizarDireccion(d.nombre) === normalizarDireccion(fichaArea?.direccion || ''));
  const catalogo = {
    dg: direccionesDetalle.find((d) => normalizarDireccion(d.nombre) === normalizarDireccion('Dir. General'))?.director || '',
    director: dirArea?.director || '', direccion: dirArea?.nombre || '', titular: fichaArea?.encargado?.trim() || '',
  };
  const setFirma = (quien, campo, v) => set('firmas', { ...p.firmas, [quien]: { ...p.firmas?.[quien], [campo]: v } });

  return (
    <div className="space-y-3">
      {editable && <Leyenda />}
      <nav className="flex flex-wrap gap-1.5" aria-label="Secciones del proyecto">
        {SECCIONES.map(([id, t]) => (
          <button key={id} type="button" aria-pressed={seccion === id} onClick={() => setSeccion(id)}
            className={`px-3.5 py-2 rounded-lg border-2 text-sm font-bold ${seccion === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro shadow' : 'bg-white text-slate-700 border-slate-300 hover:border-marca-azul'}`}>{t}</button>
        ))}
      </nav>

      <h3 className="text-base font-extrabold text-marca-azul-oscuro border-b-2 border-marca-azul-oscuro/30 pb-1.5">
        {SECCIONES.find(([id]) => id === seccion)?.[1]}
        {seccion === 'actividades' && <span className="ml-2 text-sm font-bold text-slate-600">({acts.length})</span>}
      </h3>

      {seccion === 'datos' && (
        <div className="space-y-3">
          <Bloque titulo="A. Identificación institucional" ayuda="A qué dependencia y a qué programa del Plan Municipal de Desarrollo (PMD) pertenece el proyecto.">
            <div className="grid gap-3 md:grid-cols-2">
              <Campo disabled={!editable} etiqueta="Dependencia / Entidad paramunicipal" valor={p.dependencia} onChange={(v) => set('dependencia', v)} />
              <Campo disabled={!editable} etiqueta="Unidad responsable" valor={p.unidad_responsable} onChange={(v) => set('unidad_responsable', v)} ayuda="Ej. DIRECCIÓN ADMINISTRATIVA / GERENCIA DE INFORMÁTICA" />
              <Campo disabled={!editable} etiqueta="Eje rector PMD" valor={p.eje_rector} onChange={(v) => set('eje_rector', v)} />
              <Campo disabled={!editable} etiqueta="Programa PMD" valor={p.programa_pmd} onChange={(v) => set('programa_pmd', v)} />
              <Campo disabled={!editable} etiqueta="Programa presupuestario" valor={p.programa_presupuestario} onChange={(v) => set('programa_presupuestario', v)} />
              <Campo disabled={!editable} etiqueta="Folio (uso exclusivo Tesorería)" valor={p.folio_tesoreria} onChange={(v) => set('folio_tesoreria', v)} />
            </div>
          </Bloque>
          <Bloque titulo="B. El proyecto" color="bg-sky-700" ayuda="Nombre y texto que pasan al Formato de Presentación de Proyectos. Respeta el límite de palabras de cada campo.">
            <div className="space-y-3">
              <fieldset>
                <legend className="text-xs font-bold text-slate-800 mb-1">Tipo de proyecto</legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  {[['OPERACION', 'Operación básica del área'], ['CRECIMIENTO', 'Crecimiento o desarrollo']].map(([v, t]) => (
                    <label key={v} className="inline-flex items-center gap-1.5"><input type="radio" disabled={!editable} checked={p.tipo === v} onChange={() => set('tipo', v)} />{t}</label>
                  ))}
                </div>
              </fieldset>
              <Campo disabled={!editable} etiqueta="Nombre del proyecto" valor={p.nombre} onChange={(v) => set('nombre', v)} />
              <Campo disabled={!editable} multi etiqueta="Resumen ejecutivo" limite={LIMITE_PALABRAS.resumen} valor={p.resumen} onChange={(v) => set('resumen', v)} />
              <Campo disabled={!editable} multi etiqueta="Justificación" limite={LIMITE_PALABRAS.justificacion} valor={p.justificacion} onChange={(v) => set('justificacion', v)} />
              <Campo disabled={!editable} multi etiqueta="Objetivo" limite={LIMITE_PALABRAS.objetivo} valor={p.objetivo} onChange={(v) => set('objetivo', v)} />
            </div>
          </Bloque>
          <Bloque titulo="C. Vigencia" color="bg-emerald-700">
            <div className="grid gap-3 grid-cols-2 max-w-md">
              <Campo disabled={!editable} tipo="date" etiqueta="Fecha de inicio" valor={p.fecha_inicio} onChange={(v) => set('fecha_inicio', v)} />
              <Campo disabled={!editable} tipo="date" etiqueta="Fecha de conclusión" valor={p.fecha_conclusion} onChange={(v) => set('fecha_conclusion', v)} />
            </div>
          </Bloque>
        </div>
      )}

      {seccion === 'actividades' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs text-slate-700">Aquí nace cada indicador del área. Su nombre, meta y frecuencia se capturan una sola vez; la ficha técnica se desarrolla en la pestaña 3 y el Cuadro de Control se arma con esto al aprobar el proyecto.</p>
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${Math.round(pond) === 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>Ponderado total: {pond}% {Math.round(pond) === 100 ? '' : '(debe sumar 100%)'}</span>
          </div>
          {acts.map((a, i) => (
            <div key={a.id || i} className={`rounded-xl border-2 bg-white overflow-hidden shadow-md ${i % 2 ? 'border-teal-700/60' : 'border-marca-azul-oscuro/60'}`}>
              <div className={`flex items-center justify-between gap-3 text-white px-4 py-3 ${i % 2 ? 'bg-teal-800' : 'bg-marca-azul-oscuro'}`}>
                <h4 className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-white text-slate-900 text-lg font-black flex items-center justify-center">{i + 1}</span>
                  <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-white/80">Actividad {i + 1} de {acts.length}</span>
                    <span className="block text-sm font-extrabold truncate">{a.indicador || a.actividad || 'Sin nombre todavía'}</span></span>
                </h4>
                {editable && acts.length > 1 && <button type="button" onClick={() => set('actividades', acts.filter((_, j) => j !== i))} className="text-xs text-white/90 inline-flex items-center gap-1 hover:underline shrink-0"><Trash2 size={13} /> Quitar</button>}
              </div>
              <div className="p-4 space-y-4 bg-slate-50">
                <Bloque titulo="A. Actividad e indicador" ayuda="Qué se hace y con qué indicador se mide. El indicador se desarrolla en la pestaña 3 (ficha técnica).">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Campo disabled={!editable} multi etiqueta="Actividad" valor={a.actividad} onChange={(v) => setAct(i, { actividad: v })} />
                    <Campo disabled={!editable} multi etiqueta="Indicador" valor={a.indicador} onChange={(v) => setAct(i, { indicador: v })} />
                  </div>
                </Bloque>
                <Bloque titulo="B. Metas" ayuda="Los porcentajes se capturan como número (95 = 95%). Al escribir la meta anual, las metas trimestrales se reparten solas; puedes ajustarlas.">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm tablas-marcadas">
                      <thead><tr>
                        <th scope="col" className="p-2 text-left min-w-[150px]">Unidad de medida</th>
                        <th scope="col" className="p-2 text-left min-w-[110px]">Meta anual</th>
                        {TRIMESTRES.map((t, ti) => <th key={t} scope="col" className="p-2 text-left min-w-[100px]">Meta {t}<span className="block text-[11px] font-semibold text-slate-600">{['Ene–Mar', 'Abr–Jun', 'Jul–Sep', 'Oct–Dic'][ti]}</span></th>)}
                      </tr></thead>
                      <tbody><tr>
                        <td className="p-1.5"><select aria-label="Unidad de medida" disabled={!editable} value={a.unidad || ''} onChange={(e) => setAct(i, { unidad: e.target.value })} className={CAMPO_LISTA}>
                          <option value="">— Seleccionar —</option>
                          {[...UNIDADES, ...(a.unidad && !UNIDADES.includes(a.unidad) ? [a.unidad] : [])].map((u) => <option key={u}>{u}</option>)}
                        </select></td>
                        <td className="p-1.5"><input aria-label="Meta anual" inputMode="decimal" disabled={!editable} value={a.meta || ''} className={`${ENTRADA} font-bold`}
                          onChange={(e) => { const v = e.target.value; setAct(i, { meta: v, ...((a.trimestres || []).every((x) => x === '' || x == null) || a.trimestresAuto ? { trimestres: repartirMeta(v), trimestresAuto: true } : {}) }); }} /></td>
                        {TRIMESTRES.map((t, ti) => (
                          <td key={t} className="p-1.5"><input aria-label={`Meta ${t}`} inputMode="decimal" disabled={!editable} value={a.trimestres?.[ti] ?? ''} className={ENTRADA}
                            onChange={(e) => setAct(i, { trimestresAuto: false, trimestres: (a.trimestres || ['', '', '', '']).map((x, k) => (k === ti ? e.target.value : x)) })} /></td>
                        ))}
                      </tr></tbody>
                    </table>
                  </div>
                  {a.trimestresAuto && <p className="text-xs text-emerald-700 mt-1">Metas trimestrales repartidas a partir de la meta anual.</p>}
                </Bloque>
                <div className="grid gap-3 md:grid-cols-2">
                  <Bloque titulo="C. Seguimiento en el Cuadro de Control" ayuda="Cada cuánto se reporta el resultado y qué pasa si sale bajo.">
                    <div className="grid gap-3 grid-cols-2">
                      <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Frecuencia</span>
                        <select disabled={!editable} value={a.periodicidad || 'Mensual'} onChange={(e) => setAct(i, { periodicidad: e.target.value })} className={CAMPO_LISTA}>
                          {['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'].map((x) => <option key={x}>{x}</option>)}
                        </select></label>
                      <label className="block"><span className="block text-xs font-bold text-slate-800 mb-1">Impacto si no cumple</span>
                        <select disabled={!editable} value={a.impacto || 'Bajo'} onChange={(e) => setAct(i, { impacto: e.target.value })} className={CAMPO_LISTA}>
                          <option value="Bajo">Bajo: Reporte de corrección (RC)</option><option value="Alto">Alto: Acción correctiva (AC)</option>
                        </select></label>
                    </div>
                  </Bloque>
                  <Bloque titulo="D. Programa de egresos (PEMS)" ayuda="Peso de la actividad dentro del proyecto y su clave de actividad pública para el PEM-2.">
                    <div className="grid gap-3 grid-cols-[110px_110px_1fr]">
                      <Campo disabled={!editable} etiqueta="Ponderado %" valor={a.ponderado} onChange={(v) => setAct(i, { ponderado: v })} />
                      <Campo disabled={!editable} etiqueta="Clave act. pública" valor={a.ap_clave} onChange={(v) => setAct(i, { ap_clave: v })} />
                      <Campo disabled={!editable} etiqueta="Actividad pública (PEM-2)" valor={a.ap_nombre} onChange={(v) => setAct(i, { ap_nombre: v })} />
                    </div>
                  </Bloque>
                </div>
              </div>
            </div>
          ))}
          {editable && <button type="button" onClick={() => set('actividades', [...acts, nuevaActividad()])} className="px-3 py-2 text-xs font-bold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50 inline-flex items-center gap-1.5"><Plus size={14} /> Agregar actividad</button>}
        </div>
      )}

      {seccion === 'presupuesto' && (
        <div className="space-y-2">
        <p className="text-xs text-slate-600">Cantidades en pesos mexicanos. Al escribir se ve el número; al salir del campo toma formato de moneda. El anual y los totales se calculan solos.</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm tablas-marcadas tabular-nums">
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
                      <td key={ti} className="p-1"><CampoMoneda disabled={!editable} value={v} aria-label={`${c} trimestre ${ti + 1}`}
                        onChange={(nuevo) => setSub('presupuesto', c, q.map((x, k) => (k === ti ? nuevo : x)))} /></td>
                    ))}
                  </tr>
                );
              })}
              <tr className="font-extrabold bg-emerald-50"><th scope="row" className="p-2 text-left">Monto solicitado total</th><td className="p-2 text-right">{pesos(tot.anual)}</td>{tot.trimestres.map((v, i) => <td key={i} className="p-2 text-right">{pesos(v)}</td>)}</tr>
            </tbody>
          </table>
        </div>
        </div>
      )}

      {seccion === 'fichas' && (
        <div className="space-y-3">
          <Bloque titulo="A. Alineación común a todas las fichas del proyecto" ayuda="Se llena una sola vez y aplica a todas las fichas. El eje rector y el programa PMD se toman de la sección 1.">
            <div className="grid gap-3 md:grid-cols-2">
              <Campo disabled={!editable} multi etiqueta="Objetivo PMD" valor={p.objetivo_pmd} onChange={(v) => set('objetivo_pmd', v)} />
              <Campo disabled={!editable} multi etiqueta="Estrategia PMD" valor={p.estrategia_pmd} onChange={(v) => set('estrategia_pmd', v)} />
              <Campo disabled={!editable} multi etiqueta="Objetivo institucional" valor={p.objetivo_institucional} onChange={(v) => set('objetivo_institucional', v)} />
              <Lista disabled={!editable} etiqueta="Tipo de objetivo" opciones={TIPOS_OBJETIVO} valor={p.tipo_objetivo} onChange={(v) => set('tipo_objetivo', v)} />
              <div>
              <Campo disabled={!editable} etiqueta="Titular de la unidad responsable" valor={p.titular?.nombre} onChange={(v) => setSub('titular', 'nombre', v)} />
              <DelCatalogo valor={p.titular?.nombre} catalogo={catalogo.titular} origen={`Catálogo, encargado de ${p.area}`} editable={editable} onUsar={() => setSub('titular', 'nombre', catalogo.titular.toUpperCase())} />
            </div>
              <Campo disabled={!editable} etiqueta="Cargo del titular" valor={p.titular?.cargo} onChange={(v) => setSub('titular', 'cargo', v)} />
              <Campo disabled={!editable} tipo="date" etiqueta="Fecha de elaboración" valor={p.fecha_elaboracion} onChange={(v) => set('fecha_elaboracion', v)} />
            </div>
          </Bloque>

          <section className="rounded-lg border-2 border-marca-azul-oscuro/50 bg-white overflow-hidden">
            <div className="bg-marca-azul-oscuro text-white px-3 py-2">
              <h4 className="text-sm font-extrabold">B. Ficha técnica de cada indicador ({acts.length})</h4>
              <p className="text-xs text-white/85">Cada indicador de la sección 2 tiene su propia ficha. Elige cuál vas a llenar:</p>
            </div>
            <div role="tablist" aria-label="Fichas técnicas del proyecto" className="flex flex-wrap gap-2 p-3 bg-slate-100 border-b border-slate-300">
              {acts.map((a, i) => {
                const llenos = CAMPOS_FICHA.filter((k) => String(a.ficha?.[k] || '').trim()).length;
                const elegida = fichaIdx === i;
                return (
                  <button key={a.id || i} type="button" role="tab" aria-selected={elegida} onClick={() => setFichaIdx(i)}
                    className={`text-left px-3 py-2 rounded-lg border-2 max-w-[18rem] ${elegida ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro shadow-md' : 'bg-white text-slate-800 border-slate-300 hover:border-marca-azul'}`}>
                    <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide">{elegida && <Pencil size={12} />} Ficha {i + 1}{elegida ? ' · la que estás llenando' : ''}</span>
                    <span className="block text-sm font-semibold truncate">{a.indicador || 'Sin indicador'}</span>
                    <span className={`block text-xs ${elegida ? 'text-white/85' : llenos === CAMPOS_FICHA.length ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>{llenos} de {CAMPOS_FICHA.length} campos llenos</span>
                  </button>
                );
              })}
            </div>
            {acts[fichaIdx] && (() => {
              const a = acts[fichaIdx];
              const f = a.ficha || {};
              const setF = (k, v) => setAct(fichaIdx, { ficha: { ...f, [k]: v } });
              return (
                <div className="p-3 space-y-3 bg-slate-50">
                  <p className="text-sm text-slate-800">Estás llenando la <strong>Ficha {fichaIdx + 1} de {acts.length}</strong>. Lo que captures abajo es solo de este indicador.</p>
                  <Bloque titulo="B1. Indicador de esta ficha (ya definido, no se modifica aquí)" color="bg-slate-600">
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      {[['Indicador', a.indicador, 'sm:col-span-2 lg:col-span-4'], ['Actividad', a.actividad, 'sm:col-span-2 lg:col-span-4'], ['Unidad de medida', a.unidad], ['Meta anual', a.meta], ['Metas T1 a T4', (a.trimestres || []).filter((x) => x !== '' && x != null).join(' · ')], ['Frecuencia', a.periodicidad || 'Mensual']].map(([t, v, ancho]) => (
                        <div key={t} className={`rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1.5 ${ancho || ''}`}>
                          <dt className="text-xs font-bold text-slate-600 flex items-center gap-1"><Lock size={11} /> {t}</dt>
                          <dd className="font-semibold text-slate-900">{v || <span className="font-normal text-amber-700">Sin capturar</span>}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-slate-600 mt-2">Estos datos se capturan una sola vez en la sección 2 y de ahí pasan a la ficha, al PEMS y al Cuadro de Control.
                      {editable && <button type="button" onClick={() => setSeccion('actividades')} className="ml-1 font-bold text-marca-azul-oscuro hover:underline">Modificarlos en la sección 2</button>}</p>
                  </Bloque>
                  <Bloque titulo="B2. Definición y cálculo" color="bg-sky-700">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Definición del indicador" valor={f.definicion} onChange={(v) => setF('definicion', v)} /></div>
                      <Lista disabled={!editable} etiqueta="Tipo de indicador" opciones={TIPOS_INDICADOR} valor={f.tipo_indicador} onChange={(v) => setF('tipo_indicador', v)} />
                      <Lista disabled={!editable} etiqueta="Dimensión" opciones={DIMENSIONES} valor={f.dimension} onChange={(v) => setF('dimension', v)} />
                      <Campo disabled={!editable} multi etiqueta="Método de cálculo" valor={f.metodo} onChange={(v) => setF('metodo', v)} />
                      <Campo disabled={!editable} multi etiqueta="Variables para el cálculo" valor={f.variables} onChange={(v) => setF('variables', v)} />
                      <Campo disabled={!editable} etiqueta="Línea base" valor={f.linea_base} onChange={(v) => setF('linea_base', v)} />
                      <Lista disabled={!editable} etiqueta="Sentido del indicador" opciones={SENTIDOS} valor={f.sentido} onChange={(v) => setF('sentido', v)} />
                      <div className="md:col-span-2"><Campo disabled={!editable} multi etiqueta="Supuestos" valor={f.supuestos} onChange={(v) => setF('supuestos', v)} /></div>
                    </div>
                  </Bloque>
                  <Bloque titulo="B3. Atributos del indicador (criterios CREMAA)" color="bg-indigo-700" ayuda="Por qué el indicador es claro, relevante, económico, monitoreable, adecuado y qué aporta.">
                    <div className="grid gap-3 md:grid-cols-2">
                      {[['claridad', 'Claridad'], ['relevancia', 'Relevancia'], ['economia', 'Economía'], ['monitoreable', 'Monitoreable'], ['adecuado', 'Adecuado'], ['aportacion', 'Aportación marginal']].map(([k, t]) => (
                        <Campo disabled={!editable} key={k} multi etiqueta={t} valor={f[k]} onChange={(v) => setF(k, v)} />
                      ))}
                    </div>
                  </Bloque>
                  <Bloque titulo="B4. Verificación y transversalidad" color="bg-emerald-700">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Campo disabled={!editable} etiqueta="Medios de verificación" valor={f.medios} onChange={(v) => setF('medios', v)} />
                      <Campo disabled={!editable} etiqueta="Método de recopilación" valor={f.recopilacion} onChange={(v) => setF('recopilacion', v)} />
                      <Campo disabled={!editable} etiqueta="Transversalidad: Mujeres" valor={f.mujeres} onChange={(v) => setF('mujeres', v)} />
                      <Campo disabled={!editable} etiqueta="Transversalidad: Hombres" valor={f.hombres} onChange={(v) => setF('hombres', v)} />
                      <Campo disabled={!editable} etiqueta="Otro (especificar)" valor={f.otro} onChange={(v) => setF('otro', v)} />
                      <Campo disabled={!editable} multi etiqueta="Notas" valor={f.notas} onChange={(v) => setF('notas', v)} />
                    </div>
                  </Bloque>
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {seccion === 'pems' && (
        <div className="space-y-3">
          <Bloque titulo="A. Claves del Programa de Egresos (PEMS)" ayuda="Clasificación que pide Tesorería para los formatos PEM-1 y PEM-2.">
            <div className="grid gap-3 md:grid-cols-2">
              {[['municipio', 'Municipio'], ['finalidad', 'Finalidad'], ['funcion', 'Función'], ['subfuncion', 'Subfunción'], ['dependencia', 'Dependencia'],
                ['clave_subdependencia', 'Clave subdependencia (ej. 05 03)'], ['subdependencia', 'Subdependencia'], ['programa', 'Programa'], ['subprograma', 'Subprograma'],
                ['clave_grupo', 'Clave del grupo de actividades (PEM-2, ej. 600)']].map(([k, t]) => (
                <Campo disabled={!editable} key={k} etiqueta={t} valor={p.pems?.[k]} onChange={(v) => setSub('pems', k, v)} />
              ))}
            </div>
          </Bloque>
          <Bloque titulo="B. Firmas del Formato de Presentación de Proyectos" color="bg-emerald-700" ayuda="Los nombres se toman del catálogo de direcciones (Configuración). Si el catálogo cambia, aquí aparece el aviso para actualizar; el título (Lic., Ing.) y el cargo se escriben como van en el formato.">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Campo disabled={!editable} etiqueta="Director General (nombre con título)" valor={p.firmas?.director_general?.nombre} onChange={(v) => setFirma('director_general', 'nombre', v)} />
                <DelCatalogo valor={p.firmas?.director_general?.nombre} catalogo={catalogo.dg} origen="Catálogo, Dirección General" editable={editable} onUsar={() => setFirma('director_general', 'nombre', catalogo.dg.toUpperCase())} />
              </div>
              <Campo disabled={!editable} etiqueta="Cargo del Director General" valor={p.firmas?.director_general?.cargo} onChange={(v) => setFirma('director_general', 'cargo', v)} />
              <div>
                <Campo disabled={!editable} etiqueta="Director del área (nombre con título)" valor={p.firmas?.director_area?.nombre} onChange={(v) => setFirma('director_area', 'nombre', v)} />
                <DelCatalogo valor={p.firmas?.director_area?.nombre} catalogo={catalogo.director} origen={`Catálogo, ${catalogo.direccion}`} editable={editable} onUsar={() => setFirma('director_area', 'nombre', catalogo.director.toUpperCase())} />
              </div>
              <Campo disabled={!editable} etiqueta="Cargo del Director del área" valor={p.firmas?.director_area?.cargo} onChange={(v) => setFirma('director_area', 'cargo', v)} />
            </div>
          </Bloque>
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
                    <th scope="row" className="p-2 text-left font-semibold align-top">{a.actividad || `Actividad ${i + 1}`}<span className="block font-normal text-slate-600 mt-0.5">Indicador: {a.indicador || 'sin indicador'}</span></th>
                    {TRIMESTRES.map((t, ti) => {
                      const av = a.avances?.[t] || {};
                      const cumple = cumpleTrimestre(a, ti);
                      const setAv = (cambios) => setAct(i, { avances: { ...(a.avances || {}), [t]: { ...av, ...cambios } } });
                      return (
                        <td key={t} className="p-2 align-top space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 whitespace-nowrap">Meta {a.trimestres?.[ti] || '—'}</span>
                            <input inputMode="decimal" aria-label={`Avance ${t}`} disabled={!editableAvance} value={av.avance ?? ''} onChange={(e) => {
                              const avance = e.target.value;
                              const tmp = { ...a, avances: { ...(a.avances || {}), [t]: { ...av, avance } } };
                              const falla = cumpleTrimestre(tmp, ti) === false;
                              setAv({ avance, justificacion: falla && !av.justificacion ? justificacionAutomatica(tmp, ti) : (falla ? av.justificacion : '') });
                            }} className={`${ENTRADA} w-20`} />
                            {cumple === true && <CheckCircle2 size={15} className="text-emerald-600" aria-label="Cumple" />}
                            {cumple === false && <AlertTriangle size={15} className="text-rose-600" aria-label="No cumple" />}
                          </div>
                          {(() => {
                            const ref = promedioTrimestreCuadro(resultados, a.indicador_id, p.anio, ti, MESES_CORTOS);
                            return ref === null ? null : (
                              <p className="text-xs text-slate-600">Indicador en el Cuadro: <strong>{ref}{/porcent/i.test(a.unidad || '') ? '%' : ''}</strong> (promedio del trimestre)</p>
                            );
                          })()}
                          {cumple === false && (
                            <div>
                              <textarea rows={2} aria-label={`Justificación ${t}`} disabled={!editableAvance} value={av.justificacion || ''} onChange={(e) => setAv({ justificacion: e.target.value })} className={`${ENTRADA} text-xs`} />
                              <button type="button" onClick={() => setAv({ justificacion: justificacionAutomatica(a, ti) })} className="text-xs text-marca-azul-oscuro inline-flex items-center gap-1 hover:underline"><Sparkles size={11} /> Proponer justificación</button>
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
