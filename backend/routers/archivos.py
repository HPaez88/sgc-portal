"""
archivos.py — Subida, consulta y borrado de archivos (evidencias, anexos) en Backblaze B2.
Los metadatos viven en Postgres (tabla archivos); el binario, en el bucket privado.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from backend.auth import usuario_actual
from backend.database import get_session
from backend.models import Archivo, Usuario
from backend.services import archivos_service as svc
from backend.tenant import get_organismo_id

router = APIRouter(prefix="/api/v1/archivos", tags=["Archivos"])

MAX_LECTURA = max(svc.MAX_BYTES_IMAGEN, svc.MAX_BYTES_PDF) + 1


@router.post("", response_model=Archivo, status_code=201)
async def subir_archivo(
    archivo: UploadFile = File(...),
    entidad: str = Form("evidencia"),
    referencia: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
    usuario: Usuario = Depends(usuario_actual),
):
    """Valida, escanea, sanea y guarda un archivo. Rechaza con 413/422/503 según el caso."""
    subido_por = usuario.nombre
    contenido = await archivo.read(MAX_LECTURA)
    if len(contenido) >= MAX_LECTURA:
        raise HTTPException(status_code=413, detail="El archivo excede el tamaño máximo permitido.")
    tamano_original = len(contenido)

    svc.escanear_antivirus(contenido)                       # 1. malware sobre el original
    saneado = svc.validar_y_sanear(archivo.filename or "archivo", contenido)  # 2. tipo real + limpieza

    # Deduplicación por contenido dentro del organismo
    existente = session.exec(
        select(Archivo).where(Archivo.organismo_id == organismo_id, Archivo.sha256 == saneado.sha256)
    ).first()
    if existente:
        clave = existente.clave_b2
    else:
        clave = svc.generar_clave_b2(organismo_id, entidad, saneado.extension)
        svc.subir_b2(clave, saneado.contenido, saneado.mime)  # 3. almacenamiento

    nombre_base = (archivo.filename or "archivo").rsplit(".", 1)[0][:120]
    registro = Archivo(
        organismo_id=organismo_id,
        entidad=entidad[:40],
        referencia=(referencia or "")[:80] or None,
        descripcion=(descripcion or "")[:300] or None,
        nombre_original=(archivo.filename or "archivo")[:200],
        nombre=f"{nombre_base}.{saneado.extension}",
        mime=saneado.mime,
        tipo=saneado.tipo,
        bytes_original=tamano_original,
        bytes=len(saneado.contenido),
        sha256=saneado.sha256,
        clave_b2=clave,
        estado_escaneo="limpio",
        subido_por=subido_por[:120],
    )
    session.add(registro)
    session.commit()
    session.refresh(registro)
    return registro


@router.get("", response_model=list[Archivo])
def listar_archivos(
    entidad: Optional[str] = None,
    referencia: Optional[str] = None,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    q = select(Archivo).where(Archivo.organismo_id == organismo_id)
    if entidad:
        q = q.where(Archivo.entidad == entidad)
    if referencia:
        q = q.where(Archivo.referencia == referencia)
    return session.exec(q.order_by(Archivo.fecha_subida.desc())).all()


def _obtener(archivo_id: int, session: Session, organismo_id: int) -> Archivo:
    registro = session.get(Archivo, archivo_id)
    if not registro or registro.organismo_id != organismo_id:
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")
    return registro


@router.get("/{archivo_id}", response_model=Archivo)
def obtener_archivo(archivo_id: int, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    return _obtener(archivo_id, session, organismo_id)


@router.get("/{archivo_id}/url")
def abrir_archivo(
    archivo_id: int,
    descargar: bool = False,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    """Redirige a un enlace firmado de B2 que caduca en minutos. Sirve como src de <img> o href."""
    registro = _obtener(archivo_id, session, organismo_id)
    url = svc.url_firmada_b2(registro.clave_b2, registro.nombre, inline=not descargar)
    return RedirectResponse(url, status_code=307, headers={"Cache-Control": "private, max-age=600"})


@router.delete("/{archivo_id}", status_code=204)
def borrar_archivo(archivo_id: int, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    registro = _obtener(archivo_id, session, organismo_id)
    otros = session.exec(
        select(Archivo).where(Archivo.clave_b2 == registro.clave_b2, Archivo.id != registro.id)
    ).first()
    if not otros:  # solo se borra el binario cuando ningún otro registro lo comparte (dedup)
        svc.borrar_b2(registro.clave_b2)
    session.delete(registro)
    session.commit()
    return None
