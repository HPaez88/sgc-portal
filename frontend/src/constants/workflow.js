// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW SGC — fuente única de verdad para Acciones Correctivas (AC) y
// Planes de Mejora (PM): estados, transiciones, permisos y seguimiento.
// ═══════════════════════════════════════════════════════════════════════════

// Estados de cierre aceptados (incluye registros heredados sin eficacia)
export const ESTADOS_CERRADOS = ['CERRADO_EFECTIVO', 'CERRADO_NO_EFECTIVO', 'CERRADO'];

// Estados que representan trabajo pendiente
export const ESTADOS_ABIERTOS = [
  'BORRADOR',
  'EN_REVISION',
  'APROBADO',
  'EN_SEGUIMIENTO',
  'REVISION_AUDITOR',
  'RECHAZADO',
];

// Metadatos por estado: etiqueta, grupo, color y descripción para seguimiento
export const ESTADO_META = {
  BORRADOR: {
    label: 'Borrador', grupo: 'abierto',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    desc: 'En elaboración por el área responsable',
  },
  EN_REVISION: {
    label: 'En Revisión SGC', grupo: 'abierto',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    desc: 'Pendiente de revisión y aprobación del SGC',
  },
  APROBADO: {
    label: 'Aprobado', grupo: 'abierto',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    desc: 'Folio asignado, actividades en ejecución',
  },
  EN_SEGUIMIENTO: {
    label: 'En Seguimiento', grupo: 'abierto',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    desc: 'Actividades en proceso con evidencias cargadas',
  },
  REVISION_AUDITOR: {
    label: 'Revisión Auditor', grupo: 'abierto',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    desc: 'El auditor evalúa la eficacia antes del cierre',
  },
  RECHAZADO: {
    label: 'Rechazado', grupo: 'abierto',
    color: 'bg-red-100 text-red-700 border-red-200',
    desc: 'Requiere correcciones del área responsable',
  },
  CERRADO_EFECTIVO: {
    label: 'Cerrado (Eficaz)', grupo: 'cerrado',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    desc: 'Cierre con eficacia comprobada por el auditor',
  },
  CERRADO_NO_EFECTIVO: {
    label: 'Cerrado (No eficaz)', grupo: 'cerrado',
    color: 'bg-red-100 text-red-700 border-red-200',
    desc: 'Cierre sin eficacia comprobada',
  },
  CERRADO: {
    label: 'Cerrado', grupo: 'cerrado',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    desc: 'Registro cerrado heredado',
  },
};

// Etiquetas de estados heredados que ya no se generan pero pueden existir en BD
export const LEGACY_LABELS = {
  GENERADO_IA: 'Borrador (IA)',
  FOLIO_ASIGNADO: 'Folio asignado',
  ENVIADO_SGC: 'Enviado a SGC',
  EN_PROCESO: 'En proceso',
};

// Normaliza estados heredados al flujo canónico (para mostrar y filtrar)
export const normalizarEstado = (estado) => {
  const mapa = {
    GENERADO_IA: 'BORRADOR',
    FOLIO_ASIGNADO: 'APROBADO',
    ENVIADO_SGC: 'EN_REVISION',
    EN_PROCESO: 'EN_SEGUIMIENTO',
    ABIERTA: 'EN_SEGUIMIENTO',
    CERRADA: 'CERRADO',
  };
  return mapa[estado] || estado || 'BORRADOR';
};

// Transiciones permitidas — mismas reglas para AC y PM
export const TRANSICIONES = {
  BORRADOR: ['EN_REVISION'],
  EN_REVISION: ['APROBADO', 'RECHAZADO'],
  APROBADO: ['EN_SEGUIMIENTO'],
  EN_SEGUIMIENTO: ['REVISION_AUDITOR', 'RECHAZADO'],
  REVISION_AUDITOR: ['CERRADO_EFECTIVO', 'CERRADO_NO_EFECTIVO'],
  RECHAZADO: ['BORRADOR'],
  CERRADO_EFECTIVO: [],
  CERRADO_NO_EFECTIVO: [],
  CERRADO: [],
};

// Acciones del workflow cubiertas por la matriz de permisos
export const ACCIONES_WORKFLOW = [
  'crear', 'editar', 'enviar', 'aprobar', 'rechazar',
  'asignar_auditor', 'cerrar', 'reabrir', 'eliminar', 'ver_todas_areas',
];

// Matriz de permisos por rol del SGC
export const PERMISOS = {
  'Super Admin': ACCIONES_WORKFLOW,
  Admin: ACCIONES_WORKFLOW,
  // El auditor evalúa y cierra, no aprueba documentos
  Auditor: ['crear', 'editar', 'cerrar', 'rechazar', 'ver_todas_areas'],
  // El encargado trabaja únicamente su área y envía a revisión
  Encargado: ['crear', 'editar', 'enviar'],
  // El usuario solo captura borradores y consulta
  Usuario: ['crear', 'editar'],
};

export const can = (usuario, accion) => {
  if (!usuario || !usuario.rol) return false;
  return (PERMISOS[usuario.rol] || []).includes(accion);
};

export const puedeVerTodasAreas = (usuario) => can(usuario, 'ver_todas_areas');

// Alcance por área: quien no ve todas las áreas solo ve la suya
export const puedeVerArea = (usuario, area) => {
  if (!usuario) return false;
  if (puedeVerTodasAreas(usuario)) return true;
  if (!area) return true;
  return usuario.area === area;
};

export const esCerrado = (estado) => ESTADOS_CERRADOS.includes(estado);

export const getGrupoEstado = (estado) => (esCerrado(estado) ? 'cerrado' : 'abierto');

// Filtros rápidos compartidos por las listas de AC y PM
export const FILTROS_ESTADO = [
  { value: '', label: 'Todos los estados' },
  { value: 'GRUPO_ABIERTOS', label: 'Abiertos' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En Revisión SGC' },
  { value: 'APROBADO', label: 'Aprobado / En ejecución' },
  { value: 'EN_SEGUIMIENTO', label: 'En Seguimiento' },
  { value: 'REVISION_AUDITOR', label: 'Revisión Auditor' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'GRUPO_CERRADOS', label: 'Cerrados' },
];

export const cumpleFiltroEstado = (estado, filtro) => {
  if (!filtro) return true;
  const canonico = normalizarEstado(estado);
  if (filtro === 'GRUPO_ABIERTOS' || filtro === 'ABIERTA') return !esCerrado(canonico);
  if (filtro === 'GRUPO_CERRADOS' || filtro === 'CERRADA') return esCerrado(canonico);
  return canonico === filtro || estado === filtro;
};

// Fecha compromiso de un registro AC/PM (toma la primera fecha disponible)
export const getFechaCompromiso = (registro) => {
  if (!registro) return null;
  const candidatos = [
    registro.fecha_cierre_estimada,
    registro.fecha_cierre,
    registro.fecha_actividad_inmediata,
    registro.fecha_limite,
  ];
  const fecha = candidatos.find((f) => f);
  return fecha ? new Date(fecha) : null;
};

export const diasRestantes = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fecha);
  if (Number.isNaN(objetivo.getTime())) return null;
  objetivo.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
};

// Semáforo de vencimiento para el seguimiento de AC/PM
export const getVencimiento = (registro) => {
  const sinFecha = { nivel: 'sin_fecha', label: 'Sin fecha', color: 'bg-slate-100 text-slate-600 border-slate-200', dias: null };
  if (!registro) return sinFecha;

  if (esCerrado(normalizarEstado(registro.estado))) {
    return { nivel: 'cerrado', label: 'Cerrado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dias: null };
  }

  const dias = diasRestantes(getFechaCompromiso(registro));
  if (dias === null) return sinFecha;
  if (dias < 0) {
    return { nivel: 'vencido', label: `Vencido ${Math.abs(dias)} d`, color: 'bg-red-100 text-red-700 border-red-200', dias };
  }
  if (dias <= 15) {
    return { nivel: 'por_vencer', label: `Vence en ${dias} d`, color: 'bg-amber-100 text-amber-700 border-amber-200', dias };
  }
  return { nivel: 'en_tiempo', label: `En tiempo (${dias} d)`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dias };
};

