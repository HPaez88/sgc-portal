"""
quitar_riesgos_vacios.py — Quita de la matriz de riesgos los registros que quedaron en blanco (sin descripción, sin plan
de mejora ni historial). Salían porque "+ Riesgo" guardaba el registro al tocarlo; @human pidió borrarlos (2026-11-17).
Uso: docker exec sgc-app python -m backend.scripts.quitar_riesgos_vacios           (solo muestra)
     docker exec sgc-app python -m backend.scripts.quitar_riesgos_vacios --aplicar (borra y deja respaldo y bitácora)
"""
import json
import sys
from datetime import datetime

from sqlmodel import Session, select

from backend.database import engine
from backend.models import BitacoraServidor, EstadoPortal


def vacio(r) -> bool:
    return (isinstance(r, dict) and r.get("anio") and not str(r.get("descripcion") or "").strip()
            and not r.get("pm_id") and not r.get("historial_pm") and not r.get("dictamen"))


if __name__ == "__main__":
    aplicar = "--aplicar" in sys.argv
    with Session(engine) as s:
        for fila in s.exec(select(EstadoPortal).where(EstadoPortal.clave == "sgc-riesgos")).all():
            lista = json.loads(fila.valor or "[]")
            quitar = [r for r in lista if vacio(r)]
            for r in quitar:
                print(f"org {fila.organismo_id} · {r.get('area')} {r.get('anio')} · {r.get('tipo')} · P{r.get('probabilidad')} I{r.get('impacto')} · id {r.get('id')}")
            if not (aplicar and quitar):
                continue
            # Respaldo completo de lo borrado en la bitácora del servidor (no se edita ni se borra).
            ids = {r.get("id") for r in quitar}
            fila.valor = json.dumps([r for r in lista if r.get("id") not in ids], ensure_ascii=False)
            fila.actualizado, fila.actualizado_por = datetime.utcnow(), "script quitar_riesgos_vacios"
            s.add(fila)
            s.add(BitacoraServidor(organismo_id=fila.organismo_id, usuario="script quitar_riesgos_vacios", rol="Sistema",
                                   clave="sgc-riesgos", eliminados=len(quitar),
                                   detalle=json.dumps([{"accion": "eliminado", "registro": r} for r in quitar], ensure_ascii=False)))
        if aplicar:
            s.commit()
        print("Borrados." if aplicar else "Solo muestra; agrega --aplicar para borrar.")
