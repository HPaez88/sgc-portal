"""
importar_formatos_ac.py — Pasa al portal los formatos OOMRSC-20 llenados por las áreas (Excel) y sus evidencias
(pedido de @human 2026-11-24). El paquete lo arma un lector local: <dir>/formatos.json + una carpeta por folio.

Por folio:
  - Solo se llena una AC que siga con el formato pendiente (las precargadas del Control 6); nunca se pisa una completa.
  - Se conservan folio, apertura, estado y fechas de seguimiento; del Excel se toman equipo, causas, contención,
    herramienta, actividades (con sus replanteos y si ya se completaron) y, si es más completa, la descripción.
  - Cada evidencia pasa por antivirus y por la misma limpieza/compresión que al subirla desde el portal; las que no son
    imagen/PDF/Word se convierten a PDF con LibreOffice. Quedan en el expediente de la AC (archivos con su folio) y se
    ligan a una actividad solo cuando el nombre lo dice ("ACTIVIDAD 2 ...").
  - Todo el registro anterior queda en la bitácora del servidor.

Uso: docker exec sgc-app python -m backend.scripts.importar_formatos_ac /tmp/paquete_ac [--aplicar]
"""
import json
import re
import subprocess
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from sqlmodel import Session, select

CLAVE = "sgc-acciones-correctivas"
CONVERTIR_A_PDF = {".pptx", ".ppt", ".doc", ".xlsx", ".xls", ".odt", ".odp", ".ods"}


def _completado(a: dict) -> bool:
    return "✔" in a.get("resultado", "") or bool(a.get("fecha_resultado"))


def contenido_desde_formato(f: dict, area: str) -> dict:
    """Campos de la AC a partir de lo leído del Excel (lógica pura)."""
    equipo = [{"id": i, "nombre": e["nombre"], "puesto": e.get("puesto", ""), "area": area,
               "rol": "Responsable principal" if i == 1 else "Integrante área involucrada",
               "es_responsable_principal": i == 1, "firma_digital": ""} for i, e in enumerate(f.get("equipo") or [], 1)]
    causas = f.get("causas") or []
    mayor = max((c.get("total") or 0 for c in causas), default=0)
    causas_j = [{"id": i, "numero": i, "causa": c["causa"], "puntuacion_sugerida": c.get("total"),
                 "es_causa_principal": bool(mayor) and (c.get("total") or 0) == mayor} for i, c in enumerate(causas, 1)]
    actividades = [{
        "id": i, "actividad": a["actividad"], "responsable": a.get("responsable", ""),
        "indicador_progreso": a.get("indicador", ""), "fecha_termino_sugerida": a.get("fecha", ""),
        "evidencia_esperada": a.get("evidencia", ""), "evidencia_cargada": "", "evidencia_real": "", "evidencia_obj": None,
        "estatus": "COMPLETADA" if _completado(a) else "PENDIENTE", "fecha_resultado": a.get("fecha_resultado", ""),
        "primer_replanteo_fecha": a.get("replanteo1", ""), "primer_replanteo_justificacion": "",
        "segundo_replanteo_fecha": a.get("replanteo2", ""), "segundo_replanteo_justificacion": "",
    } for i, a in enumerate(f.get("actividades") or [], 1)]
    out = {"equipo_json": json.dumps(equipo, ensure_ascii=False), "causas_json": json.dumps(causas_j, ensure_ascii=False),
           "actividades_json": json.dumps(actividades, ensure_ascii=False)}
    cont = (f.get("contencion") or [{}])[0]
    if cont.get("actividad"):
        out.update(accion_contenedora=cont["actividad"], actividad_inmediata=cont["actividad"],
                   responsable_actividad_inmediata=cont.get("responsable", ""), fecha_actividad_inmediata=cont.get("fecha", ""))
    if f.get("herramienta"):
        out["herramienta_analisis"] = f["herramienta"][:1].upper() + f["herramienta"][1:]
    if f.get("proposito"):
        out["proposito"] = f["proposito"]
    aud = f.get("auditor") or {}
    if aud.get("evidencia_objetiva"):
        out["evidencia_objetiva_revisada"] = aud["evidencia_objetiva"]
    if aud.get("conclusion"):
        out["conclusion_eficacia"] = aud["conclusion"]
    falta = [n for n, v in (("equipo", equipo), ("causas", causas_j), ("actividades", actividades)) if not v]
    if not cont.get("actividad"):
        falta.append("acción de contención")
    out["pendiente_formato"] = bool(falta)
    out["faltantes_formato"] = falta
    return out


def actividad_de_archivo(nombre: str):
    """Número de actividad si el nombre del archivo lo indica ("ACTIVIDAD 2.docx", "actividad 1 acción ...")."""
    m = re.search(r"actividad\s*#?\s*(\d+)", nombre, re.I)
    return int(m.group(1)) if m else None


def _prueba():
    f = {"equipo": [{"nombre": "A", "puesto": "P"}, {"nombre": "B"}], "causas": [{"causa": "x", "total": 4}, {"causa": "y", "total": 9}],
         "contencion": [{"actividad": "C", "responsable": "A", "fecha": "2026-01-02"}],
         "actividades": [{"actividad": "act", "fecha": "2026-02-01", "resultado": "✔️"}, {"actividad": "b"}]}
    o = contenido_desde_formato(f, "Plantas")
    eq, ca, ac = json.loads(o["equipo_json"]), json.loads(o["causas_json"]), json.loads(o["actividades_json"])
    assert eq[0]["es_responsable_principal"] and not eq[1]["es_responsable_principal"] and eq[0]["area"] == "Plantas"
    assert [c["es_causa_principal"] for c in ca] == [False, True]
    assert [a["estatus"] for a in ac] == ["COMPLETADA", "PENDIENTE"] and o["accion_contenedora"] == "C"
    assert o["pendiente_formato"] is False
    assert contenido_desde_formato({"equipo": [], "causas": [], "actividades": []}, "X")["faltantes_formato"] == ["equipo", "causas", "actividades", "acción de contención"]
    assert actividad_de_archivo("03_ACTIVIDAD 2.docx") == 2 and actividad_de_archivo("CIERRE.pdf") is None


def _a_pdf(ruta: Path) -> Path:
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, str(ruta)], timeout=600,
                           capture_output=True, text=True)
        pdf = next(Path(tmp).glob("*.pdf"), None)
        if not pdf:
            raise RuntimeError(f"LibreOffice no pudo convertirlo: {(r.stderr or r.stdout).strip()[:300]}")
        destino = ruta.with_suffix(".pdf")
        destino.write_bytes(pdf.read_bytes())
        return destino


def _subir(s, ruta: Path, nombre_original: str, folio: str, descripcion: str, svc, Archivo, aplicar: bool):
    contenido = ruta.read_bytes()
    svc.escanear_antivirus(contenido)
    try:
        sane = svc.validar_y_sanear(ruta.name, contenido)
    except Exception:
        if ruta.suffix.lower() != ".docx":
            raise
        # Word con vínculos externos (imágenes enlazadas): se guarda como PDF, que ya no trae el vínculo
        ruta = _a_pdf(ruta)
        contenido = ruta.read_bytes()
        sane = svc.validar_y_sanear(ruta.name, contenido)
    if not aplicar:
        return None, len(contenido), len(sane.contenido)
    existente = s.exec(select(Archivo).where(Archivo.organismo_id == 1, Archivo.sha256 == sane.sha256)).first()
    clave = existente.clave_b2 if existente else svc.generar_clave_b2(1, "ac", sane.extension)
    if not existente:
        svc.subir_b2(clave, sane.contenido, sane.mime)
    base = nombre_original.rsplit(".", 1)[0][:120]
    reg = Archivo(organismo_id=1, entidad="ac", referencia=folio[:80], descripcion=descripcion[:300], nombre_original=nombre_original[:200],
                  nombre=f"{base}.{sane.extension}", mime=sane.mime, tipo=sane.tipo, bytes_original=len(contenido),
                  bytes=len(sane.contenido), sha256=sane.sha256, clave_b2=clave, estado_escaneo="limpio", subido_por="Importación de formatos")
    s.add(reg)
    s.flush()
    return reg, len(contenido), len(sane.contenido)


if __name__ == "__main__":
    _prueba()
    from backend.database import engine
    from backend.models import Archivo, BitacoraServidor, EstadoPortal
    from backend.services import archivos_service as svc

    paquete = Path(next(a for a in sys.argv[1:] if not a.startswith("--")))
    aplicar = "--aplicar" in sys.argv
    formatos = json.loads((paquete / "formatos.json").read_text(encoding="utf-8"))
    with Session(engine) as s:
        fila = s.exec(select(EstadoPortal).where(EstadoPortal.clave == CLAVE, EstadoPortal.organismo_id == 1)).first()
        lista = json.loads(fila.valor)
        bitacora = []
        for folio, f in formatos.items():
            ac = next((r for r in lista if r.get("folio_codigo") == folio), None)
            if not ac:
                print(f"{folio}: no existe en el portal; se omite")
                continue
            if ac.get("pendiente_formato") not in (True, "true"):
                print(f"{folio}: ya tiene formato completo; se omite")
                continue
            antes = dict(ac)
            nuevo = {**ac, **contenido_desde_formato(f, ac.get("area") or "")}
            desc = f.get("descripcion") or ""
            if len(desc) > len(ac.get("descripcion_no_conformidad_original") or ""):
                nuevo["descripcion_no_conformidad_original"] = nuevo["descripcion_no_conformidad_final"] = desc
            nuevo["formato_importado"] = {"archivo": f.get("archivo"), "carpeta": f.get("carpeta"), "fecha": datetime.now(UTC).replace(tzinfo=None).isoformat()}
            acts = json.loads(nuevo["actividades_json"])
            subidas, kb0, kb1 = 0, 0, 0
            for ev in f.get("evidencias", []):
                ruta = paquete / f["dir"] / ev["archivo"]
                try:
                    if ruta.suffix.lower() in CONVERTIR_A_PDF:
                        ruta = _a_pdf(ruta)
                    reg, b0, b1 = _subir(s, ruta, ev["original"].split("\\")[-1].split("/")[-1], folio, f"Expediente del formato: {ev['original']}",
                                         svc, Archivo, aplicar)
                    subidas, kb0, kb1 = subidas + 1, kb0 + ev.get("bytes_original", b0), kb1 + b1
                    n = actividad_de_archivo(ev["original"])
                    if reg and n and 1 <= n <= len(acts) and not acts[n - 1].get("evidencia_real"):
                        url = f"/api/v1/archivos/{reg.id}/url"
                        acts[n - 1].update(evidencia_real=url, evidencia_cargada=reg.nombre_original, evidencia_obj={
                            "url": url, "archivo_id": reg.id, "sha256": reg.sha256, "preview": "", "nombre": reg.nombre_original,
                            "tipo": "image" if reg.tipo == "imagen" else reg.tipo, "tamano_kb": round(reg.bytes / 1024),
                            "tamano_original_kb": round(reg.bytes_original / 1024), "fecha_subida": datetime.now(UTC).replace(tzinfo=None).isoformat(),
                            "subido_por": "Importación de formatos"})
                except Exception as e:  # una evidencia que falla no detiene el folio; se informa
                    print(f"   ! {ev['original']}: {getattr(e, 'detail', None) or repr(e)}")
            nuevo["actividades_json"] = json.dumps(acts, ensure_ascii=False)
            ligadas = sum(1 for a in acts if a.get("evidencia_real"))
            print(f"{folio}: equipo {len(json.loads(nuevo['equipo_json']))} · causas {len(json.loads(nuevo['causas_json']))} · "
                  f"actividades {len(acts)} ({sum(1 for a in acts if a['estatus'] == 'COMPLETADA')} completadas) · evidencias {subidas} "
                  f"({kb0 / 1e6:.1f} MB → {kb1 / 1e6:.1f} MB, {ligadas} ligadas a actividad) · falta: {', '.join(nuevo['faltantes_formato']) or 'nada'}")
            lista = [nuevo if r is ac else r for r in lista]
            bitacora.append({"accion": "modificado", "registro": folio, "campos": sorted(k for k in nuevo if nuevo.get(k) != antes.get(k)), "antes": antes})
        if not aplicar:
            print("Solo muestra; agrega --aplicar para hacerlo.")
            sys.exit(0)
        fila.valor = json.dumps(lista, ensure_ascii=False)
        fila.actualizado, fila.actualizado_por = datetime.now(UTC).replace(tzinfo=None), "script importar_formatos_ac"
        s.add(fila)
        s.add(BitacoraServidor(organismo_id=1, usuario="script importar_formatos_ac", rol="Sistema", clave=CLAVE, modificados=len(bitacora),
                               detalle=json.dumps(bitacora, ensure_ascii=False)))
        s.commit()
        print("Hecho.")
