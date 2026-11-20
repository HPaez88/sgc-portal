"""Agrupación del registro del servidor: días del mes en curso, meses cerrados del año y años anteriores."""
from datetime import date, datetime

from backend.services.bitacora_grupos import agrupar, rango_utc


def test_dias_del_mes_meses_cerrados_y_anios():
    hoy = date(2026, 11, 20)
    # fechas en UTC; Cajeme es UTC-7: 2026-11-20 03:00 UTC = 19/11 20:00 local
    filas = [(datetime(2026, 11, 20, 18), 1, 0, 0), (datetime(2026, 11, 20, 3), 0, 2, 0), (datetime(2026, 11, 2, 18), 0, 1, 0),
             (datetime(2026, 10, 15, 18), 1, 0, 1), (datetime(2026, 1, 5, 18), 0, 1, 0), (datetime(2025, 12, 31, 18), 0, 0, 3)]
    g = agrupar(filas, hoy)
    assert [x["id"] for x in g] == ["2026-11-20", "2026-11-19", "2026-11-02", "2026-10", "2026-01", "2025"]
    assert g[0]["tipo"] == "dia" and g[3]["tipo"] == "mes" and g[5]["tipo"] == "anio"
    assert g[1]["modificados"] == 2 and g[3]["cambios"] == 1 and g[3]["eliminados"] == 1
    assert g[3]["etiqueta"] == "Octubre 2026" and g[5]["etiqueta"] == "Año 2025"


def test_rango_de_un_grupo_en_utc():
    assert rango_utc("2026-11-19") == (datetime(2026, 11, 19, 7), datetime(2026, 11, 20, 7))
    assert rango_utc("2026-10") == (datetime(2026, 10, 1, 7), datetime(2026, 11, 1, 7))
    assert rango_utc("2025") == (datetime(2025, 1, 1, 7), datetime(2026, 1, 1, 7))
