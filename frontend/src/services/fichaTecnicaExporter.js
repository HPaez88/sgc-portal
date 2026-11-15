// Resultados mensuales de un indicador con su semáforo (para la vista de la ficha en el portal).
// Los formatos oficiales del Ayuntamiento NO se generan aquí: salen de la plantilla original
// (backend/services/formatos_indicadores.py) vía services/formatosOficiales.js.
import { evalSemaforoOOMRSC05 } from '../constants/indicadores';

export const MESES_CLAVE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MESES_CABECERA = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/**
 * Mapea los resultados del SGC para un indicador y ejercicio fiscal,
 * calculando en tiempo real su porcentaje y color de semáforo oficial (Verde / Amarillo / Rojo).
 */
export function mapearResultadosMensualesIndicador(indicadorId, ejercicio = 2026, valoresMensuales = {}, meta = 100, esMenor = false) {
  const numMeta = parseFloat(String(meta).replace(/[^0-9.]/g, '')) || 100;

  return MESES_CLAVE.map((m, idx) => {
    const claveFull = `${indicadorId}-${m}-${ejercicio}`;
    const claveNum = `${Number(indicadorId)}-${m}-${ejercicio}`;

    let rawItem = valoresMensuales?.[claveFull] ?? valoresMensuales?.[claveNum];
    let valor = rawItem?.valor !== undefined ? rawItem.valor : null;

    if (valor === null || valor === undefined) {
      const vPlano = valoresMensuales?.[m] ?? valoresMensuales?.[m.toLowerCase()] ?? valoresMensuales?.[m.toUpperCase()];
      if (vPlano !== undefined && vPlano !== null && vPlano !== 'NA' && vPlano !== '') {
        valor = typeof vPlano === 'object' ? vPlano?.valor : vPlano;
      }
    }

    if (valor !== null && valor !== undefined && valor !== '' && valor !== 'NA' && !isNaN(Number(valor))) {
      const numVal = Number(valor);
      const sem = evalSemaforoOOMRSC05(numVal, numMeta, esMenor);
      const esCritico = sem.rango === 'CRITICO' || sem.cumple === 'NO';
      const esPreventivo = sem.rango === 'PREVENTIVO';
      return {
        mes: MESES_CABECERA[idx],
        clave: m,
        valor: numVal,
        texto: `${numVal}%`,
        porcentaje: sem.porcentaje ?? numVal,
        rango: sem.rango,
        colorHex: esCritico ? '#EF4444' : esPreventivo ? '#EAB308' : '#22C55E',
        colorRgb: esCritico ? [239, 68, 68] : esPreventivo ? [234, 179, 8] : [34, 197, 94],
        textColorRgb: [255, 255, 255],
        cumple: sem.cumple
      };
    }

    return {
      mes: MESES_CABECERA[idx],
      clave: m,
      valor: null,
      texto: '',
      porcentaje: null,
      rango: 'SIN_CAPTURA',
      colorHex: '#FFFFFF',
      colorRgb: [255, 255, 255],
      textColorRgb: [148, 163, 184],
      cumple: 'PENDIENTE'
    };
  });
}
