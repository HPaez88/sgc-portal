// Riesgos → FODA y propósito: para revisar con cada área en reunión el propósito y su FODA.
// Se guarda en la ficha del área del catálogo (lo mismo que se ve en Configuración) y la IA lo usa.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import FodaEditor from './FodaEditor';
import { useToast } from '../common/Toast';
import { normalizarFoda, fodaVacio, FODA_VACIO } from '../../constants/foda';
import { formatearFecha } from '../../constants/workflow';

function TextoAuto({ value, onChange, disabled }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.max(ref.current.scrollHeight + 2, 72)}px`;
  }, [value]);
  return <textarea ref={ref} value={value} onChange={onChange} disabled={disabled} maxLength={1200}
    className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg resize-none overflow-hidden leading-snug disabled:bg-slate-50 focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none" />;
}

export default function FodaArea({ areas, areaInicial, areasDetalle, setAreasDetalle, puedeEditar, puedeElegirArea, usuarioLogueado, registrarMovimiento }) {
  const toast = useToast();
  const [area, setArea] = useState(areaInicial || areas[0]?.nombre || '');
  const ficha = areasDetalle.find((a) => a.nombre === area) || {};
  const [borrador, setBorrador] = useState(null);
  useEffect(() => {
    setBorrador({ proposito: ficha.proposito || '', foda: { ...FODA_VACIO, ...(ficha.foda || {}) }, revisado: ficha.foda_estado === 'revisado' });
  }, [area, ficha.proposito, ficha.foda, ficha.foda_estado]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!borrador) return null;

  const guardar = () => {
    const foda = normalizarFoda(borrador.foda);
    const ahora = new Date().toISOString();
    setAreasDetalle((prev) => prev.map((a) => (a.nombre !== area ? a : {
      ...a,
      proposito: borrador.proposito.trim(),
      proposito_estado: borrador.revisado ? 'confirmado' : (a.proposito_estado || 'borrador'),
      foda, foda_estado: borrador.revisado ? 'revisado' : 'borrador',
      foda_actualizado: ahora, foda_actualizado_por: usuarioLogueado?.nombre || '',
    })));
    registrarMovimiento?.({ modulo: 'RIESGOS', accion: 'FODA_AREA', descripcion: `FODA y propósito de ${area} ${borrador.revisado ? 'revisados con el área' : 'actualizados (borrador)'}`, folio: 'FODA' });
    toast.success(`FODA y propósito de ${area} guardados en el catálogo.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Análisis FODA y propósito del área</p>
          <h3 className="text-lg font-extrabold text-slate-900">{area || 'Sin área'}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {ficha.foda_estado === 'revisado'
              ? <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 size={13} /> Revisado con el área{ficha.foda_actualizado ? ` · ${formatearFecha(ficha.foda_actualizado)}` : ''}</span>
              : <span className="inline-flex items-center gap-1 text-amber-700 font-semibold"><AlertTriangle size={13} /> Borrador: falta revisarlo con el área</span>}
          </p>
        </div>
        {puedeElegirArea && (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Área
            <select value={area} onChange={(e) => setArea(e.target.value)} className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold max-w-xs">
              {areas.map((a) => <option key={a.nombre} value={a.nombre}>{a.nombre}{a.foda_estado === 'revisado' ? ' ✓' : ''}</option>)}
            </select>
          </label>
        )}
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <h4 className="text-sm font-extrabold text-slate-900">Propósito del área</h4>
        <p className="text-[11px] text-slate-600">Para qué existe el área, qué entrega y a quién.</p>
        <TextoAuto value={borrador.proposito} disabled={!puedeEditar} onChange={(e) => setBorrador({ ...borrador, proposito: e.target.value })} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-sm font-extrabold text-slate-900">Análisis FODA</h4>
          <p className="text-[11px] text-slate-600">La IA lo toma como referencia para sugerir riesgos y oportunidades.</p>
        </div>
        {fodaVacio(ficha.foda) && !puedeEditar
          ? <p className="text-sm text-slate-500">El SGC aún no captura el FODA de esta área.</p>
          : <FodaEditor foda={borrador.foda} soloLectura={!puedeEditar} onChange={(foda) => setBorrador({ ...borrador, foda })} />}
      </section>

      {puedeEditar && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" className="mt-1" checked={borrador.revisado} onChange={(e) => setBorrador({ ...borrador, revisado: e.target.checked })} />
            <span><strong>Revisado con el área en reunión</strong><span className="block text-[11px] text-slate-600">Marca cuando el propósito y el FODA ya se acordaron con el área.</span></span>
          </label>
          <button type="button" onClick={guardar} className="px-4 py-2 text-sm font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><Save size={15} /> Guardar en el catálogo</button>
        </div>
      )}
    </div>
  );
}
