"""
main.py — Portal SGC OOMAPASC de Cajeme (FastAPI)
Versión 3.1 — Control 6 integrado + Workflow completo
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, date
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select, func

from backend.database import create_db_and_tables, get_session
from backend.models import (
    AccionCorrectiva, PlanDeMejora, Auditor, Replanteo,
    AREAS, DIRECCIONES, PROCESOS, ORIGENES_AC, ORIGENES_PM,
    CATEGORIAS_MEJORA, ORIGENES_PM, PERIODOS, ESTADOS_SGC, TRANSICIONES
)
from backend.routers import acciones, planes, ai, catalogo

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="Portal SGC — OOMAPASC de Cajeme",
    description="Sistema de Gestión de Calidad ISO 9001 · Control 6",
    version="3.1.0",
    lifespan=lifespan,
)

# Serve static frontend in production
if os.getenv("ENVIRONMENT") == "production":
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# CORS
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(acciones.router)
app.include_router(planes.router)
app.include_router(ai.router)
app.include_router(catalogo.router)


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD — Estadísticas estilo Control 6
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/v1/dashboard", tags=["Dashboard"])
def get_dashboard(session: Session = Depends(get_session)):
    """Dashboard con métricas de Control 6."""
    # === ACCIONES CORRECTIVAS ===
    ac_todos = session.exec(select(AccionCorrectiva)).all()
    ac_abiertos = [ac for ac in ac_todos if ac.estado != "CERRADO"]
    ac_cerradas = [ac for ac in ac_todos if ac.estado == "CERRADO"]
    
    # Por estado
    ac_por_estado = {}
    for ac in ac_todos:
        ac_por_estado[ac.estado] = ac_por_estado.get(ac.estado, 0) + 1
    
    # En tiempo vs fuera de tiempo
    hoy = datetime.now()
    ac_en_tiempo = 0
    ac_fuera_tiempo = 0
    for ac in ac_abiertas:
        dias_limite = 180  # 6 meses máximo
        if (hoy - ac.fecha_apertura).days > dias_limite:
            ac_fuera_tiempo += 1
        else:
            ac_en_tiempo += 1
    
    # === PLANES DE MEJORA ===
    pm_todos = session.exec(select(PlanDeMejora)).all()
    pm_abiertos = [pm for pm in pm_todos if pm.estado != "CERRADO"]
    pm_cerrados = [pm for pm in pm_todos if pm.estado == "CERRADO"]
    
    pm_por_estado = {}
    for pm in pm_todos:
        pm_por_estado[pm.estado] = pm_por_estado.get(pm.estado, 0) + 1
    
    pm_en_tiempo = 0
    pm_fuera_tiempo = 0
    for pm in pm_abiertos:
        dias_limite = 180
        if (hoy - pm.fecha_elaboracion).days > dias_limite:
            pm_fuera_tiempo += 1
        else:
            pm_en_tiempo += 1
    
    # === POR DIRECCIÓN (estilo RD de Control 6) ===
    ac_por_direccion = {}
    for ac in ac_todos:
        direccion = ac.direccion or "SIN ASIGNAR"
        ac_por_direccion[direccion] = ac_por_direccion.get(direccion, 0) + 1
    
    pm_por_direccion = {}
    for pm in pm_todos:
        direccion = pm.direccion or "SIN ASIGNAR"
        pm_por_direccion[direccion] = pm_por_direccion.get(direccion, 0) + 1
    
    # === POR ÁREA (top 5) ===
    area_count = {}
    for ac in ac_todos:
        area_count[ac.area] = area_count.get(ac.area, 0) + 1
    for pm in pm_todos:
        area_count[pm.gerencia_coordinacion] = area_count.get(pm.gerencia_coordinacion, 0) + 1
    
    top_areas = sorted(area_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # === ACTIVIDAD RECIENTE ===
    ultimas_ac = sorted(ac_todos, key=lambda x: x.fecha_apertura, reverse=True)[:3]
    ultimos_pm = sorted(pm_todos, key=lambda x: x.fecha_elaboracion, reverse=True)[:3]
    
    recientes = sorted(
        [
            {"tipo": "AC", "folio": x.folio, "area": x.area, "estado": x.estado,
             "fecha": x.fecha_apertura.isoformat()} for x in ultimas_ac
        ] +
        [
            {"tipo": "PM", "folio": x.folio, "area": x.gerencia_coordinacion,
             "estado": x.estado, "fecha": x.fecha_elaboracion.isoformat()} for x in ultimos_pm
        ],
        key=lambda x: x["fecha"], reverse=True
    )[:6]
    
    # === RESUMEN ANUAL ===
    año_actual = datetime.now().year
    ac_año = [ac for ac in ac_todos if ac.fecha_apertura.year == año_actual]
    pm_año = [pm for pm in pm_todos if pm.fecha_elaboracion.year == año_actual]
    
    return {
        "periodo": {
            "año": año_actual,
            "mes_actual": hoy.strftime("%B"),
        },
        "totales": {
            "acciones_correctivas": len(ac_todos),
            "planes_mejora": len(pm_todos),
            "total": len(ac_todos) + len(pm_todos),
            "abiertas": len(ac_abiertos) + len(pm_abiertos),
            "cerradas": len(ac_cerradas) + len(pm_cerrados),
        },
        "ac_por_estado": ac_por_estado,
        "pm_por_estado": pm_por_estado,
        
        "ac_seguimiento": {
            "en_tiempo": ac_en_tiempo,
            "fuera_tiempo": ac_fuera_tiempo,
            "total_abiertas": len(ac_abiertos),
        },
        "pm_seguimiento": {
            "en_tiempo": pm_en_tiempo,
            "fuera_tiempo": pm_fuera_tiempo,
            "total_abiertas": len(pm_abiertos),
        },
        
        "ac_por_direccion": ac_por_direccion,
        "pm_por_direccion": pm_por_direccion,
        
        "top_areas": [{"area": a, "total": c} for a, c in top_areas],
        
        "recientes": recientes,
        
        "resumen_anio": {
            "ac_abiertas": len([ac for ac in ac_año if ac.estado != "CERRADO"]),
            "ac_cerradas": len([ac for ac in ac_año if ac.estado == "CERRADO"]),
            "pm_abiertos": len([pm for pm in pm_año if pm.estado != "CERRADO"]),
            "pm_cerrados": len([pm for pm in pm_año if pm.estado == "CERRADO"]),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CATÁLOGOS — Datos para dropdowns
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/v1/catalogos", tags=["Catálogos"])
def obtener_catalogos():
    """Catálogos del sistema."""
    return {
        "direcciones": DIRECCIONES,
        "areas": AREAS,
        "procesos": PROCESOS,
        "origenes_ac": ORIGENES_AC,
        "origenes_pm": ORIGENES_PM,
        "categorias_mejora": CATEGORIAS_MEJORA,
        "periodos": PERIODOS,
        "estados": ESTADOS_SGC,
        "transiciones": TRANSICIONES,
    }


@app.get("/", tags=["Root"])
def root():
    if os.getenv("ENVIRONMENT") == "production":
        return FileResponse("frontend/dist/index.html")
    return {
        "mensaje": "Portal SGC OOMAPASC de Cajeme — API v3.1",
        "version": "3.1.0",
        "control_6": "integrado",
    }