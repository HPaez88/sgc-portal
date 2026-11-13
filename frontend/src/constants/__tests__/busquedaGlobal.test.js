import { describe, it, expect } from 'vitest';
import { buscarGlobal } from '../busquedaGlobal';

const fuentes = {
  modulos: [{ id: 'ac', label: 'Acciones Correctivas' }, { id: 'riesgos', label: 'Matriz de Riesgos y Oportunidades' }],
  acciones: [{ id: 1, folio_codigo: 'AC#19/2026', area: 'Sistema de Gestión de Calidad', descripcion_no_conformidad_final: 'No es eficaz el control de mejoras' },
    { id: 2, folio_codigo: 'AC#3/2026', area: 'Plantas Potabilizadoras', descripcion_no_conformidad_final: 'Programa de mantenimiento' }],
  indicadores: [{ id: 26, nombre: 'Programa de mantenimiento', area: 'Plantas Potabilizadoras' }],
  usuarios: [{ nombre: 'Lic. Héctor Páez', email: 'hpaez@x.mx', area: 'SGC' }],
};

describe('buscador global', () => {
  it('encuentra por folio, sin acentos y por varias palabras, agrupado', () => {
    const r = buscarGlobal('ac#19', fuentes);
    expect(r[0].grupo).toBe('Acciones correctivas');
    expect(r[0].items[0].destino).toEqual({ tab: 'ac', abrir: { clave: 'sgc-abrir-ac', id: 1 } });
    expect(buscarGlobal('gestion calidad mejoras', fuentes)[0].items[0].titulo).toBe('AC#19/2026');
    expect(buscarGlobal('mantenimiento', fuentes).map((g) => g.grupo)).toEqual(['Acciones correctivas', 'Indicadores']);
    expect(buscarGlobal('riesgos', fuentes)[0].grupo).toBe('Módulos');
  });
  it('respeta el alcance del usuario y lo exclusivo de administradores', () => {
    const r = buscarGlobal('2026', { ...fuentes, puedeTodasAreas: false, areaUsuario: 'Plantas Potabilizadoras' });
    expect(r[0].items.map((i) => i.titulo)).toEqual(['AC#3/2026']);
    expect(buscarGlobal('paez', fuentes)).toEqual([]);
    expect(buscarGlobal('paez', { ...fuentes, esAdmin: true })[0].grupo).toBe('Usuarios');
    expect(buscarGlobal('a', fuentes)).toEqual([]);
  });
});
