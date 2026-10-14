"""
documentos.py — Documentos controlados (Manual de la Calidad y anexos) con revisiones y ruta de aprobación.

Estados de una revisión:  BORRADOR → EN_REVISION → REVISADO → PUBLICADO   (ruta dos_pasos)
                          BORRADOR → EN_REVISION → PUBLICADO              (ruta simple)
                          cualquiera de revisión → RECHAZADO → (se corrige) BORRADOR
Reglas: quien revisa no es el autor; quien publica (Director / Super Admin) no es quien revisó.
"""
import difflib
import hashlib
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import Documento, DocumentoRevision, Usuario
from backend.tenant import get_organismo_id

router = APIRouter(prefix="/api/v1/documentos", tags=["Documentos controlados"])

ROLES_EDITAN = ("Super Admin", "Admin")
ROLES_PUBLICAN = ("Super Admin", "Director")
ESTADOS_ABIERTOS = ("BORRADOR", "EN_REVISION", "REVISADO", "RECHAZADO")


class SeccionInput(BaseModel):
    numero: str = Field(min_length=1, max_length=12)
    titulo: str = Field(min_length=1, max_length=200)
    markdown: str = Field(default="", max_length=200_000)


class BorradorInput(BaseModel):
    secciones: list[SeccionInput]


class EnvioInput(BaseModel):
    motivo: str = Field(min_length=10, max_length=1000)


class DecisionInput(BaseModel):
    aprobado: bool
    comentario: Optional[str] = Field(default=None, max_length=1000)


# ───────────── utilidades ─────────────
def hash_secciones(secciones: list[dict]) -> str:
    canon = json.dumps(secciones, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()


def _doc(clave: str, session: Session, organismo_id: int) -> Documento:
    d = session.exec(select(Documento).where(Documento.organismo_id == organismo_id, Documento.clave == clave.upper())).first()
    if not d:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    return d


def _vigente(d: Documento, session: Session) -> Optional[DocumentoRevision]:
    return session.get(DocumentoRevision, d.revision_vigente_id) if d.revision_vigente_id else None


def _abierta(d: Documento, session: Session) -> Optional[DocumentoRevision]:
    return session.exec(
        select(DocumentoRevision)
        .where(DocumentoRevision.documento_id == d.id, DocumentoRevision.estado.in_(ESTADOS_ABIERTOS))
        .order_by(DocumentoRevision.numero.desc())
    ).first()


def _resumen(r: Optional[DocumentoRevision], con_contenido: bool = False) -> Optional[dict]:
    if not r:
        return None
    datos = {k: getattr(r, k) for k in (
        "id", "numero", "estado", "hash", "motivo", "autor_id", "autor_nombre", "revisor_nombre", "aprobador_nombre",
        "comentario", "fecha_creacion", "fecha_envio", "fecha_revision", "fecha_publicacion")}
    if con_contenido:
        datos["secciones"] = json.loads(r.contenido)
    return datos


def _ficha(d: Documento, session: Session) -> dict:
    return {
        "id": d.id, "clave": d.clave, "titulo": d.titulo, "tipo": d.tipo, "ruta_aprobacion": d.ruta_aprobacion,
        "area_responsable": d.area_responsable, "archivo_original": d.archivo_original,
        "vigente": _resumen(_vigente(d, session)), "abierta": _resumen(_abierta(d, session)),
    }


# ───────────── consulta ─────────────
@router.get("")
def listar(session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    docs = session.exec(select(Documento).where(Documento.organismo_id == organismo_id).order_by(Documento.clave)).all()
    return [_ficha(d, session) for d in docs]


@router.get("/{clave}")
def ver(clave: str, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id),
        usuario: Usuario = Depends(auth.usuario_actual)):
    d = _doc(clave, session, organismo_id)
    ficha = _ficha(d, session)
    ficha["vigente"] = _resumen(_vigente(d, session), con_contenido=True)
    # El borrador/en revisión solo lo ven quienes participan del flujo
    if usuario.rol in ROLES_EDITAN + ROLES_PUBLICAN:
        ficha["abierta"] = _resumen(_abierta(d, session), con_contenido=True)
    return ficha


@router.get("/{clave}/revisiones")
def historial(clave: str, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    d = _doc(clave, session, organismo_id)
    revs = session.exec(select(DocumentoRevision).where(DocumentoRevision.documento_id == d.id)
                        .order_by(DocumentoRevision.numero.desc(), DocumentoRevision.id.desc())).all()
    return [_resumen(r) for r in revs]


@router.get("/{clave}/revisiones/{revision_id}")
def ver_revision(clave: str, revision_id: int, session: Session = Depends(get_session),
                 organismo_id: int = Depends(get_organismo_id)):
    d = _doc(clave, session, organismo_id)
    r = session.get(DocumentoRevision, revision_id)
    if not r or r.documento_id != d.id:
        raise HTTPException(status_code=404, detail="Revisión no encontrada.")
    return _resumen(r, con_contenido=True)


@router.get("/{clave}/diff")
def diff(clave: str, de: int, a: int, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id)):
    """Diferencias por sección entre dos revisiones (ids). Líneas con prefijo '+', '-' o ' '."""
    d = _doc(clave, session, organismo_id)
    r1, r2 = session.get(DocumentoRevision, de), session.get(DocumentoRevision, a)
    if not r1 or not r2 or r1.documento_id != d.id or r2.documento_id != d.id:
        raise HTTPException(status_code=404, detail="Revisión no encontrada.")
    s1 = {s["numero"]: s for s in json.loads(r1.contenido)}
    s2 = {s["numero"]: s for s in json.loads(r2.contenido)}
    salida = []
    for num in sorted(set(s1) | set(s2), key=lambda n: [int(p) if p.isdigit() else p for p in n.split(".")]):
        a1, a2 = s1.get(num), s2.get(num)
        if a1 and not a2:
            salida.append({"numero": num, "titulo": a1["titulo"], "cambio": "eliminada", "lineas": []})
            continue
        if a2 and not a1:
            salida.append({"numero": num, "titulo": a2["titulo"], "cambio": "nueva", "lineas": []})
            continue
        if a1["markdown"] == a2["markdown"] and a1["titulo"] == a2["titulo"]:
            continue
        lineas = []
        for ln in difflib.ndiff(a1["markdown"].splitlines(), a2["markdown"].splitlines()):
            if ln.startswith("?"):
                continue
            lineas.append({"tipo": ln[0], "texto": ln[2:]})
        salida.append({"numero": num, "titulo": a2["titulo"], "cambio": "modificada", "lineas": lineas})
    return {"de": _resumen(r1), "a": _resumen(r2), "secciones": salida}


# ───────────── flujo ─────────────
@router.post("/{clave}/borrador", status_code=201)
def crear_borrador(clave: str, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id),
                   usuario: Usuario = Depends(auth.requiere_rol(*ROLES_EDITAN))):
    d = _doc(clave, session, organismo_id)
    if _abierta(d, session):
        raise HTTPException(status_code=409, detail="Ya hay una revisión en curso para este documento.")
    vigente = _vigente(d, session)
    numero = (vigente.numero + 1) if vigente else 1
    r = DocumentoRevision(documento_id=d.id, numero=numero, estado="BORRADOR",
                          contenido=vigente.contenido if vigente else "[]",
                          autor_id=usuario.id, autor_nombre=usuario.nombre)
    session.add(r)
    session.commit()
    session.refresh(r)
    return _resumen(r, con_contenido=True)


@router.put("/{clave}/borrador")
def editar_borrador(clave: str, datos: BorradorInput, session: Session = Depends(get_session),
                    organismo_id: int = Depends(get_organismo_id), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_EDITAN))):
    d = _doc(clave, session, organismo_id)
    r = _abierta(d, session)
    if not r or r.estado not in ("BORRADOR", "RECHAZADO"):
        raise HTTPException(status_code=409, detail="No hay un borrador editable (está en revisión o no existe).")
    if not datos.secciones:
        raise HTTPException(status_code=422, detail="El documento necesita al menos una sección.")
    r.contenido = json.dumps([s.model_dump() for s in datos.secciones], ensure_ascii=False)
    r.estado = "BORRADOR"
    r.comentario = None
    session.add(r)
    session.commit()
    session.refresh(r)
    return _resumen(r, con_contenido=True)


@router.post("/{clave}/enviar")
def enviar_a_revision(clave: str, datos: EnvioInput, session: Session = Depends(get_session),
                      organismo_id: int = Depends(get_organismo_id), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_EDITAN))):
    d = _doc(clave, session, organismo_id)
    r = _abierta(d, session)
    if not r or r.estado not in ("BORRADOR", "RECHAZADO"):
        raise HTTPException(status_code=409, detail="No hay un borrador para enviar.")
    vigente = _vigente(d, session)
    if vigente and vigente.contenido == r.contenido:
        raise HTTPException(status_code=422, detail="El borrador no tiene cambios respecto a la revisión vigente.")
    r.estado, r.motivo, r.fecha_envio = "EN_REVISION", datos.motivo.strip(), datetime.utcnow()
    r.autor_id, r.autor_nombre = usuario.id, usuario.nombre  # quien envía responde por el contenido
    r.revisor_id = r.revisor_nombre = r.aprobador_id = r.aprobador_nombre = None
    session.add(r)
    session.commit()
    session.refresh(r)
    return _resumen(r)


def _publicar(d: Documento, r: DocumentoRevision, usuario: Usuario, session: Session) -> None:
    vigente = _vigente(d, session)
    if vigente:
        vigente.estado = "OBSOLETO"
        session.add(vigente)
    r.estado, r.fecha_publicacion = "PUBLICADO", datetime.utcnow()
    r.aprobador_id, r.aprobador_nombre = usuario.id, usuario.nombre
    r.hash = hash_secciones(json.loads(r.contenido))
    d.revision_vigente_id = r.id
    session.add_all([r, d])


@router.post("/{clave}/revisar")
def revisar(clave: str, datos: DecisionInput, session: Session = Depends(get_session),
            organismo_id: int = Depends(get_organismo_id), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_EDITAN))):
    """Paso 1 (ruta dos_pasos) o único paso (ruta simple). Lo hace un administrador distinto del autor."""
    d = _doc(clave, session, organismo_id)
    r = _abierta(d, session)
    if not r or r.estado != "EN_REVISION":
        raise HTTPException(status_code=409, detail="No hay una revisión pendiente de revisar.")
    if r.autor_id == usuario.id:
        raise HTTPException(status_code=403, detail="El autor no puede revisar su propio cambio.")
    if not datos.aprobado:
        r.estado, r.comentario = "RECHAZADO", (datos.comentario or "").strip() or "Rechazado en revisión."
        r.revisor_id, r.revisor_nombre, r.fecha_revision = usuario.id, usuario.nombre, datetime.utcnow()
        session.add(r)
    else:
        r.revisor_id, r.revisor_nombre, r.fecha_revision = usuario.id, usuario.nombre, datetime.utcnow()
        r.comentario = (datos.comentario or "").strip() or None
        if d.ruta_aprobacion == "simple":
            _publicar(d, r, usuario, session)
        else:
            r.estado = "REVISADO"
            session.add(r)
    session.commit()
    session.refresh(r)
    return _resumen(r)


@router.post("/{clave}/publicar")
def publicar(clave: str, datos: DecisionInput, session: Session = Depends(get_session),
             organismo_id: int = Depends(get_organismo_id), usuario: Usuario = Depends(auth.requiere_rol(*ROLES_PUBLICAN))):
    """Paso 2 (ruta dos_pasos): el Director General aprueba y publica, o rechaza."""
    d = _doc(clave, session, organismo_id)
    r = _abierta(d, session)
    if not r or r.estado != "REVISADO":
        raise HTTPException(status_code=409, detail="La revisión aún no fue revisada por un administrador.")
    if r.revisor_id == usuario.id:
        raise HTTPException(status_code=403, detail="Quien revisó no puede también aprobar la publicación.")
    if not datos.aprobado:
        r.estado, r.comentario = "RECHAZADO", (datos.comentario or "").strip() or "Rechazado por la Dirección."
        r.aprobador_id, r.aprobador_nombre = usuario.id, usuario.nombre
        session.add(r)
    else:
        if datos.comentario:
            r.comentario = datos.comentario.strip()
        _publicar(d, r, usuario, session)
    session.commit()
    session.refresh(r)
    return _resumen(r)


@router.delete("/{clave}/borrador", status_code=204)
def descartar_borrador(clave: str, session: Session = Depends(get_session), organismo_id: int = Depends(get_organismo_id),
                       usuario: Usuario = Depends(auth.requiere_rol(*ROLES_EDITAN))):
    d = _doc(clave, session, organismo_id)
    r = _abierta(d, session)
    if not r or r.estado not in ("BORRADOR", "RECHAZADO"):
        raise HTTPException(status_code=409, detail="Solo se descartan borradores o cambios rechazados.")
    session.delete(r)
    session.commit()
    return None
