// ═══════════════════════════════════════════════════════════════
// PorAbrirPanel — no conformidades y oportunidades de mejora DETECTADAS que aún no tienen
// apertura oficial (sin folio): hallazgos de auditoría, indicadores fuera de meta, riesgos,
// documentos y cierres no efectivos. No cuentan en el control hasta que el SGC asigna folio.
// "Avisar al responsable" abre el correo del usuario con el mensaje listo (lo envía él).
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { Eye, Mail, Inbox, CheckCircle2 } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { formatearFecha, diasDesde } from '../../constants/workflow';

const TEXTO = {
  AC: { titulo: 'acción correctiva', formato: 'OOMRSC-20', vacio: 'No hay no conformidades pendientes de apertura.' },
  PM: { titulo: 'oportunidad de mejora', formato: 'OOMRSC-21', vacio: 'No hay oportunidades de mejora pendientes de apertura.' },
};

const descripcionDe = (r) =>
  r.descripcion_no_conformidad_original || r.descripcion_situacion_actual || r.titulo_mejora || r.descripcion || '';

export default function PorAbrirPanel({ tipo, registros, onVer, setRegistros }) {
  const { areasDetalle = [], registrarMovimiento, usuarioLogueado } = useSGC();
  const t = TEXTO[tipo];

  const correoDe = (r) => {
    if (Array.isArray(r.correos_responsables) && r.correos_responsables.length) return r.correos_responsables.join(',');
    return areasDetalle.find((a) => a.nombre === r.area)?.correo || '';
  };

  const avisar = (r) => {
    const para = correoDe(r);
    const origen = r.origen_modulo || r.origen || 'SGC';
    const asunto = `Apertura requerida de ${t.titulo} (${t.formato}) — ${r.area || 'Área'}`;
    const cuerpo = [
      'Buen día,',
      '',
      `Se detectó ${tipo === 'AC' ? 'una no conformidad' : 'una oportunidad de mejora'} que requiere su apertura oficial en el Portal SGC (formato ${t.formato}).`,
      '',
      `Origen: ${origen}${r.origen_referencia ? ` (${r.origen_referencia})` : ''}`,
      `Área: ${r.area || '—'}`,
      `Descripción: ${descripcionDe(r).slice(0, 700)}`,
      '',
      `Ingrese al portal (${window.location.origin}), módulo ${tipo === 'AC' ? 'Acciones Correctivas' : 'Planes de Mejora'} → pestaña "Por abrir", complete el análisis y envíelo al SGC.`,
      '',
      'Atentamente,',
      usuarioLogueado?.nombre || 'Sistema de Gestión de Calidad',
    ].join('\n');
    window.location.href = `mailto:${encodeURIComponent(para)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

    const ahora = new Date().toISOString();
    setRegistros((prev) => prev.map((x) => (x.id === r.id
      ? { ...x, avisos_apertura: [...(x.avisos_apertura || []), { fecha: ahora, por: usuarioLogueado?.nombre || '', para }] }
      : x)));
    registrarMovimiento?.({
      modulo: tipo === 'AC' ? 'ACCIONES_CORRECTIVAS' : 'PLANES_MEJORA', accion: 'AVISO_APERTURA',
      descripcion: `Aviso de apertura de ${t.titulo} al área ${r.area || ''}`,
      detalles: `Para: ${para || 'sin correo registrado'} | Origen: ${origen}`, folio: r.origen_referencia || '',
    });
  };

  if (registros.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
        <CheckCircle2 size={28} className="text-emerald-500" />
        {t.vacio}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
        <Inbox size={14} className="shrink-0" />
        Detectadas por el sistema o por el auditor. No cuentan en el control hasta que el área las envía y el SGC les asigna folio.
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="p-3">Origen</th>
              <th className="p-3">Área</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Detectada</th>
              <th className="p-3">Aviso al área</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => {
              const dias = diasDesde(r.fecha_creacion_borrador);
              const avisos = r.avisos_apertura || [];
              const correo = correoDe(r);
              return (
                <tr key={r.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{r.origen_modulo || r.origen || 'SGC'}</div>
                    {r.origen_referencia && <div className="font-mono text-[11px] text-slate-500">{r.origen_referencia}</div>}
                  </td>
                  <td className="p-3 text-slate-700">{r.area || '—'}</td>
                  <td className="p-3 text-slate-700 max-w-md"><span className="line-clamp-3">{descripcionDe(r)}</span></td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-700">{formatearFecha(r.fecha_creacion_borrador)}</div>
                    {dias !== null && <div className={`text-[11px] font-bold ${dias > 15 ? 'text-rose-600' : 'text-slate-500'}`}>hace {dias} d</div>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {avisos.length
                      ? <span className="text-emerald-700 font-semibold">{avisos.length} aviso(s) · {formatearFecha(avisos[avisos.length - 1].fecha)}</span>
                      : <span className="text-slate-400">Sin aviso</span>}
                    {!correo && <div className="text-[11px] text-rose-600">Área sin correo registrado</div>}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 justify-center">
                      <button onClick={() => onVer(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 font-bold hover:bg-sky-100 cursor-pointer">
                        <Eye size={13} /> Ver
                      </button>
                      <button onClick={() => avisar(r)} title={correo ? `Abrir correo para ${correo}` : 'Abrir correo (sin destinatario registrado)'}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer">
                        <Mail size={13} /> Avisar al responsable
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
