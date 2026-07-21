import React, { useState } from 'react';
import { useSGC } from '../../SGCContext';
import { Plus, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function DocumentosView({ documentos = [], setDocumentos, puedeTodasAreas, areaUsuario }) {
  const { areas } = useSGC();
  const safeDocs = documentos || [];
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoDoc, setNuevoDoc] = useState({ titulo: '', tipo: 'Procedimiento', area: '', version: '1.0', autor: '' });

  const tiposDoc = ['Manual', 'Procedimiento', 'Registro', 'Política', 'Instrucción', 'Formato', 'Guía'];
  const estadosDoc = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'OBSOLETO'];

  const getEstadoBadge = (estado) => {
    const colors = { 
      'APROBADO': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
      'EN_REVISION': 'bg-amber-100 text-amber-700 border-amber-200', 
      'BORRADOR': 'bg-slate-100 text-slate-700 border-slate-200', 
      'OBSOLETO': 'bg-red-100 text-red-600 border-red-200' 
    };
    return colors[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const exportarDocumento = (doc) => {
    const contenido = `
================================================================================
                    SGC - OOMAPASC de Cajeme
                 Sistema de Gestión de Calidad
================================================================================

DOCUMENTO TÉCNICO
--------------------------------------------------------------------------------
Título:          ${doc.titulo}
Tipo:            ${doc.tipo}
Área:            ${doc.area}
Versión:         ${doc.version}
Estado:          ${doc.estado}
Fecha:           ${doc.fecha}
Autor:           ${doc.autor}

--------------------------------------------------------------------------------
Descripción del Documento:
--------------------------------------------------------------------------------
Documento del Sistema de Gestión de Calidad de OOMAPASC de Cajeme.
Este documento forma parte del control documental de la organización.

--------------------------------------------------------------------------------
Historial de Revisiones
--------------------------------------------------------------------------------
Versión | Fecha      | Autor | Descripción
${doc.version} | ${doc.fecha} | ${doc.autor} | Versión inicial

================================================================================
Generado por el Portal SGC - OOMAPASC de Cajeme
Fecha de exportación: ${new Date().toLocaleDateString('es-MX')}
================================================================================
    `;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.titulo.replace(/\s+/g, '_')}_v${doc.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const agregarDoc = () => {
    if (!nuevoDoc.titulo || !nuevoDoc.area) return;
    
    // CORREGIDO: Usando setDocumentos en lugar de setDocList
    setDocumentos(prev => [...(prev || []), { ...nuevoDoc, id: Date.now(), estado: 'BORRADOR', fecha: new Date().toISOString().split('T')[0] }]);
    setMostrarModal(false);
    setNuevoDoc({ titulo: '', tipo: 'Procedimiento', area: '', version: '1.0', autor: '' });
  };

  const docsFiltrados = safeDocs.filter(d => {
    if (filtroTipo && d.tipo !== filtroTipo) return false;
    if (filtroEstado && d.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header y Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl bg-cyan-100 p-2 rounded-lg"><FileText className="text-cyan-600" /></span>
          <div>
            <h2 className="text-xl font-bold text-white">Control Documental</h2>
            <p className="text-sm text-slate-500 font-medium">Gestión de la información documentada</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
            <option value="">Todos los tipos</option>
            {tiposDoc.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
            <option value="">Todos los estados</option>
            {estadosDoc.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-bold hover:bg-cyan-600 transition-colors shadow-sm">
            <Plus size={16} strokeWidth={3} /> Nuevo Documento
          </button>
        </div>
      </div>

      {/* Grid de Documentos */}
      {docsFiltrados.length === 0 ? (
         <div className="text-center py-16 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
           <p className="text-5xl mb-4 opacity-50">📂</p>
           <p className="text-lg font-bold text-slate-700">No hay documentos</p>
           <p className="font-medium mt-1">Crea un nuevo documento o ajusta tus filtros de búsqueda.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docsFiltrados.map(doc => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-100 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md">{doc.tipo}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getEstadoBadge(doc.estado)}`}>{doc.estado}</span>
              </div>
              
              <h3 className="font-bold text-[#002855] text-lg mb-2 leading-tight group-hover:text-cyan-600 transition-colors">{doc.titulo}</h3>
              
              <div className="text-sm text-slate-500 space-y-1.5 mb-5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="flex justify-between"><span className="font-medium text-slate-500">Área:</span> <span className="text-right font-medium text-slate-700">{doc.area}</span></p>
                <p className="flex justify-between"><span className="font-medium text-slate-500">Versión:</span> <span className="font-medium text-slate-700">v{doc.version}</span></p>
                <p className="flex justify-between"><span className="font-medium text-slate-500">Fecha:</span> <span className="font-medium text-slate-700">{doc.fecha}</span></p>
                <p className="flex justify-between"><span className="font-medium text-slate-500">Autor:</span> <span className="text-right font-medium text-slate-700 truncate max-w-[120px]" title={doc.autor}>{doc.autor}</span></p>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => exportarDocumento(doc)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200 transition-colors">
                  <Download size={16} /> Descargar
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-[#002855] rounded-xl hover:bg-[#003875] transition-colors shadow-sm">
                  <Eye size={16} /> Ver PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Documento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] flex justify-between items-center">
              <h3 className="font-bold text-[#002855] flex items-center gap-2"><Plus size={18} /> Registrar Nuevo Documento</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Título del Documento</label>
                <input value={nuevoDoc.titulo} onChange={e => setNuevoDoc({...nuevoDoc, titulo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none transition-all" placeholder="Ej. Manual de Procedimientos..." />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo</label>
                  <select value={nuevoDoc.tipo} onChange={e => setNuevoDoc({...nuevoDoc, tipo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                    {tiposDoc.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Versión Inicial</label>
                  <input value={nuevoDoc.version} onChange={e => setNuevoDoc({...nuevoDoc, version: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Área Propietaria</label>
                <select value={nuevoDoc.area} onChange={e => setNuevoDoc({...nuevoDoc, area: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                  <option value="">Seleccionar área...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Autor / Elaboró</label>
                <input value={nuevoDoc.autor} onChange={e => setNuevoDoc({...nuevoDoc, autor: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="Nombre de quien elabora..." />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={agregarDoc} disabled={!nuevoDoc.titulo || !nuevoDoc.area} className="flex-1 px-4 py-2.5 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex justify-center items-center gap-2">
                <CheckCircle2 size={18} /> Crear Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}