import { describe, it, expect } from 'vitest';
import { 
  FORMATO_REVISION_DIRECCION, 
  FORMULARIOS_COMPLEMENTARIOS_CONFIG,
  REVISIONES_DIRECCION_INICIALES 
} from '../../constants/revisionDireccion';

describe('Constantes y Estructura de Revisión por la Dirección (OOMRSC-04)', () => {
  it('contiene la clave institucional OOMRSC-04 REV. 09', () => {
    expect(FORMATO_REVISION_DIRECCION.clave).toBe('OOMRSC-04');
    expect(FORMATO_REVISION_DIRECCION.revision).toBe('REV. 09');
    expect(FORMATO_REVISION_DIRECCION.normasAplicables.length).toBeGreaterThanOrEqual(4);
  });

  it('define exactamente los 5 formularios complementarios requeridos', () => {
    expect(FORMULARIOS_COMPLEMENTARIOS_CONFIG.length).toBe(5);
    const ids = FORMULARIOS_COMPLEMENTARIOS_CONFIG.map(f => f.id);
    expect(ids).toContain('quejas_oci');
    expect(ids).toContain('satisfaccion_usuarios');
    expect(ids).toContain('calidad_agua');
    expect(ids).toContain('proveedores_quimicos');
    expect(ids).toContain('acuerdos_previos');
  });

  it('cada formulario complementario cuenta con código, área responsable y campos válidos', () => {
    FORMULARIOS_COMPLEMENTARIOS_CONFIG.forEach(f => {
      expect(f.codigo).toBeDefined();
      expect(f.areaResponsable).toBeDefined();
      expect(Array.isArray(f.campos)).toBe(true);
      expect(f.campos.length).toBeGreaterThan(0);
    });
  });

  it('las revisiones iniciales incluyen los períodos Mayo, Junio y Julio 2026', () => {
    expect(REVISIONES_DIRECCION_INICIALES.length).toBe(3);
    const meses = REVISIONES_DIRECCION_INICIALES.map(r => r.mes);
    expect(meses).toContain('Mayo');
    expect(meses).toContain('Junio');
    expect(meses).toContain('Julio');
  });
});
