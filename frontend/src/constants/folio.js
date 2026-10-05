// ═══════════════════════════════════════════════════════════════════════════
// FOLIOS SGC — formato único compartido con el backend (AC-2026/001, PM-2026/001)
// ═══════════════════════════════════════════════════════════════════════════

export const PREFIJOS_FOLIO = { AC: 'AC', PM: 'PM' };

// Extrae el consecutivo de un folio nuevo o heredado (AC-2026/001, AC#1/26)
const extraerConsecutivo = (folio, prefijo) => {
  if (!folio) return 0;
  const texto = String(folio).toUpperCase();
  const nuevo = texto.startsWith(prefijo) ? texto.split('/')[1] : null;
  const heredado = texto.includes('#') ? texto.split('/')[0].replace(/[^0-9]/g, '') : null;
  const numero = parseInt(nuevo || heredado || '', 10);
  return Number.isNaN(numero) ? 0 : numero;
};

// Genera el siguiente folio consecutivo del año en curso
export const generarFolio = (tipo, registros = []) => {
  const anio = new Date().getFullYear();
  const prefijo = `${PREFIJOS_FOLIO[tipo] || tipo}-${anio}/`;
  const maximo = registros.reduce(
    (acc, r) => Math.max(acc, extraerConsecutivo(r?.folio || r?.folio_codigo, prefijo)),
    0
  );
  return `${prefijo}${String(maximo + 1).padStart(3, '0')}`;
};

// Indica si un registro ya tiene folio definitivo (no borrador)
export const tieneFolio = (registro) => {
  const folio = registro?.folio || registro?.folio_codigo;
  return Boolean(folio) && !String(folio).toLowerCase().includes('pendiente');
};
