"""
ajustar_folio.py — Alinea el último folio emitido de un año con el Control del SGC.
Uso:  docker exec sgc-app python -m backend.scripts.ajustar_folio AC 2026 27
Nunca baja de lo que ya existe en los registros (no se repiten folios) y deja constancia en la bitácora del servidor.
"""
import json
import sys

from sqlmodel import Session, select

from backend.database import engine
from backend.models import BitacoraServidor, EstadoPortal
from backend.routers.folios import CLAVE_REGISTROS, PREFIJO, numero_de_folio
from backend.services.flujo_reglas import CLAVE_FOLIOS


def ajustar(tipo: str, anio: int, ultimo: int, organismo_id: int = 1) -> dict:
    tipo = tipo.upper()
    if tipo not in PREFIJO:
        raise SystemExit("Tipo inválido: AC o PM")
    with Session(engine) as s:
        q = lambda clave: s.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == clave)).first()
        registros = q(CLAVE_REGISTROS[tipo])
        maximo = 0
        if registros:
            lista = json.loads(registros.valor) or []
            maximo = max([numero_de_folio(r.get("folio_codigo") or r.get("folio"), PREFIJO[tipo], anio) for r in lista if isinstance(r, dict)] or [0])
        if ultimo < maximo:
            raise SystemExit(f"No se puede poner {ultimo}: ya existe el folio {PREFIJO[tipo]}#{maximo}/{anio} en los registros.")
        fila = q(CLAVE_FOLIOS) or EstadoPortal(organismo_id=organismo_id, clave=CLAVE_FOLIOS, valor="{}")
        contador = json.loads(fila.valor or "{}")
        antes = (contador.get(tipo) or {}).get(str(anio))
        contador = {**contador, tipo: {**(contador.get(tipo) or {}), str(anio): ultimo}}
        fila.valor = json.dumps(contador)
        s.add(fila)
        s.add(BitacoraServidor(organismo_id=organismo_id, usuario_id=None, usuario="Mantenimiento SGC", rol="Super Admin", clave=CLAVE_FOLIOS,
                               agregados=0, modificados=1, eliminados=0,
                               detalle=json.dumps([{"campo": f"{tipo}.{anio}", "antes": antes, "despues": ultimo, "motivo": "Alineado con el Control del SGC"}])))
        s.commit()
        return {"tipo": tipo, "anio": anio, "antes": antes, "ahora": ultimo, "siguiente": f"{PREFIJO[tipo]}#{ultimo + 1}/{anio}"}


if __name__ == "__main__":
    print(ajustar(sys.argv[1], int(sys.argv[2]), int(sys.argv[3])))
