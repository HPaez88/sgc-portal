import React, { useState } from 'react';
import { getRolColor } from '../../constants';
import { useSGC } from '../../SGCContext';
import { useToast } from '../common/Toast';
import ModalConfirmacionEliminar from '../common/ModalConfirmacionEliminar';
import ContenedorModal from '../common/ContenedorModal';
import {
  Users,
  Building,
  Building2,
  GitBranch,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertCircle,
  Crown,
  FileText,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  ClipboardCheck,
  Settings,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';

export default function SettingsView({ usuarios = [], setUsuarios }) {
  const {
    areas, setAreas,
    areasDetalle = [], setAreasDetalle,
    direcciones, setDirecciones,
    direccionesDetalle = [], setDireccionesDetalle,
    procesos, setProcesos,
    procesosDetalle = [], setProcesosDetalle,
    tiposDocumento = [], setTiposDocumento,
    estadosNormativos = [], setEstadosNormativos,
    documentos = [], setDocumentos,
    usuarioLogueado,
    registrarMovimiento
  } = useSGC();
  const toast = useToast();

  // Pestaña activa: 'areas' | 'direcciones' | 'procesos' | 'usuarios' | 'permisos' | 'documentales'
  const [tabActiva, setTabActiva] = useState('areas');
  const [busqueda, setBusqueda] = useState('');

  // Estados para catálogos documentales
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState('');
  const [tipoDocEditando, setTipoDocEditando] = useState(null);
  const [tipoDocNuevoNombre, setTipoDocNuevoNombre] = useState('');

  const [nuevoEstadoNormativo, setNuevoEstadoNormativo] = useState('');
  const [estadoNormativoEditando, setEstadoNormativoEditando] = useState(null);
  const [estadoNormativoNuevoNombre, setEstadoNormativoNuevoNombre] = useState('');

  // Modales
  const [modalArea, setModalArea] = useState({ show: false, esEdicion: false, data: { id: null, nombre: '', encargado: '', correo: '', direccion: '', telefono: '' } });
  const [modalDireccion, setModalDireccion] = useState({ show: false, esEdicion: false, data: { id: null, nombre: '', director: '', correo: '', siglas: '', telefono: '' } });
  const [modalProceso, setModalProceso] = useState({ show: false, esEdicion: false, data: { id: null, clave: '', nombre: '', tipo: 'Operativo', areaResponsable: '', areasInvolucradas: [] } });
  const [busquedaAreaModal, setBusquedaAreaModal] = useState('');
  const [modalUsuario, setModalUsuario] = useState({ show: false, esEdicion: false, data: { id: null, nombre: '', email: '', telefono: '', area: '', direccion: '', rol: 'Usuario', password: '' } });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', name: '', action: null });
  const [mensajeExito, setMensajeExito] = useState('');

  const usuariosList = Array.isArray(usuarios) ? usuarios : [];
  const safeSetUsuarios = typeof setUsuarios === 'function' ? setUsuarios : () => {};

  const notificar = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 3500);
  };

  // ==========================================
  // MANEJADORES DE CATÁLOGOS DOCUMENTALES (ISO 9001:2015)
  // ==========================================
  const agregarTipoDoc = () => {
    const limpio = nuevoTipoDoc.trim();
    if (!limpio) return;
    if (tiposDocumento.some(t => t.toLowerCase() === limpio.toLowerCase())) {
      toast.warning(`El tipo de documento "${limpio}" ya existe.`);
      return;
    }
    setTiposDocumento(prev => [...(prev || []), limpio]);
    setNuevoTipoDoc('');
    notificar(`✓ Tipo de documento "${limpio}" agregado al catálogo`);
    registrarMovimiento({
      modulo: 'CONFIGURACION',
      accion: 'CREACION',
      descripcion: `Alta de nuevo tipo de documento: "${limpio}"`,
      detalles: 'Agregado al catálogo de información documentada ISO 9001:2015',
      folio: 'CAT-DOC-TIPO'
    });
  };

  const guardarEdicionTipoDoc = (tipoOriginal) => {
    const nuevo = tipoDocNuevoNombre.trim();
    if (!nuevo || nuevo === tipoOriginal) {
      setTipoDocEditando(null);
      return;
    }
    if (tiposDocumento.some(t => t.toLowerCase() === nuevo.toLowerCase() && t !== tipoOriginal)) {
      toast.warning(`Ya existe otro tipo de documento con el nombre "${nuevo}".`);
      return;
    }
    setTiposDocumento(prev => (prev || []).map(t => t === tipoOriginal ? nuevo : t));
    if (typeof setDocumentos === 'function') {
      setDocumentos(prev => (prev || []).map(d => d.tipo === tipoOriginal ? { ...d, tipo: nuevo } : d));
    }
    setTipoDocEditando(null);
    setTipoDocNuevoNombre('');
    notificar(`✓ Tipo de documento actualizado a "${nuevo}"`);
    registrarMovimiento({
      modulo: 'CONFIGURACION',
      accion: 'MODIFICACION',
      descripcion: `Modificación de tipo de documento: "${tipoOriginal}" ➔ "${nuevo}"`,
      detalles: 'Se actualizaron las referencias en todos los documentos asociados',
      folio: 'CAT-DOC-TIPO'
    });
  };

  const eliminarTipoDoc = (tipo) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Solo el Super Administrador puede eliminar registros de los catálogos.');
      return;
    }
    const docsConEsteTipo = (documentos || []).filter(d => d.tipo === tipo);
    setConfirmDelete({
      show: true,
      type: 'Tipo de Documento',
      name: tipo,
      action: (motivo) => {
        setTiposDocumento(prev => (prev || []).filter(t => t !== tipo));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Tipo de documento "${tipo}" eliminado`);
        registrarMovimiento({
          modulo: 'CONFIGURACION',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de tipo de documento "${tipo}"`,
          detalles: `Motivo: ${motivo}. Documentos que lo utilizaban: ${docsConEsteTipo.length}`,
          folio: 'CAT-DOC-TIPO'
        });
      }
    });
  };

  const agregarEstadoNormativo = () => {
    const limpio = nuevoEstadoNormativo.trim().toUpperCase();
    if (!limpio) return;
    if (estadosNormativos.some(e => e.toUpperCase() === limpio)) {
      toast.warning(`El estado normativo "${limpio}" ya existe.`);
      return;
    }
    setEstadosNormativos(prev => [...(prev || []), limpio]);
    setNuevoEstadoNormativo('');
    notificar(`✓ Estado normativo "${limpio}" agregado`);
    registrarMovimiento({
      modulo: 'CONFIGURACION',
      accion: 'CREACION',
      descripcion: `Alta de nuevo estado normativo: "${limpio}"`,
      detalles: 'Agregado al flujo de información documentada ISO 9001:2015',
      folio: 'CAT-DOC-ESTADO'
    });
  };

  const guardarEdicionEstadoNormativo = (estadoOriginal) => {
    const nuevo = estadoNormativoNuevoNombre.trim().toUpperCase();
    if (!nuevo || nuevo === estadoOriginal) {
      setEstadoNormativoEditando(null);
      return;
    }
    if (estadosNormativos.some(e => e.toUpperCase() === nuevo && e !== estadoOriginal)) {
      toast.warning(`Ya existe otro estado normativo con el nombre "${nuevo}".`);
      return;
    }
    setEstadosNormativos(prev => (prev || []).map(e => e === estadoOriginal ? nuevo : e));
    if (typeof setDocumentos === 'function') {
      setDocumentos(prev => (prev || []).map(d => d.estado === estadoOriginal ? { ...d, estado: nuevo } : d));
    }
    setEstadoNormativoEditando(null);
    setEstadoNormativoNuevoNombre('');
    notificar(`✓ Estado normativo actualizado a "${nuevo}"`);
    registrarMovimiento({
      modulo: 'CONFIGURACION',
      accion: 'MODIFICACION',
      descripcion: `Modificación de estado normativo: "${estadoOriginal}" ➔ "${nuevo}"`,
      detalles: 'Se actualizaron los documentos con este estado normativo',
      folio: 'CAT-DOC-ESTADO'
    });
  };

  const eliminarEstadoNormativo = (estado) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Solo el Super Administrador puede eliminar registros de los catálogos.');
      return;
    }
    const docsConEsteEstado = (documentos || []).filter(d => d.estado === estado);
    setConfirmDelete({
      show: true,
      type: 'Estado Normativo',
      name: estado,
      action: (motivo) => {
        setEstadosNormativos(prev => (prev || []).filter(e => e !== estado));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Estado normativo "${estado}" eliminado`);
        registrarMovimiento({
          modulo: 'CONFIGURACION',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de estado normativo "${estado}"`,
          detalles: `Motivo: ${motivo}. Documentos con este estado: ${docsConEsteEstado.length}`,
          folio: 'CAT-DOC-ESTADO'
        });
      }
    });
  };

  // ==========================================
  // MANEJADORES DE ÁREAS
  // ==========================================
  const abrirNuevaArea = () => {
    setModalArea({
      show: true,
      esEdicion: false,
      data: { id: Date.now(), nombre: '', encargado: '', correo: '', direccion: direcciones[0] || 'Dir. General', telefono: '' }
    });
  };

  const abrirEditarArea = (area) => {
    setModalArea({
      show: true,
      esEdicion: true,
      data: { ...area }
    });
  };

  const guardarArea = () => {
    const { nombre, encargado, correo, direccion, telefono } = modalArea.data;
    if (!nombre.trim()) return toast.warning('El nombre del área es obligatorio.');
    if (!encargado.trim()) return toast.warning('El nombre del encargado actual es obligatorio.');
    if (!correo.trim()) return toast.warning('El correo institucional para avisos del SGC es obligatorio.');

    if (modalArea.esEdicion) {
      setAreasDetalle(prev => prev.map(a => a.id === modalArea.data.id ? modalArea.data : a));
      notificar(`✓ Área "${nombre}" actualizada correctamente`);
    } else {
      setAreasDetalle(prev => [...prev, modalArea.data]);
      notificar(`✓ Área "${nombre}" agregada al catálogo`);
    }
    setModalArea({ show: false, esEdicion: false, data: {} });
  };

  // Control de permisos estrictos: Solo Super Admin (Lic. Héctor Páez / Super Admin) puede eliminar datos de los catálogos
  const puedeEliminarCatalogo = usuarioLogueado?.rol === 'Super Admin' || usuarioLogueado?.nombre?.toLowerCase().includes('héctor');

  const eliminarArea = (area) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Únicamente el Super Administrador del SGC tiene permisos para eliminar registros de los catálogos.');
      return;
    }
    setConfirmDelete({
      show: true,
      type: 'Área',
      name: area.nombre,
      action: (motivo) => {
        setAreasDetalle(prev => prev.filter(a => a.id !== area.id));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Área "${area.nombre}" eliminada`);
        registrarMovimiento({
          modulo: 'CATALOGOS',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de Área "${area.nombre}" del catálogo oficial`,
          detalles: `Motivo: ${motivo} | Encargado previo: ${area.encargado || 'N/A'}`,
          folio: 'CAT-AREA'
        });
      }
    });
  };

  // ==========================================
  // MANEJADORES DE DIRECCIONES
  // ==========================================
  const abrirNuevaDireccion = () => {
    setModalDireccion({
      show: true,
      esEdicion: false,
      data: { id: Date.now(), nombre: '', director: '', correo: '', siglas: '', telefono: '' }
    });
  };

  const abrirEditarDireccion = (dir) => {
    setModalDireccion({
      show: true,
      esEdicion: true,
      data: { ...dir }
    });
  };

  const guardarDireccion = () => {
    const { nombre, director, correo, siglas } = modalDireccion.data;
    if (!nombre.trim()) return toast.warning('El nombre de la dirección es obligatorio.');
    if (!director.trim()) return toast.warning('El nombre del director en el puesto es obligatorio.');
    if (!correo.trim()) return toast.warning('El correo electrónico del director es obligatorio.');

    if (modalDireccion.esEdicion) {
      setDireccionesDetalle(prev => prev.map(d => d.id === modalDireccion.data.id ? modalDireccion.data : d));
      notificar(`✓ Dirección "${nombre}" actualizada correctamente`);
    } else {
      setDireccionesDetalle(prev => [...prev, modalDireccion.data]);
      notificar(`✓ Dirección "${nombre}" agregada al catálogo`);
    }
    setModalDireccion({ show: false, esEdicion: false, data: {} });
  };

  const eliminarDireccion = (dir) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Únicamente el Super Administrador del SGC tiene permisos para eliminar registros de los catálogos.');
      return;
    }
    setConfirmDelete({
      show: true,
      type: 'Dirección',
      name: dir.nombre,
      action: (motivo) => {
        setDireccionesDetalle(prev => prev.filter(d => d.id !== dir.id));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Dirección "${dir.nombre}" eliminada`);
        registrarMovimiento({
          modulo: 'CATALOGOS',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de Dirección "${dir.nombre}" del catálogo oficial`,
          detalles: `Motivo: ${motivo} | Director previo: ${dir.director || 'N/A'}`,
          folio: 'CAT-DIR'
        });
      }
    });
  };

  // ==========================================
  // MANEJADORES DE PROCESOS
  // ==========================================
  const abrirNuevoProceso = () => {
    setBusquedaAreaModal('');
    setModalProceso({
      show: true,
      esEdicion: false,
      data: {
        id: Date.now(),
        clave: `PR-${Date.now().toString().slice(-4)}`,
        nombre: '',
        tipo: 'Operativo',
        areaResponsable: areas[0] || '',
        areasInvolucradas: areas[0] ? [areas[0]] : []
      }
    });
  };

  const abrirEditarProceso = (proc) => {
    setBusquedaAreaModal('');
    const areasPrevias = Array.isArray(proc.areasInvolucradas) && proc.areasInvolucradas.length > 0
      ? proc.areasInvolucradas
      : (proc.areaResponsable ? [proc.areaResponsable] : []);
    setModalProceso({
      show: true,
      esEdicion: true,
      data: {
        ...proc,
        areasInvolucradas: areasPrevias
      }
    });
  };

  const toggleAreaInvolucrada = (areaNombre) => {
    setModalProceso(prev => {
      const actuales = prev.data.areasInvolucradas || [];
      const existe = actuales.includes(areaNombre);
      const nuevas = existe ? actuales.filter(a => a !== areaNombre) : [...actuales, areaNombre];
      return {
        ...prev,
        data: {
          ...prev.data,
          areasInvolucradas: nuevas
        }
      };
    });
  };

  const seleccionarTodasAreasProceso = () => {
    setModalProceso(prev => ({
      ...prev,
      data: {
        ...prev.data,
        areasInvolucradas: [...areas]
      }
    }));
  };

  const limpiarAreasProceso = () => {
    setModalProceso(prev => ({
      ...prev,
      data: {
        ...prev.data,
        areasInvolucradas: prev.data.areaResponsable ? [prev.data.areaResponsable] : []
      }
    }));
  };

  const guardarProceso = () => {
    const { clave, nombre, tipo, areaResponsable, areasInvolucradas } = modalProceso.data;
    if (!clave.trim()) return toast.warning('La clave del proceso es obligatoria.');
    if (!nombre.trim()) return toast.warning('El nombre del proceso es obligatorio.');

    // Asegurar que el área líder esté incluida
    const areasFinales = Array.from(new Set([
      ...(areasInvolucradas || []),
      ...(areaResponsable ? [areaResponsable] : [])
    ]));

    const procesoFinal = {
      ...modalProceso.data,
      areasInvolucradas: areasFinales
    };

    if (modalProceso.esEdicion) {
      setProcesosDetalle(prev => prev.map(p => p.id === modalProceso.data.id ? procesoFinal : p));
      notificar(`✓ Proceso "${nombre}" actualizado correctamente (${areasFinales.length} áreas involucradas)`);
    } else {
      setProcesosDetalle(prev => [...prev, procesoFinal]);
      notificar(`✓ Proceso "${nombre}" agregado al catálogo (${areasFinales.length} áreas involucradas)`);
    }
    setModalProceso({ show: false, esEdicion: false, data: {} });
  };

  const eliminarProceso = (proc) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Únicamente el Super Administrador del SGC tiene permisos para eliminar registros de los catálogos.');
      return;
    }
    setConfirmDelete({
      show: true,
      type: 'Proceso',
      name: proc.nombre,
      action: (motivo) => {
        setProcesosDetalle(prev => prev.filter(p => p.id !== proc.id));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Proceso "${proc.nombre}" eliminado`);
        registrarMovimiento({
          modulo: 'CATALOGOS',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de Proceso "${proc.nombre}" (${proc.clave || ''})`,
          detalles: `Motivo: ${motivo} | Tipo: ${proc.tipo || 'Operativo'}`,
          folio: 'CAT-PROC'
        });
      }
    });
  };

  // ==========================================
  // MANEJADORES DE USUARIOS
  // ==========================================
  const abrirNuevoUsuario = () => {
    const defaultArea = areas[0] || '';
    const areaInfo = areasDetalle.find(a => a.nombre === defaultArea);
    setModalUsuario({
      show: true,
      esEdicion: false,
      data: {
        id: Date.now(),
        nombre: '',
        email: '',
        telefono: '',
        area: defaultArea,
        direccion: areaInfo?.direccion || direcciones[0] || '',
        rol: 'Usuario',
        password: ''
      }
    });
  };

  const abrirEditarUsuario = (user) => {
    setModalUsuario({
      show: true,
      esEdicion: true,
      data: { ...user, newPassword: '' }
    });
  };

  const guardarUsuario = () => {
    const { nombre, email, area, rol } = modalUsuario.data;
    if (!nombre.trim()) return toast.warning('El nombre completo es obligatorio.');
    if (!email.trim()) return toast.warning('El correo institucional es obligatorio.');
    if (!area.trim()) return toast.warning('Debe asignar un Área al usuario obligatoriamente.');

    if (modalUsuario.esEdicion) {
      const updatedUser = { ...modalUsuario.data };
      if (updatedUser.newPassword) {
        updatedUser.password = updatedUser.newPassword;
      }
      delete updatedUser.newPassword;
      safeSetUsuarios(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      notificar(`✓ Usuario "${nombre}" actualizado correctamente`);
    } else {
      safeSetUsuarios(prev => [...prev, modalUsuario.data]);
      notificar(`✓ Usuario "${nombre}" creado con área "${area}"`);
    }
    setModalUsuario({ show: false, esEdicion: false, data: {} });
  };

  const eliminarUsuario = (user) => {
    if (!puedeEliminarCatalogo) {
      toast.error('Acceso Restringido: Únicamente el Super Administrador del SGC tiene permisos para eliminar registros de los catálogos.');
      return;
    }
    if (user.rol === 'Super Admin') return toast.error('No se puede eliminar la cuenta principal de Super Admin.');
    setConfirmDelete({
      show: true,
      type: 'Usuario',
      name: user.nombre,
      action: (motivo) => {
        safeSetUsuarios(prev => prev.filter(u => u.id !== user.id));
        setConfirmDelete({ show: false, type: '', name: '', action: null });
        notificar(`🗑️ Usuario "${user.nombre}" eliminado`);
        registrarMovimiento({
          modulo: 'SEGURIDAD',
          accion: 'ELIMINACION',
          descripcion: `Eliminación de cuenta de usuario "${user.nombre}" (${user.email})`,
          detalles: `Motivo: ${motivo} | Rol: ${user.rol} | Área: ${user.area || 'N/A'}`,
          folio: 'SEG-USER'
        });
      }
    });
  };

  // Filtrado de búsquedas
  const areasFiltradas = areasDetalle.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.encargado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.direccion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const direccionesFiltradas = direccionesDetalle.filter(d => 
    d.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.director?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.siglas?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const procesosFiltrados = procesosDetalle.filter(p => 
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.clave?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.areaResponsable?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const usuariosFiltrados = usuariosList.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.area?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Alerta de Éxito */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl shadow-2xs flex items-center justify-between gap-3 animate-slide-down">
          <p className="text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {mensajeExito}
          </p>
          <button onClick={() => setMensajeExito('')} className="text-emerald-400 hover:text-emerald-700 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Header Ejecutivo y Métricas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
              CONFIGURACIÓN GENERAL
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-500">ISO 9001:2015 §4.4 & §7.1.2</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            Estructura Organizacional y Control de Accesos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de áreas, direcciones, procesos, cuentas y matriz de permisos por área del OOMAPASC.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Áreas</span>
            <span className="text-base font-extrabold font-mono text-slate-900">{areasDetalle.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Direcciones</span>
            <span className="text-base font-extrabold font-mono text-slate-900">{direccionesDetalle.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Procesos</span>
            <span className="text-base font-extrabold font-mono text-slate-900">{procesosDetalle.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Usuarios</span>
            <span className="text-base font-extrabold font-mono text-slate-900">{usuariosList.length}</span>
          </div>
          <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200/70 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-sky-600 block tracking-wider">Perfiles</span>
            <span className="text-base font-extrabold font-mono text-sky-900">5 Roles</span>
          </div>
        </div>
      </div>

      {/* Alerta de Protección de Catálogos */}
      <div className="flex items-center justify-between p-3 px-4 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Protección de Integridad:</strong> La eliminación de registros en los catálogos está restringida exclusivamente al <strong>Super Administrador</strong> para salvaguardar la estructura del SGC.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-200/70 text-amber-900 border border-amber-300 shrink-0">
          {puedeEliminarCatalogo ? '🔓 Modo Super Admin Activo' : '🔒 Eliminación Bloqueada'}
        </span>
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setTabActiva('areas'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'areas'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/70'
          }`}
        >
          <Building size={15} />
          Catálogo de Áreas ({areasDetalle.length})
        </button>

        <button
          onClick={() => { setTabActiva('direcciones'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'direcciones'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/70'
          }`}
        >
          <Building2 size={15} />
          Catálogo de Direcciones ({direccionesDetalle.length})
        </button>

        <button
          onClick={() => { setTabActiva('procesos'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'procesos'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/70'
          }`}
        >
          <GitBranch size={15} />
          Catálogo de Procesos ({procesosDetalle.length})
        </button>

        <button
          onClick={() => { setTabActiva('usuarios'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'usuarios'
              ? 'bg-[#0B192C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/70'
          }`}
        >
          <Users size={15} />
          Usuarios del Sistema ({usuariosList.length})
        </button>

        <button
          onClick={() => { setTabActiva('permisos'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'permisos'
              ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/30'
              : 'bg-white text-sky-700 hover:bg-sky-50 border border-sky-200'
          }`}
        >
          <ShieldCheck size={15} />
          Matriz de Permisos & Perfiles
        </button>

        <button
          onClick={() => { setTabActiva('documentales'); setBusqueda(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            tabActiva === 'documentales'
              ? 'bg-[#0B192C] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText size={15} className="text-sky-500" />
          Catálogos Documentales ({tiposDocumento.length} tipos / {estadosNormativos.length} estados)
        </button>
      </div>

      {/* ============================================================ */}
      {/* PESTAÑA 1: CATÁLOGO DE ÁREAS */}
      {/* ============================================================ */}
      {tabActiva === 'areas' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Building size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Áreas del Organismo y Encargados Responsables
                </h3>
                <p className="text-[11px] text-slate-500">
                  Directorio de contacto institucional para notificaciones de No Conformidades, Planes de Mejora y Auditorías.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar área, encargado o correo..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 outline-none w-56 sm:w-64"
                />
              </div>
              <button
                onClick={abrirNuevaArea}
                className="px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Nueva Área
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nombre del Área</th>
                  <th className="py-3 px-4">Encargado Actual</th>
                  <th className="py-3 px-4">Correo Avisos SGC</th>
                  <th className="py-3 px-4">Dirección Adscrita</th>
                  <th className="py-3 px-4">Teléfono / Ext.</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No se encontraron áreas coincidentes con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  areasFiltradas.map((a) => (
                    <tr key={a.id || a.nombre} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.nombre}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={13} className="text-sky-600 shrink-0" />
                          <span>{a.encargado || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {a.correo ? (
                          <a href={`mailto:${a.correo}`} className="text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1">
                            <Mail size={12} /> {a.correo}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No registrado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {a.direccion || 'Sin dirección'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {a.telefono ? (
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" /> {a.telefono}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => abrirEditarArea(a)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar área y encargado"
                          >
                            <Edit size={14} />
                          </button>
                          {puedeEliminarCatalogo && (
                            <button
                              onClick={() => eliminarArea(a)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar área"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 2: CATÁLOGO DE DIRECCIONES */}
      {/* ============================================================ */}
      {tabActiva === 'direcciones' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Direcciones Operativas y Titulares
                </h3>
                <p className="text-[11px] text-slate-500">
                  Nivel directivo del organismo responsable de la aprobación y revisión por la dirección (ISO 9001 §9.3).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar dirección, director..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 outline-none w-56 sm:w-64"
                />
              </div>
              <button
                onClick={abrirNuevaDireccion}
                className="px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Nueva Dirección
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Siglas</th>
                  <th className="py-3 px-4">Nombre de la Dirección</th>
                  <th className="py-3 px-4">Director Actual en el Puesto</th>
                  <th className="py-3 px-4">Correo Institucional</th>
                  <th className="py-3 px-4">Áreas Adscritas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {direccionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No se encontraron direcciones coincidentes.
                    </td>
                  </tr>
                ) : (
                  direccionesFiltradas.map((d) => {
                    const numAreas = areasDetalle.filter(a => a.direccion === d.nombre).length;
                    return (
                      <tr key={d.id || d.nombre} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-extrabold text-purple-700">
                          <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                            {d.siglas || 'DIR'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {d.nombre}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Crown size={13} className="text-amber-500 shrink-0" />
                            <span>{d.director || 'Sin asignar'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {d.correo ? (
                            <a href={`mailto:${d.correo}`} className="text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1">
                              <Mail size={12} /> {d.correo}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {numAreas} áreas asignadas
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => abrirEditarDireccion(d)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar dirección y director"
                            >
                              <Edit size={14} />
                            </button>
                            {puedeEliminarCatalogo && (
                              <button
                                onClick={() => eliminarDireccion(d)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar dirección"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 3: CATÁLOGO DE PROCESOS */}
      {/* ============================================================ */}
      {tabActiva === 'procesos' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <GitBranch size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Mapa de Procesos del SGC (ISO 9001:2015)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Procesos estratégicos, operativos, de apoyo y evaluación con sus áreas líderes responsables.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar proceso o clave..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none w-56 sm:w-64"
                />
              </div>
              <button
                onClick={abrirNuevoProceso}
                className="px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Nuevo Proceso
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Clave</th>
                  <th className="py-3 px-4">Nombre del Proceso</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Área Líder</th>
                  <th className="py-3 px-4">Áreas que Interactúan (Auditorías SGC)</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {procesosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No se encontraron procesos coincidentes.
                    </td>
                  </tr>
                ) : (
                  procesosFiltrados.map((p) => {
                    const tipoColor = 
                      p.tipo === 'Estratégico' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      p.tipo === 'Operativo' ? 'bg-sky-100 text-sky-700 border-sky-200' :
                      p.tipo === 'Evaluación' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      'bg-slate-100 text-slate-700 border-slate-200';
                    const areasInvol = Array.isArray(p.areasInvolucradas) && p.areasInvolucradas.length > 0
                      ? p.areasInvolucradas
                      : (p.areaResponsable ? [p.areaResponsable] : []);
                    const totalAreas = areasInvol.length;

                    return (
                      <tr key={p.id || p.clave} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.clave}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.nombre}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tipoColor}`}>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building size={13} className="text-emerald-600 shrink-0" />
                            <span>{p.areaResponsable || 'Sin área asignada'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckSquare size={12} className="text-emerald-600" />
                                {totalAreas} {totalAreas === 1 ? 'área a auditar' : 'áreas a auditar'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {areasInvol.slice(0, 3).map((a, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                                  {a}
                                </span>
                              ))}
                              {areasInvol.length > 3 && (
                                <span 
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 cursor-help"
                                  title={areasInvol.slice(3).join(', ')}
                                >
                                  +{areasInvol.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => abrirEditarProceso(p)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Configurar proceso y áreas involucradas"
                            >
                              <Edit size={14} />
                            </button>
                            {puedeEliminarCatalogo && (
                              <button
                                onClick={() => eliminarProceso(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar proceso"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 4: USUARIOS DEL SISTEMA */}
      {/* ============================================================ */}
      {tabActiva === 'usuarios' && (
        <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Cuentas de Usuario y Asignación de Áreas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cada usuario tiene un área vinculada y un rol que delimita su alcance de visualización y generación de registros.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, email, área o rol..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 outline-none w-56 sm:w-64"
                />
              </div>
              <button
                onClick={abrirNuevoUsuario}
                className="px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Nuevo Usuario
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo Institucional</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Área Asignada</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Perfil / Rol</th>
                  <th className="py-3 px-4">Contraseña</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No se encontraron usuarios coincidentes.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const esSuperAdmin = u.rol === 'Super Admin';
                    const esEncargado = u.rol === 'Encargado';
                    const esAuditor = u.rol === 'Auditor';
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/60 transition-colors ${esSuperAdmin ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            {esSuperAdmin && <Crown size={13} className="text-amber-500" title="Super Administrador" />}
                            {esAuditor && <ClipboardCheck size={13} className="text-blue-500" title="Auditor Interno" />}
                            {esEncargado && <UserCheck size={13} className="text-emerald-500" title="Encargado de Área" />}
                            <span>{u.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {u.telefono || '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-sky-950">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/80 font-medium">
                            {u.area || 'Sin área asignada'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {u.direccion || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRolColor(u.rol)}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {u.password ? '••••••••' : <span className="text-slate-300 italic">Sin clave</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => abrirEditarUsuario(u)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar usuario"
                            >
                              <Edit size={14} />
                            </button>
                            {puedeEliminarCatalogo && !esSuperAdmin ? (
                              <button
                                onClick={() => eliminarUsuario(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : esSuperAdmin ? (
                              <span className="p-1.5 text-slate-300 cursor-not-allowed" title="Super Admin protegido">
                                <Lock size={14} />
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 5: MATRIZ DE PERMISOS & PERFILES (SOLICITADA POR EL USUARIO) */}
      {/* ============================================================ */}
      {tabActiva === 'permisos' && (
        <div className="space-y-6">
          {/* Tarjetas Informativas por Perfil */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Super Admin */}
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-card-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  SUPER ADMIN
                </span>
                <Crown size={16} className="text-amber-500" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Acceso Total e Irrestricto</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Control absoluto de configuración, eliminación de registros, gestión de catálogos y todas las áreas del organismo.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-amber-700 font-bold">
                Alcance: Global (Todas las Áreas)
              </div>
            </div>

            {/* Admin SGC */}
            <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-card-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                  ADMIN (EQUIPO SGC)
                </span>
                <ShieldCheck size={16} className="text-indigo-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Gestión y Aprobación SGC</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Revisa y aprueba formatos OOMRSC-20 y 21, asigna folios oficiales, programa auditorías y administra catálogos.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-indigo-700 font-bold">
                Alcance: Global (Todas las Áreas)
              </div>
            </div>

            {/* Auditor */}
            <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-card-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  AUDITOR INTERNO
                </span>
                <ClipboardCheck size={16} className="text-blue-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Evaluación y Cierre</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Puede generar AC y PM en <strong>cualquier área</strong> auditada, verificar evidencias objetivas y dictaminar eficacia de cierre.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-blue-700 font-bold">
                Alcance: Auditoría Multiárea
              </div>
            </div>

            {/* Encargado */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-card-subtle space-y-2 ring-1 ring-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ENCARGADO DE ÁREA
                </span>
                <UserCheck size={16} className="text-emerald-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Líder Operativo de su Área</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Solo genera y gestiona registros (AC, PM, Indicadores, Riesgos) de <strong>su área asignada</strong>. Envía a revisión SGC.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-emerald-700 font-bold">
                🔒 Alcance: Exclusivo de su Área
              </div>
            </div>

            {/* Usuario Operativo */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                  USUARIO OPERATIVO
                </span>
                <Users size={16} className="text-slate-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Consulta y Evidencias</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Visualiza los registros de su área y carga las evidencias de las actividades correctivas asignadas a su persona.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                🔒 Alcance: Exclusivo de su Área
              </div>
            </div>
          </div>

          {/* Tabla Matriz Cruzada de Módulos vs Roles */}
          <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <ShieldCheck size={18} className="text-sky-600" />
                Matriz Comparativa de Capacidades por Módulo del Sistema
              </h3>
              <p className="text-[11px] text-slate-500">
                Reglas de negocio y aislamiento de datos por perfil para asegurar el cumplimiento de la norma ISO 9001:2015.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Módulo SGC</th>
                    <th className="py-3 px-4 text-center">Super Admin</th>
                    <th className="py-3 px-4 text-center">Admin (SGC)</th>
                    <th className="py-3 px-4 text-center">Auditor</th>
                    <th className="py-3 px-4 text-center bg-emerald-50/40">Encargado de Área</th>
                    <th className="py-3 px-4 text-center">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp size={14} className="text-sky-600" /> Dashboard y Métricas
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total (Global)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total (Global)</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">Vista Global</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Su Área</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Su Área</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600" /> Acciones Correctivas (OOMRSC-20)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Crear / Aprobar / Reabrir</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Aprobar / Asignar Auditor</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">Crear Cualquiera / Cerrar</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Solo Su Área (Crear y Enviar)</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Ver Su Área / Cargar Evidencias</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={14} className="text-emerald-600" /> Planes de Mejora (OOMRSC-21)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Crear / Aprobar / Reabrir</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Aprobar / Asignar Auditor</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">Crear Cualquiera / Cerrar</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Solo Su Área (Crear y Enviar)</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Ver Su Área / Cargar Evidencias</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp size={14} className="text-blue-600" /> Indicadores de Calidad (86 métricas)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Metas y Configuración</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Supervisión y Semáforo</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">Lectura y Auditoría</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Captura de su Área</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Captura Asignada</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-600" /> Matriz de Riesgos
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total (Global)</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Supervisión Global</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">Auditoría de Controles</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Riesgos de su Área</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Consulta de su Área</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen size={14} className="text-amber-500" /> Catálogo de Documentos
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total y Eliminación</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Aprobar Revisiones</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">Auditoría Vigente</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/30">🔒 Subir Docs de su Área</td>
                    <td className="py-3 px-4 text-center text-slate-600">🔒 Consulta de Procedimientos</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-indigo-600" /> Auditorías Internas
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total y Programa Anual</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Planificar y Asignar</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">Ejecutar y Dictaminar</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-600 bg-emerald-50/30">Auditado (Su Área)</td>
                    <td className="py-3 px-4 text-center text-slate-500">Auditado (Su Proceso)</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Settings size={14} className="text-slate-600" /> Configuración y Catálogos
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">Total y Cuentas</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">Gestión de Catálogos</td>
                    <td className="py-3 px-4 text-center text-slate-400">Solo Lectura</td>
                    <td className="py-3 px-4 text-center text-slate-300 bg-emerald-50/30">— Sin Acceso</td>
                    <td className="py-3 px-4 text-center text-slate-300">— Sin Acceso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 6: CATÁLOGOS DOCUMENTALES (TIPOS Y ESTADOS NORMATIVOS) */}
      {/* ============================================================ */}
      {tabActiva === 'documentales' && (
        <div className="space-y-6">
          {/* Tarjeta 1: Tipos de Documentos */}
          <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    Tipos de Información Documentada (ISO 9001:2015)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Clasificación oficial de documentos (Manuales, Procedimientos, Registros OOMRSC, Políticas, etc.)
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded-lg border border-slate-200 shrink-0">
                {tiposDocumento.length} tipos registrados
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Formulario Agregar Tipo */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={nuevoTipoDoc}
                  onChange={(e) => setNuevoTipoDoc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') agregarTipoDoc(); }}
                  placeholder="Nuevo tipo de documento (ej. Instructivo de Trabajo, Catálogo)..."
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
                <button
                  onClick={agregarTipoDoc}
                  disabled={!nuevoTipoDoc.trim()}
                  className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#152e4d] disabled:opacity-50 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus size={14} /> Agregar Tipo
                </button>
              </div>

              {/* Grid / Lista de Tipos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tiposDocumento.map((tipo) => {
                  const countDocs = (documentos || []).filter(d => d.tipo === tipo).length;
                  const enEdicion = tipoDocEditando === tipo;

                  return (
                    <div
                      key={tipo}
                      className="p-3 bg-white border border-slate-200/90 rounded-xl hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      {enEdicion ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={tipoDocNuevoNombre}
                            onChange={(e) => setTipoDocNuevoNombre(e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-sky-400 rounded text-xs font-bold outline-none"
                            autoFocus
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => setTipoDocEditando(null)}
                              className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => guardarEdicionTipoDoc(tipo)}
                              className="px-2.5 py-0.5 bg-sky-600 text-white rounded text-[10px] font-bold shadow-2xs"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {tipo}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                              {countDocs} {countDocs === 1 ? 'doc' : 'docs'}
                            </span>
                          </div>

                          <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => { setTipoDocEditando(tipo); setTipoDocNuevoNombre(tipo); }}
                              className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded"
                              title="Editar nombre del tipo"
                            >
                              <Edit size={13} />
                            </button>
                            {puedeEliminarCatalogo && (
                              <button
                                onClick={() => eliminarTipoDoc(tipo)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title={countDocs > 0 ? `Eliminar (usado en ${countDocs} documentos)` : 'Eliminar tipo'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Estados Normativos */}
          <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200/80 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    Estados Normativos del Flujo Documental
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fases del ciclo de vida de los documentos (Borrador, En Revisión, Aprobado, Obsoleto, etc.)
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded-lg border border-slate-200 shrink-0">
                {estadosNormativos.length} estados registrados
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Formulario Agregar Estado */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={nuevoEstadoNormativo}
                  onChange={(e) => setNuevoEstadoNormativo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') agregarEstadoNormativo(); }}
                  placeholder="Nuevo estado (ej. EN_VALIDACION, SUSPENDIDO)..."
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <button
                  onClick={agregarEstadoNormativo}
                  disabled={!nuevoEstadoNormativo.trim()}
                  className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#152e4d] disabled:opacity-50 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus size={14} /> Agregar Estado
                </button>
              </div>

              {/* Grid / Lista de Estados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {estadosNormativos.map((estado) => {
                  const countDocs = (documentos || []).filter(d => d.estado === estado).length;
                  const enEdicion = estadoNormativoEditando === estado;

                  return (
                    <div
                      key={estado}
                      className="p-3 bg-white border border-slate-200/90 rounded-xl hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      {enEdicion ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={estadoNormativoNuevoNombre}
                            onChange={(e) => setEstadoNormativoNuevoNombre(e.target.value.toUpperCase())}
                            className="w-full p-1.5 bg-slate-50 border border-emerald-400 rounded text-xs font-mono font-bold outline-none"
                            autoFocus
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => setEstadoNormativoEditando(null)}
                              className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => guardarEdicionEstadoNormativo(estado)}
                              className="px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shadow-2xs"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-black text-slate-800 text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                              {estado}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                              {countDocs} {countDocs === 1 ? 'doc' : 'docs'}
                            </span>
                          </div>

                          <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => { setEstadoNormativoEditando(estado); setEstadoNormativoNuevoNombre(estado); }}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Editar nombre del estado"
                            >
                              <Edit size={13} />
                            </button>
                            {puedeEliminarCatalogo && (
                              <button
                                onClick={() => eliminarEstadoNormativo(estado)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title={countDocs > 0 ? `Eliminar (usado en ${countDocs} documentos)` : 'Eliminar estado'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: NUEVA / EDITAR ÁREA */}
      {/* ============================================================ */}
      {modalArea.show && (
        <ContenedorModal isOpen onClose={() => setModalArea({ show: false, esEdicion: false, data: {} })} size="lg">
          <div className="max-h-full overflow-y-auto bg-white rounded-2xl p-6 w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <Building size={16} className="text-sky-600" />
                {modalArea.esEdicion ? 'Editar Área y Encargado' : 'Registrar Nueva Área'}
              </h3>
              <button onClick={() => setModalArea({ show: false, esEdicion: false, data: {} })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nombre del Área <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalArea.data.nombre}
                  onChange={(e) => setModalArea({ ...modalArea, data: { ...modalArea.data, nombre: e.target.value } })}
                  placeholder="Ej. Control de Calidad"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Encargado Actual en el Puesto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalArea.data.encargado}
                  onChange={(e) => setModalArea({ ...modalArea, data: { ...modalArea.data, encargado: e.target.value } })}
                  placeholder="Ej. Ing. Juan López"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Correo para Avisos SGC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={modalArea.data.correo}
                    onChange={(e) => setModalArea({ ...modalArea, data: { ...modalArea.data, correo: e.target.value } })}
                    placeholder="encargado@oomapasc.gob.mx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Teléfono / Extensión
                  </label>
                  <input
                    type="text"
                    value={modalArea.data.telefono}
                    onChange={(e) => setModalArea({ ...modalArea, data: { ...modalArea.data, telefono: e.target.value } })}
                    placeholder="644XXXXXXX / Ext 123"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Dirección a la que Pertenece <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalArea.data.direccion}
                  onChange={(e) => setModalArea({ ...modalArea, data: { ...modalArea.data, direccion: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                >
                  {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalArea({ show: false, esEdicion: false, data: {} })}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarArea}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm"
              >
                Guardar Área
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ============================================================ */}
      {/* MODAL: NUEVA / EDITAR DIRECCIÓN */}
      {/* ============================================================ */}
      {modalDireccion.show && (
        <ContenedorModal isOpen onClose={() => setModalDireccion({ show: false, esEdicion: false, data: {} })} size="lg">
          <div className="max-h-full overflow-y-auto bg-white rounded-2xl p-6 w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <Building2 size={16} className="text-purple-600" />
                {modalDireccion.esEdicion ? 'Editar Dirección Operativa' : 'Registrar Nueva Dirección'}
              </h3>
              <button onClick={() => setModalDireccion({ show: false, esEdicion: false, data: {} })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Nombre de la Dirección <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalDireccion.data.nombre}
                    onChange={(e) => setModalDireccion({ ...modalDireccion, data: { ...modalDireccion.data, nombre: e.target.value } })}
                    placeholder="Ej. Dir. Técnica"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Siglas / Clave <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalDireccion.data.siglas}
                    onChange={(e) => setModalDireccion({ ...modalDireccion, data: { ...modalDireccion.data, siglas: e.target.value } })}
                    placeholder="DT"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Director Actual en el Puesto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalDireccion.data.director}
                  onChange={(e) => setModalDireccion({ ...modalDireccion, data: { ...modalDireccion.data, director: e.target.value } })}
                  placeholder="Ej. Ing. Manuel Campas"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Correo Electrónico Institucional <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={modalDireccion.data.correo}
                    onChange={(e) => setModalDireccion({ ...modalDireccion, data: { ...modalDireccion.data, correo: e.target.value } })}
                    placeholder="direcciontecnica@oomapasc.gob.mx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Teléfono Directo
                  </label>
                  <input
                    type="text"
                    value={modalDireccion.data.telefono}
                    onChange={(e) => setModalDireccion({ ...modalDireccion, data: { ...modalDireccion.data, telefono: e.target.value } })}
                    placeholder="6444102000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalDireccion({ show: false, esEdicion: false, data: {} })}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDireccion}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm"
              >
                Guardar Dirección
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ============================================================ */}
      {/* MODAL: NUEVO / EDITAR PROCESO */}
      {/* ============================================================ */}
      {modalProceso.show && (
        <ContenedorModal isOpen onClose={() => setModalProceso({ show: false, esEdicion: false, data: {} })} size="2xl">
          <div className="max-h-full overflow-y-auto bg-white rounded-2xl p-6 w-full shadow-2xl space-y-4 animate-scale-in flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <GitBranch size={16} className="text-emerald-600" />
                {modalProceso.esEdicion ? 'Editar Proceso SGC & Áreas Involucradas' : 'Registrar Nuevo Proceso'}
              </h3>
              <button onClick={() => setModalProceso({ show: false, esEdicion: false, data: {} })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Clave <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalProceso.data.clave}
                    onChange={(e) => setModalProceso({ ...modalProceso, data: { ...modalProceso.data, clave: e.target.value } })}
                    placeholder="PR-PROD-02"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Nombre del Proceso <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalProceso.data.nombre}
                    onChange={(e) => setModalProceso({ ...modalProceso, data: { ...modalProceso.data, nombre: e.target.value } })}
                    placeholder="Ej. Producción y Potabilización"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Tipo de Proceso <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalProceso.data.tipo}
                    onChange={(e) => setModalProceso({ ...modalProceso, data: { ...modalProceso.data, tipo: e.target.value } })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="Estratégico">Estratégico</option>
                    <option value="Operativo">Operativo (Misional)</option>
                    <option value="Apoyo">Apoyo</option>
                    <option value="Evaluación">Evaluación y Mejora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Área Líder Responsable <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalProceso.data.areaResponsable}
                    onChange={(e) => {
                      const nuevaLider = e.target.value;
                      const actuales = modalProceso.data.areasInvolucradas || [];
                      const actualizadas = actuales.includes(nuevaLider) ? actuales : [...actuales, nuevaLider];
                      setModalProceso({
                        ...modalProceso,
                        data: {
                          ...modalProceso.data,
                          areaResponsable: nuevaLider,
                          areasInvolucradas: actualizadas
                        }
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Selector de Áreas Involucradas para Auditorías */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={15} className="text-emerald-600" />
                      Áreas que interactúan en este Proceso (Alcance para Auditorías)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Selecciona todas las áreas que participan en este proceso. Al organizar una Auditoría por Procesos, se auditarán estas áreas.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={seleccionarTodasAreasProceso}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                    >
                      Todas ({areas.length})
                    </button>
                    <button
                      type="button"
                      onClick={limpiarAreasProceso}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors cursor-pointer"
                    >
                      Solo Líder
                    </button>
                  </div>
                </div>

                {/* Filtro de búsqueda rápida */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaAreaModal}
                    onChange={(e) => setBusquedaAreaModal(e.target.value)}
                    placeholder="Filtrar áreas por nombre..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Grid con checkboxes */}
                <div className="max-h-52 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-lg p-2.5 bg-white">
                  {areas
                    .filter(a => a.toLowerCase().includes((busquedaAreaModal || '').toLowerCase()))
                    .map(areaNombre => {
                      const seleccionada = (modalProceso.data.areasInvolucradas || []).includes(areaNombre);
                      const esLider = modalProceso.data.areaResponsable === areaNombre;
                      return (
                        <div
                          key={areaNombre}
                          onClick={() => toggleAreaInvolucrada(areaNombre)}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                            seleccionada
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionada}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="truncate font-semibold">{areaNombre}</span>
                              {esLider && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-200 text-emerald-800">
                                  Líder
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1">
                  <span>
                    Áreas vinculadas al proceso:{' '}
                    <strong className="text-emerald-700 font-extrabold text-xs">
                      {(modalProceso.data.areasInvolucradas || []).length} seleccionadas
                    </strong>
                  </span>
                  {(modalProceso.data.areasInvolucradas || []).length === 0 && (
                    <span className="text-amber-600 font-semibold">⚠️ Se incluirá automáticamente el área líder</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalProceso({ show: false, esEdicion: false, data: {} })}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarProceso}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm"
              >
                Guardar Proceso
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ============================================================ */}
      {/* MODAL: NUEVO / EDITAR USUARIO */}
      {/* ============================================================ */}
      {modalUsuario.show && (
        <ContenedorModal isOpen onClose={() => setModalUsuario({ show: false, esEdicion: false, data: {} })} size="lg">
          <div className="max-h-full overflow-y-auto bg-white rounded-2xl p-6 w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <Users size={16} className="text-sky-600" />
                {modalUsuario.esEdicion ? 'Editar Usuario y Asignación' : 'Registrar Nuevo Usuario'}
              </h3>
              <button onClick={() => setModalUsuario({ show: false, esEdicion: false, data: {} })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalUsuario.data.nombre}
                  onChange={(e) => setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, nombre: e.target.value } })}
                  placeholder="Ej. Lic. Roberto Valdez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Email Institucional <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={modalUsuario.data.email}
                    onChange={(e) => setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, email: e.target.value } })}
                    placeholder="usuario@oomapasc.gob.mx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={modalUsuario.data.telefono}
                    onChange={(e) => setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, telefono: e.target.value } })}
                    placeholder="644XXXXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Área Asignada <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalUsuario.data.area}
                    onChange={(e) => {
                      const selArea = e.target.value;
                      const areaInfo = areasDetalle.find(a => a.nombre === selArea);
                      setModalUsuario({
                        ...modalUsuario,
                        data: {
                          ...modalUsuario.data,
                          area: selArea,
                          direccion: areaInfo?.direccion || modalUsuario.data.direccion || direcciones[0] || ''
                        }
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  >
                    <option value="">-- Seleccionar área --</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Dirección
                  </label>
                  <select
                    value={modalUsuario.data.direccion}
                    onChange={(e) => setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, direccion: e.target.value } })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  >
                    <option value="">-- Seleccionar dirección --</option>
                    {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Rol y Nivel de Acceso <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalUsuario.data.rol}
                  onChange={(e) => setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, rol: e.target.value } })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                >
                  <option value="Usuario">Usuario (Ver + indicadores/evidencias de su área)</option>
                  <option value="Encargado">Encargado (Su área: AC, PM, indicadores, riesgos)</option>
                  <option value="Auditor">Auditor (Crear AC/PM cualquier área, ver resultados)</option>
                  <option value="Admin">Admin (Compañeros SGC - todas las áreas)</option>
                  <option value="Super Admin">Super Admin (Control total del sistema)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {modalUsuario.data.rol === 'Encargado' || modalUsuario.data.rol === 'Usuario' ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <Lock size={12} /> Este usuario estará restringido a visualizar y generar información de su área asignada ({modalUsuario.data.area || 'seleccione área'}).
                    </span>
                  ) : (
                    <span className="text-sky-700 font-semibold flex items-center gap-1">
                      <ShieldCheck size={12} /> Este perfil cuenta con permisos globales para visualizar y generar registros de cualquier área.
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {modalUsuario.esEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                </label>
                <input
                  type="password"
                  value={modalUsuario.esEdicion ? modalUsuario.data.newPassword || '' : modalUsuario.data.password || ''}
                  onChange={(e) => {
                    if (modalUsuario.esEdicion) {
                      setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, newPassword: e.target.value } });
                    } else {
                      setModalUsuario({ ...modalUsuario, data: { ...modalUsuario.data, password: e.target.value } });
                    }
                  }}
                  placeholder={modalUsuario.esEdicion ? 'Dejar en blanco para conservar actual...' : 'Contraseña de acceso...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalUsuario({ show: false, esEdicion: false, data: {} })}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarUsuario}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#152e4d] text-white text-xs font-extrabold rounded-lg shadow-sm"
              >
                Guardar Usuario
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN CON DOBLE CONFIRMACIÓN */}
      {/* ============================================================ */}
      <ModalConfirmacionEliminar
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, type: '', name: '', action: null })}
        onConfirm={(motivo) => {
          if (confirmDelete.action) confirmDelete.action(motivo);
        }}
        titulo={`Eliminar ${confirmDelete.type}`}
        itemNombre={confirmDelete.name}
        palabraRequerida="CONFIRMAR"
        descripcion={`Esta acción es irreversible y eliminará el registro del catálogo de ${confirmDelete.type}. Todos los módulos vinculados podrían verse afectados.`}
        requiereMotivo={true}
      />
    </div>
  );
}
