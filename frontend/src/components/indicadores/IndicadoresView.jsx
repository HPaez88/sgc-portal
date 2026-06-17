import React, { useState } from 'react';
import { getSemaphoreColor, getIndicadoresByArea, INDICADORES, PROCESOS, AREAS } from '../../constants';
import { Plus } from 'lucide-react';
export default function IndicadoresView({ indicadoresData, setIndicadoresData, puedeTodasAreas, areaUsuario }) {
  const [editando, setEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCaptura, setMostrarModalCaptura] = useState(false);
  const [mostrarModalSeguimiento, setMostrarModalSeguimiento] = useState(false);
  const [indicadorNoCumple, setIndicadorNoCumple] = useState(null);
  const [indicadorCaptura, setIndicadorCaptura] = useState(null);
  const [valorCaptura, setValorCaptura] = useState('');
  const [mesCaptura, setMesCaptura] = useState('Ene');
  const [vista, setVista] = useState('mensual');
  const [trimestre, setTrimestre] = useState(1);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  
  const [indicadores] = useState(INDICADORES);
  const [resultados, setResultados] = useState({});
  const [seguimientos, setSeguimientos] = useState([]);
  const [anioActual] = useState(2026);
  const [nuevoIndicador, setNuevoIndicador] = useState({ nombre: '', area: '', meta: '', unidad: '' });
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const trimestresMap = {
    1: ['Ene', 'Feb', 'Mar'],
    2: ['Abr', 'May', 'Jun'],
    3: ['Jul', 'Ago', 'Sep'],
    4: ['Oct', 'Nov', 'Dic']
  };
  
  // Listas únicas
  const areasUnicas = [...new Set(indicadores.map(i => i.area))].sort();
  const procesosUnicos = [...new Set(indicadores.map(i => i.proceso))].sort();
  
  // Indicadores filtrados
  const indicadoresFiltrados = indicadores.filter(ind => {
    if (filtroArea && ind.area !== filtroArea) return false;
    if (filtroProceso && ind.proceso !== filtroProceso) return false;
    return true;
  });
  
  const getSemaphoreColor = (pct) => {
    if (pct >= 80) return { bg: 'bg-emerald-500', text: 'text-white', icon: '🟢' };
    if (pct >= 50) return { bg: 'bg-amber-500', text: 'text-white', icon: '🟡' };
    return { bg: 'bg-red-500', text: 'text-white', icon: '🔴' };
  };
  
  const getCumplimiento = (indicadorId, mesesEval) => {
    const ind = indicadores.find(i => i.id === indicadorId);
    if (!ind) return 0;
    
    const valores = mesesEval.map(m => resultados[`${indicadorId}-${m}`]).filter(v => v && v !== '');
    if (valores.length === 0) return 0;
    
    const meta = ind.meta;
    const esMenor = ind.es_menor;
    
    let cumplidos = 0;
    valores.forEach(v => {
      const num = parseFloat(String(v).replace(/%/g, '').replace(/,/g, ''));
      if (isNaN(num)) return;
      if (esMenor && num <= meta) cumplidos++;
      else if (!esMenor && num >= meta) cumplidos++;
    });
    return Math.round((cumplidos / valores.length) * 100);
  };
  
  const getCumpTrimestral = (indicadorId, trim) => {
    const mesesTrim = trimestre === 1 ? ['Ene', 'Feb', 'Mar'] : 
                      trimestre === 2 ? ['Abr', 'May', 'Jun'] :
                      trimestre === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getCumplimiento(indicadorId, mesesTrim);
  };
  
  const getAreaCumplimiento = (area, mesesEval) => {
    const indicadoresArea = indicadores.filter(i => i.area === area);
    if (indicadoresArea.length === 0) return 0;
    const suma = indicadoresArea.reduce((acc, ind) => acc + getCumplimiento(ind.id, mesesEval), 0);
    return Math.round(suma / indicadoresArea.length);
  };
  
  const getProcesoCumplimiento = (proceso, mesesEval) => {
    const indicadoresProceso = indicadores.filter(i => i.proceso === proceso);
    if (indicadoresProceso.length === 0) return 0;
    const suma = indicadoresProceso.reduce((acc, ind) => acc + getCumplimiento(ind.id, mesesEval), 0);
    return Math.round(suma / indicadoresProceso.length);
  };
  
  const getAreaTrimestralCump = (area, trim) => {
    const mesesTrim = trim === 1 ? ['Ene', 'Feb', 'Mar'] : 
                  trim === 2 ? ['Abr', 'May', 'Jun'] :
                  trim === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getAreaCumplimiento(area, mesesTrim);
  };
  
  const getProcesoTrimestralCump = (proceso, trim) => {
    const mesesTrim = trim === 1 ? ['Ene', 'Feb', 'Mar'] : 
                  trim === 2 ? ['Abr', 'May', 'Jun'] :
                  trim === 3 ? ['Jul', 'Ago', 'Sep'] : ['Oct', 'Nov', 'Dic'];
    return getProcesoCumplimiento(proceso, mesesTrim);
  };
  
  const guardarResultado = (indicadorId, mes, valor) => {
    setResultados(prev => ({ ...prev, [`${indicadorId}-${mes}-${anioActual}`]: valor }));
    setEditando(null);
  };
  
  const getValor = (indicadorId, mes) => {
    return resultados[`${indicadorId}-${mes}-${anioActual}`] || '';
  };
  
  const abrirSeguimiento = (ind) => {
    setIndicadorNoCumple(ind);
    setMostrarModalSeguimiento(true);
  };
  
  const crearSeguimiento = (tipo, descripcion) => {
    if (!indicadorNoCumple || !descripcion) return;
    setSeguimientos(prev => [...prev, {
      id: indicadorNoCumple.id,
      nombre: indicadorNoCumple.nombre,
      area: indicadorNoCumple.area,
      tipo,
      descripcion,
      fecha: new Date().toISOString().split('T')[0]
    }]);
    setMostrarModalSeguimiento(false);
    setIndicadorNoCumple(null);
  };
  
  const getSegumiento = (indicadorId) => {
    return seguimientos.filter(s => s.id === indicadorId);
  };

  // Calculate process statistics for summary cards (more concise)
  const procesoStats = PROCESOS.map(proceso => {
    const inds = indicadores.filter(i => i.proceso === proceso);
    if (inds.length === 0) return { proceso, cumplimiento: 0, count: 0 };
    const cumpleTotal = inds.reduce((acc, ind) => {
      return acc + getCumplimiento(ind.id, meses);
    }, 0);
    return { proceso, cumplimiento: Math.round(cumpleTotal / inds.length), count: inds.length };
  }).filter(p => p.count > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Filtros y Toggle */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setVista('mensual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'mensual' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📅 Mensual
          </button>
          <button 
            onClick={() => setVista('trimestral')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'trimestral' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📊 Trimestral
          </button>
          <button 
            onClick={() => setVista('graficos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'graficos' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            📈 Gráficos
          </button>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <select 
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Todas las Áreas</option>
            {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          
          <select 
            value={filtroProceso}
            onChange={e => setFiltroProceso(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Todos los Procesos</option>
            {procesosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          {(filtroArea || filtroProceso) && (
            <button 
              onClick={() => { setFiltroArea(''); setFiltroProceso(''); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Limpiar
            </button>
          )}
        </div>
        
        {vista === 'trimestral' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(t => (
              <button 
                key={t}
                onClick={() => setTrimestre(t)}
                className={`px-3 py-1 rounded text-sm ${trimestre === t ? 'bg-cyan-500 text-white' : 'bg-slate-100'}`}
              >
                T{t}
              </button>
            ))}
          </div>
        )}
        
        <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#002855] hover:bg-[#001d40] text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nuevo Indicador
        </button>
      </div>

      {vista === 'mensual' ? (
        <>
          {/* Resumen por Proceso */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {procesoStats.map(stat => {
              const sem = getSemaphoreColor(stat.cumplimiento);
              return (
                <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'bg-')}/10 border-${sem.bg.replace('bg-', 'border-')}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate flex-1">{stat.proceso}</p>
                    <span className="text-lg">{sem.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${sem.text}`}>{stat.cumplimiento}%</p>
                  <p className="text-xs text-slate-500">{stat.count} inds.</p>
                </div>
              );
            })}
          </div>

          {/* Tabla Mensual */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855]"> Indicadores {anioActual} - Captura Mensual</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 text-sm font-semibold text-slate-600">Indicador</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Meta</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Und.</th>
                    {meses.map(m => (
                      <th key={m} className="p-2 text-xs font-semibold text-slate-500 text-center">{m}</th>
                    ))}
                    <th className="p-3 text-sm font-semibold text-slate-600">% Cump.</th>
                    <th className="p-2 text-sm font-semibold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {indicadoresFiltrados.map(ind => {
                    const cump = getCumplimiento(ind.id, meses);
                    const sem = getSemaphoreColor(cump);
                    const seg = getSegumiento(ind.id);
                    const noCumple = cump < 50 || (seg && seg.length > 0 && cump < 80);
                    return (
                      <tr key={ind.id} className={`border-t border-slate-200 hover:bg-slate-50/50 ${noCumple ? 'bg-red-25' : ''}`}>
                        <td className="p-3 font-medium text-[#002855] text-sm">{ind.nombre}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.area}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.meta}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.unidad}</td>
                        {meses.map(mes => {
                          const key = `${ind.id}-${mes}`;
                          const valor = getValor(ind.id, mes);
                          return (
                            <td key={mes} className="p-1 text-center">
                              {editando === key ? (
                                <input type="text" value={valor} onChange={(e) => guardarResultado(ind.id, mes, e.target.value)} onBlur={() => setEditando(null)} onKeyDown={(e) => e.key === 'Enter' && setEditando(null)} autoFocus className="w-full p-1 text-center text-xs border border-cyan-500 rounded" />
                              ) : (
                                <span onClick={() => setEditando(key)} className="cursor-pointer hover:bg-cyan-50 px-1 py-0.5 rounded text-xs block">{valor || '-'}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${sem.bg}`}>
                            {cump}%
                          </span>
                        </td>
                        <td className="p-2">
                          {seg.length > 0 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" title={seg[0].tipo}>{seg.length}</span>
                          ) : noCumple ? (
                            <button onClick={() => abrirSeguimiento(ind)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">⚠️</button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : vista === 'graficos' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-[#002855] mb-6">Dashboard de Indicadores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {procesoStats.map(stat => {
                const sem = getSemaphoreColor(stat.cumplimiento);
                return (
                  <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'border-')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 truncate">{stat.proceso}</p>
                      <span className="text-xl">{sem.icon}</span>
                    </div>
                    <p className={`text-3xl font-bold ${sem.text}`}>{stat.cumplimiento}%</p>
                    <p className="text-xs text-slate-400">{stat.count} inds.</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-6">
              {procesosUnicos.map(proceso => {
                const indicadoresProceso = indicadores.filter(i => i.proceso === proceso);
                if (indicadoresProceso.length === 0) return null;
                const promedio = procesoStats.find(s => s.proceso === proceso)?.cumplimiento || 0;
                const sem = getSemaphoreColor(promedio);
                return (
                  <div key={proceso} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#002855]">{proceso}</h3>
                      <span className={`text-2xl font-bold ${sem.text}`}>{promedio}%</span>
                    </div>
                    <div className="space-y-2">
                      {indicadoresProceso.map(ind => {
                        const cump = getCumplimiento(ind.id, meses);
                        const semInd = getSemaphoreColor(cump);
                        return (
                          <div key={ind.id} className="flex items-center gap-3">
                            <div className="w-40 flex-shrink-0">
                              <p className="text-xs text-slate-600 truncate">{ind.nombre}</p>
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                              <div className={`h-full ${semInd.bg} transition-all`} style={{ width: `${cump}%` }} />
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-medium">{cump}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vista Trimestral - Resumen por Proceso */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {procesoStats.map(stat => {
              const cump = getProcesoTrimestralCump(stat.proceso, trimestre);
              const sem = getSemaphoreColor(cump);
              return (
                <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg.replace('bg-', 'bg-')}/20`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate flex-1">{stat.proceso}</p>
                    <span className="text-lg">{sem.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${sem.text}`}>{cump}%</p>
                  <p className="text-xs text-slate-500">T{trimestre}</p>
                </div>
              );
            })}
          </div>

          {/* Tabla Trimestral */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-[#002855]">Indicadores Trimestre {trimestre} ({trimestresMap[trimestre].join('-')})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-3 text-sm font-semibold text-slate-600">Indicador</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Área</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Meta</th>
                    {trimestresMap[trimestre].map(m => (
                      <th key={m} className="p-2 text-xs font-semibold text-slate-500 text-center">{m}</th>
                    ))}
                    <th className="p-3 text-sm font-semibold text-slate-600">% Trim.</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Semáforo</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {indicadoresFiltrados.map(ind => {
                    const cump = getCumpTrimestral(ind.id, trimestre);
                    const sem = getSemaphoreColor(cump);
                    const mesesTrim = trimestresMap[trimestre];
                    const seg = getSegumiento(ind.id);
                    const noCumple = cump < 50 || (seg && seg.length > 0 && cump < 80);
                    return (
                      <tr key={ind.id} className={`border-t border-slate-200 hover:bg-slate-50/50 ${noCumple ? 'bg-red-25' : ''}`}>
                        <td className="p-3 font-medium text-[#002855] text-sm">{ind.nombre}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.area}</td>
                        <td className="p-3 text-sm text-slate-600">{ind.meta}</td>
                        {mesesTrim.map(mes => (
                          <td key={mes} className="p-2 text-center text-sm">
                            {getValor(ind.id, mes) || '-'}
                          </td>
                        ))}
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${sem.bg}`}>
                            {cump}%
                          </span>
                        </td>
                        <td className="p-2 text-2xl">{sem.icon}</td>
                        <td className="p-2">
                          {seg.length > 0 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" title={seg[0].tipo}>{seg.length}</span>
                          ) : noCumple ? (
                            <button onClick={() => abrirSeguimiento(ind)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">⚠️</button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Nuevo Indicador */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Indicador</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre</label>
                <input 
                  value={nuevoIndicador.nombre}
                  onChange={(e) => setNuevoIndicador({...nuevoIndicador, nombre: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Área</label>
                <select 
                  value={nuevoIndicador.area}
                  onChange={(e) => setNuevoIndicador({...nuevoIndicador, area: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Meta</label>
                  <input 
                    value={nuevoIndicador.meta}
                    onChange={(e) => setNuevoIndicador({...nuevoIndicador, meta: e.target.value})}
                    placeholder="> 90 o < 5"
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Unidad</label>
                  <input 
                    value={nuevoIndicador.unidad}
                    onChange={(e) => setNuevoIndicador({...nuevoIndicador, unidad: e.target.value})}
                    placeholder="%, mg/L, etc"
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
      )}

      {/* Modal Seguimiento - Cuando indicador no cumple */}
      {mostrarModalSeguimiento && indicadorNoCumple && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-[#002855] mb-2">⚠️ Indicador No Cumple</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-800">{indicadorNoCumple.nombre}</p>
              <p className="text-xs text-red-600 mt-1">Área: {indicadorNoCumple.area} | Meta: {indicadorNoCumple.meta} {indicadorNoCumple.unidad}</p>
            </div>
            
            <p className="text-sm text-slate-600 mb-3">Selecciona el tipo de seguimiento:</p>
            
            <div className="space-y-3">
              <button onClick={() => crearSeguimiento('AC', 'Crear Acción Correctiva para este indicador')} className="w-full p-3 border border-red-200 bg-red-50 rounded-lg text-left hover:bg-red-100 transition-colors">
                <span className="font-medium text-red-700">⚡ Acción Correctiva</span>
                <p className="text-xs text-red-600">Para No Conformidades mayores</p>
              </button>
              
              <button onClick={() => crearSeguimiento('RC', 'Crear Reporte de Corrección para este indicador')} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-lg text-left hover:bg-amber-100 transition-colors">
                <span className="font-medium text-amber-700">🔧 Reporte de Corrección</span>
                <p className="text-xs text-amber-600">Para ajustes menores</p>
              </button>
              
              <button onClick={() => crearSeguimiento('MINUTA', 'Crear Minuta de Reunión para analizar este indicador')} className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                <span className="font-medium text-blue-700">📋 Minuta de Reunión</span>
                <p className="text-xs text-blue-600">Para análisis en comité</p>
              </button>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalSeguimiento(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}