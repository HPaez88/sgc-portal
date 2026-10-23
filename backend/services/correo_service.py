"""
correo_service.py — Envío de notificaciones por Resend (https://resend.com).

Activo solo si existen RESEND_API_KEY y MAIL_FROM (ej. "Portal SGC <notificaciones@portalsgc.mx>").
Sin ellas el portal sigue funcionando y el frontend usa el correo del propio usuario (mailto).
Plantillas puras (sin red) para poder probarlas.
"""
import html
import logging
import os
import re

import httpx
from fastapi import HTTPException

log = logging.getLogger("sgc.correo")

RESEND_URL = "https://api.resend.com/emails"
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
    cuerpo = f"""<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1e293b">
  <div style="background:#0b192c;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
    <div style="font-size:12px;color:#7dd3fc;letter-spacing:1px">PORTAL SGC · {e(formato)}</div>
    <div style="font-size:18px;font-weight:bold;margin-top:4px">Apertura requerida</div>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;padding:20px;border-radius:0 0 12px 12px">
    <p>Buen día,</p>
    <p>Se detectó <b>{e(que)}</b> que requiere su apertura oficial en el Portal SGC.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:110px">Origen</td><td style="padding:6px 0"><b>{e(origen_txt)}</b></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Área</td><td style="padding:6px 0">{e(area or '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Descripción</td><td style="padding:6px 0">{e(descripcion[:1500])}</td></tr>
    </table>
    <p style="margin:20px 0"><a href="{e(url_portal)}" style="background:#0272c4;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir el Portal SGC</a></p>
    <p style="font-size:13px;color:#475569">Módulo <b>{e(modulo)}</b> → pestaña <b>"Por abrir"</b>: complete el análisis y envíelo al SGC.</p>
    <p style="font-size:13px;color:#475569">Atentamente,<br>{e(remitente_nombre)}<br>Sistema de Gestión de Calidad</p>
  </div>
</div>"""
    return asunto, cuerpo, texto


def enviar(destinatarios: list[str], asunto: str, cuerpo_html: str, texto: str, responder_a: str | None = None) -> str:
    """Envía por Resend y devuelve el id del correo. 503 si no está configurado, 502 si Resend falla."""
    if not configurado():
        raise HTTPException(status_code=503, detail="El envío de correos no está configurado.")
    datos = {"from": os.environ["MAIL_FROM"], "to": destinatarios, "subject": asunto, "html": cuerpo_html, "text": texto}
    if responder_a and RE_CORREO.match(responder_a):
        datos["reply_to"] = responder_a
    try:
        r = httpx.post(RESEND_URL, json=datos, timeout=20,
                       headers={"Authorization": f"Bearer {os.environ['RESEND_API_KEY']}"})
    except httpx.HTTPError as ex:
        log.error("Resend no respondió: %s", ex)
        raise HTTPException(status_code=502, detail="No se pudo contactar al servicio de correo.") from ex
    if r.status_code >= 300:
        log.error("Resend rechazó el envío (%s): %s", r.status_code, r.text[:300])
        raise HTTPException(status_code=502, detail="El servicio de correo rechazó el envío.")
    return r.json().get("id", "")
