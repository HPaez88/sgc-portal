"""
manual.py — Manual de la Calidad y anexos (consulta).
Sirve backend/knowledge/manual/manual.json generado por scripts/extraer_manual.py
y los archivos originales para descarga/visualización.
"""
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/v1/manual", tags=["Manual de la Calidad"])

BASE = Path(__file__).resolve().parent.parent / "knowledge" / "manual"
ARCHIVOS = BASE / "archivos"


@lru_cache(maxsize=1)
def _cargar() -> dict:
    ruta = BASE / "manual.json"
    if not ruta.exists():
        raise HTTPException(status_code=503, detail="Manual no generado. Ejecuta scripts/extraer_manual.py")
    return json.loads(ruta.read_text(encoding="utf-8"))


@router.get("")
def obtener_manual():
    """Manual por secciones + anexos extraídos (solo lectura)."""
    return _cargar()


@router.get("/archivos/{nombre}")
def descargar_archivo(nombre: str):
    """Archivo original (docx/xlsx/pdf) de un documento del manual."""
    ruta = (ARCHIVOS / Path(nombre).name).resolve()
    if ruta.parent != ARCHIVOS.resolve() or not ruta.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(ruta, filename=ruta.name, content_disposition_type="inline")
