// Reportes de Corrección (RC): bitácora, filtros y dictamen. Se gestionan desde Acciones Correctivas
// (pestaña propia) y también se ven en Indicadores; ambos usan la misma información (sgc-reportes-correccion).
import React, { useState } from 'react';
import { Edit3, FileWarning, Search } from 'lucide-react';
import ModalGestionarRC from '../indicadores/ModalGestionarRC';
import ModalNuevoRC from './ModalNuevoRC';
import { FilePlus2 } from 'lucide-react';
import { leerEstadoTexto, escribirEstadoTexto } from '../../services/estadoService';
import { REPORTES_CORRECCION_INICIALES } from '../../constants/indicadores';

const leerReportes = () => {
  try {
    const g = leerEstadoTexto('sgc-reportes-correccion');
    if (g) return JSON.parse(g);
  } catch { /* sin datos guardados */ }
  return REPORTES_CORRECCION_INICIALES;
};

export default function ReportesCorreccionPanel({ reportes, onActualizar, usuarioLogueado }) {
  // Si la pantalla que lo usa no maneja los reportes (Acciones Correctivas), el panel los lee y guarda solo.
  const [propios, setPropios] = useState(reportes ? null : leerReportes);
  const reportesCorreccion = reportes || propios || [];
  const [filtroEstadoRC, setFiltroEstadoRC] = useState('TODOS');
  const [busquedaRC, setBusquedaRC] = useState('');
  const [rcParaGestionar, setRcParaGestionar] = useState(null);
  const [modalGestionarRCOpen, setModalGestionarRCOpen] = useState(false);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const puedeCrear = ['Super Admin', 'Admin', 'Auditor'].includes(usuarioLogueado?.rol);

  const actualizar = (rep) => {
    if (onActualizar) return onActualizar(rep);
    setPropios((prev) => {
      const lista = prev || [];
      const i = lista.findIndex((r) => r.id === rep.id || r.folio === rep.folio);
      const nuevos = i >= 0 ? lista.map((r, k) => (k === i ? rep : r)) : [rep, ...lista];
      try { escribirEstadoTexto('sgc-reportes-correccion', JSON.stringify(nuevos)); } catch { /* sin almacenamiento */ }
      return nuevos;
    });
  };

  return (
    <>
      {puedeCrear && (
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => setNuevoAbierto(true)} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 inline-flex items-center gap-1.5"><FilePlus2 size={14} /> Nuevo reporte de corrección</button>
        </div>
      )}
        <div className="space-y-4">
          {/* Métricas de la Bitácora */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Casos Registrados</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
                {reportesCorreccion.length}
              </span>
            </div>
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">En Atención Operativa</span>
              <span className="text-2xl font-black text-amber-700 font-mono mt-0.5 block">
                {reportesCorreccion.filter(r => r.estado === 'ABIERTO' || r.estado === 'EN_ATENCION' || r.estado === 'ABIERTA').length}
              </span>
            </div>
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Cierres Efectivos</span>
              <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
                {reportesCorreccion.filter(r => r.estado === 'CERRADO_EFECTIVO' || r.estado === 'CERRADA').length}
              </span>
            </div>
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 shadow-xs">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">Escalados a AC (OOMRSC-20)</span>
              <span className="text-2xl font-black text-purple-700 font-mono mt-0.5 block">
                {reportesCorreccion.filter(r => r.estado === 'ESCALADO_A_AC' || r.estado === 'CERRADO_NO_EFECTIVO').length}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileWarning size={18} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Bitácora Oficial de Reportes de Corrección (RC)
                </h3>
              </div>
              
              {/* Filtros de la bitácora */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar folio, responsable o área..."
                    value={busquedaRC}
                    onChange={(e) => setBusquedaRC(e.target.value)}
                    className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  />
                </div>

                <select
                  value={filtroEstadoRC}
                  onChange={(e) => setFiltroEstadoRC(e.target.value)}
                  className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ABIERTOS">En Atención Operativa</option>
                  <option value="EFECTIVOS">Cierres Efectivos</option>
                  <option value="NO_EFECTIVOS">Cierres No Efectivos</option>
                  <option value="ESCALADOS">Escalados a Acción Correctiva</option>
                </select>
              </div>
            </div>

            {/* Listado de RCs */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Folio</th>
                    <th className="py-2.5 px-3">Área / Responsable</th>
                    <th className="py-2.5 px-3">Desviación / Causa</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportesCorreccion
                    .filter(rc => {
                      if (filtroEstadoRC === 'ABIERTOS') {
                        return rc.estado === 'ABIERTO' || rc.estado === 'EN_ATENCION' || rc.estado === 'ABIERTA';
                      }
                      if (filtroEstadoRC === 'EFECTIVOS') {
                        return rc.estado === 'CERRADO_EFECTIVO' || rc.estado === 'CERRADA';
                      }
                      if (filtroEstadoRC === 'NO_EFECTIVOS') {
                        return rc.estado === 'CERRADO_NO_EFECTIVO';
                      }
                      if (filtroEstadoRC === 'ESCALADOS') {
                        return rc.estado === 'ESCALADO_A_AC';
                      }
                      return true;
                    })
                    .filter(rc => {
                      if (!busquedaRC) return true;
                      const q = busquedaRC.toLowerCase();
                      return (rc.folio || '').toLowerCase().includes(q) ||
                        (rc.responsable || '').toLowerCase().includes(q) ||
                        (rc.area || '').toLowerCase().includes(q) ||
                        (rc.descripcion || '').toLowerCase().includes(q);
                    })
                    .map(rc => (
                      <tr key={rc.id || rc.folio} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-fit">
                            {rc.folio}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {rc.ejercicio || ''} {rc.mes ? `· ${rc.mes}` : ''}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {rc.area || 'Área Operativa'}
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            Titular: {rc.responsable || 'No asignado'}
                          </span>
                        </td>

                        <td className="py-3 px-3 max-w-sm">
                          <p className="text-slate-800 font-medium line-clamp-2">
                            {rc.descripcion || rc.causa || 'Seguimiento a desviación en indicador.'}
                          </p>
                          {rc.folio_ac_vinculado && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1">
                              Vinculado a {rc.folio_ac_vinculado}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border inline-block ${
                            (rc.estado === 'CERRADO_EFECTIVO' || rc.estado === 'CERRADA') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            rc.estado === 'CERRADO_NO_EFECTIVO' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            rc.estado === 'ESCALADO_A_AC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {(rc.estado === 'CERRADO_EFECTIVO' || rc.estado === 'CERRADA') && '✓ Cierre Efectivo'}
                            {rc.estado === 'CERRADO_NO_EFECTIVO' && '✕ No Efectivo'}
                            {rc.estado === 'ESCALADO_A_AC' && '⚡ Escalado a AC'}
                            {(rc.estado === 'ABIERTO' || rc.estado === 'EN_ATENCION' || rc.estado === 'ABIERTA' || !rc.estado) && '⏳ En Atención'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setRcParaGestionar(rc);
                              setModalGestionarRCOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={12} /> Gestionar / Dictamen
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {modalGestionarRCOpen && rcParaGestionar && (
        <ModalGestionarRC
          isOpen={modalGestionarRCOpen}
          onClose={() => { setModalGestionarRCOpen(false); setRcParaGestionar(null); }}
          reporte={rcParaGestionar}
          onActualizarReporte={actualizar}
          usuarioLogueado={usuarioLogueado}
        />
      )}
      {nuevoAbierto && <ModalNuevoRC reportes={reportesCorreccion} onGuardar={actualizar} onClose={() => setNuevoAbierto(false)} />}
    </>
  );
}
