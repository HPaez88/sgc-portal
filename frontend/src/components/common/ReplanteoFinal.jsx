// Fecha de seguimiento del SGC (la "fecha grande"): se fija al aprobar y no se mueve aunque el responsable
// cambie sus actividades. Al vencer, el SGC pide replantear actividades y registra el replanteo de la fecha
// final (máx. 2, contando los del Control 6). Agotados y vencida → dictamen no eficaz.
import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import ModalCorreo from './ModalCorreo';
import { useSGC } from '../../SGCContext';
import {
  MAX_REPLANTEOS, esAdminSGC, esCerrado, normalizarEstado, leerActividades, formatearFecha,
  getFechaCompromiso, getVencimiento, replanteosFinales, validarReplanteoFinal, aplicarReplanteoFinal,
  calcularFechaFinal, fechaISO, correosDe, ajustarFechaSeguimiento, parseFecha,
} from '../../constants/workflow';

export default function ReplanteoFinal({ registro, guardar, modulo, folio, onNoEficaz }) {
  const { usuarioLogueado, registrarMovimiento } = useSGC();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const [modo, setModo] = useState('replanteo'); // 'replanteo' | 'ajuste'

  // Solo registros ya aprobados (con fecha de seguimiento); en borrador la fecha aún se está armando.
  if (!registro || !(registro.fecha_aprobacion_sgc || registro.folio_numero)) return null;
  const actividades = leerActividades(registro);
  const sugerida = fechaISO(calcularFechaFinal(actividades)); // actividad más tardía + 2 semanas
  const { lista, usados } = replanteosFinales(registro);
  const venc = getVencimiento(registro);
  const puede = esAdminSGC(usuarioLogueado) && !esCerrado(normalizarEstado(registro.estado)) && usados < MAX_REPLANTEOS;

  const confirmarAjuste = async () => {
    const f = parseFecha(fecha);
    if (!f) { setError('Indica la nueva fecha.'); return; }
    if (f.getDay() === 0 || f.getDay() === 6) { setError('La fecha debe caer en día hábil (lunes a viernes).'); return; }
    await guardar(ajustarFechaSeguimiento(registro, { nuevaFecha: fecha, nota: motivo, por: usuarioLogueado?.nombre || 'SGC' }));
    registrarMovimiento?.({
      modulo, accion: 'AJUSTE_FECHA_SEGUIMIENTO',
      descripcion: `Ajuste administrativo de la fecha de ${folio || 'registro'}: ${formatearFecha(getFechaCompromiso(registro))} → ${formatearFecha(fecha)} (no cuenta como replanteo)`,
      detalles: motivo.trim() ? `Nota: ${motivo.trim()}` : '', folio: folio || '',
    });
    setAbierto(false); setFecha(''); setMotivo(''); setError('');
  };

  const confirmar = async () => {
    if (modo === 'ajuste') { await confirmarAjuste(); return; }
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
            <p className="text-[11px] text-slate-500">
              Seguimiento del SGC · replanteos usados: {usados} de {MAX_REPLANTEOS}
              {sugerida && <> · por actividades hoy daría <span className="font-mono">{formatearFecha(sugerida)}</span></>}
            </p>
          </div>
        </div>
        {puede && !abierto && (
          <button type="button" onClick={() => {
            const actual = getFechaCompromiso(registro);
            setFecha(sugerida && actual && sugerida > fechaISO(actual) ? sugerida : '');
            setModo('replanteo');
            setAbierto(true);
          }}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg">
            Replantear fecha final
          </button>
        )}
        {esAdminSGC(usuarioLogueado) && !esCerrado(normalizarEstado(registro.estado)) && !abierto && (
          <button type="button" onClick={() => { setFecha(fechaISO(getFechaCompromiso(registro)) || ''); setModo('ajuste'); setAbierto(true); }}
            title="Mover la fecha sin contar como replanteo (mientras se carga la información)"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg">
            Ajustar fecha
          </button>
        )}
        {puede && venc.nivel === 'vencido' && actividades.length > 0 && (
          <button type="button" onClick={() => setCorreoAbierto(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-sky-800 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg">
            Solicitar replanteo de actividades
          </button>
        )}
        {usados >= MAX_REPLANTEOS && !esCerrado(normalizarEstado(registro.estado)) && (
          venc.nivel === 'vencido' && esAdminSGC(usuarioLogueado) && onNoEficaz ? (
            <button type="button" onClick={onNoEficaz}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg">
              Dictaminar no eficaz y rehacer
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-rose-700">Sin replanteos: si vence, el SGC la dictamina no eficaz</span>
          )
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
          <label className="text-xs font-bold text-slate-700">{modo === 'ajuste' ? 'Nota (opcional)' : 'Justificación'}
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
              {modo === 'ajuste' ? 'Guardar fecha' : `Guardar replanteo ${usados + 1}/${MAX_REPLANTEOS}`}
            </button>
          </div>
        </div>
      )}
      <ModalCorreo
        abierto={correoAbierto}
        onClose={() => setCorreoAbierto(false)}
        folio={folio}
        inicial={{
          para: correosDe(registro).join(', '),
          asunto: `${folio || 'Registro'}: replanteo de actividades`,
          mensaje: `Buen día,

La fecha de seguimiento de ${folio || 'este registro'} (${formatearFecha(getFechaCompromiso(registro))}) venció sin concluirse. Le solicitamos replantear las fechas de las actividades pendientes en el Portal SGC, con su justificación, para registrar el replanteo ${usados + 1} de ${MAX_REPLANTEOS}.

`,
        }}
      />
    </div>
  );
}
