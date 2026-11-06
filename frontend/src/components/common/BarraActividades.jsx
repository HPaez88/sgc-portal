import React from 'react';
import { calcularFechaFinal, formatearFecha, DIAS_HOLGURA_CIERRE } from '../../constants/workflow';

// Agregar / quitar actividades a mano (AC y PM) y mostrar la fecha final que resulta de ellas.
export default function BarraActividades({ actividades, setActividades }) {
  const ultima = actividades[actividades.length - 1];
  const final = calcularFechaFinal(actividades);

  const agregar = () => setActividades([...actividades, {
    id: Date.now(), actividad: '', responsable: '', indicador: '', indicador_progreso: '',
    fecha_termino_sugerida: '', evidencia_esperada: '', evidencia_cargada: '', estatus: 'PENDIENTE',
  }]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={agregar}
          className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-lg border border-sky-200/80 transition-colors"
        >
          + Agregar actividad
        </button>
        {ultima && !ultima.evidencia_real && (
          <button
            type="button"
            onClick={() => setActividades(actividades.slice(0, -1))}
            className="text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            Quitar la última
          </button>
        )}
      </div>
      <p className="text-xs text-slate-600">
        Fecha final de cierre:{' '}
        <strong className="font-mono text-slate-900">{final ? formatearFecha(final) : 'captura las fechas de las actividades'}</strong>
        <span className="text-slate-500"> · actividad más tardía + {DIAS_HOLGURA_CIERRE / 7} semanas, en día hábil</span>
      </p>
    </div>
  );
}
