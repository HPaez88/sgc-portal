"""
altas_encargados.py — Da de alta como usuarios del portal a los encargados del catálogo (áreas, direcciones y
subdirecciones) que todavía no existen. No toca a los que ya existen. Sin contraseña utilizable: el Super Admin
genera la temporal desde Configuración → Usuarios.
Uso:  docker exec sgc-app python -m backend.scripts.altas_encargados [--simular]
"""
import json
import sys

from sqlmodel import Session, select

from backend import auth
from backend.database import engine
from backend.models import EstadoPortal, Usuario


def personas_del_catalogo(areas: list, direcciones: list) -> list[dict]:
    out = []
    for d in direcciones:
        if not isinstance(d, dict):
            continue
        out.append({"nombre": d.get("director") or "", "email": d.get("correo") or "", "area": d.get("nombre") or "", "direccion": d.get("nombre") or "", "rol": "Encargado"})
        for sd in d.get("subdirecciones") or []:
            if isinstance(sd, dict):
                out.append({"nombre": sd.get("encargado") or "", "email": sd.get("correo") or "", "area": sd.get("nombre") or "", "direccion": d.get("nombre") or "", "rol": "Encargado"})
    for a in areas:
        if isinstance(a, dict):
            out.append({"nombre": a.get("encargado") or "", "email": a.get("correo") or "", "area": a.get("nombre") or "", "direccion": a.get("direccion") or None, "rol": "Encargado"})
    return [p for p in out if "@" in str(p["email"]) and str(p["nombre"]).strip()]


def ejecutar(simular: bool = False, organismo_id: int = 1) -> dict:
    with Session(engine) as s:
        leer = lambda clave: s.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)).first()
        areas = json.loads((leer("sgc-config-areas-detalle") or EstadoPortal(valor="[]")).valor) or []
        direcciones = json.loads((leer("sgc-config-direcciones-detalle") or EstadoPortal(valor="[]")).valor) or []
        existentes = {u.email.lower() for u in s.exec(select(Usuario)).all()}
        creados, vistos = [], set()
        for p in personas_del_catalogo(areas, direcciones):
            email = p["email"].lower().strip()
            if email in existentes or email in vistos:
                continue
            vistos.add(email)
            creados.append(f"{p['nombre']} <{email}> · {p['rol']} · {p['area']}")
            if not simular:
                s.add(Usuario(organismo_id=organismo_id, nombre=p["nombre"].strip(), email=email, area=p["area"].strip(), direccion=p["direccion"],
                              rol=p["rol"], activo=True, password_hash=auth.hashear_password(auth.password_temporal()), debe_cambiar_password=True))
        if not simular:
            s.commit()
        return {"simulacion": simular, "creados": creados}


if __name__ == "__main__":
    r = ejecutar(simular="--simular" in sys.argv)
    print(("SIMULACIÓN · " if r["simulacion"] else "") + f"{len(r['creados'])} alta(s):")
    for c in r["creados"]:
        print(" -", c)
