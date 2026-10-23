"""
importar_control6.py — Carga al portal las Acciones Correctivas y Planes de Mejora ABIERTOS del Control 6.

Reemplaza por completo las claves `sgc-acciones-correctivas` y `sgc-planes-mejora` del organismo
(antes se respalda lo que haya). Cada registro queda EN_SEGUIMIENTO con la forma de los formatos
OOMRSC-20 / OOMRSC-21; causas, equipo detallado y actividades se completan después con los Excel de cada folio.

Uso:
  python scripts/importar_control6.py "<ruta>/Control 6.xlsx"                 # vista previa (no envía nada)
  SGC_EMAIL=... SGC_PASSWORD=... python scripts/importar_control6.py "<ruta>" --aplicar [--url https://...]
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parent.parent
URL_DEFECTO = "https://sgc.srv1787150.hstgr.cloud"
FECHA_IMPORT = date.today().isoformat()
ORIGEN_IMPORT = f"Importación Control 6 ({FECHA_IMPORT})"


# ───────────── utilidades ─────────────
def norm(texto) -> str:
    t = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", t).strip()


def fecha_iso(v) -> str | None:
    if isinstance(v, datetime):
        return v.date().isoformat() if v.year > 1900 else None
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, (int, float)) and 30000 < v < 60000:  # serial de Excel capturado como número
        return (date(1899, 12, 30) + timedelta(days=int(v))).isoformat()
    return None


def limpiar(v) -> str:
    return re.sub(r"[ \t]+", " ", str(v or "")).strip()


def folio_portal(folio: str) -> str:
    return limpiar(folio).replace("\\", "/")


def correos(v) -> list[str]:
    return [c.strip() for c in re.split(r"[,;\s]+", str(v or "")) if "@" in c]


# ───────────── catálogos del portal (para ligar área → dirección / proceso) ─────────────
def catalogos_portal():
    areas_js = (RAIZ / "frontend/src/constants/areas.js").read_text(encoding="utf-8")
    procesos_js = (RAIZ / "frontend/src/constants/procesos.js").read_text(encoding="utf-8")
    direccion = {norm(n): (n, d) for n, d in re.findall(r"nombre:\s*[\"']([^\"']+)[\"'][^}]*?direccion:\s*[\"']([^\"']+)[\"']", areas_js, re.S)}
    proceso_de = {}
    for bloque in re.findall(r"\{[^{}]*?nombre:\s*'[^']+'[^{}]*?areaResponsable[^{}]*?\}", procesos_js, re.S):
        nombre = re.search(r"nombre:\s*'([^']+)'", bloque).group(1)
        resp = re.search(r"areaResponsable:\s*'([^']+)'", bloque).group(1)
        proceso_de.setdefault(norm(resp), nombre)  # el área responsable manda
    for m in re.finditer(r"nombre:\s*'([^']+)'[^{}]*?areasInvolucradas:\s*\[([^\]]*)\]", procesos_js, re.S):
        for a in re.findall(r"'([^']+)'", m.group(2)):
            proceso_de.setdefault(norm(a), m.group(1))
    return direccion, proceso_de


ALIAS_AREA = {"direccion comercial": "Dirección Comercial"}  # dirección capturada como área en el Control 6


def ligar_area(area_excel, direccion, proceso_de):
    clave = norm(area_excel)
    nombre, dir_ = direccion.get(clave, (ALIAS_AREA.get(clave, limpiar(area_excel)), None))
    if clave == "direccion comercial":
        dir_ = "Dir. Comercial"
    proceso = proceso_de.get(norm(nombre)) or ("Comercialización" if clave == "direccion comercial" else "")
    return nombre, dir_ or "", proceso, clave in direccion or clave in ALIAS_AREA


# ───────────── lectura del Control 6 ─────────────
def tabla(ws):
    filas = list(ws.iter_rows(values_only=True))
    cab = [limpiar(c) for c in filas[0]]
    return [{cab[i]: r[i] for i in range(len(cab)) if cab[i]} for r in filas[1:] if r and any(x not in (None, "") for x in r)]


def directorio(ws):
    """Hoja Datos: área → (encargado, correos). El SGC no está en Datos: se toma del catálogo del portal."""
    out = {norm("Sistema de Gestión de Calidad"): ("Lic. Héctor Manuel Páez León", ["hpaez@oomapasc.gob.mx"])}
    for r in tabla(ws):
        area, enc = limpiar(r.get("Área")), limpiar(r.get("Encargado"))
        if area and enc and "@" not in area:
            out[norm(area)] = (enc.title(), correos(r.get("E-mail")))
    return out


def origen_ac(origen: str, obs: str):
    o = limpiar(origen)
    n = norm(o)
    if n.startswith("indicador"):
        return "Indicador", ""
    if "externa" in n:
        return "Auditoría Externa", limpiar(obs)
    m = re.search(r"#\s*(\d+)", o)
    if n.startswith("auditor"):
        return "Auditoría Interna", f"#{m.group(1)}" if m else ""
    return o, ""


def fechas_compromiso(r, *claves_replanteo):
    original = fecha_iso(r.get("FECHA DE CIERRE"))
    replanteos, avisos = [], []
    for i, k in enumerate(claves_replanteo, start=1):
        f = fecha_iso(r.get(k))
        if f:
            if original and f < original:
                avisos.append(f"Replanteo #{i} ({f}) es anterior a la fecha de cierre original: revisar en Control 6")
            else:
                replanteos.append({"numero": i, "fecha": f})
    vigente = replanteos[-1]["fecha"] if replanteos else original
    return original, replanteos, vigente, avisos


def construir_ac(r, sec, direccion, proceso_de, dir_personas):
    area, dir_, proceso, en_catalogo = ligar_area(r.get("DIRECCIÓN O GERENCIA"), direccion, proceso_de)
    origen, num_aud = origen_ac(r.get("ORIGEN"), r.get("OBSERVACIONES"))
    original, replanteos, vigente, avisos = fechas_compromiso(r, "REPLANTEO #1", 'REPLANTEO #2 "Formato de replanteo"', "REPLANTEO #3")
    folio = folio_portal(r.get("FOLIO"))
    numero = re.search(r"#(\d+)", folio)
    anio = re.search(r"/(\d{4})", folio)
    encargado, mails = dir_personas.get(norm(area), ("", []))
    mails = correos(r.get("CÓDIGO RELACIÓN")) or mails
    desc = limpiar(r.get("DESCRIPCIÓN"))
    apertura = fecha_iso(r.get("FECHA DE APERTURA"))
    obs = limpiar(r.get("OBSERVACIONES"))
    return {
        "id": 9_000_000 + int(sec),
        "folio_codigo": folio, "folio": folio,
        "folio_numero": int(numero.group(1)) if numero else None,
        "anio_folio": anio.group(1) if anio else (apertura or "")[:4],
        "estado": "EN_SEGUIMIENTO",
        "area": area, "direccion": dir_, "proceso": proceso,
        "origen": origen, "numero_auditoria": num_aud,
        "descripcion_no_conformidad_original": desc, "descripcion_no_conformidad_ia": "", "descripcion_no_conformidad_final": desc,
        "impacta_otros_procesos": "NO", "otros_procesos_afectados": "", "accion_contenedora": "",
        "actividad_inmediata": "", "responsable_actividad_inmediata": encargado, "fecha_actividad_inmediata": "",
        "herramienta_analisis": "Lluvia de ideas", "requiere_actualizar_matriz_riesgos": "NO", "descripcion_riesgo_oportunidad": "",
        "requiere_cambio_sgc": "NO",
        "fecha_creacion_borrador": apertura, "fecha_envio_sgc": apertura, "fecha_aprobacion_sgc": apertura,
        "fecha_apertura": apertura, "fecha_cierre": None,
        "fecha_cierre_programada": original, "replanteos_control6": replanteos, "fecha_limite": vigente,
        "usuario_solicitante": encargado, "aprobado_por_sgc": "Control 6 (registro histórico)",
        "auditor_cierre": "", "resultado_cierre": "", "evidencia_objetiva_revisada": "", "conclusion_eficacia": "",
        "clave_formato": "OOMRSC-20", "revision_formato": "Rev. 18",
        "creado_por": ORIGEN_IMPORT, "creador_email": mails[0] if mails else "", "creador_area": area,
        "correos_responsables": mails, "observaciones_control6": obs if obs and obs != num_aud else "",
        "pendiente_formato": True,  # causas, equipo y actividades llegan con el Excel de cada folio
        "equipo_json": json.dumps([{"id": 1, "nombre": encargado, "puesto": "Encargado de área", "area": area,
                                    "rol": "Responsable principal", "es_responsable_principal": True, "firma_digital": ""}], ensure_ascii=False),
        "causas_json": "[]", "actividades_json": "[]",
        "_avisos": avisos + faltantes(area, en_catalogo, proceso, encargado, vigente),
    }


def faltantes(area, en_catalogo, proceso, responsable, vigente):
    out = []
    if not en_catalogo:
        out.append(f"Área '{area}' no está en el catálogo del portal")
    if not proceso:
        out.append(f"Área '{area}' no está ligada a ningún proceso del SGC: asignar proceso en el portal")
    if not responsable:
        out.append("Sin responsable en la hoja Datos: asignar en el portal")
    if not vigente:
        out.append("Sin fecha de cierre en Control 6")
    return out


def construir_pm(r, direccion, proceso_de, dir_personas):
    area, dir_, proceso, en_catalogo = ligar_area(r.get("ÁREA"), direccion, proceso_de)
    original, replanteos, vigente, avisos = fechas_compromiso(r, "REPLANTEO #1", 'REPLANTEO #2 "Formato de replanteo"', "REPLANTEO #3")
    folio = folio_portal(r.get("FOLIO"))
    numero = re.search(r"#(\d+)", folio)
    encargado, mails = dir_personas.get(norm(area), ("", []))
    desc = limpiar(r.get("DESCRIPCIÓN"))
    apertura = fecha_iso(r.get("FECHA DE APERTURA"))
    sec = r.get("Secuencia") or r.get("MES") or 0
    return {
        "id": 9_500_000 + int(numero.group(1) if numero else sec) + 1000 * int(str(r.get("AÑO") or 0)[-2:] or 0),
        "folio_codigo": folio, "folio": folio, "folio_numero": int(numero.group(1)) if numero else None,
        "estado": "EN_SEGUIMIENTO",
        "titulo_mejora": desc, "area": area, "gerencia_coordinacion": area, "direccion": dir_, "proceso": proceso,
        "categoria_mejora": "", "periodo_mejora": limpiar(r.get("ORIGEN")), "origen": "Control 6",
        "descripcion_situacion_actual": desc, "situacion_deseada": "", "beneficios": "",
        "creado_por": ORIGEN_IMPORT, "creador_email": mails[0] if mails else "", "creador_area": area,
        "fecha_creacion_borrador": apertura, "created_at": apertura, "fecha_envio_sgc": apertura,
        "fecha_apertura": apertura, "fecha_cierre": None,
        "fecha_cierre_programada": original, "replanteos_control6": replanteos, "fecha_limite": vigente, "fechaCompromiso": vigente,
        "responsable": encargado, "correos_responsables": mails,
        "auditor_cierre": "", "resultado_cierre": "", "comentarios_revision": "",
        "observaciones_control6": limpiar(r.get("OBSERVACIONES")),
        "clave_formato": "OOMRSC-21", "revision_formato": "Rev. 02",
        "pendiente_formato": True,
        "integrantes": json.dumps([{"id": 1, "nombre": encargado, "puesto": "Encargado de área", "rol": "Responsable principal"}], ensure_ascii=False),
        "actividades": "[]",
        "_avisos": avisos + faltantes(area, en_catalogo, proceso, encargado, vigente),
    }


def cargar(ruta):
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    direccion, proceso_de = catalogos_portal()
    personas = directorio(wb["Datos"])
    acs = [construir_ac(r, r.get("sec"), direccion, proceso_de, personas)
           for r in tabla(wb["Acciones"]) if norm(r.get("ESTATUS")) == "abierta"]
    pms = [construir_pm(r, direccion, proceso_de, personas)
           for r in tabla(wb["Mejoras"]) if norm(r.get("ESTATUS")) == "abierta"]
    assert len({a["id"] for a in acs}) == len(acs) and len({p["id"] for p in pms}) == len(pms), "ids duplicados"
    return acs, pms


# ───────────── envío al portal ─────────────
def aplicar(url, acs, pms):
    import urllib.request

    def peticion(metodo, ruta, cuerpo=None, token=None):
        req = urllib.request.Request(url + ruta, method=metodo, data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
                                     headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})})
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"null")

    email, password = os.environ.get("SGC_EMAIL"), os.environ.get("SGC_PASSWORD")
    if not email or not password:
        sys.exit("Faltan SGC_EMAIL y SGC_PASSWORD en el entorno.")
    token = peticion("POST", "/api/v1/auth/login", {"email": email, "password": password})["token"]
    previo = peticion("GET", "/api/v1/estado", token=token)
    respaldo = RAIZ / "backups" / f"estado-antes-control6-{datetime.now():%Y%m%d-%H%M%S}.json"
    respaldo.parent.mkdir(exist_ok=True)
    respaldo.write_text(json.dumps({k: previo.get(k) for k in ("sgc-acciones-correctivas", "sgc-planes-mejora")}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"respaldo local: {respaldo}")
    limpio = lambda xs: [{k: v for k, v in x.items() if not k.startswith("_")} for x in xs]
    peticion("PUT", "/api/v1/estado/sgc-acciones-correctivas", {"valor": limpio(acs)}, token)
    peticion("PUT", "/api/v1/estado/sgc-planes-mejora", {"valor": limpio(pms)}, token)
    final = peticion("GET", "/api/v1/estado", token=token)
    print(f"en servidor: {len(final['sgc-acciones-correctivas']['valor'])} AC · {len(final['sgc-planes-mejora']['valor'])} PM")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("excel")
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--url", default=URL_DEFECTO)
    a = ap.parse_args()
    acs, pms = cargar(a.excel)
    for titulo, xs in (("ACCIONES CORRECTIVAS", acs), ("PLANES DE MEJORA", pms)):
        print(f"\n{titulo}: {len(xs)} abiertas")
        for x in xs:
            print(f"  {x['folio_codigo']:<13} {x['area'][:30]:<30} {x['proceso'][:22]:<22} apertura {x['fecha_apertura']}  vence {x['fecha_limite']}  resp. {x.get('responsable') or x.get('responsable_actividad_inmediata') or '—'}")
            for av in x["_avisos"]:
                print(f"      ! {av}")
    if a.aplicar:
        aplicar(a.url.rstrip("/"), acs, pms)
    else:
        print("\nVista previa: no se envió nada. Usa --aplicar para cargar al portal.")


if __name__ == "__main__":
    main()
