import { describe, it, expect } from 'vitest';
import { candidatosAnioAnterior, traerDelAnioAnterior, faltante } from '../riesgos';

const base = { area: 'Plantas', direccion: 'Dir. Técnica', tipo: 'Riesgo', proceso: 'Producción', contexto: 'Indicadores',
  descripcion: 'Falla de bombas', causa: 'Mantenimiento', consecuencia: 'Sin agua', controles: 'Bitácora', probabilidad: 3, impacto: 6, tratamiento: 'Mitigar' };
const riesgos = [
  { ...base, id: 1, anio: 2026, estado: 'MONITOREO' },
  { ...base, id: 2, anio: 2026, estado: 'CERRADO_EFICAZ', descripcion: 'Ya resuelto' },
  { ...base, id: 3, anio: 2026, estado: 'EN_TRATAMIENTO', pm_id: 77, pm_folio: 'OM#3/2026' },
  { ...base, id: 4, anio: 2026, area: 'Jurídico', estado: 'MONITOREO' },
  { ...base, id: 5, anio: 2025, estado: 'MONITOREO' },
];

describe('traer riesgos del año anterior (reevaluación anual)', () => {
  it('lista los del año anterior del área; los cerrados eficaces vienen desmarcados', () => {
    const c = candidatosAnioAnterior(riesgos, 'Plantas', 2027);
    expect(c.map((x) => [x.r.id, x.sugerido])).toEqual([[1, true], [2, false], [3, true]]);
  });

  it('copia el contenido sin evaluación, sin plan ni folio, ligada al original', () => {
    const [n] = traerDelAnioAnterior(riesgos, [3], { area: 'Plantas', anio: 2027, por: 'Área' });
    expect(n).toMatchObject({ anio: 2027, area: 'Plantas', descripcion: 'Falla de bombas', proceso: 'Producción', estado: 'IDENTIFICADO',
      probabilidad: 0, impacto: 0, tratamiento: '', plan: [], origen_id: 3, origen_anio: 2026 });
    expect(n.pm_id).toBeUndefined();
    expect(n.evaluacion_anterior).toMatchObject({ anio: 2026, probabilidad: 3, impacto: 6, nivel: 'Bajo', estado: 'EN_TRATAMIENTO', pm_folio: 'OM#3/2026' });
    expect(faltante(n)).toMatch(/evaluarlo/); // obliga a reevaluar
  });

  it('no se trae dos veces ni de otra área', () => {
    const ya = [...riesgos, { ...base, id: 9, anio: 2027, origen_id: 1 }];
    expect(candidatosAnioAnterior(ya, 'Plantas', 2027).map((x) => x.r.id)).toEqual([2, 3]);
    expect(traerDelAnioAnterior(ya, [1, 4], { area: 'Plantas', anio: 2027 })).toEqual([]);
  });
});

describe('ligas de riesgos con indicadores y acciones correctivas', () => {
  it('encuentra los riesgos ligados a un indicador o a una AC (ids como texto o número)', async () => {
    const { riesgosLigados } = await import('../riesgos');
    const rs = [{ id: 1, indicadores_ids: ['7'], acciones_ids: [] }, { id: 2, indicadores_ids: [7, 8], acciones_ids: ['55'] }, { id: 3 }];
    expect(riesgosLigados(rs, 'indicadores_ids', 7).map((r) => r.id)).toEqual([1, 2]);
    expect(riesgosLigados(rs, 'acciones_ids', '55').map((r) => r.id)).toEqual([2]);
    expect(riesgosLigados(undefined, 'acciones_ids', 1)).toEqual([]);
  });
});

describe('pendientes operativos del tablero', () => {
  it('cuenta matrices sin enviar y en revisión, planes vencidos/por vencer y riesgos por dictaminar', async () => {
    const { pendientesOperativos } = await import('../riesgos');
    const planes = [
      { id: 1, estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2020-01-01' },        // vencido
      { id: 2, estado: 'CERRADO_EFECTIVO' },                                         // cerrado: el riesgo espera dictamen
    ];
    const riesgos = [
      { id: 10, anio: 2027, area: 'Plantas', estado: 'EN_TRATAMIENTO', pm_id: 1 },
      { id: 11, anio: 2027, area: 'Plantas', estado: 'EN_TRATAMIENTO', pm_id: 2 },
    ];
    const matrices = [{ id: 'Plantas|2027', estado: 'ENVIADA' }, { id: 'Comercial|2027', estado: 'ACEPTADA' }];
    const p = pendientesOperativos({ areas: ['Plantas', 'Comercial', 'Jurídico'], matrices, riesgos, planes, anio: 2027 });
    expect(p.sinEnviar).toEqual(['Jurídico']);
    expect(p.enRevision).toEqual(['Plantas']);
    expect(p.vencidos.map((r) => r.id)).toEqual([10]);
    expect(p.porDictaminar.map((r) => r.id)).toEqual([11]);
    expect(p.total).toBe(4);
  });
});
