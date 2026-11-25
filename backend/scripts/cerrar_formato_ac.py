"""
cerrar_formato_ac.py — Da por completo el formato de una AC que ya cerró el auditor (pedido de @human 2026-11-24 para la
AC#17/2025): quita "formato pendiente" y marca como completadas las actividades que quedaron pendientes en el Excel.
Solo actúa si la AC está CERRADO_EFECTIVO. El registro anterior queda en la bitácora del servidor.

Con --dictamen <archivo.json> ({"auditor","fecha","evidencia","conclusion"}) registra primero el dictamen EFECTIVO que el
auditor emitió fuera del portal (AC#18/2026, Mariana Pérez, correo del 2026-11-19); solo si la AC está en REVISION_AUDITOR.

Uso: docker exec sgc-app python -m backend.scripts.cerrar_formato_ac AC#17/2025 [--dictamen d.json] [--aplicar]
"""
import json
import sys
from datetime import UTC, datetime

from sqlmodel import Session, select

CLAVE = "sgc-acciones-correctivas"
NOTA = "Completada al cierre efectivo de la acción"


def dictaminar(ac: dict, d: dict) -> dict:
    if ac.get("estado") != "REVISION_AUDITOR":
        raise ValueError(f"{ac.get('folio_codigo')} está en {ac.get('estado')}, no en REVISION_AUDITOR")
    if len((d.get("conclusion") or "").strip()) < 15:
        raise ValueError("La conclusión del auditor debe tener al menos 15 caracteres")
    historial = list(ac.get("historial_dictamenes") or []) + [
        {"fecha": d["fecha"], "auditor": d["auditor"], "resultado": "EFECTIVA", "conclusion": d["conclusion"].strip()}]
    return {**ac, "estado": "CERRADO_EFECTIVO", "fecha_cierre": d["fecha"], "resultado_cierre": "EFECTIVA",
            "evidencia_objetiva_revisada": d.get("evidencia", "").strip(), "conclusion_eficacia": d["conclusion"].strip(),
            "historial_dictamenes": historial}


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
    d = {"auditor": "X", "fecha": "2026-11-19T19:28:00Z", "evidencia": "ev", "conclusion": "Es eficaz porque sí funciona"}
    r = cerrar(dictaminar({**ac, "estado": "REVISION_AUDITOR"}, d))
    assert r["estado"] == "CERRADO_EFECTIVO" and r["resultado_cierre"] == "EFECTIVA" and r["historial_dictamenes"][0]["auditor"] == "X"
    try:
        cerrar({**ac, "estado": "EN_SEGUIMIENTO"})
        raise AssertionError("debió rechazar")
    except ValueError:
        pass


if __name__ == "__main__":
    _prueba()
    from backend.database import engine
    from backend.models import BitacoraServidor, EstadoPortal

    folio = sys.argv[1]
    with Session(engine) as s:
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.clave == CLAVE, EstadoPortal.organismo_id == 1)).first()
        lista = json.loads(fila.valor)
        ac = next(r for r in lista if r.get("folio_codigo") == folio)
        if "--dictamen" in sys.argv:
            d = json.loads(open(sys.argv[sys.argv.index("--dictamen") + 1], encoding="utf-8").read())
            nuevo = cerrar(dictaminar(ac, d))
            print(f"Dictamen EFECTIVO de {d['auditor']} ({d['fecha']})")
        else:
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
                                                    "campos": sorted(k for k in nuevo if nuevo.get(k) != ac.get(k)), "antes": ac}],
                                                  ensure_ascii=False)))
        s.commit()
        print("Hecho.")
