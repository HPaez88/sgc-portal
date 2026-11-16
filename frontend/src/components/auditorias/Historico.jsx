// Histórico de auditorías: informes OOMRSC-16 anteriores al portal. Solo lectura: se consulta el PDF original
// y se analiza lo que dicen (cumplimiento por proceso, no conformidades por capítulo, cláusula y área).
import React, { useMemo, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { formatearFecha } from '../../constants/workflow';
import { urlArchivo } from '../../services/archivosService';
import { exportarInformeIndicadoresPDF } from '../../services/indicadoresExporter';
import BotonInformePDF from '../indicadores/BotonInformePDF';
import { RANGOS, analisisHistorico, rangoDe } from '../../constants/auditorias';
import { Bloque, Rango } from './ui';
import { AnalisisIA } from './Evaluaciones';

const MAX_FILAS = 15;
const pctTexto = (p) => (p == null ? 'Sin dato' : `${p}% ${RANGOS[rangoDe(p)].label}`);
const fechasDe = (i) => (i.fecha_inicio && i.fecha_fin ? `${formatearFecha(i.fecha_inicio)} a ${formatearFecha(i.fecha_fin)}` : i.fecha_auditoria_texto || '—');
const BOTON = 'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-md border';

function Detalle({ informe }) {
  const Hallazgos = ({ titulo, lista, cls }) => (
    <div>
      <p className={`text-xs font-extrabold uppercase ${cls}`}>{titulo} ({lista.length})</p>
      {lista.length === 0 ? <p className="text-xs text-slate-600">Ninguna.</p> : (
        <table className="w-full text-xs">
          <thead><tr><th scope="col" className="p-2 text-left w-40">Área</th><th scope="col" className="p-2 text-left w-20">Cláusula</th><th scope="col" className="p-2 text-left">Descripción (texto del informe)</th></tr></thead>
          <tbody>{lista.map((h, n) => (<tr key={n}><td className="p-2 font-semibold text-slate-900">{h.area || '—'}</td><td className="p-2">{h.clausula || '—'}</td><td className="p-2 whitespace-pre-line">{h.texto}</td></tr>))}</tbody>
        </table>)}
    </div>
  );
  const Texto = ({ titulo, valor }) => (valor ? <div><p className="text-xs font-extrabold uppercase text-marca-azul-oscuro">{titulo}</p><p className="text-xs text-slate-900 whitespace-pre-line">{valor}</p></div> : null);
  return (
    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
      <Texto titulo="Propósito" valor={informe.proposito} />
      <Hallazgos titulo="No conformidades" lista={informe.nc || []} cls="text-rose-700" />
      <Hallazgos titulo="Oportunidades de mejora" lista={informe.om || []} cls="text-amber-700" />
      {(informe.correcciones || []).length > 0 && <Texto titulo="Correcciones realizadas" valor={informe.correcciones.map((c) => `${c.area}: ${c.cantidad}`).join(' · ')} />}
      <Texto titulo="Comentarios de auditoría" valor={informe.comentarios} />
      <Texto titulo="Conclusiones" valor={informe.conclusiones} />
      <Texto titulo="Auditores" valor={(informe.auditores || []).join(' · ')} />
      {informe.fuente === 'escaneado' && <p className="text-[11px] text-slate-600">Este informe está escaneado: el texto se transcribió del PDF. Ante cualquier duda, el PDF es el registro válido.</p>}
    </div>
  );
}

export default function HistoricoPanel({ informes = [] }) {
  const analisis = useMemo(() => analisisHistorico(informes), [informes]);
  const [anio, setAnio] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [verTodas, setVerTodas] = useState(false);
  if (!informes.length) return <Bloque titulo="Histórico de auditorías"><p className="text-sm text-slate-600">Todavía no se han cargado informes de auditorías anteriores.</p></Bloque>;

  const { anios, porAnio, porProceso, porCapitulo, porClausula, porArea } = analisis;
  const elegido = anio ?? anios[anios.length - 1];
  const delAnio = informes.filter((i) => i.anio === elegido).sort((a, b) => a.numero - b.numero);
  const clausulasNC = porClausula.filter((c) => c.nc > 0);
  const areas = verTodas ? porArea : porArea.slice(0, MAX_FILAS);
  const recurrentes = porArea.filter((a) => a.nc > 0 && a.anios.length > 1);

  const pdf = () => exportarInformeIndicadoresPDF({
    titulo: 'Análisis histórico de auditorías internas', subtitulo: `Informes OOMRSC-16 · ISO 9001:2015 · ${anios[0]} a ${anios[anios.length - 1]}`,
    derecha: [`${informes.length} informes`],
    resumen: porAnio.map((a) => [`Cumplimiento ${a.anio}`, a.promedio != null ? `${a.promedio}%` : 'Sin dato']),
    secciones: [
      { titulo: 'Resultado por año', head: ['Año', 'Informes', 'Cumplimiento promedio', 'NC', 'OM', 'Correcciones', 'Aceptable', 'Riesgo', 'Crítico'], body: porAnio.map((a) => [a.anio, a.informes, pctTexto(a.promedio), a.nc, a.om, a.correcciones, a.aceptable, a.riesgo, a.critico]) },
      { titulo: 'Cumplimiento por proceso y año', head: ['Proceso', ...anios], body: porProceso.map((p) => [p.proceso, ...anios.map((a) => (p.anios[a] ? `${p.anios[a].promedio ?? 's/d'}%${p.anios[a].nc ? ` · ${p.anios[a].nc} NC` : ''}` : '—'))]) },
      { titulo: 'No conformidades por capítulo de la norma', head: ['Capítulo', ...anios, 'Total'], body: porCapitulo.map((c) => [`${c.capitulo}. ${c.nombre}`, ...anios.map((a) => c.anios[a]), c.total]) },
      { titulo: 'Cláusulas con más no conformidades', head: ['Cláusula', 'NC', 'OM', 'Años'], body: clausulasNC.slice(0, MAX_FILAS).map((c) => [c.clave, c.nc, c.om, c.anios.join(', ')]) },
      { titulo: 'Áreas con más hallazgos', head: ['Área', 'NC', 'OM', 'Años con hallazgos'], body: porArea.slice(0, 30).map((a) => [a.nombre, a.nc, a.om, a.anios.join(', ')]) },
    ],
    leyenda: 'Datos tomados de los informes de auditoría OOMRSC-16. El cumplimiento es el que declara cada informe. Rango: 90% o más aceptable; 80 a 90% riesgo; menos de 80% crítico.',
  }, 'Analisis_historico_auditorias');

  const promptIA = () => [
    `Analiza el histórico de auditorías internas ISO 9001:2015 (${informes.length} informes, ${anios[0]} a ${anios[anios.length - 1]}).`,
    `Por año: ${porAnio.map((a) => `${a.anio}: ${a.informes} informes, cumplimiento promedio ${a.promedio ?? 'sin dato'}%, ${a.nc} NC, ${a.om} OM`).join('; ')}.`,
    `Por proceso (cumplimiento por año): ${porProceso.map((p) => `${p.proceso}: ${anios.map((a) => (p.anios[a] ? `${a} ${p.anios[a].promedio ?? 's/d'}% (${p.anios[a].nc} NC)` : null)).filter(Boolean).join(', ')}`).join(' || ')}.`,
    `NC por capítulo de la norma: ${porCapitulo.map((c) => `${c.capitulo} ${c.nombre}: ${c.total}`).join('; ')}.`,
    `Cláusulas con más NC: ${clausulasNC.slice(0, 12).map((c) => `${c.clave} (${c.nc})`).join(', ')}.`,
    `Áreas con NC en más de un año: ${recurrentes.slice(0, 15).map((a) => `${a.nombre} (${a.nc} NC en ${a.anios.join(', ')})`).join('; ') || 'ninguna'}.`,
    'Entrega: un resumen ejecutivo de la tendencia, los puntos relevantes (procesos que bajan, cláusulas y áreas reincidentes) y qué conviene revisar en las próximas auditorías.',
  ].join('\n');

  return (
    <div className="space-y-3">
      <Bloque titulo="A. Resultado por año" ayuda="Lo que declaran los informes de auditoría (OOMRSC-16) anteriores al portal."
        derecha={<BotonInformePDF onClick={pdf} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Año</th><th scope="col" className="p-2 text-center">Informes</th><th scope="col" className="p-2 text-left">Cumplimiento promedio</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">OM</th><th scope="col" className="p-2 text-center">Correcciones</th><th scope="col" className="p-2 text-center">Aceptable</th><th scope="col" className="p-2 text-center">Riesgo</th><th scope="col" className="p-2 text-center">Crítico</th></tr></thead>
            <tbody>{porAnio.map((a) => (
              <tr key={a.anio}><td className="p-2 font-extrabold text-slate-900">{a.anio}</td><td className="p-2 text-center">{a.informes}</td>
                <td className="p-2"><Rango rango={a.rango} pct={a.promedio} />{a.conPorcentaje < a.informes && <span className="block text-[11px] text-slate-600">{a.informes - a.conPorcentaje} informe(s) sin porcentaje</span>}</td>
                <td className="p-2 text-center font-bold text-rose-700">{a.nc}</td><td className="p-2 text-center">{a.om}</td><td className="p-2 text-center">{a.correcciones}</td>
                <td className="p-2 text-center">{a.aceptable}</td><td className="p-2 text-center">{a.riesgo}</td><td className="p-2 text-center">{a.critico}</td></tr>))}</tbody>
          </table>
        </div>
      </Bloque>

      <Bloque titulo={`B. Informes de ${elegido}`} ayuda="Abre el informe para leer sus hallazgos, o consulta el PDF original."
        derecha={<div className="flex gap-1">{anios.map((a) => (
          <button key={a} type="button" aria-pressed={a === elegido} onClick={() => { setAnio(a); setAbierto(null); }}
            className={`px-2.5 py-1 rounded-md border text-xs font-bold ${a === elegido ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200'}`}>{a}</button>))}</div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Nº</th><th scope="col" className="p-2 text-left">Proceso</th><th scope="col" className="p-2 text-left">Fechas de auditoría</th><th scope="col" className="p-2 text-left">Resultado</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">OM</th><th scope="col" className="p-2 text-left">Informe</th></tr></thead>
            <tbody>{delAnio.map((i) => { const id = `${i.anio}-${i.numero}`; return (
              <React.Fragment key={id}>
                <tr>
                  <td className="p-2 font-extrabold text-slate-900">{i.numero}</td>
                  <td className="p-2"><button type="button" aria-expanded={abierto === id} onClick={() => setAbierto(abierto === id ? null : id)} className="text-left font-semibold text-marca-azul-oscuro underline underline-offset-2">{i.proceso}</button></td>
                  <td className="p-2">{fechasDe(i)}</td>
                  <td className="p-2"><Rango rango={rangoDe(i.porcentaje)} pct={i.porcentaje} />{i.requisitos_auditados != null && <span className="block text-[11px] text-slate-600">{i.requisitos_cumplidos ?? '—'} de {i.requisitos_auditados} requisitos</span>}</td>
                  <td className="p-2 text-center font-bold text-rose-700">{(i.nc || []).length}</td><td className="p-2 text-center">{(i.om || []).length}</td>
                  <td className="p-2">{i.archivo_id ? (
                    <span className="flex gap-1">
                      <a href={urlArchivo(i.archivo_id)} target="_blank" rel="noopener noreferrer" className={`${BOTON} border-marca-azul text-marca-azul-oscuro bg-white`}><Eye size={12} /> Ver</a>
                      <a href={urlArchivo(i.archivo_id, { descargar: true })} className={`${BOTON} border-slate-300 text-slate-700 bg-white`}><Download size={12} /> Descargar</a>
                    </span>) : <span className="text-slate-500">Sin PDF</span>}</td>
                </tr>
                {abierto === id && <tr><td colSpan={7} className="p-2"><Detalle informe={i} /></td></tr>}
              </React.Fragment>); })}</tbody>
          </table>
        </div>
      </Bloque>

      <Bloque titulo="C. Cumplimiento por proceso y año" ayuda="Permite ver qué proceso mejora o baja de un año a otro.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Proceso</th>{anios.map((a) => <th key={a} scope="col" className="p-2 text-left">{a}</th>)}</tr></thead>
            <tbody>{porProceso.map((p) => (
              <tr key={p.proceso}><td className="p-2 font-semibold text-slate-900">{p.proceso}</td>
                {anios.map((a) => { const c = p.anios[a]; return (
                  <td key={a} className="p-2">{c ? <>{c.promedio != null ? <Rango rango={rangoDe(c.promedio)} pct={c.promedio} /> : <span className="text-slate-600">Sin porcentaje</span>}<span className="block text-[11px] text-slate-600">{c.nc} NC{c.informes > 1 ? ` · ${c.informes} auditorías` : ''}</span></> : <span className="text-slate-500">—</span>}</td>); })}</tr>))}</tbody>
          </table>
        </div>
      </Bloque>

      <div className="grid gap-3 lg:grid-cols-2">
        <Bloque titulo="D. No conformidades por capítulo de la norma">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Capítulo</th>{anios.map((a) => <th key={a} scope="col" className="p-2 text-center">{a}</th>)}<th scope="col" className="p-2 text-center">Total</th></tr></thead>
            <tbody>{porCapitulo.map((c) => (
              <tr key={c.capitulo}><td className="p-2 font-semibold text-slate-900">{c.capitulo}. {c.nombre}</td>{anios.map((a) => <td key={a} className="p-2 text-center">{c.anios[a] || '—'}</td>)}<td className="p-2 text-center font-bold text-rose-700">{c.total}</td></tr>))}</tbody>
          </table>
        </Bloque>
        <Bloque titulo="E. Cláusulas con más no conformidades">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Cláusula</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">OM</th><th scope="col" className="p-2 text-left">Años</th></tr></thead>
            <tbody>{clausulasNC.slice(0, MAX_FILAS).map((c) => (
              <tr key={c.clave}><td className="p-2 font-semibold text-slate-900">{c.clave}</td><td className="p-2 text-center font-bold text-rose-700">{c.nc}</td><td className="p-2 text-center">{c.om}</td><td className="p-2">{c.anios.join(', ')}</td></tr>))}</tbody>
          </table>
        </Bloque>
      </div>

      <Bloque titulo="F. Áreas con más hallazgos" ayuda={`El área es la que escribió el auditor en el informe. ${recurrentes.length} área(s) tienen no conformidades en más de un año.`}
        derecha={porArea.length > MAX_FILAS && <button type="button" onClick={() => setVerTodas(!verTodas)} className="text-xs font-bold text-marca-azul-oscuro underline">{verTodas ? 'Ver menos' : `Ver las ${porArea.length}`}</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-center">NC</th><th scope="col" className="p-2 text-center">OM</th><th scope="col" className="p-2 text-left">Años con hallazgos</th></tr></thead>
            <tbody>{areas.map((a) => (
              <tr key={a.clave}><td className="p-2 font-semibold text-slate-900">{a.nombre}</td><td className="p-2 text-center font-bold text-rose-700">{a.nc}</td><td className="p-2 text-center">{a.om}</td><td className="p-2">{a.anios.join(', ')}</td></tr>))}</tbody>
          </table>
        </div>
      </Bloque>

      <AnalisisIA titulo="G. Análisis del histórico con IA" ayuda="Tendencia de los años cargados, reincidencias y qué revisar en las próximas auditorías." construirPrompt={promptIA} />
    </div>
  );
}
