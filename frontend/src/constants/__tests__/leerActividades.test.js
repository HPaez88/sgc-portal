import { describe, it, expect } from 'vitest';
import { leerActividades } from '../workflow';

// La bandeja de Aprobaciones detecta prórrogas pendientes leyendo las actividades de AC y PM.
describe('leerActividades', () => {
  const pendiente = [{ id: 1, solicitud_replanteo: { estado: 'PENDIENTE' } }];

  it('lee las actividades de una AC (actividades_json)', () => {
    expect(leerActividades({ actividades_json: JSON.stringify(pendiente) })).toEqual(pendiente);
  });

  it('lee las actividades de un PM guardadas como texto o como lista', () => {
    expect(leerActividades({ actividades: JSON.stringify(pendiente) })).toEqual(pendiente);
    expect(leerActividades({ actividades: pendiente })).toEqual(pendiente);
  });

  it('regresa lista vacía si el texto está dañado o no es lista', () => {
    expect(leerActividades({ actividades_json: '{roto' })).toEqual([]);
    expect(leerActividades({ actividades: '{"a":1}' })).toEqual([]);
    expect(leerActividades({})).toEqual([]);
  });
});
