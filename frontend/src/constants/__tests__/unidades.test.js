import { describe, it, expect } from 'vitest';
import { unidadesDeRiesgo } from '../unidades';
import { puedeCapturarArea } from '../riesgos';

describe('unidades con matriz', () => {
  const u = unidadesDeRiesgo(
    [{ nombre: 'Plantas', direccion: 'Dir. Técnica', correo: 'plantas@x.mx' }],
    [{ nombre: 'Dir. Técnica', director: 'Ing. Campas', correo: 'dt@x.mx', encargados_sgc: ['iso@x.mx'], subdirecciones: [{ nombre: 'Subdirección de Operación', encargado: 'Ing. Ruiz', correo: 'op@x.mx' }] }],
  );
  it('incluye direcciones, subdirecciones y áreas en ese orden', () => {
    expect(u.map((x) => [x.tipo, x.nombre])).toEqual([['direccion', 'Dir. Técnica'], ['subdireccion', 'Subdirección de Operación'], ['area', 'Plantas']]);
    expect(u[1].direccion).toBe('Dir. Técnica');
  });
  it('el titular o encargado SGC de la unidad puede capturar su matriz', () => {
    expect(puedeCapturarArea({ email: 'dt@x.mx', area: 'Otra' }, 'Dir. Técnica', u)).toBe(true);
    expect(puedeCapturarArea({ email: 'iso@x.mx', area: 'Otra' }, 'Dir. Técnica', u)).toBe(true);
    expect(puedeCapturarArea({ email: 'op@x.mx', area: 'Otra' }, 'Subdirección de Operación', u)).toBe(true);
    expect(puedeCapturarArea({ email: 'nadie@x.mx', area: 'Otra' }, 'Dir. Técnica', u)).toBe(false);
  });
});
