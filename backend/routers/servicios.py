"""API TEMARQ Service Hub para órdenes de trabajo.

La autenticación definitiva debe conectarse al proveedor de identidad de la
instalación. Mientras tanto, el router mantiene el organismo en el mismo
mecanismo multi-tenant del backend legado.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from backend.database import get_session
from backend.service_models import (
    ALLOWED_STATUS_TRANSITIONS,
    SERVICE_ORDER_STATUSES,
    ServiceOrder,
    ServiceOrderCreate,
    ServiceOrderEvent,
    ServiceOrderStatus,
    ServiceOrderStatusChange,
)
from backend.tenant import get_organismo_id

router = APIRouter(prefix="/api/v1/servicios", tags=["TEMARQ Service Hub"])


def _get_order(session: Session, order_id: int, organismo_id: int) -> ServiceOrder:
    order = session.exec(
        select(ServiceOrder).where(
            ServiceOrder.id == order_id,
            ServiceOrder.organismo_id == organismo_id,
        )
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return order


@router.get("/statuses", response_model=list[ServiceOrderStatus])
def get_service_statuses():
    return SERVICE_ORDER_STATUSES


@router.get("/ordenes", response_model=list[ServiceOrder])
def list_service_orders(
    status: Optional[str] = Query(default=None),
    customer_id: Optional[int] = Query(default=None),
    branch: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    statement = select(ServiceOrder).where(ServiceOrder.organismo_id == organismo_id)
    if status:
        statement = statement.where(ServiceOrder.status == status)
    if customer_id:
        statement = statement.where(ServiceOrder.customer_id == customer_id)
    if branch:
        statement = statement.where(ServiceOrder.branch == branch)
    return session.exec(statement.order_by(ServiceOrder.updated_at.desc())).all()


@router.post("/ordenes", response_model=ServiceOrder, status_code=201)
def create_service_order(
    payload: ServiceOrderCreate,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    next_number = session.exec(select(ServiceOrder)).all()
    folio = f"OT-{datetime.utcnow().year}-{len(next_number) + 1:04d}"
    order = ServiceOrder(
        **payload.model_dump(),
        organismo_id=organismo_id,
        folio=folio,
        status="nueva",
        progress=8,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    session.add(
        ServiceOrderEvent(
            organismo_id=organismo_id,
            order_id=order.id,
            event_type="created",
            to_status="nueva",
            comment="Orden creada",
        )
    )
    session.commit()
    return order


@router.get("/ordenes/{order_id}", response_model=ServiceOrder)
def get_service_order(
    order_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    return _get_order(session, order_id, organismo_id)


@router.get("/ordenes/{order_id}/eventos", response_model=list[ServiceOrderEvent])
def get_service_order_events(
    order_id: int,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    _get_order(session, order_id, organismo_id)
    return session.exec(
        select(ServiceOrderEvent)
        .where(
            ServiceOrderEvent.order_id == order_id,
            ServiceOrderEvent.organismo_id == organismo_id,
        )
        .order_by(ServiceOrderEvent.created_at)
    ).all()


@router.post("/ordenes/{order_id}/status", response_model=ServiceOrder)
def change_service_order_status(
    order_id: int,
    payload: ServiceOrderStatusChange,
    session: Session = Depends(get_session),
    organismo_id: int = Depends(get_organismo_id),
):
    order = _get_order(session, order_id, organismo_id)
    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Transición no permitida: {order.status} -> {payload.status}",
        )

    previous = order.status
    order.status = payload.status
    order.updated_at = datetime.utcnow()
    order.progress = {
        "nueva": 8,
        "programada": 32,
        "traslado": 51,
        "sitio": 68,
        "revision": 92,
        "cerrada": 100,
    }[payload.status]
    if payload.status == "cerrada":
        order.closed_at = datetime.utcnow()

    session.add(
        ServiceOrderEvent(
            organismo_id=organismo_id,
            order_id=order.id,
            actor_user_id=payload.actor_user_id,
            actor_name=payload.actor_name,
            event_type="status_changed",
            from_status=previous,
            to_status=payload.status,
            comment=payload.comment,
        )
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order
