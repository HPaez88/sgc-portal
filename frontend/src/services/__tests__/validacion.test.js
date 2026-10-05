// Pruebas de las validaciones compartidas del SGC.
// Aquí vive la regla de clave única documental: si falla, se pueden crear
// dos documentos con la misma clave y la trazabilidad se rompe.
import { describe, it, expect } from 'vitest';
import {
  requerido,
  minimoCaracteres,
  parsearNumero,
  numeroNoNegativo,
  normalizarClave,
  claveUnica,
  validarDocumento,
  validarReferencias,
} from '../validacion';

const docs = [
  { id: 1, clave: 'OOMRSC-20', titulo: 'Formato AC' },
  { id: 2, clave: 'PR-CAL-01', titulo: 'Procedimiento' },
];

describe('requerido', () => {
  it('rechaza vacíos, nulos y solo espacios', () => {
    expect(requerido('')).not.toBe('');
    expect(requerido(null)).not.toBe('');
    expect(requerido('   ')).not.toBe('');
    expect(requerido(undefined)).not.toBe('');
  });

  it('acepta texto con contenido', () => {
    expect(requerido('Manual')).toBe('');
  });
});

describe('minimoCaracteres', () => {
  it('exige la longitud mínima', () => {
    expect(minimoCaracteres('abc', 5)).not.toBe('');
    expect(minimoCaracteres('abcdef', 5)).toBe('');
  });

  it('no falla si el campo está vacío (lo cubre requerido)', () => {
    expect(minimoCaracteres('', 5)).toBe('');
  });
});

describe('parsearNumero', () => {
  it('acepta coma decimal y símbolos', () => {
    expect(parsearNumero('12,5')).toBe(12.5);
    expect(parsearNumero('90%')).toBe(90);
    expect(parsearNumero(' 100 ')).toBe(100);
  });

  it('devuelve NaN para valores no numéricos', () => {
    expect(Number.isNaN(parsearNumero('abc'))).toBe(true);
    expect(Number.isNaN(parsearNumero(''))).toBe(true);
    expect(Number.isNaN(parsearNumero(null))).toBe(true);
  });

  it('distingue correctamente el cero de vacío', () => {
    expect(parsearNumero('0')).toBe(0);
    expect(Number.isNaN(parsearNumero(''))).toBe(true);
  });
});

describe('numeroNoNegativo', () => {
  it('rechaza negativos', () => {
    expect(numeroNoNegativo('-5')).not.toBe('');
    expect(numeroNoNegativo('0')).toBe('');
    expect(numeroNoNegativo('10')).toBe('');
  });
});

describe('normalizarClave', () => {
  it('ignora mayúsculas, espacios y acentos', () => {
    expect(normalizarClave('oomrsc-20')).toBe(normalizarClave('OOMRSC-20'));
    expect(normalizarClave(' pr-cal-01 ')).toBe('PR-CAL-01');
    expect(normalizarClave('PR-CÁL-01')).toBe('PR-CAL-01');
  });
});

describe('claveUnica', () => {
  it('detecta claves duplicadas sin importar el formato', () => {
    expect(claveUnica('oomrsc-20', docs)).not.toBe('');
    expect(claveUnica('OOMRSC-20', docs)).not.toBe('');
  });

  it('excluye el documento que se está editando', () => {
    expect(claveUnica('OOMRSC-20', docs, 1)).toBe('');
  });

  it('permite una clave nueva', () => {
    expect(claveUnica('NUEVO-01', docs)).toBe('');
  });

  it('exige que la clave no esté vacía', () => {
    expect(claveUnica('', docs)).not.toBe('');
  });
});

describe('validarDocumento', () => {
  it('acepta un documento completo y único', () => {
    const form = { clave: 'PR-NEW-01', titulo: 'Procedimiento nuevo', area: 'Control de Calidad', tipo: 'Procedimiento' };
    expect(validarDocumento(form, docs)).toBe('');
  });

  it('rechaza un documento con clave duplicada', () => {
    const form = { clave: 'OOMRSC-20', titulo: 'Duplicado', area: 'Control de Calidad', tipo: 'Registro' };
    expect(validarDocumento(form, docs)).not.toBe('');
  });

  it('rechaza documentos incompletos', () => {
    expect(validarDocumento({ clave: 'X-01', titulo: '', area: 'A', tipo: 'Manual' }, docs)).not.toBe('');
    expect(validarDocumento({ clave: 'X-01', titulo: 'Título', area: '', tipo: 'Manual' }, docs)).not.toBe('');
  });
});

describe('validarReferencias', () => {
  it('separa las referencias válidas de las que no existen', () => {
    const { validas, faltantes } = validarReferencias(['OOMRSC-20', 'NO-EXISTE'], docs);
    expect(validas).toEqual(['OOMRSC-20']);
    expect(faltantes).toEqual(['NO-EXISTE']);
  });

  it('tolera listas vacías', () => {
    expect(validarReferencias([], docs)).toEqual({ validas: [], faltantes: [] });
    expect(validarReferencias(undefined, docs)).toEqual({ validas: [], faltantes: [] });
  });
});