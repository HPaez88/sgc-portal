import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  Clock,
  Save,
  X,
  Plus,
  Upload,
  FileUp,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import SelectBuscable from '../common/SelectBuscable';
import { INDICADORES, evalSemaforoOOMRSC05 } from '../../constants/indicadores';
import { processEvidenceFile } from '../../utils/fileSecurity';

const MESES = [
  { clave: 'Ene', nombre: 'Enero', num: 0 },
  { clave: 'Feb', nombre: 'Febrero', num: 1 },
  { clave: 'Mar', nombre: 'Marzo', num: 2 },
  { clave: 'Abr', nombre: 'Abril', num: 3 },
  { clave: 'May', nombre: 'Mayo', num: 4 },
  { clave: 'Jun', nombre: 'Junio', num: 5 },
  { clave: 'Jul', nombre: 'Julio', num: 6 },
  { clave: 'Ago', nombre: 'Agosto', num: 7 },
  { clave: 'Sep', nombre: 'Septiembre', num: 8 },
  { clave: 'Oct', nombre: 'Octubre', num: 9 },
  { clave: 'Nov', nombre: 'Noviembre', num: 10 },
  { clave: 'Dic', nombre: 'Diciembre', num: 11 }
];

// ═══════════════════════════════════════════════════════════════════════════
// 1. MODAL: ACTUALIZACIÓN RÁPIDA DE INDICADOR (OOMRSC-05) DESDE LA IA
// ═══════════════════════════════════════════════════════════════════════════
export function ModalActualizarIndicadorIA({
  isOpen,
  onClose,
  indicadorPreseleccionado = null,
  indicadoresData = {},
  setIndicadoresData,
  usuarioLogueado,
  registrarMovimiento,
  onAccionConfirmada
}) {
  const mesActualIndex = Math.min(new Date().getMonth(), 11);
  const [indicadorId, setIndicadorId] = useState(indicadorPreseleccionado?.id ?? 0);
  const [mes, setMes] = useState(MESES[mesActualIndex].clave);
  const [ejercicio, setEjercicio] = useState(2026);
  const [valor, setValor] = useState('');
  const [observacion, setObservacion] = useState('');
  const [accion, setAccion] = useState('NA');

  // Actualizar cuando cambie el indicador preseleccionado o se abra
  useEffect(() => {
    if (indicadorPreseleccionado) {
      setIndicadorId(indicadorPreseleccionado.id);
      const key = `${indicadorPreseleccionado.id}-${mes}-${ejercicio}`;
      const dataG = indicadoresData?.resultados?.[key];
      const valDef = dataG?.valor !== undefined ? dataG.valor : (indicadorPreseleccionado.valor_default ?? '');
      setValor(valDef !== null ? String(valDef) : '');
      setObservacion(dataG?.observacion || indicadorPreseleccionado.observacion_default || '');
      setAccion(dataG?.accion || indicadorPreseleccionado.accion_default || 'NA');
    }
  }, [indicadorPreseleccionado, isOpen]);

  const indicadorActivo = useMemo(() => {
    return INDICADORES.find(i => String(i.id) === String(indicadorId)) || INDICADORES[0];
  }, [indicadorId]);

  // Semáforo dinámico en tiempo real
  const semaforoCalculado = useMemo(() => {
    if (!indicadorActivo) return null;
    return evalSemaforoOOMRSC05(valor, indicadorActivo.meta, indicadorActivo.es_menor);
  }, [valor, indicadorActivo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!indicadorActivo || valor === '') return;

    const numVal = Number(valor);
    const key = `${indicadorActivo.id}-${mes}-${ejercicio}`;
    const nuevoResultado = {
      ...(indicadoresData?.resultados?.[key] || {}),
      valor: isNaN(numVal) ? valor : numVal,
      observacion: observacion || `Captura ejecutada mediante Asistente IA para el área de ${indicadorActivo.area}`,
      accion: accion || 'NA',
      capturadoPor: usuarioLogueado?.nombre || 'Usuario SGC (Asistente IA)',
      fechaCaptura: new Date().toISOString()
    };

    const nuevosResultados = {
      ...(indicadoresData?.resultados || {}),
      [key]: nuevoResultado
    };

    setIndicadoresData?.((prev) => ({
      ...(prev || {}),
      resultados: nuevosResultados,
      updatedAt: new Date().toISOString()
    }));

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'CAPTURA_IA',
      descripcion: `Actualización de Indicador #${indicadorActivo.numero || indicadorActivo.id} (${indicadorActivo.nombre}) vía Asistente IA: ${valor} ${indicadorActivo.unidad}`,
      detalles: `Mes: ${mes} ${ejercicio} | Semáforo: ${semaforoCalculado?.label || 'Evaluado'} | Obs: ${observacion}`,
      folio: `IND#${indicadorActivo.id}`
    });

    onAccionConfirmada?.({
      tipo: 'INDICADOR_ACTUALIZADO',
      indicador: indicadorActivo,
      valor: numVal,
      mes,
      ejercicio,
      semaforo: semaforoCalculado,
      mensajeChat: `✅ **Indicador #${indicadorActivo.numero || indicadorActivo.id} actualizado exitosamente en el Cuadro de Control (OOMRSC-05):**\n- **Indicador:** "${indicadorActivo.nombre}" (${indicadorActivo.area})\n- **Período:** ${mes} ${ejercicio} | **Valor Capturado:** **${valor} ${indicadorActivo.unidad}** (Meta: ${indicadorActivo.meta_anual || indicadorActivo.meta} ${indicadorActivo.unidad})\n- **Resultado del Semáforo Institucional:** **${semaforoCalculado?.label}** (${semaforoCalculado?.porcentaje}% de cumplimiento)\n- **Evidencia en Bitácora:** Registrado por ${usuarioLogueado?.nombre || 'Usuario SGC'}.`
    });

    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#002855] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Target size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Actualizar Indicador SGC (OOMRSC-05)
              </h3>
              <p className="text-xs text-sky-200/80 font-medium">
                Captura directa en el Cuadro de Control de Desempeño
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Selector de Indicador con Filtro en Tiempo Real */}
          <div>
            <SelectBuscable
              label="Seleccionar Indicador Oficial:"
              value={indicadorId}
              onChange={(idSel, ind) => {
                const numId = Number(idSel);
                setIndicadorId(numId);
                const item = ind || INDICADORES.find(i => i.id === numId);
                if (item) {
                  const key = `${item.id}-${mes}-${ejercicio}`;
                  const dataG = indicadoresData?.resultados?.[key];
                  setValor(dataG?.valor !== undefined ? String(dataG.valor) : (item.valor_default !== null ? String(item.valor_default) : ''));
                  setObservacion(dataG?.observacion || item.observacion_default || '');
                }
              }}
              options={INDICADORES}
              getOptionValue={(ind) => ind.id}
              getOptionLabel={(ind) => ind.nombre}
              getOptionSublabel={(ind) => ind.area}
              getOptionBadge={(ind) => `#${ind.numero !== undefined ? ind.numero : ind.id}`}
              searchPlaceholder="Escribe número (#0 a #99), nombre del indicador o área..."
              placeholder="Buscar indicador oficial por número, nombre o área..."
            />
          </div>

          {/* Ficha rápida del indicador */}
          {indicadorActivo && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap font-bold text-slate-800">
                <span>📍 Área: <strong className="text-[#002855]">{indicadorActivo.area}</strong></span>
                <span>Proceso: <strong className="text-slate-600">{indicadorActivo.proceso}</strong></span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-slate-600">
                <span>🎯 Meta Anual: <strong>{indicadorActivo.meta_anual || indicadorActivo.meta} {indicadorActivo.unidad}</strong></span>
                <span>Criterio: <strong>{indicadorActivo.es_menor ? 'Menor es mejor (≤ Meta)' : 'Mayor es mejor (≥ Meta)'}</strong></span>
              </div>
            </div>
          )}

          {/* Período y Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mes:</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                {MESES.map(m => (
                  <option key={m.clave} value={m.clave}>{m.nombre} ({m.clave})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ejercicio:</label>
              <input
                type="number"
                value={ejercicio}
                onChange={(e) => setEjercicio(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Real Capturado: <span className="text-sky-600 font-normal">({indicadorActivo?.unidad})</span>
              </label>
              <input
                type="number"
                step="any"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={`Ej. ${indicadorActivo?.meta || 100}`}
                required
                className="w-full text-xs font-black px-3 py-2 bg-white border-2 border-sky-400 rounded-xl focus:ring-2 focus:ring-sky-600 outline-hidden text-slate-900"
              />
            </div>
          </div>

          {/* Semáforo preview */}
          {semaforoCalculado && valor !== '' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${semaforoCalculado.bg} ${semaforoCalculado.border}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full ${semaforoCalculado.dot} animate-pulse`} />
                <span className={`text-xs font-black ${semaforoCalculado.text}`}>
                  Semáforo Previsto: {semaforoCalculado.label}
                </span>
              </div>
              <span className={`text-xs font-black font-mono ${semaforoCalculado.text}`}>
                {semaforoCalculado.porcentaje}% de cumplimiento
              </span>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones / Justificación de Causa:
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalla cómo se obtuvo el dato o causas de posibles desviaciones..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Acción SGC */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Acción / Folio de Corrección (si aplica):
            </label>
            <input
              type="text"
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              placeholder="Ej. NA o Reporte de Corrección RC 07"
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} /> Guardar en Cuadro de Control
            </button>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// 2. MODAL: REVISAR ACTIVIDAD Y SUBIR EVIDENCIA DE AC (OOMRSC-20)
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// 2. MODAL: SUBIR EVIDENCIA Y GESTIONAR ACTIVIDAD (AC / PLAN DE MEJORA)
// ═══════════════════════════════════════════════════════════════════════════
export function ModalGestionarActividadEvidenciaIA({
  isOpen,
  onClose,
  accionPreseleccionada = null,
  planPreseleccionado = null,
  accionesCorrectivas = [],
  setAccionesCorrectivas,
  planesMejora = [],
  setPlanesMejora,
  puedeTodasAreas = false,
  usuarioLogueado,
  registrarMovimiento,
  onAccionConfirmada
}) {
  const toast = useToast();

  // Tipo de origen: 'AC' (Acción Correctiva OOMRSC-20) | 'PM' (Plan de Mejora OOMRSC-21)
  const [tipoElemento, setTipoElemento] = useState(planPreseleccionado && !accionPreseleccionada ? 'PM' : 'AC');

  // Permisos de área: solo el área del usuario a menos que sea SuperAdmin / SGC / puedeTodasAreas
  const puedeVerTodo = Boolean(
    puedeTodasAreas ||
    usuarioLogueado?.rol?.toLowerCase().includes('admin') ||
    usuarioLogueado?.rol?.toLowerCase().includes('sgc') ||
    usuarioLogueado?.rol?.toLowerCase().includes('calidad')
  );

  // Listas restringidas al área del usuario
  const accionesFiltradas = useMemo(() => {
    if (puedeVerTodo || !usuarioLogueado?.area) return accionesCorrectivas || [];
    const filtradas = (accionesCorrectivas || []).filter(a => a.area === usuarioLogueado.area);
    return filtradas.length > 0 ? filtradas : (accionesCorrectivas || []);
  }, [accionesCorrectivas, puedeVerTodo, usuarioLogueado]);

  const planesFiltrados = useMemo(() => {
    if (puedeVerTodo || !usuarioLogueado?.area) return planesMejora || [];
    const filtrados = (planesMejora || []).filter(p => p.area === usuarioLogueado.area);
    return filtrados.length > 0 ? filtrados : (planesMejora || []);
  }, [planesMejora, puedeVerTodo, usuarioLogueado]);

  const [elementoId, setElementoId] = useState(null);
  const [actividadIndex, setActividadIndex] = useState(0);
  const [estadoActividad, setEstadoActividad] = useState('COMPLETADA');
  const [notaEvidencia, setNotaEvidencia] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [avanceNum, setAvanceNum] = useState(100);

  // Sincronizar selección inicial al abrir
  useEffect(() => {
    if (tipoElemento === 'AC') {
      if (accionPreseleccionada) {
        setElementoId(accionPreseleccionada.id);
      } else if (accionesFiltradas.length > 0) {
        setElementoId(accionesFiltradas[0].id);
      }
    } else {
      if (planPreseleccionado) {
        setElementoId(planPreseleccionado.id);
      } else if (planesFiltrados.length > 0) {
        setElementoId(planesFiltrados[0].id);
      }
    }
    setActividadIndex(0);
    setNotaEvidencia('');
    setArchivoSeleccionado(null);
  }, [tipoElemento, accionPreseleccionada, planPreseleccionado, accionesFiltradas, planesFiltrados, isOpen]);

  // Elemento activo
  const elementoActivo = useMemo(() => {
    if (tipoElemento === 'AC') {
      return accionesFiltradas.find(a => String(a.id) === String(elementoId)) || accionesFiltradas[0] || null;
    }
    return planesFiltrados.find(p => String(p.id) === String(elementoId)) || planesFiltrados[0] || null;
  }, [tipoElemento, elementoId, accionesFiltradas, planesFiltrados]);

  // Actividades del elemento activo
  const actividadesList = useMemo(() => {
    if (!elementoActivo) return [];

    if (Array.isArray(elementoActivo.actividades) && elementoActivo.actividades.length > 0) {
      return elementoActivo.actividades;
    }

    if (typeof elementoActivo.actividades_json === 'string') {
      try {
        const parsed = JSON.parse(elementoActivo.actividades_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }

    // Fallback de actividad por defecto
    return [
      {
        id: 1,
        actividad: elementoActivo.plan_accion || elementoActivo.titulo || elementoActivo.descripcion || 'Acción operativa de seguimiento',
        responsable: elementoActivo.responsable || usuarioLogueado?.nombre || 'Encargado del Área',
        fecha_termino: elementoActivo.fechaCompromiso || elementoActivo.fecha_limite || '2026-05-30',
        completada: false,
        evidencia: null
      }
    ];
  }, [elementoActivo, usuarioLogueado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!elementoActivo) return;

    setSubiendo(true);
    try {
      let evidenciaObj = null;
      let evidenciaUrl = null;

      if (archivoSeleccionado) {
        const resFile = await processEvidenceFile(archivoSeleccionado, usuarioLogueado?.nombre || 'Usuario SGC');
        if (!resFile.success) {
          throw new Error(resFile.error || 'Error al procesar archivo de evidencia');
        }
        evidenciaObj = resFile.evidencia;
        evidenciaUrl = resFile.evidencia.url;
      }

      // Actualizar lista de actividades
      const nuevasActividades = actividadesList.map((act, idx) => {
        if (idx === actividadIndex) {
          return {
            ...act,
            completada: estadoActividad === 'COMPLETADA',
            estado: estadoActividad,
            evidencia_nota: notaEvidencia || act.evidencia_nota,
            evidencia_url: evidenciaUrl || act.evidencia_url,
            evidencia_archivo: evidenciaObj?.nombre_original || act.evidencia_archivo,
            fecha_ejecucion: new Date().toISOString().split('T')[0]
          };
        }
        return act;
      });

      const todasCompletas = nuevasActividades.every(a => a.completada || a.estado === 'COMPLETADA');

      if (tipoElemento === 'AC') {
        const nuevoEstadoAC = todasCompletas ? 'EN_SEGUIMIENTO' : elementoActivo.estado;
        const acActualizada = {
          ...elementoActivo,
          actividades: nuevasActividades,
          estado: nuevoEstadoAC,
          ultimo_seguimiento: new Date().toISOString(),
          avance: avanceNum
        };

        setAccionesCorrectivas?.(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(a => String(a.id) === String(elementoActivo.id) ? acActualizada : a);
        });

        registrarMovimiento?.({
          modulo: 'ACCIONES_CORRECTIVAS',
          accion: 'EVIDENCIA_SUBIDA_IA',
          descripcion: `Evidencia y seguimiento registrados en ${elementoActivo.folio || `AC#${elementoActivo.id}`} vía Asistente IA`,
          detalles: `Actividad: #${actividadIndex + 1} | Estado: ${estadoActividad} | Archivo: ${archivoSeleccionado?.name || 'Nota escrita'}`,
          folio: elementoActivo.folio || `AC#${elementoActivo.id}`
        });

        const actNombre = actividadesList[actividadIndex]?.actividad || `Actividad #${actividadIndex + 1}`;
        onAccionConfirmada?.({
          tipo: 'ACTIVIDAD_EVIDENCIA_ACTUALIZADA',
          accion: acActualizada,
          actividadNombre: actNombre,
          mensajeChat: `✅ **Evidencia registrada en Acción Correctiva [${elementoActivo.folio || `AC#${elementoActivo.id}`}]:**\n- **Título:** "${elementoActivo.titulo || elementoActivo.descripcion}" (${elementoActivo.area})\n- **Actividad:** "${actNombre}" marcada como **${estadoActividad}**\n- **Evidencia:** ${archivoSeleccionado ? `📎 Archivo adjunto \`${archivoSeleccionado.name}\`` : '📝 Nota operativa registrada'}\n- **Observaciones:** ${notaEvidencia || 'Evidencia verificada y registrada para auditoría.'}\n- **Estado Actual:** \`${nuevoEstadoAC}\` (Auditor Asignado: ${elementoActivo.auditor_asignado || 'Coordinación SGC'}).`
        });
      } else {
        // Plan de Mejora (PM)
        const nuevoEstadoPM = todasCompletas ? 'EN_SEGUIMIENTO' : (elementoActivo.estado || 'EN_EJECUCION');
        const pmActualizado = {
          ...elementoActivo,
          actividades: nuevasActividades,
          estado: nuevoEstadoPM,
          avance: avanceNum,
          fechaUltimoSeguimiento: new Date().toISOString()
        };

        setPlanesMejora?.(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(p => String(p.id) === String(elementoActivo.id) ? pmActualizado : p);
        });

        registrarMovimiento?.({
          modulo: 'PLANES_MEJORA',
          accion: 'EVIDENCIA_SUBIDA_IA',
          descripcion: `Evidencia y avance registrados en Plan de Mejora ${elementoActivo.folio || `PM#${elementoActivo.id}`} vía Asistente IA`,
          detalles: `Actividad: #${actividadIndex + 1} | Estado: ${estadoActividad} | Avance: ${avanceNum}%`,
          folio: elementoActivo.folio || `PM#${elementoActivo.id}`
        });

        const actNombre = actividadesList[actividadIndex]?.actividad || `Actividad #${actividadIndex + 1}`;
        onAccionConfirmada?.({
          tipo: 'ACTIVIDAD_EVIDENCIA_ACTUALIZADA',
          plan: pmActualizado,
          actividadNombre: actNombre,
          mensajeChat: `✅ **Evidencia y Avance registrados en Plan de Mejora [${elementoActivo.folio || `PM#${elementoActivo.id}`}]:**\n- **Plan:** "${elementoActivo.titulo || elementoActivo.descripcion}" (${elementoActivo.area})\n- **Actividad:** "${actNombre}" marcada como **${estadoActividad}**\n- **Avance Reportado:** ${avanceNum}%\n- **Evidencia:** ${archivoSeleccionado ? `📎 Archivo adjunto \`${archivoSeleccionado.name}\`` : '📝 Nota operativa registrada'}\n- **Observaciones:** ${notaEvidencia || 'Avance documentado conforme a OOMRSC-21.'}`
        });
      }

      toast.exito(`Evidencia y actividad guardadas correctamente.`);
      onClose();
    } catch (err) {
      toast.error(`Error al guardar evidencia: ${err.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Subir Evidencia y Seguimiento de Actividad
              </h3>
              <p className="text-xs text-amber-200/80 font-medium">
                Acciones Correctivas (OOMRSC-20) y Planes de Mejora (OOMRSC-21)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Selector de Tipo: AC vs PM */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setTipoElemento('AC');
                setActividadIndex(0);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tipoElemento === 'AC'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle size={14} className="text-rose-600" />
              <span>Acción Correctiva (OOMRSC-20) ({accionesFiltradas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoElemento('PM');
                setActividadIndex(0);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tipoElemento === 'PM'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={14} className="text-sky-600" />
              <span>Plan de Mejora (OOMRSC-21) ({planesFiltrados.length})</span>
            </button>
          </div>

          {/* Información de Restricción de Área */}
          {!puedeVerTodo && usuarioLogueado?.area && (
            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-[11.5px] text-sky-900 flex items-center justify-between">
              <span>📍 Mostrando registros asignados a tu área: <strong>{usuarioLogueado.area}</strong></span>
              <span className="font-mono text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-bold">
                {usuarioLogueado.nombre}
              </span>
            </div>
          )}

          {/* Selector con SelectBuscable */}
          {tipoElemento === 'AC' ? (
            <div>
              <SelectBuscable
                label="Seleccionar Acción Correctiva de tu Área:"
                value={elementoId}
                onChange={(idSel) => {
                  setElementoId(idSel);
                  setActividadIndex(0);
                }}
                options={accionesFiltradas}
                getOptionValue={(ac) => ac.id}
                getOptionLabel={(ac) => ac.titulo || ac.descripcion}
                getOptionSublabel={(ac) => `${ac.area} • Estado: ${ac.estado}`}
                getOptionBadge={(ac) => ac.folio || `AC#${ac.id}`}
                searchPlaceholder="Escribe folio (ej. AC-2026-01), área o causa..."
                placeholder="Buscar acción correctiva por folio o descripción..."
              />
            </div>
          ) : (
            <div>
              <SelectBuscable
                label="Seleccionar Plan de Mejora de tu Área:"
                value={elementoId}
                onChange={(idSel) => {
                  setElementoId(idSel);
                  setActividadIndex(0);
                }}
                options={planesFiltrados}
                getOptionValue={(pm) => pm.id}
                getOptionLabel={(pm) => pm.titulo || pm.descripcion}
                getOptionSublabel={(pm) => `${pm.area} • Estado: ${pm.estado || 'EN_EJECUCION'}`}
                getOptionBadge={(pm) => pm.folio || `PM#${pm.id}`}
                searchPlaceholder="Escribe folio (ej. PM#1/26), área o título..."
                placeholder="Buscar plan de mejora por folio o título..."
              />
            </div>
          )}

          {/* Ficha Resumen del Elemento Activo */}
          {elementoActivo && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              tipoElemento === 'AC' ? 'bg-amber-50/70 border-amber-200' : 'bg-sky-50/70 border-sky-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Folio: <strong>{elementoActivo.folio || `#${elementoActivo.id}`}</strong></span>
                <span className="px-2 py-0.5 rounded-md bg-white border text-slate-800 font-mono text-[11px]">
                  Estado: {elementoActivo.estado || 'ACTIVO'}
                </span>
              </div>
              <p className="text-slate-700">
                <strong>{tipoElemento === 'AC' ? 'Causa / Hallazgo:' : 'Objetivo:'}</strong> {elementoActivo.descripcion || elementoActivo.titulo}
              </p>
              <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                <span>Responsable: <strong>{elementoActivo.responsable || elementoActivo.auditor_asignado || 'Área'}</strong></span>
                <span>Fecha Límite: <strong>{elementoActivo.fechaCompromiso || elementoActivo.fecha_limite || '2026-05-30'}</strong></span>
              </div>
            </div>
          )}

          {/* Selector de Actividad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Actividad del Plan a Actualizar:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {actividadesList.map((act, idx) => (
                <div
                  key={idx}
                  onClick={() => setActividadIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    actividadIndex === idx
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300/40'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {act.completada || act.estado === 'COMPLETADA' ? (
                      <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Square size={16} className="text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {idx + 1}. {act.actividad || act.actividades || `Actividad #${idx + 1}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Responsable: {act.responsable || 'Área'} | Fecha: {act.fecha_termino || 'Vigente'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    act.completada ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {act.completada ? 'COMPLETA' : 'PENDIENTE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de la actividad y Avance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estatus de la Actividad:
              </label>
              <select
                value={estadoActividad}
                onChange={(e) => setEstadoActividad(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                <option value="COMPLETADA">🟢 COMPLETADA (Actividad terminada)</option>
                <option value="EN_PROCESO">🟡 EN PROCESO (Avance parcial)</option>
                <option value="PENDIENTE">⚪ PENDIENTE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Avance General: ({avanceNum}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={avanceNum}
                onChange={(e) => setAvanceNum(Number(e.target.value))}
                className="w-full mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Subir Archivo de Evidencia */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Upload size={14} className="text-sky-600" />
              Adjuntar Archivo de Evidencia (Foto JPG/PNG o Documento PDF):
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-400 p-4 rounded-xl bg-slate-50/60 text-center transition-colors">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] || null)}
                className="hidden"
                id="evidencia-ia-file"
              />
              <label htmlFor="evidencia-ia-file" className="cursor-pointer flex flex-col items-center gap-1">
                <FileUp size={24} className="text-sky-600" />
                <span className="text-xs font-bold text-slate-800">
                  {archivoSeleccionado ? archivoSeleccionado.name : 'Haz clic para seleccionar archivo de evidencia'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Admite fotos de campo, actas de verificación o informes PDF (máx. 25 MB)
                </span>
              </label>
            </div>
          </div>

          {/* Nota descriptiva de evidencia */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción de la Evidencia Objetiva / Resultados:
            </label>
            <textarea
              rows={2}
              value={notaEvidencia}
              onChange={(e) => setNotaEvidencia(e.target.value)}
              placeholder="Describe las acciones realizadas, personal involucrado o liga a expediente físico..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={subiendo}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={subiendo}
              className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-[#0B192C] to-[#002855] hover:from-[#1E3E62] hover:to-[#0B192C] rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} /> {subiendo ? 'Guardando...' : 'Guardar Evidencia y Actividad'}
            </button>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// 3. MODAL: RATIFICAR REVISIÓN PERIÓDICA DE PROCEDIMIENTOS >1 AÑO (§ 7.5.3)
// ═══════════════════════════════════════════════════════════════════════════
export function ModalRatificarDocumentoIA({
  isOpen,
  onClose,
  documentoPreseleccionado = null,
  documentos = [],
  setDocumentos,
  usuarioLogueado,
  registrarMovimiento,
  onAccionConfirmada
}) {
  const [docId, setDocId] = useState(documentoPreseleccionado?.id || documentos[0]?.id || 1);
  const [observacion, setObservacion] = useState(
    'Se realizó la revisión técnica periódica del documento con el personal del área y se ratifica su plena vigencia operativa y apego a la práctica en campo conforme a ISO 9001 § 7.5.3.'
  );

  useEffect(() => {
    if (documentoPreseleccionado) {
      setDocId(documentoPreseleccionado.id);
    } else if (documentos.length > 0) {
      setDocId(documentos[0].id);
    }
  }, [documentoPreseleccionado, documentos, isOpen]);

  const docActivo = useMemo(() => {
    return documentos.find(d => String(d.id) === String(docId)) || documentos[0];
  }, [docId, documentos]);

  const handleRatificar = (e) => {
    e.preventDefault();
    if (!docActivo) return;

    const fechaHoy = new Date().toISOString().split('T')[0];

    const docActualizado = {
      ...docActivo,
      fecha: fechaHoy,
      ultima_revision_activa: fechaHoy,
      revisado_por: usuarioLogueado?.nombre || 'Encargado de Área',
      observaciones_revision: observacion
    };

    setDocumentos?.(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.map(d => String(d.id) === String(docActivo.id) ? docActualizado : d);
    });

    registrarMovimiento?.({
      modulo: 'DOCUMENTOS',
      accion: 'RATIFICACION_VIGENCIA_IA',
      descripcion: `Ratificación de revisión activa (§ 7.5.3) del documento [${docActivo.clave}] ${docActivo.titulo} vía Asistente IA`,
      detalles: `Fecha actualizada a ${fechaHoy} | Observaciones: ${observacion}`,
      folio: docActivo.clave
    });

    onAccionConfirmada?.({
      tipo: 'DOCUMENTO_RATIFICADO',
      documento: docActualizado,
      mensajeChat: `✅ **Revisión Activa Ratificada (ISO 9001 § 7.5.3):**\n- **Documento:** [${docActivo.clave}] "${docActivo.titulo}" (${docActivo.tipo} - ${docActivo.area})\n- **Nueva Fecha de Vigencia:** **${fechaHoy}** (Versión ${docActivo.version || 'Vigente'})\n- **Dictamen:** ${observacion}\n- **Impacto:** Alerta de >1 año sin revisar **ELIMINADA**. La base documental se encuentra al 100% en cumplimiento para auditorías.`
    });

    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileWarning size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Ratificar Revisión Activa de Documento (§ 7.5.3)
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Mantenimiento de vigencia documental para auditorías ISO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleRatificar} className="p-6 space-y-5 overflow-y-auto">
          {/* Selector de Documento con Filtro en Tiempo Real */}
          <div>
            <SelectBuscable
              label="Procedimiento / Registro a Ratificar:"
              value={docId}
              onChange={(idSel) => setDocId(idSel)}
              options={documentos}
              getOptionValue={(doc) => doc.id}
              getOptionLabel={(doc) => doc.titulo}
              getOptionSublabel={(doc) => `${doc.tipo} - ${doc.area} • Rev. ${doc.version || '01'} (${doc.fecha || 'Antigua'})`}
              getOptionBadge={(doc) => doc.clave}
              searchPlaceholder="Escribe clave (ej. PR-CS-01, OOMRSC-20), título o área..."
              placeholder="Buscar documento o procedimiento..."
            />
          </div>

          {/* Ficha Resumen */}
          {docActivo && (
            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-sky-950">
                <span>Clave: <strong>[{docActivo.clave}]</strong></span>
                <span>Versión: <strong>{docActivo.version || 'Rev. Vigente'}</strong></span>
              </div>
              <p className="text-slate-800"><strong>Título:</strong> {docActivo.titulo}</p>
              <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                <span>Área: <strong>{docActivo.area}</strong></span>
                <span>Fecha Anterior: <strong className="text-amber-700">{docActivo.fecha || 'Sin fecha'}</strong></span>
              </div>
            </div>
          )}

          {/* Justificación de ratificación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dictamen de Revisión Periódica:
            </label>
            <textarea
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} /> Confirmar y Ratificar Vigencia
            </button>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}
