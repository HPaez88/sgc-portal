// Reportes de Corrección (RC): bitácora, filtros y dictamen. Se ve desde Acciones Correctivas y desde Indicadores;
// las dos pantallas leen y escriben la misma clave con useLocalStorage, así que siempre muestran lo mismo.
import React, { useMemo, useState } from 'react';
import { Edit3, FileWarning, Search, FilePlus2 } from 'lucide-react';
import ModalGestionarRC from '../indicadores/ModalGestionarRC';
import ModalNuevoRC from './ModalNuevoRC';
import BotonInformePDF from '../indicadores/BotonInformePDF';
import { exportarInformeIndicadoresPDF } from '../../services/indicadoresExporter';
import { useLocalStorage } from '../../hooks';
import { useSGC } from '../../SGCContext';
import { formatearFecha } from '../../constants/workflow';
import { CLAVE_RC, RC_ESTADOS, estadoRC, etiquetaRC, puedeCrearRCManual, puedeVerRC } from '../../constants/reportesCorreccion';
import Paginacion, { usePaginado } from '../common/Paginacion';

const SEMAFORO_PDF = { CERRADO_EFECTIVO: 'ACEPTABLE', EN_ATENCION: 'PREVENTIVO', CERRADO_NO_EFECTIVO: 'CRITICO', ESCALADO_A_AC: 'CRITICO' };
const FILTROS = [['TODOS', 'Todos los estados'], ...Object.entries(RC_ESTADOS).map(([k, v]) => [k, v.label])];

export default function ReportesCorreccionPanel({ usuarioLogueado }) {
  const { areasDetalle = [] } = useSGC();
  const [reportes, setReportes] = useLocalStorage(CLAVE_RC, []);
  const [filtro, setFiltro] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [rcAbierto, setRcAbierto] = useState(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  // Alcance por área: el área ve lo suyo; SGC, auditores y Director ven todo.
  const visibles = useMemo(() => (reportes || []).filter((r) => puedeVerRC(usuarioLogueado, r, areasDetalle)), [reportes, usuarioLogueado, areasDetalle]);
  const conteo = (estado) => visibles.filter((r) => estadoRC(r) === estado).length;
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return visibles
      .filter((r) => filtro === 'TODOS' || estadoRC(r) === filtro)
      .filter((r) => !q || [r.folio, r.responsable, r.area, r.descripcion].some((t) => String(t || '').toLowerCase().includes(q)))
      .sort((a, b) => String(b.fechaRegistro || '').localeCompare(String(a.fechaRegistro || '')));
  }, [visibles, filtro, busqueda]);

  const actualizar = (rep) => setReportes((prev) => {
    const l = prev || [];
    return l.some((r) => r.id === rep.id) ? l.map((r) => (r.id === rep.id ? rep : r)) : [rep, ...l];
  });

  const informePDF = () => exportarInformeIndicadoresPDF({
    titulo: 'BITÁCORA DE REPORTES DE CORRECCIÓN (RC)',
    subtitulo: 'Corrección de desviaciones en indicadores · ISO 9001:2015 § 10.2',
    resumen: [['Casos', visibles.length], ...Object.entries(RC_ESTADOS).map(([k, v]) => [v.label, conteo(k)])],
    secciones: [{
      titulo: 'Reportes registrados', head: ['Folio', 'Periodo', 'Área', 'Indicador', 'Desviación / causa', 'Corrección', 'Responsable', 'Compromiso', 'Estado'],
      body: lista.map((r) => [r.folio, `${r.mes || ''} ${r.ejercicio || ''}`.trim(), r.area || '', r.numeroIndicador ?? r.indicadorId ?? '', [r.descripcion, r.causa].filter(Boolean).join('\nCausa: '), r.accion || '', r.responsable || '', formatearFecha(r.fechaCompromiso) || '', etiquetaRC(r).label + (r.folio_ac_vinculado ? `\n${r.folio_ac_vinculado}` : '')]),
      semaforoCol: 8, semaforos: lista.map((r) => SEMAFORO_PDF[estadoRC(r)]),
      columnStyles: { 0: { cellWidth: 24 }, 3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 60 }, 5: { cellWidth: 50 } },
    }],
    leyenda: 'OOMAPAS de Cajeme · Bitácora de Reportes de Corrección',
  }, 'Bitacora_Reportes_de_Correccion');

  const pag = usePaginado(lista);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2"><FileWarning size={18} className="text-amber-600" /> Reportes de corrección <span className="text-sm font-bold text-slate-500">({visibles.length})</span></h3>
        <div className="flex gap-2">
          <BotonInformePDF onClick={informePDF} />
          {puedeCrearRCManual(usuarioLogueado) && <button type="button" onClick={() => setNuevoAbierto(true)} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><FilePlus2 size={14} /> Nuevo reporte</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(RC_ESTADOS).map(([k, v]) => (
          <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(filtro === k ? 'TODOS' : k)}
            className={`text-left p-3 rounded-xl border ${v.cls} ${filtro === k ? 'ring-2 ring-marca-azul' : ''}`}>
            <span className="text-[11px] font-bold uppercase block">{v.label}</span>
            <span className="text-2xl font-black font-mono block">{conteo(k)}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input type="search" placeholder="Buscar folio, responsable, área o descripción" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
          </label>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800">
            {FILTROS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs tablas-marcadas">
            <caption className="sr-only">Reportes de corrección</caption>
            <thead><tr>
              <th scope="col" className="p-2 text-left">Folio</th><th scope="col" className="p-2 text-left">Periodo</th><th scope="col" className="p-2 text-left">Área / responsable</th>
              <th scope="col" className="p-2 text-left">Desviación y causa</th><th scope="col" className="p-2 text-left">Compromiso</th><th scope="col" className="p-2 text-left">Estado</th><th scope="col" className="p-2 text-right">Acción</th>
            </tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Sin reportes con ese filtro.</td></tr>}
              {pag.visibles.map((rc) => {
                const et = etiquetaRC(rc);
                return (
                  <tr key={rc.id || rc.folio}>
                    <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">{rc.folio}{rc.numeroIndicador != null && <span className="block text-[10px] font-sans font-semibold text-slate-600">Indicador #{rc.numeroIndicador}</span>}</td>
                    <td className="p-2 whitespace-nowrap">{[rc.mes, rc.ejercicio].filter(Boolean).join(' ')}</td>
                    <td className="p-2"><span className="font-semibold text-slate-900 block">{rc.area || '—'}</span><span className="text-slate-600">{rc.responsable || 'Sin responsable'}</span></td>
                    <td className="p-2 max-w-md"><p className="text-slate-800 line-clamp-2">{rc.descripcion || '—'}</p>{rc.causa && <p className="text-slate-600 line-clamp-1">Causa: {rc.causa}</p>}{rc.folio_ac_vinculado && <span className="inline-block mt-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Ligado a {rc.folio_ac_vinculado}</span>}</td>
                    <td className="p-2 whitespace-nowrap">{formatearFecha(rc.fechaCompromiso) || '—'}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border inline-block whitespace-nowrap ${et.cls}`}>{et.label}</span></td>
                    <td className="p-2 text-right"><button type="button" onClick={() => setRcAbierto(rc)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-bold border border-slate-300 inline-flex items-center gap-1"><Edit3 size={12} /> Abrir</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3"><Paginacion pagina={pag.pagina} total={pag.total} porPagina={pag.porPagina} onCambiar={pag.setPagina} etiqueta="reportes" /></div>
      </div>

      {rcAbierto && <ModalGestionarRC isOpen reporte={(reportes || []).find((r) => r.id === rcAbierto.id) || rcAbierto} onClose={() => setRcAbierto(null)} onActualizarReporte={actualizar} usuarioLogueado={usuarioLogueado} />}
      {nuevoAbierto && <ModalNuevoRC reportes={reportes || []} onGuardar={actualizar} onClose={() => setNuevoAbierto(false)} />}
    </div>
  );
}
