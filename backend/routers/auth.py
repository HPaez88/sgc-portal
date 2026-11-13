"""
auth.py (router) — Login, sesión y gestión de usuarios.
Las contraseñas temporales se devuelven UNA sola vez (al crear o restablecer) y nunca se listan.
"""
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import Usuario, UsuarioPublico
from backend.services import correo_service as correo

log = logging.getLogger("sgc.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class CambioPasswordInput(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=auth.PASSWORD_MIN, max_length=200)


class UsuarioInput(BaseModel):
    nombre: str = Field(min_length=3, max_length=150)
    email: EmailStr
    telefono: Optional[str] = Field(default=None, max_length=30)
    area: str = Field(min_length=2, max_length=120)
    direccion: Optional[str] = Field(default=None, max_length=120)
    rol: str = "Usuario"
    activo: bool = True
    enviar_correo: bool = True  # al crear: mandar los datos de acceso por correo


class RestablecerInput(BaseModel):
    enviar_correo: bool = False


class AccesosMasivosInput(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=100)


class RecuperarInput(BaseModel):
    email: EmailStr


class RecuperarConfirmarInput(BaseModel):
    token: str = Field(min_length=20, max_length=2000)
    password_nueva: str = Field(min_length=auth.PASSWORD_MIN, max_length=200)


PAUSA_ENVIO = 0.6  # Resend admite ~2 correos por segundo
_solicitudes: dict[str, deque] = defaultdict(deque)


def _limitar(clave: str, maximo: int, ventana: int = 900) -> None:
    # ponytail: en memoria por proceso; con varios workers mover a Postgres/Redis
    ahora, cola = time.time(), _solicitudes[clave]
    while cola and ahora - cola[0] > ventana:
        cola.popleft()
    if len(cola) >= maximo:
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes. Intenta en unos minutos.")
    cola.append(ahora)


def _ip(request: Request) -> str:
    reenviada = request.headers.get("x-forwarded-for", "")
    return reenviada.split(",")[0].strip() or (request.client.host if request.client else "?")


def _enviar_acceso(u: Usuario, temporal: str, request: Request, motivo: str) -> tuple[bool, Optional[str]]:
    """Manda los datos de acceso con diseño institucional. No lanza: regresa (enviado, error)."""
    if not correo.configurado():
        return False, "El envío de correos aún no está configurado."
    try:
        asunto, cuerpo, texto = correo.plantilla_acceso(u.nombre, u.email, temporal, correo.url_portal(request), motivo)
        correo.enviar([u.email], asunto, cuerpo, texto)
        return True, None
    except HTTPException as ex:
        return False, str(ex.detail)


def _publico(u: Usuario) -> UsuarioPublico:
    pub = UsuarioPublico.model_validate(u, from_attributes=True)
    pub.puede_restablecer = auth.puede_restablecer(u)
    return pub


# ───────────── Sesión ─────────────
@router.post("/login")
def login(datos: LoginInput, response: Response, session: Session = Depends(get_session)):
    usuario = session.exec(select(Usuario).where(Usuario.email == datos.email.lower().strip())).first()
    # Mismo mensaje exista o no el correo: no revelar cuentas.
    if not usuario or not usuario.activo or not auth.verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    usuario.ultimo_acceso = datetime.utcnow()
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    token = auth.crear_token(usuario)
    # Cookie de solo lectura (GET) para recursos embebidos: HttpOnly, misma-site estricta, 8 h.
    response.set_cookie(auth.COOKIE_SESION, token, max_age=auth.TOKEN_HORAS * 3600, httponly=True,
                        secure=os.getenv("ENVIRONMENT") == "production", samesite="strict", path="/api/")
    return {"token": token, "usuario": _publico(usuario)}


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(auth.COOKIE_SESION, path="/api/")
    return None


@router.get("/me", response_model=UsuarioPublico)
def yo(usuario: Usuario = Depends(auth.usuario_actual)):
    return _publico(usuario)


@router.post("/cambiar-password", response_model=UsuarioPublico)
def cambiar_password(
    datos: CambioPasswordInput,
    usuario: Usuario = Depends(auth.usuario_actual),
    session: Session = Depends(get_session),
):
    if not auth.verificar_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(status_code=401, detail="La contraseña actual no es correcta.")
    if datos.password_actual == datos.password_nueva:
        raise HTTPException(status_code=422, detail="La contraseña nueva debe ser distinta a la actual.")
    usuario.password_hash = auth.hashear_password(datos.password_nueva)
    usuario.debe_cambiar_password = False
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return _publico(usuario)


# ───────────── Gestión de usuarios (Admin / Super Admin) ─────────────
@router.get("/usuarios", response_model=list[UsuarioPublico])
def listar_usuarios(
    usuario: Usuario = Depends(auth.usuario_actual),
    session: Session = Depends(get_session),
):
    """Todos los usuarios activos del organismo (para asignaciones). Datos públicos, sin hashes."""
    filas = session.exec(
        select(Usuario).where(Usuario.organismo_id == usuario.organismo_id).order_by(Usuario.nombre)
    ).all()
    if usuario.rol not in auth.ROLES_ADMIN:
        filas = [u for u in filas if u.activo]
    return [_publico(u) for u in filas]


def _validar_rol(rol: str, actor: Usuario) -> None:
    if rol not in auth.ROLES:
        raise HTTPException(status_code=422, detail=f"Rol inválido. Opciones: {', '.join(auth.ROLES)}.")
    if rol == "Super Admin" and actor.rol != "Super Admin":
        raise HTTPException(status_code=403, detail="Solo un Super Admin puede otorgar el rol Super Admin.")


@router.post("/usuarios", status_code=201)
def crear_usuario(
    datos: UsuarioInput,
    request: Request,
    actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)),
    session: Session = Depends(get_session),
):
    email = datos.email.lower().strip()
    _validar_rol(datos.rol, actor)
    if session.exec(select(Usuario).where(Usuario.email == email)).first():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")
    temporal = auth.password_temporal()
    nuevo = Usuario(
        organismo_id=actor.organismo_id,
        nombre=datos.nombre.strip(),
        email=email,
        telefono=datos.telefono,
        area=datos.area.strip(),
        direccion=datos.direccion,
        rol=datos.rol,
        activo=datos.activo,
        password_hash=auth.hashear_password(temporal),
        debe_cambiar_password=True,
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    enviado, error = _enviar_acceso(nuevo, temporal, request, "alta") if datos.enviar_correo else (False, None)
    return {"usuario": _publico(nuevo), "password_temporal": temporal, "correo_enviado": enviado, "correo_error": error}


@router.put("/usuarios/{usuario_id}", response_model=UsuarioPublico)
def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioInput,
    actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)),
    session: Session = Depends(get_session),
):
    u = session.get(Usuario, usuario_id)
    if not u or u.organismo_id != actor.organismo_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    _validar_rol(datos.rol, actor)
    if u.rol == "Super Admin" and actor.rol != "Super Admin":
        raise HTTPException(status_code=403, detail="Solo un Super Admin puede modificar a otro Super Admin.")
    email = datos.email.lower().strip()
    otro = session.exec(select(Usuario).where(Usuario.email == email, Usuario.id != usuario_id)).first()
    if otro:
        raise HTTPException(status_code=409, detail="Ya existe otro usuario con ese correo.")
    if u.id == actor.id and (datos.rol != u.rol or not datos.activo):
        raise HTTPException(status_code=422, detail="No puedes cambiar tu propio rol ni desactivarte.")
    u.nombre, u.email, u.telefono = datos.nombre.strip(), email, datos.telefono
    u.area, u.direccion, u.rol, u.activo = datos.area.strip(), datos.direccion, datos.rol, datos.activo
    session.add(u)
    session.commit()
    session.refresh(u)
    return _publico(u)


@router.post("/usuarios/{usuario_id}/restablecer-password")
def restablecer_password(
    usuario_id: int,
    request: Request,
    datos: Optional[RestablecerInput] = None,
    actor: Usuario = Depends(auth.usuario_actual),
    session: Session = Depends(get_session),
):
    if not auth.puede_restablecer(actor):
        raise HTTPException(status_code=403, detail="No tienes permiso para restablecer contraseñas.")
    u = session.get(Usuario, usuario_id)
    if not u or u.organismo_id != actor.organismo_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    temporal = auth.password_temporal()
    u.password_hash = auth.hashear_password(temporal)
    u.debe_cambiar_password = True
    session.add(u)
    session.commit()
    enviado, error = _enviar_acceso(u, temporal, request, "restablecer") if datos and datos.enviar_correo else (False, None)
    return {"usuario": _publico(u), "password_temporal": temporal, "correo_enviado": enviado, "correo_error": error}


@router.delete("/usuarios/{usuario_id}", status_code=204)
def desactivar_usuario(
    usuario_id: int,
    actor: Usuario = Depends(auth.requiere_rol("Super Admin")),
    session: Session = Depends(get_session),
):
    """Baja lógica: el usuario deja de poder entrar pero su historial (bitácora, aprobaciones) se conserva."""
    u = session.get(Usuario, usuario_id)
    if not u or u.organismo_id != actor.organismo_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if u.id == actor.id:
        raise HTTPException(status_code=422, detail="No puedes desactivar tu propia cuenta.")
    u.activo = False
    session.add(u)
    session.commit()
    return None


# ───────────── Accesos por correo (masivo) ─────────────
@router.post("/usuarios/accesos-masivos")
def accesos_masivos(
    datos: AccesosMasivosInput,
    request: Request,
    actor: Usuario = Depends(auth.usuario_actual),
    session: Session = Depends(get_session),
):
    """Genera una contraseña temporal nueva a cada usuario elegido y se la manda por correo.
    Primero se envía y solo si salió el correo se cambia la contraseña (nadie se queda sin acceso)."""
    if not auth.puede_restablecer(actor):
        raise HTTPException(status_code=403, detail="No tienes permiso para enviar accesos.")
    if not correo.configurado():
        raise HTTPException(status_code=503, detail="El envío de correos aún no está configurado.")
    url = correo.url_portal(request)
    resultados = []
    for uid in dict.fromkeys(datos.ids):
        u = session.get(Usuario, uid)
        if not u or u.organismo_id != actor.organismo_id or not u.activo:
            resultados.append({"id": uid, "enviado": False, "error": "Usuario no encontrado o inactivo."})
            continue
        if u.id == actor.id:
            resultados.append({"id": uid, "nombre": u.nombre, "enviado": False, "error": "Tu propia cuenta no se incluye."})
            continue
        temporal = auth.password_temporal()
        try:
            asunto, cuerpo, texto = correo.plantilla_acceso(u.nombre, u.email, temporal, url, "restablecer")
            correo.enviar([u.email], asunto, cuerpo, texto)
        except HTTPException as ex:
            resultados.append({"id": uid, "nombre": u.nombre, "email": u.email, "enviado": False, "error": str(ex.detail)})
            continue
        u.password_hash = auth.hashear_password(temporal)
        u.debe_cambiar_password = True
        session.add(u)
        session.commit()
        resultados.append({"id": uid, "nombre": u.nombre, "email": u.email, "enviado": True})
        time.sleep(PAUSA_ENVIO)
    return {"enviados": sum(r["enviado"] for r in resultados), "resultados": resultados}


# ───────────── Recuperación autónoma (sin sesión) ─────────────
@router.post("/recuperar")
def solicitar_recuperacion(datos: RecuperarInput, request: Request, session: Session = Depends(get_session)):
    """Manda un enlace de un solo uso. La respuesta es igual exista o no el correo (no revela cuentas)."""
    email = datos.email.lower().strip()
    _limitar(f"ip:{_ip(request)}", 10)
    _limitar(f"correo:{email}", 3)
    if not correo.configurado():
        return {"ok": True, "correo_activo": False}
    u = session.exec(select(Usuario).where(Usuario.email == email)).first()
    if u and u.activo:
        url = correo.url_portal(request)
        enlace = f"{url}/?recuperar={auth.crear_token_recuperar(u)}"
        try:
            asunto, cuerpo, texto = correo.plantilla_recuperacion(u.nombre, enlace, auth.RECUPERAR_MINUTOS, url)
            correo.enviar([u.email], asunto, cuerpo, texto)
        except HTTPException as ex:
            log.error("No se pudo enviar la recuperación a %s: %s", u.id, ex.detail)
    return {"ok": True, "correo_activo": True}


@router.post("/recuperar/confirmar")
def confirmar_recuperacion(datos: RecuperarConfirmarInput, request: Request, session: Session = Depends(get_session)):
    _limitar(f"confirmar:{_ip(request)}", 20)
    u = auth.validar_token_recuperar(datos.token, session)
    u.password_hash = auth.hashear_password(datos.password_nueva)
    u.debe_cambiar_password = False
    session.add(u)
    session.commit()
    return {"ok": True}
