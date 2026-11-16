"""
cargar_informes_auditoria.py — Carga el histórico de informes de auditoría (OOMRSC-16) anteriores al portal.
Lee <carpeta>/informes.json (lista de informes ya transcritos; cada uno con "pdf": ruta relativa a la carpeta),
sube cada PDF al almacén de archivos (antivirus + saneado, igual que una evidencia) y guarda la lista completa
en la clave sgc-auditorias-historico. Se puede repetir: no vuelve a subir un PDF ya cargado.
Uso:  docker exec sgc-app python -m backend.scripts.cargar_informes_auditoria /ruta/carpeta [--simular]
"""
import json
import sys
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select

from backend.database import engine
from backend.models import Archivo, EstadoPortal
from backend.services import archivos_service as svc
from backend.services.flujo_reglas import CLAVE_AUD_HISTORICO

ENTIDAD = "auditoria_informe"
OBLIGATORIOS = ("anio", "numero", "proceso")


def referencia_de(informe: dict) -> str:
    return f"{informe['anio']}-{int(informe['numero']):02d}"


def validar(informes: list) -> list[str]:
    """Problemas que impiden cargar (lista vacía = todo bien)."""
    errores, vistos = [], set()
    for n, i in enumerate(informes):
        faltan = [c for c in OBLIGATORIOS if not i.get(c)]
        if faltan:
            errores.append(f"Informe #{n + 1}: falta {', '.join(faltan)}")
            continue
        ref = referencia_de(i)
        if ref in vistos:
            errores.append(f"Informe {ref} repetido")
        vistos.add(ref)
        if not isinstance(i.get("nc", []), list) or not isinstance(i.get("om", []), list):
            errores.append(f"Informe {ref}: nc y om deben ser listas")
    return errores


def areas_fuera_de_catalogo(informes: list, catalogo: list) -> list[str]:
    """Áreas de los informes que no están en el catálogo vivo del portal (solo avisa; no impide cargar)."""
    nombres = {a.get("nombre") for a in catalogo}
    usadas = {a for i in informes for c in ("nc", "om", "correcciones") for h in i.get(c) or [] for a in (h.get("areas") or [h.get("area")])} | {a for i in informes for a in i.get("areas_conformes") or []}
    return sorted(a for a in usadas if a and a not in nombres)


def _subir_pdf(s: Session, ruta: Path, informe: dict, organismo_id: int) -> int:
    ref = referencia_de(informe)
    ya = s.exec(select(Archivo).where(Archivo.organismo_id == organismo_id, Archivo.entidad == ENTIDAD, Archivo.referencia == ref)).first()
    if ya:
        return ya.id
    contenido = ruta.read_bytes()
    svc.escanear_antivirus(contenido)
    saneado = svc.validar_y_sanear(ruta.name, contenido)
    clave = svc.generar_clave_b2(organismo_id, ENTIDAD, saneado.extension)
    svc.subir_b2(clave, saneado.contenido, saneado.mime)
    nombre = f"Informe auditoria {int(informe['numero']):02d}-{informe['anio']}.{saneado.extension}"
    reg = Archivo(organismo_id=organismo_id, entidad=ENTIDAD, referencia=ref, descripcion=f"Informe de auditoría {ref} · {informe['proceso']}"[:300],
                  nombre_original=(informe.get("archivo_nombre") or ruta.name)[:200], nombre=nombre, mime=saneado.mime, tipo=saneado.tipo,
                  bytes_original=len(contenido), bytes=len(saneado.contenido), sha256=saneado.sha256, clave_b2=clave, estado_escaneo="limpio", subido_por="Carga histórica SGC")
    s.add(reg)
    s.commit()
    s.refresh(reg)
    return reg.id


def ejecutar(carpeta: Path, simular: bool = False, organismo_id: int = 1) -> dict:
    informes = json.loads((carpeta / "informes.json").read_text(encoding="utf-8"))
    errores = validar(informes)
    sin_pdf = [referencia_de(i) for i in informes if not errores and not (i.get("pdf") and (carpeta / i["pdf"]).is_file())]
    with Session(engine) as s:
        cat = s.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == "sgc-config-areas-detalle")).first()
    fuera = areas_fuera_de_catalogo(informes, json.loads(cat.valor)) if cat else []  # sin catálogo guardado no hay contra qué comparar
    if errores or simular:
        return {"simulacion": simular, "errores": errores, "informes": len(informes), "sin_pdf": sin_pdf, "subidos": 0, "fuera_catalogo": fuera}
    subidos = 0
    with Session(engine) as s:
        for i in informes:
            if referencia_de(i) not in sin_pdf:
                i["archivo_id"] = _subir_pdf(s, carpeta / i["pdf"], i, organismo_id)
                subidos += 1
            i.pop("pdf", None)
        informes.sort(key=lambda i: (i["anio"], int(i["numero"])))
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.organismo_id == organismo_id, EstadoPortal.clave == CLAVE_AUD_HISTORICO)).first() \
            or EstadoPortal(organismo_id=organismo_id, clave=CLAVE_AUD_HISTORICO)
        fila.valor, fila.actualizado, fila.actualizado_por = json.dumps(informes, ensure_ascii=False), datetime.utcnow(), "Carga histórica SGC"
        s.add(fila)
        s.commit()
    return {"simulacion": False, "errores": [], "informes": len(informes), "sin_pdf": sin_pdf, "subidos": subidos, "fuera_catalogo": fuera}


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit("Falta la carpeta con informes.json y los PDF.")
    r = ejecutar(Path(args[0]), simular="--simular" in sys.argv)
    print(("SIMULACIÓN · " if r["simulacion"] else "") + f"{r['informes']} informe(s), {r['subidos']} PDF en el almacén, {len(r['sin_pdf'])} sin PDF {r['sin_pdf'] or ''}")
    if r["fuera_catalogo"]:
        print(" Áreas fuera del catálogo:", "; ".join(r["fuera_catalogo"]))
    for e in r["errores"]:
        print(" ERROR:", e)
    sys.exit(1 if r["errores"] else 0)
