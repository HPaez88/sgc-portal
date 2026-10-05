// ═══════════════════════════
// DASHBOARD DE VIGILANCIA ANUAL — MATRIZ DE RIESGOS
// Panel del titular del módulo: vigila que TODAS las áreas levanten su matriz
// cada año (ISO 9001:2015 § 6.1) y aprueba los planes resultantes.
// ═══════════════════════════
import React, { useMemo, useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardCheck, Search, ShieldAlert, TrendingUp, XCircle,
} from 'lucide-react';
import ModalBase from '../common/ModalBase';
import {
  ESTADOS_MATRIZ_AREA,
  construirVigilanciaAnual,
  resumenEjercicio,
  aniosDisponibles,
} from '../../services/vigilanciaRiesgosService';

/** Barra de avance reutilizable (mismo lenguaje visual que el resto del SGC). */
function BarraAvance({ valor, colorClass = 'bg-sky-500' }) {
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} transition-all`} style={{ width: `${Math.min(100, valor)}%` }} />
    </div>
  );
}

function TarjetaMetrica({ icono: Icono, etiqueta, valor, colorIcono, colorValor, detalle }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Icono size={18} className={colorIcono} />
        <p className="text-xs sm:text-sm font-bold text-slate-500 leading-tight">{etiqueta}</p>
      </div>
      <p className={`text-2xl sm:text-3xl font-black ${colorValor}`}>{valor}</p>
      {detalle && <p className="text-[11px] text-slate-400 mt-1">{detalle}</p>}
    </div>
  );
}

export default function DashboardRiesgos({
  riesgos = [],
  areas = [],
  onAprobar,
  onIrAMatriz,
}) {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [areaExpandida, setAreaExpandida] = useState(null);
  const [modalAprobacion, setModalAprobacion] = useState(null); // { area, decision }
  const [comentario, setComentario] = useState('');

  const anios = useMemo(() => aniosDisponibles(riesgos), [riesgos]);

  const vigilancia = useMemo(
    () => construirVigilanciaAnual(riesgos, areas, anio),
    [riesgos, areas, anio],
  );

  const resumen = useMemo(() => resumenEjercicio(vigilancia), [vigilancia]);

  const filasFiltradas = useMemo(() => vigilancia.filter((v) => {
    if (filtroEstado && v.estado !== filtroEstado) return false;
    if (busqueda.trim() && !v.area.toLowerCase().includes(busqueda.toLowerCase().trim())) return false;
    return true;
  }), [vigilancia, filtroEstado, busqueda]);

  // Las áreas sin matriz primero: es lo que el titular necesita atender.
  const filasOrdenadas = useMemo(() => (
    [...filasFiltradas].sort((a, b) => {
      const pa = ESTADOS_MATRIZ_AREA[a.estado]?.prioridad ?? 9;
      const pb = ESTADOS_MATRIZ_AREA[b.estado]?.prioridad ?? 9;
      if (pa !== pb) return pb - pa;
      return a.area.localeCompare(b.area);
    })
  ), [filasFiltradas]);

  const confirmarAprobacion = () => {
    if (!modalAprobacion) return;
    onAprobar?.({
      area: modalAprobacion.area,
      anio,
      decision: modalAprobacion.decision,
      comentario,
    });
    setModalAprobacion(null);
    setComentario('');
  };

  return (
    <div className="space-y-5">
      {/* ── Resumen del ejercicio ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <TarjetaMetrica
          icono={ClipboardCheck}
          etiqueta="Cumplimiento de áreas"
          valor={`${resumen.porcentajeCumplimiento}%`}
          colorIcono="text-sky-500"
          colorValor="text-sky-700"
          detalle={`${resumen.areasConMatriz} de ${resumen.totalAreas} áreas con matriz`}
        />
        <TarjetaMetrica
          icono={CheckCircle2}
          etiqueta="Matrices aprobadas"
          valor={resumen.areasAprobadas}
          colorIcono="text-emerald-500"
          colorValor="text-emerald-600"
          detalle={`${resumen.areasEnviadas} esperando aprobación`}
        />
        <TarjetaMetrica
          icono={AlertCircle}
          etiqueta="Áreas sin iniciar"
          valor={resumen.areasSinIniciar}
          colorIcono="text-rose-500"
          colorValor="text-rose-600"
          detalle={`Ejercicio ${anio}`}
        />
        <TarjetaMetrica
          icono={AlertTriangle}
          etiqueta="Riesgos sin plan"
          valor={resumen.totalSinPlan}
          colorIcono="text-amber-500"
          colorValor="text-amber-600"
          detalle={`${resumen.totalRegistros} registros · ${resumen.totalCriticos} críticos`}
        />
      </div>

      {/* ── Barra de progreso del ejercicio ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Avance del ejercicio {anio}</h3>
            <p className="text-xs text-slate-500">Levantamiento de la matriz de riesgos y oportunidades por área (ISO 9001:2015 § 6.1)</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="selector-anio-riesgos" className="text-xs font-bold text-slate-600">Ejercicio</label>
            <select
              id="selector-anio-riesgos"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}{a > new Date().getFullYear() ? ' (en planeación)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <BarraAvance valor={resumen.porcentajeCumplimiento} colorClass="bg-sky-500" />
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[11px] font-semibold">
          <span className="text-emerald-600">{resumen.areasAprobadas} aprobadas</span>
          <span className="text-sky-600">{resumen.areasEnviadas} en revisión</span>
          <span className="text-amber-600">{vigilancia.filter(v => v.estado === 'EN_CAPTURA').length} en captura</span>
          <span className="text-slate-500">{resumen.areasSinIniciar} sin iniciar</span>
        </div>
      </div>

      {/* ── Pendientes de aprobación ── */}
      {resumen.areasPorAprobar.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck size={18} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-sky-900">
                {resumen.areasPorAprobar.length} área(s) enviaron su matriz y esperan tu aprobación
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {resumen.areasPorAprobar.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setModalAprobacion({ area, decision: 'APROBADA' })}
                    className="text-[11px] font-bold bg-white text-sky-800 border border-sky-300 px-2 py-1 rounded-lg hover:bg-sky-100 transition-colors"
                  >
                    Revisar {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de vigilancia por área ── */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="text-sky-600" size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">Vigilancia por Área</h2>
              <p className="text-xs text-slate-500 font-medium">Estado del levantamiento y gestión de aprobación · Ejercicio {anio}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar área..."
                aria-label="Buscar área"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white outline-none"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              aria-label="Filtrar por estado"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_MATRIZ_AREA).map(([clave, meta]) => (
                <option key={clave} value={clave}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Encabezado de columnas (escritorio) */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50/60 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <div className="col-span-3">Área</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-center">Registros</div>
          <div className="col-span-2 text-center">Exposición máx.</div>
          <div className="col-span-2">Avance de planes</div>
          <div className="col-span-1 text-center">Aprobar</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filasOrdenadas.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">No hay áreas que coincidan con el filtro.</p>
          ) : filasOrdenadas.map((v) => {
            const meta = ESTADOS_MATRIZ_AREA[v.estado] || ESTADOS_MATRIZ_AREA.SIN_INICIAR;
            const expandida = areaExpandida === v.area;
            const propios = riesgos.filter((r) => (r.area || '') === v.area);

            return (
              <div key={v.area}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 sm:px-6 py-4 items-center hover:bg-slate-50/60 transition-colors">
                  {/* Área + expandir */}
                  <div className="lg:col-span-3 flex items-start gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setAreaExpandida(expandida ? null : v.area)}
                      aria-label={expandida ? `Contraer ${v.area}` : `Expandir ${v.area}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 mt-0.5"
                    >
                      {expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 break-words">{v.area}</p>
                      {v.criticos > 0 && (
                        <p className="text-[11px] font-bold text-rose-600">{v.criticos} riesgo(s) crítico(s)</p>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="lg:col-span-2 lg:text-center">
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Registros */}
                  <div className="lg:col-span-2 lg:text-center">
                    <p className="text-sm font-bold text-slate-700">
                      {v.total}
                      <span className="text-[11px] font-medium text-slate-400 ml-1">total</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {v.riesgos} riesgos · {v.oportunidades} oport.
                    </p>
                  </div>

                  {/* Exposición máxima */}
                  <div className="lg:col-span-2 lg:text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-black border text-sm ${v.exposicionMaxima >= 15 ? 'bg-red-100 text-red-700 border-red-200'
                      : v.exposicionMaxima >= 10 ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : v.exposicionMaxima >= 5 ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                      {v.exposicionMaxima}
                    </span>
                  </div>

                  {/* Avance de planes */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                      <span className="text-slate-600">{v.avancePlan}%</span>
                      {v.sinPlan > 0 && <span className="text-amber-600">{v.sinPlan} sin plan</span>}
                    </div>
                    <BarraAvance
                      valor={v.avancePlan}
                      colorClass={v.avancePlan === 100 ? 'bg-emerald-500' : v.avancePlan >= 50 ? 'bg-sky-500' : 'bg-amber-500'}
                    />
                  </div>

                  {/* Acciones de aprobación */}
                  <div className="lg:col-span-1 flex lg:justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={v.total === 0}
                      onClick={() => setModalAprobacion({ area: v.area, decision: 'APROBADA' })}
                      title={v.total === 0 ? 'El área aún no registra riesgos' : `Aprobar la matriz de ${v.area}`}
                      className="p-2 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={v.total === 0}
                      onClick={() => setModalAprobacion({ area: v.area, decision: 'CON_OBSERVACIONES' })}
                      title={v.total === 0 ? 'El área aún no registra riesgos' : `Regresar la matriz de ${v.area} con observaciones`}
                      className="p-2 rounded-lg text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>

                {/* Detalle expandido: los riesgos del área */}
                {expandida && (
                  <div className="px-4 sm:px-6 pb-4 bg-slate-50/60">
                    {propios.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-3">
                        Esta área no ha registrado riesgos ni oportunidades en el ejercicio {anio}.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-2">
                        {propios.map((r) => {
                          const nivel = (Number(r.probabilidad) || 0) * (Number(r.impacto) || 0);
                          return (
                            <div key={r.id} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                              <div className="min-w-0">
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mr-2 ${r.tipo === 'Oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                  {r.tipo}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">{r.riesgo}</span>
                                {r.plan_accion && (
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.plan_accion}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-bold text-slate-600">Nivel {nivel}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.aprobacion_matriz === 'APROBADA' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : r.aprobacion_matriz === 'CON_OBSERVACIONES' ? 'bg-orange-100 text-orange-700 border-orange-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                  {r.aprobacion_matriz === 'APROBADA' ? 'Aprobado'
                                    : r.aprobacion_matriz === 'CON_OBSERVACIONES' ? 'Con observaciones'
                                      : 'Pendiente'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onIrAMatriz?.(v.area, anio)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      <TrendingUp size={13} /> Abrir la matriz de {v.area} para edición
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal de aprobación ── */}
      {modalAprobacion && (
        <ModalBase
          isOpen
          onClose={() => { setModalAprobacion(null); setComentario(''); }}
          titulo={modalAprobacion.decision === 'APROBADA' ? 'Aprobar matriz del área' : 'Regresar con observaciones'}
          subtitulo={`${modalAprobacion.area} · Ejercicio ${anio}`}
          icono={<ClipboardCheck size={18} />}
          size="md"
          footer={(
            <>
              <button
                type="button"
                onClick={() => { setModalAprobacion(null); setComentario(''); }}
                className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-xl hover:bg-slate-100 text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={modalAprobacion.decision !== 'APROBADA' && !comentario.trim()}
                onClick={confirmarAprobacion}
                className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-40 ${modalAprobacion.decision === 'APROBADA'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-orange-600 hover:bg-orange-700'
                  }`}
              >
                {modalAprobacion.decision === 'APROBADA' ? 'Aprobar matriz' : 'Regresar con observaciones'}
              </button>
            </>
          )}
        >
          <div className="space-y-4">
            {(() => {
              const v = vigilancia.find((x) => x.area === modalAprobacion.area);
              if (!v) return null;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Registros capturados</span><span className="font-bold text-slate-800">{v.total}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Riesgos / Oportunidades</span><span className="font-bold text-slate-800">{v.riesgos} / {v.oportunidades}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Riesgos críticos</span><span className={`font-bold ${v.criticos > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{v.criticos}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Con plan de acción</span><span className="font-bold text-slate-800">{v.conPlan} de {v.total}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Avance de planes</span><span className="font-bold text-slate-800">{v.avancePlan}%</span></div>
                </div>
              );
            })()}

            <div>
              <label htmlFor="comentario-aprobacion" className="block text-xs font-bold text-slate-700 mb-1.5">
                Comentario de revisión {modalAprobacion.decision !== 'APROBADA' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                id="comentario-aprobacion"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={4}
                placeholder={modalAprobacion.decision === 'APROBADA'
                  ? 'Observaciones opcionales para el expediente...'
                  : 'Indica qué debe corregir el área antes de aprobar su matriz...'}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-y focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  );
}