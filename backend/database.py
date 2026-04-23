"""
database.py — Configuración de base de datos SQLite para el Portal SGC OOMAPASC
Versión 3.1 — Con soporte para Control 6
"""
from sqlalchemy import create_engine, text
from sqlmodel import SQLModel, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sgc_portal.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS para migración de tablas existentes
# ═══════════════════════════════════════════════════════════════════════════════

_AC_SCHEMA_V3 = """
CREATE TABLE IF NOT EXISTS acciones_correctivas (
    id INTEGER NOT NULL PRIMARY KEY,
    folio VARCHAR,
    fecha_apertura DATETIME NOT NULL,
    estado VARCHAR NOT NULL DEFAULT 'BORRADOR',
    comentarios_revision VARCHAR,
    
    -- Datos Generales
    proceso VARCHAR NOT NULL,
    area VARCHAR NOT NULL,
    origen VARCHAR NOT NULL,
    num_auditoria VARCHAR,
    direccion VARCHAR,
    
    -- Descripción NC
    descripcion_no_conformidad VARCHAR NOT NULL,
    impacta_otros_procesos BOOLEAN DEFAULT 0,
    procesos_afectados VARCHAR,
    
    -- Análisis
    equipo_trabajo VARCHAR DEFAULT '[]',
    accion_contenedora VARCHAR,
    actividades_contenedoras VARCHAR,
    causas VARCHAR,
    causa_raiz_seleccionada VARCHAR,
    actualiza_matriz_riesgos BOOLEAN DEFAULT 0,
    descripcion_riesgo VARCHAR,
    requiere_cambio_sgc VARCHAR,
    
    -- Actividades
    actividades VARCHAR,
    
    -- Seguimiento
    fecha_cierre_estimada DATETIME,
    primer_replanteo DATETIME,
    segundo_replanteo DATETIME,
    fecha_cierre_real DATETIME,
    
    -- Auditoría cierre
    auditor_asignado VARCHAR,
    evaluacion_eficacia VARCHAR,
    evidencia_revisada VARCHAR,
    conclusion_auditor VARCHAR,
    nombre_auditor_cierre VARCHAR
)
"""

_PM_SCHEMA_V3 = """
CREATE TABLE IF NOT EXISTS planes_mejora (
    id INTEGER NOT NULL PRIMARY KEY,
    folio VARCHAR,
    fecha_elaboracion DATETIME NOT NULL,
    estado VARCHAR NOT NULL DEFAULT 'BORRADOR',
    comentarios_revision VARCHAR,
    
    -- Datos Generales
    titulo_mejora VARCHAR NOT NULL,
    gerencia_coordinacion VARCHAR NOT NULL,
    categoria_mejora VARCHAR NOT NULL,
    periodo_mejora VARCHAR NOT NULL,
    origen VARCHAR NOT NULL,
    direccion VARCHAR,
    
    -- Descripción
    descripcion_situacion_actual VARCHAR NOT NULL,
    situacion_deseada VARCHAR NOT NULL,
    beneficios VARCHAR NOT NULL,
    
    -- Equipo
    responsable VARCHAR NOT NULL,
    integrantes VARCHAR DEFAULT '[]',
    
    -- Actividades
    actividades VARCHAR,
    
    -- Seguimiento
    fecha_cierre_estimada DATETIME,
    primer_replanteo DATETIME,
    segundo_replanteo DATETIME,
    fecha_cierre_real DATETIME,
    
    -- Auditoría cierre
    auditor_asignado VARCHAR,
    evaluacion_eficacia VARCHAR,
    evidencia_revisada VARCHAR,
    conclusion_auditor VARCHAR,
    nombre_auditor_cierre VARCHAR
)
"""

_AUDITORES_SCHEMA = """
CREATE TABLE IF NOT EXISTS auditores (
    id INTEGER NOT NULL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    email VARCHAR,
    area VARCHAR,
    activo BOOLEAN DEFAULT 1,
    fecha_alta DATETIME NOT NULL
)
"""

_DATOS_AREAS_SCHEMA = """
CREATE TABLE IF NOT EXISTS datos_areas (
    id INTEGER NOT NULL PRIMARY KEY,
    area VARCHAR NOT NULL,
    encargado VARCHAR,
    email VARCHAR,
    telefono VARCHAR,
    direccion VARCHAR,
    observaciones VARCHAR
)
"""

_REPLANTEOS_SCHEMA = """
CREATE TABLE IF NOT EXISTS replanteos (
    id INTEGER NOT NULL PRIMARY KEY,
    entidad_tipo VARCHAR NOT NULL,
    entidad_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    fecha_solicitud DATETIME NOT NULL,
    fecha_nueva DATETIME,
    justificacion VARCHAR,
    estado VARCHAR DEFAULT 'PENDIENTE',
    correo_enviado BOOLEAN DEFAULT 0,
    formato_firmado BOOLEAN DEFAULT 0
)
"""

_HISTORIAL_SCHEMA = """
CREATE TABLE IF NOT EXISTS historial_cambios (
    id INTEGER NOT NULL PRIMARY KEY,
    entidad_tipo VARCHAR NOT NULL,
    entidad_id INTEGER NOT NULL,
    campo VARCHAR NOT NULL,
    valor_anterior VARCHAR,
    valor_nuevo VARCHAR,
    usuario VARCHAR,
    fecha DATETIME NOT NULL
)
"""


def create_db_and_tables():
    """Crea las tablas si no existen."""
    SQLModel.metadata.create_all(engine)
    
    with engine.connect() as conn:
        # Crear tablas adicionales si no existen
        conn.execute(text(_AUDITORES_SCHEMA.replace("CREATE TABLE IF NOT EXISTS", "CREATE TABLE IF NOT EXISTS")))
        conn.execute(text(_DATOS_AREAS_SCHEMA.replace("CREATE TABLE IF NOT EXISTS", "CREATE TABLE IF NOT EXISTS")))
        conn.execute(text(_REPLANTEOS_SCHEMA.replace("CREATE TABLE IF NOT EXISTS", "CREATE TABLE IF NOT EXISTS")))
        conn.execute(text(_HISTORIAL_SCHEMA.replace("CREATE TABLE IF NOT EXISTS", "CREATE TABLE IF NOT EXISTS")))
        conn.commit()


def get_session():
    with Session(engine) as session:
        yield session