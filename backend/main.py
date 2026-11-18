"""
main.py — Portal SGC OOMAPASC de Cajeme (FastAPI)
Versión 3.1 — Control 6 integrado + Workflow completo
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, date
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select, func

from backend.database import create_db_and_tables, get_session, engine
from backend import auth as auth_lib
from backend.seed_usuarios import sembrar_usuarios
from backend.seed_documentos import sembrar_documentos
from backend.tenant import get_organismo_id
from backend.routers import ai, catalogo, organismos, iso_agent, fichas_ayuntamiento, manual, archivos, auth, documentos, estado, notificaciones, buzon, formatos_indicadores, folios, auditorias

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación."""
    auth_lib.validar_configuracion()
    create_db_and_tables()
    sembrar_usuarios(engine)
    sembrar_documentos(engine)
    yield


PRODUCCION = os.getenv("ENVIRONMENT") == "production"
app = FastAPI(
    title="Portal SGC — OOMAPASC de Cajeme",
    description="Sistema de Gestión de Calidad ISO 9001 · Control 6",
    version="3.1.0",
    lifespan=lifespan,
    # En producción no se publica el mapa de la API (auditoría 2026-11-18).
    docs_url=None if PRODUCCION else "/docs",
    redoc_url=None if PRODUCCION else "/redoc",
    openapi_url=None if PRODUCCION else "/openapi.json",
)

# Cabeceras de seguridad en toda respuesta. La página solo carga recursos propios y Google Fonts; las imágenes de
# evidencia vienen de enlaces firmados de B2 (https:). Estilos en línea los usa React (style=...).
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; "
       "frame-src 'self' blob: https:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; "
       "form-action 'self'; frame-ancestors 'none'")


@app.middleware("http")
async def cabeceras_seguridad(request, call_next):
    respuesta = await call_next(request)
    h = respuesta.headers
    h.setdefault("X-Content-Type-Options", "nosniff")
    h.setdefault("X-Frame-Options", "DENY")
    h.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    h.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=(self)")
    h.setdefault("Content-Security-Policy", CSP)
    if PRODUCCION:
        h.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return respuesta

# Serve static frontend in production
if os.getenv("ENVIRONMENT") == "production":
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    app.mount("/icons", StaticFiles(directory="frontend/dist/icons"), name="icons")

# CORS
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5180,http://127.0.0.1:5180,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers. Todo exige sesión salvo /auth (login) y la raíz que sirve el frontend.
PROTEGIDO = [Depends(auth_lib.usuario_actual)]
app.include_router(auth.router)
app.include_router(buzon.router)  # webhook firmado + endpoints con su propia validación de rol
for r in (ai, catalogo, organismos, iso_agent, fichas_ayuntamiento, manual, archivos, documentos, estado, notificaciones,
          formatos_indicadores, folios, auditorias):
    app.include_router(r.router, dependencies=PROTEGIDO)



# NOTA: Los catálogos están disponibles en /api/v1/catalogos
# a través de routers/catalogo.py


@app.get("/health", tags=["Root"], include_in_schema=False)
def health():
    """Sonda de vida sin sesión (healthcheck de Docker/Traefik)."""
    return {"status": "ok"}


_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
_RAIZ_PWA = {
    "manifest.webmanifest": "application/manifest+json", "sw.js": "application/javascript", "favicon.svg": "image/svg+xml",
    "logo-oomapasc.png": "image/png", "logo-oomapasc-blanco.png": "image/png",  # logos institucionales
    "logo-oomapasc-icono.png": "image/png",
}


@app.get("/{archivo}", include_in_schema=False)
def archivo_raiz_pwa(archivo: str):
    """Archivos de la app instalable que deben vivir en la raíz (manifest, service worker, favicon)."""
    tipo = _RAIZ_PWA.get(archivo)
    ruta = _DIST / archivo
    if not tipo or not ruta.is_file():
        raise HTTPException(status_code=404)
    return FileResponse(ruta, media_type=tipo, headers={"Cache-Control": "no-cache"})


@app.get("/", tags=["Root"])
def root():
    if os.getenv("ENVIRONMENT") == "production":
        return FileResponse("frontend/dist/index.html", headers={"Cache-Control": "no-cache"})
    return {
        "mensaje": "Portal SGC OOMAPASC de Cajeme — API v3.1",
        "version": "3.1.0",
        "control_6": "integrado",
    }
