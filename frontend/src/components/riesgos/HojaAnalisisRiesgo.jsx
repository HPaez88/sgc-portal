// Hoja "Análisis del riesgo / oportunidad" (formato de identificación OOMRSC-37), solo lectura.
// Se muestra dentro del Plan de Mejora que nació de la matriz, para tener a la mano cómo se identificó.
import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { CLAVE_MATRIZ, ESCALAS, nivelDe, puntaje } from '../../constants/riesgos';
import { formatearFecha } from '../../constants/workflow';

function Fila({ etiqueta, children }) {
  return (
    <tr className="align-top">
      <th scope="row" className="w-56 p-3 text-left text-xs font-bold text-slate-700 bg-slate-50 border-b border-slate-200">{etiqueta}</th>
      <td className="p-3 text-sm text-slate-900 border-b border-slate-200 whitespace-pre-wrap">{children || <span className="text-slate-400">—</span>}</td>
    </tr>
  );
}

function Bloque({ titulo, children }) {
  return (
    <section className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <h4 className="px-4 py-2.5 text-sm font-extrabold text-slate-900 bg-slate-50 border-b border-slate-200 border-l-4 border-l-marca-azul-oscuro">{titulo}</h4>
      <table className="w-full"><tbody>{children}</tbody></table>
    </section>
  );
}

export default function HojaAnalisisRiesgo({ riesgo: r }) {
  if (!r) {
    return <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4">No se encontró el registro de la matriz que originó este plan (pudo haberse quitado de la matriz).</p>;
  }
  const esc = ESCALAS[r.tipo] || ESCALAS.Riesgo;
  const nivel = nivelDe(r);
  const nombreEscala = (lista, v) => lista.find(([n]) => n === Number(v))?.[1] || '';
  const esRiesgo = r.tipo === 'Riesgo';

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{CLAVE_MATRIZ} · Matriz {r.anio} · formato de identificación</p>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><ShieldAlert size={18} className={esRiesgo ? 'text-rose-600' : 'text-emerald-600'} /> {r.tipo}: {r.descripcion}</h3>
          <p className="text-xs text-slate-600">{[r.area, r.direccion].filter(Boolean).join(' · ')}{r.sugerido_ia && <span className="ml-2 inline-flex items-center gap-1 text-violet-700"><Sparkles size={12} /> propuesto con IA y revisado por el área</span>}</p>
        </div>
        <div className={`rounded-xl border px-4 py-2 text-center ${nivel ? nivel.suave : 'bg-white border-slate-200'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider">Nivel</p>
          <p className="text-2xl font-black">{puntaje(r) || '—'}</p>
          <p className="text-xs font-bold">{nivel?.nivel || ''}</p>
        </div>
      </header>

      <Bloque titulo="1. Identificación">
        <Fila etiqueta="Contexto (de dónde se identificó)">{r.contexto}</Fila>
        <Fila etiqueta="Resultado del análisis">{r.contexto_resultado}</Fila>
        <Fila etiqueta="Proceso del SGC">{r.proceso}</Fila>
      </Bloque>

      <Bloque titulo={`2. Descripción ${esRiesgo ? 'del riesgo' : 'de la oportunidad'}`}>
        <Fila etiqueta={esRiesgo ? 'Riesgo identificado' : 'Oportunidad identificada'}>{r.descripcion}</Fila>
        <Fila etiqueta={esRiesgo ? 'Causa / origen' : 'Qué la origina'}>{r.causa}</Fila>
        <Fila etiqueta={esRiesgo ? 'Consecuencia si ocurre' : 'Beneficio esperado'}>{r.consecuencia}</Fila>
        <Fila etiqueta={esRiesgo ? 'Controles que ya existen' : 'Recursos con los que se cuenta'}>{r.controles}</Fila>
      </Bloque>

      <Bloque titulo="3. Evaluación">
        <Fila etiqueta={esc.ejeY}>{r.probabilidad ? `${r.probabilidad} · ${nombreEscala(esc.probabilidad, r.probabilidad)}` : ''}</Fila>
        <Fila etiqueta={esc.ejeX}>{r.impacto ? `${r.impacto} · ${nombreEscala(esc.impacto, r.impacto)}` : ''}</Fila>
        <Fila etiqueta="Nivel">{nivel ? `${puntaje(r)} · ${nivel.nivel} — ${nivel.importancia[r.tipo]}` : ''}</Fila>
        <Fila etiqueta="Tratamiento">{r.tratamiento}</Fila>
      </Bloque>

      {(r.plan || []).length > 0 && (
        <section className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <h4 className="px-4 py-2.5 text-sm font-extrabold text-slate-900 bg-slate-50 border-b border-slate-200 border-l-4 border-l-marca-azul-oscuro">4. Plan de acción aprobado en la matriz</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700 text-left text-[11px] uppercase tracking-wider">
                <tr><th scope="col" className="p-2 w-8">#</th><th scope="col" className="p-2">Actividad</th><th scope="col" className="p-2">Responsable</th><th scope="col" className="p-2">Fecha de término</th><th scope="col" className="p-2">Evidencia esperada</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.plan.map((a, i) => (
                  <tr key={i} className="align-top"><td className="p-2 text-xs font-bold text-slate-500">{i + 1}</td><td className="p-2">{a.actividad}</td><td className="p-2">{a.responsable}</td><td className="p-2 whitespace-nowrap">{formatearFecha(a.fecha_termino_sugerida)}</td><td className="p-2">{a.evidencia_esperada || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(r.dictamen || (r.historial_pm || []).length > 0) && (
        <Bloque titulo="5. Eficacia">
          {r.dictamen && <Fila etiqueta="Dictamen del SGC">{`${r.dictamen.resultado === 'EFICAZ' ? 'Eficaz' : 'No eficaz'} · ${formatearFecha(r.dictamen.fecha)} · ${r.dictamen.por}${r.residual ? ` · nivel ${puntaje(r)} → ${puntaje(r.residual)}` : ''}\n${r.dictamen.nota || ''}`}</Fila>}
          {(r.historial_pm || []).length > 0 && <Fila etiqueta="Planes anteriores">{r.historial_pm.map((h) => `${h.pm_folio || 'PM'} · ${h.dictamen?.resultado === 'EFICAZ' ? 'eficaz' : 'no eficaz'} (${formatearFecha(h.fecha)})`).join('\n')}</Fila>}
        </Bloque>
      )}
    </div>
  );
}
