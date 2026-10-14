import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Clock, 
  RefreshCw, 
  Eye, 
  X,
  FileSpreadsheet,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileEdit,
  ArrowDownToLine,
  SlidersHorizontal
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const REGISTROS_POR_PAGINA = 30;

export default function BitacoraView() {
  const { bitacora, usuariosConPresencia, usuarios, usuarioLogueado } = useSGC();

  // Estados de filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroSoloOnline, setFiltroSoloOnline] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  // Estado de paginación (30 registros máximo por página)
  const [paginaActual, setPaginaActual] = useState(1);

  // Módulos conocidos para filtro
  const MODULOS = [
    { id: 'DOCUMENTOS', label: 'Control Documental (Procedimientos y Registros)' },
    { id: 'ACCIONES_CORRECTIVAS', label: 'Acciones Correctivas (OOMRSC-20)' },
    { id: 'PLANES_MEJORA', label: 'Planes de Mejora (OOMRSC-21)' },
    { id: 'CATALOGOS', label: 'Configuración y Catálogos' },
    { id: 'SEGURIDAD', label: 'Gestión de Usuarios y Accesos' },
    { id: 'SESION', label: 'Sesiones del Sistema' },
  ];

  // Acciones conocidas de alto valor (excluye notificaciones de inactividad)
  const ACCIONES = [
    { id: 'ELIMINACION', label: 'Eliminaciones 🗑️' },
    { id: 'CREACION', label: 'Creaciones / Altas ➕' },
    { id: 'EDICION', label: 'Modificaciones / Actualizaciones ✏️' },
    { id: 'APROBACION', label: 'Aprobaciones Oficiales ✅' },
    { id: 'RECHAZO', label: 'Rechazos / Replanteos ⚠️' },
    { id: 'DESCARGA', label: 'Descargas de Información 📥' },
    { id: 'INICIO_SESION', label: 'Inicios de Sesión 🔑' },
    { id: 'CIERRE_SESION', label: 'Cierres de Sesión 🚪' },
  ];

  // Restablecer a página 1 cada vez que cambie cualquier filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroUsuario, filtroModulo, filtroAccion, busqueda, fechaDesde, fechaHasta, filtroSoloOnline]);

  // Botones rápidos de rango de fechas
  const aplicarRangoRapido = (tipo) => {
    const hoy = new Date();
    const formatoFecha = (d) => d.toISOString().slice(0, 10);
    const hoyStr = formatoFecha(hoy);

    switch (tipo) {
      case 'hoy':
        setFechaDesde(hoyStr);
        setFechaHasta(hoyStr);
        break;
      case '7dias': {
        const d7 = new Date();
        d7.setDate(hoy.getDate() - 7);
        setFechaDesde(formatoFecha(d7));
        setFechaHasta(hoyStr);
        break;
      }
      case '30dias': {
        const d30 = new Date();
        d30.setDate(hoy.getDate() - 30);
        setFechaDesde(formatoFecha(d30));
        setFechaHasta(hoyStr);
        break;
      }
      case '3meses': {
        const d90 = new Date();
        d90.setDate(hoy.getDate() - 90);
        setFechaDesde(formatoFecha(d90));
        setFechaHasta(hoyStr);
        break;
      }
      case 'anio2026':
        setFechaDesde('2026-01-01');
        setFechaHasta(hoyStr);
        break;
      case 'todo':
        setFechaDesde('');
        setFechaHasta('');
        break;
      default:
        break;
    }
  };

  // Filtrado ultrarrápido memorizado
  const movimientosFiltrados = useMemo(() => {
    return (bitacora || []).filter((item) => {
      // Requerimiento: "las notificaciones de bloqueo esas no las registres"
      if (item.accion === 'INACTIVIDAD_TIMEOUT' || item.accion === 'TIMEOUT' || item.accion === 'BLOQUEO_INACTIVIDAD') {
        return false;
      }

      // Filtro por usuario
      if (filtroUsuario && String(item.usuario_id) !== String(filtroUsuario) && item.usuario_nombre !== filtroUsuario) {
        return false;
      }

      // Filtro por módulo
      if (filtroModulo && item.modulo !== filtroModulo) {
        return false;
      }

      // Filtro por acción
      if (filtroAccion && item.accion !== filtroAccion) {
        return false;
      }

      // Filtro por rango de fechas (Desde / Hasta)
      if (item.timestamp) {
        const itemFecha = item.timestamp.slice(0, 10);
        if (fechaDesde && itemFecha < fechaDesde) return false;
        if (fechaHasta && itemFecha > fechaHasta) return false;
      }

      // Filtro de solo usuarios online
      if (filtroSoloOnline) {
        const u = usuariosConPresencia.find(usr => String(usr.id) === String(item.usuario_id));
        if (!u?.isOnline) return false;
      }

      // Búsqueda por texto libre
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const enDesc = (item.descripcion || '').toLowerCase().includes(query);
        const enFolio = (item.folio || '').toLowerCase().includes(query);
        const enDetalle = (item.detalles || '').toLowerCase().includes(query);
        const enUsuario = (item.usuario_nombre || '').toLowerCase().includes(query);
        const enArea = (item.usuario_area || '').toLowerCase().includes(query);
        if (!enDesc && !enFolio && !enDetalle && !enUsuario && !enArea) {
          return false;
        }
      }

      return true;
    });
  }, [bitacora, filtroUsuario, filtroModulo, filtroAccion, fechaDesde, fechaHasta, filtroSoloOnline, busqueda, usuariosConPresencia]);

  // Paginación estricta a 30 registros
  const totalRegistros = movimientosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const indiceFin = Math.min(indiceInicio + REGISTROS_POR_PAGINA, totalRegistros);
  const registrosPagina = useMemo(() => {
    return movimientosFiltrados.slice(indiceInicio, indiceFin);
  }, [movimientosFiltrados, indiceInicio, indiceFin]);

  // Contadores para KPIs ejecutivos
  const hoyStr = new Date().toISOString().slice(0, 10);
  const totalHoy = useMemo(() => {
    return (bitacora || []).filter(m => m.timestamp?.startsWith(hoyStr) && m.accion !== 'INACTIVIDAD_TIMEOUT').length;
  }, [bitacora, hoyStr]);

  const totalEliminaciones = useMemo(() => {
    return (bitacora || []).filter(m => m.accion === 'ELIMINACION').length;
  }, [bitacora]);

  const totalUsuariosOnline = useMemo(() => {
    return (usuariosConPresencia || []).filter(u => u.isOnline).length;
  }, [usuariosConPresencia]);

  // Exportar a CSV completo (exporta TODOS los registros del filtro activo, no solo los 30 de la página)
  const exportarCSV = () => {
    const headers = ['ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Área', 'Módulo', 'Acción', 'Folio SGC', 'Descripción', 'Detalles / Justificación'];
    const rows = movimientosFiltrados.map(m => [
      m.id,
      new Date(m.timestamp).toLocaleString('es-MX'),
      `"${m.usuario_nombre || ''}"`,
      `"${m.usuario_rol || ''}"`,
      `"${m.usuario_area || ''}"`,
      `"${m.modulo || ''}"`,
      `"${m.accion || ''}"`,
      `"${m.folio || ''}"`,
      `"${(m.descripcion || '').replace(/"/g, '""')}"`,
      `"${(m.detalles || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bitacora_Auditoria_SGC_${new Date().toISOString().slice(0, 10)}_(${movimientosFiltrados.length}_registros).csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a PDF de Auditoría Oficial (primeros 100 registros del filtro para optimizar peso)
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    doc.setFillColor(10, 20, 36);
    doc.rect(0, 0, 280, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('OOMAPASC - BITÁCORA DE AUDITORÍA Y TRAZABILIDAD SGC', 14, 11);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cumplimiento ISO 9001:2015 (7.5 y 9.2) • Registros: ${movimientosFiltrados.length} • Emisión: ${new Date().toLocaleString('es-MX')}`, 14, 17);

    const tableData = movimientosFiltrados.slice(0, 100).map(m => [
      new Date(m.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      m.usuario_nombre || 'Sistema',
      m.modulo || '-',
      m.accion || '-',
      m.folio || '-',
      m.descripcion || '',
      m.detalles ? (m.detalles.length > 50 ? m.detalles.substring(0, 50) + '...' : m.detalles) : '-'
    ]);

    autoTable(doc, {
      head: [['Fecha/Hora', 'Usuario', 'Módulo', 'Acción', 'Folio', 'Descripción', 'Motivo / Detalle']],
      body: tableData,
      startY: 26,
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 62, 98], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`Bitacora_SGC_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Badge para cada acción
  const getAccionBadge = (accion) => {
    switch (accion) {
      case 'ELIMINACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 size={11} /> ELIMINACIÓN
          </span>
        );
      case 'CREACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> CREACIÓN
          </span>
        );
      case 'EDICION':
      case 'MODIFICACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit size={11} /> MODIFICACIÓN
          </span>
        );
      case 'APROBACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
            <CheckCircle2 size={11} /> APROBACIÓN
          </span>
        );
      case 'RECHAZO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle size={11} /> RECHAZO
          </span>
        );
      case 'DESCARGA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowDownToLine size={11} /> DESCARGA
          </span>
        );
      case 'INICIO_SESION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <User size={11} /> ACCESO
          </span>
        );
      case 'CIERRE_SESION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            <User size={11} /> SALIDA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            <Activity size={11} /> {accion}
          </span>
        );
    }
  };

  const hayFiltrosActivos = filtroUsuario || filtroModulo || filtroAccion || busqueda || fechaDesde || fechaHasta || filtroSoloOnline;

  return (
    <div className="space-y-5">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-[#0A1424] to-[#1E3E62] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-sky-400/20 text-sky-300 border border-sky-400/30 uppercase font-mono">
                Auditoría ISO 9001:2015 • Cláusulas 7.5 y 9.2
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 text-xs">Paginación a 30 registros</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <History className="text-sky-400" size={26} />
              Bitácora de Movimientos y Trazabilidad SGC
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Consulta optimizada de operaciones, modificaciones documentales, altas/bajas de usuarios y eliminaciones.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 shadow-xs"
              title="Descargar todos los registros filtrados en formato CSV para Excel"
            >
              <FileSpreadsheet size={15} />
              Exportar CSV ({totalRegistros})
            </button>
            <button
              onClick={exportarPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-sky-500/20 transition-all"
              title="Descargar reporte formal en PDF"
            >
              <FileText size={15} />
              Reporte PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Registros</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalRegistros}</p>
            <p className="text-[10px] text-slate-500 font-medium">Movimientos coincidentes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Movimientos Hoy</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5">{totalHoy}</p>
            <p className="text-[10px] text-slate-500 font-medium">{new Date().toLocaleDateString('es-MX')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Activity size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Eliminaciones</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{totalEliminaciones}</p>
            <p className="text-[10px] text-slate-500 font-medium">Acciones críticas registradas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Trash2 size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Usuarios en Línea</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              {totalUsuariosOnline} <span className="text-xs text-slate-400 font-normal">/ {usuarios?.length || 0}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Conectados a la plataforma</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <User size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros Avanzada y Rango de Fechas */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Fila 1: Botones rápidos de fecha + Selector de Usuario Ultraligero */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Calendar size={14} className="text-sky-600" />
              Período:
            </span>
            <button
              onClick={() => aplicarRangoRapido('hoy')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => aplicarRangoRapido('7dias')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 transition-colors"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => aplicarRangoRapido('30dias')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 transition-colors"
            >
              Último Mes (30d)
            </button>
            <button
              onClick={() => aplicarRangoRapido('3meses')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 transition-colors"
            >
              3 Meses
            </button>
            <button
              onClick={() => aplicarRangoRapido('anio2026')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 transition-colors"
            >
              Año 2026
            </button>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => aplicarRangoRapido('todo')}
                className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X size={12} /> Limpiar Fechas
              </button>
            )}
          </div>

          {/* Selector de Usuario Ultraligero (Soporta 300+ usuarios sin renderizar tarjetas pesadas) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <User size={14} className="text-sky-600" />
              Filtrar Usuario:
            </span>
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-slate-800 max-w-[220px]"
            >
              <option value="">Todos los usuarios ({usuarios?.length || 0})</option>
              {usuariosConPresencia.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.isOnline ? '🟢 ' : '⚪ '} {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Inputs de búsqueda, filtros de fecha desde/hasta, módulo y acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Búsqueda por texto */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en descripción, folio, motivo..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Fecha Desde */}
          <div>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 outline-none bg-slate-50 focus:bg-white font-mono text-slate-700"
              title="Fecha Desde"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 outline-none bg-slate-50 focus:bg-white font-mono text-slate-700"
              title="Fecha Hasta"
            />
          </div>

          {/* Filtro Módulo */}
          <div>
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 outline-none bg-slate-50 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">Todos los Módulos</option>
              {MODULOS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro Acción */}
          <div>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-sky-500 outline-none bg-slate-50 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">Todas las Acciones</option>
              {ACCIONES.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de filtros y botón reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong>{totalRegistros === 0 ? 0 : indiceInicio + 1} - {indiceFin}</strong> de <strong>{totalRegistros}</strong> registros (Página {paginaActual} de {totalPaginas})
            </span>
            {filtroUsuario && (
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                Usuario: {usuariosConPresencia.find(u => String(u.id) === String(filtroUsuario))?.nombre || filtroUsuario}
              </span>
            )}
            {(fechaDesde || fechaHasta) && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono">
                {fechaDesde || 'Inicio'} → {fechaHasta || 'Hoy'}
              </span>
            )}
          </div>

          {hayFiltrosActivos && (
            <button
              onClick={() => {
                setFiltroUsuario('');
                setFiltroModulo('');
                setFiltroAccion('');
                setBusqueda('');
                setFechaDesde('');
                setFechaHasta('');
                setFiltroSoloOnline(false);
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold hover:underline"
            >
              <RefreshCw size={12} /> Restablecer todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal Paginada a 30 Registros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 font-mono tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Módulo / Folio</th>
                <th className="py-3 px-4">Descripción del Movimiento</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {registrosPagina.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <History size={38} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">No se encontraron movimientos registrados</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste los filtros de búsqueda o el rango de fechas para consultar.</p>
                  </td>
                </tr>
              ) : (
                registrosPagina.map((mov) => {
                  const esEliminacion = mov.accion === 'ELIMINACION';
                  return (
                    <tr 
                      key={mov.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${esEliminacion ? 'bg-rose-50/20' : ''}`}
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-800 font-bold text-xs">
                          {new Date(mov.timestamp).toLocaleDateString('es-MX', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </div>
                        <div className="font-mono text-slate-400 text-[10px]">
                          {new Date(mov.timestamp).toLocaleTimeString('es-MX', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Badge de Acción */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getAccionBadge(mov.accion)}
                      </td>

                      {/* Módulo y Folio */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                          {mov.modulo}
                        </span>
                        {mov.folio ? (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                            {mov.folio}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Descripción y motivo */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-bold text-slate-900 leading-snug">{mov.descripcion}</p>
                        {mov.detalles && (
                          <div className={`mt-1 text-[11px] leading-relaxed p-2 rounded-lg ${
                            esEliminacion 
                              ? 'bg-rose-50 text-rose-900 border border-rose-200' 
                              : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                          }`}>
                            {esEliminacion && <strong className="text-rose-700">Justificación: </strong>}
                            {mov.detalles}
                          </div>
                        )}
                      </td>

                      {/* Usuario Responsable */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {mov.usuario_nombre?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{mov.usuario_nombre || 'Sistema'}</p>
                            <p className="text-[10px] text-slate-500">{mov.usuario_rol} • {mov.usuario_area || 'OOMAPASC'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Botón Ver Detalle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setMovimientoSeleccionado(mov)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Inspeccionar movimiento"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación Estricta a 30 Registros */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> (Mostrando {registrosPagina.length} de {totalRegistros} movimientos)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Botones de páginas numéricas */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(totalPaginas, 7) }, (_, idx) => {
                  let numeroPagina = idx + 1;
                  if (totalPaginas > 7 && paginaActual > 4) {
                    numeroPagina = paginaActual - 3 + idx;
                    if (numeroPagina > totalPaginas) return null;
                  }
                  const isActiva = numeroPagina === paginaActual;
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={`w-8 h-8 rounded-lg font-bold transition-all text-xs ${
                        isActiva 
                          ? 'bg-[#0B192C] text-white shadow-xs' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  );
                }).filter(Boolean)}
              </div>

              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold"
                title="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalle de Movimiento */}
      {movimientoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-[85vw] xl:max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-sky-400" />
                <h3 className="font-extrabold text-sm">Registro de Auditoría #{movimientoSeleccionado.id}</h3>
              </div>
              <button 
                onClick={() => setMovimientoSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Timestamp</span>
                  <p className="font-mono font-bold text-slate-800">{new Date(movimientoSeleccionado.timestamp).toLocaleString('es-MX')}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Acción</span>
                  <div className="mt-0.5">{getAccionBadge(movimientoSeleccionado.accion)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Módulo</span>
                  <p className="font-bold text-slate-800">{movimientoSeleccionado.modulo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Folio SGC</span>
                  <p className="font-mono font-bold text-slate-800">{movimientoSeleccionado.folio || 'N/A'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Descripción del Suceso</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{movimientoSeleccionado.descripcion}</p>
              </div>

              {movimientoSeleccionado.detalles && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Detalle / Justificación Registrada</span>
                  <div className="mt-1 p-3 bg-slate-100 rounded-xl text-slate-800 font-mono text-[11px] whitespace-pre-wrap border border-slate-200">
                    {movimientoSeleccionado.detalles}
                  </div>
                </div>
              )}

              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-950 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {movimientoSeleccionado.usuario_nombre?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{movimientoSeleccionado.usuario_nombre}</p>
                  <p className="text-[11px] text-slate-600">{movimientoSeleccionado.usuario_email || 'Sin correo registrado'} • {movimientoSeleccionado.usuario_rol}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Área: {movimientoSeleccionado.usuario_area || 'Sin área'}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setMovimientoSeleccionado(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
