// Síntesis estratégica por dirección y por organismo (2026-11-14): la IA toma los FODA de las áreas
// (o de las direcciones) y las matrices de riesgos del año y propone SOLO lo más importante:
// FODA consolidado, riesgos y oportunidades prioritarios de todos los niveles y un plan con líneas de acción.
// El SGC lo revisa y edita; se guarda por año. Lógica pura (probada).
import { CUADRANTES, normalizarFoda, fodaParaPrompt } from './foda';
import { nivelDe, puntaje } from './riesgos';

export const MAX_POR_CUADRANTE = 5;
export const MAX_RIESGOS = 8;
export const MAX_OPORTUNIDADES = 5;
export const MAX_LINEAS = 6;
const NIVELES = ['Alto', 'Medio', 'Bajo'];
const recorta = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);

// Insumos de una dirección: FODA de cada área y sus registros de la matriz del año (los más altos primero).
export function insumosDireccion({ areas = [], riesgos = [], anio }) {
  return areas.map((a) => ({
    nombre: a.nombre,
    foda: a.foda,
    registros: riesgos
      .filter((r) => r.area === a.nombre && Number(r.anio) === Number(anio) && r.descripcion)
      .sort((x, y) => puntaje(y) - puntaje(x))
      .slice(0, 12)
      .map((r) => ({ tipo: r.tipo, descripcion: recorta(r.descripcion, 160), nivel: nivelDe(r)?.nivel || 'Sin evaluar', puntaje: puntaje(r) })),
  }));
}

export function promptSintesis({ nivel, nombre, anio, unidades = [] }) {
  const esOrganismo = nivel === 'organismo';
  const bloques = unidades.map((u) => `### ${u.nombre}
${fodaParaPrompt(u.foda)}
${(u.registros || []).length ? `Matriz ${anio}:\n${u.registros.map((r) => `- ${r.tipo} (${r.nivel}${r.puntaje ? ` ${r.puntaje}` : ''}): ${r.descripcion}`).join('\n')}` : `Matriz ${anio}: sin registros`}`).join('\n\n');
  return `Eres el asesor del Sistema de Gestión de Calidad ISO 9001:2015 (§ 4.1 contexto y § 6.1 riesgos) de OOMAPAS de Cajeme.
Arma la síntesis ${esOrganismo ? 'del ORGANISMO a partir de sus direcciones' : `de la ${nombre} a partir de sus áreas`} para ${anio}.
No copies todo: elige solo lo más importante para un informe a la dirección. Combina puntos repetidos entre ${esOrganismo ? 'direcciones' : 'áreas'}.

${bloques || '(sin información de las unidades)'}

Reglas:
- FODA consolidado: máximo ${MAX_POR_CUADRANTE} puntos por cuadrante, los de mayor peso.
- Riesgos prioritarios: máximo ${MAX_RIESGOS}, de cualquier nivel (Alto, Medio, Bajo), indicando qué ${esOrganismo ? 'direcciones' : 'áreas'} involucra y por qué importa.
- Oportunidades prioritarias: máximo ${MAX_OPORTUNIDADES}.
- Plan: máximo ${MAX_LINEAS} líneas de acción, cada una con objetivo, 1 a 3 acciones concretas, responsable sugerido (${esOrganismo ? 'dirección' : 'área o la dirección'}), plazo (trimestre) y qué riesgos u oportunidades atiende.
- Español de México, redacción breve. No inventes datos que no estén arriba.
Responde SOLO con JSON válido:
{"foda":{"fortalezas":[""],"oportunidades":[""],"debilidades":[""],"amenazas":[""]},
 "riesgos":[{"descripcion":"","nivel":"Alto|Medio|Bajo","unidades":[""],"razon":""}],
 "oportunidades":[{"descripcion":"","unidades":[""],"razon":""}],
 "plan":[{"tema":"","objetivo":"","acciones":[""],"responsable":"","plazo":"T1","atiende":""}],
 "conclusion":""}`;
}

export function normalizarSintesis(datos) {
  const d = datos && typeof datos === 'object' ? datos : {};
  const lista = (v) => (Array.isArray(v) ? v : []);
  const foda = normalizarFoda(d.foda);
  CUADRANTES.forEach(({ id }) => { foda[id] = foda[id].map((x) => recorta(x, 220)).slice(0, MAX_POR_CUADRANTE); });
  return {
    foda,
    riesgos: lista(d.riesgos).map((r) => ({
      descripcion: recorta(r?.descripcion, 300),
      nivel: NIVELES.find((n) => n.toLowerCase() === String(r?.nivel || '').toLowerCase()) || 'Medio',
      unidades: lista(r?.unidades).map((u) => recorta(u, 80)).filter(Boolean).slice(0, 8),
      razon: recorta(r?.razon, 300),
    })).filter((r) => r.descripcion).slice(0, MAX_RIESGOS),
    oportunidades: lista(d.oportunidades).map((o) => ({
      descripcion: recorta(o?.descripcion, 300),
      unidades: lista(o?.unidades).map((u) => recorta(u, 80)).filter(Boolean).slice(0, 8),
      razon: recorta(o?.razon, 300),
    })).filter((o) => o.descripcion).slice(0, MAX_OPORTUNIDADES),
    plan: lista(d.plan).map((l) => ({
      tema: recorta(l?.tema, 120),
      objetivo: recorta(l?.objetivo, 300),
      acciones: lista(l?.acciones).map((a) => recorta(a, 200)).filter(Boolean).slice(0, 3),
      responsable: recorta(l?.responsable, 120),
      plazo: recorta(l?.plazo, 30),
      atiende: recorta(l?.atiende, 300),
    })).filter((l) => l.tema || l.objetivo).slice(0, MAX_LINEAS),
    conclusion: recorta(d.conclusion, 800),
  };
}

export const SINTESIS_VACIA = { foda: normalizarFoda({}), riesgos: [], oportunidades: [], plan: [], conclusion: '' };

// Insumos del organismo: por dirección, su síntesis guardada (si existe) o el FODA de sus áreas combinado,
// y sus registros del año de mayor nivel.
export function insumosOrganismo({ direcciones = [], unidades = [], riesgos = [], anio, sintesisDe = () => null }) {
  return direcciones.map((dir) => {
    const propias = unidades.filter((u) => u.direccion === dir);
    const guardada = sintesisDe(dir);
    const foda = guardada?.foda || CUADRANTES.reduce((acc, { id }) => ({
      ...acc, [id]: propias.flatMap((u) => (u.foda?.[id] || []).slice(0, 2)).slice(0, 8),
    }), {});
    const registros = insumosDireccion({ areas: propias, riesgos, anio }).flatMap((u) => u.registros)
      .sort((a, b) => b.puntaje - a.puntaje).slice(0, 12);
    return { nombre: dir, foda, registros };
  });
}
