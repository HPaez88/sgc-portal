// ═══════════════════════════════════════════════════════════════
// Riesgos y Oportunidades (ISO 9001:2015 § 6.1) — rediseño 2026-11-13.
// Pestañas: Mi matriz (captura del área) · Tablero (mapas y cifras) · Seguimiento (planes de mejora
// ligados y dictamen de eficacia) · Revisión SGC (bandeja de matrices, solo administradores).
// ═══════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { useLocalStorage } from '../../hooks';
import { esAdminSGC } from '../../constants/workflow';
import { normalizarDireccion } from '../../constants/areas';
import { CLAVE_MATRIZ, idMatriz } from '../../constants/riesgos';
import MatrizArea from './MatrizArea';
import TableroRiesgos from './TableroRiesgos';
import SeguimientoRiesgos from './SeguimientoRiesgos';
import RevisionMatrices from './RevisionMatrices';

const ANIO_ACTUAL = new Date().getFullYear();
// Desde noviembre ya se captura la matriz del año siguiente.
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];

export default function RiesgosView({ riesgos = [], setRiesgos, puedeTodasAreas, areaUsuario }) {
  const { areasDetalle = [], procesos = [], planesMejora = [], setPlanesMejora, registrarMovimiento, usuarioLogueado } = useSGC();
  const [matrices, setMatrices] = useLocalStorage('sgc-matrices-riesgos', []);
  const esAdmin = esAdminSGC(usuarioLogueado);
  const [tab, setTab] = useState(esAdmin ? 'tablero' : 'matriz');
  const [anio, setAnio] = useState(new Date().getMonth() >= 10 ? ANIO_ACTUAL + 1 : ANIO_ACTUAL);
  const areasCatalogo = useMemo(() => [...areasDetalle].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [areasDetalle]);
  const [areaSel, setAreaSel] = useState(areaUsuario && areasDetalle.some((a) => a.nombre === areaUsuario) ? areaUsuario : (areasCatalogo[0]?.nombre || ''));
  const area = puedeTodasAreas ? areaSel : areaUsuario;
  const direccion = normalizarDireccion(areasDetalle.find((a) => a.nombre === area)?.direccion || '');

  // Solo registros del modelo nuevo (con año); los de prueba anteriores no se muestran.
  const lista = (Array.isArray(riesgos) ? riesgos : []).filter((r) => r.anio);
  const visibles = lista.filter((r) => puedeTodasAreas || r.area === areaUsuario);
  const delAnio = visibles.filter((r) => Number(r.anio) === Number(anio));
  const anioAnterior = visibles.filter((r) => Number(r.anio) === Number(anio) - 1);

  const guardarMatriz = (m) => setMatrices((prev) => {
    const otras = (Array.isArray(prev) ? prev : []).filter((x) => x.id !== m.id);
    return [...otras, m];
  });
  const matriz = (Array.isArray(matrices) ? matrices : []).find((m) => m.id === idMatriz(area, anio));

  const pestanas = [
    ['matriz', puedeTodasAreas ? 'Matriz por área' : 'Mi matriz'],
    ['tablero', 'Tablero'],
    ['seguimiento', 'Seguimiento'],
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

      <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {pestanas.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
        ))}
      </nav>

      {tab === 'matriz' && (area ? (
        <MatrizArea area={area} direccion={direccion} anio={anio} riesgos={lista} setRiesgos={setRiesgos} matriz={matriz}
          guardarMatriz={guardarMatriz} procesos={procesos} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />
      ) : <p className="text-sm text-slate-600">Tu usuario no tiene un área asignada. Pide al SGC que te la asigne.</p>)}

      {tab === 'tablero' && <TableroRiesgos items={delAnio} planesMejora={planesMejora} areasDetalle={areasDetalle} anio={anio} itemsAnioAnterior={anioAnterior} />}

      {tab === 'seguimiento' && <SeguimientoRiesgos items={delAnio} setRiesgos={setRiesgos} planesMejora={planesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />}

      {tab === 'revision' && esAdmin && (
        <RevisionMatrices anio={anio} areas={areasCatalogo} riesgos={lista} setRiesgos={setRiesgos} matrices={Array.isArray(matrices) ? matrices : []}
          guardarMatriz={guardarMatriz} planesMejora={planesMejora} setPlanesMejora={setPlanesMejora} usuarioLogueado={usuarioLogueado} registrarMovimiento={registrarMovimiento} />
      )}
    </div>
  );
}
