import { describe, it, expect } from 'vitest';
import { estadoRC, esRCAbierto, folioRC, rcDelPeriodo, hoyISO, puedeDictaminarRC, puedeVerRC } from '../reportesCorreccion';

describe('reportes de corrección', () => {
  it('normaliza los estados históricos', () => {
    expect(estadoRC({ estado: 'ABIERTA' })).toBe('EN_ATENCION');
    expect(estadoRC({ estado: 'ABIERTO' })).toBe('EN_ATENCION');
    expect(estadoRC({})).toBe('EN_ATENCION');
    expect(estadoRC({ estado: 'CERRADA' })).toBe('CERRADO_EFECTIVO');
    expect(esRCAbierto({ estado: 'ESCALADO_A_AC' })).toBe(false);
  });
  it('folio consecutivo del año contando los formatos viejos', () => {
    const lista = [{ folio: 'RC 2/2026' }, { folio: 'RC 7-Oct/2026' }, { folio: 'RC#3/2026' }, { folio: 'RC#40/2025' }];
    expect(folioRC(lista, 2026)).toBe('RC#8/2026');
    expect(folioRC([], 2027)).toBe('RC#1/2027');
  });
  it('detecta el RC del mismo indicador y periodo', () => {
    const lista = [{ indicadorId: 5, mes: 'Oct', ejercicio: '2026' }];
    expect(rcDelPeriodo(lista, '5', 'Oct', 2026)).toBeTruthy();
    expect(rcDelPeriodo(lista, 5, 'Nov', 2026)).toBeNull();
  });
  it('fecha local, no UTC', () => {
    expect(hoyISO(new Date(2026, 10, 15, 23, 30))).toBe('2026-11-15');
  });
  it('permisos', () => {
    expect(puedeDictaminarRC({ rol: 'Auditor' })).toBe(true);
    expect(puedeDictaminarRC({ rol: 'Encargado' })).toBe(false);
    expect(puedeVerRC({ rol: 'Encargado', area: 'Plantas' }, { area: 'Plantas' })).toBe(true);
    expect(puedeVerRC({ rol: 'Encargado', area: 'Plantas', email: 'x@x.mx' }, { area: 'Jurídico' })).toBe(false);
    expect(puedeVerRC({ rol: 'Admin' }, { area: 'Jurídico' })).toBe(true);
  });
});
