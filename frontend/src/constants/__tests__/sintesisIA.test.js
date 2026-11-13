import { describe, it, expect } from 'vitest';
import { insumosDireccion, promptSintesis, normalizarSintesis, MAX_RIESGOS } from '../sintesisIA';

describe('síntesis por dirección y organismo', () => {
  it('reúne FODA y matriz del año de cada área, los de mayor nivel primero', () => {
    const u = insumosDireccion({
      anio: 2027,
      areas: [{ nombre: 'Plantas', foda: { debilidades: ['Equipo viejo'] } }],
      riesgos: [
        { area: 'Plantas', anio: 2027, tipo: 'Riesgo', descripcion: 'Bajo', probabilidad: 1, impacto: 2 },
        { area: 'Plantas', anio: 2027, tipo: 'Riesgo', descripcion: 'Alto', probabilidad: 5, impacto: 8 },
        { area: 'Plantas', anio: 2026, tipo: 'Riesgo', descripcion: 'Otro año', probabilidad: 5, impacto: 10 },
      ],
    });
    expect(u[0].registros.map((r) => r.descripcion)).toEqual(['Alto', 'Bajo']);
    const p = promptSintesis({ nivel: 'direccion', nombre: 'Dir. Técnica', anio: 2027, unidades: u });
    expect(p).toContain('### Plantas');
    expect(p).toContain('Debilidades: Equipo viejo');
    expect(p).toContain('Riesgo (Alto 40): Alto');
    expect(p).toContain('No copies todo');
  });
  it('normaliza lo que contesta la IA y limita cantidades', () => {
    const s = normalizarSintesis({
      foda: { fortalezas: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
      riesgos: Array.from({ length: 12 }, (_, i) => ({ descripcion: `R${i}`, nivel: i ? 'alto' : 'raro', unidades: ['Plantas'] })),
      plan: [{ tema: 'Mantenimiento', acciones: ['x', 'y', 'z', 'w'] }, {}],
    });
    expect(s.foda.fortalezas).toHaveLength(5);
    expect(s.riesgos).toHaveLength(MAX_RIESGOS);
    expect(s.riesgos[0].nivel).toBe('Medio');
    expect(s.riesgos[1].nivel).toBe('Alto');
    expect(s.plan).toHaveLength(1);
    expect(s.plan[0].acciones).toHaveLength(3);
    expect(normalizarSintesis(null).riesgos).toEqual([]);
  });
});
