"""
notificaciones.py — Avisos por correo desde el servidor (Resend).
Solo administradores y auditores; límite por usuario para que nadie dispare costos ni spam.
"""
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend import auth
from backend.models import Usuario
from backend.services import correo_service as correo

router = APIRouter(prefix="/api/v1/notificaciones", tags=["Notificaciones"])

ROLES_AVISAN = ("Super Admin", "Admin", "Auditor")
LIMITE_POR_HORA = 30  # ponytail: en memoria por proceso; con varios workers mover a Redis/Postgres
_envios: dict[int, deque] = defaultdict(deque)


class AvisoApertura(BaseModel):
    tipo: str = Field(pattern="^(AC|PM)$")
    area: str = Field(default="", max_length=150)
    origen: str = Field(default="SGC", max_length=120)
    referencia: str = Field(default="", max_length=80)
    descripcion: str = Field(default="", max_length=4000)
    destinatarios: list[str] = Field(min_length=1, max_length=correo.MAX_DESTINATARIOS)


def _controlar_ritmo(usuario_id: int) -> None:
    ahora, cola = time.time(), _envios[usuario_id]
    while cola and ahora - cola[0] > 3600:
        cola.popleft()
    if len(cola) >= LIMITE_POR_HORA:
        raise HTTPException(status_code=429, detail="Demasiados avisos en la última hora. Intenta más tarde.")
    cola.append(ahora)


@router.get("/estado")
def estado(_: Usuario = Depends(auth.usuario_actual)):
    return {"activo": correo.configurado(), "remitente": correo.remitente()}


@router.post("/apertura")
def aviso_apertura(datos: AvisoApertura, request: Request, usuario: Usuario = Depends(auth.requiere_rol(*ROLES_AVISAN))):
    para = correo.limpiar_destinatarios(datos.destinatarios)
    _controlar_ritmo(usuario.id)
    url = str(request.base_url).rstrip("/")
    asunto, cuerpo, texto = correo.plantilla_apertura(datos.tipo, datos.area, datos.origen, datos.referencia,
                                                      datos.descripcion, usuario.nombre, url)
    id_correo = correo.enviar(para, asunto, cuerpo, texto, responder_a=usuario.email)
    return {"enviado": True, "id": id_correo, "destinatarios": para}
