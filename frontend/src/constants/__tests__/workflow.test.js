// Pruebas del workflow del SGC: transiciones, permisos y semáforo de vencimiento.
// Estas reglas gobiernan qué puede hacer cada rol y cuándo un registro está vencido.
import { describe, it, expect } from 'vitest';
import {
  TRANSICIONES,
  PERMISOS,
  can,
  puedeVerTodasAreas,
  puedeVerArea,
  normalizarEstado,
  esCerrado,
  cumpleFiltroEstado,
  getVencimiento,
  diasRestantes,
  getFechaCompromiso,
} from '../workflow';

const usuario = (rol, area = 'Control de Calidad') => ({ id: 1, nombre: 'Test', rol, area });

describe('permisos por rol', () => {
  it('el Super Admin puede todo el workflow', () => {
    ['crear', 'editar', 'aprobar', 'rechazar', 'cerrar', 'eliminar', 'ver_todas_areas'].forEach((accion) => {
      expect(can(usuario('Super Admin'), accion)).toBe(true);
    });
  });

  it('el Auditor cierra y rechaza, pero no aprueba', () => {
    expect(can(usuario('Auditor'), 'cerrar')).toBe(true);
    expect(can(usuario('Auditor'), 'rechazar')).toBe(true);
    expect(can(usuario('Auditor'), 'aprobar')).toBe(false);
  });

  it('el Usuario solo crea y edita', () => {
    expect(can(usuario('Usuario'), 'crear')).toBe(true);
    expect(can(usuario('Usuario'), 'eliminar')).toBe(false);
    expect(can(usuario('Usuario'), 'ver_todas_areas')).toBe(false);
  });

  it('un usuario nulo o sin rol no tiene permisos', () => {
    expect(can(null, 'crear')).toBe(false);
    expect(can({ id: 1 }, 'crear')).toBe(false);
  });

  it('todos los roles declarados tienen una entrada en la matriz', () => {
    ['Super Admin', 'Admin', 'Auditor', 'Encargado', 'Usuario'].forEach((rol) => {
      expect(Array.isArray(PERMISOS[rol])).toBe(true);
    });
  });
});

describe('alcance por área', () => {
  it('quien ve todas las áreas accede a cualquier área', () => {
    expect(puedeVerTodasAreas(usuario('Admin'))).toBe(true);
    expect(puedeVerArea(usuario('Admin'), 'Otra área')).toBe(true);
  });

  it('el Encargado solo ve su propia área', () => {
    expect(puedeVerTodasAreas(usuario('Encargado'))).toBe(false);
    expect(puedeVerArea(usuario('Encargado'), 'Control de Calidad')).toBe(true);
    expect(puedeVerArea(usuario('Encargado'), 'Recursos Humanos')).toBe(false);
  });
});

describe('transiciones del workflow', () => {
  it('un borrador solo puede enviarse a revisión', () => {
    expect(TRANSICIONES.BORRADOR).toEqual(['EN_REVISION']);
  });

  it('los estados cerrados son terminales (salvo el no efectivo)', () => {
    expect(TRANSICIONES.CERRADO_EFECTIVO).toEqual([]);
    expect(TRANSICIONES.CERRADO).toEqual([]);
    expect(TRANSICIONES.CERRADO_NO_EFECTIVO).toEqual(['EN_SEGUIMIENTO']);
  });

  it('todo estado destino declarado existe como estado origen', () => {
    const destinos = Object.values(TRANSICIONES).flat();
    destinos.forEach((destino) => {
      expect(TRANSICIONES).toHaveProperty(destino);
    });
  });
});

describe('normalización de estados heredados', () => {
  it('mapea los estados legacy al flujo canónico', () => {
    expect(normalizarEstado('GENERADO_IA')).toBe('BORRADOR');
    expect(normalizarEstado('EN_PROCESO')).toBe('EN_SEGUIMIENTO');
    expect(normalizarEstado('CERRADA')).toBe('CERRADO');
  });

  it('devuelve BORRADOR ante un estado vacío', () => {
    expect(normalizarEstado(null)).toBe('BORRADOR');
    expect(normalizarEstado('')).toBe('BORRADOR');
  });
});

describe('filtros de estado', () => {
  it('agrupa abiertos y cerrados correctamente', () => {
    expect(esCerrado('CERRADO_EFECTIVO')).toBe(true);
    expect(esCerrado('EN_SEGUIMIENTO')).toBe(false);
    expect(cumpleFiltroEstado('EN_SEGUIMIENTO', 'GRUPO_ABIERTOS')).toBe(true);
    expect(cumpleFiltroEstado('CERRADO', 'GRUPO_CERRADOS')).toBe(true);
    expect(cumpleFiltroEstado('CERRADO', 'GRUPO_ABIERTOS')).toBe(false);
  });

  it('un filtro vacío acepta todo', () => {
    expect(cumpleFiltroEstado('CUALQUIERA', '')).toBe(true);
  });
});

describe('vencimiento de compromisos', () => {
  const enDias = (n) => {
    const f = new Date();
    f.setDate(f.getDate() + n);
    return f.toISOString();
  };

  it('detecta un registro vencido', () => {
    const registro = { estado: 'EN_SEGUIMIENTO', fecha_cierre_estimada: enDias(-5) };
    expect(getVencimiento(registro).nivel).toBe('vencido');
    expect(diasRestantes(getFechaCompromiso(registro))).toBeLessThan(0);
  });

  it('marca por vencer cuando faltan 15 días o menos', () => {
    const registro = { estado: 'EN_SEGUIMIENTO', fecha_cierre_estimada: enDias(10) };
    expect(getVencimiento(registro).nivel).toBe('por_vencer');
  });

  it('marca en tiempo cuando falta más de 15 días', () => {
    const registro = { estado: 'EN_SEGUIMIENTO', fecha_cierre_estimada: enDias(60) };
    expect(getVencimiento(registro).nivel).toBe('en_tiempo');
  });

  it('un registro cerrado no se reporta como vencido', () => {
    const registro = { estado: 'CERRADO_EFECTIVO', fecha_cierre_estimada: enDias(-100) };
    expect(getVencimiento(registro).nivel).toBe('cerrado');
  });

  it('sin fecha devuelve el nivel sin_fecha', () => {
    expect(getVencimiento({ estado: 'EN_SEGUIMIENTO' }).nivel).toBe('sin_fecha');
    expect(getVencimiento(null).nivel).toBe('sin_fecha');
  });
});