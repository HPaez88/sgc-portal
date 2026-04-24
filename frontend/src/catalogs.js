export const AREAS = [
  'Operación',
  'Mantenimiento',
  'Comercialización',
  'Calidad',
  'Administración'
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

export const ESTADOS_AC = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'CERRADO'];

export const ROLES = ['Usuario', 'Encargado', 'Admin'];

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
    case 'Admin': return 'bg-purple-100 text-purple-700';
    case 'Encargado': return 'bg-cyan-100 text-cyan-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};