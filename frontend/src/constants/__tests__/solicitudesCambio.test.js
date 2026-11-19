import { describe, it, expect } from 'vitest';
import { nuevaSolicitud, aprobarSolicitud, rechazarSolicitud, solicitudesPendientes } from '../solicitudesCambio';
import { leerActividades } from '../workflow';

const acts = [
  { id: 1, actividad: 'A', responsable: 'R', fecha_termino_sugerida: '2026-12-01', evidencia_esperada: 'minuta', evidencia_real: 'f.pdf' },
  { id: 2, actividad: 'B', responsable: 'R', fecha_termino_sugerida: '2026-12-05', evidencia_esperada: 'foto', evidencia_real: '' },
];
const ac = { id: 10, estado: 'EN_SEGUIMIENTO', actividades_json: JSON.stringify(acts) };
const pm = { id: 20, estado: 'EN_SEGUIMIENTO', actividades: JSON.stringify(acts) };
const por = { nombre: 'Área', email: 'a@x.mx' };
const ahora = '2026-11-19T10:00:00.000Z';

describe('solicitudes de cambio de AC/PM vigentes', () => {
  it('el área agrega una solicitud pendiente sin tocar las actividades', () => {
    const { registro, error } = nuevaSolicitud(ac, { tipo: 'AGREGAR', propuesta: { actividad: 'C', responsable: 'R', fecha_termino_sugerida: '2026-12-10', evidencia_esperada: 'acta' }, justificacion: 'Falta capacitar al personal' }, por, ahora);
    expect(error).toBeNull();
    expect(registro.actividades_json).toBe(ac.actividades_json);
    expect(solicitudesPendientes(registro)).toHaveLength(1);
    expect(solicitudesPendientes(registro)[0]).toMatchObject({ tipo: 'AGREGAR', estado: 'PENDIENTE', solicitante: 'Área' });
  });

  it('exige justificación y una propuesta completa', () => {
    expect(nuevaSolicitud(ac, { tipo: 'AGREGAR', propuesta: { actividad: 'C' }, justificacion: 'Falta capacitar' }, por, ahora).error).toMatch(/responsable/);
    expect(nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'corta' }, por, ahora).error).toMatch(/justificación/);
  });

  it('no permite pedir quitar una actividad con evidencia', () => {
    expect(nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 0, justificacion: 'Ya no aplica al proceso' }, por, ahora).error).toMatch(/evidencia/);
  });

  it('el SGC aprueba: se aplica a las actividades (AC en actividades_json, PM en actividades)', () => {
    const agregar = nuevaSolicitud(pm, { tipo: 'AGREGAR', propuesta: { actividad: 'C', responsable: 'R', fecha_termino_sugerida: '2026-12-10', evidencia_esperada: 'acta', indicador: '100%' }, justificacion: 'Falta capacitar al personal' }, por, ahora).registro;
    const id = solicitudesPendientes(agregar)[0].id;
    const r = aprobarSolicitud(agregar, id, 'SGC', ahora);
    expect(r.error).toBeNull();
    expect(leerActividades(r.registro).map((a) => a.actividad)).toEqual(['A', 'B', 'C']);
    expect(r.registro.solicitudes_cambio[0]).toMatchObject({ estado: 'APROBADA', resuelto_por: 'SGC' });

    const modificar = nuevaSolicitud(ac, { tipo: 'MODIFICAR', indice: 1, propuesta: { ...acts[1], responsable: 'Otro' }, justificacion: 'Cambió el responsable del área' }, por, ahora).registro;
    const m = aprobarSolicitud(modificar, solicitudesPendientes(modificar)[0].id, 'SGC', ahora).registro;
    expect(leerActividades(m)[1].responsable).toBe('Otro');
    expect(leerActividades(m)[1].evidencia_real).toBe('');

    const quitar = nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'Ya no aplica al proceso' }, por, ahora).registro;
    const q = aprobarSolicitud(quitar, solicitudesPendientes(quitar)[0].id, 'SGC', ahora).registro;
    expect(leerActividades(q).map((a) => a.actividad)).toEqual(['A']);
  });

  it('si la actividad cambió desde que se pidió, no se aplica a ciegas', () => {
    const sol = nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'Ya no aplica al proceso' }, por, ahora).registro;
    const movida = { ...sol, actividades_json: JSON.stringify([acts[0], { ...acts[1], actividad: 'B cambiada' }]) };
    expect(aprobarSolicitud(movida, solicitudesPendientes(sol)[0].id, 'SGC', ahora).error).toMatch(/cambió/);
  });

  it('el SGC rechaza con motivo y las actividades no cambian', () => {
    const sol = nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'Ya no aplica al proceso' }, por, ahora).registro;
    const r = rechazarSolicitud(sol, solicitudesPendientes(sol)[0].id, 'SGC', 'Sigue aplicando', ahora);
    expect(r.actividades_json).toBe(ac.actividades_json);
    expect(r.solicitudes_cambio[0]).toMatchObject({ estado: 'RECHAZADA', motivo_rechazo: 'Sigue aplicando' });
    expect(solicitudesPendientes(r)).toHaveLength(0);
  });
});

describe('avisos de solicitudes en listas y bandeja', () => {
  it('etiqueta pendiente, y la resolución solo durante 15 días', async () => {
    const { avisoCambio } = await import('../solicitudesCambio');
    const sol = nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'Ya no aplica al proceso' }, por, ahora).registro;
    expect(avisoCambio(ac)).toBeNull();
    expect(avisoCambio(sol).texto).toBe('Cambio pendiente');
    const rech = rechazarSolicitud(sol, solicitudesPendientes(sol)[0].id, 'SGC', 'No procede', ahora);
    expect(avisoCambio(rech, Date.parse(ahora) + 86400000).texto).toBe('Cambio rechazado');
    expect(avisoCambio(rech, Date.parse(ahora) + 16 * 86400000)).toBeNull();
  });

  it('la bandeja del SGC incluye estados de revisión, prórrogas y cambios pendientes', async () => {
    const { requiereAtencionSGC } = await import('../solicitudesCambio');
    expect(requiereAtencionSGC(ac)).toBe(false);
    expect(requiereAtencionSGC({ ...ac, estado: 'EN_REVISION' })).toBe(true);
    expect(requiereAtencionSGC({ ...ac, actividades_json: JSON.stringify([{ ...acts[1], solicitud_replanteo: { estado: 'PENDIENTE' } }]) })).toBe(true);
    expect(requiereAtencionSGC(nuevaSolicitud(ac, { tipo: 'QUITAR', indice: 1, justificacion: 'Ya no aplica al proceso' }, por, ahora).registro)).toBe(true);
  });
});
