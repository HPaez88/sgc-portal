"""
estado.py — Estado operativo del organismo (capturas del portal) persistido en Postgres por clave.

Sustituye al localStorage como fuente de verdad: lo que se captura en una computadora se ve en todas.
Cada clave (acciones correctivas, planes, indicadores, riesgos, catálogos…) guarda un JSON completo.
Al guardar se fusiona a 3 vías con lo que hay en el servidor (services/fusion_estado.py): solo se
aplica lo que cambió ese navegador; se registra quién y cuándo. Migración a tablas propias por módulo: ver spec.
"""
import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.auth import usuario_actual
from backend.database import get_session
from backend.models import EstadoPortal, Usuario
from backend.services.fusion_estado import fusionar, fusionar_sin_base
from backend.tenant import get_organismo_id

router = APIRouter(prefix="/api/v1/estado", tags=["Estado del portal"])

MAX_BYTES_VALOR = 8 * 1024 * 1024  # 8 MB por clave: suficiente para años de capturas; evita blobs accidentales


class ValorInput(BaseModel):
    valor: Any
    base: Any = None          # lo que el navegador cargó; None = navegador con versión anterior
    tiene_base: bool = False  # distingue "base vacía" de "no mandó base"


def _clave_valida(clave: str) -> str:
    c = clave.strip().lower()
    if not c.startswith("sgc-") or len(c) > 80 or not all(ch.isalnum() or ch in "-_" for ch in c):
        raise HTTPException(status_code=422, detail="Clave inválida (debe iniciar con 'sgc-').")
    return c


@router.get("")
def obtener_todo(session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    """Todas las claves del organismo: { clave: { valor, actualizado, actualizado_por } }."""
    filas = session.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id)).all()
    return {f.clave: {"valor": json.loads(f.valor), "actualizado": f.actualizado, "actualizado_por": f.actualizado_por} for f in filas}


@router.get("/{clave}")
def obtener(clave: str, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    clave = _clave_valida(clave)
    f = session.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)).first()
    if not f:
        raise HTTPException(status_code=404, detail="Sin valor guardado para esa clave.")
    return {"clave": f.clave, "valor": json.loads(f.valor), "actualizado": f.actualizado, "actualizado_por": f.actualizado_por}


@router.put("/{clave}")
def guardar(
    clave: str,
    datos: ValorInput,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
    usuario: Usuario = Depends(usuario_actual),
):
    clave = _clave_valida(clave)
    f = session.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)
                     .with_for_update()).first()
    if not f:
        valor = datos.valor
        f = EstadoPortal(organismo_id=organismo_id, clave=clave)
    else:
        actual = json.loads(f.valor)
        valor = fusionar(datos.base, datos.valor, actual) if datos.tiene_base else fusionar_sin_base(datos.valor, actual)
    texto = json.dumps(valor, ensure_ascii=False)
    if len(texto.encode("utf-8")) > MAX_BYTES_VALOR:
        raise HTTPException(status_code=413, detail="El valor excede 8 MB; usa archivos para contenido pesado.")
    f.valor, f.actualizado, f.actualizado_por = texto, datetime.utcnow(), usuario.nombre
    session.add(f)
    session.commit()
    return {"clave": f.clave, "valor": valor, "actualizado": f.actualizado, "actualizado_por": f.actualizado_por}
