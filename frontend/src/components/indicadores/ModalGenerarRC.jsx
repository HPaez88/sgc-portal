import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  X,
  Save,
  FileWarning,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Activity
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';

export default function ModalGenerarRC({
  isOpen,
  onClose,
  indicador = null,
  valorReal = null,
  semaforo = null,
  mes = 'Oct',
  ejercicio = 2026,
  usuarioLogueado = null,
  onConfirmarRC
}) {
  const toast = useToast();

  const [folio, setFolio] = useState('');
  const [responsable, setResponsable] = useState('');
  const [descripcionDesviacion, setDescripcionDesviacion] = useState('');
  const [causaInmediata, setCausaInmediata] = useState('');
  const [accionCorreccion, setAccionCorreccion] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (indicador) {
      const folioGen = `RC ${indicador.numero !== undefined ? indicador.numero : indicador.id}/${ejercicio}`;
      setFolio(folioGen);
      setResponsable(indicador.area || usuarioLogueado?.nombre || 'Responsable de Área');
      setDescripcionDesviacion(
        `Desviación en Indicador #${indicador.numero} - ${indicador.nombre}. Meta requerida: ${indicador.meta_anual || indicador.meta} ${indicador.unidad}. Resultado obtenido en ${mes} ${ejercicio}: ${valorReal ?? '0'} ${indicador.unidad} (${semaforo?.porcentaje ?? 0}% de cumplimiento).`
      );
      setCausaInmediata('Variación operativa en el período.');
      setAccionCorreccion('Implementar corrección inmediata y monitoreo reforzado en el siguiente corte.');
    }
  }, [indicador, valorReal, semaforo, mes, ejercicio, usuarioLogueado, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!indicador) return;

    const payload = {
      id: Date.now(),
      indicadorId: indicador.id,
      numeroIndicador: indicador.numero,
      folio,
      ejercicio: String(ejercicio),
      mes,
      responsable,
      area: indicador.area,
      proceso: indicador.proceso,
      descripcion: descripcionDesviacion,
      causa: causaInmediata,
      accion: accionCorreccion,
      fechaCompromiso,
      fechaRegistro: new Date().toISOString().split('T')[0],
      estado: 'ABIERTA'
    };

    onConfirmarRC(payload);
    toast.exito(`Reporte de Corrección ${folio} registrado correctamente en el Cuadro de Control.`);
    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="3xl" anchoMaximo="max-w-[85vw] xl:max-w-[1150px]">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] w-full">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#B45309] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <AlertOctagon size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Emitir Reporte de Corrección (RC)
              </h3>
              <p className="text-xs text-amber-200/80 font-medium">
                Seguimiento institucional a desviación en indicador de Bajo Impacto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Banner explicativo */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>📌 Indicador #{indicador?.numero}: <strong>{indicador?.nombre}</strong></span>
              <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono text-[10.5px]">
                Impacto Bajo
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Al tratarse de un indicador de bajo impacto, se formaliza este <strong>Reporte de Corrección (RC)</strong> para documentar la causa y corrección operativa sin requerir una auditoría formal de AC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Folio Oficial del RC:
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Área Responsable:
              </label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción de la Desviación:
            </label>
            <textarea
              rows={2}
              value={descripcionDesviacion}
              onChange={(e) => setDescripcionDesviacion(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Causa Inmediata Identificada:
            </label>
            <input
              type="text"
              value={causaInmediata}
              onChange={(e) => setCausaInmediata(e.target.value)}
              placeholder="Ej. Retraso en entrega de insumos, falla puntual de equipo..."
              required
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Acción de Corrección Operativa a Ejecutar:
            </label>
            <textarea
              rows={2}
              value={accionCorreccion}
              onChange={(e) => setAccionCorreccion(e.target.value)}
              placeholder="Describa la acción inmediata para subsanar la desviación..."
              required
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha Límite de Corrección:
              </label>
              <input
                type="date"
                value={fechaCompromiso}
                onChange={(e) => setFechaCompromiso(e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              OOMRSC-05 / Bitácora RC
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#B45309] hover:bg-[#92400E] text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>Registrar Reporte (RC)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}
