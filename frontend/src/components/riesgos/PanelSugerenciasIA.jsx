// Sugerencias de la IA para la matriz del área: usa el propósito del área, sus procesos, sus indicadores,
// sus no conformidades recientes y lo del año anterior. El área elige qué agregar; nada se agrega solo.
import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { api } from '../../services/apiClient';
import { useToast } from '../common/Toast';
import { INDICADORES } from '../../constants/indicadores';
import { nivelDe, puntaje, nuevoRiesgo } from '../../constants/riesgos';
import { promptSugerencias, normalizarSugerencias } from '../../constants/riesgosIA';

const CONTEXTO_IA = 'Eres asesor experto en ISO 9001:2015 del Sistema de Gestión de Calidad de OOMAPAS de Cajeme. Responde únicamente con JSON válido.';

export default function PanelSugerenciasIA({ area, direccion, anio, riesgos, setRiesgos, procesos, usuarioLogueado, registrarMovimiento }) {
  const { areasDetalle = [], accionesCorrectivas = [] } = useSGC();
  const toast = useToast();
  const [estado, setEstado] = useState('inicio'); // inicio | cargando | listo
  const [sugerencias, setSugerencias] = useState([]);
  const [elegidas, setElegidas] = useState(new Set());

  const pedir = async () => {
    setEstado('cargando');
    const ficha = areasDetalle.find((a) => a.nombre === area) || {};
    const existentes = riesgos.filter((r) => r.area === area && Number(r.anio) === Number(anio));
    const prompt = promptSugerencias({
      area, direccion, anio, procesos,
      proposito: ficha.proposito,
      indicadores: INDICADORES.filter((i) => i.area === area),
      noConformidades: accionesCorrectivas
        .filter((ac) => ac.area === area)
        .slice(-8)
        .map((ac) => ac.descripcion_no_conformidad_final || ac.descripcion_no_conformidad_original)
        .filter(Boolean),
      anteriores: riesgos.filter((r) => r.area === area && Number(r.anio) === Number(anio) - 1),
      existentes,
    });
    const r = await api.post('/api/v1/ai/generar-json', { prompt, context: CONTEXTO_IA }, { timeoutMs: 90000 });
    const lista = r.ok ? normalizarSugerencias(r.data, { procesos, existentes }) : [];
    if (!lista.length) {
      setEstado('inicio');
      toast.error(r.ok ? 'La IA no devolvió sugerencias útiles. Intenta de nuevo.' : 'El servicio de IA no respondió. Intenta más tarde.');
      return;
    }
    setSugerencias(lista);
    setElegidas(new Set());
    setEstado('listo');
  };

  const alternar = (i) => setElegidas((prev) => {
    const s = new Set(prev);
    if (s.has(i)) s.delete(i); else s.add(i);
    return s;
  });

  const agregar = () => {
    const nuevos = [...elegidas].map((i) => ({ // id único lo pone nuevoRiesgo
      ...nuevoRiesgo({ tipo: sugerencias[i].tipo, area, direccion, anio, por: usuarioLogueado?.nombre }),
      ...sugerencias[i],
      riesgo: sugerencias[i].descripcion,
      sugerido_ia: true,
    }));
    setRiesgos((prev) => [...prev, ...nuevos]);
    registrarMovimiento?.({
      modulo: 'RIESGOS', accion: 'SUGERENCIAS_IA',
      descripcion: `${nuevos.length} sugerencia(s) de la IA agregadas a la matriz ${anio} de ${area} para revisión del área`,
      folio: `OOMRSC-37-${anio}`,
    });
    toast.success(`${nuevos.length} agregada(s). Revísalas y pon las fechas del plan antes de enviar.`);
    setSugerencias([]); setElegidas(new Set()); setEstado('inicio');
  };

  if (estado !== 'listo') {
    return (
      <button type="button" onClick={pedir} disabled={estado === 'cargando'}
        className="px-3 py-2 text-xs font-bold text-violet-800 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-60 inline-flex items-center gap-1">
        <Sparkles size={14} /> {estado === 'cargando' ? 'Pensando…' : 'Sugerir con IA'}
      </button>
    );
  }

  return (
    <section className="w-full bg-violet-50/60 border border-violet-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold text-violet-950 flex items-center gap-1.5"><Sparkles size={15} /> Sugerencias de la IA para {area}</h4>
        <p className="text-[11px] text-violet-900">Elige las que apliquen. Después se editan como cualquier otro registro.</p>
      </div>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {sugerencias.map((s, i) => {
          const marcada = elegidas.has(i);
          return (
            <li key={i}>
              <button type="button" onClick={() => alternar(i)} aria-pressed={marcada}
                className={`w-full text-left bg-white rounded-lg border p-3 transition-colors ${marcada ? 'border-violet-600 ring-1 ring-violet-600' : 'border-slate-200 hover:border-violet-300'}`}>
                <span className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${marcada ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300'}`}>{marcada && <Check size={12} />}</span>
                  <span className="min-w-0 text-xs">
                    <span className="flex flex-wrap gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.tipo === 'Riesgo' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{s.tipo}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${nivelDe(s)?.suave || ''}`}>{puntaje(s)} {nivelDe(s)?.nivel}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{s.contexto}</span>
                      {s.proceso && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{s.proceso}</span>}
                    </span>
                    <strong className="block text-slate-900">{s.descripcion}</strong>
                    {s.contexto_resultado && <span className="block text-slate-600 mt-0.5">{s.contexto_resultado}</span>}
                    {s.justificacion && <span className="block text-slate-500 mt-0.5 italic">{s.justificacion}</span>}
                    {s.plan.length > 0 && <span className="block text-slate-600 mt-1">Plan: {s.plan.map((a) => a.actividad).join(' · ')}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => { setSugerencias([]); setEstado('inicio'); }} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg">Descartar</button>
        <button type="button" onClick={pedir} className="px-3 py-1.5 text-xs font-semibold text-violet-800 bg-white border border-violet-200 rounded-lg">Pedir otras</button>
        <button type="button" disabled={!elegidas.size} onClick={agregar} className="px-4 py-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-40 rounded-lg">Agregar seleccionadas ({elegidas.size})</button>
      </div>
    </section>
  );
}
