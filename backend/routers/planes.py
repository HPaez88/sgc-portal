"""
Endpoints de Plan de Mejora, con soporte multi-organismo.
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
from backend.services.doc_service import generar_plan_mejora_docx

router = APIRouter(prefix="/api/v1/planes-mejora", tags=["Planes de Mejora"])


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
    "Juridico": "JURIDICA",
    "Organo de Control Interno": "ORGANO DE CONTROL INTERNO",
    "Cultura del agua": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
    "Programa Social": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
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


def _get_pm(
    session: Session,
    pm_id: int,
    organismo_id: int,
) -> Optional[PlanDeMejora]:
    return _get_sgc(session, "PM", pm_id, organismo_id)


def _generar_folio_pm(session: Session, organismo_id: int) -> str:
    return _generar_folio_sgc(session, "PM", organismo_id)


@router.post("", response_model=PlanDeMejora, status_code=201)
def crear_pm(
    pm: PlanDeMejoraCreate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    datos = pm.model_dump(exclude_unset=True)
    return _crear_sgc("PM", datos, session, organismo_id)


@router.get("", response_model=list[PlanDeMejora])
def listar_pm(
    estado: Optional[str] = None,
    area: Optional[str] = None,
    direccion: Optional[str] = None,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return _listar_sgc(session, "PM", estado, area, direccion, organismo_id)


@router.get("/{pm_id}", response_model=PlanDeMejora)
def obtener_pm(
    pm_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    return pm


@router.put("/{pm_id}", response_model=PlanDeMejora)
def actualizar_pm(
    pm_id: int,
    pm_data: PlanDeMejoraCreate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    if pm.estado not in ["BORRADOR", "RECHAZADO"]:
        raise HTTPException(
            status_code=409,
            detail="No se puede editar. Estado debe ser BORRADOR o RECHAZADO.",
        )

    datos = pm_data.model_dump(exclude_unset=True)
    datos.pop("folio", None)
    datos.pop("organismo_id", None)

    if (
        "gerencia_coordinacion" in datos
        and datos["gerencia_coordinacion"] != pm.gerencia_coordinacion
    ):
        datos["direccion"] = _asignar_direccion(datos["gerencia_coordinacion"])

    for campo, valor in datos.items():
        setattr(pm, campo, valor)

    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


@router.put("/{pm_id}/estado", response_model=PlanDeMejora)
def cambiar_estado_pm(
    pm_id: int,
    update: EstadoUpdate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")

    estado_anterior = pm.estado
    nuevo_estado = update.estado.upper()
    transiciones_permitidas = TRANSICIONES.get(pm.estado, [])

    if nuevo_estado not in transiciones_permitidas:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Transicion invalida: '{pm.estado}' -> '{nuevo_estado}'. "
                f"Permitidas: {transiciones_permitidas}"
            ),
        )

    if nuevo_estado == "RECHAZADO" and not (update.comentarios_revision or "").strip():
        raise HTTPException(status_code=422, detail="Se requieren comentarios para rechazar.")

    if nuevo_estado == "APROBADO" and not pm.folio:
        pm.folio = _generar_folio_pm(session, organismo_id)
        pm.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)

    session.add(
        HistorialCambio(
            organismo_id=organismo_id,
            entidad_tipo="PM",
            entidad_id=pm_id,
            campo="estado",
            valor_anterior=estado_anterior,
            valor_nuevo=nuevo_estado,
            usuario=update.usuario,
        )
    )

    pm.estado = nuevo_estado
    if update.comentarios_revision is not None:
        pm.comentarios_revision = update.comentarios_revision

    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


@router.put("/{pm_id}/asignar-auditor", response_model=PlanDeMejora)
def asignar_auditor(
    pm_id: int,
    auditor: str,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(
            status_code=409,
            detail="Solo se puede asignar auditor en estados APROBADO o EN_SEGUIMIENTO.",
        )

    pm.auditor_asignado = auditor
    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


@router.post("/{pm_id}/replanteo", response_model=Replanteo)
def solicitar_replanteo(
    pm_id: int,
    numero: int,
    justificacion: str,
    fecha_nueva: Optional[datetime] = None,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")

    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo replanteos en ejecucion.")

    if numero == 1:
        if pm.primer_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 1er replanteo asignado.")
    elif numero == 2:
        if not pm.primer_replanteo:
            raise HTTPException(status_code=422, detail="Debe tener 1er replanteo primero.")
        if pm.segundo_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 2do replanteo asignado.")
    else:
        raise HTTPException(status_code=422, detail="Numero de replanteo invalido.")

    replanteo = Replanteo(
        organismo_id=organismo_id,
        entidad_tipo="PM",
        entidad_id=pm_id,
        numero=numero,
        justificacion=justificacion,
        fecha_nueva=fecha_nueva,
        estado="APROBADO",
    )
    session.add(replanteo)

    if numero == 1:
        pm.primer_replanteo = fecha_nueva
    else:
        pm.segundo_replanteo = fecha_nueva

    session.add(pm)
    session.commit()
    session.refresh(replanteo)
    return replanteo


@router.put("/{pm_id}/cerrar", response_model=PlanDeMejora)
def cerrar_pm(
    pm_id: int,
    auditoria: AuditoriaCierreRequest,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")

    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede cerrar en ejecucion.")

    estado_anterior = pm.estado
    pm.estado = "CERRADO"
    pm.fecha_cierre_real = datetime.utcnow()
    pm.evaluacion_eficacia = auditoria.evaluacion_eficacia
    pm.evidencia_revisada = auditoria.evidencia_revisada
    pm.conclusion_auditor = auditoria.conclusion
    pm.nombre_auditor_cierre = auditoria.nombre_auditor

    session.add(
        HistorialCambio(
            organismo_id=organismo_id,
            entidad_tipo="PM",
            entidad_id=pm_id,
            campo="estado",
            valor_anterior=estado_anterior,
            valor_nuevo="CERRADO",
            usuario=auditoria.nombre_auditor,
        )
    )

    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


@router.get("/{pm_id}/historial", response_model=list[HistorialCambio])
def historial_pm(
    pm_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return session.exec(
        select(HistorialCambio)
        .where(
            HistorialCambio.organismo_id == organismo_id,
            HistorialCambio.entidad_tipo == "PM",
            HistorialCambio.entidad_id == pm_id,
        )
        .order_by(HistorialCambio.fecha)
    ).all()


@router.get("/{pm_id}/exportar-word")
def exportar_pm_word(
    pm_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    pm = _get_pm(session, pm_id, organismo_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")

    folio_safe = (pm.folio or f"BORRADOR-{pm.id}").replace("/", "-").replace("#", "")
    docx_bytes = generar_plan_mejora_docx(pm)
    filename = f"PM_{folio_safe}_{pm.id}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
