"""Calendario de recordatorios: fines de semana, indicadores (ejemplo de @human) y etapa del día."""
from datetime import date

from backend.services import avisos_calendario as cal


def test_ejemplo_indicadores_cuando_el_10_es_sabado():
    # Octubre 2026: el 10 es sábado (ejemplo dado por @human: 9 recordatorio, 12 exhorto, 16 oficio)
    assert date(2026, 10, 10).weekday() == 5
    etapas = dict(cal.etapas_indicadores(2026, 10))
    assert etapas["ULTIMO_RECORDATORIO"] == date(2026, 10, 9)
    assert etapas["AVISO_INCUMPLIMIENTO"] == date(2026, 10, 12)
    assert etapas["OFICIO_EXHORTO"] == date(2026, 10, 16)
    assert etapas["AVISO"] == date(2026, 10, 1)  # jueves


def test_aviso_en_fin_de_semana_pasa_al_lunes():
    # Noviembre 2026: el 1 es domingo → lunes 2
    assert dict(cal.etapas_indicadores(2026, 11))["AVISO"] == date(2026, 11, 2)


def test_vencimiento_de_accion():
    # vence el lunes 30 nov 2026: recordatorios 15/10/5 días antes, exhorto martes 1 dic, oficio 6 dic (dom) → lun 7
    e = dict(cal.etapas_vencimiento(date(2026, 11, 30)))
    assert e["RECORDATORIO_15"] == date(2026, 11, 13)          # viernes
    assert e["RECORDATORIO_10"] == date(2026, 11, 20)          # viernes
    assert e["RECORDATORIO_5"] == date(2026, 11, 25)           # miércoles
    assert e["VENCE_HOY"] == date(2026, 11, 30)                # el mismo día también se recuerda
    assert e["AVISO_INCUMPLIMIENTO"] == date(2026, 12, 1)
    assert e["OFICIO_EXHORTO"] == date(2026, 12, 7)
    # recordatorio que cae en domingo se adelanta al viernes
    assert dict(cal.etapas_vencimiento(date(2026, 12, 7)))["RECORDATORIO_15"] == date(2026, 11, 20)
    # vencimiento en sábado se recorre al lunes
    assert dict(cal.etapas_vencimiento(date(2026, 11, 28)))["AVISO_INCUMPLIMIENTO"] == date(2026, 12, 1)


def test_etapa_de_hoy_no_repite_ni_manda_atrasadas():
    etapas = cal.etapas_vencimiento(date(2026, 11, 30))
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 12)) is None
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 13)) == "RECORDATORIO_15"
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 13), ["RECORDATORIO_15"]) is None
    # dado de alta tarde (ya pasó el de 15 y 10): solo el más reciente
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 23)) == "RECORDATORIO_10"
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 14)) is None  # sábado: no sale nada
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 30), ["RECORDATORIO_5"]) == "VENCE_HOY"
    assert cal.etapa_de_hoy(etapas, date(2026, 12, 1), ["VENCE_HOY"]) == "AVISO_INCUMPLIMIENTO"


def test_parametros_editables_con_valores_base():
    p = cal.normalizar({})
    assert p["registros"]["recordatorios_antes"] == [15, 10, 5] and p["indicadores"]["ULTIMO_RECORDATORIO"] == 10
    # sin parámetros, mismo calendario que antes
    assert cal.etapas_vencimiento(date(2026, 11, 30), p) == cal.etapas_vencimiento(date(2026, 11, 30))


def test_recordatorio_extra_y_feriado():
    p = cal.normalizar({"registros": {"recordatorios_antes": [30, 15, 10, 5, 2]}, "feriados": ["2026-11-27"]})
    e = dict(cal.etapas_vencimiento(date(2026, 12, 29), p))
    assert e["RECORDATORIO_30"] == date(2026, 11, 27 - 1)   # 29/11 es domingo → viernes 27 es feriado → jueves 26
    assert e["RECORDATORIO_2"] == date(2026, 12, 25)
    assert not cal.es_habil(date(2026, 11, 27), p)
    # sin aviso el día que vence
    sin = cal.normalizar({"registros": {"vence_hoy": False}})
    assert "VENCE_HOY" not in dict(cal.etapas_vencimiento(date(2026, 11, 30), sin))


def test_indicadores_con_recordatorio_extra():
    p = cal.normalizar({"indicadores": {"recordatorios_extra": [8]}})
    e = cal.etapas_indicadores(2026, 12, p)
    assert ("RECORDATORIO_D8", date(2026, 12, 8)) in e
    assert [x for x, _ in e] == sorted([x for x, _ in e], key=lambda x: dict(e)[x])  # en orden de fecha


def test_parametros_invalidos_vuelven_al_valor_base():
    p = cal.normalizar({"registros": {"recordatorios_antes": ["x", -3, 500], "dias_aviso_despues": "abc"},
                        "indicadores": {"AVISO": 40}, "feriados": ["no-es-fecha"]})
    assert p["registros"]["recordatorios_antes"] == [15, 10, 5]
    assert p["registros"]["dias_aviso_despues"] == 1
    assert p["indicadores"]["AVISO"] == 1
    assert p["feriados"] == frozenset()


def test_matriz_se_captura_en_enero_y_febrero():
    p = cal.normalizar({})
    e = dict(cal.etapas_matriz(2027, p))
    assert e["INICIO_CAPTURA"] == date(2027, 1, 1)          # viernes 1 de enero
    assert e["VENCE_HOY"] == date(2027, 2, 26)              # 28/feb/2027 es domingo -> viernes 26
    assert e["RECORDATORIO_15"] == date(2027, 2, 11)
    assert e["RECORDATORIO_5"] == date(2027, 2, 19)
    assert e["AVISO_INCUMPLIMIENTO"] == date(2027, 3, 1)
    assert dict(cal.etapas_matriz(2028, p))["VENCE_HOY"] == date(2028, 2, 29)   # bisiesto
    # apagado desde Configuración: sin avisos
    assert cal.etapas_matriz(2027, cal.normalizar({"matrices": {"activo": False}})) == []
