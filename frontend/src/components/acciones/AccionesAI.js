import { getApiUrl } from '../../config';

export const generarPropuestaIA = async (form, equipo) => {
  const prompt = `Eres asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.

Genera una propuesta de Acción Correctiva conforme al formato oficial OOMRSC-20 Rev. 18.

El usuario capturó:
- Área: ${form.area}
- Proceso: ${form.proceso}
- Origen: ${form.origen}
- Número de auditoría: ${form.numero_auditoria || 'N/A'}
- Descripción de la no conformidad: ${form.descripcion_no_conformidad_original}
- ¿Impacta otros procesos?: ${form.impacta_otros_procesos}
- Otros procesos afectados: ${form.otros_procesos_afectados || 'N/A'}
- Equipo de trabajo: ${JSON.stringify(equipo.filter(e => e.nombre.trim()).map(e => ({nombre: e.nombre, puesto: e.puesto, area: e.area, rol: e.rol})))}

Instrucciones obligatorias:
1. NO asignes folio ni fecha de apertura
2. NO apruebes ni cierres la acción
3. Usa únicamente el equipo proporcionado para responsables
4. Si no existe persona adecuada, usa "Responsable por definir"
5. Genera UNA acción contenedora inmediata (temporal, ejecutable)
6. Genera hasta 4 causas mediante lluvia de ideas (enfoca en método, capacitación, supervisión, documentación, comunicación, recursos, seguimiento, control)
7. Sugiere puntuación para cada causa
8. La causa con mayor puntuación será la causa principal
9. Determina si requiere actualizar matriz de riesgos y oportunidades
10. Determina si requiere cambio en SGC
11. Genera hasta 5 actividades correctivas con: actividad, responsable, indicador, fecha y evidencia
12. Responde estrictamente en JSON válido, sin texto adicional antes o después.

JSON de salida esperado:
{
  "registro": {
    "descripcion_no_conformidad_mejorada": "",
    "impacta_otros_procesos": "SI/NO",
    "otros_procesos_afectados": ""
  },
  "analisis": {
    "accion_contenedora": "",
    "actividad_inmediata": {
      "actividad": "",
      "responsable": "",
      "fecha_sugerida": ""
    },
    "herramienta_analisis": "Lluvia de ideas",
    "causas": [
      { "numero": 1, "causa": "", "puntuacion_sugerida": 0, "porcentaje_sugerido": 0, "es_causa_principal": false }
    ],
    "requiere_actualizar_matriz_riesgos": "SI/NO",
    "descripcion_riesgo_oportunidad": ""
  },
  "actividades": {
    "causa_principal": "",
    "requiere_cambio_sgc": "SI/NO",
    "actividades_correctivas": [
      { "actividad": "", "responsable": "", "indicador_progreso": "", "fecha_termino_sugerida": "", "evidencia_esperada": "" }
    ]
  }
}`;

  const response = await fetch(getApiUrl('/api/v1/ai/generar-json'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      context: 'Eres asistente experto ISO 9001 del Sistema de Gestion de Calidad de OOMAPASC. Responde unicamente con JSON valido, sin markdown.'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error?.message || `Error de IA: ${response.status}`);
  }

  return data;
};
