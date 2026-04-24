"""
services/ai_service.py — Integración IA con Groq
Genera documentos SGC completos en JSON estructurado.
"""
import os
import json
import re
from openai import OpenAI
from fastapi import HTTPException

from backend.models import (
    AREAS, PROCESOS, ORIGENES_AC, ORIGENES_PM,
    CATEGORIAS_MEJORA, PERIODOS,
)

YEAR = __import__('datetime').datetime.utcnow().year


def get_ai_client() -> OpenAI:
    """Retorna cliente de Groq."""
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY no configurada. Configúrala en el panel de Render.",
        )
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_key,
    )


def get_model() -> str:
    """Modelo de Groq disponibles."""
    return "llama-3.1-8b-instant"


def _extraer_json(raw: str) -> dict:
    """Extrae el primer bloque JSON de la respuesta del modelo."""
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError(f"La IA no devolvió un JSON válido. Respuesta: {raw[:300]}")
    return json.loads(match.group(0))


def _call_ai(prompt: str, context: str) -> str:
    """Hace una llamada a Groq y devuelve el texto."""
    client = get_ai_client()
    model = get_model()
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Error con IA (Groq): {str(exc)}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# GENERADORES: Acción Correctiva
# ─────────────────────────────────────────────────────────────────────────────

AC_CONTEXT = f"""Eres un experto en sistemas de gestión de calidad ISO 9001 especializado en análisis de causa raíz.

Tu tarea es generar una ACCIÓN CORRECTIVA completa y profesional.

año actual: {YEAR}

PROCESO DE ANÁLISIS (sigue estos pasos):
1. Analiza la descripción de la No Conformidad
2. Identifica la evidencia mencionada
3. Generate MINIMO 4 posibles causas usando la técnica 6M (Método, Maquina, Material, Mano de obra, Medio ambiente, Medición)
4. Selecciona la causa raíz más probable
5. Genera acciones inmediatas de contención
6. Genera plan de actividades de corrección

RESPONDE ÚNICAMENTE CON JSON válido, sin texto adicional, sin markdown.
Todos los campos deben estar llenos con contenido realista y específico."""


def generar_ac_completo(descripcion: str) -> dict:
    """Genera una Acción Correctiva completa con IA."""
    from datetime import datetime, timedelta
    
    # Calcular fecha límite (30 días después)
    fecha_limite = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    prompt = f"""Genera una ACCIÓN CORRECTIVA completa y detallada para esta No Conformidad:

No Conformidad: {descripcion}

Sigue este formato EXACTO de JSON (todos los campos obligatorios):

{{
  "proceso": "Uno de: {PROCESOS}",
  "area": "Una de: {AREAS[0:15]}",
  "origen": "Uno de: {ORIGENES_AC}",
  "direccion": "Una de: TECNICA, COMERCIAL, ADMINISTRATIVA",
  "descripcion_no_conformidad": "Descripción clara del problema encontrado (minimo 50 caracteres)",
  "evidencia": "Hechos objetivos que fundamentan la NC (minimo 30 caracteres)",
  "impacta_otros_procesos": false,
  "procesos_afectados": "",
  
  "equipo_trabajo": "[{{\\"nombre\\":\\"Responsable de área\\",\\"rol\\":\\"Analista\\"}}]",
  "accion_contenedora": "Acción inmediata tomada para contener el problema (minimo 30 caracteres)",
  "actividades_contenedoras": "[{{\\"descripcion\\":\\"Acción de contención\\",\\"responsable\\":\\"Nombre\\",\\"fecha_termino\\":\\"{fecha_limite}\\"}}]",
  "causas": "[{{\\"causa\\":\\"Posible causa 1 (Método)\\",\\"categoria\\":\\"Método\\",\\"puntuacion\\":3}},{{\\"causa\\":\\"Posible causa 2 (Maquinaria)\\",\\"categoria\\":\\"Máquina\\",\\"puntuacion\\":2}},{{\\"causa\\":\\"Posible causa 3 (Material)\\",\\"categoria\\":\\"Material\\",\\"puntuacion\\":1}}]",
  "causa_raiz_seleccionada": "Causa raíz mas probable justificada (minimo 30 caracteres)",
  "actualiza_matriz_riesgos": false,
  "descripcion_riesgo": "",
  "requiere_cambio_sgc": "NO",
  
  "actividades": "[{{\\"descripcion\\":\\"Actividad 1 de corrección\\",\\"tipo\\":\\"Corrección\\",\\"responsable\\":\\"Responsable\\",\\"fecha_termino\\":\\"{fecha_limite}\\",\\"evidencia\\":\\"Evidencia requeridas\\",\\"estado\\":\\"Pendiente\\"}},{{\\"descripcion\\":\\"Actividad 2 de verificación\\",\\"tipo\\":\\"Verificación\\",\\"responsable\\":\\"Auditor\\",\\"fecha_termino\\":\\"{fecha_limite}\\",\\"evidencia\\":\\"Evidencia de verificación\\",\\"estado\\":\\"Pendiente\\"}}]",
  
  "estado": "BORRADOR"
}}

IMPORTANTE: 
- Responde SOLO con JSON válido
- No omitas ningún campo
- Usa comillas dobles para strings
- Los arrays deben tener estructura JSON válida
- Las fechas deben ser en formato YYYY-MM-DD"""
    
    raw = _call_ai(prompt, AC_CONTEXT)
    return _extraer_json(raw)


def sugerir_con_ia(descripcion: str, tipo: str) -> str:
    """Sugiere causa raíz o situación deseada."""
    if tipo == "AC":
        prompt = f"Analiza y sugiere la causa raíz más probable:\n{descripcion}"
        context = "Eres experto ISO 9001. Da una causa raíz técnica."
    else:
        prompt = f"Describe la situación deseada:\n{descripcion}"
        context = "Sé específico y medible."
    
    return _call_ai(prompt, context)


# ─────────────────────────────────────────────────────────────────────────────
# GENERADORES: Plan de Mejora
# ─────────────────────────────────────────────────────────────────────────────

PM_CONTEXT = f"""Eres un experto en sistemas de gestión de calidad ISO 9001 especializado en mejora continua.

Tu tarea es generar un PLAN DE MEJORA completo y profesional.

año actual: {YEAR}

PROCESO DE MEJORA (sigue estos pasos):
1. Analiza la situación actual
2. Define la situación deseada (objetivo medible)
3. Identifica los beneficios esperados
4. Genera actividades específicas con indicadores
5. Asigna responsables y fechas

RESPONDE ÚNICAMENTE CON JSON válido, sin texto adicional, sin markdown.
Todos los campos deben estar llenos con contenido realista y específico."""


def generar_pm_completo(descripcion: str) -> dict:
    """Genera un Plan de Mejora completo con IA."""
    from datetime import datetime, timedelta
    
    # Calcular fecha límite (60 días después para planes de mejora)
    fecha_limite = (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d")
    
    prompt = f"""Genera un PLAN DE MEJORA completo y detallado:

Situación actual a mejorar: {descripcion}

Sigue este formato EXACTO de JSON (todos los campos obligatorios):

{{
  "titulo_mejora": "Título corto y descriptivo de la mejora (minimo 10 caracteres)",
  "gerencia_coordinacion": "Una de: {AREAS[0:15]}",
  "categoria_mejora": "Una de: {CATEGORIAS_MEJORA}",
  "periodo_mejora": "Uno de: 1er. Cuatri, 2do. Cuatri, 3er. Cuatri",
  "origen": "Uno de: {ORIGENES_PM}",
  "direccion": "Una de: TECNICA, COMERCIAL, ADMINISTRATIVA",
  
  "descripcion_situacion_actual": "Descripción clara de la situación actual que requiere mejora (minimo 50 caracteres)",
  "situacion_deseada": "Estado deseado y medible después de implementar la mejora (minimo 30 caracteres)",
  "beneficios": "Beneficios esperados de la mejora (minimo 30 caracteres)",
  
  "responsable": "Nombre del responsable principal",
  "integrantes": "[{{\\"nombre\\":\\"Integrante 1\\",\\"rol\\":\\"Apoyo\\"}},{{\\"nombre\\":\\"Integrante 2\\",\\"rol\\":\\"Coordinador\\"}}]",
  
  "actividades": "[{{\\"descripcion\\":\\"Actividad 1 de implementación\\",\\"tipo\\":\\"Implementación\\",\\"indicador\\":\\"Indicador medible\\",\\"responsable\\":\\"Responsable\\",\\"fecha_termino\\":\\"{fecha_limite}\\",\\"evidencia\\":\\"Evidencia requerida\\",\\"estado\\":\\"Pendiente\\"}},{{\\"descripcion\\":\\"Actividad 2 de seguimiento\\",\\"tipo\\":\\"Seguimiento\\",\\"indicador\\":\\"Indicador de seguimiento\\",\\"responsable\\":\\"Responsable\\",\\"fecha_termino\\":\\"{fecha_limite}\\",\\"evidencia\\":\\"Evidencia de seguimiento\\",\\"estado\\":\\"Pendiente\\"}},{{\\"descripcion\\":\\"Actividad 3 de verificación de eficacia\\",\\"tipo\\":\\"Verificación\\",\\"indicador\\":\\"Indicador de eficacia alcanzado\\",\\"responsable\\":\\"Auditor\\",\\"fecha_termino\\":\\"{fecha_limite}\\",\\"evidencia\\":\\"Evidencia de verificación\\",\\"estado\\":\\"Pendiente\\"}}]",
  
  "estado": "BORRADOR"
}}

IMPORTANTE: 
- Responde SOLO con JSON válido
- No omitas ningún campo
- Usa comillas dobles para strings
- Los arrays deben tener estructura JSON válida
- Las fechas deben ser en formato YYYY-MM-DD"""
    
    raw = _call_ai(prompt, PM_CONTEXT)
    return _extraer_json(raw)