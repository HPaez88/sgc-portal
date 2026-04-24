const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const API_KEY = import.meta.env?.VITE_GROQ_API_KEY || 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export const AGENT_PERSONALITY = `Eres un AGENTE EXPERTO ISO 9001 del Sistema de Gestión de Calidad de OOMAPASC de Cajeme.
Tu rol es asistir en la gestión de calidad, mejora continua y cumplimiento normativo.
Respondes siempre en español profesional.`;

export const AGENTS = {
  ACCION_CORRECTIVA: {
    name: 'Agente de Acciones Correctivas',
    system: `${AGENT_PERSONALITY}
Eres un auditor interno certificado especializado en:
- Análisis de causa raíz (6M, Ishikawa, 5 Porqués)
- No conformidades Mayor/Menor/Observación
- Acciones correctivas y preventivas
- Ciclo PHVA (Planificar, Hacer, Verificar, Actuar)
Generas respuestas estructuradas y accionables.`
  },
  PLAN_MEJORA: {
    name: 'Agente de Planes de Mejora',
    system: `${AGENT_PERSONALITY}
Eres un especialista en mejora continua especializado en:
- Análisis de brechas (Gap Analysis)
- Beneficios cuantificables
- Planificación de proyectos de mejora
- Indicadores de seguimiento
- Ciclo PHVA
Generas planes completos y prácticos.`
  },
  RIESGOS: {
    name: 'Agente de Gestión de Riesgos',
    system: `${AGENT_PERSONALITY}
Eres un experto en gestión de riesgos especializado en:
- Matriz de riesgos (probabilidad x impacto)
- Identificación de peligros
- Controles preventivos
- Oportunidades de mejora
Generas análisis de riesgos completos.`
  }
};

export async function callAgent(agentType, userPrompt, options = {}) {
  const agent = AGENTS[agentType];
  if (!agent) {
    throw new Error(`Agente desconocido: ${agentType}`);
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: agent.system },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No se recibió respuesta del agente');
    
  } catch (error) {
    console.error('Error en agente:', error);
    throw error;
  }
}

export function parseAgentResponse(response, expectedFields) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No se encontró JSON en la respuesta');
  } catch (error) {
    console.error('Error al parsear respuesta:', error);
    return null;
  }
}

export function generatePrompt(agentType, context) {
  switch (agentType) {
    case 'ACCION_CORRECTIVA':
      return `
Analiza la siguiente No Conformidad y genera un análisis completo:

ÁREA: ${context.area || 'Por asignar'}
PROCESO: ${context.proceso || 'Por asignar'}
ORIGEN: ${context.origen || 'No especificado'}

NO CONFORMIDAD:
${context.descripcion_nc}

Responde en JSON con:
{
  "posibles_causas": "Lista de posibles causas usando 6M",
  "causa_raiz": "Causa raíz identificada",
  "clasificacion": "Mayor|Menor|Observación",
  "tipo_accion": "Acción Correctiva|Acción Preventiva",
  "accion_contencion": "Acción inmediata de contención",
  "evidencia_contencion": "Evidencia de la contención",
  "actividades": [
    {
      "descripcion": "Descripción",
      "responsable": "Responsable",
      "fecha_limite": "YYYY-MM-DD",
      "tipo": "CORRECCION|PREVENTIVA|VERIFICACION|CIERRE",
      "evidencia": "Evidencia requerida"
    }
  ]
}`;

    case 'PLAN_MEJORA':
      return `
Genera un Plan de Mejora completo:

ÁREA: ${context.area || 'Por asignar'}
PROCESO: ${context.proceso || 'Por asignar'}

SITUACIÓN ACTUAL:
${context.situacion_actual}

SITUACIÓN DESEADA:
${context.situacion_deseada}

Responde en JSON con:
{
  "beneficios": "Beneficios cuantificables",
  "just_beneficios": "Justificación clara",
  "impacto_esperado": "Alto|Medio|Bajo",
  "recursos_necesarios": "Recursos requeridos",
  "presupuesto": 0,
  "equipo_trabajo": "Nombres del equipo",
  "actividades": [
    {
      "actividad": "Descripción",
      "indicador": "Indicador de éxito",
      "meta": "Meta cuantificable",
      "responsable": "Responsable",
      "fecha_inicio": "YYYY-MM-DD",
      "fecha_fin": "YYYY-MM-DD",
      "tipo": "PLANIFICACION|IMPLEMENTACION|VERIFICACION|CIERRE",
      "recursos": "Recursos específicos",
      "evidencia": "Evidencia",
      "resultado": "Resultado esperado"
    }
  ]
}`;

    case 'RIESGOS':
      return `
Analiza el siguiente riesgo/oportunidad:

ÁREA: ${context.area || 'Por asignar'}
PROCESO: ${context.proceso || 'Por asignar'}

RIESGO/OPORTUNIDAD: ${context.riesgo}
CAUSA: ${context.causa || 'Por identificar'}
EFECTO: ${context.efecto || 'Por determinar'}

PROBABILIDAD (1-5): ${context.probabilidad || 3}
IMPACTO (1-5): ${context.impacto || 3}

Responde en JSON con:
{
  "analisis": "Análisis del riesgo",
  "control_actual": "Controles actuales",
  "plan_accion": "Plan de acción recomendado",
  "fecha_termino": "YYYY-MM-DD",
  "recursos_necesarios": "Recursos requeridos",
  "indicador_seguimiento": "Indicador de seguimiento",
  "evaluacion_esperada": "Bueno|Regular|Malo"
}`;

    default:
      return userPrompt;
  }
}
