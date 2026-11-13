"""
correo_service.py — Envío de notificaciones por Resend (https://resend.com).

Activo solo si existen RESEND_API_KEY y MAIL_FROM (ej. "Portal SGC <notificaciones@portalsgc.mx>").
Sin ellas el portal sigue funcionando y el frontend usa el correo del propio usuario (mailto).
Plantillas puras (sin red) para poder probarlas.
"""
import base64
import html
import logging
import os
import re
from pathlib import Path

import httpx
from fastapi import HTTPException

log = logging.getLogger("sgc.correo")

RESEND_URL = "https://api.resend.com/emails"
LOGO_CID = "logo-oomapasc"
_LOGO = Path(__file__).resolve().parent.parent / "assets" / "logo-oomapasc.png"
MAX_DESTINATARIOS = 10
RE_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def configurado() -> bool:
    return bool(os.getenv("RESEND_API_KEY") and os.getenv("MAIL_FROM"))


def remitente() -> str | None:
    return os.getenv("MAIL_FROM") if configurado() else None


def limpiar_destinatarios(correos) -> list[str]:
    vistos, out = set(), []
    for c in correos or []:
        c = str(c).strip().lower()
        if RE_CORREO.match(c) and c not in vistos:
            vistos.add(c)
            out.append(c)
    if not out:
        raise HTTPException(status_code=422, detail="No hay un correo válido de destinatario.")
    if len(out) > MAX_DESTINATARIOS:
        raise HTTPException(status_code=422, detail=f"Máximo {MAX_DESTINATARIOS} destinatarios por aviso.")
    return out


# ───────────── Diseño institucional (logo OOMAPAS, azul #005B86, franja verde #76BE44) ─────────────
AZUL_OSCURO, VERDE, GRIS = "#005B86", "#76BE44", "#64748b"
LEYENDA = "Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme · Sistema de Gestión de la Calidad"


def url_portal(request=None) -> str:
    """URL pública del portal: PORTAL_URL, o https://DOMAIN, o la del request."""
    if os.getenv("PORTAL_URL"):
        return os.environ["PORTAL_URL"].rstrip("/")
    if os.getenv("DOMAIN"):
        return f"https://{os.environ['DOMAIN']}"
    return str(request.base_url).rstrip("/") if request is not None else ""


def boton(texto: str, enlace: str) -> str:
    e = html.escape
    return (f'<p style="margin:22px 0"><a href="{e(enlace)}" style="background:{AZUL_OSCURO};color:#fff;padding:11px 18px;'
            f'border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">{e(texto)}</a></p>')


def marco(etiqueta: str, titulo: str, contenido_html: str, url: str) -> str:
    """Envoltura común de todos los correos: logo, título, contenido y pie institucional."""
    e = html.escape
    # El logo va incrustado en el correo (cid:), así se ve aunque el cliente bloquee imágenes externas.
    logo = f'<img src="cid:{LOGO_CID}" alt="OOMAPAS de Cajeme" width="116" height="44" style="display:block;margin:0 auto;border:0">'
    return f"""<div style="background:#f1f5f9;padding:24px 12px">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1e293b;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="padding:18px 24px 14px;text-align:center">{logo}</div>
  <div style="height:4px;background:{AZUL_OSCURO}"></div><div style="height:2px;background:{VERDE}"></div>
  <div style="padding:22px 24px 8px">
    <div style="font-size:11px;font-weight:bold;letter-spacing:1px;color:{VERDE};text-transform:uppercase">{e(etiqueta)}</div>
    <div style="font-size:20px;font-weight:bold;color:{AZUL_OSCURO};margin-top:4px">{e(titulo)}</div>
  </div>
  <div style="padding:6px 24px 22px;font-size:14px;line-height:1.55">{contenido_html}</div>
  <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:{GRIS}">{e(LEYENDA)}<br>Correo generado por el Portal SGC. Nunca compartas tu contraseña.</div>
</div></div>"""


def _fila(etiqueta: str, valor_html: str) -> str:
    return (f'<tr><td style="padding:7px 10px;color:{GRIS};width:150px;border-bottom:1px solid #eef2f6">{html.escape(etiqueta)}</td>'
            f'<td style="padding:7px 10px;border-bottom:1px solid #eef2f6">{valor_html}</td></tr>')


def plantilla_acceso(nombre: str, email: str, password_temporal: str, url: str, motivo: str = "alta") -> tuple[str, str, str]:
    """Datos de acceso con contraseña temporal. motivo: 'alta' (usuario nuevo) o 'restablecer'."""
    e = html.escape
    nuevo = motivo == "alta"
    asunto = "Tu acceso al Portal SGC de OOMAPAS de Cajeme" if nuevo else "Nueva contraseña temporal — Portal SGC"
    intro = ("Se creó tu cuenta en el Portal del Sistema de Gestión de la Calidad." if nuevo
             else "Se generó una nueva contraseña temporal para tu cuenta del Portal SGC.")
    texto = (f"Hola {nombre},\n\n{intro}\n\nEntra en: {url}\nUsuario: {email}\nContraseña temporal: {password_temporal}\n\n"
             "Al entrar, el portal te pedirá cambiarla por una personal. Si no solicitaste este acceso, avisa al SGC.\n\n"
             "Sistema de Gestión de la Calidad\nOOMAPAS de Cajeme")
    clave = ('<span style="font-family:Consolas,monospace;font-size:16px;font-weight:bold;letter-spacing:1px;'
             f'background:#f1f5f9;padding:3px 8px;border-radius:6px">{e(password_temporal)}</span>')
    contenido = (f"<p>Hola <b>{e(nombre)}</b>,</p><p>{e(intro)}</p>"
                 '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">'
                 f"{_fila('Usuario', f'<b>{e(email)}</b>')}{_fila('Contraseña temporal', clave)}"
                 f"</table>{boton('Entrar al Portal SGC', url)}"
                 '<p style="font-size:13px;color:#475569">Al entrar, el portal te pedirá cambiarla por una contraseña personal. '
                 "Si después la olvidas, usa «¿Olvidaste tu contraseña?» en la pantalla de inicio.</p>")
    return asunto, marco("Accesos", "Tu acceso al portal" if nuevo else "Contraseña temporal", contenido, url), texto


def plantilla_recuperacion(nombre: str, enlace: str, minutos: int, url: str) -> tuple[str, str, str]:
    """Enlace de un solo uso para que el usuario ponga una contraseña nueva."""
    e = html.escape
    asunto = "Recupera tu contraseña — Portal SGC"
    texto = (f"Hola {nombre},\n\nRecibimos una solicitud para recuperar tu contraseña del Portal SGC.\n"
             f"Abre este enlace (vale {minutos} minutos y se usa una sola vez):\n{enlace}\n\n"
             "Si no la solicitaste, ignora este correo: tu contraseña no cambia.\n\nSistema de Gestión de la Calidad\nOOMAPAS de Cajeme")
    contenido = (f"<p>Hola <b>{e(nombre)}</b>,</p><p>Recibimos una solicitud para recuperar tu contraseña del Portal SGC.</p>"
                 f"{boton('Poner una contraseña nueva', enlace)}"
                 f'<p style="font-size:13px;color:#475569">El enlace vale <b>{minutos} minutos</b> y se usa una sola vez. '
                 "Si no la solicitaste, ignora este correo: tu contraseña no cambia.</p>")
    return asunto, marco("Seguridad", "Recuperar contraseña", contenido, url), texto


def plantilla_apertura(tipo: str, area: str, origen: str, referencia: str, descripcion: str,
                       remitente_nombre: str, url_portal: str) -> tuple[str, str, str]:
    """(asunto, html, texto) del aviso de apertura de AC/PM."""
    es_ac = tipo == "AC"
    que = "una no conformidad" if es_ac else "una oportunidad de mejora"
    formato = "OOMRSC-20" if es_ac else "OOMRSC-21"
    modulo = "Acciones Correctivas" if es_ac else "Planes de Mejora"
    asunto = f"Apertura requerida de {'acción correctiva' if es_ac else 'mejora'} ({formato}) — {area or 'Área'}"
    origen_txt = f"{origen}{f' ({referencia})' if referencia else ''}"
    texto = (
        f"Buen día,\n\nSe detectó {que} que requiere su apertura oficial en el Portal SGC (formato {formato}).\n\n"
        f"Origen: {origen_txt}\nÁrea: {area or '—'}\nDescripción: {descripcion[:1500]}\n\n"
        f"Ingrese al portal ({url_portal}), módulo {modulo} → pestaña \"Por abrir\", complete el análisis y envíelo al SGC.\n\n"
        f"Atentamente,\n{remitente_nombre}\nSistema de Gestión de Calidad"
    )
    e = html.escape
    contenido = ("<p>Buen día,</p>"
                 f"<p>Se detectó <b>{e(que)}</b> que requiere su apertura oficial en el Portal SGC.</p>"
                 '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">'
                 f"{_fila('Origen', f'<b>{e(origen_txt)}</b>')}{_fila('Área', e(area or '—'))}{_fila('Descripción', e(descripcion[:1500]))}</table>"
                 f"{boton('Abrir el Portal SGC', url_portal)}"
                 f'<p style="font-size:13px;color:#475569">Módulo <b>{e(modulo)}</b> → pestaña <b>"Por abrir"</b>: complete el análisis y envíelo al SGC.</p>'
                 f'<p style="font-size:13px;color:#475569">Atentamente,<br>{e(remitente_nombre)}<br>Sistema de Gestión de Calidad</p>')
    cuerpo = marco(f"Portal SGC · {formato}", "Apertura requerida", contenido, url_portal)
    return asunto, cuerpo, texto


def plantilla_libre(asunto: str, mensaje: str, remitente_nombre: str, url_portal: str) -> tuple[str, str, str]:
    """(asunto, html, texto) de un aviso libre que redacta un administrador."""
    texto = f"{mensaje}\n\n--\n{remitente_nombre}\nSistema de Gestión de Calidad · {url_portal}"
    e = html.escape
    parrafos = "".join(f"<p>{e(p)}</p>" for p in mensaje.split("\n") if p.strip())
    contenido = (f"{parrafos}{boton('Abrir el Portal SGC', url_portal)}"
                 f'<p style="font-size:13px;color:#475569">{e(remitente_nombre)}<br>Sistema de Gestión de Calidad</p>')
    cuerpo = marco("Portal SGC · Aviso", asunto, contenido, url_portal)
    return asunto, cuerpo, texto


def enviar(destinatarios: list[str], asunto: str, cuerpo_html: str, texto: str, responder_a=None) -> str:
    """Envía por Resend y devuelve el id del correo. 503 si no está configurado, 502 si Resend falla."""
    if not configurado():
        raise HTTPException(status_code=503, detail="El envío de correos no está configurado.")
    datos = {"from": os.environ["MAIL_FROM"], "to": destinatarios, "subject": asunto, "html": cuerpo_html, "text": texto}
    # "Responder a": uno o varios correos (p. ej. los administradores del SGC); se ignoran los inválidos.
    respuestas = [c for c in ([responder_a] if isinstance(responder_a, str) else (responder_a or [])) if c and RE_CORREO.match(c)]
    if respuestas:
        datos["reply_to"] = respuestas[0] if len(respuestas) == 1 else respuestas[:10]
    if f"cid:{LOGO_CID}" in cuerpo_html and _LOGO.is_file():
        datos["attachments"] = [{"filename": "logo-oomapasc.png", "content": base64.b64encode(_LOGO.read_bytes()).decode(),
                                 "content_type": "image/png", "content_id": LOGO_CID}]
    try:
        r = httpx.post(RESEND_URL, json=datos, timeout=20,
                       headers={"Authorization": f"Bearer {os.environ['RESEND_API_KEY']}"})
    except httpx.HTTPError as ex:
        log.error("Resend no respondió: %s", ex)
        raise HTTPException(status_code=502, detail="No se pudo contactar al servicio de correo.") from ex
    if r.status_code >= 300:
        log.error("Resend rechazó el envío (%s): %s", r.status_code, r.text[:300])
        if r.status_code == 403:
            # Dominio sin verificar o remitente de prueba: Resend solo entrega a la cuenta dueña.
            raise HTTPException(status_code=502, detail="El dominio del correo institucional aún no está verificado en Resend; "
                                                        "por ahora solo se puede enviar a la cuenta dueña.")
        raise HTTPException(status_code=502, detail="El servicio de correo rechazó el envío.")
    return r.json().get("id", "")
