"""Estado operativo por organismo: guardar, leer todo, aislamiento por sesión."""
import os
import tempfile

import pytest

_TMP = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test_estado.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["SEED_ADMIN_PASSWORD"] = "ClaveInicial2026"
os.environ.pop("CLAMAV_HOST", None)

from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402


@pytest.fixture(scope="module")
def cliente():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def cab(cliente):
    r = cliente.post("/api/v1/auth/login", json={"email": "hpaez@oomapasc.gob.mx", "password": "ClaveInicial2026"})
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_sin_sesion_401(cliente):
    assert cliente.get("/api/v1/estado").status_code == 401
    assert cliente.put("/api/v1/estado/sgc-riesgos", json={"valor": []}).status_code == 401


def test_guardar_y_leer_todo(cliente, cab):
    acs = [{"id": 1, "folio": "AC-2026-001", "estado": "ABIERTO"}]
    r = cliente.put("/api/v1/estado/sgc-acciones-correctivas", headers=cab, json={"valor": acs})
    assert r.status_code == 200 and r.json()["actualizado_por"].startswith("Lic.")
    cliente.put("/api/v1/estado/sgc-indicadores-data", headers=cab, json={"valor": {"1": {"enero": 95}}})
    todo = cliente.get("/api/v1/estado", headers=cab).json()
    assert todo["sgc-acciones-correctivas"]["valor"] == acs
    assert todo["sgc-indicadores-data"]["valor"]["1"]["enero"] == 95
    # sobrescribir: último gana
    cliente.put("/api/v1/estado/sgc-acciones-correctivas", headers=cab, json={"valor": acs + [{"id": 2}]})
    assert len(cliente.get("/api/v1/estado/sgc-acciones-correctivas", headers=cab).json()["valor"]) == 2


def test_clave_invalida_y_valor_string(cliente, cab):
    assert cliente.put("/api/v1/estado/token", headers=cab, json={"valor": 1}).status_code == 422
    assert cliente.put("/api/v1/estado/sgc-dia-limite-captura", headers=cab, json={"valor": "10"}).status_code == 200
    assert cliente.get("/api/v1/estado/sgc-dia-limite-captura", headers=cab).json()["valor"] == "10"
    assert cliente.get("/api/v1/estado/sgc-no-existe", headers=cab).status_code == 404
