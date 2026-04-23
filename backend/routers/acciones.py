"""
routers/acciones.py — Endpoints de Acción Correctiva
Versión 3.1 — Con Control 6 y Workflow completo
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import (
    AccionCorrectiva, AccionCorrectivaCreate,
    EstadoUpdate, HistorialCambio, Replanteo,
    AuditoriaCierreRequest, TRANSICIONES, AREAS, DIRECCIONES
)
from backend.services.doc_service import generar_accion_correctiva_docx

router = APIRouter(prefix="/api/v1/acciones-correctivas", tags=["Acciones Correctivas"])


def _generar_folio_ac(session: Session) -> str:
    """Genera folio: AC-YYYY/NNN (ej. AC-2026/001)"""
    year = datetime.utcnow().year
    acs = session.exec(
        select(AccionCorrectiva).where(AccionCorrectiva.folio.like(f"AC-{year}/%"))
    ).all()
    siguiente = len(acs) + 1
    return f"AC-{year}/{siguiente:03d}"


def _asignar_direccion(area: str) -> str:
    """Asocia área a dirección según estructura organizacional."""
    areas_direccion = {
        # TÉCNICA
        "Mantenimiento de Redes": "TÉCNICA",
        "Alcantarillado y Saneamiento": "TÉCNICA",
        "Plantas Potabilizadoras": "TÉCNICA",
        "Control de Calidad": "TÉCNICA",
        "Sectorización hidrométrica e innovación": "TÉCNICA",
        "Suburbano Técnico": "TÉCNICA",
        "Supervisión y control de obras": "TÉCNICA",
        "Trámites Técnicos": "TÉCNICA",
        "Proyectos e Infraestructura": "TÉCNICA",
        # COMERCIAL
        "Padrón de Usuarios": "COMERCIAL",
        "Control y Servicios": "COMERCIAL",
        "Contratos y Servicios": "COMERCIAL",
        "Atención Ciudadana": "COMERCIAL",
        "Verificación y Lectura": "COMERCIAL",
        "Agencia Esperanza": "COMERCIAL",
        "Agencia Marte R. Gómez": "COMERCIAL",
        "Agencia Providencia": "COMERCIAL",
        "Agencia Pueblo Yaqui": "COMERCIAL",
        # ADMINISTRATIVA
        "Recursos Humanos": "ADMINISTRATIVA",
        "Recursos Materiales": "ADMINISTRATIVA",
        "Contabilidad": "ADMINISTRATIVA",
        "Comunicación e Imagen Institucional": "ADMINISTRATIVA",
        "Informática": "ADMINISTRATIVA",
        "Licitaciones": "ADMINISTRATIVA",
        "Mantenimiento y Servicios Generales": "ADMINISTRATIVA",
        "Trabajo Social": "ADMINISTRATIVA",
        "Programas Sociales": "ADMINISTRATIVA",
        # ÓRGANO DE CONTROL
        "Órgano de Control Interno": "ÓRGANO DE CONTROL INTERNO",
        # JURÍDICA
        "Jurídico": "JURÍDICA",
        # PROGRAMAS SOCIALES
        "Cultura del agua": "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
        # OTRAS
        "Línea OOMAPASC": "GENERAL",
        "Seguridad Industrial": "TÉCNICA",
        "Sistema de Gestión de Calidad": "GENERAL",
    }
    return areas_direccion.get(area, "GENERAL")


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD BÁSICO
# ═════════════════════���═════════════════════════════════════════════════════════

@router.post("", response_model=AccionCorrectiva, status_code=201)
def crear_ac(ac: AccionCorrectivaCreate, session: Session = Depends(get_session)):
    """Crea nueva AC en estado BORRADOR. Folio se asigna al aprobar."""
    nuevo = AccionCorrectiva.model_validate(ac)
    nuevo.folio = None
    nuevo.estado = "BORRADOR"
    
    # Asignar dirección automáticamente
    if not nuevo.direccion:
        nuevo.direccion = _asignar_direccion(nuevo.area)
    
    # Calcular fecha de cierre estimada (6 meses)
    nuevo.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)
    
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[AccionCorrectiva])
def listar_ac(
    estado: str = None,
    area: str = None,
    direccion: str = None,
    session: Session = Depends(get_session)
):
    """Lista ACs con filtros."""
    query = select(AccionCorrectiva).order_by(AccionCorrectiva.id.desc())
    
    if estado:
        query = query.where(AccionCorrectiva.estado == estado)
    if area:
        query = query.where(AccionCorrectiva.area == area)
    if direccion:
        query = query.where(AccionCorrectiva.direccion == direccion)
    
    return session.exec(query).all()


@router.get("/{ac_id}", response_model=AccionCorrectiva)
def obtener_ac(ac_id: int, session: Session = Depends(get_session)):
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    return ac


@router.put("/{ac_id}", response_model=AccionCorrectiva)
def actualizar_ac(ac_id: int, ac_data: AccionCorrectivaCreate, session: Session = Depends(get_session)):
    """Actualiza AC (solo en BORRADOR)."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    if ac.estado not in ["BORRADOR", "RECHAZADO"]:
        raise HTTPException(status_code=409, detail="No se puede editar. Estado debe ser BORRADOR o RECHAZADO.")

    datos = ac_data.model_dump(exclude_unset=True)
    datos.pop("folio", None)
    
    # Actualizar dirección si cambia área
    if "area" in datos and datos["area"] != ac.area:
        datos["direccion"] = _asignar_direccion(datos["area"])
    
    for campo, valor in datos.items():
        setattr(ac, campo, valor)

    session.add(ac)
    session.commit()
    session.refresh(ac)
    return ac


# ═══════════════════════════════════════════════════════════════════════
# WORKFLOW — Cambios de estado
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/{ac_id}/estado", response_model=AccionCorrectiva)
def cambiar_estado_ac(ac_id: int, update: EstadoUpdate, session: Session = Depends(get_session)):
    """Cambia estado de AC según workflow."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")

    nuevo_estado = update.estado.upper()
    transiciones_permitidas = TRANSICIONES.get(ac.estado, [])

    if nuevo_estado not in transiciones_permitidas:
        raise HTTPException(
            status_code=422,
            detail=f"Transición inválida: '{ac.estado}' → '{nuevo_estado}'. Permitidas: {transiciones_permitidas}"
        )

    if nuevo_estado == "RECHAZADO" and not (update.comentarios_revision or "").strip():
        raise HTTPException(status_code=422, detail="Se requieren comentarios para rechazar.")

    # Folio al aprobar
    if nuevo_estado == "APROBADO" and not ac.folio:
        ac.folio = _generar_folio_ac(session)
        ac.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)

    # Registrar cambio
    historial = HistorialCambio(
        entidad_tipo="AC",
        entidad_id=ac_id,
        campo="estado",
        valor_anterior=ac.estado,
        valor_nuevo=nuevo_estado,
        usuario=update.usuario,
    )
    session.add(historial)

    ac.estado = nuevo_estado
    if update.comentarios_revision is not None:
        ac.comentarios_revision = update.comentarios_revision

    session.add(ac)
    session.commit()
    session.refresh(ac)
    return ac


@router.put("/{ac_id}/asignar-auditor", response_model=AccionCorrectiva)
def asignar_auditor(ac_id: int, auditor: str, session: Session = Depends(get_session)):
    """Asigna auditor a una AC."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    if ac.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede asignar auditor en estados APROBADO o EN_SEGUIMIENTO.")

    ac.auditor_asignado = auditor
    session.add(ac)
    session.commit()
    return ac


# ═══════════════════════════════════════════════════════════════════════
# REPLANTEOS — Extensiones de tiempo
# ═══════════════════════════════════════════════════════════════════════

@router.post("/{ac_id}/replanteo", response_model=Replanteo)
def solicitar_replanteo(
    ac_id: int,
    numero: int,
    justificacion: str,
    fecha_nueva: datetime = None,
    session: Session = Depends(get_session)
):
    """Solicita replanteo (1 o 2)."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    
    if ac.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo replanteos en ejecución.")
    
    if numero == 1:
        if ac.primer_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 1er replanteo asignado.")
    elif numero == 2:
        if not ac.primer_replanteo:
            raise HTTPException(status_code=422, detail="Debe tener 1er replanteo primero.")
        if ac.segundo_replanteo:
            raise HTTPException(status_code=422, detail="Ya tiene 2do replanteo asignado.")
    else:
        raise HTTPException(status_code=422, detail="Número de replanteo inválido. Usar 1 o 2.")
    
    # Crear registro de replanteo
    replanteo = Replanteo(
        entidad_tipo="AC",
        entidad_id=ac_id,
        numero=numero,
        justificacion=justificacion,
        fecha_nueva=fecha_nueva,
        estado="APROBADO",
    )
    session.add(replanteo)
    
    # Actualizar AC
    if numero == 1:
        ac.primer_replanteo = fecha_nueva
    else:
        ac.segundo_replanteo = fecha_nueva
    
    session.add(ac)
    session.commit()
    session.refresh(replanteo)
    return replanteo


# ═════════════���═���═══════════════════════════════════════════════════════════════
# AUDITORÍA — Cierre y evaluación de eficacia
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/{ac_id}/cerrar", response_model=AccionCorrectiva)
def cerrar_ac(
    ac_id: int,
    auditoria: AuditoriaCierreRequest,
    session: Session = Depends(get_session)
):
    """Cierra AC con evaluación de eficacia."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    
    if ac.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede cerrar en ejecución.")

    ac.estado = "CERRADO"
    ac.fecha_cierre_real = datetime.utcnow()
    ac.evaluacion_eficacia = auditoria.evaluacion_eficacia
    ac.evidencia_revisada = auditoria.evidencia_revisada
    ac.conclusion_auditor = auditoria.conclusion
    ac.nombre_auditor_cierre = auditoria.nombre_auditor
    
    # Historial
    historial = HistorialCambio(
        entidad_tipo="AC",
        entidad_id=ac_id,
        campo="estado",
        valor_anterior=ac.estado,
        valor_nuevo="CERRADO",
        usuario=auditoria.nombre_auditor,
    )
    session.add(historial)
    
    session.add(ac)
    session.commit()
    session.refresh(ac)
    return ac


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTACIÓN Y CONSULTAS
# ════════════════════════════════��══════════════════════════════════════════════

@router.get("/{ac_id}/historial", response_model=list[HistorialCambio])
def historial_ac(ac_id: int, session: Session = Depends(get_session)):
    """Historial de cambios."""
    return session.exec(
        select(HistorialCambio)
        .where(HistorialCambio.entidad_tipo == "AC", HistorialCambio.entidad_id == ac_id)
        .order_by(HistorialCambio.fecha)
    ).all()


@router.get("/{ac_id}/exportar-word")
def exportar_ac_word(ac_id: int, session: Session = Depends(get_session)):
    """Exporta a Word para formato oficial."""
    ac = session.get(AccionCorrectiva, ac_id)
    if not ac:
        raise HTTPException(status_code=404, detail="Acción Correctiva no encontrada.")
    folio_safe = (ac.folio or f"BORRADOR-{ac.id}").replace("/", "-").replace("#", "")
    docx_bytes = generar_accion_correctiva_docx(ac)
    filename = f"AC_{folio_safe}_{ac.id}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )