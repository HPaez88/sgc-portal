import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  BookOpen,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  BookMarked,
  Scale,
  Award,
  ArrowRight,
  Info,
  MessageSquare,
  Bookmark,
  FileCode,
  HardHat,
  Leaf,
  ClipboardCheck,
  Eye,
  Maximize2,
  Download,
  FileDown,
  Printer,
  Clock,
  Target,
  TrendingUp,
  FileWarning,
  Activity,
  Zap,
  Upload,
  Cpu,
  Server,
  Lock,
  BookOpenCheck
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ContenedorModal from '../common/ContenedorModal';
import {
  exportarConsultaISOPDF,
  exportarConsultaISOMarkdown,
  exportarSesionCompletaISOPDF,
  exportarSesionCompletaISOMarkdown
} from '../../services/isoExporter';
import {
  generarContextoOperativo,
  generarBriefingMarkdownLocal
} from '../../services/contextoOperativoService';
import {
  ModalActualizarIndicadorIA,
  ModalGestionarActividadEvidenciaIA,
  ModalRatificarDocumentoIA
} from './ModalesAccionIA';
import { CLAUSULAS_FALLBACK } from '../../constants/clausulasFallback';

const PREGUNTAS_CATEGORIZADAS = [
  {
    categoria: '⚡ Diagnóstico Operativo y Pendientes por Área (Live Assistant)',
    icon: Sparkles,
    color: 'from-sky-700 to-indigo-900',
    preguntas: [
      {
        norma: 'SGC OOMAPASC',
        titulo: '¿Qué tengo pendiente en mi área hoy?',
        texto: '¿Qué tengo pendiente en mi área hoy? Necesito el balance ejecutivo de Acciones Correctivas (OOMRSC-20), Planes de Mejora (OOMRSC-21), Indicadores del mes (OOMRSC-05), procedimientos >1 año sin revisar (§ 7.5.3) y documentos pendientes por aprobar por el SGC.'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Procedimientos y Registros >1 año sin actualizar (§ 7.5.3)',
        texto: '¿Qué procedimientos o registros de mi área tienen más de 1 año sin revisar o actualizar y requieren atención para mantener la revisión periódica activa conforme a ISO 9001 § 7.5.3?'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Estado de mis Indicadores y Metas (OOMRSC-05)',
        texto: '¿Cómo van los indicadores oficiales de mi área en el Cuadro de Control OOMRSC-05? ¿Cuáles cumplen la meta anual y cuáles están en semáforo crítico/incumplidos?'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Planes de Mejora próximos a vencer (OOMRSC-21)',
        texto: '¿Qué planes de mejora de mi área están próximos a vencer su fecha compromiso y qué presupuesto y porcentaje de avance tienen asignado?'
      }
    ]
  },
  {
    categoria: 'Inteligencia Artificial y Human-in-the-Loop (ISO/IEC 42001:2023)',
    icon: Cpu,
    color: 'from-violet-600 to-purple-800',
    preguntas: [
      {
        norma: 'ISO-42001-2023',
        titulo: 'Gobernanza Human-in-the-Loop (§ 5.3 & POL-TI-01)',
        texto: '¿Cómo aplica el principio Human-in-the-Loop (§ 5.3) en el portal SGC para asegurar que la IA actúe como asesora pero nunca apruebe o cierre Acciones Correctivas o Planes de Mejora sin ratificación humana obligatoria?'
      },
      {
        norma: 'ISO-42001-2023',
        titulo: 'Mitigación de Alucinaciones con RAG Grounding (§ 6.1)',
        texto: '¿Qué controles de gestión de riesgos de IA y arquitectura RAG (§ 6.1) garantizan que las respuestas del asistente provengan exclusivamente de las normas ISO oficiales y del acervo documental interno del OOMAPASC?'
      },
      {
        norma: 'ISO-42001-2023',
        titulo: 'Transparencia y Explicabilidad Algorítmica (§ 8.2)',
        texto: '¿Cómo se garantiza la explicabilidad cuando el sistema clasifica un indicador incumplido entre Acción Correctiva (Alto Impacto) o Reporte de Corrección RC (Bajo Impacto)?'
      },
      {
        norma: 'ISO-42001-2023',
        titulo: 'Evaluación y Desempeño del SGIA (§ 9.2 y 9.3)',
        texto: '¿Cómo se deben auditar y reportar las métricas de uso y precisión del Asesor IA en las actas de Revisión por la Dirección (OOMRSC-04)?'
      }
    ]
  },
  {
    categoria: 'Seguridad de la Información, Ciberseguridad y TI (ISO/IEC 27001:2022)',
    icon: Server,
    color: 'from-slate-700 to-cyan-900',
    preguntas: [
      {
        norma: 'ISO-27001-2022',
        titulo: 'Control de Acceso RBAC y Política POL-TI-01 (A.5.15)',
        texto: '¿Cuáles son las directrices de control de acceso por roles (RBAC) y confidencialidad exigidas por ISO 27001 y POL-TI-01 para proteger los datos operativos y la parametrización del SGC?'
      },
      {
        norma: 'ISO-27001-2022',
        titulo: 'Seguridad en Telemetría SCADA y Redes de Pozos (§ 6.1 / A.8.24)',
        texto: '¿Qué controles de ciberseguridad e integridad en tránsito/reposo aplican para la telemetría SCADA y la bitácora de cloro en red (REG-CLORO-01)?'
      },
      {
        norma: 'ISO-27001-2022',
        titulo: 'Bitácoras Inmutables y Trazabilidad de Auditoría (A.8.15)',
        texto: '¿Qué requerimientos establece ISO 27001 para las bitácoras de auditoría (audit_logs) que previenen la alteración o borrado de evidencias en AC, PM e indicadores?'
      },
      {
        norma: 'ISO-27001-2022',
        titulo: 'Gestión de Incidentes de TI y Continuidad Operativa (§ 10.1)',
        texto: '¿Cuál es el procedimiento de respuesta inmediata y levantamiento de Acción Correctiva (OOMRSC-20) ante caídas de servidor o brechas de seguridad de TI?'
      }
    ]
  },
  {
    categoria: 'Fundamentos de Calidad y Glosario Oficial (ISO 9000:2015)',
    icon: BookOpenCheck,
    color: 'from-blue-600 to-sky-800',
    preguntas: [
      {
        norma: 'ISO-9000-2015',
        titulo: 'Los 7 Principios de Gestión de la Calidad en OOMAPASC',
        texto: '¿Cuáles son los 7 principios de gestión de la calidad según ISO 9000:2015 (Enfoque al cliente, Liderazgo, Compromiso, Procesos, Mejora, Evidencia, Relaciones) y cómo se aterrizan en OOMAPASC?'
      },
      {
        norma: 'ISO-9000-2015',
        titulo: 'Corrección vs Acción Correctiva vs Plan de Mejora',
        texto: '¿Cuál es la diferencia conceptual y operativa entre una Corrección (ej. Reporte de Corrección RC), una Acción Correctiva (OOMRSC-20 con análisis de causa raíz) y un Plan de Mejora (OOMRSC-21)?'
      },
      {
        norma: 'ISO-9000-2015',
        titulo: 'Evidencia Objetiva y Criterio de Eficacia (§ 3.8.3 y 3.7.11)',
        texto: '¿Qué se define como Evidencia Objetiva válida y cómo se evalúa la Eficacia de una acción correctiva antes de su dictamen final de cierre?'
      }
    ]
  },
  {
    categoria: 'Documentación Interna, Procedimientos y Formatos SGC',
    icon: FileText,
    color: 'from-blue-700 to-indigo-800',
    preguntas: [
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Interacción de OOMRSC-20 y PR-CAL-01',
        texto: '¿Cómo interactúa el formato de Acción Correctiva OOMRSC-20 con el procedimiento PR-CAL-01 y qué estados y firmas recorre en el portal?'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Potabilización (PR-POT-01) y Bitácora de Cloro (REG-CLORO-01)',
        texto: '¿Cómo se vincula el procedimiento operativo PR-POT-01 con la bitácora REG-CLORO-01 y en qué casos se dispara una Acción Correctiva en OOMRSC-20?'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Matriz de Trazabilidad y Bloqueo de Eliminación (§ 7.5.3)',
        texto: '¿Cómo funciona la matriz de trazabilidad documental del portal y por qué el sistema bloquea la eliminación de un documento con citas fuertes?'
      },
      {
        norma: 'SGC OOMAPASC',
        titulo: 'Plan de Mejora OOMRSC-21 y PR-MEJ-01',
        texto: '¿Qué información debe capturarse en el formato OOMRSC-21 según el procedimiento PR-MEJ-01 para la evaluación presupuestal de mejoras?'
      }
    ]
  },
  {
    categoria: 'Transición y Enmiendas 2026',
    icon: Sparkles,
    color: 'from-sky-600 to-blue-700',
    preguntas: [
      {
        norma: 'ISO-9001-2026',
        titulo: 'Cambios relevantes entre ISO 9001:2015 y 2026',
        texto: '¿Cuáles son los cambios más relevantes y nuevos requisitos entre la norma ISO 9001:2015 y la actualización ISO 9001:2026 para OOMAPASC?'
      },
      {
        norma: 'ISO-9001-2026',
        titulo: 'Enmienda de Acción Climática (§ 4.1 y 4.2)',
        texto: '¿Cómo implementar obligatoriamente la Enmienda de Acción Climática en el análisis de contexto (4.1) y partes interesadas (4.2) en OOMAPASC?'
      },
      {
        norma: 'ISO-9001-2026',
        titulo: 'Resiliencia Operativa y Ciberseguridad (§ 6.1 y 7.1.3)',
        texto: '¿Qué exige ISO 9001:2026 sobre resiliencia operativa, ciberseguridad industrial en SCADA y telemetría de pozos?'
      }
    ]
  },
  {
    categoria: 'Calidad y Control Operacional (ISO 9001:2026)',
    icon: ShieldCheck,
    color: 'from-blue-600 to-indigo-700',
    preguntas: [
      {
        norma: 'ISO-9001-2026',
        titulo: 'Control Operacional en Redes y Plantas (§ 8.5.1)',
        texto: '¿Qué evidencia objetiva exige la cláusula 8.5.1 para el control operacional en redes de agua potable y plantas potabilizadoras?'
      },
      {
        norma: 'ISO-9001-2026',
        titulo: 'Cierre Efectivo de Acciones Correctivas (§ 10.2 / OOMRSC-20)',
        texto: '¿Cómo documentar el análisis de causa raíz y el cierre efectivo de una Acción Correctiva en el formato OOMRSC-20 conforme al 10.2?'
      },
      {
        norma: 'ISO-9001-2026',
        titulo: 'Control de Proveedores Críticos (§ 8.4)',
        texto: '¿Qué debida diligencia y criterios de evaluación exige el 8.4 para proveedores de cloro gas y químicos esenciales?'
      }
    ]
  },
  {
    categoria: 'Gestión Ambiental y Sanitaria (ISO 14001:2015)',
    icon: Leaf,
    color: 'from-emerald-600 to-teal-700',
    preguntas: [
      {
        norma: 'ISO-14001-2015',
        titulo: 'Aspectos e Impactos Ambientales (§ 6.1.2)',
        texto: '¿Cómo identificar y evaluar aspectos e impactos ambientales significativos en plantas de tratamiento y drenes agrícolas según ISO 14001 § 6.1.2?'
      },
      {
        norma: 'ISO-14001-2015',
        titulo: 'Respuesta a Emergencias Ambientales (§ 8.2)',
        texto: '¿Qué protocolos de contingencia y simulacros exige ISO 14001 § 8.2 ante fugas de cloro gas o derrames de aguas residuales?'
      }
    ]
  },
  {
    categoria: 'Seguridad y Salud Laboral (ISO 45001:2018)',
    icon: HardHat,
    color: 'from-amber-600 to-orange-700',
    preguntas: [
      {
        norma: 'ISO-45001-2018',
        titulo: 'Trabajos en Espacios Confinados (§ 6.1.2 y 8.1.2)',
        texto: '¿Qué controles operacionales exige ISO 45001 y la NOM-033-STPS para ingreso seguro de cuadrillas a pozos de visita y cárcamos?'
      },
      {
        norma: 'ISO-45001-2018',
        titulo: 'Manejo Seguro de Cloro Gas (SST)',
        texto: '¿Qué medidas de seguridad, EPP y monitoreo de fugas se deben documentar en plantas potabilizadoras para cilindros de 1 tonelada de cloro gas?'
      }
    ]
  },
  {
    categoria: 'Auditorías y Dictamen de Cierre (ISO 19011:2018)',
    icon: ClipboardCheck,
    color: 'from-purple-600 to-slate-800',
    preguntas: [
      {
        norma: 'ISO-19011-2018',
        titulo: 'Principios y Criterios del Auditor (§ 4.0)',
        texto: '¿Cuáles son los principios fundamentales de auditoría e independencia del auditor según ISO 19011 § 4.0 para auditorías internas en OOMAPASC?'
      },
      {
        norma: 'ISO-19011-2018',
        titulo: 'Redacción de Hallazgos y No Conformidades (§ 6.4)',
        texto: '¿Cuál es la estructura formal obligatoria para redactar una No Conformidad válida (Declaración, Criterio y Evidencia Objetiva)?'
      }
    ]
  }
];


const NORMAS_BASE = [
  { id: 'ISO-9001-2026', nombre: 'ISO 9001:2026 — Sistemas de Gestión de la Calidad (Requisitos)', total_clausulas: 33 },
  { id: 'ISO-42001-2023', nombre: 'ISO/IEC 42001:2023 — Sistema de Gestión de Inteligencia Artificial (SGIA)', total_clausulas: 12 },
  { id: 'ISO-27001-2022', nombre: 'ISO/IEC 27001:2022 — Ciberseguridad, TI y Seguridad de la Información', total_clausulas: 12 },
  { id: 'ISO-9000-2015', nombre: 'ISO 9000:2015 — Fundamentos y Vocabulario Oficial', total_clausulas: 15 },
  { id: 'ISO-14001-2015', nombre: 'ISO 14001:2015 — Sistemas de Gestión Ambiental y Saneamiento', total_clausulas: 12 },
  { id: 'ISO-45001-2018', nombre: 'ISO 45001:2018 — Seguridad y Salud en el Trabajo', total_clausulas: 11 },
  { id: 'ISO-19011-2018', nombre: 'ISO 19011:2018 — Directrices para Auditorías de Gestión', total_clausulas: 10 }
];

export default function AgenteISOView({ setActiveTab }) {
  const {
    usuarioLogueado,
    registrarMovimiento,
    documentos,
    setDocumentos,
    procesosDetalle,
    accionesCorrectivas,
    setAccionesCorrectivas,
    planesMejora,
    setPlanesMejora,
    indicadoresData,
    setIndicadoresData,
    areasDetalle,
    puedeTodasAreas
  } = useSGC();
  const toast = useToast();

  // Contexto Operativo en Tiempo Real del Usuario Logueado
  const contextoOperativoActual = useMemo(() => {
    return generarContextoOperativo({
      usuario: usuarioLogueado,
      accionesCorrectivas: accionesCorrectivas || [],
      planesMejora: planesMejora || [],
      indicadoresData: indicadoresData || {},
      documentos: documentos || []
    });
  }, [usuarioLogueado, accionesCorrectivas, planesMejora, indicadoresData, documentos]);

  // Control de Permisos: Solo el Super Administrador puede agregar documentos al modelo RAG
  const esSuperAdmin = useMemo(() => {
    const rol = (usuarioLogueado?.rol || '').toLowerCase();
    const nombre = (usuarioLogueado?.nombre || '').toLowerCase();
    return rol.includes('super') || rol === 'super_admin' || rol === 'super admin' || nombre.includes('héctor') || nombre.includes('hector') || usuarioLogueado?.id === 1;
  }, [usuarioLogueado]);

  // Pestañas principales
  const [tabActiva, setTabActiva] = useState('chat'); // 'chat' | 'consultas' | 'base' | 'clausulas'

  const [normas, setNormas] = useState(NORMAS_BASE);
  const [normaSeleccionada, setNormaSeleccionada] = useState(''); // '' = todas
  const [documentosConocimiento, setDocumentosConocimiento] = useState([]);
  const [cargandoNormas, setCargandoNormas] = useState(false);

  // Modales de Acción Rápida desde la IA
  const [modalIndicadorIA, setModalIndicadorIA] = useState({ open: false, indicador: null });
  const [modalActividadEvidenciaIA, setModalActividadEvidenciaIA] = useState({ open: false, accion: null });
  const [modalRatificarDocIA, setModalRatificarDocIA] = useState({ open: false, documento: null });

  // Chat State
  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      emisor: 'agente',
      texto: `**¡Hola! Soy tu Agente Auditor y Asesor Normativo y Documental ISO (Multi-SGC Integrado).**\n\nEstoy conectado en tiempo real a tu perfil operativo:\n- **Colaborador:** ${usuarioLogueado?.nombre || 'Colaborador SGC'} | **Área:** ${usuarioLogueado?.area || 'Control y Servicios'} (${usuarioLogueado?.direccion || 'Dir. Comercial'})\n- **Normas ISO Oficiales Integradas:**\n  1. **ISO 9001:2015 / 2026** (Gestión de Calidad, Enmiendas Climáticas y Resiliencia)\n  2. **ISO/IEC 42001:2023** (Gobernanza de Inteligencia Artificial & Human-in-the-Loop)\n  3. **ISO/IEC 27001:2022** (Seguridad de la Información, Ciberseguridad & TI)\n  4. **ISO 9000:2015** (Fundamentos de Calidad y Vocabulario Oficial)\n  5. **ISO 14001:2015** (Gestión Ambiental y Saneamiento)\n  6. **ISO 45001:2018** (Seguridad y Salud en el Trabajo)\n  7. **ISO 19011:2018** (Directrices de Auditoría Interna)\n- **Documentación Interna del Portal SGC:** Manual de Calidad \`MC-01\`, Política de TI \`POL-TI-01\`, Procedimientos (\`PR-CAL-01\`, \`PR-MEJ-01\`, \`PR-POT-01\`, \`PR-AUD-01\`), Formatos/Registros (\`OOMRSC-20\`, \`OOMRSC-21\`, \`REG-CLORO-01\`), Cuadro de Control (\`OOMRSC-05\`) y Matriz de Trazabilidad Documental.\n\nPuedes preguntarme **"¿Qué tengo pendiente hoy?"** o pedirme directamente **"Actualiza el indicador #70 con 92%"**, **"Subir evidencia"** o **"Ratificar procedimiento PR-CS-01"** para ejecutar y guardar los datos en su módulo correspondiente.`,
      clausulas: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPregunta, setInputPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);

  // Explorador de Cláusulas State
  const [normaExplorando, setNormaExplorando] = useState('ISO-9001-2026');
  const [clausulasNorma, setClausulasNorma] = useState(() => CLAUSULAS_FALLBACK['ISO-9001-2026'] || []);
  const [cargandoClausulas, setCargandoClausulas] = useState(false);
  const [busquedaClausula, setBusquedaClausula] = useState('');

  // Modales
  const [modalDocCustomAbierto, setModalDocCustomAbierto] = useState(false);
  const [docCustomForm, setDocCustomForm] = useState({ nombre: '', contenido: '' });
  const [guardandoDoc, setGuardandoDoc] = useState(false);

  const [docVisorModal, setDocVisorModal] = useState(null); // { nombre, contenido, tipo }

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tabActiva === 'chat') {
      scrollToBottom();
    }
  }, [mensajes, enviando, tabActiva]);

  // Cargar normas y documentos al montar
  useEffect(() => {
    cargarNormasYDocumentos();
    cargarClausulas('ISO-9001-2026');
  }, []);

  // Autocargar cláusulas al entrar al tab si aún no se han cargado
  useEffect(() => {
    if (tabActiva === 'clausulas' && clausulasNorma.length === 0 && !cargandoClausulas) {
      cargarClausulas(normaExplorando || 'ISO-9001-2026');
    }
  }, [tabActiva]);

  const cargarNormasYDocumentos = async () => {
    setCargandoNormas(true);
    try {
      const resNormas = await fetch('/api/v1/iso/normas');
      if (resNormas.ok) {
        const data = await resNormas.json();
        if (data.normas && data.normas.length > 0) {
          setNormas(data.normas);
          cargarClausulas(data.normas[0].id);
          setNormaExplorando(data.normas[0].id);
        }
      }

      const resDocs = await fetch('/api/v1/iso/documentos');
      if (resDocs.ok) {
        const dataDocs = await resDocs.json();
        setDocumentosConocimiento(dataDocs.documentos || []);
      }
    } catch (e) {
      console.warn('Backend ISO offline, usando catálogo base de normas:', e);
    } finally {
      setCargandoNormas(false);
    }
  };

  const cargarClausulas = async (normaId) => {
    // Si tenemos fallback para esta norma, cargarlo inmediatamente para que no haya pantalla en blanco
    if (CLAUSULAS_FALLBACK[normaId] && CLAUSULAS_FALLBACK[normaId].length > 0) {
      setClausulasNorma(CLAUSULAS_FALLBACK[normaId]);
    }
    setCargandoClausulas(true);
    try {
      const res = await fetch(`/api/v1/iso/clausulas/${normaId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.clausulas && data.clausulas.length > 0) {
          setClausulasNorma(data.clausulas);
        }
      }
    } catch (e) {
      console.warn('Error al cargar cláusulas del servidor, conservando catálogo base:', e);
    } finally {
      setCargandoClausulas(false);
    }
  };

  // Callback cuando una acción directa es completada en los modales
  const handleAccionConfirmada = (data) => {
    if (data?.mensajeChat) {
      setMensajes(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          emisor: 'agente',
          texto: data.mensajeChat,
          clausulas: [
            { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '7.5.3', titulo: 'Control de la información documentada' },
            { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '9.1.3', titulo: 'Análisis y evaluación de indicadores (OOMRSC-05)' },
            { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '10.2', titulo: 'No conformidad y acción correctiva (OOMRSC-20)' }
          ],
          normaConsultada: 'SGC OOMAPASC (Operativo)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    toast.success('Operación ejecutada y registrada en el SGC exitosamente');
  };

  const handleEnviarConsulta = async (preguntaTexto = null, normaOverride = null) => {
    const texto = (preguntaTexto !== null ? preguntaTexto : inputPregunta).trim();
    if (!texto || enviando) return;

    // Cambiar a la pestaña de chat automáticamente
    setTabActiva('chat');

    const normaId = normaOverride !== null ? normaOverride : (normaSeleccionada || null);

    const userMsg = {
      id: Date.now().toString(),
      emisor: 'usuario',
      texto,
      normaId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMensajes(prev => [...prev, userMsg]);
    setInputPregunta('');
    setEnviando(true);

    // ═══════════════════════════════════════════════════════════════════════════
    // DETECCIÓN Y DISPARO INTELIGENTE DE ACCIONES INTERACTIVAS EN LENGUAJE NATURAL
    // ═══════════════════════════════════════════════════════════════════════════
    const textoLower = texto.toLowerCase();

    // 1. Intención de actualizar indicador
    const esActualizarInd = (textoLower.includes('actualizar indicador') || textoLower.includes('capturar indicador') || textoLower.includes('poner dato') || /actualiz\w*\s+(?:el\s+)?indicador/i.test(textoLower)) && !textoLower.includes('¿qué') && !textoLower.includes('como van');
    if (esActualizarInd) {
      const matchNum = textoLower.match(/#?\s*(\d+)/);
      const indNum = matchNum ? Number(matchNum[1]) : (contextoOperativoActual.indicadores_area[0]?.id ?? 0);
      const indEncontrado = contextoOperativoActual.indicadores_area.find(i => String(i.numero ?? i.id) === String(indNum)) ||
                            contextoOperativoActual.indicadores_area[0] || null;

      setModalIndicadorIA({ open: true, indicador: indEncontrado });
      setMensajes(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          emisor: 'agente',
          texto: `🎯 **He abierto la ventana de captura interactiva para el Indicador #${indEncontrado?.numero ?? indNum} ("${indEncontrado?.nombre || 'Indicador SGC'}").**\n\nIngresa el valor del mes, las observaciones y confirma para guardarlo directamente en el Cuadro de Control (OOMRSC-05) y recalcular el semáforo institucional en tiempo real.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setEnviando(false);
      return;
    }

    // 2. Intención de subir evidencia o gestionar actividad de AC
    const esEvidenciaAC = (textoLower.includes('subir evidencia') || textoLower.includes('evidencia') || textoLower.includes('revisar actividad') || /actividad\s+de\s+ac/i.test(textoLower)) && !textoLower.includes('¿qué');
    if (esEvidenciaAC) {
      const matchAC = textoLower.match(/ac\s*#?\s*(\d+)/i) || textoLower.match(/(\d+)/);
      const acNum = matchAC ? Number(matchAC[1]) : (contextoOperativoActual.acciones_pendientes[0]?.id || 1);
      const acEncontrada = accionesCorrectivas.find(a => String(a.id) === String(acNum) || String(a.folio || '').includes(String(acNum))) ||
                           accionesCorrectivas[0] || null;

      setModalActividadEvidenciaIA({ open: true, accion: acEncontrada });
      setMensajes(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          emisor: 'agente',
          texto: `⚠️ **He abierto el panel de gestión de actividades y evidencias para [${acEncontrada?.folio || `AC#${acNum}`}].**\n\nPuedes marcar el estatus de la actividad (Completada / En proceso), adjuntar fotos o documentos PDF y registrar las observaciones operativas conforme al requisito ISO 9001 § 10.2.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setEnviando(false);
      return;
    }

    // 3. Intención de ratificar documento >1 año
    const esRatificarDoc = (textoLower.includes('ratificar') || textoLower.includes('revision activa') || textoLower.includes('actualizar procedimiento')) && !textoLower.includes('¿qué');
    if (esRatificarDoc) {
      const matchDoc = textoLower.match(/([A-Za-z]{2,6}-[A-Za-z0-9]+(?:-\d+)?)/i);
      const docClave = matchDoc ? matchDoc[1].toUpperCase() : (contextoOperativoActual.documentos_antiguos_sin_revision[0]?.clave || '');
      const docEncontrado = documentos.find(d => String(d.clave || '').toUpperCase() === docClave || String(d.id) === docClave) ||
                            contextoOperativoActual.documentos_antiguos_sin_revision[0] || documentos[0];

      setModalRatificarDocIA({ open: true, documento: docEncontrado });
      setMensajes(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          emisor: 'agente',
          texto: `📑 **He abierto la ventana de ratificación activa para el documento [${docEncontrado?.clave || docClave}] ("${docEncontrado?.titulo || 'Documento SGC'}").**\n\nAl confirmar la revisión, se actualizará su fecha al día de hoy en el portal oficial y se eliminará la alerta de obsolescencia conforme a la norma ISO 9001 § 7.5.3.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setEnviando(false);
      return;
    }

    try {
      const historial = mensajes
        .filter(m => m.id !== 'bienvenida')
        .map(m => ({
          role: m.emisor === 'usuario' ? 'user' : 'assistant',
          content: m.texto
        }));

      const res = await fetch('/api/v1/iso/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          norma_id: normaId,
          historial,
          catalogo_documentos: documentos || [],
          catalogo_procesos: procesosDetalle || [],
          usuario_contexto: contextoOperativoActual
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Error en el servidor' }));
        throw new Error(errorData.detail || 'Fallo en la consulta');
      }

      const data = await res.json();

      const agenteMsg = {
        id: (Date.now() + 1).toString(),
        emisor: 'agente',
        texto: data.respuesta,
        clausulas: data.clausulas_citadas || [],
        normaConsultada: data.norma_consultada,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMensajes(prev => [...prev, agenteMsg]);

      registrarMovimiento?.({
        modulo: 'AUDITORIA_ISO',
        accion: 'CONSULTA_IA',
        descripcion: `Consulta normativa al Asesor ISO: "${texto.substring(0, 45)}..."`,
        detalles: `Norma: ${data.norma_consultada || 'General'} | Citas: ${(data.clausulas_citadas || []).map(c => c.numero).join(', ')}`,
        folio: 'ISO-IA-CONSULTA'
      });
    } catch (e) {
      console.warn('Backend ISO offline or fallback needed:', e);
      
      // Detección inteligente de consulta de pendientes o estado operativo
      const esConsultaOperativa = /pendiente|pendientes|área|area|indicador|indicadores|plan|planes|documento|documentos|año|ano|vencer|revisar|revision|resumen/i.test(texto);
      
      let respuestaFinal = '';
      if (esConsultaOperativa) {
        respuestaFinal = generarBriefingMarkdownLocal(contextoOperativoActual);
      } else {
        respuestaFinal = `⚠️ **Nota:** El motor de IA en la nube respondió con un retraso, pero aquí tienes el diagnóstico operativo en tiempo real de tu área:\n\n` + generarBriefingMarkdownLocal(contextoOperativoActual);
      }

      const agenteMsg = {
        id: (Date.now() + 1).toString(),
        emisor: 'agente',
        texto: respuestaFinal,
        clausulas: [
          { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '7.5.3', titulo: 'Control de la información documentada y mantenimiento activo' },
          { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '9.1.3', titulo: 'Análisis y evaluación de indicadores (OOMRSC-05)' },
          { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '10.2', titulo: 'No conformidad y acción correctiva (OOMRSC-20)' },
          { norma_id: 'ISO-9001-2026', norma: 'ISO 9001:2026', numero: '10.3', titulo: 'Mejora continua (OOMRSC-21)' }
        ],
        normaConsultada: normaId || 'SGC OOMAPASC (Operativo)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMensajes(prev => [...prev, agenteMsg]);
    } finally {
      setEnviando(false);
    }
  };

  const copiarAlPortapapeles = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    toast.success('Respuesta copiada al portapapeles');
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const obtenerPreguntaPrevia = (idx) => {
    for (let i = idx - 1; i >= 0; i--) {
      if (mensajes[i]?.emisor === 'usuario') return mensajes[i].texto;
    }
    return 'Consulta técnica al Asesor Normativo ISO';
  };

  const guardarDocumentoPersonalizado = async () => {
    if (!docCustomForm.nombre.trim() || !docCustomForm.contenido.trim()) {
      toast.warning('Por favor completa el nombre y contenido del documento');
      return;
    }
    setGuardandoDoc(true);
    try {
      const res = await fetch('/api/v1/iso/guardar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_archivo: docCustomForm.nombre,
          contenido: docCustomForm.contenido
        })
      });
      if (!res.ok) throw new Error('Error al guardar documento');
      const data = await res.json();
      toast.success(data.mensaje || 'Documento indexado en la base de conocimiento');
      setModalDocCustomAbierto(false);
      setDocCustomForm({ nombre: '', contenido: '' });
      cargarNormasYDocumentos();
    } catch (e) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setGuardandoDoc(false);
    }
  };

  // Formateador robusto y compacto de Markdown con soporte para tablas y código
  const renderMarkdown = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detección de tablas Markdown
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        let j = i;
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          tableLines.push(lines[j].trim());
          j++;
        }
        if (tableLines.length >= 2) {
          const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
          const hasDelimiter = tableLines.length > 1 && tableLines[1].includes('---');
          const bodyRows = (hasDelimiter ? tableLines.slice(2) : tableLines.slice(1))
            .map(row => row.split('|').slice(1, -1).map(c => c.trim()));

          elements.push(
            <div key={`tbl-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
              <table className="min-w-full text-[11.5px] text-left divide-y divide-slate-200">
                <thead className="bg-[#0B192C] text-white">
                  <tr>
                    {headerRow.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 font-extrabold uppercase tracking-wider text-[10.5px]">
                        {formatBold(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bodyRows.map((r, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white hover:bg-sky-50/50' : 'bg-slate-50/60 hover:bg-sky-50/50'}>
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 text-slate-800 leading-normal font-normal">
                          {formatBold(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          i = j;
          continue;
        }
      }

      // Títulos
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="font-bold text-xs text-[#002855] mt-2 mb-0.5 flex items-center gap-1.5">
            {formatBold(line.replace('### ', ''))}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="font-bold text-[12.5px] text-[#002855] mt-2 mb-0.5 border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
            {formatBold(line.replace('## ', ''))}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="font-extrabold text-[13px] text-[#002855] mt-2.5 mb-1">
            {formatBold(line.replace('# ', ''))}
          </h2>
        );
      } else if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-3.5 list-disc text-xs text-slate-700 my-0.5 leading-snug">
            {formatBold(line.trim().substring(2))}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-0.5" />);
      } else if (line.trim() === '---') {
        elements.push(<hr key={i} className="my-1.5 border-slate-200" />);
      } else {
        elements.push(
          <p key={i} className="text-xs text-slate-700 leading-normal my-0.5">
            {formatBold(line)}
          </p>
        );
      }
      i++;
    }

    return elements;
  };

  const formatBold = (text) => {
    if (!text) return text;
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="font-bold text-slate-900 not-italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[10.5px] bg-sky-50 text-sky-900 border border-sky-200 px-1 py-0.2 rounded font-bold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderContenidoDetallado = (texto) => {
    if (!texto) return null;
    const lineas = texto.split('\n');
    return (
      <div className="space-y-1">
        {lineas.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-[11.5px] leading-relaxed">
                <span className="text-sky-600 font-bold mt-0.5">•</span>
                <span className="flex-1">{formatBold(trimmed.substring(2))}</span>
              </div>
            );
          }
          return (
            <p key={lIdx} className="text-[11.5px] leading-relaxed">
              {formatBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const clausulasFiltradas = (clausulasNorma || []).filter(c => {
    if (!c) return false;
    if (!busquedaClausula) return true;
    const b = busquedaClausula.toLowerCase();
    return (c.numero || '').toLowerCase().includes(b) ||
      (c.titulo || '').toLowerCase().includes(b) ||
      (c.requisito || '').toLowerCase().includes(b) ||
      (c.interpretacion || '').toLowerCase().includes(b) ||
      (c.criterio_auditoria || '').toLowerCase().includes(b) ||
      (c.evidencia_objetiva || '').toLowerCase().includes(b);
  });

  return (
    <div className="space-y-3.5 animate-fade-in-up pb-6">
      {/* HEADER COMPACTO Y ELEGANTE DEL AGENTE */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-md text-white border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5">
          {/* Título e Identidad */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles size={17} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Asesor & Auditor Normativo ISO (IA)
                </h2>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  RAG Grounded
                </span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  OOMAPASC
                </span>
              </div>
            </div>
          </div>

          {/* Navegación de Pestañas y Acciones */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-1 p-1 bg-black/30 backdrop-blur-xs rounded-xl border border-white/10 flex-wrap text-xs">
              <button
                onClick={() => setTabActiva('chat')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tabActiva === 'chat'
                    ? 'bg-sky-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare size={13} />
                <span>Asesor Chat</span>
              </button>

              <button
                onClick={() => setTabActiva('consultas')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tabActiva === 'consultas'
                    ? 'bg-sky-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <HelpCircle size={13} />
                <span>Consultas ({PREGUNTAS_CATEGORIZADAS.reduce((acc, c) => acc + c.preguntas.length, 0)})</span>
              </button>

              <button
                onClick={() => setTabActiva('base')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tabActiva === 'base'
                    ? 'bg-sky-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookMarked size={13} />
                <span>Base Normas ({documentosConocimiento.length || normas.length})</span>
              </button>

              <button
                onClick={() => {
                  setTabActiva('clausulas');
                  if (normas.length > 0 && !clausulasNorma.length) {
                    cargarClausulas(normas[0].id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tabActiva === 'clausulas'
                    ? 'bg-sky-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen size={13} />
                <span>Explorador Cláusulas</span>
              </button>
            </div>

            {esSuperAdmin && (
              <button
                onClick={() => setModalDocCustomAbierto(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer ml-1"
                title="Solo el Super Administrador puede agregar documentos a la base del modelo"
              >
                <Plus size={13} strokeWidth={3} />
                <span>+ Agregar Documento</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PESTAÑA 1: CHAT EXPANDIDO A PANTALLA COMPLETA */}
      {/* ============================================================ */}
      {tabActiva === 'chat' && (
        <div className="w-full bg-white rounded-2xl shadow-card-subtle border border-slate-200 flex flex-col h-[calc(100vh-190px)] min-h-[580px] overflow-hidden">
          {/* Header Compacto del Chat y Briefing */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col gap-2">
            {/* Fila 1: Filtros de Norma + Estado + Acciones de exportación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold text-slate-800 mr-1">
                  Norma:
                </span>
                <button
                  onClick={() => setNormaSeleccionada('')}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                    normaSeleccionada === ''
                      ? 'bg-[#0B192C] text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  Todas (Multi-Norma)
                </button>
                {normas.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setNormaSeleccionada(n.id)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      normaSeleccionada === n.id
                        ? 'bg-[#0B192C] text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {n.id.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {mensajes.filter(m => m.id !== 'bienvenida').length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        exportarSesionCompletaISOPDF({ mensajes, usuario: usuarioLogueado });
                        toast.success('Sesión consolidada descargada en PDF');
                      }}
                      className="text-[10.5px] font-bold text-sky-900 bg-sky-100/80 hover:bg-sky-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-sky-200 shadow-2xs"
                      title="Descargar informe consolidado en PDF"
                    >
                      <Download size={11} className="text-sky-700" /> PDF Sesión
                    </button>

                    <button
                      onClick={() => {
                        exportarSesionCompletaISOMarkdown({ mensajes, usuario: usuarioLogueado });
                        toast.success('Historial descargado en Markdown (.md)');
                      }}
                      className="text-[10.5px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                      title="Descargar Markdown"
                    >
                      <FileDown size={11} className="text-slate-600" /> .MD
                    </button>
                  </>
                )}

                <button
                  onClick={() => setMensajes([mensajes[0]])}
                  className="text-[10.5px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-slate-200/50"
                  title="Reiniciar chat"
                >
                  <RefreshCw size={11} /> Limpiar
                </button>
              </div>
            </div>

            {/* Fila 2: Briefing Operativo y Botones de Acción Directa */}
            <div className="bg-gradient-to-r from-slate-900 via-[#0B192C] to-[#1E3E62] px-3 py-2 rounded-xl text-white shadow-2xs border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/30 text-sky-300 font-extrabold text-[10.5px] flex items-center gap-1">
                  <Activity size={11} className="text-sky-400 animate-pulse" />
                  <span>Área: {contextoOperativoActual?.area || 'General'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border ${
                    (contextoOperativoActual?.resumen_conteos?.total_ac_pendientes || 0) > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  }`}>
                    <AlertTriangle size={10} /> {contextoOperativoActual?.resumen_conteos?.total_ac_pendientes ?? 0} ACs
                  </span>

                  <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border ${
                    (contextoOperativoActual?.resumen_conteos?.total_pm_proximos_vencer || 0) > 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30 animate-pulse'
                      : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  }`}>
                    <TrendingUp size={10} /> {contextoOperativoActual?.resumen_conteos?.total_pm_activos ?? 0} PMs
                  </span>

                  <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border ${
                    (contextoOperativoActual?.resumen_conteos?.total_indicadores_incumplidos || 0) > 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  }`}>
                    <Target size={10} /> {contextoOperativoActual?.resumen_conteos?.total_indicadores ?? 0} Inds. {(contextoOperativoActual?.resumen_conteos?.total_indicadores_incumplidos || 0) > 0 ? `(🔴 ${contextoOperativoActual?.resumen_conteos?.total_indicadores_incumplidos})` : `(🟢 100%)`}
                  </span>

                  {(contextoOperativoActual?.resumen_conteos?.total_docs_antiguos_sin_revision || 0) > 0 && (
                    <span className="px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border bg-amber-500/20 text-amber-300 border-amber-400/30">
                      <FileWarning size={10} /> {contextoOperativoActual?.resumen_conteos?.total_docs_antiguos_sin_revision} Docs &gt;1a
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {/* 1. ¿Qué tengo pendiente? */}
                <button
                  onClick={() => handleEnviarConsulta('¿Qué tengo pendiente en mi área hoy? Necesito el balance ejecutivo de Acciones Correctivas (OOMRSC-20), Planes de Mejora (OOMRSC-21), Indicadores del mes (OOMRSC-05), procedimientos >1 año sin revisar (§ 7.5.3) y documentos pendientes por aprobar por el SGC.')}
                  disabled={enviando}
                  className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Obtener el balance completo de pendientes de mi área"
                >
                  <Zap size={13} className="text-amber-300 fill-amber-300" />
                  <span>¿Qué tengo pendiente?</span>
                </button>

                {/* 2. Actualizar Indicador */}
                <button
                  onClick={() => setModalIndicadorIA({ open: true, indicador: contextoOperativoActual?.indicadores_area?.[0] || null })}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Capturar valor en el Cuadro de Control OOMRSC-05"
                >
                  <Target size={13} className="text-emerald-400" />
                  <span>Actualizar Indicador</span>
                </button>

                {/* 3. Subir Evidencia (AC / PM) */}
                <button
                  onClick={() => setModalActividadEvidenciaIA({ open: true, accion: contextoOperativoActual?.acciones_pendientes?.[0] || null, plan: contextoOperativoActual?.planes_mejora_activos?.[0] || null })}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Subir evidencia o registrar avance a una Acción Correctiva o Plan de Mejora"
                >
                  <Upload size={13} className="text-amber-400" />
                  <span>Subir Evidencia</span>
                </button>

                {/* 4. Ratificar Doc */}
                {(contextoOperativoActual?.resumen_conteos?.total_docs_antiguos_sin_revision || 0) > 0 && (
                  <button
                    onClick={() => setModalRatificarDocIA({ open: true, documento: contextoOperativoActual?.documentos_antiguos_sin_revision?.[0] || null })}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Ratificar vigencia de procedimientos con >1 año sin revisar"
                  >
                    <ShieldCheck size={13} className="text-purple-400" />
                    <span>Ratificar Doc</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mensajes a ancho completo con protagonismo visual */}
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/50 via-white to-white">
            {mensajes.map((m) => {
              const esUsuario = m.emisor === 'usuario';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${esUsuario ? 'justify-end' : 'justify-start'}`}
                >
                  {!esUsuario && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#002855] text-sky-400 flex items-center justify-center shadow-md shrink-0 mt-0.5">
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[95%] lg:max-w-[90%] rounded-xl p-3.5 sm:p-4 shadow-xs text-xs ${
                      esUsuario
                        ? 'bg-[#002855] text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none ring-1 ring-slate-100'
                    }`}
                  >
                    {/* Badge y Timestamp */}
                    <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100">
                      <span className={`font-bold text-xs ${esUsuario ? 'text-sky-300' : 'text-[#002855]'}`}>
                        {esUsuario ? (usuarioLogueado?.nombre || 'Auditor / Usuario') : 'Agente Asesor Normativo ISO'}
                      </span>
                      <span className={`text-[10.5px] font-mono ${esUsuario ? 'text-slate-300' : 'text-slate-400'}`}>
                        {m.timestamp}
                      </span>
                    </div>

                    {/* Contenido formateado */}
                    <div className="space-y-1 leading-normal text-xs">
                      {esUsuario ? (
                        <p className="leading-normal font-medium text-xs">{m.texto}</p>
                      ) : (
                        renderMarkdown(m.texto)
                      )}
                    </div>

                    {/* Cláusulas citadas */}
                    {!esUsuario && m.clausulas && m.clausulas.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Scale size={13} className="text-sky-600" /> Cláusulas Oficiales Citadas:
                        </span>
                        {m.clausulas.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setNormaExplorando(c.norma_id || 'ISO-9001-2026');
                              cargarClausulas(c.norma_id || 'ISO-9001-2026');
                              setTabActiva('clausulas');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[11px] font-mono font-bold text-sky-900 transition-colors cursor-pointer"
                            title={`${c.norma} § ${c.numero} - ${c.titulo}`}
                          >
                            <span>§ {c.numero}</span>
                            <span className="text-slate-600 font-sans truncate max-w-[200px]">{c.titulo}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Acciones de respuesta */}
                    {!esUsuario && m.id !== 'bienvenida' && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                        {/* Botones de acción directa disparables desde la respuesta del Agente */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">
                            Acciones Directas:
                          </span>
                          <button
                            onClick={() => setModalIndicadorIA({ open: true, indicador: contextoOperativoActual?.indicadores_area?.[0] || null })}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Capturar o actualizar valor de un indicador del área"
                          >
                            <Target size={12} className="text-emerald-600" />
                            <span>Actualizar Indicador</span>
                          </button>
                          <button
                            onClick={() => setModalActividadEvidenciaIA({ open: true, accion: contextoOperativoActual?.acciones_pendientes?.[0] || null, plan: contextoOperativoActual?.planes_mejora_activos?.[0] || null })}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Subir evidencia o marcar actividad de una Acción Correctiva"
                          >
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>Subir Evidencia</span>
                          </button>
                          {(contextoOperativoActual?.resumen_conteos?.total_docs_antiguos_sin_revision || 0) > 0 && (
                            <button
                              onClick={() => setModalRatificarDocIA({ open: true, documento: contextoOperativoActual?.documentos_antiguos_sin_revision?.[0] || null })}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Ratificar revisión activa de documento > 1 año"
                            >
                              <ShieldCheck size={12} className="text-purple-600" />
                              <span>Ratificar Doc &gt;1 año</span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          <div className="flex items-center gap-3">
                            {setActiveTab && (
                              <button
                                onClick={() => setActiveTab('ac')}
                                className="text-[#002855] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                Ir a Acciones Correctivas (OOMRSC-20) <ArrowRight size={12} />
                              </button>
                            )}
                          </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              const idx = mensajes.findIndex((item) => item.id === m.id);
                              const pregunta = obtenerPreguntaPrevia(idx);
                              exportarConsultaISOPDF({
                                pregunta,
                                respuesta: m.texto,
                                clausulas: m.clausulas || [],
                                normaConsultada: m.normaConsultada || normaSeleccionada || 'Todas las Normas ISO y SGC',
                                usuario: usuarioLogueado,
                                timestamp: m.timestamp
                              });
                              toast.success('Dictamen PDF generado y descargado');
                            }}
                            className="flex items-center gap-1 text-sky-950 font-bold px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer shadow-2xs text-[11px]"
                            title="Descargar esta respuesta como Dictamen Técnico en PDF"
                          >
                            <Download size={13} className="text-sky-700" />
                            <span>Descargar PDF</span>
                          </button>

                          <button
                            onClick={() => {
                              const idx = mensajes.findIndex((item) => item.id === m.id);
                              const pregunta = obtenerPreguntaPrevia(idx);
                              exportarConsultaISOMarkdown({
                                pregunta,
                                respuesta: m.texto,
                                clausulas: m.clausulas || [],
                                normaConsultada: m.normaConsultada || normaSeleccionada || 'Todas las Normas ISO y SGC',
                                usuario: usuarioLogueado,
                                timestamp: m.timestamp
                              });
                              toast.success('Archivo Markdown (.md) descargado');
                            }}
                            className="flex items-center gap-1 text-slate-700 font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-2xs text-[11px]"
                            title="Descargar esta respuesta en formato Markdown (.md)"
                          >
                            <FileDown size={13} className="text-slate-600" />
                            <span>Descargar .MD</span>
                          </button>

                          <button
                            onClick={() => copiarAlPortapapeles(m.texto, m.id)}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer text-[11px]"
                            title="Copiar texto al portapapeles"
                          >
                            {copiadoId === m.id ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="text-emerald-700">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}

            {enviando && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B192C] to-[#002855] text-sky-400 flex items-center justify-center shadow-md shrink-0">
                  <Bot size={22} className="animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4.5 shadow-sm text-xs text-slate-700 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-ping" />
                  <span className="font-bold text-slate-800">
                    Analizando base de conocimiento ISO y requisitos técnicos de OOMAPASC...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barra de entrada a ancho completo */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnviarConsulta();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputPregunta}
                  onChange={(e) => setInputPregunta(e.target.value)}
                  placeholder="Escribe tu duda sobre cualquier cláusula ISO (ej. ¿Cómo cumplir con el 8.5.1 en redes y plantas?)..."
                  disabled={enviando}
                  className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white outline-none transition-all disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={!inputPregunta.trim() || enviando}
                className="px-6 py-3.5 bg-[#002855] hover:bg-[#001f42] text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <span>Consultar</span>
                <Send size={15} />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
              <Info size={12} className="text-sky-600" />
              El Asesor Normativo responderá citando cláusulas exactas, evidencias requeridas para auditorías y recomendaciones operativas.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 2: CONSULTAS FRECUENTES Y PLANTILLAS */}
      {/* ============================================================ */}
      {tabActiva === 'consultas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-card-subtle border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-sky-600" size={20} /> Banco de Consultas Frecuentes y Plantillas de Auditoría
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona cualquier consulta estructurada para que el Asesor Normativo la procese inmediatamente.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {PREGUNTAS_CATEGORIZADAS.map((cat, cIdx) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cIdx} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${cat.color} text-white shadow-xs`}>
                        <CatIcon size={16} />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">{cat.categoria}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.preguntas.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-slate-50 hover:bg-sky-50/50 p-4 rounded-xl border border-slate-200/80 hover:border-sky-300 transition-all flex flex-col justify-between group shadow-xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-extrabold text-slate-600">
                                {p.norma}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 group-hover:text-sky-950">
                              {p.titulo}
                            </h5>
                            <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                              {p.texto}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-200/60 flex justify-end">
                            <button
                              onClick={() => handleEnviarConsulta(p.texto, p.norma)}
                              className="w-full py-1.5 bg-[#002855] hover:bg-[#001f42] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <span>Consultar con IA</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 3: BASE DE CONOCIMIENTO INDEXADA */}
      {/* ============================================================ */}
      {tabActiva === 'base' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-card-subtle border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookMarked className="text-emerald-600" size={20} /> Base de Conocimiento Normativa Indexada
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documentos oficiales en Markdown (.md) que alimentan el motor RAG del Asesor ISO.
                </p>
              </div>

              {esSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalDocCustomAbierto(true)}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Solo el Super Administrador puede registrar nuevos documentos en la base de la IA"
                  >
                    <Plus size={15} strokeWidth={3} /> Agregar Documento Personalizado
                  </button>
                </div>
              )}
            </div>

            {/* Listado de Documentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentosConocimiento.map((doc, idx) => {
                const esNormaOficial = doc.tipo === 'NORMA_OFICIAL_MD';
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-sky-300 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          esNormaOficial 
                            ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {esNormaOficial ? 'NORMA OFICIAL ISO' : 'GUÍA / MATRIZ DE TRANSICIÓN'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                          ✓ Grounded
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-sky-700 shadow-xs shrink-0 mt-0.5">
                          <FileCode size={20} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                            {doc.nombre}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {doc.archivo}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {doc.clausulas_count ? `${doc.clausulas_count} cláusulas estructuradas` : `${doc.tamano_bytes || 0} bytes`}
                      </span>

                      <button
                        onClick={() => {
                          if (doc.id && (doc.id.startsWith('ISO-') || doc.clausulas_count)) {
                            setNormaExplorando(doc.id);
                            cargarClausulas(doc.id);
                            setTabActiva('clausulas');
                          } else {
                            toast.info(`Documento indexado: ${doc.nombre}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye size={13} /> Explorar Contenido
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 4: EXPLORADOR DE CLÁUSULAS ISO */}
      {/* ============================================================ */}
      {tabActiva === 'clausulas' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200 overflow-hidden">
          {/* Header y Filtros */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="text-sky-600" size={20} /> Explorador de Requisitos & Cláusulas ISO
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta los requisitos oficiales, interpretación para OOMAPASC y evidencia objetiva.
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={busquedaClausula}
                onChange={(e) => setBusquedaClausula(e.target.value)}
                placeholder="Buscar por número (ej. 4.1, 8.5.1) o texto..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Selector de Norma */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-700 mr-2">Norma Activa:</span>
            {normas.map(n => (
              <button
                key={n.id}
                onClick={() => {
                  setNormaExplorando(n.id);
                  cargarClausulas(n.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  normaExplorando === n.id
                    ? 'bg-[#002855] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{n.id.replace(/-/g, ' ')}</span>
                <span className="text-[10px] font-mono opacity-80">({n.total_clausulas})</span>
              </button>
            ))}
          </div>

          {/* Listado de Cláusulas */}
          <div className="p-6 overflow-y-auto max-h-[650px] space-y-4">
            {cargandoClausulas ? (
              <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-sky-600" />
                <span>Cargando cláusulas oficiales de la norma...</span>
              </div>
            ) : clausulasFiltradas.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
                <span className="font-medium text-slate-600">No se encontraron cláusulas para la norma o filtro seleccionado.</span>
                <button
                  onClick={() => cargarClausulas(normaExplorando || 'ISO-9001-2026')}
                  className="px-4 py-2 bg-[#002855] text-white rounded-xl font-bold text-xs hover:bg-[#0B192C] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw size={14} />
                  <span>Cargar Cláusulas Oficiales de {normaExplorando}</span>
                </button>
              </div>
            ) : (
              clausulasFiltradas.map((cl, idx) => {
                const esCapitulo = !!cl.es_capitulo || /^\d+\.?$/.test((cl.numero || '').trim()) || /^Cap[ií]tulo/i.test(cl.numero || '');

                if (esCapitulo) {
                  return (
                    <div
                      key={idx}
                      className="my-5 p-6 rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white shadow-xl border border-sky-900/60 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center text-center space-y-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/30 text-xs font-mono font-black uppercase tracking-wider shadow-inner">
                          <span>📌 CAPÍTULO PRINCIPAL DE LA NORMA</span>
                          <span>•</span>
                          <span>§ {cl.numero}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase max-w-3xl leading-snug">
                          {cl.titulo}
                        </h3>
                        {cl.requisito && cl.requisito.trim() && (
                          <div className="text-xs sm:text-sm text-sky-100/90 max-w-3xl leading-relaxed font-medium pt-1">
                            {renderContenidoDetallado(cl.requisito)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black bg-[#002855] text-white px-3 py-1 rounded-xl shadow-xs">
                          § {cl.numero}
                        </span>
                        <h4 className="font-black text-base text-slate-900 tracking-tight">{cl.titulo}</h4>
                      </div>
                      <button
                        onClick={() => {
                          handleEnviarConsulta(`Explícame a detalle el cumplimiento de la cláusula ${cl.numero} (${cl.titulo}) para el organismo OOMAPASC y qué evidencia objetiva se requiere.`, normaExplorando);
                        }}
                        className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#002855] border border-sky-200 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Bot size={14} className="text-sky-600" /> Consultar con Asesor IA →
                      </button>
                    </div>

                    {/* Requisito Oficial Centrado y Destacado en Grande */}
                    {cl.requisito && (
                      <div className="p-4 sm:p-5 bg-gradient-to-b from-sky-50/50 via-white to-slate-50/70 rounded-2xl border border-sky-200/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-center">
                          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-950 border border-sky-300/80 flex items-center gap-1.5 shadow-2xs">
                            <span>📜</span>
                            <span>Requisito Oficial de la Norma</span>
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 text-center leading-relaxed max-w-4xl mx-auto px-2">
                          {renderContenidoDetallado(cl.requisito)}
                        </div>
                      </div>
                    )}

                    {/* Interpretación Técnica y Administrativa */}
                    {cl.interpretacion && (
                      <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 shadow-2xs">
                        <span className="text-[11px] font-black text-[#002855] block mb-1.5 flex items-center gap-1.5">
                          <span>🛠️</span>
                          <span>Interpretación OOMAPASC (Áreas Técnicas y Administrativas):</span>
                        </span>
                        <div className="text-xs text-slate-800 leading-relaxed font-medium">
                          {renderContenidoDetallado(cl.interpretacion)}
                        </div>
                      </div>
                    )}

                    {/* Evidencias Objetivas & Criterio Universal de Auditoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
                      {cl.evidencia_objetiva && (
                        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 shadow-2xs flex flex-col justify-between">
                          <div>
                            <span className="text-[11px] font-black text-emerald-950 block mb-1.5 flex items-center gap-1.5">
                              <span>📑</span>
                              <span>Evidencias Objetivas Requeridas (Técnicas y Administrativas):</span>
                            </span>
                            <div className="text-xs text-emerald-950 leading-relaxed font-medium">
                              {renderContenidoDetallado(cl.evidencia_objetiva)}
                            </div>
                          </div>
                        </div>
                      )}
                      {cl.criterio_auditoria && (
                        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 shadow-2xs flex flex-col justify-between">
                          <div>
                            <span className="text-[11px] font-black text-purple-950 block mb-1.5 flex items-center gap-1.5">
                              <span>💡</span>
                              <span>Criterio Universal de Auditoría / Cierre:</span>
                            </span>
                            <div className="text-xs text-purple-950 leading-relaxed font-medium">
                              {renderContenidoDetallado(cl.criterio_auditoria)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: AGREGAR DOCUMENTO PERSONALIZADO A LA BASE */}
      {/* ============================================================ */}
      {modalDocCustomAbierto && (
        <ContenedorModal
          isOpen
          onClose={() => setModalDocCustomAbierto(false)}
          size="3xl"
          anchoMaximo="max-w-[88vw] xl:max-w-[1200px]"
          backdropClassName="bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#002855] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-sky-400" />
                <h3 className="font-extrabold text-sm text-white">Indexar Nuevo Documento a la Base de Conocimiento</h3>
              </div>
              <button
                onClick={() => setModalDocCustomAbierto(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Documento / Archivo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={docCustomForm.nombre}
                  onChange={(e) => setDocCustomForm({ ...docCustomForm, nombre: e.target.value })}
                  placeholder="Ej. directriz_auditoria_2026.md o manual_calidad_oomapasc.txt"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contenido de Texto / Markdown <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  value={docCustomForm.contenido}
                  onChange={(e) => setDocCustomForm({ ...docCustomForm, contenido: e.target.value })}
                  placeholder="Pega aquí el contenido, directrices, cláusulas específicas o manual para que el Asesor ISO lo aprenda y lo utilice en sus respuestas..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setModalDocCustomAbierto(false)}
                className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-xl hover:bg-slate-100 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDocumentoPersonalizado}
                disabled={guardandoDoc}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {guardandoDoc ? 'Indexando...' : 'Indexar en Base de Conocimiento'}
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ============================================================ */}
      {/* MODALES DE ACCIONES DIRECTAS DESDE EL AGENTE IA              */}
      {/* ============================================================ */}
      {/* 1. Modal Actualizar Indicador */}
      <ModalActualizarIndicadorIA
        isOpen={modalIndicadorIA.open}
        onClose={() => setModalIndicadorIA({ open: false, indicador: null })}
        indicadorPreseleccionado={modalIndicadorIA.indicador}
        indicadorInicial={modalIndicadorIA.indicador}
        indicadoresLista={contextoOperativoActual?.indicadores_area || []}
        indicadoresData={indicadoresData}
        setIndicadoresData={setIndicadoresData}
        usuarioLogueado={usuarioLogueado}
        registrarMovimiento={registrarMovimiento}
        onAccionConfirmada={handleAccionConfirmada}
      />

      {/* 2. Modal Gestionar Actividad y Subir Evidencia (AC / PM) */}
      <ModalGestionarActividadEvidenciaIA
        isOpen={modalActividadEvidenciaIA.open}
        onClose={() => setModalActividadEvidenciaIA({ open: false, accion: null, plan: null })}
        accionPreseleccionada={modalActividadEvidenciaIA.accion}
        planPreseleccionado={modalActividadEvidenciaIA.plan}
        accionesCorrectivas={accionesCorrectivas || []}
        setAccionesCorrectivas={setAccionesCorrectivas}
        planesMejora={planesMejora || []}
        setPlanesMejora={setPlanesMejora}
        puedeTodasAreas={puedeTodasAreas}
        usuarioLogueado={usuarioLogueado}
        registrarMovimiento={registrarMovimiento}
        onAccionConfirmada={handleAccionConfirmada}
      />

      {/* 3. Modal Ratificar Revisión de Documento > 1 Año */}
      <ModalRatificarDocumentoIA
        isOpen={modalRatificarDocIA.open}
        onClose={() => setModalRatificarDocIA({ open: false, documento: null })}
        documentoPreseleccionado={modalRatificarDocIA.documento}
        documentoInicial={modalRatificarDocIA.documento}
        documentos={documentos || []}
        documentosLista={documentos || []}
        setDocumentos={setDocumentos}
        usuarioLogueado={usuarioLogueado}
        registrarMovimiento={registrarMovimiento}
        onAccionConfirmada={handleAccionConfirmada}
      />
    </div>
  );
}
