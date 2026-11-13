"""
formatos_indicadores.py — Descarga de los formatos oficiales llenos con el proyecto anual (clave 'sgc-proyectos-indicadores').
proyecto -> Formato de Presentación de Proyectos (.docx) · ficha -> Ficha técnica de una actividad (.docx) · pems -> PEM-1/PEM-2 (.xlsx)
"""
import json
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import EstadoPortal
from backend.services import formatos_indicadores as fmt
from backend.tenant import get_organismo_id

router = APIRouter(prefix="/api/v1/indicadores/formatos", tags=["Indicadores"])
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def _estado(s: Session, organismo_id: int, clave: str, defecto):
    f = s.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)).first()
    try:
        return json.loads(f.valor) if f else defecto
    except ValueError:
        return defecto


def _archivo(contenido: bytes, tipo: str, nombre: str) -> Response:
    limpio = re.sub(r"[^\w\- .]", "", nombre).strip() or "formato"
    return Response(contenido, media_type=tipo, headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(limpio)}"})


def cumplimiento_mensual(datos_ind: dict, indicador_id, anio) -> list[str]:
    """Resultados capturados en el Cuadro de Control para la fila 'Cumplimiento' de la ficha."""
    if indicador_id in (None, ""):
        return [""] * 12
    res = (datos_ind or {}).get("resultados") or {}
    out = []
    for m in MESES:
        v = (res.get(f"{indicador_id}-{m}-{anio}") or {}).get("valor")
        out.append("" if v in (None, "") else str(v))
    return out


@router.get("/{proyecto_id}/{tipo}")
def descargar(proyecto_id: str, tipo: str, actividad: int = 0, session: Session = Depends(get_session),
              organismo_id: int = Depends(get_organismo_id)):
    proyectos = _estado(session, organismo_id, "sgc-proyectos-indicadores", [])
    p = next((x for x in proyectos if isinstance(x, dict) and str(x.get("id")) == proyecto_id), None)
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado. Guarda los cambios y vuelve a intentar.")
    base = f"{p.get('anio', '')} {p.get('area', '')}"
    if tipo == "proyecto":
        return _archivo(fmt.llenar_proyecto(p), DOCX, f"Formato de Presentación de Proyectos {base}.docx")
    if tipo == "pems":
        return _archivo(fmt.llenar_pems(p), XLSX, f"PEMS {base}.xlsx")
    if tipo == "ficha":
        acts = p.get("actividades") or []
        if not 0 <= actividad < len(acts):
            raise HTTPException(status_code=404, detail="Actividad no encontrada.")
        a = acts[actividad]
        cumpl = cumplimiento_mensual(_estado(session, organismo_id, "sgc-indicadores-data", {}), a.get("indicador_id"), p.get("anio"))
        return _archivo(fmt.llenar_ficha(p, a, cumpl), DOCX, f"{actividad + 1}- Ficha técnica {a.get('indicador', '')[:60]} {base}.docx")
    raise HTTPException(status_code=404, detail="Formato no reconocido.")
