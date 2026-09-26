// Catálogo de Procesos y Orígenes - OOMAPASC de Cajeme
export const PROCESOS = [
  "Comercialización", "Comunicación", "Gestión de Recursos", 
  "Mantenimiento y Calibración", "Medición, Análisis y Mejora", 
  "Producción", "Proyectos e Infraestructura", "Responsabilidad de la Dirección"
];

// Orígenes de Acción Correctiva (unión formato oficial OOMRSC-20 + registros previos)
export const ORIGENES_AC = [
  'Auditoría',
  'Análisis de datos',
  'Ensayo no conforme',
  'Indicador',
  'Proceso',
  'Producto no conforme',
  'Reclamaciones de cliente',
  'Queja',
  'Otra'
];

export const ORIGENES_PM = [
  'Objetivo de Calidad',
  'Auditoría interna'
];

export const CATEGORIAS_MEJORA = [
  'Fortalecimiento de la Gestión Interna y Mejora Continua',
  'Desarrollo y Profesionalización del Recurso Humano',
  'Innovación Tecnológica y Modernización Institucional',
  'Mejora de los Servicios y Atención al Usuario',
  'Seguridad Operativa y Sostenibilidad Ambiental'
];

// Períodos cuatrimestrales (nomenclatura corta compatible con folios y BD)
export const PERIODOS = [
  '1er. Cuatri (Ene-Abr)',
  '2do. Cuatri (May-Ago)',
  '3er. Cuatri (Sep-Dic)'
];

// Roles del equipo de trabajo — compartido por Acciones Correctivas y Planes de Mejora
export const ROLES_EQUIPO = [
  'Responsable principal',
  'Integrante área involucrada',
  'Integrante externo',
  'Enlace SGC',
  'Apoyo técnico',
  'Responsable de evidencias',
  'Auditor asignado'
];