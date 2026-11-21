"""
avisos_calendario.py — Calendario de recordatorios, exhortos y oficios del SGC (lógica pura, probada).

Reglas acordadas con @human (2026-11-14). Desde 2026-11-19 los plazos son editables por el Super Admin y la
cuenta autorizada (Configuración → Avisos por correo, clave "sgc-config-avisos-parametros"); los valores de
BASE son los acordados y se usan cuando no hay parámetros guardados o un valor no es válido.
- Los correos salen solo de lunes a viernes que no sean feriados.
- Acciones correctivas / planes de mejora: recordatorios N días antes (si cae en día inhábil se ADELANTA al
  hábil anterior) y el mismo día del vencimiento ("vence hoy"); después, AVISO DE INCUMPLIMIENTO por correo
  (advierte que Dirección General emitirá oficio de exhorto) y luego el OFICIO DE EXHORTO impreso: lo emite y
  firma el Director General en turno, dirigido al gerente del área con copia al director del área
  (día inhábil → siguiente hábil). La fecha de vencimiento nunca cae en día inhábil (se recorre al siguiente).
- Indicadores (mensual): aviso, recordatorio(s), último recordatorio (fecha límite; inhábil → hábil anterior),
  aviso de incumplimiento y oficio de exhorto en días fijos del mes (inhábil → siguiente hábil).
"""
from datetime import date, timedelta
from typing import Iterable, Optional

BASE = {
    "registros": {"recordatorios_antes": [15, 10, 5], "vence_hoy": True, "dias_aviso_despues": 1, "dias_oficio_despues_aviso": 5},
    "indicadores": {"AVISO": 1, "RECORDATORIO": 5, "ULTIMO_RECORDATORIO": 10, "AVISO_INCUMPLIMIENTO": 11, "OFICIO_EXHORTO": 16,
                    "recordatorios_extra": []},
    # Matriz de riesgos del año siguiente: sin fecha límite capturada por el SGC no se avisa nada.
    "matrices": {"anio": None, "fecha_limite": None, "recordatorios_antes": [15, 5]},
    "feriados": [],
}
MAX_DIAS_ANTES = 90
DIAS_INDICADORES = ("AVISO", "RECORDATORIO", "ULTIMO_RECORDATORIO", "AVISO_INCUMPLIMIENTO", "OFICIO_EXHORTO")

# Compatibilidad con quien lea las constantes de antes.
RECORDATORIOS_ANTES = tuple(BASE["registros"]["recordatorios_antes"])
INDICADORES_DIAS = {k: BASE["indicadores"][k] for k in DIAS_INDICADORES}


def _entero(v, minimo: int, maximo: int) -> Optional[int]:
    try:
        n = int(v)
    except (TypeError, ValueError):
        return None
    return n if minimo <= n <= maximo else None


def normalizar(guardado) -> dict:
    """Parámetros guardados + valores base. Lo que no sea válido se ignora (nunca deja la tarea sin calendario)."""
    g = guardado if isinstance(guardado, dict) else {}
    r0, i0 = g.get("registros") if isinstance(g.get("registros"), dict) else {}, g.get("indicadores") if isinstance(g.get("indicadores"), dict) else {}
    b_r, b_i = BASE["registros"], BASE["indicadores"]
    antes = sorted({n for n in (_entero(x, 1, MAX_DIAS_ANTES) for x in r0.get("recordatorios_antes") or []) if n}, reverse=True)
    reg = {
        "recordatorios_antes": antes or list(b_r["recordatorios_antes"]),
        "vence_hoy": r0.get("vence_hoy", b_r["vence_hoy"]) is not False,
        "dias_aviso_despues": _entero(r0.get("dias_aviso_despues"), 1, 30) or b_r["dias_aviso_despues"],
        "dias_oficio_despues_aviso": _entero(r0.get("dias_oficio_despues_aviso"), 1, 60) or b_r["dias_oficio_despues_aviso"],
    }
    ind = {k: _entero(i0.get(k), 1, 28) or b_i[k] for k in DIAS_INDICADORES}
    ind["recordatorios_extra"] = sorted({n for n in (_entero(x, 1, 28) for x in i0.get("recordatorios_extra") or []) if n})
    m0 = g.get("matrices") if isinstance(g.get("matrices"), dict) else {}
    try:
        limite = date.fromisoformat(str(m0.get("fecha_limite") or ""))
    except ValueError:
        limite = None
    anio_m = _entero(m0.get("anio"), 2020, 2100)
    if not anio_m or not limite or abs(anio_m - limite.year) > 1:  # sin fecha válida no hay avisos de matriz
        limite, anio_m = None, None
    matrices = {"anio": anio_m, "fecha_limite": limite,
                "recordatorios_antes": sorted({n for n in (_entero(x, 1, 60) for x in m0.get("recordatorios_antes") or []) if n}, reverse=True)
                or list(BASE["matrices"]["recordatorios_antes"])}
    feriados = set()
    for f in g.get("feriados") or []:
        try:
            feriados.add(date.fromisoformat(str(f)[:10]))
        except ValueError:
            continue
    return {"registros": reg, "indicadores": ind, "matrices": matrices, "feriados": frozenset(feriados)}


def _p(p: Optional[dict]) -> dict:
    return p if p is not None else normalizar({})


def es_habil(d: date, p: Optional[dict] = None) -> bool:
    return d.weekday() < 5 and d not in _p(p)["feriados"]


def siguiente_habil(d: date, p: Optional[dict] = None) -> date:
    while not es_habil(d, p):
        d += timedelta(days=1)
    return d


def anterior_habil(d: date, p: Optional[dict] = None) -> date:
    while not es_habil(d, p):
        d -= timedelta(days=1)
    return d


def vencimiento_habil(d: date, p: Optional[dict] = None) -> date:
    """Una fecha de vencimiento en día inhábil se recorre al siguiente hábil."""
    return siguiente_habil(d, p)


def etapas_vencimiento(vence: date, p: Optional[dict] = None) -> list[tuple[str, date]]:
    """Etapas de una acción o plan con su fecha de envío (ordenadas)."""
    r = _p(p)["registros"]
    vence = vencimiento_habil(vence, p)
    etapas = [(f"RECORDATORIO_{n}", anterior_habil(vence - timedelta(days=n), p)) for n in r["recordatorios_antes"]]
    aviso = siguiente_habil(vence + timedelta(days=r["dias_aviso_despues"]), p)
    oficio = siguiente_habil(aviso + timedelta(days=r["dias_oficio_despues_aviso"]), p)
    fin = [("VENCE_HOY", vence)] if r["vence_hoy"] else []
    return etapas + fin + [("AVISO_INCUMPLIMIENTO", aviso), ("OFICIO_EXHORTO", oficio)]


def etapas_indicadores(anio: int, mes: int, p: Optional[dict] = None) -> list[tuple[str, date]]:
    """Etapas del mes para la entrega de resultados de indicadores (del mes anterior), en orden de fecha."""
    ind = _p(p)["indicadores"]
    dias = [(k, ind[k]) for k in DIAS_INDICADORES] + [(f"RECORDATORIO_D{n}", n) for n in ind["recordatorios_extra"]]
    out = []
    for etapa, dia in dias:
        d = date(anio, mes, dia)
        out.append((etapa, anterior_habil(d, p) if etapa == "ULTIMO_RECORDATORIO" else siguiente_habil(d, p)))
    return sorted(out, key=lambda x: x[1])


def etapas_matriz(p: Optional[dict] = None) -> list[tuple[str, date]]:
    """Recordatorios antes de la fecha límite de la matriz, el día límite y el aviso de incumplimiento."""
    m = _p(p)["matrices"]
    limite = m["fecha_limite"]
    if not limite:
        return []
    limite = anterior_habil(limite, p)
    etapas = [(f"RECORDATORIO_{n}", anterior_habil(limite - timedelta(days=n), p)) for n in m["recordatorios_antes"]]
    return etapas + [("VENCE_HOY", limite), ("AVISO_INCUMPLIMIENTO", siguiente_habil(limite + timedelta(days=1), p))]


def etapa_de_hoy(etapas: Iterable[tuple[str, date]], hoy: date, enviadas: Iterable[str] = (), p: Optional[dict] = None) -> Optional[str]:
    """La etapa que toca enviar hoy: la más reciente ya vencida que no se ha enviado.
    Si se saltó alguna (registro dado de alta tarde), no se mandan todas las atrasadas, solo la última."""
    if not es_habil(hoy, p):
        return None
    hechas = set(enviadas)
    vigentes = [e for e, f in etapas if f <= hoy]
    if not vigentes:
        return None
    ultima = vigentes[-1]
    return None if ultima in hechas else ultima
