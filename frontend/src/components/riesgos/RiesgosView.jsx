import React, { useMemo, useState } from 'react';
import { useSGC } from '../../SGCContext';
import {
  Plus, ShieldAlert, Target, Shield, AlertTriangle, AlertCircle, CheckCircle2,
  TrendingUp, LayoutDashboard, Table2, MousePointerClick,
} from 'lucide-react';
import { useToast } from '../common/Toast';
import ModalBase from '../common/ModalBase';
import { pmDesdeRiesgo, movimientoVinculo } from '../../services/flujoService';
import { aplicarAprobacion, anioDeRiesgo, ESTADOS_MATRIZ_AREA } from '../../services/vigilanciaRiesgosService';
import CampoPlanAccion from './CampoPlanAccion';
import DashboardRiesgos from './DashboardRiesgos';

export default function RiesgosView({ riesgos, setRiesgos, usuarios, puedeTodasAreas, areaUsuario }) {
  const { areas, procesos, setPlanesMejora, registrarMovimiento, usuarioLogueado } = useSGC();
  const toast = useToast();
  const safeRiesgos = riesgos || [];

  // Pestañas: dashboard de gestión (titular del módulo) y matriz de captura.
  const [vistaActiva, setVistaActiva] = useState(puedeTodasAreas ? 'dashboard' : 'matriz');

  // La matriz no muestra nada hasta elegir área: evita exponer y cargar
  // todos los registros de todas las áreas de golpe.
  const [areaSeleccionada, setAreaSeleccionada] = useState(
    puedeTodasAreas ? '' : (areaUsuario || ''),
  );
  const [anioMatriz, setAnioMatriz] = useState(new Date().getFullYear());

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState({
    riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2,
    control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '',
    plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN'
  });

  // Registros visibles: solo los del área elegida y el ejercicio activo.
  const riesgosVisibles = useMemo(() => {
    if (!areaSeleccionada) return [];
    return safeRiesgos.filter((r) =>
      (r.area || '') === areaSeleccionada && anioDeRiesgo(r) === anioMatriz,
    );
  }, [safeRiesgos, areaSeleccionada, anioMatriz]);

  // Ejercicios del área seleccionada. Incluye el año en curso y el siguiente
  // (la planificación es prospectiva), más cualquier año con registros.
  const aniosMatriz = useMemo(() => {
    const actual = new Date().getFullYear();
    const set = new Set([actual + 1, actual]);
    safeRiesgos
      .filter((r) => (r.area || '') === areaSeleccionada)
      .forEach((r) => { const a = anioDeRiesgo(r); if (a) set.add(a); });
    return [...set].sort((a, b) => b - a);
  }, [safeRiesgos, areaSeleccionada]);

  const getNivel = (prob, imp) => prob * imp;

  const getColorNivelBadge = (nivel) => {
    if (nivel >= 15) return "bg-red-100 text-red-700 border-red-200";
    if (nivel >= 10) return "bg-orange-100 text-orange-700 border-orange-200";
    if (nivel >= 5) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const agregarRiesgo = () => {
    if (!nuevoRiesgo.riesgo) {
      toast.warning('Describe el riesgo o la oportunidad antes de guardar.');
      return;
    }
    const areaFinal = areaSeleccionada || ((!puedeTodasAreas && areaUsuario) ? areaUsuario : nuevoRiesgo.area);
    if (!areaFinal) {
      toast.warning('Selecciona el área antes de registrar.');
      return;
    }
    setRiesgos(prev => {
      const lista = prev || [];
      // ID incremental seguro: nunca colisiona aunque se eliminen registros.
      const siguienteId = lista.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
      return [...lista, {
        ...nuevoRiesgo,
        area: areaFinal,
        id: siguienteId,
        fecha_creacion: new Date().toISOString().split('T')[0],
      }];
    });
    registrarMovimiento({
      modulo: 'RIESGOS',
      accion: 'CREACION',
      descripcion: `Registro de ${nuevoRiesgo.tipo.toLowerCase()}: ${nuevoRiesgo.riesgo}`,
      detalles: `Área: ${areaFinal}. Probabilidad: ${nuevoRiesgo.probabilidad}. Impacto: ${nuevoRiesgo.impacto}.`,
      folio: 'MATRIZ-RIESGOS',
    });
    setNuevoRiesgo({ riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' });
    setMostrarModal(false);
    toast.success(`${nuevoRiesgo.tipo} agregado a la matriz de ${areaFinal}.`);
  };

  /**
   * Aprueba o regresa la matriz completa de un área para el ejercicio.
   * Es la acción de gestión del titular del módulo.
   */
  const gestionarAprobacion = ({ area, anio, decision, comentario }) => {
    setRiesgos(prev => aplicarAprobacion(prev || [], area, anio, decision, comentario, usuarioLogueado));
    registrarMovimiento({
      modulo: 'RIESGOS',
      accion: decision === 'APROBADA' ? 'APROBACION' : 'OBSERVACION',
      descripcion: decision === 'APROBADA'
        ? `Aprobación de la matriz de riesgos del área ${area} (ejercicio ${anio})`
        : `Matriz de ${area} regresada con observaciones (ejercicio ${anio})`,
      detalles: comentario || 'Sin comentario adicional.',
      folio: `MATRIZ-${anio}`,
    });
    toast.success(
      decision === 'APROBADA'
        ? `Matriz de ${area} aprobada para el ejercicio ${anio}.`
        : `Matriz de ${area} regresada con observaciones.`,
      { titulo: 'Gestión de la matriz de riesgos' },
    );
  };

  /**
   * Actualiza un riesgo registrando el cambio en la bitácora.
   * La persistencia remota está agrupada (debounce) en el SGCContext,
   * así que escribir aquí no dispara una llamada por pulsación de tecla.
   */
  const actualizarRiesgo = (id, patch, descripcionCambio) => {
    setRiesgos(prev => (prev || []).map(x => (x.id === id ? { ...x, ...patch } : x)));
    if (descripcionCambio) {
      const riesgo = safeRiesgos.find(r => r.id === id);
      registrarMovimiento({
        modulo: 'RIESGOS',
        accion: 'MODIFICACION',
        descripcion: `${descripcionCambio}: ${riesgo?.riesgo || `riesgo #${id}`}`,
        detalles: `Área: ${riesgo?.area || 'N/D'}.`,
        folio: 'MATRIZ-RIESGOS',
      });
    }
  };

  // ── PUENTE INTER-MÓDULOS: Riesgo sin plan → Plan de Mejora ──
  // ISO 9001:2015 § 6.1 (Riesgos y oportunidades) → § 10.3 (Mejora continua)
  const abrirPlanMejora = (riesgo) => {
    if (typeof setPlanesMejora !== 'function') {
      toast.error('El módulo de Planes de Mejora no está disponible en esta sesión.');
      return;
    }
    const nuevo = pmDesdeRiesgo(riesgo);
    setPlanesMejora(prev => [nuevo, ...(prev || [])]);
    registrarMovimiento(movimientoVinculo({
      origenModulo: 'RIESGOS',
      destinoModulo: 'PLANES_MEJORA',
      referencia: riesgo.riesgo,
      folio: nuevo.folio_codigo,
      detalle: `Riesgo sin plan de acción convertido en Plan de Mejora. Exposición: ${(Number(riesgo.probabilidad) || 0) * (Number(riesgo.impacto) || 0)}.`,
    }));
    toast.success(
      `Plan de Mejora ${nuevo.folio_codigo} creado en borrador desde el riesgo.`,
      { titulo: 'Vínculo ISO 6.1 → 10.3', duracion: 6000 },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ═══════════════════════════════════════
          SELECTOR DE PESTAÑAS
          Dashboard = gestión del titular (vigilancia anual + aprobación).
          Matriz    = captura y edición por área.
          ═══════════════════════════════════════ */}
      <div className="bg-white p-2 rounded-xl shadow-card-subtle border border-slate-200/80 inline-flex gap-1 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setVistaActiva('dashboard')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            vistaActiva === 'dashboard' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard size={16} /> Dashboard de gestión
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva('matriz')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            vistaActiva === 'matriz' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Table2 size={16} /> Matriz por área
        </button>
      </div>

      {/* ═══════════════ PESTAÑA 1: DASHBOARD DE GESTIÓN ═══════════════ */}
      {vistaActiva === 'dashboard' && (
        <DashboardRiesgos
          riesgos={safeRiesgos}
          areas={areas}
          usuarioLogueado={usuarioLogueado}
          onAprobar={gestionarAprobacion}
          onIrAMatriz={(area, anio) => {
            setAreaSeleccionada(area);
            setAnioMatriz(anio);
            setVistaActiva('matriz');
          }}
        />
      )}

      {/* ═══════════════ PESTAÑA 2: MATRIZ POR ÁREA ═══════════════ */}
      {vistaActiva === 'matriz' && (
      <>
      {/* Selector de área: obligatorio para ver datos */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-card-subtle border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="selector-area-riesgos" className="block text-xs font-bold text-slate-700 mb-1.5">
              Área <span className="text-rose-500">*</span>
            </label>
            {!puedeTodasAreas ? (
              <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold text-slate-900">
                {areaUsuario || 'Sin área asignada'}
                <span className="ml-2 text-[11px] font-medium text-slate-500">(tu área asignada)</span>
              </div>
            ) : (
              <select
                id="selector-area-riesgos"
                value={areaSeleccionada}
                onChange={(e) => setAreaSeleccionada(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">Seleccionar área para revisar su matriz...</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>

          <div className="sm:w-40">
            <label htmlFor="selector-anio-matriz" className="block text-xs font-bold text-slate-700 mb-1.5">Ejercicio</label>
            <select
              id="selector-anio-matriz"
              value={anioMatriz}
              onChange={(e) => setAnioMatriz(Number(e.target.value))}
              disabled={!areaSeleccionada}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-50"
            >
              {aniosMatriz.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {areaSeleccionada && (
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#152e4d] transition-all shadow-sm whitespace-nowrap"
            >
              <Plus size={15} strokeWidth={2.5} /> Nuevo Registro
            </button>
          )}
        </div>

        {areaSeleccionada && (() => {
          const estadoArea = riesgosVisibles.length > 0
            ? (riesgosVisibles[0].aprobacion_matriz || 'EN_CAPTURA')
            : 'SIN_INICIAR';
          const meta = ESTADOS_MATRIZ_AREA[estadoArea] || ESTADOS_MATRIZ_AREA.SIN_INICIAR;
          return (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-xs text-slate-500">
                {riesgosVisibles.length} registro(s) en el ejercicio {anioMatriz}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Estado vacío: nada visible hasta elegir área */}
      {!areaSeleccionada ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-16 text-center">
          <MousePointerClick size={44} className="mx-auto text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-700">Selecciona un área para revisar su matriz</p>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            La matriz de riesgos y oportunidades se consulta por área. Elige un área del selector
            de arriba para ver, capturar y evaluar sus riesgos del ejercicio seleccionado.
          </p>
        </div>
      ) : (
      <>
      {/* Resumen del área seleccionada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Riesgos Altos</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-600">{riesgosVisibles.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 10).length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Riesgos Medios</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500">{riesgosVisibles.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 5 && getNivel(r.probabilidad, r.impacto) < 10).length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-emerald-500" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Riesgos Bajos</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-500">{riesgosVisibles.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) < 5).length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-blue-500" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Oportunidades</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600">{riesgosVisibles.filter(r => r.tipo === 'Oportunidad').length}</p>
        </div>
      </div>

      {/* Tabla Matriz */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
              <ShieldAlert className="text-sky-600" size={20} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Matriz de Riesgos y Oportunidades</h2>
              <p className="text-xs text-slate-500 font-medium">Gestión y evaluación de criticidad por proceso ISO 9001:2015</p>
            </div>
          </div>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#152e4d] transition-all shadow-sm">
            <Plus size={15} strokeWidth={2.5} /> Nuevo Registro
          </button>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            VISTA ESCRITORIO (lg+): tabla completa, sin scroll horizontal.
            Los anchos son porcentajes de un contenedor fluido, así que la
            tabla se adapta al ancho disponible en vez de desbordarse.
            ═══════════════════════════════════════ */}
        <div className="hidden lg:block">
          <table className="w-full text-left table-fixed">
            <colgroup>
              {/* Reparto deliberado: el Plan de Acción es la columna con más
                  contenido y se lleva la mayor parte del ancho. */}
              <col style={{ width: '17%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '5%' }} />
            </colgroup>
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-3 text-sm font-bold text-slate-700">Riesgo / Oportunidad</th>
                <th className="p-3 text-sm font-bold text-slate-700">Área / Proceso</th>
                <th className="p-3 text-sm font-bold text-slate-700 text-center">Prob.</th>
                <th className="p-3 text-sm font-bold text-slate-700 text-center">Imp.</th>
                <th className="p-3 text-sm font-bold text-slate-700 text-center">Nivel</th>
                <th className="p-3 text-sm font-bold text-slate-700">Plan de Acción (Control)</th>
                <th className="p-3 text-sm font-bold text-slate-700">Fecha Límite</th>
                <th className="p-3 text-sm font-bold text-slate-700">Evaluación</th>
                <th className="p-3 text-sm font-bold text-slate-700 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeRiesgos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">No hay riesgos registrados.</td>
                </tr>
              ) : safeRiesgos.map(r => {
                const nivel = getNivel(r.probabilidad, r.impacto);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.tipo === 'Oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {r.tipo}
                        </span>
                        <p className="font-medium text-slate-800 break-words">{r.riesgo}</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <p className="text-sm font-semibold text-slate-700 break-words">{r.area || '-'}</p>
                      <p className="text-xs text-slate-500 break-words">{r.proceso || '-'}</p>
                    </td>
                    <td className="p-3 text-center align-top">
                      <select
                        value={r.probabilidad}
                        onChange={(e) => actualizarRiesgo(r.id, { probabilidad: parseInt(e.target.value) })}
                        aria-label={`Probabilidad de ${r.riesgo}`}
                        className="w-12 p-1.5 text-center text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-center align-top">
                      <select
                        value={r.impacto}
                        onChange={(e) => actualizarRiesgo(r.id, { impacto: parseInt(e.target.value) })}
                        aria-label={`Impacto de ${r.riesgo}`}
                        className="w-12 p-1.5 text-center text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-center align-top">
                      <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full font-black border text-sm ${getColorNivelBadge(nivel)}`}>
                        {nivel}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <CampoPlanAccion
                        valor={r.plan_accion || ''}
                        onChange={(v) => actualizarRiesgo(r.id, { plan_accion: v })}
                      />
                    </td>
                    <td className="p-3 align-top">
                      <input
                        type="date"
                        value={r.fecha_termino || ''}
                        onChange={(e) => actualizarRiesgo(r.id, { fecha_termino: e.target.value })}
                        aria-label={`Fecha límite de ${r.riesgo}`}
                        className="w-full p-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="p-3 align-top">
                      <select
                        value={r.evaluacion || ''}
                        onChange={(e) => actualizarRiesgo(r.id, { evaluacion: e.target.value }, 'Evaluación de eficacia del plan')}
                        aria-label={`Evaluación de ${r.riesgo}`}
                        className="w-full p-1.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Evaluar...</option>
                        <option value="Bueno" className="text-emerald-600">🟢 Efectivo</option>
                        <option value="Regular" className="text-amber-500">🟡 Parcial</option>
                        <option value="Malo" className="text-red-500">🔴 Inefectivo</option>
                      </select>
                    </td>
                    <td className="p-3 text-center align-top">
                      {/* PUENTE ISO 6.1 → 10.3: riesgo sin plan → Plan de Mejora */}
                      <button
                        type="button"
                        onClick={() => abrirPlanMejora(r)}
                        title="Generar un Plan de Mejora (OOMRSC-21) a partir de este riesgo (ISO 9001 § 6.1 → § 10.3)"
                        aria-label={`Generar Plan de Mejora desde ${r.riesgo}`}
                        className="inline-flex items-center justify-center p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <TrendingUp size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ═══════════════════════════════════════
            VISTA MÓVIL / TABLET (< lg): una tarjeta por riesgo.
            Cada dato ocupa su propia línea y el Plan de Acción el ancho
            completo, así que no hay scroll en ninguna dirección.
            ═══════════════════════════════════════ */}
        <div className="lg:hidden divide-y divide-slate-100">
          {safeRiesgos.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No hay riesgos registrados.</p>
          ) : safeRiesgos.map(r => {
            const nivel = getNivel(r.probabilidad, r.impacto);
            return (
              <article key={r.id} className="p-4 space-y-3">
                {/* Encabezado: tipo + nivel */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-1.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.tipo === 'Oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {r.tipo}
                    </span>
                    <p className="font-semibold text-slate-800 break-words">{r.riesgo}</p>
                  </div>
                  <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-black border ${getColorNivelBadge(nivel)}`} title={`Nivel de exposición: ${nivel}`}>
                    {nivel}
                  </div>
                </div>

                <p className="text-xs text-slate-500 break-words">
                  <span className="font-semibold text-slate-700">{r.area || 'Sin área'}</span>
                  {r.proceso ? ` · ${r.proceso}` : ''}
                </p>

                {/* Plan de acción: ancho completo, protagonista */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Plan de Acción (Control)</label>
                  <CampoPlanAccion
                    valor={r.plan_accion || ''}
                    onChange={(v) => actualizarRiesgo(r.id, { plan_accion: v })}
                    minFilas={5}
                  />
                </div>

                {/* Probabilidad, impacto, fecha y evaluación en dos columnas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Probabilidad</label>
                    <select
                      value={r.probabilidad}
                      onChange={(e) => actualizarRiesgo(r.id, { probabilidad: parseInt(e.target.value) })}
                      aria-label={`Probabilidad de ${r.riesgo}`}
                      className="w-full p-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Impacto</label>
                    <select
                      value={r.impacto}
                      onChange={(e) => actualizarRiesgo(r.id, { impacto: parseInt(e.target.value) })}
                      aria-label={`Impacto de ${r.riesgo}`}
                      className="w-full p-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha límite</label>
                    <input
                      type="date"
                      value={r.fecha_termino || ''}
                      onChange={(e) => actualizarRiesgo(r.id, { fecha_termino: e.target.value })}
                      aria-label={`Fecha límite de ${r.riesgo}`}
                      className="w-full p-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Evaluación</label>
                    <select
                      value={r.evaluacion || ''}
                      onChange={(e) => actualizarRiesgo(r.id, { evaluacion: e.target.value }, 'Evaluación de eficacia del plan')}
                      aria-label={`Evaluación de ${r.riesgo}`}
                      className="w-full p-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Evaluar...</option>
                      <option value="Bueno">🟢 Efectivo</option>
                      <option value="Regular">🟡 Parcial</option>
                      <option value="Malo">🔴 Inefectivo</option>
                    </select>
                  </div>
                </div>

                {/* Puente ISO 6.1 → 10.3 */}
                <button
                  type="button"
                  onClick={() => abrirPlanMejora(r)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <TrendingUp size={15} /> Generar Plan de Mejora
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal Nuevo Riesgo */}
      <ModalBase
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        titulo="Registrar Riesgo / Oportunidad"
        subtitulo={areaSeleccionada ? `Área: ${areaSeleccionada}` : 'Sin área seleccionada'}
        icono={<ShieldAlert size={18} />}
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setMostrarModal(false)}
              className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={agregarRiesgo}
              disabled={!nuevoRiesgo.riesgo}
              className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-2 text-xs"
            >
              <CheckCircle2 size={16} /> Registrar
            </button>
          </>
        )}
      >
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de Registro</label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setNuevoRiesgo({...nuevoRiesgo, tipo: 'Riesgo'})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${nuevoRiesgo.tipo === 'Riesgo' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
                  >Riesgo</button>
                  <button 
                    onClick={() => setNuevoRiesgo({...nuevoRiesgo, tipo: 'Oportunidad'})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${nuevoRiesgo.tipo === 'Oportunidad' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                  >Oportunidad</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción del {nuevoRiesgo.tipo}</label>
                <input value={nuevoRiesgo.riesgo} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, riesgo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none" placeholder={`Describa el ${nuevoRiesgo.tipo.toLowerCase()}...`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Área / Departamento</span>
                    {!puedeTodasAreas && areaUsuario && (
                      <span className="text-xs font-mono text-amber-700 font-bold">🔒 Tu área asignada</span>
                    )}
                  </label>
                  {!puedeTodasAreas && areaUsuario ? (
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900">
                      {areaUsuario}
                    </div>
                  ) : (
                    <select value={nuevoRiesgo.area} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, area: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                      <option value="">Seleccionar...</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Proceso Relacionado</label>
                  <select value={nuevoRiesgo.proceso} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, proceso: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                    <option value="">Seleccionar...</option>
                    {procesos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between">Probabilidad <span>{nuevoRiesgo.probabilidad}</span></label>
                  <input type="range" min="1" max="5" value={nuevoRiesgo.probabilidad} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, probabilidad: parseInt(e.target.value)})} className="w-full accent-cyan-500" />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1"><span>Baja (1)</span><span>Alta (5)</span></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between">Impacto <span>{nuevoRiesgo.impacto}</span></label>
                  <input type="range" min="1" max="5" value={nuevoRiesgo.impacto} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, impacto: parseInt(e.target.value)})} className="w-full accent-cyan-500" />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1"><span>Leve (1)</span><span>Crítico (5)</span></div>
                </div>
              </div>
            </div>
                  </ModalBase>
      </>
      )}
      </>
      )}
    </div>
  );
}