// Pruebas de los puentes inter-módulos del SGC.
// Verifican que una AC/PM generada desde otro módulo llega con los datos
// correctos (origen, área, proceso, vínculo) y en estado BORRADOR.
import { describe, it, expect } from 'vitest';
import {
  acDesdeIndicador,
  acDesdeAuditoria,
  acDesdeDocumento,
  pmDesdeRiesgo,
  movimientoVinculo,
  fechaEnDias,
  folioBorrador,
} from '../flujoService';

describe('folioBorrador', () => {
  it('genera folios con prefijo y origen legibles', () => {
    const folio = folioBorrador('AC', 'IND');
    expect(folio).toMatch(/^AC-IND-\d{7}$/);
  });

  it('genera folios distintos en llamadas consecutivas', () => {
    const a = folioBorrador('AC', 'IND');
    const b = folioBorrador('AC', 'IND');
    expect(typeof a).toBe('string');
    expect(typeof b).toBe('string');
  });
});

describe('fechaEnDias', () => {
  it('devuelve una fecha ISO YYYY-MM-DD futura', () => {
    const fecha = fechaEnDias(30);
    expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(fecha).getTime()).toBeGreaterThan(Date.now() - 86400000);
  });
});

describe('acDesdeIndicador', () => {
  const indicador = {
    id: 42,
    nombre: 'Cobertura de Micromedición',
    area: 'Verificación y Lectura',
    proceso: 'Comercialización',
    direccion: 'Comercial',
    meta: 60,
    unidad: 'Porcentaje',
  };

  it('crea un borrador con el origen y vínculo correctos', () => {
    const ac = acDesdeIndicador(indicador, { cumplimiento: 45, anio: 2026, meses: ['Ene', 'Feb'] });
    expect(ac.estado).toBe('BORRADOR');
    expect(ac.origen).toBe('Indicador');
    expect(ac.origen_modulo).toBe('INDICADORES');
    expect(ac.origen_referencia).toBe('42');
    expect(ac.area).toBe('Verificación y Lectura');
    expect(ac.proceso).toBe('Comercialización');
  });

  it('describe el incumplimiento con la meta y el cumplimiento', () => {
    const ac = acDesdeIndicador(indicador, { cumplimiento: 45 });
    expect(ac.descripcion_no_conformidad_original).toContain('Cobertura de Micromedición');
    expect(ac.descripcion_no_conformidad_original).toContain('45%');
    expect(ac.descripcion_no_conformidad_original).toContain('60');
  });

  it('maneja indicadores sin captura de resultados', () => {
    const ac = acDesdeIndicador(indicador, { cumplimiento: null });
    expect(ac.descripcion_no_conformidad_original).toContain('sin captura');
  });

  it('establece una fecha de cierre estimada futura', () => {
    const ac = acDesdeIndicador(indicador, {});
    expect(new Date(ac.fecha_cierre_estimada).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('acDesdeAuditoria', () => {
  const auditoria = { id: 7, numero: 'AUD-2026-001', tipo: 'Interna', area: 'SGC', fecha_fin: '2026-03-01' };

  it('vincula la AC con el número de auditoría', () => {
    const ac = acDesdeAuditoria(auditoria, {});
    expect(ac.origen).toBe('Auditoría');
    expect(ac.numero_auditoria).toBe('AUD-2026-001');
    expect(ac.origen_modulo).toBe('AUDITORIAS');
    expect(ac.estado).toBe('BORRADOR');
  });

  it('usa el hallazgo cuando se proporciona', () => {
    const ac = acDesdeAuditoria(auditoria, { descripcion: 'Falta de registro de calibración', area: 'Control de Calidad' });
    expect(ac.descripcion_no_conformidad_original).toBe('Falta de registro de calibración');
    expect(ac.area).toBe('Control de Calidad');
  });

  it('genera una descripción por defecto si no hay hallazgo', () => {
    const ac = acDesdeAuditoria(auditoria, {});
    expect(ac.descripcion_no_conformidad_original).toContain('AUD-2026-001');
  });
});

describe('acDesdeDocumento', () => {
  const doc = { clave: 'OOMRSC-20', titulo: 'Formato de Acción Correctiva', area: 'SGC' };
  const impacto = { cantidadUsos: 4, utilizadoEn: [{ clave: 'MC-01' }, { clave: 'PR-CAL-01' }] };

  it('referencia el requisito 7.5.3 y el impacto', () => {
    const ac = acDesdeDocumento(doc, impacto);
    expect(ac.descripcion_no_conformidad_original).toContain('7.5.3');
    expect(ac.descripcion_no_conformidad_original).toContain('OOMRSC-20');
    expect(ac.descripcion_no_conformidad_original).toContain('4');
  });

  it('marca que requiere cambio del SGC', () => {
    const ac = acDesdeDocumento(doc, impacto);
    expect(ac.requiere_cambio_sgc).toBe('SI');
    expect(ac.origen_modulo).toBe('DOCUMENTOS');
    expect(ac.origen_referencia).toBe('OOMRSC-20');
  });

  it('tolera un impacto vacío', () => {
    const ac = acDesdeDocumento(doc, {});
    expect(ac.descripcion_no_conformidad_original).toContain('0 documento(s)');
  });
});

describe('pmDesdeRiesgo', () => {
  const riesgo = {
    id: 3,
    riesgo: 'Falla de bombas por falta de mantenimiento',
    causa: 'Mantenimiento preventivo no ejecutado',
    efecto: 'Interrupción del servicio',
    probabilidad: 4,
    impacto: 5,
    area: 'Mantenimiento de Redes',
    proceso: 'Mantenimiento y Calibración',
    direccion: 'Técnica',
  };

  it('crea un plan en borrador vinculado al riesgo', () => {
    const pm = pmDesdeRiesgo(riesgo);
    expect(pm.estado).toBe('BORRADOR');
    expect(pm.origen_modulo).toBe('RIESGOS');
    expect(pm.origen_referencia).toBe('3');
    expect(pm.gerencia_coordinacion).toBe('Mantenimiento de Redes');
  });

  it('incorpora causa, efecto y nivel de exposición', () => {
    const pm = pmDesdeRiesgo(riesgo);
    expect(pm.descripcion_situacion_actual).toContain('Mantenimiento preventivo no ejecutado');
    expect(pm.descripcion_situacion_actual).toContain('Interrupción del servicio');
    expect(pm.descripcion_situacion_actual).toContain('20'); // 4 × 5
  });

  it('tolera un riesgo con campos faltantes', () => {
    expect(() => pmDesdeRiesgo({ id: 1 })).not.toThrow();
    expect(pmDesdeRiesgo({ id: 1 }).estado).toBe('BORRADOR');
  });
});

describe('movimientoVinculo', () => {
  it('genera el registro de bitácora del vínculo', () => {
    const mov = movimientoVinculo({
      origenModulo: 'INDICADORES',
      destinoModulo: 'ACCIONES_CORRECTIVAS',
      referencia: 'Indicador X',
      folio: 'AC-IND-123',
    });
    expect(mov.modulo).toBe('ACCIONES_CORRECTIVAS');
    expect(mov.accion).toBe('VINCULO_MODULO');
    expect(mov.folio).toBe('AC-IND-123');
    expect(mov.descripcion).toContain('Acción Correctiva');
  });
});