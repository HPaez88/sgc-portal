import { describe, it, expect } from 'vitest';
import { normalizarFoda, fodaParaPrompt, fodaVacio } from '../foda';
import { promptSugerencias } from '../riesgosIA';

describe('FODA', () => {
  it('normaliza renglones, viñetas y vacíos', () => {
    const f = normalizarFoda({ fortalezas: ['- Personal con experiencia', '', '  • Laboratorio propio'], amenazas: 'Sequía\n\n2) Alza de energía' });
    expect(f.fortalezas).toEqual(['Personal con experiencia', 'Laboratorio propio']);
    expect(f.amenazas).toEqual(['Sequía', 'Alza de energía']);
    expect(f.debilidades).toEqual([]);
    expect(fodaVacio({})).toBe(true);
  });
  it('va en el prompt de sugerencias de la IA', () => {
    const p = promptSugerencias({ area: 'Plantas', procesos: ['Producción'], foda: { debilidades: ['Equipo obsoleto'] }, anio: 2027 });
    expect(p).toContain('ANÁLISIS FODA');
    expect(p).toContain('Debilidades: Equipo obsoleto');
    expect(fodaParaPrompt(null)).toContain('sin FODA');
  });
});
