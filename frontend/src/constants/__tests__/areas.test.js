import { describe, it, expect } from 'vitest';
import { direccionDeRegistro } from '../areas';

describe('direccionDeRegistro', () => {
  it('usa la dirección del registro normalizada', () => {
    expect(direccionDeRegistro({ direccion: 'Técnica' })).toBe('Dir. Técnica');
    expect(direccionDeRegistro({ direccion: 'Dir. Comercial' })).toBe('Dir. Comercial');
  });
  it('si no trae dirección, la toma de su área (catálogo vivo primero)', () => {
    expect(direccionDeRegistro({ area: 'Zona Nueva' }, [{ nombre: 'Zona Nueva', direccion: 'Dir. Jurídica' }])).toBe('Dir. Jurídica');
    expect(direccionDeRegistro({ area: 'Plantas Potabilizadoras' })).toBe('Dir. Técnica');
    expect(direccionDeRegistro({})).toBeNull();
  });
});

import { INDICADORES } from '../indicadores';
describe('indicadores de dirección', () => {
  it('conservan su dirección como área', () => {
    const porId = Object.fromEntries(INDICADORES.map((i) => [i.id, i]));
    expect(porId[41]).toMatchObject({ area: 'Dirección Comercial', direccion: 'Dir. Comercial', es_de_direccion: true });
    expect(porId[1].area).toBe('Dirección General');
    expect(porId[77]).toMatchObject({ area: 'Dirección Administrativa', direccion: 'Dir. Administrativa' });
    expect(porId[24]).toMatchObject({ area: 'Mantenimiento de Redes', es_de_direccion: false });
  });
});
