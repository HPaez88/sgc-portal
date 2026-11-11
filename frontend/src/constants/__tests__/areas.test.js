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
