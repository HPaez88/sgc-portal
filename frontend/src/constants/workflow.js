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
  'SOLICITUD_CIERRE',
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
  SOLICITUD_CIERRE: {
    label: 'Solicitud de Cierre', grupo: 'abierto',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    desc: 'El área concluyó actividades y solicita auditoría de cierre',
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
  EN_REVISION: ['APROBADO', 'EN_SEGUIMIENTO', 'RECHAZADO'],
  APROBADO: ['EN_SEGUIMIENTO', 'SOLICITUD_CIERRE'],
  EN_SEGUIMIENTO: ['SOLICITUD_CIERRE', 'REVISION_AUDITOR', 'RECHAZADO'],
  SOLICITUD_CIERRE: ['REVISION_AUDITOR', 'EN_SEGUIMIENTO'],
  REVISION_AUDITOR: ['CERRADO_EFECTIVO', 'EN_SEGUIMIENTO', 'CERRADO_NO_EFECTIVO'],
  RECHAZADO: ['BORRADOR'],
  CERRADO_EFECTIVO: [],
  CERRADO_NO_EFECTIVO: ['EN_SEGUIMIENTO'],
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
  // El Director General aprueba documentos del sistema y consulta todas las áreas
  Director: ['ver_todas_areas', 'aprobar', 'rechazar'],
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

// Regla SGC: no se solicita el cierre de una AC o PM sin evidencia en TODAS sus actividades.
// Devuelve null si se puede solicitar, o el motivo para mostrarlo al usuario.
export const motivoBloqueoCierre = (actividades) => {
  const lista = Array.isArray(actividades) ? actividades : [];
  if (lista.length === 0) return 'Registra al menos una actividad con su evidencia antes de solicitar el cierre.';
  const sinEvidencia = lista
    .map((a, i) => ({ nombre: (a?.actividad || a?.descripcion || `Actividad ${i + 1}`).toString().trim(), ok: Boolean(a?.evidencia_real) }))
    .filter((a) => !a.ok);
  if (sinEvidencia.length === 0) return null;
  const nombres = sinEvidencia.slice(0, 3).map((a) => `"${a.nombre.slice(0, 60)}"`).join(', ');
  const resto = sinEvidencia.length > 3 ? ` y ${sinEvidencia.length - 3} más` : '';
  return `No se puede solicitar el cierre: falta evidencia en ${sinEvidencia.length} actividad(es): ${nombres}${resto}.`;
};

// Detectada pero sin apertura oficial: borrador creado por el sistema o por el auditor
// (hallazgo, indicador, riesgo, documento, cierre no eficaz). Va en la pestaña "Por abrir", no en el control.
export const esPorAbrir = (r) =>
  Boolean(r) && ['BORRADOR', 'GENERADO_IA'].includes(r.estado) && Boolean(r.origen_modulo || r.accion_origen_folio);

export const diasDesde = (valor) => {
  const d = parseFecha(valor);
  if (!d) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return Math.round((hoy - x) / 86400000);
};

// Fechas solo-día ("2026-12-23") se leen en hora LOCAL. new Date("2026-12-23") las toma como
// medianoche UTC y en México las muestra un día antes.
export const parseFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatearFecha = (valor) => {
  const d = parseFecha(valor);
  return d ? d.toLocaleDateString('es-MX') : '-';
};

// Regla SGC: la fecha final de una AC/PM es la actividad más tardía + 2 semanas, en día hábil
// (si cae sábado o domingo se recorre al lunes). Los replanteos mueven la fecha de la actividad,
// así que la fecha final se recalcula sola.
// ponytail: hábil = lunes a viernes; no descuenta días festivos. Agregar calendario si el SGC lo pide.
export const DIAS_HOLGURA_CIERRE = 14;

export const calcularFechaFinal = (actividades) => {
  const fechas = (Array.isArray(actividades) ? actividades : [])
    .map((a) => parseFecha(a?.fecha_termino_sugerida))
    .filter(Boolean)
    .map((d) => d.getTime());
  if (fechas.length === 0) return null;
  const f = new Date(Math.max(...fechas));
  f.setHours(0, 0, 0, 0);
  f.setDate(f.getDate() + DIAS_HOLGURA_CIERRE);
  if (f.getDay() === 6) f.setDate(f.getDate() + 2);
  if (f.getDay() === 0) f.setDate(f.getDate() + 1);
  return f;
};

export const leerActividades = (registro) => {
  if (Array.isArray(registro.actividades)) return registro.actividades;
  try {
    // AC guarda actividades_json; PM guarda "actividades" como texto JSON.
    const texto = typeof registro.actividades === 'string' ? registro.actividades : registro.actividades_json;
    const lista = JSON.parse(texto || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

// Fecha compromiso de un registro AC/PM: la calculada por sus actividades; si aún no tiene
// actividades con fecha (p. ej. importadas del Control 6), la primera fecha disponible.
export const getFechaCompromiso = (registro) => {
  if (!registro) return null;
  // La fecha de seguimiento del SGC se fija al aprobar y solo cambia con un replanteo de fecha final.
  if (registro.fecha_seguimiento) return parseFecha(registro.fecha_seguimiento);
  // Mientras no se fija (borrador), se muestra la que resultaría de las actividades.
  const calculada = calcularFechaFinal(leerActividades(registro));
  if (calculada) return calculada;
  const candidatos = [
    registro.fecha_cierre_estimada,
    registro.fecha_cierre,
    registro.fecha_actividad_inmediata,
    registro.fecha_limite,
  ];
  const fecha = candidatos.find((f) => f);
  return fecha ? parseFecha(fecha) : null;
};

export const diasRestantes = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = parseFecha(fecha);
  if (!objetivo) return null;
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


// "Auditoría Interna #9", "Auditoría Externa A2025-15985", "Indicador #39" o solo el origen.
export const etiquetaOrigen = (r) => {
  const origen = r?.origen || '';
  if (!origen) return '-';
  const num = String(r?.numero_auditoria || '').trim();
  if (/^auditor/i.test(origen) && num) return `${origen} ${/^\d+$/.test(num) ? `#${num}` : num}`;
  if (origen === 'Indicador' && r?.origen_referencia) return `Indicador #${r.origen_referencia}`;
  return origen;
};

// Correos de responsables guardados como lista o como texto (las importaciones los traen como texto).
export const correosDe = (r) => {
  const c = r?.correos_responsables;
  const texto = Array.isArray(c) ? c.join(',') : String(c || '');
  return [...new Set(texto.match(/[^\s'",;[\]]+@[^\s'",;[\]]+/g) || [])];
};

// Al nombrar a alguien encargado del SGC de un área: si su alcance es limitado y no tenía área,
// toma esta; si era "Usuario" pasa a "Encargado" (puede enviar al SGC). Null = no cambia nada.
export const cambioEncargado = (usuario, area) => {
  if (!usuario || puedeVerTodasAreas(usuario)) return null;
  const sinArea = !usuario.area || usuario.area === 'Por asignar';
  if (!sinArea && usuario.rol !== 'Usuario') return null;
  return { area: sinArea ? area : usuario.area, rol: usuario.rol === 'Usuario' ? 'Encargado' : usuario.rol };
};

// ── FECHA DE SEGUIMIENTO (decidido 2026-11-09): al aprobar se fija = actividad más tardía + 2 semanas, en día hábil.
// Aunque el responsable mueva sus actividades, el SGC sigue esa fecha; al vencer pide replantear actividades
// y registra un replanteo de la fecha final (máx. 2, contando los del Control 6).
export const fechaISO = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null);
export const fechaSeguimientoInicial = (registro) => fechaISO(calcularFechaFinal(leerActividades(registro)));
export const MAX_REPLANTEOS = 2;
export const esAdminSGC = (usuario) => ['Super Admin', 'Admin'].includes(usuario?.rol);
// Mover fechas de seguimiento: las mismas cuentas con permiso especial del backend (Super Admin y gescobar@).
export const puedeMoverFechas = (usuario) => Boolean(usuario?.puede_restablecer);
// ponytail: mientras se carga la información solo se "ajusta" la fecha; en false se activan replanteo
// formal de fecha final y la solicitud de replanteo de actividades.
export const FECHAS_SOLO_AJUSTE = true;

const leerLista = (valor) => {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try { return JSON.parse(valor.replace(/'/g, '"')); } catch { return []; } // ponytail: el Control 6 se importó como repr de Python
};

// Replanteos ya usados: los del Control 6 cuentan para el límite de 2.
export const replanteosFinales = (registro) => {
  const control6 = leerLista(registro?.replanteos_control6).map((r) => ({ fecha: r.fecha, origen: 'Control 6' }));
  const portal = leerLista(registro?.historial_replanteos_final);
  return { lista: [...control6, ...portal], usados: control6.length + portal.length };
};

export const validarReplanteoFinal = (registro, nuevaFecha, motivo, hoy = new Date()) => {
  if (replanteosFinales(registro).usados >= MAX_REPLANTEOS) return `Ya se usaron los ${MAX_REPLANTEOS} replanteos permitidos.`;
  const f = parseFecha(nuevaFecha);
  if (!f) return 'Indica la nueva fecha final.';
  if (f.getDay() === 0 || f.getDay() === 6) return 'La fecha final debe caer en día hábil (lunes a viernes).';
  const base = new Date(hoy); base.setHours(0, 0, 0, 0);
  if (f <= base) return 'La nueva fecha debe ser posterior a hoy.';
  const actual = getFechaCompromiso(registro);
  if (actual && f <= actual) return 'La nueva fecha debe ser posterior a la fecha final actual.';
  if (!motivo || motivo.trim().length < 10) return 'Escribe la justificación (mínimo 10 caracteres).';
  return null;
};

// Ajuste administrativo de la fecha de seguimiento (decidido 2026-11-11): mientras se carga la información,
// el Admin la mueve libremente; no cuenta como replanteo pero queda en el historial y la bitácora.
export const ajustarFechaSeguimiento = (registro, { nuevaFecha, nota = '', por, ahora = new Date().toISOString() }) => ({
  ...registro,
  fecha_seguimiento: nuevaFecha,
  fecha_limite: nuevaFecha,
  fecha_cierre_programada: nuevaFecha,
  ...(registro.fecha_cierre_estimada ? { fecha_cierre_estimada: nuevaFecha } : {}),
  historial_ajustes_fecha: [...leerLista(registro.historial_ajustes_fecha),
    { fecha_anterior: fechaISO(getFechaCompromiso(registro)), fecha: nuevaFecha, nota: nota.trim(), por, fecha_registro: ahora }],
});

export const aplicarReplanteoFinal = (registro, { nuevaFecha, motivo, por, ahora = new Date().toISOString() }) => {
  const anterior = getFechaCompromiso(registro);
  const { usados } = replanteosFinales(registro);
  const entrada = {
    numero: usados + 1, fecha_anterior: fechaISO(anterior),
    fecha: nuevaFecha, justificacion: motivo.trim(), registrado_por: por, fecha_registro: ahora, origen: 'Portal',
  };
  return {
    ...registro,
    fecha_seguimiento: nuevaFecha,
    fecha_limite: nuevaFecha,
    fecha_cierre_programada: nuevaFecha,
    ...(registro.fecha_cierre_estimada ? { fecha_cierre_estimada: nuevaFecha } : {}),
    historial_replanteos_final: [...leerLista(registro.historial_replanteos_final), entrada],
  };
};
