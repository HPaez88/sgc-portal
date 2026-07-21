"""
Endpoints de Acción Correctiva, con soporte multi-organismo.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from backend.database import get_session
from backend.tenant import get_organismo_id
from backend.models import (
    AuditoriaCierreRequest,
    EstadoUpdate,
    HistorialCambio,
    TRANSICIONES,
)
from backend.routers._sgc_common import (
    AREAS_DIRECCION,
    _normalizar,
    _asignar_direccion,
    _get_sgc,
    _generar_folio_sgc,
    _crear_sgc,
    _cambiar_estado_sgc,
    _cerrar_sgc,
    _listar_sgc,
    _exportar_sgc_word,
)
from backend.services.doc_service import generar_accion_correctiva_docx

router = APIRouter(prefix="/api/v1/acciones-correctivas", tags=["Acciones Correctivas"])


AREAS_DIRECCION = {
    "Mantenimiento de Redes": "TECNICA",
    "Alcantarillado y Saneamiento": "TECNICA",
    "Plantas Potabilizadoras": "TECNICA",
    "Control de Calidad": "TECNICA",
    "Sectorizacion hidrometrica e innovacion": "TECNICA",
    "Suburbano Tecnico": "TECNICA",
    "Supervision y control de obras": "TECNICA",
    "Tramites Tecnicos": "TECNICA",
    "Proyectos e Infraestructura": "TECNICA",
    "Padron de Usuarios": "COMERCIAL",
    "Control y Servicios": "COMERCIAL",
    "Contratos y Servicios": "COMERCIAL",
    "Atencion Ciudadana": "COMERCIAL",
    "Verificacion y Lectura": "COMERCIAL",
    "Agencia Esperanza": "COMERCIAL",
    "Agencia Marte R. Gomez": "COMERCIAL",
    "Agencia Providencia": "COMERCIAL",
    "Agencia Pueblo Yaqui": "COMERCIAL",
    "Recursos Humanos": "ADMINISTRATIVA",
    "Recursos Materiales": "ADMINISTRATIVA",
    "Contabilidad": "ADMINISTRATIVA",
    "Comunicacion e Imagen Institucional": "ADMINISTRATIVA",
    "Informatica": "ADMINISTRATIVA",
    "Licitaciones": "ADMINISTRATIVA",
    "Mantenimiento y Servicios Generales": "ADMINISTRATIVA",
    "Trabajo Social": "ADMINISTRATIVA",
    "Programas Sociales": "ADMINISTRATIVA",
    "Organo de Control Interno": "ORGANO DE CONTROL INTERNO",
    "Juridico": "JURIDICA",
    "Cultura del agua": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
    "Linea OOMAPASC": "GENERAL",
    "Seguridad Industrial": "TECNICA",
    "Sistema de Gestion de Calidad": "GENERAL",
}


def _normalizar(texto: Optional[str]) -> str:
    if not texto:
        return ""
    replacements = {
        "Ã¡": "a",
        "Ã©": "e",
        "Ã­": "i",
        "Ã³": "o",
        "Ãº": "u",
        "Ã": "A",
        "Ã‰": "E",
        "Ã": "I",
        "Ã“": "O",
        "Ãš": "U",
        "Ã±": "n",
        "Ã‘": "N",
    }
    for source, target in replacements.items():
        texto = texto.replace(source, target)
    return texto


def _asignar_direccion(area: str) -> str:
    return AREAS_DIRECCION.get(_normalizar(area), "GENERAL")


def _get_ac(
    session: Session,
    ac_id: int,
    organismo_id: int,
) -> Optional[AccionCorrectiva]:
    return _get_sgc(session, "AC", ac_id, organismo_id)


def _generar_folio_ac(session: Session, organismo_id: int) -> str:
    return _generar_folio_sgc(session, "AC", organismo_id)


@router.post("", response_model=AccionCorrectiva, status_code=201)
def crear_ac(
    ac: AccionCorrectivaCreate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    datos = ac.model_dump(exclude_unset=True)
@router.get("/{ac_id}", response_model=AccionCorrectiva)
def obtener_ac(
    ac_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    ac = _get_ac(session, ac_id, organismo_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Accion Correctiva no encontrada.")
    return ac


@router.put("/{ac_id}", response_model=AccionCorrectiva)
def actualizar_ac(
    ac_id: int,
    ac_data: AccionCorrectivaCreate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    ac = _get_ac(session, ac_id, organismo_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Accion Correctiva no encontrada.")
    if ac.estado not in ["BORRADOR", "RECHAZADO"]:
        raise HTTPException(
            status_code=409,
            detail="No se puede editar. Estado debe ser BORRADOR o RECHAZADO.",
        )

    datos = ac_data.model_dump(exclude_unset=True)
    datos.pop("folio", None)
    datos.pop("organismo_id", None)

    if "area" in datos and datos["area"] != ac.area:
        datos["direccion"] = _asignar_direccion(datos["area"])

    for campo, valor in datos.items():
        setattr(ac, campo, valor)

    session.add(ac)
    session.commit()
    session.refresh(ac)
    return ac


@router.put("/{ac_id}/estado", response_model=AccionCorrectiva)
def cambiar_estado_ac(
    ac_id: int,
    update: EstadoUpdate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return _cambiar_estado_sgc(session, "AC", ac_id, organismo_id, update)


@router.put("/{ac_id}/asignar-auditor", response_model=AccionCorrectiva)
def asignar_auditor(
    ac_id: int,
    auditor: str,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    ac = _get_ac(session, ac_id, organismo_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Accion Correctiva no encontrada.")
    if ac.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(
            status_code=409,
            detail="Solo se puede asignar auditor en estados APROBADO o EN_SEGUIMIENTO.",
        )

    ac.auditor_asignado = auditor
    session.add(ac)
    session.commit()
    session.refresh(ac)
    return ac


@router.post("/{ac_id}/replanteo", response_model=Replanteo)
def solicitar_replanteo(
    ac_id: int,
    numero: int,
    justificacion: str,
    fecha_nueva: Optional[datetime] = None,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    ac = _get_ac(session, ac_id, organismo_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Accion Correctiva no encontrada.")

    if ac.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo replanteos en ejecucion.")

    if numero == 1:
        if ac.primer_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 1er replanteo asignado.")
    elif numero == 2:
        if not ac.primer_replanteo:
            raise HTTPException(status_code=422, detail="Debe tener 1er replanteo primero.")
        if ac.segundo_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 2do replanteo asignado.")
    else:
        raise HTTPException(status_code=422, detail="Numero de replanteo invalido. Usar 1 o 2.")

    replanteo = Replanteo(
        organismo_id=organismo_id,
        entidad_tipo="AC",
        entidad_id=ac_id,
        numero=numero,
        justificacion=justificacion,
        fecha_nueva=fecha_nueva,
        estado="APROBADO",
    )
    session.add(replanteo)

    if numero == 1:
        ac.primer_replanteo = fecha_nueva
    else:
        ac.segundo_replanteo = fecha_nueva

    session.add(ac)
    session.commit()
    session.refresh(replanteo)
    return replanteo


@router.put("/{ac_id}/cerrar", response_model=AccionCorrectiva)
def cerrar_ac(
    ac_id: int,
    auditoria: AuditoriaCierreRequest,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return _cerrar_sgc(session, "AC", ac_id, organismo_id, auditoria)


@router.get("/{ac_id}/historial", response_model=list[HistorialCambio])
def historial_ac(
    ac_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return session.exec(
        select(HistorialCambio)
        .where(
            HistorialCambio.organismo_id == organismo_id,
            HistorialCambio.entidad_tipo == "AC",
            HistorialCambio.entidad_id == ac_id,
        )
        .order_by(HistorialCambio.fecha)
    ).all()


@router.get("/{ac_id}/exportar-word")
def exportar_ac_word(
    ac_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    ac = _get_ac(session, ac_id, organismo_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Accion Correctiva no encontrada.")

    folio_safe = (ac.folio or f"BORRADOR-{ac.id}").replace("/", "-").replace("#", "")
    docx_bytes = generar_accion_correctiva_docx(ac)
    filename = f"AC_{folio_safe}_{ac.id}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
