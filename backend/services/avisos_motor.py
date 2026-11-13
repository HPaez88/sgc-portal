"""
avisos_motor.py — Qué avisos tocan hoy (lógica pura, probada). El envío y el registro están en tareas/avisos_diarios.py.

Acciones correctivas (por vencimiento): solo EN_SEGUIMIENTO, sin auditor asignado (si ya hay auditor se está
atendiendo), con vencimiento a partir del arranque del programa. Planes de mejora: todavía no (decisión de @human).
Indicadores (calendario mensual): en el mes M se pide el resultado del mes M-1 de los indicadores que tocan
según su periodicidad; el aviso del día 1 va a todos los que deben entregar, los demás solo a quien no ha entregado.
"""
from collections import defaultdict
from datetime import date
from typing import Optional

from backend.services import avisos_calendario as cal

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
MESES_POR_PERIODICIDAD = {
    "mensual": set(range(1, 13)), "bimestral": {2, 4, 6, 8, 10, 12}, "trimestral": {3, 6, 9, 12},
    "semestral": {6, 12}, "anual": {12},
}
ESTADOS_AC_CON_AVISO = {"EN_SEGUIMIENTO"}


def _fecha(v) -> Optional[date]:
    try:
        return date.fromisoformat(str(v)[:10]) if v else None
    except ValueError:
        return None


def vencimiento_ac(ac: dict) -> Optional[date]:
    """La fecha de seguimiento del SGC; si no hay, la de cierre programada/estimada."""
    for c in ("fecha_seguimiento", "fecha_cierre_programada", "fecha_cierre_estimada", "fecha_limite"):
        f = _fecha(ac.get(c))
        if f:
            return f
    return None


def ac_en_atencion_de_auditor(ac: dict) -> bool:
    return bool(ac.get("auditor_email") or ac.get("fecha_asignacion_auditor")) or ac.get("estado") in ("REVISION_AUDITOR", "SOLICITUD_CIERRE")


def avisos_acciones(acciones: list, hoy: date, arranque: date, enviadas: set) -> list[dict]:
    """[{folio, id, area, etapa, vence, ac}] de lo que toca hoy. enviadas = {(id, vence_iso, etapa)}."""
    out = []
    for ac in acciones or []:
        if ac.get("estado") not in ESTADOS_AC_CON_AVISO or ac_en_atencion_de_auditor(ac):
            continue
        vence = vencimiento_ac(ac)
        if not vence or cal.vencimiento_habil(vence) < arranque:
            continue  # lo ya vencido antes del arranque no entra (decisión de @human)
        vence = cal.vencimiento_habil(vence)
        hechas = {e for (i, v, e) in enviadas if str(i) == str(ac.get("id")) and v == vence.isoformat()}
        etapa = cal.etapa_de_hoy(cal.etapas_vencimiento(vence), hoy, hechas)
        if etapa:
            out.append({"id": ac.get("id"), "folio": ac.get("folio_codigo") or "AC", "area": ac.get("area") or "", "etapa": etapa,
                        "vence": vence, "ac": ac})
    return out


def mes_reportado(hoy: date) -> tuple[int, int]:
    """En el mes actual se entrega el resultado del mes anterior."""
    return (hoy.year - 1, 12) if hoy.month == 1 else (hoy.year, hoy.month - 1)


def indicadores_del_periodo(catalogo: list, mes: int) -> list[dict]:
    return [i for i in catalogo if mes in MESES_POR_PERIODICIDAD.get(str(i.get("periodicidad", "mensual")).lower(), set(range(1, 13)))]


def entregado(resultados: dict, ind_id, anio: int, mes: int) -> bool:
    r = (resultados or {}).get(f"{ind_id}-{MESES[mes - 1]}-{anio}") or {}
    return r.get("valor") not in (None, "")


def unidad_de_indicador(ind: dict) -> str:
    return ind.get("direccion") if ind.get("responsable_tipo") == "direccion" else (ind.get("area") or ind.get("direccion") or "")


def avisos_indicadores(catalogo: list, resultados: dict, hoy: date, enviadas: set) -> list[dict]:
    """[{unidad, etapa, periodo, indicadores:[...]}] — una entrada por unidad. enviadas = {(unidad, periodo, etapa)}."""
    anio_r, mes_r = mes_reportado(hoy)
    periodo = f"{MESES[mes_r - 1]}-{anio_r}"
    etapas = cal.etapas_indicadores(hoy.year, hoy.month)
    por_unidad = defaultdict(list)
    for ind in indicadores_del_periodo(catalogo, mes_r):
        por_unidad[unidad_de_indicador(ind)].append(ind)
    out = []
    for unidad, inds in sorted(por_unidad.items()):
        if not unidad:
            continue
        hechas = {e for (u, p, e) in enviadas if u == unidad and p == periodo}
        etapa = cal.etapa_de_hoy(etapas, hoy, hechas)
        if not etapa:
            continue
        pendientes = [i for i in inds if not entregado(resultados, i["id"], anio_r, mes_r)]
        lista = inds if etapa == "AVISO" else pendientes
        if lista:
            out.append({"unidad": unidad, "etapa": etapa, "periodo": periodo, "mes_texto": f"{MESES_LARGOS[mes_r - 1]} {anio_r}",
                        "indicadores": [{"id": i["id"], "nombre": i["nombre"]} for i in lista]})
    return out
