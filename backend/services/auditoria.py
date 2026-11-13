"""
auditoria.py — Resumen de cada cambio de datos para la bitácora del servidor (lógica pura, probada).

Cada vez que alguien guarda una sección del portal (acciones, planes, riesgos, catálogos…), el servidor
compara lo que había con lo que quedó y anota qué registros se agregaron, modificaron o eliminaron y qué
campos cambiaron. No depende de que la pantalla lo registre: así nada cambia sin dejar rastro.
"""
from typing import Any

# Claves que cambian solas o que son la propia bitácora: no se auditan (serían ruido).
CLAVES_SIN_AUDITAR = frozenset({"sgc-bitacora-movimientos", "sgc-usuarios-actividad", "sgc-sesion-activa"})
MAX_DETALLE = 40
CAMPOS_ETIQUETA = ("folio_codigo", "folio", "nombre", "titulo_mejora", "descripcion", "clave", "id")


def _etiqueta(x: dict) -> str:
    for c in CAMPOS_ETIQUETA:
        v = x.get(c) if isinstance(x, dict) else None
        if v not in (None, ""):
            return str(v)[:80]
    return "?"


def _por_id(lista: list) -> dict:
    return {str(x.get("id")): x for x in lista if isinstance(x, dict) and x.get("id") is not None}


def resumen_cambio(antes: Any, despues: Any) -> dict:
    """{agregados, modificados, eliminados, detalle:[...]} — vacío si no cambió nada."""
    if antes is None and isinstance(despues, (list, dict)):
        antes = type(despues)()  # primera vez que se guarda la sección: todo es agregado
    if antes == despues:
        return {"agregados": 0, "modificados": 0, "eliminados": 0, "detalle": []}
    if isinstance(antes, list) and isinstance(despues, list) and (_por_id(antes) or _por_id(despues)):
        a, d = _por_id(antes), _por_id(despues)
        agregados = [k for k in d if k not in a]
        eliminados = [k for k in a if k not in d]
        modificados = [k for k in d if k in a and d[k] != a[k]]
        detalle = (
            [{"accion": "agregado", "id": k, "registro": _etiqueta(d[k])} for k in agregados]
            + [{"accion": "modificado", "id": k, "registro": _etiqueta(d[k]),
                "campos": sorted(c for c in set(a[k]) | set(d[k]) if a[k].get(c) != d[k].get(c))[:15]} for k in modificados]
            + [{"accion": "eliminado", "id": k, "registro": _etiqueta(a[k])} for k in eliminados]
        )
        return {"agregados": len(agregados), "modificados": len(modificados), "eliminados": len(eliminados), "detalle": detalle[:MAX_DETALLE]}
    if isinstance(antes, dict) and isinstance(despues, dict):
        agregados = [k for k in despues if k not in antes]
        eliminados = [k for k in antes if k not in despues]
        modificados = [k for k in despues if k in antes and despues[k] != antes[k]]
        detalle = ([{"accion": "agregado", "registro": k} for k in agregados]
                   + [{"accion": "modificado", "registro": k} for k in modificados]
                   + [{"accion": "eliminado", "registro": k} for k in eliminados])
        return {"agregados": len(agregados), "modificados": len(modificados), "eliminados": len(eliminados), "detalle": detalle[:MAX_DETALLE]}
    return {"agregados": 0, "modificados": 1, "eliminados": 0, "detalle": [{"accion": "modificado", "registro": "valor"}]}


def hay_cambio(resumen: dict) -> bool:
    return bool(resumen["agregados"] or resumen["modificados"] or resumen["eliminados"])
