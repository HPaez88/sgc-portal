import { getApiUrl } from '../../config';

export const generarPlanMejoraIA = async (descripcion) => {
  const prompt = `Eres asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.

Genera una propuesta de Plan de Mejora basada en la siguiente situación actual descrita por el usuario:
"${descripcion}"

Instrucciones obligatorias:
1. Genera un título de mejora descriptivo y corto
2. Sugiere la categoría de mejora más adecuada
3. Determina los beneficios esperados
4. Define la situación deseada a alcanzar
5. Propón un equipo de trabajo (integrantes con sus roles recomendados)
6. Genera un plan de actividades detallado para lograr la mejora
7. Responde estrictamente en JSON válido, sin texto adicional antes o después.

JSON de salida esperado:
{
  "titulo_mejora": "",
  "categoria_mejora": "",
  "beneficios": "",
  "situacion_deseada": "",
  "integrantes": [
    { "nombre": "Por definir", "puesto": "", "rol": "" }
  ],
  "actividades": [
    { "actividad": "", "indicador": "", "responsable": "Por definir", "fecha_termino_sugerida": "", "evidencia_esperada": "" }
  ]
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
