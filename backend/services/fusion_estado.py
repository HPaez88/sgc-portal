"""
fusion_estado.py — Fusión a 3 vías del estado del portal para que un navegador con datos viejos
no borre lo que otros guardaron (incidente 2026-11-11: un cierre desde una pestaña vieja borró AC#27).

base   = lo que el navegador cargó del servidor
mio    = lo que el navegador quiere guardar
suyo   = lo que hay hoy en el servidor

Regla: solo se aplica lo que ESTE navegador cambió respecto a su base; lo demás se toma del servidor.
Listas de objetos con "id" se fusionan registro por registro y campo por campo; diccionarios por clave.
Si los dos cambiaron el mismo campo, gana quien guarda al último (mio).
"""
from typing import Any

_FALTA = object()


def _con_id(lista) -> bool:
    return isinstance(lista, list) and all(isinstance(x, dict) and "id" in x for x in lista)


def _por_id(lista) -> dict:
    return {str(x["id"]): x for x in lista}


def fusionar(base: Any, mio: Any, suyo: Any) -> Any:
    if mio == base:
        return suyo
    if suyo == base or suyo is _FALTA:
        return mio
    if base is _FALTA:
        base = None
    if isinstance(mio, dict) and isinstance(suyo, dict):
        b = base if isinstance(base, dict) else {}
        out = {}
        for k in dict.fromkeys([*suyo, *mio]):
            v = fusionar(b.get(k, _FALTA), mio.get(k, _FALTA), suyo.get(k, _FALTA))
            if v is not _FALTA:
                out[k] = v
        return out
    if _con_id(mio) and _con_id(suyo) and (base is None or _con_id(base)):
        b, m, s = _por_id(base or []), _por_id(mio), _por_id(suyo)
        out = []
        for k in dict.fromkeys([*m, *s]):  # orden: el mío, luego lo nuevo de otros
            v = fusionar(b.get(k, _FALTA), m.get(k, _FALTA), s.get(k, _FALTA))
            if v is not _FALTA:
                out.append(v)
        return out
    return mio  # conflicto en un valor simple: gana quien guarda al último


def fusionar_sin_base(mio: Any, suyo: Any) -> Any:
    """Navegadores con la versión anterior del portal (no mandan base): nunca borran registros ajenos."""
    if _con_id(mio) and _con_id(suyo):
        ids = {str(x["id"]) for x in mio}
        return [*mio, *[x for x in suyo if str(x["id"]) not in ids]]
    if isinstance(mio, dict) and isinstance(suyo, dict):
        return {**suyo, **mio}
    return mio
