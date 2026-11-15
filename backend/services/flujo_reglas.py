"""
flujo_reglas.py — Reglas de negocio de Acciones Correctivas, Planes de Mejora y Reportes de Corrección
aplicadas en el servidor al guardar el estado (PUT /api/v1/estado). Hasta ahora vivían solo en la pantalla.

Devuelve el motivo del rechazo (texto para el usuario) o None si el cambio es válido.
Se compara registro por registro el valor anterior del servidor contra el valor ya fusionado.
"""
import re
from typing import Optional

from backend.models import TRANSICIONES
from backend.services.permisos import es_admin, puede_area, ve_todas_areas

CLAVE_AC = "sgc-acciones-correctivas"
CLAVE_PM = "sgc-planes-mejora"
CLAVE_RC = "sgc-reportes-correccion"
CLAVE_FOLIOS = "sgc-config-folios"
CLAVES_CON_REGLAS = (CLAVE_AC, CLAVE_PM, CLAVE_RC)

# Estados heredados → flujo canónico (mismo mapa que normalizarEstado en constants/workflow.js)
LEGADO = {"GENERADO_IA": "BORRADOR", "FOLIO_ASIGNADO": "APROBADO", "ENVIADO_SGC": "EN_REVISION",
          "EN_PROCESO": "EN_SEGUIMIENTO", "ABIERTA": "EN_SEGUIMIENTO", "ABIERTO": "EN_SEGUIMIENTO", "CERRADA": "CERRADO"}
CERRADOS = ("CERRADO_EFECTIVO", "CERRADO_NO_EFECTIVO", "CERRADO")
# Además de TRANSICIONES: el SGC dictamina NO EFICAZ una AC/PM vencida con replanteos agotados (regla 4).
EXTRA_ADMIN = {"EN_SEGUIMIENTO": ("CERRADO_NO_EFECTIVO",)}
# Quién puede ejecutar cada transición. Lo que no está aquí lo puede hacer quien tenga acceso al área.
SOLO_ADMIN = {("EN_REVISION", "APROBADO"), ("EN_REVISION", "EN_SEGUIMIENTO"), ("EN_SEGUIMIENTO", "REVISION_AUDITOR"),
              ("SOLICITUD_CIERRE", "REVISION_AUDITOR"), ("CERRADO_NO_EFECTIVO", "EN_SEGUIMIENTO"), ("EN_SEGUIMIENTO", "CERRADO_NO_EFECTIVO")}
ADMIN_O_AUDITOR = {("REVISION_AUDITOR", "CERRADO_EFECTIVO"), ("REVISION_AUDITOR", "CERRADO_NO_EFECTIVO"),
                   ("REVISION_AUDITOR", "EN_SEGUIMIENTO"), ("EN_REVISION", "RECHAZADO"), ("EN_SEGUIMIENTO", "RECHAZADO")}
# Pasar a estos estados exige evidencia en todas las actividades (regla 2).
EXIGEN_EVIDENCIA = ("SOLICITUD_CIERRE", "REVISION_AUDITOR", "CERRADO_EFECTIVO")
FOLIO_OFICIAL = re.compile(r"^\s*(AC|OM)\s*#\s*\d+\s*[\\/]\s*\d{2,4}\s*$", re.I)

# Reportes de corrección
RC_ESTADOS = ("EN_ATENCION", "CERRADO_EFECTIVO", "CERRADO_NO_EFECTIVO", "ESCALADO_A_AC")
RC_LEGADO = {"ABIERTO": "EN_ATENCION", "ABIERTA": "EN_ATENCION", "": "EN_ATENCION", "CERRADA": "CERRADO_EFECTIVO"}
RC_TRANSICIONES = {"EN_ATENCION": ("CERRADO_EFECTIVO", "CERRADO_NO_EFECTIVO", "ESCALADO_A_AC"),
                   "CERRADO_NO_EFECTIVO": ("ESCALADO_A_AC",), "CERRADO_EFECTIVO": (), "ESCALADO_A_AC": ()}


def estado_de(r: dict) -> str:
    e = str(r.get("estado") or "BORRADOR")
    return LEGADO.get(e, e)


def estado_rc(r: dict) -> str:
    e = str(r.get("estado") or "")
    return RC_LEGADO.get(e, e)


def _por_id(lista) -> dict:
    return {str(x["id"]): x for x in lista if isinstance(x, dict) and "id" in x}


def _actividades(r: dict) -> list:
    import json
    a = r.get("actividades")
    if isinstance(a, list):
        return a
    texto = a if isinstance(a, str) else r.get("actividades_json")
    try:
        lista = json.loads(texto or "[]")
        return lista if isinstance(lista, list) else []
    except (TypeError, ValueError):
        return []


def falta_evidencia(r: dict) -> Optional[str]:
    acts = _actividades(r)
    if not acts:
        return "no tiene actividades registradas"
    sin = [a for a in acts if isinstance(a, dict) and not a.get("evidencia_real")]
    return f"falta evidencia en {len(sin)} actividad(es)" if sin else None


def _folio(r: dict) -> str:
    return str(r.get("folio_codigo") or r.get("folio") or "")


def _nombre(r: dict) -> str:
    return _folio(r) or f"id {r.get('id')}"


def _sin_acceso(usuario, r: dict, areas: list) -> bool:
    if ve_todas_areas(usuario):
        return False
    correo = (usuario.email or "").lower()
    correos = r.get("correos_responsables")
    if isinstance(correos, str):
        correos = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", correos)
    if correo and correo in [str(c).lower() for c in (correos or [])]:
        return False
    return not puede_area(usuario, r.get("area") or r.get("gerencia_coordinacion") or "", areas)


def _validar_ac_pm(anterior: list, nuevo: list, usuario, areas: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    for k, viejo in antes.items():
        if k not in despues:
            if not admin:
                return f"Solo el SGC puede eliminar registros ({_nombre(viejo)})."
            continue
        r = despues[k]
        if r == viejo:
            continue
        if _sin_acceso(usuario, viejo, areas):
            return f"{_nombre(viejo)} pertenece a otra área; no puedes modificarlo."
        e0, e1 = estado_de(viejo), estado_de(r)
        if e0 in CERRADOS and e1 == e0 and not admin:
            return f"{_nombre(viejo)} está cerrado; solo el SGC puede modificarlo."
        f0, f1 = _folio(viejo), _folio(r)
        if f0 != f1:
            if FOLIO_OFICIAL.match(f0):
                return f"El folio {f0} ya es oficial y no se puede cambiar."
            if FOLIO_OFICIAL.match(f1) and not admin:
                return "Solo el SGC asigna folios."
        if e1 != e0:
            # Estados heredados que no están en el flujo (importaciones viejas): se permite normalizarlos.
            permitidas = set(TRANSICIONES.get(e0, [])) | set(EXTRA_ADMIN.get(e0, ()) if admin else ())
            if e0 not in TRANSICIONES:
                permitidas = set(TRANSICIONES)
            if e1 not in permitidas:
                return f"{_nombre(viejo)}: no se puede pasar de {e0} a {e1}."
            par = (e0, e1)
            if par in SOLO_ADMIN and not admin:
                return f"{_nombre(viejo)}: solo el SGC puede pasar a {e1}."
            if par in ADMIN_O_AUDITOR and not (admin or usuario.rol == "Auditor"):
                return f"{_nombre(viejo)}: solo el SGC o el auditor pueden pasar a {e1}."
            if e1 in EXIGEN_EVIDENCIA:
                motivo = falta_evidencia(r)
                if motivo:
                    return f"{_nombre(viejo)}: no se puede pasar a {e1}, {motivo}."
    for k, r in despues.items():
        if k in antes:
            continue
        if _sin_acceso(usuario, r, areas):
            return "No puedes crear registros de otra área."
        if FOLIO_OFICIAL.match(_folio(r)) and not admin:
            return "Solo el SGC asigna folios."
        if estado_de(r) in CERRADOS and not admin:
            return "No se puede crear un registro ya cerrado."
    return None


def _validar_rc(anterior: list, nuevo: list, usuario, areas: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    dictamina = admin or usuario.rol == "Auditor"
    folios = [str(r.get("folio") or "").strip() for r in nuevo if isinstance(r, dict) and r.get("folio")]
    repetidos = {f for f in folios if folios.count(f) > 1}
    if repetidos:
        return f"Folio de RC repetido: {', '.join(sorted(repetidos)[:3])}."
    for k, viejo in antes.items():
        if k not in despues:
            if not admin:
                return f"Solo el SGC puede eliminar reportes de corrección ({viejo.get('folio')})."
            continue
        r = despues[k]
        if r == viejo:
            continue
        if _sin_acceso(usuario, viejo, areas):
            return f"El reporte {viejo.get('folio')} pertenece a otra área."
        if (viejo.get("folio") or "") != (r.get("folio") or "") and viejo.get("folio"):
            return f"El folio {viejo.get('folio')} no se puede cambiar."
        e0, e1 = estado_rc(viejo), estado_rc(r)
        if e1 != e0:
            if e1 not in RC_TRANSICIONES.get(e0, ()):
                return f"Reporte {viejo.get('folio')}: no se puede pasar de {e0} a {e1}."
            if not dictamina:
                return f"Reporte {viejo.get('folio')}: solo el SGC o un auditor dictaminan."
        if r.get("folio_ac_vinculado") and viejo.get("folio_ac_vinculado") and r["folio_ac_vinculado"] != viejo["folio_ac_vinculado"]:
            return f"Reporte {viejo.get('folio')}: ya está ligado a {viejo['folio_ac_vinculado']}."
    for k, r in despues.items():
        if k not in antes and _sin_acceso(usuario, r, areas):
            return "No puedes crear reportes de otra área."
    return None


def validar_cambio(clave: str, anterior, nuevo, usuario, areas_detalle: list) -> Optional[str]:
    """Motivo de rechazo o None. Solo actúa sobre las claves con reglas y cuando ambos valores son listas."""
    if clave == CLAVE_FOLIOS:
        return "Los folios se asignan desde el servidor (POST /api/v1/folios)."
    if clave not in CLAVES_CON_REGLAS or not isinstance(nuevo, list):
        return None
    anterior = anterior if isinstance(anterior, list) else []
    if clave == CLAVE_RC:
        return _validar_rc(anterior, nuevo, usuario, areas_detalle)
    return _validar_ac_pm(anterior, nuevo, usuario, areas_detalle)
