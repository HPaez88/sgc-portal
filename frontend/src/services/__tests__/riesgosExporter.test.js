import { describe, it, expect } from 'vitest';
import { construirInformeRiesgosPDF } from '../riesgosExporter';
import { resumenRiesgos, desgloseRiesgos, comparativoAnual, hallazgosRiesgos } from '../../constants/riesgosInforme';

export function datosDePrueba() {
  const items = [];
  let id = 1;
  for (const anio of [2025, 2026]) for (const area of ['Plantas Potabilizadoras', 'Contabilidad', 'Atención Ciudadana']) for (let k = 0; k < 4; k += 1) {
    id += 1;
    items.push({ id, anio, area, tipo: k ? 'Riesgo' : 'Oportunidad', probabilidad: 1 + ((id * 3) % 5), impacto: [2, 4, 6, 8, 10][(id * 7) % 5], descripcion: `Falla en el suministro de reactivos por retraso del proveedor ${id}`, tratamiento: 'Mitigar', pm_id: k === 1 ? 99 : null });
  }
  const planes = [{ id: 99, estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2026-01-01', folio_codigo: 'PM#5/2026' }];
  const del = items.filter((r) => r.anio === 2026);
  const actual = resumenRiesgos(del, planes);
  const comparativo = comparativoAnual(items, planes, [2025, 2026]);
  const desglose = desgloseRiesgos(del, planes, (r) => r.area);
  const altos = del.filter((r) => r.tipo === 'Riesgo' && r.probabilidad * r.impacto >= 30).map((r) => ({ r, pm: planes.find((p) => p.id === r.pm_id), estado: 'EN_TRATAMIENTO', venc: null }));
  return { nombreAlcance: 'Dir. Técnica', anio: 2026, actual, comparativo, desglose, porNombre: 'Área', hallazgos: hallazgosRiesgos({ actual, anterior: comparativo[0], desglose, cobertura: { total: 3, aceptadas: 1 }, anio: 2026 }), altos, items: del, usuario: 'Prueba' };
}

describe('PDF del informe de riesgos', () => {
  it('se construye con todas sus secciones', () => {
    const doc = construirInformeRiesgosPDF(datosDePrueba());
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
