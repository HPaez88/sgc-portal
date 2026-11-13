// Reporte de Corrección capturado a mano: por indicador, auditoría, proceso o producto no conforme (§ 8.7)
// u otra detección que se quiera documentar, con o sin relación. Folio consecutivo del año (RC#n/año).
import React, { useMemo, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import CampoFecha from '../common/CampoFecha';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import { INDICADORES } from '../../constants/indicadores';
import { unidadesDeRiesgo } from '../../constants/unidades';
import { siguienteHabil } from '../../constants/fechasHabiles';

export const ORIGENES_RC = ['Indicador', 'Auditoría interna', 'Auditoría externa', 'Proceso o producto no conforme (§ 8.7)', 'Otra detección'];

// Consecutivo de los RC manuales del año: RC#1/2026, RC#2/2026…
export const folioRC = (reportes, anio) => {
  const nums = reportes.map((r) => String(r.folio || '').match(new RegExp(`^RC#(\\d+)/${anio}$`))?.[1]).filter(Boolean).map(Number);
  return `RC#${(nums.length ? Math.max(...nums) : 0) + 1}/${anio}`;
};

const campo = 'mt-1 w-full p-2 text-sm bg-white border rounded-lg font-normal';

export default function ModalNuevoRC({ reportes = [], onGuardar, onClose }) {
  const { areasDetalle = [], direccionesDetalle = [], procesos = [], usuarioLogueado, registrarMovimiento } = useSGC();
  const toast = useToast();
  const unidades = useMemo(() => unidadesDeRiesgo(areasDetalle, direccionesDetalle), [areasDetalle, direccionesDetalle]);
  const anio = new Date().getFullYear();
  const [d, setD] = useState({ origen: 'Otra detección', referencia: '', indicadorId: '', area: '', proceso: '', responsable: '', descripcion: '', causa: '', accion: '', fechaCompromiso: '' });
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const indicador = INDICADORES.find((i) => String(i.id) === String(d.indicadorId));

  const guardar = () => {
    const falta = !d.area ? 'el área' : d.descripcion.trim().length < 10 ? 'la descripción' : !d.accion.trim() ? 'la corrección' : !d.fechaCompromiso ? 'la fecha compromiso' : '';
    if (falta) return toast.warning(`Falta ${falta}.`);
    const folio = folioRC(reportes, anio);
    const rc = {
      id: Date.now(), folio, ejercicio: String(anio), estado: 'ABIERTA', manual: true,
      origen: d.origen, origen_referencia: d.origen === 'Indicador' ? (indicador ? `#${indicador.id} ${indicador.nombre}` : '') : d.referencia.trim(),
      ...(indicador ? { indicadorId: indicador.id, numeroIndicador: indicador.numero ?? indicador.id } : {}),
      area: d.area, proceso: d.proceso, responsable: d.responsable.trim() || d.area,
      descripcion: d.descripcion.trim(), causa: d.causa.trim(), accion: d.accion.trim(),
      fechaCompromiso: siguienteHabil(d.fechaCompromiso), fechaRegistro: new Date().toISOString().split('T')[0],
      creadoPor: usuarioLogueado?.nombre || '',
    };
    onGuardar(rc);
    registrarMovimiento?.({ modulo: 'ACCIONES', accion: 'ALTA_REPORTE_CORRECCION', descripcion: `Reporte de corrección ${folio} (${d.origen}) para ${d.area}`, detalles: rc.descripcion, folio });
    toast.success(`Reporte de corrección ${folio} registrado.`);
    onClose();
  };

  return (
    <ContenedorModal isOpen onClose={onClose} titulo="Nuevo reporte de corrección" anchoMaximo="max-w-3xl">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs font-bold text-slate-800">Origen *
            <select value={d.origen} onChange={(e) => set({ origen: e.target.value, referencia: '', indicadorId: '' })} className={campo}>
              {ORIGENES_RC.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          {d.origen === 'Indicador' ? (
            <label className="block text-xs font-bold text-slate-800">Indicador (opcional)
              <select value={d.indicadorId} onChange={(e) => {
                const ind = INDICADORES.find((i) => String(i.id) === e.target.value);
                set({ indicadorId: e.target.value, ...(ind && !d.area ? { area: ind.area } : {}) });
              }} className={campo}>
                <option value="">— Sin indicador —</option>
                {INDICADORES.map((i) => <option key={i.id} value={i.id}>#{i.id} {i.nombre}</option>)}
              </select>
            </label>
          ) : (
            <label className="block text-xs font-bold text-slate-800">Referencia (opcional)
              <input value={d.referencia} onChange={(e) => set({ referencia: e.target.value })} className={campo}
                placeholder={d.origen.startsWith('Auditoría') ? 'Ej. Auditoría #9 o número de hallazgo' : d.origen.startsWith('Proceso') ? 'Producto, lote, orden o servicio afectado' : 'Dónde o cómo se detectó'} />
            </label>
          )}
          <label className="block text-xs font-bold text-slate-800">Área responsable *
            <select value={d.area} onChange={(e) => set({ area: e.target.value })} className={campo}>
              <option value="">— Seleccionar —</option>
              {unidades.map((u) => <option key={u.nombre} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-800">Proceso del SGC
            <select value={d.proceso} onChange={(e) => set({ proceso: e.target.value })} className={campo}>
              <option value="">— Seleccionar —</option>
              {procesos.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-800">Responsable
            <input value={d.responsable} onChange={(e) => set({ responsable: e.target.value })} className={campo} placeholder="Nombre o puesto" />
          </label>
          <label className="block text-xs font-bold text-slate-800">Fecha compromiso *
            <CampoFecha value={d.fechaCompromiso} onChange={(e) => set({ fechaCompromiso: e.target.value })} className={campo} />
          </label>
        </div>
        <label className="block text-xs font-bold text-slate-800">Qué se detectó *
          <textarea rows={3} value={d.descripcion} onChange={(e) => set({ descripcion: e.target.value })} className={campo} />
        </label>
        <label className="block text-xs font-bold text-slate-800">Causa inmediata
          <textarea rows={2} value={d.causa} onChange={(e) => set({ causa: e.target.value })} className={campo} />
        </label>
        <label className="block text-xs font-bold text-slate-800">Corrección (qué se hará para corregirlo) *
          <textarea rows={2} value={d.accion} onChange={(e) => set({ accion: e.target.value })} className={campo} />
        </label>
        <p className="text-[11px] text-slate-600">Folio que se asignará: <strong>{folioRC(reportes, anio)}</strong>. Si la fecha cae en fin de semana se recorre al lunes.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="button" onClick={guardar} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg inline-flex items-center gap-1.5"><FilePlus2 size={14} /> Registrar reporte</button>
        </div>
      </div>
    </ContenedorModal>
  );
}
