"""
recuperar_bitacora.py — Devuelve a la bitácora de movimientos los registros que se perdieron cuando un navegador con
copia vieja la guardaba recortada (detectado 2026-11-20). Solo AGREGA (por id); no modifica ni borra nada.
Los movimientos se extraen de los respaldos diarios (pg_dump) a un archivo JSON (lista de movimientos).
Uso: docker exec sgc-app python -m backend.scripts.recuperar_bitacora /tmp/bitacora_recuperable.json            (muestra)
     docker exec sgc-app python -m backend.scripts.recuperar_bitacora /tmp/bitacora_recuperable.json --aplicar  (agrega)
"""
import json
import sys
from datetime import datetime

from sqlmodel import Session, select

from backend.database import engine
from backend.models import BitacoraServidor, EstadoPortal
from backend.services.fusion_estado import solo_agregar

CLAVE = "sgc-bitacora-movimientos"


if __name__ == "__main__":
    archivo = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
    aplicar = "--aplicar" in sys.argv
    if not archivo:
        sys.exit("Indica el archivo JSON con los movimientos a recuperar.")
    recuperables = json.load(open(archivo, encoding="utf-8"))
    with Session(engine) as s:
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.clave == CLAVE, EstadoPortal.organismo_id == 1)).first()
        actual = json.loads(fila.valor or "[]") if fila else []
        resultado = solo_agregar(actual, recuperables)
        agregados = len(resultado) - len(actual)
        print(f"Actual: {len(actual)} · en el archivo: {len(recuperables)} · se agregan: {agregados} · quedarían: {len(resultado)}")
        if aplicar and agregados and fila:
            fila.valor = json.dumps(resultado, ensure_ascii=False)
            fila.actualizado, fila.actualizado_por = datetime.utcnow(), "script recuperar_bitacora"
            s.add(fila)
            s.add(BitacoraServidor(organismo_id=1, usuario="script recuperar_bitacora", rol="Sistema", clave=CLAVE, agregados=agregados,
                                   detalle=json.dumps([{"accion": "agregado", "registro": f"{x.get('timestamp', '')[:16]} {x.get('descripcion', '')}"[:200]}
                                                       for x in resultado if x not in actual][:40], ensure_ascii=False)))
            s.commit()
            print("Recuperados.")
        elif not aplicar:
            print("Solo muestra; agrega --aplicar para recuperarlos.")
