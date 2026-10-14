"""Flujo de aprobación del Manual: borrador → revisión (otro admin) → publicación (Director). SQLite temporal."""
import os
import tempfile

import pytest

_TMP = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test_docs.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["SEED_ADMIN_PASSWORD"] = "ClaveInicial2026"
os.environ.pop("CLAMAV_HOST", None)

from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402

ADMIN = "hpaez@oomapasc.gob.mx"
CLAVE = "OOMLSC-01"


@pytest.fixture(scope="module")
def cliente():
    with TestClient(app) as c:
        yield c


def _cab(cliente, email, password):
    r = cliente.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def actores(cliente):
    """Super Admin (autor), un Admin (revisor), un Director (aprobador) y un Usuario (solo lectura)."""
    superadmin = _cab(cliente, ADMIN, "ClaveInicial2026")
    creados = {}
    for email, rol in (("revisor@oomapasc.gob.mx", "Admin"), ("director@oomapasc.gob.mx", "Director"), ("lector@oomapasc.gob.mx", "Usuario")):
        r = cliente.post("/api/v1/auth/usuarios", headers=superadmin, json={"nombre": f"Persona {rol}", "email": email, "area": "SGC", "rol": rol})
        assert r.status_code == 201, r.text
        temporal = r.json()["password_temporal"]
        cab = _cab(cliente, email, temporal)
        cliente.post("/api/v1/auth/cambiar-password", headers=cab, json={"password_actual": temporal, "password_nueva": "Clave-Definitiva-1"})
        creados[rol] = _cab(cliente, email, "Clave-Definitiva-1")
    return {"autor": superadmin, "revisor": creados["Admin"], "director": creados["Director"], "lector": creados["Usuario"]}


def test_manual_sembrado_como_revision_publicada(cliente, actores):
    r = cliente.get(f"/api/v1/documentos/{CLAVE}", headers=actores["lector"])
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["tipo"] == "manual" and d["ruta_aprobacion"] == "dos_pasos"
    assert d["vigente"]["estado"] == "PUBLICADO" and d["vigente"]["numero"] == 75 and d["vigente"]["hash"]
    assert len(d["vigente"]["secciones"]) > 60
    assert any(a["clave"] == "OOMLSC-A19" for a in cliente.get("/api/v1/documentos", headers=actores["lector"]).json())


def test_usuario_normal_no_puede_abrir_borrador(cliente, actores):
    assert cliente.post(f"/api/v1/documentos/{CLAVE}/borrador", headers=actores["lector"]).status_code == 403


def test_flujo_completo_dos_pasos(cliente, actores):
    autor, revisor, director = actores["autor"], actores["revisor"], actores["director"]
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor)
    assert r.status_code == 201, r.text
    secciones = r.json()["secciones"]
    assert r.json()["numero"] == 76
    # enviar sin cambios se rechaza
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/enviar", headers=autor, json={"motivo": "Actualización por auditoría interna"})
    assert r.status_code == 422
    secciones[1]["markdown"] += "\n\nPárrafo agregado en la revisión 76."
    assert cliente.put(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor, json={"secciones": secciones}).status_code == 200
    # motivo obligatorio
    assert cliente.post(f"/api/v1/documentos/{CLAVE}/enviar", headers=autor, json={"motivo": "corto"}).status_code == 422
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/enviar", headers=autor, json={"motivo": "Actualización por auditoría interna 2026"})
    assert r.status_code == 200 and r.json()["estado"] == "EN_REVISION"
    # el autor no se revisa a sí mismo; el director no puede publicar antes de la revisión
    assert cliente.post(f"/api/v1/documentos/{CLAVE}/revisar", headers=autor, json={"aprobado": True}).status_code == 403
    assert cliente.post(f"/api/v1/documentos/{CLAVE}/publicar", headers=director, json={"aprobado": True}).status_code == 409
    # mientras está en revisión no se edita
    assert cliente.put(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor, json={"secciones": secciones}).status_code == 409
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/revisar", headers=revisor, json={"aprobado": True, "comentario": "Conforme"})
    assert r.status_code == 200 and r.json()["estado"] == "REVISADO"
    # el revisor (Admin) no puede publicar; el Director sí
    assert cliente.post(f"/api/v1/documentos/{CLAVE}/publicar", headers=revisor, json={"aprobado": True}).status_code == 403
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/publicar", headers=director, json={"aprobado": True})
    assert r.status_code == 200 and r.json()["estado"] == "PUBLICADO" and r.json()["hash"]
    d = cliente.get(f"/api/v1/documentos/{CLAVE}", headers=actores["lector"]).json()
    assert d["vigente"]["numero"] == 76 and d["abierta"] is None
    assert "Párrafo agregado" in d["vigente"]["secciones"][1]["markdown"]
    # historial y diff
    hist = cliente.get(f"/api/v1/documentos/{CLAVE}/revisiones", headers=actores["lector"]).json()
    assert [h["numero"] for h in hist][:2] == [76, 75] and hist[1]["estado"] == "OBSOLETO"
    diff = cliente.get(f"/api/v1/documentos/{CLAVE}/diff", headers=actores["lector"], params={"de": hist[1]["id"], "a": hist[0]["id"]}).json()
    assert len(diff["secciones"]) == 1 and diff["secciones"][0]["cambio"] == "modificada"
    assert any(l["tipo"] == "+" and "Párrafo agregado" in l["texto"] for l in diff["secciones"][0]["lineas"])


def test_rechazo_regresa_a_borrador_editable(cliente, actores):
    autor, revisor = actores["autor"], actores["revisor"]
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor)
    secciones = r.json()["secciones"]
    secciones[0]["markdown"] += "\n\nCambio que será rechazado."
    cliente.put(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor, json={"secciones": secciones})
    cliente.post(f"/api/v1/documentos/{CLAVE}/enviar", headers=autor, json={"motivo": "Prueba de rechazo con comentario"})
    r = cliente.post(f"/api/v1/documentos/{CLAVE}/revisar", headers=revisor, json={"aprobado": False, "comentario": "Falta cita a la cláusula"})
    assert r.status_code == 200 and r.json()["estado"] == "RECHAZADO" and "cláusula" in r.json()["comentario"]
    assert cliente.put(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor, json={"secciones": secciones}).status_code == 200
    assert cliente.delete(f"/api/v1/documentos/{CLAVE}/borrador", headers=autor).status_code == 204
    assert cliente.get(f"/api/v1/documentos/{CLAVE}", headers=autor).json()["abierta"] is None
