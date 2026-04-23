"""
routers/catalogo.py — Endpoints de catálogos para el frontend
Versión 3.1 — Cumplimiento con Control 6
"""
from fastapi import APIRouter, Depends
from sqlmodel import select
from backend.database import get_session
from backend.models import (
    AREAS, DIRECCIONES, PROCESOS, ORIGENES_AC, ORIGENES_PM,
    CATEGORIAS_MEJORA, PERIODOS, Auditor, DatosArea, ESTADOS_SGC, TRANSICIONES
)

router = APIRouter(prefix="/api/v1/catalogos", tags=["Catálogos"])


@router.get("")
def obtener_catalogos(session=None):
    """Retorna todos los catálogos del sistema."""
    return {
        # Estructura organizacional
        "direcciones": DIRECCIONES,
        "areas": AREAS,
        
        # Procesos y orígenes
        "procesos": PROCESOS,
        "origenes_ac": ORIGENES_AC,
        "origenes_pm": ORIGENES_PM,
        
        # Mejora
        "categorias_mejora": CATEGORIAS_MEJORA,
        "periodos": PERIODOS,
        
        # Workflow
        "estados": ESTADOS_SGC,
        "transiciones": TRANSICIONES,
    }


@router.get("/areas")
def obtener_areas():
    """Lista simple de áreas."""
    return AREAS


@router.get("/direcciones")
def obtener_direcciones():
    """Lista de direcciones."""
    return DIRECCIONES


@router.get("/auditores")
def obtener_auditores(session=Depends(get_session)):
    """Lista de auditores activos."""
    auditores = session.exec(
        select(Auditor).where(Auditor.activo == True)
    ).all()
    return [{"id": a.id, "nombre": a.nombre, "email": a.email, "area": a.area} for a in auditores]


@router.get("/estados")
def obtener_estados():
    """Estados del workflow."""
    return ESTADOS_SGC


@router.get("/transiciones/{estado_actual}")
def obtener_transiciones(estado_actual: str):
    """Transiciones permitidas desde un estado."""
    return TRANSICIONES.get(estado_actual, [])