export function exportToJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(',')
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ac.codigo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pm.codigo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}