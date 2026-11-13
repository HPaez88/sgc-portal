"""Calendario de recordatorios: fines de semana, indicadores (ejemplo de @human) y etapa del día."""
from datetime import date

from backend.services import avisos_calendario as cal


def test_ejemplo_indicadores_cuando_el_10_es_sabado():
    # Octubre 2026: el 10 es sábado (ejemplo dado por @human: 9 recordatorio, 12 exhorto, 16 oficio)
    assert date(2026, 10, 10).weekday() == 5
    etapas = dict(cal.etapas_indicadores(2026, 10))
    assert etapas["ULTIMO_RECORDATORIO"] == date(2026, 10, 9)
    assert etapas["EXHORTO"] == date(2026, 10, 12)
    assert etapas["OFICIO"] == date(2026, 10, 16)
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
    assert e["EXHORTO"] == date(2026, 12, 1)
    assert e["OFICIO"] == date(2026, 12, 7)
    # recordatorio que cae en domingo se adelanta al viernes
    assert dict(cal.etapas_vencimiento(date(2026, 12, 7)))["RECORDATORIO_15"] == date(2026, 11, 20)
    # vencimiento en sábado se recorre al lunes
    assert dict(cal.etapas_vencimiento(date(2026, 11, 28)))["EXHORTO"] == date(2026, 12, 1)


def test_etapa_de_hoy_no_repite_ni_manda_atrasadas():
    etapas = cal.etapas_vencimiento(date(2026, 11, 30))
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 12)) is None
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 13)) == "RECORDATORIO_15"
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 13), ["RECORDATORIO_15"]) is None
    # dado de alta tarde (ya pasó el de 15 y 10): solo el más reciente
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 23)) == "RECORDATORIO_10"
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 14)) is None  # sábado: no sale nada
    assert cal.etapa_de_hoy(etapas, date(2026, 11, 30), ["RECORDATORIO_5"]) == "VENCE_HOY"
    assert cal.etapa_de_hoy(etapas, date(2026, 12, 1), ["VENCE_HOY"]) == "EXHORTO"
