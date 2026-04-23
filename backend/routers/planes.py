"""
routers/planes.py — Endpoints de Plan de Mejora
Versión 3.1 — Con Control 6 y Workflow completo
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import (
    PlanDeMejora, PlanDeMejoraCreate,
    EstadoUpdate, HistorialCambio, Replanteo,
    AuditoriaCierreRequest, TRANSICIONES, AREAS
)
from backend.services.doc_service import generar_plan_mejora_docx

router = APIRouter(prefix="/api/v1/planes-mejora", tags=["Planes de Mejora"])


def _generar_folio_pm(session: Session) -> str:
    """Genera folio: PM-YYYY/NNN (ej. PM-2026/001)"""
    year = datetime.utcnow().year
    pms = session.exec(
        select(PlanDeMejora).where(PlanDeMejora.folio.like(f"PM-{year}/%"))
    ).all()
    siguiente = len(pms) + 1
    return f"PM-{year}/{siguiente:03d}"


def _asignar_direccion(area: str) -> str:
    """Asocia área a dirección."""
    areas_direccion = {
        "Mantenimiento de Redes": "TÉCNICA",
        "Alcantarillado y Saneamiento": "TÉCNICA",
        "Plantas Potabilizadoras": "TÉCNICA",
        "Control de Calidad": "TÉCNICA",
        "Sectorización hidrométrica e innovación": "TÉCNICA",
        "Suburbano Técnico": "TÉCNICA",
        "Proyectos e Infraestructura": "TÉCNICA",
        "Padrón de Usuarios": "COMERCIAL",
        "Control y Servicios": "COMERCIAL",
        "Contratos y Servicios": "COMERCIAL",
        "Atención Ciudadana": "COMERCIAL",
        "Agencia Esperanza": "COMERCIAL",
        "Agencia Marte R. Gómez": "COMERCIAL",
        "Agencia Providencia": "COMERCIAL",
        "Agencia Pueblo Yaqui": "COMERCIAL",
        "Recursos Humanos": "ADMINISTRATIVA",
        "Recursos Materiales": "ADMINISTRATIVA",
        "Contabilidad": "ADMINISTRATIVA",
        "Comunicación e Imagen Institucional": "ADMINISTRATIVA",
        "Informática": "ADMINISTRATIVA",
        "Licitaciones": "ADMINISTRATIVA",
        "Mantenimiento y Servicios Generales": "ADMINISTRATIVA",
        "Jurídico": "JURÍDICA",
        "Órgano de Control Interno": "ÓRGANO DE CONTROL INTERNO",
        "Cultura del agua": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
        "Programa Social": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
        "Línea OOMAPASC": "GENERAL",
        "Seguridad Industrial": "TÉCNICA",
        "Sistema de Gestión de Calidad": "GENERAL",
    }
    return areas_direccion.get(area, "GENERAL")


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD BÁSICO
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=PlanDeMejora, status_code=201)
def crear_pm(pm: PlanDeMejoraCreate, session: Session = Depends(get_session)):
    """Crea nuevo PM en estado BORRADOR."""
    nuevo = PlanDeMejora.model_validate(pm)
    nuevo.folio = None
    nuevo.estado = "BORRADOR"
    
    # Asignar dirección automáticamente
    if not nuevo.direccion:
        nuevo.direccion = _asignar_direccion(nuevo.gerencia_coordinacion)
    
    # Calcular fecha de cierre estimada (6 meses)
    nuevo.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)
    
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[PlanDeMejora])
def listar_pm(
    estado: str = None,
    area: str = None,
    direccion: str = None,
    session: Session = Depends(get_session)
):
    """Lista PMs con filtros."""
    query = select(PlanDeMejora).order_by(PlanDeMejora.id.desc())
    
    if estado:
        query = query.where(PlanDeMejora.estado == estado)
    if area:
        query = query.where(PlanDeMejora.gerencia_coordinacion == area)
    if direccion:
        query = query.where(PlanDeMejora.direccion == direccion)
    
    return session.exec(query).all()


@router.get("/{pm_id}", response_model=PlanDeMejora)
def obtener_pm(pm_id: int, session: Session = Depends(get_session)):
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    return pm


@router.put("/{pm_id}", response_model=PlanDeMejora)
def actualizar_pm(pm_id: int, pm_data: PlanDeMejoraCreate, session: Session = Depends(get_session)):
    """Actualiza PM (solo en BORRADOR o RECHAZADO)."""
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    if pm.estado not in ["BORRADOR", "RECHAZADO"]:
        raise HTTPException(status_code=409, detail="No se puede editar. Estado debe ser BORRADOR o RECHAZADO.")

    datos = pm_data.model_dump(exclude_unset=True)
    datos.pop("folio", None)
    
    # Actualizar dirección si cambia área
    if "gerencia_coordinacion" in datos and datos["gerencia_coordinacion"] != pm.gerencia_coordinacion:
        datos["direccion"] = _asignar_direccion(datos["gerencia_coordinacion"])
    
    for campo, valor in datos.items():
        setattr(pm, campo, valor)

    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW — Cambios de estado
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/{pm_id}/estado", response_model=PlanDeMejora)
def cambiar_estado_pm(pm_id: int, update: EstadoUpdate, session: Session = Depends(get_session)):
    """Cambia estado de PM."""
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")

    nuevo_estado = update.estado.upper()
    transiciones_permitidas = TRANSICIONES.get(pm.estado, [])

    if nuevo_estado not in transiciones_permitidas:
        raise HTTPException(
            status_code=422,
            detail=f"Transición inválida: '{pm.estado}' → '{nuevo_estado}'. Permitidas: {transiciones_permitidas}"
        )

    if nuevo_estado == "RECHAZADO" and not (update.comentarios_revision or "").strip():
        raise HTTPException(status_code=422, detail="Se requieren comentarios para rechazar.")

    # Folio al aprobar
    if nuevo_estado == "APROBADO" and not pm.folio:
        pm.folio = _generar_folio_pm(session)
        pm.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)

    # Registrar cambio
    historial = HistorialCambio(
        entidad_tipo="PM",
        entidad_id=pm_id,
        campo="estado",
        valor_anterior=pm.estado,
        valor_nuevo=nuevo_estado,
        usuario=update.usuario,
    )
    session.add(historial)

    pm.estado = nuevo_estado
    if update.comentarios_revision is not None:
        pm.comentarios_revision = update.comentarios_revision

    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


@router.put("/{pm_id}/asignar-auditor", response_model=PlanDeMejora)
def asignar_auditor(pm_id: int, auditor: str, session: Session = Depends(get_session)):
    """Asigna auditor a un PM."""
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede asignar auditor en estados APROBADO o EN_SEGUIMIENTO.")

    pm.auditor_asignado = auditor
    session.add(pm)
    session.commit()
    return pm


# ═══════════════════════════════════════════════════════════════════════════════
# REPLANTEOS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{pm_id}/replanteo", response_model=Replanteo)
def solicitar_replanteo(
    pm_id: int,
    numero: int,
    justificacion: str,
    fecha_nueva: datetime = None,
    session: Session = Depends(get_session)
):
    """Solicita replanteo."""
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    
    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo replanteos en ejecución.")
    
    if numero == 1:
        if pm.primer_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 1er replanteo asignado.")
    elif numero == 2:
        if not pm.primer_replanteo:
            raise HTTPException(status_code=422, detail="Debe tener 1er replanteo primero.")
        if pm.segundo_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 2do replanteo asignado.")
    else:
        raise HTTPException(status_code=422, detail="Número de replanteo inválido.")
    
    replanteo = Replanteo(
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


# ═══════════════════════════════════════════════════════════════════════════════
# AUDITORÍA — Cierre
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/{pm_id}/cerrar", response_model=PlanDeMejora)
def cerrar_pm(
    pm_id: int,
    auditoria: AuditoriaCierreRequest,
    session: Session = Depends(get_session)
):
    """Cierra PM con evaluación."""
    pm = session.get(PlanDeMejora, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="Plan de Mejora no encontrado.")
    
    if pm.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede cerrar en ejecución.")

    pm.estado = "CERRADO"
    pm.fecha_cierre_real = datetime.utcnow()
    pm.evaluacion_eficacia = auditoria.evaluacion_eficacia
    pm.evidencia_revisada = auditoria.evidencia_revisada
    pm.conclusion_auditor = auditoria.conclusion
    pm.nombre_auditor_cierre = auditoria.nombre_auditor
    
    historial = HistorialCambio(
        entidad_tipo="PM",
        entidad_id=pm_id,
        campo="estado",
        valor_anterior=pm.estado,
        valor_nuevo="CERRADO",
        usuario=auditoria.nombre_auditor,
    )
    session.add(historial)
    
    session.add(pm)
    session.commit()
    session.refresh(pm)
    return pm


# ═══════════════════════════════════════════════════════════════════════════════
# CONSULTAS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{pm_id}/historial", response_model=list[HistorialCambio])
def historial_pm(pm_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(HistorialCambio)
        .where(HistorialCambio.entidad_tipo == "PM", HistorialCambio.entidad_id == pm_id)
        .order_by(HistorialCambio.fecha)
    ).all()


@router.get("/{pm_id}/exportar-word")
def exportar_pm_word(pm_id: int, session: Session = Depends(get_session)):
    pm = session.get(PlanDeMejora, pm_id)
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