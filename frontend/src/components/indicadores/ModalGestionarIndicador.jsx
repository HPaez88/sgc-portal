import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Target,
  X,
  Save,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Building2,
  Calendar,
  Percent,
  CheckCircle2,
  Sparkles,
  Hash,
  FileSpreadsheet,
  HelpCircle,
  FileText,
  Download,
  FileDown,
  Check,
  Edit3,
  Activity,
  Compass,
  TrendingUp,
  Sliders,
  CheckSquare
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import {
  exportarFichaTecnicaPDF,
  descargarFichaTecnicaDocx,
  mapearResultadosMensualesIndicador
} from '../../services/fichaTecnicaExporter';
import {
  obtenerFichaTecnicaIndicador,
  CONFIG_AYUNTAMIENTO_CAJEME
} from '../../constants/fichasGubernamentales';
import { AREAS, DIRECCIONES, normalizarArea, normalizarDireccion, obtenerDireccionDeArea } from '../../constants/areas';

const PERIODICIDADES = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
const UNIDADES = [
  'Porcentaje',
  'Cantidad',
  'Días',
  'Actas',
  'Pesos ($)',
  'Metros Cúbicos (m³)',
  'Reportes',
  'Horas',
  'Eventos',
  'Llamadas',
  'Encuestas'
];

const EJES_PMD_CAJEME = [
  'Cajeme Limpio y Ordenado',
  'Cajeme con Crecimiento Económico y Desarrollo Sustentable',
  'Cajeme con Bienestar y Justicia Social',
  'Cajeme Seguro y con Paz Social',
  'Gobierno Abierto, Eficiente y Transparente'
];

const PROGRAMAS_PMD_CAJEME = [
  'Desarrollo con Servicios Públicos de Calidad',
  'Gestión Integral y Eficiente del Agua',
  'Infraestructura Hidráulica y Sanitaria para el Bienestar',
  'Eficiencia Comercial, Recaudación y Modernización',
  'Sostenibilidad Ambiental, Calidad del Agua y Saneamiento',
  'Fortalecimiento Institucional y Gestión de Calidad'
];

/**
 * Componente de área de texto auto-expandible.
 * Crece automáticamente con el contenido para que el texto nunca quede recortado.
 */
function AutoTextarea({
  value,
  onChange,
  placeholder = '',
  className = '',
  minRows = 2,
  disabled = false
}) {
  const textareaRef = useRef(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const minH = minRows * 22 + 16;
      textareaRef.current.style.height = `${Math.max(scrollH, minH)}px`;
    }
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      value={value || ''}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 transition-all resize-none leading-relaxed font-medium ${className}`}
    />
  );
}

export default function ModalGestionarIndicador({
  isOpen,
  onClose,
  indicadorAEditar = null,
  fichaData = null,
  onGuardarIndicador,
  onGuardarFichaPersonalizada,
  fichasPersonalizadas = {},
  valoresMensuales = {},
  direccionesDisponibles = [],
  procesosDisponibles = [],
  areasDisponibles = [],
  totalIndicadores = 100,
  listaIndicadores = []
}) {
  const toast = useToast();
  const esEdicion = !!indicadorAEditar || !!fichaData;
  const [descargandoDocx, setDescargandoDocx] = useState(false);

  // Catálogos oficiales unificados estrictos (OOMAPASC de Cajeme)
  const areasCatalogo = useMemo(() => {
    return [...AREAS].sort((a, b) => a.localeCompare('es'));
  }, []);

  const direccionesCatalogo = useMemo(() => {
    return [...DIRECCIONES];
  }, []);

  // Cálculo automático del siguiente número disponible
  const siguienteNumeroAutomatico = useMemo(() => {
    if (indicadorAEditar) {
      return indicadorAEditar.numero !== undefined ? indicadorAEditar.numero : indicadorAEditar.id;
    }
    if (fichaData) {
      return fichaData.indicador_numero ?? fichaData.indicador_id ?? 1;
    }
    if (listaIndicadores && listaIndicadores.length > 0) {
      const numeros = listaIndicadores
        .map(i => Number(i.numero !== undefined ? i.numero : i.id))
        .filter(n => !isNaN(n));
      if (numeros.length > 0) {
        return Math.max(...numeros) + 1;
      }
    }
    return totalIndicadores ?? 100;
  }, [indicadorAEditar, fichaData, listaIndicadores, totalIndicadores]);

  // Estados comunes compartidos (Fuente de la verdad unificada)
  const [numero, setNumero] = useState(siguienteNumeroAutomatico);
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('Porcentaje');
  const [periodicidad, setPeriodicidad] = useState('Trimestral');
  const [formula, setFormula] = useState('');

  // Estados de Configuración Operativa SGC (OOMRSC-05)
  const [direccion, setDireccion] = useState('Dir. General');
  const [area, setArea] = useState('Sistema de Gestión de Calidad');
  const [proceso, setProceso] = useState('Responsabilidad de la Dirección');
  const [metaAnual, setMetaAnual] = useState(85);
  const [metasTrimestrales, setMetasTrimestrales] = useState({ T1: 20, T2: 20, T3: 20, T4: 25 });
  const [impacto, setImpacto] = useState('Bajo');
  const [esMenor, setEsMenor] = useState(false);
  const [observacionDefault, setObservacionDefault] = useState('');

  // Estados de Ficha Técnica PMD (Ayuntamiento de Cajeme)
  const [ejePmd, setEjePmd] = useState('Cajeme Limpio y Ordenado');
  const [programaPmd, setProgramaPmd] = useState('Desarrollo con Servicios Públicos de Calidad');
  const [objetivoPmd, setObjetivoPmd] = useState('Gestión Moderna y Eficiente del Cobro de Agua');
  const [estrategiaPmd, setEstrategiaPmd] = useState('Monitoreo trimestral de metas operativas y administrativas');
  const [lineaAccion, setLineaAccion] = useState('Atención y seguimiento a compromisos institucionales');
  const [dimension, setDimension] = useState('Eficacia');
  const [tipoIndicador, setTipoIndicador] = useState('Gestión');
  const [sentidoIndicador, setSentidoIndicador] = useState('Ascendente');
  const [fuenteInformacion, setFuenteInformacion] = useState('Cuadro de Control de Desempeño OOMRSC-05 y registros de área');
  const [medioVerificacion, setMedioVerificacion] = useState('Reportes mensuales del Portal SGC y bitácoras operativas');
  const [supuestos, setSupuestos] = useState('Disponibilidad presupuestal y continuidad operativa normal.');

  // Atributos CREMAA
  const [cremaa, setCremaa] = useState({
    claridad: 'Permite comprender el resultado esperado de forma precisa',
    relevancia: 'Alineado a los compromisos de calidad y atención ciudadana',
    economia: 'Generación digital mediante el Portal SGC sin costo extra',
    monitoreable: 'Trazabilidad auditable en el formato OOMRSC-05',
    adecuado: 'Refleja fielmente la capacidad operativa del organismo',
    aportacion_marginal: 'Contribuye directamente al Plan Municipal de Desarrollo'
  });

  // Inicializar o sincronizar datos cuando cambia el indicador seleccionado
  const indicadorIdActual = indicadorAEditar?.id ?? fichaData?.indicador_id ?? null;

  useEffect(() => {
    if (!isOpen) return;

    const indBase = indicadorAEditar || fichaData?.indicador_original || null;
    const numId = indBase?.numero !== undefined ? indBase.numero : (indBase?.id ?? (fichaData?.indicador_numero ?? siguienteNumeroAutomatico));

    // Obtener Ficha técnica base o personalizada
    const customFicha = (fichasPersonalizadas && fichasPersonalizadas[numId]) || fichaData || null;
    const fichaCompleta = indBase ? obtenerFichaTecnicaIndicador(indBase, customFicha) : (fichaData || null);

    setNumero(numId);

    // 1. Datos compartidos
    const nombreInicial = indBase?.nombre || fichaCompleta?.identificacion?.nombre_indicador || '';
    setNombre(nombreInicial);
    setUnidad(indBase?.unidad || fichaCompleta?.identificacion?.unidad_medida || 'Porcentaje');
    setPeriodicidad(indBase?.periodicidad || fichaCompleta?.identificacion?.frecuencia_medicion || 'Trimestral');
    setFormula(indBase?.formula || fichaCompleta?.identificacion?.metodo_calculo || '');

    // 2. Datos Operativos SGC
    if (indBase) {
      const areaNorm = normalizarArea(indBase.area);
      const dirNorm = normalizarDireccion(indBase.direccion || obtenerDireccionDeArea(areaNorm));
      setDireccion(dirNorm);
      setArea(areaNorm);
      setProceso(indBase.proceso || (procesosDisponibles.length > 0 ? procesosDisponibles[0] : 'Responsabilidad de la Dirección'));
      setMetaAnual(indBase.meta_anual || indBase.meta || 85);
      setMetasTrimestrales({
        T1: indBase.metas_trimestrales?.T1 ?? 20,
        T2: indBase.metas_trimestrales?.T2 ?? 20,
        T3: indBase.metas_trimestrales?.T3 ?? 20,
        T4: indBase.metas_trimestrales?.T4 ?? 25
      });
      setImpacto(indBase.impacto || 'Bajo');
      setEsMenor(!!indBase.es_menor);
      setObservacionDefault(indBase.observacion_default || '');
    } else {
      setDireccion('Dir. General');
      setArea('Sistema de Gestión de Calidad');
      setProceso(procesosDisponibles[0] || 'Responsabilidad de la Dirección');
      setMetaAnual(85);
      setMetasTrimestrales({ T1: 20, T2: 20, T3: 20, T4: 25 });
      setImpacto('Bajo');
      setEsMenor(false);
      setObservacionDefault('');
    }

    // 3. Datos PMD Ayuntamiento
    const alineacion = fichaCompleta?.alineacion || {};
    const identificacion = fichaCompleta?.identificacion || {};
    const variables = fichaCompleta?.caracteristicas_variables || {};
    const cremaaData = fichaCompleta?.atributos_cremaa || {};

    setEjePmd(alineacion.eje_rector_pmd || 'Cajeme Limpio y Ordenado');
    setProgramaPmd(alineacion.programa_pmd || 'Desarrollo con Servicios Públicos de Calidad');
    setObjetivoPmd(alineacion.objetivo_pmd || 'Gestión Moderna y Eficiente del Cobro de Agua');
    setEstrategiaPmd(alineacion.estrategia_pmd || 'Monitoreo trimestral de metas operativas y administrativas');
    setLineaAccion(alineacion.linea_accion || 'Atención y seguimiento a compromisos institucionales');

    setDimension(identificacion.dimension || 'Eficacia');
    setTipoIndicador(identificacion.tipo_indicador || 'Gestión');
    setSentidoIndicador(identificacion.sentido_indicador || (indBase?.es_menor ? 'Descendente' : 'Ascendente'));
    setSupuestos(identificacion.supuestos || 'Disponibilidad presupuestal y continuidad operativa normal.');

    setFuenteInformacion(variables.fuente_informacion || 'Cuadro de Control de Desempeño OOMRSC-05 y registros de área');
    setMedioVerificacion(variables.medios_verificacion || 'Reportes mensuales del Portal SGC y bitácoras operativas');

    if (cremaaData) {
      setCremaa({
        claridad: cremaaData.claridad || 'Permite comprender el resultado esperado de forma precisa',
        relevancia: cremaaData.relevancia || 'Alineado a los compromisos de calidad y atención ciudadana',
        economia: cremaaData.economia || 'Generación digital mediante el Portal SGC sin costo extra',
        monitoreable: cremaaData.monitoreable || 'Trazabilidad auditable en el formato OOMRSC-05',
        adecuado: cremaaData.adecuado || 'Refleja fielmente la capacidad operativa del organismo',
        aportacion_marginal: cremaaData.aportacion_marginal || 'Contribuye directamente al Plan Municipal de Desarrollo'
      });
    }
  }, [isOpen, indicadorIdActual]);

  // Generar objeto unificado de Ficha Técnica para exportar o guardar
  const fichaActualParaExportar = useMemo(() => {
    return {
      indicador_id: Number(numero),
      indicador_numero: Number(numero),
      archivo_origen: `Ficha_${numero}_PMD_Cajeme.docx`,
      alineacion: {
        dependencia: CONFIG_AYUNTAMIENTO_CAJEME.dependencia,
        organismo: CONFIG_AYUNTAMIENTO_CAJEME.organismo,
        municipio: CONFIG_AYUNTAMIENTO_CAJEME.municipio,
        eje_rector_pmd: ejePmd,
        programa_pmd: programaPmd,
        objetivo_pmd: objetivoPmd,
        estrategia_pmd: estrategiaPmd,
        linea_accion: lineaAccion,
        objetivo_institucional: CONFIG_AYUNTAMIENTO_CAJEME.objetivo_institucional_defecto,
        tipo_objetivo: 'Cumplimiento'
      },
      identificacion: {
        nombre_indicador: nombre.trim(),
        definicion_indicador: nombre.trim(),
        dimension: dimension,
        tipo_indicador: tipoIndicador,
        sentido_indicador: sentidoIndicador,
        metodo_calculo: formula.trim(),
        variables_calculo: `Captura mensual de ${unidad} en ${area} (${proceso})`,
        unidad_medida: unidad,
        frecuencia_medicion: periodicidad,
        meta_anual: `${metaAnual}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
        linea_base: `${metaAnual}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
        supuestos: supuestos,
        distribucion_trimestral: {
          T1: `${metasTrimestrales.T1}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
          T2: `${metasTrimestrales.T2}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
          T3: `${metasTrimestrales.T3}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`,
          T4: `${metasTrimestrales.T4}${unidad === 'Porcentaje' ? '%' : ` ${unidad}`}`
        }
      },
      atributos_cremaa: cremaa,
      caracteristicas_variables: {
        fuente_informacion: fuenteInformacion,
        medios_verificacion: medioVerificacion,
        metodo_recopilacion: `Consolidación mensual de ${area} en Portal SGC`
      },
      transversalidad: {
        genero_mujeres: true,
        genero_hombres: true,
        otro: 'No aplica'
      },
      informacion_adicional: {
        titular_unidad: `Encargado de ${area}`,
        cargo_titular: `Titular del Área de ${area}`,
        fecha_elaboracion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        notas: `Alineado al formato oficial OOMRSC-05 y Presupuesto de Egresos.`
      }
    };
  }, [
    numero, nombre, ejePmd, programaPmd, objetivoPmd, estrategiaPmd, lineaAccion,
    dimension, tipoIndicador, sentidoIndicador, formula, unidad, periodicidad,
    metaAnual, metasTrimestrales, supuestos, cremaa, fuenteInformacion, medioVerificacion,
    area, proceso
  ]);

  // Resultados mensuales y semaforización en tiempo real para la Ficha
  const mesesSemaforizados = useMemo(() => {
    return mapearResultadosMensualesIndicador(
      numero,
      2026,
      valoresMensuales,
      metaAnual || 100,
      sentidoIndicador === 'Descendente'
    );
  }, [numero, valoresMensuales, metaAnual, sentidoIndicador]);

  // Exportar a PDF con diseño institucional azul del Ayuntamiento
  const handleDescargarPDF = () => {
    try {
      exportarFichaTecnicaPDF(fichaActualParaExportar, valoresMensuales);
      toast.success(`Ficha Técnica #${numero} descargada en PDF institucional del Ayuntamiento`);
    } catch (err) {
      toast.error(`Error al generar PDF: ${err.message}`);
    }
  };

  // Exportar a Word (.docx) con diseño institucional azul del Ayuntamiento
  const handleDescargarWord = async () => {
    setDescargandoDocx(true);
    try {
      await descargarFichaTecnicaDocx(fichaActualParaExportar, valoresMensuales);
      toast.success(`Ficha Técnica #${numero} descargada en formato Word (.docx) institucional`);
    } catch (err) {
      toast.error(`Error al generar Word: ${err.message}`);
    } finally {
      setDescargandoDocx(false);
    }
  };

  // Guardar unificado (Sincroniza tanto SGC como PMD)
  const handleSubmitIntegral = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!nombre.trim()) {
      toast.error('Por favor escribe el nombre descriptivo del indicador.');
      return;
    }

    const numFinal = Number(numero);

    // 1. Payload para el Cuadro de Control SGC (OOMRSC-05)
    const payloadSGC = {
      id: esEdicion ? (indicadorAEditar?.id ?? numFinal) : numFinal,
      numero: numFinal,
      nombre: nombre.trim(),
      direccion: normalizarDireccion(direccion),
      area: normalizarArea(area),
      proceso,
      periodicidad,
      unidad,
      meta: Number(metaAnual),
      meta_anual: Number(metaAnual),
      metas_trimestrales: {
        T1: Number(metasTrimestrales.T1),
        T2: Number(metasTrimestrales.T2),
        T3: Number(metasTrimestrales.T3),
        T4: Number(metasTrimestrales.T4)
      },
      impacto,
      es_menor: esMenor,
      formula: formula.trim(),
      observacion_default: observacionDefault.trim(),
      eje_pmd: ejePmd,
      programa_pmd: programaPmd,
      dimension: dimension,
      valor_default: esEdicion ? (indicadorAEditar?.valor_default ?? null) : null,
      accion_default: esEdicion ? (indicadorAEditar?.accion_default || 'NA') : 'NA'
    };

    // 2. Payload para la Ficha del Ayuntamiento de Cajeme
    const payloadFicha = {
      ...fichaActualParaExportar,
      numeroIndicador: numFinal,
      id: numFinal
    };

    // Guardar en Cuadro de Control SGC
    if (onGuardarIndicador) {
      onGuardarIndicador(payloadSGC, esEdicion);
    }

    // Guardar Ficha PMD Ayuntamiento
    if (onGuardarFichaPersonalizada) {
      onGuardarFichaPersonalizada(payloadFicha);
    }

    toast.success(
      `Configuración unificada del Indicador #${numFinal} guardada exitosamente (Ficha PMD y Cuadro SGC sincronizados).`
    );
    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="6xl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] w-full">
        
        {/* ============================================================ */}
        {/* CABECERA PRINCIPAL UNIFICADA (AZUL INSTITUCIONAL #0B192C/#2A78B0) */}
        {/* ============================================================ */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#2A78B0] text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0 shadow-inner">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-sky-400/20 text-sky-200 border border-sky-400/30 font-mono">
                  INDICADOR #{numero}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ficha Integral Homologada (SGC + PMD)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {esEdicion ? 'Configuración Integral de Indicador & Ficha PMD' : 'Alta de Nuevo Indicador Oficial'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDescargarWord}
              disabled={descargandoDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 text-sky-100 border border-sky-300/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Descargar Ficha Técnica en formato Word (.docx)"
            >
              <FileDown size={14} />
              <span>{descargandoDocx ? 'Generando...' : 'Descargar Word'}</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-100 border border-rose-300/40 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Descargar Ficha Técnica en PDF oficial"
            >
              <Download size={14} />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer ml-1"
              title="Cerrar ventana"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CUERPO DEL FORMULARIO CONTINUO (UNA SOLA VISTA SIN PESTAÑAS) */}
        {/* ============================================================ */}
        <form onSubmit={handleSubmitIntegral} className="overflow-y-auto flex-1 p-6 space-y-6 bg-slate-50/50">
          
          {/* SECCIÓN I: IDENTIFICACIÓN GENERAL Y PARÁMETROS COMPARTIDOS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A78B0]"></span>
                I. Identificación Oficial, Proceso Institucional y Periodicidad
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Parámetros Centrales del Catálogo
              </span>
            </div>

            {/* Grid Superior: Número, Periodicidad, Unidad, Dirección, Área y Proceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Número de Indicador */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Hash size={12} className="text-sky-600" />
                  Número Oficial:
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900"
                  required
                />
              </div>

              {/* Periodicidad de Medición */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-sky-600" />
                  Periodicidad:
                </label>
                <select
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {PERIODICIDADES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Percent size={12} className="text-sky-600" />
                  Unidad de Medida:
                </label>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {UNIDADES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Dirección Responsable */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Building2 size={12} className="text-sky-600" />
                  Dirección Responsable:
                </label>
                <select
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {direccionesCatalogo.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Área Operativa (Catálogo Oficial de 33 áreas) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Layers size={12} className="text-sky-600" />
                  Área Operativa:
                </label>
                <select
                  value={area}
                  onChange={(e) => {
                    const nuevaArea = normalizarArea(e.target.value);
                    setArea(nuevaArea);
                    const dirAuto = obtenerDireccionDeArea(nuevaArea);
                    if (dirAuto) setDireccion(dirAuto);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {areasCatalogo.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Proceso Institucional (Al lado del indicador) */}
              <div>
                <label className="block text-[11px] font-bold text-sky-900 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Activity size={12} className="text-sky-600" />
                  Proceso Institucional Oficial (SGC):
                </label>
                <select
                  value={proceso}
                  onChange={(e) => setProceso(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-sky-50/60 border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600 outline-none text-sky-950 cursor-pointer"
                >
                  {(procesosDisponibles.length > 0 ? procesosDisponibles : [
                    'Responsabilidad de la Dirección',
                    'Gestión de Calidad y Mejora Continua',
                    'Producción y Distribución de Agua Potable',
                    'Alcantarillado y Saneamiento',
                    'Servicios Comerciales y Facturación',
                    'Tecnologías de la Información y SCADA',
                    'Recursos Humanos y Capacitación',
                    'Adquisiciones y Almacenes'
                  ]).map(pr => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Nombre Oficial del Indicador */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Edit3 size={13} className="text-sky-600" />
                Nombre / Título Oficial del Indicador:
              </label>
              <AutoTextarea
                minRows={2}
                value={nombre}
                onChange={setNombre}
                placeholder="Escribe el nombre completo y descriptivo del indicador oficial..."
                className="text-xs sm:text-sm font-bold text-slate-900 border-slate-300"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Este título se utilizará de forma unificada tanto en el Cuadro OOMRSC-05 como en la Ficha Técnica para el Ayuntamiento.
              </span>
            </div>
          </div>

          {/* SECCIÓN II: METAS TRIMESTRALES (T1-T4) Y REGLAS SGC (OOMRSC-05) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                II. Metas Trimestrales (T1 a T4) y Meta Anual (Cuadro OOMRSC-05)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Meta Anual: {metaAnual}{unidad === 'Porcentaje' ? '%' : ` ${unidad}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Meta Anual Oficial */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Meta Anual Oficial:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={metaAnual}
                    onChange={(e) => setMetaAnual(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {unidad === 'Porcentaje' ? '%' : ''}
                  </span>
                </div>
              </div>

              {/* Sentido del Indicador */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Sentido del Indicador:
                </label>
                <select
                  value={sentidoIndicador}
                  onChange={(e) => {
                    setSentidoIndicador(e.target.value);
                    setEsMenor(e.target.value === 'Descendente');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  <option value="Ascendente">Ascendente (Mayor valor es mejor)</option>
                  <option value="Descendente">Descendente (Menor valor es mejor / Costos, Fugas)</option>
                </select>
              </div>

              {/* Clasificación de Impacto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Impacto ante Desviación:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImpacto('Bajo')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      impacto === 'Bajo'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Bajo (RC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImpacto('Alto')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      impacto === 'Alto'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Alto (AC OOMRSC-20)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Metas Trimestrales T1-T4 */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" />
                Metas Trimestrales Desglosadas (T1 a T4):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'T1', label: '1er Trimestre (T1)', desc: 'Ene - Mar' },
                  { key: 'T2', label: '2do Trimestre (T2)', desc: 'Abr - Jun' },
                  { key: 'T3', label: '3er Trimestre (T3)', desc: 'Jul - Sep' },
                  { key: 'T4', label: '4to Trimestre (T4)', desc: 'Oct - Dic' }
                ].map(trim => (
                  <div key={trim.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      {trim.label}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{trim.desc}</span>
                    <input
                      type="number"
                      step="any"
                      value={metasTrimestrales[trim.key] ?? ''}
                      onChange={(e) => setMetasTrimestrales({
                        ...metasTrimestrales,
                        [trim.key]: e.target.value === '' ? '' : Number(e.target.value)
                      })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN III: FÓRMULA OFICIAL Y OBSERVACIÓN DEFAULT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                III. Método de Cálculo y Observación Técnica
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Método de Cálculo / Fórmula */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Método de Cálculo / Fórmula Oficial:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={formula}
                  onChange={setFormula}
                  placeholder="Ej. (Total de reportes atendidos / Total de reportes recibidos) * 100"
                  className="font-mono text-xs bg-slate-50/60"
                />
              </div>

              {/* Observación / Criterio Default */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Observación / Criterio por Defecto:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={observacionDefault}
                  onChange={setObservacionDefault}
                  placeholder="Texto que aparecerá por defecto al abrir la captura mensual..."
                  className="text-xs"
                />
              </div>

            </div>
          </div>

          {/* SECCIÓN IV: ALINEACIÓN Y DATOS FICHA PMD (AYUNTAMIENTO DE CAJEME) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A78B0]"></span>
                IV. Ficha Técnica PMD (Ayuntamiento de Cajeme)
              </span>
              <span className="text-[11px] font-bold text-[#2A78B0] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Formato Institucional Oficial (Azul)
              </span>
            </div>

            {/* Eje y Programa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Eje Rector PMD:
                </label>
                <select
                  value={ejePmd}
                  onChange={(e) => setEjePmd(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {EJES_PMD_CAJEME.map(ej => (
                    <option key={ej} value={ej}>{ej}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Programa PMD:
                </label>
                <select
                  value={programaPmd}
                  onChange={(e) => setProgramaPmd(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  {PROGRAMAS_PMD_CAJEME.map(pr => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Objetivos, Estrategia y Línea de Acción (Auto-expandibles) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Objetivo PMD:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={objetivoPmd}
                  onChange={setObjetivoPmd}
                  placeholder="Objetivo alineado al PMD..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Estrategia PMD:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={estrategiaPmd}
                  onChange={setEstrategiaPmd}
                  placeholder="Estrategia institucional..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Línea de Acción:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={lineaAccion}
                  onChange={setLineaAccion}
                  placeholder="Línea de acción operativa..."
                />
              </div>
            </div>

            {/* Dimensión, Tipo y Supuestos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Dimensión:
                </label>
                <select
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  <option value="Eficacia">Eficacia (Cumplimiento de objetivos)</option>
                  <option value="Eficiencia">Eficiencia (Uso de recursos)</option>
                  <option value="Calidad">Calidad (Satisfacción del usuario)</option>
                  <option value="Economía">Economía (Impacto financiero)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tipo de Indicador:
                </label>
                <select
                  value={tipoIndicador}
                  onChange={(e) => setTipoIndicador(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 cursor-pointer"
                >
                  <option value="Gestión">Gestión (Operativo / Proceso)</option>
                  <option value="Estratégico">Estratégico (Institucional)</option>
                  <option value="Impacto">Impacto (Ciudadano)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Supuestos:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={supuestos}
                  onChange={setSupuestos}
                  placeholder="Supuestos operativos..."
                />
              </div>
            </div>

            {/* Fuentes de Información y Medios de Verificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Fuente de Información:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={fuenteInformacion}
                  onChange={setFuenteInformacion}
                  placeholder="Ej. Cuadro de Control OOMRSC-05 y reportes de área..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Medio de Verificación:
                </label>
                <AutoTextarea
                  minRows={2}
                  value={medioVerificacion}
                  onChange={setMedioVerificacion}
                  placeholder="Ej. Informes mensuales de auditoría y bitácoras operativas..."
                />
              </div>
            </div>

            {/* CUMPLIMIENTO MENSUAL OFICIAL (12 MESES CON SEMÁFORO DEL AYUNTAMIENTO) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity size={13} className="text-[#2A78B0]" />
                  Cumplimiento Mensual Oficial (Trazabilidad SGC & Ayuntamiento):
                </label>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ≥90%
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> 80-89%
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> ≤79%
                  </span>
                </div>
              </div>

              {/* Cuadrícula de 12 Meses */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#2A78B0] text-white text-[10px] font-bold font-mono tracking-wider">
                      <th className="py-2 px-1 border-r border-sky-400/40 text-left pl-3 text-[9.5px]">CONCEPTO</th>
                      {mesesSemaforizados.map(m => (
                        <th key={m.mes} className="py-2 px-1 border-r border-sky-400/30 last:border-none">
                          {m.mes}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50/50 text-[11px] font-bold">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-left text-slate-700 font-semibold text-[10.5px]">
                        Resultado Oficial
                      </td>
                      {mesesSemaforizados.map(m => (
                        <td
                          key={m.mes}
                          className="py-2.5 px-1 border-r border-slate-200 last:border-none font-mono"
                          style={{
                            backgroundColor: m.valor !== null ? m.colorHex : '#FFFFFF',
                            color: m.valor !== null ? '#FFFFFF' : '#94A3B8'
                          }}
                        >
                          {m.valor !== null ? (
                            <span className="font-extrabold tracking-tight drop-shadow-2xs">
                              {m.texto}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">−</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * Los porcentajes se calculan y semaforizan automáticamente a partir de las mediciones registradas en el Portal SGC. En los formatos oficiales exportados (PDF y Word), esta cuadrícula se integra con los mismos estándares gráficos del Ayuntamiento.
              </p>
            </div>

          </div>

          {/* SECCIÓN V: CRITERIOS DE EVALUACIÓN CREMAA (AYUNTAMIENTO DE CAJEME) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A78B0]"></span>
                V. Criterios de Evaluación CREMAA (Ayuntamiento de Cajeme)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check size={12} /> Cumple 6/6 atributos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Claro */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Claro (Preciso y sin ambigüedad):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.claridad}
                  onChange={(val) => setCremaa({ ...cremaa, claridad: val })}
                  placeholder="Permite comprender el resultado esperado de forma precisa"
                />
              </div>

              {/* Relevante */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Relevante (Aporta valor público):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.relevancia}
                  onChange={(val) => setCremaa({ ...cremaa, relevancia: val })}
                  placeholder="Alineado a los compromisos de calidad y atención ciudadana"
                />
              </div>

              {/* Económico */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Económico (Bajo costo de obtención):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.economia}
                  onChange={(val) => setCremaa({ ...cremaa, economia: val })}
                  placeholder="Generación digital mediante el Portal SGC sin costo extra"
                />
              </div>

              {/* Monitoreable */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Monitoreable (Sujeto a comprobación):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.monitoreable}
                  onChange={(val) => setCremaa({ ...cremaa, monitoreable: val })}
                  placeholder="Trazabilidad auditable en el formato OOMRSC-05"
                />
              </div>

              {/* Adecuado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Adecuado (Mide la magnitud exacta):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.adecuado}
                  onChange={(val) => setCremaa({ ...cremaa, adecuado: val })}
                  placeholder="Refleja fielmente la capacidad operativa del organismo"
                />
              </div>

              {/* Aporte Marginal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Aporte Marginal (Información no redundante):
                </label>
                <AutoTextarea
                  minRows={2}
                  value={cremaa.aportacion_marginal}
                  onChange={(val) => setCremaa({ ...cremaa, aportacion_marginal: val })}
                  placeholder="Contribuye directamente al Plan Municipal de Desarrollo"
                />
              </div>

            </div>
          </div>

        </form>

        {/* ============================================================ */}
        {/* PIE DEL MODAL UNIFICADO                                      */}
        {/* ============================================================ */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>Catálogo Oficial · Formato OOMRSC-05 Rev. 37 & Ficha PMD Cajeme</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleDescargarWord}
              disabled={descargandoDocx}
              className="px-3 py-2 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Descargar Ficha Técnica en formato Word (.docx)"
            >
              <FileDown size={14} className="text-[#2A78B0]" />
              <span>Descargar Word</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarPDF}
              className="px-3 py-2 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Descargar Ficha Técnica en PDF oficial"
            >
              <Download size={14} className="text-rose-600" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmitIntegral}
              className="px-5 py-2.5 text-xs font-black bg-[#002855] hover:bg-[#0B192C] text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30"
            >
              <Save size={15} />
              <span>Guardar Configuración Integral</span>
            </button>
          </div>
        </div>

      </div>
    </ContenedorModal>
  );
}
