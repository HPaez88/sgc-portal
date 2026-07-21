import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, LineChart, Plus, Save, Trash2, X } from 'lucide-react';
import { AREAS, INDICADORES, PROCESOS } from '../../constants';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TRIMESTRES = {
  1: ['Ene', 'Feb', 'Mar'],
  2: ['Abr', 'May', 'Jun'],
  3: ['Jul', 'Ago', 'Sep'],
  4: ['Oct', 'Nov', 'Dic'],
};
const ANIO_ACTUAL = new Date().getFullYear();

const emptyIndicador = {
  nombre: '',
  area: '',
  proceso: '',
  meta: '',
  unidad: '%',
  es_menor: false,
};

function parseMeta(meta) {
  const text = String(meta ?? '').trim();
  const esMenor = text.startsWith('<');
  const numeric = Number.parseFloat(text.replace(/[<>=,%\s]/g, ''));
  return {
    valor: Number.isFinite(numeric) ? numeric : 0,
    esMenor,
  };
}

function getSemaforo(pct) {
  if (pct >= 80) {
    return { label: 'Cumple', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  }
  if (pct >= 50) {
    return { label: 'Vigilar', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  }
  return { label: 'No cumple', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
}

function valueKey(indicadorId, mes, anio = ANIO_ACTUAL) {
  return `${indicadorId}-${mes}-${anio}`;
}

export default function IndicadoresView({
  indicadoresData = {},
  setIndicadoresData,
  puedeTodasAreas,
  areaUsuario,
}) {
  const [vista, setVista] = useState('mensual');
  const [trimestre, setTrimestre] = useState(1);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [editando, setEditando] = useState(null);
  const [valorTemporal, setValorTemporal] = useState('');
  const [modalIndicador, setModalIndicador] = useState(false);
  const [nuevoIndicador, setNuevoIndicador] = useState(emptyIndicador);
  const [seguimiento, setSeguimiento] = useState(null);

  const resultados = indicadoresData.resultados || {};
  const seguimientos = indicadoresData.seguimientos || [];
  const personalizados = indicadoresData.indicadoresPersonalizados || [];

  const indicadores = useMemo(() => {
    const base = Array.isArray(INDICADORES) ? INDICADORES : [];
    const propios = Array.isArray(personalizados) ? personalizados : [];
    return [...base, ...propios].filter((ind) => {
      if (!puedeTodasAreas && areaUsuario && ind.area !== areaUsuario) return false;
      return true;
    });
  }, [areaUsuario, personalizados, puedeTodasAreas]);

  const areasUnicas = useMemo(
    () => [...new Set(indicadores.map((i) => i.area).filter(Boolean))].sort(),
    [indicadores],
  );
  const procesosUnicos = useMemo(
    () => [...new Set(indicadores.map((i) => i.proceso).filter(Boolean))].sort(),
    [indicadores],
  );

  const indicadoresFiltrados = useMemo(() => (
    indicadores.filter((ind) => {
      if (filtroArea && ind.area !== filtroArea) return false;
      if (filtroProceso && ind.proceso !== filtroProceso) return false;
      return true;
    })
  ), [filtroArea, filtroProceso, indicadores]);

  const guardarData = (patch) => {
    setIndicadoresData((prev = {}) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  const getValor = (indicadorId, mes) => resultados[valueKey(indicadorId, mes)] || '';

  const calcularCumplimiento = (indicador, mesesEval) => {
    const metaInfo = parseMeta(indicador.meta);
    const esMenor = indicador.es_menor ?? metaInfo.esMenor;
    const valores = mesesEval
      .map((mes) => getValor(indicador.id, mes))
      .map((v) => Number.parseFloat(String(v).replace(/[,%\s]/g, '')))
      .filter((v) => Number.isFinite(v));

    if (valores.length === 0) return 0;

    const cumplidos = valores.filter((valor) => (
      esMenor ? valor <= metaInfo.valor : valor >= metaInfo.valor
    )).length;
    return Math.round((cumplidos / valores.length) * 100);
  };

  const procesoStats = useMemo(() => {
    return procesosUnicos.map((proceso) => {
      const items = indicadores.filter((ind) => ind.proceso === proceso);
      const total = items.reduce((sum, ind) => sum + calcularCumplimiento(ind, MESES), 0);
      return {
        proceso,
        count: items.length,
        cumplimiento: items.length ? Math.round(total / items.length) : 0,
      };
    }).filter((item) => item.count > 0);
  }, [indicadores, procesosUnicos, resultados]);

  const iniciarEdicion = (indicadorId, mes) => {
    setEditando(valueKey(indicadorId, mes));
    setValorTemporal(getValor(indicadorId, mes));
  };

  const guardarResultado = () => {
    if (!editando) return;
    guardarData({
      resultados: {
        ...resultados,
        [editando]: valorTemporal,
      },
    });
    setEditando(null);
    setValorTemporal('');
  };

  const agregarIndicador = () => {
    if (!nuevoIndicador.nombre || !nuevoIndicador.area || !nuevoIndicador.proceso || !nuevoIndicador.meta) return;
    const metaInfo = parseMeta(nuevoIndicador.meta);
    const creado = {
      ...nuevoIndicador,
      id: `custom-${Date.now()}`,
      meta: metaInfo.valor,
      es_menor: nuevoIndicador.es_menor || metaInfo.esMenor,
      origen: 'manual',
    };
    guardarData({ indicadoresPersonalizados: [...personalizados, creado] });
    setNuevoIndicador(emptyIndicador);
    setModalIndicador(false);
  };

  const eliminarIndicador = (id) => {
    guardarData({
      indicadoresPersonalizados: personalizados.filter((ind) => ind.id !== id),
    });
  };

  const registrarSeguimiento = (tipo) => {
    if (!seguimiento) return;
    guardarData({
      seguimientos: [
        ...seguimientos,
        {
          id: Date.now(),
          indicadorId: seguimiento.id,
          nombre: seguimiento.nombre,
          area: seguimiento.area,
          tipo,
          fecha: new Date().toISOString(),
          estado: 'ABIERTO',
        },
      ],
    });
    setSeguimiento(null);
  };

  const contarSeguimientos = (indicadorId) => (
    seguimientos.filter((item) => item.indicadorId === indicadorId || item.id === indicadorId).length
  );

  const renderToolbar = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {[
          ['mensual', CalendarDays, 'Mensual'],
          ['trimestral', BarChart3, 'Trimestral'],
          ['graficos', LineChart, 'Graficos'],
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setVista(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vista === id ? 'bg-[#002855] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">Todas las areas</option>
          {areasUnicas.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
        <select value={filtroProceso} onChange={(e) => setFiltroProceso(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">Todos los procesos</option>
          {procesosUnicos.map((proceso) => <option key={proceso} value={proceso}>{proceso}</option>)}
        </select>
        {(filtroArea || filtroProceso) && (
          <button type="button" onClick={() => { setFiltroArea(''); setFiltroProceso(''); }} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Limpiar
          </button>
        )}
        <button type="button" onClick={() => setModalIndicador(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-lg text-sm font-medium hover:bg-[#001f42]">
          <Plus size={16} />
          Nuevo indicador
        </button>
      </div>

      {vista === 'trimestral' && (
        <div className="flex gap-2 w-full">
          {[1, 2, 3, 4].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrimestre(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${trimestre === t ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              T{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderCards = (mesesEval = MESES) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {procesoStats.map((stat) => {
        const items = indicadores.filter((ind) => ind.proceso === stat.proceso);
        const cumplimiento = items.length
          ? Math.round(items.reduce((sum, ind) => sum + calcularCumplimiento(ind, mesesEval), 0) / items.length)
          : 0;
        const sem = getSemaforo(cumplimiento);
        return (
          <div key={stat.proceso} className={`p-4 rounded-xl border ${sem.bg} ${sem.border}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{stat.proceso}</p>
              <span className={`w-3 h-3 rounded-full mt-1 ${sem.dot}`} />
            </div>
            <p className={`text-3xl font-bold mt-3 ${sem.text}`}>{cumplimiento}%</p>
            <p className="text-xs text-slate-500 mt-1">{stat.count} indicadores</p>
          </div>
        );
      })}
    </div>
  );

  const renderAccion = (ind, cumplimiento) => {
    const total = contarSeguimientos(ind.id);
    if (total > 0) {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{total} seguimientos</span>;
    }
    if (cumplimiento < 80) {
      return (
        <button type="button" onClick={() => setSeguimiento(ind)} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">
          <AlertTriangle size={14} />
          Seguimiento
        </button>
      );
    }
    return <span className="text-xs text-slate-400">Sin accion</span>;
  };

  const renderTabla = (mesesEval) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-bold text-[#002855]">Indicadores {ANIO_ACTUAL}</h2>
        <span className="text-xs text-slate-500">{indicadoresFiltrados.length} visibles</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-semibold text-slate-600 min-w-64">Indicador</th>
              <th className="p-3 font-semibold text-slate-600">Area</th>
              <th className="p-3 font-semibold text-slate-600">Meta</th>
              {mesesEval.map((mes) => <th key={mes} className="p-2 font-semibold text-slate-500 text-center">{mes}</th>)}
              <th className="p-3 font-semibold text-slate-600">Cumplimiento</th>
              <th className="p-3 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {indicadoresFiltrados.map((ind) => {
              const cumplimiento = calcularCumplimiento(ind, mesesEval);
              const sem = getSemaforo(cumplimiento);
              return (
                <tr key={ind.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-semibold text-[#002855]">{ind.nombre}</div>
                    <div className="text-xs text-slate-500">{ind.proceso || 'Sin proceso'}</div>
                  </td>
                  <td className="p-3 text-slate-600">{ind.area}</td>
                  <td className="p-3 text-slate-600">{ind.es_menor ? '<= ' : '>= '}{parseMeta(ind.meta).valor} {ind.unidad}</td>
                  {mesesEval.map((mes) => {
                    const key = valueKey(ind.id, mes);
                    const isEditing = editando === key;
                    return (
                      <td key={mes} className="p-1 text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={valorTemporal}
                              onChange={(e) => setValorTemporal(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && guardarResultado()}
                              autoFocus
                              className="w-16 p-1 text-center text-xs border border-cyan-500 rounded"
                            />
                            <button type="button" onClick={guardarResultado} className="p-1 text-emerald-700 hover:bg-emerald-50 rounded" title="Guardar valor">
                              <Save size={14} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => iniciarEdicion(ind.id, mes)} className="min-w-12 px-2 py-1 rounded text-xs hover:bg-cyan-50 text-slate-700">
                            {getValor(ind.id, mes) || '-'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${sem.bg} ${sem.text}`}>
                      <span className={`w-2 h-2 rounded-full ${sem.dot}`} />
                      {cumplimiento}%
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {renderAccion(ind, cumplimiento)}
                      {String(ind.id).startsWith('custom-') && (
                        <button type="button" onClick={() => eliminarIndicador(ind.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar indicador">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {renderToolbar()}

      {vista === 'mensual' && (
        <>
          {renderCards(MESES)}
          {renderTabla(MESES)}
        </>
      )}

      {vista === 'trimestral' && (
        <>
          {renderCards(TRIMESTRES[trimestre])}
          {renderTabla(TRIMESTRES[trimestre])}
        </>
      )}

      {vista === 'graficos' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
          <h2 className="font-bold text-[#002855]">Desempeno por proceso</h2>
          {procesoStats.map((stat) => {
            const sem = getSemaforo(stat.cumplimiento);
            return (
              <div key={stat.proceso}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">{stat.proceso}</span>
                  <span className={`text-sm font-bold ${sem.text}`}>{stat.cumplimiento}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${sem.dot}`} style={{ width: `${stat.cumplimiento}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalIndicador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#002855]">Nuevo indicador</h3>
              <button type="button" onClick={() => setModalIndicador(false)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <input value={nuevoIndicador.nombre} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, nombre: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nombre del indicador" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={nuevoIndicador.area} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, area: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Area</option>
                  {AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <select value={nuevoIndicador.proceso} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, proceso: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Proceso</option>
                  {PROCESOS.map((proceso) => <option key={proceso} value={proceso}>{proceso}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={nuevoIndicador.meta} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, meta: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Meta, ej. >= 90" />
                <input value={nuevoIndicador.unidad} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, unidad: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Unidad" />
                <label className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600">
                  <input type="checkbox" checked={nuevoIndicador.es_menor} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, es_menor: e.target.checked })} />
                  Menor es mejor
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setModalIndicador(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
              <button type="button" onClick={agregarIndicador} className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001f42]">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {seguimiento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-[#002855] mb-2">Registrar seguimiento</h3>
            <p className="text-sm text-slate-600 mb-4">{seguimiento.nombre}</p>
            <div className="space-y-3">
              <button type="button" onClick={() => registrarSeguimiento('AC')} className="w-full p-3 border border-red-200 bg-red-50 rounded-lg text-left hover:bg-red-100">
                <span className="font-semibold text-red-700">Accion correctiva</span>
                <p className="text-xs text-red-600">Marca este indicador para apertura de AC.</p>
              </button>
              <button type="button" onClick={() => registrarSeguimiento('CORRECCION')} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-lg text-left hover:bg-amber-100">
                <span className="font-semibold text-amber-700">Correccion</span>
                <p className="text-xs text-amber-600">Registra seguimiento menor del indicador.</p>
              </button>
              <button type="button" onClick={() => registrarSeguimiento('MINUTA')} className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg text-left hover:bg-blue-100">
                <span className="font-semibold text-blue-700">Minuta de reunion</span>
                <p className="text-xs text-blue-600">Deja constancia para revision de comite.</p>
              </button>
            </div>
            <button type="button" onClick={() => setSeguimiento(null)} className="w-full mt-5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
