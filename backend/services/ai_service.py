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
    """Modelo de Groq (actualizado abril 2026)."""
    return "llama-3.2-3b-versatile"


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

AC_CONTEXT = f"""Eres un experto en sistemas de gestión de calidad ISO 9001.
Generas documentos de Acción Correctiva completos en JSON.
Año actual: {YEAR}

Campos requeridos:
- area: una de {AREAS[:10]}
- proceso: uno de {PROCESOS}
- direccion: una de ['TÉCNICA', 'COMERCIAL', 'ADMINISTRATIVA']
- origen: uno de {ORIGENES_AC}
- descripcion_no_conformidad: descripción clara del problema
- evidencia: hechos objetivos
- causa_raiz: análisis de causa raíz (técnica de las 6M)
- acciones: array de {{descripcion, responsable, fecha_termino}}
- estado: 'BORRADOR'

Responde SOLO con JSON válido, sin markdown."""


def generar_ac_completo(descripcion: str) -> dict:
    """Genera una Acción Correctiva completa con IA."""
    prompt = f"""Genera una Acción Correctiva completa.

No Conformidad: {descripcion}

Responde con JSON:
{{
  "area": "",
  "proceso": "",
  "direccion": "",
  "origen": "",
  "descripcion_no_conformidad": "",
  "evidencia": "",
  "causa_raiz": "",
  "titulo": "",
  "acciones": [{{"descripcion": "", "responsable": "", "fecha_termino": "YYYY-MM-DD"}}],
  "estado": "BORRADOR"
}}"""
    
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

PM_CONTEXT = f"""Eres un experto en sistemas de gestión de calidad ISO 9001.
Generas documentos de Plan de Mejora completos en JSON.
Año actual: {YEAR}

Campos requeridos:
- gerencia_coordinacion: una de {AREAS}
- categoria_mejora: una de {CATEGORIAS_MEJORA}
- periodo_mejora: uno de ['1er. Cuatri', '2do. Cuatri', '3er. Cuatri']
- origen: uno de {ORIGENES_PM}
- titulo_mejora: título corto
- descripcion_situacion_actual: descripción actual
- situacion_deseada: estado wanted
- beneficios: beneficios esperados
- responsables: responsables
- actividades: array de {{descripcion, indicador, evidencia, responsable, fecha_termino}}

Responde SOLO con JSON válido."""


def generar_pm_completo(descripcion: str) -> dict:
    """Genera un Plan de Mejora completo con IA."""
    prompt = f"""Genera un Plan de Mejora completo.

Situación actual: {descripcion}

Responde con JSON:
{{
  "gerencia_coordinacion": "",
  "categoria_mejora": "",
  "periodo_mejora": "",
  "origen": "",
  "titulo_mejora": "",
  "descripcion_situacion_actual": "",
  "situacion_deseada": "",
  "beneficios": "",
  "responsables": "",
  "actividades": [{{"descripcion": "", "indicador": "", "evidencia": "", "responsable": "", "fecha_termino": "YYYY-MM-DD"}}],
  "estado": "BORRADOR"
}}"""
    
    raw = _call_ai(prompt, PM_CONTEXT)
    return _extraer_json(raw)