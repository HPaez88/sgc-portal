"""
auth.py (router) — Login, sesión y gestión de usuarios.
Las contraseñas temporales se devuelven UNA sola vez (al crear o restablecer) y nunca se listan.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import Usuario, UsuarioPublico

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


def _publico(u: Usuario) -> UsuarioPublico:
    return UsuarioPublico.model_validate(u, from_attributes=True)


# ───────────── Sesión ─────────────
@router.post("/login")
def login(datos: LoginInput, session: Session = Depends(get_session)):
    usuario = session.exec(select(Usuario).where(Usuario.email == datos.email.lower().strip())).first()
    # Mismo mensaje exista o no el correo: no revelar cuentas.
    if not usuario or not usuario.activo or not auth.verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    usuario.ultimo_acceso = datetime.utcnow()
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return {"token": auth.crear_token(usuario), "usuario": _publico(usuario)}


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
    return {"usuario": _publico(nuevo), "password_temporal": temporal}


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
    actor: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN)),
    session: Session = Depends(get_session),
):
    u = session.get(Usuario, usuario_id)
    if not u or u.organismo_id != actor.organismo_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if u.rol == "Super Admin" and actor.rol != "Super Admin":
        raise HTTPException(status_code=403, detail="Solo un Super Admin puede restablecer a otro Super Admin.")
    temporal = auth.password_temporal()
    u.password_hash = auth.hashear_password(temporal)
    u.debe_cambiar_password = True
    session.add(u)
    session.commit()
    return {"usuario": _publico(u), "password_temporal": temporal}


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
