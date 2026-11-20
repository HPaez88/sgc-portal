// Bitácora apilada por periodo: días del mes en curso, meses cerrados y años anteriores. Cada periodo se abre
// y muestra sus movimientos de 25 en 25; la lista de periodos también se pagina (nada de scroll infinito).
import React, { useMemo, useState } from 'react';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import Paginacion from '../common/Paginacion';
import { agruparPorPeriodo } from '../../constants/periodos';

const POR_PAGINA = 25;
const TIPO = { dia: 'Día', mes: 'Mes', anio: 'Año' };
const FONDO = { dia: 'bg-white', mes: 'bg-slate-50', anio: 'bg-slate-100' };

function Periodo({ grupo, abierto, onAlternar, renderFila }) {
  const [paginaElegida, setPagina] = useState(1);
  // La lista se recalcula seguido (presencia de usuarios); no se reinicia, solo se ajusta si la página ya no existe.
  const pagina = Math.min(paginaElegida, Math.max(1, Math.ceil(grupo.items.length / POR_PAGINA)));
  const eliminaciones = grupo.items.filter((m) => m.accion === 'ELIMINACION').length;
  const visibles = grupo.items.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  return (
    <li className={`rounded-xl border border-slate-200 overflow-hidden ${FONDO[grupo.tipo]}`}>
      <button type="button" onClick={onAlternar} aria-expanded={abierto}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sky-50">
        <span className="flex items-center gap-2">
          {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500 w-10">{TIPO[grupo.tipo]}</span>
          <span className="text-sm font-extrabold text-slate-900">{grupo.etiqueta}</span>
        </span>
        <span className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">{grupo.items.length} movimiento(s)</span>
          {eliminaciones > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">{eliminaciones} eliminación(es)</span>}
        </span>
      </button>
      {abierto && (
        <div className="bg-white border-t border-slate-200 p-3 space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Movimientos de {grupo.etiqueta}</caption>
              <thead>
                <tr className="text-xs">
                  <th scope="col" className="py-2 px-4">Fecha y hora</th>
                  <th scope="col" className="py-2 px-4">Acción</th>
                  <th scope="col" className="py-2 px-4">Módulo / Folio</th>
                  <th scope="col" className="py-2 px-4">Descripción del movimiento</th>
                  <th scope="col" className="py-2 px-4">Usuario responsable</th>
                  <th scope="col" className="py-2 px-4 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">{visibles.map(renderFila)}</tbody>
            </table>
          </div>
          <Paginacion pagina={pagina} total={grupo.items.length} porPagina={POR_PAGINA} onCambiar={setPagina} etiqueta="movimientos" />
        </div>
      )}
    </li>
  );
}

export default function PeriodosBitacora({ movimientos, renderFila }) {
  const grupos = useMemo(() => agruparPorPeriodo(movimientos, (m) => m.timestamp), [movimientos]);
  const [abierto, setAbierto] = useState(null);  // null = el más reciente; '' = todos cerrados
  const [paginaElegida, setPagina] = useState(1);
  const pagina = Math.min(paginaElegida, Math.max(1, Math.ceil(grupos.length / POR_PAGINA)));
  const actual = abierto === null || (abierto && !grupos.some((g) => g.id === abierto)) ? grupos[0]?.id : abierto;
  const visibles = grupos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  if (!grupos.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center text-slate-500">
        <History size={38} className="mx-auto mb-2 text-slate-300" />
        <p className="font-bold text-sm text-slate-700">No se encontraron movimientos registrados</p>
        <p className="text-xs mt-1">Ajuste los filtros de búsqueda o el rango de fechas para consultar.</p>
      </div>
    );
  }
  return (
    <section className="space-y-2" aria-label="Movimientos por periodo">
      <ul className="space-y-2">
        {visibles.map((g) => (
          <Periodo key={g.id} grupo={g} abierto={actual === g.id} renderFila={renderFila}
            onAlternar={() => setAbierto(actual === g.id ? '' : g.id)} />
        ))}
      </ul>
      <Paginacion pagina={pagina} total={grupos.length} porPagina={POR_PAGINA} onCambiar={setPagina} etiqueta="periodos" />
    </section>
  );
}
