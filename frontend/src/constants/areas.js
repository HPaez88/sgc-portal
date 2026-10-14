// Catálogo de Áreas y Direcciones - OOMAPASC de Cajeme
// Direcciones con la nomenclatura oficial usada en usuarios y formatos
export const DIRECCIONES = [
  "Dir. General",
  "Dir. Técnica",
  "Dir. Comercial",
  "Dir. Administrativa",
  "Dir. Órgano de Control Interno",
  "Dir. Jurídica",
  "Dir. Programas Sociales y Cultura del Agua"
];

export const AREAS = [
  "Agencia Esperanza",
  "Agencia Marte R. Gómez",
  "Agencia Providencia",
  "Agencia Pueblo Yaqui",
  "Alcantarillado y Saneamiento",
  "Atención Ciudadana",
  "Comunicación e Imagen Institucional",
  "Contabilidad",
  "Contratos y Servicios",
  "Control de Calidad",
  "Control y Servicios",
  "Cultura del agua",
  "Informática",
  "Jurídico",
  "Licitaciones",
  "Línea OOMAPASC",
  "Mantenimiento de Redes",
  "Mantenimiento y Servicios Generales",
  "Órgano de Control Interno",
  "Padrón de Usuarios",
  "Plantas Potabilizadoras",
  "Programas Sociales",
  "Proyectos e Infraestructura",
  "Recursos Humanos",
  "Recursos Materiales",
  "Sectorización hidrométrica e innovación",
  "Seguridad Industrial",
  "Sistema de Gestión de Calidad",
  "Suburbano Técnico",
  "Supervisión y control de obras",
  "Trabajo Social",
  "Trámites Técnicos",
  "Verificación y Lectura"
];

// Detalle enriquecido de Direcciones: Director actual, correo institucional y siglas
export const DIRECCIONES_DETALLE_INICIALES = [
  { id: 1, nombre: "Dir. General", director: "Lic. Héctor Manuel Páez León", correo: "hpaez@oomapasc.gob.mx", siglas: "DG", telefono: "6441894125" },
  { id: 2, nombre: "Dir. Técnica", director: "Ing. Manuel Campas", correo: "mcampas@oomapasc.gob.mx", siglas: "DT", telefono: "6444102000" },
  { id: 3, nombre: "Dir. Comercial", director: "Lic. Enrique Moras", correo: "emoras@oomapasc.gob.mx", siglas: "DC", telefono: "6444102010" },
  { id: 4, nombre: "Dir. Administrativa", director: "C.P. Claudia Valenzuela", correo: "cvalenzuela@oomapasc.gob.mx", siglas: "DA", telefono: "6444102020" },
  { id: 5, nombre: "Dir. Órgano de Control Interno", director: "Lic. Javier Armenta", correo: "controlinterno@oomapasc.gob.mx", siglas: "OCI", telefono: "6444102030" },
  { id: 6, nombre: "Dir. Jurídica", director: "Lic. Carlos Soto", correo: "juridico@oomapasc.gob.mx", siglas: "DJ", telefono: "6444102040" },
  { id: 7, nombre: "Dir. Programas Sociales y Cultura del Agua", director: "Lic. Rosa Amelia Gómez", correo: "culturadelagua@oomapasc.gob.mx", siglas: "DPS", telefono: "6444102050" }
];

// Detalle enriquecido de Áreas: Encargado actual, correo electrónico para avisos del SGC y dirección
export const AREAS_DETALLE_INICIALES = [
  { id: 1, nombre: "Sistema de Gestión de Calidad", encargado: "Lic. Héctor Manuel Páez León", correo: "hpaez@oomapasc.gob.mx", direccion: "Dir. General", telefono: "6441894125" },
  { id: 2, nombre: "Control de Calidad", encargado: "Ing. Juan López", correo: "jlopez@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6441234567" },
  { id: 3, nombre: "Plantas Potabilizadoras", encargado: "Ing. Carlos Mendoza", correo: "cmendoza@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6441345678" },
  { id: 4, nombre: "Mantenimiento de Redes", encargado: "Ing. Pedro Martínez", correo: "pmartinez@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443456789" },
  { id: 5, nombre: "Alcantarillado y Saneamiento", encargado: "Ing. Roberto Castro", correo: "rcastro@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6441567890" },
  { id: 6, nombre: "Atención Ciudadana", encargado: "Lic. María García", correo: "mgarcia@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6442345678" },
  { id: 7, nombre: "Contabilidad", encargado: "C.P. Ana Hernández", correo: "ahernandez@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6444567890" },
  { id: 8, nombre: "Informática", encargado: "Ing. Alejandro Beltrán", correo: "abeltran@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6441789012" },
  { id: 9, nombre: "Recursos Humanos", encargado: "Lic. Gabriela Félix", correo: "gfelix@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6441890123" },
  { id: 10, nombre: "Recursos Materiales", encargado: "Lic. Mario Valenzuela", correo: "mvalenzuela@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6441901234" },
  { id: 11, nombre: "Padrón de Usuarios", encargado: "Lic. Fernando Morales", correo: "fmorales@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6442012345" },
  { id: 12, nombre: "Contratos y Servicios", encargado: "Lic. Karla Bojórquez", correo: "kbojorquez@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6442123456" },
  { id: 13, nombre: "Verificación y Lectura", encargado: "Ing. Ramón Duarte", correo: "rduarte@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6442234567" },
  { id: 14, nombre: "Jurídico", encargado: "Lic. Carlos Soto", correo: "csoto@oomapasc.gob.mx", direccion: "Dir. Jurídica", telefono: "6442345678" },
  { id: 15, nombre: "Órgano de Control Interno", encargado: "Lic. Javier Armenta", correo: "jarmenta@oomapasc.gob.mx", direccion: "Dir. Órgano de Control Interno", telefono: "6442456789" },
  { id: 16, nombre: "Cultura del agua", encargado: "Lic. Rosa Amelia Gómez", correo: "rgomez@oomapasc.gob.mx", direccion: "Dir. Programas Sociales y Cultura del Agua", telefono: "6442567890" },
  { id: 17, nombre: "Programas Sociales", encargado: "Lic. Claudia Morales", correo: "cmorales@oomapasc.gob.mx", direccion: "Dir. Programas Sociales y Cultura del Agua", telefono: "6442678901" },
  { id: 18, nombre: "Comunicación e Imagen Institucional", encargado: "Lic. Sergio Ramos", correo: "sramos@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6442789012" },
  { id: 19, nombre: "Línea OOMAPASC", encargado: "Lic. Patricia Vega", correo: "pvega@oomapasc.gob.mx", direccion: "Dir. General", telefono: "6442890123" },
  { id: 20, nombre: "Seguridad Industrial", encargado: "Ing. Luis Navarro", correo: "lnavarro@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6442901234" },
  { id: 21, nombre: "Sectorización hidrométrica e innovación", encargado: "Ing. David Figueroa", correo: "dfigueroa@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443012345" },
  { id: 22, nombre: "Proyectos e Infraestructura", encargado: "Ing. Francisco Ruiz", correo: "fruiz@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443123456" },
  { id: 23, nombre: "Supervisión y control de obras", encargado: "Ing. Jorge Alatorre", correo: "jalatorre@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443234567" },
  { id: 24, nombre: "Trámites Técnicos", encargado: "Ing. Lucía Mendívil", correo: "lmendivil@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443345678" },
  { id: 25, nombre: "Suburbano Técnico", encargado: "Ing. Esteban Parra", correo: "eparra@oomapasc.gob.mx", direccion: "Dir. Técnica", telefono: "6443456789" },
  { id: 26, nombre: "Licitaciones", encargado: "Lic. Manuel Noriega", correo: "mnoriega@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6443567890" },
  { id: 27, nombre: "Mantenimiento y Servicios Generales", encargado: "Ing. Tomás Coronado", correo: "tcoronado@oomapasc.gob.mx", direccion: "Dir. Administrativa", telefono: "6443678901" },
  { id: 28, nombre: "Trabajo Social", encargado: "Lic. Silvia Orozco", correo: "sorozco@oomapasc.gob.mx", direccion: "Dir. Programas Sociales y Cultura del Agua", telefono: "6443789012" },
  { id: 29, nombre: "Control y Servicios", encargado: "Lic. Carmen Leyva", correo: "cleyva@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6443890123" },
  { id: 30, nombre: "Agencia Esperanza", encargado: "C. Martín Robles", correo: "ag.esperanza@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6443901234" },
  { id: 31, nombre: "Agencia Pueblo Yaqui", encargado: "C. Daniel Cárdenas", correo: "ag.puebloyaqui@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6444012345" },
  { id: 32, nombre: "Agencia Providencia", encargado: "C. Elena Quintana", correo: "ag.providencia@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6444123456" },
  { id: 33, nombre: "Agencia Marte R. Gómez", encargado: "C. Víctor Lugo", correo: "ag.martergomez@oomapasc.gob.mx", direccion: "Dir. Comercial", telefono: "6444234567" }
];

/**
 * Normaliza cualquier variante de texto a una de las 7 direcciones oficiales del catálogo OOMAPASC.
 */
export function normalizarDireccion(nombre) {
  if (!nombre) return 'Dir. General';
  const n = String(nombre).trim();
  if (DIRECCIONES.includes(n)) return n;
  const lower = n.toLowerCase();
  if (lower.includes('admin')) return 'Dir. Administrativa';
  if (lower.includes('comerc')) return 'Dir. Comercial';
  if (lower.includes('técn') || lower.includes('tecn')) return 'Dir. Técnica';
  if (lower.includes('juríd') || lower.includes('jurid')) return 'Dir. Jurídica';
  if (lower.includes('social') || lower.includes('cultura')) return 'Dir. Programas Sociales y Cultura del Agua';
  if (lower.includes('control') || lower.includes('órgano') || lower.includes('organo')) return 'Dir. Órgano de Control Interno';
  if (lower.includes('general')) return 'Dir. General';
  return 'Dir. General';
}

/**
 * Normaliza cualquier variante o nombre histórico al catálogo de las 33 áreas oficiales de OOMAPASC.
 */
export function normalizarArea(areaNombre) {
  if (!areaNombre) return 'Sistema de Gestión de Calidad';
  const a = String(areaNombre).trim();
  if (AREAS.includes(a)) return a;
  const lower = a.toLowerCase();
  if (lower.includes('mtto') && lower.includes('servicios')) return 'Mantenimiento y Servicios Generales';
  if (lower.includes('supervisión') || lower.includes('supervision')) return 'Supervisión y control de obras';
  if (lower.includes('sectorización') || lower.includes('sectorizacion')) return 'Sectorización hidrométrica e innovación';
  if (lower.includes('cultura del agua') || lower.includes('cultura')) return 'Cultura del agua';
  if (lower.includes('juríd') || lower.includes('jurid')) return 'Jurídico';
  if (lower.includes('transparencia') || lower.includes('control interno')) return 'Órgano de Control Interno';
  if (lower.includes('operación y mantenimiento') || lower.includes('operacion y mantenimiento')) return 'Mantenimiento de Redes';
  if (lower.includes('proyectos e infraestructura')) return 'Proyectos e Infraestructura';
  if (lower.includes('dirección general') || lower.includes('direccion general')) return 'Sistema de Gestión de Calidad';
  if (lower.includes('dirección comercial') || lower.includes('direccion comercial')) return 'Control y Servicios';
  if (lower.includes('dirección administrativa') || lower.includes('direccion administrativa')) return 'Contabilidad';
  if (lower.includes('atención') || lower.includes('atencion')) return 'Atención Ciudadana';
  if (lower.includes('calidad')) return 'Control de Calidad';
  if (lower.includes('plantas')) return 'Plantas Potabilizadoras';
  if (lower.includes('redes')) return 'Mantenimiento de Redes';
  if (lower.includes('alcantarillado')) return 'Alcantarillado y Saneamiento';
  if (lower.includes('padrón') || lower.includes('padron')) return 'Padrón de Usuarios';
  if (lower.includes('contratos')) return 'Contratos y Servicios';
  if (lower.includes('lectura')) return 'Verificación y Lectura';
  if (lower.includes('recursos humanos')) return 'Recursos Humanos';
  if (lower.includes('materiales')) return 'Recursos Materiales';
  if (lower.includes('informática') || lower.includes('informatica')) return 'Informática';
  if (lower.includes('licitaciones')) return 'Licitaciones';
  if (lower.includes('social')) return 'Programas Sociales';
  return 'Sistema de Gestión de Calidad';
}

/**
 * Obtiene la dirección oficial asignada a un área según la estructura orgánica institucional.
 */
export function obtenerDireccionDeArea(areaNombre) {
  const normArea = normalizarArea(areaNombre);
  const found = AREAS_DETALLE_INICIALES.find(ad => ad.nombre === normArea);
  return found ? found.direccion : 'Dir. General';
}