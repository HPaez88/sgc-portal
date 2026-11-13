import { describe, it, expect } from 'vitest';
import { resumenRiesgos, desgloseRiesgos, comparativoAnual, hallazgosRiesgos } from '../riesgosInforme';

const r = (o) => ({ tipo: 'Riesgo', area: 'A', anio: 2026, probabilidad: 3, impacto: 6, ...o });
const planes = [
  { id: 1, estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2020-01-01' }, // vencido
  { id: 2, estado: 'CERRADO_EFECTIVO' },
];
const items = [
  r({ id: 'a', probabilidad: 5, impacto: 8, pm_id: 1 }), // 40 alto, vencido
  r({ id: 'b', probabilidad: 4, impacto: 8, estado: 'EN_TRATAMIENTO', pm_id: 2 }), // 32 alto, por dictaminar
  r({ id: 'c', probabilidad: 5, impacto: 10, tratamiento: 'Aceptar' }), // 50 alto aceptado
  r({ id: 'd', area: 'B', probabilidad: 4, impacto: 6, dictamen: { resultado: 'EFICAZ' }, residual: { probabilidad: 2, impacto: 6 } }), // 24 medio
  r({ id: 'e', area: 'B', tipo: 'Oportunidad', dictamen: { resultado: 'NO_EFICAZ' } }),
];

describe('resumenRiesgos', () => {
  it('cuenta niveles, planes vencidos, pendientes de dictamen y eficacia', () => {
    const s = resumenRiesgos(items, planes);
    expect(s).toMatchObject({ total: 5, riesgos: 4, oportunidades: 1, altos: 3, medios: 1, bajos: 0, conPM: 2, vencidos: 1, porDictaminar: 1, dictaminados: 2, eficaces: 1, eficacia: 50, reduccionPromedio: 12, altosAceptados: 1 });
    expect(s.nivelPromedio).toBe(36.5);
  });
  it('sin registros no divide entre cero', () => {
    expect(resumenRiesgos([], [])).toMatchObject({ total: 0, eficacia: null, nivelPromedio: null });
  });
});

describe('desglose y comparativo', () => {
  it('agrupa por área ordenando por riesgos altos', () => {
    const d = desgloseRiesgos(items, planes, (x) => x.area);
    expect(d.map((g) => [g.nombre, g.altos, g.total])).toEqual([['A', 3, 3], ['B', 0, 2]]);
  });
  it('arma una fila por año, del más antiguo al más reciente', () => {
    const c = comparativoAnual([...items, r({ anio: 2025, probabilidad: 5, impacto: 10 })], planes, [2026, 2025]);
    expect(c.map((x) => [x.anio, x.altos])).toEqual([[2025, 1], [2026, 3]]);
  });
});

describe('hallazgosRiesgos', () => {
  it('prioriza vencidos y compara contra el año anterior', () => {
    const actual = resumenRiesgos(items, planes);
    const h = hallazgosRiesgos({ actual, anterior: { total: 1, altos: 1, nivelPromedio: 50 }, desglose: desgloseRiesgos(items, planes, (x) => x.area), cobertura: { total: 4, aceptadas: 1 }, anio: 2026 });
    expect(h[0].texto).toMatch(/vencidos/);
    expect(h.some((x) => /subieron de 1 a 3/.test(x.texto))).toBe(true);
    expect(h.some((x) => /A \(3\)/.test(x.texto))).toBe(true);
    expect(h.some((x) => /1 de 4 área/.test(x.texto))).toBe(true);
  });
  it('sin año anterior lo toma como línea base', () => {
    const h = hallazgosRiesgos({ actual: resumenRiesgos(items, planes), anterior: null, anio: 2026 });
    expect(h.some((x) => /línea base/.test(x.texto))).toBe(true);
  });
});
