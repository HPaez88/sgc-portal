export const ORIGENES_AC = ["Auditoría", "Indicador", "Queja", "Otra"];

export const DIRECCIONES = [
  "Dir. General", "Dir. Técnica", "Dir. Jurídica", 
  "Dir. Órgano de Control Interno", "Dir. Comercial", "Dir. Administrativa", 
  "Dir. Programas Sociales y Cultura del Agua"
];

export const PROCESOS = [
  "Comercialización", "Comunicación", "Gestión de Recursos", 
  "Mantenimiento y Calibración", "Medición, Análisis y Mejora", 
  "Producción", "Proyectos e Infraestructura", "Responsabilidad de la Dirección"
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
  "Verificación Y Lectura"
];

export const getColorNivel = (nivel) => {
  if (nivel >= 15) return "bg-red-600 text-white";
  if (nivel >= 10) return "bg-orange-500 text-white";
  if (nivel >= 5) return "bg-yellow-400 text-black";
  return "bg-green-400 text-black";
};

export const getNivelRiesgo = (prob, imp) => {
  const p = Number(prob) || 0;
  const i = Number(imp) || 0;
  return p * i;
};

export const getEstadoColor = (estado) => {
  const colors = {
    "BORRADOR": "bg-slate-200 text-slate-700",
    "EN_REVISION": "bg-amber-100 text-amber-700", 
    "APROBADO": "bg-emerald-100 text-emerald-700",
    "RECHAZADO": "bg-red-100 text-red-700",
    "COMPLETADO": "bg-blue-100 text-blue-700"
  };
  return colors[estado] || "bg-slate-100 text-slate-600";
};

export const getRolColor = (rol) => {
  const colors = {
    "Super Admin": "bg-purple-100 text-purple-700",
    "Admin": "bg-cyan-100 text-cyan-700",
    "Auditor": "bg-blue-100 text-blue-700",
    "Encargado": "bg-amber-100 text-amber-700",
    "Usuario": "bg-slate-100 text-slate-600"
  };
  return colors[rol] || "bg-slate-100 text-slate-600";
};

export const INDICADORES = [
  { id: 1, nombre: "Lograr el grado de eficacia del SGC determinado por auditorías e indicadores.", area: "Sistema de Gestión de Calidad", proceso: "Responsabilidad de la Dirección", direccion: "Dir. General", meta: 85.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 2, nombre: "Cumplir con las metas establecidas por las direcciones adscritas a la Dirección General", area: "Dir. General", proceso: "Responsabilidad de la Dirección", direccion: "Dir. General", meta: 85.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 3, nombre: "Mantener una relación de comunicación con el Consejo Consultivo.", area: "Dir. General", proceso: "Responsabilidad de la Dirección", direccion: "Dir. General", meta: 11.0, unidad: "Actas", periodicidad: "Trimestral", es_menor: false },
];

export const getIndicadoresByArea = (area) => INDICADORES.filter(i => i.area === area);