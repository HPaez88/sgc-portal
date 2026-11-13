// Análisis FODA por área (2026-11-14): se guarda en la ficha del área del catálogo (areasDetalle[].foda)
// y la IA lo usa como referencia para sugerir riesgos y oportunidades. El SGC lo revisa con cada área.
export const CUADRANTES = [
  { id: 'fortalezas', titulo: 'Fortalezas', ayuda: 'Internas · lo que el área hace bien', color: 'border-emerald-300 bg-emerald-50/60', texto: 'text-emerald-900' },
  { id: 'oportunidades', titulo: 'Oportunidades', ayuda: 'Externas · lo que puede aprovechar', color: 'border-sky-300 bg-sky-50/60', texto: 'text-sky-900' },
  { id: 'debilidades', titulo: 'Debilidades', ayuda: 'Internas · lo que limita al área', color: 'border-amber-300 bg-amber-50/60', texto: 'text-amber-900' },
  { id: 'amenazas', titulo: 'Amenazas', ayuda: 'Externas · lo que puede afectarla', color: 'border-rose-300 bg-rose-50/60', texto: 'text-rose-900' },
];

export const FODA_VACIO = { fortalezas: [], oportunidades: [], debilidades: [], amenazas: [] };

// Acepta arreglos o texto (un punto por renglón); quita vacíos y viñetas.
export function normalizarFoda(foda) {
  const out = { ...FODA_VACIO };
  CUADRANTES.forEach(({ id }) => {
    const v = foda?.[id];
    const lista = Array.isArray(v) ? v : String(v || '').split('\n');
    out[id] = lista.map((x) => String(x).replace(/^\s*[-•*·\d.)]+\s*/, '').trim()).filter(Boolean).slice(0, 15);
  });
  return out;
}

export const fodaVacio = (foda) => CUADRANTES.every(({ id }) => !(foda?.[id] || []).length);

// Texto para el prompt de la IA (sugerencias de riesgos y oportunidades).
export function fodaParaPrompt(foda) {
  if (!foda || fodaVacio(foda)) return '- (sin FODA capturado)';
  return CUADRANTES.map(({ id, titulo }) => `${titulo}: ${(foda[id] || []).join('; ') || '—'}`).join('\n');
}
