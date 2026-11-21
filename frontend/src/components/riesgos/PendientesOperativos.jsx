// Pendientes del día a día en el tablero de riesgos. Discreto a propósito: una línea plegada que no
// compite con las cifras y mapas del tablero; se abre solo si se quiere ver el detalle.
import React from 'react';
import { ChevronRight } from 'lucide-react';

const MAX = 25;

function Grupo({ titulo, lista, texto }) {
  if (!lista.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-700">{titulo} ({lista.length})</p>
      <ul className="mt-0.5 text-xs text-slate-600 list-disc pl-5">
        {lista.slice(0, MAX).map((x, i) => <li key={x.id ?? `${x}-${i}`}>{texto(x)}</li>)}
        {lista.length > MAX && <li className="list-none text-slate-500">y {lista.length - MAX} más</li>}
      </ul>
    </div>
  );
}

export default function PendientesOperativos({ pendientes, anio }) {
  if (!pendientes || !pendientes.total) return null;
  const { sinEnviar, enRevision, vencidos, porVencer, porDictaminar } = pendientes;
  const resumen = [
    [sinEnviar.length, `matrices ${anio} sin enviar`],
    [enRevision.length, 'en revisión SGC'],
    [vencidos.length, 'planes vencidos'],
    [porVencer.length, 'por vencer'],
    [porDictaminar.length, 'por dictaminar'],
  ].filter(([n]) => n > 0);
  const riesgo = (r) => `${r.area} · ${r.descripcion || 'sin descripción'}${r.pm_folio ? ` (${r.pm_folio})` : ''}`;
  return (
    <details className="group rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
      <summary className="flex flex-wrap items-center gap-x-2 gap-y-1 cursor-pointer list-none select-none">
        <ChevronRight size={13} className="transition-transform group-open:rotate-90" />
        <span className="font-semibold text-slate-700">Pendientes operativos</span>
        {resumen.map(([n, t]) => <span key={t}>· {n} {t}</span>)}
      </summary>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Grupo titulo={`Matrices ${anio} sin enviar`} lista={sinEnviar} texto={(a) => a} />
        <Grupo titulo="Matrices en revisión del SGC" lista={enRevision} texto={(a) => a} />
        <Grupo titulo="Planes de mejora vencidos" lista={vencidos} texto={riesgo} />
        <Grupo titulo="Planes de mejora por vencer" lista={porVencer} texto={riesgo} />
        <Grupo titulo="Riesgos por dictaminar" lista={porDictaminar} texto={riesgo} />
      </div>
    </details>
  );
}
