"""
services/ai_service.py — Integración IA con Groq (producción) u Ollama (desarrollo)
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

# ── Año actual para contexto ──
from datetime import datetime
YEAR = datetime.utcnow().year


def get_ai_client() -> OpenAI:
    """Retorna cliente de IA según la configuración."""
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
        )
    return OpenAI(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        api_key="ollama",
    )


def get_model() -> str:
    """Retorna el modelo según el proveedor."""
    if os.getenv("GROQ_API_KEY"):
        return "llama-3.1-70b-versatile"
    return os.getenv("OLLAMA_MODEL", "qwen3:8b")


def _extraer_json(raw: str) -> dict:
    """
    Extrae el primer bloque JSON de la respuesta del modelo.
    Maneja los <think>...</think> tags de qwen3 y texto libre antes/después del JSON.
    """
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError(f"La IA no devolvió un JSON válido. Respuesta: {raw[:300]}")
    return json.loads(match.group(0))


def _call_ai(prompt: str, context: str) -> str:
    """Hace una llamada a la IA (Groq u Ollama) y devuelve el texto."""
    client = get_ai_client()
    model = get_model()
    
    # Verificar si hay IA disponible
    if not os.getenv("GROQ_API_KEY") and not os.getenv("OLLAMA_BASE_URL"):
        raise HTTPException(
            status_code=503,
            detail="IA no configurada. Agrega GROQ_API_KEY o configura Ollama.",
        )
    
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
            detail=f"Error con IA ({model}): {str(exc)}",
        )


# ──────────────────────────────────────────────────────────────
# GENERACIÓN COMPLETA DE ACCIÓN CORRECTIVA
# ──────────────────────────────────────────────────────────────
def generar_ac_completo(descripcion_nc: str) -> dict:
    """
    Dado el texto de una No Conformidad, genera un documento
    de Acción Correctiva completo en JSON estructurado.
    """
    context = f"""Eres un Responsable del Sistema de Gestión de Calidad (SGC) de OOMAPASC de Cajeme, 
organismo operador de agua potable, alcantarillado y saneamiento certificado bajo ISO 9001.
Tu tarea es generar documentos técnicos oficiales de Acción Correctiva en formato JSON.
Responde SOLO con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.

CATÁLOGOS OFICIALES (usa exactamente estos valores):
- ÁREAS: {json.dumps(AREAS, ensure_ascii=False)}
- PROCESOS: {json.dumps(PROCESOS, ensure_ascii=False)}
- ORÍGENES: {json.dumps(ORIGENES_AC, ensure_ascii=False)}

AÑO ACTUAL: {YEAR}
"""

    prompt = f"""No Conformidad detectada: "{descripcion_nc}"

Genera el documento de Acción Correctiva completo. Sé específico y técnico.
Las actividades deben ser concretas, con responsables del área, fechas realistas ({YEAR}).
Devuelve exactamente este JSON (sin texto extra):

{{
  "proceso": "<selecciona el más relevante de la lista de PROCESOS>",
  "area": "<selecciona el área más relevante de la lista de ÁREAS>",
  "origen": "<selecciona el origen más relevante de la lista de ORÍGENES>",
  "num_auditoria": "<número de auditoría o null>",
  "impacta_otros_procesos": false,
  "procesos_afectados": null,
  "accion_contenedora": "<acción inmediata tomada para contener el problema, 1-2 oraciones>",
  "causas": [
    {{"causa": "<causa posible 1>", "total": 3}},
    {{"causa": "<causa posible 2>", "total": 5}},
    {{"causa": "<causa posible 3>", "total": 2}}
  ],
  "causa_raiz_seleccionada": "<causa raíz definitiva según análisis, párrafo técnico conciso>",
  "actualiza_matriz_riesgos": false,
  "descripcion_riesgo": null,
  "equipo_trabajo": [
    {{"nombre": "<Nombre Apellido>", "puesto": "<puesto relevante al área>"}},
    {{"nombre": "<Nombre Apellido>", "puesto": "<puesto relevante al área>"}}
  ],
  "actividades": [
    {{
      "actividad": "<descripción concreta de la actividad 1>",
      "responsable": "<nombre o cargo>",
      "fecha_termino": "{YEAR}-05-15",
      "evidencia": "<tipo de evidencia: acta, registro, informe, etc.>"
    }},
    {{
      "actividad": "<descripción concreta de la actividad 2>",
      "responsable": "<nombre o cargo>",
      "fecha_termino": "{YEAR}-06-01",
      "evidencia": "<tipo de evidencia>"
    }},
    {{
      "actividad": "<descripción concreta de la actividad 3>",
      "responsable": "<nombre o cargo>",
      "fecha_termino": "{YEAR}-06-30",
      "evidencia": "<tipo de evidencia>"
    }}
  ]
}}"""

    raw = _call_ai(prompt, context)
    data = _extraer_json(raw)

    # Validar y normalizar campos obligatorios
    data["proceso"] = _validar_catalogo(data.get("proceso", ""), PROCESOS, "Medición Análisis y Mejora")
    data["area"] = _validar_catalogo(data.get("area", ""), AREAS, "Sistema de Gestión de Calidad")
    data["origen"] = _validar_catalogo(data.get("origen", ""), ORIGENES_AC, "Proceso")
    data["equipo_trabajo"] = json.dumps(data.get("equipo_trabajo", []), ensure_ascii=False)
    data["causas"] = json.dumps(data.get("causas", []), ensure_ascii=False)
    data["actividades"] = json.dumps(data.get("actividades", []), ensure_ascii=False)

    return data


# ──────────────────────────────────────────────────────────────
# GENERACIÓN COMPLETA DE PLAN DE MEJORA
# ──────────────────────────────────────────────────────────────
def generar_pm_completo(descripcion_situacion: str) -> dict:
    """
    Dado el texto de la situación actual, genera un Plan de Mejora
    completo en JSON estructurado.
    """
    context = f"""Eres un Responsable del Sistema de Gestión de Calidad (SGC) de OOMAPASC de Cajeme,
organismo operador de agua potable, alcantarillado y saneamiento certificado bajo ISO 9001.
Tu tarea es generar documentos técnicos oficiales de Plan de Mejora en formato JSON.
Responde SOLO con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.

CATÁLOGOS OFICIALES (usa exactamente estos valores):
- ÁREAS / GERENCIAS: {json.dumps(AREAS, ensure_ascii=False)}
- CATEGORÍAS DE MEJORA: {json.dumps(CATEGORIAS_MEJORA, ensure_ascii=False)}
- PERÍODOS: {json.dumps(PERIODOS, ensure_ascii=False)}
- ORÍGENES: {json.dumps(ORIGENES_PM, ensure_ascii=False)}

AÑO ACTUAL: {YEAR}
"""

    prompt = f"""Situación actual a mejorar: "{descripcion_situacion}"

Genera el Plan de Mejora completo. Las actividades deben ser concretas y realizables.
Devuelve exactamente este JSON (sin texto extra):

{{
  "titulo_mejora": "<título descriptivo y profesional del plan>",
  "gerencia_coordinacion": "<selecciona el área/gerencia más relevante de la lista de ÁREAS>",
  "categoria_mejora": "<selecciona la categoría más relevante>",
  "periodo_mejora": "<selecciona un período de la lista>",
  "origen": "<selecciona de la lista de ORÍGENES>",
  "descripcion_situacion_actual": "<descripción técnica ampliada de la situación actual, 2-3 oraciones>",
  "situacion_deseada": "<estado ideal al que se desea llegar, 2-3 oraciones técnicas>",
  "beneficios": "<beneficios cuantificables y cualitativos esperados, 2-3 oraciones>",
  "responsable": "<Nombre Apellido, cargo>",
  "integrantes": "<Nombre1, Nombre2, Nombre3>",
  "actividades": [
    {{
      "actividad": "<descripción concreta de la actividad 1>",
      "responsable": "<nombre o cargo>",
      "indicador": "<indicador de progreso medible, ej: 80% completado>",
      "fecha_termino": "{YEAR}-04-30",
      "evidencia": "<documento o registro de evidencia>"
    }},
    {{
      "actividad": "<descripción concreta de la actividad 2>",
      "responsable": "<nombre o cargo>",
      "indicador": "<indicador de progreso medible>",
      "fecha_termino": "{YEAR}-05-31",
      "evidencia": "<documento o registro de evidencia>"
    }},
    {{
      "actividad": "<descripción concreta de la actividad 3>",
      "responsable": "<nombre o cargo>",
      "indicador": "<indicador de progreso medible>",
      "fecha_termino": "{YEAR}-06-30",
      "evidencia": "<documento o registro de evidencia>"
    }},
    {{
      "actividad": "<descripción concreta de la actividad 4>",
      "responsable": "<nombre o cargo>",
      "indicador": "<indicador de progreso medible>",
      "fecha_termino": "{YEAR}-07-31",
      "evidencia": "<documento o registro de evidencia>"
    }}
  ]
}}"""

    raw = _call_ai(prompt, context)
    data = _extraer_json(raw)

    # Validar y normalizar campos obligatorios
    data["gerencia_coordinacion"] = _validar_catalogo(data.get("gerencia_coordinacion", ""), AREAS, "Sistema de Gestión de Calidad")
    data["categoria_mejora"] = _validar_catalogo(data.get("categoria_mejora", ""), CATEGORIAS_MEJORA, CATEGORIAS_MEJORA[0])
    data["periodo_mejora"] = _validar_catalogo(data.get("periodo_mejora", ""), PERIODOS, PERIODOS[0])
    data["origen"] = _validar_catalogo(data.get("origen", ""), ORIGENES_PM, ORIGENES_PM[0])
    data["actividades"] = json.dumps(data.get("actividades", []), ensure_ascii=False)

    return data


# ──────────────────────────────────────────────────────────────
# SUGERENCIA PUNTUAL (compatibilidad con endpoint anterior)
# ──────────────────────────────────────────────────────────────
def sugerir_con_ia(descripcion: str, tipo: str) -> str:
    """Genera una sugerencia puntual de texto. Mantiene compatibilidad."""
    if tipo == "AC":
        context = (
            "Eres un gerente de calidad de OOMAPASC. "
            "Genera un análisis de causa raíz técnico (máx 4 oraciones), ISO 9001, sin saludos."
        )
        prompt = f"No Conformidad: '{descripcion}'\n\nAnálisis de causa raíz:"
    else:
        context = (
            "Eres un gerente de calidad de OOMAPASC. "
            "Genera la situación deseada para un Plan de Mejora (máx 4 oraciones), técnico, sin saludos."
        )
        prompt = f"Situación actual: '{descripcion}'\n\nSituación deseada:"

    raw = _call_ai(prompt, context)
    # Limpiar thinking tags
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    return raw


# ──────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────
def _validar_catalogo(valor: str, catalogo: list, default: str) -> str:
    """Valida que el valor pertenece al catálogo. Si no, devuelve el default."""
    if not valor:
        return default
    # Búsqueda exacta primero
    if valor in catalogo:
        return valor
    # Búsqueda por similitud (case-insensitive parcial)
    valor_lower = valor.lower()
    for item in catalogo:
        if valor_lower in item.lower() or item.lower() in valor_lower:
            return item
    return default
