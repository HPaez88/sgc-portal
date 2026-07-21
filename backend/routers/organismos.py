"""
Endpoints para administrar organismos/clientes del portal.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import Organismo

router = APIRouter(prefix="/api/v1/organismos", tags=["Organismos"])


@router.get("", response_model=list[Organismo])
def listar_organismos(session: Session = Depends(get_session)):
    return session.exec(
        select(Organismo).where(Organismo.activo == True).order_by(Organismo.nombre)
    ).all()


@router.post("", response_model=Organismo, status_code=201)
def crear_organismo(organismo: Organismo, session: Session = Depends(get_session)):
    existente = session.exec(
        select(Organismo).where(Organismo.slug == organismo.slug)
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe un organismo con ese slug.")

    nuevo = Organismo(
        nombre=organismo.nombre,
        slug=organismo.slug.strip().lower(),
        activo=organismo.activo,
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@router.get("/{slug}", response_model=Organismo)
def obtener_organismo(slug: str, session: Session = Depends(get_session)):
    organismo = session.exec(
        select(Organismo).where(Organismo.slug == slug, Organismo.activo == True)
    ).first()
    if not organismo:
        raise HTTPException(status_code=404, detail="Organismo no encontrado.")
    return organismo
