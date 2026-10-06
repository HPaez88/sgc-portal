// ═══════════════════════════════════════════════════════════════════════════
// CATÁLOGO OFICIAL DE INDICADORES SGC (OOMAPASC DE CAJEME)
// Formato Institucional: OOMRSC-05 REV. 37 (Última Revisión: Abril 2026)
// Cuadro de Control de Desempeño · 100 Indicadores Oficiales (#0 a #99)
// ═══════════════════════════════════════════════════════════════════════════

export const FORMATO_CUADRO_CONTROL = {
  clave: 'OOMRSC-05',
  revision: 'Rev. 37',
  ultimaRevision: 'Abril 2026',
  titulo: 'Cuadro de Control de Desempeño',
  organismo: 'OOMAPAS de Cajeme',
  totalIndicadores: 100
};

export const RANGOS_SEMAFORO_OOMRSC05 = {
  ACEPTABLE: { rango: 'ACEPTABLE', min: 90, max: Infinity, label: 'Aceptable (90% a 100%)', cumple: 'SI', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  PREVENTIVO: { rango: 'PREVENTIVO', min: 80, max: 89.99, label: 'Preventivo (80% a 89%)', cumple: 'SI', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  CRITICO: { rango: 'CRITICO', min: -Infinity, max: 79.99, label: 'Crítico (<= 79%)', cumple: 'NO', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' }
};

export function evalSemaforoOOMRSC05(valorReal, meta, esMenor = false) {
  if (valorReal === null || valorReal === undefined || valorReal === '' || isNaN(Number(valorReal))) {
    return {
      cumple: 'PENDIENTE',
      rango: 'SIN_DATOS',
      porcentaje: null,
      label: 'Sin captura',
      color: 'slate',
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-200',
      dot: 'bg-slate-300'
    };
  }

  const numVal = Number(valorReal);
  const numMeta = Number(meta) || 100;
  let pct = 0;

  if (esMenor) {
    // Si es menor o igual a la meta (ej. accidentes = 0, errores = 0.5%)
    if (numMeta === 0) {
      pct = numVal === 0 ? 100 : Math.max(0, 100 - (numVal * 25));
    } else {
      pct = numVal <= numMeta ? 100 : Math.max(0, Math.round((numMeta / numVal) * 100));
    }
  } else {
    // Si es mayor o igual a la meta
    pct = numMeta > 0 ? Math.round((numVal / numMeta) * 100) : (numVal > 0 ? 100 : 0);
  }

  if (pct >= 90) {
    return { ...RANGOS_SEMAFORO_OOMRSC05.ACEPTABLE, rango: 'ACEPTABLE', porcentaje: pct, valor: numVal, cumple: 'SI' };
  } else if (pct >= 80) {
    return { ...RANGOS_SEMAFORO_OOMRSC05.PREVENTIVO, rango: 'PREVENTIVO', porcentaje: pct, valor: numVal, cumple: 'SI' };
  } else {
    return { ...RANGOS_SEMAFORO_OOMRSC05.CRITICO, rango: 'CRITICO', porcentaje: pct, valor: numVal, cumple: 'NO' };
  }
}

import { normalizarArea, normalizarDireccion, obtenerDireccionDeArea } from './areas';

const RAW_INDICADORES = [
  {
    "id": 0,
    "numero": 0,
    "nombre": "Lograr el grado de eficacia del SGC determinado por auditorías e indicadores.",
    "proceso": "Responsabilidad de la Dirección",
    "direccion": "General",
    "area": "Sistema de Gestión de Calidad",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 85.0,
    "meta_anual": 85,
    "metas_trimestrales": {
      "T1": 20,
      "T2": 20,
      "T3": 20,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 90,
    "observacion_default": "El grado de eficacia del SGC resultó en un 90% de cumplimiento.\nEl resultado por indicadores fue del 89%, quedando en rango aceptable; y por auditorías fue de 91%, quedando en rango aceptable.",
    "accion_default": "NA"
  },
  {
    "id": 1,
    "numero": 1,
    "nombre": "Cumplir con las metas establecidas por las direcciones adscritas a la Dirección General",
    "proceso": "Responsabilidad de la Dirección",
    "direccion": "General",
    "area": "Dirección General",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 85.0,
    "meta_anual": 85,
    "metas_trimestrales": {
      "T1": 20,
      "T2": 20,
      "T3": 20,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con las metas de las direcciones adscritas a la Dirección General.",
    "accion_default": "NA"
  },
  {
    "id": 2,
    "numero": 2,
    "nombre": "Mantener una relación de comunicación con el Consejo Consultivo.",
    "proceso": "Responsabilidad de la Dirección",
    "direccion": "General",
    "area": "Dirección General",
    "periodicidad": "Trimestral",
    "unidad": "Actas",
    "meta": 11.0,
    "meta_anual": 11,
    "metas_trimestrales": {
      "T1": 3,
      "T2": 3,
      "T3": 2,
      "T4": 3
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con 3 reuniones con el Consejo Consultivo.",
    "accion_default": "NA"
  },
  {
    "id": 3,
    "numero": 3,
    "nombre": "Remuneración del personal.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Humanos",
    "periodicidad": "Trimestral",
    "unidad": "Cantidad",
    "meta": 28.0,
    "meta_anual": 28,
    "metas_trimestrales": {
      "T1": 6,
      "T2": 6,
      "T3": 8,
      "T4": 8
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con la remuneración del personal.",
    "accion_default": "NA"
  },
  {
    "id": 4,
    "numero": 4,
    "nombre": "Remuneración a jubilados y pensionados",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Humanos",
    "periodicidad": "Trimestral",
    "unidad": "Cantidad",
    "meta": 28.0,
    "meta_anual": 28,
    "metas_trimestrales": {
      "T1": 6,
      "T2": 6,
      "T3": 8,
      "T4": 8
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con la remuneración de jubilados y pensionados.",
    "accion_default": "NA"
  },
  {
    "id": 5,
    "numero": 5,
    "nombre": "Cumplir con el programa  trimestral de capacitación.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Humanos",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con el programa tirmestral de capacitación.",
    "accion_default": "RC 04/2026"
  },
  {
    "id": 6,
    "numero": 6,
    "nombre": "Evaluación del ambiente de trabajo.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Humanos",
    "periodicidad": "Anual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 0,
      "T2": 0,
      "T3": 0,
      "T4": 95
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "El indicador es anual.",
    "accion_default": "NA"
  },
  {
    "id": 7,
    "numero": 7,
    "nombre": "Evaluar el desempeño de proveedores de productos químicos críticos",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Materiales",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la evaluación del desempeño de proveedores de productos químicos críticos.",
    "accion_default": "NA"
  },
  {
    "id": 8,
    "numero": 8,
    "nombre": "Atender las solicitudes de compra en el tiempo establecido.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Materiales",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se atendieron al 100% las solicitudes de compra en el tiempo establecido.",
    "accion_default": "NA"
  },
  {
    "id": 9,
    "numero": 9,
    "nombre": "Cumplir con el programa de verificación de activos fijos",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Recursos Materiales",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de verificación de activos fijos.",
    "accion_default": "NA"
  },
  {
    "id": 10,
    "numero": 10,
    "nombre": "Cumplir con el calendario contable y presupuestal.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Contabilidad",
    "periodicidad": "Mensual",
    "unidad": "Documentos",
    "meta": 29.0,
    "meta_anual": 29,
    "metas_trimestrales": {
      "T1": 8,
      "T2": 7,
      "T3": 7,
      "T4": 7
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 2,
    "observacion_default": "Se cumplió con el envío de los documentos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 11,
    "numero": 11,
    "nombre": "Accidentes de trabajo",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Seguridad Industrial",
    "periodicidad": "Mensual",
    "unidad": "Cantidad",
    "meta": 0.0,
    "meta_anual": 0,
    "metas_trimestrales": {
      "T1": 0,
      "T2": 0,
      "T3": 0,
      "T4": 0
    },
    "impacto": "Bajo",
    "es_menor": true,
    "valor_default": 2,
    "observacion_default": "Hubo 2 accidentes en el mes.",
    "accion_default": "NA"
  },
  {
    "id": 12,
    "numero": 12,
    "nombre": "Cumplir con el proceso de licitación pública o simplificada",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Licitaciones",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el proceso de licitación pública o simplificada.",
    "accion_default": "NA"
  },
  {
    "id": 13,
    "numero": 13,
    "nombre": "Cumplir con el proceso de adjudicación directa.",
    "proceso": "Gestión de Recursos",
    "direccion": "Administrativa",
    "area": "Licitaciones",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el proceso de adjudicación directa.",
    "accion_default": "NA"
  },
  {
    "id": 14,
    "numero": 14,
    "nombre": "Índice de programas federales gestionados",
    "proceso": "Gestión de Recursos",
    "direccion": "Técnica",
    "area": "Trámites Técnicos",
    "periodicidad": "Semestral",
    "unidad": "Programa",
    "meta": 1.0,
    "meta_anual": 1,
    "metas_trimestrales": {
      "T1": 1,
      "T2": 0,
      "T3": 0,
      "T4": 0
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Durante el mes de marzo el organismo se adherió al programa federal PEAS.",
    "accion_default": "NA"
  },
  {
    "id": 15,
    "numero": 15,
    "nombre": "Cumplir con el programa de mantenimiento preventivo de los equipos de cómputo.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Informática",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de mantenimiento a los equipos de cómputo.",
    "accion_default": "NA"
  },
  {
    "id": 16,
    "numero": 16,
    "nombre": "Solucionar las solicitudes de servicio.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Informática",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la solución de las solicitudes de servicio.",
    "accion_default": "NA"
  },
  {
    "id": 17,
    "numero": 17,
    "nombre": "Asegurar la disponibilidad de los servicios críticos de informática.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Informática",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la disponibilidad de los servicios críticos de informática.",
    "accion_default": "NA"
  },
  {
    "id": 18,
    "numero": 18,
    "nombre": "Revisión de instalaciones",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Seguridad Industrial",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de revisión de instalaciones.",
    "accion_default": "NA"
  },
  {
    "id": 19,
    "numero": 19,
    "nombre": "Cumplimiento al programa anual de mantenimiento preventivo a edificios.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Mensual",
    "unidad": "Cantidad",
    "meta": 804.0,
    "meta_anual": 804,
    "metas_trimestrales": {
      "T1": 202,
      "T2": 203,
      "T3": 202,
      "T4": 197
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió con el programa anual de mantenimiento preventivo a edificios.",
    "accion_default": "NA"
  },
  {
    "id": 20,
    "numero": 20,
    "nombre": "Cumplimiento al programa anual de mantenimiento preventivo para vehículos de transporte",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa anual de mantenimiento preventivo para vehículos de transporte.",
    "accion_default": "NA"
  },
  {
    "id": 21,
    "numero": 21,
    "nombre": "Cumplimiento al abastecimiento de las dotaciones de gasolina autorizadas.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Mensual",
    "unidad": "Reportes",
    "meta": 59.0,
    "meta_anual": 59,
    "metas_trimestrales": {
      "T1": 14,
      "T2": 15,
      "T3": 15,
      "T4": 15
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 5,
    "observacion_default": "Se cumplió con el abastecimiento de las dotaciones de gasolina.",
    "accion_default": "NA"
  },
  {
    "id": 22,
    "numero": 22,
    "nombre": "Cumplimiento a las solicitudes de mantenimiento correctivo para vehículos de transporte",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con las solicitudes de mantenimiento correctivo para vehículos de transporte.",
    "accion_default": "NA"
  },
  {
    "id": 23,
    "numero": 23,
    "nombre": "Cumplimiento al programa anual de intendencia",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Mensual",
    "unidad": "Registros",
    "meta": 1768.0,
    "meta_anual": 1768,
    "metas_trimestrales": {
      "T1": 442,
      "T2": 442,
      "T3": 442,
      "T4": 442
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 136,
    "observacion_default": "Se cumplió con el programa anual de intendencia.",
    "accion_default": "NA"
  },
  {
    "id": 24,
    "numero": 24,
    "nombre": "Atender los reportes de los usuarios de la ciudad.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Mantenimiento de Redes",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 95,
    "observacion_default": "No se cumplió con la atención de reportes de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 25,
    "numero": 25,
    "nombre": "Cumplir con programa de calibración y verificación de equipos de medición.",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Control de Calidad",
    "periodicidad": "Trimestral",
    "unidad": "Calibraciones y/o Verificaciones",
    "meta": 157.0,
    "meta_anual": 157,
    "metas_trimestrales": {
      "T1": 31,
      "T2": 43,
      "T3": 47,
      "T4": 36
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumple con el programa de calibraciones de equipos de medición.",
    "accion_default": "NA"
  },
  {
    "id": 26,
    "numero": 26,
    "nombre": "Índice de cumplimiento de los programas de mantenimiento a instalaciones y mantenimiento electromecánico preventivo y correctivo",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Plantas Potabilizadoras",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con los programas de mantenimiento a instalaciones y mantenimiento electromecánico preventivo y correctivo.",
    "accion_default": "NA"
  },
  {
    "id": 27,
    "numero": 27,
    "nombre": "Programa de mantenimiento de redes sanitaria",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Alcantarillado y Saneamiento",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 110,
    "observacion_default": "Se cumplió con el programa de mantenimiento de redes sanitaria.",
    "accion_default": "NA"
  },
  {
    "id": 28,
    "numero": 28,
    "nombre": "Cumplir con el programa anual de mantenimiento preventivo a equipos de cloración y dosificación",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Suburbano Técnico",
    "periodicidad": "Semestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 0,
      "T2": 50,
      "T3": 0,
      "T4": 50
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió al 100% con el programa  de mantenimiento preventivo a equipos de cloración y dosificación del semestre.",
    "accion_default": "NA"
  },
  {
    "id": 29,
    "numero": 29,
    "nombre": "Cumplir con el programa anual de mantenimiento preventivo y toma de parámetros eléctricos y mecánicos",
    "proceso": "Mantenimiento y Calibración",
    "direccion": "Técnica",
    "area": "Suburbano Técnico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de mantenimiento preventivo.",
    "accion_default": "NA"
  },
  {
    "id": 30,
    "numero": 30,
    "nombre": "Cumplir con el programa de mantenimiento anual de padrón de usuarios.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Padrón de Usuarios",
    "periodicidad": "Mensual",
    "unidad": "Visitas",
    "meta": 250000.0,
    "meta_anual": 250000,
    "metas_trimestrales": {
      "T1": 62500,
      "T2": 62500,
      "T3": 62500,
      "T4": 62500
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 27860,
    "observacion_default": "Se cumplió con el programa anual de padrón de usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 31,
    "numero": 31,
    "nombre": "Cobertura de Agua Potable",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Padrón de Usuarios",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con la cobertura de agua potable.",
    "accion_default": "NA"
  },
  {
    "id": 32,
    "numero": 32,
    "nombre": "Recaudación por visitas efectivas.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Control y Servicios",
    "periodicidad": "Mensual",
    "unidad": "Pesos",
    "meta": 100000000.0,
    "meta_anual": 100000000,
    "metas_trimestrales": {
      "T1": 25000000,
      "T2": 25000000,
      "T3": 25000000,
      "T4": 25000000
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 17485597.42,
    "observacion_default": "Se logró superar la meta de recaudación por visitas efectivas.",
    "accion_default": "NA"
  },
  {
    "id": 33,
    "numero": 33,
    "nombre": "Recaudación por cobranza especial.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Control y Servicios",
    "periodicidad": "Mensual",
    "unidad": "Pesos",
    "meta": 80000000.0,
    "meta_anual": 80000000,
    "metas_trimestrales": {
      "T1": 20000000,
      "T2": 20000000,
      "T3": 20000000,
      "T4": 20000000
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 14532697.53,
    "observacion_default": "Se logró superar la meta de recaudación por cobranza especial.",
    "accion_default": "NA"
  },
  {
    "id": 34,
    "numero": 34,
    "nombre": "Cumplir con el calendario mensual de facturación.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Verificación y Lectura",
    "periodicidad": "Mensual",
    "unidad": "Sectores",
    "meta": 216.0,
    "meta_anual": 216,
    "metas_trimestrales": {
      "T1": 54,
      "T2": 54,
      "T3": 54,
      "T4": 54
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 18,
    "observacion_default": "Se cumplió con el calendario mensual de facturación.",
    "accion_default": "NA"
  },
  {
    "id": 35,
    "numero": 35,
    "nombre": "Porcentaje de error en toma de lectura.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Verificación y Lectura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 0.5,
    "meta_anual": 0.5,
    "metas_trimestrales": {
      "T1": 0.125,
      "T2": 0.125,
      "T3": 0.125,
      "T4": 0.125
    },
    "impacto": "Alto",
    "es_menor": true,
    "valor_default": 0.55,
    "observacion_default": "No se cumplió con el porcentaje de error en toma de lectura.",
    "accion_default": "NA"
  },
  {
    "id": 36,
    "numero": 36,
    "nombre": "Cobertura de Micromedición en área urbana",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Verificación y Lectura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 60.0,
    "meta_anual": 60,
    "metas_trimestrales": {
      "T1": 15,
      "T2": 15,
      "T3": 15,
      "T4": 15
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 61.7,
    "observacion_default": "Se cumplió con la cobertura de Micromedición del área urbana,",
    "accion_default": "NA"
  },
  {
    "id": 37,
    "numero": 37,
    "nombre": "Cumplir con el presupuesto de ingresos en la gerencia Providencia.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Agencia Providencia",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 62.99,
    "observacion_default": "No se cumplió con el presupuesto programado de ingresos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 38,
    "numero": 38,
    "nombre": "Cumplir con el presupuesto de ingresos en la gerencia Esperanza",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Agencia Esperanza",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 84.39,
    "observacion_default": "No se cumplió con el presupuesto programado de ingresos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 39,
    "numero": 39,
    "nombre": "Cumplir con el presupuesto de ingresos en la gerencia Pueblo Yaqui.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Agencia Pueblo Yaqui",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 76.64,
    "observacion_default": "No se cumplió con el presupuesto programado de ingresos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 40,
    "numero": 40,
    "nombre": "Cumplir con el presupuesto de ingresos en la gerencia Marte R. Gomez.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Agencia Marte R. Gómez",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 62.27,
    "observacion_default": "No se cumplió con el presupuesto programado de ingresos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 41,
    "numero": 41,
    "nombre": "Cumplir con el presupuesto programado de ingresos.",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Dirección Comercial",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 91,
    "observacion_default": "No se cumplió con el presupuesto programado de ingresos del mes.",
    "accion_default": "NA"
  },
  {
    "id": 42,
    "numero": 42,
    "nombre": "Eficiencia comercial",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Dirección Comercial",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 60.0,
    "meta_anual": 60,
    "metas_trimestrales": {
      "T1": 15,
      "T2": 15,
      "T3": 15,
      "T4": 15
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 40.66,
    "observacion_default": "No se cumplió con la meta de la eficiencia comercial del mes.",
    "accion_default": "NA"
  },
  {
    "id": 43,
    "numero": 43,
    "nombre": "Eficiencia comercial de rezago",
    "proceso": "Comercialización",
    "direccion": "Comercial",
    "area": "Dirección Comercial",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 10.0,
    "meta_anual": 10,
    "metas_trimestrales": {
      "T1": 2,
      "T2": 3,
      "T3": 2,
      "T4": 3
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 0.68,
    "observacion_default": "No se cumplió con la meta de la eficiencia comercial de rezago del mes.",
    "accion_default": "NA"
  },
  {
    "id": 44,
    "numero": 44,
    "nombre": "Atender las órdenes de trabajo en un lapso de 7 días hábiles",
    "proceso": "Comercialización",
    "direccion": "Programas Sociales",
    "area": "Trabajo Social",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en atender las órdenes de trabajo.",
    "accion_default": "NA"
  },
  {
    "id": 45,
    "numero": 45,
    "nombre": "Cumplimiento a NOM-127-SSA1-2021 aplicable a control de calidad.",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Control de Calidad",
    "periodicidad": "Mensual",
    "unidad": "Muestreos",
    "meta": 10063.0,
    "meta_anual": 10063,
    "metas_trimestrales": {
      "T1": 2497,
      "T2": 2491,
      "T3": 2545,
      "T4": 2530
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 860,
    "observacion_default": "Se da cumplimiento a la norma aplicable a control de calidad con 860 muestreos.",
    "accion_default": "NA"
  },
  {
    "id": 46,
    "numero": 46,
    "nombre": "Índice de cumplimiento en muestreos y análisis de agua potable.",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Control de Calidad",
    "periodicidad": "Trimestral",
    "unidad": "Informes",
    "meta": 214.0,
    "meta_anual": 214,
    "metas_trimestrales": {
      "T1": 62,
      "T2": 48,
      "T3": 56,
      "T4": 48
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumple con el programa de análisis de agua potable.",
    "accion_default": "NA"
  },
  {
    "id": 47,
    "numero": 47,
    "nombre": "Producción de agua en plantas potabilizadoras y pozos de área urbana",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Plantas Potabilizadoras",
    "periodicidad": "Mensual",
    "unidad": "M3",
    "meta": 48439097.0,
    "meta_anual": 48439097,
    "metas_trimestrales": {
      "T1": 12397143,
      "T2": 11618468,
      "T3": 12195511,
      "T4": 12227975
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 3820690,
    "observacion_default": "Se cumplió con la producción de agua en plantas y pozos urbanos.",
    "accion_default": "NA"
  },
  {
    "id": 48,
    "numero": 48,
    "nombre": "Índice de cobertura de macromedición",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Plantas Potabilizadoras",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 70.0,
    "meta_anual": 70,
    "metas_trimestrales": {
      "T1": 20,
      "T2": 20,
      "T3": 20,
      "T4": 10
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 57,
    "observacion_default": "No se cumplió con el índice de cobertura de macromedición.",
    "accion_default": "NA"
  },
  {
    "id": 49,
    "numero": 49,
    "nombre": "Índice de agua residual tratada.",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Alcantarillado y Saneamiento",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el Índice de agua residual tratada.",
    "accion_default": "NA"
  },
  {
    "id": 50,
    "numero": 50,
    "nombre": "Programa de muestreo y análisis de aguas residuales",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Alcantarillado y Saneamiento",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de muestreo y análisis de aguas residuales.",
    "accion_default": "NA"
  },
  {
    "id": 51,
    "numero": 51,
    "nombre": "Cumplir con el volumen de agua potabilizada.",
    "proceso": "Producción",
    "direccion": "Técnica",
    "area": "Suburbano Técnico",
    "periodicidad": "Mensual",
    "unidad": "M3",
    "meta": 14583516.0,
    "meta_anual": 14583516,
    "metas_trimestrales": {
      "T1": 3645879,
      "T2": 3645879,
      "T3": 3645879,
      "T4": 3645879
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 1238600,
    "observacion_default": "Se cumplió con el volumen de agua programado.",
    "accion_default": "NA"
  },
  {
    "id": 52,
    "numero": 52,
    "nombre": "Realizar en el ejercicio fiscal una auditoría programada mensual.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Mensual",
    "unidad": "Informe",
    "meta": 12.0,
    "meta_anual": 12,
    "metas_trimestrales": {
      "T1": 3,
      "T2": 3,
      "T3": 3,
      "T4": 3
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 1,
    "observacion_default": "Se realizó la auditoría programada mensual.",
    "accion_default": "RC 12/2025, RC03/2026"
  },
  {
    "id": 53,
    "numero": 53,
    "nombre": "Revisar el seguimiento y control del recurso federalizado en el ejercicio fiscal.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Semestral",
    "unidad": "Porcentaje",
    "meta": 60.0,
    "meta_anual": 60,
    "metas_trimestrales": {
      "T1": 0,
      "T2": 30,
      "T3": 0,
      "T4": 30
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 16,
    "observacion_default": "Al mes de Agosto se considera avance de la revisión del 16% con recurso federal.",
    "accion_default": "RC 07/2026"
  },
  {
    "id": 54,
    "numero": 54,
    "nombre": "Atender las solicitudes de intervención especiales y no programadas.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Durante el mes se atendió al 100% las solicitudes de intervención especial y no programadas.",
    "accion_default": "NA"
  },
  {
    "id": 55,
    "numero": 55,
    "nombre": "Atender y dar seguimiento a las observaciones de los sujetos fiscalizadores.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "No se obtuvieron observaciones durante el  por parte de sujetos fiscalizadores.",
    "accion_default": "NA"
  },
  {
    "id": 56,
    "numero": 56,
    "nombre": "Atender al personal que acuda al OCI a asesorías.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se atendió al personal que acudió a asesorías.",
    "accion_default": "NA"
  },
  {
    "id": 57,
    "numero": 57,
    "nombre": "Atender a los usuarios que interpongan quejas y denuncias en contra del servicio o cualquier servidor público.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Órgano de Control de Interno",
    "area": "Órgano de Control Interno",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se atendieron al 100% los usuarios que interpusieron quejas y denuncias en contra del servicio o cualquier servidor público.",
    "accion_default": "NA"
  },
  {
    "id": 58,
    "numero": 58,
    "nombre": "Cumplir en los cierres de planes de acción de Matriz de Riesgos",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "General",
    "area": "Sistema de Gestión de Calidad",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió en tiempo con los planes de acción de la Matriz de Riesgos.",
    "accion_default": "NA"
  },
  {
    "id": 59,
    "numero": 59,
    "nombre": "Estado de acciones y mejoras.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "General",
    "area": "Sistema de Gestión de Calidad",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió en tiempo con el estado de acciones y mejoras.",
    "accion_default": "RC 08/2025"
  },
  {
    "id": 60,
    "numero": 60,
    "nombre": "Lograr el grado de eficacia derivado de las auditorías internas",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "General",
    "area": "Sistema de Gestión de Calidad",
    "periodicidad": "Bimestral",
    "unidad": "Porcentaje",
    "meta": 85.0,
    "meta_anual": 85,
    "metas_trimestrales": {
      "T1": 20,
      "T2": 20,
      "T3": 20,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 91,
    "observacion_default": "Se cumplió al 91% con el grado de eficacia derivado de las auditorías internas.",
    "accion_default": "NA"
  },
  {
    "id": 61,
    "numero": 61,
    "nombre": "Atender las llamadas o mensajes de solicitud de usuarios.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "General",
    "area": "Línea OOMAPASC",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la atención de llamadas y mensajes de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 62,
    "numero": 62,
    "nombre": "Medir la satisfacción del cliente en atención recibida.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "General",
    "area": "Línea OOMAPASC",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 98,
    "observacion_default": "Se cumplió al 98% con la satisfacción del ciente en la atención recibida.",
    "accion_default": "NA"
  },
  {
    "id": 63,
    "numero": 63,
    "nombre": "Cumplir con la satisfacción del cliente por la atención brindada.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Contratos y Servicios",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 96.0,
    "meta_anual": 96,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 24
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la satisfacción del cliente por la atención brindada.",
    "accion_default": "NA"
  },
  {
    "id": 64,
    "numero": 64,
    "nombre": "Cumplir en las encuestas de satisfacción al usuario externo en los servicios proporcionados  por el supervisor.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Verificación y Lectura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 23,
      "T2": 24,
      "T3": 24,
      "T4": 24
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 65,
    "numero": 65,
    "nombre": "Medir la eficiencia y el tiempo de respuesta establecido en 7 días hábiles a partir de la recepción del folio emitido por el H. Ayuntamiento de Cajeme.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Atención Ciudadana",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el tiempo de respuesta de las solicitudes del H. Ayuntamiento de Cajeme.",
    "accion_default": "NA"
  },
  {
    "id": 66,
    "numero": 66,
    "nombre": "Cumplir con la satisfacción del cliente por el servicio proporcionado",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Agencia Providencia",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 67,
    "numero": 67,
    "nombre": "Cumplir con la satisfacción del cliente por el servicio proporcionado",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Agencia Esperanza",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 68,
    "numero": 68,
    "nombre": "Cumplir con la satisfacción del cliente por el servicio proporcionado",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Agencia Pueblo Yaqui",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 69,
    "numero": 69,
    "nombre": "Cumplir con la satisfacción del cliente por el servicio proporcionado",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Agencia Marte R. Gómez",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 95.0,
    "meta_anual": 95,
    "metas_trimestrales": {
      "T1": 24,
      "T2": 24,
      "T3": 24,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 70,
    "numero": 70,
    "nombre": "Cumplir con la satisfacción de los usuarios por reconexiones",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Comercial",
    "area": "Control y Servicios",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 90.0,
    "meta_anual": 90,
    "metas_trimestrales": {
      "T1": 22,
      "T2": 23,
      "T3": 22,
      "T4": 23
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 98,
    "observacion_default": "Se cumplió al 98% con la satisfacción de los usuarios.",
    "accion_default": "NA"
  },
  {
    "id": 71,
    "numero": 71,
    "nombre": "Atender en tiempo y forma las solicitudes de información aplicables al área.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Transparencia",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en tiempo y forma con las solicitudes de información presentadas en el mes.",
    "accion_default": "NA"
  },
  {
    "id": 72,
    "numero": 72,
    "nombre": "Indicador de cumplimiento página de transparencia.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Transparencia",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió al 100% con la entrrega de la información de transparencia.",
    "accion_default": "NA"
  },
  {
    "id": 73,
    "numero": 73,
    "nombre": "Índice de atención por asesorías.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Coord. Jurídico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la atención por asesorías.",
    "accion_default": "NA"
  },
  {
    "id": 74,
    "numero": 74,
    "nombre": "Notificar a todas las áreas las actualizaciones que se presenten mensualmente en los documentos externos declarados.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Coord. Jurídico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se notificó al 100% a las áreas las actualizaciones en los documentos externos.",
    "accion_default": "NA"
  },
  {
    "id": 75,
    "numero": 75,
    "nombre": "Cumplir con la elaboración de solicitudes de contrato solicitados por la gerencia de licitaciones de conformidad al procedimiento OOMPJU-07.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Coord. Jurídico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con las solicitudes de contrato.",
    "accion_default": "NA"
  },
  {
    "id": 76,
    "numero": 76,
    "nombre": "Índice de juntas de gobierno.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Jurídico",
    "area": "Coord. Jurídico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "No se convocó a junta de gobierno en el mes.",
    "accion_default": "NA"
  },
  {
    "id": 77,
    "numero": 77,
    "nombre": "Índice de eficiencia administrativa.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Administrativa",
    "area": "Direccion Administrativa",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 90.0,
    "meta_anual": 90,
    "metas_trimestrales": {
      "T1": 22,
      "T2": 23,
      "T3": 22,
      "T4": 23
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "En el 2do trimestre se cumplió al 93% con la eficiencia administrativa.",
    "accion_default": "NA"
  },
  {
    "id": 78,
    "numero": 78,
    "nombre": "Sistema de gestión por comparación cuestionario único de información básica.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Administrativa",
    "area": "Direccion Administrativa",
    "periodicidad": "Anual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 100,
      "T2": 0,
      "T3": 0,
      "T4": 0
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se cumplió con la entrega del cuestionario único de información básica.",
    "accion_default": "NA"
  },
  {
    "id": 79,
    "numero": 79,
    "nombre": "Cumplimiento de la satisfacción del cliente.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Administrativa",
    "area": "Mtto. y servicios generales",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 94.0,
    "meta_anual": 94,
    "metas_trimestrales": {
      "T1": 23,
      "T2": 24,
      "T3": 23,
      "T4": 24
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 95,
    "observacion_default": "Se cumplió al 95% con la satisfacción del cliente.",
    "accion_default": "N/A"
  },
  {
    "id": 80,
    "numero": 80,
    "nombre": "Satisfacción del cliente",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Administrativa",
    "area": "Seguridad Industrial",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 90.0,
    "meta_anual": 90,
    "metas_trimestrales": {
      "T1": 23,
      "T2": 22,
      "T3": 23,
      "T4": 22
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la satisfacción del cliente.",
    "accion_default": "NA"
  },
  {
    "id": 81,
    "numero": 81,
    "nombre": "Cumplir con las auditorías para la acreditación de la NMX-EC-17025-IMNC-2018 y/o ISO/IEC 17025:2017.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Control de Calidad",
    "periodicidad": "Anual",
    "unidad": "Informes",
    "meta": 2.0,
    "meta_anual": 2,
    "metas_trimestrales": {
      "T1": 0,
      "T2": 2,
      "T3": 0,
      "T4": 0
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "Se llevó a cabo la auditoría durante el mes de julio.",
    "accion_default": "NA"
  },
  {
    "id": 82,
    "numero": 82,
    "nombre": "Índice de cumplimiento de reportes atendidos",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Alcantarillado y Saneamiento",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 167.33,
    "observacion_default": "Se cumplió al 167% con el índice de reportes atendidos.",
    "accion_default": "NA"
  },
  {
    "id": 83,
    "numero": 83,
    "nombre": "Cumplimiento del programa de inspecciones",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Alcantarillado y Saneamiento",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el programa de inspecciones.",
    "accion_default": "NA"
  },
  {
    "id": 84,
    "numero": 84,
    "nombre": "Atención a reportes suburbanos",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Suburbano Técnico",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 163.55,
    "observacion_default": "Se cumplió en la atención de reportes suburbanos programados.",
    "accion_default": "NA"
  },
  {
    "id": 85,
    "numero": 85,
    "nombre": "Índice de cumplimiento en los indicadores de las gerencias de la Subdirección de Operación y Mantenimiento.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Subdirección de Operación y Mantenimiento",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 85,
    "observacion_default": "No se cumplió en los indicadores de la gerencia de plantas potabilizadoras.",
    "accion_default": "NA"
  },
  {
    "id": 86,
    "numero": 86,
    "nombre": "Índice de cumplimiento en los indicadores de las gerencias de la Subdirección de Proyectos e Infraestructura.",
    "proceso": "Medición, Análisis y Mejora",
    "direccion": "Técnica",
    "area": "Subdirección de Proyectos e Infraestructura",
    "periodicidad": "Trimestral",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en los indicadores de las gerencias de la Subdirección de Proyectos e Infraestructura.",
    "accion_default": "NA"
  },
  {
    "id": 87,
    "numero": 87,
    "nombre": "Cumplir con tiempo, costo y calidad definidos en la supervisión de obras según proyecto autorizado",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Supervisión de Obras",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con el tiempo, costo y calidad definidos en la supervisión de obras según proyecto autorizado.",
    "accion_default": "NA"
  },
  {
    "id": 88,
    "numero": 88,
    "nombre": "Elaboración de prefactibilidades",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Proyectos e Infraestructura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la elaboración de prefactibilidades en el mes.",
    "accion_default": "NA"
  },
  {
    "id": 89,
    "numero": 89,
    "nombre": "Aprobación de proyectos de agua potable y/o alcantarillado sanitario",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Proyectos e Infraestructura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con las aprobaciones de proyectos de agua potable y/o alcantarillado sanitario.",
    "accion_default": "NA"
  },
  {
    "id": 90,
    "numero": 90,
    "nombre": "Elaboración de proyectos de agua potable y/o alcantarillado sanitario",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Proyectos e Infraestructura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con elaboración de proyectos de agua potable y/o alcantarillado sanitario.",
    "accion_default": "NA"
  },
  {
    "id": 91,
    "numero": 91,
    "nombre": "Elaboración de viabilidad comercial e industrial",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Proyectos e Infraestructura",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la elaboración de viabilidad comercial e industrial.",
    "accion_default": "NA"
  },
  {
    "id": 92,
    "numero": 92,
    "nombre": "Elaboración de proyectos para mejoramiento de la eficiencia",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Sectorización Hidrométrica e Innovación",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con la elaboración de proyectos.",
    "accion_default": "NA"
  },
  {
    "id": 93,
    "numero": 93,
    "nombre": "Detecciones de infraestructura subterránea.",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Sectorización Hidrométrica e Innovación",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con las detecciones de infraestructura subterránea solicitadas.",
    "accion_default": "NA"
  },
  {
    "id": 94,
    "numero": 94,
    "nombre": "Índice de cumplimiento de tiempo para cálculo de Derechos de Conexión.",
    "proceso": "Proyectos e Infraestructura",
    "direccion": "Técnica",
    "area": "Trámites Técnicos",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en el tiempo para el cálculo de Derechos de Conexión.",
    "accion_default": "NA"
  },
  {
    "id": 95,
    "numero": 95,
    "nombre": "Cumplir al 90% con los parámetros de comunicación interna.",
    "proceso": "Comunicación",
    "direccion": "General",
    "area": "Sistema de Gestión de Calidad",
    "periodicidad": "Anual",
    "unidad": "Porcentaje",
    "meta": 90.0,
    "meta_anual": 90,
    "metas_trimestrales": {
      "T1": 23,
      "T2": 22,
      "T3": 23,
      "T4": 22
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 0,
    "observacion_default": "El indicador es anual.",
    "accion_default": "NA"
  },
  {
    "id": 96,
    "numero": 96,
    "nombre": "Canalizar y dar seguimiento a los reportes que se publican en los medios de comunicación.",
    "proceso": "Comunicación",
    "direccion": "Administrativa",
    "area": "Comunicación e Imagen Institucional",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Alto",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% en canalizar y dar seguimiento a los reportes que se publican en los medios de comunicación.",
    "accion_default": "NA"
  },
  {
    "id": 97,
    "numero": 97,
    "nombre": "Cumplir con los diseños requeridos por el OOMAPAS de Cajeme.",
    "proceso": "Comunicación",
    "direccion": "Administrativa",
    "area": "Comunicación e Imagen Institucional",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con los diseños requeridos por el OOMAPAS de Cajeme.",
    "accion_default": "NA"
  },
  {
    "id": 98,
    "numero": 98,
    "nombre": "Boletines oficiales elaborados.",
    "proceso": "Comunicación",
    "direccion": "Administrativa",
    "area": "Comunicación e Imagen Institucional",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 25,
      "T2": 25,
      "T3": 25,
      "T4": 25
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 100,
    "observacion_default": "Se cumplió al 100% con los boletines oficiales solicitados.",
    "accion_default": "NA"
  },
  {
    "id": 99,
    "numero": 99,
    "nombre": "Cumplir con el programa anual de pláticas y actividades de cultura del agua.",
    "proceso": "Comunicación",
    "direccion": "Programas Sociales",
    "area": "Cultura del Agua",
    "periodicidad": "Mensual",
    "unidad": "Porcentaje",
    "meta": 100.0,
    "meta_anual": 100,
    "metas_trimestrales": {
      "T1": 30,
      "T2": 40,
      "T3": 10,
      "T4": 20
    },
    "impacto": "Bajo",
    "es_menor": false,
    "valor_default": 71.1,
    "observacion_default": "Se cumplió al 71.1% en el programa anual de pláticas de cultura del agua.",
    "accion_default": "NA"
  }
];

// Indicadores oficiales normalizados conforme a la estructura orgánica OOMAPASC
export const INDICADORES = RAW_INDICADORES.map(ind => {
  const normArea = normalizarArea(ind.area);
  const normDir = normalizarDireccion(ind.direccion || obtenerDireccionDeArea(normArea));
  return {
    ...ind,
    area: normArea,
    direccion: normDir
  };
});

export const REPORTES_CORRECCION_INICIALES = [
  {
    "id": 1,
    "ejercicio": "2023",
    "folio": "RC 4/2023",
    "responsable": "OCI",
    "estado": "CERRADA"
  },
  {
    "id": 2,
    "ejercicio": "2023",
    "folio": "RC 8, 9/2023",
    "responsable": "SGC",
    "estado": "CERRADA"
  },
  {
    "id": 3,
    "ejercicio": "2024",
    "folio": "RC 01",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 4,
    "ejercicio": "2024",
    "folio": "RC 02",
    "responsable": "HECTOR",
    "estado": "CERRADA"
  },
  {
    "id": 5,
    "ejercicio": "2024",
    "folio": "RC 03",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 6,
    "ejercicio": "2024",
    "folio": "RC 04",
    "responsable": "HECTOR",
    "estado": "CERRADA"
  },
  {
    "id": 7,
    "ejercicio": "2024",
    "folio": "RC 05",
    "responsable": "HECTOR",
    "estado": "CERRADA"
  },
  {
    "id": 8,
    "ejercicio": "2024",
    "folio": "RC 06",
    "responsable": "PADRÓN",
    "estado": "CERRADA"
  },
  {
    "id": 9,
    "ejercicio": "2024",
    "folio": "RC 07",
    "responsable": "HECTOR",
    "estado": "CERRADA"
  },
  {
    "id": 10,
    "ejercicio": "2024",
    "folio": "RC 08",
    "responsable": "HECTOR",
    "estado": "CERRADA"
  },
  {
    "id": 11,
    "ejercicio": "2024",
    "folio": "RC 09",
    "responsable": "EVELYN",
    "estado": "CERRADA"
  },
  {
    "id": 12,
    "ejercicio": "2025",
    "folio": "RC 01",
    "responsable": "EVELYN",
    "estado": "CERRADA"
  },
  {
    "id": 13,
    "ejercicio": "2025",
    "folio": "RC 02",
    "responsable": "PADRÓN",
    "estado": "CERRADA"
  },
  {
    "id": 14,
    "ejercicio": "2025",
    "folio": "RC 03",
    "responsable": "PADRÓN",
    "estado": "CERRADA"
  },
  {
    "id": 15,
    "ejercicio": "2025",
    "folio": "RC 04",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 16,
    "ejercicio": "2025",
    "folio": "RC 05",
    "responsable": "ALFREDO",
    "estado": "CERRADA"
  },
  {
    "id": 17,
    "ejercicio": "2025",
    "folio": "RC 06",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 18,
    "ejercicio": "2025",
    "folio": "RC 07",
    "responsable": "EVELYN",
    "estado": "CERRADA"
  },
  {
    "id": 19,
    "ejercicio": "2025",
    "folio": "RC 08",
    "responsable": "HECTOR",
    "estado": "ABIERTA"
  },
  {
    "id": 20,
    "ejercicio": "2025",
    "folio": "RC 09",
    "responsable": "EVELYN",
    "estado": "CERRADA"
  },
  {
    "id": 21,
    "ejercicio": "2025",
    "folio": "RC 10",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 22,
    "ejercicio": "2025",
    "folio": "RC 11",
    "responsable": "Ana Cecilia",
    "estado": "CERRADA"
  },
  {
    "id": 23,
    "ejercicio": "2025",
    "folio": "RC 12",
    "responsable": "EVELYN",
    "estado": "ABIERTA"
  },
  {
    "id": 24,
    "ejercicio": "2026",
    "folio": "RC 01",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 25,
    "ejercicio": "2026",
    "folio": "RC 02",
    "responsable": "EVELYN",
    "estado": "CERRADA"
  },
  {
    "id": 26,
    "ejercicio": "2026",
    "folio": "RC 03",
    "responsable": "EVELYN",
    "estado": "ABIERTA"
  },
  {
    "id": 27,
    "ejercicio": "2026",
    "folio": "RC 04",
    "responsable": "ANA CECILIA",
    "estado": "ABIERTA"
  },
  {
    "id": 28,
    "ejercicio": "2026",
    "folio": "RC 05",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 29,
    "ejercicio": "2026",
    "folio": "RC 06",
    "responsable": "Jazmín Sortillón",
    "estado": "CERRADA"
  },
  {
    "id": 30,
    "ejercicio": "2026",
    "folio": "RC 07",
    "responsable": "EVELYN",
    "estado": "ABIERTA"
  },
  {
    "id": 31,
    "ejercicio": "2026",
    "folio": "RC 08",
    "responsable": "MIGUEL",
    "estado": "CERRADA"
  },
  {
    "id": 32,
    "ejercicio": "2026",
    "folio": "RC 09",
    "responsable": "JAZMÍN",
    "estado": "CERRADA"
  }
];

export const INDICADORES_OOMAPASC_OFICIALES = INDICADORES;

