"""Bitácora del servidor: resumen de cambios por registro y campo."""
from backend.services.auditoria import resumen_cambio, hay_cambio


def test_listas_por_id_con_campos():
    antes = [{"id": 1, "folio_codigo": "AC#1/2026", "estado": "BORRADOR"}, {"id": 2, "folio_codigo": "AC#2/2026"}]
    despues = [{"id": 1, "folio_codigo": "AC#1/2026", "estado": "EN_SEGUIMIENTO"}, {"id": 3, "nombre": "Nuevo"}]
    r = resumen_cambio(antes, despues)
    assert (r["agregados"], r["modificados"], r["eliminados"]) == (1, 1, 1)
    mod = next(d for d in r["detalle"] if d["accion"] == "modificado")
    assert mod["registro"] == "AC#1/2026" and mod["campos"] == ["estado"]
    assert any(d["accion"] == "eliminado" and d["registro"] == "AC#2/2026" for d in r["detalle"])


def test_diccionarios_y_sin_cambio():
    r = resumen_cambio({"32": {"v": 1}, "33": {"v": 2}}, {"32": {"v": 9}, "70": {"v": 3}})
    assert (r["agregados"], r["modificados"], r["eliminados"]) == (1, 1, 1)
    assert not hay_cambio(resumen_cambio([{"id": 1}], [{"id": 1}]))
    assert hay_cambio(resumen_cambio("a", "b"))
