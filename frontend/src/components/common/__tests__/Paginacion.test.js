import { describe, it, expect } from 'vitest';
import { paginasVisibles } from '../Paginacion';

describe('paginasVisibles', () => {
  it('muestra primera, última y vecinas con huecos', () => {
    expect(paginasVisibles(1, 1)).toEqual([1]);
    expect(paginasVisibles(1, 3)).toEqual([1, 2, 3]);
    expect(paginasVisibles(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10]);
    expect(paginasVisibles(10, 10)).toEqual([1, '…', 9, 10]);
  });
});
