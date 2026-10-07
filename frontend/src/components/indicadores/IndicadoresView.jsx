import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Building2, 
  TrendingUp, 
  Layers, 
  FileSpreadsheet, 
  ChevronRight, 
  Sparkles, 
  BarChart3, 
  Calendar, 
  Check, 
  FileWarning,
  Eye,
  Flame,
  ShieldCheck,
  History,
  Activity,
  PlusCircle,
  Settings,
  Lock,
  ShieldAlert,
  CheckSquare,
  Square,
  Table,
  Mail,
  Send,
  ExternalLink
} from 'lucide-react';
import { 
  INDICADORES, 
  FORMATO_CUADRO_CONTROL, 
  RANGOS_SEMAFORO_OOMRSC05, 
  evalSemaforoOOMRSC05, 
  REPORTES_CORRECCION_INICIALES 
} from '../../constants/indicadores';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ContenedorModal from '../common/ContenedorModal';
import { acDesdeIndicador } from '../../services/flujoService';
import DesempenoProcesosTab from './DesempenoProcesosTab';
import ModalGestionarIndicador from './ModalGestionarIndicador';
import ModalGenerarRC from './ModalGenerarRC';
import ModalGestionarRC from './ModalGestionarRC';
import ModalRecordatorioAtrasos from './ModalRecordatorioAtrasos';
import FichasGubernamentalesTab from './FichasGubernamentalesTab';
import ProyectosPresupuestoTab from './ProyectosPresupuestoTab';
import ControlPresupuestalAreasTab from './ControlPresupuestalAreasTab';
import EvaluacionTrimestralTab from './EvaluacionTrimestralTab';
import { obtenerFichaTecnicaIndicador } from '../../constants/fichasGubernamentales';
import { AREAS, DIRECCIONES, normalizarArea, normalizarDireccion, obtenerDireccionDeArea } from '../../constants/areas';
import { useIsMobile } from '../../hooks';



const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TRIMESTRES = {
  1: { label: '1er Trimestre (Ene-Mar)', meses: ['Ene', 'Feb', 'Mar'], key: 'T1' },
  2: { label: '2do Trimestre (Abr-Jun)', meses: ['Abr', 'May', 'Jun'], key: 'T2' },
  3: { label: '3er Trimestre (Jul-Sep)', meses: ['Jul', 'Ago', 'Sep'], key: 'T3' },
  4: { label: '4to Trimestre (Oct-Dic)', meses: ['Oct', 'Nov', 'Dic'], key: 'T4' },
};

const PAGE_SIZE = 25;

export default function IndicadoresView({
  indicadoresData = {},
  setIndicadoresData,
  puedeTodasAreas,
  areaUsuario
}) {
  const { 
    areas = [], 
    procesos = [], 
    direcciones = [], 
    setAccionesCorrectivas, 
    registrarMovimiento, 
    usuarioLogueado 
  } = useSGC();
  const toast = useToast();
  const { isMobile } = useIsMobile();

  // Permisos: Admin o personal del SGC
  const esAdminOSGC = Boolean(
    usuarioLogueado?.rol?.toLowerCase().includes('admin') ||
    usuarioLogueado?.rol?.toLowerCase().includes('sgc') ||
    usuarioLogueado?.rol?.toLowerCase().includes('calidad') ||
    puedeTodasAreas
  );

  // Estados de navegación
  // 'cuadro' | 'procesos' | 'trimestral' | 'correcciones'
  const [tabActiva, setTabActiva] = useState('cuadro');
  const [vistaModo, setVistaModo] = useState('mensual'); // 'mensual' | 'anual' (Matriz 12 meses)
  const [ejercicio, setEjercicio] = useState(2026);
  const [mesActivoIndex, setMesActivoIndex] = useState(() => Math.min(new Date().getMonth(), 9)); // Octubre default
  const mesActivo = MESES[mesActivoIndex];
  const mesActivoNombre = MESES_COMPLETOS[mesActivoIndex];
  const [mesParaCaptura, setMesParaCaptura] = useState(mesActivo);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroDireccion, setFiltroDireccion] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroImpacto, setFiltroImpacto] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState('');
  const [pagina, setPagina] = useState(1);

  // Estados de Edición Rápida / Captura
  const [indicadorEnEdicion, setIndicadorEnEdicion] = useState(null);
  const [valorInput, setValorInput] = useState('');
  const [observacionInput, setObservacionInput] = useState('');
  const [accionInput, setAccionInput] = useState('NA');
  const [mostrarOpcionesAvanzadas, setMostrarOpcionesAvanzadas] = useState(false);

  // Estados de Gobernanza (Segunda Confirmación Normal & Modificación Administrador)
  const [modalSegundaConfirmacion, setModalSegundaConfirmacion] = useState(false);
  const [confirmacionCheckbox, setConfirmacionCheckbox] = useState(false);
  const [modalBloqueadoNormal, setModalBloqueadoNormal] = useState(false);
  const [datosBloqueo, setDatosBloqueo] = useState(null);
  const [modalJustificacionAdmin, setModalJustificacionAdmin] = useState(false);
  const [motivoModificacionAdmin, setMotivoModificacionAdmin] = useState('');
  const [esModificacionAdmin, setEsModificacionAdmin] = useState(false);
  const [valorOriginalAdmin, setValorOriginalAdmin] = useState(null);

  // Modal para Gestión de Indicador (Crear / Editar Ficha Oficial)
  const [modalGestionIndicadorOpen, setModalGestionIndicadorOpen] = useState(false);
  const [indicadorParaGestionar, setIndicadorParaGestionar] = useState(null);

  // Modal para Generación de Reporte de Corrección (RC)
  const [modalRCOpen, setModalRCOpen] = useState(false);
  const [datosParaRC, setDatosParaRC] = useState(null);

  // Reportes de corrección históricos (con persistencia local)
  const [reportesCorreccion, setReportesCorreccion] = useState(() => {
    try {
      const g = localStorage.getItem('sgc-reportes-correccion');
      if (g) return JSON.parse(g);
    } catch (e) { /* ignore */ }
    return REPORTES_CORRECCION_INICIALES;
  });

  // Modal para Gestión / Dictamen de Reportes de Corrección (RC)
  const [rcParaGestionar, setRcParaGestionar] = useState(null);
  const [modalGestionarRCOpen, setModalGestionarRCOpen] = useState(false);
  const [filtroEstadoRC, setFiltroEstadoRC] = useState('TODOS');
  const [busquedaRC, setBusquedaRC] = useState('');

  // Sub-pestaña para Presupuesto (Control por Áreas vs Fichas CONAC)
  const [subTabPresupuesto, setSubTabPresupuesto] = useState('areas');

  // Modal de Recordatorios y Envío de Correos a Áreas
  const [modalRecordatoriosOpen, setModalRecordatoriosOpen] = useState(false);

  // Actualizar reporte de corrección (edición, cierre o dictamen)
  const handleActualizarReporteCorreccion = (reporteActualizado) => {
    setReportesCorreccion(prev => {
      const idx = prev.findIndex(r => r.id === reporteActualizado.id || r.folio === reporteActualizado.folio);
      let actualizados;
      if (idx >= 0) {
        actualizados = [...prev];
        actualizados[idx] = reporteActualizado;
      } else {
        actualizados = [reporteActualizado, ...prev];
      }
      try {
        localStorage.setItem('sgc-reportes-correccion', JSON.stringify(actualizados));
      } catch (e) { /* ignore */ }
      return actualizados;
    });
  };

  // Fichas Técnicas Oficiales Gubernamentales (Ayuntamiento de Cajeme)
  const [fichasPersonalizadas, setFichasPersonalizadas] = useState(() => {
    try {
      const g = localStorage.getItem('sgc-fichas-gubernamentales');
      if (g) return JSON.parse(g);
    } catch (e) { /* ignore */ }
    return indicadoresData?.fichasPersonalizadas || {};
  });

  const [modalFichaAyuntamientoOpen, setModalFichaAyuntamientoOpen] = useState(false);
  const [fichaParaModal, setFichaParaModal] = useState(null);
  const [pestanaModalInicial, setPestanaModalInicial] = useState('pmd');

  const handleAbrirFichaAyuntamiento = (ind) => {
    const numId = ind.numero !== undefined ? ind.numero : ind.id;
    const customData = fichasPersonalizadas[numId] || null;
    const fichaCompleta = obtenerFichaTecnicaIndicador(ind, customData);
    setFichaParaModal(fichaCompleta);
    setIndicadorParaGestionar(ind);
    setPestanaModalInicial('pmd');
    setModalGestionIndicadorOpen(true);
  };

  const handleGuardarFichaPersonalizada = (fichaActualizada) => {
    const numId = fichaActualizada.numeroIndicador !== undefined ? fichaActualizada.numeroIndicador : fichaActualizada.id;
    const nuevo = {
      ...fichasPersonalizadas,
      [numId]: fichaActualizada
    };
    setFichasPersonalizadas(nuevo);
    try {
      localStorage.setItem('sgc-fichas-gubernamentales', JSON.stringify(nuevo));
    } catch (e) { /* ignore */ }
    
    setIndicadoresData?.(prev => ({
      ...prev,
      fichasPersonalizadas: nuevo,
      updatedAt: new Date().toISOString()
    }));

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'ACTUALIZAR_FICHA_AYUNTAMIENTO',
      descripcion: `Actualización de Ficha Técnica PMD / Ayuntamiento para Indicador #${numId}`,
      detalles: `Programa: ${fichaActualizada.programa_pmd || 'SGC'} · Dimensión: ${fichaActualizada.dimension || 'Eficacia'}`,
      folio: `FICHA#${numId}`
    });
  };


  // Catálogo dinámico unificado (Base Oficial + Personalizaciones / Creados por Admin)
  const catalogoCustom = indicadoresData?.catalogoPersonalizado || {};
  const listaIndicadores = useMemo(() => {
    const mapa = new Map();
    INDICADORES.forEach(ind => {
      const custom = catalogoCustom[ind.id];
      const base = custom ? { ...ind, ...custom } : ind;
      const areaNorm = normalizarArea(base.area);
      const dirNorm = normalizarDireccion(base.direccion || obtenerDireccionDeArea(areaNorm));
      mapa.set(ind.id, { ...base, area: areaNorm, direccion: dirNorm });
    });
    Object.values(catalogoCustom).forEach(ind => {
      if (!mapa.has(ind.id)) {
        const areaNorm = normalizarArea(ind.area);
        const dirNorm = normalizarDireccion(ind.direccion || obtenerDireccionDeArea(areaNorm));
        mapa.set(ind.id, { ...ind, area: areaNorm, direccion: dirNorm });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => (a.numero ?? a.id) - (b.numero ?? b.id));
  }, [catalogoCustom]);

  // Resultados guardados en contexto global
  const resultados = indicadoresData.resultados || {};

  const guardarResultado = (indicadorId, mes, anio, valor, observacion = '', accion = 'NA', metaExtra = {}) => {
    const key = `${indicadorId}-${mes}-${anio}`;
    const nuevoObj = {
      ...(resultados[key] || {}),
      valor: valor === '' || valor === null ? null : Number(valor),
      observacion: observacion,
      accion: accion,
      capturadoPor: metaExtra.capturadoPor || resultados[key]?.capturadoPor || usuarioLogueado?.nombre || 'Usuario SGC',
      fechaCaptura: metaExtra.fechaCaptura || resultados[key]?.fechaCaptura || new Date().toISOString(),
      bloqueado: metaExtra.bloqueado !== undefined ? metaExtra.bloqueado : true,
      ...(metaExtra.modificadoPor ? {
        modificadoPor: metaExtra.modificadoPor,
        fechaModificacion: metaExtra.fechaModificacion,
        motivoModificacion: metaExtra.motivoModificacion
      } : {})
    };

    const nuevosResultados = {
      ...resultados,
      [key]: nuevoObj
    };

    setIndicadoresData?.(prev => ({
      ...prev,
      resultados: nuevosResultados,
      updatedAt: new Date().toISOString()
    }));
  };

  // Conteo de mediciones capturadas por mes en el año activo
  const capturasPorMes = useMemo(() => {
    const counts = {};
    MESES.forEach(m => { counts[m] = 0; });
    listaIndicadores.forEach(ind => {
      MESES.forEach(m => {
        const k = `${ind.id}-${m}-${ejercicio}`;
        if (resultados[k]?.valor !== undefined && resultados[k]?.valor !== null) {
          counts[m] += 1;
        }
      });
    });
    return counts;
  }, [listaIndicadores, resultados, ejercicio]);

  // Guardar creación o edición de ficha de indicador
  const handleGuardarIndicadorFicha = (indicadorPayload, esEdicion) => {
    const id = indicadorPayload.id;
    const nuevoCatalogo = {
      ...(indicadoresData.catalogoPersonalizado || {}),
      [id]: indicadorPayload
    };

    setIndicadoresData?.(prev => ({
      ...prev,
      catalogoPersonalizado: nuevoCatalogo,
      updatedAt: new Date().toISOString()
    }));

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: esEdicion ? 'MODIFICAR_FICHA_INDICADOR' : 'CREAR_NUEVO_INDICADOR',
      descripcion: `${esEdicion ? 'Actualización' : 'Alta'} de Ficha Oficial de Indicador #${indicadorPayload.numero} (${indicadorPayload.nombre})`,
      detalles: `Proceso: ${indicadorPayload.proceso} · Impacto: ${indicadorPayload.impacto} · Meta: ${indicadorPayload.meta_anual}`,
      folio: `IND#${indicadorPayload.numero}`
    });
  };

  // Abrir Modal para Capturar / Editar Valor
  const abrirModalCaptura = (ind, mesEspecifico = null) => {
    const mesTarget = mesEspecifico || mesActivo;
    setMesParaCaptura(mesTarget);
    const key = `${ind.id}-${mesTarget}-${ejercicio}`;
    const dataGuardada = resultados[key];
    const yaCapturado = dataGuardada?.valor !== undefined && dataGuardada?.valor !== null;

    // Si ya fue capturado y el usuario NO es admin -> Bloqueo para usuario normal
    if (yaCapturado && !esAdminOSGC) {
      setDatosBloqueo({
        indicador: ind,
        mes: mesTarget,
        valor: dataGuardada.valor,
        capturadoPor: dataGuardada.capturadoPor || 'Usuario Operativo',
        fechaCaptura: dataGuardada.fechaCaptura,
        observacion: dataGuardada.observacion
      });
      setModalBloqueadoNormal(true);
      return;
    }

    setIndicadorEnEdicion(ind);
    setEsModificacionAdmin(yaCapturado && esAdminOSGC);
    setValorOriginalAdmin(yaCapturado ? dataGuardada.valor : null);
    // Para indicadores sin captura, valorInput inicia vacío (NO 0!)
    setValorInput(yaCapturado ? String(dataGuardada.valor) : '');
    setObservacionInput(dataGuardada?.observacion || '');
    setAccionInput(dataGuardada?.accion || '');
    setConfirmacionCheckbox(false);
    setMostrarOpcionesAvanzadas(false);
  };

  // Semáforo dinámico en tiempo real para el modal de captura
  const semaforoModalEnVivo = useMemo(() => {
    if (!indicadorEnEdicion || valorInput === '' || isNaN(Number(valorInput))) return null;
    return evalSemaforoOOMRSC05(valorInput, indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta, indicadorEnEdicion.es_menor);
  }, [indicadorEnEdicion, valorInput]);

  // Ejecutor de guardado final 100% automatizado
  const ejecutarGuardadoFinal = (metaExtra = {}) => {
    if (!indicadorEnEdicion) return;

    const mesTarget = mesParaCaptura || mesActivo;
    const key = `${indicadorEnEdicion.id}-${mesTarget}-${ejercicio}`;
    const dataGuardada = resultados[key];
    const esModif = dataGuardada?.valor !== undefined && dataGuardada?.valor !== null;

    const sem = semaforoModalEnVivo || evalSemaforoOOMRSC05(
      valorInput, 
      indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta, 
      indicadorEnEdicion.es_menor
    );
    const esCritico = sem?.rango === 'CRITICO';
    const esAltoImpacto = indicadorEnEdicion.impacto === 'Alto';

    // 1. Observación Técnica Automatizada
    let observacionFinal = observacionInput.trim();
    if (!observacionFinal) {
      if (!esCritico) {
        observacionFinal = `Medición conforme a meta programada: ${valorInput} ${indicadorEnEdicion.unidad} (${sem?.porcentaje ?? 100}% de cumplimiento).`;
      } else if (esAltoImpacto) {
        observacionFinal = `Incumplimiento crítico (${sem?.porcentaje ?? 0}% vs meta ${indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} ${indicadorEnEdicion.unidad}). Requiere Acción Correctiva Oficial (OOMRSC-20).`;
      } else {
        observacionFinal = `Desviación operativa (${sem?.porcentaje ?? 0}% vs meta ${indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} ${indicadorEnEdicion.unidad}). Requiere Reporte de Corrección (RC).`;
      }
    }

    // 2. Acción Requerida Automatizada
    let accionFinal = accionInput.trim();
    let folioACGenerado = null;

    if (!esCritico) {
      accionFinal = 'NA';
    } else if (esAltoImpacto) {
      if (!accionFinal || accionFinal === 'NA') {
        // Detonación automática de Acción Correctiva formal en borrador si no tiene folio
        if (setAccionesCorrectivas) {
          const nuevaAC = acDesdeIndicador(indicadorEnEdicion, {
            cumplimiento: sem?.porcentaje ?? 0,
            anio: ejercicio,
            meses: [mesTarget]
          });
          folioACGenerado = nuevaAC.folio_codigo || `AC-IND#${indicadorEnEdicion.numero ?? indicadorEnEdicion.id}/${Date.now().toString().slice(-4)}`;
          nuevaAC.folio = folioACGenerado;
          setAccionesCorrectivas(prev => [nuevaAC, ...(prev || [])]);
          accionFinal = folioACGenerado;
        } else {
          accionFinal = 'AC REQUERIDA (OOMRSC-20)';
        }
      }
    } else {
      // Bajo Impacto
      if (!accionFinal || accionFinal === 'NA') {
        accionFinal = `RC REQUERIDO (${indicadorEnEdicion.numero ?? indicadorEnEdicion.id}/${ejercicio})`;
      }
    }

    guardarResultado(
      indicadorEnEdicion.id,
      mesTarget,
      ejercicio,
      valorInput,
      observacionFinal,
      accionFinal,
      {
        ...metaExtra,
        ...(folioACGenerado ? { folioAC: folioACGenerado } : {})
      }
    );

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: esModif ? 'MODIFICACION_RESULTADO_ADMIN' : 'CAPTURA_RESULTADO_RATIFICADO',
      descripcion: `${esModif ? 'Modificación autorizada por Administrador' : 'Captura oficial ratificada'} para Indicador #${indicadorEnEdicion.numero ?? indicadorEnEdicion.id} (${mesTarget} ${ejercicio}): ${valorInput} ${indicadorEnEdicion.unidad}`,
      detalles: esModif
        ? `Valor anterior: ${dataGuardada.valor} -> Nuevo valor: ${valorInput} · Justificación: ${metaExtra.motivoModificacion || 'Ajuste administrativo'}`
        : `Semáforo: ${sem?.porcentaje ?? 0}% (${sem?.rango || 'N/A'}) · Acción automatizada: ${accionFinal}`,
      folio: `IND#${indicadorEnEdicion.numero ?? indicadorEnEdicion.id}`
    });

    if (!esCritico) {
      toast.exito(`Resultado guardado correctamente (${sem?.porcentaje ?? 100}%). Clasificado Conforme (NA).`);
    } else if (esAltoImpacto) {
      toast.alerta(`Desviación crítica registrada (${sem?.porcentaje ?? 0}%). Acción Correctiva ${accionFinal} formalizada.`);
    } else {
      toast.alerta(`Desviación operativa registrada (${sem?.porcentaje ?? 0}%). Solicitud de Reporte de Corrección (RC) formalizada.`);
    }

    setIndicadorEnEdicion(null);
  };

  // Guardar en modal de captura (con derivación a confirmación según rol)
  const handleGuardarModal = (e) => {
    e?.preventDefault();
    if (!indicadorEnEdicion) return;

    if (valorInput === '' || isNaN(Number(valorInput))) {
      toast.error('Por favor ingresa un valor numérico válido.');
      return;
    }

    const mesTarget = mesParaCaptura || mesActivo;
    const key = `${indicadorEnEdicion.id}-${mesTarget}-${ejercicio}`;
    const dataGuardada = resultados[key];
    const yaCapturado = dataGuardada?.valor !== undefined && dataGuardada?.valor !== null;

    // Si es usuario normal, exigir SEGUNDA CONFIRMACIÓN DE RESPONSABILIDAD
    if (!esAdminOSGC) {
      setConfirmacionCheckbox(false);
      setModalSegundaConfirmacion(true);
      return;
    }

    // Si es Administrador modificando un valor previo diferente
    if (esAdminOSGC && yaCapturado && Number(valorInput) !== Number(dataGuardada.valor)) {
      setMotivoModificacionAdmin('');
      setModalJustificacionAdmin(true);
      return;
    }

    // Administrador capturando por primera vez o sin cambios
    ejecutarGuardadoFinal({
      bloqueado: true,
      capturadoPor: dataGuardada?.capturadoPor || usuarioLogueado?.nombre || 'Administrador SGC',
      fechaCaptura: dataGuardada?.fechaCaptura || new Date().toISOString()
    });
  };

  // Confirmar captura por usuario normal tras segunda confirmación
  const confirmarCapturaUsuarioNormal = () => {
    if (!confirmacionCheckbox) {
      toast.error('Debes marcar la casilla para confirmar bajo protesta de decir verdad.');
      return;
    }

    ejecutarGuardadoFinal({
      bloqueado: true,
      capturadoPor: usuarioLogueado?.nombre || 'Usuario Operativo',
      fechaCaptura: new Date().toISOString()
    });

    setModalSegundaConfirmacion(false);
    toast.exito(`Resultado ratificado exitosamente. El registro ha quedado bloqueado conforme a las políticas del SGC.`);
  };

  // Confirmar modificación por administrador con justificación
  const confirmarModificacionAdmin = () => {
    if (!motivoModificacionAdmin.trim()) {
      toast.error('Por favor escribe la justificación técnica de la modificación.');
      return;
    }

    ejecutarGuardadoFinal({
      bloqueado: true,
      modificadoPor: usuarioLogueado?.nombre || 'Administrador SGC',
      fechaModificacion: new Date().toISOString(),
      motivoModificacion: motivoModificacionAdmin.trim()
    });

    setModalJustificacionAdmin(false);
    toast.exito(`Modificación autorizada registrada exitosamente en la bitácora de auditoría.`);
  };

  // Crear Acción Correctiva desde Indicador Crítico (Alto Impacto)
  const handleCrearAccionCorrectiva = (ind, valReal, sem) => {
    if (!setAccionesCorrectivas) return;

    const valCalculado = valReal !== null && valReal !== undefined ? valReal : (valorInput || ind.valor_default || 0);
    const semCalculado = sem || evalSemaforoOOMRSC05(valCalculado, ind.meta_anual || ind.meta, ind.es_menor);
    const mesTarget = mesParaCaptura || mesActivo;

    const nuevaAC = acDesdeIndicador(ind, {
      cumplimiento: semCalculado?.porcentaje ?? 0,
      anio: ejercicio,
      meses: [mesTarget]
    });

    const folioAC = nuevaAC.folio_codigo || `AC-IND#${ind.numero || ind.id}/${Date.now().toString().slice(-4)}`;
    nuevaAC.folio = folioAC;

    setAccionesCorrectivas(prev => [nuevaAC, ...(prev || [])]);
    toast.exito(`Acción Correctiva Oficial (${folioAC}) generada para ${ind.nombre}.`);

    const observacionAuto = `Apertura formal de Acción Correctiva ${folioAC} por desviación crítica (${semCalculado?.porcentaje ?? 0}% de cumplimiento).`;

    // Actualizar campo acción del indicador
    guardarResultado(
      ind.id, 
      mesTarget, 
      ejercicio, 
      valCalculado, 
      observacionInput.trim() || observacionAuto, 
      folioAC,
      {
        bloqueado: true,
        capturadoPor: usuarioLogueado?.nombre || (esAdminOSGC ? 'Administrador SGC' : 'Usuario Operativo'),
        fechaCaptura: new Date().toISOString(),
        folioAC
      }
    );

    registrarMovimiento?.({
      modulo: 'ACCIONES_CORRECTIVAS',
      accion: 'EMISION_AC_INDICADOR',
      descripcion: `Emisión de Acción Correctiva ${folioAC} por desviación crítica en Indicador #${ind.numero ?? ind.id}`,
      detalles: `Cumplimiento: ${semCalculado?.porcentaje ?? 0}% vs Meta: ${ind.meta_anual || ind.meta} ${ind.unidad}`,
      folio: folioAC
    });

    if (indicadorEnEdicion) {
      setIndicadorEnEdicion(null);
    }
  };

  // Abrir modal de Reporte de Corrección (Bajo Impacto)
  const handleAbrirCrearRC = (ind, valReal, sem) => {
    const valCalculado = valReal !== null && valReal !== undefined ? valReal : (valorInput || ind.valor_default || 0);
    const semCalculado = sem || evalSemaforoOOMRSC05(valCalculado, ind.meta_anual || ind.meta, ind.es_menor);

    setDatosParaRC({
      indicador: ind,
      valorReal: valCalculado,
      semaforo: semCalculado
    });
    setModalRCOpen(true);
  };

  // Confirmar y registrar Reporte de Corrección (RC)
  const handleConfirmarRC = (reportePayload) => {
    setReportesCorreccion(prev => {
      const actualizados = [reportePayload, ...prev];
      try {
        localStorage.setItem('sgc-reportes-correccion', JSON.stringify(actualizados));
      } catch (e) { /* ignore */ }
      return actualizados;
    });

    const mesTarget = mesParaCaptura || mesActivo;

    // Actualizar campo acción del indicador en el cuadro de control
    guardarResultado(
      reportePayload.indicadorId,
      mesTarget,
      ejercicio,
      datosParaRC?.valorReal ?? 0,
      reportePayload.descripcion,
      reportePayload.folio,
      {
        bloqueado: true,
        capturadoPor: usuarioLogueado?.nombre || 'Usuario SGC',
        fechaCaptura: new Date().toISOString(),
        folioRC: reportePayload.folio
      }
    );

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'EMISION_REPORTE_CORRECCION',
      descripcion: `Emisión de Reporte de Corrección ${reportePayload.folio} para Indicador #${reportePayload.numeroIndicador}`,
      detalles: `Causa: ${reportePayload.causa} · Acción: ${reportePayload.accion}`,
      folio: reportePayload.folio
    });

    if (indicadorEnEdicion) {
      setIndicadorEnEdicion(null);
    }
  };

  // Filtrado de Indicadores para el Cuadro de Control
  const indicadoresFiltrados = useMemo(() => {
    return listaIndicadores.filter(ind => {
      if (!puedeTodasAreas && areaUsuario && ind.area !== areaUsuario) return false;
      if (filtroDireccion && ind.direccion !== filtroDireccion) return false;
      if (filtroProceso && ind.proceso !== filtroProceso) return false;
      if (filtroArea && ind.area !== filtroArea) return false;
      if (filtroImpacto && ind.impacto !== filtroImpacto) return false;

      // Filtro semáforo
      if (filtroSemaforo) {
        const key = `${ind.id}-${mesActivo}-${ejercicio}`;
        const val = resultados[key]?.valor !== undefined ? resultados[key].valor : null;
        const sem = evalSemaforoOOMRSC05(val, ind.meta_anual || ind.meta, ind.es_menor);
        if (filtroSemaforo === 'ACEPTABLE' && sem.rango !== 'ACEPTABLE') return false;
        if (filtroSemaforo === 'PREVENTIVO' && sem.rango !== 'PREVENTIVO') return false;
        if (filtroSemaforo === 'CRITICO' && sem.rango !== 'CRITICO') return false;
        if (filtroSemaforo === 'PENDIENTE' && sem.rango !== 'SIN_DATOS') return false;
      }

      if (busqueda) {
        const query = busqueda.toLowerCase();
        const texto = `${ind.numero} ${ind.id} ${ind.nombre} ${ind.area} ${ind.proceso} ${ind.direccion}`.toLowerCase();
        if (!texto.includes(query)) return false;
      }
      return true;
    });
  }, [listaIndicadores, busqueda, filtroDireccion, filtroProceso, filtroArea, filtroImpacto, filtroSemaforo, mesActivo, ejercicio, resultados, puedeTodasAreas, areaUsuario]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(indicadoresFiltrados.length / PAGE_SIZE));
  const indicadoresPaginados = useMemo(() => {
    const inicio = (pagina - 1) * PAGE_SIZE;
    return indicadoresFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [indicadoresFiltrados, pagina]);

  // Estadísticas del Mes Seleccionado (Semáforo Global)
  const statsGlobales = useMemo(() => {
    let aceptables = 0;
    let preventivos = 0;
    let criticos = 0;
    let pendientes = 0;
    let sumaPorcentaje = 0;
    let evaluadosCount = 0;

    listaIndicadores.forEach(ind => {
      const key = `${ind.id}-${mesActivo}-${ejercicio}`;
      const val = resultados[key]?.valor !== undefined ? resultados[key].valor : null;
      const sem = evalSemaforoOOMRSC05(val, ind.meta_anual || ind.meta, ind.es_menor);

      if (sem.rango === 'ACEPTABLE') {
        aceptables++;
        sumaPorcentaje += sem.porcentaje || 100;
        evaluadosCount++;
      } else if (sem.rango === 'PREVENTIVO') {
        preventivos++;
        sumaPorcentaje += sem.porcentaje || 85;
        evaluadosCount++;
      } else if (sem.rango === 'CRITICO') {
        criticos++;
        sumaPorcentaje += sem.porcentaje || 50;
        evaluadosCount++;
      } else {
        pendientes++;
      }
    });

    const promedioGlobal = evaluadosCount > 0 ? Math.round(sumaPorcentaje / evaluadosCount) : 92;

    return {
      total: listaIndicadores.length,
      aceptables,
      preventivos,
      criticos,
      pendientes,
      promedioGlobal
    };
  }, [listaIndicadores, mesActivo, ejercicio, resultados]);

  // Exportar Cuadro de Control a CSV
  const handleExportarCSV = () => {
    try {
      const headers = [
        'No. Proceso', 'Proceso', 'Dirección', 'Área', '# Indicador', 
        'Nombre del Indicador', 'Periodicidad', 'Unidad de Medida', 'Meta Anual',
        'Meta T1', 'Meta T2', 'Meta T3', 'Meta T4', 'Impacto',
        'Cumple (SI/NO)', `Valor Real (${mesActivo} ${ejercicio})`, '% Cumplimiento', 'Observación', 'Acción / RC'
      ];

      const rows = listaIndicadores.map(ind => {
        const key = `${ind.id}-${mesActivo}-${ejercicio}`;
        const dataGuardada = resultados[key];
        const val = dataGuardada?.valor !== undefined ? dataGuardada.valor : '';
        const obs = dataGuardada?.observacion || ind.observacion_default || '';
        const acc = dataGuardada?.accion || ind.accion_default || 'NA';
        const sem = evalSemaforoOOMRSC05(val, ind.meta_anual || ind.meta, ind.es_menor);

        return [
          ind.id,
          `"${ind.proceso || ''}"`,
          `"${ind.direccion || ''}"`,
          `"${ind.area || ''}"`,
          ind.numero ?? ind.id,
          `"${(ind.nombre || '').replace(/"/g, '""')}"`,
          ind.periodicidad || 'Trimestral',
          ind.unidad || 'Porcentaje',
          ind.meta_anual || ind.meta || 85,
          ind.metas_trimestrales?.T1 ?? '',
          ind.metas_trimestrales?.T2 ?? '',
          ind.metas_trimestrales?.T3 ?? '',
          ind.metas_trimestrales?.T4 ?? '',
          ind.impacto || 'Bajo',
          sem.cumple,
          val,
          sem.porcentaje !== null ? `${sem.porcentaje}%` : '',
          `"${obs.replace(/"/g, '""')}"`,
          `"${acc}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `OOMRSC-05_Cuadro_Control_${mesActivo}_${ejercicio}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.exito(`Cuadro de Control OOMRSC-05 exportado exitosamente.`);
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar el archivo CSV.');
    }
  };

  // Opciones de filtros según catálogo oficial institucional OOMAPASC
  const direccionesUnicas = useMemo(() => {
    return [...DIRECCIONES];
  }, []);

  const procesosUnicos = useMemo(() => {
    const list = [...new Set([...procesos, ...listaIndicadores.map(i => i.proceso).filter(Boolean)])];
    return list.sort();
  }, [listaIndicadores, procesos]);

  const areasUnicas = useMemo(() => {
    return [...AREAS].sort((a, b) => a.localeCompare('es'));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL OOMRSC-05 */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F294D] to-[#1E3E62] text-white p-6 rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                {FORMATO_CUADRO_CONTROL.clave} {FORMATO_CUADRO_CONTROL.revision}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Target size={14} />
                {listaIndicadores.length} Indicadores Oficiales
              </span>
              <span className="text-slate-300 text-xs">
                Última Rev.: <strong className="text-white font-mono">{FORMATO_CUADRO_CONTROL.ultimaRevision}</strong>
              </span>
              {esAdminOSGC && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck size={12} /> Rol SGC / Admin
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Cuadro de Control de Desempeño
            </h1>
            <p className="text-xs text-sky-100/80 leading-relaxed">
              Monitoreo y evaluación mensual, trimestral y por enfoque de procesos de metas institucionales de OOMAPASC conforme al SGC ISO 9001:2015.
            </p>
          </div>

          {/* Selector de Mes/Año, Exportar & Nuevo Indicador */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Selector de Mes & Ejercicio */}
            <div className="flex items-center bg-slate-800/90 border border-slate-600/80 rounded-xl p-1 shadow-sm">
              <select
                value={mesActivoIndex}
                onChange={(e) => {
                  setMesActivoIndex(Number(e.target.value));
                  setPagina(1);
                }}
                className="bg-transparent text-white text-xs font-bold px-3 py-1.5 focus:outline-none cursor-pointer"
                title="Seleccionar mes evaluado"
              >
                {MESES_COMPLETOS.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={ejercicio}
                onChange={(e) => {
                  setEjercicio(Number(e.target.value));
                  setPagina(1);
                }}
                className="bg-transparent text-white text-xs font-bold px-2 py-1.5 border-l border-slate-700 focus:outline-none cursor-pointer"
                title="Seleccionar ejercicio fiscal"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Exportar Excel */}
            <button
              onClick={handleExportarCSV}
              className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title="Descargar Cuadro de Control OOMRSC-05 en archivo CSV compatible con Excel"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar OOMRSC-05</span>
            </button>

            {/* Recordatorios por Correo a Áreas con Atraso */}
            <button
              onClick={() => setModalRecordatoriosOpen(true)}
              className="hidden sm:flex px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Centro de notificaciones y recordatorios por correo electrónico a titulares de área con retrasos"
            >
              <Mail size={15} />
              <span>Recordatorios por Correo</span>
            </button>

            {/* Único Botón Oficial: Nuevo Indicador (Unificado PMD + SGC) */}
            {esAdminOSGC && (
              <button
                onClick={() => {
                  setIndicadorParaGestionar(null);
                  setFichaParaModal(null);
                  setPestanaModalInicial('pmd');
                  setModalGestionIndicadorOpen(true);
                }}
                className="hidden md:flex px-3.5 py-2 text-xs font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-md transition-all items-center justify-center gap-2 cursor-pointer active:scale-95"
                title="Dar de alta un nuevo indicador oficial en el catálogo y configurar su Ficha PMD"
              >
                <PlusCircle size={15} />
                <span>+ Nuevo Indicador</span>
              </button>
            )}
          </div>
        </div>

        {/* PESTAÑAS RESPONSIVAS (SIN BARRA DESPLAZADORA HORIZONTAL) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 w-full mt-6 pt-4 border-t border-slate-700/60">
          {[
            { id: 'cuadro', num: '1', label: 'Cuadro Mensual', sub: 'OOMRSC-05', icon: Target },
            { id: 'procesos', num: '2', label: 'Por Procesos', sub: 'Eficacia global', icon: Layers },
            { id: 'fichas', num: '3', label: 'Fichas PMD', sub: 'Ayuntamiento', icon: FileSpreadsheet },
            { id: 'proyectos', num: '4', label: 'Presupuesto CONAC', sub: 'Capítulos por Área', icon: Building2 },
            { id: 'trimestral', num: '5', label: 'Evaluación Trimestral', sub: 'T1 a T4 / MIR', icon: BarChart3 },
            { id: 'correcciones', num: '6', label: 'Reportes RC', sub: `${reportesCorreccion.length} casos`, icon: FileWarning }
          ].map(tab => {
            const Icon = tab.icon;
            const esActiva = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer border ${
                  esActiva
                    ? 'bg-white text-slate-900 shadow-md border-white'
                    : 'bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${esActiva ? 'bg-sky-50 text-sky-600' : 'bg-slate-700/50 text-slate-400'}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-tight truncate">
                    <span className="opacity-60 mr-1">{tab.num}.</span>
                    {tab.label}
                  </div>
                  <div className={`text-[10px] truncate ${esActiva ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                    {tab.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* STATS CARDS DEL MES (SEMÁFOROS OFICIALES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono">
            Eficacia Global
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {statsGlobales.promedioGlobal}%
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
            <Check size={12} /> {mesActivoNombre} {ejercicio}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Aceptable (≥90%)
          </span>
          <span className="text-2xl font-black text-emerald-900 block">
            {statsGlobales.aceptables}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            Cumplen objetivo
          </span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Preventivo (80-89%)
          </span>
          <span className="text-2xl font-black text-amber-900 block">
            {statsGlobales.preventivos}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold block">
            En rango preventivo
          </span>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-800 block uppercase font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Crítico (≤79%)
          </span>
          <span className="text-2xl font-black text-rose-900 block">
            {statsGlobales.criticos}
          </span>
          <span className="text-[10px] text-rose-700 font-semibold block">
            Requieren RC / AC
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            Sin Captura
          </span>
          <span className="text-2xl font-black text-slate-700 block">
            {statsGlobales.pendientes}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Pendientes de corte
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CUADRO DE CONTROL MENSUAL & MATRIZ ANUAL INTERACTIVA          */}
      {/* ==================================================================== */}
      {tabActiva === 'cuadro' && (
        <div className="space-y-4">
          {/* BARRA DE NAVEGACIÓN MENSUAL & TOGGLE MATRIZ ANUAL */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* 12 Meses Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase mr-1 shrink-0 flex items-center gap-1">
                <Calendar size={13} className="text-sky-600" /> Mes:
              </span>
              {MESES.map((m, idx) => {
                const esActivo = mesActivoIndex === idx && vistaModo === 'mensual';
                const capturados = capturasPorMes[m] || 0;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setMesActivoIndex(idx);
                      setVistaModo('mensual');
                      setPagina(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                      esActivo
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 border-slate-200'
                    }`}
                    title={`Ver resultados de ${MESES_COMPLETOS[idx]} ${ejercicio} (${capturados} indicadores capturados)`}
                  >
                    <span>{m}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      capturados > 0 
                        ? (esActivo ? 'bg-emerald-300' : 'bg-emerald-500') 
                        : (esActivo ? 'bg-sky-300/40' : 'bg-slate-300')
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Toggle de Modo de Vista (Mensual vs Matriz Anual) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-end lg:self-auto border border-slate-200">
              <button
                onClick={() => {
                  setVistaModo('mensual');
                  setPagina(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  vistaModo === 'mensual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar size={14} className={vistaModo === 'mensual' ? 'text-sky-600' : 'text-slate-400'} />
                <span>Vista Mensual ({mesActivo})</span>
              </button>

              <button
                onClick={() => {
                  setVistaModo('anual');
                  setPagina(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  vistaModo === 'anual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualizar la matriz con los 12 meses del ejercicio para todos los indicadores"
              >
                <Table size={14} className={vistaModo === 'anual' ? 'text-sky-600' : 'text-slate-400'} />
                <span>Matriz Anual (12 Meses)</span>
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por #, nombre de indicador, proceso, área o dirección..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              {/* Botón Reset */}
              {(busqueda || filtroDireccion || filtroProceso || filtroArea || filtroImpacto || filtroSemaforo) && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroDireccion('');
                    setFiltroProceso('');
                    setFiltroArea('');
                    setFiltroImpacto('');
                    setFiltroSemaforo('');
                    setPagina(1);
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Limpiar Filtros
                </button>
              )}
            </div>

            {/* Selectores de Filtro Avanzados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100 text-xs">
              <select
                value={filtroDireccion}
                onChange={(e) => { setFiltroDireccion(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todas las Direcciones</option>
                {direccionesUnicas.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={filtroProceso}
                onChange={(e) => { setFiltroProceso(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todos los Procesos</option>
                {procesosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select
                value={filtroArea}
                onChange={(e) => { setFiltroArea(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todas las Áreas</option>
                {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select
                value={filtroImpacto}
                onChange={(e) => { setFiltroImpacto(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todos los Impactos</option>
                <option value="Alto">Impacto Alto (Detona AC)</option>
                <option value="Bajo">Impacto Bajo (Detona RC)</option>
              </select>

              <select
                value={filtroSemaforo}
                onChange={(e) => { setFiltroSemaforo(e.target.value); setPagina(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todos los Semáforos</option>
                <option value="ACEPTABLE">🟢 Aceptables (≥90%)</option>
                <option value="PREVENTIVO">🟡 Preventivos (80-89%)</option>
                <option value="CRITICO">🔴 Críticos (≤79%)</option>
                <option value="PENDIENTE">⏳ Sin captura</option>
              </select>
            </div>
          </div>

          {/* TABLA PRINCIPAL DEL CUADRO DE CONTROL (MENSUAL O MATRIZ ANUAL) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-600">
                Mostrando <strong>{indicadoresPaginados.length}</strong> de <strong>{indicadoresFiltrados.length}</strong> indicadores
              </span>
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                {vistaModo === 'mensual' ? (
                  <span>Período Evaluado: <strong>{mesActivoNombre} {ejercicio}</strong></span>
                ) : (
                  <span>Matriz Anual Concentrada: <strong>Ejercicio {ejercicio} (12 Meses)</strong></span>
                )}
              </span>
            </div>

            {vistaModo === 'mensual' ? (
              /* ============================================================= */
              /* VISTA 1: CUADRO DE CONTROL MENSUAL DETALLADO                  */
              /* ============================================================= */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase font-mono">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-3 min-w-[240px]">Indicador / Área / Proceso</th>
                      <th className="py-3 px-2 text-center w-24">Per. / Unidad</th>
                      <th className="py-3 px-2 text-center w-24">Meta Anual</th>
                      <th className="py-3 px-2 text-center w-20">Impacto</th>
                      <th className="py-3 px-3 text-center w-36 bg-sky-50/50">
                        Real ({mesActivo})
                      </th>
                      <th className="py-3 px-2 text-center w-28">Cumplimiento</th>
                      <th className="py-3 px-3 min-w-[180px]">Observación Técnica</th>
                      <th className="py-3 px-3 w-36 text-center">Acción / RC</th>
                      <th className="py-3 px-2 text-center w-16" title="Configuración Integral & Ficha PMD">Config.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {indicadoresPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          No se encontraron indicadores con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      indicadoresPaginados.map(ind => {
                        const key = `${ind.id}-${mesActivo}-${ejercicio}`;
                        const dataGuardada = resultados[key];
                        const valReal = dataGuardada?.valor !== undefined ? dataGuardada.valor : null;
                        const obs = dataGuardada?.observacion || ind.observacion_default || '';
                        const acc = dataGuardada?.accion || ind.accion_default || 'NA';
                        const sem = evalSemaforoOOMRSC05(valReal, ind.meta_anual || ind.meta, ind.es_menor);
                        const esFalla = sem.rango === 'CRITICO';
                        const esAltoImpacto = ind.impacto === 'Alto';

                        return (
                          <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors group">
                            {/* # */}
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                              #{ind.numero !== undefined ? ind.numero : ind.id}
                            </td>

                            {/* Indicador / Proceso / Área */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 leading-tight">
                                {ind.nombre}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                                <span className="text-sky-700 font-medium">{ind.direccion}</span>
                                <span>·</span>
                                <span>{ind.area}</span>
                                <span>·</span>
                                <span className="italic text-slate-400">{ind.proceso}</span>
                              </div>
                            </td>

                            {/* Periodicidad / Unidad */}
                            <td className="py-3 px-2 text-center text-slate-600 text-[11px]">
                              <span className="font-semibold block">{ind.periodicidad}</span>
                              <span className="text-slate-400 text-[10px] block">{ind.unidad}</span>
                            </td>

                            {/* Meta Anual */}
                            <td className="py-3 px-2 text-center font-bold text-slate-900">
                              {ind.meta_anual || ind.meta}
                              <span className="text-[10px] text-slate-400 font-normal block">
                                {ind.unidad === 'Porcentaje' ? '%' : ''}
                              </span>
                            </td>

                            {/* Impacto */}
                            <td className="py-3 px-2 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                esAltoImpacto
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {ind.impacto}
                              </span>
                            </td>

                            {/* Valor Real Capturado */}
                            <td className="py-3 px-3 text-center bg-sky-50/30">
                              <button
                                onClick={() => {
                                  if (isMobile) {
                                    handleAbrirFichaAyuntamiento(ind);
                                  } else {
                                    abrirModalCaptura(ind, mesActivo);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 hover:border-sky-500 rounded-lg text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs group-hover:border-sky-400 transition-all cursor-pointer"
                                title={
                                  isMobile
                                    ? 'Clic para consultar ficha técnica oficial'
                                    : valReal !== null
                                    ? (esAdminOSGC
                                        ? 'Resultado registrado. Clic para modificar (Modo Administrador)'
                                        : 'Resultado ratificado y bloqueado. Clic para consultar detalles.')
                                    : 'Clic para capturar resultado'
                                }
                              >
                                <span>
                                  {valReal !== null && valReal !== undefined ? (
                                    <span className="font-mono text-slate-900 font-bold">{valReal}</span>
                                  ) : isMobile ? (
                                    <span className="text-slate-400 font-mono text-[11px]">-</span>
                                  ) : (
                                    <span className="text-sky-600 font-semibold flex items-center gap-1">
                                      <Plus size={11} /> Capturar
                                    </span>
                                  )}
                                </span>
                                {isMobile ? (
                                  <Eye size={12} className="text-slate-400 shrink-0" title="Consultar ficha" />
                                ) : valReal !== null ? (
                                  !esAdminOSGC ? (
                                    <Lock size={12} className="text-amber-600 shrink-0" title="Bloqueado por Gobernanza" />
                                  ) : (
                                    <Edit3 size={13} className="text-slate-400 group-hover:text-sky-600 shrink-0" />
                                  )
                                ) : (
                                  <Edit3 size={13} className="text-slate-400 group-hover:text-sky-600 shrink-0" />
                                )}
                              </button>
                            </td>

                            {/* Cumplimiento Semáforo OOMRSC-05 */}
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sem.bg} ${sem.text} ${sem.border}`}>
                                <span className={`w-2 h-2 rounded-full ${sem.dot}`}></span>
                                <span>{sem.porcentaje !== null ? `${sem.porcentaje}%` : 'N/A'}</span>
                              </span>
                            </td>

                            {/* Observación Técnica */}
                            <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={obs}>
                              {obs ? obs : <span className="text-slate-400 italic">Sin observación</span>}
                            </td>

                            {/* Acción / RC (Regla de Alto / Bajo Impacto) */}
                            <td className="py-3 px-3 text-center">
                              {esFalla && acc === 'NA' ? (
                                isMobile ? (
                                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                    esAltoImpacto ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}>
                                    {esAltoImpacto ? 'AC Req.' : 'RC Req.'}
                                  </span>
                                ) : esAltoImpacto ? (
                                  <button
                                    onClick={() => handleCrearAccionCorrectiva(ind, valReal, sem)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 justify-center w-full transition-all cursor-pointer"
                                    title="Indicador de Alto Impacto fuera de meta: Requiere Acción Correctiva OOMRSC-20"
                                  >
                                    <AlertTriangle size={11} />
                                    <span>+ Crear AC</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAbrirCrearRC(ind, valReal, sem)}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 justify-center w-full transition-all cursor-pointer"
                                    title="Indicador de Bajo Impacto fuera de meta: Requiere Reporte de Corrección (RC)"
                                  >
                                    <AlertOctagon size={11} />
                                    <span>+ Crear RC</span>
                                  </button>
                                )
                              ) : (
                                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                  acc !== 'NA' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-400'
                                }`}>
                                  {acc}
                                </span>
                              )}
                            </td>

                            {/* Configuración Integral & Ficha PMD (Solo el engrane) */}
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  const numId = ind.numero !== undefined ? ind.numero : ind.id;
                                  const customData = fichasPersonalizadas[numId] || null;
                                  const fichaCompleta = obtenerFichaTecnicaIndicador(ind, customData);
                                  setFichaParaModal(fichaCompleta);
                                  setIndicadorParaGestionar(ind);
                                  setModalGestionIndicadorOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-all cursor-pointer mx-auto flex items-center justify-center shadow-2xs"
                                title="Configuración Integral: Proceso, Metas Trimestrales, Ficha PMD y Descargas"
                              >
                                <Settings size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ============================================================= */
              /* VISTA 2: MATRIZ ANUAL CONCENTRADA (12 MESES: ENE A DIC)       */
              /* ============================================================= */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase font-mono">
                      <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-100 z-10">#</th>
                      <th className="py-3 px-3 min-w-[220px] sticky left-10 bg-slate-100 z-10 border-r border-slate-200">
                        Indicador Oficial
                      </th>
                      <th className="py-3 px-2 text-center w-20">Meta</th>
                      {MESES.map(m => (
                        <th 
                          key={m} 
                          className={`py-3 px-1 text-center w-14 ${m === mesActivo ? 'bg-sky-100 text-sky-950 font-extrabold border-x border-sky-300' : ''}`}
                        >
                          {m}
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center w-20 bg-slate-50 font-bold">Prom.</th>
                      <th className="py-3 px-2 text-center w-24">Cumpl.</th>
                      <th className="py-3 px-2 text-center w-12">Cfg.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {indicadoresPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="py-12 text-center text-slate-400">
                          No se encontraron indicadores con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      indicadoresPaginados.map(ind => {
                        const metaVal = ind.meta_anual || ind.meta;
                        let sumaVal = 0;
                        let mesesConDato = 0;

                        return (
                          <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors group">
                            {/* # */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50">
                              #{ind.numero !== undefined ? ind.numero : ind.id}
                            </td>

                            {/* Indicador / Proceso */}
                            <td className="py-2.5 px-3 sticky left-10 bg-white group-hover:bg-slate-50 border-r border-slate-200">
                              <div className="font-bold text-slate-900 leading-tight truncate max-w-[230px]" title={ind.nombre}>
                                {ind.nombre}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[230px] mt-0.5">
                                {ind.area} · <span className="italic">{ind.proceso}</span>
                              </div>
                            </td>

                            {/* Meta */}
                            <td className="py-2.5 px-2 text-center font-bold text-slate-700 text-[11px]">
                              {metaVal}
                              <span className="text-[9px] text-slate-400 block">{ind.unidad === 'Porcentaje' ? '%' : ind.unidad}</span>
                            </td>

                            {/* 12 Columnas de Meses (Clickeables para capturar/consultar) */}
                            {MESES.map(m => {
                              const keyM = `${ind.id}-${m}-${ejercicio}`;
                              const dataM = resultados[keyM];
                              const valM = dataM?.valor !== undefined && dataM?.valor !== null ? dataM.valor : null;
                              const esColMesActivo = m === mesActivo;

                              if (valM !== null) {
                                sumaVal += valM;
                                mesesConDato++;
                              }

                              const semM = valM !== null ? evalSemaforoOOMRSC05(valM, metaVal, ind.es_menor) : null;

                              return (
                                <td 
                                  key={m} 
                                  className={`py-2 px-1 text-center ${esColMesActivo ? 'bg-sky-50/40 border-x border-sky-200/50' : ''}`}
                                >
                                  <button
                                    onClick={() => abrirModalCaptura(ind, m)}
                                    className={`w-full py-1.5 px-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                      valM !== null
                                        ? `${semM.bg} ${semM.text} ${semM.border} hover:scale-105 shadow-2xs`
                                        : 'bg-slate-50/70 hover:bg-sky-50 text-slate-300 hover:text-sky-600 border-dashed border-slate-200 hover:border-sky-300'
                                    }`}
                                    title={
                                      valM !== null
                                        ? `${m} ${ejercicio}: ${valM} (${semM.porcentaje}% - ${semM.rango})\nClic para ${esAdminOSGC ? 'modificar' : 'ver detalles'}`
                                        : `${m} ${ejercicio}: Sin captura. Clic para registrar resultado.`
                                    }
                                  >
                                    {valM !== null ? (
                                      <span>{valM}</span>
                                    ) : (
                                      <span className="text-[10px] font-sans font-normal opacity-60 hover:opacity-100">+</span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}

                            {/* Promedio Anual */}
                            {(() => {
                              const prom = mesesConDato > 0 ? (sumaVal / mesesConDato).toFixed(1) : null;
                              const semProm = prom !== null ? evalSemaforoOOMRSC05(prom, metaVal, ind.es_menor) : null;
                              return (
                                <>
                                  <td className="py-2.5 px-2 text-center bg-slate-50 font-mono font-bold text-slate-900 text-[11px]">
                                    {prom !== null ? prom : <span className="text-slate-400 font-normal">-</span>}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    {semProm ? (
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${semProm.bg} ${semProm.text} ${semProm.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${semProm.dot}`} />
                                        <span>{semProm.porcentaje}%</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-mono">-</span>
                                    )}
                                  </td>
                                </>
                              );
                            })()}

                            {/* Configuración */}
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => {
                                  const numId = ind.numero !== undefined ? ind.numero : ind.id;
                                  const customData = fichasPersonalizadas[numId] || null;
                                  const fichaCompleta = obtenerFichaTecnicaIndicador(ind, customData);
                                  setFichaParaModal(fichaCompleta);
                                  setIndicadorParaGestionar(ind);
                                  setModalGestionIndicadorOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-all cursor-pointer mx-auto flex items-center justify-center shadow-2xs"
                                title="Configuración Integral: Proceso, Metas Trimestrales, Ficha PMD y Descargas"
                              >
                                <Settings size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  Página {pagina} de {totalPaginas}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagina === 1}
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: DESEMPEÑO POR ENFOQUE DE PROCESOS (MES / TRIMESTRE / ANUAL)  */}
      {/* ==================================================================== */}
      {tabActiva === 'procesos' && (
        <DesempenoProcesosTab
          indicadores={listaIndicadores}
          resultados={resultados}
          ejercicio={ejercicio}
          setEjercicio={setEjercicio}
          mesActivoIndex={mesActivoIndex}
          setMesActivoIndex={setMesActivoIndex}
          onAbrirCaptura={abrirModalCaptura}
          onCrearAccionCorrectiva={handleCrearAccionCorrectiva}
          onCrearReporteCorreccion={handleAbrirCrearRC}
          esAdminOSGC={esAdminOSGC}
          onEditarIndicador={(ind) => {
            const numId = ind.numero !== undefined ? ind.numero : ind.id;
            const customData = fichasPersonalizadas[numId] || null;
            const fichaCompleta = obtenerFichaTecnicaIndicador(ind, customData);
            setFichaParaModal(fichaCompleta);
            setIndicadorParaGestionar(ind);
            setPestanaModalInicial('sgc');
            setModalGestionIndicadorOpen(true);
          }}
          onAbrirFichaAyuntamiento={handleAbrirFichaAyuntamiento}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CATÁLOGO OFICIAL DE FICHAS TÉCNICAS PMD (AYUNTAMIENTO)       */}
      {/* ==================================================================== */}
      {tabActiva === 'fichas' && (
        <FichasGubernamentalesTab
          indicadores={listaIndicadores}
          resultados={resultados}
          ejercicio={ejercicio}
          fichasPersonalizadas={fichasPersonalizadas}
          onAbrirFicha={(ficha) => {
            const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
            const indBase = listaIndicadores.find(i => (i.numero !== undefined ? i.numero : i.id) === indNum);
            setFichaParaModal(ficha);
            setIndicadorParaGestionar(indBase || null);
            setPestanaModalInicial('pmd');
            setModalGestionIndicadorOpen(true);
          }}
          esAdminOSGC={esAdminOSGC}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONTROL PRESUPUESTAL Y PROYECTOS (ARMONIZACIÓN CONAC)         */}
      {/* ==================================================================== */}
      {tabActiva === 'proyectos' && (
        <div className="space-y-4">
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 inline-flex gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setSubTabPresupuesto('areas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTabPresupuesto === 'areas'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 size={14} /> Control por Áreas y Capítulos (1000 - 6000)
            </button>
            <button
              type="button"
              onClick={() => setSubTabPresupuesto('fichas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTabPresupuesto === 'fichas'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet size={14} /> Fichas Presupuestarias y Proyectos (PP-2026)
            </button>
          </div>

          {subTabPresupuesto === 'areas' ? (
            <ControlPresupuestalAreasTab
              ejercicio={ejercicio}
              esAdminOSGC={esAdminOSGC}
            />
          ) : (
            <ProyectosPresupuestoTab
              ejercicio={ejercicio}
              esAdminOSGC={esAdminOSGC}
            />
          )}
        </div>
      )}


      {/* ==================================================================== */}
      {/* TAB 5: EVALUACIÓN TRIMESTRAL & MIR (T1 A T4)                         */}
      {/* ==================================================================== */}
      {tabActiva === 'trimestral' && (
        <EvaluacionTrimestralTab
          listaIndicadores={listaIndicadores}
          resultados={resultados}
          ejercicio={ejercicio}
          onAbrirGenerarRC={(ind, val, sem) => handleAbrirGenerarRC(ind, val, sem)}
        />
      )}

      {/* ==================================================================== */}
      {/* TAB 6: BITÁCORA DE REPORTES DE CORRECCIÓN (RC)                     */}
      {/* ==================================================================== */}
      {tabActiva === 'correcciones' && (
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
                            {rc.ejercicio || ejercicio} {rc.mes ? `· ${rc.mes}` : ''}
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
      )}

      {/* ==================================================================== */}
      {/* MODAL DE CAPTURA RÁPIDA CON ALERTA AUTOMÁTICA DE AC / RC            */}
      {/* ==================================================================== */}
      {indicadorEnEdicion && (
        <ContenedorModal
          abierto={!!indicadorEnEdicion}
          onCerrar={() => setIndicadorEnEdicion(null)}
          tamano="2xl"
          anchoMaximo="max-w-[85vw] xl:max-w-[1150px]"
          titulo={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                <Target size={20} />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  INDICADOR #{indicadorEnEdicion.numero ?? indicadorEnEdicion.id} · {MESES_COMPLETOS[MESES.indexOf(mesParaCaptura || mesActivo)] || (mesParaCaptura || mesActivo)} {ejercicio}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  {indicadorEnEdicion.nombre}
                </h3>
              </div>
            </div>
          }
          pie={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400 font-mono">
                OOMRSC-05 Rev. 37
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndicadorEnEdicion(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarModal}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                    esModificacionAdmin
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : semaforoModalEnVivo?.rango === 'CRITICO' && indicadorEnEdicion.impacto === 'Alto'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : semaforoModalEnVivo?.rango === 'CRITICO'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : esAdminOSGC
                      ? 'bg-sky-600 hover:bg-sky-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Save size={14} />
                  <span>
                    {esModificacionAdmin 
                      ? 'Modificar Medición (Admin)' 
                      : semaforoModalEnVivo?.rango === 'CRITICO' && indicadorEnEdicion.impacto === 'Alto'
                      ? 'Guardar y Solicitar Acción Correctiva'
                      : semaforoModalEnVivo?.rango === 'CRITICO'
                      ? 'Guardar y Solicitar Reporte RC'
                      : esAdminOSGC 
                      ? 'Guardar Resultado Conforme' 
                      : 'Continuar a Ratificación'}
                  </span>
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleGuardarModal} className="space-y-4 p-1">
            {/* Metadatos del Indicador */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Dirección / Área:</span>
                <strong className="text-slate-800 text-[11.5px] block truncate">{indicadorEnEdicion.direccion} · {indicadorEnEdicion.area}</strong>
                <span className="text-slate-500 text-[10px] block mt-0.5">Proceso: {indicadorEnEdicion.proceso}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Meta Oficial / Criterio:</span>
                <strong className="text-sky-700 text-sm font-mono block">
                  {indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}
                </strong>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    indicadorEnEdicion.impacto === 'Alto'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    Impacto: {indicadorEnEdicion.impacto || 'Operativo'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {indicadorEnEdicion.es_menor ? '≤ Meta' : '≥ Meta'}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso especial para administradores si ya estaba capturado */}
            {esModificacionAdmin && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-purple-600 shrink-0" />
                <span>Modo Administrador: Modificando medición registrada previamente ({valorOriginalAdmin} {indicadorEnEdicion.unidad}). Se solicitará justificación técnica para la bitácora institucional.</span>
              </div>
            )}

            {/* VALOR REAL OBTENIDO - ÚNICO CAMPO OBLIGATORIO */}
            <div className="space-y-2 bg-gradient-to-br from-slate-50 to-sky-50/40 p-4 rounded-2xl border border-sky-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                  Valor Real Obtenido ({indicadorEnEdicion.unidad || 'Unidades'}): <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-sky-700 font-mono">
                  {MESES_COMPLETOS[MESES.indexOf(mesParaCaptura || mesActivo)] || (mesParaCaptura || mesActivo)} {ejercicio}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={valorInput}
                  onChange={(e) => setValorInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-3 text-2xl font-black bg-white border-2 border-slate-300 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 text-slate-900 font-mono text-center tracking-wider transition-all placeholder:text-slate-300 shadow-inner"
                  placeholder="0.00"
                  required
                  autoFocus
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 font-mono">
                    {indicadorEnEdicion.unidad}
                  </span>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-500 text-center">
                El sistema evalúa de forma automática el cumplimiento del criterio y las acciones requeridas.
              </p>
            </div>

            {/* REPORTE AUTOMATIZADO DEL SISTEMA EN TIEMPO REAL */}
            {valorInput === '' ? (
              <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-xs">
                Captura el valor para que el sistema analice el cumplimiento contra la meta ({indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}) y determine automáticamente la acción requerida.
              </div>
            ) : semaforoModalEnVivo && semaforoModalEnVivo.rango !== 'CRITICO' ? (
              // CUMPLE: ACEPTABLE (🟢) O PREVENTIVO (🟡)
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 space-y-2 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wide text-emerald-900">
                      Resultado Satisfactorio · Cumple Meta
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-black bg-emerald-600 text-white shadow-xs">
                    {semaforoModalEnVivo.porcentaje}% Eficacia
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-emerald-900/90">
                  El valor registrado de <strong>{valorInput} {indicadorEnEdicion.unidad}</strong> satisface el criterio programado del SGC ({indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}).
                </p>
                <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-emerald-200/80 text-emerald-800 font-medium">
                  <span>Acción Automatizada:</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    NA (No requiere Acción Correctiva ni RC)
                  </span>
                </div>
              </div>
            ) : semaforoModalEnVivo && semaforoModalEnVivo.rango === 'CRITICO' ? (
              // NO CUMPLE: CRÍTICO (🔴)
              <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-fade-in shadow-xs ${
                indicadorEnEdicion.impacto === 'Alto'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    {indicadorEnEdicion.impacto === 'Alto' ? (
                      <>
                        <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wide text-rose-900">
                          Desviación Crítica · Alto Impacto
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon size={18} className="text-amber-600 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wide text-amber-900">
                          Desviación Operativa · Bajo Impacto
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-black text-white shadow-xs ${
                    indicadorEnEdicion.impacto === 'Alto' ? 'bg-rose-600' : 'bg-amber-600'
                  }`}>
                    {semaforoModalEnVivo.porcentaje}% Cumplimiento
                  </span>
                </div>

                <p className="text-[11.5px] leading-relaxed">
                  {indicadorEnEdicion.impacto === 'Alto' ? (
                    <span>
                      El valor obtenido (<strong>{valorInput} {indicadorEnEdicion.unidad}</strong>) no alcanza la meta ({indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}). Conforme a la <strong>Norma ISO 9001:2015 (§ 10.2)</strong> y el procedimiento <strong>OOMRSC-20</strong>, este indicador de <strong>ALTO IMPACTO</strong> exige la apertura obligatoria de una <strong>Acción Correctiva</strong>.
                    </span>
                  ) : (
                    <span>
                      El valor obtenido (<strong>{valorInput} {indicadorEnEdicion.unidad}</strong>) no alcanza la meta ({indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}). Para este indicador operativo de <strong>BAJO IMPACTO</strong>, el SGC solicita emitir un <strong>Reporte de Corrección (RC)</strong> para subsanar la causa inmediata sin abrir una AC mayor.
                    </span>
                  )}
                </p>

                <div className="pt-1">
                  {indicadorEnEdicion.impacto === 'Alto' ? (
                    <button
                      type="button"
                      onClick={() => handleCrearAccionCorrectiva(indicadorEnEdicion, valorInput, semaforoModalEnVivo)}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-98"
                    >
                      <AlertTriangle size={15} />
                      <span>⚡ Detonar Acción Correctiva Oficial (OOMRSC-20) Ahora</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAbrirCrearRC(indicadorEnEdicion, valorInput, semaforoModalEnVivo)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-98"
                    >
                      <AlertOctagon size={15} />
                      <span>📝 Emitir Reporte de Corrección (RC) Ahora</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* OPCIONES TÉCNICAS ADICIONALES (OPCIONALES / COLAPSADAS) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setMostrarOpcionesAvanzadas(!mostrarOpcionesAvanzadas)}
                className="text-[11px] font-semibold text-slate-500 hover:text-sky-700 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <span>{mostrarOpcionesAvanzadas ? '− Ocultar notas complementarias' : '+ Agregar notas u observación técnica complementaria (Opcional)'}</span>
              </button>
              {mostrarOpcionesAvanzadas && (
                <div className="mt-2 space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in text-xs">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Observación Técnica Manual (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={observacionInput}
                    onChange={(e) => setObservacionInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
                    placeholder="Si se omite, el sistema generará automáticamente la justificación institucional..."
                  />
                </div>
              )}
            </div>
          </form>
        </ContenedorModal>
      )}

      {/* ==================================================================== */}
      {/* MODAL GOBERNANZA: REGISTRO BLOQUEADO PARA USUARIOS NORMALES          */}
      {/* ==================================================================== */}
      {modalBloqueadoNormal && datosBloqueo && (
        <ContenedorModal
          abierto={modalBloqueadoNormal}
          onCerrar={() => setModalBloqueadoNormal(false)}
          tamano="lg"
          anchoMaximo="max-w-[70vw] xl:max-w-[850px]"
          titulo={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  GOBERNANZA ISO 9001 § 7.5.3 · REGISTRO BLOQUEADO
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  Medición Oficial Protegida
                </h3>
              </div>
            </div>
          }
          pie={
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={() => setModalBloqueadoNormal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-1 text-xs">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                <span>Este indicador ya cuenta con captura oficial registrada</span>
              </div>
              <p className="text-amber-950 text-xs leading-relaxed">
                El resultado para <strong>{mesActivoNombre} {ejercicio}</strong> ya fue ratificado bajo protesta de decir verdad y ha quedado bloqueado. De acuerdo con la política institucional de calidad, <strong>únicamente los Administradores del SGC</strong> tienen autorización para modificar o corregir mediciones capturadas.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Indicador:</span>
                <span className="font-bold text-slate-900 text-right">
                  #{datosBloqueo.indicador.numero ?? datosBloqueo.indicador.id} - {datosBloqueo.indicador.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Valor Oficial Registrado:</span>
                <span className="font-black text-sky-700 font-mono text-sm">
                  {datosBloqueo.valor} {datosBloqueo.indicador.unidad}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Capturado por:</span>
                <span className="font-bold text-slate-800">
                  {datosBloqueo.capturadoPor}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Fecha y Hora de Captura:</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {datosBloqueo.fechaCaptura ? new Date(datosBloqueo.fechaCaptura).toLocaleString('es-MX') : 'Fecha registrada'}
                </span>
              </div>
              {datosBloqueo.observacion && (
                <div className="pt-1">
                  <span className="text-slate-500 font-medium block mb-1">Observación técnica:</span>
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700 italic border border-slate-100 text-[11px]">
                    "{datosBloqueo.observacion}"
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-[11px] leading-relaxed">
              💡 <strong>¿Requiere corregir este resultado?</strong> Solicite a la Coordinación del SGC o a un usuario con rol de Administrador que realice el ajuste justificado en la bitácora institucional.
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ==================================================================== */}
      {/* MODAL GOBERNANZA: SEGUNDA CONFIRMACIÓN HUMANA (HUMAN-IN-THE-LOOP)    */}
      {/* ==================================================================== */}
      {modalSegundaConfirmacion && indicadorEnEdicion && (
        <ContenedorModal
          abierto={modalSegundaConfirmacion}
          onCerrar={() => setModalSegundaConfirmacion(false)}
          tamano="xl"
          anchoMaximo="max-w-[75vw] xl:max-w-[950px]"
          titulo={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  RATIFICACIÓN DE RESPONSABILIDAD OPERATIVA
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  Confirmar Captura de Resultado
                </h3>
              </div>
            </div>
          }
          pie={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setModalSegundaConfirmacion(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Volver a Revisar
              </button>
              <button
                type="button"
                disabled={!confirmacionCheckbox}
                onClick={confirmarCapturaUsuarioNormal}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  confirmacionCheckbox
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Confirmar y Bloquear Registro</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-1 text-xs">
            {/* Resumen del Indicador y Resultado */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Indicador:</span>
                <span className="font-bold text-slate-900 text-right">
                  #{indicadorEnEdicion.numero ?? indicadorEnEdicion.id} - {indicadorEnEdicion.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Período Evaluado:</span>
                <strong className="text-slate-800">
                  {MESES_COMPLETOS[MESES.indexOf(mesParaCaptura || mesActivo)] || (mesParaCaptura || mesActivo)} {ejercicio}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Meta Requerida:</span>
                <span className="font-mono font-bold text-slate-800">
                  {indicadorEnEdicion.meta_anual || indicadorEnEdicion.meta} {indicadorEnEdicion.unidad}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Resultado a Registrar:</span>
                <span className="font-mono font-black text-sky-800 text-base">
                  {valorInput} {indicadorEnEdicion.unidad}
                </span>
              </div>
              {semaforoModalEnVivo && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Semáforo Resultante:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${semaforoModalEnVivo.bg} ${semaforoModalEnVivo.text} ${semaforoModalEnVivo.border}`}>
                      {semaforoModalEnVivo.porcentaje}% · {semaforoModalEnVivo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Acción Oficial Automatizada:</span>
                    <span className={`font-mono text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                      semaforoModalEnVivo.rango !== 'CRITICO'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : indicadorEnEdicion.impacto === 'Alto'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {semaforoModalEnVivo.rango !== 'CRITICO'
                        ? 'NA (Conforme)'
                        : indicadorEnEdicion.impacto === 'Alto'
                        ? 'Acción Correctiva OOMRSC-20'
                        : 'Reporte de Corrección (RC)'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Declaración Jurada */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-amber-950">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 uppercase tracking-wide">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Declaración de Responsabilidad Operativa</span>
              </div>
              <p className="text-[11.5px] leading-relaxed">
                Declaro bajo protesta de decir verdad que este resultado refleja fielmente la medición técnica y operativa de mi área en el período señalado. Entiendo que una vez ratificado, el valor quedará <strong>bloqueado</strong> y solo la administración del SGC podrá realizar modificaciones posteriores.
              </p>
            </div>

            {/* Casilla de Verificación */}
            <label className="flex items-start gap-3 p-3.5 bg-white border border-slate-300 hover:border-sky-500 rounded-2xl cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={confirmacionCheckbox}
                onChange={(e) => setConfirmacionCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 leading-snug">
                He verificado los datos operativos y ratifico la captura de este resultado de forma definitiva en el SGC.
              </span>
            </label>
          </div>
        </ContenedorModal>
      )}

      {/* ==================================================================== */}
      {/* MODAL GOBERNANZA: JUSTIFICACIÓN DE MODIFICACIÓN (ADMINISTRADOR)     */}
      {/* ==================================================================== */}
      {modalJustificacionAdmin && indicadorEnEdicion && (
        <ContenedorModal
          abierto={modalJustificacionAdmin}
          onCerrar={() => setModalJustificacionAdmin(false)}
          tamano="xl"
          anchoMaximo="max-w-[75vw] xl:max-w-[950px]"
          titulo={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  TRAZABILIDAD ISO 9001 § 7.5.3 · MODO ADMINISTRADOR
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  Justificación Técnica de Modificación
                </h3>
              </div>
            </div>
          }
          pie={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setModalJustificacionAdmin(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarModificacionAdmin}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Autorizar y Registrar en Bitácora</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-1 text-xs">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-1.5 text-purple-950">
              <span className="font-bold block">
                Modificación autorizada por Administrador del SGC
              </span>
              <p className="text-[11px] leading-relaxed text-purple-900">
                Por requerimiento de auditoría ISO 9001:2015, cualquier alteración a una medición oficial previa debe quedar documentada con su causa técnica en la bitácora de trazabilidad.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">VALOR ANTERIOR:</span>
                <span className="font-mono font-black text-slate-600 text-sm">{valorOriginalAdmin} {indicadorEnEdicion.unidad}</span>
              </div>
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-sky-700 block text-[10px] font-bold">NUEVO VALOR:</span>
                <span className="font-mono font-black text-sky-900 text-sm">{valorInput} {indicadorEnEdicion.unidad}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Motivo / Justificación Técnica de la Modificación: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motivoModificacionAdmin}
                onChange={(e) => setMotivoModificacionAdmin(e.target.value)}
                placeholder="Ej. Recálculo por entrega de bitácoras de campo complementarias, corrección de error tipográfico..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 outline-none"
                required
                autoFocus
              />
              <span className="text-[10px] text-slate-400 block">
                Esta justificación se guardará con su nombre de usuario en la bitácora de auditoría.
              </span>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* MODAL UNIFICADO: GESTIÓN INTEGRAL SGC (OOMRSC-05) + FICHA PMD (AYUNTAMIENTO DE CAJEME) */}
      {(modalGestionIndicadorOpen || modalFichaAyuntamientoOpen) && (
        <ModalGestionarIndicador
          isOpen={modalGestionIndicadorOpen || modalFichaAyuntamientoOpen}
          onClose={() => {
            setModalGestionIndicadorOpen(false);
            setModalFichaAyuntamientoOpen(false);
            setIndicadorParaGestionar(null);
            setFichaParaModal(null);
          }}
          indicadorAEditar={indicadorParaGestionar}
          fichaData={fichaParaModal}
          onGuardarIndicador={handleGuardarIndicadorFicha}
          onGuardarFichaPersonalizada={handleGuardarFichaPersonalizada}
          fichasPersonalizadas={fichasPersonalizadas}
          valoresMensuales={resultados}
          direccionesDisponibles={direccionesUnicas}
          procesosDisponibles={procesosUnicos}
          areasDisponibles={areasUnicas}
          totalIndicadores={listaIndicadores.length}
          listaIndicadores={listaIndicadores}
          pestañaInicial={pestanaModalInicial}
        />
      )}

      {/* MODAL PARA GENERAR REPORTE DE CORRECCIÓN (RC) */}
      {modalRCOpen && datosParaRC && (
        <ModalGenerarRC
          isOpen={modalRCOpen}
          onClose={() => {
            setModalRCOpen(false);
            setDatosParaRC(null);
          }}
          indicador={datosParaRC.indicador}
          valorReal={datosParaRC.valorReal}
          semaforo={datosParaRC.semaforo}
          mes={mesActivo}
          ejercicio={ejercicio}
          usuarioLogueado={usuarioLogueado}
          onConfirmarRC={handleConfirmarRC}
        />
      )}

      {/* MODAL PARA GESTIÓN Y VERIFICACIÓN DE REPORTE DE CORRECCIÓN (RC) */}
      {modalGestionarRCOpen && rcParaGestionar && (
        <ModalGestionarRC
          isOpen={modalGestionarRCOpen}
          onClose={() => {
            setModalGestionarRCOpen(false);
            setRcParaGestionar(null);
          }}
          reporte={rcParaGestionar}
          onActualizarReporte={handleActualizarReporteCorreccion}
          usuarioLogueado={usuarioLogueado}
        />
      )}

      {/* MODAL PARA RECORDATORIO DE ATRASOS Y ENVÍO DE CORREOS */}
      {modalRecordatoriosOpen && (
        <ModalRecordatorioAtrasos
          isOpen={modalRecordatoriosOpen}
          onClose={() => setModalRecordatoriosOpen(false)}
          listaIndicadores={listaIndicadores}
          resultados={resultados}
          reportesCorreccion={reportesCorreccion}
          mesActivo={mesActivo}
          ejercicio={ejercicio}
          usuarioLogueado={usuarioLogueado}
        />
      )}
    </div>
  );
}

