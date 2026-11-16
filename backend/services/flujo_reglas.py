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
CLAVE_RIESGOS = "sgc-riesgos"
CLAVE_MATRICES = "sgc-matrices-riesgos"
CLAVE_AUDITORIAS = "sgc-auditorias-internas"
CLAVE_AUD_LISTAS = "sgc-auditorias-listas"
CLAVE_AUD_HALLAZGOS = "sgc-auditorias-hallazgos"
CLAVE_AUD_EVALUACIONES = "sgc-auditorias-evaluaciones"
CLAVE_AUD_HISTORICO = "sgc-auditorias-historico"   # informes anteriores al portal: se cargan por script
CLAVES_CON_REGLAS = (CLAVE_AC, CLAVE_PM, CLAVE_RC, CLAVE_RIESGOS, CLAVE_MATRICES,
                     CLAVE_AUDITORIAS, CLAVE_AUD_LISTAS, CLAVE_AUD_HALLAZGOS, CLAVE_AUD_EVALUACIONES, CLAVE_AUD_HISTORICO)

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
    activos_por_riesgo: dict = {}
    for k, r in despues.items():
        rid = r.get("riesgo_id")
        if rid not in (None, "") and estado_de(r) not in CERRADOS:
            activos_por_riesgo.setdefault(str(rid), []).append(_nombre(r))
        if k in antes:
            continue
        if _sin_acceso(usuario, r, areas):
            return "No puedes crear registros de otra área."
        if FOLIO_OFICIAL.match(_folio(r)) and not admin:
            return "Solo el SGC asigna folios."
        if estado_de(r) in CERRADOS and not admin:
            return "No se puede crear un registro ya cerrado."
        if rid not in (None, "") and not admin:
            return "Los planes de mejora ligados a un riesgo los genera el SGC al aceptar la matriz."
    repetidos = [v for v in activos_por_riesgo.values() if len(v) > 1]
    if repetidos:
        return f"Un riesgo no puede tener dos planes de mejora activos ({', '.join(repetidos[0])})."
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


# ───────────── Matriz de riesgos y oportunidades (OOMRSC-37) ─────────────
MATRIZ_ESTADOS = ("BORRADOR", "ENVIADA", "OBSERVADA", "ACEPTADA")
MATRIZ_TRANSICIONES = {"BORRADOR": ("ENVIADA",), "OBSERVADA": ("ENVIADA",), "ENVIADA": ("OBSERVADA", "ACEPTADA"), "ACEPTADA": ("OBSERVADA",)}
MATRIZ_SOLO_ADMIN = {("ENVIADA", "OBSERVADA"), ("ENVIADA", "ACEPTADA"), ("ACEPTADA", "OBSERVADA")}
RIESGO_TIPOS = ("Riesgo", "Oportunidad")
RIESGO_TRATAMIENTOS = {"Riesgo": ("Mitigar", "Evitar", "Transferir", "Aceptar"), "Oportunidad": ("Aprovechar", "Posponer")}
RIESGO_IMPACTOS = (2, 4, 6, 8, 10)
RIESGO_ESTADOS_ADMIN = ("EN_TRATAMIENTO", "MONITOREO", "CERRADO_EFICAZ", "CERRADO_NO_EFICAZ")


def _id_matriz(r: dict) -> str:
    return f"{r.get('area')}|{r.get('anio')}"


def _validar_matrices(anterior: list, nuevo: list, usuario, areas: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    for k, m in despues.items():
        if not isinstance(m, dict):
            continue
        if str(m.get("id")) != _id_matriz(m):
            return f"La matriz {m.get('id')} no corresponde a su área y año."
        e1 = str(m.get("estado") or "BORRADOR")
        if e1 not in MATRIZ_ESTADOS:
            return f"Estado de matriz inválido: {e1}."
        viejo = antes.get(k)
        e0 = str(viejo.get("estado") or "BORRADOR") if viejo else None
        if viejo and m != viejo and _sin_acceso(usuario, viejo, areas):
            return f"La matriz de {viejo.get('area')} pertenece a otra área."
        if not viejo and _sin_acceso(usuario, m, areas):
            return "No puedes crear la matriz de otra área."
        if e0 is None and e1 not in ("BORRADOR", "ENVIADA"):
            return f"Una matriz nueva no puede nacer en {e1}."
        if e0 is not None and e1 != e0:
            if e1 not in MATRIZ_TRANSICIONES.get(e0, ()):
                return f"Matriz de {m.get('area')}: no se puede pasar de {e0} a {e1}."
            if (e0, e1) in MATRIZ_SOLO_ADMIN and not admin:
                return f"Matriz de {m.get('area')}: solo el SGC puede pasar a {e1}."
        if viejo and e0 == e1 and e0 in ("ENVIADA", "ACEPTADA") and m != viejo and not admin:
            return f"La matriz de {m.get('area')} está en revisión o aceptada; el área ya no la modifica."
        # las observaciones del SGC no se borran
        if viejo and len(m.get("observaciones") or []) < len(viejo.get("observaciones") or []):
            return "Las observaciones de la matriz no se eliminan."
    for k, viejo in antes.items():
        if k not in despues and not admin:
            return f"Solo el SGC puede eliminar matrices ({viejo.get('area')})."
    return None


def _validar_riesgos(anterior: list, nuevo: list, usuario, areas: list, matrices: list, planes: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    estado_matriz = {str(m.get("id")): str(m.get("estado") or "BORRADOR") for m in matrices if isinstance(m, dict)}
    pm_por_id = {str(p.get("id")): p for p in planes if isinstance(p, dict)}
    for k, viejo in antes.items():
        if k not in despues:
            if not admin:
                return "Solo el SGC puede quitar un riesgo de una matriz enviada o aceptada." if estado_matriz.get(_id_matriz(viejo)) in ("ENVIADA", "ACEPTADA") else (None if not _sin_acceso(usuario, viejo, areas) else "No puedes quitar riesgos de otra área.")
            continue
    for k, r in despues.items():
        if not isinstance(r, dict):
            continue
        viejo = antes.get(k)
        if viejo == r:
            continue
        if (viejo and _sin_acceso(usuario, viejo, areas)) or (not viejo and _sin_acceso(usuario, r, areas)):
            return "Este riesgo pertenece a otra área."
        if r.get("tipo") not in RIESGO_TIPOS:
            return f"Tipo inválido: {r.get('tipo')}."
        pr, im = r.get("probabilidad"), r.get("impacto")
        if pr not in (None, "", 0) and int(pr) not in range(1, 6):
            return "La probabilidad debe ser de 1 a 5."
        if im not in (None, "", 0) and int(im) not in RIESGO_IMPACTOS:
            return "El impacto debe ser 2, 4, 6, 8 o 10."
        if r.get("tratamiento") and r.get("tratamiento") not in RIESGO_TRATAMIENTOS[r["tipo"]]:
            return f"Tratamiento inválido para {r['tipo']}: {r.get('tratamiento')}."
        if not admin:
            em = estado_matriz.get(_id_matriz(r), "BORRADOR")
            if em in ("ENVIADA", "ACEPTADA"):
                return f"La matriz {r.get('anio')} de {r.get('area')} está en revisión o aceptada; el área ya no la modifica."
            if viejo and viejo.get("pm_id") not in (None, ""):
                return "Un riesgo con plan de mejora ya no se modifica desde la matriz."
            for campo in ("pm_id", "pm_folio", "dictamen", "residual", "oficial"):
                if r.get(campo) != (viejo or {}).get(campo):
                    return "Plan de mejora, dictamen y aceptación los registra solo el SGC."
            if str(r.get("estado") or "IDENTIFICADO") != str((viejo or {}).get("estado") or "IDENTIFICADO") and r.get("estado") in RIESGO_ESTADOS_ADMIN:
                return "Ese estado del riesgo lo asigna solo el SGC."
        e1 = str(r.get("estado") or "IDENTIFICADO")
        if e1.startswith("CERRADO"):
            d = r.get("dictamen") or {}
            if not d.get("resultado") or len(str(d.get("nota") or "")) < 10:
                return "El dictamen requiere resultado y una nota de al menos 10 caracteres."
            pm = pm_por_id.get(str(r.get("pm_id"))) if r.get("pm_id") not in (None, "") else None
            if pm and not str(pm.get("estado") or "").startswith("CERRADO"):
                return "No se dictamina un riesgo cuyo plan de mejora sigue abierto."
    return None


# ───────────── Auditorías internas (OOMPSC-08) ─────────────
AUD_ESTADOS = ("PLANEACION", "INVITACION", "PROGRAMADA", "EN_EJECUCION", "INFORME", "CERRADA")


def _correo(usuario) -> str:
    return (usuario.email or "").lower()


def _validar_auditorias(anterior: list, nuevo: list, usuario) -> Optional[str]:
    """El programa de auditorías lo lleva el SGC. Los auditores confirman por su endpoint, no escribiendo esta clave."""
    if not es_admin(usuario) and nuevo != anterior:
        return "El programa de auditorías lo administra el SGC."
    antes = _por_id(anterior)
    for k, a in _por_id(nuevo).items():
        e1 = str(a.get("estado") or "PLANEACION")
        if e1 not in AUD_ESTADOS:
            return f"Estado de auditoría inválido: {e1}."
        viejo = antes.get(k)
        if viejo:
            e0 = str(viejo.get("estado") or "PLANEACION")
            if e0 == "CERRADA" and a != viejo:
                return f"La auditoría #{viejo.get('numero')} está cerrada y ya no se modifica."
            if abs(AUD_ESTADOS.index(e1) - AUD_ESTADOS.index(e0)) > 1:
                return f"Auditoría #{a.get('numero')}: no se puede pasar de {e0} a {e1}."
            # las confirmaciones (orden de llegada) solo cambian por el servidor
            if e1 == "INVITACION" and e0 == "INVITACION" and [c.get("email") for c in a.get("confirmaciones") or []] != [c.get("email") for c in viejo.get("confirmaciones") or []]:
                return "Las confirmaciones de auditores se registran solas en el orden en que llegan."
    numeros = [(a.get("anio"), a.get("numero")) for a in nuevo if isinstance(a, dict)]
    if len(numeros) != len(set(numeros)):
        return "Hay dos auditorías con el mismo número en el año."
    return None


def _auditor_de_lista(usuario, lista: dict) -> bool:
    return _correo(usuario) != "" and _correo(usuario) in [str(lista.get("auditor_email") or "").lower(), *[str(c).lower() for c in lista.get("coauditores") or []]]


def _validar_aud_listas(anterior: list, nuevo: list, usuario) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    for k, viejo in antes.items():
        if k not in despues and not admin:
            return "Solo el SGC puede eliminar una lista de verificación."
    for k, l in despues.items():
        viejo = antes.get(k)
        if viejo == l or admin:
            continue
        if not viejo:
            return "Las listas de verificación se generan cuando el SGC inicia la auditoría."
        if not _auditor_de_lista(usuario, viejo):
            return "Solo el auditor asignado captura esta lista de verificación."
        if viejo and viejo.get("estado") == "ENTREGADA":
            return "La lista ya fue entregada; solo el SGC puede reabrirla."
    return None


def _validar_aud_hallazgos(anterior: list, nuevo: list, usuario, areas: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    del_auditado = ("aceptado_por", "fecha_aceptacion", "comentario_auditado")
    for k, viejo in antes.items():
        # el auditor puede retirar un hallazgo suyo que aún no firma el área (lista reabierta y corregida)
        suyo = _correo(usuario) != "" and _correo(usuario) == str(viejo.get("auditor_email") or "").lower() and not viejo.get("aceptado_por")
        if k not in despues and not admin and not suyo:
            return "Un reporte de hallazgo no se elimina; si no procede, se concilia con el SGC."
    for k, h in despues.items():
        viejo = antes.get(k)
        if viejo == h or admin:
            continue
        es_auditor = _correo(usuario) != "" and _correo(usuario) == str((viejo or h).get("auditor_email") or "").lower()
        if es_auditor:
            if viejo and viejo.get("aceptado_por") and any(h.get(c) != viejo.get(c) for c in ("tipo", "hallazgo", "clausula", "requisito")):
                return "El hallazgo ya fue firmado por el auditado y no se modifica."
            continue
        # el área auditada solo firma de enterado y comenta
        if viejo and not _sin_acceso(usuario, viejo, areas) and all(h.get(c) == viejo.get(c) for c in {*h, *viejo} if c not in del_auditado):
            continue
        return "Solo el auditor que levantó el hallazgo puede modificarlo."
    return None


def _validar_aud_evaluaciones(anterior: list, nuevo: list, usuario, areas: list) -> Optional[str]:
    antes, despues = _por_id(anterior), _por_id(nuevo)
    admin = es_admin(usuario)
    for k, viejo in antes.items():
        if k not in despues and not admin:
            return "Las evaluaciones no se eliminan."
    for k, ev in despues.items():
        viejo = antes.get(k)
        if viejo == ev or admin:
            continue
        if ev.get("tipo") == "BONO":
            return "La evaluación de auditores para el bono la registra el auditor líder de calidad."
        if viejo:
            return "La evaluación ya fue entregada y no se modifica."
        if _sin_acceso(usuario, ev, areas):
            return "Solo el área auditada evalúa su auditoría."
    return None


def validar_cambio(clave: str, anterior, nuevo, usuario, areas_detalle: list, contexto: Optional[dict] = None) -> Optional[str]:
    """Motivo de rechazo o None. Solo actúa sobre las claves con reglas y cuando ambos valores son listas."""
    if clave == CLAVE_FOLIOS:
        return "Los folios se asignan desde el servidor (POST /api/v1/folios)."
    if clave not in CLAVES_CON_REGLAS or not isinstance(nuevo, list):
        return None
    anterior = anterior if isinstance(anterior, list) else []
    if clave == CLAVE_RC:
        return _validar_rc(anterior, nuevo, usuario, areas_detalle)
    if clave == CLAVE_AUD_HISTORICO:
        return None if es_admin(usuario) or nuevo == anterior else "El histórico de auditorías lo administra el SGC."
    if clave == CLAVE_AUDITORIAS:
        return _validar_auditorias(anterior, nuevo, usuario)
    if clave == CLAVE_AUD_LISTAS:
        return _validar_aud_listas(anterior, nuevo, usuario)
    if clave == CLAVE_AUD_HALLAZGOS:
        return _validar_aud_hallazgos(anterior, nuevo, usuario, areas_detalle)
    if clave == CLAVE_AUD_EVALUACIONES:
        return _validar_aud_evaluaciones(anterior, nuevo, usuario, areas_detalle)
    if clave == CLAVE_MATRICES:
        return _validar_matrices(anterior, nuevo, usuario, areas_detalle)
    if clave == CLAVE_RIESGOS:
        ctx = contexto or {}
        return _validar_riesgos(anterior, nuevo, usuario, areas_detalle, ctx.get("matrices") or [], ctx.get("planes") or [])
    return _validar_ac_pm(anterior, nuevo, usuario, areas_detalle)
