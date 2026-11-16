"""
auditorias.py — Auditorías internas (OOMPSC-08): invitación a los auditores del catálogo y registro del orden
en que confirman. El resto del proceso vive en el estado del portal (claves `sgc-auditorias-*`), con sus reglas
en services/flujo_reglas.py.

El procedimiento pide elegir a los auditores "en el orden en que se reciban los correos de confirmación": por eso la
confirmación se registra en el servidor (hora del servidor y fila bloqueada), no en el navegador.
"""
import html
import json
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import EstadoPortal, Usuario
from backend.services import correo_service as correo
from backend.services.flujo_reglas import CLAVE_AUDITORIAS

router = APIRouter(prefix="/api/v1/auditorias", tags=["Auditorías internas"])
ZONA = ZoneInfo("America/Hermosillo")
ROLES_AUDITAN = ("Auditor", "Admin", "Super Admin")
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


class InvitacionInput(BaseModel):
    mensaje: str = ""
    enviar_correo: bool = True


def _cargar(session: Session, organismo_id: int):
    fila = session.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == CLAVE_AUDITORIAS)
                        .with_for_update()).first()
    try:
        lista = json.loads(fila.valor) if fila else []
    except ValueError:
        lista = []
    return fila, lista if isinstance(lista, list) else []


def _auditoria(lista: list, auditoria_id: str) -> dict:
    a = next((x for x in lista if isinstance(x, dict) and str(x.get("id")) == str(auditoria_id)), None)
    if not a:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada. Guarda los cambios y vuelve a intentar.")
    return a


def _guardar(session: Session, fila, lista: list, usuario: Usuario) -> None:
    fila.valor, fila.actualizado, fila.actualizado_por = json.dumps(lista, ensure_ascii=False), datetime.utcnow(), usuario.nombre
    session.add(fila)
    session.commit()


def _fecha_larga(iso: str) -> str:
    try:
        a, m, d = [int(x) for x in str(iso)[:10].split("-")]
        return f"{d} de {MESES[m - 1]} de {a}"
    except (ValueError, IndexError):
        return str(iso or "")


def catalogo_auditores(session: Session, organismo_id: int) -> list[Usuario]:
    """Catálogo de auditores internos (OOMRSC-10): usuarios activos con rol Auditor."""
    return list(session.exec(select(Usuario).where(Usuario.organismo_id == organismo_id, Usuario.rol == "Auditor", Usuario.activo == True)).all())  # noqa: E712


@router.post("/{auditoria_id}/invitar")
def invitar(auditoria_id: str, datos: InvitacionInput, request: Request, session: Session = Depends(get_session),
            usuario: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN))):
    """Abre la invitación: la auditoría pasa a INVITACION y, si el correo está configurado, se avisa a todo el catálogo."""
    fila, lista = _cargar(session, usuario.organismo_id)
    a = _auditoria(lista, auditoria_id)
    if a.get("estado") not in ("PLANEACION", "INVITACION"):
        raise HTTPException(status_code=409, detail="La invitación solo se envía mientras la auditoría está en planeación.")
    auditores = catalogo_auditores(session, usuario.organismo_id)
    if not auditores:
        raise HTTPException(status_code=409, detail="No hay auditores internos activos en el catálogo de usuarios.")
    url = correo.url_portal(request)
    numero = f"Auditoría interna #{a.get('numero')}/{a.get('anio')}"
    areas = ", ".join(x.get("area", "") for x in a.get("areas") or [])
    requeridos = sum(int(x.get("auditores_requeridos") or 1) for x in a.get("areas") or [])
    enviados, error = 0, None
    enlace = f"{url}/?auditoria={a.get('id')}"
    if datos.enviar_correo and correo.configurado():
        e = html.escape
        extra = "".join(f"<p>{e(p)}</p>" for p in datos.mensaje.split("\n") if p.strip())
        contenido = (
            f"<p>El Sistema de Gestión de Calidad invita a los auditores internos a participar en la <b>{e(numero)}</b>, "
            f"del {e(_fecha_larga(a.get('fecha_inicio')))} al {e(_fecha_larga(a.get('fecha_fin')))}.</p>"
            f"<p><b>Áreas a auditar:</b> {e(areas)}<br><b>Auditores requeridos:</b> {requeridos}</p>{extra}"
            "<p>Conforme al procedimiento OOMPSC-08, el equipo se integra en el orden en que se reciben las confirmaciones "
            "y nadie audita su propia área.</p>"
            f"{correo.boton('Confirmar mi participación', enlace)}"
            f'<p style="font-size:13px;color:#475569">{e(usuario.nombre)}<br>Auditor líder de calidad</p>')
        texto = (f"{numero}, del {_fecha_larga(a.get('fecha_inicio'))} al {_fecha_larga(a.get('fecha_fin'))}.\nÁreas: {areas}\n"
                 f"Auditores requeridos: {requeridos}\n{datos.mensaje}\n\nConfirma tu participación en el portal: {enlace}")
        cuerpo = correo.marco("Portal SGC · Auditorías internas", f"Invitación: {numero}", contenido, url)
        for u in auditores:
            try:
                correo.enviar([u.email], f"Invitación a {numero}", cuerpo, texto, responder_a=usuario.email)
                enviados += 1
            except HTTPException as ex:
                error = str(ex.detail)
    a["estado"] = "INVITACION"
    a["invitacion"] = {"fecha": datetime.now(ZONA).isoformat(timespec="seconds"), "por": usuario.nombre, "mensaje": datos.mensaje.strip(),
                       "destinatarios": [u.email for u in auditores], "correos_enviados": enviados}
    a.setdefault("confirmaciones", [])
    _guardar(session, fila, lista, usuario)
    return {"auditoria": a, "auditores": len(auditores), "correos_enviados": enviados, "correo_configurado": correo.configurado(), "error": error}


@router.post("/{auditoria_id}/confirmar")
def confirmar(auditoria_id: str, session: Session = Depends(get_session), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_AUDITAN))):
    """El auditor confirma su participación. El orden lo da la hora del servidor."""
    fila, lista = _cargar(session, usuario.organismo_id)
    a = _auditoria(lista, auditoria_id)
    if a.get("estado") != "INVITACION":
        raise HTTPException(status_code=409, detail="Esta auditoría ya no está recibiendo confirmaciones.")
    confirmaciones = a.setdefault("confirmaciones", [])
    correo_u = usuario.email.lower()
    if not any(str(c.get("email", "")).lower() == correo_u for c in confirmaciones):
        confirmaciones.append({"email": correo_u, "nombre": usuario.nombre, "area": usuario.area or "", "direccion": usuario.direccion or "",
                               "fecha": datetime.now(ZONA).isoformat(timespec="seconds"), "orden": len(confirmaciones) + 1})
        _guardar(session, fila, lista, usuario)
    return {"auditoria": a, "orden": next(c["orden"] for c in confirmaciones if str(c.get("email", "")).lower() == correo_u)}


@router.post("/{auditoria_id}/retirar")
def retirar(auditoria_id: str, session: Session = Depends(get_session), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_AUDITAN))):
    """El auditor retira su confirmación mientras la invitación sigue abierta (los demás conservan su orden)."""
    fila, lista = _cargar(session, usuario.organismo_id)
    a = _auditoria(lista, auditoria_id)
    if a.get("estado") != "INVITACION":
        raise HTTPException(status_code=409, detail="El equipo ya se cerró; avisa al auditor líder de calidad.")
    antes = len(a.get("confirmaciones") or [])
    a["confirmaciones"] = [c for c in a.get("confirmaciones") or [] if str(c.get("email", "")).lower() != usuario.email.lower()]
    if len(a["confirmaciones"]) != antes:
        _guardar(session, fila, lista, usuario)
    return {"auditoria": a}
