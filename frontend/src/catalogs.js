export const ORIGENES_AC = ["Auditoría", "Indicador", "Queja", "Otra"];

export const DIRECCIONES = [
  "General", "Técnica", "Administrativa", "Órganos de Control Interno", 
  "Comercial", "Jurídica", "Programas Sociales y Cultura del Agua"
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
  "Verificación y Lectura"
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
  { id: 1, nombre: "Lograr el grado de eficacia del SGC determinado por auditorías e indicadores.", area: "Sistema de Gestión de Calidad", proceso: "Responsabilidad de la Dirección", direccion: "General", meta: 85.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 2, nombre: "Cumplir con las metas establecidas por las direcciones adscritas a la Dirección General", area: "Dirección General", proceso: "Responsabilidad de la Dirección", direccion: "General", meta: 85.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 3, nombre: "Mantener una relación de comunicación con el Consejo Consultivo.", area: "Dirección General", proceso: "Responsabilidad de la Dirección", direccion: "General", meta: 11.0, unidad: "Actas", periodicidad: "Trimestral", es_menor: false },
  { id: 4, nombre: "Remuneración del personal.", area: "Recursos Humanos", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 28.0, unidad: "Cantidad", periodicidad: "Trimestral", es_menor: false },
  { id: 5, nombre: "Remuneración a jubilados y pensionados", area: "Recursos Humanos", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 28.0, unidad: "Cantidad", periodicidad: "Trimestral", es_menor: false },
  { id: 6, nombre: "Cumplir con el programa trimestral de capacitación.", area: "Recursos Humanos", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 7, nombre: "Evaluación del ambiente de trabajo.", area: "Recursos Humanos", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 95.0, unidad: "Porcentaje", periodicidad: "Anual", es_menor: false },
  { id: 8, nombre: "Evaluar el desempeño de proveedores de productos químicos críticos", area: "Recursos Materiales", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 9, nombre: "Atender las solicitudes de compra en el tiempo establecido.", area: "Recursos Materiales", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 10, nombre: "Cumplir con el programa de verificación de activos fijos", area: "Recursos Materiales", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 11, nombre: "Cumplir con el calendario contable y presupuestal.", area: "Contabilidad", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 29.0, unidad: "Documentos", periodicidad: "Mensual", es_menor: false },
  { id: 12, nombre: "Accidentes de trabajo", area: "Seguridad Industrial", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 0.0, unidad: "Cantidad", periodicidad: "Mensual", es_menor: true },
  { id: 13, nombre: "Cumplir con el proceso de licitación pública o simplificada", area: "Licitaciones", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 14, nombre: "Cumplir con el proceso de adjudicación directa.", area: "Licitaciones", proceso: "Gestión de Recursos", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 15, nombre: "Índice de programas federales gestionados", area: "Trámites Técnicos", proceso: "Gestión de Recursos", direccion: "Técnica", meta: 1.0, unidad: "Programa", periodicidad: "Semestral", es_menor: false },
  { id: 16, nombre: "Cumplir con el programa de mantenimiento preventivo de los equipos de cómputo.", area: "Informática", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 17, nombre: "Solucionar las solicitudes de servicio.", area: "Informática", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 18, nombre: "Asegurar la disponibilidad de los servicios críticos de informática.", area: "Informática", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 19, nombre: "Revisión de instalaciones", area: "Seguridad Industrial", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 20, nombre: "Cumplimiento al programa anual de mantenimiento preventivo a edificios.", area: "Mtto. y servicios generales", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 804.0, unidad: "Cantidad", periodicidad: "Mensual", es_menor: false },
  { id: 21, nombre: "Cumplimiento al programa anual de mantenimiento preventivo para vehículos de transporte", area: "Mtto. y servicios generales", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 22, nombre: "Cumplimiento al abastecimiento de las dotaciones de gasolina autorizadas.", area: "Mtto. y servicios generales", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 59.0, unidad: "Reportes", periodicidad: "Mensual", es_menor: false },
  { id: 23, nombre: "Cumplimiento a las solicitudes de mantenimiento correctivo para vehículos de transporte", area: "Mtto. y servicios generales", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 95.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 24, nombre: "Cumplimiento al programa anual de intendencia", area: "Mtto. y servicios generales", proceso: "Mantenimiento y Calibración", direccion: "Administrativa", meta: 1768.0, unidad: "Registros", periodicidad: "Mensual", es_menor: false },
  { id: 25, nombre: "Atender los reportes de los usuarios de la ciudad.", area: "Mantenimiento de Redes", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 26, nombre: "Cumplir con programa de calibración y verificación de equipos de medición.", area: "Control de Calidad", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 157.0, unidad: "Calibraciones y/o Verificaciones", periodicidad: "Trimestral", es_menor: false },
  { id: 27, nombre: "Índice de cumplimiento de los programas de mantenimiento a instalaciones y mantenimiento electromecánico preventivo y correctivo", area: "Plantas Potabilizadoras", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 28, nombre: "Programa de mantenimiento de redes sanitaria", area: "Alcantarillado y Saneamiento", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 29, nombre: "Cumplir con el programa anual de mantenimiento preventivo a equipos de cloración y dosificación", area: "Suburbano Técnico", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Semestral", es_menor: false },
  { id: 30, nombre: "Cumplir con el programa anual de mantenimiento preventivo y toma de parámetros eléctricos y mecánicos", area: "Suburbano Técnico", proceso: "Mantenimiento y Calibración", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 31, nombre: "Cumplir con el programa anual de mantenimiento anual de padrón de usuarios.", area: "Padrón de Usuarios", proceso: "Comercialización", direccion: "Comercial", meta: 250000.0, unidad: "Visitas", periodicidad: "Mensual", es_menor: false },
  { id: 32, nombre: "Cobertura de Agua Potable", area: "Padrón de Usuarios", proceso: "Comercialización", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 33, nombre: "Recaudación por visitas efectivas.", area: "Control y Servicios", proceso: "Comercialización", direccion: "Comercial", meta: 100000000.0, unidad: "Pesos", periodicidad: "Mensual", es_menor: false },
  { id: 34, nombre: "Recaudación por cobranza especial.", area: "Control y Servicios", proceso: "Comercialización", direccion: "Comercial", meta: 80000000.0, unidad: "Pesos", periodicidad: "Mensual", es_menor: false },
  { id: 35, nombre: "Cumplir con el calendario mensual de facturación.", area: "Verificación y Lectura", proceso: "Comercialización", direccion: "Comercial", meta: 216.0, unidad: "Sectores", periodicidad: "Mensual", es_menor: false },
  { id: 36, nombre: "Porcentaje de error en toma de lectura.", area: "Verificación y Lectura", proceso: "Comercialización", direccion: "Comercial", meta: 0.5, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: true },
  { id: 37, nombre: "Cobertura de Micromedición en área urbana", area: "Verificación y Lectura", proceso: "Comercialización", direccion: "Comercial", meta: 60.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 38, nombre: "Cumplir con el presupuesto de ingresos en la gerencia Providencia.", area: "Agencia Providencia", proceso: "Comercialización", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 39, nombre: "Cumplir con el presupuesto de ingresos en la gerencia Esperanza", area: "Agencia Esperanza", proceso: "Comercialización", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 40, nombre: "Cumplir con el presupuesto de ingresos en la gerencia Pueblo Yaqui.", area: "Agencia Pueblo Yaqui", proceso: "Comercialización", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 41, nombre: "Cumplir con el presupuesto de ingresos en la gerencia Marte R. Gómez.", area: "Agencia Marte R. Gómez", proceso: "Comercialización", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 42, nombre: "Cumplir con el presupuesto programado de ingresos.", area: "Dirección Comercial", proceso: "Comercialización", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 43, nombre: "Eficiencia comercial", area: "Dirección Comercial", proceso: "Comercialización", direccion: "Comercial", meta: 60.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 44, nombre: "Eficiencia comercial de rezago", area: "Dirección Comercial", proceso: "Comercialización", direccion: "Comercial", meta: 10.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 45, nombre: "Atender las órdenes de trabajo en un lapso de 7 días hábiles", area: "Trabajo Social", proceso: "Comercialización", direccion: "Programas Sociales y Cultura del Agua", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 46, nombre: "Cumplimiento a NOM-127-SSA1-2021 aplicable a control de calidad.", area: "Control de Calidad", proceso: "Producción", direccion: "Técnica", meta: 10063.0, unidad: "Muestreos", periodicidad: "Mensual", es_menor: false },
  { id: 47, nombre: "Índice de cumplimiento en muestreos y análisis de agua potable.", area: "Control de Calidad", proceso: "Producción", direccion: "Técnica", meta: 214.0, unidad: "Informes", periodicidad: "Trimestral", es_menor: false },
  { id: 48, nombre: "Producción de agua en plantas potabilizadoras y pozos de área urbana", area: "Plantas Potabilizadoras", proceso: "Producción", direccion: "Técnica", meta: 48439097.0, unidad: "M3", periodicidad: "Mensual", es_menor: false },
  { id: 49, nombre: "Índice de cobertura de macromedición", area: "Plantas Potabilizadoras", proceso: "Producción", direccion: "Técnica", meta: 70.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 50, nombre: "Índice de agua residual tratada.", area: "Alcantarillado y Saneamiento", proceso: "Producción", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 51, nombre: "Programa de muestreo y análisis de aguas residuales", area: "Alcantarillado y Saneamiento", proceso: "Producción", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 52, nombre: "Cumplir con el volumen de agua potabilizada.", area: "Suburbano Técnico", proceso: "Producción", direccion: "Técnica", meta: 14583516.0, unidad: "M3", periodicidad: "Mensual", es_menor: false },
  { id: 53, nombre: "Realizar en el ejercicio fiscal una auditoría programada mensual.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 12.0, unidad: "Informe", periodicidad: "Mensual", es_menor: false },
  { id: 54, nombre: "Revisar el seguimiento y control del recurso federalizado en el ejercicio fiscal.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 60.0, unidad: "Porcentaje", periodicidad: "Semestral", es_menor: false },
  { id: 55, nombre: "Atender las solicitudes de intervención especiales y no programadas.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 56, nombre: "Atender y dar seguimiento a las observaciones de los sujetos fiscalizadores.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 57, nombre: "Atender al personal que acuda al OCI a asesorías.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 100.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 58, nombre: "Atender a los usuarios que interpongan quejas y denuncias en contra del servicio o cualquier servidor público.", area: "Órgano de Control Interno", proceso: "Medición, Análisis y Mejora", direccion: "Órganos de Control Interno", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: true },
  { id: 59, nombre: "Cumplir en los cierres de planes de acción de Matriz de Riesgos", area: "Sistema de Gestión de Calidad", proceso: "Medición, Análisis y Mejora", direccion: "General", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 60, nombre: "Estado de acciones y mejoras.", area: "Sistema de Gestión de Calidad", proceso: "Medición, Análisis y Mejora", direccion: "General", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 61, nombre: "Lograr el grado de eficacia derivado de las auditorías internas", area: "Sistema de Gestión de Calidad", proceso: "Medición, Análisis y Mejora", direccion: "General", meta: 85.0, unidad: "Porcentaje", periodicidad: "Bimestral", es_menor: false },
  { id: 62, nombre: "Atender las llamadas o mensajes de solicitud de usuarios.", area: "Línea OOMAPASC", proceso: "Medición, Análisis y Mejora", direccion: "General", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 63, nombre: "Medir la satisfacción del cliente en atención recibida.", area: "Línea OOMAPASC", proceso: "Medición, Análisis y Mejora", direccion: "General", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 64, nombre: "Cumplir con la satisfacción del cliente por la atención brindada.", area: "Contratos y Servicios", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 96.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 65, nombre: "Cumplir en las encuestas de satisfacción al usuario externo en los servicios proporcionados por el supervisor.", area: "Verificación y Lectura", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 66, nombre: "Medir la eficiencia y el tiempo de respuesta establecido en 7 días hábiles a partir de la recepción del folio emitido por el H. Ayuntamiento de Cajeme.", area: "Atención Ciudadana", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 67, nombre: "Cumplir con la satisfacción del cliente por el servicio proporcionado", area: "Agencia Providencia", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 68, nombre: "Cumplir con la satisfacción del cliente por el servicio proporcionado", area: "Agencia Esperanza", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 69, nombre: "Cumplir con la satisfacción del cliente por el servicio proporcionado", area: "Agencia Pueblo Yaqui", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 70, nombre: "Cumplir con la satisfacción del cliente por el servicio proporcionado", area: "Agencia Marte R. Gómez", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 95.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 71, nombre: "Cumplir con la satisfacción de los usuarios por reconexiones", area: "Control y Servicios", proceso: "Medición, Análisis y Mejora", direccion: "Comercial", meta: 90.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 72, nombre: "Atender en tiempo y forma las solicitudes de información aplicables al área.", area: "Transparencia", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 73, nombre: "Indicador de cumplimiento página de transparencia.", area: "Transparencia", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 74, nombre: "Índice de atención por asesorías.", area: "Coord. Jurídico", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 75, nombre: "Notificar a todas las áreas las actualizaciones que se presenten mensualmente en los documentos externos declarados.", area: "Coord. Jurídico", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 76, nombre: "Cumplir con la elaboración de solicitudes de contrato solicitados por la gerencia de licitaciones de conformidad al procedimiento OOMPJU-07.", area: "Coord. Jurídico", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 77, nombre: "Índice de juntas de gobierno.", area: "Coord. Jurídico", proceso: "Medición, Análisis y Mejora", direccion: "Jurídica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 78, nombre: "Índice de eficiencia administrativa.", area: "Dirección Administrativa", proceso: "Medición, Análisis y Mejora", direccion: "Administrativa", meta: 90.0, unidad: "Porcentaje", periodicidad: "Trimestral", es_menor: false },
  { id: 79, nombre: "Sistema de gestión por comparación cuestionario único de información básica.", area: "Dirección Administrativa", proceso: "Medición, Análisis y Mejora", direccion: "Administrativa", meta: 100.0, unidad: "Porcentaje", periodicidad: "Anual", es_menor: false },
  { id: 80, nombre: "Cumplimiento de la satisfacción del cliente.", area: "Mtto. y servicios generales", proceso: "Medición, Análisis y Mejora", direccion: "Administrativa", meta: 94.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 81, nombre: "Satisfacción del cliente", area: "Seguridad Industrial", proceso: "Medición, Análisis y Mejora", direccion: "Administrativa", meta: 90.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 82, nombre: "Cumplir con las auditorías para la acreditación de la NMX-EC-17025-IMNC-2018 y/o ISO/IEC 17025:2017.", area: "Control de Calidad", proceso: "Medición, Análisis y Mejora", direccion: "Técnica", meta: 2.0, unidad: "Informes", periodicidad: "Anual", es_menor: false },
  { id: 83, nombre: "Índice de cumplimiento de reportes atendidos", area: "Alcantarillado y Saneamiento", proceso: "Medición, Análisis y Mejora", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 84, nombre: "Cumplimiento del programa de inspecciones", area: "Alcantarillado y Saneamiento", proceso: "Medición, Análisis y Mejora", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 85, nombre: "Atención a reportes suburbanos", area: "Suburbano Técnico", proceso: "Medición, Análisis y Mejora", direccion: "Técnica", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
  { id: 86, nombre: "Cumplir con el programa anual de pláticas y actividades de cultura del agua.", area: "Trabajo Social", proceso: "Comunicación", direccion: "Programas Sociales y Cultura del Agua", meta: 100.0, unidad: "Porcentaje", periodicidad: "Mensual", es_menor: false },
];

export const getIndicadoresByArea = (area) => INDICADORES.filter(i => i.area === area);