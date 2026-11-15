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


def test_pestana_vieja_no_borra_lo_que_otro_agrego(cliente, cab):
    url = "/api/v1/estado/sgc-prueba-fusion"
    base = [{"id": 1, "estado": "EN_SEGUIMIENTO"}]
    cliente.put(url, headers=cab, json={"valor": base})
    # otra persona agrega un registro
    cliente.put(url, headers=cab, json={"valor": base + [{"id": 2}], "base": base, "tiene_base": True})
    # una pestaña que solo conocía "base" cierra el registro 1
    r = cliente.put(url, headers=cab, json={"valor": [{"id": 1, "estado": "CERRADO"}], "base": base, "tiene_base": True})
    assert r.json()["valor"] == [{"id": 1, "estado": "CERRADO"}, {"id": 2}]
    # y un navegador con la versión anterior (sin base) tampoco borra
    r = cliente.put(url, headers=cab, json={"valor": [{"id": 1, "estado": "CERRADO"}]})
    assert len(r.json()["valor"]) == 2



def test_bitacora_del_servidor_registra_cambios(cliente, cab):
    url = "/api/v1/estado/sgc-prueba-bitacora"
    assert cliente.put(url, headers=cab, json={"valor": [{"id": 1, "folio_codigo": "AC#1/2026", "estado": "BORRADOR"}]}).status_code == 200
    base = [{"id": 1, "folio_codigo": "AC#1/2026", "estado": "BORRADOR"}]
    nuevo = [{"id": 1, "folio_codigo": "AC#1/2026", "estado": "EN_SEGUIMIENTO"}]
    assert cliente.put(url, headers=cab, json={"valor": nuevo, "base": base, "tiene_base": True}).status_code == 200
    # guardar lo mismo no ensucia la bitácora
    cliente.put(url, headers=cab, json={"valor": nuevo, "base": nuevo, "tiene_base": True})
    filas = cliente.get("/api/v1/estado/bitacora/servidor?clave=sgc-prueba-bitacora", headers=cab).json()
    assert len(filas) == 2
    assert filas[0]["modificados"] == 1 and filas[0]["detalle"][0]["campos"] == ["estado"]
    assert filas[1]["agregados"] == 1
    assert cliente.get("/api/v1/estado/bitacora/servidor", headers={"Authorization": "Bearer x"}).status_code == 401


def test_formatos_indicadores(cliente, cab):
    import io
    import docx
    import openpyxl
    proy = {"id": "p1", "anio": 2027, "area": "Informática", "nombre": "PROYECTO X", "objetivo": "OBJ",
            "actividades": [{"actividad": "A", "indicador": "IND", "unidad": "Porcentaje", "meta": "95", "trimestres": ["24", "24", "24", "23"], "indicador_id": 7}],
            "presupuesto": {"1000": ["1", "1", "1", "1"]}}
    cliente.put("/api/v1/estado/sgc-proyectos-indicadores", headers=cab, json={"valor": [proy]})
    cliente.put("/api/v1/estado/sgc-indicadores-data", headers=cab, json={"valor": {"resultados": {"7-Feb-2027": {"valor": 96}}}})
    try:
        r = cliente.get("/api/v1/indicadores/formatos/p1/proyecto", headers=cab)
        assert r.status_code == 200 and "PROYECTO X" in docx.Document(io.BytesIO(r.content)).tables[2].rows[0].cells[-1].text
        ficha = docx.Document(io.BytesIO(cliente.get("/api/v1/indicadores/formatos/p1/ficha?actividad=0", headers=cab).content))
        from backend.services.formatos_indicadores import _celdas
        assert [c.text for c in _celdas(ficha.tables[0].rows[19])][2] == "96"  # febrero, desde el Cuadro de Control
        pems = openpyxl.load_workbook(io.BytesIO(cliente.get("/api/v1/indicadores/formatos/p1/pems", headers=cab).content))
        assert pems.worksheets[0]["C17"].value == 0.95
        assert cliente.get("/api/v1/indicadores/formatos/nada/proyecto", headers=cab).status_code == 404
    finally:
        cliente.put("/api/v1/estado/sgc-proyectos-indicadores", headers=cab, json={"valor": []})
        cliente.put("/api/v1/estado/sgc-indicadores-data", headers=cab, json={"valor": {}})


def test_formatos_solo_area_o_sgc():
    from types import SimpleNamespace as U
    from backend.services.permisos import puede_area
    areas = [{"nombre": "Informática", "correo": "inf@x.mx", "encargados_sgc": ["Enc@x.mx"]}]
    assert puede_area(U(rol="Admin", email="a@x.mx", area="Otra"), "Informática", areas)
    assert puede_area(U(rol="Usuario", email="z@x.mx", area="Informática"), "Informática", areas)
    assert puede_area(U(rol="Encargado", email="enc@x.mx", area="Otra"), "Informática", areas)
    assert not puede_area(U(rol="Encargado", email="otro@x.mx", area="Otra"), "Informática", areas)


def _usuario(rol="Encargado", area="Plantas", email="enc@x.mx"):
    from types import SimpleNamespace
    return SimpleNamespace(rol=rol, area=area, email=email)


def test_reglas_ac_pm_en_servidor():
    from backend.services.flujo_reglas import validar_cambio, CLAVE_AC
    enc, adm, aud = _usuario(), _usuario("Admin", "SGC"), _usuario("Auditor", "SGC", "aud@x.mx")
    ac = {"id": 1, "area": "Plantas", "estado": "EN_REVISION", "folio_codigo": "Pendiente de aprobación",
          "actividades_json": '[{"actividad": "A", "evidencia_real": ""}]'}
    con_ev = {**ac, "actividades_json": '[{"actividad": "A", "evidencia_real": "f.pdf"}]'}
    v = lambda antes, despues, u: validar_cambio(CLAVE_AC, antes, despues, u, [])
    # el área no aprueba ni asigna folio
    assert "solo el SGC" in v([ac], [{**ac, "estado": "EN_SEGUIMIENTO"}], enc)
    assert "folios" in v([ac], [{**ac, "folio_codigo": "AC#99/2026"}], enc)
    # el SGC sí; y un folio oficial ya no cambia
    assert v([ac], [{**ac, "estado": "EN_SEGUIMIENTO", "folio_codigo": "AC#28/2026"}], adm) is None
    ofi = {**ac, "estado": "EN_SEGUIMIENTO", "folio_codigo": "AC#28/2026"}
    assert "no se puede cambiar" in v([ofi], [{**ofi, "folio_codigo": "AC#29/2026"}], adm)
    # transición inválida y cierre sin evidencia
    assert "no se puede pasar" in v([ofi], [{**ofi, "estado": "CERRADO_EFECTIVO"}], adm)
    assert "falta evidencia" in v([ofi], [{**ofi, "estado": "SOLICITUD_CIERRE"}], enc)
    assert v([{**con_ev, "estado": "EN_SEGUIMIENTO"}], [{**con_ev, "estado": "SOLICITUD_CIERRE"}], enc) is None
    # asignar auditor exige evidencia aunque sea admin; el dictamen lo da auditor o SGC
    assert "falta evidencia" in v([ofi], [{**ofi, "estado": "REVISION_AUDITOR"}], adm)
    rev = {**con_ev, "estado": "REVISION_AUDITOR", "folio_codigo": "AC#28/2026"}
    assert "auditor" in v([rev], [{**rev, "estado": "CERRADO_EFECTIVO"}], enc)
    assert v([rev], [{**rev, "estado": "CERRADO_EFECTIVO"}], aud) is None
    # cerrado efectivo es terminal; no eficaz lo reabre solo el SGC
    cer = {**rev, "estado": "CERRADO_EFECTIVO"}
    assert "no se puede pasar" in v([cer], [{**cer, "estado": "EN_SEGUIMIENTO"}], adm)
    noef = {**rev, "estado": "CERRADO_NO_EFECTIVO"}
    assert "solo el SGC" in v([noef], [{**noef, "estado": "EN_SEGUIMIENTO"}], aud)
    assert v([noef], [{**noef, "estado": "EN_SEGUIMIENTO"}], adm) is None
    # otra área y eliminación
    otra = _usuario("Encargado", "Jurídico", "j@x.mx")
    assert "otra área" in v([ac], [{**ac, "descripcion": "x"}], otra)
    assert "eliminar" in v([ac], [], enc)
    assert v([ac], [], adm) is None
    # encargado SGC del catálogo de áreas sí puede
    assert validar_cambio(CLAVE_AC, [ac], [{**ac, "descripcion": "x"}], otra, [{"nombre": "Plantas", "encargados_sgc": ["J@x.mx"]}]) is None
    # el SGC dictamina no eficaz desde seguimiento (replanteos agotados)
    assert v([ofi], [{**ofi, "estado": "CERRADO_NO_EFECTIVO"}], adm) is None
    assert "no se puede pasar" in v([ofi], [{**ofi, "estado": "CERRADO_NO_EFECTIVO"}], enc)


def test_reglas_rc_en_servidor():
    from backend.services.flujo_reglas import validar_cambio, CLAVE_RC
    enc, adm = _usuario(), _usuario("Admin", "SGC")
    rc = {"id": 1, "folio": "RC 1-Oct/2026", "area": "Plantas", "estado": "ABIERTA"}
    v = lambda antes, despues, u: validar_cambio(CLAVE_RC, antes, despues, u, [])
    assert "repetido" in v([rc], [rc, {**rc, "id": 2}], adm)
    assert "dictaminan" in v([rc], [{**rc, "estado": "CERRADO_EFECTIVO"}], enc)
    assert v([rc], [{**rc, "estado": "CERRADO_EFECTIVO"}], adm) is None
    assert v([rc], [{**rc, "accion": "se corrigió"}], enc) is None
    cer = {**rc, "estado": "CERRADO_EFECTIVO"}
    assert "no se puede pasar" in v([cer], [{**cer, "estado": "EN_ATENCION"}], adm)
    assert "no se puede cambiar" in v([rc], [{**rc, "folio": "RC 2-Oct/2026"}], adm)


def test_folios_atomicos(cliente, cab):
    r0 = cliente.put("/api/v1/estado/sgc-acciones-correctivas", headers=cab, json={"valor": [{"id": 1, "folio_codigo": "AC#27/2026", "estado": "EN_SEGUIMIENTO", "area": "X"}]})
    assert r0.status_code == 200, r0.text
    anio = __import__("datetime").date.today().year
    r = cliente.post("/api/v1/folios/AC", headers=cab).json()
    primero = r["folios"][0]["numero"]
    assert primero >= 28 or anio != 2026
    r2 = cliente.post("/api/v1/folios/AC?cantidad=2", headers=cab).json()
    assert [f["numero"] for f in r2["folios"]] == [primero + 1, primero + 2]
    assert r2["folios"][0]["codigo"] == f"AC#{primero + 1}/{anio}"
    assert cliente.post("/api/v1/folios/XX", headers=cab).status_code == 422
    # el contador ya no se escribe desde el navegador
    assert cliente.put("/api/v1/estado/sgc-config-folios", headers=cab, json={"valor": {"AC": {"2026": 1}}}).status_code == 409
    cliente.put("/api/v1/estado/sgc-acciones-correctivas", headers=cab, json={"valor": []})


def test_reglas_matriz_de_riesgos_en_servidor():
    from backend.services.flujo_reglas import validar_cambio, CLAVE_MATRICES, CLAVE_RIESGOS, CLAVE_PM
    enc, adm = _usuario(), _usuario("Admin", "SGC")
    m = {"id": "Plantas|2027", "area": "Plantas", "anio": 2027, "estado": "BORRADOR"}
    v = lambda antes, despues, u: validar_cambio(CLAVE_MATRICES, antes, despues, u, [])
    assert v([], [m], enc) is None
    assert v([m], [{**m, "estado": "ENVIADA"}], enc) is None
    env = {**m, "estado": "ENVIADA"}
    assert "solo el SGC" in v([env], [{**env, "estado": "ACEPTADA"}], enc)
    assert v([env], [{**env, "estado": "ACEPTADA", "observaciones": []}], adm) is None
    acep = {**env, "estado": "ACEPTADA"}
    assert "no se puede pasar" in v([acep], [{**acep, "estado": "ENVIADA"}], adm)
    assert "ya no la modifica" in v([env], [{**env, "nota": "x"}], enc)
    assert "no se eliminan" in v([{**env, "observaciones": [{"texto": "a"}]}], [{**env, "observaciones": []}], adm)
    assert "no corresponde" in v([], [{**m, "id": "Otra|2027"}], adm)
    # riesgos
    r = {"id": 1, "area": "Plantas", "anio": 2027, "tipo": "Riesgo", "probabilidad": 3, "impacto": 6, "estado": "IDENTIFICADO"}
    vr = lambda antes, despues, u, mats=(), pls=(): validar_cambio(CLAVE_RIESGOS, antes, despues, u, [], {"matrices": list(mats), "planes": list(pls)})
    assert vr([], [r], enc) is None
    assert "probabilidad" in vr([], [{**r, "probabilidad": 7}], enc)
    assert "impacto" in vr([], [{**r, "impacto": 5}], enc)
    assert "Tratamiento inválido" in vr([], [{**r, "tratamiento": "Aprovechar"}], enc)
    assert "ya no la modifica" in vr([r], [{**r, "descripcion": "x"}], enc, [env])
    assert vr([r], [{**r, "descripcion": "x"}], adm, [env]) is None
    assert "solo el SGC" in vr([r], [{**r, "pm_id": 9}], enc)
    assert "otra área" in vr([r], [{**r, "descripcion": "x"}], _usuario("Encargado", "Jurídico", "j@x.mx"))
    trat = {**r, "estado": "EN_TRATAMIENTO", "pm_id": 9}
    assert "sigue abierto" in vr([trat], [{**trat, "estado": "CERRADO_EFICAZ", "dictamen": {"resultado": "EFICAZ", "nota": "bajó el nivel claramente"}}], adm, [], [{"id": 9, "estado": "EN_SEGUIMIENTO"}])
    assert vr([trat], [{**trat, "estado": "CERRADO_EFICAZ", "dictamen": {"resultado": "EFICAZ", "nota": "bajó el nivel claramente"}}], adm, [], [{"id": 9, "estado": "CERRADO_EFECTIVO"}]) is None
    assert "nota" in vr([trat], [{**trat, "estado": "CERRADO_EFICAZ", "dictamen": {"resultado": "EFICAZ", "nota": "ok"}}], adm, [], [{"id": 9, "estado": "CERRADO_EFECTIVO"}])
    # PM ligados a riesgo: solo el SGC y sin duplicados activos
    pm = {"id": 1, "area": "Plantas", "estado": "EN_SEGUIMIENTO", "riesgo_id": 1, "folio_codigo": "OM#1/2027"}
    assert "genera el SGC" in validar_cambio(CLAVE_PM, [], [{**pm, "folio_codigo": "Pendiente"}], enc, [])
    assert "dos planes" in validar_cambio(CLAVE_PM, [pm], [pm, {**pm, "id": 2, "folio_codigo": "OM#2/2027"}], adm, [])
    assert validar_cambio(CLAVE_PM, [pm], [{**pm, "estado": "CERRADO_NO_EFECTIVO"}, {**pm, "id": 2, "folio_codigo": "OM#2/2027"}], adm, []) is None
