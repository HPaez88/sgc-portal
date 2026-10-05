// Catálogo de Procesos y Orígenes - OOMAPASC de Cajeme
export const PROCESOS = [
  "Comercialización", "Comunicación", "Gestión de Recursos", 
  "Mantenimiento y Calibración", "Medición, Análisis y Mejora", 
  "Producción", "Proyectos e Infraestructura", "Responsabilidad de la Dirección"
];

// Detalle enriquecido de Procesos: Clave, Tipo de Proceso, Área Líder y Áreas que interactúan (para auditorías por procesos)
export const PROCESOS_DETALLE_INICIALES = [
  { 
    id: 1, 
    clave: 'PR-DIR-01', 
    nombre: 'Responsabilidad de la Dirección', 
    tipo: 'Estratégico', 
    areaResponsable: 'Sistema de Gestión de Calidad',
    areasInvolucradas: [
      'Sistema de Gestión de Calidad',
      'Órgano de Control Interno',
      'Comunicación e Imagen Institucional',
      'Línea OOMAPASC',
      'Cultura del agua'
    ]
  },
  { 
    id: 2, 
    clave: 'PR-PROD-02', 
    nombre: 'Producción', 
    tipo: 'Operativo', 
    areaResponsable: 'Plantas Potabilizadoras',
    areasInvolucradas: [
      'Plantas Potabilizadoras',
      'Control de Calidad',
      'Sectorización hidrométrica e innovación',
      'Suburbano Técnico',
      'Seguridad Industrial'
    ]
  },
  { 
    id: 3, 
    clave: 'PR-MNT-03', 
    nombre: 'Mantenimiento y Calibración', 
    tipo: 'Operativo', 
    areaResponsable: 'Mantenimiento de Redes',
    areasInvolucradas: [
      'Mantenimiento de Redes',
      'Alcantarillado y Saneamiento',
      'Control de Calidad',
      'Mantenimiento y Servicios Generales',
      'Seguridad Industrial',
      'Plantas Potabilizadoras'
    ]
  },
  { 
    id: 4, 
    clave: 'PR-COM-04', 
    nombre: 'Comercialización', 
    tipo: 'Operativo', 
    areaResponsable: 'Padrón de Usuarios',
    areasInvolucradas: [
      'Padrón de Usuarios',
      'Atención Ciudadana',
      'Contratos y Servicios',
      'Verificación y Lectura',
      'Control y Servicios',
      'Línea OOMAPASC',
      'Agencia Esperanza',
      'Agencia Pueblo Yaqui',
      'Agencia Providencia',
      'Agencia Marte R. Gómez'
    ]
  },
  { 
    id: 5, 
    clave: 'PR-REC-05', 
    nombre: 'Gestión de Recursos', 
    tipo: 'Apoyo', 
    areaResponsable: 'Recursos Humanos',
    areasInvolucradas: [
      'Recursos Humanos',
      'Recursos Materiales',
      'Contabilidad',
      'Licitaciones',
      'Informática',
      'Mantenimiento y Servicios Generales'
    ]
  },
  { 
    id: 6, 
    clave: 'PR-COM-06', 
    nombre: 'Comunicación', 
    tipo: 'Apoyo', 
    areaResponsable: 'Comunicación e Imagen Institucional',
    areasInvolucradas: [
      'Comunicación e Imagen Institucional',
      'Cultura del agua',
      'Programas Sociales',
      'Trabajo Social',
      'Atención Ciudadana'
    ]
  },
  { 
    id: 7, 
    clave: 'PR-INF-07', 
    nombre: 'Proyectos e Infraestructura', 
    tipo: 'Operativo', 
    areaResponsable: 'Proyectos e Infraestructura',
    areasInvolucradas: [
      'Proyectos e Infraestructura',
      'Supervisión y control de obras',
      'Trámites Técnicos',
      'Licitaciones',
      'Sectorización hidrométrica e innovación'
    ]
  },
  { 
    id: 8, 
    clave: 'PR-MED-08', 
    nombre: 'Medición, Análisis y Mejora', 
    tipo: 'Evaluación', 
    areaResponsable: 'Control de Calidad',
    areasInvolucradas: [
      'Control de Calidad',
      'Sistema de Gestión de Calidad',
      'Órgano de Control Interno',
      'Informática'
    ]
  }
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