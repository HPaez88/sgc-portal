import { describe, it, expect } from 'vitest';
import { PILOTO_INFORMATICA_2027 as P, faltantesProyecto, totalesPresupuesto, cumpleTrimestre, justificacionAutomatica, nuevoProyecto } from '../proyectosIndicadores';

describe('proyectos de indicadores', () => {
  it('el piloto de Informática 2027 está completo y cuadra con su formato', () => {
    expect(faltantesProyecto(P)).toEqual([]);
    expect(totalesPresupuesto(P.presupuesto).anual).toBe(12894202);
    expect(totalesPresupuesto(P.presupuesto).trimestres).toEqual([5612250, 2844784, 2372584, 2064584]);
  });
  it('pide lo obligatorio y que el ponderado sume 100', () => {
    const f = faltantesProyecto(nuevoProyecto(2027, 'X'));
    expect(f).toContain('Nombre del proyecto');
    expect(f.some((t) => t.includes('ponderado'))).toBe(true);
  });
  it('avance trimestral: detecta incumplimiento y propone justificación', () => {
    const a = { actividad: 'Atender solicitudes', unidad: 'Porcentaje', trimestres: ['24', '24', '24', '23'], avances: { T2: { avance: '20' } } };
    expect(cumpleTrimestre(a, 0)).toBe(null);
    expect(cumpleTrimestre(a, 1)).toBe(false);
    expect(justificacionAutomatica(a, 1)).toContain('20% de la meta programada de 24%');
  });
});
