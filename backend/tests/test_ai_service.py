"""IA: las respuestas JSON se piden en modo json_object y, si el modelo no lo soporta, se reintenta sin él."""
from types import SimpleNamespace

from backend.services import ai_service


class FalsoCliente:
    def __init__(self, rechaza_json=False):
        self.llamadas = []
        self.rechaza_json = rechaza_json
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create))

    def create(self, **kw):
        self.llamadas.append(kw)
        if self.rechaza_json and "response_format" in kw:
            raise RuntimeError("response_format json_object not supported")
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='{"sugerencias": []}'))])


def test_json_mode_se_pide(monkeypatch):
    cli = FalsoCliente()
    monkeypatch.setattr(ai_service, "get_ai_client", lambda: cli)
    assert ai_service.generar_json_desde_prompt("p", "c") == {"sugerencias": []}
    assert cli.llamadas[0]["response_format"] == {"type": "json_object"}


def test_sin_soporte_reintenta_sin_json_mode(monkeypatch):
    cli = FalsoCliente(rechaza_json=True)
    monkeypatch.setattr(ai_service, "get_ai_client", lambda: cli)
    assert ai_service.generar_json_desde_prompt("p", "c") == {"sugerencias": []}
    assert len(cli.llamadas) == 2 and "response_format" not in cli.llamadas[1]
