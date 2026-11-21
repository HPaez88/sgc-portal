"""
avisos_diarios.py — Tarea diaria (lunes a viernes, 8:00 a.m. de Cajeme) de recordatorios, avisos de incumplimiento
y oficios de exhorto. La programa el cron del servidor:  docker exec sgc-app python -m backend.tareas.avisos_diarios

AVISOS_MODO: "simulacion" (por omisión: no se manda nada a los responsables; a los administradores les llega el
resumen de lo que se habría enviado), "activo" (se envía) o "apagado". AVISOS_ARRANQUE: fecha (aaaa-mm-dd) desde la
que cuentan los vencimientos; lo vencido antes no entra.

Vista previa sin enviar ni registrar nada:  python -m backend.tareas.avisos_diarios --vista-previa [aaaa-mm-dd]
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
CLAVE_PREFERENCIAS = "sgc-config-avisos-admin"   # {correo_admin: {tema: bool}} — Configuración → Avisos por correo
CLAVE_PARAMETROS = "sgc-config-avisos-parametros"  # plazos de recordatorios (ver avisos_calendario.normalizar)
MAX_DESCRIPCION = 400
TITULOS = {
    "RECORDATORIO_15": "Recordatorio: faltan 15 días", "RECORDATORIO_10": "Recordatorio: faltan 10 días",
    "RECORDATORIO_5": "Recordatorio urgente: faltan 5 días", "VENCE_HOY": "Hoy vence",
    "AVISO_INCUMPLIMIENTO": "Aviso de incumplimiento", "OFICIO_EXHORTO": "Oficio de exhorto por emitir",
    "AVISO": "Entrega de resultados de indicadores", "RECORDATORIO": "Recordatorio de entrega de indicadores",
    "ULTIMO_RECORDATORIO": "Hoy vence la entrega de indicadores",
    "RENOVACION_OCT": "Confirmación del proyecto del año siguiente", "RENOVACION_NOV": "Recordatorio: confirmar el proyecto del año siguiente",
    "RENOVACION_DIC": "Urgente: confirmar el proyecto del año siguiente",
    "AUDITOR_ASIGNADO": "Se te asignó la verificación de eficacia",
    "INICIO_CAPTURA": "Inicia la captura",
}


def titulo(etapa: str) -> str:
    """Título del aviso; los recordatorios que agregue el SGC (p. ej. 30 días antes, día 8) también tienen nombre."""
    if etapa in TITULOS:
        return TITULOS[etapa]
    if etapa.startswith("RECORDATORIO_D"):
        return "Recordatorio de entrega de indicadores"
    if etapa.startswith("RECORDATORIO_"):
        n = etapa.split("_")[-1]
        urgente = " urgente" if n.isdigit() and int(n) <= 5 else ""
        return f"Recordatorio{urgente}: faltan {n} días"
    return "Aviso del SGC"
NOMBRE_TIPO = {"AC": "la acción correctiva", "PM": "el plan de mejora"}


def _estado(s: Session, clave: str, defecto):
    f = s.exec(select(EstadoPortal).where(EstadoPortal.clave == clave)).first()
    try:
        return json.loads(f.valor) if f else defecto
    except ValueError:
        return defecto


def _contactos(unidad: str, areas: list, direcciones: list) -> list[str]:
    """Responsable del área (correo de avisos) y quienes la apoyan en el SGC (encargados_sgc), del catálogo."""
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


def _descripcion(tipo: str, reg: dict) -> str:
    if tipo == "PM":
        titulo, situacion = str(reg.get("titulo_mejora") or "").strip(), str(reg.get("descripcion_situacion_actual") or "").strip()
        # Los PM del Control 6 repiten el título en la situación actual: no se duplica.
        texto = situacion if titulo and situacion.startswith(titulo[:60]) else " — ".join(t for t in [titulo, situacion] if t)
    else:
        texto = reg.get("descripcion_no_conformidad_final") or reg.get("descripcion_no_conformidad_original") or ""
    texto = " ".join(str(texto).split())
    return texto if len(texto) <= MAX_DESCRIPCION else texto[:MAX_DESCRIPCION].rstrip() + "…"


def _mensaje_registro(tipo: str, a: dict) -> str:
    vence = a["vence"].strftime("%d/%m/%Y")
    que = f"{NOMBRE_TIPO[tipo]} {a['folio']}"
    if a["etapa"] == "AVISO_INCUMPLIMIENTO":
        base = (f"{que[0].upper()}{que[1:]} venció el {vence} y no se ha atendido lo requerido por el Sistema de Gestión de la Calidad.\n"
                "Les pedimos atenderla a la brevedad. De no hacerlo en los próximos 5 días hábiles, Dirección General emitirá un oficio de "
                "exhorto dirigido al titular del área, con copia a su director, conforme a la Política de sanciones.")
    elif a["etapa"] == "VENCE_HOY":
        base = f"Hoy {vence} vence {que}. Registren en el portal el avance y las evidencias de sus actividades."
    else:
        dias = a["etapa"].split("_")[-1]
        base = f"{que[0].upper()}{que[1:]} vence el {vence} (faltan {dias} días). Registren en el portal el avance y las evidencias de sus actividades."
    desc = _descripcion(tipo, a["ac"])
    return f"Folio: {a['folio']}\nDescripción: {desc or '—'}\n\n{base}"


def _mensaje_auditor(tipo: str, x: dict) -> str:
    return (f"Se te asignó la verificación de eficacia de {NOMBRE_TIPO[tipo]} {x['folio']} del área {x['area'] or '—'}.\n"
            f"Folio: {x['folio']}\nDescripción: {_descripcion(tipo, x['registro']) or '—'}\n\n"
            "Ingresa al portal, revisa las evidencias de sus actividades y emite el dictamen (eficaz o no eficaz).")


def _mensaje_ind(x: dict) -> str:
    lista = "\n".join(f"• #{i['id']} {i['nombre']}" for i in x["indicadores"])
    base = {
        "AVISO": f"Ya pueden capturar en el portal los resultados de {x['mes_texto']}. La fecha límite es el día 10.",
        "RECORDATORIO": f"Recordatorio: falta capturar los resultados de {x['mes_texto']}. La fecha límite es el día 10.",
        "ULTIMO_RECORDATORIO": f"Hoy vence la entrega de los resultados de {x['mes_texto']}.",
        "AVISO_INCUMPLIMIENTO": (f"No se ha entregado el resultado de {x['mes_texto']} de los indicadores siguientes. Les pedimos capturarlo a la brevedad; "
                                 "de no hacerlo, Dirección General emitirá un oficio de exhorto dirigido al titular del área, con copia a su director, "
                                 "conforme a la Política de sanciones."),
        "RECORDATORIO_EXTRA": f"Recordatorio: falta capturar los resultados de {x['mes_texto']}.",
    }.get("RECORDATORIO_EXTRA" if x["etapa"].startswith("RECORDATORIO_D") else x["etapa"], "")
    return f"{base}\n\n{lista}"


def _mensaje_renovacion(x: dict) -> str:
    urgencia = {"RENOVACION_NOV": "Aún no se ha confirmado. ", "RENOVACION_DIC": "Diciembre es el último mes para confirmarlo. "}.get(x["etapa"], "")
    return (f"{urgencia}Para {x['periodo']} necesitamos saber si su área seguirá con el mismo proyecto, actividades e indicadores "
            f"(\"{x['proyecto']}\") o si se actualizará alguna información.\n\n"
            "En el portal, en Indicadores → Proyecto anual, elijan \"Sigue igual\" para enviarlo tal cual a aceptación del SGC, "
            "o \"Actualizar\" para modificarlo antes de enviarlo. Una vez aceptado por el SGC, el proyecto queda cerrado para cambios.")


def _mensaje_matriz(x: dict) -> str:
    limite = x["fecha_limite"].strftime("%d/%m/%Y")
    anio = x["periodo"]
    if x["etapa"] == "AVISO_INCUMPLIMIENTO":
        return (f"La fecha límite para entregar la matriz de riesgos y oportunidades {anio} (OOMRSC-37) fue el {limite} y su área aún no la envía.\n"
                "Les pedimos capturarla y enviarla al SGC a la brevedad.")
    if x["etapa"] == "INICIO_CAPTURA":
        return (f"Inicia la captura de la matriz de riesgos y oportunidades {anio} (OOMRSC-37). Se captura en enero y febrero; "
                f"la fecha límite para enviarla al SGC es el {limite}.\n\n"
                f"En el portal, en Matriz de Riesgos → Matriz por área, elijan {anio}. Con \"Traer de {int(anio) - 1}\" pueden partir de los "
                "riesgos del año anterior y volver a evaluarlos.")
    cuando = f"hoy {limite}" if x["etapa"] == "VENCE_HOY" else f"el {limite} (faltan {x['etapa'].split('_')[-1]} días)"
    return (f"La matriz de riesgos y oportunidades {anio} (OOMRSC-37) de su área debe enviarse al SGC a más tardar {cuando}.\n\n"
            f"En el portal, en Matriz de Riesgos → Matriz por área, elijan {anio}. Con \"Traer de {int(anio) - 1}\" pueden partir de los "
            "riesgos del año anterior y volver a evaluarlos; al terminar, envíen la matriz a revisión del SGC.")


def parametros(s: Session) -> dict:
    return cal.normalizar(_estado(s, CLAVE_PARAMETROS, {}))


def calcular(s: Session, hoy: date, modo: str) -> tuple[list, list]:
    """(avisos que tocan hoy, administradores que reciben el resumen). No envía ni registra nada."""
    params = parametros(s)
    arranque = date.fromisoformat(os.getenv("AVISOS_ARRANQUE") or hoy.isoformat())
    previos = s.exec(select(AvisoAutomatico).where(AvisoAutomatico.modo == modo)).all()
    hechas = lambda tipo, por_id=True: {((p.registro_id if por_id else p.registro), p.referencia, p.etapa) for p in previos if p.tipo == tipo}
    areas = _estado(s, "sgc-config-areas-detalle", [])
    direcciones = _estado(s, "sgc-config-direcciones-detalle", [])
    prefs = _estado(s, CLAVE_PREFERENCIAS, {})
    datos_ind = _estado(s, "sgc-indicadores-data", {})
    proyectos = _estado(s, "sgc-proyectos-indicadores", [])
    catalogo = motor.catalogo_vivo(json.load(open(CATALOGO, encoding="utf-8")), datos_ind.get("catalogoPersonalizado") or {}, proyectos, hoy)
    activos = [u for u in s.exec(select(Usuario)).all() if u.activo]
    admins = [u.email for u in activos if u.rol in ("Super Admin", "Admin")]
    # Solo personas del directorio reciben avisos (auditoría 2026-11-18): el registro lo edita el área, el catálogo solo el SGC.
    directorio = [{"email": u.email, "nombre": u.nombre} for u in activos]
    correos_dir = {str(u.email).lower() for u in activos}
    cc_incumplimiento = motor.admins_con_tema(admins, prefs, "incumplimiento")

    pendientes = []
    registros = {"AC": _estado(s, "sgc-acciones-correctivas", []), "PM": _estado(s, "sgc-planes-mejora", [])}
    for tipo, lista in registros.items():
        for a in motor.avisos_acciones(lista, hoy, arranque, hechas(tipo), params):
            para = motor.destinatarios_registro(a["ac"], _contactos(a["area"], areas, direcciones), directorio)
            pendientes.append({"tipo": tipo, "registro": a["folio"], "registro_id": str(a["id"]), "etapa": a["etapa"], "referencia": a["vence"].isoformat(),
                               "para": para, "cc": cc_incumplimiento if a["etapa"] == "AVISO_INCUMPLIMIENTO" else [],
                               "mensaje": _mensaje_registro(tipo, a), "unidad": a["area"]})
        for x in motor.avisos_auditor(lista, hechas("AUDITOR")):
            para = [x["auditor"]] if str(x["auditor"]).lower() in correos_dir else []
            pendientes.append({"tipo": "AUDITOR", "registro": x["folio"], "registro_id": str(x["id"]), "etapa": "AUDITOR_ASIGNADO",
                               "referencia": x["referencia"], "para": para, "cc": [], "mensaje": _mensaje_auditor(tipo, x), "unidad": x["area"]})
    for x in motor.avisos_indicadores(catalogo, datos_ind.get("resultados") or {}, hoy, hechas("INDICADORES", False), arranque, params):
        pendientes.append({"tipo": "INDICADORES", "registro": x["unidad"], "registro_id": "", "etapa": x["etapa"], "referencia": x["periodo"],
                           "para": _contactos(x["unidad"], areas, direcciones), "cc": cc_incumplimiento if x["etapa"] == "AVISO_INCUMPLIMIENTO" else [],
                           "mensaje": _mensaje_ind(x), "unidad": x["unidad"]})
    # Renovación anual del proyecto (octubre–diciembre): al área y a quienes la apoyan en el SGC, con copia a los administradores.
    for x in motor.avisos_renovacion(proyectos, hoy, hechas("RENOVACION", False)):
        pendientes.append({"tipo": "RENOVACION", "registro": x["unidad"], "registro_id": "", "etapa": x["etapa"], "referencia": x["periodo"],
                           "para": _contactos(x["unidad"], areas, direcciones), "cc": motor.admins_con_tema(admins, prefs, "renovacion"),
                           "mensaje": _mensaje_renovacion(x), "unidad": x["unidad"]})
    # Matriz de riesgos del año: periodo de captura enero-febrero; solo las áreas la entregan (direcciones y organismo se arman de ellas).
    for x in motor.avisos_matrices([a.get("nombre") for a in areas if a.get("nombre")], _estado(s, "sgc-matrices-riesgos", []), hoy,
                                    hechas("MATRIZ", False), params, arranque):
        pendientes.append({"tipo": "MATRIZ", "registro": x["unidad"], "registro_id": "", "etapa": x["etapa"], "referencia": x["periodo"],
                           "para": _contactos(x["unidad"], areas, direcciones), "cc": cc_incumplimiento if x["etapa"] == "AVISO_INCUMPLIMIENTO" else [],
                           "mensaje": _mensaje_matriz(x), "unidad": x["unidad"], "asunto": f"Matriz de riesgos y oportunidades {x['periodo']}"})
    return pendientes, motor.admins_con_tema(admins, prefs, "resumen")


def _resumen(pendientes: list, admins: list, hoy: date, modo: str, url: str) -> None:
    filas = "".join(
        f"<tr><td style='padding:6px;border-bottom:1px solid #eef2f6'>{html.escape(titulo(p['etapa']))}</td>"
        f"<td style='padding:6px;border-bottom:1px solid #eef2f6'><b>{html.escape(p['registro'])}</b></td>"
        f"<td style='padding:6px;border-bottom:1px solid #eef2f6'>{html.escape(', '.join(p['para']) or '— sin correo —')}</td></tr>" for p in pendientes)
    nota = ("<p><b>Modo simulación:</b> no se envió nada a los responsables. Esto es lo que se habría enviado hoy.</p>" if modo != "activo"
            else "<p>Estos avisos se enviaron hoy.</p>")
    contenido = (f"{nota}<table style='width:100%;border-collapse:collapse;font-size:13px'>"
                 "<tr><th align='left'>Etapa</th><th align='left'>Registro / unidad</th><th align='left'>Para</th></tr>"
                 f"{filas}</table>{correo.boton('Abrir el Portal SGC', url)}")
    texto = "\n".join(f"{titulo(p['etapa'])}: {p['registro']} → {', '.join(p['para']) or 'sin correo'}" for p in pendientes)
    try:
        correo.enviar(admins, f"[Avisos SGC] {hoy.strftime('%d/%m/%Y')}: {len(pendientes)} aviso(s){' (simulación)' if modo != 'activo' else ''}",
                      correo.marco("Avisos automáticos", f"Resumen del {hoy.strftime('%d/%m/%Y')}", contenido, url), texto)
    except HTTPException as ex:
        log.error("No se pudo enviar el resumen diario: %s", ex.detail)


def ejecutar(hoy: date | None = None) -> dict:
    modo = os.getenv("AVISOS_MODO", "simulacion").lower()
    hoy = hoy or datetime.now(ZONA).date()
    if modo == "apagado":
        return {"modo": modo, "hoy": hoy.isoformat(), "avisos": 0}
    url = correo.url_portal()
    with Session(engine) as s:
        if not cal.es_habil(hoy, parametros(s)):  # fin de semana o feriado capturado por el SGC
            return {"modo": modo, "hoy": hoy.isoformat(), "avisos": 0}
        pendientes, admins_resumen = calcular(s, hoy, modo)
        for p in pendientes:
            enviado, error = False, ""
            if p["etapa"] == "OFICIO_EXHORTO":
                error = "Oficio por imprimir y entregar (lo emite Dirección General)."
            elif not p["para"]:
                error = "Sin destinatario: revisa el correo del área en el catálogo o que la persona esté en Usuarios del sistema."
            elif modo == "activo":
                try:
                    asunto, cuerpo, texto = correo.plantilla_recordatorio(p["unidad"], f"{titulo(p['etapa'])} — {p.get('asunto') or p['registro']}", p["mensaje"], "Sistema de Gestión de la Calidad", url)
                    correo.enviar(p["para"] + p["cc"], asunto, cuerpo, texto, responder_a=os.getenv("BUZON_CORREO"))
                    enviado = True
                except HTTPException as ex:
                    error = str(ex.detail)
            s.add(AvisoAutomatico(tipo=p["tipo"], registro=p["registro"], registro_id=p["registro_id"], etapa=p["etapa"], referencia=p["referencia"],
                                  destinatarios=", ".join(p["para"] + p["cc"]), modo=modo, enviado=enviado, error=error, mensaje=p["mensaje"]))
        s.commit()
        if pendientes and admins_resumen:  # resumen diario a los administradores que lo tienen activado
            _resumen(pendientes, admins_resumen, hoy, modo, url)
    return {"modo": modo, "hoy": hoy.isoformat(), "avisos": len(pendientes)}


def vista_previa(hoy: date | None = None, modo: str = "activo") -> list:
    hoy = hoy or datetime.now(ZONA).date()
    with Session(engine) as s:
        pendientes, admins_resumen = calcular(s, hoy, modo)
    return [{"etapa": p["etapa"], "registro": p["registro"], "para": p["para"], "cc": p["cc"], "mensaje": p["mensaje"]} for p in pendientes] + \
        [{"resumen_a": admins_resumen}]


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--vista-previa":
        fecha = date.fromisoformat(args[1]) if len(args) > 1 else None
        print(json.dumps(vista_previa(fecha), ensure_ascii=False, indent=1))
    else:
        print(ejecutar(date.fromisoformat(args[0]) if args else None))
