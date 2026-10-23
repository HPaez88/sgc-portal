import { describe, it, expect } from 'vitest';
import { siguienteFolio, numeroDeFolio } from '../folio';

const oct2026 = new Date(2026, 9, 23);
const registros = [{ folio_codigo: 'AC#15/2025' }, { folio_codigo: 'AC#22/2026' }, { folio_codigo: 'AVM-07' }, { folio_codigo: 'Pendiente de aprobación' }];

describe('folios del Control 6', () => {
  it('lee AC#24/2026, AC#24\\2026 y el heredado AC#24/26 del año correcto', () => {
    expect(numeroDeFolio('AC#24/2026', 'AC', 2026)).toBe(24);
    expect(numeroDeFolio('AC#24\\2026', 'AC', 2026)).toBe(24);
    expect(numeroDeFolio('AC#24/26', 'AC', 2026)).toBe(24);
    expect(numeroDeFolio('AC#24/2025', 'AC', 2026)).toBe(0);
    expect(numeroDeFolio('OM#9/2026', 'AC', 2026)).toBe(0);
  });
  it('sigue del último emitido aunque esté cerrado y fuera del portal: AC#25/2026', () => {
    const f = siguienteFolio('AC', registros, { AC: { 2026: 24 } }, oct2026);
    expect(f.codigo).toBe('AC#25/2026');
    expect(f.contador.AC[2026]).toBe(25);
  });
  it('planes de mejora usan OM y su propio contador', () => {
    expect(siguienteFolio('PM', [{ folio_codigo: 'OM#7/2026' }], { PM: { 2026: 9 } }, oct2026).codigo).toBe('OM#10/2026');
  });
  it('si el contador está atrasado no repite un folio existente', () => {
    expect(siguienteFolio('AC', registros, { AC: { 2026: 3 } }, oct2026).codigo).toBe('AC#23/2026');
  });
  it('se reinicia en 1 al cambiar de año', () => {
    expect(siguienteFolio('AC', registros, { AC: { 2026: 40 } }, new Date(2027, 0, 2)).codigo).toBe('AC#1/2027');
  });
});
