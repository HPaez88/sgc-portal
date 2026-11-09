// Fecha final del registro y su replanteo (máx. 2, contando los del Control 6).
// Solo para registros sin actividades; lo registra un administrador del SGC con justificación.
import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import {
  MAX_REPLANTEOS, esAdminSGC, esCerrado, normalizarEstado, leerActividades, formatearFecha,
  getFechaCompromiso, getVencimiento, replanteosFinales, validarReplanteoFinal, aplicarReplanteoFinal,
} from '../../constants/workflow';

export default function ReplanteoFinal({ registro, guardar, modulo, folio }) {
  const { usuarioLogueado, registrarMovimiento } = useSGC();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!registro || leerActividades(registro).length > 0) return null;
  const { lista, usados } = replanteosFinales(registro);
  const venc = getVencimiento(registro);
  const puede = esAdminSGC(usuarioLogueado) && !esCerrado(normalizarEstado(registro.estado)) && usados < MAX_REPLANTEOS;

  const confirmar = async () => {
    const e = validarReplanteoFinal(registro, fecha, motivo);
    if (e) { setError(e); return; }
    const nuevo = aplicarReplanteoFinal(registro, { nuevaFecha: fecha, motivo, por: usuarioLogueado?.nombre || 'SGC' });
    await guardar(nuevo);
    registrarMovimiento?.({
      modulo, accion: 'REPLANTEO_FECHA_FINAL',
      descripcion: `Replanteo ${usados + 1}/${MAX_REPLANTEOS} de la fecha final de ${folio || 'registro'}: ${formatearFecha(getFechaCompromiso(registro))} → ${formatearFecha(fecha)}`,
      detalles: `Justificación: ${motivo.trim()}`, folio: folio || '',
    });
    setAbierto(false); setFecha(''); setMotivo(''); setError('');
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-sky-700" />
          <div>
            <p className="text-xs font-bold text-slate-800">
              Fecha final: <span className="font-mono">{formatearFecha(getFechaCompromiso(registro))}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold border ${venc.color}`}>{venc.label}</span>
            </p>
            <p className="text-[11px] text-slate-500">Replanteos usados: {usados} de {MAX_REPLANTEOS}</p>
          </div>
        </div>
        {puede && !abierto && (
          <button type="button" onClick={() => setAbierto(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg">
            Replantear fecha final
          </button>
        )}
        {!puede && usados >= MAX_REPLANTEOS && !esCerrado(normalizarEstado(registro.estado)) && (
          <span className="text-[11px] font-semibold text-rose-700">Sin replanteos disponibles</span>
        )}
      </div>

      {lista.length > 0 && (
        <ul className="text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2">
          {lista.map((r, i) => (
            <li key={i}>
              <strong>Replanteo {i + 1}</strong> → {formatearFecha(r.fecha)}
              {r.origen === 'Control 6' ? ' (Control 6)' : ` · ${r.registrado_por || ''}: ${r.justificacion || ''}`}
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 border-t border-slate-100 pt-3">
          <label className="text-xs font-bold text-slate-700">Nueva fecha final
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="mt-1 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </label>
          <label className="text-xs font-bold text-slate-700">Justificación
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} maxLength={1000}
              placeholder="Motivo del replanteo (queda en la bitácora)"
              className="mt-1 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </label>
          {error && <p className="sm:col-span-2 text-xs font-semibold text-rose-700">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => { setAbierto(false); setError(''); }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="button" onClick={confirmar}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg">
              Guardar replanteo {usados + 1}/{MAX_REPLANTEOS}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
