"""
folios.py — Asignación atómica de folios oficiales AC#n/aaaa y OM#n/aaaa.
Sustituye al contador calculado en el navegador (dos aprobaciones a la vez daban el mismo número).
El último número por tipo y año vive en la clave `sgc-config-folios`; se bloquea la fila al asignar.
"""
import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from backend import auth
from backend.database import get_session
from backend.models import EstadoPortal, Usuario
from backend.services.flujo_reglas import CLAVE_AC, CLAVE_FOLIOS, CLAVE_PM

router = APIRouter(prefix="/api/v1/folios", tags=["Folios"])
PREFIJO = {"AC": "AC", "PM": "OM"}
CLAVE_REGISTROS = {"AC": CLAVE_AC, "PM": CLAVE_PM}
ZONA = ZoneInfo("America/Hermosillo")


def numero_de_folio(folio, prefijo: str, anio: int) -> int:
    m = re.match(r"^\s*([A-Z]+)\s*#\s*(\d+)\s*[\\/]\s*(\d{2,4})\s*$", str(folio or ""), re.I)
    if not m or m.group(1).upper() != prefijo:
        return 0
    a = int(m.group(3))
    return int(m.group(2)) if (a + 2000 if a < 100 else a) == anio else 0


def _fila(session: Session, organismo_id: int, clave: str, bloquear=False):
    q = select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)
    return session.exec(q.with_for_update() if bloquear else q).first()


@router.post("/{tipo}")
def asignar(tipo: str, cantidad: int = Query(1, ge=1, le=50), session: Session = Depends(get_session),
            usuario: Usuario = Depends(auth.requiere_rol(*auth.ROLES_ADMIN))):
    """Reserva `cantidad` folios consecutivos del año en curso. Solo administradores del SGC (son quienes aprueban)."""
    tipo = tipo.upper()
    if tipo not in PREFIJO:
        raise HTTPException(status_code=422, detail="Tipo de folio inválido (AC o PM).")
    anio = datetime.now(ZONA).year
    prefijo = PREFIJO[tipo]
    fila = _fila(session, usuario.organismo_id, CLAVE_FOLIOS, bloquear=True)
    contador = {}
    if fila:
        try:
            contador = json.loads(fila.valor) or {}
        except ValueError:
            contador = {}
    # No repetir aunque el contador esté atrasado: también se cuentan los folios ya guardados.
    registros = _fila(session, usuario.organismo_id, CLAVE_REGISTROS[tipo])
    en_registros = 0
    if registros:
        try:
            lista = json.loads(registros.valor) or []
            en_registros = max([numero_de_folio(r.get("folio_codigo") or r.get("folio"), prefijo, anio)
                                for r in lista if isinstance(r, dict)] or [0])
        except ValueError:
            pass
    ultimo = max(en_registros, int((contador.get(tipo) or {}).get(str(anio)) or 0))
    numeros = list(range(ultimo + 1, ultimo + 1 + cantidad))
    contador = {**contador, tipo: {**(contador.get(tipo) or {}), str(anio): numeros[-1]}}
    if not fila:
        fila = EstadoPortal(organismo_id=usuario.organismo_id, clave=CLAVE_FOLIOS)
    fila.valor, fila.actualizado, fila.actualizado_por = json.dumps(contador), datetime.utcnow(), usuario.nombre
    session.add(fila)
    session.commit()
    return {"folios": [{"numero": n, "anio": str(anio), "codigo": f"{prefijo}#{n}/{anio}"} for n in numeros], "contador": contador}
