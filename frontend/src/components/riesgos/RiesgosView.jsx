// ═══════════════════════════════════════════════════════════════
// Riesgos y Oportunidades (ISO 9001:2015 § 6.1) — rediseño 2026-11-13.
// Pestañas (en este orden, según permisos): Seguimiento (todos; primera) · Mi matriz / Matriz por área ·
// Tablero (quien ve todas las áreas) · Informes (todos; las áreas solo el suyo) · Revisión SGC (administradores).
// ═══════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { ShieldAlert, ListChecks, Grid3x3, LayoutDashboard, FileBarChart2, ClipboardCheck, Plus, Sparkles, Compass } from 'lucide-react';
import FodaArea from './FodaArea';
import { unidadesDeRiesgo, TIPOS_UNIDAD } from '../../constants/unidades';
import { useSGC } from '../../SGCContext';
import { useLocalStorage } from '../../hooks';
import { esAdminSGC, can } from '../../constants/workflow';
import { normalizarDireccion } from '../../constants/areas';
import { CLAVE_MATRIZ, ESTADOS_MATRIZ, idMatriz, esOficial, estadoRiesgo, puedeCapturarArea } from '../../constants/riesgos';
import MatrizArea from './MatrizArea';
import MatrizPorArea from './MatrizPorArea';
import TableroRiesgos from './TableroRiesgos';
import SeguimientoRiesgos from './SeguimientoRiesgos';
import RevisionMatrices from './RevisionMatrices';
import InformeRiesgos from './InformeRiesgos';

const ANIO_ACTUAL = new Date().getFullYear();
// Desde noviembre ya se captura la matriz del año siguiente.
const PRIMER_ANIO = Math.min(2025, ANIO_ACTUAL - 1);
const ANIOS = Array.from({ length: ANIO_ACTUAL + 2 - PRIMER_ANIO }, (_, i) => PRIMER_ANIO + i);

export default function RiesgosView({ riesgos = [], setRiesgos, puedeTodasAreas, areaUsuario, setActiveTab }) {
  const { areasDetalle = [], setAreasDetalle, direccionesDetalle = [], setDireccionesDetalle, procesos = [], planesMejora = [], setPlanesMejora, registrarMovimiento, usuarioLogueado } = useSGC();
  const [matrices, setMatrices] = useLocalStorage('sgc-matrices-riesgos', []);
  // Síntesis del organismo por año (informes): { [anio]: { foda, riesgos, oportunidades, plan, ... } }
  const [sintesisOrganismo, setSintesisOrganismo] = useLocalStorage('sgc-sintesis-organismo', {});
  const esAdmin = esAdminSGC(usuarioLogueado);
  const [tab, setTab] = useState('seguimiento'); // Seguimiento siempre es la primera pestaña
  const [accionAlta, setAccionAlta] = useState(null); // 'Riesgo' | 'Oportunidad' | 'IA' pedida desde Seguimiento
  // La matriz se captura desde noviembre para el año siguiente; el seguimiento e informes son del año en curso.
  const [anioSeguimiento, setAnioSeguimiento] = useState(ANIO_ACTUAL);
  const [anioMatriz, setAnioMatriz] = useState(new Date().getMonth() >= 10 ? ANIO_ACTUAL + 1 : ANIO_ACTUAL);
  const anioDeMatriz = tab === 'matriz' || tab === 'revision';
  const anio = anioDeMatriz ? anioMatriz : anioSeguimiento;
  const setAnio = anioDeMatriz ? setAnioMatriz : setAnioSeguimiento;
  const areasCatalogo = useMemo(() => [...areasDetalle].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [areasDetalle]);
  // Unidades con matriz: direcciones, subdirecciones y áreas (el FODA es solo de áreas).
  const unidades = useMemo(() => unidadesDeRiesgo(areasDetalle, direccionesDetalle), [areasDetalle, direccionesDetalle]);
  const [areaSel, setAreaSel] = useState(areaUsuario && areasDetalle.some((a) => a.nombre === areaUsuario) ? areaUsuario : (areasCatalogo[0]?.nombre || ''));
  // Si el catálogo llega después del primer render, se toma la primera área.
  const area = puedeTodasAreas ? (areaSel || areasCatalogo[0]?.nombre || '') : areaUsuario;
  const permisosDe = (nombreArea) => {
    const editar = puedeCapturarArea(usuarioLogueado, nombreArea, unidades, esAdmin) && (esAdmin || can(usuarioLogueado, 'editar'));
    const enviar = esAdmin || (editar && (can(usuarioLogueado, 'enviar') || (unidades.find((a) => a.nombre === nombreArea)?.encargados_sgc || []).includes(String(usuarioLogueado?.email || '').toLowerCase())));
    return { puedeEditar: editar, puedeEnviar: enviar };
  };
  const { puedeEditar, puedeEnviar } = permisosDe(area);
  const direccion = unidades.find((u) => u.nombre === area)?.direccion || normalizarDireccion(areasDetalle.find((a) => a.nombre === area)?.direccion || '');

  // Solo registros del modelo nuevo (con año); los de prueba anteriores no se muestran.
  const lista = (Array.isArray(riesgos) ? riesgos : []).filter((r) => r.anio);
  const visibles = lista.filter((r) => puedeTodasAreas || r.area === areaUsuario);
  const listaMatrices = Array.isArray(matrices) ? matrices : [];
  // Tablero e informes: solo lo validado por el SGC (lo que está en captura o revisión se cuenta aparte).
  const oficiales = visibles.filter((r) => esOficial(r, listaMatrices));
  const enCaptura = visibles.filter((r) => Number(r.anio) === Number(anio) && !esOficial(r, listaMatrices)).length;
  const delAnio = oficiales.filter((r) => Number(r.anio) === Number(anio));
  const anioAnterior = oficiales.filter((r) => Number(r.anio) === Number(anio) - 1);
  // Seguimiento: el año elegido más todo lo que siga abierto de años anteriores.
  const enSeguimiento = visibles.filter((r) => Number(r.anio) === Number(anio)
    || (r.pm_id && !String(estadoRiesgo(r, planesMejora)).startsWith('CERRADO')));

  const verPM = (pm) => {
    try { sessionStorage.setItem('sgc-abrir-pm', String(pm.id)); } catch { /* sin almacenamiento: solo navega */ }
    setActiveTab?.('pm');
  };

  // Dictamen no eficaz: el registro vuelve al área para un nuevo plan (el PM anterior queda en su historial).
  const replantear = (r, motivo) => {
    setRiesgos((prev) => prev.map((x) => (x.id !== r.id ? x : {
      ...x, estado: 'IDENTIFICADO', pm_id: null, pm_folio: null, dictamen: null, residual: null, plan: [],
      historial_pm: [...(x.historial_pm || []), { pm_id: x.pm_id, pm_folio: x.pm_folio, dictamen: x.dictamen, residual: x.residual, fecha: new Date().toISOString() }],
    })));
    const m = listaMatrices.find((x) => x.id === idMatriz(r.area, r.anio));
    guardarMatriz({
      ...(m || { id: idMatriz(r.area, r.anio), area: r.area, anio: r.anio, direccion: r.direccion }),
      estado: 'OBSERVADA',
      observaciones: [...(m?.observaciones || []), { texto: `Replantear "${r.descripcion}": ${motivo}`, por: usuarioLogueado?.nombre || 'SGC', fecha: new Date().toISOString() }],
    });
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'REPLANTEO_RIESGO', descripcion: `${r.tipo} "${r.descripcion}" (${r.area}) regresa al área para un nuevo plan; PM anterior ${r.pm_folio || '-'}`, detalles: motivo, folio: r.pm_folio || '' });
  };

  const guardarMatriz = (m) => setMatrices((prev) => {
    const otras = (Array.isArray(prev) ? prev : []).filter((x) => x.id !== m.id);
    return [...otras, m];
  });
  const matriz = listaMatrices.find((m) => m.id === idMatriz(area, anio));

  // Contadores para que cada pestaña diga qué hay pendiente.
  const enCurso = visibles.filter((r) => r.pm_id && !String(estadoRiesgo(r, planesMejora)).startsWith('CERRADO')).length;
  const porDictaminar = visibles.filter((r) => ['PENDIENTE_DICTAMEN', 'PM_NO_ENCONTRADO'].includes(estadoRiesgo(r, planesMejora))).length;
  const porRevisar = listaMatrices.filter((m) => m.estado === 'ENVIADA' && Number(m.anio) === Number(anioMatriz)).length;
  const estadoMiMatriz = puedeTodasAreas ? null : ESTADOS_MATRIZ[listaMatrices.find((m) => m.id === idMatriz(areaUsuario, anioMatriz))?.estado || 'BORRADOR'].label;

  const pestanas = [
    { id: 'seguimiento', label: 'Seguimiento', Icono: ListChecks, cuenta: esAdmin && porDictaminar ? `${porDictaminar} por dictaminar` : (enCurso || null),
      ayuda: 'Riesgos y oportunidades con plan de mejora: avance, vencimientos y dictamen de eficacia.' },
    { id: 'matriz', label: puedeTodasAreas ? 'Matriz por área' : 'Mi matriz', Icono: Grid3x3, cuenta: estadoMiMatriz,
      ayuda: `Captura anual ${CLAVE_MATRIZ}: identificar, evaluar y planear; se envía al SGC para su aceptación.` },
    ...(puedeTodasAreas ? [{ id: 'tablero', label: 'Tablero', Icono: LayoutDashboard, ayuda: 'Cifras y mapas de calor de lo aceptado por el SGC.' }] : []),
    { id: 'foda', label: 'FODA y propósito', Icono: Compass,
      ayuda: 'Propósito y análisis FODA de cada área: se revisan con el área y la IA los usa para sugerir riesgos y oportunidades.' },
    { id: 'informes', label: 'Informes', Icono: FileBarChart2, ayuda: puedeTodasAreas ? 'Informe por área, dirección u organismo, comparativo anual y PDF.' : 'Informe de tu área, comparativo anual y PDF.' },
    ...(esAdmin ? [{ id: 'revision', label: 'Revisión SGC', Icono: ClipboardCheck, cuenta: porRevisar ? `${porRevisar} por revisar` : null, alerta: porRevisar > 0,
      ayuda: 'Bandeja del SGC: revisar, devolver con observaciones, aceptar o reabrir matrices.' }] : []),
  ];
  const actual = pestanas.find((p) => p.id === tab) || pestanas[0];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><ShieldAlert size={22} className="text-rose-600" /> Riesgos y Oportunidades</h2>
          <p className="text-sm text-slate-600">ISO 9001:2015 § 6.1 · matriz {CLAVE_MATRIZ} por área, seguimiento con planes de mejora</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            {anioDeMatriz ? 'Año de la matriz' : 'Año'}
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold">
              {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="space-y-2">
        <nav role="tablist" aria-label="Secciones de riesgos" className="flex gap-1 bg-slate-100 p-1 rounded-xl max-w-full w-fit overflow-x-auto">
          {pestanas.map(({ id, label, Icono, cuenta, alerta }) => (
            <button key={id} type="button" role="tab" aria-selected={actual.id === id} onClick={() => setTab(id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 ${actual.id === id ? 'bg-white text-marca-azul-oscuro shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}>
              <Icono size={16} aria-hidden="true" />
              {label}
              {cuenta != null && cuenta !== '' && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${alerta ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{cuenta}</span>
              )}
            </button>
          ))}
        </nav>
        <p className="text-xs text-slate-600">{actual.ayuda}</p>
      </div>

      {actual.id === 'matriz' && puedeTodasAreas && (
        <MatrizPorArea areas={unidades} anio={anio} riesgos={lista} matrices={listaMatrices}
          areaInicial={accionAlta ? area : null} accionInicial={accionAlta} onAccionHecha={() => setAccionAlta(null)}
          propsMatriz={(a) => ({
            riesgos: lista, setRiesgos, guardarMatriz, procesos, usuarioLogueado, registrarMovimiento, onVerPM: verPM,
            direccion: a.direccion || '', ...permisosDe(a.nombre),
          })} />
      )}

      {actual.id === 'matriz' && !puedeTodasAreas && (area ? (
        <MatrizArea area={area} direccion={direccion} anio={anio} riesgos={lista} setRiesgos={setRiesgos} matriz={matriz}
          guardarMatriz={guardarMatriz} procesos={procesos} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento}
          puedeEditar={puedeEditar} puedeEnviar={puedeEnviar} onVerPM={verPM}
          accionInicial={accionAlta} onAccionHecha={() => setAccionAlta(null)} />
      ) : <p className="text-sm text-slate-600">Tu usuario no tiene un área asignada. Pide al SGC que te la asigne.</p>)}

      {actual.id === 'tablero' && <TableroRiesgos items={delAnio} planesMejora={planesMejora} areasDetalle={areasDetalle} anio={anio} itemsAnioAnterior={anioAnterior} enCaptura={enCaptura} />}

      {actual.id === 'seguimiento' && (puedeTodasAreas ? esAdmin : puedeCapturarArea(usuarioLogueado, areaUsuario, areasDetalle)) && (
        <section aria-label="Dar de alta" className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 border-l-4 border-l-marca-verde rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-slate-800 mr-1">Dar de alta en la matriz {anioMatriz}</p>
          {puedeTodasAreas && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              de
              <select value={area} onChange={(e) => setAreaSel(e.target.value)} className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold max-w-xs">
                {Object.entries(TIPOS_UNIDAD).map(([tipo, etiqueta]) => (
                  <optgroup key={tipo} label={`${etiqueta === 'Área' ? 'Áreas' : `${etiqueta === 'Dirección' ? 'Direcciones' : 'Subdirecciones'}`}`}>
                    {unidades.filter((u) => u.tipo === tipo).map((u) => <option key={u.nombre} value={u.nombre}>{u.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          )}
          <span className="flex-1" />
          {[['Riesgo', 'Riesgo', 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100', Plus], ['Oportunidad', 'Oportunidad', 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', Plus], ['IA', 'Sugerir con IA', 'text-violet-800 bg-violet-50 border-violet-200 hover:bg-violet-100', Sparkles]].map(([accion, texto, cls, Icono]) => (
            <button key={accion} type="button" onClick={() => { setAccionAlta(accion); setTab('matriz'); }}
              className={`px-3 py-2 text-xs font-bold border rounded-lg inline-flex items-center gap-1 ${cls}`}><Icono size={14} /> {texto}</button>
          ))}
        </section>
      )}

      {actual.id === 'seguimiento' && <SeguimientoRiesgos items={enSeguimiento} setRiesgos={setRiesgos} planesMejora={planesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} onVerPM={verPM} onReplantear={replantear} />}

      {actual.id === 'foda' && (
        <FodaArea areas={areasCatalogo} areaInicial={puedeTodasAreas ? area : areaUsuario} areasDetalle={areasDetalle} setAreasDetalle={setAreasDetalle}
          puedeEditar={esAdmin} puedeElegirArea={puedeTodasAreas} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />
      )}

      {actual.id === 'informes' && (
        <InformeRiesgos lista={oficiales} enCaptura={enCaptura} planesMejora={planesMejora} areasDetalle={areasDetalle} matrices={listaMatrices}
          unidades={unidades} direccionesDetalle={direccionesDetalle} setDireccionesDetalle={setDireccionesDetalle} esAdmin={esAdmin}
          sintesisOrganismo={sintesisOrganismo || {}} setSintesisOrganismo={setSintesisOrganismo} todosLosRiesgos={lista}
          anio={anio} puedeTodasAreas={puedeTodasAreas} areaUsuario={areaUsuario} usuarioLogueado={usuarioLogueado} />
      )}

      {actual.id === 'revision' && esAdmin && (
        <RevisionMatrices anio={anio} areas={unidades} riesgos={lista} setRiesgos={setRiesgos} matrices={listaMatrices}
          guardarMatriz={guardarMatriz} planesMejora={planesMejora} setPlanesMejora={setPlanesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />
      )}
    </div>
  );
}
