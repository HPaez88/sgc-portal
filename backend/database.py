"""
database.py - Database configuration for the SGC Portal.

SQLite remains available for local development, while production can use
Postgres through DATABASE_URL.
"""
import os

from sqlalchemy import create_engine, inspect, text
from sqlmodel import SQLModel, Session, select


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL", "sqlite:///./sgc_portal.db")
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=not DATABASE_URL.startswith("sqlite"),
)


TENANT_TABLES = [
    "acciones_correctivas",
    "planes_mejora",
    "auditores",
    "datos_areas",
    "replanteos",
    "historial_cambios",
]


def _add_organismo_id_columns() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table_name in TENANT_TABLES:
            if table_name not in table_names:
                continue

            columns = {col["name"] for col in inspector.get_columns(table_name)}
            if "organismo_id" in columns:
                continue

            if engine.dialect.name == "sqlite":
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        "ADD COLUMN organismo_id INTEGER NOT NULL DEFAULT 1"
                    )
                )
            else:
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        "ADD COLUMN IF NOT EXISTS organismo_id INTEGER NOT NULL DEFAULT 1"
                    )
                )


def _ensure_default_organismo() -> None:
    from backend.models import Organismo

    default_name = os.getenv("DEFAULT_ORGANISMO_NOMBRE", "OOMAPASC de Cajeme")
    default_slug = os.getenv("DEFAULT_ORGANISMO_SLUG", "oomapasc")

    with Session(engine) as session:
        organismo = session.exec(
            select(Organismo).where(Organismo.slug == default_slug)
        ).first()
        if organismo:
            return

        session.add(Organismo(nombre=default_name, slug=default_slug, activo=True))
        session.commit()


def create_db_and_tables():
    """Create tables and apply lightweight startup migrations."""
    SQLModel.metadata.create_all(engine)
    _add_organismo_id_columns()
    _ensure_default_organismo()


def get_session():
    with Session(engine) as session:
        yield session
