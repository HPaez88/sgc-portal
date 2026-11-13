"""
notificaciones.py — Avisos por correo desde el servidor (Resend).
Solo administradores y auditores; límite por usuario para que nadie dispare costos ni spam.
"""
import os
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from backend.database import get_session
from pydantic import BaseModel, Field

from backend import auth
from backend.models import AvisoAutomatico, Usuario
from backend.services import correo_service as correo

router = APIRouter(prefix="/api/v1/notificaciones", tags=["Notificaciones"])

ROLES_AVISAN = ("Super Admin", "Admin", "Auditor")
ROLES_CORREO_LIBRE = ("Super Admin", "Admin")
PAUSA_ENVIO = 0.6  # Resend admite ~2 correos por segundo
LIMITE_POR_HORA = 30  # ponytail: en memoria por proceso; con varios workers mover a Redis/Postgres
_envios: dict[int, deque] = defaultdict(deque)


class AvisoApertura(BaseModel):
    tipo: str = Field(pattern="^(AC|PM)$")
    area: str = Field(default="", max_length=150)
    origen: str = Field(default="SGC", max_length=120)
    referencia: str = Field(default="", max_length=80)
    descripcion: str = Field(default="", max_length=4000)
    destinatarios: list[str] = Field(min_length=1, max_length=correo.MAX_DESTINATARIOS)


class EnvioUnidad(BaseModel):
    unidad: str = Field(min_length=2, max_length=150)
    destinatarios: list[str] = Field(min_length=1, max_length=correo.MAX_DESTINATARIOS)


class Recordatorios(BaseModel):
    titulo: str = Field(min_length=3, max_length=150)
    mensaje: str = Field(min_length=10, max_length=4000)
    envios: list[EnvioUnidad] = Field(min_length=1, max_length=80)


class AvisoLibre(BaseModel):
    asunto: str = Field(min_length=3, max_length=200)
    mensaje: str = Field(min_length=3, max_length=4000)
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


@router.post("/libre")
def aviso_libre(datos: AvisoLibre, request: Request, usuario: Usuario = Depends(auth.requiere_rol(*ROLES_CORREO_LIBRE))):
    """Correo redactado por un administrador (cualquier aviso que no tenga plantilla)."""
    para = correo.limpiar_destinatarios(datos.destinatarios)
    _controlar_ritmo(usuario.id)
    asunto, cuerpo, texto = correo.plantilla_libre(datos.asunto.strip(), datos.mensaje.strip(), usuario.nombre,
                                                   str(request.base_url).rstrip("/"))
    id_correo = correo.enviar(para, asunto, cuerpo, texto, responder_a=usuario.email)
    return {"enviado": True, "id": id_correo, "destinatarios": para}


@router.post("/recordatorios")
def recordatorios(datos: Recordatorios, request: Request, usuario: Usuario = Depends(auth.requiere_rol(*ROLES_CORREO_LIBRE))):
    """Recordatorio manual a varias unidades (p. ej. matrices sin entregar). Cuenta como una sola acción en el límite."""
    _controlar_ritmo(usuario.id)
    url = correo.url_portal(request)
    resultados = []
    for envio in datos.envios:
        try:
            para = correo.limpiar_destinatarios(envio.destinatarios)
            asunto, cuerpo, texto = correo.plantilla_recordatorio(envio.unidad, datos.titulo.strip(), datos.mensaje.strip(), usuario.nombre, url)
            correo.enviar(para, asunto, cuerpo, texto, responder_a=os.getenv("BUZON_CORREO") or usuario.email)
            resultados.append({"unidad": envio.unidad, "enviado": True, "destinatarios": para})
        except HTTPException as ex:
            resultados.append({"unidad": envio.unidad, "enviado": False, "error": str(ex.detail)})
        time.sleep(PAUSA_ENVIO)
    return {"enviados": sum(r["enviado"] for r in resultados), "resultados": resultados}


@router.get("/avisos-automaticos")
def avisos_automaticos(limite: int = 300, usuario: Usuario = Depends(auth.requiere_rol(*ROLES_CORREO_LIBRE)),
                       session: Session = Depends(get_session)):
    """Lo que generó la tarea diaria (recordatorios, avisos de incumplimiento, oficios por emitir)."""
    filas = session.exec(select(AvisoAutomatico).order_by(AvisoAutomatico.fecha.desc()).limit(max(1, min(limite, 1000)))).all()
    return {"modo": os.getenv("AVISOS_MODO", "simulacion"), "arranque": os.getenv("AVISOS_ARRANQUE", ""), "avisos": [f.model_dump() for f in filas]}
