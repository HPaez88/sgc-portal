// ═══════════════════════════════════════════════════════════════
// Riesgos y Oportunidades (ISO 9001:2015 § 6.1) — rediseño 2026-11-13.
// Pestañas: Mi matriz (captura del área) · Tablero (mapas y cifras) · Seguimiento (planes de mejora
// ligados y dictamen de eficacia) · Informes (por área/dirección, comparativo anual, PDF) · Revisión SGC (bandeja de matrices, solo administradores).
// ═══════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { useLocalStorage } from '../../hooks';
import { esAdminSGC, can } from '../../constants/workflow';
import { normalizarDireccion } from '../../constants/areas';
import { CLAVE_MATRIZ, idMatriz, esOficial, estadoRiesgo, puedeCapturarArea } from '../../constants/riesgos';
import MatrizArea from './MatrizArea';
import TableroRiesgos from './TableroRiesgos';
import SeguimientoRiesgos from './SeguimientoRiesgos';
import RevisionMatrices from './RevisionMatrices';
import InformeRiesgos from './InformeRiesgos';

const ANIO_ACTUAL = new Date().getFullYear();
// Desde noviembre ya se captura la matriz del año siguiente.
const PRIMER_ANIO = Math.min(2025, ANIO_ACTUAL - 1);
const ANIOS = Array.from({ length: ANIO_ACTUAL + 2 - PRIMER_ANIO }, (_, i) => PRIMER_ANIO + i);

export default function RiesgosView({ riesgos = [], setRiesgos, puedeTodasAreas, areaUsuario, setActiveTab }) {
  const { areasDetalle = [], procesos = [], planesMejora = [], setPlanesMejora, registrarMovimiento, usuarioLogueado } = useSGC();
  const [matrices, setMatrices] = useLocalStorage('sgc-matrices-riesgos', []);
  const esAdmin = esAdminSGC(usuarioLogueado);
  const [tab, setTab] = useState(esAdmin ? 'tablero' : 'matriz');
  // La matriz se captura desde noviembre para el año siguiente; el seguimiento e informes son del año en curso.
  const [anioSeguimiento, setAnioSeguimiento] = useState(ANIO_ACTUAL);
  const [anioMatriz, setAnioMatriz] = useState(new Date().getMonth() >= 10 ? ANIO_ACTUAL + 1 : ANIO_ACTUAL);
  const anio = tab === 'matriz' || tab === 'revision' ? anioMatriz : anioSeguimiento;
  const setAnio = tab === 'matriz' || tab === 'revision' ? setAnioMatriz : setAnioSeguimiento;
  const areasCatalogo = useMemo(() => [...areasDetalle].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [areasDetalle]);
  const [areaSel, setAreaSel] = useState(areaUsuario && areasDetalle.some((a) => a.nombre === areaUsuario) ? areaUsuario : (areasCatalogo[0]?.nombre || ''));
  // Si el catálogo llega después del primer render, se toma la primera área.
  const area = puedeTodasAreas ? (areaSel || areasCatalogo[0]?.nombre || '') : areaUsuario;
  const puedeEditar = puedeCapturarArea(usuarioLogueado, area, areasDetalle, esAdmin) && (esAdmin || can(usuarioLogueado, 'editar'));
  const puedeEnviar = esAdmin || (puedeEditar && (can(usuarioLogueado, 'enviar') || (areasDetalle.find((a) => a.nombre === area)?.encargados_sgc || []).includes(String(usuarioLogueado?.email || '').toLowerCase())));
  const direccion = normalizarDireccion(areasDetalle.find((a) => a.nombre === area)?.direccion || '');

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

  const pestanas = [
    ['matriz', puedeTodasAreas ? 'Matriz por área' : 'Mi matriz'],
    ['tablero', 'Tablero'],
    ['seguimiento', 'Seguimiento'],
    ['informes', 'Informes'],
    ...(esAdmin ? [['revision', 'Revisión SGC']] : []),
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><ShieldAlert size={22} className="text-rose-600" /> Riesgos y Oportunidades</h2>
          <p className="text-sm text-slate-600">ISO 9001:2015 § 6.1 · matriz {CLAVE_MATRIZ} por área, seguimiento con planes de mejora</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'matriz' && puedeTodasAreas && (
            <select value={areaSel} onChange={(e) => setAreaSel(e.target.value)} aria-label="Área" className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold">
              {areasCatalogo.map((a) => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
            </select>
          )}
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} aria-label="Año" className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold">
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </header>

      <nav role="tablist" aria-label="Secciones de riesgos" className="flex gap-1 bg-slate-100 p-1 rounded-xl max-w-full w-fit overflow-x-auto">
        {pestanas.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
        ))}
      </nav>

      {tab === 'matriz' && (area ? (
        <MatrizArea area={area} direccion={direccion} anio={anio} riesgos={lista} setRiesgos={setRiesgos} matriz={matriz}
          guardarMatriz={guardarMatriz} procesos={procesos} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento}
          puedeEditar={puedeEditar} puedeEnviar={puedeEnviar} />
      ) : <p className="text-sm text-slate-600">Tu usuario no tiene un área asignada. Pide al SGC que te la asigne.</p>)}

      {tab === 'tablero' && <TableroRiesgos items={delAnio} planesMejora={planesMejora} areasDetalle={areasDetalle} anio={anio} itemsAnioAnterior={anioAnterior} enCaptura={enCaptura} />}

      {tab === 'seguimiento' && <SeguimientoRiesgos items={enSeguimiento} setRiesgos={setRiesgos} planesMejora={planesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} onVerPM={verPM} onReplantear={replantear} />}

      {tab === 'informes' && (
        <InformeRiesgos lista={oficiales} enCaptura={enCaptura} planesMejora={planesMejora} areasDetalle={areasDetalle} matrices={listaMatrices}
          anio={anio} puedeTodasAreas={puedeTodasAreas} areaUsuario={areaUsuario} usuarioLogueado={usuarioLogueado} />
      )}

      {tab === 'revision' && esAdmin && (
        <RevisionMatrices anio={anio} areas={areasCatalogo} riesgos={lista} setRiesgos={setRiesgos} matrices={listaMatrices}
          guardarMatriz={guardarMatriz} planesMejora={planesMejora} setPlanesMejora={setPlanesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />
      )}
    </div>
  );
}
