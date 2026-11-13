import { describe, it, expect } from 'vitest';
import { siguienteHabil, esFinDeSemana } from '../fechasHabiles';
import { folioRC } from '../../components/acciones/ModalNuevoRC';

describe('fechas hábiles y folio de RC', () => {
  it('recorre sábado y domingo al lunes', () => {
    expect(siguienteHabil('2026-11-14')).toBe('2026-11-16'); // sábado
    expect(siguienteHabil('2026-11-15')).toBe('2026-11-16'); // domingo
    expect(siguienteHabil('2026-11-13')).toBe('2026-11-13'); // viernes
    expect(esFinDeSemana('2026-11-14')).toBe(true);
    expect(siguienteHabil('')).toBe('');
  });
  it('folio consecutivo de RC manuales por año', () => {
    expect(folioRC([{ folio: 'RC 0/2026' }, { folio: 'RC#2/2026' }, { folio: 'RC#7/2025' }], 2026)).toBe('RC#3/2026');
    expect(folioRC([], 2027)).toBe('RC#1/2027');
  });
});
