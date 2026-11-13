// El servidor (avisos automáticos) usa una copia del catálogo de indicadores: debe coincidir con el de la interfaz.
// Si cambia el catálogo, regenera la copia con: npx vitest run src/constants/__tests__/catalogoServidor.test.js -- --regenerar
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INDICADORES } from '../indicadores';

const RUTA = path.resolve(__dirname, '../../../../backend/assets/indicadores_catalogo.json');
const copia = () => INDICADORES.map((i) => ({ id: i.id, numero: i.numero ?? i.id, nombre: i.nombre, area: i.area, direccion: i.direccion, periodicidad: i.periodicidad || 'Mensual', responsable_tipo: i.responsable_tipo || 'area' }));

describe('catálogo de indicadores del servidor', () => {
  it('coincide con el de la interfaz', () => {
    if (process.argv.includes('--regenerar') || !fs.existsSync(RUTA)) fs.writeFileSync(RUTA, JSON.stringify(copia(), null, 1));
    expect(JSON.parse(fs.readFileSync(RUTA, 'utf-8'))).toEqual(copia());
  });
});
