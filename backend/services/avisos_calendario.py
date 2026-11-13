"""
avisos_calendario.py — Calendario de recordatorios, exhortos y oficios del SGC (lógica pura, probada).

Reglas acordadas con @human (2026-11-14):
- Los correos salen solo de lunes a viernes.
- Acciones correctivas / planes de mejora (incluye los planes que vienen de la matriz de riesgos):
  recordatorios 15, 10 y 5 días antes (si cae en fin de semana se ADELANTA al viernes anterior) y el
  mismo día del vencimiento ("vence hoy"); al día siguiente, AVISO DE INCUMPLIMIENTO por correo (advierte que
  Dirección General emitirá oficio de exhorto) y 5 días después el OFICIO DE EXHORTO impreso: lo emite y firma
  el Director General en turno, dirigido al gerente del área (encargados) con copia al director del área
  (fin de semana → lunes siguiente). La fecha de vencimiento nunca debe caer en fin de semana (se recorre al lunes).
- Indicadores (mensual, fecha límite el día 10): aviso el 1, recordatorio el 5 (fin de semana → lunes
  siguiente), último recordatorio el 10 (fin de semana → viernes anterior), aviso de incumplimiento el 11
  y oficio de exhorto el 16
  (fin de semana → lunes siguiente).
"""
from datetime import date, timedelta
from typing import Iterable, Optional

# ponytail: días feriados oficiales no incluidos; agregar aquí las fechas (date) cuando el SGC las defina.
FERIADOS: frozenset = frozenset()

RECORDATORIOS_ANTES = (15, 10, 5)
DIAS_AVISO_DESPUES = 1
DIAS_OFICIO_DESPUES_AVISO = 5
INDICADORES_DIAS = {"AVISO": 1, "RECORDATORIO": 5, "ULTIMO_RECORDATORIO": 10, "AVISO_INCUMPLIMIENTO": 11, "OFICIO_EXHORTO": 16}


def es_habil(d: date) -> bool:
    return d.weekday() < 5 and d not in FERIADOS


def siguiente_habil(d: date) -> date:
    while not es_habil(d):
        d += timedelta(days=1)
    return d


def anterior_habil(d: date) -> date:
    while not es_habil(d):
        d -= timedelta(days=1)
    return d


def vencimiento_habil(d: date) -> date:
    """Una fecha de vencimiento en fin de semana se recorre al lunes."""
    return siguiente_habil(d)


def etapas_vencimiento(vence: date) -> list[tuple[str, date]]:
    """Etapas de una acción o plan con su fecha de envío (ordenadas)."""
    vence = vencimiento_habil(vence)
    etapas = [(f"RECORDATORIO_{n}", anterior_habil(vence - timedelta(days=n))) for n in RECORDATORIOS_ANTES]
    aviso = siguiente_habil(vence + timedelta(days=DIAS_AVISO_DESPUES))
    oficio = siguiente_habil(aviso + timedelta(days=DIAS_OFICIO_DESPUES_AVISO))
    # El mismo día del vencimiento también se recuerda (último día para atender).
    return etapas + [("VENCE_HOY", vence), ("AVISO_INCUMPLIMIENTO", aviso), ("OFICIO_EXHORTO", oficio)]


def etapas_indicadores(anio: int, mes: int) -> list[tuple[str, date]]:
    """Etapas del mes para la entrega de resultados de indicadores (del mes anterior)."""
    out = []
    for etapa, dia in INDICADORES_DIAS.items():
        d = date(anio, mes, dia)
        out.append((etapa, anterior_habil(d) if etapa == "ULTIMO_RECORDATORIO" else siguiente_habil(d)))
    return out


def etapa_de_hoy(etapas: Iterable[tuple[str, date]], hoy: date, enviadas: Iterable[str] = ()) -> Optional[str]:
    """La etapa que toca enviar hoy: la más reciente ya vencida que no se ha enviado.
    Si se saltó alguna (registro dado de alta tarde), no se mandan todas las atrasadas, solo la última."""
    if not es_habil(hoy):
        return None
    hechas = set(enviadas)
    vigentes = [e for e, f in etapas if f <= hoy]
    if not vigentes:
        return None
    ultima = vigentes[-1]
    return None if ultima in hechas else ultima
