import { describe, it, expect } from 'vitest';
import { puntaje, nivelDe, requierePlan, estadoRiesgo, pmDesdeRiesgo, sugerirEficacia, faltante, llevaPM, ORIGEN_PM_RIESGOS } from '../riesgos';

const base = { id: 7, tipo: 'Riesgo', area: 'Plantas Potabilizadoras', anio: 2027, descripcion: 'Falla en bombas', causa: 'Sin mantenimiento', probabilidad: 4, impacto: 4 };
const plan = [{ actividad: 'Programa de mantenimiento', responsable: 'Gerente', fecha_termino_sugerida: '2027-03-31' }, { actividad: 'Bitácora', responsable: 'Supervisor', fecha_termino_sugerida: '2027-06-30', evidencia_esperada: 'Bitácora firmada' }];

describe('nivel 5×5', () => {
  it('clasifica bajo / medio / alto', () => {
    expect(nivelDe({ probabilidad: 2, impacto: 3 }).nivel).toBe('Bajo');
    expect(nivelDe({ probabilidad: 3, impacto: 4 }).nivel).toBe('Medio');
    expect(nivelDe({ probabilidad: 4, impacto: 4 }).nivel).toBe('Alto');
    expect(nivelDe({})).toBeNull();
    expect(puntaje(base)).toBe(16);
  });
  it('medio y alto requieren plan', () => {
    expect(requierePlan(base)).toBe(true);
    expect(requierePlan({ probabilidad: 1, impacto: 5 })).toBe(false);
  });
});

describe('qué falta para enviar', () => {
  it('pide descripción, evaluación, tratamiento y plan completo', () => {
    expect(faltante({ ...base, descripcion: '' })).toMatch(/descripción/);
    expect(faltante({ ...base, probabilidad: 0 })).toMatch(/evaluarlo/);
    expect(faltante(base)).toMatch(/tratamiento/);
    expect(faltante({ ...base, tratamiento: 'Mitigar' })).toMatch(/plan/);
    expect(faltante({ ...base, tratamiento: 'Mitigar', plan: [{ actividad: 'x', responsable: '', fecha_termino_sugerida: '2027-01-01' }] })).toMatch(/incompletas/);
    expect(faltante({ ...base, tratamiento: 'Mitigar', plan })).toBeNull();
    expect(faltante({ ...base, tratamiento: 'Aceptar' })).toBeNull();
  });
});

describe('plan de mejora ligado', () => {
  it('nace con las actividades del riesgo y su referencia', () => {
    const pm = pmDesdeRiesgo({ ...base, tratamiento: 'Mitigar', plan }, { folio: { codigo: 'OM#10/2027', numero: 10, anio: '2027' }, por: 'SGC', ahora: 'x' });
    expect(pm).toMatchObject({ folio_codigo: 'OM#10/2027', estado: 'EN_SEGUIMIENTO', origen: ORIGEN_PM_RIESGOS, riesgo_id: 7, titulo_mejora: 'Falla en bombas', fecha_limite: '2027-06-30' });
    expect(JSON.parse(pm.actividades)).toHaveLength(2);
    expect(llevaPM({ ...base, tratamiento: 'Aceptar', plan })).toBe(false);
  });
  it('cuando el auditor cierra el PM queda por dictaminar', () => {
    const r = { ...base, estado: 'EN_TRATAMIENTO', pm_id: 99 };
    expect(estadoRiesgo(r, [{ id: 99, estado: 'EN_SEGUIMIENTO' }])).toBe('EN_TRATAMIENTO');
    expect(estadoRiesgo(r, [{ id: 99, estado: 'CERRADO_EFECTIVO' }])).toBe('PENDIENTE_DICTAMEN');
  });
});

describe('eficacia', () => {
  it('riesgo eficaz si el nivel residual bajó; oportunidad la decide el SGC', () => {
    expect(sugerirEficacia(base, { probabilidad: 2, impacto: 4 })).toBe('EFICAZ');
    expect(sugerirEficacia(base, { probabilidad: 4, impacto: 4 })).toBe('NO_EFICAZ');
    expect(sugerirEficacia({ ...base, tipo: 'Oportunidad' }, { probabilidad: 2, impacto: 2 })).toBeNull();
  });
});
