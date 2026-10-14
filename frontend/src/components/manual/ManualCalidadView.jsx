// ═══════════════════════════════════════════════════════════════
// ManualCalidadView — Manual de la Calidad (OOMLSC-01) y sus anexos.
// Solo lectura en esta iteración: el contenido viene de /api/v1/manual,
// generado desde los archivos oficiales con scripts/extraer_manual.py.
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, FileSpreadsheet, FileText, Search, AlertCircle, Loader2, Table2 } from 'lucide-react';
import { api } from '../../services/apiClient';
import { getApiUrl } from '../../config';

const urlArchivo = (nombre) => getApiUrl(`/api/v1/manual/archivos/${encodeURIComponent(nombre)}`);

// ───────────── Manual: índice + secciones ─────────────
function Bloque({ bloque }) {
  if (bloque.tipo === 'tabla') {
    const [cabecera, ...resto] = bloque.filas;
    const esTitulo = cabecera.length === 1;
    return (
      <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
        {esTitulo && <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5">{cabecera[0]}</div>}
        <table className="min-w-full text-xs">
          <tbody>
            {(esTitulo ? resto : bloque.filas).map((fila, i) => (
              <tr key={i} className={i === 0 ? 'bg-slate-100 font-bold text-slate-800' : 'odd:bg-white even:bg-slate-50/60'}>
                {fila.map((c, j) => <td key={j} className="px-3 py-1.5 align-top border-t border-slate-200 text-slate-700 leading-snug">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (bloque.tipo === 'lista') {
    return <li className="ml-5 list-disc text-sm text-slate-700 leading-relaxed">{bloque.texto}</li>;
  }
  return <p className="text-sm text-slate-700 leading-relaxed my-1.5">{bloque.texto}</p>;
}

function Seccion({ seccion, resaltar }) {
  const nivel = (seccion.numero.match(/\./g) || []).length;
  const Titulo = nivel === 0 ? 'h2' : nivel === 1 ? 'h3' : 'h4';
  const clase = nivel === 0
    ? 'text-lg font-black text-[#002855] mt-8 mb-2 pb-1 border-b-2 border-sky-200'
    : nivel === 1 ? 'text-base font-extrabold text-slate-900 mt-5 mb-1' : 'text-sm font-bold text-slate-800 mt-3 mb-1';
  return (
    <section id={`sec-${seccion.numero}`} className={resaltar ? 'bg-amber-50/60 rounded-lg -mx-2 px-2' : ''}>
      <Titulo className={clase}><span className="font-mono text-sky-700 mr-2">{seccion.numero}</span>{seccion.titulo}</Titulo>
      <ul>{seccion.bloques.map((b, i) => <Bloque key={i} bloque={b} />)}</ul>
    </section>
  );
}

function VistaManual({ manual }) {
  const [busqueda, setBusqueda] = useState('');
  const coincidencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length < 3) return new Set();
    return new Set(manual.secciones
      .filter(s => s.titulo.toLowerCase().includes(q) || s.bloques.some(b => (b.texto || b.filas?.flat().join(' ') || '').toLowerCase().includes(q)))
      .map(s => s.numero));
  }, [busqueda, manual]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      <aside className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-200px)] overflow-y-auto bg-white rounded-xl border border-slate-200 p-3">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en el manual…"
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20" />
        </div>
        <nav className="space-y-0.5">
          {manual.secciones.map(s => {
            const nivel = (s.numero.match(/\./g) || []).length;
            const hit = coincidencias.has(s.numero);
            return (
              <a key={s.numero} href={`#sec-${s.numero}`}
                className={`block text-xs rounded px-2 py-1 hover:bg-sky-50 ${nivel === 0 ? 'font-bold mt-1' : nivel === 1 ? 'pl-4' : 'pl-7'} ${hit ? 'bg-amber-100 text-amber-900' : nivel === 0 ? 'text-slate-900' : nivel === 1 ? 'text-slate-700' : 'text-slate-500'}`}>
                <span className="font-mono text-sky-700 mr-1.5">{s.numero}</span>{s.titulo}
              </a>
            );
          })}
        </nav>
      </aside>
      <article className="bg-white rounded-xl border border-slate-200 px-6 py-4 max-w-4xl">
        {manual.secciones.map(s => <Seccion key={s.numero} seccion={s} resaltar={coincidencias.has(s.numero)} />)}
      </article>
    </div>
  );
}

// ───────────── Anexos: tablas / pdf / no disponible ─────────────
function TablaHoja({ hoja }) {
  const [filtro, setFiltro] = useState('');
  const filas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q ? hoja.filas.filter(f => f.join(' ').toLowerCase().includes(q)) : hoja.filas;
  }, [filtro, hoja]);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div>
          <div className="text-sm font-bold text-slate-900">{hoja.nombre}</div>
          {hoja.meta.length > 0 && <div className="text-[11px] text-slate-500">{hoja.meta.join(' · ')}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono">{filas.length} / {hoja.filas.length} filas</span>
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar…"
            className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 w-44" />
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-320px)]">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-[#0B192C] text-white">
            <tr>{hoja.columnas.map((c, i) => <th key={i} className="px-3 py-2 text-left font-bold whitespace-nowrap">{c}</th>)}</tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/60 hover:bg-sky-50/60">
                {f.map((c, j) => <td key={j} className="px-3 py-1.5 align-top border-t border-slate-100 text-slate-700 leading-snug max-w-[360px]">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VistaAnexo({ anexo }) {
  const [hojaIdx, setHojaIdx] = useState(0);
  useEffect(() => setHojaIdx(0), [anexo.clave]);
  if (anexo.tipo === 'pdf') {
    return <iframe title={anexo.titulo} src={urlArchivo(anexo.archivo)} className="w-full h-[calc(100vh-260px)] rounded-xl border border-slate-200 bg-white" />;
  }
  if (anexo.tipo !== 'tablas') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900 flex items-start gap-3">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Contenido no extraído todavía.</div>
          <div className="mt-1">{anexo.nota}</div>
          <a href={urlArchivo(anexo.archivo)} className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-sky-800 underline"><Download size={13} /> Descargar original</a>
        </div>
      </div>
    );
  }
  const hojas = anexo.hojas || [];
  return (
    <div className="space-y-3">
      {hojas.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {hojas.map((h, i) => (
            <button key={i} onClick={() => setHojaIdx(i)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${i === hojaIdx ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
              {h.nombre}
            </button>
          ))}
        </div>
      )}
      {hojas[hojaIdx] && <TablaHoja hoja={hojas[hojaIdx]} />}
    </div>
  );
}

// ───────────── Vista principal ─────────────
const ICONO = { tablas: FileSpreadsheet, pdf: FileText, no_disponible: AlertCircle, error: AlertCircle };

export default function ManualCalidadView() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [activo, setActivo] = useState('manual');

  useEffect(() => {
    api.get('/api/v1/manual').then(r => {
      if (r?.ok && r.data?.manual) setDatos(r.data);
      else setError(r?.error?.message || r?.error || 'No se pudo cargar el manual');
    }).catch(e => setError(e.message || 'No se pudo cargar el manual'));
  }, []);

  if (error) return <div className="p-6 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>;
  if (!datos) return <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Cargando manual…</div>;

  const { manual, anexos } = datos;
  const docActivo = activo === 'manual' ? manual : anexos.find(a => a.clave === activo);
  const pestanas = [{ clave: 'manual', titulo: 'Manual de la Calidad', corto: 'Manual', icono: BookOpen, revision: manual?.revision, archivo: manual?.archivo },
    ...anexos.map(a => ({ clave: a.clave, titulo: a.titulo, corto: a.clave.replace('OOMLSC-', ''), icono: ICONO[a.tipo] || Table2, revision: a.revision, archivo: a.archivo }))];

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] px-4 py-2.5 rounded-2xl shadow-md text-white border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0"><BookOpen size={17} /></div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black tracking-tight truncate">{docActivo?.titulo}</h2>
              <div className="text-[11px] text-sky-200 font-mono">{docActivo?.clave} · {docActivo?.revision} · ISO 9001:2015</div>
            </div>
          </div>
          {docActivo?.archivo && (
            <a href={urlArchivo(docActivo.archivo)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold shrink-0">
              <Download size={13} /> Original ({docActivo.tamano_kb} KB)
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2.5 -mb-0.5">
          {pestanas.map(p => {
            const Icono = p.icono;
            return (
              <button key={p.clave} onClick={() => setActivo(p.clave)} title={p.titulo}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activo === p.clave ? 'bg-sky-400 text-slate-950' : 'text-sky-100/90 hover:text-white hover:bg-white/10'}`}>
                <Icono size={13} /> {p.corto}
              </button>
            );
          })}
        </div>
      </div>

      {activo === 'manual' ? <VistaManual manual={manual} /> : docActivo && <VistaAnexo anexo={docActivo} />}
    </div>
  );
}
