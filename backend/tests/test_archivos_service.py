"""Pruebas de la lógica pura del pipeline de archivos (sin ClamAV ni B2)."""
import io
import zipfile

import docx as python_docx
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


def _pdf_escaneado(px=2600) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (px, px), (240, 240, 240)).save(buf, format="PDF", resolution=300)
    return buf.getvalue()


def _docx(con_macro=False) -> bytes:
    buf = io.BytesIO()
    d = python_docx.Document()
    d.add_paragraph("Evidencia de prueba")
    d.save(buf)
    if not con_macro:
        return buf.getvalue()
    salida = io.BytesIO()
    with zipfile.ZipFile(buf) as zin, zipfile.ZipFile(salida, "w") as zout:
        for n in zin.namelist():
            zout.writestr(n, zin.read(n))
        zout.writestr("word/vbaProject.bin", b"macro falsa")
    return salida.getvalue()


def test_detecta_tipo_por_contenido_no_por_extension():
    assert svc.detectar_mime(_png()) == "image/png"
    assert svc.detectar_mime(_pdf()) == "application/pdf"
    assert svc.detectar_mime(_docx()) == "application/zip"
    assert svc.detectar_mime(b"MZ\x90 ejecutable") is None


def test_rechaza_tipo_no_permitido():
    with pytest.raises(HTTPException) as e:
        svc.validar_y_sanear("virus.jpg", b"MZ\x90 no es imagen")
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


def test_pdf_escaneado_se_comprime_y_pierde_metadatos():
    original = _pdf_escaneado()
    resultado = svc.validar_y_sanear("escaneo.pdf", original)
    assert len(resultado.contenido) < len(original) * 0.5
    with pikepdf.open(io.BytesIO(resultado.contenido)) as pdf:
        img = next(iter(pdf.pages[0].get_images().values()))
        assert max(int(img.Width), int(img.Height)) <= svc.PDF_IMAGEN_LADO_MAX
        assert "/Metadata" not in pdf.Root and not dict(pdf.docinfo)


def test_docx_limpio_pasa_sin_docprops_y_con_macro_se_rechaza():
    limpio = svc.validar_y_sanear("informe.docx", _docx())
    assert limpio.tipo == "docx" and limpio.mime == svc.MIME_DOCX
    nombres = zipfile.ZipFile(io.BytesIO(limpio.contenido)).namelist()
    assert "word/document.xml" in nombres and not any(n.lower().startswith("docprops/") for n in nombres)
    with pytest.raises(HTTPException) as e:
        svc.validar_y_sanear("macro.docx", _docx(con_macro=True))
    assert e.value.status_code == 422


def test_zip_que_no_es_docx_se_rechaza():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("payload.exe", b"MZ")
    with pytest.raises(HTTPException) as e:
        svc.validar_y_sanear("algo.docx", buf.getvalue())
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
