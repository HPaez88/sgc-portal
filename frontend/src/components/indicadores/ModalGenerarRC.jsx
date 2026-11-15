// Alta de un Reporte de Corrección desde el Cuadro de Control: indicador de impacto Bajo con resultado crítico.
// El folio lo asigna el portal (consecutivo del año) y se liga al indicador, mes y ejercicio del resultado.
import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, Save } from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import CampoFecha from '../common/CampoFecha';
import { siguienteHabil } from '../../constants/fechasHabiles';
import { folioRC, hoyISO, enDiasISO } from '../../constants/reportesCorreccion';

const MESES_LARGOS = { Ene: 'enero', Feb: 'febrero', Mar: 'marzo', Abr: 'abril', May: 'mayo', Jun: 'junio', Jul: 'julio', Ago: 'agosto', Sep: 'septiembre', Oct: 'octubre', Nov: 'noviembre', Dic: 'diciembre' };
const CAMPO = 'w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none text-slate-900';

export default function ModalGenerarRC({ isOpen, onClose, indicador = null, valorReal = null, semaforo = null, mes = 'Oct', ejercicio = 2026, reportes = [], onConfirmarRC }) {
  const toast = useToast();
  const [responsable, setResponsable] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [causa, setCausa] = useState('');
  const [accion, setAccion] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState(() => siguienteHabil(enDiasISO(15)));
  const folio = folioRC(reportes, new Date().getFullYear());

  useEffect(() => {
    if (!indicador || !isOpen) return;
    setResponsable('');
    // Descripción con los datos del resultado; el usuario la puede ajustar. Causa y corrección las escribe el área.
    setDescripcion(`El indicador #${indicador.numero ?? indicador.id} "${indicador.nombre}" obtuvo ${valorReal ?? '0'} ${indicador.unidad || ''} en ${MESES_LARGOS[mes] || mes} ${ejercicio}, contra una meta de ${indicador.meta_anual ?? indicador.meta} ${indicador.unidad || ''} (${semaforo?.porcentaje ?? 0}% de cumplimiento).`);
    setCausa('');
    setAccion('');
  }, [indicador?.id, mes, ejercicio, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- solo al abrir

  if (!isOpen || !indicador) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!causa.trim() || !accion.trim()) return toast.warning('Escribe la causa inmediata y la corrección que se aplicará.');
    onConfirmarRC({
      id: Date.now(), folio, indicadorId: indicador.id, numeroIndicador: indicador.numero ?? indicador.id,
      ejercicio: String(ejercicio), mes, area: indicador.area, proceso: indicador.proceso,
      responsable: responsable.trim(), descripcion: descripcion.trim(), causa: causa.trim(), accion: accion.trim(),
      valorReal: valorReal ?? null, porcentaje: semaforo?.porcentaje ?? null,
      fechaCompromiso: siguienteHabil(fechaCompromiso), fechaRegistro: hoyISO(), estado: 'EN_ATENCION',
    });
    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="3xl" anchoMaximo="max-w-[85vw] xl:max-w-[1000px]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] w-full">
        <div className="px-5 py-4 bg-marca-azul-oscuro text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon size={22} className="text-amber-300" />
            <div>
              <h3 className="text-base font-extrabold">Reporte de Corrección (RC)</h3>
              <p className="text-xs text-sky-100">Indicador de impacto Bajo con resultado crítico. Folio <strong className="font-mono">{folio}</strong></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10" aria-label="Cerrar"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-marca-azul-oscuro border-b border-slate-200 pb-1 mb-2">1. Resultado que origina el reporte</h4>
            <table className="w-full text-sm tablas-marcadas bg-white">
              <thead><tr><th scope="col" className="p-2 text-left">Indicador</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Periodo</th><th scope="col" className="p-2 text-left">Meta</th><th scope="col" className="p-2 text-left">Resultado</th><th scope="col" className="p-2 text-left">Cumplimiento</th></tr></thead>
              <tbody><tr>
                <td className="p-2">#{indicador.numero ?? indicador.id} {indicador.nombre}</td><td className="p-2">{indicador.area}</td>
                <td className="p-2 whitespace-nowrap">{MESES_LARGOS[mes] || mes} {ejercicio}</td><td className="p-2 whitespace-nowrap">{indicador.meta_anual ?? indicador.meta} {indicador.unidad}</td>
                <td className="p-2 whitespace-nowrap font-bold text-rose-700">{valorReal ?? '—'} {indicador.unidad}</td><td className="p-2 font-bold text-rose-700">{semaforo?.porcentaje ?? 0}%</td>
              </tr></tbody>
            </table>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-marca-azul-oscuro border-b border-slate-200 pb-1">2. Corrección del área</h4>
            <label className="block text-xs font-bold text-slate-800">Descripción de la desviación
              <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required className={`${CAMPO} mt-1`} />
            </label>
            <label className="block text-xs font-bold text-slate-800">Causa inmediata identificada *
              <input value={causa} onChange={(e) => setCausa(e.target.value)} required placeholder="Qué provocó la desviación en este periodo" className={`${CAMPO} mt-1`} />
            </label>
            <label className="block text-xs font-bold text-slate-800">Corrección que se aplicará *
              <textarea rows={2} value={accion} onChange={(e) => setAccion(e.target.value)} required placeholder="Acción inmediata para subsanar la desviación" className={`${CAMPO} mt-1`} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-bold text-slate-800">Responsable de la corrección
                <input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre de quien la ejecuta" className={`${CAMPO} mt-1`} />
              </label>
              <label className="block text-xs font-bold text-slate-800">Fecha límite de corrección *
                <CampoFecha value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} required className={`${CAMPO} mt-1`} />
              </label>
            </div>
          </section>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-marca-azul-oscuro hover:bg-marca-azul text-white rounded-lg shadow-sm inline-flex items-center gap-2"><Save size={14} /> Registrar reporte {folio}</button>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}
