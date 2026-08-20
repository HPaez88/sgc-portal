"""Modelos del dominio TEMARQ Service Hub.

Estos modelos conviven con el dominio SGC legado y están aislados para permitir
una migración progresiva sin romper las tablas existentes.
"""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ServiceCustomer(SQLModel, table=True):
    __tablename__ = "service_customers"

    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
    name: str = Field(index=True)
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_level: str = Field(default="Estándar")
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceSite(SQLModel, table=True):
    __tablename__ = "service_sites"

    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
    customer_id: int = Field(index=True)
    name: str
    address: str
    city: Optional[str] = None
    branch: Optional[str] = None
    access_notes: Optional[str] = None
    active: bool = Field(default=True)


class ServiceAsset(SQLModel, table=True):
    __tablename__ = "service_assets"

    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
    customer_id: int = Field(index=True)
    site_id: Optional[int] = Field(default=None, index=True)
    asset_type: str = Field(default="Aire acondicionado")
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(default=None, index=True)
    capacity: Optional[str] = None
    warranty_until: Optional[datetime] = None
    last_service_at: Optional[datetime] = None
    next_service_at: Optional[datetime] = None
    active: bool = Field(default=True)


class ServiceOrder(SQLModel, table=True):
    __tablename__ = "service_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
    folio: str = Field(index=True, unique=True)
    customer_id: int = Field(index=True)
    site_id: Optional[int] = Field(default=None, index=True)
    asset_id: Optional[int] = Field(default=None, index=True)
    service_type: str
    category: str = Field(default="Mantenimiento")
    description: str
    priority: str = Field(default="Media", index=True)
    status: str = Field(default="nueva", index=True)
    assigned_user_id: Optional[int] = Field(default=None, index=True)
    assigned_name: Optional[str] = None
    branch: Optional[str] = None
    due_at: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None
    progress: int = Field(default=0)
    estimated_amount: float = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None


class ServiceOrderEvent(SQLModel, table=True):
    __tablename__ = "service_order_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
    order_id: int = Field(index=True)
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    event_type: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceOrderCreate(SQLModel):
    customer_id: int
    site_id: Optional[int] = None
    asset_id: Optional[int] = None
    service_type: str
    category: str = "Mantenimiento"
    description: str
    priority: str = "Media"
    branch: Optional[str] = None
    due_at: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None
    estimated_amount: float = 0


class ServiceOrderStatusChange(SQLModel):
    status: str
    comment: Optional[str] = None
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None


class ServiceOrderStatus(SQLModel):
    status: str
    label: str
    client_label: str


SERVICE_ORDER_STATUSES = [
    ServiceOrderStatus(status="nueva", label="Nueva", client_label="Solicitud recibida"),
    ServiceOrderStatus(status="programada", label="Programada", client_label="Visita programada"),
    ServiceOrderStatus(status="traslado", label="En traslado", client_label="Técnico en camino"),
    ServiceOrderStatus(status="sitio", label="En sitio", client_label="Trabajo en proceso"),
    ServiceOrderStatus(status="revision", label="En revisión", client_label="Validación de servicio"),
    ServiceOrderStatus(status="cerrada", label="Cerrada", client_label="Servicio completado"),
]

STATUS_ORDER = [item.status for item in SERVICE_ORDER_STATUSES]
ALLOWED_STATUS_TRANSITIONS = {
    "nueva": {"programada", "cerrada"},
    "programada": {"traslado", "nueva", "cerrada"},
    "traslado": {"sitio", "programada"},
    "sitio": {"revision", "traslado"},
    "revision": {"cerrada", "sitio"},
    "cerrada": {"revision"},
}
