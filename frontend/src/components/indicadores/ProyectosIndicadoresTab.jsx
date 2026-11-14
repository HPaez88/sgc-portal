// Setup anual de indicadores: proyectos por área (normalmente uno; se permiten varios), con sus fichas, PEMS y avance.
// Captura: encargado del área o SGC. Aprobación: administradores del SGC. Formatos oficiales: los genera el servidor.
import React, { useMemo, useState } from 'react';
import { FolderKanban, Plus, FileText, FileSpreadsheet, Send, CheckCircle2, Undo2, Save, X, Download, ClipboardList } from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import Dialogos, { useDialogos } from '../common/Dialogos';
import { esAdminSGC } from '../../constants/workflow';
import { puedeCapturarArea } from '../../constants/riesgos';
import { requestBlob, descargarBlob } from '../../services/apiClient';
import { getEstadoSync } from '../../services/estadoService';
import {
  CLAVE_PROYECTOS, ESTADOS_PROYECTO, PILOTO_INFORMATICA_2027, OBJETIVO_INSTITUCIONAL_OOMAPASC,
  nuevoProyecto, faltantesProyecto, totalesPresupuesto,
} from '../../constants/proyectosIndicadores';
import EditorProyecto from './EditorProyecto';
import { altasAlAprobar } from '../../constants/catalogoIndicadores';
import { obtenerDireccionDeArea } from '../../constants/areas';

const sinAvances = (p) => JSON.stringify({ ...p, actividades: (p.actividades || []).map(({ avances, ...a }) => a), historial: undefined, estado: undefined });
const pesos = (n) => `$${Math.round(n || 0).toLocaleString('es-MX')}`;

async function esperarSincronizacion(maxMs = 6000) {
  const inicio = Date.now();
  while (getEstadoSync().pendientes > 0 && Date.now() - inicio < maxMs) await new Promise((r) => setTimeout(r, 300));
  return getEstadoSync().pendientes === 0;
}

function Estado({ estado }) {
  const [t, cls] = ESTADOS_PROYECTO[estado] || ESTADOS_PROYECTO.BORRADOR;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls}`}>{t}</span>;
}

export default function ProyectosIndicadoresTab({ indicadoresCatalogo = [] }) {
  const { areasDetalle = [], usuarioLogueado, registrarMovimiento, indicadoresData = {}, setIndicadoresData } = useSGC();
  const toast = useToast();
  const { confirmar, solicitar, props: dialogos } = useDialogos();
  const esAdmin = esAdminSGC(usuarioLogueado);
  const [proyectos, setProyectos] = useLocalStorage(CLAVE_PROYECTOS, []);
  const hoy = new Date();
  // De octubre en adelante se prepara el año siguiente.
  const [anio, setAnio] = useState(hoy.getMonth() >= 9 ? hoy.getFullYear() + 1 : hoy.getFullYear());
  const [filtroArea, setFiltroArea] = useState('');
  const [borrador, setBorrador] = useState(null);
  const [nuevaArea, setNuevaArea] = useState('');
  const [descargando, setDescargando] = useState('');

  const areas = useMemo(() => areasDetalle.map((a) => a.nombre).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es')), [areasDetalle]);
  const misAreas = areas.filter((a) => puedeCapturarArea(usuarioLogueado, a, areasDetalle, esAdmin));
  const lista = (proyectos || []).filter((p) => p.anio === anio && (!filtroArea || p.area === filtroArea) && (esAdmin || misAreas.includes(p.area)));
  const original = borrador && (proyectos || []).find((p) => p.id === borrador.id);
  const cambios = borrador && (!original || JSON.stringify(original) !== JSON.stringify(borrador));
  const puedeEditar = borrador && puedeCapturarArea(usuarioLogueado, borrador.area, areasDetalle, esAdmin) && (esAdmin || borrador.estado !== 'EN_REVISION');
  const sinAreas = areas.filter((a) => !(proyectos || []).some((p) => p.anio === anio && p.area === a));

  const nota = (p, texto) => ({ ...p, historial: [...(p.historial || []), { fecha: new Date().toISOString(), usuario: usuarioLogueado?.nombre || usuarioLogueado?.email || '', texto }] });
  const bitacora = (accion, p, descripcion) => registrarMovimiento?.({ modulo: 'Indicadores', accion, descripcion, folio: `${p.area} ${p.anio}` });

  const guardar = (p = borrador) => {
    let final = p;
    // Cambios de un encargado a un proyecto ya aprobado regresan a revisión del SGC (los avances no).
    if (!esAdmin && original?.estado === 'APROBADO' && sinAvances(original) !== sinAvances(p)) {
      final = nota({ ...p, estado: 'EN_REVISION' }, 'Modificó el proyecto aprobado; pasa a revisión del SGC.');
      toast.info('El proyecto estaba aprobado: tus cambios pasan a revisión del SGC.');
    }
    setProyectos((prev) => (prev.some((x) => x.id === final.id) ? prev.map((x) => (x.id === final.id ? final : x)) : [...prev, final]));
    setBorrador(final);
    bitacora('GUARDAR_PROYECTO', final, `Guardó el proyecto "${final.nombre || 'sin nombre'}"`);
    return final;
  };

  const crear = (area) => {
    const ultimo = (proyectos || []).filter((p) => p.area === area).sort((a, b) => b.anio - a.anio)[0];
    const dg = (proyectos || []).find((p) => p.firmas?.director_general?.nombre)?.firmas?.director_general;
    setBorrador(nuevoProyecto(anio, area, {
      dependencia: ultimo?.dependencia || 'OOMAPAS DE CAJEME', eje_rector: ultimo?.eje_rector, director_general: dg,
      objetivo_institucional: ultimo?.objetivo_institucional || OBJETIVO_INSTITUCIONAL_OOMAPASC, pems: ultimo?.pems,
    }));
  };

  const cargarPiloto = () => {
    setBorrador({ ...PILOTO_INFORMATICA_2027, id: `proy-${Date.now()}`, historial: [],
      actividades: PILOTO_INFORMATICA_2027.actividades.map((a, i) => ({ ...a, id: `act-piloto-${i}`, indicador_id: '', avances: {} })) });
    setAnio(2027);
  };

  const cambiarEstado = async (estado) => {
    if (estado === 'EN_REVISION') {
      const f = faltantesProyecto(borrador);
      if (f.length) return toast.error(`Falta: ${f.slice(0, 4).join(' · ')}${f.length > 4 ? '…' : ''}`);
    }
    let texto = { EN_REVISION: 'Envió el proyecto a revisión del SGC.', APROBADO: 'Aprobó el proyecto.' }[estado];
    if (estado === 'BORRADOR') {
      const { ok, valor } = await solicitar({ titulo: 'Devolver al área', etiqueta: 'Observaciones para el área' });
      if (!ok || !valor.trim()) return;
      texto = `Devolvió con observaciones: ${valor.trim()}`;
    } else if (estado === 'APROBADO') {
      const { ok } = await confirmar({ titulo: 'Aprobar proyecto', mensaje: `Se aprueba el proyecto de ${borrador.area} ${borrador.anio}. Sus indicadores quedan como metas del año.` });
      if (!ok) return;
    }
    let base = borrador;
    if (estado === 'APROBADO') {
      // Los indicadores del proyecto quedan en el Cuadro de Control: los nuevos se dan de alta; los ligados toman metas del proyecto.
      const { actividades, nuevos } = altasAlAprobar(borrador, indicadoresCatalogo, obtenerDireccionDeArea);
      if (Object.keys(nuevos).length) {
        setIndicadoresData((prev) => ({ ...prev, catalogoPersonalizado: { ...(prev?.catalogoPersonalizado || {}), ...nuevos }, updatedAt: new Date().toISOString() }));
        texto += ` Alta en el Cuadro de Control: ${Object.values(nuevos).map((n) => `#${n.id}`).join(', ')}.`;
      }
      base = { ...borrador, actividades };
    }
    const p = guardar(nota({ ...base, estado }, texto));
    bitacora(`PROYECTO_${estado}`, p, texto);
    toast.success(texto);
  };

  const descargar = async (tipo, actividad = 0) => {
    if (cambios) return toast.error('Guarda los cambios antes de descargar.');
    setDescargando(`${tipo}-${actividad}`);
    if (!(await esperarSincronizacion())) {
      setDescargando('');
      return toast.error('Aún no se sincroniza con el servidor. Intenta en unos segundos.');
    }
    const r = await requestBlob(`/api/v1/indicadores/formatos/${encodeURIComponent(borrador.id)}/${tipo}?actividad=${actividad}`);
    setDescargando('');
    if (!r.ok) return toast.error(r.error?.message || 'No se pudo generar el formato.');
    const base = `${borrador.anio} ${borrador.area}`;
    descargarBlob(r.blob, { proyecto: `Formato de Presentación de Proyectos ${base}.docx`, pems: `PEMS ${base}.xlsx`,
      ficha: `${actividad + 1}- Ficha técnica de indicador ${base}.docx` }[tipo]);
  };

  const cerrar = async () => {
    if (cambios) {
      const { ok } = await confirmar({ titulo: 'Cambios sin guardar', mensaje: 'Se perderán los cambios que no guardaste.' });
      if (!ok) return;
    }
    setBorrador(null);
  };

  if (borrador) {
    const BotonDescarga = ({ tipo, actividad = 0, children, Icono }) => (
      <button type="button" disabled={Boolean(descargando)} onClick={() => descargar(tipo, actividad)}
        className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5">
        <Icono size={14} /> {descargando === `${tipo}-${actividad}` ? 'Generando…' : children}
      </button>
    );
    const ultimaNota = (borrador.historial || []).slice(-1)[0];
    return (
      <div className="space-y-3">
        <Dialogos {...dialogos} />
        <header className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-marca-azul-oscuro">Proyecto {borrador.anio} · {borrador.area}</p>
            <h3 className="text-base font-extrabold text-slate-900">{borrador.nombre || 'Proyecto sin nombre'}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1"><Estado estado={borrador.estado} />
              {ultimaNota && <span className="text-[11px] text-slate-600">{ultimaNota.texto} — {ultimaNota.usuario}</span>}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeEditar && <button type="button" disabled={!cambios} onClick={() => { guardar(); toast.success('Proyecto guardado.'); }} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-40 inline-flex items-center gap-1.5"><Save size={14} /> Guardar</button>}
            {puedeEditar && borrador.estado === 'BORRADOR' && <button type="button" onClick={() => cambiarEstado('EN_REVISION')} className="px-3 py-1.5 text-xs font-bold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50 inline-flex items-center gap-1.5"><Send size={14} /> Enviar a revisión SGC</button>}
            {esAdmin && borrador.estado !== 'APROBADO' && <button type="button" onClick={() => cambiarEstado('APROBADO')} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> Aprobar</button>}
            {esAdmin && borrador.estado !== 'BORRADOR' && original && <button type="button" onClick={() => cambiarEstado('BORRADOR')} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><Undo2 size={14} /> Devolver al área</button>}
            <button type="button" onClick={cerrar} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><X size={14} /> Cerrar</button>
          </div>
        </header>
        {original && (
          <section aria-label="Formatos oficiales" className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 mr-1"><Download size={14} /> Formatos oficiales:</span>
            <BotonDescarga tipo="proyecto" Icono={FileText}>Presentación de proyecto</BotonDescarga>
            <BotonDescarga tipo="pems" Icono={FileSpreadsheet}>PEMS (PEM-1 y PEM-2)</BotonDescarga>
            {(borrador.actividades || []).map((a, i) => <BotonDescarga key={a.id || i} tipo="ficha" actividad={i} Icono={ClipboardList}>Ficha {i + 1}</BotonDescarga>)}
          </section>
        )}
        <EditorProyecto proyecto={borrador} onCambio={setBorrador} editable={Boolean(puedeEditar)} indicadoresCatalogo={indicadoresCatalogo} resultados={indicadoresData.resultados || {}} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Dialogos {...dialogos} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><FolderKanban size={20} className="text-marca-azul-oscuro" /> Proyectos y fichas <span className="text-sm font-bold text-slate-500">({lista.length})</span></h3>
          <p className="text-sm text-slate-600">Setup anual: el proyecto de cada área genera su Formato de Presentación, fichas técnicas y PEMS, y registra el avance trimestral.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-slate-800">Año
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="block mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white">
              {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1, hoy.getFullYear() + 2].map((a) => <option key={a}>{a}</option>)}
            </select></label>
          {esAdmin && <label className="text-xs font-bold text-slate-800">Área
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="block mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white max-w-[220px]">
              <option value="">Todas</option>{areas.map((a) => <option key={a}>{a}</option>)}
            </select></label>}
        </div>
      </header>

      {misAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-slate-800">Nuevo proyecto {anio} para
            <select value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value)} className="block mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white max-w-[260px]">
              <option value="">Elige el área…</option>{misAreas.map((a) => <option key={a}>{a}</option>)}
            </select></label>
          <button type="button" disabled={!nuevaArea} onClick={() => crear(nuevaArea)} className="px-3 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-40 inline-flex items-center gap-1.5"><Plus size={14} /> Crear</button>
          {esAdmin && anio === 2027 && !(proyectos || []).some((p) => p.anio === 2027 && /inform/i.test(p.area)) && (
            <button type="button" onClick={cargarPiloto} className="px-3 py-2 text-xs font-semibold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50">Cargar piloto: Informática 2027</button>
          )}
          {esAdmin && <span className="text-xs text-slate-600 ml-auto">{sinAreas.length} área(s) sin proyecto {anio}</span>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs tablas-marcadas">
          <caption className="sr-only">Proyectos del año {anio}</caption>
          <thead><tr>
            <th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Proyecto</th><th scope="col" className="p-2 text-left">Estado</th>
            <th scope="col" className="p-2 text-right">Actividades</th><th scope="col" className="p-2 text-right">Presupuesto</th><th scope="col" className="p-2 text-right">Acción</th>
          </tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay proyectos {anio}{filtroArea ? ` de ${filtroArea}` : ''}.</td></tr>}
            {lista.sort((a, b) => a.area.localeCompare(b.area, 'es')).map((p) => (
              <tr key={p.id}>
                <td className="p-2 font-semibold text-slate-900">{p.area}</td>
                <td className="p-2 text-slate-800">{p.nombre || '—'}</td>
                <td className="p-2"><Estado estado={p.estado} /></td>
                <td className="p-2 text-right">{(p.actividades || []).length}</td>
                <td className="p-2 text-right whitespace-nowrap">{pesos(totalesPresupuesto(p.presupuesto).anual)}</td>
                <td className="p-2 text-right"><button type="button" onClick={() => setBorrador(p)} className="px-2.5 py-1 rounded-md font-bold text-marca-azul-oscuro bg-sky-50 hover:bg-sky-100">Abrir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
