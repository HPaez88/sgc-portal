"""Motor de avisos: qué acciones e indicadores tocan cada día."""
from datetime import date

from backend.services import avisos_motor as m

AC = {"id": 1, "folio_codigo": "AC#1/2026", "area": "Plantas", "estado": "EN_SEGUIMIENTO", "fecha_seguimiento": "2026-11-30"}


def test_acciones_por_etapa_y_exclusiones():
    arranque = date(2026, 11, 14)
    r = m.avisos_acciones([AC], date(2026, 11, 20), arranque, set())
    assert r[0]["etapa"] == "RECORDATORIO_10"
    # ya enviado ese día: nada
    assert m.avisos_acciones([AC], date(2026, 11, 20), arranque, {(1, "2026-11-30", "RECORDATORIO_10")}) == []
    # con auditor asignado o en revisión: nada
    assert m.avisos_acciones([{**AC, "auditor_email": "a@x.mx"}], date(2026, 11, 20), arranque, set()) == []
    assert m.avisos_acciones([{**AC, "estado": "REVISION_AUDITOR"}], date(2026, 11, 20), arranque, set()) == []
    # vencida antes del arranque: no entra
    assert m.avisos_acciones([{**AC, "fecha_seguimiento": "2026-10-01"}], date(2026, 11, 20), arranque, set()) == []
    # día siguiente al vencimiento: aviso de incumplimiento
    assert m.avisos_acciones([AC], date(2026, 12, 1), arranque, {(1, "2026-11-30", "VENCE_HOY")})[0]["etapa"] == "AVISO_INCUMPLIMIENTO"


def test_indicadores_por_periodicidad_y_entrega():
    cat = [
        {"id": 1, "nombre": "Mensual A", "area": "Plantas", "periodicidad": "Mensual"},
        {"id": 2, "nombre": "Trimestral", "area": "Plantas", "periodicidad": "Trimestral"},
        {"id": 3, "nombre": "Mensual B", "area": "Comercial", "periodicidad": "Mensual"},
    ]
    # 2 de noviembre (lunes; el 1 es domingo): aviso del resultado de octubre a todos los que deben entregar
    r = m.avisos_indicadores(cat, {}, date(2026, 11, 2), set())
    assert [(x["unidad"], x["etapa"], [i["id"] for i in x["indicadores"]]) for x in r] == [("Comercial", "AVISO", [3]), ("Plantas", "AVISO", [1])]
    # 11 de noviembre: aviso de incumplimiento solo a quien no entregó
    resultados = {"1-Oct-2026": {"valor": 5}}
    r = m.avisos_indicadores(cat, resultados, date(2026, 11, 11), set())
    assert [x["unidad"] for x in r] == ["Comercial"] and r[0]["etapa"] == "AVISO_INCUMPLIMIENTO"
    # octubre (resultado de septiembre) incluye el trimestral
    assert {i["id"] for x in m.avisos_indicadores(cat, {}, date(2026, 10, 1), set()) for i in x["indicadores"]} == {1, 2, 3}
    # enero pide diciembre del año anterior
    assert m.mes_reportado(date(2027, 1, 4)) == (2026, 12)


def test_indicadores_empiezan_el_primer_mes_despues_del_arranque():
    cat = [{"id": 1, "nombre": "Mensual", "area": "Plantas", "periodicidad": "Mensual"}]
    arranque = date(2026, 11, 16)
    assert m.avisos_indicadores(cat, {}, date(2026, 11, 16), set(), arranque) == []   # ciclo de noviembre: no
    assert m.avisos_indicadores(cat, {}, date(2026, 12, 1), set(), arranque)[0]["etapa"] == "AVISO"


def test_catalogo_vivo_toma_altas_reasignaciones_y_proyecto():
    base = [{"id": 1, "nombre": "A", "area": "Plantas", "periodicidad": "Mensual"}]
    pers = {"1": {"id": 1, "area": "Comercial"}, "101": {"id": 101, "nombre": "Nuevo", "area": "Informática", "periodicidad": "Mensual"}}
    proys = [{"anio": 2027, "estado": "APROBADO", "actividades": [{"indicador_id": "1", "periodicidad": "Trimestral"}]}]
    cat = {i["id"]: i for i in m.catalogo_vivo(base, pers, proys, date(2027, 2, 1))}
    assert cat[1]["area"] == "Comercial" and cat[1]["periodicidad"] == "Trimestral" and 101 in cat
    assert m.catalogo_vivo(base, pers, proys, date(2026, 11, 2))[0]["periodicidad"] == "Mensual"  # proyecto 2027 no aplica a 2026
