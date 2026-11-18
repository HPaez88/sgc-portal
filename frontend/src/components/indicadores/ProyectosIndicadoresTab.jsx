// Setup anual de indicadores: proyectos por área (normalmente uno; se permiten varios), con sus fichas, PEMS y avance.
// Captura: encargado del área o SGC. Aprobación: administradores del SGC. Formatos oficiales: los genera el servidor.
import React, { useMemo, useState } from 'react';
import { LISTA_FILTRO } from '../common/estilosCampos';
import { FolderKanban, Plus, RefreshCw, Lock, FileText, FileSpreadsheet, Send, CheckCircle2, Undo2, Save, Download, ClipboardList } from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import { useSGC } from '../../SGCContext';
import { normalizarDireccion } from '../../constants/areas';
import { useToast } from '../common/Toast';
import Dialogos, { useDialogos } from '../common/Dialogos';
import ModalBase from '../common/ModalBase';
import { esAdminSGC } from '../../constants/workflow';
import { puedeCapturarArea } from '../../constants/riesgos';
import { descargarFormatoOficial } from '../../services/formatosOficiales';
import {
  CLAVE_PROYECTOS, ESTADOS_PROYECTO, PILOTO_INFORMATICA_2027, OBJETIVO_INSTITUCIONAL_OOMAPASC,
  nuevoProyecto, faltantesProyecto, totalesPresupuesto, CAPITULOS, TRIMESTRES, renovarProyecto, esTemporadaRenovacion,
} from '../../constants/proyectosIndicadores';
import BotonInformePDF from './BotonInformePDF';
import { exportarInformeIndicadoresPDF } from '../../services/indicadoresExporter';
import EditorProyecto from './EditorProyecto';
import { altasAlAprobar } from '../../constants/catalogoIndicadores';
import { obtenerDireccionDeArea } from '../../constants/areas';

const sinAvances = (p) => JSON.stringify({ ...p, actividades: (p.actividades || []).map(({ avances, ...a }) => a), historial: undefined, estado: undefined });
const pesos = (n) => `$${Math.round(n || 0).toLocaleString('es-MX')}`;

// Informe PDF institucional de uno o varios proyectos (lista del año o el proyecto abierto).
function informeProyectosPDF(lista, anio) {
  const uno = lista.length === 1 ? lista[0] : null;
  const filasActs = lista.flatMap((p) => (p.actividades || []).map((a, i) => [lista.length > 1 ? p.area : i + 1, a.actividad, a.indicador, a.unidad, a.meta, ...(a.trimestres || ['', '', '', '']), a.ponderado ? `${a.ponderado}%` : '', a.impacto === 'Alto' ? 'Alto (AC)' : 'Bajo (RC)']));
  const filasAvance = lista.flatMap((p) => (p.actividades || []).map((a, i) => [lista.length > 1 ? p.area : i + 1, a.actividad, ...TRIMESTRES.map((t, k) => {
    const real = a.avances?.[t]?.avance;
    return real === undefined || real === '' ? `Meta ${a.trimestres?.[k] ?? ''}` : `${real} de ${a.trimestres?.[k] ?? ''}`;
  })]));
  const secciones = [];
  if (!uno) {
    secciones.push({ titulo: '1. Proyectos del año', head: ['Área', 'Proyecto', 'Estado', 'Actividades', 'Presupuesto anual'],
      body: lista.map((p) => [p.area, p.nombre || '', ESTADOS_PROYECTO[p.estado]?.[0] || p.estado, (p.actividades || []).length, pesos(totalesPresupuesto(p.presupuesto).anual)]),
      columnStyles: { 1: { cellWidth: 110 }, 4: { halign: 'right' } } });
  } else {
    secciones.push({ titulo: '1. Datos del proyecto', head: ['Dato', 'Contenido'], body: [
      ['Unidad responsable', uno.unidad_responsable || uno.area], ['Eje rector PMD', uno.eje_rector || ''], ['Programa PMD', uno.programa_pmd || ''], ['Programa presupuestario', uno.programa_presupuestario || ''], ['Resumen ejecutivo', uno.resumen || ''],
      ['Objetivo', uno.objetivo || ''], ['Justificación', uno.justificacion || ''], ['Estado', ESTADOS_PROYECTO[uno.estado]?.[0] || uno.estado],
    ].filter(([, v]) => v), columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } } });
  }
  const n = secciones.length;
  secciones.push({ titulo: `${n + 1}. Actividades, indicadores y metas`, head: [uno ? 'No.' : 'Área', 'Actividad', 'Indicador', 'Unidad', 'Meta', 'T1', 'T2', 'T3', 'T4', 'Ponderado', 'Impacto'], body: filasActs,
    columnStyles: { 0: { cellWidth: uno ? 10 : 30 }, 1: { cellWidth: 60 }, 2: { cellWidth: 55 } } });
  if (uno) {
    const t = totalesPresupuesto(uno.presupuesto);
    secciones.push({ titulo: `${n + 2}. Presupuesto por capítulo`, head: ['Capítulo', 'T1', 'T2', 'T3', 'T4', 'Anual'],
      body: [...CAPITULOS.map(([c, nom]) => { const v = (uno.presupuesto?.[c] || []).map((x) => Number(String(x).replace(/[$,\s]/g, '')) || 0); return [`${c} ${nom}`, ...[0, 1, 2, 3].map((i) => pesos(v[i])), pesos(v.reduce((a, b) => a + b, 0))]; }),
        [{ content: 'Total', styles: { fontStyle: 'bold' } }, ...t.trimestres.map((x) => ({ content: pesos(x), styles: { fontStyle: 'bold' } })), { content: pesos(t.anual), styles: { fontStyle: 'bold' } }]],
      columnStyles: { 0: { cellWidth: 95 }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } } });
  }
  secciones.push({ titulo: `${secciones.length + 1}. Avance trimestral (PEMS): avance real de la meta del trimestre`, head: [uno ? 'No.' : 'Área', 'Actividad', ...TRIMESTRES], body: filasAvance,
    columnStyles: { 0: { cellWidth: uno ? 10 : 30 }, 1: { cellWidth: 100 } } });
  exportarInformeIndicadoresPDF({
    titulo: uno ? `PROYECTO ${anio} · ${uno.area}`.toUpperCase() : `PROYECTOS ANUALES ${anio}`,
    subtitulo: uno ? (uno.nombre || '') : 'Proyectos, actividades, indicadores, metas y presupuesto por área',
    derecha: [`Ejercicio ${anio}`],
    resumen: uno ? [] : [['Proyectos', lista.length], ['Aprobados', lista.filter((p) => p.estado === 'APROBADO').length], ['Actividades', filasActs.length], ['Presupuesto total', pesos(lista.reduce((s, p) => s + totalesPresupuesto(p.presupuesto).anual, 0))]],
    secciones,
    leyenda: `OOMAPAS de Cajeme · ${uno ? `Proyecto ${anio} ${uno.area}` : `Proyectos anuales ${anio}`}`,
  }, uno ? `Proyecto_${anio}_${uno.area}` : `Proyectos_${anio}`);
}


function Estado({ estado }) {
  const [t, cls] = ESTADOS_PROYECTO[estado] || ESTADOS_PROYECTO.BORRADOR;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls}`}>{t}</span>;
}

export default function ProyectosIndicadoresTab({ indicadoresCatalogo = [] }) {
  const { areasDetalle = [], direccionesDetalle = [], usuarioLogueado, registrarMovimiento, indicadoresData = {}, setIndicadoresData } = useSGC();
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
  const puedeArea = borrador && puedeCapturarArea(usuarioLogueado, borrador.area, areasDetalle, esAdmin);
  // Una vez aceptado, el proyecto se cierra para el área: solo el SGC edita o lo vuelve a abrir. El avance trimestral sí se captura.
  const puedeEditar = puedeArea && (esAdmin || borrador.estado === 'BORRADOR');
  const soloAvances = borrador && original && sinAvances(original) === sinAvances(borrador);
  const sinAreas = areas.filter((a) => !(proyectos || []).some((p) => p.anio === anio && p.area === a));

  const nota = (p, texto) => ({ ...p, historial: [...(p.historial || []), { fecha: new Date().toISOString(), usuario: usuarioLogueado?.nombre || usuarioLogueado?.email || '', texto }] });
  const bitacora = (accion, p, descripcion) => registrarMovimiento?.({ modulo: 'Indicadores', accion, descripcion, folio: `${p.area} ${p.anio}` });

  const guardar = (p = borrador) => {
    const final = p;
    if (!esAdmin && original && original.estado !== 'BORRADOR' && sinAvances(original) !== sinAvances(p)) {
      toast.error('El proyecto ya fue aceptado: solo el SGC puede abrirlo para modificarlo.');
      return original;
    }
    setProyectos((prev) => (prev.some((x) => x.id === final.id) ? prev.map((x) => (x.id === final.id ? final : x)) : [...prev, final]));
    setBorrador(final);
    bitacora('GUARDAR_PROYECTO', final, `Guardó el proyecto "${final.nombre || 'sin nombre'}"`);
    return final;
  };

  // Temporada de renovación (octubre–diciembre): proyectos aceptados del año en curso que aún no tienen versión para el siguiente.
  const anioSiguiente = hoy.getFullYear() + 1;
  const porRenovar = esTemporadaRenovacion(hoy)
    ? (proyectos || []).filter((p) => p.anio === hoy.getFullYear() && p.estado === 'APROBADO' && misAreas.includes(p.area)
        && !(proyectos || []).some((x) => x.anio === anioSiguiente && x.area === p.area))
    : [];
  const renovar = async (p, sinCambios) => {
    const nuevo = renovarProyecto(p, anioSiguiente, usuarioLogueado?.nombre || usuarioLogueado?.email || '');
    if (sinCambios) {
      const { ok } = await confirmar({ titulo: `Confirmar proyecto ${anioSiguiente}`, mensaje: `${p.area} seguirá en ${anioSiguiente} con el mismo proyecto, actividades, indicadores y metas de ${p.anio}. Se envía a aceptación del SGC.` });
      if (!ok) return;
      const listo = nota({ ...nuevo, estado: 'EN_REVISION' }, `Confirmó sin cambios para ${anioSiguiente}; enviado a aceptación del SGC.`);
      setProyectos((prev) => [...prev, listo]);
      bitacora('PROYECTO_RENOVADO', listo, `Confirmó sin cambios el proyecto ${anioSiguiente}`);
      toast.success(`Proyecto ${anioSiguiente} de ${p.area} enviado a aceptación.`);
      return;
    }
    setAnio(anioSiguiente);
    setBorrador(nuevo);
    toast.info(`Copia del proyecto ${p.anio} lista para actualizar. Guarda y envía a revisión cuando termines.`);
  };

  const crear = (area) => {
    const ultimo = (proyectos || []).filter((p) => p.area === area).sort((a, b) => b.anio - a.anio)[0];
    const dg = (proyectos || []).find((p) => p.firmas?.director_general?.nombre)?.firmas?.director_general;
    // Lo que ya está en los catálogos se toma de ahí: titular (encargado del área) y director de su dirección.
    const ficha = areasDetalle.find((x) => x.nombre === area);
    const dir = direccionesDetalle.find((d) => normalizarDireccion(d.nombre) === normalizarDireccion(ficha?.direccion || ''));
    const dgCatalogo = direccionesDetalle.find((d) => normalizarDireccion(d.nombre) === normalizarDireccion('Dir. General'))?.director;
    const nuevo = nuevoProyecto(anio, area, {
      dependencia: ultimo?.dependencia || 'OOMAPAS DE CAJEME', eje_rector: ultimo?.eje_rector,
      director_general: dg || (dgCatalogo ? { nombre: dgCatalogo.toUpperCase(), cargo: 'DIRECTOR GENERAL' } : undefined),
      objetivo_institucional: ultimo?.objetivo_institucional || OBJETIVO_INSTITUCIONAL_OOMAPASC, pems: ultimo?.pems,
    });
    setBorrador({
      ...nuevo,
      titular: { nombre: (ficha?.encargado || '').trim().toUpperCase(), cargo: ultimo?.titular?.cargo || '' },
      firmas: { ...nuevo.firmas, director_area: ultimo?.firmas?.director_area?.nombre ? ultimo.firmas.director_area : { nombre: (dir?.director || '').toUpperCase(), cargo: '' } },
    });
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
      const abrir = borrador.estado === 'APROBADO';
      const { ok, valor } = await solicitar({ titulo: abrir ? 'Abrir proyecto aceptado' : 'Devolver al área', etiqueta: abrir ? 'Motivo de la apertura (el área podrá modificar y volverá a pasar por aceptación)' : 'Observaciones para el área' });
      if (!ok || !valor.trim()) return;
      texto = abrir ? `Abrió el proyecto aceptado para modificación: ${valor.trim()}` : `Devolvió con observaciones: ${valor.trim()}`;
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

  const descargar = async (tipo, actividad, formato) => {
    if (cambios) return toast.error('Guarda los cambios antes de descargar.');
    setDescargando(`${tipo}-${actividad}-${formato}`);
    const error = await descargarFormatoOficial(borrador, tipo, { actividad, formato });
    setDescargando('');
    if (error) toast.error(error);
  };

  const cerrar = async () => {
    if (cambios) {
      const { ok } = await confirmar({ titulo: 'Cambios sin guardar', mensaje: 'Se perderán los cambios que no guardaste.' });
      if (!ok) return;
    }
    setBorrador(null);
  };

  let ventanaProyecto = null;
  if (borrador) {
    // Formato oficial: se descarga en su archivo original (Word/Excel) o en PDF; el diseño no se toca.
    const COLOR_ARCHIVO = { Word: 'bg-blue-700 hover:bg-blue-800', Excel: 'bg-emerald-700 hover:bg-emerald-800', PDF: 'bg-rose-700 hover:bg-rose-800' };
    const FilaDescarga = ({ tipo, actividad = 0, titulo, detalle, Icono }) => (
      <tr>
        <th scope="row" className="p-2 text-left align-top"><span className="inline-flex items-center gap-1.5 font-bold text-slate-900"><Icono size={15} /> {titulo}</span></th>
        <td className="p-2 text-slate-700 align-top">{detalle}</td>
        <td className="p-2 align-top whitespace-nowrap text-right">
          {[['original', tipo === 'pems' ? 'Excel' : 'Word'], ['pdf', 'PDF']].map(([formato, etiqueta]) => (
            <button key={formato} type="button" disabled={Boolean(descargando)} onClick={() => descargar(tipo, actividad, formato)}
              className={`ml-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white disabled:opacity-50 inline-flex items-center gap-1 ${COLOR_ARCHIVO[etiqueta]}`}>
              <Download size={13} /> {descargando === `${tipo}-${actividad}-${formato}` ? 'Generando…' : etiqueta}
            </button>
          ))}
        </td>
      </tr>
    );
    const ultimaNota = (borrador.historial || []).slice(-1)[0];
    ventanaProyecto = (
      <ModalBase isOpen onClose={cerrar} size="4xl" closeOnBackdrop={false} closeOnEscape={false} icono={<FolderKanban size={20} />} bodyClassName="p-4 space-y-3 bg-slate-50"
        titulo={borrador.nombre || 'Proyecto sin nombre'} subtitulo={`Proyecto ${borrador.anio} · ${borrador.area}`}>
        <header className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><Estado estado={borrador.estado} />
              {ultimaNota && <span className="text-[11px] text-slate-600">{ultimaNota.texto} — {ultimaNota.usuario}</span>}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(puedeEditar || (puedeArea && soloAvances)) && <button type="button" disabled={!cambios} onClick={() => { guardar(); toast.success('Proyecto guardado.'); }} className="px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg disabled:opacity-40 inline-flex items-center gap-1.5"><Save size={14} /> Guardar</button>}
            {puedeEditar && borrador.estado === 'BORRADOR' && <button type="button" onClick={() => cambiarEstado('EN_REVISION')} className="px-3 py-1.5 text-xs font-bold text-marca-azul-oscuro border border-marca-azul-oscuro/40 rounded-lg hover:bg-sky-50 inline-flex items-center gap-1.5"><Send size={14} /> Enviar a revisión SGC</button>}
            {esAdmin && borrador.estado !== 'APROBADO' && <button type="button" onClick={() => cambiarEstado('APROBADO')} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> Aprobar</button>}
            {esAdmin && borrador.estado !== 'BORRADOR' && original && <button type="button" onClick={() => cambiarEstado('BORRADOR')} className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><Undo2 size={14} /> {borrador.estado === 'APROBADO' ? 'Abrir para que el área modifique' : 'Devolver al área'}</button>}
            <BotonInformePDF onClick={() => informeProyectosPDF([borrador], borrador.anio)} />
          </div>
        </header>
        {original && !puedeEditar && puedeArea && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 inline-flex items-center gap-2"><Lock size={14} /> Proyecto {borrador.estado === 'APROBADO' ? 'aceptado' : 'en revisión'}: la información está cerrada. Solo puedes capturar el avance trimestral. Para modificarlo, pide al SGC que lo abra.</p>
        )}
        {original && (
          <details className="group bg-white rounded-xl border border-slate-300 overflow-hidden">
            <summary className="cursor-pointer list-none px-4 py-2.5 bg-slate-700 text-white flex flex-wrap items-center justify-between gap-2 hover:bg-slate-800">
              <span className="text-sm font-extrabold inline-flex items-center gap-2"><Download size={16} /> Descargar formatos oficiales del Ayuntamiento ({2 + (borrador.actividades || []).length})</span>
              <span className="text-xs font-semibold text-white/85"><span className="group-open:hidden">Mostrar ▾</span><span className="hidden group-open:inline">Ocultar ▴</span></span>
            </summary>
            <p className="px-4 pt-2 text-xs text-slate-600">Se descargan ya llenos con lo capturado, en el diseño original sin modificar. Aquí solo se descarga; para llenar, usa las secciones de abajo.</p>
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-sm tablas-marcadas">
                <caption className="sr-only">Formatos oficiales para descargar</caption>
                <thead><tr><th scope="col" className="p-2 text-left">Formato</th><th scope="col" className="p-2 text-left">Qué contiene</th><th scope="col" className="p-2 text-right">Descargar</th></tr></thead>
                <tbody>
                  <FilaDescarga tipo="proyecto" Icono={FileText} titulo="Presentación de proyecto" detalle="Datos del proyecto, actividades, metas, presupuesto y firmas (secciones 1, 2, 4 y 6)." />
                  <FilaDescarga tipo="pems" Icono={FileSpreadsheet} titulo="PEMS (PEM-1 y PEM-2)" detalle="Claves del programa de egresos y avance por actividad (secciones 4 y 5)." />
                  {(borrador.actividades || []).map((a, i) => (
                    <FilaDescarga key={a.id || i} tipo="ficha" actividad={i} Icono={ClipboardList} titulo={`Ficha técnica ${i + 1}`} detalle={a.indicador || 'Indicador sin nombre'} />
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        <EditorProyecto proyecto={borrador} onCambio={setBorrador} editable={Boolean(puedeEditar)} editableAvance={Boolean(puedeArea)} resultados={indicadoresData.resultados || {}} />
      </ModalBase>
    );
  }

  return (
    <div className="space-y-4">
      {ventanaProyecto}
      <Dialogos {...dialogos} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><FolderKanban size={20} className="text-marca-azul-oscuro" /> Proyecto anual por área <span className="text-sm font-bold text-slate-500">({lista.length})</span></h3>
          <p className="text-sm text-slate-600">Se captura una sola vez: el proyecto aprobado de cada área da de alta sus indicadores en el Cuadro de Control y genera el Formato de Presentación, las fichas técnicas y el PEMS.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <BotonInformePDF onClick={() => informeProyectosPDF([...lista].sort((a, b) => a.area.localeCompare(b.area, 'es')), anio)} />
          <label className="text-xs font-bold text-slate-800">Año
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className={`${LISTA_FILTRO} block mt-1`}>
              {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1, hoy.getFullYear() + 2].map((a) => <option key={a}>{a}</option>)}
            </select></label>
          {esAdmin && <label className="text-xs font-bold text-slate-800">Área
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className={`${LISTA_FILTRO} block mt-1 max-w-[220px]`}>
              <option value="">Todas</option>{areas.map((a) => <option key={a}>{a}</option>)}
            </select></label>}
        </div>
      </header>

      {porRenovar.length > 0 && (
        <section aria-label="Renovación anual" className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
          <h4 className="text-sm font-extrabold text-amber-950 inline-flex items-center gap-2"><RefreshCw size={16} /> Confirmación de proyectos {anioSiguiente}</h4>
          <p className="text-xs text-amber-900">¿Seguirán en {anioSiguiente} con los mismos proyectos, actividades e indicadores, o se actualiza algo? Una vez aceptado por el SGC, el proyecto se cierra para modificaciones.</p>
          <table className="w-full text-xs tablas-marcadas bg-white rounded-lg overflow-hidden">
            <thead><tr><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Proyecto {hoy.getFullYear()}</th><th scope="col" className="p-2 text-right">Decisión para {anioSiguiente}</th></tr></thead>
            <tbody>
              {porRenovar.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 font-semibold text-slate-900">{p.area}</td>
                  <td className="p-2 text-slate-800">{p.nombre}</td>
                  <td className="p-2 text-right whitespace-nowrap space-x-2">
                    <button type="button" onClick={() => renovar(p, true)} className="px-2.5 py-1 rounded-md font-bold text-white bg-emerald-700 hover:opacity-90">Sigue igual</button>
                    <button type="button" onClick={() => renovar(p, false)} className="px-2.5 py-1 rounded-md font-bold text-marca-azul-oscuro bg-sky-50 hover:bg-sky-100 border border-marca-azul-oscuro/30">Actualizar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {misAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-slate-800">Nuevo proyecto {anio} para
            <select value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value)} className={`${LISTA_FILTRO} block mt-1 max-w-[260px]`}>
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
