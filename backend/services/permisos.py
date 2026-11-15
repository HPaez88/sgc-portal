"""
permisos.py — Reglas de alcance por área y rol compartidas por los routers (misma regla que el portal).
"""
from backend.auth import ROLES_ADMIN

ROLES_TODAS_AREAS = (*ROLES_ADMIN, "Auditor")


def es_admin(usuario) -> bool:
    return bool(usuario) and usuario.rol in ROLES_ADMIN


def ve_todas_areas(usuario) -> bool:
    return bool(usuario) and usuario.rol in ROLES_TODAS_AREAS


def puede_area(usuario, area: str, areas_detalle: list) -> bool:
    """Igual que puedeCapturarArea del portal: admin SGC, el área propia, su correo o sus encargados del SGC."""
    if es_admin(usuario):
        return True
    if not area:
        return False
    correo = (usuario.email or "").lower()
    ficha = next((a for a in areas_detalle if isinstance(a, dict) and a.get("nombre") == area), {})
    return usuario.area == area or bool(correo) and (
        str(ficha.get("correo") or "").lower() == correo
        or correo in [str(c).lower() for c in ficha.get("encargados_sgc") or []])
