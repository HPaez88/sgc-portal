import { describe, it, expect } from 'vitest';
import { separarTitulo, unirTitulo, compararPorNombre } from '../titulos';

describe('títulos profesionales', () => {
  it('separa el título del nombre (C.P. antes que C.)', () => {
    expect(separarTitulo('Lic. Héctor Manuel Páez León')).toEqual({ titulo: 'Lic.', nombre: 'Héctor Manuel Páez León' });
    expect(separarTitulo('C.P. Claudia Valenzuela')).toEqual({ titulo: 'C.P.', nombre: 'Claudia Valenzuela' });
    expect(separarTitulo('Ada Liz Badillo')).toEqual({ titulo: '', nombre: 'Ada Liz Badillo' });
    expect(separarTitulo('biól. Ana')).toEqual({ titulo: 'Biól.', nombre: 'Ana' });
  });
  it('une y ordena por nombre, no por título', () => {
    expect(unirTitulo('Ing.', ' Juan ')).toBe('Ing. Juan');
    expect(unirTitulo('', 'Juan')).toBe('Juan');
    const lista = ['Lic. Zoila', 'Ing. Beto', 'Ana', 'Dr. Carlos'].sort(compararPorNombre);
    expect(lista).toEqual(['Ana', 'Ing. Beto', 'Dr. Carlos', 'Lic. Zoila']);
  });
});
