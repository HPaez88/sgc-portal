// ═══════════════════════════
// VALIDACIONES COMPARTIDAS DEL SGC
// Reglas reutilizables por Documentos, AC/PM, Indicadores y Riesgos,
// para que el frontend valide igual que el backend (Pydantic).
// ═══════════════════════════

/** Texto obligatorio. Devuelve '' si es válido, o el mensaje de error. */
export function requerido(valor, etiqueta = 'Este campo') {
  const texto = valor == null ? '' : String(valor).trim();
  return texto ? '' : `${etiqueta} es obligatorio.`;
}

/** Longitud mínima de texto. */
export function minimoCaracteres(valor, minimo, etiqueta = 'Este campo') {
  const texto = valor == null ? '' : String(valor).trim();
  if (!texto) return '';
  return texto.length >= minimo ? '' : `${etiqueta} requiere al menos ${minimo} caracteres.`;
}

/** Normaliza un número escrito por el usuario: acepta coma decimal y símbolos. */
export function parsearNumero(valor) {
  if (valor === null || valor === undefined) return NaN;
  const limpio = String(valor).trim().replace(',', '.').replace(/[%\s]/g, '');
  if (!limpio) return NaN;
  return Number(limpio);
}

/** Número válido y >= 0. */
export function numeroNoNegativo(valor, etiqueta = 'El valor') {
  const numero = parsearNumero(valor);
  if (!Number.isFinite(numero)) return `${etiqueta} debe ser un número válido.`;
  if (numero < 0) return `${etiqueta} no puede ser negativo.`;
  return '';
}

/** Fecha en formato YYYY-MM-DD no anterior a hoy. */
export function fechaNoPasada(valor, etiqueta = 'La fecha') {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return `${etiqueta} no es válida.`;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha < hoy ? `${etiqueta} no puede ser anterior a hoy.` : '';
}

/**
 * Normaliza una clave documental para comparar sin ambigüedad:
 * mayúsculas, sin espacios, sin acentos.
 */
export function normalizarClave(clave) {
  return String(clave ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Verifica que una clave documental no exista ya.
 * @returns '' si es válida, o el mensaje de error.
 */
export function claveUnica(clave, documentos = [], idExcluido = null) {
  const objetivo = normalizarClave(clave);
  if (!objetivo) return 'La clave oficial es obligatoria.';
  const duplicado = (documentos || []).find((doc) => {
    if (idExcluido != null && String(doc.id) === String(idExcluido)) return false;
    return normalizarClave(doc.clave) === objetivo;
  });
  return duplicado
    ? `La clave ${objetivo} ya existe en el catálogo documental (${duplicado.titulo || 'sin título'}).`
    : '';
}

/** Ejecuta una lista de validaciones y devuelve el primer error encontrado. */
export function primerError(validaciones = []) {
  for (const resultado of validaciones) {
    if (resultado) return resultado;
  }
  return '';
}

/** Valida el formulario de un documento del SGC. */
export function validarDocumento(formData, documentos = [], idExcluido = null) {
  return primerError([
    requerido(formData?.clave, 'La clave oficial'),
    claveUnica(formData?.clave, documentos, idExcluido),
    requerido(formData?.titulo, 'El título'),
    minimoCaracteres(formData?.titulo, 5, 'El título'),
    requerido(formData?.area, 'El área propietaria'),
    requerido(formData?.tipo, 'El tipo de documento'),
  ]);
}

/**
 * Valida las referencias cruzadas de un documento contra el catálogo real.
 * @returns { faltantes: string[], validas: string[] }
 */
export function validarReferencias(referencias = [], documentos = []) {
  const clavesExistentes = new Set((documentos || []).map((d) => normalizarClave(d.clave)));
  const faltantes = [];
  const validas = [];
  (referencias || []).forEach((ref) => {
    if (clavesExistentes.has(normalizarClave(ref))) validas.push(ref);
    else faltantes.push(ref);
  });
  return { faltantes, validas };
}