"""
buzon.py (router) — Buzón SGC.

POST /api/v1/buzon/webhook   Resend avisa que llegó un correo (firma Svix con RESEND_WEBHOOK_SECRET).
GET  /api/v1/buzon           Mensajes (administradores).
POST /api/v1/buzon/{id}/responder  Envía la respuesta (la propuesta de la IA editada o una propia).
POST /api/v1/buzon/{id}/descartar  Lo archiva sin responder.

Modo (BUZON_MODO): "aprobacion" (por omisión: la IA solo propone) o "automatico" (envía sola lo que sí puede resolver).
Sin RESEND_WEBHOOK_SECRET el buzón queda apagado (el webhook responde 503).
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import MensajeBuzon, Usuario
from backend.services import buzon_service as bz
from backend.services import correo_service as correo

log = logging.getLogger("sgc.buzon")
router = APIRouter(prefix="/api/v1/buzon", tags=["Buzón SGC"])
RECIBIDOS_URL = "https://api.resend.com/emails/receiving/{id}"


class RespuestaInput(BaseModel):
    texto: str = Field(min_length=5, max_length=4000)


def _modo() -> str:
    return "automatico" if os.getenv("BUZON_MODO", "").lower() == "automatico" else "aprobacion"


def _admins(session: Session, organismo_id: int) -> list[str]:
    filas = session.exec(select(Usuario).where(Usuario.organismo_id == organismo_id, Usuario.rol.in_(auth.ROLES_ADMIN))).all()
    return [u.email for u in filas if u.activo]


def _traer_correo(email_id: str) -> dict:
    llave = os.getenv("RESEND_API_KEY_RECEPCION") or os.getenv("RESEND_API_KEY")
    try:
        r = httpx.get(RECIBIDOS_URL.format(id=email_id), timeout=20, headers={"Authorization": f"Bearer {llave}"})
    except httpx.HTTPError as ex:
        raise HTTPException(status_code=502, detail="No se pudo leer el correo recibido.") from ex
    if r.status_code >= 300:
        log.error("Resend no entregó el correo recibido (%s): %s", r.status_code, r.text[:200])
        raise HTTPException(status_code=502, detail="No se pudo leer el correo recibido.")
    return r.json()


def _clasificar(usuario: Optional[Usuario], asunto: str, texto: str) -> dict:
    if not usuario:
        return {"clasificacion": "DESCONOCIDO", "categoria": "otro", "resumen": "Remitente fuera del directorio del portal",
                "respuesta_propuesta": "", "motivo_escalar": "El remitente no es usuario del portal; no se responde en automático."}
    from backend.services import ai_service  # import diferido: sin IA configurada el buzón sigue recibiendo
    try:
        datos = ai_service.generar_json_desde_prompt(
            bz.prompt_buzon(nombre=usuario.nombre, area=usuario.area, rol=usuario.rol, asunto=asunto, mensaje=texto),
            bz.CONTEXTO_IA)
    except HTTPException as ex:
        log.error("IA del buzón no respondió: %s", ex.detail)
        datos = None
    return bz.interpretar_ia(datos)


def _enviar_respuesta(m: MensajeBuzon, texto: str, url: str) -> None:
    asunto, cuerpo, plano = correo.plantilla_respuesta_buzon(m.de_nombre or "", texto, m.asunto or "Tu mensaje", url)
    hilo = {"In-Reply-To": m.message_id, "References": m.message_id} if m.message_id else None
    correo.enviar([m.de], asunto, cuerpo, plano, responder_a=os.getenv("BUZON_CORREO"), encabezados=hilo)


@router.post("/webhook")
async def recibir(request: Request, session: Session = Depends(get_session)):
    secreto = os.getenv("RESEND_WEBHOOK_SECRET")
    if not secreto:
        raise HTTPException(status_code=503, detail="Buzón no configurado.")
    cuerpo = await request.body()
    h = request.headers
    if not bz.verificar_firma(secreto, h.get("svix-id", ""), h.get("svix-timestamp", ""), h.get("svix-signature", ""), cuerpo):
        raise HTTPException(status_code=400, detail="Firma inválida.")
    evento = bz.leer_json(cuerpo)
    email_id = str((evento.get("data") or {}).get("email_id") or "")
    if evento.get("type") != "email.received" or not email_id:
        return {"ok": True, "ignorado": True}
    if session.exec(select(MensajeBuzon).where(MensajeBuzon.resend_id == email_id)).first():
        return {"ok": True, "duplicado": True}  # Resend reintenta: no se procesa dos veces

    datos = _traer_correo(email_id)
    remitente = bz.correo_de(datos.get("from", ""))
    organismo_id = int(os.getenv("DEFAULT_ORGANISMO_ID", "1"))
    usuario = session.exec(select(Usuario).where(Usuario.email == remitente, Usuario.activo == True)).first()  # noqa: E712
    texto = bz.solo_mensaje_nuevo(datos.get("text") or bz.texto_de_html(datos.get("html") or ""))
    encabezados = datos.get("headers") or {}
    m = MensajeBuzon(organismo_id=usuario.organismo_id if usuario else organismo_id, resend_id=email_id, de=remitente,
                     de_nombre=usuario.nombre if usuario else None, usuario_id=usuario.id if usuario else None,
                     asunto=str(datos.get("subject") or "")[:300], texto=texto,
                     message_id=str(datos.get("message_id") or "")[:500] or None)

    if bz.es_respuesta_automatica(remitente, encabezados):
        m.clasificacion, m.estado, m.resumen = "AUTOMATICO", "DESCARTADO", "Respuesta automática o rebote; no se contesta."
        session.add(m)
        session.commit()
        return {"ok": True, "automatico": True}

    hace_un_dia = datetime.utcnow() - timedelta(days=1)
    del_dia = session.exec(select(MensajeBuzon).where(MensajeBuzon.de == remitente, MensajeBuzon.recibido >= hace_un_dia)).all()
    if len(del_dia) >= bz.LIMITE_DIARIO_POR_REMITENTE:
        m.clasificacion, m.resumen, m.motivo_escalar = "REQUIERE_ADMIN", "Límite diario de mensajes", "Muchos mensajes del mismo remitente hoy; no se analizó con IA."
    else:
        for k, v in _clasificar(usuario, m.asunto, texto).items():
            setattr(m, k, v)
    session.add(m)
    session.commit()
    session.refresh(m)

    url = correo.url_portal(request)
    if _modo() == "automatico" and m.clasificacion == "PUEDE_AYUDAR":
        try:
            _enviar_respuesta(m, m.respuesta_propuesta, url)
            m.estado, m.respuesta_enviada, m.respondido_por, m.respondido_en = "RESPONDIDO", m.respuesta_propuesta, "IA (automático)", datetime.utcnow()
            session.add(m)
            session.commit()
        except HTTPException as ex:
            log.error("No se pudo enviar la respuesta automática %s: %s", m.id, ex.detail)
    admins = _admins(session, m.organismo_id)
    if admins and m.clasificacion != "AUTOMATICO":
        try:
            asunto, cuerpo, plano = correo.plantilla_aviso_buzon(m, url)
            correo.enviar(admins, asunto, cuerpo, plano, responder_a=m.de)
        except HTTPException as ex:
            log.error("No se pudo avisar a los administradores del mensaje %s: %s", m.id, ex.detail)
    return {"ok": True, "id": m.id}


@router.get("")
def listar(estado: Optional[str] = None, actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)),
           session: Session = Depends(get_session)):
    q = select(MensajeBuzon).where(MensajeBuzon.organismo_id == actor.organismo_id)
    if estado:
        q = q.where(MensajeBuzon.estado == estado.upper())
    filas = session.exec(q.order_by(MensajeBuzon.recibido.desc()).limit(300)).all()
    return {"modo": _modo(), "activo": bool(os.getenv("RESEND_WEBHOOK_SECRET")), "correo": os.getenv("BUZON_CORREO") or "",
            "mensajes": [f.model_dump() for f in filas]}


def _mensaje(session: Session, mensaje_id: int, actor: Usuario) -> MensajeBuzon:
    m = session.get(MensajeBuzon, mensaje_id)
    if not m or m.organismo_id != actor.organismo_id:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado.")
    if m.estado != "PENDIENTE":
        raise HTTPException(status_code=409, detail="Este mensaje ya fue atendido.")
    return m


@router.post("/{mensaje_id}/responder")
def responder(mensaje_id: int, datos: RespuestaInput, request: Request,
              actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)), session: Session = Depends(get_session)):
    m = _mensaje(session, mensaje_id, actor)
    _enviar_respuesta(m, datos.texto.strip(), correo.url_portal(request))
    m.estado, m.respuesta_enviada, m.respondido_por, m.respondido_en = "RESPONDIDO", datos.texto.strip(), actor.nombre, datetime.utcnow()
    session.add(m)
    session.commit()
    return m.model_dump()


@router.post("/{mensaje_id}/descartar")
def descartar(mensaje_id: int, actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)), session: Session = Depends(get_session)):
    m = _mensaje(session, mensaje_id, actor)
    m.estado, m.respondido_por, m.respondido_en = "DESCARTADO", actor.nombre, datetime.utcnow()
    session.add(m)
    session.commit()
    return m.model_dump()
