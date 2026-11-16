// Paneles de consulta del módulo de Auditorías: calendario anual (OOMRSC-12), hallazgos (OOMRSC-17) y resultados (OOMRSC-16).
import React, { useState } from 'react';
import { PenLine } from 'lucide-react';
import { formatearFecha } from '../../constants/workflow';
import { exportarInformeIndicadoresPDF } from '../../services/indicadoresExporter';
import BotonInformePDF from '../indicadores/BotonInformePDF';
import { BIMESTRES, FORMATOS, RANGOS, TIPOS_HALLAZGO, calendarioAnual, resumenPorCapitulo, resumenPreguntas } from '../../constants/auditorias';
import { Bloque, ENTRADA, EstadoAuditoria, Rango, tituloAuditoria } from './ui';
import { AnalisisIA } from './Evaluaciones';

const ref = (a) => (a ? `${a.historico ? 'Informe ' : '#'}${a.numero}/${a.anio}` : '—');
const etiquetaRango = (r, pct) => (r ? `${pct}% ${RANGOS[r].label}` : 'Sin datos');

// ───────────── Calendario anual y cronograma bimestral ─────────────
export function CalendarioPanel({ areas, auditorias, listas, hallazgos, historico = [], anio, onAbrir }) {
  const filas = calendarioAnual({ areas, auditorias, listas, hallazgos, historico });
  const delAnio = auditorias.filter((a) => Number(a.anio) === Number(anio));
  const pdf = () => exportarInformeIndicadoresPDF({
    titulo: `Calendario anual de auditorías internas ${anio}`, subtitulo: `${FORMATOS.calendario} · ISO 9001:2015`, derecha: [`Auditorías del año: ${delAnio.length}`],
    secciones: [
      { titulo: 'Cronograma bimestral', head: ['Bimestre', 'Auditoría', 'Fechas', 'Áreas', 'Estado'], body: delAnio.map((a) => [BIMESTRES[a.bimestre], ref(a), `${formatearFecha(a.fecha_inicio)} a ${formatearFecha(a.fecha_fin)}`, (a.areas || []).map((x) => x.area).join(', '), a.estado]) },
      { titulo: 'Frecuencia por área según resultados', head: ['Área', 'Última auditoría', 'Fecha', 'C', 'NC', 'OM', 'Cumplimiento', 'Frecuencia', 'Próxima tentativa'],
        body: filas.map((f) => [f.area, ref(f.ultima), f.ultima ? formatearFecha(f.fecha) : '', f.c ?? '', f.nc ?? '', f.om ?? '', etiquetaRango(f.rango, f.cumplimiento), `${f.frecuencia} meses`, f.proxima ? formatearFecha(f.proxima) : 'Por programar']) },
    ],
    leyenda: 'Frecuencia: 0 NC = 12 meses; 1 a 3 NC = 8 meses; 4 a 8 NC = 6 meses; 9 o más NC = 4 meses. Rango: 90% o más aceptable; 80 a 90% riesgo; menos de 80% crítico.',
  }, `Calendario_auditorias_${anio}`);
  return (
    <div className="space-y-3">
      <Bloque titulo={`A. Cronograma bimestral ${anio}`} derecha={<BotonInformePDF onClick={pdf} />}>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {BIMESTRES.map((b, i) => { const lista = delAnio.filter((a) => Number(a.bimestre) === i); return (
            <div key={b} className="rounded-lg border border-slate-200 bg-slate-50 p-2 min-h-[84px]">
              <p className="text-[11px] font-extrabold uppercase text-marca-azul-oscuro mb-1">{b}</p>
              {lista.length === 0 && <p className="text-[11px] text-slate-500">Sin auditoría programada</p>}
              {lista.map((a) => (
                <button key={a.id} type="button" onClick={() => onAbrir(a.id)} className="block w-full text-left rounded-md bg-white border border-slate-200 p-1.5 mb-1 hover:border-marca-azul">
                  <span className="block text-xs font-bold text-slate-900">Auditoría {ref(a)}</span>
                  <span className="block text-[11px] text-slate-600">{(a.areas || []).length} área(s) · {formatearFecha(a.fecha_inicio)}</span>
                  <EstadoAuditoria estado={a.estado} />
                </button>))}
            </div>); })}
        </div>
      </Bloque>
      <Bloque titulo={`B. Frecuencia por área (${FORMATOS.calendario})`} ayuda="La siguiente auditoría de cada área se calcula con las no conformidades de la anterior: 0 NC = 12 meses, 1 a 3 = 8, 4 a 8 = 6, 9 o más = 4.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Última auditoría</th><th scope="col" className="p-2 text-center">C</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">OM</th>
              <th scope="col" className="p-2 text-left">Cumplimiento</th><th scope="col" className="p-2 text-left">Frecuencia</th><th scope="col" className="p-2 text-left">Próxima tentativa</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.area}>
                  <td className="p-2 font-semibold text-slate-900">{f.area}</td>
                  <td className="p-2">{f.ultima ? <>{ref(f.ultima)} <span className="text-slate-600">· {formatearFecha(f.fecha)}</span></> : <span className="text-slate-500">Sin auditoría en el portal</span>}</td>
                  <td className="p-2 text-center">{f.c ?? '—'}</td><td className="p-2 text-center font-bold text-rose-700">{f.nc ?? '—'}</td><td className="p-2 text-center">{f.om ?? '—'}</td>
                  <td className="p-2"><Rango rango={f.rango} pct={f.cumplimiento} /></td>
                  <td className="p-2">{f.frecuencia} meses</td>
                  <td className="p-2 font-semibold">{f.proxima ? formatearFecha(f.proxima) : 'Por programar'}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Bloque>
    </div>
  );
}

// ───────────── Hallazgos ─────────────
export function HallazgosPanel({ hallazgos, auditorias, puedeFirmar, onFirmar, acciones = [] }) {
  const [filtroAud, setFiltroAud] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const audDe = (h) => auditorias.find((a) => String(a.id) === String(h.auditoria_id));
  const lista = hallazgos.filter((h) => (!filtroAud || String(h.auditoria_id) === filtroAud) && (!filtroTipo || h.tipo === filtroTipo))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || a.orden - b.orden);
  const seguimiento = (h) => {
    if (h.tipo === 'OM') return 'Recomendación (no obligatoria)';
    if (h.tipo === 'CORRECCION') return h.rc_folio ? `Reporte de corrección ${h.rc_folio}` : 'Se genera al emitir el informe';
    const ac = acciones.find((x) => String(x.id) === String(h.ac_id));
    if (!h.ac_id) return 'Se genera al emitir el informe';
    if (!ac) return 'Acción correctiva generada';
    return ac.folio_codigo && ac.folio_codigo !== 'Pendiente de aprobación' ? `Acción correctiva ${ac.folio_codigo}` : `Acción correctiva por abrir · límite ${formatearFecha(h.limite_apertura)}`;
  };
  const pdf = () => exportarInformeIndicadoresPDF({
    titulo: 'Reportes de hallazgo de auditoría interna', subtitulo: `${FORMATOS.hallazgo} · ISO 9001:2015`, derecha: [`Hallazgos: ${lista.length}`],
    secciones: [{ titulo: 'Hallazgos', head: ['Auditoría', 'Área', 'Tipo', 'Cláusula', 'Hallazgo', 'Auditor', 'Seguimiento', 'Enterado'],
      body: lista.map((h) => [ref(audDe(h)), h.area, TIPOS_HALLAZGO[h.tipo]?.label || h.tipo, h.clausula, h.hallazgo, h.auditor, seguimiento(h), h.aceptado_por ? `${h.aceptado_por} ${formatearFecha(h.fecha_aceptacion)}` : 'Pendiente']) }],
  }, 'Hallazgos_auditoria');
  return (
    <Bloque titulo={`Reportes de hallazgo (${FORMATOS.hallazgo}) · ${lista.length}`} ayuda="No conformidad: acción correctiva obligatoria, con apertura a más tardar 5 días hábiles después del informe. Corrección menor: reporte de corrección con evidencia. Oportunidad de mejora: recomendación."
      derecha={<div className="flex flex-wrap items-center gap-2">
        <select aria-label="Filtrar por auditoría" value={filtroAud} onChange={(e) => setFiltroAud(e.target.value)} className={`${ENTRADA} w-auto`}><option value="">Todas las auditorías</option>{auditorias.map((a) => <option key={a.id} value={String(a.id)}>{tituloAuditoria(a)}</option>)}</select>
        <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={`${ENTRADA} w-auto`}><option value="">Todos los tipos</option>{Object.entries(TIPOS_HALLAZGO).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select>
        <BotonInformePDF onClick={pdf} />
      </div>}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr><th scope="col" className="p-2 text-left">Auditoría</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Tipo</th><th scope="col" className="p-2 text-left">Cláusula</th>
            <th scope="col" className="p-2 text-left min-w-[240px]">Hallazgo</th><th scope="col" className="p-2 text-left">Auditor</th><th scope="col" className="p-2 text-left">Seguimiento</th><th scope="col" className="p-2 text-left">Enterado del área</th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">Sin hallazgos registrados. Aparecen cuando el auditor entrega su lista de verificación.</td></tr>}
            {lista.map((h) => (
              <tr key={h.id}>
                <td className="p-2 whitespace-nowrap font-semibold">{ref(audDe(h))}</td>
                <td className="p-2">{h.area}</td>
                <td className="p-2"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${TIPOS_HALLAZGO[h.tipo]?.cls}`}>{TIPOS_HALLAZGO[h.tipo]?.label}</span></td>
                <td className="p-2">{h.clausula}<span className="block text-[11px] text-slate-600">{h.requisito}</span></td>
                <td className="p-2 text-slate-900">{h.hallazgo}{h.documentos && <span className="block text-[11px] text-slate-600">Documentos: {h.documentos}</span>}</td>
                <td className="p-2">{h.auditor}</td>
                <td className="p-2">{seguimiento(h)}</td>
                <td className="p-2">{h.aceptado_por
                  ? <><span className="font-semibold">{h.aceptado_por}</span><span className="block text-slate-600">{formatearFecha(h.fecha_aceptacion)}</span>{h.comentario_auditado && <span className="block text-slate-700">"{h.comentario_auditado}"</span>}</>
                  : puedeFirmar(h) ? <button type="button" onClick={() => onFirmar(h)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-marca-azul-oscuro text-white font-bold"><PenLine size={12} /> Firmar de enterado</button>
                    : <span className="text-slate-500">Pendiente</span>}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </Bloque>
  );
}

// ───────────── Resultados e informe ─────────────
export function ResultadosPanel({ auditorias, listas, hallazgos, areasVisibles }) {
  const conListas = auditorias.filter((a) => listas.some((l) => l.auditoria_id === a.id)).sort((a, b) => (b.anio - a.anio) || (b.numero - a.numero));
  const [elegida, setElegida] = useState('');
  const a = conListas.find((x) => String(x.id) === elegida) || conListas[0];
  if (!a) return <Bloque titulo="Resultados"><p className="text-sm text-slate-600">Todavía no hay auditorías con listas de verificación capturadas.</p></Bloque>;
  const ve = (area) => !areasVisibles || areasVisibles.includes(area);
  const delAud = listas.filter((l) => l.auditoria_id === a.id && ve(l.area));
  const porArea = delAud.map((l) => ({ area: l.area, auditor: l.auditor, estado: l.estado, ...resumenPreguntas(l.preguntas) }));
  const todas = delAud.flatMap((l) => l.preguntas || []);
  const general = resumenPreguntas(todas);
  const capitulos = resumenPorCapitulo(todas).filter((c) => c.total > 0);
  const historico = [...conListas].reverse();
  const areasHist = [...new Set(listas.filter((l) => ve(l.area)).map((l) => l.area))].sort();
  const pctDe = (aud, area) => { const l = listas.filter((x) => x.auditoria_id === aud.id && x.area === area); return l.length ? resumenPreguntas(l.flatMap((x) => x.preguntas || [])) : null; };
  const numHall = (tipo) => hallazgos.filter((h) => h.auditoria_id === a.id && h.tipo === tipo && ve(h.area)).length;

  const pdf = () => exportarInformeIndicadoresPDF({
    titulo: `Informe de ${tituloAuditoria(a).toLowerCase()}`, subtitulo: `${FORMATOS.informe} · ISO 9001:2015 · ${formatearFecha(a.fecha_inicio)} a ${formatearFecha(a.fecha_fin)}`,
    derecha: [`Cumplimiento: ${general.cumplimiento ?? '—'}%`, general.rango ? RANGOS[general.rango].label : ''],
    resumen: [['Requisitos auditados', general.auditadas], ['Conformes', general.conformes], ['No conformidades', numHall('NC')], ['Correcciones', numHall('CORRECCION')], ['Oportunidades de mejora', numHall('OM')]],
    secciones: [
      { titulo: 'Objetivo y alcance', head: ['Objetivo', 'Alcance'], body: [[a.objetivo || '', a.alcance || '']] },
      { titulo: 'Resultado por área', head: ['Área', 'Auditor', 'Auditadas', 'C', 'NC', 'Corrección', 'OM', 'Resultado'], body: porArea.map((r) => [r.area, r.auditor || '', r.auditadas, r.conformes, r.noConformidades, r.correcciones, r.oportunidades, etiquetaRango(r.rango, r.cumplimiento)]) },
      { titulo: 'Resultado por capítulo de la norma', head: ['Capítulo', 'Auditadas', 'C', 'NC', 'Corrección', 'OM', 'Resultado'], body: capitulos.map((c) => [`${c.capitulo}. ${c.nombre}`, c.auditadas, c.conformes, c.noConformidades, c.correcciones, c.oportunidades, etiquetaRango(c.rango, c.cumplimiento)]) },
      { titulo: 'Hallazgos', head: ['Área', 'Tipo', 'Cláusula', 'Hallazgo'], body: hallazgos.filter((h) => h.auditoria_id === a.id && ve(h.area)).map((h) => [h.area, TIPOS_HALLAZGO[h.tipo]?.label || h.tipo, h.clausula, h.hallazgo]) },
    ],
    leyenda: 'Cumplimiento = requisitos conformes x 100 / requisitos auditados. Rango: 90% o más aceptable; 80 a 90% riesgo; menos de 80% crítico.',
  }, `Informe_auditoria_${a.numero}_${a.anio}`);

  const promptIA = () => [
    `Analiza la ${tituloAuditoria(a)} (ISO 9001:2015). Cumplimiento general: ${general.cumplimiento}% con ${general.auditadas} requisitos auditados.`,
    `Resultado por área: ${porArea.map((r) => `${r.area}: ${r.cumplimiento}% (NC ${r.noConformidades}, correcciones ${r.correcciones}, OM ${r.oportunidades})`).join('; ')}.`,
    `Resultado por capítulo: ${capitulos.map((c) => `${c.capitulo} ${c.nombre}: ${c.cumplimiento}%`).join('; ')}.`,
    `Hallazgos: ${hallazgos.filter((h) => h.auditoria_id === a.id && ve(h.area)).slice(0, 40).map((h) => `[${h.tipo}] ${h.area}, cláusula ${h.clausula}: ${String(h.hallazgo).slice(0, 220)}`).join(' | ') || 'ninguno'}.`,
    `Auditorías anteriores (cumplimiento por área): ${historico.filter((x) => x.id !== a.id).map((x) => `${ref(x)}: ${areasHist.map((ar) => { const r = pctDe(x, ar); return r ? `${ar} ${r.cumplimiento}%` : null; }).filter(Boolean).join(', ')}`).join(' || ') || 'no hay auditorías anteriores en el portal'}.`,
    'Entrega: un resumen ejecutivo para los directores, los puntos relevantes (incluye la comparación con auditorías anteriores si existen) y recomendaciones de seguimiento.',
  ].join('\n');

  const Tabla = ({ filas, primera }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr><th scope="col" className="p-2 text-left">{primera}</th><th scope="col" className="p-2 text-center">Auditadas</th><th scope="col" className="p-2 text-center">C</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">Corrección</th><th scope="col" className="p-2 text-center">OM</th><th scope="col" className="p-2 text-left">Resultado</th></tr></thead>
        <tbody>{filas.map((r) => (
          <tr key={r.clave}><td className="p-2 font-semibold text-slate-900">{r.nombre}{r.nota && <span className="block text-[11px] font-normal text-slate-600">{r.nota}</span>}</td>
            <td className="p-2 text-center">{r.auditadas}</td><td className="p-2 text-center">{r.conformes}</td><td className="p-2 text-center font-bold text-rose-700">{r.noConformidades}</td><td className="p-2 text-center">{r.correcciones}</td><td className="p-2 text-center">{r.oportunidades}</td>
            <td className="p-2"><Rango rango={r.rango} pct={r.cumplimiento} /></td></tr>))}</tbody>
      </table>
    </div>);

  return (
    <div className="space-y-3">
      <Bloque titulo={`A. Resultado general (${FORMATOS.informe})`} derecha={<div className="flex flex-wrap items-center gap-2">
        <select aria-label="Auditoría" value={String(a.id)} onChange={(e) => setElegida(e.target.value)} className={`${ENTRADA} w-auto`}>{conListas.map((x) => <option key={x.id} value={String(x.id)}>{tituloAuditoria(x)}</option>)}</select>
        <BotonInformePDF onClick={pdf} texto="Informe PDF" /></div>}>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-900">
          <EstadoAuditoria estado={a.estado} /><Rango rango={general.rango} pct={general.cumplimiento} />
          <span>{general.auditadas} requisitos auditados</span><span>{numHall('NC')} NC</span><span>{numHall('CORRECCION')} corrección(es)</span><span>{numHall('OM')} OM</span>
          {a.fecha_informe && <span className="text-slate-600">Informe del {formatearFecha(a.fecha_informe)}</span>}
        </div>
      </Bloque>
      <Bloque titulo="B. Resultado por área"><Tabla primera="Área" filas={porArea.map((r) => ({ ...r, clave: r.area, nombre: r.area, nota: `${r.auditor || ''}${r.estado === 'ENTREGADA' ? '' : ' · lista en captura'}` }))} /></Bloque>
      <Bloque titulo="C. Resultado por capítulo de la norma"><Tabla primera="Capítulo" filas={capitulos.map((c) => ({ ...c, clave: c.capitulo, nombre: `${c.capitulo}. ${c.nombre}` }))} /></Bloque>
      <AnalisisIA titulo="Análisis de la auditoría con IA" ayuda="Resume el resultado, lo compara con auditorías anteriores y propone a qué dar seguimiento." construirPrompt={promptIA} />
      {historico.length > 1 && (
        <Bloque titulo="D. Comparativo con auditorías anteriores" ayuda="Porcentaje de cumplimiento de cada área en cada auditoría.">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr><th scope="col" className="p-2 text-left">Área</th>{historico.map((x) => <th key={x.id} scope="col" className="p-2 text-center">{ref(x)}</th>)}</tr></thead>
              <tbody>{areasHist.map((area) => (
                <tr key={area}><td className="p-2 font-semibold text-slate-900">{area}</td>
                  {historico.map((x) => { const r = pctDe(x, area); return <td key={x.id} className="p-2 text-center">{r ? <Rango rango={r.rango} pct={r.cumplimiento} /> : '—'}</td>; })}</tr>))}</tbody>
            </table>
          </div>
        </Bloque>)}
    </div>
  );
}
