import { describe, it, expect } from 'vitest';
import { puntaje, nivelDe, requierePlan, estadoRiesgo, pmDesdeRiesgo, sugerirEficacia, faltante, llevaPM, ORIGEN_PM_RIESGOS, idUnico, idMatriz, esOficial, puedeCapturarArea } from '../riesgos';

const base = { id: 7, tipo: 'Riesgo', area: 'Plantas Potabilizadoras', anio: 2027, contexto: 'Indicadores', proceso: 'Producción', descripcion: 'Falla en bombas', causa: 'Sin mantenimiento', probabilidad: 4, impacto: 8 };
const plan = [{ actividad: 'Programa de mantenimiento', responsable: 'Gerente', fecha_termino_sugerida: '2027-03-31' }, { actividad: 'Bitácora', responsable: 'Supervisor', fecha_termino_sugerida: '2027-06-30', evidencia_esperada: 'Bitácora firmada' }];

describe('nivel con la escala oficial OOMRSC-37 (impacto 2-10 × probabilidad 1-5)', () => {
  it('clasifica bajo 0-19 / medio 20-29 / alto 30-50', () => {
    expect(nivelDe({ probabilidad: 3, impacto: 6 }).nivel).toBe('Bajo'); // 18
    expect(nivelDe({ probabilidad: 4, impacto: 6 }).nivel).toBe('Medio'); // 24
    expect(nivelDe({ probabilidad: 5, impacto: 6 }).nivel).toBe('Alto'); // 30
    expect(nivelDe({ probabilidad: 4, impacto: 8 }).nivel).toBe('Alto'); // 32
    expect(nivelDe({})).toBeNull();
    expect(puntaje(base)).toBe(32);
  });
  it('medio y alto requieren plan', () => {
    expect(requierePlan(base)).toBe(true);
    expect(requierePlan({ probabilidad: 1, impacto: 10 })).toBe(false);
  });
});

describe('qué falta para enviar', () => {
  it('pide descripción, evaluación, tratamiento y plan completo', () => {
    expect(faltante({ ...base, contexto: '' })).toMatch(/contexto/);
    expect(faltante({ ...base, proceso: '' })).toMatch(/proceso/);
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
    expect(pm).toMatchObject({ folio_codigo: 'OM#10/2027', estado: 'EN_SEGUIMIENTO', origen: ORIGEN_PM_RIESGOS, riesgo_id: 7, titulo_mejora: 'Falla en bombas', fecha_limite: '2027-06-30', fecha_seguimiento: '2027-07-14' });
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
    expect(sugerirEficacia(base, { probabilidad: 2, impacto: 8 })).toBe('EFICAZ');
    expect(sugerirEficacia(base, { probabilidad: 4, impacto: 8 })).toBe('NO_EFICAZ');
    expect(sugerirEficacia({ ...base, tipo: 'Oportunidad' }, { probabilidad: 2, impacto: 2 })).toBeNull();
  });
});

describe('correcciones de la auditoría (2026-11-14)', () => {
  it('idUnico no repite aunque se llame en el mismo milisegundo', () => {
    const ids = Array.from({ length: 50 }, () => idUnico());
    expect(new Set(ids).size).toBe(50);
  });
  it('un riesgo bajo con plan exige actividades completas (va a generar PM)', () => {
    const r = { contexto: 'Indicadores', proceso: 'Producción', descripcion: 'x', probabilidad: 1, impacto: 2, tratamiento: 'Mitigar', plan: [{ actividad: 'a', responsable: '' }] };
    expect(faltante(r)).toMatch(/incompletas/);
    expect(faltante({ ...r, plan: [{ actividad: 'a', responsable: 'Jefe', fecha_termino_sugerida: '2027-03-01' }] })).toBeNull();
  });
  it('si borraron el PM ligado, el estado lo avisa', () => {
    const r = { estado: 'EN_TRATAMIENTO', pm_id: 5 };
    expect(estadoRiesgo(r, [{ id: 9 }])).toBe('PM_NO_ENCONTRADO');
    expect(estadoRiesgo(r, [{ id: 5, estado: 'RECHAZADO' }])).toBe('PENDIENTE_DICTAMEN');
  });
  it('tablero e informes solo cuentan lo aceptado o con PM/dictamen', () => {
    const matrices = [{ id: idMatriz('A', 2026), estado: 'ACEPTADA' }, { id: idMatriz('B', 2026), estado: 'ENVIADA' }];
    expect(esOficial({ area: 'A', anio: 2026 }, matrices)).toBe(true);
    expect(esOficial({ area: 'B', anio: 2026 }, matrices)).toBe(false);
    expect(esOficial({ area: 'B', anio: 2026, pm_id: 1 }, matrices)).toBe(true);
  });
  it('captura: su área, encargados del SGC del área o el SGC', () => {
    const areas = [{ nombre: 'A', correo: 'jefe@x.mx', encargados_sgc: ['iso@x.mx'] }];
    expect(puedeCapturarArea({ area: 'A' }, 'A', areas)).toBe(true);
    expect(puedeCapturarArea({ area: 'Z', email: 'ISO@x.mx' }, 'A', areas)).toBe(true);
    expect(puedeCapturarArea({ area: 'Z', email: 'otro@x.mx' }, 'A', areas)).toBe(false);
    expect(puedeCapturarArea({ area: 'Z' }, 'A', areas, true)).toBe(true);
  });
  it('el PM nace con responsable y correos del área', () => {
    const pm = pmDesdeRiesgo({ id: 1, tipo: 'Riesgo', area: 'A', anio: 2027, probabilidad: 3, impacto: 8, plan: [{ actividad: 'a', responsable: 'Jefe de planta', fecha_termino_sugerida: '2027-03-01' }] }, { folio: { codigo: 'PM#1/2027', numero: 1, anio: 2027 }, por: 'SGC', correos: ['jefe@x.mx'] });
    expect(pm).toMatchObject({ responsable: 'Jefe de planta', correos_responsables: ['jefe@x.mx'] });
  });
});
