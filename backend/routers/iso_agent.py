"""
routers/iso_agent.py — Endpoints para el Agente Asesor Normativo ISO
"""
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from backend.services.iso_rag_service import (
    listar_normas_disponibles,
    obtener_clausulas_norma,
    listar_documentos_conocimiento,
    consultar_agente_iso,
    KNOWLEDGE_DIR
)

router = APIRouter(prefix="/api/v1/iso", tags=["Agente Normativo ISO"])


class ConsultaISOInput(BaseModel):
    pregunta: str = Field(..., min_length=3, description="Pregunta o consulta sobre requisitos o cláusulas ISO")
    norma_id: Optional[str] = Field(None, description="ID de la norma (ej. ISO-9001-2015) o null para todas")
    historial: Optional[List[Dict[str, str]]] = Field(default=[], description="Historial de mensajes previos")
    catalogo_documentos: Optional[List[Dict[str, Any]]] = Field(default=None, description="Catálogo activo de documentos y registros del portal")
    catalogo_procesos: Optional[List[Dict[str, Any]]] = Field(default=None, description="Catálogo activo de procesos institucionales")
    usuario_contexto: Optional[Dict[str, Any]] = Field(default=None, description="Contexto operativo en tiempo real del usuario logueado (pendientes, indicadores, AC, PM, documentos >1 año)")


class GuardarDocumentoInput(BaseModel):
    nombre_archivo: str = Field(..., min_length=3, description="Nombre del archivo (ej. guia_auditoria_2026.md)")
    contenido: str = Field(..., min_length=10, description="Contenido de texto/markdown a incorporar")


@router.get("/normas")
def get_normas():
    """Retorna la lista de normas ISO disponibles en la base de conocimiento."""
    return {
        "normas": listar_normas_disponibles(),
        "total": len(listar_normas_disponibles())
    }


@router.get("/clausulas/{norma_id}")
def get_clausulas(norma_id: str):
    """Retorna las cláusulas detalladas de una norma en específico."""
    clausulas = obtener_clausulas_norma(norma_id)
    if not clausulas:
        raise HTTPException(status_code=404, detail=f"Norma '{norma_id}' no encontrada o sin cláusulas registradas.")
    return {
        "norma_id": norma_id,
        "clausulas": clausulas,
        "total": len(clausulas)
    }


@router.get("/documentos")
def get_documentos():
    """Retorna todos los documentos indexados en la base de conocimiento."""
    return {
        "documentos": listar_documentos_conocimiento()
    }


@router.post("/consultar")
def consultar_iso(body: ConsultaISOInput):
    """
    Consulta al Agente Asesor Normativo ISO con base en la documentación oficial.
    """
    resultado = consultar_agente_iso(
        pregunta=body.pregunta,
        norma_id=body.norma_id,
        historial=body.historial,
        catalogo_documentos=body.catalogo_documentos,
        catalogo_procesos=body.catalogo_procesos,
        usuario_contexto=body.usuario_contexto
    )
    return resultado


@router.post("/guardar-documento")
def guardar_documento_custom(body: GuardarDocumentoInput):
    """
    Permite agregar un nuevo documento de conocimiento personalizado (.md, .txt, .json).
    """
    custom_dir = os.path.join(KNOWLEDGE_DIR, "custom")
    os.makedirs(custom_dir, exist_ok=True)
    
    # Sanitizar nombre de archivo
    safe_name = "".join(c for c in body.nombre_archivo if c.isalnum() or c in "._- ").strip()
    if not safe_name.endswith((".md", ".txt", ".json")):
        safe_name += ".md"
        
    target_path = os.path.join(custom_dir, safe_name)
    try:
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(body.contenido)
        return {
            "success": True,
            "mensaje": f"Documento '{safe_name}' indexado exitosamente en la base de conocimiento.",
            "archivo": safe_name,
            "tamano_bytes": len(body.contenido)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar documento: {str(e)}")
