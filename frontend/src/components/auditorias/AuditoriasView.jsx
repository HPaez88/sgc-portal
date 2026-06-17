import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Loader2, Eye, FileText, Download, CheckCircle2, AlertCircle, Plus, Filter, ClipboardList } from 'lucide-react';

export default function AuditoriasView({ auditorias, setAuditorias, puedeTodasAreas, areaUsuario }) {
  const safeAuditorias = auditorias || [];
  const [mostrarModal, setMostrarModal] = useState(false);
  const [verInformes, setVerInformes] = useState(false);
  const [anioSeleccionado, setAnioSeleccionado] = useState(2026);
  const [informes, setInformes] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(false);

  // Cargar informes desde Supabase o usar fallback
  useEffect(() => {
    if (verInformes) {
      async function cargarInformes() {
        setLoadingInformes(true);
        try {
          const { data, error } = await supabase
            .from('informes_auditoria')
            .select('*')
            .order('anio', { ascending: false })
            .order('numero', { ascending: true });

          if (error) {
            console.error('Error Supabase:', error);
            setInformes(localInformes);
          } else if (data && data.length > 0) {
            setInformes(data);
          } else {
            setInformes(localInformes);
          }
        } catch (e) {
          setInformes(localInformes);
        } finally {
          setLoadingInformes(false);
        }
      }
      cargarInformes();
    }
  }, [verInformes]);

  const localInformes = [
    { anio: 2026, numero: 1, nombre: '01 Informe Auditoría Interna Semestral', tipo: 'PDF' },
    { anio: 2025, numero: 1, nombre: '01 Informe Responsabilidad Dirección', tipo: 'PDF' },
    { anio: 2025, numero: 2, nombre: '02 Informe MAM', tipo: 'PDF' },
    { anio: 2025, numero: 3, nombre: '03 MC', tipo: 'PDF' },
  ];

  const informesFiltrados = informes.filter(i => i.anio === anioSeleccionado);
  
  const aniosDisponibles = [...new Set(informes.map(i => i.anio))].sort((a, b) => b - a);
  if (aniosDisponibles.length === 0) {
    aniosDisponibles.push(2026, 2025, 2024, 2023);
  }

  const getEstadoBadge = (estado) => {
    const badges = { 
      'COMPLETADA': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
      'EN_PROCESO': 'bg-blue-100 text-blue-700 border-blue-200', 
      'PROGRAMADA': 'bg-amber-100 text-amber-700 border-amber-200', 
      'CANCELADA': 'bg-red-100 text-red-600 border-red-200' 
    };
    return badges[estado] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const agregarAuditoria = () => {
    const numero = `AUD-${new Date().getFullYear()}-${String(safeAuditorias.length + 1).padStart(3, '0')}`;
    const nuevaAud = { id: Date.now(), numero, tipo: 'Interna', area: puedeTodasAreas ? 'Sistema de Gestión de Calidad' : areaUsuario, fecha_inicio: '', fecha_fin: '', estado: 'PROGRAMADA', hallazgos: 0, no_conformidades: 0 };
    setAuditorias(prev => [...(prev || []), nuevaAud]);
    setMostrarModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen de Auditorías - Estilo Premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-slate-500 mb-1">Total Auditorías</p>
          <p className="text-3xl font-black text-[#002855]">{safeAuditorias.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-emerald-600 mb-1">Completadas</p>
          <p className="text-3xl font-black text-emerald-700">{safeAuditorias.filter(a => a.estado === 'COMPLETADA').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-blue-600 mb-1">En Proceso</p>
          <p className="text-3xl font-black text-blue-700">{safeAuditorias.filter(a => a.estado === 'EN_PROCESO').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-amber-50 rounded-bl-full -z-10"></div>
          <p className="text-sm font-bold text-amber-600 mb-1">Programadas</p>
          <p className="text-3xl font-black text-amber-700">{safeAuditorias.filter(a => a.estado === 'PROGRAMADA').length}</p>
        </div>
      </div>

      {/* Visor de Informes Anuales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-cyan-400" /> Informes de Auditoría Anuales
          </h2>
          <button 
            onClick={() => setVerInformes(!verInformes)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${verInformes ? 'bg-cyan-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'}`}
          >
            {verInformes ? 'Ocultar Visor' : 'Consultar Informes'}
          </button>
        </div>
        
        {verInformes && (
          <div className="p-6 bg-slate-50 border-b border-slate-200 animate-slide-down">
            {loadingInformes ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-cyan-500 mb-3" size={32} />
                <span className="font-medium text-slate-500">Conectando con la base de datos...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-slate-200 inline-flex">
                  {aniosDisponibles.map(anio => (
                    <button
                      key={anio}
                      onClick={() => setAnioSeleccionado(anio)}
                      className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                        anioSeleccionado === anio 
                          ? 'bg-cyan-500 text-white shadow-sm' 
                          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {anio}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {informesFiltrados.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-4xl mb-3 opacity-50">📭</p>
                      <p className="font-bold text-slate-600">No hay informes disponibles para el año {anioSeleccionado}</p>
                    </div>
                  ) : (
                    informesFiltrados.map((inf, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow group">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#002855] text-sm leading-tight mb-1">{inf.nombre}</h4>
                          <p className="text-xs font-bold text-slate-400">ID: {inf.numero} • Formato: {inf.tipo}</p>
                        </div>
                        <button className="text-slate-400 hover:text-cyan-600 p-2 hover:bg-cyan-50 rounded-lg transition-colors">
                          <Download size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Plan Anual de Auditorías */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">Plan Anual de Auditorías {new Date().getFullYear()}</h2>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-lg text-sm font-bold hover:bg-[#003875] transition-colors shadow-sm">
            <Plus size={16} /> Programar Auditoría
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-4 text-sm font-bold text-slate-600">Número</th>
                <th className="p-4 text-sm font-bold text-slate-600">Área Auditada</th>
                <th className="p-4 text-sm font-bold text-slate-600">Tipo</th>
                <th className="p-4 text-sm font-bold text-slate-600">Fechas Programadas</th>
                <th className="p-4 text-sm font-bold text-slate-600 text-center">Hallazgos</th>
                <th className="p-4 text-sm font-bold text-slate-600">Estado</th>
                <th className="p-4 text-sm font-bold text-slate-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAuditorias.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500">
                    No hay auditorías programadas. Utiliza el botón superior para crear una nueva.
                  </td>
                </tr>
              ) : safeAuditorias.map(aud => (
                <tr key={aud.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-mono font-bold text-slate-700 text-sm">{aud.numero}</td>
                  <td className="p-4 font-medium text-[#002855]">{aud.area}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded border border-slate-200">
                      {aud.tipo}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-medium">
                    {aud.fecha_inicio ? `${aud.fecha_inicio} al ${aud.fecha_fin}` : 'Por definir'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${aud.hallazgos > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      {aud.hallazgos}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(aud.estado)}`}>
                      {aud.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-slate-400 hover:text-cyan-600 p-2 hover:bg-cyan-50 rounded-lg transition-colors inline-flex">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Auditoría */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Plus size={18} /> Programar Auditoría</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-medium mb-4">Esta función creará una nueva auditoría en el sistema.</p>
                <button onClick={agregarAuditoria} className="w-full px-4 py-3 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors shadow-sm flex justify-center items-center gap-2">
                  <CheckCircle2 size={18} /> Confirmar Creación
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setMostrarModal(false)} className="px-6 py-2.5 border border-slate-200 bg-white font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}