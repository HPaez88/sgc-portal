// Pruebas de la lógica de trazabilidad documental (ISO 9001:2015 § 7.5.3).
// Es lógica pura, sin React: aquí un fallo rompe el bloqueo de eliminación
// de documentos críticos, así que es la suite de mayor valor del proyecto.
import { describe, it, expect } from 'vitest';
import {
  analizarImpactoDocumento,
  generarMatrizTrazabilidad,
  detectarReferenciasRotas,
} from '../trazabilidadService';

const docs = [
  { id: 1, clave: 'MC-01', titulo: 'Manual del SGC', referencias_usadas: ['PR-CAL-01', 'OOMRSC-20'] },
  { id: 2, clave: 'PR-CAL-01', titulo: 'Procedimiento de Acciones Correctivas', referencias_usadas: ['OOMRSC-20'] },
  { id: 3, clave: 'OOMRSC-20', titulo: 'Formato de Acción Correctiva', referencias_usadas: [] },
  { id: 4, clave: 'REG-01', titulo: 'Registro autónomo sin dependencias', referencias_usadas: [] },
];

describe('analizarImpactoDocumento', () => {
  it('cuenta como citas fuertes solo las referencias estructuradas', () => {
    const impacto = analizarImpactoDocumento('OOMRSC-20', docs);
    expect(impacto.cantidadUsos).toBe(2);
    expect(impacto.utilizadoEn.map(d => d.clave).sort()).toEqual(['MC-01', 'PR-CAL-01']);
  });

  it('marca como eliminable seguro un documento sin citas', () => {
    const impacto = analizarImpactoDocumento('REG-01', docs);
    expect(impacto.cantidadUsos).toBe(0);
    expect(impacto.puedeEliminarSeguro).toBe(true);
    expect(impacto.nivelImpacto).toBe('BAJO');
  });

  it('bloquea la eliminación cuando el documento es citado', () => {
    const impacto = analizarImpactoDocumento('OOMRSC-20', docs);
    expect(impacto.puedeEliminarSeguro).toBe(false);
    expect(impacto.nivelImpacto).toBe('ALTO');
  });

  it('no se cuenta a sí mismo como dependencia', () => {
    const impacto = analizarImpactoDocumento(docs[2], docs);
    expect(impacto.utilizadoEn.some(d => d.clave === 'OOMRSC-20')).toBe(false);
  });

  it('no confunde una clave que es prefijo de otra (falsos positivos)', () => {
    const catalogo = [
      { id: 1, clave: 'MC-01', titulo: 'Manual', referencias_usadas: [] },
      { id: 2, clave: 'MC-012', titulo: 'Otro documento distinto', referencias_usadas: [] },
    ];
    const impacto = analizarImpactoDocumento('MC-01', catalogo);
    // 'MC-01' no debe coincidir dentro de 'MC-012'
    expect(impacto.mencionesDebiles.map(d => d.clave)).not.toContain('MC-012');
  });

  it('reporta referencias rotas que apuntan a documentos inexistentes', () => {
    const catalogo = [{ id: 1, clave: 'A-01', titulo: 'A', referencias_usadas: ['NO-EXISTE'] }];
    const impacto = analizarImpactoDocumento(catalogo[0], catalogo);
    expect(impacto.referenciasRotas).toEqual(['NO-EXISTE']);
    expect(impacto.cantidadReferenciasRotas).toBe(1);
  });

  it('tolera entradas vacías sin lanzar excepciones', () => {
    expect(() => analizarImpactoDocumento(null, docs)).not.toThrow();
    expect(() => analizarImpactoDocumento('X', undefined)).not.toThrow();
    expect(analizarImpactoDocumento(null, docs).puedeEliminarSeguro).toBe(true);
  });
});

describe('generarMatrizTrazabilidad', () => {
  it('devuelve una fila por documento con su impacto', () => {
    const matriz = generarMatrizTrazabilidad(docs);
    expect(matriz).toHaveLength(docs.length);
    matriz.forEach(fila => {
      expect(fila.documento).toBeDefined();
      expect(fila.impacto).toBeDefined();
    });
  });
});

describe('detectarReferenciasRotas', () => {
  it('encuentra todas las referencias que apuntan a la nada', () => {
    const catalogo = [
      { clave: 'A-01', titulo: 'A', referencias_usadas: ['B-01', 'FANTASMA'] },
      { clave: 'B-01', titulo: 'B', referencias_usadas: ['OTRO-FANTASMA'] },
    ];
    const rotas = detectarReferenciasRotas(catalogo);
    expect(rotas).toHaveLength(2);
    expect(rotas.map(r => r.referencia).sort()).toEqual(['FANTASMA', 'OTRO-FANTASMA']);
  });

  it('no reporta nada si todo el catálogo es consistente', () => {
    expect(detectarReferenciasRotas(docs)).toEqual([]);
  });
});