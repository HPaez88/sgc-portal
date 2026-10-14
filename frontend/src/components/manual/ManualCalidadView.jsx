// ═══════════════════════════════════════════════════════════════
// ManualCalidadView — Manual de la Calidad (OOMLSC-01) y anexos, como documentos controlados.
// Lectura amplia en Markdown · edición por sección (Admin) · ruta de aprobación en dos pasos
// (otro Admin revisa, el Director General publica) · historial con diferencias.
// Datos: /api/v1/documentos (Postgres). El JSON extraído del Word fue solo la semilla inicial.
// ═══════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  BookOpen, Download, FileSpreadsheet, FileText, Search, Loader2, Pencil, Send, Check, X, History,
  ShieldCheck, Clock, AlertCircle, Trash2, ChevronLeft, GitCompare, Droplet, Award,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { getApiUrl } from '../../config';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ContenedorModal from '../common/ContenedorModal';

marked.setOptions({ gfm: true, breaks: false });
const ROLES_EDITAN = ['Super Admin', 'Admin'];
const ROLES_PUBLICAN = ['Super Admin', 'Director'];
const urlOriginal = (nombre) => getApiUrl(`/api/v1/manual/archivos/${encodeURIComponent(nombre)}`);
const fecha = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const ESTADO_UI = {
  BORRADOR: { texto: 'Borrador', clase: 'bg-slate-100 text-slate-700 border-slate-200' },
  EN_REVISION: { texto: 'En revisión (Admin)', clase: 'bg-amber-50 text-amber-800 border-amber-200' },
  REVISADO: { texto: 'Revisado · espera Dirección', clase: 'bg-sky-50 text-sky-800 border-sky-200' },
  PUBLICADO: { texto: 'Vigente', clase: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  RECHAZADO: { texto: 'Rechazado', clase: 'bg-rose-50 text-rose-800 border-rose-200' },
  OBSOLETO: { texto: 'Obsoleta', clase: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function Markdown({ texto, className = '' }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(texto || '')), [texto]);
  return <div className={`prosa-sgc ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

const nivelDe = (numero) => (String(numero).match(/\./g) || []).length;

// ───────────── Portada (sección 0) ─────────────
function Portada({ seccion, doc }) {
  const lineas = (seccion.markdown || '').split(/\n+/).map(l => l.replace(/^[#*\s]+|[*\s]+$/g, '')).filter(Boolean);
  const organismo = lineas.find(l => /organismo|oomapas/i.test(l)) || 'OOMAPAS de Cajeme';
  const normas = lineas.filter(l => /ISO|NMX/i.test(l));
  const v = doc.vigente;
  const fechaLarga = v?.fecha_publicacion ? new Date(v.fecha_publicacion).toLocaleDateString('es-MX', { dateStyle: 'long' }) : '—';
  return (
    <section id="sec-0" className="scroll-mt-24 -mx-6 sm:-mx-10 -mt-6 mb-8 rounded-t-2xl overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#0B192C] via-[#102a4a] to-[#002855] text-white px-8 sm:px-14 py-12 sm:py-16">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #38bdf8 0, transparent 40%), radial-gradient(circle at 85% 80%, #38bdf8 0, transparent 35%)' }} />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20"><Droplet size={24} className="fill-white/20" /></div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200 leading-snug">{organismo}</div>
          </div>
          <div className="text-xs font-mono text-sky-300 mb-2">{doc.clave} · Sistema de Gestión de la Calidad</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{doc.titulo}</h1>
          <div className="flex flex-wrap gap-2 mt-5">
            {normas.map(n => <span key={n} className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/20">{n}</span>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-6 border-t border-white/15 text-xs">
            <div><div className="text-sky-300/80 uppercase tracking-wider text-[10px] font-bold">Revisión vigente</div><div className="text-2xl font-black mt-0.5">Rev. {v?.numero ?? '—'}</div></div>
            <div><div className="text-sky-300/80 uppercase tracking-wider text-[10px] font-bold">Vigente desde</div><div className="font-semibold mt-1 leading-snug">{fechaLarga}</div></div>
            <div><div className="text-sky-300/80 uppercase tracking-wider text-[10px] font-bold">Aprobó</div><div className="font-semibold mt-1 leading-snug">{v?.aprobador_nombre || '—'}</div></div>
            <div><div className="text-sky-300/80 uppercase tracking-wider text-[10px] font-bold">Área responsable</div><div className="font-semibold mt-1 leading-snug">{doc.area_responsable}</div></div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-8 sm:px-14 py-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5"><Award size={13} className="text-emerald-600" /> Documento controlado · copia electrónica vigente en el portal SGC</span>
        {v?.hash && <span className="font-mono text-slate-400" title={v.hash}>Integridad SHA-256 · {v.hash.slice(0, 16)}…</span>}
      </div>
    </section>
  );
}

// ───────────── Lectura ─────────────
function Lectura({ secciones, busqueda, doc }) {
  const q = busqueda.trim().toLowerCase();
  const hits = useMemo(() => new Set(q.length < 3 ? [] : secciones
    .filter(s => s.titulo.toLowerCase().includes(q) || s.markdown.toLowerCase().includes(q)).map(s => s.numero)), [q, secciones]);
  return (
    <article className="bg-white rounded-2xl border border-slate-200 px-6 sm:px-10 py-6 shadow-card-subtle">
      {secciones.map(s => {
        if (s.numero === '0' && doc?.tipo === 'manual') return <Portada key="portada" seccion={s} doc={doc} />;
        const nivel = nivelDe(s.numero);
        const Titulo = nivel === 0 ? 'h2' : nivel === 1 ? 'h3' : 'h4';
        const clase = nivel === 0
          ? 'text-2xl font-black text-[#002855] mt-10 first:mt-0 mb-3 pb-2 border-b-2 border-sky-200'
          : nivel === 1 ? 'text-lg font-extrabold text-slate-900 mt-7 mb-2' : 'text-base font-bold text-slate-800 mt-5 mb-1.5';
        return (
          <section key={s.numero} id={`sec-${s.numero}`} className={`scroll-mt-24 ${hits.has(s.numero) ? 'bg-amber-50/60 rounded-xl -mx-3 px-3' : ''}`}>
            <Titulo className={clase}><span className="font-mono text-sky-700 mr-2.5">{s.numero}</span>{s.titulo}</Titulo>
            <Markdown texto={s.markdown} />
          </section>
        );
      })}
    </article>
  );
}

function Indice({ secciones, busqueda, setBusqueda }) {
  return (
    <aside className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-190px)] overflow-y-auto bg-white rounded-2xl border border-slate-200 p-3">
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en el documento…"
          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20" />
      </div>
      <nav className="space-y-0.5">
        {secciones.map(s => {
          const nivel = nivelDe(s.numero);
          return (
            <a key={s.numero} href={`#sec-${s.numero}`}
              className={`block text-xs rounded px-2 py-1 hover:bg-sky-50 ${nivel === 0 ? 'font-bold text-slate-900 mt-1.5' : nivel === 1 ? 'text-slate-700 pl-4' : 'text-slate-500 pl-7'}`}>
              <span className="font-mono text-sky-700 mr-1.5">{s.numero}</span>{s.titulo}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

// ───────────── Edición ─────────────
function Editor({ secciones, onChange }) {
  const [activa, setActiva] = useState(secciones[0]?.numero);
  const sec = secciones.find(s => s.numero === activa) || secciones[0];
  const actualizar = (campo, valor) => onChange(secciones.map(s => (s.numero === sec.numero ? { ...s, [campo]: valor } : s)));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      <aside className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-190px)] overflow-y-auto bg-white rounded-2xl border border-slate-200 p-2">
        {secciones.map(s => (
          <button key={s.numero} onClick={() => setActiva(s.numero)}
            className={`w-full text-left text-xs rounded px-2 py-1 cursor-pointer ${s.numero === sec?.numero ? 'bg-[#0B192C] text-white' : 'hover:bg-sky-50 text-slate-700'} ${nivelDe(s.numero) === 0 ? 'font-bold' : nivelDe(s.numero) === 1 ? 'pl-4' : 'pl-7'}`}>
            <span className="font-mono mr-1.5 opacity-80">{s.numero}</span>{s.titulo}
          </button>
        ))}
      </aside>
      {sec && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sección {sec.numero} · título</label>
            <input value={sec.titulo} onChange={e => actualizar('titulo', e.target.value)}
              className="mt-1 mb-3 px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20" />
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contenido (Markdown)</label>
            <textarea value={sec.markdown} onChange={e => actualizar('markdown', e.target.value)} spellCheck
              className="mt-1 flex-1 min-h-[55vh] px-3 py-2 text-[13px] font-mono leading-relaxed border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 resize-y" />
            <p className="mt-2 text-[10px] text-slate-400">Párrafos separados por línea en blanco · listas con "- " · tablas con "|" · negritas con **texto**.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-y-auto max-h-[75vh]">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vista previa</div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2"><span className="font-mono text-sky-700 mr-2">{sec.numero}</span>{sec.titulo}</h3>
            <Markdown texto={sec.markdown} />
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────── Historial y diff ─────────────
function Historial({ clave, onClose }) {
  const [revs, setRevs] = useState(null);
  const [diff, setDiff] = useState(null);
  useEffect(() => { api.get(`/api/v1/documentos/${clave}/revisiones`).then(r => setRevs(r.ok ? r.data : [])); }, [clave]);
  const comparar = async (a, b) => {
    const r = await api.get(`/api/v1/documentos/${clave}/diff?de=${b.id}&a=${a.id}`);
    if (r.ok) setDiff(r.data);
  };
  return (
    <ContenedorModal isOpen onClose={onClose} titulo="Historial de revisiones" anchoMaximo="max-w-4xl">
      {!revs ? <div className="p-6 text-sm text-slate-500">Cargando…</div> : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {revs.map((r, i) => {
            const ui = ESTADO_UI[r.estado] || ESTADO_UI.BORRADOR;
            const anterior = revs.slice(i + 1).find(x => ['PUBLICADO', 'OBSOLETO'].includes(x.estado));
            return (
              <div key={r.id} className="border border-slate-200 rounded-xl p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-slate-900">Rev. {r.numero}</span>
                  <span className={`px-2 py-0.5 rounded-md border font-bold ${ui.clase}`}>{ui.texto}</span>
                  {r.hash && <span className="font-mono text-[10px] text-slate-400" title={r.hash}>sha256 {r.hash.slice(0, 12)}…</span>}
                  {anterior && r.estado !== 'BORRADOR' && (
                    <button onClick={() => comparar(r, anterior)} className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold cursor-pointer">
                      <GitCompare size={12} /> Ver cambios vs Rev. {anterior.numero}
                    </button>
                  )}
                </div>
                {r.motivo && <p className="mt-1.5 text-slate-700"><strong>Motivo:</strong> {r.motivo}</p>}
                {r.comentario && <p className="mt-1 text-slate-700"><strong>Comentario:</strong> {r.comentario}</p>}
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px] text-slate-500">
                  <span>Autor: <strong className="text-slate-700">{r.autor_nombre || '—'}</strong> · {fecha(r.fecha_envio || r.fecha_creacion)}</span>
                  <span>Revisó: <strong className="text-slate-700">{r.revisor_nombre || '—'}</strong> · {fecha(r.fecha_revision)}</span>
                  <span>Aprobó: <strong className="text-slate-700">{r.aprobador_nombre || '—'}</strong> · {fecha(r.fecha_publicacion)}</span>
                </div>
              </div>
            );
          })}
          {diff && (
            <div className="border-2 border-sky-200 rounded-xl p-3 bg-sky-50/40">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-900">Cambios de Rev. {diff.de.numero} a Rev. {diff.a.numero}</h4>
                <button onClick={() => setDiff(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={14} /></button>
              </div>
              {diff.secciones.length === 0 && <p className="text-xs text-slate-500">Sin diferencias de contenido.</p>}
              {diff.secciones.map(s => (
                <div key={s.numero} className="mb-3">
                  <div className="text-xs font-bold text-slate-800"><span className="font-mono text-sky-700 mr-1.5">{s.numero}</span>{s.titulo} <span className="text-[10px] font-normal text-slate-500">· {s.cambio}</span></div>
                  <pre className="mt-1 text-[11px] font-mono whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-2 max-h-72 overflow-auto">
                    {s.lineas.map((l, i) => (
                      <div key={i} className={l.tipo === '+' ? 'bg-emerald-50 text-emerald-900' : l.tipo === '-' ? 'bg-rose-50 text-rose-900 line-through decoration-rose-300' : 'text-slate-500'}>
                        {l.tipo} {l.texto}
                      </div>
                    ))}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ContenedorModal>
  );
}

// ───────────── Vista principal ─────────────
export default function ManualCalidadView() {
  const { usuarioLogueado } = useSGC();
  const toast = useToast();
  const rol = usuarioLogueado?.rol;
  const puedeEditar = ROLES_EDITAN.includes(rol);
  const puedePublicar = ROLES_PUBLICAN.includes(rol);

  const [lista, setLista] = useState(null);
  const [clave, setClave] = useState('OOMLSC-01');
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [modo, setModo] = useState('lectura'); // lectura | edicion | abierta
  const [borrador, setBorrador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modal, setModal] = useState(null); // 'enviar' | 'revisar' | 'publicar' | 'historial'
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');

  const cargar = useCallback(async (c = clave) => {
    const [l, d] = await Promise.all([api.get('/api/v1/documentos'), api.get(`/api/v1/documentos/${c}`)]);
    if (l.ok) setLista(l.data);
    if (d.ok) { setDoc(d.data); setError(null); } else setError(d.error?.message || d.error?.detail || 'No se pudo cargar el documento');
  }, [clave]);

  useEffect(() => { cargar(clave); setModo('lectura'); setBorrador(null); setBusqueda(''); }, [clave, cargar]);

  const abierta = doc?.abierta;
  const accion = async (fn, exito) => {
    setGuardando(true);
    const r = await fn();
    setGuardando(false);
    if (!r.ok) return toast.error(r.error?.message || r.error?.detail || 'Operación no realizada');
    if (exito) toast.success(exito);
    setModal(null); setMotivo(''); setComentario('');
    await cargar(clave);
    return r;
  };

  const abrirBorrador = async () => {
    const r = await accion(() => api.post(`/api/v1/documentos/${clave}/borrador`), 'Borrador abierto a partir de la revisión vigente');
    if (r?.ok) { setBorrador(r.data.secciones); setModo('edicion'); }
  };
  const continuarBorrador = () => { setBorrador(abierta.secciones); setModo('edicion'); };
  const guardarBorrador = async (seguir = true) => {
    const r = await accion(() => api.put(`/api/v1/documentos/${clave}/borrador`, { secciones: borrador }), 'Borrador guardado');
    if (r?.ok && !seguir) setModo('lectura');
  };
  const enviar = () => accion(() => api.post(`/api/v1/documentos/${clave}/enviar`, { motivo }), 'Enviado a revisión').then(r => r?.ok && setModo('lectura'));
  const revisar = (aprobado) => accion(() => api.post(`/api/v1/documentos/${clave}/revisar`, { aprobado, comentario }), aprobado ? 'Revisión aprobada; pasa a la Dirección' : 'Cambio rechazado');
  const publicar = (aprobado) => accion(() => api.post(`/api/v1/documentos/${clave}/publicar`, { aprobado, comentario }), aprobado ? 'Nueva revisión publicada' : 'Cambio rechazado por la Dirección');
  const descartar = () => accion(() => api.delete(`/api/v1/documentos/${clave}/borrador`), 'Borrador descartado').then(() => setModo('lectura'));

  if (error) return <div className="p-6 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>;
  if (!doc || !lista) return <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Cargando documento…</div>;

  const vigente = doc.vigente;
  const secMostrar = modo === 'abierta' && abierta ? abierta.secciones : vigente?.secciones || [];
  const estadoAbierta = abierta ? (ESTADO_UI[abierta.estado] || ESTADO_UI.BORRADOR) : null;
  const esAutor = abierta && abierta.autor_id === usuarioLogueado?.id;
  const puedeRevisar = abierta?.estado === 'EN_REVISION' && puedeEditar && !esAutor;
  const puedeAprobar = abierta?.estado === 'REVISADO' && puedePublicar;

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Encabezado del documento */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] px-4 py-2.5 rounded-2xl shadow-md text-white border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0"><BookOpen size={17} /></div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black tracking-tight truncate">{doc.titulo}</h2>
              <div className="text-[11px] text-sky-200 font-mono flex flex-wrap items-center gap-x-2">
                <span>{doc.clave}</span><span>·</span>
                <span>Rev. {vigente?.numero ?? '—'} vigente</span><span>·</span>
                <span>Aprobó: {vigente?.aprobador_nombre || '—'} · {fecha(vigente?.fecha_publicacion)}</span>
                {vigente?.hash && <span title={vigente.hash} className="hidden md:inline">· sha256 {vigente.hash.slice(0, 10)}…</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button onClick={() => setModal('historial')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer"><History size={13} /> Historial</button>
            {doc.archivo_original && (
              <a href={urlOriginal(doc.archivo_original)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold"><Download size={13} /> Original</a>
            )}
            {puedeEditar && !abierta && modo === 'lectura' && (
              <button onClick={abrirBorrador} disabled={guardando} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-lg text-xs font-black cursor-pointer disabled:opacity-60"><Pencil size={13} /> Proponer cambio</button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2.5 -mb-0.5">
          {lista.map(d => {
            const Icono = d.tipo === 'manual' ? BookOpen : d.archivo_original?.endsWith('.pdf') ? FileText : FileSpreadsheet;
            return (
              <button key={d.clave} onClick={() => setClave(d.clave)} title={d.titulo}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${clave === d.clave ? 'bg-sky-400 text-slate-950' : 'text-sky-100/90 hover:text-white hover:bg-white/10'}`}>
                <Icono size={13} /> {d.tipo === 'manual' ? 'Manual' : d.clave.replace('OOMLSC-', '')}
                {d.abierta && <span className="w-1.5 h-1.5 rounded-full bg-amber-300" title="Cambio en curso" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de flujo cuando hay un cambio en curso */}
      {abierta && modo !== 'edicion' && (
        <div className={`flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border text-xs ${estadoAbierta.clase}`}>
          <Clock size={14} className="shrink-0" />
          <span className="font-bold">Rev. {abierta.numero} · {estadoAbierta.texto}</span>
          <span className="text-slate-600">· Autor: {abierta.autor_nombre || '—'}{abierta.revisor_nombre ? ` · Revisó: ${abierta.revisor_nombre}` : ''}</span>
          {abierta.motivo && <span className="text-slate-600 truncate max-w-md" title={abierta.motivo}>· Motivo: {abierta.motivo}</span>}
          {abierta.estado === 'RECHAZADO' && abierta.comentario && <span className="font-semibold">· {abierta.comentario}</span>}
          <span className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setModo(modo === 'abierta' ? 'lectura' : 'abierta')} className="px-2.5 py-1 rounded-lg border border-current/30 bg-white/60 font-bold cursor-pointer">
              {modo === 'abierta' ? 'Ver vigente' : 'Ver propuesta'}
            </button>
            {puedeEditar && ['BORRADOR', 'RECHAZADO'].includes(abierta.estado) && (
              <>
                <button onClick={continuarBorrador} className="px-2.5 py-1 rounded-lg bg-[#0B192C] text-white font-bold cursor-pointer inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                <button onClick={() => setModal('enviar')} className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold cursor-pointer inline-flex items-center gap-1"><Send size={12} /> Enviar a revisión</button>
                <button onClick={descartar} className="px-2 py-1 rounded-lg text-rose-700 hover:bg-rose-100 cursor-pointer" title="Descartar borrador"><Trash2 size={13} /></button>
              </>
            )}
            {puedeRevisar && <button onClick={() => setModal('revisar')} className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold cursor-pointer inline-flex items-center gap-1"><ShieldCheck size={12} /> Revisar</button>}
            {abierta.estado === 'EN_REVISION' && esAutor && <span className="text-[11px]">Espera la revisión de otro administrador.</span>}
            {puedeAprobar && <button onClick={() => setModal('publicar')} className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"><Check size={12} /> Aprobar y publicar</button>}
            {abierta.estado === 'REVISADO' && !puedeAprobar && <span className="text-[11px]">Pendiente de la Dirección General.</span>}
          </span>
        </div>
      )}

      {modo === 'edicion' && borrador ? (
        <>
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs">
            <Pencil size={14} className="text-slate-600" />
            <span className="font-bold text-slate-800">Editando borrador Rev. {abierta?.numero ?? '—'}</span>
            <span className="ml-auto flex items-center gap-1.5">
              <button onClick={() => { setModo('lectura'); setBorrador(null); }} className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold cursor-pointer inline-flex items-center gap-1"><ChevronLeft size={12} /> Salir sin guardar</button>
              <button onClick={() => guardarBorrador(true)} disabled={guardando} className="px-2.5 py-1 rounded-lg bg-[#0B192C] text-white font-bold cursor-pointer disabled:opacity-60">Guardar</button>
              <button onClick={() => guardarBorrador(false)} disabled={guardando} className="px-2.5 py-1 rounded-lg bg-slate-700 text-white font-bold cursor-pointer disabled:opacity-60">Guardar y cerrar</button>
            </span>
          </div>
          <Editor secciones={borrador} onChange={setBorrador} />
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          <Indice secciones={secMostrar} busqueda={busqueda} setBusqueda={setBusqueda} />
          <Lectura secciones={secMostrar} busqueda={busqueda} doc={doc} />
        </div>
      )}

      {/* Modales de flujo */}
      {modal === 'enviar' && (
        <ContenedorModal isOpen onClose={() => setModal(null)} titulo="Enviar a revisión" anchoMaximo="max-w-lg">
          <div className="space-y-3 text-xs">
            <p className="text-slate-700">Describe el motivo del cambio. Queda en el historial y lo verá quien revise (otro administrador) y después la Dirección General.</p>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={4} placeholder="Ej. Actualización de la cláusula 8.7 por hallazgo de auditoría interna 2026…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold cursor-pointer">Cancelar</button>
              <button onClick={enviar} disabled={motivo.trim().length < 10 || guardando} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"><Send size={12} /> Enviar</button>
            </div>
          </div>
        </ContenedorModal>
      )}
      {(modal === 'revisar' || modal === 'publicar') && (
        <ContenedorModal isOpen onClose={() => setModal(null)} titulo={modal === 'revisar' ? 'Revisión administrativa' : 'Aprobación de la Dirección General'} anchoMaximo="max-w-lg">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              <p><strong>Rev. {abierta?.numero}</strong> · Autor: {abierta?.autor_nombre}</p>
              <p className="mt-1"><strong>Motivo:</strong> {abierta?.motivo}</p>
              <p className="mt-1 text-slate-500">Usa "Ver propuesta" e "Historial → Ver cambios" para comparar antes de decidir.</p>
            </div>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3} placeholder="Comentario (obligatorio si rechazas)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20" />
            <div className="flex justify-end gap-2">
              <button onClick={() => (modal === 'revisar' ? revisar(false) : publicar(false))} disabled={comentario.trim().length < 5 || guardando}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"><X size={12} /> Rechazar</button>
              <button onClick={() => (modal === 'revisar' ? revisar(true) : publicar(true))} disabled={guardando}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"><Check size={12} /> {modal === 'revisar' ? 'Aprobar revisión' : 'Aprobar y publicar'}</button>
            </div>
          </div>
        </ContenedorModal>
      )}
      {modal === 'historial' && <Historial clave={clave} onClose={() => setModal(null)} />}

      {!vigente && <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2"><AlertCircle size={14} /> Este documento aún no tiene una revisión publicada.</div>}
    </div>
  );
}
