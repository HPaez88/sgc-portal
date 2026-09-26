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
    "Medición, Análisis y Mejora",
    "Producción",
    "Proyectos e Infraestructura",
    "Responsabilidad de la Dirección",
]

# Orígenes de Acción Correctiva (formato AC)
ORIGENES_AC = [
    "Auditoría",
    "Análisis de datos",
    "Ensayo no conforme",
    "Indicador",
    "Proceso",
    "Producto no conforme",
    "Reclamaciones de cliente",
    "Queja",
    "Otra",
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

# Períodos para Planes de Mejora (nomenclatura corta compatible con folios)
PERIODOS = ["1er. Cuatri (Ene-Abr)", "2do. Cuatri (May-Ago)", "3er. Cuatri (Sep-Dic)"]

# Roles del equipo de trabajo (compartido por AC y PM)
ROLES_EQUIPO = [
    "Responsable principal",
    "Integrante área involucrada",
    "Integrante externo",
    "Enlace SGC",
    "Apoyo técnico",
    "Responsable de evidencias",
    "Auditor asignado",
]

# ═══════════════════════════════════════════════════════════════════════════════
# ESTADOS Y TRANSICIONES — Workflow completo según formato SGC
# ═══════════════════════════════════════════════════════════════════════════════

# Estados según Control 6 (incluye cierre efectivo / no efectivo y estados heredados)
ESTADOS_SGC = {
    "BORRADOR": "Borrador - En elaboración",
    "EN_REVISION": "En Revisión SGC - Pendiente aprobación",
    "APROBADO": "Aprobado - Folio asignado, en ejecución",
    "EN_SEGUIMIENTO": "En Seguimiento - Actividades en proceso",
    "REVISION_AUDITOR": "Revisión Auditor - Evaluación de eficacia",
    "RECHAZADO": "Rechazado - Requiere correcciones",
    "CERRADO_EFECTIVO": "Cerrado - Eficacia comprobada",
    "CERRADO_NO_EFECTIVO": "Cerrado - Sin eficacia comprobada",
    "CERRADO": "Cerrado - Registro heredado",
}

# Transiciones permitidas del workflow (mismas reglas para AC y PM)
TRANSICIONES = {
    "BORRADOR": ["EN_REVISION"],
    "EN_REVISION": ["APROBADO", "RECHAZADO"],
    "APROBADO": ["EN_SEGUIMIENTO"],
    "EN_SEGUIMIENTO": ["REVISION_AUDITOR", "RECHAZADO"],
    "REVISION_AUDITOR": ["CERRADO_EFECTIVO", "CERRADO_NO_EFECTIVO"],
    "RECHAZADO": ["BORRADOR"],
    "CERRADO_EFECTIVO": [],
    "CERRADO_NO_EFECTIVO": [],
    "CERRADO": [],
}

# Estados considerados como cerrados (para métricas y filtros)
ESTADOS_CERRADOS = ["CERRADO_EFECTIVO", "CERRADO_NO_EFECTIVO", "CERRADO"]

# Matriz de permisos por rol — espejo de frontend/src/constants/workflow.js
PERMISOS_ROL = {
    "Super Admin": ["crear", "editar", "enviar", "aprobar", "rechazar", "asignar_auditor", "cerrar", "reabrir", "eliminar", "ver_todas_areas"],
    "Admin": ["crear", "editar", "enviar", "aprobar", "rechazar", "asignar_auditor", "cerrar", "reabrir", "eliminar", "ver_todas_areas"],
    "Auditor": ["crear", "editar", "cerrar", "rechazar", "ver_todas_areas"],
    "Encargado": ["crear", "editar", "enviar"],
    "Usuario": ["crear", "editar"],
}


# ═══════════════════════════════════════════════════════════════════════════════
# MODELO: AUDITORES (catálogo de Control 6)
# ═══════════════════════════════════════════════════════════════════════════════
class Organismo(SQLModel, table=True):
    __tablename__ = "organismos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    slug: str = Field(
        sa_column=Column(String, nullable=False, unique=True, index=True),
    )
    activo: bool = Field(default=True, index=True)
    fecha_alta: datetime = Field(default_factory=datetime.utcnow)


class Auditor(SQLModel, table=True):
    __tablename__ = "auditores"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    organismo_id: int = Field(default=1, index=True)
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
    organismo_id: int = Field(default=1, index=True)
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
    organismo_id: int = Field(default=1, index=True)
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
    organismo_id: int = Field(default=1, index=True)
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
    organismo_id: int = Field(default=1, index=True)

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
    organismo_id: int = Field(default=1, index=True)

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
