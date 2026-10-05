import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Activity, 
  Users, 
  FileBarChart,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  Download,
  Filter,
  Layers,
  Search,
  Building2,
  DollarSign,
  Target,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Flame,
  PieChart,
  BarChart3,
  Eye,
  PlusCircle,
  X,
  AlertCircle,
  Clock,
  Award
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { INDICADORES } from '../../constants';
import StatCard from '../ui/StatCard';
import StatusBadge from '../ui/StatusBadge';
import ContenedorModal from '../common/ContenedorModal';
import { exportarInformeDireccionPDF } from '../../services/dashboardExporter';
import { acDesdeIndicador } from '../../services/flujoService';

// Meses y Períodos de evaluación institucional
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS = [
  { id: 'TODOS', label: 'Acumulado Anual (Ene-Dic)', meses: MESES },
  { id: 'C1', label: '1er Cuatrimestre (Ene-Abr)', meses: ['Ene', 'Feb', 'Mar', 'Abr'] },
  { id: 'C2', label: '2do Cuatrimestre (May-Ago)', meses: ['May', 'Jun', 'Jul', 'Ago'] },
  { id: 'C3', label: '3er Cuatrimestre (Sep-Dic)', meses: ['Sep', 'Oct', 'Nov', 'Dic'] },
  { id: 'T1', label: '1er Trimestre (Ene-Mar)', meses: ['Ene', 'Feb', 'Mar'] },
  { id: 'T2', label: '2do Trimestre (Abr-Jun)', meses: ['Abr', 'May', 'Jun'] },
  { id: 'T3', label: '3er Trimestre (Jul-Sep)', meses: ['Jul', 'Ago', 'Sep'] },
  { id: 'T4', label: '4to Trimestre (Oct-Dic)', meses: ['Oct', 'Nov', 'Dic'] },
];

const EJERCICIOS = [2025, 2026, 2027];

const DIRECCIONES_BASE = [
  'General',
  'Técnica',
  'Comercial',
  'Administrativa',
  'Programas Sociales y Cultura del Agua',
  'Órganos de Control Interno'
];

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

export default function DashboardView({ 
  accionesCorrectivas: propsAC, 
  planesMejora: propsPM, 
  documentos: propsDocs, 
  auditorias: propsAuditorias, 
  setActiveTab 
}) {
  const context = useSGC();

  // Integración de fuentes de datos (props o contexto global)
  const safeAC = propsAC || context.accionesCorrectivas || [];
  const safePM = propsPM || context.planesMejora || [];
  const safeDocs = propsDocs || context.documentos || [];
  const safeAuditorias = propsAuditorias || context.auditorias || [];
  const safeRiesgos = context.riesgos || [];
  const indicadoresData = context.indicadoresData || {};
  const setAccionesCorrectivas = context.setAccionesCorrectivas;
  const registrarMovimiento = context.registrarMovimiento;
  const usuarioLogueado = context.usuarioLogueado;

  // Estados de Filtros Ejecutivos (Alta Dirección)
  const [ejercicio, setEjercicio] = useState(2026);
  const [periodoId, setPeriodoId] = useState('TODOS');
  const [direccionFiltro, setDireccionFiltro] = useState('TODAS');
  const [tabAnalisis, setTabAnalisis] = useState('resumen'); // 'resumen' | 'indicadores' | 'riesgos' | 'ac' | 'pm' | 'auditorias'

  // Filtros internos de sub-tablas
  const [filtroSemaforo, setFiltroSemaforo] = useState('TODOS');
  const [busquedaInd, setBusquedaInd] = useState('');

  // Estados de IA & Diagnóstico
  const [modalSintesisAbierto, setModalSintesisAbierto] = useState(false);
  const [sintesisIA, setSintesisIA] = useState('');
  const [cargandoSintesis, setCargandoSintesis] = useState(false);
  const [errorSintesis, setErrorSintesis] = useState('');
  const [copiadoSintesis, setCopiadoSintesis] = useState(false);

  // Modal para levantar AC rápida desde indicador en rojo
  const [indicadorParaAC, setIndicadorParaAC] = useState(null);
  const [justificacionAC, setJustificacionAC] = useState('');
  const [guardandoAC, setGuardandoAC] = useState(false);

  // Período activo
  const periodoActivo = useMemo(() => {
    return PERIODOS.find((p) => p.id === periodoId) || PERIODOS[0];
  }, [periodoId]);

  // Función para obtener valor de captura
  const getValorIndicador = (indicadorId, mes, anio) => {
    const resultados = indicadoresData.resultados || {};
    const key = `${indicadorId}-${mes}-${anio}`;
    return resultados[key] ?? (anio === 2026 ? resultados[`${indicadorId}-${mes}`] : '') ?? '';
  };

  // Listado consolidado de indicadores
  const catalogoIndicadores = useMemo(() => {
    const base = Array.isArray(INDICADORES) ? INDICADORES : [];
    const personalizados = Array.isArray(indicadoresData.indicadoresPersonalizados) 
      ? indicadoresData.indicadoresPersonalizados 
      : [];
    return [...base, ...personalizados];
  }, [indicadoresData]);

  // Evaluación dinámica de Indicadores según filtros
  const evaluacionIndicadores = useMemo(() => {
    const mesesEval = periodoActivo.meses;

    return catalogoIndicadores.map((ind) => {
      const metaInfo = parseMeta(ind.meta);
      const esMenor = ind.es_menor ?? metaInfo.esMenor;
      
      const valores = mesesEval
        .map((mes) => getValorIndicador(ind.id, mes, ejercicio))
        .map((v) => Number.parseFloat(String(v).replace(/[,%\s]/g, '')))
        .filter((v) => Number.isFinite(v));

      const ultimoValor = valores.length > 0 ? valores[valores.length - 1] : null;

      let cumplimiento = null;
      let semaforo = 'sinDato';

      if (valores.length > 0 && metaInfo.valido) {
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
        if (metaInfo.valor === 0) {
          cumplimiento = promedio > 0 ? (esMenor ? 0 : 100) : 100;
        } else if (esMenor) {
          cumplimiento = promedio <= metaInfo.valor ? 100 : (metaInfo.valor / promedio) * 100;
        } else {
          cumplimiento = promedio >= metaInfo.valor ? 100 : (promedio / metaInfo.valor) * 100;
        }
        cumplimiento = Math.max(0, Math.min(100, Math.round(cumplimiento)));

        if (cumplimiento >= 80) semaforo = 'verde';
        else if (cumplimiento >= 50) semaforo = 'amarillo';
        else semaforo = 'rojo';
      }

      return {
        ...ind,
        valoresCapturados: valores.length,
        ultimoValor,
        cumplimiento,
        semaforo
      };
    });
  }, [catalogoIndicadores, periodoActivo, ejercicio, indicadoresData]);

  // Filtrar indicadores por Dirección
  const indicadoresFiltrados = useMemo(() => {
    return evaluacionIndicadores.filter((ind) => {
      if (direccionFiltro !== 'TODAS' && ind.direccion !== direccionFiltro) {
        return false;
      }
      if (filtroSemaforo !== 'TODOS') {
        if (filtroSemaforo === 'VERDE' && ind.semaforo !== 'verde') return false;
        if (filtroSemaforo === 'AMARILLO' && ind.semaforo !== 'amarillo') return false;
        if (filtroSemaforo === 'ROJO' && ind.semaforo !== 'rojo') return false;
        if (filtroSemaforo === 'SINDATO' && ind.semaforo !== 'sinDato') return false;
      }
      if (busquedaInd) {
        const query = busquedaInd.toLowerCase();
        const texto = `${ind.nombre} ${ind.area} ${ind.proceso} ${ind.direccion}`.toLowerCase();
        if (!texto.includes(query)) return false;
      }
      return true;
    });
  }, [evaluacionIndicadores, direccionFiltro, filtroSemaforo, busquedaInd]);

  // Estadísticas globales de Indicadores
  const indicadoresStats = useMemo(() => {
    const subset = direccionFiltro === 'TODAS' 
      ? evaluacionIndicadores 
      : evaluacionIndicadores.filter((i) => i.direccion === direccionFiltro);

    const total = subset.length;
    const medidos = subset.filter((i) => i.semaforo !== 'sinDato');
    const verdes = subset.filter((i) => i.semaforo === 'verde').length;
    const amarillos = subset.filter((i) => i.semaforo === 'amarillo').length;
    const rojos = subset.filter((i) => i.semaforo === 'rojo').length;
    const sinDato = subset.filter((i) => i.semaforo === 'sinDato').length;

    const promedioCumplimiento = medidos.length > 0
      ? Math.round(medidos.reduce((acc, curr) => acc + (curr.cumplimiento || 0), 0) / medidos.length)
      : 0;

    return {
      total,
      medidosCount: medidos.length,
      verdes,
      amarillos,
      rojos,
      sinDato,
      pctCumplimiento: promedioCumplimiento
    };
  }, [evaluacionIndicadores, direccionFiltro]);

  // Indicadores Críticos (Rojos)
  const indicadoresCriticos = useMemo(() => {
    return evaluacionIndicadores.filter((i) => i.semaforo === 'rojo');
  }, [evaluacionIndicadores]);

  // Estadísticas de Riesgos (ISO 6.1)
  const riesgosStats = useMemo(() => {
    const subset = safeRiesgos.filter((r) => {
      if (direccionFiltro === 'TODAS') return true;
      const dirR = r.direccion || '';
      return dirR.toLowerCase().includes(direccionFiltro.toLowerCase());
    });

    let extremos = 0;
    let altos = 0;
    let moderados = 0;
    let bajos = 0;
    let conPlan = 0;

    subset.forEach((r) => {
      const severidad = (Number(r.probabilidad) || 1) * (Number(r.impacto) || 1);
      if (severidad >= 15) extremos++;
      else if (severidad >= 10) altos++;
      else if (severidad >= 5) moderados++;
      else bajos++;

      if (r.estado_plan === 'EN_PROCESO' || r.estado_plan === 'ATENDIDO' || (r.plan_accion && r.plan_accion.trim().length > 0)) {
        conPlan++;
      }
    });

    const total = subset.length;
    const pctMitigacion = total > 0 ? Math.round((conPlan / total) * 100) : 100;

    return {
      total,
      criticos: extremos,
      altos,
      moderados,
      bajos,
      conPlan,
      pctMitigacion
    };
  }, [safeRiesgos, direccionFiltro]);

  // Estadísticas de Acciones Correctivas (OOMRSC-20)
  const acStats = useMemo(() => {
    const subset = safeAC.filter((ac) => {
      if (direccionFiltro === 'TODAS') return true;
      const dir = ac.direccion || ac.area || '';
      return dir.toLowerCase().includes(direccionFiltro.toLowerCase());
    });

    const abiertas = subset.filter((ac) => ac.estado !== 'CERRADO' && ac.estado !== 'RECHAZADO').length;
    const cerradas = subset.filter((ac) => ac.estado === 'CERRADO').length;
    const rechazadas = subset.filter((ac) => ac.estado === 'RECHAZADO').length;
    const total = subset.length;
    const tasaEficacia = total > 0 ? Math.round((cerradas / total) * 100) : 100;

    return {
      total,
      abiertas,
      cerradas,
      rechazadas,
      tasaEficacia
    };
  }, [safeAC, direccionFiltro]);

  // Estadísticas de Planes de Mejora (OOMRSC-21)
  const pmStats = useMemo(() => {
    const subset = safePM.filter((pm) => {
      if (direccionFiltro === 'TODAS') return true;
      const dir = pm.direccion || pm.area || '';
      return dir.toLowerCase().includes(direccionFiltro.toLowerCase());
    });

    const activos = subset.filter((pm) => pm.estado !== 'CERRADO' && pm.estado !== 'RECHAZADO').length;
    const concluidos = subset.filter((pm) => pm.estado === 'CERRADO').length;
    
    const presupuestoTotal = subset.reduce((sum, pm) => sum + (Number(pm.presupuesto_estimado || pm.presupuesto_total || pm.costo_estimado || 0)), 0);
    const presupuestoEjercido = subset.reduce((sum, pm) => sum + (Number(pm.presupuesto_ejercido || pm.costo_real || 0)), 0);

    return {
      total: subset.length,
      activos,
      concluidos,
      presupuestoTotal,
      presupuestoEjercido,
      pctAvance: subset.length > 0 ? Math.round((concluidos / subset.length) * 100) : 100
    };
  }, [safePM, direccionFiltro]);

  // Estadísticas de Auditorías (ISO 9.2)
  const auditoriasStats = useMemo(() => {
    const total = safeAuditorias.length || 1;
    const completadas = safeAuditorias.filter((a) => a.estado === 'COMPLETADA').length;
    const pendientes = safeAuditorias.filter((a) => a.estado === 'PROGRAMADA' || a.estado === 'EN_PROCESO').length;
    const hallazgos = safeAuditorias.reduce((sum, a) => sum + (Number(a.hallazgos) || 0), 0);
    const ncs = safeAuditorias.reduce((sum, a) => sum + (Number(a.no_conformidades) || 0), 0);
    const pctAvance = Math.round((completadas / total) * 100);

    return {
      total: safeAuditorias.length,
      completadas,
      pendientes,
      hallazgos,
      ncs,
      pctAvance
    };
  }, [safeAuditorias]);

  // Radar de Desempeño por Dirección
  const radarDirecciones = useMemo(() => {
    return DIRECCIONES_BASE.map((dir) => {
      const indsDir = evaluacionIndicadores.filter((i) => i.direccion === dir);
      const medidos = indsDir.filter((i) => i.semaforo !== 'sinDato');
      const cumps = medidos.map((i) => i.cumplimiento || 0);
      const avgCumplimiento = cumps.length > 0 ? Math.round(cumps.reduce((a, b) => a + b, 0) / cumps.length) : 0;
      const criticos = indsDir.filter((i) => i.semaforo === 'rojo').length;
      
      const acsDir = safeAC.filter((ac) => (ac.direccion || ac.area || '').toLowerCase().includes(dir.toLowerCase()));
      const acAbiertas = acsDir.filter((ac) => ac.estado !== 'CERRADO' && ac.estado !== 'RECHAZADO').length;

      const riesgosDir = safeRiesgos.filter((r) => (r.direccion || r.area || '').toLowerCase().includes(dir.toLowerCase())).length;

      return {
        direccion: dir,
        totalIndicadores: indsDir.length,
        cumplimiento: avgCumplimiento,
        criticos,
        acAbiertas,
        riesgos: riesgosDir
      };
    });
  }, [evaluacionIndicadores, safeAC, safeRiesgos]);

  // Índice Global de Salud del SGC (Ponderación 0-100)
  const healthScore = useMemo(() => {
    const score = (
      (indicadoresStats.pctCumplimiento * 0.35) +
      (riesgosStats.pctMitigacion * 0.20) +
      (acStats.tasaEficacia * 0.20) +
      (pmStats.pctAvance * 0.15) +
      (auditoriasStats.pctAvance * 0.10)
    );
    return Math.round(score);
  }, [indicadoresStats, riesgosStats, acStats, pmStats, auditoriasStats]);

  // Evaluación cualitativa de Salud SGC
  const calificacionSalud = useMemo(() => {
    if (healthScore >= 85) {
      return { nivel: 'Nivel A · Desempeño Sobresaliente', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    }
    if (healthScore >= 70) {
      return { nivel: 'Nivel B · Operación Estable y en Control', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
    }
    return { nivel: 'Nivel C · Alerta Ejecutiva e Intervención', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  }, [healthScore]);

  // Feed combinado de actividades recientes
  const feedRecientes = useMemo(() => {
    return [
      ...safeAC.map((ac) => ({
        ...ac,
        tipoDoc: 'AC',
        folioMostrar: ac.folio_codigo || ac.folio || 'AC Borrador',
        fechaOrden: new Date(ac.fecha_apertura || ac.fecha_creacion_borrador || 0),
        descripcionMostrar: ac.descripcion_no_conformidad_original || ac.hallazgo || 'Sin descripción'
      })),
      ...safePM.map((pm) => ({
        ...pm,
        tipoDoc: 'PM',
        folioMostrar: pm.folio || 'PM Borrador',
        fechaOrden: new Date(pm.created_at || 0),
        descripcionMostrar: pm.meta_mejora || pm.descripcion || 'Plan de Mejora Continua'
      }))
    ].sort((a, b) => b.fechaOrden - a.fechaOrden).slice(0, 6);
  }, [safeAC, safePM]);

  // Generar Diagnóstico Ejecutivo IA con el Asesor Normativo
  const handleGenerarDiagnosticoIA = async () => {
    setModalSintesisAbierto(true);
    setCargandoSintesis(true);
    setErrorSintesis('');

    const promptEjecutivo = `
Actúa como Asesor Senior de Calidad ISO 9001:2015/2026 para la Alta Dirección y Consejo Directivo de OOMAPASC (Cajeme).
Genera un Dictamen Ejecutivo de Revisión por la Dirección (Cláusula 9.3) para el siguiente corte de desempeño:

DATOS INSTITUCIONALES CONSOLIDADOS:
- Ejercicio: ${ejercicio} | Período: ${periodoActivo.label} | Ámbito: ${direccionFiltro}
- Índice Global de Salud del SGC: ${healthScore}% (${calificacionSalud.nivel})
- Indicadores Clave (86 totales): ${indicadoresStats.pctCumplimiento}% cumplimiento promedio (${indicadoresStats.verdes} en meta, ${indicadoresStats.amarillos} en alerta, ${indicadoresStats.rojos} críticos).
- Indicadores en Rojo Crítico (${indicadoresCriticos.length}): ${indicadoresCriticos.map(i => `${i.nombre} (${i.area})`).join(', ') || 'Ninguno en estado crítico'}.
- Acciones Correctivas (OOMRSC-20): ${acStats.abiertas} abiertas, ${acStats.cerradas} cerradas eficaces (Tasa de Eficacia: ${acStats.tasaEficacia}%).
- Planes de Mejora (OOMRSC-21): ${pmStats.activos} activos, Presupuesto Ejercido: $${pmStats.presupuestoEjercido.toLocaleString()} de $${pmStats.presupuestoTotal.toLocaleString()} MXN.
- Vigilancia de Riesgos (ISO 6.1): ${riesgosStats.total} riesgos (${riesgosStats.criticos} extremos, ${riesgosStats.altos} altos, ${riesgosStats.pctMitigacion}% con plan de contingencia).
- Programa Anual de Auditorías: ${auditoriasStats.completadas} concluidas de ${auditoriasStats.total} programadas (${auditoriasStats.pctAvance}% de avance).

ESTRUCTURA OBLIGATORIA DEL INFORME:
1. DICTAMEN EJECUTIVO GLOBAL DEL SGC
2. FORTALEZAS OPERATIVAS Y LOGROS CLAVE
3. FOCOS ROJOS, VULNERABILIDADES Y RIESGOS CRÍTICOS
4. DIRECTRICES Y DECISIONES ESTRATÉGICAS RECOMENDADAS PARA LA DIRECCIÓN GENERAL

Sé conciso, riguroso, institucional y fundamenta las decisiones con base en ISO 9001:2015/2026 y las metas hídricas del organismo.
    `.trim();

    try {
      const res = await fetch('/api/v1/iso/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: promptEjecutivo,
          norma_id: 'ISO 9001:2015',
          historial: [],
          catalogo_documentos: safeDocs || [],
          catalogo_procesos: context.procesosDetalle || []
        })
      });

      if (!res.ok) {
        throw new Error(`Error en servidor (${res.status})`);
      }

      const data = await res.json();
      setSintesisIA(data.respuesta || 'No se recibió respuesta del agente.');
      
      if (registrarMovimiento) {
        registrarMovimiento({
          modulo: 'DIRECCION',
          accion: 'DIAGNOSTICO_IA',
          descripcion: `Generación de Diagnóstico Ejecutivo de Dirección con IA (${periodoActivo.label} ${ejercicio})`,
          detalles: `Salud global: ${healthScore}%. Corte: ${direccionFiltro}`
        });
      }
    } catch (err) {
      console.error('Error al generar diagnóstico IA:', err);
      setErrorSintesis('No fue posible contactar al servicio de Inteligencia Artificial. Verifique la conexión local o la disponibilidad del backend.');
    } finally {
      setCargandoSintesis(false);
    }
  };

  // Descargar Informe en PDF
  const handleDescargarInformePDF = () => {
    exportarInformeDireccionPDF({
      ejercicio,
      periodoNombre: periodoActivo.label,
      direccionNombre: direccionFiltro === 'TODAS' ? 'Organismo Completo (Todas las Direcciones)' : `Dirección: ${direccionFiltro}`,
      kpis: {
        acAbiertas: acStats.abiertas,
        acCerradas: acStats.cerradas,
        tasaEficacia: acStats.tasaEficacia,
        pmActivos: pmStats.activos,
        healthScore
      },
      indicadoresStats: {
        pctCumplimiento: indicadoresStats.pctCumplimiento,
        verdes: indicadoresStats.verdes,
        amarillos: indicadoresStats.amarillos,
        rojos: indicadoresStats.rojos,
        total: indicadoresStats.total
      },
      indicadoresCriticos: indicadoresCriticos.map((ind) => ({
        id: ind.id,
        nombre: ind.nombre,
        area: ind.area,
        meta: ind.meta,
        unidad: ind.unidad,
        valorActual: ind.ultimoValor
      })),
      riesgosStats: {
        total: riesgosStats.total,
        criticos: riesgosStats.criticos,
        altos: riesgosStats.altos,
        pctMitigacion: riesgosStats.pctMitigacion
      },
      presupuestoStats: {
        total: pmStats.presupuestoTotal,
        ejercido: pmStats.presupuestoEjercido
      },
      auditoriasStats: {
        total: auditoriasStats.total,
        completadas: auditoriasStats.completadas,
        pctAvance: auditoriasStats.pctAvance
      },
      sintesisIA: sintesisIA || null,
      usuario: usuarioLogueado
    });

    if (registrarMovimiento) {
      registrarMovimiento({
        modulo: 'DIRECCION',
        accion: 'EXPORTAR_PDF',
        descripcion: `Descarga de Informe Ejecutivo de Revisión por la Dirección (${periodoActivo.label} ${ejercicio})`,
        detalles: `Generado para ${direccionFiltro}`
      });
    }
  };

  // Guardar Acción Correctiva rápida desde Indicador Crítico
  const handleCrearACDesdeIndicador = () => {
    if (!indicadorParaAC) return;
    setGuardandoAC(true);

    const baseAC = acDesdeIndicador(indicadorParaAC, {
      cumplimiento: indicadorParaAC.cumplimiento,
      anio: ejercicio,
      meses: periodoActivo.meses
    });

    const nuevaAC = {
      ...baseAC,
      solicitante: usuarioLogueado?.nombre || 'Alta Dirección',
      responsable: indicadorParaAC.area || 'Titular de Área',
      analisis_causa_raiz: justificacionAC ? `Observaciones y directrices de Dirección: ${justificacionAC}` : '',
      impacta_otros_procesos: false,
      actualiza_matriz_riesgos: true,
      prioridad: 'ALTA'
    };

    if (setAccionesCorrectivas) {
      setAccionesCorrectivas([nuevaAC, ...safeAC]);
    }

    if (registrarMovimiento) {
      registrarMovimiento({
        modulo: 'ACCIONES_CORRECTIVAS',
        accion: 'CREACION_DESDE_INDICADOR',
        descripcion: `Levantamiento automático de AC ${nuevaAC.folio_codigo} por desviación en indicador #${indicadorParaAC.id}`,
        folio: nuevaAC.folio_codigo
      });
    }

    setGuardandoAC(false);
    setIndicadorParaAC(null);
    setJustificacionAC('');
    setActiveTab('ac');
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* 1. Institutional Executive Control Tower Banner */}
      <div className="bg-gradient-to-r from-[#0A1424] via-[#0E2038] to-[#122A4C] rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-xs font-semibold text-sky-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              Torre de Control Estratégica · ISO 9001:2015 / 2026 § 9.3
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Panel de Control y Revisión por la Dirección
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Consolidado ejecutivo para la toma de decisiones del Consejo Directivo y Titulares de Área de OOMAPAS de Cajeme. Monitoreo integral de los 86 indicadores, riesgos, acciones correctivas e inversiones de mejora.
            </p>

            {/* Health Score Pill */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${calificacionSalud.bg} ${calificacionSalud.color}`}>
                <Award size={15} />
                <span>Salud Global del SGC: <span className="font-mono text-sm">{healthScore}%</span></span>
                <span className="text-[11px] font-normal opacity-90">({calificacionSalud.nivel})</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: AI Diagnosis & Official PDF Report */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleGenerarDiagnosticoIA}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-lg shadow-sky-900/30 hover:shadow-sky-700/50 transition-all border border-sky-400/30 active:scale-95 cursor-pointer"
            >
              <Sparkles size={15} className="text-sky-200 animate-pulse" />
              <span>Diagnóstico Ejecutivo IA</span>
            </button>

            <button
              onClick={handleDescargarInformePDF}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 font-bold text-xs shadow-md border border-slate-600/70 transition-all active:scale-95 cursor-pointer"
            >
              <Download size={15} className="text-sky-400" />
              <span>Descargar Informe PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Filter Bar (Ejercicio, Periodo, Dirección) */}
      <div className="bg-white rounded-xl shadow-card-subtle border border-slate-200/90 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Filter size={16} className="text-sky-600" />
            <span>Filtros de Período y Ámbito:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            {/* Selector de Ejercicio */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Ejercicio:</label>
              <select
                value={ejercicio}
                onChange={(e) => setEjercicio(Number(e.target.value))}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {EJERCICIOS.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Selector de Período */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Corte:</label>
              <select
                value={periodoId}
                onChange={(e) => setPeriodoId(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PERIODOS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Selector de Dirección */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Área / Dir:</label>
              <select
                value={direccionFiltro}
                onChange={(e) => setDireccionFiltro(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODAS">Todas las Direcciones</option>
                {DIRECCIONES_BASE.map((dir) => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 6 Primary Executive KPI Strategic Cards (ISO 9001 § 9.3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Semáforo de Indicadores */}
        <StatCard 
          title="Cumplimiento Indicadores" 
          value={`${indicadoresStats.pctCumplimiento}%`} 
          icon={Target} 
          accent={indicadoresStats.pctCumplimiento >= 80 ? 'emerald' : indicadoresStats.pctCumplimiento >= 50 ? 'amber' : 'rose'}
          trend={`${indicadoresStats.verdes} en meta · ${indicadoresStats.rojos} críticos`}
          trendUp={indicadoresStats.pctCumplimiento >= 80}
          benchmark={`${indicadoresStats.medidosCount} de ${indicadoresStats.total} medidos`}
          onClick={() => setTabAnalisis('indicadores')}
        />

        {/* Card 2: Vigilancia de Riesgos */}
        <StatCard 
          title="Vigilancia de Riesgos" 
          value={riesgosStats.total} 
          icon={ShieldAlert} 
          accent={riesgosStats.criticos > 0 ? 'rose' : 'blue'}
          trend={`${riesgosStats.criticos} Extremos · ${riesgosStats.altos} Altos`}
          trendUp={false}
          benchmark={`${riesgosStats.pctMitigacion}% con Plan Mitigación`}
          onClick={() => setTabAnalisis('riesgos')}
        />

        {/* Card 3: Acciones Correctivas */}
        <StatCard 
          title="Acciones Correctivas" 
          value={acStats.abiertas} 
          icon={AlertTriangle} 
          accent={acStats.abiertas > 3 ? 'rose' : 'amber'}
          trend={`${acStats.cerradas} Cerradas`}
          trendUp={acStats.tasaEficacia >= 70}
          benchmark={`Eficacia: ${acStats.tasaEficacia}%`}
          onClick={() => setTabAnalisis('ac')}
        />

        {/* Card 4: Planes de Mejora */}
        <StatCard 
          title="Planes de Mejora" 
          value={pmStats.activos} 
          icon={TrendingUp} 
          accent="emerald"
          trend={`$${(pmStats.presupuestoEjercido / 1000).toFixed(0)}k Ejercidos`}
          trendUp={true}
          benchmark="Formato OOMRSC-21"
          onClick={() => setTabAnalisis('pm')}
        />

        {/* Card 5: Auditorías Anuales */}
        <StatCard 
          title="Programa Auditorías" 
          value={`${auditoriasStats.completadas}/${auditoriasStats.total}`} 
          icon={ClipboardCheck} 
          accent="indigo"
          trend={`${auditoriasStats.pctAvance}% avance anual`}
          trendUp={true}
          benchmark={`${auditoriasStats.hallazgos} Hallazgos SGC`}
          onClick={() => setTabAnalisis('auditorias')}
        />

        {/* Card 6: Documentos en Control */}
        <StatCard 
          title="Control Documental" 
          value={safeDocs.length} 
          icon={FileText} 
          accent="blue"
          trend="Procedimientos SGC"
          trendUp={true}
          benchmark="Matriz de Trazabilidad"
          onClick={() => setActiveTab('documents')}
        />
      </div>

      {/* 4. Tab Navigation for In-Depth Executive Analysis */}
      <div className="bg-white rounded-xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex space-x-1 sm:space-x-2 py-3">
            {[
              { id: 'resumen', label: 'Resumen & Radar', icon: PieChart },
              { id: 'indicadores', label: `Indicadores (${catalogoIndicadores.length})`, icon: Target, badge: indicadoresStats.rojos > 0 ? indicadoresStats.rojos : null },
              { id: 'riesgos', label: `Riesgos (${riesgosStats.total})`, icon: ShieldAlert },
              { id: 'ac', label: `Acciones Correctivas (${acStats.total})`, icon: AlertTriangle },
              { id: 'pm', label: `Planes de Mejora (${pmStats.total})`, icon: TrendingUp },
              { id: 'auditorias', label: `Auditorías (${auditoriasStats.total})`, icon: ClipboardCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = tabAnalisis === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabAnalisis(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-sky-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={13} className="text-sky-600" />
            <span className="font-medium">Corte: <strong className="text-slate-800">{periodoActivo.label} {ejercicio}</strong></span>
          </div>
        </div>

        {/* 5. TAB CONTENT RENDER */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: RESUMEN Y RADAR */}
          {tabAnalisis === 'resumen' && (
            <div className="space-y-6">
              {/* Radar de Direcciones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 size={18} className="text-sky-600" />
                      Desempeño y Salud Operativa por Dirección
                    </h3>
                    <p className="text-xs text-slate-500">Evaluación consolidada de metas, riesgos y no conformidades por área institucional.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono uppercase">ISO 9001 § 9.3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radarDirecciones.map((dir) => (
                    <div 
                      key={dir.direccion} 
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-bold text-xs text-slate-800">{dir.direccion}</span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md font-mono ${
                          dir.cumplimiento >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          dir.cumplimiento >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {dir.cumplimiento}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            dir.cumplimiento >= 80 ? 'bg-emerald-500' :
                            dir.cumplimiento >= 50 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${dir.cumplimiento}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 border-t border-slate-200/70 pt-2 font-mono">
                        <div>
                          <span className="block text-[10px] text-slate-400">Indicadores</span>
                          <strong className="text-slate-700">{dir.totalIndicadores}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Rojos</span>
                          <strong className={dir.criticos > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>{dir.criticos}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">AC Abiertas</span>
                          <strong className={dir.acAbiertas > 0 ? 'text-amber-600 font-bold' : 'text-slate-700'}>{dir.acAbiertas}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicadores Críticos (Focos Rojos) */}
              {indicadoresCriticos.length > 0 && (
                <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <Flame size={18} className="text-rose-600" />
                      <span>Focos Rojos: Indicadores que Requieren Intervención Inmediata</span>
                    </div>
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      {indicadoresCriticos.length} desviaciones
                    </span>
                  </div>

                  <div className="divide-y divide-rose-200/60">
                    {indicadoresCriticos.slice(0, 4).map((ind) => (
                      <div key={ind.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-rose-700">#{ind.id}</span>
                            <span className="text-xs font-bold text-slate-800">{ind.nombre}</span>
                            <span className="text-[11px] text-slate-500 font-medium">({ind.area})</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Meta establecida: <strong className="text-slate-800">{ind.meta} {ind.unidad}</strong> | Desempeño: <strong className="text-rose-700">{ind.cumplimiento}%</strong> (Último valor: {ind.ultimoValor ?? 'Sin registro'})
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setIndicadorParaAC(ind);
                            setJustificacionAC(`Desviación crítica en semáforo rojo durante ${periodoActivo.label} ${ejercicio}.`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                        >
                          <PlusCircle size={14} />
                          <span>Levantar AC</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Reciente de Actividades */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-sky-600" />
                    Bitácora de Incidentes y Mejoras Recientes
                  </h3>
                  <button
                    onClick={() => setActiveTab('ac')}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                  >
                    Ver Todo <ArrowRight size={13} />
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {feedRecientes.map((act) => (
                    <div
                      key={`${act.tipoDoc}-${act.id}`}
                      onClick={() => setActiveTab(act.tipoDoc === 'AC' ? 'ac' : 'pm')}
                      className="p-3.5 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          act.tipoDoc === 'AC' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {act.tipoDoc}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-sky-700">
                              {act.folioMostrar}
                            </span>
                            <span className="text-[11px] text-slate-400">·</span>
                            <span className="text-[11px] text-slate-500 truncate">
                              {act.area || act.direccion || 'Organismo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5 max-w-xl">
                            {act.descripcionMostrar}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <StatusBadge estado={act.estado} size="sm" />
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDICADORES (86) */}
          {tabAnalisis === 'indicadores' && (
            <div className="space-y-4">
              {/* Barra de Filtros Internos de Indicadores */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Semáforo:</span>
                  {[
                    { id: 'TODOS', label: `Todos (${evaluacionIndicadores.length})` },
                    { id: 'VERDE', label: `Cumplen (${indicadoresStats.verdes})`, color: 'bg-emerald-100 text-emerald-800' },
                    { id: 'AMARILLO', label: `Vigilar (${indicadoresStats.amarillos})`, color: 'bg-amber-100 text-amber-800' },
                    { id: 'ROJO', label: `Críticos (${indicadoresStats.rojos})`, color: 'bg-rose-100 text-rose-800' },
                    { id: 'SINDATO', label: `Sin Captura (${indicadoresStats.sinDato})`, color: 'bg-slate-200 text-slate-700' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setFiltroSemaforo(btn.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        filtroSemaforo === btn.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar indicador o área..."
                    value={busquedaInd}
                    onChange={(e) => setBusquedaInd(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Tabla de Indicadores */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Indicador</th>
                        <th className="p-3">Dirección / Área</th>
                        <th className="p-3">Meta</th>
                        <th className="p-3">Último Valor</th>
                        <th className="p-3">Cumplimiento</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {indicadoresFiltrados.length > 0 ? (
                        indicadoresFiltrados.map((ind) => (
                          <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-500">#{ind.id}</td>
                            <td className="p-3 font-medium text-slate-900 max-w-sm">
                              {ind.nombre}
                              <div className="text-[10px] text-slate-400">{ind.proceso}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{ind.direccion}</span>
                              <div className="text-[11px] text-slate-500">{ind.area}</div>
                            </td>
                            <td className="p-3 font-mono font-semibold text-slate-700">
                              {ind.meta} {ind.unidad}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {ind.ultimoValor !== null ? `${ind.ultimoValor} ${ind.unidad || ''}` : <span className="text-slate-400 font-normal">Sin dato</span>}
                            </td>
                            <td className="p-3">
                              {ind.cumplimiento !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    ind.semaforo === 'verde' ? 'bg-emerald-500' :
                                    ind.semaforo === 'amarillo' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                  <span className="font-mono font-bold text-slate-900">{ind.cumplimiento}%</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No evaluado</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {ind.semaforo === 'rojo' ? (
                                <button
                                  onClick={() => {
                                    setIndicadorParaAC(ind);
                                    setJustificacionAC(`Desviación crítica en semáforo rojo durante ${periodoActivo.label} ${ejercicio}.`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                                >
                                  <PlusCircle size={12} />
                                  <span>Crear AC</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActiveTab('indicadores')}
                                  className="text-sky-700 hover:text-sky-900 text-xs font-semibold"
                                >
                                  Ver Ficha
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No se encontraron indicadores con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RIESGOS (ISO 6.1) */}
          {tabAnalisis === 'riesgos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                  <span className="text-xs font-bold text-rose-800 uppercase">Riesgos Extremos</span>
                  <p className="text-2xl font-black font-mono text-rose-700 mt-1">{riesgosStats.criticos}</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">Severidad ≥ 15 (Intervención urgente)</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="text-xs font-bold text-amber-800 uppercase">Riesgos Altos</span>
                  <p className="text-2xl font-black font-mono text-amber-700 mt-1">{riesgosStats.altos}</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Severidad 10 a 14</p>
                </div>
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                  <span className="text-xs font-bold text-sky-800 uppercase">Riesgos Moderados</span>
                  <p className="text-2xl font-black font-mono text-sky-700 mt-1">{riesgosStats.moderados}</p>
                  <p className="text-[11px] text-sky-600 mt-0.5">Severidad 5 a 9</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Con Plan de Mitigación</span>
                  <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{riesgosStats.pctMitigacion}%</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">{riesgosStats.conPlan} de {riesgosStats.total} riesgos</p>
                </div>
              </div>

              {/* Lista de Riesgos Relevantes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800">Matriz de Riesgos Institucional (ISO 9001 § 6.1)</span>
                  <button
                    onClick={() => setActiveTab('riesgos')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900"
                  >
                    Abrir Módulo de Riesgos →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {safeRiesgos.slice(0, 6).map((r) => {
                    const sev = (Number(r.probabilidad) || 1) * (Number(r.impacto) || 1);
                    return (
                      <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                              sev >= 15 ? 'bg-rose-100 text-rose-800' :
                              sev >= 10 ? 'bg-amber-100 text-amber-800' :
                              'bg-sky-100 text-sky-800'
                            }`}>
                              Severidad: {sev}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{r.riesgo}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            <strong>Causa:</strong> {r.causa || 'No especificada'} | <strong>Efecto:</strong> {r.efecto || 'No especificado'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Área: {r.area || 'Operación'} · Proceso: {r.proceso || 'General'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            r.estado_plan === 'EN_PROCESO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {r.estado_plan || 'SIN PLAN'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCIONES CORRECTIVAS (OOMRSC-20) */}
          {tabAnalisis === 'ac' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total de Casos</span>
                  <p className="text-2xl font-black font-mono text-slate-900 mt-1">{acStats.total}</p>
                </div>
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
                  <span className="text-xs font-bold text-rose-800 uppercase">AC Abiertas</span>
                  <p className="text-2xl font-black font-mono text-rose-700 mt-1">{acStats.abiertas}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <span className="text-xs font-bold text-emerald-800 uppercase">AC Cerradas y Resueltas</span>
                  <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{acStats.cerradas}</p>
                </div>
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60">
                  <span className="text-xs font-bold text-sky-800 uppercase">Tasa de Eficacia</span>
                  <p className="text-2xl font-black font-mono text-sky-700 mt-1">{acStats.tasaEficacia}%</p>
                </div>
              </div>

              {/* Lista de ACs */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800">Catálogo de Acciones Correctivas (OOMRSC-20)</span>
                  <button
                    onClick={() => setActiveTab('ac')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900"
                  >
                    Ir al Módulo AC →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {safeAC.slice(0, 6).map((ac) => (
                    <div key={ac.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setActiveTab('ac')}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-sky-700">{ac.folio_codigo || ac.folio || 'AC'}</span>
                          <span className="text-xs text-slate-500 font-medium">· {ac.area}</span>
                        </div>
                        <p className="text-xs text-slate-800 mt-0.5 font-medium max-w-xl truncate">
                          {ac.descripcion_no_conformidad_original || ac.hallazgo || 'Sin descripción'}
                        </p>
                      </div>
                      <StatusBadge estado={ac.estado} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PLANES DE MEJORA (OOMRSC-21) */}
          {tabAnalisis === 'pm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase">Planes Registrados</span>
                  <p className="text-2xl font-black font-mono text-slate-900 mt-1">{pmStats.total}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Presupuesto Asignado</span>
                  <p className="text-2xl font-black font-mono text-emerald-700 mt-1">${pmStats.presupuestoTotal.toLocaleString()} <span className="text-xs font-normal">MXN</span></p>
                </div>
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60">
                  <span className="text-xs font-bold text-sky-800 uppercase">Presupuesto Ejercido</span>
                  <p className="text-2xl font-black font-mono text-sky-700 mt-1">${pmStats.presupuestoEjercido.toLocaleString()} <span className="text-xs font-normal">MXN</span></p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800">Proyectos de Mejora Continua (OOMRSC-21)</span>
                  <button
                    onClick={() => setActiveTab('pm')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900"
                  >
                    Ir al Módulo PM →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {safePM.map((pm) => (
                    <div key={pm.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setActiveTab('pm')}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-emerald-700">{pm.folio || 'PM'}</span>
                          <span className="text-xs text-slate-500">· {pm.area || 'Organismo'}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium mt-0.5 max-w-xl truncate">
                          {pm.meta_mejora || pm.descripcion || 'Plan de Mejora'}
                        </p>
                      </div>
                      <StatusBadge estado={pm.estado} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDITORÍAS (ISO 9.2) */}
          {tabAnalisis === 'auditorias' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase">Auditorías Concluidas</span>
                  <p className="text-2xl font-black font-mono text-slate-900 mt-1">{auditoriasStats.completadas} / {auditoriasStats.total}</p>
                </div>
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60">
                  <span className="text-xs font-bold text-indigo-800 uppercase">Avance del Programa Anual</span>
                  <p className="text-2xl font-black font-mono text-indigo-700 mt-1">{auditoriasStats.pctAvance}%</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                  <span className="text-xs font-bold text-amber-800 uppercase">Hallazgos y Observaciones</span>
                  <p className="text-2xl font-black font-mono text-amber-700 mt-1">{auditoriasStats.hallazgos}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800">Programa Anual de Auditorías Internas y Externas</span>
                  <button
                    onClick={() => setActiveTab('audits')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900"
                  >
                    Ir al Módulo de Auditorías →
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {safeAuditorias.map((aud) => (
                    <div key={aud.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setActiveTab('audits')}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800">{aud.numero}</span>
                          <span className="text-xs text-slate-500">· {aud.tipo}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-0.5">
                          Área auditada: <strong>{aud.area}</strong> | Fechas: {aud.fecha_inicio} a {aud.fecha_fin}
                        </p>
                      </div>
                      <StatusBadge estado={aud.estado} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. MODAL: SÍNTESIS EJECUTIVA CON INTELIGENCIA ARTIFICIAL */}
      <ContenedorModal
        isOpen={modalSintesisAbierto}
        onClose={() => setModalSintesisAbierto(false)}
        size="4xl"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Cabecera del Modal */}
          <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
                <Sparkles size={18} className="text-sky-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Diagnóstico Ejecutivo con IA — Revisión por la Dirección</h3>
                <p className="text-[11px] text-sky-200">Asesor Normativo ISO 9001:2015 / 2026 · Cláusula 9.3</p>
              </div>
            </div>
            <button
              onClick={() => setModalSintesisAbierto(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cuerpo del Diagnóstico */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {cargandoSintesis ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw size={36} className="mx-auto text-sky-600 animate-spin" />
                <p className="font-bold text-slate-800 text-sm">Analizando métricas del organismo con Inteligencia Artificial...</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Evaluando 86 indicadores institucionales, matriz de riesgos, acciones correctivas e inversiones para formular recomendaciones estratégicas.
                </p>
              </div>
            ) : errorSintesis ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error en la consulta</p>
                  <p className="text-xs mt-0.5">{errorSintesis}</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line font-sans bg-slate-50/60 p-5 rounded-xl border border-slate-200">
                {sintesisIA}
              </div>
            )}
          </div>

          {/* Pie de acciones del Modal */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500">
              Corte: <strong>{periodoActivo.label} {ejercicio}</strong> ({direccionFiltro})
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {sintesisIA && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sintesisIA);
                    setCopiadoSintesis(true);
                    setTimeout(() => setCopiadoSintesis(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiadoSintesis ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiadoSintesis ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              )}

              <button
                onClick={handleDescargarInformePDF}
                className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Descargar PDF con Síntesis</span>
              </button>

              <button
                onClick={() => setModalSintesisAbierto(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </ContenedorModal>

      {/* 7. MODAL: CREAR ACCIÓN CORRECTIVA DESDE INDICADOR CRÍTICO */}
      <ContenedorModal
        isOpen={!!indicadorParaAC}
        onClose={() => setIndicadorParaAC(null)}
        size="lg"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-rose-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              <h3 className="font-extrabold text-sm">Levantar Acción Correctiva Inmediata (OOMRSC-20)</h3>
            </div>
            <button onClick={() => setIndicadorParaAC(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {indicadorParaAC && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                <span className="font-bold text-rose-800">Indicador #{indicadorParaAC.id}: {indicadorParaAC.nombre}</span>
                <p className="text-slate-600">
                  Área: <strong>{indicadorParaAC.area}</strong> | Dirección: <strong>{indicadorParaAC.direccion}</strong> | Meta: <strong>{indicadorParaAC.meta} {indicadorParaAC.unidad}</strong>
                </p>
                <p className="text-rose-700 font-bold">
                  Estado: Semáforo Rojo ({indicadorParaAC.cumplimiento}% de cumplimiento)
                </p>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Justificación y Directriz de la Dirección:
              </label>
              <textarea
                rows={3}
                value={justificacionAC}
                onChange={(e) => setJustificacionAC(e.target.value)}
                placeholder="Instrucciones para el titular del área respecto al análisis de causa raíz..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Al confirmar, se creará un folio oficial OOMRSC-20 en estado BORRADOR asignado al área responsable y se registrará en la bitácora de auditoría.
            </p>
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              onClick={() => setIndicadorParaAC(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrearACDesdeIndicador}
              disabled={guardandoAC}
              className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {guardandoAC ? 'Generando...' : 'Confirmar y Abrir AC'}
            </button>
          </div>
        </div>
      </ContenedorModal>
    </div>
  );
}
