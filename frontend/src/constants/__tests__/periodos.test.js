import { describe, it, expect } from 'vitest';
import { agruparPorPeriodo } from '../periodos';

describe('agruparPorPeriodo', () => {
  it('días del mes en curso, meses cerrados del año y años anteriores', () => {
    const hoy = new Date(2026, 10, 20); // 20/nov/2026
    const f = (a, m, d) => ({ t: new Date(a, m - 1, d, 10).toISOString() });
    const items = [f(2026, 11, 20), f(2026, 11, 20), f(2026, 11, 2), f(2026, 10, 15), f(2026, 1, 5), f(2025, 12, 31), f(2024, 3, 1)];
    const g = agruparPorPeriodo(items, (x) => x.t, hoy);
    expect(g.map((x) => x.id)).toEqual(['2026-11-20', '2026-11-02', '2026-10', '2026-01', '2025', '2024']);
    expect(g[0]).toMatchObject({ tipo: 'dia', etiqueta: '20/11/2026' });
    expect(g[0].items).toHaveLength(2);
    expect(g[2]).toMatchObject({ tipo: 'mes', etiqueta: 'Octubre 2026' });
    expect(g[4]).toMatchObject({ tipo: 'anio', etiqueta: 'Año 2025' });
  });
});
