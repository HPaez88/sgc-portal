"""
avisos_diarios.py — Tarea diaria (lunes a viernes, 8:00 a.m. de Cajeme) de recordatorios, avisos de incumplimiento
y oficios de exhorto. La programa el cron del servidor:  docker exec sgc-app python -m backend.tareas.avisos_diarios

AVISOS_MODO: "simulacion" (por omisión: no se manda nada a los responsables; a los administradores les llega el
resumen de lo que se habría enviado), "activo" (se envía) o "apagado". AVISOS_ARRANQUE: fecha (aaaa-mm-dd) desde la
que cuentan los vencimientos; lo vencido antes no entra.
"""
import html
import json
import logging
import os
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlmodel import Session, select

from backend.database import engine
from backend.models import AvisoAutomatico, EstadoPortal, Usuario
from backend.services import avisos_calendario as cal
from backend.services import avisos_motor as motor
from backend.services import correo_service as correo

log = logging.getLogger("sgc.avisos")
ZONA = ZoneInfo("America/Hermosillo")
CATALOGO = os.path.join(os.path.dirname(__file__), "..", "assets", "indicadores_catalogo.json")
TITULOS = {
    "RECORDATORIO_15": "Recordatorio: faltan 15 días", "RECORDATORIO_10": "Recordatorio: faltan 10 días",
    "RECORDATORIO_5": "Recordatorio urgente: faltan 5 días", "VENCE_HOY": "Hoy vence",
    "AVISO_INCUMPLIMIENTO": "Aviso de incumplimiento", "OFICIO_EXHORTO": "Oficio de exhorto por emitir",
    "AVISO": "Entrega de resultados de indicadores", "RECORDATORIO": "Recordatorio de entrega de indicadores",
    "ULTIMO_RECORDATORIO": "Hoy vence la entrega de indicadores",
    "RENOVACION_OCT": "Confirmación del proyecto del año siguiente", "RENOVACION_NOV": "Recordatorio: confirmar el proyecto del año siguiente",
    "RENOVACION_DIC": "Urgente: confirmar el proyecto del año siguiente",
}


def _estado(s: Session, clave: str, defecto):
    f = s.exec(select(EstadoPortal).where(EstadoPortal.clave == clave)).first()
    try:
        return json.loads(f.valor) if f else defecto
    except ValueError:
        return defecto


def _correos(valor) -> list[str]:
    """Lista de correos de un registro: acepta lista o texto ('a@x.mx, b@x.mx'). Antes un texto se expandía letra por letra."""
    import re
    if isinstance(valor, str):
        return re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", valor)
    return [str(c) for c in (valor or []) if c]


def _contactos(unidad: str, areas: list, direcciones: list) -> list[str]:
    for a in areas:
        if a.get("nombre") == unidad:
            return [c for c in [a.get("correo"), *(a.get("encargados_sgc") or [])] if c]
    for d in direcciones:
        if d.get("nombre") == unidad or str(d.get("nombre", "")).replace("Dir. ", "Dirección ") == unidad:
            return [c for c in [d.get("correo"), *(d.get("encargados_sgc") or [])] if c]
        for sd in d.get("subdirecciones") or []:
            if sd.get("nombre") == unidad and sd.get("correo"):
                return [sd["correo"]]
    return []


def _mensaje_ac(a: dict) -> str:
    vence = a["vence"].strftime("%d/%m/%Y")
    if a["etapa"] == "AVISO_INCUMPLIMIENTO":
        return (f"La acción correctiva {a['folio']} venció el {vence} y no se ha atendido lo requerido por el Sistema de Gestión de la Calidad.\n"
                "Les pedimos atenderla a la brevedad. De no hacerlo en los próximos 5 días hábiles, Dirección General emitirá un oficio de "
                "exhorto dirigido al titular del área, con copia a su director, conforme a la Política de sanciones.")
    if a["etapa"] == "VENCE_HOY":
        return f"Hoy {vence} vence la acción correctiva {a['folio']}. Registren en el portal el avance y las evidencias de sus actividades."
    dias = a["etapa"].split("_")[-1]
    return f"La acción correctiva {a['folio']} vence el {vence} (faltan {dias} días). Registren en el portal el avance y las evidencias de sus actividades."


def _mensaje_ind(x: dict) -> str:
    lista = "\n".join(f"• #{i['id']} {i['nombre']}" for i in x["indicadores"])
    base = {
        "AVISO": f"Ya pueden capturar en el portal los resultados de {x['mes_texto']}. La fecha límite es el día 10.",
        "RECORDATORIO": f"Recordatorio: falta capturar los resultados de {x['mes_texto']}. La fecha límite es el día 10.",
        "ULTIMO_RECORDATORIO": f"Hoy vence la entrega de los resultados de {x['mes_texto']}.",
        "AVISO_INCUMPLIMIENTO": (f"No se ha entregado el resultado de {x['mes_texto']} de los indicadores siguientes. Les pedimos capturarlo a la brevedad; "
                                 "de no hacerlo, Dirección General emitirá un oficio de exhorto dirigido al titular del área, con copia a su director, "
                                 "conforme a la Política de sanciones."),
    }.get(x["etapa"], "")
    return f"{base}\n\n{lista}"


def _mensaje_renovacion(x: dict) -> str:
    urgencia = {"RENOVACION_NOV": "Aún no se ha confirmado. ", "RENOVACION_DIC": "Diciembre es el último mes para confirmarlo. "}.get(x["etapa"], "")
    return (f"{urgencia}Para {x['periodo']} necesitamos saber si su área seguirá con el mismo proyecto, actividades e indicadores "
            f"(\"{x['proyecto']}\") o si se actualizará alguna información.\n\n"
            "En el portal, en Indicadores → Proyecto anual, elijan \"Sigue igual\" para enviarlo tal cual a aceptación del SGC, "
            "o \"Actualizar\" para modificarlo antes de enviarlo. Una vez aceptado por el SGC, el proyecto queda cerrado para cambios.")


def ejecutar(hoy: date | None = None) -> dict:
    modo = os.getenv("AVISOS_MODO", "simulacion").lower()
    hoy = hoy or datetime.now(ZONA).date()
    if modo == "apagado" or not cal.es_habil(hoy):
        return {"modo": modo, "hoy": hoy.isoformat(), "avisos": 0}
    arranque = date.fromisoformat(os.getenv("AVISOS_ARRANQUE") or hoy.isoformat())
    url = correo.url_portal()
    with Session(engine) as s:
        previos = s.exec(select(AvisoAutomatico).where(AvisoAutomatico.modo == modo)).all()
        enviadas_ac = {(p.registro_id, p.referencia, p.etapa) for p in previos if p.tipo == "AC"}
        enviadas_ind = {(p.registro, p.referencia, p.etapa) for p in previos if p.tipo == "INDICADORES"}
        enviadas_ren = {(p.registro, p.referencia, p.etapa) for p in previos if p.tipo == "RENOVACION"}
        areas = _estado(s, "sgc-config-areas-detalle", [])
        direcciones = _estado(s, "sgc-config-direcciones-detalle", [])
        datos_ind = _estado(s, "sgc-indicadores-data", {})
        proyectos = _estado(s, "sgc-proyectos-indicadores", [])
        catalogo = motor.catalogo_vivo(json.load(open(CATALOGO, encoding="utf-8")), datos_ind.get("catalogoPersonalizado") or {}, proyectos, hoy)
        activos = [u for u in s.exec(select(Usuario)).all() if u.activo]
        admins = [u.email for u in activos if u.rol in ("Super Admin", "Admin")]
        # Los responsables escritos en una AC solo reciben aviso si son personas del directorio (auditoría 2026-11-18):
        # el registro lo edita el área, el catálogo de contactos solo el SGC.
        directorio = {str(u.email).lower() for u in activos}

        pendientes = []
        for a in motor.avisos_acciones(_estado(s, "sgc-acciones-correctivas", []), hoy, arranque, enviadas_ac):
            responsables = [c for c in _correos(a["ac"].get("correos_responsables")) if c.lower() in directorio]
            para = sorted(set(correo_l for correo_l in [*responsables, *_contactos(a["area"], areas, direcciones)] if correo_l))
            pendientes.append({"tipo": "AC", "registro": a["folio"], "registro_id": str(a["id"]), "etapa": a["etapa"], "referencia": a["vence"].isoformat(),
                               "para": para, "cc": admins if a["etapa"] == "AVISO_INCUMPLIMIENTO" else [], "mensaje": _mensaje_ac(a), "unidad": a["area"]})
        for x in motor.avisos_indicadores(catalogo, datos_ind.get("resultados") or {}, hoy, enviadas_ind, arranque):
            pendientes.append({"tipo": "INDICADORES", "registro": x["unidad"], "registro_id": "", "etapa": x["etapa"], "referencia": x["periodo"],
                               "para": _contactos(x["unidad"], areas, direcciones), "cc": admins if x["etapa"] == "AVISO_INCUMPLIMIENTO" else [],
                               "mensaje": _mensaje_ind(x), "unidad": x["unidad"]})
        # Renovación anual del proyecto (octubre–diciembre): al área y a quienes la apoyan en el SGC, con copia a los administradores.
        for x in motor.avisos_renovacion(proyectos, hoy, enviadas_ren):
            pendientes.append({"tipo": "RENOVACION", "registro": x["unidad"], "registro_id": "", "etapa": x["etapa"], "referencia": x["periodo"],
                               "para": _contactos(x["unidad"], areas, direcciones), "cc": admins, "mensaje": _mensaje_renovacion(x), "unidad": x["unidad"]})

        for p in pendientes:
            enviado, error = False, ""
            if p["etapa"] == "OFICIO_EXHORTO":
                error = "Oficio por imprimir y entregar (lo emite Dirección General)."
            elif not p["para"]:
                error = "La unidad no tiene correo registrado en el catálogo."
            elif modo == "activo":
                try:
                    titulo = TITULOS.get(p["etapa"], "Aviso del SGC")
                    asunto, cuerpo, texto = correo.plantilla_recordatorio(p["unidad"], f"{titulo} — {p['registro']}", p["mensaje"], "Sistema de Gestión de la Calidad", url)
                    correo.enviar(p["para"] + p["cc"], asunto, cuerpo, texto, responder_a=os.getenv("BUZON_CORREO"))
                    enviado = True
                except HTTPException as ex:
                    error = str(ex.detail)
            s.add(AvisoAutomatico(tipo=p["tipo"], registro=p["registro"], registro_id=p["registro_id"], etapa=p["etapa"], referencia=p["referencia"],
                                  destinatarios=", ".join(p["para"] + p["cc"]), modo=modo, enviado=enviado, error=error, mensaje=p["mensaje"]))
        s.commit()

        if pendientes and admins:  # resumen diario a los administradores
            filas = "".join(
                f"<tr><td style='padding:6px;border-bottom:1px solid #eef2f6'>{html.escape(TITULOS.get(p['etapa'], p['etapa']))}</td>"
                f"<td style='padding:6px;border-bottom:1px solid #eef2f6'><b>{html.escape(p['registro'])}</b></td>"
                f"<td style='padding:6px;border-bottom:1px solid #eef2f6'>{html.escape(', '.join(p['para']) or '— sin correo —')}</td></tr>" for p in pendientes)
            nota = ("<p><b>Modo simulación:</b> no se envió nada a los responsables. Esto es lo que se habría enviado hoy.</p>" if modo != "activo"
                    else "<p>Estos avisos se enviaron hoy.</p>")
            contenido = (f"{nota}<table style='width:100%;border-collapse:collapse;font-size:13px'>"
                         "<tr><th align='left'>Etapa</th><th align='left'>Registro / unidad</th><th align='left'>Para</th></tr>"
                         f"{filas}</table>{correo.boton('Abrir el Portal SGC', url)}")
            texto = "\n".join(f"{TITULOS.get(p['etapa'], p['etapa'])}: {p['registro']} → {', '.join(p['para']) or 'sin correo'}" for p in pendientes)
            try:
                correo.enviar(admins, f"[Avisos SGC] {hoy.strftime('%d/%m/%Y')}: {len(pendientes)} aviso(s){' (simulación)' if modo != 'activo' else ''}",
                              correo.marco("Avisos automáticos", f"Resumen del {hoy.strftime('%d/%m/%Y')}", contenido, url), texto)
            except HTTPException as ex:
                log.error("No se pudo enviar el resumen diario: %s", ex.detail)
    return {"modo": modo, "hoy": hoy.isoformat(), "avisos": len(pendientes)}


if __name__ == "__main__":
    print(ejecutar(date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else None))
