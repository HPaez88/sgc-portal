"""
backend/routers/fichas_ayuntamiento.py — Router FastAPI para Fichas Técnicas y Presentación de Proyectos
del H. Ayuntamiento de Cajeme y OOMAPASC (Presupuesto de Egresos 2026 / PMD).
"""

import os
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

from backend.services.fichas_docx_service import (
    generar_docx_ficha_tecnica,
    generar_docx_proyecto_presupuesto,
    DOCS_FOLDER
)

router = APIRouter(prefix="/api/v1/fichas", tags=["Fichas Gubernamentales Ayuntamiento"])

class FichaExportRequest(BaseModel):
    ficha: Dict[str, Any]

class ProyectoExportRequest(BaseModel):
    proyecto: Dict[str, Any]

@router.post("/exportar-ficha-docx")
def exportar_ficha_docx(payload: FichaExportRequest):
    """
    Genera y descarga en formato Microsoft Word (.docx) oficial la Ficha Técnica del Indicador.
    """
    try:
        ficha = payload.ficha
        ind_num = ficha.get('indicador_numero', ficha.get('indicador_id', '0'))
        ind_nombre = ficha.get('identificacion', {}).get('nombre_indicador', 'Indicador')
        
        docx_bytes = generar_docx_ficha_tecnica(ficha)
        
        filename = f"Ficha_Tecnica_Ind_{ind_num}_{ind_nombre[:30].replace(' ', '_')}.docx"
        
        return StreamingResponse(
            docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar documento Word: {str(e)}")

@router.post("/exportar-proyecto-docx")
def exportar_proyecto_docx(payload: ProyectoExportRequest):
    """
    Genera y descarga en formato Microsoft Word (.docx) oficial el Formato de Presentación de Proyectos.
    """
    try:
        proyecto = payload.proyecto
        prog_clave = proyecto.get('clave_programa', 'Proyecto')
        
        docx_bytes = generar_docx_proyecto_presupuesto(proyecto)
        
        filename = f"Presentacion_Proyecto_{prog_clave}_Presupuesto_2026.docx"
        
        return StreamingResponse(
            docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar proyecto Word: {str(e)}")

@router.get("/descargar-original/{filename}")
def descargar_archivo_original(filename: str):
    """
    Descarga directamente el archivo .docx de referencia original de la carpeta oficial.
    """
    safe_name = os.path.basename(filename)
    path = os.path.join(DOCS_FOLDER, safe_name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Archivo oficial no encontrado")
    
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=safe_name
    )
