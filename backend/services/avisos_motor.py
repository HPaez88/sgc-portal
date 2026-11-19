"""
avisos_motor.py — Qué avisos tocan hoy (lógica pura, probada). El envío y el registro están en tareas/avisos_diarios.py.

Acciones correctivas y planes de mejora (por vencimiento): solo EN_SEGUIMIENTO, sin auditor asignado (si ya hay
auditor se está atendiendo), con vencimiento a partir del arranque del programa. Los PM entran desde 2026-11-19
(decisión de @human: "cualquier atraso").
Indicadores (calendario mensual): en el mes M se pide el resultado del mes M-1 de los indicadores que tocan
según su periodicidad; el aviso del día 1 va a todos los que deben entregar, los demás solo a quien no ha entregado.
"""
import json
import re
import unicodedata
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
            out.append({"id": ac.get("id"), "folio": ac.get("folio_codigo") or ac.get("folio") or "AC",
                        "area": ac.get("area") or ac.get("gerencia_coordinacion") or "", "etapa": etapa,
                        "vence": vence, "ac": ac})
    return out


def catalogo_vivo(base: list, personalizado: dict, proyectos: list, hoy: date) -> list[dict]:
    """Catálogo como lo ve el portal: base + cambios/altas del administrador + periodicidad del proyecto aprobado del año reportado."""
    por_id = {str(i["id"]): dict(i) for i in base}
    for k, v in (personalizado or {}).items():
        if isinstance(v, dict):
            por_id[str(v.get("id", k))] = {**por_id.get(str(v.get("id", k)), {}), **v}
    anio, _ = mes_reportado(hoy)
    for p in proyectos or []:
        if not isinstance(p, dict) or p.get("anio") != anio or p.get("estado") != "APROBADO":
            continue
        for a in p.get("actividades") or []:
            ind = por_id.get(str(a.get("indicador_id")))
            if ind is not None and a.get("periodicidad"):
                ind["periodicidad"] = a["periodicidad"]
    return [i for i in por_id.values() if i.get("id") is not None and i.get("nombre")]


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


def avisos_indicadores(catalogo: list, resultados: dict, hoy: date, enviadas: set, arranque: Optional[date] = None) -> list[dict]:
    """[{unidad, etapa, periodo, indicadores:[...]}] — una entrada por unidad. enviadas = {(unidad, periodo, etapa)}."""
    # El primer ciclo es el primer mes que empieza después del arranque (no se exige lo de meses anteriores).
    if arranque and cal.siguiente_habil(date(hoy.year, hoy.month, 1)) < arranque:
        return []
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


MESES_RENOVACION = {10: "RENOVACION_OCT", 11: "RENOVACION_NOV", 12: "RENOVACION_DIC"}


def avisos_renovacion(proyectos: list, hoy: date, enviadas: set) -> list[dict]:
    """De octubre a diciembre, un aviso al mes por área con proyecto APROBADO del año en curso y sin proyecto del siguiente.
    [{unidad, etapa, periodo, proyecto}] — enviadas = {(unidad, periodo, etapa)} con periodo = año siguiente."""
    etapa = MESES_RENOVACION.get(hoy.month)
    if not etapa:
        return []
    siguiente = str(hoy.year + 1)
    con_siguiente = {p.get("area") for p in proyectos if isinstance(p, dict) and int(p.get("anio") or 0) == hoy.year + 1}
    out = []
    for p in proyectos:
        if not isinstance(p, dict) or int(p.get("anio") or 0) != hoy.year or p.get("estado") != "APROBADO":
            continue
        area = p.get("area") or ""
        if not area or area in con_siguiente or (area, siguiente, etapa) in enviadas:
            continue
        out.append({"unidad": area, "etapa": etapa, "periodo": siguiente, "proyecto": p.get("nombre") or ""})
    return out


# ── Destinatarios y temas ──────────────────────────────────────────────────────────────────────────────────
TITULOS_NOMBRE = re.compile(r"\b(lic|ing|c\.?\s?p|mtro|mtra|dr|dra|arq|prof|profa|biol|qfb)\.?\s+", re.I)


def _tokens(nombre: str) -> set:
    t = unicodedata.normalize("NFD", str(nombre or "")).encode("ascii", "ignore").decode().lower()
    return set(TITULOS_NOMBRE.sub(" ", t + " ").split())


def _mismo(a: str, b: str) -> bool:
    """Mismo nombre aunque uno traiga título, acentos o un apellido de más ("Irasema Moreno" = "Irasema Moreno Espinoza").
    ponytail: dos palabras en común como mínimo; si hay homónimos en el directorio, pedir el correo en el equipo."""
    x, y = _tokens(a), _tokens(b)
    corto = x if len(x) <= len(y) else y
    return len(corto) >= 2 and corto <= (y if corto is x else x)


def _lista(valor) -> list:
    if isinstance(valor, str):
        try:
            valor = json.loads(valor or "[]")
        except ValueError:
            return []
    return valor if isinstance(valor, list) else []


def destinatarios_registro(reg: dict, contactos_area: list, usuarios: list) -> list:
    """Responsable del área y quien le ayuda (catálogo) + integrantes del equipo que estén en el directorio
    + correos escritos en el registro que también estén en el directorio. usuarios = [{email, nombre}]."""
    directorio = {str(u["email"]).lower(): u for u in usuarios if u.get("email")}
    escritos = reg.get("correos_responsables")
    escritos = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", escritos) if isinstance(escritos, str) else (escritos or [])
    para = {str(c).lower() for c in contactos_area if c}
    para |= {str(c).lower() for c in escritos if str(c).lower() in directorio}
    equipo = _lista(reg.get("equipo_json")) or _lista(reg.get("integrantes"))
    for m in equipo:
        nombre = m.get("nombre") if isinstance(m, dict) else None
        if not nombre:
            continue
        para |= {e for e, u in directorio.items() if _mismo(nombre, u.get("nombre", ""))}
    return sorted(para)


TEMAS_ADMIN = ("resumen", "incumplimiento", "renovacion", "buzon")


def admins_con_tema(admins: list, prefs: dict, tema: str) -> list:
    """Administradores que reciben ese tema. Sin preferencia guardada, lo reciben (no se pierde nada por omisión)."""
    prefs = prefs if isinstance(prefs, dict) else {}
    return [a for a in admins if (prefs.get(str(a).lower()) or {}).get(tema, True) is not False]


def avisos_auditor(registros: list, enviadas: set) -> list:
    """Una vez por asignación: AC/PM en REVISION_AUDITOR con auditor. enviadas = {(id, fecha_asignacion, etapa)}."""
    out = []
    for r in registros or []:
        if r.get("estado") != "REVISION_AUDITOR" or not r.get("auditor_email"):
            continue
        ref = str(r.get("fecha_asignacion_auditor") or "")[:10]
        if (str(r.get("id")), ref, "AUDITOR_ASIGNADO") in enviadas:
            continue
        out.append({"id": r.get("id"), "folio": r.get("folio_codigo") or r.get("folio") or "", "referencia": ref,
                    "auditor": r["auditor_email"], "area": r.get("area") or r.get("gerencia_coordinacion") or "", "registro": r})
    return out
