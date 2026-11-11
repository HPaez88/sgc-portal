// Pruebas del workflow del SGC: transiciones, permisos y semáforo de vencimiento.
// Estas reglas gobiernan qué puede hacer cada rol y cuándo un registro está vencido.
import { describe, it, expect } from 'vitest';
import {
  ajustarFechaSeguimiento,
  replanteosFinales, validarReplanteoFinal, aplicarReplanteoFinal, fechaSeguimientoInicial, fechaISO,
  cambioEncargado,
  etiquetaOrigen,
  correosDe,
  TRANSICIONES,
  PERMISOS,
  can,
  puedeVerTodasAreas,
  puedeVerArea,
  normalizarEstado,
  esCerrado,
  cumpleFiltroEstado,
  getVencimiento,
  parseFecha,
  motivoBloqueoCierre,
  esPorAbrir,
  diasRestantes,
  diasRestantes,
  getFechaCompromiso,
  calcularFechaFinal,
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

describe('fechas solo-día en hora local', () => {
  it('"2026-12-23" se lee como el 23 local, no el 22', () => {
    const d = parseFecha('2026-12-23');
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 12, 23]);
  });
  it('los días restantes no pierden un día', () => {
    const hoy = new Date();
    const en10 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 10);
    const iso = `${en10.getFullYear()}-${String(en10.getMonth() + 1).padStart(2, '0')}-${String(en10.getDate()).padStart(2, '0')}`;
    expect(diasRestantes(iso)).toBe(10);
  });
});

describe('regla: sin evidencia no hay solicitud de cierre', () => {
  it('bloquea si no hay actividades', () => {
    expect(motivoBloqueoCierre([])).toMatch(/al menos una actividad/);
    expect(motivoBloqueoCierre(undefined)).toMatch(/al menos una actividad/);
  });
  it('bloquea y nombra las actividades sin evidencia', () => {
    const m = motivoBloqueoCierre([{ actividad: 'Capacitar personal', evidencia_real: '/api/v1/archivos/3/url' }, { actividad: 'Actualizar procedimiento' }]);
    expect(m).toMatch(/1 actividad/);
    expect(m).toMatch(/Actualizar procedimiento/);
  });
  it('permite si todas tienen evidencia', () => {
    expect(motivoBloqueoCierre([{ actividad: 'A', evidencia_real: 'x' }, { actividad: 'B', evidencia_real: 'y' }])).toBeNull();
  });
});

describe('pestaña Por abrir', () => {
  it('solo borradores detectados por el sistema o el auditor', () => {
    expect(esPorAbrir({ estado: 'BORRADOR', origen_modulo: 'Auditoría' })).toBe(true);
    expect(esPorAbrir({ estado: 'BORRADOR', accion_origen_folio: 'AC#20/2026' })).toBe(true);
    expect(esPorAbrir({ estado: 'BORRADOR' })).toBe(false);
    expect(esPorAbrir({ estado: 'EN_SEGUIMIENTO', origen_modulo: 'Auditoría' })).toBe(false);
  });
});

describe('fecha final calculada por actividades', () => {
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  it('suma 2 semanas a la actividad más tardía', () => {
    // 2026-11-04 es miércoles: +14 = miércoles 2026-11-18
    const acts = [{ fecha_termino_sugerida: '2026-10-01' }, { fecha_termino_sugerida: '2026-11-04' }];
    expect(fmt(calcularFechaFinal(acts))).toBe('2026-11-18');
  });

  it('recorre al lunes si cae en fin de semana', () => {
    expect(fmt(calcularFechaFinal([{ fecha_termino_sugerida: '2026-11-07' }]))).toBe('2026-11-23'); // sábado
    expect(fmt(calcularFechaFinal([{ fecha_termino_sugerida: '2026-11-08' }]))).toBe('2026-11-23'); // domingo
  });

  it('sin actividades con fecha no calcula y usa la fecha del registro', () => {
    expect(calcularFechaFinal([{ actividad: 'x' }])).toBeNull();
    const importado = { estado: 'EN_SEGUIMIENTO', actividades_json: '[]', fecha_limite: '2026-10-30' };
    expect(fmt(getFechaCompromiso(importado))).toBe('2026-10-30');
  });

  it('las actividades mandan sobre la fecha del registro', () => {
    const r = { fecha_limite: '2026-10-30', actividades_json: JSON.stringify([{ fecha_termino_sugerida: '2026-12-01' }]) };
    expect(fmt(getFechaCompromiso(r))).toBe('2026-12-15');
  });
});

describe('etiquetaOrigen y correosDe', () => {
  it('pone el número de auditoría o de indicador', () => {
    expect(etiquetaOrigen({ origen: 'Auditoría Interna', numero_auditoria: '#9' })).toBe('Auditoría Interna #9');
    expect(etiquetaOrigen({ origen: 'Auditoría Interna', numero_auditoria: '9' })).toBe('Auditoría Interna #9');
    expect(etiquetaOrigen({ origen: 'Auditoría Externa', numero_auditoria: 'A2025-15985' })).toBe('Auditoría Externa A2025-15985');
    expect(etiquetaOrigen({ origen: 'Indicador', origen_referencia: '39' })).toBe('Indicador #39');
    expect(etiquetaOrigen({ origen: 'Queja' })).toBe('Queja');
    expect(etiquetaOrigen({})).toBe('-');
  });
  it('lee correos de lista o de texto importado', () => {
    expect(correosDe({ correos_responsables: ['a@x.mx', 'a@x.mx'] })).toEqual(['a@x.mx']);
    expect(correosDe({ correos_responsables: "['mmendoza@oomapasc.gob.mx', 'b@y.mx']" })).toEqual(['mmendoza@oomapasc.gob.mx', 'b@y.mx']);
    expect(correosDe({})).toEqual([]);
  });
});

describe('cambioEncargado', () => {
  it('no toca a quien ve todas las áreas (auditor, admin)', () => {
    expect(cambioEncargado({ rol: 'Auditor', area: 'Por asignar' }, 'Control y Servicios')).toBeNull();
  });
  it('asigna el área si no tenía y sube Usuario a Encargado', () => {
    expect(cambioEncargado({ rol: 'Usuario', area: 'Por asignar' }, 'Plantas')).toEqual({ area: 'Plantas', rol: 'Encargado' });
    expect(cambioEncargado({ rol: 'Encargado', area: '' }, 'Plantas')).toEqual({ area: 'Plantas', rol: 'Encargado' });
    expect(cambioEncargado({ rol: 'Usuario', area: 'Redes' }, 'Plantas')).toEqual({ area: 'Redes', rol: 'Encargado' });
  });
  it('no cambia a un encargado que ya tiene área', () => {
    expect(cambioEncargado({ rol: 'Encargado', area: 'Redes' }, 'Plantas')).toBeNull();
  });
});

describe('replanteo de fecha final', () => {
  const hoy = new Date(2026, 10, 9); // lunes 9 nov 2026
  const ac30 = { estado: 'EN_SEGUIMIENTO', fecha_limite: '2026-10-30', replanteos_control6: "[{'numero': 1, 'fecha': '2026-10-30'}]", actividades_json: '[]' };
  it('cuenta los replanteos del Control 6', () => {
    expect(replanteosFinales(ac30).usados).toBe(1);
    expect(replanteosFinales({ replanteos_control6: '[]' }).usados).toBe(0);
  });
  it('valida fecha hábil, futura, motivo y límite', () => {
    expect(validarReplanteoFinal(ac30, '2026-12-05', 'motivo suficiente', hoy)).toMatch(/hábil/); // sábado
    expect(validarReplanteoFinal(ac30, '2026-11-06', 'motivo suficiente', hoy)).toMatch(/posterior a hoy/);
    expect(validarReplanteoFinal(ac30, '2026-12-04', 'corto', hoy)).toMatch(/justificación/);
    expect(validarReplanteoFinal(ac30, '2026-12-04', 'motivo suficiente', hoy)).toBeNull();
    const lleno = aplicarReplanteoFinal(ac30, { nuevaFecha: '2026-12-04', motivo: 'motivo suficiente', por: 'H' });
    expect(validarReplanteoFinal(lleno, '2026-12-11', 'motivo suficiente', hoy)).toMatch(/2 replanteos/);
  });
  it('aplica sin mutar y deja la fecha nueva como fecha final', () => {
    const nuevo = aplicarReplanteoFinal(ac30, { nuevaFecha: '2026-12-04', motivo: 'motivo suficiente', por: 'H', ahora: 'x' });
    expect(ac30.fecha_limite).toBe('2026-10-30');
    expect(getFechaCompromiso(nuevo).getDate()).toBe(4);
    expect(nuevo.historial_replanteos_final[0]).toMatchObject({ numero: 2, fecha_anterior: '2026-10-30', fecha: '2026-12-04' });
    expect(getVencimiento(nuevo).nivel).not.toBe('vencido');
  });
});

describe('fecha de seguimiento fija', () => {
  const acts = (f) => JSON.stringify([{ fecha_termino_sugerida: '2026-11-20' }, { fecha_termino_sugerida: f }]);
  it('se fija al aprobar con la actividad más tardía + 2 semanas en día hábil', () => {
    expect(fechaSeguimientoInicial({ actividades_json: acts('2026-12-01') })).toBe('2026-12-15');
    expect(fechaSeguimientoInicial({ actividades_json: '[]' })).toBeNull();
  });
  it('no se mueve aunque el responsable cambie sus actividades', () => {
    const r = { estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2026-12-15', actividades_json: acts('2027-02-01') };
    expect(fechaISO(getFechaCompromiso(r))).toBe('2026-12-15');
  });
  it('el replanteo de fecha final la cambia', () => {
    const r = { estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2026-12-15', actividades_json: acts('2027-02-01') };
    const n = aplicarReplanteoFinal(r, { nuevaFecha: '2027-02-15', motivo: 'replantearon actividades', por: 'H' });
    expect(fechaISO(getFechaCompromiso(n))).toBe('2027-02-15');
    expect(n.historial_replanteos_final[0].fecha_anterior).toBe('2026-12-15');
  });
});

it('lee actividades de PM guardadas como texto', () => {
  expect(fechaSeguimientoInicial({ actividades: JSON.stringify([{ fecha_termino_sugerida: '2026-12-01' }]) })).toBe('2026-12-15');
});

it('el ajuste administrativo mueve la fecha sin contar como replanteo', () => {
  const r = { estado: 'EN_SEGUIMIENTO', fecha_seguimiento: '2026-10-30', replanteos_control6: '[]' };
  const n = ajustarFechaSeguimiento(r, { nuevaFecha: '2026-12-18', por: 'H' });
  expect(fechaISO(getFechaCompromiso(n))).toBe('2026-12-18');
  expect(replanteosFinales(n).usados).toBe(0);
  expect(n.historial_ajustes_fecha[0].fecha_anterior).toBe('2026-10-30');
  expect(r.fecha_seguimiento).toBe('2026-10-30');
});
