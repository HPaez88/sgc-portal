"""
formatos_indicadores.py — Llena los formatos oficiales (plantillas en assets/plantillas) con los datos del proyecto anual.

Se escriben solo los textos de las celdas: encabezados, logos, bordes y firmas quedan como en el archivo oficial.
Si cambia un formato, se reemplaza la plantilla y, si cambió la posición de alguna celda, el mapa de este archivo.
Proyecto (dict) = un elemento de la clave 'sgc-proyectos-indicadores' (ver frontend/src/constants/proyectosIndicadores.js).
"""
import copy
import io
import os
from datetime import date

import docx
import openpyxl
from docx.text.paragraph import Paragraph

PLANTILLAS = os.path.join(os.path.dirname(__file__), "..", "assets", "plantillas")
MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
CAPITULOS = ["1000", "2000", "3000", "4000", "5000"]
FILA_PEM_INICIAL, FILA_PEM_FINAL = 17, 39  # filas con bordes preparadas en la plantilla


def _txt(v) -> str:
    return "" if v is None else str(v).strip()


def fecha_larga(v, de_anio: str = "") -> str:
    """'2027-01-01' -> '1 DE ENERO 2027' (proyecto) o '... DEL 2027' (ficha). Si no es fecha ISO, se respeta el texto."""
    try:
        f = date.fromisoformat(str(v)[:10])
        return f"{f.day} DE {MESES[f.month - 1]} {de_anio}{f.year}"
    except (TypeError, ValueError):
        return _txt(v)


def es_porcentaje(unidad) -> bool:
    return "porcent" in _txt(unidad).lower() or _txt(unidad) == "%"


def _num(v):
    try:
        return float(str(v).replace("%", "").replace(",", "").replace("$", "").strip())
    except (TypeError, ValueError):
        return None


def valor_meta(v, unidad) -> str:
    """Meta o trimestre como se escribe en Word: 95 -> '95%' si la unidad es porcentaje."""
    n = _num(v)
    if n is None:
        return _txt(v)
    texto = f"{n:g}"
    return f"{texto}%" if es_porcentaje(unidad) else texto


def valor_excel(v, unidad):
    """En el PEMS los porcentajes van como fracción (formato 0%)."""
    n = _num(v)
    if n is None:
        return _txt(v) or None
    return n / 100 if es_porcentaje(unidad) else n


def pesos(v) -> str:
    n = _num(v) or 0
    return f"${n:,.0f}"


# ── Word: escribir en una celda sin perder formato ─────────────────────────────────────────────
def poner(celda, texto) -> None:
    """Cada línea va en un párrafo de la celda, con el formato del párrafo que ya ocupaba ese lugar."""
    lineas = _txt(texto).split("\n") if _txt(texto) else [""]
    parrafos = [p for p in celda.paragraphs if p.text.strip()] or [celda.paragraphs[-1]]
    for i, linea in enumerate(lineas):
        if i < len(parrafos):
            p = parrafos[i]
        else:
            nuevo = copy.deepcopy(parrafos[-1]._p)
            parrafos[-1]._p.addnext(nuevo)
            p = Paragraph(nuevo, celda._tc)
            parrafos.append(p)
        runs = p.runs
        if not runs:  # celda vacía en la plantilla: el texto toma el formato de la marca de párrafo
            r = p.add_run(linea)
            marca = p._p.pPr.find(docx.oxml.ns.qn("w:rPr")) if p._p.pPr is not None else None
            if marca is not None:
                r._r.insert(0, copy.deepcopy(marca))
            continue
        runs[0].text = linea
        for r in runs[1:]:
            r._r.getparent().remove(r._r)
    for p in parrafos[len(lineas):]:
        p._p.getparent().remove(p._p)


def _celdas(fila) -> list:
    """Celdas únicas de la fila (las combinadas se repiten en python-docx)."""
    vistas, out = set(), []
    for c in fila.cells:
        if id(c._tc) not in vistas:
            vistas.add(id(c._tc))
            out.append(c)
    return out


def _ajustar_filas(tabla, primera: int, n: int) -> list:
    """Deja exactamente n filas de datos a partir de 'primera' (copia la última o quita sobrantes)."""
    n = max(n, 1)
    filas = tabla.rows[primera:]
    while len(filas) < n:
        filas[-1]._tr.addnext(copy.deepcopy(filas[-1]._tr))
        filas = tabla.rows[primera:]
    for f in filas[n:]:
        f._tr.getparent().remove(f._tr)
    return tabla.rows[primera:primera + n]


def _guardar_docx(d) -> bytes:
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


# ── Formato de Presentación de Proyectos ───────────────────────────────────────────────────────
def llenar_proyecto(p: dict) -> bytes:
    d = docx.Document(os.path.join(PLANTILLAS, "proyecto.docx"))
    t = d.tables
    for i, campo in enumerate(["dependencia", "unidad_responsable", "eje_rector", "programa_pmd", "programa_presupuestario", "folio_tesoreria"]):
        poner(_celdas(t[0].rows[i])[1], p.get(campo))
    tipo = _celdas(t[1].rows[0])
    crecimiento = p.get("tipo") == "CRECIMIENTO"
    poner(tipo[2], "(      )" if crecimiento else "(  X  )")
    poner(tipo[5] if len(tipo) > 5 else tipo[-2], "(  X  )" if crecimiento else "(      )")
    poner(_celdas(t[2].rows[0])[1], p.get("nombre"))
    for ti, campo in ((3, "resumen"), (4, "justificacion"), (5, "objetivo")):
        poner(_celdas(t[ti].rows[1])[0], p.get(campo))
    fechas = _celdas(t[6].rows[0])
    poner(fechas[1], fecha_larga(p.get("fecha_inicio")))
    poner(fechas[3], fecha_larga(p.get("fecha_conclusion")))

    acts = p.get("actividades") or []
    for fila, a in zip(_ajustar_filas(t[7], 2, len(acts)), acts or [{}]):
        c = _celdas(fila)
        u = a.get("unidad")
        trimestres = (a.get("trimestres") or ["", "", "", ""])[:4]
        for celda, valor in zip(c, [a.get("actividad"), a.get("indicador"), _txt(u).upper(), valor_meta(a.get("meta"), u),
                                    *[valor_meta(x, u) for x in trimestres]]):
            poner(celda, valor)

    pres = p.get("presupuesto") or {}
    totales = [0.0] * 5
    for i, cap in enumerate(CAPITULOS):
        q = [(_num(x) or 0) for x in (pres.get(cap) or [0, 0, 0, 0])[:4]]
        fila = [sum(q), *q]
        totales = [a + b for a, b in zip(totales, fila)]
        for celda, valor in zip(_celdas(t[8].rows[2 + i])[1:], fila):
            poner(celda, pesos(valor))
    for celda, valor in zip(_celdas(t[8].rows[7])[1:], totales):
        poner(celda, pesos(valor))

    firmas = p.get("firmas") or {}
    c = _celdas(t[9].rows[1])
    for celda, clave in ((c[0], "director_general"), (c[-1], "director_area")):
        f = firmas.get(clave) or {}
        poner(celda, f"{_txt(f.get('nombre')).upper()}\n{_txt(f.get('cargo')).upper()}")
    return _guardar_docx(d)


# ── Ficha técnica del indicador ────────────────────────────────────────────────────────────────
FICHA_SIMPLE = {  # fila -> campo (valor en la segunda celda)
    1: "eje_rector", 2: "programa_pmd", 3: "objetivo_pmd", 4: "estrategia_pmd", 5: "objetivo_institucional", 6: "tipo_objetivo",
    9: "nombre", 10: "definicion", 12: "metodo", 13: "variables", 15: "meta", 16: "linea_base", 17: "sentido",
    28: "medios", 29: "recopilacion", 32: "otro", 35: "fecha_elaboracion",
}
FICHA_DOBLE = {11: ("tipo_indicador", "dimension"), 14: ("unidad", "frecuencia"), 24: ("claridad", "relevancia"),
               25: ("economia", "monitoreable"), 26: ("adecuado", "aportacion")}


def datos_ficha(p: dict, a: dict) -> dict:
    """La ficha toma del proyecto lo que ya se capturó ahí (una sola captura); lo propio va en a['ficha']."""
    f = a.get("ficha") or {}
    titular = p.get("titular") or {}
    base = {
        "eje_rector": p.get("eje_rector"), "programa_pmd": p.get("programa_pmd"), "objetivo_institucional": p.get("objetivo_institucional"),
        "objetivo_pmd": p.get("objetivo_pmd"), "estrategia_pmd": p.get("estrategia_pmd"), "tipo_objetivo": p.get("tipo_objetivo"),
        "nombre": a.get("indicador"), "unidad": _txt(a.get("unidad")).upper(), "meta": valor_meta(a.get("meta"), a.get("unidad")),
        "frecuencia": _txt(a.get("periodicidad")).upper(), "fecha_elaboracion": fecha_larga(p.get("fecha_elaboracion"), "DEL "),
        "titular": f"{_txt(titular.get('nombre')).upper()}\n{_txt(titular.get('cargo')).upper()}",
    }
    return {**base, **{k: v for k, v in f.items() if _txt(v)}}


def llenar_ficha(p: dict, a: dict, cumplimiento: list | None = None) -> bytes:
    d = docx.Document(os.path.join(PLANTILLAS, "ficha_tecnica.docx"))
    filas = d.tables[0].rows
    v = datos_ficha(p, a)
    for fila, campo in FICHA_SIMPLE.items():
        poner(_celdas(filas[fila])[1], v.get(campo))
    for fila, (c1, c2) in FICHA_DOBLE.items():
        c = _celdas(filas[fila])
        poner(c[1], v.get(c1))
        poner(c[3], v.get(c2))
    poner(_celdas(filas[15])[0], f"Meta {p.get('anio') or ''}".strip())
    for celda, valor in zip(_celdas(filas[19])[1:13], (cumplimiento or [""] * 12)):
        poner(celda, valor)
    poner(_celdas(filas[21])[0], v.get("supuestos"))
    genero = _celdas(filas[31])
    poner(genero[2], v.get("mujeres"))
    poner(genero[4], v.get("hombres"))
    poner(_celdas(filas[34])[1], v.get("titular"))
    poner(_celdas(filas[36])[0], f"Notas:\n{_txt(v.get('notas'))}")
    return _guardar_docx(d)


# ── PEMS (PEM-1 objetivos y metas, PEM-2 actividades públicas) ─────────────────────────────────
def llenar_pems(p: dict) -> bytes:
    wb = openpyxl.load_workbook(os.path.join(PLANTILLAS, "pems.xlsx"))
    pem1, pem2 = wb.worksheets[0], wb.worksheets[1]
    e = p.get("pems") or {}
    anio = p.get("anio") or ""
    acts = (p.get("actividades") or [])[: FILA_PEM_FINAL - FILA_PEM_INICIAL + 1]
    clave = _txt(e.get("clave_subdependencia"))
    for ws, sufijo in ((pem1, "PEM1"), (pem2, "PEM2")):
        ws["A1"] = f"PRESUPUESTO DE EGRESOS MUNICIPAL {anio}"
        for fila, (etiqueta, campo) in enumerate([("MUNICIPIO", "municipio"), ("FINALIDAD", "finalidad"), ("FUNCIÓN", "funcion"),
                                                  ("SUBFUNCIÓN", "subfuncion"), ("DEPENDENCIA", "dependencia")], start=4):
            ws[f"A{fila}"] = f"{etiqueta}:  {_txt(e.get(campo))}"
        ws["A9"] = f"SUBDEPENDENCIA:  {clave} {_txt(e.get('subdependencia'))}"
        ws["A10"] = f"PROGRAMA:  {_txt(e.get('programa'))}"
        ws["A11"] = f"SUBPROGRAMA: {_txt(e.get('subprograma'))}"
        ws["A13"] = f"{'OBJETIVO (S)' if sufijo == 'PEM1' else 'OBJETIVO'}: {_txt(p.get('objetivo'))}"
        if clave:
            ws.title = f"{clave} {sufijo}"[:31]
        for r in range(FILA_PEM_INICIAL, FILA_PEM_FINAL + 1):
            for col in ("ABCDEFGHI" if sufijo == "PEM1" else "ABCD"):
                ws[f"{col}{r}"].value = None

    for i, a in enumerate(acts):
        r, u = FILA_PEM_INICIAL + i, a.get("unidad")
        pem1[f"A{r}"] = str(i + 1)
        pem1[f"B{r}"] = _txt(a.get("actividad"))
        pem1[f"C{r}"] = valor_excel(a.get("meta"), u)
        pem1[f"D{r}"] = _txt(u).capitalize()
        pem1[f"E{r}"] = str(_txt(a.get("ponderado")))
        for col, x in zip("FGHI", (a.get("trimestres") or [])[:4]):
            pem1[f"{col}{r}"] = valor_excel(x, u)
        for col in "CFGHI":
            pem1[f"{col}{r}"].number_format = "0%" if es_porcentaje(u) else "General"
        pem2[f"B{r}"] = _txt(a.get("ap_clave"))
        pem2[f"C{r}"] = _txt(a.get("ap_nombre"))
        pem2[f"D{r}"] = _txt(a.get("indicador"))
    pem2[f"A{FILA_PEM_INICIAL}"] = _txt(e.get("clave_grupo"))
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


if __name__ == "__main__":  # autoverificación rápida: python -m backend.services.formatos_indicadores
    ej = {"anio": 2027, "tipo": "OPERACION", "nombre": "PRUEBA", "fecha_inicio": "2027-01-01",
          "actividades": [{"actividad": "A1", "indicador": "I1", "unidad": "Porcentaje", "meta": 95, "trimestres": [24, 24, 24, 23]}] * 4,
          "presupuesto": {"1000": [1, 2, 3, 4]}}
    assert fecha_larga("2027-01-01") == "1 DE ENERO 2027" and valor_meta(95, "Porcentaje") == "95%"
    assert docx.Document(io.BytesIO(llenar_proyecto(ej))).tables[7].rows[5].cells[3].text == "95%", "meta"
    assert openpyxl.load_workbook(io.BytesIO(llenar_pems(ej))).worksheets[0]["C17"].value == 0.95
    assert docx.Document(io.BytesIO(llenar_ficha(ej, ej["actividades"][0]))).tables[0].rows[9].cells[-1].text == "I1"
    print("ok")
