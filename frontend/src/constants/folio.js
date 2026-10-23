// ═══════════════════════════════════════════════════════════════════════════
// FOLIOS SGC — nomenclatura del Control 6: AC#25/2026 (acciones) y OM#10/2026 (mejoras).
// Consecutivo por año: se reinicia el 1 de enero. El último número emitido de cada año vive en el
// servidor (clave `sgc-config-folios`), así que contar también los folios ya cerrados que no están en el portal.
// ═══════════════════════════════════════════════════════════════════════════

export const PREFIJOS_FOLIO = { AC: 'AC', PM: 'OM' };
export const CLAVE_CONTADOR_FOLIOS = 'sgc-config-folios';

/** Número de un folio si pertenece a ese prefijo y año (acepta AC#25/2026, AC#25\2026 y el heredado AC#25/26). */
export const numeroDeFolio = (folio, prefijo, anio) => {
  const m = /^\s*([A-Z]+)\s*#\s*(\d+)\s*[\\/]\s*(\d{2,4})\s*$/i.exec(String(folio || ''));
  if (!m || m[1].toUpperCase() !== prefijo) return 0;
  const anioFolio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return anioFolio === anio ? Number(m[2]) : 0;
};

/**
 * Siguiente folio del año (función pura).
 * @param tipo 'AC' | 'PM'
 * @param registros registros actuales (para no repetir aunque el contador esté atrasado)
 * @param contador  { AC: { 2026: 24 }, PM: { 2026: 9 } } — último número emitido por año
 * @returns { numero, anio, codigo, contador } con el contador ya actualizado
 */
export const siguienteFolio = (tipo, registros = [], contador = {}, fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const prefijo = PREFIJOS_FOLIO[tipo] || tipo;
  const enRegistros = registros.reduce(
    (max, r) => Math.max(max, numeroDeFolio(r?.folio_codigo || r?.folio, prefijo, anio)),
    0,
  );
  const ultimo = Math.max(enRegistros, Number(contador?.[tipo]?.[anio]) || 0);
  const numero = ultimo + 1;
  return {
    numero,
    anio: String(anio),
    codigo: `${prefijo}#${numero}/${anio}`,
    contador: { ...contador, [tipo]: { ...(contador?.[tipo] || {}), [anio]: numero } },
  };
};

// Indica si un registro ya tiene folio definitivo (no borrador)
export const tieneFolio = (registro) => {
  const folio = registro?.folio || registro?.folio_codigo;
  return Boolean(folio) && !String(folio).toLowerCase().includes('pendiente');
};
