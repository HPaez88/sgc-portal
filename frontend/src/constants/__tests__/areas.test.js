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

import { resolverResponsable, AREAS } from '../areas';
describe('responsable de indicador según el Cuadro de Control', () => {
  it('respeta área, subdirección, dirección y otras unidades', () => {
    expect(resolverResponsable('Mtto. y servicios generales', 'Administrativa')).toMatchObject({ area: 'Mantenimiento y Servicios Generales', direccion: 'Dir. Administrativa', responsable_tipo: 'area' });
    expect(resolverResponsable('Subdirección de Operación y Mantenimiento', 'Técnica')).toMatchObject({ area: 'Subdirección de Operación y Mantenimiento', responsable_tipo: 'subdireccion', direccion: 'Dir. Técnica' });
    expect(resolverResponsable('Direccion Administrativa', 'Administrativa')).toMatchObject({ area: 'Dirección Administrativa', responsable_tipo: 'direccion' });
    expect(resolverResponsable('Transparencia', 'Jurídico')).toMatchObject({ area: 'Transparencia', direccion: 'Dir. Jurídica', responsable_tipo: 'unidad' });
    expect(resolverResponsable('Coord. Jurídico', 'Jurídico').area).toBe('Jurídico');
  });
  it('en el catálogo solo quedan fuera de las 33 áreas las direcciones, subdirecciones y Transparencia', () => {
    const fuera = INDICADORES.filter((i) => i.responsable_tipo !== 'area' || !AREAS.includes(i.area));
    expect(fuera.map((i) => i.id).sort((a, b) => a - b)).toEqual([1, 2, 41, 42, 43, 71, 72, 77, 78, 85, 86]);
  });
});

import { contactoResponsable } from '../areas';
describe('contactoResponsable', () => {
  const areas = [{ nombre: 'Plantas Potabilizadoras', encargado: 'Ing. J', correo: 'jenriquez@x.mx', encargados_sgc: ['agalvez@x.mx'] }];
  const dirs = [{ nombre: 'Dir. Comercial', director: 'Dr. G', correo: 'gfuentes@x.mx', encargados_sgc: [] },
    { nombre: 'Dir. Técnica', director: 'Ing. M', correo: 'mibarra@x.mx', subdirecciones: [{ nombre: 'Subdirección de Operación y Mantenimiento', encargado: 'Sub', correo: 'sub@x.mx' }] },
    { nombre: 'Dir. Jurídica', director: 'Lic. R', correo: 'jur@x.mx' }];
  it('área: encargado + encargados SGC', () => {
    expect(contactoResponsable({ area: 'Plantas Potabilizadoras', direccion: 'Técnica' }, areas, dirs)).toMatchObject({ titular: 'Ing. J', correos: ['jenriquez@x.mx', 'agalvez@x.mx'] });
  });
  it('dirección, subdirección y otra unidad', () => {
    expect(contactoResponsable({ area: 'Dirección Comercial', direccion: 'Comercial' }, areas, dirs).correos).toEqual(['gfuentes@x.mx']);
    expect(contactoResponsable({ area: 'Subdirección de Operación y Mantenimiento', direccion: 'Técnica' }, areas, dirs).correos).toEqual(['sub@x.mx']);
    expect(contactoResponsable({ area: 'Transparencia', direccion: 'Jurídico' }, areas, dirs)).toMatchObject({ titular: 'Lic. R', correos: ['jur@x.mx'] });
  });
});
