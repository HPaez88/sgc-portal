"""
models.py — Modelos de datos SQLModel para el Portal SGC OOMAPASC
Versión 3.1 — Cumplimiento con formatos oficiales ISO 9001 + Control 6
"""
from datetime import datetime, date
from typing import Optional, List
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text


# ═══════════════════════════════════════════════════════════════════════════════
# CATÁLOGOS — extraídos de formatos Excel oficiales y Control 6
# ═══════════════════════════════════════════════════════════════════════════════

# Direcciones (para agrupar áreas — hoja RD de Control 6)
DIRECCIONES = [
    "TÉCNICA",
    "COMERCIAL", 
    "ADMINISTRATIVA",
    "ÓRGANO DE CONTROL INTERNO",
    "JURÍDICA",
    "PROGRAMAS SOCIALES Y CULTURA DEL AGUA",
    "GENERAL",
]

# Todas las áreas del SGC (ordenadas)
AREAS = [
    # Áreas de Dirección Técnica
    "Mantenimiento de Redes",
    "Alcantarillado y Saneamiento",
    "Plantas Potabilizadoras",
    "Control de Calidad",
    "Sectorización hidrométrica e innovación",
    "Suburbano Técnico",
    "Supervisión y control de obras",
    "Trámites Técnicos",
    "Proyectos e Infraestructura",
    
    # Áreas de Dirección Comercial
    "Padrón de Usuarios",
    "Control y Servicios",
    "Contratos y Servicios",
    "Atención Ciudadana",
    "Verificación y Lectura",
    "Agencia Esperanza",
    "Agencia Marte R. Gómez",
    "Agencia Providencia",
    "Agencia Pueblo Yaqui",
    
    # Áreas de Dirección Administrativa
    "Recursos Humanos",
    "Recursos Materiales",
    "Contabilidad",
    "Comunicación e Imagen Institucional",
    "Informática",
    "Licitaciones",
    "Mantenimiento y Servicios Generales",
    "Trabajo Social",
    "Programas Sociales",
    
    # Otras áreas
    "Jurídico",
    "Órgano de Control Interno",
    "Línea OOMAPASC",
    "Cultura del agua",
    "Seguridad Industrial",
    "Sistema de Gestión de Calidad",
    
    # Direcciones
    "Dir. General",
    "Dir. Técnica",
    "Dir. Comercial",
    "Dir. Administrativa",
    "Dir. Órgano de Control Interno",
    "Dir. Jurídica",
    "Dir. Programas Sociales y Cultura del Agua",
]

# Procesos del SGC (formato Acción Correctiva)
PROCESOS = [
    "Comercialización",
    "Comunicación",
    "Gestión de Recursos",
    "Mantenimiento y Calibración",
    "Medición Análisis y Mejora",
    "Producción",
    "Proyectos e Infraestructura",
    "Responsabilidad de la Dirección",
]

# Orígenes de Acción Correctiva (formato AC)
ORIGENES_AC = [
    "Análisis de datos",
    "Auditoría",
    "Ensayo no conforme",
    "Indicador",
    "Proceso",
    "Producto no conforme",
    "Reclamaciones de cliente",
]

# Orígenes de Plan de Mejora (formato PM)
ORIGENES_PM = [
    "Objetivo de Calidad",
    "Auditoría interna",
]

# Categorías de Mejora (formato PM)
CATEGORIAS_MEJORA = [
    "Fortalecimiento de la Gestión Interna y Mejora Continua",
    "Desarrollo y Profesionalización del Recurso Humano",
    "Innovación Tecnológica y Modernización Institucional",
    "Mejora de los Servicios y Atención al Usuario",
    "Seguridad Operativa y Sostenibilidad Ambiental",
]

# Períodos para Planes de Mejora
PERIODOS = ["1er. Cuatri", "2do. Cuatri", "3er. Cuatri"]

# ═══════════════════════════════════════════════════════════════════════════════
# ESTADOS Y TRANSICIONES — Workflow completo según formato SGC
# ═══════════════════════════════════════════════════════════════════════════════

# Estados según Control 6
ESTADOS_SGC = {
    "BORRADOR": "Borrador - En elaboración",
    "EN_REVISION": "En Revisión - Pendiente aprobación",
    "APROBADO": "Aprobado - En ejecución",
    "EN_SEGUIMIENTO": "En Seguimiento - En proceso",
    "RECHAZADO": "Rechazado - Requiere correcciones",
    "CERRADO": "Cerrado - Completado",
}

# Transiciones permitidas del workflow
TRANSICIONES = {
    "BORRADOR": ["EN_REVISION"],
    "EN_REVISION": ["APROBADO", "RECHAZADO"],
    "APROBADO": ["EN_SEGUIMIENTO"],
    "EN_SEGUIMIENTO": ["CERRADO", "RECHAZADO"],
    "RECHAZADO": ["BORRADOR"],
    "CERRADO": [],  # Estado final
}


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: AUDITORES (catálogo de Control 6)
# ═══════════════════════════════════════════════════════════════════════════════
class Auditor(SQLModel, table=True):
    __tablename__ = "auditores"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    email: Optional[str] = None
    area: Optional[str] = None
    activo: bool = Field(default=True)
    fecha_alta: datetime = Field(default_factory=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: DATOS DE ÁREA (Directorio - Hoja1 de Control 6)
# ═══════════════════════════════════════════════════════════════════════════════
class DatosArea(SQLModel, table=True):
    __tablename__ = "datos_areas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    area: str
    encargado: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None  # TÉCNICA, COMERCIAL, ADMINISTRATIVA
    observaciones: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: HISTORIAL DE CAMBIOS (Audit Trail extendido)
# ═══════════════════════════════════════════════════════════════════���═══════════
class HistorialCambio(SQLModel, table=True):
    __tablename__ = "historial_cambios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    entidad_tipo: str  # "AC" o "PM"
    entidad_id: int
    campo: str  # campo que cambió
    valor_anterior: Optional[str] = None
    valor_nuevo: Optional[str] = None
    usuario: Optional[str] = None
    fecha: datetime = Field(default_factory=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: REPLANTEOS (seguimiento de extensiones de tiempo)
# ═══════════════════════════════════════════════════════════════════════════════
class Replanteo(SQLModel, table=True):
    __tablename__ = "replanteos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    entidad_tipo: str  # "AC" o "PM"
    entidad_id: int
    numero: int  # 1 o 2
    fecha_solicitud: datetime = Field(default_factory=datetime.utcnow)
    fecha_nueva: Optional[datetime] = None
    justificacion: Optional[str] = None
    estado: str = Field(default="PENDIENTE")  # PENDIENTE, APROBADO, RECHAZADO
    solicitud_correo: bool = Field(default=False)  # Si fue por correo (1er replanteo)
    formato_firmado: bool = Field(default=False)  # Si tiene formato OOMRSC-50 (2do replanteo)


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: ACCIÓN CORRECTIVA — Formato oficial completo
# ═══════════════════════════════════════════════════════════════════════════════
class AccionCorrectivaBase(SQLModel):
    # Datos Generales (hoja REGISTRO)
    proceso: str
    area: str
    origen: str
    num_auditoria: Optional[str] = None
    direccion: Optional[str] = None  # Agrupación de área
    
    # Descripción de la No Conformidad
    descripcion_no_conformidad: str
    impacta_otros_procesos: bool = Field(default=False)
    procesos_afectados: Optional[str] = None
    
    # Análisis (hoja ANÁLISIS)
    equipo_trabajo: str = Field(default="[]")  # JSON array
    accion_contenedora: Optional[str] = None
    actividades_contenedoras: Optional[str] = None  # Actividades inmediatas
    causas: Optional[str] = None  # JSON array de causas con puntuación
    causa_raiz_seleccionada: Optional[str] = None
    actualiza_matriz_riesgos: bool = Field(default=False)
    descripcion_riesgo: Optional[str] = None
    requiere_cambio_sgc: Optional[str] = None  # "SI" o "NO"
    
    # Actividades (hoja ACTIVIDADES)
    actividades: Optional[str] = None  # JSON array completo
    
    # Auditoría de cierre (hoja AUDITOR)
    auditor_asignado: Optional[str] = None
    evaluacion_eficacia: Optional[str] = None
    evidencia_revisada: Optional[str] = None
    conclusion_auditor: Optional[str] = None


class AccionCorrectivaCreate(AccionCorrectivaBase):
    pass


class AccionCorrectiva(AccionCorrectivaBase, table=True):
    __tablename__ = "acciones_correctivas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    folio: Optional[str] = Field(
        default=None,
        sa_column=Column(String, nullable=True, index=True),
    )
    fecha_apertura: datetime = Field(default_factory=datetime.utcnow)
    estado: str = Field(default="BORRADOR")
    comentarios_revision: Optional[str] = None
    
    # Fechas de seguimiento
    fecha_cierre_estimada: Optional[datetime] = None
    primer_replanteo: Optional[datetime] = None
    segundo_replanteo: Optional[datetime] = None
    fecha_cierre_real: Optional[datetime] = None
    
    # Info de cierre
    nombre_auditor_cierre: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: PLAN DE MEJORA — Formato oficial completo
# ═══════════════════════════════════════════════════════════════════════════════
class PlanDeMejoraBase(SQLModel):
    # Datos Generales (hoja REGISTRO)
    titulo_mejora: str
    gerencia_coordinacion: str
    categoria_mejora: str
    periodo_mejora: str
    origen: str
    direccion: Optional[str] = None
    
    # Descripción
    descripcion_situacion_actual: str
    situacion_deseada: str
    beneficios: str
    
    # Equipo
    responsable: str
    integrantes: str = Field(default="[]")  # JSON array
    
    # Actividades
    actividades: Optional[str] = None
    
    # Auditoría de cierre
    auditor_asignado: Optional[str] = None
    evaluacion_eficacia: Optional[str] = None
    evidencia_revisada: Optional[str] = None
    conclusion_auditor: Optional[str] = None


class PlanDeMejoraCreate(PlanDeMejoraBase):
    pass


class PlanDeMejora(PlanDeMejoraBase, table=True):
    __tablename__ = "planes_mejora"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    folio: Optional[str] = Field(
        default=None,
        sa_column=Column(String, nullable=True, index=True),
    )
    fecha_elaboracion: datetime = Field(default_factory=datetime.utcnow)
    estado: str = Field(default="BORRADOR")
    comentarios_revision: Optional[str] = None
    
    # Fechas de seguimiento
    fecha_cierre_estimada: Optional[datetime] = None
    primer_replanteo: Optional[datetime] = None
    segundo_replanteo: Optional[datetime] = None
    fecha_cierre_real: Optional[datetime] = None
    
    # Info de cierre
    nombre_auditor_cierre: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ESQUEMAS — Request/Response Pydantic
# ═══════════════════════════════════════════════════════════════════════════════
from pydantic import BaseModel


class EstadoUpdate(BaseModel):
    estado: str
    comentarios_revision: Optional[str] = None
    usuario: Optional[str] = None


class ReplanteoRequest(BaseModel):
    numero: int  # 1 o 2
    justificacion: str
    fecha_nueva: Optional[date] = None
    correo_enviado: bool = False  # Para 1er replanteo
    formato_firmado: bool = False  # Para 2do replanteo


class AuditoriaCierreRequest(BaseModel):
    evaluacion_eficacia: str
    evidencia_revisada: str
    conclusion: str
    nombre_auditor: str
    fecha_cierre: date


class AIPrompt(BaseModel):
    descripcion: str
    tipo: str  # "AC" o "PM"