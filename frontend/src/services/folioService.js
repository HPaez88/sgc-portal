// Asigna el siguiente folio oficial y guarda el contador en el servidor (vía estadoService).
// ponytail: dos aprobaciones en el mismo segundo desde equipos distintos podrían tomar el mismo número;
// si llega a pasar, mover la asignación a un endpoint del backend con bloqueo de fila.
import { CLAVE_CONTADOR_FOLIOS, siguienteFolio } from '../constants/folio';
import { escribirEstado, leerEstado } from './estadoService';

export function asignarFolio(tipo, registros) {
  const folio = siguienteFolio(tipo, registros, leerEstado(CLAVE_CONTADOR_FOLIOS, {}) || {});
  escribirEstado(CLAVE_CONTADOR_FOLIOS, folio.contador);
  return folio;
}
