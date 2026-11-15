import { describe, it, expect } from 'vitest';
import { PILOTO_INFORMATICA_2027 as P, faltantesProyecto, totalesPresupuesto, cumpleTrimestre, justificacionAutomatica, nuevoProyecto, renovarProyecto, esTemporadaRenovacion } from '../proyectosIndicadores';

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
  it('renueva el proyecto al año siguiente conservando metas e indicador y limpiando avances', () => {
    const base = { ...P, id: 'p1', estado: 'APROBADO', folio_tesoreria: 'F-1', actividades: P.actividades.map((a) => ({ ...a, indicador_id: 7, avances: { T1: { avance: '20' } } })) };
    const r = renovarProyecto(base, 2028, 'SGC');
    expect(r.anio).toBe(2028);
    expect(r.estado).toBe('BORRADOR');
    expect(r.folio_tesoreria).toBe('');
    expect(r.fecha_inicio).toBe('2028-01-01');
    expect(r.renovado_de).toBe('p1');
    expect(r.actividades[0].indicador_id).toBe(7);
    expect(r.actividades[0].meta).toBe(P.actividades[0].meta);
    expect(r.actividades[0].avances).toEqual({});
    expect(r.id).not.toBe('p1');
    expect(esTemporadaRenovacion(new Date(2026, 9, 1))).toBe(true);
    expect(esTemporadaRenovacion(new Date(2026, 8, 30))).toBe(false);
  });
});
