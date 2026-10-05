"""
backend/services/fichas_docx_service.py — Generador de Documentos Oficiales Word (.docx)
para el H. Ayuntamiento de Cajeme y Tesorería Municipal (Presupuesto de Egresos y Fichas Técnicas PMD).
"""

import os
import io
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCS_FOLDER = r"c:\Users\hmpl_\CodeGPT\sgc-portal\docs\cuadro_control\fichas gubernamentales\PLANEACIÓN_PRESUPUESTO_DE_EGRESOS_2026"

def set_cell_background(cell, fill_hex):
    """Establece color de fondo de una celda en Word."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Ajusta márgenes internos de una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def generar_docx_ficha_tecnica(data: dict) -> io.BytesIO:
    """
    Genera el archivo Microsoft Word (.docx) oficial de la Ficha Técnica de Indicador
    con el formato institucional idéntico al del Ayuntamiento de Cajeme.
    """
    doc = docx.Document()
    
    # Márgenes de página (1.8 cm en todos lados)
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)

    # Estilo de párrafo base
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(9)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # Datos extraídos
    alineacion = data.get('alineacion', {})
    identificacion = data.get('identificacion', {})
    cremaa = data.get('atributos_cremaa', {})
    variables = data.get('caracteristicas_variables', {})
    transversalidad = data.get('transversalidad', {})
    info_adic = data.get('informacion_adicional', {})
    mensual = data.get('cumplimiento_mensual', {})

    # Título o Encabezado
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_h1 = p_header.add_run("H. AYUNTAMIENTO DE CAJEME · OOMAPAS DE CAJEME\n")
    r_h1.bold = True
    r_h1.font.size = Pt(11)
    r_h1.font.color.rgb = RGBColor(0x00, 0x28, 0x55)
    
    r_h2 = p_header.add_run("FICHA TÉCNICA DE INDICADOR · PRESUPUESTO DE EGRESOS 2026\n")
    r_h2.bold = True
    r_h2.font.size = Pt(10)
    r_h2.font.color.rgb = RGBColor(0x1E, 0x3E, 0x62)

    # Tabla Maestra Contenedora
    tbl = doc.add_table(rows=0, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    def add_section_header(title):
        row = tbl.add_row()
        cell = row.cells[0]
        cell.merge(row.cells[1])
        set_cell_background(cell, "0B192C")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(f"  {title}")
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_margins(cell, 80, 80, 100, 100)

    def add_key_val(key, val, bg_key="F0F4F8"):
        row = tbl.add_row()
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.8)
        set_cell_background(c0, bg_key)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(key)
        r0.bold = True
        r0.font.size = Pt(8.5)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(str(val or ''))
        r1.font.size = Pt(8.5)
        set_cell_margins(c0, 50, 50, 80, 80)
        set_cell_margins(c1, 50, 50, 80, 80)

    # I. ALINEACIÓN
    add_section_header("I. Alineación")
    add_key_val("Eje rector PMD", alineacion.get('eje_rector_pmd', 'Cajeme Limpio y Ordenado'))
    add_key_val("Programa PMD", alineacion.get('programa_pmd', 'Desarrollo con Servicios Públicos de Calidad'))
    add_key_val("Objetivo PMD", alineacion.get('objetivo_pmd', 'Gestión Moderna y Eficiente del Cobro de Agua'))
    add_key_val("Estrategia PMD", alineacion.get('estrategia_pmd', ''))
    add_key_val("Objetivo institucional", alineacion.get('objetivo_institucional', ''))
    add_key_val("Tipo de objetivo", alineacion.get('tipo_objetivo', 'Cumplimiento'))

    # II. IDENTIFICACIÓN
    add_section_header("II. Identificación")
    add_key_val("Nombre del indicador*", identificacion.get('nombre_indicador', ''))
    add_key_val("Definición del indicador*", identificacion.get('definicion_indicador', ''))
    add_key_val("Tipo de indicador*", identificacion.get('tipo_indicador', 'Gestión'))
    add_key_val("Dimensión*", identificacion.get('dimension', 'Eficacia'))
    add_key_val("Método de cálculo*", identificacion.get('metodo_calculo', ''))
    add_key_val("Variables para el cálculo", identificacion.get('variables_calculo', ''))
    add_key_val("Unidad de medida*", identificacion.get('unidad_medida', 'Porcentaje'))
    add_key_val("Frecuencia de medición*", identificacion.get('frecuencia_medicion', 'Mensual'))
    add_key_val("Meta Anual", identificacion.get('meta_anual', ''))
    add_key_val("Línea base", identificacion.get('linea_base', ''))
    add_key_val("Sentido del indicador", identificacion.get('sentido_indicador', 'Ascendente'))
    
    # Tabla de Cumplimiento Mensual dentro de la Ficha
    meses_claves = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    val_mensuales = [str(mensual.get(m.lower(), mensual.get(m, 'NA'))) for m in meses_claves]
    cumplimiento_txt = " | ".join([f"{m}: {v}" for m, v in zip(meses_claves, val_mensuales)])
    add_key_val("Cumplimiento Mensual (Metas)", cumplimiento_txt)
    add_key_val("Supuestos", identificacion.get('supuestos', ''))

    # III. ATRIBUTOS DEL INDICADOR (CREMAA)
    add_section_header("III. Atributos del indicador*")
    add_key_val("Claridad", cremaa.get('claridad', ''))
    add_key_val("Relevancia", cremaa.get('relevancia', ''))
    add_key_val("Economía", cremaa.get('economia', ''))
    add_key_val("Monitoreable", cremaa.get('monitoreable', ''))
    add_key_val("Adecuado", cremaa.get('adecuado', ''))
    add_key_val("Aportación marginal", cremaa.get('aportacion_marginal', ''))

    # IV. CARACTERÍSTICAS DE LAS VARIABLES
    add_section_header("IV. Características de las variables")
    add_key_val("Medios de verificación", variables.get('medios_verificacion', ''))
    add_key_val("Método de recopilación", variables.get('metodo_recopilacion', ''))

    # V. TRANSVERSALIDAD
    add_section_header("V. Transversalidad")
    mujeres_check = "Sí (X)" if transversalidad.get('genero_mujeres', True) else "No ( )"
    hombres_check = "Sí (X)" if transversalidad.get('genero_hombres', True) else "No ( )"
    add_key_val("Género", f"Mujeres: {mujeres_check}  |  Hombres: {hombres_check}")
    add_key_val("Otro (especificar)", transversalidad.get('otro', 'No aplica'))

    # VI. INFORMACIÓN ADICIONAL Y FIRMAS
    add_section_header("VI. Información adicional")
    add_key_val("Titular de la Unidad Responsable", f"{info_adic.get('titular_unidad', '')} - {info_adic.get('cargo_titular', '')}")
    add_key_val("Fecha de elaboración", info_adic.get('fecha_elaboracion', '08 de Noviembre 2024'))
    add_key_val("Notas", info_adic.get('notas', 'Formato oficial de Ficha Técnica PMD / Presupuesto de Egresos.'))

    # Firmas
    doc.add_paragraph().paragraph_format.space_before = Pt(15)
    tbl_firmas = doc.add_table(rows=2, cols=2)
    tbl_firmas.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Líneas de firma
    p_f1 = tbl_firmas.cell(0, 0).paragraphs[0]
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f1.add_run("_____________________________________________\n")
    p_f1.add_run(f"ELABORÓ / TITULAR DE ÁREA\n{info_adic.get('titular_unidad', 'Encargado de Área')}\n{info_adic.get('cargo_titular', '')}").font.size = Pt(8)

    p_f2 = tbl_firmas.cell(0, 1).paragraphs[0]
    p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f2.add_run("_____________________________________________\n")
    p_f2.add_run(f"VALIDACIÓN INSTITUCIONAL SGC\n{info_adic.get('validador_sgc', 'LIC. LUIS ALBERTO RUIZ CORONADO')}\n{info_adic.get('cargo_validador', 'DIRECTOR GENERAL / COORDINACIÓN SGC')}").font.size = Pt(8)


    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output


def generar_docx_proyecto_presupuesto(data: dict) -> io.BytesIO:
    """
    Genera el archivo Microsoft Word (.docx) oficial del Formato de Presentación de Proyectos
    (Presupuesto de Egresos) con la matriz de actividades, desglose por capítulos 1000-7000 y firmas.
    """
    doc = docx.Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.6)
        section.right_margin = Inches(0.6)

    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(8.5)

    # Encabezado
    p_h = doc.add_paragraph()
    p_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_h.add_run("H. AYUNTAMIENTO DE CAJEME · TESORERÍA MUNICIPAL\n")
    r1.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(0x00, 0x28, 0x55)
    r2 = p_h.add_run("FORMATO DE PRESENTACIÓN DE PROYECTOS · PRESUPUESTO DE EGRESOS 2026\n")
    r2.bold = True
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = RGBColor(0x1E, 0x3E, 0x62)

    # Tabla 1: Datos Generales
    tbl1 = doc.add_table(rows=0, cols=2)
    tbl1.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    def add_row_t1(k, v):
        r = tbl1.add_row()
        c0, c1 = r.cells[0], r.cells[1]
        c0.width, c1.width = Inches(2.3), Inches(4.7)
        set_cell_background(c0, "0B192C")
        p0 = c0.paragraphs[0]
        run0 = p0.add_run(k)
        run0.bold = True
        run0.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p1 = c1.paragraphs[0]
        p1.add_run(str(v or ''))
        set_cell_margins(c0, 40, 40, 60, 60)
        set_cell_margins(c1, 40, 40, 60, 60)

    add_row_t1("Dependencia / Entidad Paramunicipal", data.get('dependencia', 'OOMAPAS DE CAJEME'))
    add_row_t1("Unidad Responsable", data.get('unidad_responsable', 'DIRECCIÓN GENERAL'))
    add_row_t1("Eje Rector PMD", data.get('eje_rector_pmd', 'CAJEME LIMPIO Y ORDENADO'))
    add_row_t1("Programa PMD", data.get('programa_pmd', 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD'))
    add_row_t1("Programa Presupuestario", data.get('nombre_programa', 'PP10 GESTIÓN Y FORTALECIMIENTO DEL OOMAPASC'))
    add_row_t1("Tipo de proyecto", f"{data.get('tipo_proyecto', 'Operación Básica del Área')} ( X )")
    add_row_t1("Nombre del proyecto", data.get('nombre_proyecto', ''))
    add_row_t1("Vigencia", f"Del {data.get('fecha_inicio', '1 de enero 2026')} al {data.get('fecha_conclusion', '31 de diciembre 2026')}")

    # Resumen Ejecutivo, Justificación, Objetivo
    doc.add_paragraph().paragraph_format.space_before = Pt(6)
    
    def add_narrative_box(title, text):
        tbl_n = doc.add_table(rows=2, cols=1)
        tbl_n.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_title = tbl_n.cell(0, 0)
        set_cell_background(c_title, "1E3E62")
        p_t = c_title.paragraphs[0]
        r_t = p_t.add_run(f"  {title}")
        r_t.bold = True
        r_t.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_margins(c_title, 40, 40, 60, 60)

        c_body = tbl_n.cell(1, 0)
        set_cell_background(c_body, "FAFAFA")
        p_b = c_body.paragraphs[0]
        p_b.add_run(text or '')
        set_cell_margins(c_body, 50, 50, 80, 80)
        doc.add_paragraph().paragraph_format.space_before = Pt(4)

    add_narrative_box("Resumen ejecutivo (Máximo 150 palabras)", data.get('resumen_ejecutivo', ''))
    add_narrative_box("Justificación (Máximo 350 palabras)", data.get('justificacion', ''))
    add_narrative_box("Objetivo (Máximo 50 palabras)", data.get('objetivo', ''))

    # Matriz de Actividades e Indicadores
    p_act = doc.add_paragraph()
    p_act.paragraph_format.space_before = Pt(6)
    r_act = p_act.add_run("Matriz de Actividades, Metas y Calendario Trimestral:")
    r_act.bold = True
    r_act.font.size = Pt(9.5)
    r_act.font.color.rgb = RGBColor(0x00, 0x28, 0x55)

    tbl_act = doc.add_table(rows=1, cols=8)
    tbl_act.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Actividad", "Indicador", "Unidad", "Meta", "T1", "T2", "T3", "T4"]
    for idx, h in enumerate(headers):
        c = tbl_act.cell(0, idx)
        set_cell_background(c, "0B192C")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(7.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_margins(c, 40, 40, 40, 40)

    for item in data.get('actividades_indicadores', []):
        row = tbl_act.add_row()
        trims = item.get('trimestres', {})
        vals = [
            item.get('actividad', ''),
            item.get('indicador', ''),
            item.get('unidad_medida', 'Porcentaje'),
            str(item.get('meta', '')),
            str(trims.get('t1', '')),
            str(trims.get('t2', '')),
            str(trims.get('t3', '')),
            str(trims.get('t4', ''))
        ]
        for c_idx, val in enumerate(vals):
            c = row.cells[c_idx]
            p = c.paragraphs[0]
            p.add_run(val).font.size = Pt(7.5)
            set_cell_margins(c, 30, 30, 40, 40)

    # Cuantificación de Recursos por Capítulo
    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    p_pres = doc.add_paragraph()
    r_pres = p_pres.add_run("Cuantificación de Recursos Presupuestarios (Armonización CONAC):")
    r_pres.bold = True
    r_pres.font.size = Pt(9.5)
    r_pres.font.color.rgb = RGBColor(0x00, 0x28, 0x55)

    tbl_pres = doc.add_table(rows=1, cols=6)
    tbl_pres.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_pres = ["Capítulo de Gasto", "Presupuesto Anual", "1er Trim.", "2do Trim.", "3er Trim.", "4to Trim."]
    for idx, h in enumerate(headers_pres):
        c = tbl_pres.cell(0, idx)
        set_cell_background(c, "1E3E62")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_margins(c, 40, 40, 50, 50)

    pres_dict = data.get('presupuesto_capitulos', {})
    for key, cap in pres_dict.items():
        row = tbl_pres.add_row()
        is_total = key == 'total'
        if is_total:
            for cell in row.cells:
                set_cell_background(cell, "E2E8F0")

        fmt_monto = lambda m: f"${m:,.2f}" if isinstance(m, (int, float)) else str(m)
        vals = [
            cap.get('capitulo', ''),
            fmt_monto(cap.get('anual', 0)),
            fmt_monto(cap.get('t1', 0)),
            fmt_monto(cap.get('t2', 0)),
            fmt_monto(cap.get('t3', 0)),
            fmt_monto(cap.get('t4', 0))
        ]
        for c_idx, val in enumerate(vals):
            c = row.cells[c_idx]
            p = c.paragraphs[0]
            if c_idx > 0:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.add_run(val)
            run.font.size = Pt(7.5)
            if is_total:
                run.bold = True
            set_cell_margins(c, 30, 30, 40, 40)

    # Firmas
    doc.add_paragraph().paragraph_format.space_before = Pt(15)
    tbl_f = doc.add_table(rows=1, cols=2)
    tbl_f.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    pf1 = tbl_f.cell(0, 0).paragraphs[0]
    pf1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf1.add_run("_____________________________________________\n")
    pf1.add_run(f"TITULAR DE LA UNIDAD RESPONSABLE\n{data.get('titular', 'LIC. LUIS ALBERTO RUIZ CORONADO')}\n{data.get('cargo_titular', 'DIRECTOR GENERAL')}").font.size = Pt(8)

    pf2 = tbl_f.cell(0, 1).paragraphs[0]
    pf2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf2.add_run("_____________________________________________\n")
    pf2.add_run("VALIDACIÓN TESORERÍA / DIRECCIÓN GENERAL\nLIC. LUIS ALBERTO RUIZ CORONADO\nDIRECTOR GENERAL OOMAPASC").font.size = Pt(8)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
