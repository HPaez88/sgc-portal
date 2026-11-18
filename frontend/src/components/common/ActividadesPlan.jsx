// Actividades de un plan (Acción Correctiva OOMRSC-20 y Plan de Mejora OOMRSC-21) en bloques claramente separados:
// número grande, "Actividad N de M", campos rotulados y lo que falta marcado. El alta y la baja siguen en BarraActividades.
import React from 'react';
import CampoFecha from './CampoFecha';
import { CAMPO_TEXTO } from './estilosCampos';

const marca = (falta) => (falta ? 'border-amber-400 bg-amber-50/50' : '');

function Etiqueta({ texto, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-bold text-slate-800 mb-1">{texto} <span className="text-rose-600" aria-hidden="true">*</span></span>
      {children}
    </label>
  );
}

export default function ActividadesPlan({ actividades, setActividades, conIndicador = false, sugerenciasResponsable = [], placeholders = {} }) {
  // Copia nueva en cada cambio (no se modifica la actividad original).
  const cambiar = (i, campo, valor) => setActividades(actividades.map((a, k) => (k === i ? { ...a, [campo]: valor } : a)));
  const idLista = `responsables-${conIndicador ? 'pm' : 'ac'}`;
  return (
    <ol className="space-y-5">
      <datalist id={idLista}>{[...new Set(sugerenciasResponsable.filter(Boolean))].map((s) => <option key={s} value={s} />)}</datalist>
      {actividades.map((act, i) => (
        <li key={act.id || i} className={`rounded-xl border-2 bg-white overflow-hidden shadow-md ${i % 2 ? 'border-teal-700/50' : 'border-marca-azul-oscuro/50'}`}>
          <div className={`flex items-center gap-3 px-4 py-2.5 text-white ${i % 2 ? 'bg-teal-800' : 'bg-marca-azul-oscuro'}`}>
            <span className="w-8 h-8 shrink-0 rounded-full bg-white text-slate-900 font-black flex items-center justify-center">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wide text-white/80">Actividad {i + 1} de {actividades.length}</span>
              <span className="block text-sm font-extrabold truncate">{act.actividad?.trim() || 'Sin descripción todavía'}</span>
            </span>
          </div>
          <div className="p-4 space-y-3 bg-slate-50">
            <Etiqueta texto="Qué se va a hacer">
              <textarea rows={2} value={act.actividad || ''} onChange={(e) => cambiar(i, 'actividad', e.target.value)}
                placeholder={placeholders.actividad || 'Descripción de la actividad'} className={`${CAMPO_TEXTO} ${marca(!act.actividad?.trim())}`} />
            </Etiqueta>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_13rem] gap-3">
              <Etiqueta texto="Responsable (nombre o puesto)">
                <input list={idLista} value={act.responsable || ''} onChange={(e) => cambiar(i, 'responsable', e.target.value)}
                  placeholder="Escribe o elige de la lista" className={`${CAMPO_TEXTO} ${marca(!act.responsable?.trim())}`} />
              </Etiqueta>
              <Etiqueta texto="Fecha compromiso">
                <CampoFecha value={act.fecha_termino_sugerida || ''} onChange={(e) => cambiar(i, 'fecha_termino_sugerida', e.target.value)}
                  className={`${CAMPO_TEXTO} ${marca(!act.fecha_termino_sugerida)}`} />
              </Etiqueta>
            </div>
            {conIndicador && (
              <Etiqueta texto="Indicador de logro">
                <input value={act.indicador || ''} onChange={(e) => cambiar(i, 'indicador', e.target.value)}
                  placeholder="Cómo se sabrá que se logró" className={`${CAMPO_TEXTO} ${marca(!act.indicador?.trim())}`} />
              </Etiqueta>
            )}
            <Etiqueta texto="Evidencia esperada">
              <textarea rows={2} value={act.evidencia_esperada || ''} onChange={(e) => cambiar(i, 'evidencia_esperada', e.target.value)}
                placeholder={placeholders.evidencia || 'Documento probatorio (minuta, foto, reporte)'} className={`${CAMPO_TEXTO} ${marca(!act.evidencia_esperada?.trim())}`} />
            </Etiqueta>
          </div>
        </li>
      ))}
    </ol>
  );
}
