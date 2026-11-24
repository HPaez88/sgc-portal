"""
cerrar_formato_ac.py — Da por completo el formato de una AC que ya cerró el auditor (pedido de @human 2026-11-24 para la
AC#17/2025): quita "formato pendiente" y marca como completadas las actividades que quedaron pendientes en el Excel.
Solo actúa si la AC está CERRADO_EFECTIVO. El registro anterior queda en la bitácora del servidor.

Uso: docker exec sgc-app python -m backend.scripts.cerrar_formato_ac AC#17/2025 [--aplicar]
"""
import json
import sys
from datetime import UTC, datetime

from sqlmodel import Session, select

CLAVE = "sgc-acciones-correctivas"
NOTA = "Completada al cierre efectivo de la acción"


def cerrar(ac: dict) -> dict:
    if ac.get("estado") != "CERRADO_EFECTIVO":
        raise ValueError(f"{ac.get('folio_codigo')} está en {ac.get('estado')}, no en CERRADO_EFECTIVO")
    acts = [a if a.get("estatus") == "COMPLETADA" else {**a, "estatus": "COMPLETADA", "nota_cierre": NOTA}
            for a in json.loads(ac.get("actividades_json") or "[]")]
    return {**ac, "actividades_json": json.dumps(acts, ensure_ascii=False), "pendiente_formato": False, "faltantes_formato": []}


def _prueba():
    ac = {"folio_codigo": "AC#1/2025", "estado": "CERRADO_EFECTIVO", "pendiente_formato": True,
          "actividades_json": json.dumps([{"estatus": "COMPLETADA"}, {"estatus": "PENDIENTE"}])}
    r = cerrar(ac)
    assert r["pendiente_formato"] is False and [a["estatus"] for a in json.loads(r["actividades_json"])] == ["COMPLETADA"] * 2
    try:
        cerrar({**ac, "estado": "EN_SEGUIMIENTO"})
        raise AssertionError("debió rechazar")
    except ValueError:
        pass


if __name__ == "__main__":
    _prueba()
    from backend.database import engine
    from backend.models import BitacoraServidor, EstadoPortal

    folio = next(a for a in sys.argv[1:] if not a.startswith("--"))
    with Session(engine) as s:
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.clave == CLAVE, EstadoPortal.organismo_id == 1)).first()
        lista = json.loads(fila.valor)
        ac = next(r for r in lista if r.get("folio_codigo") == folio)
        nuevo = cerrar(ac)
        print(folio, "→ formato completo; actividades:", [a["estatus"] for a in json.loads(nuevo["actividades_json"])])
        if "--aplicar" not in sys.argv:
            print("Solo muestra; agrega --aplicar para hacerlo.")
            sys.exit(0)
        fila.valor = json.dumps([nuevo if r is ac else r for r in lista], ensure_ascii=False)
        fila.actualizado, fila.actualizado_por = datetime.now(UTC).replace(tzinfo=None), "script cerrar_formato_ac"
        s.add(fila)
        s.add(BitacoraServidor(organismo_id=1, usuario="script cerrar_formato_ac", rol="Sistema", clave=CLAVE, modificados=1,
                               detalle=json.dumps([{"accion": "modificado", "registro": folio,
                                                    "campos": ["actividades_json", "pendiente_formato", "faltantes_formato"], "antes": ac}],
                                                  ensure_ascii=False)))
        s.commit()
        print("Hecho.")
