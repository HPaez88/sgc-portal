// Captura de un riesgo u oportunidad (OOMRSC-37) en 4 secciones numeradas con su estado:
// 1 Identificación · 2 Descripción · 3 Evaluación · 4 Tratamiento y plan de acción.
// El plan de acción es el que se vuelve Plan de Mejora (ya aprobado) cuando el SGC acepta la matriz.
import React, { useLayoutEffect, useRef } from 'react';
import { Plus, X, CheckCircle2, CircleDashed, ArrowRight, Info } from 'lucide-react';
import CampoFecha from '../common/CampoFecha';
import { useSGC } from '../../SGCContext';
import { CAMPO_LISTA } from '../common/estilosCampos';
import { INDICADORES } from '../../constants/indicadores';
import { resolverResponsable } from '../../constants/areas';
import { catalogoBase } from '../../constants/catalogoIndicadores';
import { ESCALAS, TRATAMIENTOS, CONTEXTOS, nivelDe, puntaje, requierePlan, llevaPM } from '../../constants/riesgos';

const base = 'w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none disabled:bg-slate-50 disabled:text-slate-700';
const borde = (falta) => (falta ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300');

// Texto que crece conforme se escribe (sin barra de desplazamiento).
function TextoAuto({ value, falta, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={1} value={value || ''} className={`${base} ${borde(falta)} resize-none overflow-hidden leading-snug`} {...props} />;
}

function Campo({ etiqueta, requerido, ayuda, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-bold text-slate-800 mb-1">
        {etiqueta}{requerido && <span className="text-rose-600" aria-hidden="true"> *</span>}
      </span>
      {children}
      {ayuda && <span className="block text-xs text-slate-500 mt-1">{ayuda}</span>}
    </label>
  );
}

// Cada sección tiene su color para ubicar de un vistazo qué se está llenando.
const COLOR_SECCION = {
  1: ['bg-sky-50 border-l-sky-700', 'bg-sky-700'],
  2: ['bg-indigo-50 border-l-indigo-700', 'bg-indigo-700'],
  3: ['bg-amber-50 border-l-amber-600', 'bg-amber-600'],
  4: ['bg-emerald-50 border-l-emerald-700', 'bg-emerald-700'],
};

function Seccion({ n, titulo, ayuda, completo, children }) {
  const [franja, circulo] = COLOR_SECCION[n] || COLOR_SECCION[1];
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <header className={`flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-slate-200 border-l-4 ${franja}`}>
        <span className={`w-7 h-7 rounded-full text-white text-sm font-black flex items-center justify-center shrink-0 ${circulo}`}>{n}</span>
        <div className="flex-1 min-w-0">
          <h5 className="text-base font-extrabold text-slate-900">{titulo}</h5>
          {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
        </div>
        {completo != null && (completo
          ? <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Completo</span>
          : <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1"><CircleDashed size={14} /> Por llenar</span>)}
      </header>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function Escala({ titulo, opciones, valor, onElegir, deshabilitado }) {
  const elegido = opciones.find(([n]) => n === valor);
  return (
    <fieldset disabled={deshabilitado}>
      <legend className="text-xs font-bold text-slate-800 mb-1">{titulo}<span className="text-rose-600" aria-hidden="true"> *</span></legend>
      <div className="grid grid-cols-5 gap-1">
        {opciones.map(([n, nombre, ayuda]) => (
          <button key={n} type="button" title={ayuda} aria-pressed={valor === n} onClick={() => onElegir(n)}
            className={`px-1 py-1.5 rounded-lg border text-[11px] leading-tight transition-colors ${valor === n ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : `bg-white text-slate-700 hover:border-marca-azul ${valor ? 'border-slate-200' : 'border-amber-300'}`}`}>
            <strong className="block text-sm">{n}</strong>{nombre}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1 min-h-[1rem]">{elegido ? elegido[2] : 'Elige una opción'}</p>
    </fieldset>
  );
}

// Ligas opcionales del riesgo: indicadores que lo miden y acciones correctivas relacionadas (del área).
function Ligas({ r, set, soloLectura }) {
  const { indicadoresData = {}, accionesCorrectivas = [] } = useSGC();
  const indicadores = catalogoBase(INDICADORES, indicadoresData?.catalogoPersonalizado || {}, resolverResponsable)
    .filter((i) => i.area === r.area || i.direccion === r.area || (i.direccion === r.direccion && !i.area));
  const acciones = (accionesCorrectivas || []).filter((a) => a.area === r.area && a.folio_codigo && !/^Pendiente/i.test(a.folio_codigo));
  const ids = (k) => (Array.isArray(r[k]) ? r[k].map(String) : []);
  const grupos = [
    ['indicadores_ids', 'Indicadores que miden este registro', indicadores.map((i) => [String(i.id), `#${i.numero ?? i.id} ${i.nombre}`]), 'Agregar indicador…'],
    ['acciones_ids', 'Acciones correctivas relacionadas', acciones.map((a) => [String(a.id), `${a.folio_codigo} · ${String(a.descripcion_no_conformidad_final || a.descripcion_no_conformidad_original || '').slice(0, 70)}`]), 'Agregar acción correctiva…'],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {grupos.map(([k, titulo, opciones, placeholder]) => {
        const elegidos = ids(k);
        const nombre = Object.fromEntries(opciones);
        return (
          <div key={k} className="space-y-2">
            <span className="block text-xs font-bold text-slate-800">{titulo}</span>
            <ul className="flex flex-wrap gap-2">
              {elegidos.length === 0 && <li className="text-sm text-slate-500">Sin ligar.</li>}
              {elegidos.map((id) => (
                <li key={id} className="inline-flex items-center gap-1 rounded-full border-2 border-sky-300 bg-sky-50 pl-3 pr-1 py-1 text-xs font-bold text-sky-950 max-w-full">
                  <span className="truncate">{nombre[id] || `Registro ${id}`}</span>
                  {!soloLectura && <button type="button" aria-label={`Quitar ${nombre[id] || id}`} onClick={() => set({ [k]: elegidos.filter((x) => x !== id) })} className="p-0.5 rounded-full hover:bg-sky-200"><X size={12} /></button>}
                </li>
              ))}
            </ul>
            {!soloLectura && (
              <select value="" onChange={(e) => e.target.value && set({ [k]: [...elegidos, e.target.value] })} className={CAMPO_LISTA} aria-label={placeholder}>
                <option value="">{opciones.length ? placeholder : 'El área no tiene registros para ligar'}</option>
                {opciones.filter(([id]) => !elegidos.includes(id)).map(([id, t]) => <option key={id} value={id}>{t}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FormRiesgo({ valor, onChange, procesos = [], soloLectura, onVerPM }) {
  const r = valor;
  const set = (patch) => onChange({ ...r, ...patch, ...(patch.descripcion !== undefined ? { riesgo: patch.descripcion } : {}) });
  const escala = ESCALAS[r.tipo];
  const nivel = nivelDe(r);
  const plan = r.plan || [];
  const setAct = (i, patch) => set({ plan: plan.map((a, k) => (k === i ? { ...a, ...patch } : a)) });
  const esRiesgo = r.tipo === 'Riesgo';
  const conPlan = r.tratamiento && !['Aceptar', 'Posponer'].includes(r.tratamiento);
  const pide = !soloLectura; // solo se marca lo que falta mientras se puede editar

  const okIdent = Boolean(r.contexto && r.proceso);
  const okDesc = Boolean(r.descripcion?.trim());
  const okEval = Boolean(r.probabilidad && r.impacto);
  const actIncompleta = (a) => !a.actividad?.trim() || !a.responsable?.trim() || !a.fecha_termino_sugerida;
  const okTrat = okEval && (!requierePlan(r) || Boolean(r.tratamiento)) && (!conPlan || (plan.length > 0 && !plan.some(actIncompleta)));

  return (
    <div className="space-y-4">
      <Seccion n={1} titulo="Identificación" ayuda="De dónde surge y a qué proceso pertenece" completo={pide ? okIdent : null}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo etiqueta="Contexto (¿de dónde se identificó?)" requerido>
            <select value={r.contexto || ''} disabled={soloLectura} onChange={(e) => set({ contexto: e.target.value })} className={`${base} ${borde(pide && !r.contexto)}`}>
              <option value="">— Seleccionar —</option>
              {CONTEXTOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Proceso del SGC" requerido>
            <select value={r.proceso || ''} disabled={soloLectura} onChange={(e) => set({ proceso: e.target.value })} className={`${base} ${borde(pide && !r.proceso)}`}>
              <option value="">— Seleccionar —</option>
              {procesos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Resultado del análisis" ayuda="Qué se encontró en ese contexto. Ej.: el indicador #26 quedó en 70% en el segundo trimestre.">
          <TextoAuto value={r.contexto_resultado} disabled={soloLectura} onChange={(e) => set({ contexto_resultado: e.target.value })} />
        </Campo>
      </Seccion>

      <Seccion n={2} titulo={esRiesgo ? 'Descripción del riesgo' : 'Descripción de la oportunidad'} ayuda="Se respeta la redacción del área" completo={pide ? okDesc : null}>
        <Campo etiqueta={esRiesgo ? 'Riesgo identificado' : 'Oportunidad identificada'} requerido>
          <TextoAuto value={r.descripcion} falta={pide && !okDesc} disabled={soloLectura} onChange={(e) => set({ descripcion: e.target.value })}
            placeholder={esRiesgo ? '¿Qué podría salir mal?' : '¿Qué se podría aprovechar o mejorar?'} />
        </Campo>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['causa', esRiesgo ? 'Causa / origen' : 'Qué la origina'],
            ['consecuencia', esRiesgo ? 'Consecuencia si ocurre' : 'Beneficio esperado'],
            ['controles', esRiesgo ? 'Controles que ya existen' : 'Recursos con los que se cuenta'],
          ].map(([k, etiqueta]) => (
            <Campo key={k} etiqueta={etiqueta}>
              <TextoAuto value={r[k]} disabled={soloLectura} onChange={(e) => set({ [k]: e.target.value })} />
            </Campo>
          ))}
        </div>
      </Seccion>

      <Seccion n={3} titulo="Evaluación" ayuda={`Nivel = ${escala.ejeY.toLowerCase()} × ${escala.ejeX.toLowerCase()} (formato ${'OOMRSC-37'})`} completo={pide ? okEval : null}>
        {r.evaluacion_anterior && (
          <p className="text-sm text-sky-950 bg-sky-50 border-2 border-sky-200 rounded-lg px-3 py-2">
            <strong>Reevaluación anual.</strong> En {r.evaluacion_anterior.anio} se evaluó con {escala.ejeY.toLowerCase()} {r.evaluacion_anterior.probabilidad} × {escala.ejeX.toLowerCase()} {r.evaluacion_anterior.impacto} = {r.evaluacion_anterior.probabilidad * r.evaluacion_anterior.impacto} ({r.evaluacion_anterior.nivel || 'sin nivel'})
            {r.evaluacion_anterior.tratamiento ? `, tratamiento "${r.evaluacion_anterior.tratamiento}"` : ''}{r.evaluacion_anterior.pm_folio ? `, plan ${r.evaluacion_anterior.pm_folio}` : ''}.
            {' '}Evalúalo de nuevo con la situación actual.
          </p>
        )}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1fr_160px] md:grid-cols-2 gap-4 items-start">
          <Escala titulo={escala.ejeY} opciones={escala.probabilidad} valor={Number(r.probabilidad)} deshabilitado={soloLectura} onElegir={(n) => set({ probabilidad: n })} />
          <Escala titulo={escala.ejeX} opciones={escala.impacto} valor={Number(r.impacto)} deshabilitado={soloLectura} onElegir={(n) => set({ impacto: n })} />
          <div className={`rounded-xl border p-3 text-center ${nivel ? nivel.suave : 'bg-white text-slate-600 border-slate-200'}`} aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-wider">Nivel</p>
            <p className="text-3xl font-black">{puntaje(r) || '—'}</p>
            <p className="text-xs font-bold">{nivel?.nivel || 'Sin evaluar'}</p>
            {nivel && <p className="text-[11px] leading-snug mt-1">{nivel.importancia[r.tipo]}</p>}
          </div>
        </div>
      </Seccion>

      <Seccion n={4} titulo="Tratamiento y plan de acción" ayuda="El plan de acción se convierte en el Plan de Mejora" completo={pide && okEval ? okTrat : null}>
        {!nivel ? (
          <p className="text-sm text-slate-500">Primero evalúa {esRiesgo ? 'el riesgo' : 'la oportunidad'} en la sección 3.</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1.5">Tratamiento{requierePlan(r) && <span className="text-rose-600" aria-hidden="true"> *</span>}</p>
              <div className="flex flex-wrap items-center gap-2">
                {TRATAMIENTOS[r.tipo].map((t) => (
                  <button key={t} type="button" disabled={soloLectura} aria-pressed={r.tratamiento === t} onClick={() => set({ tratamiento: t })}
                    className={`px-4 py-1.5 rounded-full border text-xs font-semibold ${r.tratamiento === t ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : `bg-white text-slate-700 hover:border-marca-azul ${pide && requierePlan(r) && !r.tratamiento ? 'border-amber-400' : 'border-slate-300'}`}`}>
                    {t}
                  </button>
                ))}
                {!requierePlan(r) && <span className="text-xs text-slate-500">Nivel bajo: puede quedarse en monitoreo sin plan.</span>}
              </div>
              {requierePlan(r) && ['Aceptar', 'Posponer'].includes(r.tratamiento) && (
                <label className="block mt-2 text-xs font-bold text-slate-800">Justificación para {r.tratamiento.toLowerCase()} sin plan (nivel {nivelDe(r)?.nivel}) <span className="text-rose-600" aria-hidden="true">*</span>
                  <textarea rows={2} disabled={soloLectura} value={r.justificacion_tratamiento || ''} onChange={(e) => set({ justificacion_tratamiento: e.target.value })}
                    placeholder="Por qué el área decide no tratarlo ahora (mínimo 10 caracteres); la dirección lo verá en el informe" className="mt-1 w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg" />
                </label>
              )}
            </div>

            {conPlan && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800">Plan de acción{llevaPM(r) || requierePlan(r) ? <span className="text-rose-600" aria-hidden="true"> *</span> : ''}</p>
                  <p className="text-xs text-slate-500">Actividad, responsable y fecha son obligatorios</p>
                </div>
                {plan.length === 0 && <p className="p-4 text-center text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">Agrega al menos una actividad.</p>}
                <ol className="space-y-5">
                  {plan.map((a, i) => (
                    <li key={i} className="rounded-xl border-2 border-emerald-600/50 bg-white overflow-hidden shadow-md">
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-700 text-white">
                        <span className="flex items-center gap-2 text-sm font-extrabold"><span className="w-7 h-7 rounded-full bg-white text-emerald-900 font-black flex items-center justify-center">{i + 1}</span> Actividad {i + 1} de {plan.length}</span>
                        {/* Con plan de mejora ya generado no se quitan actividades: las evidencias se ligan por posición. */}
                        {!soloLectura && !r.pm_id && (
                          <button type="button" onClick={() => set({ plan: plan.filter((_, k) => k !== i) })} aria-label={`Quitar actividad ${i + 1}`} className="px-2 py-1 rounded-md text-xs font-bold text-white bg-white/15 hover:bg-rose-600 inline-flex items-center gap-1"><X size={14} /> Quitar</button>
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        <Campo etiqueta="Qué se va a hacer" requerido>
                          <TextoAuto value={a.actividad} falta={pide && !a.actividad?.trim()} disabled={soloLectura} onChange={(e) => setAct(i, { actividad: e.target.value })} />
                        </Campo>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-3">
                          <Campo etiqueta="Responsable (puesto)" requerido>
                            <TextoAuto value={a.responsable} falta={pide && !a.responsable?.trim()} disabled={soloLectura} onChange={(e) => setAct(i, { responsable: e.target.value })} />
                          </Campo>
                          <Campo etiqueta="Fecha de término" requerido>
                            <CampoFecha className={`${base} ${borde(pide && !a.fecha_termino_sugerida)}`} value={a.fecha_termino_sugerida || ''} disabled={soloLectura} onChange={(e) => setAct(i, { fecha_termino_sugerida: e.target.value })} />
                          </Campo>
                        </div>
                        <Campo etiqueta="Evidencia esperada" ayuda="Con qué documento o registro se comprobará que se hizo.">
                          <TextoAuto value={a.evidencia_esperada} disabled={soloLectura} onChange={(e) => setAct(i, { evidencia_esperada: e.target.value })} />
                        </Campo>
                      </div>
                    </li>
                  ))}
                </ol>
                {!soloLectura && (
                  <button type="button" onClick={() => set({ plan: [...plan, { actividad: '', responsable: '', fecha_termino_sugerida: '', evidencia_esperada: '' }] })}
                    className="text-sm font-bold text-marca-azul-oscuro bg-white hover:bg-sky-50 px-3 py-2 rounded-lg border border-marca-azul/40 inline-flex items-center gap-1">
                    <Plus size={14} /> Agregar actividad
                  </button>
                )}
              </div>
            )}

            {r.pm_id ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-sm text-sky-900">Este plan ya es el <strong>Plan de Mejora {r.pm_folio}</strong>. El avance, las evidencias y el cierre se registran ahí.{!soloLectura && ' Lo que ajustes aquí se refleja en ese plan.'}</p>
                {onVerPM && (
                  <button type="button" onClick={() => onVerPM({ id: r.pm_id })} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 inline-flex items-center gap-1">
                    Ir al plan de mejora <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ) : conPlan && (
              <p className="flex gap-2 items-start text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Info size={14} className="shrink-0 mt-0.5 text-marca-azul" />
                Cuando el SGC acepte la matriz, estas actividades se convierten en un Plan de Mejora ya aprobado (con folio, responsables y fechas). No hay que capturarlo otra vez; desde aquí habrá un botón para ir a él.
              </p>
            )}
          </>
        )}
      </Seccion>

      <Seccion n={5} titulo="Ligas (opcional)" ayuda="Indicadores que miden este registro y acciones correctivas relacionadas. Sirve para ver en la revisión por la dirección si el riesgo se está materializando." completo={null}>
        <Ligas r={r} set={set} soloLectura={soloLectura} />
      </Seccion>
    </div>
  );
}
