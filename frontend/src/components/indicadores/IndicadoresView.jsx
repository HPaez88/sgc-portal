import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, LineChart, Plus, Save, Trash2, X, FileWarning } from 'lucide-react';
import { INDICADORES } from '../../constants';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ContenedorModal from '../common/ContenedorModal';
import { acDesdeIndicador, movimientoVinculo } from '../../services/flujoService';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TRIMESTRES = {
  1: ['Ene', 'Feb', 'Mar'],
  2: ['Abr', 'May', 'Jun'],
  3: ['Jul', 'Ago', 'Sep'],
  4: ['Oct', 'Nov', 'Dic'],
};
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];
const PAGE_SIZE = 20;
const MESES_POR_PERIODICIDAD = {
  Mensual: MESES,
  Trimestral: ['Mar', 'Jun', 'Sep', 'Dic'],
  Semestral: ['Jun', 'Dic'],
  Bimestral: ['Feb', 'Abr', 'Jun', 'Ago', 'Oct', 'Dic'],
  Anual: ['Dic'],
};

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
    valido: Number.isFinite(numeric),
  };
}

function getSemaforo(pct) {
  if (pct === null || pct === undefined) {
    return { label: 'Sin datos', dot: 'bg-slate-300', text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
  }
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

function mesesEvaluacion(indicador, mesesVista) {
  const permitidos = MESES_POR_PERIODICIDAD[indicador.periodicidad] || MESES;
  return mesesVista.filter((mes) => permitidos.includes(mes));
}

export default function IndicadoresView({
  indicadoresData = {},
  setIndicadoresData,
  puedeTodasAreas,
  areaUsuario,
}) {
  const { areas, procesos, setAccionesCorrectivas, registrarMovimiento } = useSGC();
  const toast = useToast();
  const [vista, setVista] = useState('mensual');
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [trimestre, setTrimestre] = useState(1);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);
  const [valorTemporal, setValorTemporal] = useState('');
  const [modalIndicador, setModalIndicador] = useState(false);
  const [nuevoIndicador, setNuevoIndicador] = useState(emptyIndicador);
  const [seguimiento, setSeguimiento] = useState(null);
  const [errorValidacion, setErrorValidacion] = useState('');

  useEffect(() => {
    if (!modalIndicador && !seguimiento) return undefined;
    const overflowAnterior = document.body.style.overflow;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        setModalIndicador(false);
        setSeguimiento(null);
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [modalIndicador, seguimiento]);

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

  const mesesActivos = vista === 'trimestral' ? TRIMESTRES[trimestre] : MESES;

  const indicadoresFiltrados = useMemo(() => (
    indicadores.filter((ind) => {
      if (filtroArea && ind.area !== filtroArea) return false;
      if (filtroProceso && ind.proceso !== filtroProceso) return false;
      if (busqueda && !`${ind.nombre} ${ind.area} ${ind.proceso}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())) return false;
      return true;
    })
  ), [busqueda, filtroArea, filtroProceso, indicadores]);

  const totalPaginas = Math.max(1, Math.ceil(indicadoresFiltrados.length / PAGE_SIZE));
  const indicadoresPagina = indicadoresFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const guardarData = (patch) => {
    setIndicadoresData((prev = {}) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  const getValor = (indicadorId, mes) => (
    resultados[valueKey(indicadorId, mes, anio)]
    ?? (anio === ANIO_ACTUAL ? resultados[`${indicadorId}-${mes}`] : '')
    ?? ''
  );

  const calcularCumplimiento = (indicador, mesesEval) => {
    const metaInfo = parseMeta(indicador.meta);
    if (!metaInfo.valido) return null;
    const esMenor = indicador.es_menor ?? metaInfo.esMenor;
    const valores = mesesEvaluacion(indicador, mesesEval)
      .map((mes) => getValor(indicador.id, mes))
      .map((v) => Number.parseFloat(String(v).replace(/[,%\s]/g, '')))
      .filter((v) => Number.isFinite(v));

    if (valores.length === 0) return null;

    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    if (metaInfo.valor === 0) return promedio > 0 ? (esMenor ? 0 : 100) : 100;

    let cumplimiento = 0;
    if (esMenor) {
      if (promedio <= metaInfo.valor) cumplimiento = 100;
      else cumplimiento = (metaInfo.valor / promedio) * 100;
    } else {
      if (promedio >= metaInfo.valor) cumplimiento = 100;
      else cumplimiento = (promedio / metaInfo.valor) * 100;
    }

    return Math.max(0, Math.min(100, Math.round(cumplimiento)));
  };

  const procesoStats = useMemo(() => {
    return procesosUnicos.map((proceso) => {
      const items = indicadoresFiltrados.filter((ind) => ind.proceso === proceso);
      const cumplimientos = items
        .map((ind) => calcularCumplimiento(ind, mesesActivos))
        .filter((valor) => valor !== null);
      const total = cumplimientos.reduce((sum, valor) => sum + valor, 0);
      return {
        proceso,
        count: items.length,
        evaluados: cumplimientos.length,
        cumplimiento: cumplimientos.length ? Math.round(total / cumplimientos.length) : null,
      };
    }).filter((item) => item.count > 0);
  }, [indicadoresFiltrados, procesosUnicos, resultados, anio, mesesActivos]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroArea, filtroProceso]);

  const iniciarEdicion = (indicadorId, mes) => {
    setErrorValidacion('');
    setEditando(valueKey(indicadorId, mes, anio));
    setValorTemporal(getValor(indicadorId, mes));
  };

  const guardarResultado = () => {
    if (!editando) return;
    const valor = String(valorTemporal).trim().replace(',', '.');
    const clave = editando;
    if (!valor || !Number.isFinite(Number(valor))) {
      setErrorValidacion('Captura un valor numérico válido.');
      return;
    }
    setEditando(null);
    setValorTemporal('');
    guardarData({
      resultados: {
        ...resultados,
        [clave]: valor,
      },
    });
    setErrorValidacion('');
    setValorTemporal('');
  };

  const agregarIndicador = () => {
    if (!nuevoIndicador.nombre.trim() || !nuevoIndicador.area || !nuevoIndicador.proceso || !String(nuevoIndicador.meta).trim()) {
      setErrorValidacion('Completa nombre, área, proceso y meta del indicador.');
      return;
    }
    const metaInfo = parseMeta(nuevoIndicador.meta);
    if (!metaInfo.valido || metaInfo.valor < 0) {
      setErrorValidacion('La meta debe ser un número mayor o igual a cero.');
      return;
    }
    const creado = {
      ...nuevoIndicador,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      meta: metaInfo.valor,
      es_menor: nuevoIndicador.es_menor || metaInfo.esMenor,
      origen: 'manual',
    };
    guardarData({ indicadoresPersonalizados: [...personalizados, creado] });
    setErrorValidacion('');
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
          id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          indicadorId: seguimiento.id,
          nombre: seguimiento.nombre,
          area: seguimiento.area,
          responsableArea: seguimiento.area,
          tipo,
          fecha: new Date().toISOString(),
          estado: 'ABIERTO',
          notificarResponsable: tipo === 'AVISO_RESPONSABLE',
        },
      ],
    });
    setSeguimiento(null);
    toast.success('Seguimiento registrado sobre el indicador.');
  };

  // ── PUENTE INTER-MÓDULOS: Indicador fuera de meta → Acción Correctiva ──
  // ISO 9001:2015 § 9.1.3 (Análisis y evaluación) → § 10.2 (No conformidad y acción correctiva)
  const abrirAccionCorrectiva = (indicador, cumplimiento) => {
    if (typeof setAccionesCorrectivas !== 'function') {
      toast.error('El módulo de Acciones Correctivas no está disponible en esta sesión.');
      return;
    }
    const nueva = acDesdeIndicador(indicador, {
      cumplimiento,
      anio,
      meses: mesesActivos,
    });
    setAccionesCorrectivas(prev => [nueva, ...(prev || [])]);
    registrarMovimiento(movimientoVinculo({
      origenModulo: 'INDICADORES',
      destinoModulo: 'ACCIONES_CORRECTIVAS',
      referencia: indicador.nombre,
      folio: nueva.folio_codigo,
      detalle: `Indicador "${indicador.nombre}" con cumplimiento ${cumplimiento === null ? 'sin datos' : `${cumplimiento}%`} en ${anio}.`,
    }));
    setSeguimiento(null);
    toast.success(
      `Acción Correctiva ${nueva.folio_codigo} creada en borrador desde el indicador.`,
      { titulo: 'Vínculo ISO 9.1.3 → 10.2', duracion: 6000 },
    );
  };

  const contarSeguimientos = (indicadorId) => (
    seguimientos.filter((item) => String(item.indicadorId) === String(indicadorId)).length
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vista === id ? 'bg-[#002855] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={anio} onChange={(e) => { setAnio(Number(e.target.value)); setEditando(null); setValorTemporal(''); }} className="px-3 py-2 text-sm border-slate-200 rounded-lg" aria-label="Año de captura">
          {ANIOS_DISPONIBLES.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar indicador..." aria-label="Buscar indicador" className="px-3 py-2 text-sm border-slate-200 rounded-lg min-w-52" />
        <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">Todas las areas</option>
          {areasUnicas.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
        <select value={filtroProceso} onChange={(e) => setFiltroProceso(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
          <option value="">Todos los procesos</option>
          {procesosUnicos.map((proceso) => <option key={proceso} value={proceso}>{proceso}</option>)}
        </select>
        {(filtroArea || filtroProceso) && (
          <button type="button" onClick={() => { setFiltroArea(''); setFiltroProceso(''); }} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Limpiar
          </button>
        )}
        <button type="button" onClick={() => { setErrorValidacion(''); setModalIndicador(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-lg text-sm font-medium hover:bg-[#001f42]">
          <Plus size={16} />
          Nuevo indicador
        </button>
      </div>

      {errorValidacion && (
        <p role="alert" className="w-full text-sm text-red-700 bg-red-50 border-red-200 rounded-lg px-3 py-2">{errorValidacion}</p>
      )}

      {vista === 'trimestral' && (
        <div className="flex gap-2 w-full">
          {[1, 2, 3, 4].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrimestre(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${trimestre === t ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              T{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderCards = (mesesEval = MESES) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
      {procesoStats.map((stat) => {
        const items = indicadoresFiltrados.filter((ind) => ind.proceso === stat.proceso);
        const cumplimientos = items
          .map((ind) => calcularCumplimiento(ind, mesesEval))
          .filter((valor) => valor !== null);
        const cumplimiento = cumplimientos.length
          ? Math.round(cumplimientos.reduce((sum, valor) => sum + valor, 0) / cumplimientos.length)
          : null;
        const sem = getSemaforo(cumplimiento);
        return (
          <div key={stat.proceso} className={`p-3.5 rounded-xl border shadow-card-subtle ${sem.bg} ${sem.border} flex flex-col justify-between hover:shadow-card-hover transition-all`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={stat.proceso}>{stat.proceso}</p>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${sem.dot}`} />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <p className={`text-2xl font-black font-mono font-tabular ${sem.text}`}>{cumplimiento === null ? '--' : `${cumplimiento}%`}</p>
              <p className="text-[11px] text-slate-500 font-medium">{stat.evaluados}/{stat.count} evaluados</p>
            </div>
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
    if (cumplimiento === null || cumplimiento < 80) {
      return (
        <button type="button" onClick={() => setSeguimiento(ind)} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">
          <AlertTriangle size={14} />
          Seguimiento
        </button>
      );
    }
    return <span className="text-xs text-slate-500">Sin accion</span>;
  };

  const renderTabla = (mesesEval) => (
    <div className="bg-white rounded-xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">Indicadores del Sistema {anio}</h2>
        <span className="text-xs font-mono font-medium text-slate-500">{indicadoresFiltrados.length} visibles · página {pagina}/{totalPaginas}</span>
      </div>
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-left border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 min-w-[280px]">Indicador</th>
              <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 min-w-[150px]">Área</th>
              <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 min-w-[110px]">Meta</th>
              {mesesEval.map((mes) => <th key={mes} className="p-2 font-bold uppercase tracking-wider text-[11px] text-slate-500 text-center w-14 min-w-[50px]">{mes}</th>)}
              <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 text-center min-w-[120px]">Cumplimiento</th>
              <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 text-center min-w-[110px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {indicadoresPagina.map((ind) => {
              const cumplimiento = calcularCumplimiento(ind, mesesEval);
              const sem = getSemaforo(cumplimiento);
              return (
                <tr key={ind.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{ind.nombre}</div>
                    <div className="text-xs text-slate-500">{ind.proceso || 'Sin proceso'}</div>
                  </td>
                  <td className="p-3 text-slate-700">{ind.area}</td>
                  <td className="p-3 text-slate-700">{(ind.es_menor ?? parseMeta(ind.meta).esMenor) ? '<= ' : '>= '}{parseMeta(ind.meta).valor} {ind.unidad}</td>
                  {mesesEval.map((mes) => {
                    const key = valueKey(ind.id, mes, anio);
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
                              className="w-16 p-1 text-center text-xs border border-cyan-500 rounded" inputMode="decimal" aria-label={`Valor ${ind.nombre} ${mes}`}
                            />
                            <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); guardarResultado(); }} className="p-1 text-emerald-700 hover:bg-emerald-50 rounded" title="Guardar valor" aria-label={`Guardar valor de ${ind.nombre} ${mes}`}>
                              <Save size={14} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => iniciarEdicion(ind.id, mes)} className="min-w-12 px-2 py-1 rounded text-xs hover:bg-cyan-50 text-slate-700">
                            {getValor(ind.id, mes) === '' ? '-' : getValor(ind.id, mes)}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${sem.bg} ${sem.text}`}>
                      <span className={`w-2 h-2 rounded-full ${sem.dot}`} />
                      {cumplimiento === null ? '--' : `${cumplimiento}%`}
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
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm">
          <span className="text-slate-500">Mostrando {(pagina - 1) * PAGE_SIZE + 1}-{Math.min(pagina * PAGE_SIZE, indicadoresFiltrados.length)} de {indicadoresFiltrados.length}</span>
          <div className="flex gap-2">
            <button type="button" disabled={pagina === 1} onClick={() => setPagina((actual) => Math.max(1, actual - 1))} className="rounded-lg border-slate-200 px-3 py-1.5 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} className="rounded-lg border-slate-200 px-3 py-1.5 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
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
                  <span className={`text-sm font-bold ${sem.text}`}>{stat.cumplimiento === null ? '--' : `${stat.cumplimiento}%`}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${sem.dot}`} style={{ width: `${stat.cumplimiento ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Indicador */}
      <ContenedorModal
        isOpen={modalIndicador}
        onClose={() => { setErrorValidacion(''); setModalIndicador(false); }}
        size="lg"
        backdropClassName="bg-black/50"
      >
        <div className="max-h-full overflow-y-auto bg-white rounded-xl p-6 w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#002855]">Nuevo indicador</h3>
              <button type="button" onClick={() => { setErrorValidacion(''); setModalIndicador(false); }} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <input value={nuevoIndicador.nombre} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, nombre: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nombre del indicador" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={nuevoIndicador.area} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, area: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Area</option>
                  {areas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <select value={nuevoIndicador.proceso} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, proceso: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Proceso</option>
                  {procesos.map((proceso) => <option key={proceso} value={proceso}>{proceso}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={nuevoIndicador.meta} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, meta: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Meta, ej. >= 90" />
                <input value={nuevoIndicador.unidad} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, unidad: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Unidad" />
                <label className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700">
                  <input type="checkbox" checked={nuevoIndicador.es_menor} onChange={(e) => setNuevoIndicador({ ...nuevoIndicador, es_menor: e.target.checked })} />
                  Menor es mejor
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setErrorValidacion(''); setModalIndicador(false); }} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg">Cancelar</button>
              <button type="button" onClick={agregarIndicador} className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001f42]">Guardar</button>
            </div>
        </div>
      </ContenedorModal>

      {/* Modal de seguimiento del indicador */}
      <ContenedorModal
        isOpen={Boolean(seguimiento)}
        onClose={() => setSeguimiento(null)}
        size="lg"
        backdropClassName="bg-black/50"
      >
        {seguimiento && (
            <div className="max-h-full overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
              <h3 id="seguimiento-title" className="font-bold text-[#002855] mb-2">Registrar seguimiento</h3>
              <p className="text-sm text-slate-700 mb-4">{seguimiento.nombre}</p>
              <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Responsable del área: <strong>{seguimiento.area || 'Área no asignada'}</strong></p>
              <div className="space-y-3">
              {/* PUENTE ISO 9.1.3 → 10.2: genera una AC real en el módulo de Acciones Correctivas */}
              <button
                type="button"
                onClick={() => abrirAccionCorrectiva(seguimiento, calcularCumplimiento(seguimiento, mesesActivos))}
                className="w-full p-3 border border-rose-300 bg-rose-50 rounded-lg text-left hover:bg-rose-100"
              >
                <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                  <FileWarning size={14} /> Abrir Acción Correctiva
                </span>
                <p className="text-xs text-rose-600">Genera una AC en borrador precargada con el indicador, su área y su proceso (ISO § 9.1.3 → § 10.2).</p>
              </button>
              <button type="button" onClick={() => registrarSeguimiento('AVISO_RESPONSABLE')} className="w-full p-3 border-cyan-200 bg-cyan-50 rounded-lg text-left hover:bg-cyan-100">
                <span className="font-semibold text-cyan-700">Avisar al responsable del área</span>
                <p className="text-xs text-cyan-600">Registra una notificación pendiente para {seguimiento.area || 'el área responsable'}.</p>
              </button>
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
            <button type="button" onClick={() => setSeguimiento(null)} className="w-full mt-5 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg">Cancelar</button>
            </div>
        )}
      </ContenedorModal>
    </div>
  );
}
