"""
bitacora_grupos.py — Agrupa el registro del servidor para consultarlo sin scroll infinito (lógica pura, probada):
días del mes en curso, meses ya cerrados del año en curso y años anteriores. Las fechas se guardan en UTC y se
agrupan en hora de Cajeme (UTC-7, sin horario de verano).
"""
from collections import OrderedDict
from datetime import date, datetime, timedelta

DESFASE = timedelta(hours=7)  # Cajeme = UTC-7 todo el año
MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def _grupo(local: date, hoy: date) -> tuple[str, str, str]:
    if (local.year, local.month) == (hoy.year, hoy.month):
        return local.isoformat(), "dia", local.strftime("%d/%m/%Y")
    if local.year == hoy.year:
        return f"{local.year}-{local.month:02d}", "mes", f"{MESES[local.month - 1]} {local.year}"
    return str(local.year), "anio", f"Año {local.year}"


def agrupar(filas, hoy: date) -> list[dict]:
    """filas = [(fecha_utc, agregados, modificados, eliminados)] en orden descendente → grupos en ese orden."""
    grupos: "OrderedDict[str, dict]" = OrderedDict()
    for fecha, ag, mo, el in filas:
        gid, tipo, etiqueta = _grupo((fecha - DESFASE).date(), hoy)
        g = grupos.setdefault(gid, {"id": gid, "tipo": tipo, "etiqueta": etiqueta, "cambios": 0, "agregados": 0, "modificados": 0, "eliminados": 0})
        g["cambios"] += 1
        g["agregados"] += ag or 0
        g["modificados"] += mo or 0
        g["eliminados"] += el or 0
    return sorted(grupos.values(), key=lambda g: g["id"], reverse=True)


def rango_utc(gid: str) -> tuple[datetime, datetime]:
    """Límites [desde, hasta) en UTC de un grupo 'aaaa-mm-dd', 'aaaa-mm' o 'aaaa'."""
    partes = [int(x) for x in gid.split("-")]
    if len(partes) == 3:
        ini = datetime(*partes)
        fin = ini + timedelta(days=1)
    elif len(partes) == 2:
        ini = datetime(partes[0], partes[1], 1)
        fin = datetime(partes[0] + (partes[1] == 12), partes[1] % 12 + 1, 1)
    else:
        ini, fin = datetime(partes[0], 1, 1), datetime(partes[0] + 1, 1, 1)
    return ini + DESFASE, fin + DESFASE
