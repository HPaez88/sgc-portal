import { descargarBlob } from './services/apiClient';

export function exportToJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  descargarBlob(new Blob([json], { type: 'application/json' }), `${filename}.json`);
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  ].join('\n');

  descargarBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function exportACToFormat(ac) {
  const content = `
ACCIÓN CORRECTIVA - OOMAPASC DE CAJEME
=====================================
Código: ${ac.codigo}
Fecha: ${ac.fecha_deteccion}
Área: ${ac.area}
Proceso: ${ac.proceso}
Origen: ${ac.origen}

NO CONFORMIDAD:
${ac.descripcion_nc}

ANÁLISIS:
Causas Posibles: ${ac.posibles_causas}
Causa Raíz: ${ac.causa_raiz}

CLASIFICACIÓN:
Tipo: ${ac.clasificacion}
Acción: ${ac.tipo_accion}
Contención: ${ac.accion_contencion}
Evidencia: ${ac.evidencia_contencion}

ESTADO: ${ac.estado}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  descargarBlob(blob, `${ac.codigo}.txt`);
}

export function exportPMToFormat(pm) {
  const content = `
PLAN DE MEJORA - OOMAPASC DE CAJEME
=================================
Código: ${pm.codigo}
Fecha: ${pm.fecha_elaboracion}
Área: ${pm.area}
Proceso: ${pm.proceso}

SITUACIÓN ACTUAL:
${pm.situacion_actual}

SITUACIÓN DESEADA:
${pm.situacion_deseada}

BENEFICIOS:
${pm.beneficios}
Justificación: ${pm.just_beneficios}
Impacto: ${pm.impacto_esperado}
Presupuesto: ${pm.presupuesto}

EQUIPO: ${pm.equipo_trabajo}

ESTADO: ${pm.estado}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  descargarBlob(blob, `${pm.codigo}.txt`);
}
