"""Pruebas de identidad: hash, token, login y protección de la API (SQLite temporal, sin servicios)."""
import os
import tempfile

import pytest

_TMP = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test_auth.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["SEED_ADMIN_PASSWORD"] = "ClaveInicial2026"
os.environ.pop("CLAMAV_HOST", None)

from fastapi import HTTPException  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend import auth  # noqa: E402
from backend.main import app  # noqa: E402

ADMIN = "hpaez@oomapasc.gob.mx"


@pytest.fixture(scope="module")
def cliente():
    with TestClient(app) as c:
        yield c


def _token(cliente, email=ADMIN, password="ClaveInicial2026"):
    r = cliente.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def test_hash_no_es_reversible_y_verifica():
    h = auth.hashear_password("secreto-largo")
    assert "secreto" not in h and auth.verificar_password("secreto-largo", h)
    assert not auth.verificar_password("otra", h) and not auth.verificar_password("x", None)


def test_password_corta_se_rechaza():
    with pytest.raises(HTTPException) as e:
        auth.hashear_password("corta")
    assert e.value.status_code == 422


def test_api_sin_sesion_responde_401(cliente):
    assert cliente.get("/api/v1/organismos").status_code == 401
    assert cliente.get("/api/v1/dashboard").status_code == 401
    assert cliente.get("/api/v1/manual").status_code == 401


def test_login_incorrecto_no_revela_si_existe_el_correo(cliente):
    r1 = cliente.post("/api/v1/auth/login", json={"email": ADMIN, "password": "mala-mala"})
    r2 = cliente.post("/api/v1/auth/login", json={"email": "nadie@oomapasc.gob.mx", "password": "mala-mala"})
    assert r1.status_code == r2.status_code == 401 and r1.json() == r2.json()


def test_clave_maestra_antigua_ya_no_abre_nada(cliente):
    r = cliente.post("/api/v1/auth/login", json={"email": "mgarcia@oomapasc.gob.mx", "password": "sgc2026"})
    assert r.status_code == 401


def test_login_correcto_da_token_y_abre_la_api(cliente):
    token = _token(cliente)
    r = cliente.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200 and r.json()["rol"] == "Super Admin" and "password_hash" not in r.json()
    assert cliente.get("/api/v1/organismos", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_token_manipulado_se_rechaza(cliente):
    token = _token(cliente)
    roto = token[:-3] + "abc"
    assert cliente.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {roto}"}).status_code == 401


def test_admin_crea_usuario_con_temporal_y_usuario_normal_no_puede(cliente):
    token = _token(cliente)
    cab = {"Authorization": f"Bearer {token}"}
    r = cliente.post("/api/v1/auth/usuarios", headers=cab, json={
        "nombre": "Persona Prueba", "email": "prueba@oomapasc.gob.mx", "area": "Control de Calidad", "rol": "Usuario"})
    assert r.status_code == 201, r.text
    temporal = r.json()["password_temporal"]
    assert len(temporal) >= 12
    # el nuevo entra con la temporal, debe cambiarla y no puede administrar usuarios
    t2 = _token(cliente, "prueba@oomapasc.gob.mx", temporal)
    cab2 = {"Authorization": f"Bearer {t2}"}
    assert cliente.get("/api/v1/auth/me", headers=cab2).json()["debe_cambiar_password"] is True
    assert cliente.post("/api/v1/auth/usuarios", headers=cab2, json={
        "nombre": "X Y Z", "email": "x@oomapasc.gob.mx", "area": "A", "rol": "Usuario"}).status_code == 403
    r = cliente.post("/api/v1/auth/cambiar-password", headers=cab2,
                     json={"password_actual": temporal, "password_nueva": "NuevaClave2026!"})
    assert r.status_code == 200 and r.json()["debe_cambiar_password"] is False
    assert _token(cliente, "prueba@oomapasc.gob.mx", "NuevaClave2026!")


def test_baja_logica_bloquea_el_acceso(cliente):
    token = _token(cliente)
    cab = {"Authorization": f"Bearer {token}"}
    uid = next(u["id"] for u in cliente.get("/api/v1/auth/usuarios", headers=cab).json() if u["email"] == "prueba@oomapasc.gob.mx")
    assert cliente.delete(f"/api/v1/auth/usuarios/{uid}", headers=cab).status_code == 204
    r = cliente.post("/api/v1/auth/login", json={"email": "prueba@oomapasc.gob.mx", "password": "NuevaClave2026!"})
    assert r.status_code == 401


def test_cookie_sirve_solo_para_lectura(cliente):
    cliente.cookies.clear()
    r = cliente.post("/api/v1/auth/login", json={"email": ADMIN, "password": "ClaveInicial2026"})
    assert r.status_code == 200 and "sgc_sesion" in r.cookies
    # GET con cookie (como <img>/<iframe>) funciona sin cabecera
    assert cliente.get("/api/v1/organismos").status_code == 200
    # escritura con solo la cookie se rechaza (sin riesgo CSRF)
    assert cliente.put("/api/v1/estado/sgc-x", json={"valor": 1}).status_code == 401
    cliente.post("/api/v1/auth/logout")
    cliente.cookies.clear()
    assert cliente.get("/api/v1/organismos").status_code == 401
