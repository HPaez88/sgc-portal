// Avisos automáticos (administradores): lo que generó la tarea diaria — recordatorios, avisos de incumplimiento
// y oficios de exhorto por emitir. En simulación nada sale a los responsables.
import React, { useEffect, useState } from 'react';
import { BellRing, RefreshCw } from 'lucide-react';
import { api } from '../../services/apiClient';
import { formatearFecha } from '../../constants/workflow';

const ETAPAS = {
  RECORDATORIO_15: 'Recordatorio (15 días)', RECORDATORIO_10: 'Recordatorio (10 días)', RECORDATORIO_5: 'Recordatorio (5 días)', VENCE_HOY: 'Vence hoy',
  AVISO_INCUMPLIMIENTO: 'Aviso de incumplimiento', OFICIO_EXHORTO: 'Oficio de exhorto por emitir',
  AVISO: 'Aviso de entrega (día 1)', RECORDATORIO: 'Recordatorio (día 5)', ULTIMO_RECORDATORIO: 'Vence la entrega (día 10)',
};
const FILTROS = [['', 'Todos'], ['OFICIO_EXHORTO', 'Oficios por emitir'], ['AVISO_INCUMPLIMIENTO', 'Incumplimientos'], ['AC', 'Acciones'], ['INDICADORES', 'Indicadores']];

export default function AvisosAutomaticos() {
  const [datos, setDatos] = useState(null);
  const [filtro, setFiltro] = useState('');
  const cargar = async () => { const r = await api.get('/api/v1/notificaciones/avisos-automaticos'); if (r.ok) setDatos(r.data); };
  useEffect(() => { cargar(); }, []);
  const avisos = (datos?.avisos || []).filter((a) => !filtro || a.etapa === filtro || a.tipo === filtro);
  const cuenta = (id) => (datos?.avisos || []).filter((a) => !id || a.etapa === id || a.tipo === id).length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><BellRing size={18} className="text-marca-azul-oscuro" /> Avisos automáticos</h3>
          <p className="text-xs text-slate-600">
            Lunes a viernes a las 8:00 a.m. · Modo: <strong>{datos?.modo === 'activo' ? 'activo (se envían)' : datos?.modo === 'apagado' ? 'apagado' : 'simulación (no se envía a los responsables)'}</strong>
            {datos?.arranque ? ` · cuenta desde ${formatearFecha(datos.arranque)}` : ''}
          </p>
        </div>
        <button type="button" onClick={cargar} className="px-3 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RefreshCw size={14} /> Actualizar</button>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map(([id, t]) => (
          <button key={t} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 ${filtro === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200'}`}>
            {t}<span className="text-[10px] font-extrabold opacity-80">{cuenta(id)}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs">
          <caption className="sr-only">Avisos automáticos generados</caption>
          <thead className="text-left"><tr><th scope="col" className="p-2">Fecha</th><th scope="col" className="p-2">Etapa</th><th scope="col" className="p-2">Registro / unidad</th><th scope="col" className="p-2">Para</th><th scope="col" className="p-2">Resultado</th></tr></thead>
          <tbody>
            {datos && !avisos.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Aún no hay avisos generados.</td></tr>}
            {avisos.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="p-2 whitespace-nowrap">{formatearFecha(a.fecha)}</td>
                <td className="p-2 font-semibold">{ETAPAS[a.etapa] || a.etapa}</td>
                <td className="p-2"><strong>{a.registro}</strong><span className="block text-[11px] text-slate-500">{a.tipo === 'AC' ? `vence ${formatearFecha(a.referencia)}` : `periodo ${a.referencia}`}</span></td>
                <td className="p-2 text-slate-600 max-w-xs">{a.destinatarios || '—'}</td>
                <td className="p-2">{a.enviado ? <span className="text-emerald-700 font-bold">Enviado</span> : <span className={a.error ? 'text-amber-800' : 'text-slate-600'}>{a.error || (a.modo === 'simulacion' ? 'Simulado' : 'No enviado')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
