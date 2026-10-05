// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO DE TRAZABILIDAD E IMPACTO DOCUMENTAL SGC (ISO 9001:2015 - 7.5.3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Catálogo base de documentos iniciales con claves y referencias cruzadas oficiales
 */
export const DOCUMENTOS_SGC_INICIALES = [
  {
    id: 1,
    clave: 'MC-01',
    titulo: 'Manual del Sistema de Gestión de Calidad',
    tipo: 'Manual',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 04',
    fecha: '2026-01-15',
    autor: 'Lic. Héctor Manuel Páez León',
    estado: 'APROBADO',
    referencias_usadas: ['OOMRSC-20', 'OOMRSC-21', 'PR-CAL-01', 'PR-AUD-01'],
    descripcion: 'Documento maestro que describe el alcance del SGC bajo la norma ISO 9001:2015 en OOMAPASC.'
  },
  {
    id: 2,
    clave: 'PR-CAL-01',
    titulo: 'Procedimiento de Acciones Correctivas y No Conformidades',
    tipo: 'Procedimiento',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 06',
    fecha: '2026-02-10',
    autor: 'Lic. Héctor Manuel Páez León',
    estado: 'APROBADO',
    referencias_usadas: ['OOMRSC-20'],
    descripcion: 'Establece la metodología para identificar no conformidades, análisis de causa raíz y seguimiento de eficacia.'
  },
  {
    id: 3,
    clave: 'OOMRSC-20',
    titulo: 'Formato de Acción Correctiva',
    tipo: 'Registro',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 18',
    fecha: '2026-01-10',
    autor: 'Lic. Héctor Manuel Páez León',
    estado: 'APROBADO',
    referencias_usadas: [],
    descripcion: 'Registro oficial de investigación de causa raíz, corrección, plan de acción y dictamen de cierre.'
  },
  {
    id: 4,
    clave: 'PR-MEJ-01',
    titulo: 'Procedimiento de Mejora Continua',
    tipo: 'Procedimiento',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 03',
    fecha: '2026-01-20',
    autor: 'Ing. Calidad SGC',
    estado: 'APROBADO',
    referencias_usadas: ['OOMRSC-21'],
    descripcion: 'Metodología para la propuesta, evaluación de viabilidad, costeo y ejecución de proyectos de mejora.'
  },
  {
    id: 5,
    clave: 'OOMRSC-21',
    titulo: 'Formato de Plan de Mejora Continua',
    tipo: 'Registro',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 02',
    fecha: '2026-01-10',
    autor: 'Lic. Héctor Manuel Páez León',
    estado: 'APROBADO',
    referencias_usadas: [],
    descripcion: 'Registro oficial para la captura de objetivos de mejora, presupuesto, cronograma de actividades e indicadores.'
  },
  {
    id: 6,
    clave: 'PR-POT-01',
    titulo: 'Procedimiento Operativo de Potabilización y Cloración',
    tipo: 'Procedimiento',
    area: 'Operación',
    version: 'Rev. 05',
    fecha: '2026-02-28',
    autor: 'Ing. Pedro Martínez',
    estado: 'APROBADO',
    referencias_usadas: ['REG-CLORO-01', 'OOMRSC-20'],
    descripcion: 'Instrucciones para la dosificación de hipoclorito, muestreo de cloro residual y control de calidad del agua.'
  },
  {
    id: 7,
    clave: 'REG-CLORO-01',
    titulo: 'Bitácora Diaria de Cloro Residual en Red',
    tipo: 'Registro',
    area: 'Operación',
    version: 'Rev. 02',
    fecha: '2026-01-05',
    autor: 'Ing. Pedro Martínez',
    estado: 'APROBADO',
    referencias_usadas: [],
    descripcion: 'Registro de lecturas de cloro por sector hidráulico de la ciudad de Cajeme.'
  },
  {
    id: 8,
    clave: 'PR-AUD-01',
    titulo: 'Procedimiento de Auditorías Internas de Calidad',
    tipo: 'Procedimiento',
    area: 'Sistema de Gestión de Calidad',
    version: 'Rev. 04',
    fecha: '2026-03-01',
    autor: 'Lic. Roberto Torres',
    estado: 'APROBADO',
    referencias_usadas: ['OOMRSC-20', 'MC-01'],
    descripcion: 'Planificación, ejecución, competencia de auditores e informe de resultados de auditorías internas.'
  }
];

import { normalizarClave } from './validacion';

/** Escapa una clave para usarla dentro de una expresión regular. */
function escaparRegex(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detecta si una clave aparece en texto libre respetando límites de palabra.
 * Evita falsos positivos: 'MC-01' ya no coincide dentro de 'MC-012' ni de palabras
 * que la contengan, y las claves cortas no generan coincidencias masivas.
 */
function mencionaClaveEnTexto(texto, clave) {
  if (!texto || !clave) return false;
  const patron = new RegExp(`(^|[^A-Z0-9-])${escaparRegex(clave)}([^A-Z0-9-]|$)`, 'i');
  return patron.test(texto);
}

/**
 * Analiza el impacto cruzado de un documento o registro en toda la base documental.
 *
 * Distingue dos niveles de evidencia:
 *  - CITAS FUERTES: la clave está declarada en `referencias_usadas` de otro documento.
 *    Es dato estructurado y por tanto determina el bloqueo de eliminación.
 *  - MENCIONES DÉBILES: la clave aparece en el título/descripción de otro documento.
 *    Es indicio textual, se reporta para revisión humana pero NO bloquea por sí solo.
 *
 * @param {Object|string} docOClave Objeto documento o su clave
 * @param {Array} todosLosDocumentos Catálogo completo
 * @returns {Object} impacto con utilizadoEn, mencionesDebiles, nivelImpacto, etc.
 */
export function analizarImpactoDocumento(docOClave, todosLosDocumentos = []) {
  if (!docOClave) {
    return {
      clave: '', utilizadoEn: [], mencionesDebiles: [], referenciasQueUsa: [],
      referenciasRotas: [], cantidadUsos: 0, nivelImpacto: 'BAJO',
      puedeEliminarSeguro: true, mensajeImpacto: 'Sin impacto en otros documentos del SGC.',
    };
  }

  const clave = typeof docOClave === 'string' ? docOClave.trim() : (docOClave.clave || '').trim();
  const idDoc = typeof docOClave === 'object' ? docOClave.id : null;
  const claveNorm = normalizarClave(clave);

  const esElMismo = (d) => {
    if (idDoc != null && String(d.id) === String(idDoc)) return true;
    return claveNorm && normalizarClave(d.clave) === claveNorm;
  };

  // 1. CITAS FUERTES: documentos que declaran esta clave en sus referencias.
  const utilizadoEn = todosLosDocumentos.filter(d => {
    if (esElMismo(d)) return false;
    return Array.isArray(d.referencias_usadas)
      && d.referencias_usadas.some(ref => normalizarClave(ref) === claveNorm);
  });

  // 2. MENCIONES DÉBILES: la clave aparece en texto libre (no bloquea, se revisa).
  const mencionesDebiles = todosLosDocumentos.filter(d => {
    if (esElMismo(d)) return false;
    if (utilizadoEn.some(u => String(u.id) === String(d.id))) return false;
    const textoDoc = `${d.titulo || ''} ${d.descripcion || ''} ${d.referencias_texto || ''}`;
    return mencionaClaveEnTexto(textoDoc, clave);
  });

  // 3. Qué documentos utiliza este documento, y cuáles de esas referencias ya no existen.
  let referenciasQueUsa = [];
  let referenciasRotas = [];
  if (typeof docOClave === 'object' && Array.isArray(docOClave.referencias_usadas)) {
    const clavesCatalogo = new Set(todosLosDocumentos.map(d => normalizarClave(d.clave)));
    referenciasQueUsa = todosLosDocumentos.filter(d =>
      docOClave.referencias_usadas.some(ref => normalizarClave(ref) === normalizarClave(d.clave))
    );
    referenciasRotas = docOClave.referencias_usadas.filter(ref => !clavesCatalogo.has(normalizarClave(ref)));
  }

  // 3. Determinar el nivel de criticidad de impacto
  const cantidadUsos = utilizadoEn.length;
  let nivelImpacto = 'BAJO';
  let colorBadge = 'emerald';
  let mensajeImpacto = 'Sin impacto en otros documentos del SGC.';

  if (cantidadUsos > 3) {
    nivelImpacto = 'CRÍTICO';
    colorBadge = 'rose';
    mensajeImpacto = `🚨 IMPACTO CRÍTICO: Este documento/registro se menciona en ${cantidadUsos} documentos vigentes del SGC. Su eliminación rompería la trazabilidad de la norma ISO 9001:2015.`;
  } else if (cantidadUsos > 0) {
    nivelImpacto = 'ALTO';
    colorBadge = 'amber';
    mensajeImpacto = `⚠️ IMPACTO ELEVADO: Este documento se utiliza en ${cantidadUsos} procedimiento(s) del SGC.`;
  }

  return {
    clave,
    utilizadoEn,
    mencionesDebiles,
    cantidadMencionesDebiles: mencionesDebiles.length,
    referenciasQueUsa,
    referenciasRotas,
    cantidadReferenciasRotas: referenciasRotas.length,
    cantidadUsos,
    nivelImpacto,
    colorBadge,
    mensajeImpacto,
    // Solo las citas estructuradas bloquean la eliminación.
    puedeEliminarSeguro: cantidadUsos === 0
  };
}

/**
 * Devuelve las referencias que apuntan a documentos inexistentes en TODO el catálogo.
 * Útil para el diagnóstico global de integridad documental.
 */
export function detectarReferenciasRotas(documentos = []) {
  const claves = new Set((documentos || []).map(d => normalizarClave(d.clave)));
  const hallazgos = [];
  (documentos || []).forEach(doc => {
    (doc.referencias_usadas || []).forEach(ref => {
      if (!claves.has(normalizarClave(ref))) {
        hallazgos.push({ origen: doc.clave, origenTitulo: doc.titulo, referencia: ref });
      }
    });
  });
  return hallazgos;
}

/**
 * Obtiene un resumen matricial de toda la red documental
 */
export function generarMatrizTrazabilidad(documentos = []) {
  return documentos.map(doc => ({
    documento: doc,
    impacto: analizarImpactoDocumento(doc, documentos)
  }));
}
