// Registro del servidor: cada cambio de datos guardado (quién, cuándo, sección y registros). Solo administradores.
// No depende de que la pantalla lo anote: lo genera el servidor al guardar y no se puede editar ni borrar.
import React, { useEffect, useState } from 'react';
import { ServerCog, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../../services/apiClient';
import { formatearFecha } from '../../constants/workflow';

const SECCIONES = {
  'sgc-acciones-correctivas': 'Acciones correctivas', 'sgc-planes-mejora': 'Planes de mejora', 'sgc-riesgos': 'Riesgos y oportunidades',
  'sgc-matrices-riesgos': 'Matrices de riesgos', 'sgc-indicadores-data': 'Indicadores', 'sgc-config-areas-detalle': 'Catálogo de áreas',
  'sgc-config-direcciones-detalle': 'Catálogo de direcciones', 'sgc-reportes-correccion': 'Reportes de corrección', 'sgc-config-folios': 'Folios',
  'sgc-sintesis-organismo': 'Síntesis del organismo', 'sgc-documentos': 'Control documental',
};
const nombreSeccion = (c) => SECCIONES[c] || c.replace(/^sgc-/, '').replace(/-/g, ' ');
const hora = (iso) => (iso ? `${formatearFecha(iso)} ${new Date(`${iso}Z`).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : '');

export default function BitacoraServidor() {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState('');
  const [seccion, setSeccion] = useState('');
  const [abierta, setAbierta] = useState(null);
  const cargar = async () => {
    const r = await api.get(`/api/v1/estado/bitacora/servidor${seccion ? `?clave=${encodeURIComponent(seccion)}` : ''}`);
    if (!r.ok) { setError(r.error?.message || r.error?.detail || 'No se pudo cargar el registro.'); return; }
    setError(''); setFilas(r.data);
  };
  useEffect(() => { cargar(); }, [seccion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><ServerCog size={18} className="text-marca-azul-oscuro" /> Registro del servidor (cambios de datos)</h3>
          <p className="text-xs text-slate-600">Lo anota el servidor en cada guardado: quién, cuándo, qué sección y qué registros. No se puede editar ni borrar.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">Sección
            <select value={seccion} onChange={(e) => setSeccion(e.target.value)} className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold">
              <option value="">Todas</option>
              {Object.entries(SECCIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button type="button" onClick={cargar} className="px-3 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RefreshCw size={14} /> Actualizar</button>
        </div>
      </header>
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs">
          <caption className="sr-only">Cambios de datos registrados por el servidor</caption>
          <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
            <tr><th scope="col" className="p-2 w-6" /><th scope="col" className="p-2">Fecha</th><th scope="col" className="p-2">Usuario</th><th scope="col" className="p-2">Sección</th><th scope="col" className="p-2 text-center">Agregados</th><th scope="col" className="p-2 text-center">Modificados</th><th scope="col" className="p-2 text-center">Eliminados</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas && !filas.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Sin cambios registrados.</td></tr>}
            {(filas || []).map((f) => (
              <React.Fragment key={f.id}>
                <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setAbierta(abierta === f.id ? null : f.id)}>
                  <td className="p-2 text-slate-400">{abierta === f.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  <td className="p-2 whitespace-nowrap">{hora(f.fecha)}</td>
                  <td className="p-2"><span className="font-semibold text-slate-900">{f.usuario}</span><span className="block text-[11px] text-slate-500">{f.rol}</span></td>
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
    </section>
  );
}
