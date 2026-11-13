import { describe, it, expect } from 'vitest';
import { promptSugerencias, normalizarSugerencias, MAX_SUGERENCIAS } from '../riesgosIA';

const procesos = ['Producción', 'Gestión de Recursos'];

describe('prompt de sugerencias', () => {
  it('incluye propósito, procesos, indicadores, no conformidades y lo ya capturado', () => {
    const p = promptSugerencias({
      area: 'Plantas Potabilizadoras', direccion: 'Dir. Técnica', proposito: 'Potabiliza el agua', procesos,
      indicadores: [{ id: 26, nombre: 'Programa de mantenimiento', meta: 100, unidad: '%' }],
      noConformidades: ['Bombas sin mantenimiento'], existentes: [{ tipo: 'Riesgo', descripcion: 'Falla eléctrica' }], anio: 2027,
    });
    expect(p).toContain('Potabiliza el agua');
    expect(p).toContain('#26 Programa de mantenimiento');
    expect(p).toContain('Bombas sin mantenimiento');
    expect(p).toContain('Riesgo: Falla eléctrica');
    expect(p).toContain('Producción | Gestión de Recursos');
    expect(p).toContain('AL MENOS 2 oportunidades');
  });
});

describe('normalizarSugerencias', () => {
  it('corrige escala, contexto, proceso y tratamiento; descarta lo inválido o repetido', () => {
    const r = normalizarSugerencias({ sugerencias: [
      { tipo: 'riesgo', contexto: 'indicadores', proceso: 'produccion', descripcion: 'Desabasto de cloro', impacto: 7, probabilidad: 9, tratamiento: 'mitigar', plan: [{ actividad: 'Stock mínimo', responsable: 'Gerente' }, { actividad: '' }] },
      { tipo: 'Oportunidad', contexto: 'Inventado', descripcion: 'X' },
      { tipo: 'Riesgo', contexto: 'Indicadores', descripcion: 'Falla eléctrica' },
      { tipo: 'Oportunidad', contexto: 'Partes interesadas', descripcion: 'Convenio con universidad', impacto: 1, probabilidad: 0, tratamiento: 'otro' },
    ] }, { procesos, existentes: [{ descripcion: 'Falla eléctrica' }] });
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ tipo: 'Riesgo', contexto: 'Indicadores', proceso: 'Producción', impacto: 8, probabilidad: 5, tratamiento: 'Mitigar' });
    expect(r[0].plan).toHaveLength(1);
    expect(r[1]).toMatchObject({ tipo: 'Oportunidad', impacto: 2, probabilidad: 1, tratamiento: 'Aprovechar', proceso: '' });
  });
  it('tolera respuestas vacías y limita la cantidad', () => {
    expect(normalizarSugerencias(null)).toEqual([]);
    const muchas = Array.from({ length: 20 }, (_, i) => ({ tipo: 'Riesgo', contexto: 'Indicadores', descripcion: `R${i}` }));
    expect(normalizarSugerencias({ sugerencias: muchas })).toHaveLength(MAX_SUGERENCIAS);
  });
});
