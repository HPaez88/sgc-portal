"""Avisos por correo: plantilla, validación de destinatarios, apagado limpio sin llave y envío simulado."""
import pytest
from fastapi import HTTPException

from backend.services import correo_service as correo


def test_destinatarios_validos_sin_duplicados():
    assert correo.limpiar_destinatarios(["A@oomapasc.gob.mx", "a@oomapasc.gob.mx", "malo", " b@x.mx "]) == ["a@oomapasc.gob.mx", "b@x.mx"]
    with pytest.raises(HTTPException):
        correo.limpiar_destinatarios(["sin-arroba"])


def test_plantilla_escapa_html_y_lleva_datos():
    asunto, cuerpo, texto = correo.plantilla_apertura("AC", "Plantas", "Auditoría", "AUD-7", "<script>x</script>", "Lic. H", "https://sgc")
    assert "OOMRSC-20" in asunto and "Plantas" in asunto
    assert "<script>" not in cuerpo and "&lt;script&gt;" in cuerpo
    assert "AUD-7" in texto and "Por abrir" in texto


def test_sin_llave_queda_apagado(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    assert not correo.configurado()
    with pytest.raises(HTTPException) as e:
        correo.enviar(["a@b.mx"], "s", "<p>h</p>", "t")
    assert e.value.status_code == 503


def test_envio_por_resend(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_prueba")
    monkeypatch.setenv("MAIL_FROM", "Portal SGC <notificaciones@portalsgc.mx>")
    capturado = {}

    class Resp:
        status_code = 200
        def json(self):
            return {"id": "abc123"}

    def falso_post(url, json, timeout, headers):
        capturado.update(url=url, json=json, headers=headers)
        return Resp()

    monkeypatch.setattr(correo.httpx, "post", falso_post)
    assert correo.enviar(["a@b.mx"], "Asunto", "<p>h</p>", "t", responder_a="hpaez@oomapasc.gob.mx") == "abc123"
    assert capturado["url"] == correo.RESEND_URL
    assert capturado["headers"]["Authorization"] == "Bearer re_prueba"
    assert capturado["json"]["from"].endswith("<notificaciones@portalsgc.mx>")
    assert capturado["json"]["reply_to"] == "hpaez@oomapasc.gob.mx"
