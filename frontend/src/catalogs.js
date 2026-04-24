export const AREAS = [
  'Agencia Esperanza',
  'Agencia Marte R. Gómez',
  'Agencia Providencia',
  'Agencia Pueblo Yaqui',
  'Alcantarillado y Saneamiento',
  'Atención Ciudadana',
  'Comunicación e Imagen Institucional',
  'Contabilidad',
  'Contratos y Servicios',
  'Control de Calidad',
  'Control y Servicios',
  'Cultura del Agua',
  'Informática',
  'Jurídico',
  'Licitaciones',
  'Línea OOMAPASC',
  'Mantenimiento de Redes',
  'Mantenimiento y Servicios Generales',
  'Órgano de Control Interno',
  'Padrón de Usuarios',
  'Plantas Potabilizadoras',
  'Programas Sociales',
  'Proyectos e Infraestructura',
  'Recursos Humanos',
  'Recursos Materiales',
  'Sectorización Hidrométrica e Innovación',
  'Seguridad Industrial',
  'Sistema de Gestión de Calidad',
  'Suburbano Técnico',
  'Supervisión y Control de Obras',
  'Trabajo Social',
  'Trámites Técnicos',
  'Verificación y Lectura'
];

export const DIRECCIONES = [
  'Dir. General',
  'Dir. Técnica',
  'Dir. Administrativa',
  'Dir. Órganos de Control Interno',
  'Dir. Comercial',
  'Dir. Jurídica',
  'Dir. Programas Sociales y Cultura del Agua'
];

export const PROCESOS = [
  'Comercialización',
  'Comunicación',
  'Gestión de Recursos',
  'Mantenimiento y Calibración',
  'Medición Análisis y Mejora',
  'Producción',
  'Proyectos e Infraestructura',
  'Responsabilidad de la Dirección'
];

export const ORIGENES_AC = ['Auditoría', 'Indicador', 'Queja', 'Otra'];

export const INDICADORES = [
  { id: 1, nombre: 'Turbiedad Promedio', area: 'Plantas Potabilizadoras', meta: '< 1.0', unidad: 'NTU' },
  { id: 2, nombre: 'Cloro Residual', area: 'Plantas Potabilizadoras', meta: '0.5-1.5', unidad: 'mg/L' },
  { id: 3, nombre: 'Recaudación', area: 'Contabilidad', meta: '> 95', unidad: '%' },
  { id: 4, nombre: 'Quejas Atendidas', area: 'Atención Ciudadana', meta: '< 24', unidad: 'hrs' },
  { id: 5, nombre: 'Eficiencia de Bombas', area: 'Mantenimiento de Redes', meta: '> 85', unidad: '%' },
  { id: 6, nombre: 'NC Resueltas', area: 'Sistema de Gestión de Calidad', meta: '> 90', unidad: '%' },
  { id: 7, nombre: 'Cumplimiento de Indicadores', area: 'Sistema de Gestión de Calidad', meta: '> 80', unidad: '%' },
  { id: 8, nombre: 'Proyectos Terminados', area: 'Proyectos e Infraestructura', meta: '> 90', unidad: '%' },
  { id: 9, nombre: 'Capacitaciones', area: 'Recursos Humanos', meta: '100', unidad: '%' },
  { id: 10, nombre: 'Lectura de Medidores', area: 'Verificación Y Lectura', meta: '> 98', unidad: '%' },
  { id: 11, nombre: 'Tiempo de Respuesta', area: 'Línea OOMAPASC', meta: '< 15', unidad: 'min' },
  { id: 12, nombre: 'Contratos Activos', area: 'Contratos y Servicios', meta: '> 90', unidad: '%' },
];

export const getIndicadoresByArea = (area) => INDICADORES.filter(i => i.area === area);

export const ESTADOS_AC = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'CERRADO'];

export const ROLES = ['Super Admin', 'Admin', 'Auditor', 'Encargado', 'Usuario'];

export const ROL_HIERARCHY = {
  'Super Admin': 5,
  'Admin': 4,
  'Auditor': 3,
  'Encargado': 2,
  'Usuario': 1
};

export const SUPER_ADMIN_EMAIL = 'hpaez@oomapasc.gob.mx';

export const canManageUser = (currentRole, targetRole) => {
  return ROL_HIERARCHY[currentRole] > ROL_HIERARCHY[targetRole];
};

export const canManageDocument = (role) => {
  return ['Super Admin', 'Admin', 'Encargado'].includes(role);
};

export const canUpdateIndicator = (role) => {
  return ['Super Admin', 'Admin', 'Encargado', 'Usuario'].includes(role);
};

export const canManageAllAreas = (role) => {
  return ['Super Admin', 'Admin'].includes(role);
};

export const NIVELES_RIESGO = {
  ALTO: { min: 10, color: 'red' },
  MEDIO: { min: 5, color: 'amber' },
  BAJO: { min: 0, color: 'emerald' }
};

export const getColorNivel = (nivel) => {
  if (nivel >= 15) return 'bg-red-600 text-white';
  if (nivel >= 8) return 'bg-amber-500 text-white';
  return 'bg-emerald-500 text-white';
};

export const getNivelRiesgo = (probabilidad, impacto) => probabilidad * impacto;

export const getEstadoColor = (estado) => {
  switch(estado) {
    case 'APROBADO': return 'bg-emerald-100 text-emerald-700';
    case 'EN_REVISION': return 'bg-amber-100 text-amber-700';
    case 'CERRADO': return 'bg-blue-100 text-blue-700';
    case 'BORRADOR': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const getRolColor = (rol) => {
  switch(rol) {
    case 'Super Admin': return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    case 'Admin': return 'bg-purple-100 text-purple-700';
    case 'Auditor': return 'bg-blue-100 text-blue-700';
    case 'Encargado': return 'bg-cyan-100 text-cyan-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};