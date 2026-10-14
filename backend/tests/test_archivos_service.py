"""Pruebas de la lógica pura del pipeline de archivos (sin ClamAV ni B2)."""
import io

import pikepdf
import pytest
from fastapi import HTTPException
from PIL import Image

from backend.services import archivos_service as svc


def _png(ancho=2400, alto=1800) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (ancho, alto), (10, 120, 200)).save(buf, format="PNG")
    return buf.getvalue()


def _jpeg_con_exif() -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (800, 600), (200, 50, 50))
    exif = Image.Exif()
    exif[0x010F] = "CamaraPrueba"  # Make
    exif[0x0110] = "ModeloPrueba"  # Model
    img.save(buf, format="JPEG", exif=exif.tobytes())
    return buf.getvalue()


def _pdf(con_js=False) -> bytes:
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(200, 200))
    if con_js:
        js = pdf.make_indirect(pikepdf.Dictionary(S=pikepdf.Name.JavaScript, JS=pikepdf.String("app.alert('x')")))
        pdf.Root.OpenAction = js
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


def test_detecta_tipo_por_contenido_no_por_extension():
    assert svc.detectar_mime(_png()) == "image/png"
    assert svc.detectar_mime(_pdf()) == "application/pdf"
    assert svc.detectar_mime(b"MZ\x90\x00 ejecutable") is None


def test_rechaza_tipo_no_permitido():
    with pytest.raises(HTTPException) as e:
        svc.validar_y_sanear("virus.jpg", b"MZ\x90\x00 no es imagen")
    assert e.value.status_code == 422


def test_imagen_se_reduce_recodifica_y_pierde_exif():
    resultado = svc.validar_y_sanear("foto.jpg", _jpeg_con_exif())
    assert resultado.mime == "image/webp" and resultado.tipo == "imagen"
    with Image.open(io.BytesIO(resultado.contenido)) as img:
        assert img.format == "WEBP"
        assert not img.getexif()  # sin metadatos
    grande = svc.validar_y_sanear("grande.png", _png())
    with Image.open(io.BytesIO(grande.contenido)) as img:
        assert max(img.size) <= svc.IMAGEN_LADO_MAX


def test_pdf_limpio_pasa_y_pdf_con_javascript_se_rechaza():
    limpio = svc.validar_y_sanear("acta.pdf", _pdf())
    assert limpio.tipo == "pdf" and limpio.contenido.startswith(b"%PDF")
    with pytest.raises(HTTPException) as e:
        svc.validar_y_sanear("malo.pdf", _pdf(con_js=True))
    assert e.value.status_code == 422


def test_clave_b2_aislada_por_organismo_y_sin_caracteres_raros():
    clave = svc.generar_clave_b2(7, "AC ../x", "webp")
    assert clave.startswith("org-7/ac") and ".." not in clave and clave.endswith(".webp")


def test_antivirus_omitido_solo_fuera_de_produccion(monkeypatch):
    monkeypatch.delenv("CLAMAV_HOST", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "development")
    assert svc.escanear_antivirus(b"hola") == "omitido"
    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(HTTPException) as e:
        svc.escanear_antivirus(b"hola")
    assert e.value.status_code == 503
