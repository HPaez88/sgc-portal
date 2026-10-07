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

from backend.services.ai_service import get_ai_client, get_model, get_chat_model

KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge")


def _parse_markdown_norma(file_path: str) -> Dict[str, Any]:
    """Parsea un archivo Markdown de norma ISO extrayendo sus cláusulas estructuradas."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = os.path.basename(file_path)
    if filename == "iso_9001_2026.md":
        norma_id = "ISO-9001-2026"
    elif filename == "iso_42001_2023.md":
        norma_id = "ISO-42001-2023"
    elif filename == "iso_27001_2022.md":
        norma_id = "ISO-27001-2022"
    elif filename == "iso_9000_2015.md":
        norma_id = "ISO-9000-2015"
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

    # Parsear encabezados nivel 2 (##) y nivel 3 (###)
    clausulas = []
    
    # Dividir preservando delimitadores ## y ###
    pattern = r"(?=\n#{2,3}\s+)"
    raw_sections = re.split(pattern, content)

    for sec in raw_sections:
        sec = sec.strip()
        if not sec.startswith("##"):
            continue

        lines = sec.split("\n")
        header_line = lines[0].strip()
        is_capitulo = header_line.startswith("## ") and not header_line.startswith("### ")
        clean_header = header_line.lstrip("#").strip()

        # Extraer número y título
        match_principio = re.match(r"^Principio\s+(\d+)\s*[-—:\.]?\s*(.+)$", clean_header, re.IGNORECASE)
        match_variacion = re.match(r"^Variaci[oó]n\s+(\d+)\s*[-—:\.]?\s*(.+)$", clean_header, re.IGNORECASE)
        match_anexo = re.match(r"^(Anexo\s+[A-Z0-9\.]+)\s*[-—:\.]?\s*(.+)$", clean_header, re.IGNORECASE)
        match_num = re.match(r"^(\d+(?:\.\d+)*)\s*[-—:\.]?\s*(.+)$", clean_header)

        if match_principio:
            numero = f"Principio {match_principio.group(1)}"
            titulo = match_principio.group(2).strip()
        elif match_variacion:
            numero = f"Variación {match_variacion.group(1)}"
            titulo = match_variacion.group(2).strip()
        elif match_anexo:
            numero = match_anexo.group(1).strip()
            titulo = match_anexo.group(2).strip()
        elif match_num:
            numero = match_num.group(1).strip()
            titulo = match_num.group(2).strip()
        else:
            numero = clean_header.split()[0] if clean_header else "Sección"
            titulo = clean_header

        body = "\n".join(lines[1:]).strip()

        # Extraer campos estructurados si existen
        req_m = re.search(r"- \*\*(?:Requisito Oficial|Declaración|Definición Oficial):\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        requisito = req_m.group(1).strip() if req_m else ""

        int_m = re.search(r"- \*\*(?:Interpretación.+?|Aplicación.+?|Criterio OOMAPASC|Nota Clave):\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        interpretacion = int_m.group(1).strip() if int_m else ""

        evi_m = re.search(r"- \*\*Evidencia(?:s)? Objetiva(?:s)?(?: Requerida(?:s)?)?:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        evidencia = evi_m.group(1).strip() if evi_m else ""

        cri_m = re.search(r"- \*\*Criterio (?:Universal )?de Auditoría.+?:\*\*\s*(.+?)(?=\n- \*\*|\Z)", body, re.DOTALL)
        criterio = cri_m.group(1).strip() if cri_m else ""

        def _limpiar_etiquetas_area(t: str) -> str:
            if not t:
                return ""
            # Remover divisiones artificiales de áreas técnicas y administrativas
            t = re.sub(r"-\s*\*(?:Áreas\s+Técnicas|Área\s+Técnica|Técnica|Áreas\s+Administrativas|Área\s+Administrativa|Administrativa|General)\s*:\*\s*", "- ", t, flags=re.IGNORECASE)
            t = re.sub(r"-\s*\*\*(?:Áreas\s+Técnicas|Área\s+Técnica|Técnica|Áreas\s+Administrativas|Área\s+Administrativa|Administrativa|General)\s*:\*\*\s*", "- ", t, flags=re.IGNORECASE)
            return t.strip()

        interpretacion = _limpiar_etiquetas_area(interpretacion)
        evidencia = _limpiar_etiquetas_area(evidencia)
        criterio = _limpiar_etiquetas_area(criterio)

        if is_capitulo:
            # Es un Capítulo Principal (ej. 4. CONTEXTO, 5. LIDERAZGO, etc.)
            desc_cap = body.strip() if body else f"Capítulo oficial que establece los lineamientos normativos y requisitos institucionales de {titulo}."
            clausulas.append({
                "numero": numero,
                "titulo": titulo,
                "es_capitulo": True,
                "requisito": desc_cap,
                "interpretacion": "",
                "evidencia_objetiva": "",
                "criterio_auditoria": "",
                "texto_completo": body
            })
        else:
            if not requisito and not interpretacion:
                requisito = body[:800]

            clausulas.append({
                "numero": numero,
                "titulo": titulo,
                "es_capitulo": False,
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
                if filename in [
                    "iso_9001_2026.md",
                    "iso_42001_2023.md",
                    "iso_27001_2022.md",
                    "iso_9000_2015.md",
                    "iso_14001_2015.md",
                    "iso_45001_2018.md",
                    "iso_19011_2018.md"
                ]:
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
    
    # Prioridad: Calidad, IA, TI/Ciberseguridad, Glosario, Ambiental, SST, Auditorías
    orden_preferido = [
        "ISO-9001-2026",
        "ISO-42001-2023",
        "ISO-27001-2022",
        "ISO-9000-2015",
        "ISO-14001-2015",
        "ISO-45001-2018",
        "ISO-19011-2018"
    ]
    
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


def _normalizar_texto(txt: str) -> str:
    """Normaliza un texto quitando acentos y pasando a minúsculas."""
    if not txt:
        return ""
    txt = txt.lower()
    tabla = str.maketrans("áéíóúÁÉÍÓÚñÑüÜ", "aeiouaeiounnuu")
    return txt.translate(tabla)


def buscar_contexto_relevante(
    query: str,
    norma_id: Optional[str] = None,
    catalogo_documentos: Optional[List[Dict[str, Any]]] = None,
    catalogo_procesos: Optional[List[Dict[str, Any]]] = None,
    historial: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Busca cláusulas, guías de transición, procedimientos, formatos OOMRSC y extractos
    relevantes basados en términos clave, claves de documentos y contexto temático,
    expandiendo la búsqueda con el hilo de la conversación previa si la pregunta es referencial.
    """
    kb = _cargar_archivos_conocimiento()

    # Si la pregunta es corta o referencial ("ese registro", "no lo encuentro", etc.),
    # concatenar el contexto de los últimos turnos para no perder el tema
    busqueda_expandida = query
    if historial:
        ultimos = [m.get("content", "") for m in historial[-3:] if m.get("content")]
        if ultimos:
            busqueda_expandida = f"{' '.join(ultimos)} {query}"

    query_norm = _normalizar_texto(busqueda_expandida)
    query_lower = busqueda_expandida.lower()
    
    # Detección de intenciones temáticas
    es_pregunta_transicion = any(k in query_norm for k in [
        "cambio", "cambios", "diferencia", "diferencias", "2015", "2026",
        "transicion", "enmienda", "enmiendas", "novedad", "novedades",
        "versus", "vs", "evolucion", "actualizacion"
    ])

    es_pregunta_documental = any(k in query_norm for k in [
        "procedimiento", "formato", "formatos", "registro", "registros",
        "oomrsc", "oomrsc-20", "oomrsc-21", "mc-01", "pr-cal", "pr-mej", "pr-pot", "pr-aud",
        "reg-cloro", "trazabilidad", "impacto", "eliminar", "referencia", "referencias",
        "catalogo", "manual", "proceso", "procesos", "mapa", "interaccion"
    ])

    es_pregunta_ia = any(k in query_norm for k in [
        "ia", "inteligencia artificial", "algoritmo", "alucinaciones", "human-in-the-loop",
        "42001", "sgia", "modelo", "agente", "grounding", "explicabilidad", "sesgo"
    ])

    es_pregunta_ti = any(k in query_norm for k in [
        "seguridad de la informacion", "ciberseguridad", "27001", "ti", "rbac", "cifrado",
        "scada", "telemetria", "servidor", "vulnerabilidad", "privacidad",
        "pol-ti-01", "brecha", "drp", "bcp"
    ])

    es_pregunta_vocabulario = any(k in query_norm for k in [
        "vocabulario", "glosario", "9000", "definicion", "concepto", "principio",
        "principios", "correccion", "accion correctiva", "plan de mejora", "evidencia objetiva",
        "eficacia", "eficiencia", "parte interesada"
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
            num = str(cl.get("numero", ""))
            num_norm = _normalizar_texto(num)
            titulo_norm = _normalizar_texto(cl.get("titulo", ""))
            requisito_norm = _normalizar_texto(cl.get("requisito", ""))
            interpretacion_norm = _normalizar_texto(cl.get("interpretacion", ""))

            # Coincidencia exacta de número de cláusula
            if num in clausula_matches or num_norm in query_norm:
                score += 60
            
            # Palabras clave en título o contenido
            palabras = [w for w in re.split(r"\W+", query_norm) if len(w) > 3]
            for palabra in palabras:
                if palabra in titulo_norm:
                    score += 20
                if palabra in requisito_norm:
                    score += 10
                if palabra in interpretacion_norm:
                    score += 10

            # Boosting según intención temática
            if es_pregunta_ia and norma["id"] == "ISO-42001-2023":
                score += 50
            if es_pregunta_ti and norma["id"] == "ISO-27001-2022":
                score += 50
            if es_pregunta_vocabulario and norma["id"] == "ISO-9000-2015":
                score += 50
            if es_pregunta_transicion and num in ["4.1", "4.2", "6.1", "7.1.3", "7.5", "8.4", "9.2", "10.2"]:
                score += 30
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
        "clausulas": clausulas_relevantes[:5],
        "custom_snippets": custom_snippets[:2],
        "documentos_activos": docs_activos_relevantes[:3]
    }


def consultar_agente_iso(
    pregunta: str,
    norma_id: Optional[str] = None,
    historial: Optional[List[Dict[str, str]]] = None,
    catalogo_documentos: Optional[List[Dict[str, Any]]] = None,
    catalogo_procesos: Optional[List[Dict[str, Any]]] = None,
    usuario_contexto: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Ejecuta la consulta con el Agente ISO con Groundedness estricto en la documentación oficial,
    procedimientos, formatos, registros y estado operativo en tiempo real del usuario en OOMAPASC.
    Garantiza memoria conversacional multi-turno y previene alucinaciones documentales.
    """
    contexto = buscar_contexto_relevante(pregunta, norma_id, catalogo_documentos, catalogo_procesos, historial)
    clausulas = contexto["clausulas"]
    custom_snippets = contexto["custom_snippets"]
    documentos_activos = contexto.get("documentos_activos", [])

    # Construir bloque de conocimiento inyectado
    kb_text = "=== BASE DE CONOCIMIENTO OFICIAL ISO Y CONTROL DOCUMENTAL OOMAPASC ===\n\n"
    clausulas_citadas_meta = []

    # 0. Contexto Operativo en Tiempo Real del Usuario Logueado (si está presente)
    if usuario_contexto:
        u_nombre = usuario_contexto.get("nombre", "Usuario SGC")
        u_area = usuario_contexto.get("area", "Área Operativa")
        u_dir = usuario_contexto.get("direccion", "OOMAPASC")
        u_rol = usuario_contexto.get("rol", "Usuario")
        
        kb_text += "=== ESTADO OPERATIVO EN TIEMPO REAL DEL USUARIO Y SU ÁREA (SGC PORTAL) ===\n"
        kb_text += f"• Colaborador activo: {u_nombre} | Rol: {u_rol} | Área: {u_area} | Dirección: {u_dir}\n"
        
        # ACs
        acs = usuario_contexto.get("acciones_pendientes", [])
        borradores_ac = usuario_contexto.get("borradores_ac", [])
        kb_text += f"• Acciones Correctivas en seguimiento oficial del área (OOMRSC-20): {len(acs)}\n"
        for ac in acs[:8]:
            plazo = ac.get("fecha_limite") or ac.get("fechaCompromiso") or "Sin fecha límite"
            auditor = ac.get("auditor_asignado") or ac.get("auditor") or "Por asignar"
            kb_text += f"  - [{ac.get('folio', 'AC')}] Estado: {ac.get('estado')} | Causa: {ac.get('descripcion', '')[:90]} | Límite: {plazo} | Auditor: {auditor}\n"
        if borradores_ac:
            kb_text += f"• Borradores de AC en preparación (pendientes de enviar al SGC): {len(borradores_ac)}\n"
            for b in borradores_ac[:5]:
                kb_text += f"  - [BORRADOR] \"{b.get('titulo')}\" | Creado: {b.get('fecha_creacion', 'Reciente')} | Detalle: {b.get('descripcion', '')[:80]}\n"
            
        # PMs
        pms = usuario_contexto.get("planes_mejora_activos", [])
        kb_text += f"• Planes de Mejora activos del área (OOMRSC-21): {len(pms)}\n"
        for pm in pms[:8]:
            prox_alerta = " [⚠️ ALERTA: PRÓXIMO A VENCER]" if pm.get("es_proximo_vencer") else ""
            dias_rest = f" ({pm.get('dias_restantes')} días restantes)" if pm.get("dias_restantes") is not None else ""
            kb_text += f"  - [{pm.get('folio', 'PM')}] \"{pm.get('titulo', 'Plan de Mejora')}\" | Estado: {pm.get('estado')}{prox_alerta} | Término: {pm.get('fechaCompromiso') or pm.get('fecha_termino', 'Sin fecha')}{dias_rest} | Presupuesto: ${pm.get('presupuestoEstimado', 0):,.2f} | Avance: {pm.get('avance', 0)}%\n"

        # Indicadores
        inds = usuario_contexto.get("indicadores_area", [])
        inds_incumplidos = [i for i in inds if i.get("cumple") == "NO" or i.get("semaforo") in ["Crítico", "CRITICO", "rose"]]
        kb_text += f"• Indicadores del área en el Cuadro de Control (OOMRSC-05): {len(inds)} total ({len(inds_incumplidos)} INCUMPLIDOS/CRÍTICOS)\n"
        for ind in inds[:10]:
            sem_tag = "🔴 INCUMPLIDO / CRÍTICO (Requiere Reporte de Corrección RC o AC en OOMRSC-20)" if (ind.get("cumple") == "NO" or ind.get("semaforo") in ["Crítico", "CRITICO", "rose"]) else ("🟡 PREVENTIVO" if ind.get("semaforo") in ["Preventivo", "PREVENTIVO", "amber"] else "🟢 ACEPTABLE")
            kb_text += f"  - #{ind.get('numero', ind.get('id'))}: \"{ind.get('nombre')}\" | Meta: {ind.get('meta_anual') or ind.get('meta')} {ind.get('unidad')} | Real: {ind.get('valor_real', 'Sin captura')} | Semáforo: {sem_tag}\n"

        # Documentos antiguos sin revisar > 1 año (§ 7.5.3)
        docs_antiguos = usuario_contexto.get("documentos_antiguos_sin_revision", [])
        total_docs_antiguos = len(docs_antiguos)
        procs_ant = sum(1 for d in docs_antiguos if "procedimiento" in (d.get("tipo", "") or "").lower())
        regs_ant = sum(1 for d in docs_antiguos if any(k in (d.get("tipo", "") or "").lower() for k in ["registro", "formato"]))
        otros_ant = total_docs_antiguos - procs_ant - regs_ant

        kb_text += f"• Resumen de Documentos del área con MÁS DE 1 AÑO SIN REVISAR/ACTUALIZAR (§ 7.5.3): {total_docs_antiguos} total ({procs_ant} procedimientos, {regs_ant} registros/formatos, {otros_ant} otros).\n"

        # Documentos pendientes de aprobación SGC
        docs_aprob = usuario_contexto.get("documentos_pendientes_aprobacion", [])
        kb_text += f"• Documentos en borrador o revisión técnica pendientes por aprobar por el SGC: {len(docs_aprob)} documento(s).\n"

        # Formularios de Revisión por la Dirección pendientes
        rev_pend = usuario_contexto.get("formularios_revision_pendientes", [])
        if rev_pend:
            kb_text += f"• Formularios de Revisión por la Dirección (OOMRSC-04) pendientes en los primeros 10 días: {len(rev_pend)}\n"
            for rp in rev_pend:
                kb_text += f"  - [📅 OBLIGACIÓN MENSUAL DÍAS 1-10] {rp.get('nombre')} ({rp.get('codigo')})\n"
        kb_text += "\n"

    # 1. Catálogo Maestro de Documentos Registrados en OOMAPASC (Ground Truth Absoluto)
    docs_base = catalogo_documentos if (catalogo_documentos and len(catalogo_documentos) > 0) else [
        {"clave": "MC-01", "titulo": "Manual del Sistema de Gestión de Calidad", "tipo": "Manual", "version": "Rev. 04"},
        {"clave": "PR-CAL-01", "titulo": "Procedimiento de Acciones Correctivas y No Conformidades", "tipo": "Procedimiento", "version": "Rev. 06"},
        {"clave": "OOMRSC-20", "titulo": "Formato de Acción Correctiva", "tipo": "Registro", "version": "Rev. 18"},
        {"clave": "PR-MEJ-01", "titulo": "Procedimiento de Mejora Continua", "tipo": "Procedimiento", "version": "Rev. 03"},
        {"clave": "OOMRSC-21", "titulo": "Formato de Plan de Mejora Continua", "tipo": "Registro", "version": "Rev. 02"},
        {"clave": "PR-POT-01", "titulo": "Procedimiento Operativo de Potabilización y Cloración", "tipo": "Procedimiento", "version": "Rev. 05"},
        {"clave": "REG-CLORO-01", "titulo": "Bitácora Diaria de Cloro Residual en Red", "tipo": "Registro", "version": "Rev. 02"},
        {"clave": "PR-AUD-01", "titulo": "Procedimiento de Auditorías Internas de Calidad", "tipo": "Procedimiento", "version": "Rev. 04"},
        {"clave": "PR-CS-01", "titulo": "Procedimiento de Inspección y Suspensión de Servicios", "tipo": "Procedimiento", "version": "Rev. 02"},
        {"clave": "REG-CS-02", "titulo": "Padrón de Órdenes de Servicio y Reconexiones en Campo", "tipo": "Registro", "version": "Rev. 01"},
        {"clave": "PR-CS-03", "titulo": "Procedimiento de Verificación de Medidores y Facturación en Sitio", "tipo": "Procedimiento", "version": "Rev. 01"},
        {"clave": "OOMRSC-04", "titulo": "Revisión por la Dirección (Cláusula 9.3)", "tipo": "Registro", "version": "Rev. 09"},
        {"clave": "OOMRSC-05", "titulo": "Cuadro de Control de Desempeño (100 Indicadores)", "tipo": "Registro", "version": "Rev. 37"}
    ]

    kb_text += f"=== CATÁLOGO OFICIAL DE DOCUMENTOS VIGENTES EN EL PORTAL SGC DE OOMAPASC ({len(docs_base)} DOCUMENTOS) ===\n"
    kb_text += "[AVISO AUDITABLE: Esta lista contiene TODOS los documentos que existen en el portal. Si un código o documento no está aquí, NO EXISTE en OOMAPASC].\n"
    for d in docs_base:
        kb_text += f"• [{d.get('clave', 'SGC')}] \"{d.get('titulo', 'Documento')}\" | Tipo: {d.get('tipo', 'N/A')} | Versión: {d.get('version', 'Vigente')}\n"
    kb_text += "\n"

    # 2. Documentos Internos y Guías Estructuradas (.md)
    if custom_snippets:
        kb_text += "=== PROCEDIMIENTOS Y REGISTROS INSTITUCIONALES (.MD) ===\n"
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
        "Eres el Asesor Normativo y Consultor de Calidad en el Portal SGC de OOMAPASC (Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme).\n\n"
        "REGLA DE ORO DE VERACIDAD Y RIGOR AUDITABLE (CERO ALUCINACIONES):\n"
        "- En auditorías de certificación ISO 9001:2015, inventar documentos o códigos es una No Conformidad Grave.\n"
        "- Los ÚNICOS formatos institucionales codificados como OOMRSC- en OOMAPASC son:\n"
        "  • OOMRSC-04: Revisión por la Dirección (ISO 9001 § 9.3)\n"
        "  • OOMRSC-05: Cuadro de Control de Desempeño (100 indicadores oficiales)\n"
        "  • OOMRSC-20: Control de Acciones Correctivas (ISO 9001 § 10.2)\n"
        "  • OOMRSC-21: Plan de Mejora Continua (ISO 9001 § 10.3)\n"
        "- ACCIONES CORRECTIVAS Y PLANES DE MEJORA (OOMRSC-20 y OOMRSC-21):\n"
        "  • NUNCA inventes folios de acciones correctivas ficticios (como números largos de timestamp AC#1791...).\n"
        "  • Un borrador no ratificado (BORRADOR) NO es una acción correctiva en seguimiento oficial. Si existen borradores, preséntalos como 'Borradores pendientes de ratificación / envío' aclarando que aún están en preparación y no tienen folio asignado.\n"
        "  • Si el estado operativo del área indica 0 acciones pendientes y 0 borradores, indícalo de forma directa y natural: 'No tienes acciones correctivas abiertas ni borradores pendientes en tu área.' (Evita frases acartonadas o redundantes como 'todos los folios institucionales están concluidos o en regla').\n"
        "  • Si el usuario te señala que no existe esa acción correctiva o que se está inventando información, RECONOCE EL ERROR DE INMEDIATO con humildad y honestidad: aclara que se trató de un borrador local no ratificado y confirma de inmediato que en el seguimiento institucional oficial no existe tal acción correctiva.\n"
        "- CATÁLOGO MAESTRO Y VERIFICACIÓN DOCUMENTAL:\n"
        "  • ANTES de afirmar que un documento o formato existe en OOMAPASC, VERIFICA OBLIGATORIAMENTE la sección 'CATÁLOGO OFICIAL DE DOCUMENTOS VIGENTES' incluida abajo.\n"
        "  • Si el usuario te pregunta por un registro, formato o documento que NO está en dicha lista (ej. padrón de proveedores, formato de capacitación, OOMRSC-12):\n"
        "    1. Di la verdad con total honestidad y claridad: 'En el catálogo oficial actual del SGC de OOMAPASC no existe un formato o registro codificado con ese nombre.'\n"
        "    2. Explica brevemente cómo lo aborda la norma (ej. ISO 9001 § 8.4) sin inventar carpetas ni códigos ficticios.\n\n"
        "MEMORIA Y SEGUIMIENTO DEL HILO DE LA CONVERSACIÓN:\n"
        "- Pon atención estricta a los mensajes previos del diálogo.\n"
        "- Si el usuario te replica 'no lo encuentro', 'busco ese registro y no existe', etc., se refiere INMEDIATAMENTE a lo que acaban de hablar en el mensaje anterior.\n"
        "- Si en un mensaje previo se mencionó erróneamente un código o documento inexistente (ej. OOMRSC-12 o Padrón de Proveedores), RECONÓCELO DE INMEDIATO con amabilidad: 'Tienes toda la razón y te ofrezco una disculpa. Revisando el catálogo oficial del portal, efectivamente no existe dicho registro en el sistema...'\n"
        "- NUNCA vuelvas a preguntar '¿cuál registro buscas?' ni des instrucciones genéricas de búsqueda cuando el tema ya está claro en la plática.\n"
        "- Sé conciso, directo al grano y no agregues explicaciones excesivas que el usuario no solicitó.\n\n"
        "PERSONALIDAD Y ESTILO:\n"
        "- Eres profesional, empático, claro y honesto.\n"
        "- Si el usuario te saluda o pregunta cómo lo ayudas, explica tus funciones con calidez sin usar tablas.\n"
        "- No agregues al final listas de cláusulas si el usuario no las pidió."
    )

    full_system = f"{system_prompt}\n\n{kb_text}"

    messages = [
        {"role": "system", "content": full_system}
    ]

    # Incorporar hasta 8 mensajes del historial previo para mantener el hilo perfecto
    if historial:
        for msg in historial[-8:]:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": pregunta})

    # Llamar al modelo de chat
    client = get_ai_client()
    model = get_chat_model()

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=1200,
        )
        raw_response = completion.choices[0].message.content or ""
        clean_response = re.sub(r"<think>.*?</think>", "", raw_response, flags=re.DOTALL).strip()
        if not clean_response:
            clean_response = re.sub(r"</?think>", "", raw_response).strip()
        if not clean_response:
            clean_response = "En el catálogo oficial del SGC de OOMAPASC no se encuentra registrado dicho formato o documento. Por favor verifica en el catálogo de Control Documental o consulta con la Coordinación del SGC."

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
