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


def test_renovacion_solo_oct_dic_y_una_vez_por_mes():
    proy = [{"id": "a", "anio": 2026, "area": "Contabilidad", "estado": "APROBADO", "nombre": "P1"},
            {"id": "b", "anio": 2026, "area": "Informática", "estado": "APROBADO", "nombre": "P2"},
            {"id": "c", "anio": 2027, "area": "Informática", "estado": "BORRADOR", "nombre": "P2"},
            {"id": "d", "anio": 2026, "area": "Jurídico", "estado": "BORRADOR", "nombre": "P3"}]
    assert m.avisos_renovacion(proy, date(2026, 9, 30), set()) == []
    r = m.avisos_renovacion(proy, date(2026, 10, 5), set())
    assert [x["unidad"] for x in r] == ["Contabilidad"]  # Informática ya tiene 2027; Jurídico no está aprobado
    assert r[0]["etapa"] == "RENOVACION_OCT" and r[0]["periodo"] == "2027"
    assert m.avisos_renovacion(proy, date(2026, 10, 20), {("Contabilidad", "2027", "RENOVACION_OCT")}) == []
    assert m.avisos_renovacion(proy, date(2026, 12, 1), {("Contabilidad", "2027", "RENOVACION_OCT")})[0]["etapa"] == "RENOVACION_DIC"


def test_correos_responsables_como_texto_o_lista():
    usuarios = [{"email": "a@x.mx", "nombre": "A"}, {"email": "b@y.gob.mx", "nombre": "B"}]
    assert m.destinatarios_registro({"correos_responsables": "a@x.mx, b@y.gob.mx"}, [], usuarios) == ["a@x.mx", "b@y.gob.mx"]
    assert m.destinatarios_registro({"correos_responsables": ["a@x.mx", "", None]}, [], usuarios) == ["a@x.mx"]
    assert m.destinatarios_registro({"correos_responsables": None}, [], usuarios) == []


USUARIOS = [{"email": "jenriquez@x.mx", "nombre": "Ing. Javier Enríquez"}, {"email": "imoreno@x.mx", "nombre": "Irasema Moreno Espinoza"},
            {"email": "agalvez@x.mx", "nombre": "Aracely Galvez"}]


def test_destinatarios_area_apoyo_equipo_y_directorio():
    import json
    reg = {"correos_responsables": ["jaenriquez@x.mx", "agalvez@x.mx"],  # el primero no existe en el directorio
           "equipo_json": json.dumps([{"nombre": "Javier Enriquez"}, {"nombre": "Irasema Moreno"}, {"nombre": "Persona Externa"}])}
    para = m.destinatarios_registro(reg, ["titular@x.mx", "apoyo@x.mx"], USUARIOS)
    # área (titular y quien le ayuda) + equipo encontrado en el directorio por nombre (sin títulos ni acentos) + responsables válidos
    assert para == ["agalvez@x.mx", "apoyo@x.mx", "imoreno@x.mx", "jenriquez@x.mx", "titular@x.mx"]
    # plan de mejora: el equipo viene en "integrantes"
    assert m.destinatarios_registro({"integrantes": [{"nombre": "Aracely Gálvez"}]}, [], USUARIOS) == ["agalvez@x.mx"]


def test_temas_de_correo_por_administrador():
    admins = ["a@x.mx", "B@x.mx"]
    assert m.admins_con_tema(admins, {}, "resumen") == admins           # sin configurar: reciben todo
    prefs = {"b@x.mx": {"resumen": False}}
    assert m.admins_con_tema(admins, prefs, "resumen") == ["a@x.mx"]
    assert m.admins_con_tema(admins, prefs, "incumplimiento") == admins


def test_aviso_al_auditor_asignado_una_sola_vez():
    reg = {"id": 7, "folio_codigo": "AC#18/2026", "estado": "REVISION_AUDITOR", "auditor_email": "agalvez@x.mx",
           "fecha_asignacion_auditor": "2026-11-10T10:00:00Z"}
    r = m.avisos_auditor([reg, {**reg, "id": 8, "estado": "EN_SEGUIMIENTO"}], set())
    assert [(x["id"], x["referencia"]) for x in r] == [(7, "2026-11-10")]
    assert m.avisos_auditor([reg], {("7", "2026-11-10", "AUDITOR_ASIGNADO")}) == []
    # reasignado otro día: se avisa al nuevo
    assert len(m.avisos_auditor([{**reg, "fecha_asignacion_auditor": "2026-11-20"}], {("7", "2026-11-10", "AUDITOR_ASIGNADO")})) == 1


def test_planes_de_mejora_usan_area_o_gerencia():
    pm = {"id": 3, "folio_codigo": "OM#2/2026", "gerencia_coordinacion": "Jurídico", "estado": "EN_SEGUIMIENTO", "fecha_seguimiento": "2026-11-30"}
    r = m.avisos_acciones([pm], date(2026, 11, 20), date(2026, 11, 14), set())
    assert r[0]["area"] == "Jurídico"


def test_avisos_de_matriz_solo_a_unidades_que_no_la_enviaron():
    from backend.services import avisos_calendario as cal
    p = cal.normalizar({})
    unidades = ["Plantas", "Jurídico", "Comercial"]
    matrices = [{"id": "Plantas|2027", "estado": "ENVIADA"}, {"id": "Jurídico|2027", "estado": "OBSERVADA"}]
    r = m.avisos_matrices(unidades, matrices, date(2027, 2, 11), set(), p)
    assert [(x["unidad"], x["etapa"]) for x in r] == [("Comercial", "RECORDATORIO_15"), ("Jurídico", "RECORDATORIO_15")]
    assert r[0]["periodo"] == "2027" and r[0]["fecha_limite"] == date(2027, 2, 26)
    assert m.avisos_matrices(unidades, matrices, date(2027, 2, 11), {("Comercial", "2027", "RECORDATORIO_15")}, p)[0]["unidad"] == "Jurídico"
    # fuera del periodo (p. ej. noviembre) no sale nada, ni siquiera el incumplimiento atrasado
    assert m.avisos_matrices(unidades, matrices, date(2026, 11, 30), set(), p) == []
    assert m.avisos_matrices(unidades, [], date(2027, 3, 10), set(), p) == []
    # un periodo que terminó antes del arranque de los avisos no entra
    assert m.avisos_matrices(unidades, [], date(2027, 1, 4), set(), p, arranque=date(2027, 3, 5)) == []
