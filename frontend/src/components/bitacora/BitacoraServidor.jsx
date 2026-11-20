// Registro del servidor: cada cambio de datos guardado (quién, cuándo, sección y registros). Solo el Super Admin.
// No depende de que la pantalla lo anote: lo genera el servidor al guardar y no se puede editar ni borrar.
// Se consulta apilado: días del mes en curso, meses cerrados del año y años anteriores; cada periodo, paginado.
import React, { useEffect, useState } from 'react';
import { ServerCog, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../../services/apiClient';
import { formatearFecha } from '../../constants/workflow';
import { LISTA_FILTRO } from '../common/estilosCampos';
import Paginacion from '../common/Paginacion';

const SECCIONES = {
  'sgc-acciones-correctivas': 'Acciones correctivas', 'sgc-planes-mejora': 'Planes de mejora', 'sgc-riesgos': 'Riesgos y oportunidades',
  'sgc-matrices-riesgos': 'Matrices de riesgos', 'sgc-indicadores-data': 'Indicadores', 'sgc-config-areas-detalle': 'Catálogo de áreas',
  'sgc-config-direcciones-detalle': 'Catálogo de direcciones', 'sgc-reportes-correccion': 'Reportes de corrección', 'sgc-config-folios': 'Folios',
  'sgc-sintesis-organismo': 'Síntesis del organismo', 'sgc-documentos': 'Control documental',
  'sgc-config-avisos-admin': 'Avisos por correo (temas)', 'sgc-config-avisos-parametros': 'Avisos por correo (plazos)',
};
const POR_PAGINA = 25;
const nombreSeccion = (c) => SECCIONES[c] || c.replace(/^sgc-/, '').replace(/-/g, ' ');
const hora = (iso) => (iso ? `${formatearFecha(iso)} ${new Date(`${iso}Z`).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : '');
const ESTILO_GRUPO = { dia: 'bg-white', mes: 'bg-slate-50', anio: 'bg-slate-100' };
const TIPO_GRUPO = { dia: 'Día', mes: 'Mes', anio: 'Año' };

function CambiosDelPeriodo({ grupo, seccion }) {
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState(null);
  useEffect(() => {
    let vigente = true;
    const qs = new URLSearchParams({ grupo, pagina: String(pagina), por_pagina: String(POR_PAGINA), ...(seccion ? { clave: seccion } : {}) });
    api.get(`/api/v1/estado/bitacora/servidor?${qs}`).then((r) => {
      if (!vigente) return;
      if (!r.ok) { setError(r.error?.message || r.error?.detail || 'No se pudo cargar el periodo.'); return; }
      setError(''); setDatos(r.data);
    });
    return () => { vigente = false; };
  }, [grupo, seccion, pagina]);

  if (error) return <p className="p-3 text-xs text-rose-700">{error}</p>;
  if (!datos) return <p className="p-3 text-xs text-slate-600" role="status">Cargando…</p>;
  return (
    <div className="p-3 space-y-2 bg-white">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs">
          <caption className="sr-only">Cambios del periodo</caption>
          <thead>
            <tr><th scope="col" className="p-2 w-6" /><th scope="col" className="p-2 text-left">Fecha</th><th scope="col" className="p-2 text-left">Usuario</th><th scope="col" className="p-2 text-left">Sección</th><th scope="col" className="p-2 text-center">Agregados</th><th scope="col" className="p-2 text-center">Modificados</th><th scope="col" className="p-2 text-center">Eliminados</th></tr>
          </thead>
          <tbody>
            {datos.filas.map((f) => (
              <React.Fragment key={f.id}>
                <tr className="cursor-pointer" onClick={() => setAbierta(abierta === f.id ? null : f.id)} aria-expanded={abierta === f.id}>
                  <td className="p-2 text-slate-500">{abierta === f.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  <td className="p-2 whitespace-nowrap">{hora(f.fecha)}</td>
                  <td className="p-2"><span className="font-semibold text-slate-900">{f.usuario}</span><span className="block text-xs text-slate-500">{f.rol}</span></td>
                  <td className="p-2">{nombreSeccion(f.clave)}</td>
                  <td className="p-2 text-center font-bold text-emerald-700">{f.agregados || ''}</td>
                  <td className="p-2 text-center font-bold text-sky-700">{f.modificados || ''}</td>
                  <td className="p-2 text-center font-bold text-rose-700">{f.eliminados || ''}</td>
                </tr>
                {abierta === f.id && (
                  <tr><td colSpan={7} className="p-3 bg-slate-50">
                    <ul className="space-y-1">
                      {f.detalle.map((d, i) => (
                        <li key={i}><span className={`font-bold ${d.accion === 'eliminado' ? 'text-rose-700' : d.accion === 'agregado' ? 'text-emerald-700' : 'text-sky-700'}`}>{d.accion}</span> · {d.registro}{d.campos?.length ? ` — campos: ${d.campos.join(', ')}` : ''}</li>
                      ))}
                    </ul>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion pagina={pagina} total={datos.total} porPagina={POR_PAGINA} onCambiar={(n) => { setPagina(n); setAbierta(null); }} etiqueta="cambios" />
    </div>
  );
}

export default function BitacoraServidor() {
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState('');
  const [seccion, setSeccion] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [pagina, setPagina] = useState(1);
  const cargar = async () => {
    const r = await api.get(`/api/v1/estado/bitacora/servidor/grupos${seccion ? `?clave=${encodeURIComponent(seccion)}` : ''}`);
    if (!r.ok) { setError(r.error?.message || r.error?.detail || 'No se pudo cargar el registro.'); return; }
    setError(''); setGrupos(r.data); setPagina(1);
    setAbierto((a) => a ?? r.data[0]?.id ?? null); // el periodo más reciente abierto
  };
  useEffect(() => { setAbierto(null); cargar(); }, [seccion]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibles = (grupos || []).slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><ServerCog size={18} className="text-marca-azul-oscuro" /> Registro del servidor (cambios de datos)</h3>
          <p className="text-xs text-slate-600">Lo anota el servidor en cada guardado. Solo lo ve el Super Admin. Días del mes en curso; los meses cerrados y los años anteriores se agrupan.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">Sección
            <select value={seccion} onChange={(e) => setSeccion(e.target.value)} className={LISTA_FILTRO}>
              <option value="">Todas</option>
              {Object.entries(SECCIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button type="button" onClick={cargar} className="px-3 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RefreshCw size={14} /> Actualizar</button>
        </div>
      </header>
      {error && <p className="text-xs text-rose-700">{error}</p>}
      {grupos && !grupos.length && <p className="p-6 text-center text-sm text-slate-500">Sin cambios registrados.</p>}
      <ul className="space-y-2">
        {visibles.map((g) => (
          <li key={g.id} className={`rounded-xl border border-slate-200 overflow-hidden ${ESTILO_GRUPO[g.tipo]}`}>
            <button type="button" onClick={() => setAbierto(abierto === g.id ? null : g.id)} aria-expanded={abierto === g.id}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sky-50">
              <span className="flex items-center gap-2">
                {abierto === g.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 w-10">{TIPO_GRUPO[g.tipo]}</span>
                <span className="text-sm font-extrabold text-slate-900">{g.etiqueta}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">{g.cambios} guardado(s)</span>
                {g.agregados > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">+{g.agregados} agregados</span>}
                {g.modificados > 0 && <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">{g.modificados} modificados</span>}
                {g.eliminados > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">{g.eliminados} eliminados</span>}
              </span>
            </button>
            {abierto === g.id && <CambiosDelPeriodo grupo={g.id} seccion={seccion} />}
          </li>
        ))}
      </ul>
      {grupos && <Paginacion pagina={pagina} total={grupos.length} porPagina={POR_PAGINA} onCambiar={setPagina} etiqueta="periodos" />}
    </section>
  );
}
