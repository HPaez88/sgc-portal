import { describe, it, expect } from 'vitest';
import { escalaDe, aplicarPreferencias, PREFERENCIAS_INICIALES } from '../accesibilidad';

describe('accesibilidad', () => {
  it('escala por tamaño y cae en normal si no existe', () => {
    expect(escalaDe({ tamano: 'grande' })).toBe(1.15);
    expect(escalaDe({ tamano: 'inventado' })).toBe(1);
    expect(escalaDe(PREFERENCIAS_INICIALES)).toBe(1);
  });
  it('aplica la variable y la clase de tablas marcadas', () => {
    const props = {};
    const clases = new Set();
    const raiz = { style: { setProperty: (k, v) => { props[k] = v; } }, classList: { toggle: (c, on) => (on ? clases.add(c) : clases.delete(c)) } };
    aplicarPreferencias({ tamano: 'muy-grande', tablasMarcadas: true }, raiz);
    expect(props['--escala-texto']).toBe('1.3');
    expect(clases.has('tablas-marcadas')).toBe(true);
  });
});
