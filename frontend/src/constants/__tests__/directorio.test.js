import { describe, it, expect } from 'vitest';
import { construirDirectorio, buscarContactos, esCorreoValido } from '../directorio';

const dir = construirDirectorio({
  usuarios: [
    { nombre: 'Lic. Héctor Páez', email: 'HPAEZ@oomapasc.gob.mx', area: 'Sistema de Gestión de Calidad', rol: 'Super Admin' },
    { nombre: 'Baja', email: 'baja@oomapasc.gob.mx', activo: false },
  ],
  areasDetalle: [{ nombre: 'Plantas Potabilizadoras', encargado: 'Ing. Carlos Mendoza', correo: 'cmendoza@oomapasc.gob.mx', encargados_sgc: ['hpaez@oomapasc.gob.mx'] }],
  direccionesDetalle: [{ nombre: 'Dir. Técnica', director: 'Ing. Manuel Campas', correo: 'mcampas@oomapasc.gob.mx' }],
});

describe('directorio de contactos', () => {
  it('une por correo, ignora inactivos y junta los cargos', () => {
    expect(dir.map((c) => c.email)).toEqual(['cmendoza@oomapasc.gob.mx', 'hpaez@oomapasc.gob.mx', 'mcampas@oomapasc.gob.mx']); // por nombre, sin título
    expect(dir.find((c) => c.email === 'hpaez@oomapasc.gob.mx').detalles).toContain('Encargado SGC de Plantas Potabilizadoras');
  });
  it('busca sin acentos por varias palabras y excluye los ya elegidos', () => {
    expect(buscarContactos(dir, 'plantas titular').map((c) => c.email)).toEqual(['cmendoza@oomapasc.gob.mx']);
    expect(buscarContactos(dir, 'tecnica').map((c) => c.email)).toEqual(['mcampas@oomapasc.gob.mx']);
    expect(buscarContactos(dir, 'paez', ['hpaez@oomapasc.gob.mx'])).toEqual([]);
  });
  it('valida correos', () => {
    expect(esCorreoValido('a@b.mx')).toBe(true);
    expect(esCorreoValido('a')).toBe(false);
  });
});
