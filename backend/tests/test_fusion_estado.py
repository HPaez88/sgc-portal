"""Fusión a 3 vías: un navegador con datos viejos no borra ni revierte lo que otros guardaron."""
from backend.services.fusion_estado import fusionar, fusionar_sin_base


def test_caso_real_ac27_no_se_pierde():
    base = [{"id": 1, "folio": "AC#17", "estado": "EN_SEGUIMIENTO"}]
    servidor = base + [{"id": 2, "folio": "AC#27", "estado": "EN_SEGUIMIENTO"}]  # otro agregó AC#27
    mio = [{"id": 1, "folio": "AC#17", "estado": "CERRADO_EFECTIVO"}]          # yo cerré AC#17 sin ver AC#27
    r = fusionar(base, mio, servidor)
    assert [x["folio"] for x in r] == ["AC#17", "AC#27"] and r[0]["estado"] == "CERRADO_EFECTIVO"


def test_campos_distintos_del_mismo_registro_se_conservan():
    base = [{"id": 1, "estado": "A", "fecha": "2026-12-01"}]
    servidor = [{"id": 1, "estado": "A", "fecha": "2026-12-18"}]   # otro movió la fecha
    mio = [{"id": 1, "estado": "B", "fecha": "2026-12-01"}]        # yo cambié el estado
    assert fusionar(base, mio, servidor) == [{"id": 1, "estado": "B", "fecha": "2026-12-18"}]


def test_borrado_propio_se_respeta_y_ajeno_no_revive_lo_mio():
    base = [{"id": 1}, {"id": 2}]
    assert fusionar(base, [{"id": 2}], base) == [{"id": 2}]
    assert fusionar(base, base, [{"id": 1}]) == [{"id": 1}]


def test_diccionarios_por_clave():
    base = {"a": 1, "b": 1}
    assert fusionar(base, {"a": 2, "b": 1}, {"a": 1, "b": 3, "c": 4}) == {"a": 2, "b": 3, "c": 4}


def test_sin_base_no_borra_registros_ajenos():
    assert fusionar_sin_base([{"id": 1, "x": 2}], [{"id": 1, "x": 1}, {"id": 2}]) == [{"id": 1, "x": 2}, {"id": 2}]


def test_bitacora_solo_agrega_nunca_borra():
    from backend.services.fusion_estado import solo_agregar
    actual = [{"id": "B", "timestamp": "2026-11-19T10:00:00Z"}, {"id": "A", "timestamp": "2026-11-18T10:00:00Z"}]
    # un navegador con copia vieja manda solo su movimiento nuevo + "A": "B" no se pierde
    nuevo = [{"id": "C", "timestamp": "2026-11-20T10:00:00Z"}, {"id": "A", "timestamp": "2026-11-18T10:00:00Z", "descripcion": "alterada"}]
    r = solo_agregar(actual, nuevo)
    assert [x["id"] for x in r] == ["C", "B", "A"]
    assert "descripcion" not in r[2]          # lo ya registrado no se modifica
    assert solo_agregar(actual, []) == actual  # mandar vacío no borra nada
    assert solo_agregar(None, nuevo)[0]["id"] == "C"
