// ═══════════════════════════════════════════════════════════════════════════
// DIRECCIONES — catálogo canónico, alias y mapeo Área → Dirección
// ═══════════════════════════════════════════════════════════════════════════

// Alias aceptados → dirección canónica (compatibilidad con backend y datos previos)
export const DIRECCION_ALIAS = {
  'general': 'Dir. General',
  'dir. general': 'Dir. General',
  'técnica': 'Dir. Técnica',
  'tecnica': 'Dir. Técnica',
  'dir. técnica': 'Dir. Técnica',
  'dir. tecnica': 'Dir. Técnica',
  'comercial': 'Dir. Comercial',
  'dir. comercial': 'Dir. Comercial',
  'administrativa': 'Dir. Administrativa',
  'dir. administrativa': 'Dir. Administrativa',
  'organo de control interno': 'Dir. Órgano de Control Interno',
  'órgano de control interno': 'Dir. Órgano de Control Interno',
  'órganos de control interno': 'Dir. Órgano de Control Interno',
  'organos de control interno': 'Dir. Órgano de Control Interno',
  'dir. órgano de control interno': 'Dir. Órgano de Control Interno',
  'dir. organo de control interno': 'Dir. Órgano de Control Interno',
  'jurídica': 'Dir. Jurídica',
  'juridica': 'Dir. Jurídica',
  'dir. jurídica': 'Dir. Jurídica',
  'dir. juridica': 'Dir. Jurídica',
  'programas sociales y cultura del agua': 'Dir. Programas Sociales y Cultura del Agua',
  'dir. programas sociales y cultura del agua': 'Dir. Programas Sociales y Cultura del Agua',
};

export const normalizarDireccion = (direccion) => {
  if (!direccion) return '';
  const key = String(direccion).trim().toLowerCase();
  return DIRECCION_ALIAS[key] || direccion;
};

// Mapeo oficial Área → Dirección (espejo de backend/routers/_sgc_common.py)
export const AREA_DIRECCION = {
  'Agencia Esperanza': 'Dir. Comercial',
  'Agencia Marte R. Gómez': 'Dir. Comercial',
  'Agencia Providencia': 'Dir. Comercial',
  'Agencia Pueblo Yaqui': 'Dir. Comercial',
  'Alcantarillado y Saneamiento': 'Dir. Técnica',
  'Atención Ciudadana': 'Dir. Comercial',
  'Comunicación e Imagen Institucional': 'Dir. Administrativa',
  'Contabilidad': 'Dir. Administrativa',
  'Contratos y Servicios': 'Dir. Comercial',
  'Control de Calidad': 'Dir. Técnica',
  'Control y Servicios': 'Dir. Comercial',
  'Cultura del agua': 'Dir. Programas Sociales y Cultura del Agua',
  'Informática': 'Dir. Administrativa',
  'Jurídico': 'Dir. Jurídica',
  'Licitaciones': 'Dir. Administrativa',
  'Línea OOMAPASC': 'Dir. General',
  'Mantenimiento de Redes': 'Dir. Técnica',
  'Mantenimiento y Servicios Generales': 'Dir. Administrativa',
  'Órgano de Control Interno': 'Dir. Órgano de Control Interno',
  'Padrón de Usuarios': 'Dir. Comercial',
  'Plantas Potabilizadoras': 'Dir. Técnica',
  'Programas Sociales': 'Dir. Programas Sociales y Cultura del Agua',
  'Proyectos e Infraestructura': 'Dir. Técnica',
  'Recursos Humanos': 'Dir. Administrativa',
  'Recursos Materiales': 'Dir. Administrativa',
  'Sectorización hidrométrica e innovación': 'Dir. Técnica',
  'Seguridad Industrial': 'Dir. Técnica',
  'Sistema de Gestión de Calidad': 'Dir. General',
  'Suburbano Técnico': 'Dir. Técnica',
  'Supervisión y control de obras': 'Dir. Técnica',
  'Trabajo Social': 'Dir. Programas Sociales y Cultura del Agua',
  'Trámites Técnicos': 'Dir. Técnica',
  'Verificación y Lectura': 'Dir. Comercial',
};

// Devuelve la dirección que corresponde a un área (normalizada)
export const getDireccionDeArea = (area) => {
  if (!area) return '';
  if (AREA_DIRECCION[area]) return AREA_DIRECCION[area];
  const encontrado = Object.keys(AREA_DIRECCION).find(
    (k) => k.toLowerCase() === String(area).trim().toLowerCase()
  );
  return encontrado ? AREA_DIRECCION[encontrado] : '';
};
