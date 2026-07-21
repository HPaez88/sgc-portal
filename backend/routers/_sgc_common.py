"""
Shared Common SGC modules for routers actions (AC/PM).
"""
from datetime import datetime, timedelta
from typing import Optional, Type, Any, Dict

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


def _get_sgc(
    session: Session,
    entidad_tipo: str,
    entidad_id: int,
    organismo_id: int,
) -> Optional[Any]:
    # Return the model based on entity type
    if entidad_tipo == "AC":
        from backend.models import AccionCorrectiva
        modelo = AccionCorrectiva
    elif entidad_tipo == "PM":
        from backend.models import PlanDeMejora
        modelo = PlanDeMejora
    else:
        raise ValueError(f"Tipo entidad desconocido: {entidad_tipo}")

    return session.exec(
        select(modelo).where(
            modelo.id == entidad_id,
            modelo.organismo_id == organismo_id,
        )
    ).first()


def _generar_folio_sgc(session: Session, entidad_tipo: str, organismo_id: int) -> str:
    year = datetime.utcnow().year
    if entidad_tipo == "AC":
        prefijo = f"AC-{year}/"
        from backend.models import AccionCorrectiva
        modelo = AccionCorrectiva
    elif entidad_tipo == "PM":
        prefijo = f"PM-{year}/"
        from backend.models import PlanDeMejora
        modelo = PlanDeMejora
    else:
        raise ValueError(f"Tipo entidad desconocido: {entidad_tipo}")

    folios = session.exec(
        select(modelo.folio).where(
            modelo.organismo_id == organismo_id,
            modelo.folio.like(f"{prefijo}%"),
        )
    ).all()

    max_num = 0
    for folio in folios:
        if not folio:
            continue
        try:
            max_num = max(max_num, int(folio.rsplit("/", 1)[1]))
        except (IndexError, ValueError):
            continue
    return f"{prefijo}{max_num + 1:03d}"


def _crear_sgc(
    entidad_tipo: str,
    datos: Dict,
    session: Session,
    organismo_id: int,
) -> Any:
    if entidad_tipo == "AC":
        from backend.models import AccionCorrectiva
        modelo = AccionCorrectiva
    elif entidad_tipo == "PM":
        from backend.models import PlanDeMejora
        modelo = PlanDeMejora
    else:
        raise ValueError(f"Tipo entidad desconocido: {entidad_tipo}")

    nuevo = modelo.model_validate(datos)
    nuevo.organismo_id = organismo_id
    nuevo.folio = None
    nuevo.estado = "BORRADOR"

    area_field = "area" if entidad_tipo == "AC" else "gerencia_coordinacion"
    if not nuevo.direccion and area_field in datos:
        nuevo.direccion = _asignar_direccion(datos[area_field])

    nuevo.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)

    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


def _cambiar_estado_sgc(
    session: Session,
    entidad_tipo: str,
    entidad_id: int,
    organismo_id: int,
    update: EstadoUpdate,
) -> Any:
    entidad = _get_sgc(session, entidad_tipo, entidad_id, organismo_id)
    if not entidad:
        raise HTTPException(status_code=404, detail=f"{entidad_tipo} no encontrado.")

    estado_anterior = entidad.estado
    nuevo_estado = update.estado.upper()
    transiciones_permitidas = TRANSICIONES.get(entidad.estado, [])

    if nuevo_estado not in transiciones_permitidas:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Transicion invalida: '{entidad.estado}' -> '{nuevo_estado}'. "
                f"Permitidas: {transiciones_permitidas}"
            ),
        )

    if nuevo_estado == "RECHAZADO" and not (update.comentarios_revision or "").strip():
        raise HTTPException(status_code=422, detail="Se requieren comentarios para rechazar.")

    if nuevo_estado == "APROBADO" and not entidad.folio:
        entidad.folio = _generar_folio_sgc(session, entidad_tipo, organismo_id)
        entidad.fecha_cierre_estimada = datetime.utcnow() + timedelta(days=180)

    historial = HistorialCambio(
        organismo_id=organismo_id,
        entidad_tipo=entidad_tipo,
        entidad_id=entidad_id,
        campo="estado",
        valor_anterior=estado_anterior,
        valor_nuevo=nuevo_estado,
        usuario=update.usuario,
    )
    session.add(historial)

    entidad.estado = nuevo_estado
    if update.comentarios_revision is not None:
        entidad.comentarios_revision = update.comentarios_revision

    session.add(entidad)
    session.commit()
    session.refresh(entidad)
    return entidad


def _cerrar_sgc(
    session: Session,
    entidad_tipo: str,
    entidad_id: int,
    organismo_id: int,
    auditoria: AuditoriaCierreRequest,
) -> Any:
    entidad = _get_sgc(session, entidad_tipo, entidad_id, organismo_id)
    if not entidad:
        raise HTTPException(status_code=404, detail=f"{entidad_tipo} no encontrado.")

    if entidad.estado not in ["APROBADO", "EN_SEGUIMIENTO"]:
        raise HTTPException(status_code=409, detail="Solo se puede cerrar en ejecucion.")

    estado_anterior = entidad.estado
    setattr(entidad, "estado", "CERRADO")
    entidad.fecha_cierre_real = datetime.utcnow()
    entidad.evaluacion_eficacia = auditoria.evaluacion_eficacia
    entidad.evidencia_revisada = auditoria.evidencia_revisada
    entidad.conclusion_auditor = auditoria.conclusion
    entidad.nombre_auditor_cierre = auditoria.nombre_auditor

    session.add(
        HistorialCambio(
            organismo_id=organismo_id,
            entidad_tipo=entidad_tipo,
            entidad_id=entidad_id,
            campo="estado",
            valor_anterior=estado_anterior,
            valor_nuevo="CERRADO",
            usuario=auditoria.nombre_auditor,
        )
    )

    session.add(entidad)
    session.commit()
    session.refresh(entidad)
    return entidad


def _listar_sgc(
    session: Session,
    entidad_tipo: str,
    estado: Optional[str] = None,
    area: Optional[str] = None,
    direccion: Optional[str] = None,
    organismo_id: int,
) -> Any:
    if entidad_tipo == "AC":
        from backend.models import AccionCorrectiva
        modelo = AccionCorrectiva
    elif entidad_tipo == "PM":
        from backend.models import PlanDeMejora
        modelo = PlanDeMejora
    else:
        raise ValueError(f"Tipo entidad desconocido: {entidad_tipo}")

    query = (
        select(modelo)
        .where(modelo.organismo_id == organismo_id)
        .order_by(modelo.id.desc())
    )

    if estado:
        query = query.where(modelo.estado == estado)
    if area:
        if entidad_tipo == "AC":
            query = query.where(modelo.area == area)
        else:
            query = query.where(modelo.gerencia_coordinacion == area)
    if direccion:
        query = query.where(modelo.direccion == direccion)

    return session.exec(query).all()


def _exportar_sgc_word(
    session: Session,
    entidad_tipo: str,
    entidad_id: int,
    organismo_id: int,
) -> bytes:
    entidad = _get_sgc(session, entidad_tipo, entidad_id, organismo_id)
    if not entidad:
        raise HTTPException(status_code=404, detail=f"{entidad_tipo} no encontrado.")

    if entidad_tipo == "AC":
        docx_bytes = generar_accion_correctiva_docx(entidad)
        filename = f"AC_{entidad.folio or f'BORRADOR-{entidad.id}'}_{entidad.id}.docx"
    elif entidad_tipo == "PM":
        docx_bytes = generar_plan_mejora_docx(entidad)
        filename = f"PM_{entidad.folio or f'BORRADOR-{entidad.id}'}_{entidad.id}.docx"
    else:
        raise ValueError(f"Tipo entidad desconocido: {entidad_tipo}")

    return docx_bytes