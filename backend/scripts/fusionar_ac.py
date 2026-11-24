"""
fusionar_ac.py — Pasa el contenido de una AC capturada con folio equivocado a la AC que realmente le corresponde y elimina
la duplicada (pedido de @human 2026-11-24: la AC#28/2026 es en realidad la AC#22/2026).
Del destino se conserva su identidad (id, folio, apertura, aprobación, correos y creador); del origen se toma todo lo
capturado (descripción, análisis, causas, equipo, contención, actividades, fechas de seguimiento). Las evidencias del
origen pasan al destino. Ambos registros completos quedan en la bitácora del servidor.

Uso: docker exec sgc-app python -m backend.scripts.fusionar_ac AC#28/2026 AC#22/2026 [--contador 27] [--aplicar]
"""
import json
import sys
from datetime import datetime

from sqlmodel import Session, select

from backend.database import engine
from backend.models import Archivo, BitacoraServidor, EstadoPortal

CLAVE = "sgc-acciones-correctivas"
# Identidad del registro destino: no se toca.
IDENTIDAD = ("id", "folio", "folio_codigo", "folio_numero", "anio_folio", "fecha_apertura", "fecha_aprobacion_sgc",
             "aprobado_por_sgc", "fecha_envio_sgc", "fecha_creacion_borrador", "correos_responsables",
             "creado_por", "creador_email", "creador_area", "usuario_solicitante")


def _folio(r: dict) -> str:
    return str(r.get("folio_codigo") or r.get("folio") or "")


def fusionar(origen: dict, destino: dict) -> dict:
    """Registro destino con el contenido del origen y su propia identidad."""
    nuevo = {**destino, **{k: v for k, v in origen.items() if k not in IDENTIDAD}}
    for k in IDENTIDAD:
        if k in destino:
            nuevo[k] = destino[k]
    nuevo["pendiente_formato"] = False
    nuevo["fusionado_desde"] = _folio(origen)
    return nuevo


def _prueba():
    o = {"id": 2, "folio_codigo": "AC#28/2026", "folio_numero": 28, "actividades_json": "[1]", "proceso": "B", "fecha_apertura": "nov"}
    d = {"id": 1, "folio_codigo": "AC#22/2026", "folio_numero": 22, "proceso": "A", "fecha_apertura": "sep", "pendiente_formato": True,
         "correos_responsables": ["x@y.mx"]}
    r = fusionar(o, d)
    assert (r["id"], r["folio_codigo"], r["folio_numero"], r["fecha_apertura"]) == (1, "AC#22/2026", 22, "sep")
    assert (r["actividades_json"], r["proceso"], r["correos_responsables"]) == ("[1]", "B", ["x@y.mx"])
    assert r["pendiente_formato"] is False and r["fusionado_desde"] == "AC#28/2026"


if __name__ == "__main__":
    _prueba()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    aplicar = "--aplicar" in sys.argv
    contador = int(sys.argv[sys.argv.index("--contador") + 1]) if "--contador" in sys.argv else None
    if contador is not None:
        args = [a for a in args if a != str(contador)]
    f_origen, f_destino = args[:2]
    with Session(engine) as s:
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.clave == CLAVE, EstadoPortal.organismo_id == 1)).first()
        lista = json.loads(fila.valor)
        origen = next(r for r in lista if _folio(r) == f_origen)
        destino = next(r for r in lista if _folio(r) == f_destino)
        nuevo = fusionar(origen, destino)
        cambian = sorted(k for k in set(nuevo) | set(destino) if nuevo.get(k) != destino.get(k))
        archivos = s.exec(select(Archivo).where(Archivo.referencia == f_origen)).all()
        print(f"{f_origen} (id {origen['id']}) → {f_destino} (id {destino['id']})")
        print("Campos que cambian en el destino:", ", ".join(cambian))
        print("Evidencias que pasan:", [a.nombre_original for a in archivos])
        if contador is not None:
            print(f"Contador de folios AC {origen.get('anio_folio')}: queda en {contador}")
        if not aplicar:
            print("Solo muestra; agrega --aplicar para hacerlo.")
            sys.exit(0)
        fila.valor = json.dumps([nuevo if r is destino else r for r in lista if r is not origen], ensure_ascii=False)
        fila.actualizado, fila.actualizado_por = datetime.utcnow(), "script fusionar_ac"
        s.add(fila)
        for a in archivos:
            a.referencia = f_destino
            s.add(a)
        if contador is not None:
            ff = s.exec(select(EstadoPortal).where(EstadoPortal.clave == "sgc-config-folios", EstadoPortal.organismo_id == 1)).first()
            folios = json.loads(ff.valor)
            folios.setdefault("AC", {})[str(origen.get("anio_folio"))] = contador
            ff.valor = json.dumps(folios, ensure_ascii=False)
            s.add(ff)
        s.add(BitacoraServidor(organismo_id=1, usuario="script fusionar_ac", rol="Sistema", clave=CLAVE, modificados=1, eliminados=1,
                               detalle=json.dumps([{"accion": "modificado", "registro": f_destino, "campos": cambian, "antes": destino},
                                                   {"accion": "eliminado", "registro": f_origen, "antes": origen}], ensure_ascii=False)))
        s.commit()
        print("Hecho.")
