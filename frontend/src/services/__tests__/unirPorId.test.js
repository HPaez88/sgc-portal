import { describe, it, expect } from 'vitest';
import { unirPorId } from '../estadoService';

describe('unirPorId (bitácora: solo se agrega)', () => {
  it('une copias sin repetir, conserva la versión del servidor y ordena del más reciente', () => {
    const servidor = [{ id: 'B', timestamp: '2026-11-19T10:00:00Z', d: 'srv' }];
    const local = [{ id: 'C', timestamp: '2026-11-20T10:00:00Z' }, { id: 'B', timestamp: '2026-11-19T10:00:00Z', d: 'local' }];
    const respaldo = [{ id: 'A', timestamp: '2026-11-18T10:00:00Z' }, null, 'basura'];
    const r = unirPorId(servidor, local, respaldo, undefined);
    expect(r.map((x) => x.id)).toEqual(['C', 'B', 'A']);
    expect(r[1].d).toBe('srv');
  });
});
