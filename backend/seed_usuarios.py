"""
seed_usuarios.py — Carga inicial de usuarios cuando la tabla está vacía (arranque de la app).

Migra el catálogo que vivía en frontend/src/constants/usuarios.js. Nadie recibe la contraseña
antigua: el Super Admin obtiene una temporal (SEED_ADMIN_PASSWORD o generada y escrita en
SEED_ADMIN_PASSWORD_FILE, por defecto /data/sgc-admin-password.txt) y debe cambiarla al entrar.
Los demás quedan sin contraseña hasta que un Admin les restablezca una desde Configuración.
"""
import logging
import os
from pathlib import Path

from sqlmodel import Session, select

from backend import auth
from backend.models import Usuario

log = logging.getLogger("sgc.seed")

USUARIOS_INICIALES = [
    dict(nombre="Lic. Héctor Manuel Páez León", email="hpaez@oomapasc.gob.mx", telefono="6441894125",
         area="Sistema de Gestión de Calidad", direccion="Dir. General", rol="Super Admin"),
    dict(nombre="Ing. Juan López", email="jlopez@oomapasc.gob.mx", telefono="6441234567",
         area="Control de Calidad", direccion="Dir. Técnica", rol="Admin"),
    dict(nombre="Lic. María García", email="mgarcia@oomapasc.gob.mx", telefono="6442345678",
         area="Atención Ciudadana", direccion="Dir. Comercial", rol="Usuario"),
    dict(nombre="Ing. Pedro Martínez", email="pmartinez@oomapasc.gob.mx", telefono="6443456789",
         area="Mantenimiento de Redes", direccion="Dir. Técnica", rol="Encargado"),
    dict(nombre="Lic. Ana Rodríguez", email="arodriguez@oomapasc.gob.mx", telefono="6444567890",
         area="Recursos Humanos", direccion="Dir. Administrativa", rol="Encargado"),
    dict(nombre="Ing. Carlos Sánchez", email="csanchez@oomapasc.gob.mx", telefono="6445678901",
         area="Plantas Potabilizadoras", direccion="Dir. Técnica", rol="Admin"),
    dict(nombre="Lic. Laura Flores", email="lflores@oomapasc.gob.mx", telefono="6446789012",
         area="Contabilidad", direccion="Dir. Administrativa", rol="Encargado"),
]


def sembrar_usuarios(engine, organismo_id: int = 1) -> None:
    with Session(engine) as session:
        if session.exec(select(Usuario).where(Usuario.organismo_id == organismo_id)).first():
            return
        password_admin = os.getenv("SEED_ADMIN_PASSWORD") or auth.password_temporal()
        for datos in USUARIOS_INICIALES:
            es_admin = datos["rol"] == "Super Admin"
            session.add(Usuario(
                organismo_id=organismo_id,
                password_hash=auth.hashear_password(password_admin) if es_admin else None,
                debe_cambiar_password=True,
                **datos,
            ))
        session.commit()
        if not os.getenv("SEED_ADMIN_PASSWORD"):
            ruta = Path(os.getenv("SEED_ADMIN_PASSWORD_FILE", "/data/sgc-admin-password.txt"))
            try:
                ruta.parent.mkdir(parents=True, exist_ok=True)
                ruta.write_text(f"{USUARIOS_INICIALES[0]['email']}\n{password_admin}\n", encoding="utf-8")
                os.chmod(ruta, 0o600)
                log.warning("Usuarios sembrados. Contraseña temporal del Super Admin escrita en %s", ruta)
            except OSError as e:
                log.error("No se pudo escribir la contraseña temporal (%s). Contraseña temporal: %s", e, password_admin)
        else:
            log.warning("Usuarios sembrados con SEED_ADMIN_PASSWORD para el Super Admin.")
