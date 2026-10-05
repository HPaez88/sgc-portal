import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSGC } from '../../SGCContext';
import {
  Plus,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  X,
  Trash2,
  Edit3,
  Search,
  Network,
  Link2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  History,
  Sparkles
} from 'lucide-react';
import BitacoraView from '../bitacora/BitacoraView';
import GobernanzaIAView from './GobernanzaIAView';
import ModalConfirmacionEliminar from '../common/ModalConfirmacionEliminar';
import { useToast } from '../common/Toast';
import {
  analizarImpactoDocumento,
  generarMatrizTrazabilidad,
  detectarReferenciasRotas
} from '../../services/trazabilidadService';
import { validarDocumento, validarReferencias, normalizarClave } from '../../services/validacion';
import { descargarBlob } from '../../services/apiClient';
import { acDesdeDocumento, movimientoVinculo } from '../../services/flujoService';

const PAGE_SIZE_MATRIZ = 25;

export default function DocumentosView({
  documentos = [],
  setDocumentos,
  puedeTodasAreas,
  areaUsuario
}) {
  const {
    areas,
    tiposDocumento = ['Manual', 'Procedimiento', 'Registro', 'Política', 'Instrucción', 'Formato', 'Guía'],
    estadosNormativos = ['APROBADO', 'EN_REVISION', 'BORRADOR', 'OBSOLETO'],
    usuarioLogueado,
    registrarMovimiento,
    setAccionesCorrectivas,
    puede
  } = useSGC();
  const toast = useToast();

  const safeDocs = documentos || [];

  // Pestaña activa: 'catalogo' o 'matriz'
  const [vistaActiva, setVistaActiva] = useState('catalogo');
  const [paginaMatriz, setPaginaMatriz] = useState(1);

  // Filtros del Catálogo
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  // Filtros de la Matriz de Trazabilidad
  const [busquedaMatriz, setBusquedaMatriz] = useState('');
  const [filtroTipoMatriz, setFiltroTipoMatriz] = useState('');
  const [filtroAreaMatriz, setFiltroAreaMatriz] = useState('');

  // Modales
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [docEnEdicion, setDocEnEdicion] = useState(null); // null = nuevo, objeto = editar
  const [docAEliminar, setDocAEliminar] = useState(null); // Para ModalConfirmacionEliminar

  // FICHA TÉCNICA DEL DOCUMENTO (Ventana emergente interactiva)
  const [docFicha, setDocFicha] = useState(null);
  const [tabFicha, setTabFicha] = useState('general'); // 'general' | 'rastreabilidad'
  const [filtroTipoFichaMenciones, setFiltroTipoFichaMenciones] = useState('');
  const [filtroTipoFichaReferencias, setFiltroTipoFichaReferencias] = useState('');

  // Formulario Documento
  const [formData, setFormData] = useState({
    clave: '',
    titulo: '',
    tipo: 'Procedimiento',
    area: '',
    version: 'Rev. 01',
    autor: '',
    estado: 'APROBADO',
    descripcion: '',
    referencias_usadas: []
  });

  // Estados del Buscador y Asignador de Interacciones (para 600+ procedimientos y 1500+ registros)
  const [busquedaAsignador, setBusquedaAsignador] = useState('');
  const [filtroTipoAsignador, setFiltroTipoAsignador] = useState('');
  const [claveDirectaInput, setClaveDirectaInput] = useState('');

  // Permisos unificados: la matriz vive en el contexto (que a su vez
  // la sincroniza con el backend vía /api/v1/catalogos/workflow).
  const puedeAdministrar = puede('eliminar') || puede('editar');

  // Badges de Estado Normativo Dinámicos
  const getEstadoBadge = (estado) => {
    const est = (estado || '').toUpperCase();
    if (est === 'APROBADO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (est === 'EN_REVISION') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (est === 'BORRADOR') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (est === 'OBSOLETO') return 'bg-rose-50 text-rose-600 border-rose-200';
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  // Mapa de análisis de referencias para toda la base documental
  const mapaImpactos = useMemo(() => {
    const mapa = {};
    safeDocs.forEach(doc => {
      mapa[doc.id || doc.clave] = analizarImpactoDocumento(doc, safeDocs);
    });
    return mapa;
  }, [safeDocs]);

  // Diagnóstico global de integridad documental (referencias que apuntan a la nada)
  const referenciasRotasGlobales = useMemo(
    () => detectarReferenciasRotas(safeDocs),
    [safeDocs],
  );

  // Impacto del documento abierto en la ficha técnica (para el puente hacia AC)
  const impactoDeFicha = useMemo(() => {
    if (!docFicha) return null;
    return mapaImpactos[docFicha.id || docFicha.clave]
      || analizarImpactoDocumento(docFicha, safeDocs);
  }, [docFicha, mapaImpactos, safeDocs]);

  // Lista filtrada del Catálogo
  const docsFiltrados = useMemo(() => {
    return safeDocs.filter(d => {
      if (filtroTipo && d.tipo !== filtroTipo) return false;
      if (filtroEstado && d.estado !== filtroEstado) return false;
      if (filtroArea && d.area !== filtroArea) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const texto = `${d.clave || ''} ${d.titulo || ''} ${d.area || ''} ${d.autor || ''} ${d.descripcion || ''}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [safeDocs, filtroTipo, filtroEstado, filtroArea, busqueda]);

  // Lista filtrada de la Matriz de Trazabilidad
  const docsMatrizFiltrados = useMemo(() => {
    return safeDocs.filter(d => {
      if (filtroTipoMatriz && d.tipo !== filtroTipoMatriz) return false;
      if (filtroAreaMatriz && d.area !== filtroAreaMatriz) return false;

      if (busquedaMatriz.trim()) {
        const q = busquedaMatriz.toLowerCase().trim();
        const mencionesStr = (mapaImpactos[d.id || d.clave]?.utilizadoEn || []).map(u => `${u.clave} ${u.titulo}`).join(' ');
        const referenciasStr = (d.referencias_usadas || []).join(' ');
        const texto = `${d.clave || ''} ${d.titulo || ''} ${d.tipo || ''} ${d.area || ''} ${mencionesStr} ${referenciasStr}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [safeDocs, filtroTipoMatriz, filtroAreaMatriz, busquedaMatriz, mapaImpactos]);

  // Paginación de la matriz (evita renderizar cientos de filas de golpe)
  const totalPaginasMatriz = Math.max(1, Math.ceil(docsMatrizFiltrados.length / PAGE_SIZE_MATRIZ));
  const docsMatrizPagina = useMemo(
    () => docsMatrizFiltrados.slice((paginaMatriz - 1) * PAGE_SIZE_MATRIZ, paginaMatriz * PAGE_SIZE_MATRIZ),
    [docsMatrizFiltrados, paginaMatriz],
  );

  // Abrir Ficha Técnica de un Documento
  const abrirFichaDocumento = (doc, tab = 'general') => {
    setDocFicha(doc);
    setTabFicha(tab);
    setFiltroTipoFichaMenciones('');
    setFiltroTipoFichaReferencias('');
  };

  // Abrir Modal para Nuevo Documento
  const abrirNuevoModal = () => {
    setDocEnEdicion(null);
    setFormData({
      clave: '',
      titulo: '',
      tipo: tiposDocumento[0] || 'Procedimiento',
      area: (!puedeTodasAreas && areaUsuario) ? areaUsuario : (areas[0] || 'Sistema de Gestión de Calidad'),
      version: 'Rev. 01',
      autor: usuarioLogueado?.nombre || '',
      estado: estadosNormativos[0] || 'APROBADO',
      descripcion: '',
      referencias_usadas: []
    });
    setBusquedaAsignador('');
    setFiltroTipoAsignador('');
    setClaveDirectaInput('');
    setModalFormularioAbierto(true);
  };

  // Abrir Modal para Editar Documento
  const abrirEditarModal = (doc) => {
    setDocEnEdicion(doc);
    setFormData({
      clave: doc.clave || '',
      titulo: doc.titulo || '',
      tipo: doc.tipo || tiposDocumento[0] || 'Procedimiento',
      area: doc.area || '',
      version: doc.version || 'Rev. 01',
      autor: doc.autor || '',
      estado: doc.estado || estadosNormativos[0] || 'APROBADO',
      descripcion: doc.descripcion || '',
      referencias_usadas: Array.isArray(doc.referencias_usadas) ? [...doc.referencias_usadas] : []
    });
    setBusquedaAsignador('');
    setFiltroTipoAsignador('');
    setClaveDirectaInput('');
    setModalFormularioAbierto(true);
  };

  // Guardar (Nuevo o Editado)
  const guardarDocumento = () => {
    const errorValidacion = validarDocumento(formData, safeDocs, docEnEdicion?.id ?? null);
    if (errorValidacion) {
      toast.warning(errorValidacion, { titulo: 'No se pudo guardar el documento' });
      return;
    }

    // Advertir (sin bloquear) si alguna referencia apunta a un documento inexistente
    const { faltantes } = validarReferencias(formData.referencias_usadas, safeDocs);
    if (faltantes.length > 0) {
      toast.warning(
        `Referencias sin documento en el catálogo: ${faltantes.join(', ')}. Se guardarán igualmente.`,
        { titulo: 'Trazabilidad incompleta', duracion: 7000 },
      );
    }

    if (docEnEdicion) {
      // Modificación
      const docActualizado = {
        ...docEnEdicion,
        ...formData,
        clave: formData.clave.trim().toUpperCase(),
        fecha: new Date().toISOString().split('T')[0]
      };

      setDocumentos(prev => (prev || []).map(d =>
        (d.id != null && String(d.id) === String(docEnEdicion.id))
          || (d.id == null && normalizarClave(d.clave) === normalizarClave(docEnEdicion.clave))
          ? docActualizado
          : d,
      ));

      // Si la ficha técnica estaba abierta para este documento, refrescarla
      if (docFicha && docFicha.id === docEnEdicion.id) {
        setDocFicha(docActualizado);
      }

      registrarMovimiento({
        modulo: 'DOCUMENTOS',
        accion: 'MODIFICACION',
        descripcion: `Actualización de documento oficial ${docActualizado.clave} - ${docActualizado.titulo}`,
        detalles: `Versión: ${docActualizado.version}. Tipo: ${docActualizado.tipo}. Formatos vinculados: ${docActualizado.referencias_usadas.length}`,
        folio: docActualizado.clave
      });
      toast.success(`Documento ${docActualizado.clave} actualizado correctamente.`);
    } else {
      // Alta Nueva
      const nuevo = {
        id: Date.now(),
        ...formData,
        clave: formData.clave.trim().toUpperCase(),
        fecha: new Date().toISOString().split('T')[0]
      };

      setDocumentos(prev => [...(prev || []), nuevo]);

      registrarMovimiento({
        modulo: 'DOCUMENTOS',
        accion: 'CREACION',
        descripcion: `Alta de nuevo documento en control documental: ${nuevo.clave} - ${nuevo.titulo}`,
        detalles: `Tipo: ${nuevo.tipo}, Área: ${nuevo.area}, Versión: ${nuevo.version}`,
        folio: nuevo.clave
      });
      toast.success(`Documento ${nuevo.clave} registrado en el catálogo documental.`);
    }

    setModalFormularioAbierto(false);
  };

  // Descargar Documento y Registrar en Bitácora
  const exportarDocumento = (doc) => {
    const impacto = mapaImpactos[doc.id || doc.clave] || analizarImpactoDocumento(doc, safeDocs);
    const menciones = impacto.utilizadoEn.map(u => `  * [${u.clave}] ${u.titulo} (${u.area})`).join('\n') || '  (Ninguno - Documento autónomo)';
    const referencias = (doc.referencias_usadas || []).map(r => `  * ${r}`).join('\n') || '  (Ninguna)';

    const contenido = `
================================================================================
                    ORGANISMO OPERADOR MUNICIPAL DE AGUA POTABLE,
                    ALCANTARILLADO Y SANEAMIENTO DE CAJEME
                         SISTEMA DE GESTIÓN DE CALIDAD
                             ISO 9001:2015 - 7.5.3
================================================================================

INFORMACIÓN DOCUMENTADA OFICIAL
--------------------------------------------------------------------------------
Clave Oficial:     ${doc.clave}
Título:            ${doc.titulo}
Tipo de Documento: ${doc.tipo}
Área Propietaria:  ${doc.area}
Versión / Edición: ${doc.version}
Estado Normativo:  ${doc.estado}
Fecha Emisión:     ${doc.fecha}
Responsable:       ${doc.autor}

DESCRIPCIÓN Y ALCANCE:
--------------------------------------------------------------------------------
${doc.descripcion || 'Documento oficial perteneciente al catálogo del Sistema de Gestión de Calidad.'}

RELACIÓN Y TRAZABILIDAD DOCUMENTAL (ISO 9001:2015):
--------------------------------------------------------------------------------
A) Documentos y Procedimientos que citan o exigen este registro/documento:
${menciones}

B) Formatos y Registros que utiliza este documento:
${referencias}
--------------------------------------------------------------------------------
CONTROL DE REVISIONES Y REGISTRO DE AUDITORÍA
Copia digital controlada descargada por: ${usuarioLogueado?.nombre || 'Usuario Autorizado'}
Fecha y hora de descarga: ${new Date().toLocaleString('es-MX')}
================================================================================
`;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    descargarBlob(blob, `${(doc.clave || 'DOC').replace(/\s+/g, '_')}_${(doc.titulo || 'documento').replace(/\s+/g, '_')}_${(doc.version || 'v1').replace(/\s+/g, '')}.txt`);

    // Registro de Auditoría en la Bitácora
    registrarMovimiento({
      modulo: 'DOCUMENTOS',
      accion: 'DESCARGA',
      descripcion: `Descarga de documento oficial del SGC: [${doc.clave}] ${doc.titulo}`,
      detalles: `Versión: ${doc.version}, Área: ${doc.area}. Formato descargado con trazabilidad.`,
      folio: doc.clave
    });
  };

  // Exportar Matriz Completa a CSV
  const exportarMatrizCSV = () => {
    const matriz = generarMatrizTrazabilidad(safeDocs);
    const headers = ['Clave', 'Titulo', 'Tipo', 'Area', 'Version', 'Estado', 'Documentos_Que_Lo_Citan', 'Formatos_Que_Utiliza'];

    const rows = matriz.map(item => {
      const d = item.documento;
      const imp = item.impacto;
      const citadoEnStr = imp.utilizadoEn.map(u => u.clave).join('; ') || 'Ninguno';
      const usaStr = (d.referencias_usadas || []).join('; ') || 'Ninguno';

      return [
        `"${d.clave || ''}"`,
        `"${(d.titulo || '').replace(/"/g, '""')}"`,
        `"${d.tipo || ''}"`,
        `"${d.area || ''}"`,
        `"${d.version || ''}"`,
        `"${d.estado || ''}"`,
        `"${citadoEnStr}"`,
        `"${usaStr}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    descargarBlob(
      new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
      `Matriz_Trazabilidad_Documental_SGC_ISO9001_${new Date().toISOString().split('T')[0]}.csv`,
    );

    registrarMovimiento({
      modulo: 'DOCUMENTOS',
      accion: 'DESCARGA',
      descripcion: 'Exportación masiva de la Matriz de Trazabilidad Documental a CSV',
      detalles: `Total de documentos analizados: ${safeDocs.length}`,
      folio: 'MATRIZ-SGC'
    });
    toast.success(`Matriz de trazabilidad exportada (${safeDocs.length} documentos).`);
  };

  // ── PUENTE INTER-MÓDULOS: Documento con impacto crítico → Acción Correctiva ──
  const abrirAccionCorrectiva = (doc) => {
    if (typeof setAccionesCorrectivas !== 'function') {
      toast.error('El módulo de Acciones Correctivas no está disponible en esta sesión.');
      return;
    }
    const impacto = mapaImpactos[doc.id || doc.clave] || analizarImpactoDocumento(doc, safeDocs);
    const nueva = acDesdeDocumento(doc, impacto);
    setAccionesCorrectivas(prev => [nueva, ...(prev || [])]);
    registrarMovimiento(movimientoVinculo({
      origenModulo: 'DOCUMENTOS',
      destinoModulo: 'ACCIONES_CORRECTIVAS',
      referencia: doc.clave,
      folio: nueva.folio_codigo,
      detalle: `Incumplimiento §7.5.3 sobre el documento [${doc.clave}] ${doc.titulo}. Impacto: ${impacto.nivelImpacto}.`,
    }));
    toast.success(
      `Acción Correctiva ${nueva.folio_codigo} creada en borrador desde el documento ${doc.clave}.`,
      { titulo: 'Vínculo ISO 7.5.3 → 10.2', duracion: 6000 },
    );
  };

  // Ejecutar eliminación confirmada
  const ejecutarEliminacion = (motivo) => {
    if (!docAEliminar) return;

    const doc = docAEliminar;
    const impacto = mapaImpactos[doc.id || doc.clave] || analizarImpactoDocumento(doc, safeDocs);

    setDocumentos(prev => (prev || []).filter(d =>
      (doc.id != null && String(d.id) === String(doc.id))
        ? false
        : normalizarClave(d.clave) !== normalizarClave(doc.clave),
    ));

    if (docFicha && docFicha.id === doc.id) {
      setDocFicha(null);
    }

    registrarMovimiento({
      modulo: 'DOCUMENTOS',
      accion: 'ELIMINACION',
      descripcion: `Eliminación de documento oficial [${doc.clave}] ${doc.titulo}`,
      detalles: `Motivo: ${motivo}. Documentos que lo citaban: ${impacto.cantidadUsos}`,
      folio: doc.clave
    });

    setDocAEliminar(null);
  };

  // Métodos del Asignador de Interacciones para 600+ procedimientos y 1500+ registros
  const agregarReferenciaDirecta = () => {
    const clave = claveDirectaInput.trim().toUpperCase();
    if (!clave) return;
    if ((formData.referencias_usadas || []).some(c => normalizarClave(c) === normalizarClave(clave))) {
      toast.warning(`La clave ${clave} ya está vinculada a este documento.`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      referencias_usadas: [...(prev.referencias_usadas || []), clave]
    }));
    setClaveDirectaInput('');
  };

  const alternarReferenciaUsada = (clave) => {
    setFormData(prev => {
      const actuales = prev.referencias_usadas || [];
      if (actuales.includes(clave)) {
        return { ...prev, referencias_usadas: actuales.filter(c => c !== clave) };
      } else {
        return { ...prev, referencias_usadas: [...actuales, clave] };
      }
    });
  };

  const desvincularReferencia = (clave) => {
    setFormData(prev => ({
      ...prev,
      referencias_usadas: (prev.referencias_usadas || []).filter(c => c !== clave)
    }));
  };

  // Candidatos disponibles en el asignador (filtrados por búsqueda y tipo, con tope a 30 para máxima velocidad)
  const candidatosAsignador = useMemo(() => {
    const q = busquedaAsignador.toLowerCase().trim();
    return safeDocs
      .filter(d => {
        // No vincularse a sí mismo
        if (d.clave === formData.clave) return false;
        if (docEnEdicion && d.id === docEnEdicion.id) return false;
        // Filtro por tipo en el asignador
        if (filtroTipoAsignador && d.tipo !== filtroTipoAsignador) return false;
        // Búsqueda por clave o título
        if (q) {
          const matchTexto = `${d.clave || ''} ${d.titulo || ''} ${d.area || ''}`.toLowerCase();
          return matchTexto.includes(q);
        }
        return true;
      });
  }, [safeDocs, formData.clave, docEnEdicion, filtroTipoAsignador, busquedaAsignador]);

  // Candidatos acotados a 30 elementos para evitar colapsar el DOM
  const candidatosMostrados = useMemo(() => {
    return candidatosAsignador.slice(0, 30);
  }, [candidatosAsignador]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-5 rounded-2xl shadow-card-subtle border border-slate-200/80 flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-sky-400 flex items-center justify-center shadow-md">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Control Documental & Trazabilidad</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                ISO 9001:2015 § 7.5.3
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gestión centralizada de procedimientos, formatos OOMRSC y matriz de trazabilidad cruzada
            </p>
          </div>
        </div>

        {/* Switch de Vistas y Botones de Acción */}
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setVistaActiva('catalogo')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${vistaActiva === 'catalogo'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Layers size={14} /> Catálogo ({safeDocs.length})
            </button>
            <button
              onClick={() => setVistaActiva('matriz')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${vistaActiva === 'matriz'
                ? 'bg-white text-[#0B192C] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Network size={14} className="text-sky-600" /> Matriz de Trazabilidad
            </button>
            <button
              onClick={() => setVistaActiva('bitacora')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${vistaActiva === 'bitacora'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <History size={14} className="text-amber-600" /> Bitácora
            </button>
            <button
              onClick={() => setVistaActiva('gobernanza_ia')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${vistaActiva === 'gobernanza_ia'
                ? 'bg-white text-purple-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Sparkles size={14} className="text-purple-600" /> Gobernanza IA & TI
              <span className="px-1.5 py-0.2 text-[9px] bg-purple-100 text-purple-800 rounded font-mono font-bold">POL-TI-01</span>
            </button>
          </div>

          {vistaActiva !== 'bitacora' && vistaActiva !== 'gobernanza_ia' && (
            <>
              <button
                onClick={exportarMatrizCSV}
                title="Exportar matriz completa con citas y referencias a CSV"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FileSpreadsheet size={15} /> Exportar Matriz
              </button>

              <button
                onClick={abrirNuevoModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} /> Nuevo Documento
              </button>
            </>
          )}
        </div>
      </div>

      {/* VISTA 1: CATÁLOGO DE DOCUMENTOS CON TARJETAS Y APERTURA DE FICHA */}
      {vistaActiva === 'catalogo' && (
        <div className="space-y-4">
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white p-4 rounded-xl shadow-card-subtle border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por clave (ej. OOMRSC-20, PR-CAL-01), título, área o autor..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="">Todos los tipos ({tiposDocumento.length})</option>
                {tiposDocumento.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="">Todos los estados ({estadosNormativos.length})</option>
                {estadosNormativos.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              <select
                value={filtroArea}
                onChange={e => setFiltroArea(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="">Todas las áreas ({areas.length})</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {(busqueda || filtroTipo || filtroEstado || filtroArea) && (
                <button
                  onClick={() => { setBusqueda(''); setFiltroTipo(''); setFiltroEstado(''); setFiltroArea(''); }}
                  className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Limpiar filtros"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* GRID DE DOCUMENTOS */}
          {docsFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <p className="text-5xl mb-4 opacity-40">📂</p>
              <p className="text-lg font-bold text-slate-700">No se encontraron documentos</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {docsFiltrados.map(doc => {
                const impacto = mapaImpactos[doc.id || doc.clave] || analizarImpactoDocumento(doc, safeDocs);
                const cantidadUsos = impacto.utilizadoEn.length;
                const cantidadReferencias = (doc.referencias_usadas || []).length;

                return (
                  <div
                    key={doc.id || doc.clave}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:shadow-card transition-all flex flex-col justify-between group overflow-hidden"
                  >
                    {/* ENCABEZADO DE TARJETA */}
                    <div className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black bg-[#0B192C] text-white px-2.5 py-1 rounded-md tracking-wider">
                            {doc.clave}
                          </span>
                          <span className="text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                            {doc.tipo}
                          </span>
                        </div>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getEstadoBadge(doc.estado)}`}>
                          {doc.estado}
                        </span>
                      </div>

                      <h3
                        onClick={() => abrirFichaDocumento(doc)}
                        className="font-bold text-slate-900 text-base mb-1.5 line-clamp-2 cursor-pointer group-hover:text-sky-700 transition-colors"
                        title="Clic para abrir ficha técnica completa"
                      >
                        {doc.titulo}
                      </h3>

                      {doc.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {doc.descripcion}
                        </p>
                      )}

                      {/* DATOS TÉCNICOS */}
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Área:</span>
                          <span className="font-bold text-slate-800 text-right truncate max-w-[170px]" title={doc.area}>{doc.area}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Versión:</span>
                          <span className="font-mono font-bold text-slate-800">{doc.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Fecha:</span>
                          <span className="font-medium text-slate-700">{doc.fecha}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Responsable:</span>
                          <span className="font-bold text-slate-800 text-right truncate max-w-[170px]" title={doc.autor}>{doc.autor}</span>
                        </div>
                      </div>

                      {/* INTERACCIONES Y MENCIÓN DE DOCUMENTOS */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {/* ¿Dónde se menciona? */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => abrirFichaDocumento(doc, 'rastreabilidad')}
                            className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${cantidadUsos > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            title="Ver en qué procedimientos se menciona (Rastreabilidad)"
                          >
                            <Link2 size={13} />
                            {cantidadUsos > 0 ? `Citado en ${cantidadUsos} documento(s)` : 'Sin citas externas'}
                          </button>

                          <button
                            onClick={() => abrirFichaDocumento(doc, 'general')}
                            className="text-[11px] text-sky-700 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver Ficha <ChevronRight size={12} />
                          </button>
                        </div>

                        {/* ¿Qué formatos utiliza? */}
                        {cantidadReferencias > 0 && (
                          <div className="flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => abrirFichaDocumento(doc, 'rastreabilidad')}
                              className="text-slate-600 hover:text-sky-700 font-medium flex items-center gap-1 truncate"
                            >
                              <FileText size={12} className="text-sky-600 shrink-0" />
                              <span>Utiliza {cantidadReferencias} formato(s)/registro(s)</span>
                            </button>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {(doc.referencias_usadas || []).slice(0, 2).join(', ')}{cantidadReferencias > 2 ? '...' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => exportarDocumento(doc)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors shadow-2xs"
                        title="Descargar documento con registro en bitácora"
                      >
                        <Download size={14} /> Descargar
                      </button>

                      <button
                        onClick={() => abrirFichaDocumento(doc)}
                        className="flex items-center justify-center p-1.5 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Abrir ficha técnica y documentos relacionados"
                      >
                        <Eye size={15} />
                      </button>

                      {puedeAdministrar && (
                        <>
                          <button
                            onClick={() => abrirEditarModal(doc)}
                            className="flex items-center justify-center p-1.5 text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                            title="Editar documento y vincular formatos"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => setDocAEliminar(doc)}
                            className="flex items-center justify-center p-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Eliminar documento del catálogo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: MATRIZ DE TRAZABILIDAD CON BUSCADOR INTERACTIVO EN TIEMPO REAL */}
      {vistaActiva === 'matriz' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200 overflow-hidden space-y-0">
          {/* Header Matriz */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-[#0B192C] text-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Network size={18} className="text-sky-400" /> Matriz Cruzada de Trazabilidad Documental
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Cumplimiento con el requisito ISO 9001:2015 § 7.5.3 (Control de la Información Documentada)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-sky-950/80 border border-sky-600/40 text-sky-300 px-3 py-1 rounded-lg">
                Mostrando {docsMatrizFiltrados.length} de {safeDocs.length} documentos
              </span>
            </div>
          </div>

          {/* DIAGNÓSTICO DE INTEGRIDAD DOCUMENTAL (ISO 9001:2015 § 7.5.3) */}
          {referenciasRotasGlobales.length > 0 && (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
              <div className="flex items-start gap-2.5">
                <Link2Off size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-amber-900">
                    {referenciasRotasGlobales.length} referencia(s) apuntan a documentos que no existen en el catálogo
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {referenciasRotasGlobales.slice(0, 12).map((h, i) => (
                      <span
                        key={`${h.origen}-${h.referencia}-${i}`}
                        className="font-mono text-[10px] font-bold bg-white text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded"
                        title={`${h.origenTitulo || h.origen} referencia a ${h.referencia}`}
                      >
                        {h.origen} → {h.referencia}
                      </span>
                    ))}
                    {referenciasRotasGlobales.length > 12 && (
                      <span className="text-[10px] font-bold text-amber-700">
                        +{referenciasRotasGlobales.length - 12} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FILTRO INTERACTIVO EN TIEMPO REAL PARA LA MATRIZ */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={busquedaMatriz}
                onChange={(e) => setBusquedaMatriz(e.target.value)}
                placeholder="Buscar en matriz por clave, nombre de procedimiento, formato o documento..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filtroTipoMatriz}
                onChange={(e) => setFiltroTipoMatriz(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="">Todos los tipos ({tiposDocumento.length})</option>
                {tiposDocumento.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select
                value={filtroAreaMatriz}
                onChange={(e) => setFiltroAreaMatriz(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="">Todas las áreas ({areas.length})</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {(busquedaMatriz || filtroTipoMatriz || filtroAreaMatriz) && (
                <button
                  onClick={() => { setBusquedaMatriz(''); setFiltroTipoMatriz(''); setFiltroAreaMatriz(''); }}
                  className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors"
                  title="Limpiar filtros de matriz"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Matriz */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="py-3 px-4">Clave Oficial</th>
                  <th className="py-3 px-4">Documento / Procedimiento</th>
                  <th className="py-3 px-4">Tipo / Área</th>
                  <th className="py-3 px-4">Documentos que lo Citan (Aguas Arriba)</th>
                  <th className="py-3 px-4">Registros que Utiliza (Aguas Abajo)</th>
                  <th className="py-3 px-4 text-center">Ficha Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {docsMatrizFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                      No se encontraron documentos en la matriz con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  docsMatrizPagina.map(doc => {
                    const impacto = mapaImpactos[doc.id || doc.clave] || analizarImpactoDocumento(doc, safeDocs);
                    const cantidadUsos = impacto.utilizadoEn.length;
                    const referencias = doc.referencias_usadas || [];

                    return (
                      <tr key={doc.id || doc.clave} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                          <button
                            onClick={() => abrirFichaDocumento(doc)}
                            className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-colors"
                            title="Ver ficha técnica"
                          >
                            {doc.clave}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            onClick={() => abrirFichaDocumento(doc)}
                            className="font-bold text-slate-900 hover:text-sky-700 cursor-pointer"
                          >
                            {doc.titulo}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">v{doc.version} • {doc.fecha}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{doc.tipo}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{doc.area}</div>
                        </td>
                        <td className="py-3 px-4">
                          {cantidadUsos === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Ninguno (Autónomo)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {impacto.utilizadoEn.map(u => (
                                <button
                                  key={u.clave}
                                  onClick={() => abrirFichaDocumento(u)}
                                  className="font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors"
                                  title={`Clic para ver ficha de: ${u.titulo}`}
                                >
                                  {u.clave}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {referencias.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Sin formatos asociados</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {referencias.map(refClave => {
                                const refDoc = safeDocs.find(d => d.clave === refClave);
                                return (
                                  <button
                                    key={refClave}
                                    onClick={() => refDoc ? abrirFichaDocumento(refDoc) : null}
                                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${refDoc
                                      ? 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 cursor-pointer'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    title={refDoc ? `Ver ficha técnica de ${refDoc.titulo}` : refClave}
                                  >
                                    📋 {refClave}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => abrirFichaDocumento(doc)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <Eye size={13} /> Abrir Ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación de la matriz */}
          {totalPaginasMatriz > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs">
              <span className="text-slate-500 font-mono">
                Página {paginaMatriz} de {totalPaginasMatriz}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={paginaMatriz === 1}
                  onClick={() => setPaginaMatriz(p => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaMatriz === totalPaginasMatriz}
                  onClick={() => setPaginaMatriz(p => Math.min(totalPaginasMatriz, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: BITÁCORA DE MOVIMIENTOS Y AUDITORÍA INTEGRADA */}
      {vistaActiva === 'bitacora' && (
        <div className="space-y-4">
          <BitacoraView />
        </div>
      )}

      {/* VISTA 4: POLÍTICA Y GOBERNANZA DE IA & TI (POL-TI-01) */}
      {vistaActiva === 'gobernanza_ia' && (
        <div className="space-y-4">
          <GobernanzaIAView usuarioLogueado={usuarioLogueado} />
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: FICHA TÉCNICA DEL DOCUMENTO & RELACIONES POR TIPO */}
      {/* ============================================================ */}
      {docFicha && (() => {
        const impacto = mapaImpactos[docFicha.id || docFicha.clave] || analizarImpactoDocumento(docFicha, safeDocs);
        const docsQueLoCitan = impacto.utilizadoEn || [];

        // Obtener objetos completos de los registros que utiliza
        const formatosQueUsa = (docFicha.referencias_usadas || []).map(refClave => {
          const encontrado = safeDocs.find(d => d.clave === refClave);
          return encontrado || { clave: refClave, titulo: 'Registro / Formato Oficial', tipo: 'Registro', area: docFicha.area, version: '1.0' };
        });

        // Tipos únicos presentes en los documentos que lo citan
        const tiposEnMenciones = Array.from(new Set(docsQueLoCitan.map(d => d.tipo))).filter(Boolean);
        // Filtrar menciones por tipo
        const mencionesFiltradas = filtroTipoFichaMenciones
          ? docsQueLoCitan.filter(d => d.tipo === filtroTipoFichaMenciones)
          : docsQueLoCitan;

        // Tipos únicos presentes en los formatos que usa
        const tiposEnReferencias = Array.from(new Set(formatosQueUsa.map(d => d.tipo))).filter(Boolean);
        // Filtrar referencias por tipo
        const referenciasFiltradas = filtroTipoFichaReferencias
          ? formatosQueUsa.filter(d => d.tipo === filtroTipoFichaReferencias)
          : formatosQueUsa;

        return typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center z-[99999] animate-fade-in p-2 sm:p-4 pt-3 sm:pt-5 md:pt-7 pb-10 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1700px] shadow-2xl overflow-hidden animate-slide-up border border-slate-200 mt-0 mb-6">
              {/* Encabezado Ficha */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-white/10 px-2 py-0.5 rounded text-sky-300">
                        {docFicha.clave}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                        {docFicha.tipo}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${getEstadoBadge(docFicha.estado)}`}>
                        {docFicha.estado}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-white mt-1 leading-snug">
                      {docFicha.titulo}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setDocFicha(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Pestañas de la Ficha Técnica */}
              <div className="bg-slate-100/90 px-6 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTabFicha('general')}
                    className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabFicha === 'general'
                      ? 'border-sky-600 text-sky-900 bg-white shadow-xs rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
                      }`}
                  >
                    <FileText size={15} className={tabFicha === 'general' ? 'text-sky-600' : 'text-slate-400'} />
                    Información General
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabFicha('rastreabilidad')}
                    className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabFicha === 'rastreabilidad'
                      ? 'border-sky-600 text-sky-900 bg-white shadow-xs rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
                      }`}
                  >
                    <Network size={15} className={tabFicha === 'rastreabilidad' ? 'text-sky-600' : 'text-slate-400'} />
                    Rastreabilidad
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tabFicha === 'rastreabilidad'
                      ? 'bg-sky-100 text-sky-800 font-extrabold'
                      : 'bg-slate-200 text-slate-700'
                      }`}>
                      {docsQueLoCitan.length + formatosQueUsa.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contenido Ficha */}
              <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto">
                {tabFicha === 'general' ? (
                  <div className="space-y-5 animate-fade-in">
                    {/* Datos Generales */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Área Propietaria</span>
                        <span className="font-bold text-slate-800">{docFicha.area}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Versión Vigente</span>
                        <span className="font-mono font-bold text-slate-800">{docFicha.version}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Fecha Emisión</span>
                        <span className="font-medium text-slate-700">{docFicha.fecha}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Responsable / Elaboró</span>
                        <span className="font-bold text-slate-800 truncate block" title={docFicha.autor}>{docFicha.autor}</span>
                      </div>
                    </div>

                    {/* Alcance / Descripción */}
                    {docFicha.descripcion && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-1">Descripción y Alcance</h4>
                        <p className="text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                          {docFicha.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Resumen y Acceso a Rastreabilidad */}
                    <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
                          <Network size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Rastreabilidad e Interacciones en el SGC</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Este documento está citado en <span className="font-bold text-amber-800">{docsQueLoCitan.length} documento(s)</span> y utiliza <span className="font-bold text-sky-800">{formatosQueUsa.length} formato(s)/registro(s)</span>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTabFicha('rastreabilidad')}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <span>Ver Rastreabilidad</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {/* Encabezado Rastreabilidad */}
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                          <Network size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Matriz de Rastreabilidad: {docFicha.clave}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Consulte los procedimientos que exigen este registro y los formatos operativos requeridos
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                        {docsQueLoCitan.length + formatosQueUsa.length} vínculos totales
                      </span>
                    </div>

                    {/* GRID DE RELACIONES: AGUAS ARRIBA Y AGUAS ABAJO LADO A LADO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* ========================================================= */}
                      {/* SECCIÓN A: DOCUMENTOS QUE CITAN ESTE DOCUMENTO (AGUAS ARRIBA) */}
                      {/* ========================================================= */}
                      <div className="border border-amber-200/80 rounded-xl overflow-hidden bg-amber-50/20 flex flex-col justify-between">
                        <div className="p-3.5 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Link2 size={16} className="text-amber-700" />
                            <div>
                              <h4 className="text-xs font-extrabold text-amber-950">
                                Documentos que Citan o Exigen este Documento ({docsQueLoCitan.length})
                              </h4>
                              <p className="text-[10px] text-amber-800">
                                Procedimientos y manuales que hacen referencia a este registro o documento
                              </p>
                            </div>
                          </div>

                          {/* Filtro por tipo de documento en menciones */}
                          {tiposEnMenciones.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => setFiltroTipoFichaMenciones('')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${filtroTipoFichaMenciones === ''
                                  ? 'bg-amber-800 text-white'
                                  : 'bg-white text-amber-900 border border-amber-300'
                                  }`}
                              >
                                Todos ({docsQueLoCitan.length})
                              </button>
                              {tiposEnMenciones.map(t => {
                                const count = docsQueLoCitan.filter(d => d.tipo === t).length;
                                return (
                                  <button
                                    key={t}
                                    onClick={() => setFiltroTipoFichaMenciones(t)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${filtroTipoFichaMenciones === t
                                      ? 'bg-amber-800 text-white'
                                      : 'bg-white text-amber-900 border border-amber-300'
                                      }`}
                                  >
                                    {t} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          {docsQueLoCitan.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-3 text-center">
                              Ningún otro documento cita actualmente a este registro. Es un documento autónomo.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                              {mencionesFiltradas.map(u => (
                                <div
                                  key={u.id || u.clave}
                                  onClick={() => abrirFichaDocumento(u)}
                                  className="p-2.5 bg-white border border-amber-200/90 rounded-lg hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer flex justify-between items-center group"
                                  title="Clic para abrir la ficha de este documento"
                                >
                                  <div className="truncate pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                        {u.clave}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500">{u.tipo}</span>
                                    </div>
                                    <div className="font-bold text-xs text-slate-800 truncate mt-1 group-hover:text-amber-800" title={u.titulo}>
                                      {u.titulo}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{u.area} • {u.version}</div>
                                  </div>
                                  <ExternalLink size={14} className="text-amber-600 opacity-60 group-hover:opacity-100 shrink-0" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* SECCIÓN B: FORMATOS Y REGISTROS QUE UTILIZA (AGUAS ABAJO) */}
                      {/* ========================================================= */}
                      <div className="border border-sky-200/80 rounded-xl overflow-hidden bg-sky-50/20 flex flex-col justify-between">
                        <div className="p-3.5 bg-sky-50/80 border-b border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-sky-700" />
                            <div>
                              <h4 className="text-xs font-extrabold text-sky-950">
                                Formatos y Registros que Utiliza ({formatosQueUsa.length})
                              </h4>
                              <p className="text-[10px] text-sky-800">
                                Formatos oficiales requeridos para la ejecución de este procedimiento
                              </p>
                            </div>
                          </div>

                          {/* Filtro por tipo de documento en referencias */}
                          {tiposEnReferencias.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => setFiltroTipoFichaReferencias('')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${filtroTipoFichaReferencias === ''
                                  ? 'bg-sky-800 text-white'
                                  : 'bg-white text-sky-900 border border-sky-300'
                                  }`}
                              >
                                Todos ({formatosQueUsa.length})
                              </button>
                              {tiposEnReferencias.map(t => {
                                const count = formatosQueUsa.filter(d => d.tipo === t).length;
                                return (
                                  <button
                                    key={t}
                                    onClick={() => setFiltroTipoFichaReferencias(t)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${filtroTipoFichaReferencias === t
                                      ? 'bg-sky-800 text-white'
                                      : 'bg-white text-sky-900 border border-sky-300'
                                      }`}
                                  >
                                    {t} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          {formatosQueUsa.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-3 text-center">
                              Este documento no tiene formatos o registros oficiales asignados.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                              {referenciasFiltradas.map(ref => {
                                const existeEnCatalogo = safeDocs.some(d => d.clave === ref.clave);
                                return (
                                  <div
                                    key={ref.clave}
                                    onClick={() => existeEnCatalogo ? abrirFichaDocumento(ref) : null}
                                    className={`p-2.5 bg-white border border-sky-200/90 rounded-lg transition-all flex justify-between items-center group ${existeEnCatalogo ? 'hover:border-sky-400 hover:shadow-xs cursor-pointer' : 'opacity-80'
                                      }`}
                                    title={existeEnCatalogo ? 'Clic para abrir la ficha de este registro' : 'Clave registrada en el sistema'}
                                  >
                                    <div className="truncate pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] font-extrabold bg-sky-100 text-sky-900 px-1.5 py-0.5 rounded">
                                          {ref.clave}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">{ref.tipo}</span>
                                      </div>
                                      <div className="font-bold text-xs text-slate-800 truncate mt-1 group-hover:text-sky-800" title={ref.titulo}>
                                        {ref.titulo}
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate">{ref.area} • {ref.version}</div>
                                    </div>
                                    {existeEnCatalogo && (
                                      <ExternalLink size={14} className="text-sky-600 opacity-60 group-hover:opacity-100 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Ficha */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportarDocumento(docFicha)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Download size={14} /> Descargar Formato
                  </button>

                  {/* PUENTE ISO 7.5.3 → 10.2: abrir AC por incumplimiento documental */}
                  {impactoDeFicha && impactoDeFicha.nivelImpacto !== 'BAJO' && (
                    <button
                      onClick={() => abrirAccionCorrectiva(docFicha)}
                      title="Abrir una Acción Correctiva por incumplimiento de control documental (ISO 9001 § 7.5.3 → § 10.2)"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <AlertTriangle size={14} /> Abrir Acción Correctiva
                    </button>
                  )}

                  {puedeAdministrar && (
                    <button
                      onClick={() => {
                        const target = docFicha;
                        setDocFicha(null);
                        abrirEditarModal(target);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                    >
                      <Edit3 size={14} /> Editar Documento
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setDocFicha(null)}
                  className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-xl hover:bg-slate-100 text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        ) : null;
      })()}

      {/* ============================================================ */}
      {/* MODAL 2: ALTA / EDICIÓN CON ASIGNADOR PARA 1500+ REGISTROS */}
      {/* ============================================================ */}
      {modalFormularioAbierto && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center z-[99999] animate-fade-in p-2 sm:p-4 pt-3 sm:pt-5 md:pt-7 pb-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1700px] shadow-2xl overflow-hidden animate-slide-up border border-slate-200 mt-0 mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] flex justify-between items-center text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-sky-500/20 rounded-lg text-sky-400">
                  {docEnEdicion ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {docEnEdicion ? `Editar Documento: ${docEnEdicion.clave}` : 'Registrar Nuevo Documento Oficial'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Control documental y vinculación de formatos SGC</p>
                </div>
              </div>
              <button
                onClick={() => setModalFormularioAbierto(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[82vh] overflow-y-auto">
              {/* COLUMNA IZQUIERDA: DATOS GENERALES DEL DOCUMENTO */}
              <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-2">
                {/* CLAVE Y TIPO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clave Oficial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.clave}
                      onChange={e => setFormData({ ...formData, clave: e.target.value.toUpperCase() })}
                      placeholder="Ej. OOMRSC-20, PR-POT-02"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Identificador único en el SGC</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Documento <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      {tiposDocumento.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* TÍTULO */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Completo del Documento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej. Procedimiento de Inspección de Redes Hidráulicas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  />
                </div>

                {/* ÁREA Y VERSIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Área Propietaria <span className="text-rose-500">*</span>
                    </label>
                    {!puedeTodasAreas && areaUsuario ? (
                      <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900">
                        {areaUsuario} (Área asignada)
                      </div>
                    ) : (
                      <select
                        value={formData.area}
                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        <option value="">Seleccionar área...</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Versión / Revisión
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={e => setFormData({ ...formData, version: e.target.value })}
                      placeholder="Ej. Rev. 01"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* AUTOR Y ESTADO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Responsable / Elaboró</label>
                    <input
                      type="text"
                      value={formData.autor}
                      onChange={e => setFormData({ ...formData, autor: e.target.value })}
                      placeholder="Nombre del responsable..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado Normativo</label>
                    <select
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      {estadosNormativos.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción y Alcance</label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describa brevemente el objetivo y alcance normativo..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA: ASIGNADOR DE INTERACCIONES DE ALTA ESCALA (600+ PROCEDIMIENTOS Y 1500+ REGISTROS) */}
              <div className="lg:col-span-7 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-sky-600" />
                      Formatos y Registros que Interactúan con este Documento
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Asigna qué formatos oficiales (ej. OOMRSC-20) se generan o utilizan durante la ejecución
                    </p>
                  </div>
                  <span className="font-mono text-xs font-black bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200">
                    {formData.referencias_usadas.length} asignados
                  </span>
                </div>

                {/* Formatos Actualmente Asignados (Chips con botón de eliminar rápido) */}
                {formData.referencias_usadas.length > 0 && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>Formatos Vinculados ({formData.referencias_usadas.length})</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, referencias_usadas: [] })}
                        className="text-rose-600 hover:underline"
                      >
                        Quitar todos
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {formData.referencias_usadas.map(ref => {
                        const refDoc = safeDocs.find(d => d.clave === ref);
                        return (
                          <span
                            key={ref}
                            className="inline-flex items-center gap-1 bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold px-2 py-1 rounded-lg"
                          >
                            <span className="font-mono">{ref}</span>
                            {refDoc && <span className="font-normal text-slate-500 max-w-[120px] truncate">({refDoc.titulo})</span>}
                            <button
                              type="button"
                              onClick={() => desvincularReferencia(ref)}
                              className="ml-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Desvincular formato"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Barra de Búsqueda Rápida + Entrada Directa por Clave */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={busquedaAsignador}
                      onChange={(e) => setBusquedaAsignador(e.target.value)}
                      placeholder="Buscar por clave o nombre (ej. OOMRSC, potabilización)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
                    />
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={claveDirectaInput}
                      onChange={(e) => setClaveDirectaInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarReferenciaDirecta(); } }}
                      placeholder="Clave directa..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={agregarReferenciaDirecta}
                      disabled={!claveDirectaInput.trim()}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                      title="Agregar clave directa"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Filtro por tipo en el Asignador */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setFiltroTipoAsignador('')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-all ${filtroTipoAsignador === ''
                      ? 'bg-[#0B192C] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    Todos los tipos
                  </button>
                  {tiposDocumento.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFiltroTipoAsignador(t)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-all ${filtroTipoAsignador === t
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Lista de Candidatos para Seleccionar / Asignar */}
                <div className="space-y-1.5 max-h-[360px] xl:max-h-[440px] overflow-y-auto pr-1">
                  {candidatosMostrados.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 text-center">
                      No se encontraron formatos coincidentes con la búsqueda.
                    </p>
                  ) : (
                    candidatosMostrados.map(d => {
                      const estaVinculado = formData.referencias_usadas.includes(d.clave);
                      return (
                        <div
                          key={d.id || d.clave}
                          className={`p-2 rounded-lg text-xs flex justify-between items-center transition-all border ${estaVinculado
                            ? 'bg-sky-50/70 border-sky-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className="truncate pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                {d.clave}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">{d.tipo}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">({d.area})</span>
                            </div>
                            <div className="text-xs text-slate-800 font-medium truncate mt-0.5" title={d.titulo}>
                              {d.titulo}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => alternarReferenciaUsada(d.clave)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-all ${estaVinculado
                              ? 'bg-sky-600 text-white hover:bg-rose-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-sky-600 hover:text-white border border-slate-200'
                              }`}
                          >
                            {estaVinculado ? '✓ Vinculado' : '+ Asignar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {candidatosAsignador.length > 30 && (
                  <p className="text-[10px] text-slate-400 text-center font-mono">
                    Mostrando 30 de {candidatosAsignador.length} coincidencias. Escribe en la búsqueda para afinar.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setModalFormularioAbierto(false)}
                className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-xl hover:bg-slate-100 text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDocumento}
                disabled={!formData.clave.trim() || !formData.titulo.trim() || !formData.area.trim()}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white font-bold rounded-xl disabled:opacity-50 text-xs transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} /> {docEnEdicion ? 'Guardar Cambios' : 'Registrar Documento'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN CON AVISO DE CITAS */}
      {/* ============================================================ */}
      {docAEliminar && (() => {
        const impacto = mapaImpactos[docAEliminar.id || docAEliminar.clave] || analizarImpactoDocumento(docAEliminar, safeDocs);
        const cantidadUsos = impacto.utilizadoEn.length;
        const listaMenciones = impacto.utilizadoEn.map(u => u.clave).join(', ');

        return (
          <ModalConfirmacionEliminar
            isOpen={true}
            onClose={() => setDocAEliminar(null)}
            onConfirm={ejecutarEliminacion}
            titulo={`Eliminar Documento [${docAEliminar.clave}]`}
            itemNombre={`${docAEliminar.clave} - ${docAEliminar.titulo}`}
            palabraRequerida="CONFIRMAR"
            requiereMotivo={true}
            descripcion={
              cantidadUsos > 0
                ? `Atención: Este documento/registro se menciona activamente en ${cantidadUsos} documento(s) del SGC (${listaMenciones}). Si lo elimina, esos procedimientos conservarán una referencia a un documento dado de baja.`
                : 'Esta acción eliminará de forma permanente el documento oficial y quedará asentada en la bitácora de auditoría.'
            }
          />
        );
      })()}
    </div>
  );
}