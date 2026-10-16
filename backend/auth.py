"""
auth.py — Identidad mínima del portal (fase 0 de control-documental).

- Contraseñas con bcrypt. Nunca se guardan ni se devuelven en claro.
- Sesión con token firmado (JWT HS256, 8 h) que lleva id, organismo y rol.
- `usuario_actual` es la dependencia que protege la API; `requiere_rol` acota por rol.

AUTH_SECRET debe existir en producción (se valida al arrancar). En desarrollo se genera uno
aleatorio por proceso: las sesiones caducan al reiniciar, lo cual es aceptable.
"""
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, Request
from sqlmodel import Session

from backend.database import get_session

TOKEN_HORAS = 8
ROLES = ("Super Admin", "Admin", "Director", "Auditor", "Encargado", "Usuario")
ROLES_ADMIN = ("Super Admin", "Admin")
PASSWORD_MIN = 8


def _secreto() -> str:
    valor = os.getenv("AUTH_SECRET")
    if valor:
        return valor
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("AUTH_SECRET es obligatorio en producción (openssl rand -hex 32).")
    if not hasattr(_secreto, "_dev"):
        _secreto._dev = secrets.token_hex(32)
    return _secreto._dev


def validar_configuracion() -> None:
    """Llamar al arrancar: falla rápido si falta el secreto en producción."""
    _secreto()


# ───────────── Contraseñas ─────────────
def hashear_password(password: str) -> str:
    if len(password or "") < PASSWORD_MIN:
        raise HTTPException(status_code=422, detail=f"La contraseña debe tener al menos {PASSWORD_MIN} caracteres.")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def verificar_password(password: str, password_hash: Optional[str]) -> bool:
    if not password_hash or not password:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


def password_temporal() -> str:
    """Contraseña inicial legible, 12 caracteres, para entregar una sola vez."""
    alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alfabeto) for _ in range(12))


# ───────────── Tokens ─────────────
def crear_token(usuario) -> str:
    ahora = datetime.now(timezone.utc)
    datos = {
        "sub": str(usuario.id),
        "org": usuario.organismo_id,
        "rol": usuario.rol,
        "nombre": usuario.nombre,
        "iat": int(ahora.timestamp()),
        "exp": int((ahora + timedelta(hours=TOKEN_HORAS)).timestamp()),
    }
    return jwt.encode(datos, _secreto(), algorithm="HS256")


def decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, _secreto(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="La sesión expiró. Vuelve a iniciar sesión.") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Sesión inválida.") from e


def _extraer_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    esquema, _, token = authorization.partition(" ")
    return token.strip() if esquema.lower() == "bearer" and token else None


COOKIE_SESION = "sgc_sesion"
METODOS_LECTURA = ("GET", "HEAD")


def _token_de(request: Request, authorization: Optional[str]) -> Optional[str]:
    """Bearer siempre; la cookie solo vale para lecturas (GET): así <img>, <iframe> y enlaces de descarga
    funcionan sin exponer el token en la URL, y la cookie no sirve para escribir (sin riesgo CSRF)."""
    token = _extraer_bearer(authorization)
    if token:
        return token
    if request.method in METODOS_LECTURA:
        return request.cookies.get(COOKIE_SESION)
    return None


def datos_token_opcional(request: Request, authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    """Decodifica el token si viene; no exige sesión. Útil para resolver el organismo."""
    token = _token_de(request, authorization)
    return decodificar_token(token) if token else None


# ───────────── Dependencias ─────────────
def usuario_actual(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    from backend.models import Usuario

    token = _token_de(request, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Se requiere iniciar sesión.")
    datos = decodificar_token(token)
    usuario = session.get(Usuario, int(datos["sub"]))
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario inactivo o inexistente.")
    return usuario


def requiere_rol(*roles: str):
    def _dep(usuario=Depends(usuario_actual)):
        if usuario.rol not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta acción.")
        return usuario
    return _dep
