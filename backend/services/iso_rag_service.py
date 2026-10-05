"""
services/iso_rag_service.py — Servicio RAG y Agente Asesor Normativo y Documental ISO (SGC OOMAPASC)
Carga la base de conocimiento oficial en formato Markdown (.md) y procesa consultas fundamentadas
estrictamente en las normas ISO (9001, 14001, 45001, 19011) y la documentación interna del portal
(Procedimientos, Formatos/Registros OOMRSC-20/21, Mapa de Procesos y Matriz de Trazabilidad).
"""
import os
import glob
import re
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

from backend.services.ai_service import get_ai_client, get_model

KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge")


def _parse_markdown_norma(file_path: str) -> Dict[str, Any]:
    """Parsea un archivo Markdown de norma ISO extrayendo sus cláusulas estructuradas."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = os.path.basename(file_path)
    if filename == "iso_9001_2026.md":
        norma_id = "ISO-9001-2026"
    elif filename == "iso_14001_2015.md":
        norma_id = "ISO-14001-2015"
    elif filename == "iso_45001_2018.md":
        norma_id = "ISO-45001-2018"
    elif filename == "iso_19011_2018.md":
        norma_id = "ISO-19011-2018"
    else:
        norma_id = filename.replace(".md", "").replace("_", "-").upper()

    # Extraer título principal
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    nombre = title_match.group(1).strip() if title_match else norma_id

    # Extraer objetivo o descripción
    desc_match = re.search(r"\*\*Objetivo:\*\*\s*(.+)$", content, re.MULTILINE)
    descripcion = desc_match.group(1).strip() if desc_match else f"Norma oficial {nombre}"

    # Extraer cláusulas marcadas con ### o ##
    clausulas = []
    sections = re.split(r"\n###\s+|\n##\s+", content)

    for sec in sections[1:]:
        lines = sec.strip().split("\n")
        header_line = lines[0].strip()

        # Extraer número y título
        match_num = re.match(r"^(\d+(?:\.\d+)*)\s*(?:y\s*\d+(?:\.\d+)*)?\s*[-—:]?\s*(.+)$", header_line)
        if match_num:
            numero = match_num.group(1).strip()
            titulo = match_num.group(2).strip()
        else:
            numero = header_line.split()[0] if header_line else "Sección"
            titulo = header_line

        body = "\n".join(lines[1:])

        # Extraer campos estructurados si existen
        req_m = re.search(r"- \*\*Requisito Oficial:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        requisito = req_m.group(1).strip() if req_m else ""

        int_m = re.search(r"- \*\*Interpretación Técnica.+?:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        interpretacion = int_m.group(1).strip() if int_m else ""

        evi_m = re.search(r"- \*\*Evidencia Objetiva Requerida:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        evidencia = evi_m.group(1).strip() if evi_m else ""

        cri_m = re.search(r"- \*\*Criterio de Auditoría.+?:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        criterio = cri_m.group(1).strip() if cri_m else ""

        if not requisito and not interpretacion:
            requisito = body[:800]

        clausulas.append({
            "numero": numero,
            "titulo": titulo,
            "requisito": requisito,
            "interpretacion": interpretacion,
            "evidencia_objetiva": evidencia,
            "criterio_auditoria": criterio,
            "texto_completo": body
        })

    return {
        "id": norma_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "archivo": filename,
        "clausulas": clausulas,
        "contenido_raw": content
    }


def _cargar_archivos_conocimiento() -> Dict[str, Any]:
    """Carga y estructura todos los archivos de conocimiento disponibles en Markdown."""
    normas = {}
    documentos_custom = []

    # Cargar normas ISO oficiales y guías internas en formato Markdown (.md)
    isos_dir = os.path.join(KNOWLEDGE_DIR, "isos")
    if os.path.exists(isos_dir):
        for file_path in glob.glob(os.path.join(isos_dir, "*.md")):
            try:
                filename = os.path.basename(file_path)
                data = _parse_markdown_norma(file_path)
                if filename in ["iso_9001_2026.md", "iso_14001_2015.md", "iso_45001_2018.md", "iso_19011_2018.md"]:
                    normas[data["id"]] = data
                else:
                    # Guías de transición, manuales internos, matrices de procedimientos y registros SGC
                    documentos_custom.append({
                        "nombre": filename,
                        "contenido": data["contenido_raw"],
                        "tamano": len(data["contenido_raw"])
                    })
            except Exception as e:
                print(f"[WARN] Error cargando norma MD {file_path}: {e}")

    # Cargar documentos adicionales / custom (.md, .txt, .json)
    custom_dir = os.path.join(KNOWLEDGE_DIR, "custom")
    if os.path.exists(custom_dir):
        for file_path in glob.glob(os.path.join(custom_dir, "*.*")):
            if file_path.endswith((".md", ".txt", ".json")) and not file_path.endswith("README.md"):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        contenido = f.read()
                        documentos_custom.append({
                            "nombre": os.path.basename(file_path),
                            "contenido": contenido,
                            "tamano": len(contenido)
                        })
                except Exception as e:
                    print(f"[WARN] Error cargando custom doc {file_path}: {e}")

    return {
        "normas": normas,
        "documentos_custom": documentos_custom
    }


def listar_normas_disponibles() -> List[Dict[str, Any]]:
    """Retorna el resumen de normas ISO disponibles."""
    kb = _cargar_archivos_conocimiento()
    resultado = []
    
    # Prioridad: ISO 9001:2026 primero
    orden_preferido = ["ISO-9001-2026", "ISO-14001-2015", "ISO-45001-2018", "ISO-19011-2018"]
    
    normas_ordenadas = sorted(
        kb["normas"].values(),
        key=lambda x: orden_preferido.index(x["id"]) if x["id"] in orden_preferido else 99
    )

    for norma in normas_ordenadas:
        resultado.append({
            "id": norma["id"],
            "nombre": norma["nombre"],
            "descripcion": norma["descripcion"],
            "total_clausulas": len(norma["clausulas"]),
            "archivo": norma["archivo"]
        })
    return resultado


def obtener_clausulas_norma(norma_id: str) -> List[Dict[str, Any]]:
    """Retorna las cláusulas detalladas de una norma en específico."""
    kb = _cargar_archivos_conocimiento()
    if norma_id in kb["normas"]:
        return kb["normas"][norma_id]["clausulas"]
    return []


def listar_documentos_conocimiento() -> List[Dict[str, Any]]:
    """Retorna la lista de todos los documentos indexados en la base de conocimiento."""
    kb = _cargar_archivos_conocimiento()
    docs = []
    for norma in kb["normas"].values():
        docs.append({
            "tipo": "NORMA_OFICIAL_MD",
            "id": norma["id"],
            "nombre": norma["nombre"],
            "archivo": norma["archivo"],
            "clausulas_count": len(norma["clausulas"])
        })
    for cdoc in kb["documentos_custom"]:
        es_doc_interno = "documentacion_interna" in cdoc["nombre"]
        docs.append({
            "tipo": "CATALOGO_INTERNO_SGC" if es_doc_interno else "GUIA_O_DOCUMENTO_MD",
            "id": cdoc["nombre"],
            "nombre": "Catálogo Maestro de Procedimientos y Registros SGC OOMAPASC" if es_doc_interno else cdoc["nombre"],
            "archivo": cdoc["nombre"],
            "tamano_bytes": cdoc["tamano"]
        })
    return docs


def buscar_contexto_relevante(
    query: str,
    norma_id: Optional[str] = None,
    catalogo_documentos: Optional[List[Dict[str, Any]]] = None,
    catalogo_procesos: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Busca cláusulas, guías de transición, procedimientos, formatos OOMRSC-20/21 y extractos
    relevantes basados en términos clave, claves de documentos y contexto temático.
    """
    kb = _cargar_archivos_conocimiento()
    query_lower = query.lower()
    
    # Detección de intenciones temáticas
    es_pregunta_transicion = any(k in query_lower for k in [
        "cambio", "cambios", "diferencia", "diferencias", "2015", "2026",
        "transicion", "transición", "enmienda", "enmiendas", "novedad", "novedades",
        "versus", "vs", "evolucion", "evolución", "actualizacion", "actualización"
    ])

    es_pregunta_documental = any(k in query_lower for k in [
        "procedimiento", "procedimientos", "formato", "formatos", "registro", "registros",
        "oomrsc", "oomrsc-20", "oomrsc-21", "mc-01", "pr-cal", "pr-mej", "pr-pot", "pr-aud",
        "reg-cloro", "trazabilidad", "impacto", "eliminar", "referencia", "referencias",
        "catalogo", "catálogo", "manual", "proceso", "procesos", "mapa", "interaccion", "interacción"
    ])

    # Extraer posibles números de cláusula del query (ej. 4.1, 7.5, 8.5.1, 10.2)
    clausula_matches = re.findall(r"\b\d+\.\d+(?:\.\d+)?\b", query)

    # Extraer posibles claves de documentos (ej. OOMRSC-20, PR-CAL-01, MC-01, REG-CLORO-01)
    clave_matches = [m.upper() for m in re.findall(r"\b[A-Za-z]{2,6}-?[A-Za-z0-9]+(?:-\d+)?\b", query)]

    clausulas_relevantes = []
    normas_a_buscar = [kb["normas"][norma_id]] if (norma_id and norma_id in kb["normas"]) else kb["normas"].values()

    for norma in normas_a_buscar:
        for cl in norma.get("clausulas", []):
            score = 0
            num = cl.get("numero", "")
            titulo = cl.get("titulo", "").lower()
            requisito = cl.get("requisito", "").lower()
            interpretacion = cl.get("interpretacion", "").lower()

            # Coincidencia exacta de número de cláusula
            if num in clausula_matches or num in query_lower:
                score += 60
            
            # Palabras clave en título o contenido
            palabras = [w for w in re.split(r"\W+", query_lower) if len(w) > 3]
            for palabra in palabras:
                if palabra in titulo:
                    score += 15
                if palabra in requisito:
                    score += 8
                if palabra in interpretacion:
                    score += 8

            # Si es pregunta de transición, priorizar cláusulas clave afectadas por enmiendas
            if es_pregunta_transicion and num in ["4.1", "4.2", "6.1", "7.1.3", "7.5", "8.4", "9.2", "10.2"]:
                score += 30

            # Si es pregunta sobre control documental o registros, priorizar 7.5, 8.5.1 y 10.2
            if es_pregunta_documental and num in ["7.5", "7.5.1", "7.5.2", "7.5.3", "8.5.1", "9.2", "10.2", "10.3"]:
                score += 35

            if score > 0:
                clausulas_relevantes.append({
                    "score": score,
                    "norma": norma["nombre"],
                    "norma_id": norma["id"],
                    "numero": cl["numero"],
                    "titulo": cl["titulo"],
                    "requisito": cl["requisito"],
                    "interpretacion": cl["interpretacion"],
                    "evidencia_objetiva": cl.get("evidencia_objetiva", ""),
                    "criterio_auditoria": cl.get("criterio_auditoria", "")
                })

    # Ordenar por relevancia
    clausulas_relevantes.sort(key=lambda x: x["score"], reverse=True)
    
    # Si no hubo match específico, tomar las cláusulas principales
    if not clausulas_relevantes and normas_a_buscar:
        primera_norma = list(normas_a_buscar)[0]
        clausulas_relevantes = [{
            "score": 1,
            "norma": primera_norma["nombre"],
            "norma_id": primera_norma["id"],
            "numero": cl["numero"],
            "titulo": cl["titulo"],
            "requisito": cl["requisito"],
            "interpretacion": cl["interpretacion"],
            "evidencia_objetiva": cl.get("evidencia_objetiva", ""),
            "criterio_auditoria": cl.get("criterio_auditoria", "")
        } for cl in primera_norma.get("clausulas", [])[:6]]

    # Extraer fragmentos de documentos internos, de transición y custom
    custom_snippets = []
    for cdoc in kb["documentos_custom"]:
        c_lower = cdoc["contenido"].lower()
        es_doc_interno = "documentacion_interna" in cdoc["nombre"]
        
        # Si la pregunta es documental o menciona claves internas, priorizar documentación interna
        score_doc = 0
        if es_doc_interno and es_pregunta_documental:
            score_doc += 50
        if any(clave in cdoc["contenido"].upper() for clave in clave_matches):
            score_doc += 40
        if es_pregunta_transicion and "transicion" in cdoc["nombre"]:
            score_doc += 50
        if any(p in c_lower for p in re.split(r"\W+", query_lower) if len(p) > 3):
            score_doc += 20

        if score_doc > 0:
            custom_snippets.append({
                "score": score_doc,
                "documento": cdoc["nombre"],
                "fragmento": cdoc["contenido"][:1400]
            })

    custom_snippets.sort(key=lambda x: x["score"], reverse=True)

    # Documentos dinámicos del catálogo activo del portal (si se reciben del frontend)
    docs_activos_relevantes = []
    if catalogo_documentos:
        for doc in catalogo_documentos:
            d_clave = (doc.get("clave") or "").upper()
            d_titulo = (doc.get("titulo") or "").lower()
            d_desc = (doc.get("descripcion") or "").lower()
            d_area = (doc.get("area") or "").lower()
            
            d_score = 0
            if any(k in d_clave for k in clave_matches):
                d_score += 60
            if d_clave.lower() in query_lower:
                d_score += 60
            for p in re.split(r"\W+", query_lower):
                if len(p) > 3:
                    if p in d_titulo:
                        d_score += 20
                    if p in d_desc:
                        d_score += 10
                    if p in d_area:
                        d_score += 10
            
            if d_score > 0:
                docs_activos_relevantes.append({
                    "score": d_score,
                    "clave": doc.get("clave"),
                    "titulo": doc.get("titulo"),
                    "tipo": doc.get("tipo"),
                    "version": doc.get("version"),
                    "area": doc.get("area"),
                    "estado": doc.get("estado"),
                    "referencias_usadas": doc.get("referencias_usadas", []),
                    "descripcion": doc.get("descripcion")
                })
        docs_activos_relevantes.sort(key=lambda x: x["score"], reverse=True)

    return {
        "clausulas": clausulas_relevantes[:3],
        "custom_snippets": custom_snippets[:2],
        "documentos_activos": docs_activos_relevantes[:3]
    }


def consultar_agente_iso(
    pregunta: str,
    norma_id: Optional[str] = None,
    historial: Optional[List[Dict[str, str]]] = None,
    catalogo_documentos: Optional[List[Dict[str, Any]]] = None,
    catalogo_procesos: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Ejecuta la consulta con el Agente ISO con Groundedness estricto en la documentación oficial,
    procedimientos, formatos y registros del portal SGC de OOMAPASC.
    """
    contexto = buscar_contexto_relevante(pregunta, norma_id, catalogo_documentos, catalogo_procesos)
    clausulas = contexto["clausulas"]
    custom_snippets = contexto["custom_snippets"]
    documentos_activos = contexto.get("documentos_activos", [])

    # Construir bloque de conocimiento inyectado
    kb_text = "=== BASE DE CONOCIMIENTO OFICIAL ISO (ARCHIVOS .MD) Y SGC OOMAPASC ===\n\n"
    clausulas_citadas_meta = []

    # 1. Catálogo Activo de Documentos del Portal
    if documentos_activos:
        kb_text += "=== CATÁLOGO DE DOCUMENTOS Y REGISTROS ACTIVOS EN EL PORTAL SGC ===\n"
        for d in documentos_activos:
            kb_text += (
                f"• Documento: [{d['clave']}] \"{d['titulo']}\"\n"
                f"  - Tipo: {d.get('tipo', 'N/A')} | Revisión: {d.get('version', 'Vigente')} | Estado: {d.get('estado', 'APROBADO')}\n"
                f"  - Área: {d.get('area', 'SGC')} | Citas Fuertes: {', '.join(d.get('referencias_usadas', [])) or 'Ninguna'}\n"
                f"  - Descripción: {d.get('descripcion', 'Sin descripción')}\n\n"
            )

    # 2. Documentos Internos y Guías Estructuradas (.md)
    if custom_snippets:
        kb_text += "=== GUÍAS DE TRANSICIÓN, PROCEDIMIENTOS Y REGISTROS INSTITUCIONALES (.MD) ===\n"
        for cs in custom_snippets:
            kb_text += f"Documento Fuente: {cs['documento']}\nContenido:\n{cs['fragmento']}\n\n"

    # 3. Cláusulas de Normas ISO Oficiales
    for idx, cl in enumerate(clausulas, 1):
        kb_text += (
            f"--- FUENTE #{idx}: {cl['norma']} — Cláusula {cl['numero']}: {cl['titulo']} ---\n"
            f"• Requisito Oficial: {cl['requisito']}\n"
            f"• Interpretación Técnica: {cl['interpretacion']}\n"
            f"• Evidencia Objetiva: {cl['evidencia_objetiva']}\n\n"
        )
        clausulas_citadas_meta.append({
            "norma_id": cl["norma_id"],
            "norma": cl["norma"],
            "numero": cl["numero"],
            "titulo": cl["titulo"]
        })

    system_prompt = (
        "Eres el 'Agente Auditor y Asesor Normativo y Documental ISO Senior' para el Sistema de Gestión de Calidad (SGC) "
        "del Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme (OOMAPASC).\n\n"
        "DOMINIO TOTAL Y EXCLUSIVO DE LA DOCUMENTACIÓN:\n"
        "1. Normas ISO Oficiales: ISO 9001:2015, ISO 9001:2026 (Enmiendas Climáticas 4.1/4.2 y Resiliencia 6.1/7.1.3), ISO 14001:2015, ISO 45001:2018 e ISO 19011:2018.\n"
        "2. Documentación Interna Oficial de OOMAPASC:\n"
        "   - Manual del SGC: MC-01 (Rev. 04) — define la política, alcance territorial (Cajeme) y mapa de procesos.\n"
        "   - Procedimiento de Acciones Correctivas: PR-CAL-01 (Rev. 06) — 5 Porqués, Diagrama Ishikawa 6M, 8D.\n"
        "   - Formato Institucional de Acción Correctiva: OOMRSC-20 (Rev. 18) — registro oficial de causa raíz, plan de acción y dictamen de cierre (ISO 9001 § 10.2).\n"
        "   - Procedimiento de Mejora Continua: PR-MEJ-01 (Rev. 03) — formulación, viabilidad y presupuesto.\n"
        "   - Formato de Plan de Mejora Continua: OOMRSC-21 (Rev. 02) — metas cuatrimestrales, presupuesto e indicadores (ISO 9001 § 10.3).\n"
        "   - Procedimiento de Potabilización y Cloración: PR-POT-01 (Rev. 05) — NOM-127-SSA1-2021, límites 0.2 a 1.5 mg/L.\n"
        "   - Bitácora de Cloro en Red: REG-CLORO-01 (Rev. 02) — lecturas diarias por sector hidráulico.\n"
        "   - Procedimiento de Auditorías Internas: PR-AUD-01 (Rev. 04) — ISO 19011:2018, canaliza No Conformidades a OOMRSC-20.\n"
        "   - 8 Procesos Institucionales: PR-DIR-01, PR-PROD-02, PR-MNT-03, PR-COM-04, PR-REC-05, PR-COM-06, PR-INF-07, PR-MED-08.\n"
        "   - Matriz de Trazabilidad y Reglas de Control Documental (§ 7.5.3): Bloqueo de eliminación ante Citas Fuertes y Alertas de Referencias Rotas.\n"
        "   - Puentes Inter-Módulos: Auditoría→AC (OOMRSC-20), Indicador en Rojo (86 Indicadores)→AC (OOMRSC-20), Riesgo Extremo/Alto→PM (OOMRSC-21) / AC.\n\n"
        "REGLAS OBLIGATORIAS DE GROUNDEDNESS ESTRICTO:\n"
        "- Responde ESTRICTAMENTE con base en los documentos, procedimientos, formatos y registros reales que existen en el SGC de OOMAPASC.\n"
        "- Cita siempre la clave oficial exacta (ej. MC-01, PR-CAL-01, OOMRSC-20, OOMRSC-21, REG-CLORO-01, etc.), su revisión, área responsable y la norma ISO vinculada.\n"
        "- Si el usuario pregunta por las interacciones entre documentos o cómo interactúa un registro con otros procesos del portal, explica con precisión la cadena de trazabilidad.\n"
        "- Si el usuario pregunta por un documento inexistente, declara que dicho documento no se encuentra en el catálogo oficial del SGC de OOMAPASC.\n\n"
        "ESTRUCTURA DE RESPUESTA EN MARKDOWN:\n"
        "Utiliza encabezados claros, tablas comparativas estructuradas cuando aplique, listas con viñetas y negritas."
    )

    user_prompt = f"{kb_text}\n\n=== CONSULTA DEL AUDITOR / USUARIO ===\n{pregunta}"

    # Llamar al modelo
    client = get_ai_client()
    model = get_model()

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    # Incorporar historial
    if historial:
        for msg in historial[-4:]:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_prompt})

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=1400,
        )
        raw_response = completion.choices[0].message.content or ""
        clean_response = re.sub(r"<think>.*?</think>", "", raw_response, flags=re.DOTALL).strip()

        return {
            "respuesta": clean_response,
            "norma_consultada": norma_id or "Todas las Normas ISO y Documentación SGC",
            "clausulas_citadas": clausulas_citadas_meta[:5],
            "total_fuentes_consultadas": len(clausulas) + len(custom_snippets) + len(documentos_activos)
        }
    except Exception as e:
        print(f"[ERROR] Falló consulta al Agente ISO: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la consulta con el Agente ISO: {str(e)}"
        )
