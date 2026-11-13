// Tablero para decidir: cifras clave, mapas de calor y comparación por dirección.
// Clic en una celda del mapa → lista de lo que cae ahí.
import React, { useMemo, useState } from 'react';
import MapaCalor from './MapaCalor';
import { nivelDe, puntaje, estadoRiesgo, ESTADOS_RIESGO } from '../../constants/riesgos';
import { direccionDeRegistro } from '../../constants/areas';
import { getVencimiento } from '../../constants/workflow';

function Cifra({ valor, etiqueta, nota, tono = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className={`text-3xl font-black ${tono}`}>{valor}</p>
      <p className="text-xs font-bold text-slate-700">{etiqueta}</p>
      {nota && <p className="text-[11px] text-slate-500 mt-0.5">{nota}</p>}
    </div>
  );
}

export default function TableroRiesgos({ items, planesMejora, areasDetalle, anio, itemsAnioAnterior = [] }) {
  const [celda, setCelda] = useState(null); // { tipo, p, i }
  const riesgos = items.filter((r) => r.tipo === 'Riesgo');
  const oportunidades = items.filter((r) => r.tipo === 'Oportunidad');
  const altos = riesgos.filter((r) => nivelDe(r)?.nivel === 'Alto');
  const conPM = items.filter((r) => r.pm_id);
  const vencidos = conPM.filter((r) => {
    const pm = planesMejora.find((p) => String(p.id) === String(r.pm_id));
    return pm && getVencimiento(pm).nivel === 'vencido';
  });
  const dictaminados = items.filter((r) => r.dictamen);
  const eficaces = dictaminados.filter((r) => r.dictamen.resultado === 'EFICAZ');
  const altosAntes = itemsAnioAnterior.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').length;
  const promedio = riesgos.length ? (riesgos.reduce((n, r) => n + puntaje(r), 0) / riesgos.length).toFixed(1) : '—';

  const porDireccion = useMemo(() => {
    const m = new Map();
    items.forEach((r) => {
      const d = (direccionDeRegistro(r, areasDetalle) || 'Sin dirección').replace(/^Dir\.\s*/, '');
      const x = m.get(d) || { d, Bajo: 0, Medio: 0, Alto: 0, total: 0 };
      if (r.tipo === 'Riesgo' && nivelDe(r)) x[nivelDe(r).nivel] += 1;
      x.total += 1;
      m.set(d, x);
    });
    return [...m.values()].sort((a, b) => b.Alto - a.Alto || b.total - a.total);
  }, [items, areasDetalle]);
  const maxDir = Math.max(1, ...porDireccion.map((x) => x.Bajo + x.Medio + x.Alto));

  const enCelda = celda ? items.filter((r) => r.tipo === celda.tipo && Number(r.probabilidad) === celda.p && Number(r.impacto) === celda.i) : [];

  if (!items.length) {
    return <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Aún no hay riesgos ni oportunidades registrados para {anio}.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Cifra valor={riesgos.length} etiqueta="Riesgos" nota={`${oportunidades.length} oportunidades`} />
        <Cifra valor={altos.length} etiqueta="Riesgos altos" tono="text-rose-700" nota={itemsAnioAnterior.length ? `${altosAntes} en ${anio - 1}` : `nivel promedio ${promedio}`} />
        <Cifra valor={conPM.length} etiqueta="Con plan de mejora" nota={`${items.length ? Math.round((conPM.length / items.length) * 100) : 0}% del total`} />
        <Cifra valor={vencidos.length} etiqueta="Planes vencidos" tono={vencidos.length ? 'text-rose-700' : 'text-slate-900'} />
        <Cifra valor={dictaminados.length ? `${Math.round((eficaces.length / dictaminados.length) * 100)}%` : '—'} etiqueta="Eficacia" nota={`${eficaces.length} de ${dictaminados.length} dictaminados`} tono="text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MapaCalor tipo="Riesgo" items={riesgos} seleccion={celda?.tipo === 'Riesgo' ? celda : null} onSeleccionar={(c) => setCelda(c && { ...c, tipo: 'Riesgo' })} />
        <MapaCalor tipo="Oportunidad" items={oportunidades} seleccion={celda?.tipo === 'Oportunidad' ? celda : null} onSeleccionar={(c) => setCelda(c && { ...c, tipo: 'Oportunidad' })} />
      </div>

      {celda && (
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-extrabold text-slate-900 mb-2">{celda.tipo === 'Riesgo' ? 'Riesgos' : 'Oportunidades'} en {celda.p} × {celda.i} = {celda.p * celda.i} ({enCelda.length})</h4>
          <ul className="divide-y divide-slate-100 text-xs">
            {enCelda.map((r) => {
              const e = estadoRiesgo(r, planesMejora);
              return (
                <li key={r.id} className="py-2 flex flex-wrap gap-2 items-center justify-between">
                  <span className="min-w-0"><strong className="text-slate-900">{r.descripcion}</strong> <span className="text-slate-600">· {r.area}</span></span>
                  <span className="flex gap-2 items-center">
                    {r.pm_folio && <span className="font-mono font-bold text-sky-700">{r.pm_folio}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_RIESGO[e]?.color || ''}`}>{ESTADOS_RIESGO[e]?.label || e}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-extrabold text-slate-900 mb-3">Riesgos por dirección</h4>
        <div className="space-y-2">
          {porDireccion.map((x) => (
            <div key={x.d} className="grid grid-cols-[180px_1fr_40px] gap-3 items-center text-xs">
              <span className="font-semibold text-slate-700 truncate" title={x.d}>{x.d}</span>
              <div className="flex h-5 rounded-md overflow-hidden bg-slate-100" title={`Alto ${x.Alto} · Medio ${x.Medio} · Bajo ${x.Bajo}`}>
                {[['Alto', 'bg-rose-500'], ['Medio', 'bg-amber-400'], ['Bajo', 'bg-emerald-500']].map(([k, c]) => (
                  x[k] ? <div key={k} className={`${c} text-[10px] font-bold text-white flex items-center justify-center`} style={{ width: `${(x[k] / maxDir) * 100}%` }}>{x[k]}</div> : null
                ))}
              </div>
              <span className="text-right font-bold text-slate-700">{x.Bajo + x.Medio + x.Alto}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Rojo: alto · ámbar: medio · verde: bajo.</p>
      </section>
    </div>
  );
}
