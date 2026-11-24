// Expediente de la acción: todos los archivos guardados con su folio (los del formato importado y los subidos después).
// Cada archivo se puede abrir y, mientras la evidencia no esté congelada, ligarse a una actividad.
import React, { useEffect, useState } from 'react';
import { listarArchivos, urlArchivo } from '../../services/archivosService';
import Paginacion, { usePaginado } from '../common/Paginacion';

const ICONO = { imagen: '🖼️', pdf: '📄', docx: '📝' };

export default function ExpedienteAC({ folio, actividades = [], puedeLigar, onLigar }) {
  const [archivos, setArchivos] = useState(null);
  const pag = usePaginado(archivos || [], 10);

  useEffect(() => {
    let vivo = true;
    listarArchivos('ac', folio).then((r) => { if (vivo) setArchivos(r.ok ? r.data : []); });
    return () => { vivo = false; };
  }, [folio]);

  if (!archivos?.length) return null;
  const ligadoA = (id) => actividades.findIndex((a) => a.evidencia_obj?.archivo_id === id);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-[#002855] mb-1 flex items-center gap-2"><span className="text-xl">🗂️</span> Expediente</h3>
      <p className="text-xs text-slate-600 mb-3">Archivos guardados con el folio {folio}. Ábrelos o lígalos a la actividad que comprueban.</p>
      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
        {pag.visibles.map((a) => {
          const n = ligadoA(a.id);
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span aria-hidden>{ICONO[a.tipo] || '📎'}</span>
              <a href={urlArchivo(a.id)} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-blue-800 hover:underline" title={a.descripcion || a.nombre_original}>
                {a.nombre_original}
              </a>
              <span className="text-xs text-slate-500">{Math.max(1, Math.round(a.bytes / 1024))} KB</span>
              {n >= 0 ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Actividad {n + 1}</span>
              ) : puedeLigar && actividades.length > 0 && (
                <select aria-label={`Ligar ${a.nombre_original} a una actividad`} value="" onChange={(e) => e.target.value && onLigar(Number(e.target.value), a)}
                  className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white">
                  <option value="">Ligar a actividad…</option>
                  {actividades.map((act, i) => (
                    <option key={i} value={i} disabled={!!act.evidencia_real}>{i + 1}. {(act.actividad || '').slice(0, 50)}{act.evidencia_real ? ' (ya tiene)' : ''}</option>
                  ))}
                </select>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-2"><Paginacion pagina={pag.pagina} total={pag.total} porPagina={pag.porPagina} onCambiar={pag.setPagina} etiqueta="archivos" /></div>
    </div>
  );
}
