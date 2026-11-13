// IA que sugiere riesgos y oportunidades de un área (etapa 2, 2026-11-13).
// Solo sugiere: el área elige cuáles agregar y luego los edita. Lógica pura (sin red) para poder probarla.
import { CONTEXTOS, ESCALAS, TRATAMIENTOS, CLAVE_MATRIZ, puntaje } from './riesgos';

export const MAX_SUGERENCIAS = 8;
const IMPACTOS = ESCALAS.Riesgo.impacto.map(([v]) => v); // 2, 4, 6, 8, 10
const recorta = (t, n) => String(t || '').trim().slice(0, n);

export function promptSugerencias({ area, direccion, proposito, procesos = [], indicadores = [], noConformidades = [], anteriores = [], existentes = [], anio }) {
  const lista = (arr, f) => (arr.length ? arr.map(f).join('\n') : '- (sin datos)');
  return `Eres el asesor del Sistema de Gestión de Calidad ISO 9001:2015 (cláusula 6.1) de OOMAPAS de Cajeme, organismo operador de agua potable, alcantarillado y saneamiento en Ciudad Obregón, Sonora.
Propón riesgos y oportunidades para la matriz ${CLAVE_MATRIZ} ${anio} del área "${area}" (${direccion || 'sin dirección'}).

PROPÓSITO DEL ÁREA: ${proposito || '(no capturado; dedúcelo del nombre del área y sus indicadores)'}
PROCESOS DEL SGC PERMITIDOS: ${procesos.join(' | ')}
INDICADORES DEL ÁREA:
${lista(indicadores, (i) => `- #${i.id} ${recorta(i.nombre, 120)} (meta ${i.meta ?? '-'} ${i.unidad || ''})`)}
NO CONFORMIDADES / ACCIONES CORRECTIVAS RECIENTES DEL ÁREA:
${lista(noConformidades, (n) => `- ${recorta(n, 200)}`)}
RIESGOS Y OPORTUNIDADES DEL AÑO ANTERIOR (para dar continuidad o mostrar avance):
${lista(anteriores, (r) => `- ${r.tipo}: ${recorta(r.descripcion, 140)} (nivel ${puntaje(r)})`)}
YA CAPTURADOS ESTE AÑO (NO los repitas):
${lista(existentes, (r) => `- ${r.tipo}: ${recorta(r.descripcion, 140)}`)}

Reglas:
- Entre 4 y ${MAX_SUGERENCIAS} propuestas en total, mezclando riesgos y oportunidades, concretas para esta área de OOMAPASC (nada genérico).
- "contexto" debe ser exactamente uno de: ${CONTEXTOS.join(' | ')}. "resultado" explica qué se observó en ese contexto (p. ej. el indicador que no cumplió, la no conformidad, el requisito de la parte interesada).
- "proceso" debe ser exactamente uno de los PROCESOS DEL SGC PERMITIDOS.
- "impacto" uno de 2, 4, 6, 8, 10 y "probabilidad" de 1 a 5 (escala ${CLAVE_MATRIZ}: nivel = impacto × probabilidad; bajo 0-19, medio 20-29, alto 30-50).
- "tratamiento": para riesgo uno de ${TRATAMIENTOS.Riesgo.join(', ')}; para oportunidad uno de ${TRATAMIENTOS.Oportunidad.join(', ')}.
- "plan": 1 a 3 actividades verificables con "actividad", "responsable" (puesto, no nombre de persona) y "evidencia_esperada".
- Español de México, redacción breve.

Responde SOLO con JSON válido:
{"sugerencias":[{"tipo":"Riesgo|Oportunidad","contexto":"","resultado":"","proceso":"","descripcion":"","causa":"","consecuencia":"","impacto":6,"probabilidad":3,"tratamiento":"","plan":[{"actividad":"","responsable":"","evidencia_esperada":""}],"justificacion":""}]}`;
}

// En empate se redondea hacia arriba (más prudente para un riesgo).
const masCercano = (v, opciones) => opciones.reduce((a, b) => (Math.abs(b - v) <= Math.abs(a - v) ? b : a));
const igualSinAcentos = (a, b) => String(a).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  === String(b).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Valida y corrige lo que responde la IA; descarta lo que no sirve (sin descripción, repetido, contexto inventado).
export function normalizarSugerencias(respuesta, { procesos = [], existentes = [] } = {}) {
  const crudas = Array.isArray(respuesta?.sugerencias) ? respuesta.sugerencias : (Array.isArray(respuesta) ? respuesta : []);
  const vistas = new Set(existentes.map((r) => String(r.descripcion || '').toLowerCase().trim()));
  const out = [];
  for (const s of crudas) {
    const tipo = /oportun/i.test(s?.tipo) ? 'Oportunidad' : 'Riesgo';
    const descripcion = recorta(s?.descripcion, 400);
    const clave = descripcion.toLowerCase();
    const contexto = CONTEXTOS.find((c) => igualSinAcentos(c, s?.contexto));
    if (!descripcion || !contexto || vistas.has(clave)) continue;
    vistas.add(clave);
    const impacto = masCercano(Number(s?.impacto) || 6, IMPACTOS);
    const pr = Number(s?.probabilidad);
    const probabilidad = Number.isFinite(pr) && s?.probabilidad !== '' && s?.probabilidad != null ? Math.min(5, Math.max(1, Math.round(pr))) : 3;
    const tratamiento = TRATAMIENTOS[tipo].find((t) => igualSinAcentos(t, s?.tratamiento)) || TRATAMIENTOS[tipo][0];
    out.push({
      tipo, contexto, descripcion, impacto, probabilidad, tratamiento,
      contexto_resultado: recorta(s?.resultado, 400),
      proceso: procesos.find((p) => igualSinAcentos(p, s?.proceso)) || '',
      causa: recorta(s?.causa, 400),
      consecuencia: recorta(s?.consecuencia, 400),
      justificacion: recorta(s?.justificacion, 400),
      plan: (Array.isArray(s?.plan) ? s.plan : []).slice(0, 3)
        .map((a) => ({ actividad: recorta(a?.actividad, 300), responsable: recorta(a?.responsable, 120), evidencia_esperada: recorta(a?.evidencia_esperada, 200), fecha_termino_sugerida: '' }))
        .filter((a) => a.actividad),
    });
    if (out.length >= MAX_SUGERENCIAS) break;
  }
  return out;
}
