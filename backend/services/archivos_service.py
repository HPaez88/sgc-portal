"""
archivos_service.py — Pipeline de archivos del portal (evidencias y documentos).

Flujo por archivo:  magic bytes → antivirus (ClamAV) → saneado y compresión (imagen re-codificada /
PDF sin scripts y con imágenes reducidas / Word .docx sin macros) → Backblaze B2 (S3) → metadatos
en Postgres (router).

Lógica pura (validar/sanear) separada de la red (ClamAV/B2) para poder probarla sin servicios.
"""
import hashlib
import io
import logging
import os
import re
import uuid
import zipfile
from dataclasses import dataclass

from fastapi import HTTPException

log = logging.getLogger("sgc.archivos")

# ───────────── Constantes (calibrar con uso real) ─────────────
# Evidencias: sirven para ver qué se hizo, no para imprimir en alta calidad. Se comprime a fondo.
MAX_BYTES_IMAGEN = 15 * 1024 * 1024
MAX_BYTES_PDF = 25 * 1024 * 1024
MAX_BYTES_DOCX = 10 * 1024 * 1024
IMAGEN_LADO_MAX = 1280          # px, lado mayor
IMAGEN_CALIDAD_WEBP = 72
PDF_IMAGEN_LADO_MAX = 1400      # imágenes dentro de PDF escaneados
PDF_IMAGEN_CALIDAD_JPEG = 68
URL_FIRMADA_SEGUNDOS = 15 * 60

MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
MAGIC = {
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
    b"%PDF": "application/pdf",
    b"PK\x03\x04": "application/zip",   # docx (se confirma por estructura)
}
# Entradas de un .docx que permiten ejecutar código o traer contenido externo
DOCX_ENTRADAS_PROHIBIDAS = ("vbaproject", "/embeddings/", "activex", "oleobject", ".bin", ".exe", ".js")


@dataclass(frozen=True)
class ArchivoSaneado:
    contenido: bytes
    mime: str
    extension: str
    tipo: str  # 'imagen' | 'pdf' | 'docx'
    sha256: str


# ───────────── Lógica pura ─────────────
def detectar_mime(contenido: bytes) -> str | None:
    if contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP":
        return "image/webp"
    for firma, mime in MAGIC.items():
        if contenido.startswith(firma):
            return mime
    return None


def _sanear_imagen(contenido: bytes) -> bytes:
    from PIL import Image, ImageOps

    with Image.open(io.BytesIO(contenido)) as img:
        img = ImageOps.exif_transpose(img)  # respeta la orientación antes de tirar el EXIF
        if img.mode == "RGBA":  # evidencias no necesitan transparencia; RGB pesa menos
            fondo = Image.new("RGB", img.size, (255, 255, 255))
            fondo.paste(img, mask=img.split()[3])
            img = fondo
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((IMAGEN_LADO_MAX, IMAGEN_LADO_MAX), Image.Resampling.LANCZOS)
        salida = io.BytesIO()
        # Re-codificar desde los píxeles elimina metadatos y cualquier carga oculta en el contenedor.
        img.save(salida, format="WEBP", quality=IMAGEN_CALIDAD_WEBP, method=6)
        return salida.getvalue()


def _comprimir_imagenes_pdf(pdf) -> None:
    """Reduce y re-codifica a JPEG las imágenes grandes de un PDF (escaneos). Si una falla, se deja como está."""
    import pikepdf
    from PIL import Image

    for pagina in pdf.pages:
        for nombre, obj in list(pagina.get_images().items()):
            try:
                pimg = pikepdf.PdfImage(obj)
                ancho, alto = pimg.width, pimg.height
                if max(ancho, alto) <= PDF_IMAGEN_LADO_MAX and obj.get("/Filter") == pikepdf.Name.DCTDecode:
                    continue  # ya es JPEG pequeño
                if "/SMask" in obj or "/Mask" in obj:
                    continue  # transparencia: no se toca
                with pimg.as_pil_image() as im:
                    im = im.convert("L") if im.mode in ("1", "L", "LA") else im.convert("RGB")
                    im.thumbnail((PDF_IMAGEN_LADO_MAX, PDF_IMAGEN_LADO_MAX), Image.Resampling.LANCZOS)
                    buf = io.BytesIO()
                    im.save(buf, format="JPEG", quality=PDF_IMAGEN_CALIDAD_JPEG, optimize=True)
                    datos = buf.getvalue()
                    if len(datos) >= len(obj.read_raw_bytes()):
                        continue  # no mejora
                    espacio = pikepdf.Name.DeviceGray if im.mode == "L" else pikepdf.Name.DeviceRGB
                    obj.write(datos, filter=pikepdf.Name.DCTDecode)
                    obj.Width, obj.Height = im.width, im.height
                    obj.ColorSpace, obj.BitsPerComponent = espacio, 8
                    for k in ("/Decode", "/DecodeParms"):
                        if k in obj:
                            del obj[k]
            except Exception as e:  # imagen rara (JBIG2, CCITT, indexada...): se conserva sin cambios
                log.info("Imagen de PDF no recomprimida (%s): %s", nombre, e)


def _sanear_pdf(contenido: bytes) -> bytes:
    import pikepdf

    try:
        pdf = pikepdf.open(io.BytesIO(contenido))
    except Exception as e:  # cifrado, corrupto, etc.
        raise HTTPException(status_code=422, detail=f"PDF inválido o cifrado: {e}") from e
    with pdf:
        raiz = pdf.Root
        if "/OpenAction" in raiz or "/AA" in raiz or ("/AcroForm" in raiz and "/XFA" in raiz.AcroForm):
            raise HTTPException(status_code=422, detail="PDF rechazado: contiene acciones automáticas al abrir.")
        nombres = raiz.get("/Names", {})
        if "/JavaScript" in nombres or "/EmbeddedFiles" in nombres:
            raise HTTPException(status_code=422, detail="PDF rechazado: contiene JavaScript o archivos incrustados.")
        for pagina in pdf.pages:
            if "/AA" in pagina:
                raise HTTPException(status_code=422, detail="PDF rechazado: contiene acciones automáticas en páginas.")
            for anot in pagina.get("/Annots", []):
                accion = anot.get("/A", {})
                if accion.get("/S") in ("/JavaScript", "/Launch", "/ImportData", "/SubmitForm"):
                    raise HTTPException(status_code=422, detail="PDF rechazado: contiene enlaces que ejecutan acciones.")
        _comprimir_imagenes_pdf(pdf)
        # Metadatos fuera: no aportan a la evidencia y pueden traer datos personales del equipo origen
        if "/Metadata" in raiz:
            del raiz["/Metadata"]
        if "/Info" in pdf.trailer:
            del pdf.trailer["/Info"]
        salida = io.BytesIO()
        pdf.save(salida, linearize=True, compress_streams=True, recompress_flate=True,
                 object_stream_mode=pikepdf.ObjectStreamMode.generate)
        return salida.getvalue()


def _sanear_docx(contenido: bytes) -> bytes:
    """Acepta solo .docx con estructura válida, sin macros, objetos incrustados ni ActiveX. Re-comprime al máximo."""
    try:
        zin = zipfile.ZipFile(io.BytesIO(contenido))
        nombres = zin.namelist()
    except zipfile.BadZipFile as e:
        raise HTTPException(status_code=422, detail="El archivo Word está dañado o no es un .docx.") from e
    if "[Content_Types].xml" not in nombres or "word/document.xml" not in nombres:
        raise HTTPException(status_code=422, detail="Solo se admiten documentos Word .docx (no .doc ni otros formatos).")
    tipos = zin.read("[Content_Types].xml").decode("utf-8", "ignore").lower()
    if "macroenabled" in tipos or "vbaproject" in tipos:
        raise HTTPException(status_code=422, detail="Word rechazado: contiene macros.")
    for n in nombres:
        nl = n.lower()
        if any(p in nl for p in DOCX_ENTRADAS_PROHIBIDAS):
            raise HTTPException(status_code=422, detail="Word rechazado: contiene macros, objetos incrustados o ActiveX.")
        if nl.endswith(".rels"):
            rels = zin.read(n).decode("utf-8", "ignore")
            for m in re.finditer(r'<Relationship[^>]*TargetMode="External"[^>]*>', rels, re.I):
                if "/hyperlink" not in m.group(0):
                    raise HTTPException(status_code=422, detail="Word rechazado: referencia contenido externo (no hipervínculos).")
    salida = io.BytesIO()
    with zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zout:
        for n in nombres:
            if n.lower().startswith("docprops/"):
                continue  # metadatos de autor/equipo: fuera
            zout.writestr(n, zin.read(n))
    return salida.getvalue()


def validar_y_sanear(nombre: str, contenido: bytes) -> ArchivoSaneado:
    """Valida tipo y tamaño por contenido real (no por extensión) y devuelve el archivo saneado y comprimido."""
    if not contenido:
        raise HTTPException(status_code=422, detail="Archivo vacío.")
    mime = detectar_mime(contenido)
    if mime is None:
        raise HTTPException(status_code=422, detail="Solo se admiten imágenes JPG, PNG o WEBP, documentos PDF y Word (.docx).")
    if mime == "application/pdf":
        if len(contenido) > MAX_BYTES_PDF:
            raise HTTPException(status_code=413, detail="El PDF excede 25 MB.")
        limpio = _sanear_pdf(contenido)
        tipo, ext, mime_final = "pdf", "pdf", "application/pdf"
    elif mime == "application/zip":
        if len(contenido) > MAX_BYTES_DOCX:
            raise HTTPException(status_code=413, detail="El documento Word excede 10 MB.")
        limpio = _sanear_docx(contenido)
        tipo, ext, mime_final = "docx", "docx", MIME_DOCX
    else:
        if len(contenido) > MAX_BYTES_IMAGEN:
            raise HTTPException(status_code=413, detail="La imagen excede 15 MB.")
        try:
            limpio = _sanear_imagen(contenido)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=422, detail="La imagen no se pudo decodificar.") from e
        tipo, ext, mime_final = "imagen", "webp", "image/webp"
    return ArchivoSaneado(limpio, mime_final, ext, tipo, hashlib.sha256(limpio).hexdigest())


def generar_clave_b2(organismo_id: int, entidad: str, extension: str) -> str:
    """Ruta en el bucket: <organismo>/<entidad>/<uuid>.<ext>. El uuid evita colisiones y nombres adivinables."""
    entidad_segura = "".join(c for c in entidad.lower() if c.isalnum() or c in "-_") or "archivo"
    return f"org-{organismo_id}/{entidad_segura}/{uuid.uuid4().hex}.{extension}"


# ───────────── Red: ClamAV ─────────────
def escanear_antivirus(contenido: bytes) -> str:
    """Devuelve 'limpio'. Lanza 422 si hay malware, 503 si el antivirus está configurado pero no responde."""
    host = os.getenv("CLAMAV_HOST")
    if not host:
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=503, detail="Antivirus no configurado en producción.")
        log.warning("CLAMAV_HOST no definido: se omite el escaneo (solo desarrollo).")
        return "omitido"
    import clamd

    try:
        cd = clamd.ClamdNetworkSocket(host=host, port=int(os.getenv("CLAMAV_PORT", "3310")), timeout=60)
        resultado = cd.instream(io.BytesIO(contenido))
    except Exception as e:
        log.error("ClamAV no disponible: %s", e)
        raise HTTPException(status_code=503, detail="Antivirus no disponible; intenta de nuevo en unos minutos.") from e
    estado, firma = resultado.get("stream", ("ERROR", None))
    if estado == "FOUND":
        log.warning("Archivo infectado rechazado: %s", firma)
        raise HTTPException(status_code=422, detail=f"Archivo rechazado por el antivirus ({firma}).")
    if estado != "OK":
        raise HTTPException(status_code=503, detail="El antivirus no pudo analizar el archivo.")
    return "limpio"


# ───────────── Red: Backblaze B2 (API S3) ─────────────
def _cliente_s3():
    import boto3

    faltan = [v for v in ("B2_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET", "B2_ENDPOINT") if not os.getenv(v)]
    if faltan:
        raise HTTPException(status_code=503, detail=f"Almacenamiento no configurado ({', '.join(faltan)}).")
    return boto3.client(
        "s3",
        endpoint_url=os.environ["B2_ENDPOINT"],
        aws_access_key_id=os.environ["B2_KEY_ID"],
        aws_secret_access_key=os.environ["B2_APPLICATION_KEY"],
        region_name=os.getenv("B2_REGION", "us-east-005"),
    )


def subir_b2(clave: str, contenido: bytes, mime: str) -> None:
    try:
        _cliente_s3().put_object(Bucket=os.environ["B2_BUCKET"], Key=clave, Body=contenido, ContentType=mime)
    except HTTPException:
        raise
    except Exception as e:
        log.error("Fallo al subir a B2 %s: %s", clave, e)
        raise HTTPException(status_code=502, detail="No se pudo guardar el archivo en el almacenamiento.") from e


def url_firmada_b2(clave: str, nombre_descarga: str, inline: bool = True) -> str:
    disposicion = f'{"inline" if inline else "attachment"}; filename="{nombre_descarga}"'
    return _cliente_s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": os.environ["B2_BUCKET"], "Key": clave, "ResponseContentDisposition": disposicion},
        ExpiresIn=URL_FIRMADA_SEGUNDOS,
    )


def borrar_b2(clave: str) -> None:
    try:
        _cliente_s3().delete_object(Bucket=os.environ["B2_BUCKET"], Key=clave)
    except HTTPException:
        raise
    except Exception as e:
        log.error("Fallo al borrar de B2 %s: %s", clave, e)
        raise HTTPException(status_code=502, detail="No se pudo borrar el archivo del almacenamiento.") from e
