"""
seed_documentos.py — Primera carga del Manual de la Calidad y anexos desde backend/knowledge/manual/manual.json
como revisión PUBLICADA (la vigente del archivo oficial). Solo corre si el organismo no tiene documentos.
"""
import json
import logging
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select

from backend.models import Documento, DocumentoRevision

log = logging.getLogger("sgc.seed")
MANUAL_JSON = Path(__file__).resolve().parent / "knowledge" / "manual" / "manual.json"
AREA_SGC = "Sistema de Gestión de Calidad"


def _celda(texto: str) -> str:
    return (texto or "").replace("|", "\\|").replace("\n", " ").strip()


def tabla_markdown(filas: list[list[str]], columnas: list[str] | None = None) -> str:
    """Tabla Markdown. Si no vienen columnas, la primera fila es la cabecera; una fila de una celda es un título."""
    lineas = []
    if columnas is None:
        if filas and len(filas[0]) == 1:
            lineas.append(f"**{_celda(filas[0][0])}**\n")
            filas = filas[1:]
        if not filas:
            return "\n".join(lineas)
        columnas, filas = filas[0], filas[1:]
    ancho = max([len(columnas)] + [len(f) for f in filas])
    columnas = list(columnas) + [""] * (ancho - len(columnas))
    lineas.append("| " + " | ".join(_celda(c) or " " for c in columnas) + " |")
    lineas.append("|" + "---|" * ancho)
    for f in filas:
        f = list(f) + [""] * (ancho - len(f))
        lineas.append("| " + " | ".join(_celda(c) or " " for c in f) + " |")
    return "\n".join(lineas)


def bloques_a_markdown(bloques: list[dict]) -> str:
    partes, lista = [], []

    def cerrar_lista():
        if lista:
            partes.append("\n".join(f"- {t}" for t in lista))
            lista.clear()

    for b in bloques:
        if b["tipo"] == "lista":
            lista.append(b["texto"])
            continue
        cerrar_lista()
        if b["tipo"] == "tabla":
            partes.append(tabla_markdown(b["filas"]))
        else:
            partes.append(b["texto"])
    cerrar_lista()
    return "\n\n".join(partes)


def secciones_manual(manual: dict) -> list[dict]:
    return [{"numero": s["numero"], "titulo": s["titulo"], "markdown": bloques_a_markdown(s["bloques"])}
            for s in manual["secciones"]]


def secciones_anexo(anexo: dict) -> list[dict]:
    if anexo.get("tipo") == "tablas":
        out = []
        for i, h in enumerate(anexo["hojas"], start=1):
            meta = "\n".join(f"*{m}*" for m in h.get("meta", []) if m)
            out.append({"numero": str(i), "titulo": h["nombre"],
                        "markdown": (meta + "\n\n" if meta else "") + tabla_markdown(h["filas"], h["columnas"])})
        return out
    if anexo.get("tipo") == "pdf":
        return [{"numero": "1", "titulo": anexo["titulo"],
                 "markdown": f"Documento gráfico. Consultar el archivo original **{anexo['archivo']}** desde el botón *Original*."}]
    return [{"numero": "1", "titulo": anexo["titulo"], "markdown": f"_Contenido pendiente de extracción._ {anexo.get('nota', '')}"}]


def _rev_numero(revision: str) -> int:
    digitos = "".join(ch for ch in (revision or "") if ch.isdigit())
    return int(digitos) if digitos else 1


def sembrar_documentos(engine, organismo_id: int = 1) -> None:
    if not MANUAL_JSON.exists():
        log.warning("No existe %s; no se siembran documentos.", MANUAL_JSON)
        return
    with Session(engine) as session:
        if session.exec(select(Documento).where(Documento.organismo_id == organismo_id)).first():
            return
        from backend.routers.documentos import hash_secciones

        datos = json.loads(MANUAL_JSON.read_text(encoding="utf-8"))
        entradas = []
        if datos.get("manual"):
            m = datos["manual"]
            entradas.append((m, "manual", secciones_manual(m)))
        for a in datos.get("anexos", []):
            entradas.append((a, "anexo", secciones_anexo(a)))
        for meta, tipo, secciones in entradas:
            doc = Documento(organismo_id=organismo_id, clave=meta["clave"], titulo=meta["titulo"].title() if meta["titulo"].isupper() else meta["titulo"],
                            tipo=tipo, ruta_aprobacion="dos_pasos", area_responsable=AREA_SGC, archivo_original=meta.get("archivo"))
            session.add(doc)
            session.flush()
            rev = DocumentoRevision(documento_id=doc.id, numero=_rev_numero(meta.get("revision")), estado="PUBLICADO",
                                    contenido=json.dumps(secciones, ensure_ascii=False), hash=hash_secciones(secciones),
                                    motivo="Carga inicial desde el archivo oficial vigente",
                                    autor_nombre="Archivo oficial", aprobador_nombre="Archivo oficial (carga inicial)",
                                    fecha_envio=datetime.utcnow(), fecha_publicacion=datetime.utcnow())
            session.add(rev)
            session.flush()
            doc.revision_vigente_id = rev.id
            session.add(doc)
        session.commit()
        log.warning("Documentos sembrados: %d (manual + anexos).", len(entradas))
