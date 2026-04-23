"""
routers/ai.py — Endpoints de Inteligencia Artificial (Ollama local)
"""
from fastapi import APIRouter
from pydantic import BaseModel
from backend.models import AIPrompt
from backend.services.ai_service import sugerir_con_ia, generar_ac_completo, generar_pm_completo

router = APIRouter(prefix="/api/v1/ai", tags=["Inteligencia Artificial"])


class DescripcionInput(BaseModel):
    descripcion: str


@router.post("/generar-ac")
def generar_ac(body: DescripcionInput):
    """
    Dado el texto de una No Conformidad, genera un documento de
    Acción Correctiva completo con todos los campos y actividades.
    El usuario solo debe revisar, editar (si desea) y guardar.
    """
    datos = generar_ac_completo(body.descripcion)
    return datos


@router.post("/generar-pm")
def generar_pm(body: DescripcionInput):
    """
    Dado el texto de la situación actual, genera un Plan de Mejora
    completo con todos los campos y actividades.
    El usuario solo debe revisar, editar (si desea) y guardar.
    """
    datos = generar_pm_completo(body.descripcion)
    return datos


@router.post("/sugerir")
def sugerir(prompt: AIPrompt):
    """
    Genera una sugerencia puntual de texto usando el LLM local (Ollama).
    tipo: 'AC' → sugiere causa raíz
    tipo: 'PM' → sugiere situación deseada
    """
    sugerencia = sugerir_con_ia(prompt.descripcion, prompt.tipo)
    return {"sugerencia": sugerencia}
