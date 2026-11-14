import { describe, it, expect } from 'vitest';
import { tocaReportar, aplicarProyectos, altasAlAprobar, fichasConProyecto, promedioTrimestreCuadro } from '../catalogoIndicadores';
import { evalSemaforoOOMRSC05 } from '../indicadores';
import { repartirMeta } from '../../components/indicadores/EditorProyecto';

const proy = (estado = 'APROBADO') => ({
  id: 'p1', anio: 2027, area: 'Informática', nombre: 'P', estado, eje_rector: 'EJE',
  actividades: [
    { indicador_id: '5', indicador: 'Solicitudes', unidad: 'Porcentaje', meta: '95', trimestres: ['24', '24', '24', '23'], periodicidad: 'Mensual', impacto: 'Alto', ficha: { metodo: 'A/B', sentido: 'ASCENDENTE' } },
    { indicador_id: '', indicador: 'Nuevo indicador', unidad: 'Porcentaje', meta: '100', trimestres: ['25', '25', '25', '25'] },
  ],
});

describe('conexión proyecto → Cuadro de Control', () => {
  it('periodicidad: trimestral solo reporta mar/jun/sep/dic', () => {
    expect(tocaReportar({ periodicidad: 'Trimestral' }, 2)).toBe(true);
    expect(tocaReportar({ periodicidad: 'Trimestral' }, 9)).toBe(false);
    expect(tocaReportar({ periodicidad: 'Mensual' }, 9)).toBe(true);
  });
  it('el proyecto aprobado del año manda en metas; borrador u otro año no', () => {
    const lista = [{ id: 5, nombre: 'Viejo', meta: 90, impacto: 'Bajo' }];
    const [x] = aplicarProyectos(lista, [proy()], 2027);
    expect([x.nombre, x.meta, x.impacto, x.metas_trimestrales.T4, x.proyecto.id]).toEqual(['Solicitudes', 95, 'Alto', 23, 'p1']);
    expect(aplicarProyectos(lista, [proy('BORRADOR')], 2027)[0].meta).toBe(90);
    expect(aplicarProyectos(lista, [proy()], 2026)[0].meta).toBe(90);
  });
  it('al aprobar, la actividad sin indicador da de alta uno nuevo y queda ligada', () => {
    const { actividades, nuevos } = altasAlAprobar(proy(), [{ id: 5 }, { id: 100 }], () => 'Dir. Administrativa');
    expect(actividades[1].indicador_id).toBe(101);
    expect(nuevos[101]).toMatchObject({ nombre: 'Nuevo indicador', area: 'Informática', meta: 100, direccion: 'Dir. Administrativa' });
  });
  it('la ficha PMD se arma con lo del proyecto', () => {
    const f = fichasConProyecto({}, [proy()], 2027, [{ id: 5, numero: 5 }])[5];
    expect(f.identificacion.metodo_calculo).toBe('A/B');
    expect(f.alineacion.eje_rector_pmd).toBe('EJE');
  });
  it('promedio trimestral del Cuadro', () => {
    const r = { '5-Ene-2027': { valor: 90 }, '5-Feb-2027': { valor: 100 } };
    expect(promedioTrimestreCuadro(r, '5', 2027, 0, ['Ene', 'Feb', 'Mar'])).toBe(95);
    expect(promedioTrimestreCuadro(r, '', 2027, 0, ['Ene'])).toBe(null);
  });
  it('reparte la meta como el formato y meta 0 descendente no sale verde', () => {
    expect(repartirMeta('95')).toEqual(['24', '24', '24', '23']);
    expect(repartirMeta('100')).toEqual(['25', '25', '25', '25']);
    expect(evalSemaforoOOMRSC05(5, 0, true).rango).toBe('CRITICO');
    expect(evalSemaforoOOMRSC05(0, 0, true).rango).toBe('ACEPTABLE');
  });
});
