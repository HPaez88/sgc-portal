import { describe, it, expect } from 'vitest';
import { BANCO_PREGUNTAS } from '../auditoriaPreguntas';
import {
  criterioDePuntos, criterioDe, letraDe, rangoDe, frecuenciaMeses, sumarMeses, listaAutomatica, resumenPreguntas, resumenPorCapitulo, faltanteLista,
  hallazgosDeLista, plazoApertura, numeroSiguiente, proponerEquipo, conflictoDeInteres, auditoresRequeridos, calendarioAnual, puntosBono,
  promedioEvaluacion, bimestreDe, faltantePrograma, faltantePlan, nuevaAuditoria, nuevaAreaAuditada,
} from '../auditorias';

describe('auditorías internas (OOMPSC-08)', () => {
  it('el banco tiene todas las cláusulas con al menos una pregunta y su clave', () => {
    expect(BANCO_PREGUNTAS.length).toBeGreaterThanOrEqual(32);
    BANCO_PREGUNTAS.forEach((c) => { expect(c.preguntas.length).toBeGreaterThan(0); expect(c.preguntas[c.clave]).toBeTruthy(); });
    expect(BANCO_PREGUNTAS[0].titulo).toMatch(/^Comprensión/);
  });
  it('puntos → criterio y letra oficial', () => {
    expect([10, 9, 8, 7, 6, 5, 4, 0].map(criterioDePuntos)).toEqual(['EXCELENTE', 'CONFORME', 'CONFORME', 'OPORTUNIDAD', 'OPORTUNIDAD', 'CORRECCION', 'NO_CONFORMIDAD', 'NO_CONFORMIDAD']);
    expect(criterioDePuntos('')).toBeNull();
    expect([10, 8, 7, 5, 3].map(letraDe)).toEqual(['C', 'C', 'OM', 'NC', 'NC']);
  });
  it('operación actual: se califica C / NC / OM (la NC puede ser corrección menor)', () => {
    expect([{ criterio: 'C' }, { criterio: 'OM' }, { criterio: 'NC' }, { criterio: 'NC', correccion_menor: true }, { criterio: '' }].map(criterioDe))
      .toEqual(['CONFORME', 'OPORTUNIDAD', 'NO_CONFORMIDAD', 'CORRECCION', null]);
    expect(letraDe({ criterio: 'NC', correccion_menor: true })).toBe('NC');
    const qs = [{ criterio: 'C' }, { criterio: 'C' }, { criterio: 'C' }, { criterio: 'OM', comentario: 'Se puede mejorar el registro' }, { criterio: 'NC', comentario: 'No se encontró evidencia de' }];
    expect(resumenPreguntas(qs)).toMatchObject({ auditadas: 5, conformes: 3, oportunidades: 1, noConformidades: 1, cumplimiento: 60, eficiencia: null, rango: 'CRITICO', completa: true });
    expect(faltanteLista(qs.map((q) => ({ ...q, aplica: true, pregunta: '¿?' })))).toBeNull();
    expect(faltanteLista([{ criterio: 'NC', aplica: true, pregunta: '¿?' }])).toMatch(/evidencia/);
    expect(hallazgosDeLista({ id: 'L', auditoria_id: 1, area: 'X', preguntas: qs.map((q, i) => ({ ...q, id: String(i) })) }).map((h) => h.tipo)).toEqual(['OM', 'NC']);
  });
  it('rango y frecuencia del calendario', () => {
    expect([95, 90, 89.9, 80, 79.9].map(rangoDe)).toEqual(['ACEPTABLE', 'ACEPTABLE', 'RIESGO', 'RIESGO', 'CRITICO']);
    expect([0, 1, 3, 4, 8, 9, 20].map(frecuenciaMeses)).toEqual([12, 8, 8, 6, 6, 4, 4]);
    expect(sumarMeses('2026-10-31', 4)).toBe('2027-02-28');
    expect(sumarMeses('2026-03-15', 12)).toBe('2027-03-15');
    expect(bimestreDe('2026-11-03')).toBe(5);
  });
  it('la lista automática lleva una pregunta por cláusula, estable por semilla y distinta entre auditorías', () => {
    const a = listaAutomatica('5|Contabilidad');
    expect(a.length).toBe(BANCO_PREGUNTAS.length);
    expect(a).toEqual(listaAutomatica('5|Contabilidad'));
    expect(a.every((q) => q.estandar && q.pregunta)).toBe(true);
    const b = listaAutomatica('6|Contabilidad');
    expect(a.some((q, i) => q.pregunta !== b[i].pregunta)).toBe(true);
  });
  it('resumen: eficiencia por puntos y cumplimiento oficial', () => {
    const qs = [{ puntos: 10, capitulo: 4 }, { puntos: 8, capitulo: 4 }, { puntos: 6, capitulo: 5 }, { puntos: 5, capitulo: 5 }, { puntos: 2, capitulo: 6 }, { puntos: '', capitulo: 6 }, { puntos: 9, aplica: false, capitulo: 7 }];
    const r = resumenPreguntas(qs);
    expect(r).toMatchObject({ total: 6, auditadas: 5, noAplica: 1, conformes: 2, oportunidades: 1, correcciones: 1, noConformidades: 1, eficiencia: 62, cumplimiento: 40, rango: 'CRITICO', completa: false });
    expect(resumenPorCapitulo(qs).find((c) => c.capitulo === 4).eficiencia).toBe(90);
    expect(resumenPreguntas([]).eficiencia).toBeNull();
  });
  it('una lista no se entrega con preguntas sin calificar ni bajas sin evidencia', () => {
    const base = { aplica: true, pregunta: '¿x?' };
    expect(faltanteLista([])).toMatch(/no tiene/);
    expect(faltanteLista([{ ...base, puntos: '' }])).toMatch(/por calificar/);
    expect(faltanteLista([{ ...base, puntos: 6, comentario: 'corto' }])).toMatch(/evidencia/);
    expect(faltanteLista([{ ...base, puntos: 6, comentario: 'No se encontró el registro del mes' }, { ...base, puntos: 9 }, { ...base, puntos: '', aplica: false }])).toBeNull();
  });
  it('los hallazgos salen de lo calificado con menos de 8', () => {
    const lista = { id: 'L1', auditoria_id: 7, area: 'Contabilidad', auditor: 'Ana', preguntas: [
      { id: 'a', clausula: '7.5', titulo: 'Información documentada', pregunta: '¿?', puntos: 3, comentario: 'Sin control de cambios' },
      { id: 'b', clausula: '9.1.3', pregunta: '¿?', puntos: 5, comentario: 'Indicador sin captura' },
      { id: 'c', clausula: '10.3', pregunta: '¿?', puntos: 7, comentario: 'Podría automatizarse' }, { id: 'd', clausula: '4.1', pregunta: '¿?', puntos: 9 }] };
    const h = hallazgosDeLista(lista);
    expect(h.map((x) => x.tipo)).toEqual(['NC', 'CORRECCION', 'OM']);
    expect(h[0]).toMatchObject({ id: 'L1-a', area: 'Contabilidad', clausula: '7.5', estado: 'ABIERTO', auditoria_id: 7 });
  });
  it('plazo de apertura: 5 días hábiles después del informe', () => {
    expect(plazoApertura('2026-11-16')).toBe('2026-11-23'); // lunes → lunes siguiente
    expect(plazoApertura('2026-11-20')).toBe('2026-11-27'); // viernes → viernes siguiente
    expect(plazoApertura('')).toBe('');
  });
  it('equipo por orden de confirmación, sin auditar su propia área ni dirección', () => {
    const dir = (a) => ({ Contabilidad: 'Administrativa', 'Recursos Humanos': 'Administrativa', Plantas: 'Técnica', Jurídico: 'Jurídica' }[a] || '');
    const aud = { areas: [nuevaAreaAuditada('Contabilidad'), nuevaAreaAuditada('Plantas', { auditores_requeridos: 2 })] };
    const conf = [
      { email: 'rh@x', area: 'Recursos Humanos', fecha: '2026-11-01T08:00' }, { email: 'pl@x', area: 'Plantas', fecha: '2026-11-01T08:05' },
      { email: 'ju@x', area: 'Jurídico', fecha: '2026-11-01T08:10' }];
    const { asignacion, sinCubrir } = proponerEquipo(aud, conf, dir);
    expect(asignacion.Contabilidad).toEqual(['pl@x']);          // rh@x es de la misma dirección
    expect(asignacion.Plantas).toEqual(['rh@x', 'ju@x']);        // por orden y repartiendo carga
    expect(sinCubrir).toEqual([]);
    expect(auditoresRequeridos(aud)).toBe(3);
    expect(conflictoDeInteres({ area: 'Plantas' }, { area: 'Plantas' })).toMatch(/misma área/);
    expect(conflictoDeInteres({ area: 'Recursos Humanos' }, { area: 'Contabilidad' }, dir)).toMatch(/misma dirección/);
    expect(conflictoDeInteres({ area: 'Jurídico' }, { area: 'Contabilidad' }, dir)).toBeNull();
    expect(proponerEquipo({ areas: [nuevaAreaAuditada('Plantas')] }, [conf[1]], dir).sinCubrir).toEqual(['Plantas']);
  });
  it('calendario anual: resultados previos, frecuencia y fecha tentativa', () => {
    const auditorias = [{ id: 1, estado: 'CERRADA', fecha_fin: '2026-03-20', areas: [{ area: 'Contabilidad', fecha: '2026-03-18' }] }];
    const listas = [{ auditoria_id: 1, area: 'Contabilidad', preguntas: [{ puntos: 9 }, { puntos: 9 }, { puntos: 3 }] }];
    const hallazgos = [{ auditoria_id: 1, area: 'Contabilidad', tipo: 'NC' }];
    const [c, sin] = calendarioAnual({ areas: ['Contabilidad', 'Jurídico'], auditorias, listas, hallazgos });
    expect(c).toMatchObject({ nc: 1, frecuencia: 8, proxima: '2026-11-18', rango: 'CRITICO' });
    expect(sin).toMatchObject({ ultima: null, frecuencia: 12 });
  });
  it('programa, plan, consecutivo, bono y evaluación', () => {
    const a = nuevaAuditoria({ anio: 2026, numero: 6, por: 'SGC' });
    expect(faltantePrograma(a)).toMatch(/objetivo/);
    const listo = { ...a, objetivo: 'Verificar', alcance: 'Todo', fecha_inicio: '2026-11-17', fecha_fin: '2026-11-28', areas: [nuevaAreaAuditada('Plantas')] };
    expect(faltantePrograma(listo)).toBeNull();
    expect(faltantePlan(listo)).toMatch(/sin auditor/);
    expect(faltantePlan({ ...listo, fecha_reunion_cierre: '2026-12-02', areas: [{ ...listo.areas[0], auditor_lider: 'a@x', fecha: '2026-11-18' }] })).toBeNull();
    expect(numeroSiguiente([{ anio: 2026, numero: 5 }, { anio: 2025, numero: 9 }], 2026)).toBe(6);
    expect(puntosBono({ reunion_programa: 1, reunion_apertura: 1, seguimiento_hallazgos: 2, entrega_documentos: 1, cierre_acciones: 5, reunion_cierre: 1 })).toBe(8);
    expect(promedioEvaluacion({ a: 10, b: 8, c: '' })).toBe(9);
  });
});

describe('enlace con Panel y Revisión por la Dirección', () => {
  it('resume cada auditoría y promedia solo las concluidas del año', async () => {
    const { resumenParaPortal, promedioAuditorias } = await import('../auditorias');
    const auditorias = [{ id: 1, anio: 2026, numero: 1, estado: 'CERRADA', areas: [{ area: 'A' }] }, { id: 2, anio: 2026, numero: 2, estado: 'EN_EJECUCION', areas: [] }];
    const listas = [{ auditoria_id: 1, preguntas: [{ criterio: 'C' }, { criterio: 'C' }, { criterio: 'C' }, { criterio: 'NC' }] }];
    const r = resumenParaPortal({ auditorias, listas, hallazgos: [{ auditoria_id: 1, tipo: 'NC' }, { auditoria_id: 1, tipo: 'OM' }] });
    expect(r[0]).toMatchObject({ numero: 'AUD-1/2026', estado: 'COMPLETADA', hallazgos: 2, no_conformidades: 1, cumplimiento: 75, rango: 'CRITICO' });
    expect(r[1].estado).toBe('EN_PROCESO');
    expect(promedioAuditorias(r, 2026)).toEqual({ pct: 75, rango: 'CRITICO', total: 1 });
    expect(promedioAuditorias(r, 2025).pct).toBeNull();
  });
});
