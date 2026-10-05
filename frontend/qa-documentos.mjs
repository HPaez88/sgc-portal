// QA específico del módulo de Control Documental (Fase 2 + puente a AC).
export default async function run(page, ui) {
  const out = {};

  const irAModulo = async (patron) => {
    await page.waitForTimeout(300);
    const actual = await ui.snapshot();
    const ref = actual.match(new RegExp(`@(e\\d+) \\w+ "[^"]*${patron}[^"]*"`));
    if (!ref) return `no encontrado: ${patron}`;
    await ui.click(ref[1]);
    await page.waitForTimeout(1800);
    return 'ok';
  };

  out.nav = await irAModulo('Control Documental');

  let snap = await ui.snapshot({ full: true });
  out.vistaCatalogo = {
    encabezado: snap.includes('Control Documental'),
    iso: snap.includes('7.5.3'),
    exportarMatriz: snap.includes('Exportar Matriz'),
    nuevoDocumento: snap.includes('Nuevo Documento'),
    contadorCatalogo: /Catálogo \(\d+\)/.test(snap),
  };

  // ── Pestaña Matriz de Trazabilidad ──
  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Matriz de Trazabilidad[^"]*"/);
  if (refMatriz) {
    await ui.click(refMatriz[1]);
    await page.waitForTimeout(1200);
    const m = await ui.snapshot({ full: true });
    out.vistaMatriz = {
      encabezado: m.includes('Matriz Cruzada') || m.includes('Matriz de Trazabilidad'),
      totalMapeados: /Total Documentos|documentos/.test(m),
      columnas: m.includes('Aguas Arriba') || m.includes('Clave'),
      paginacion: m.includes('Página') || m.includes('Siguiente') || m.includes('Anterior'),
    };
  } else {
    out.vistaMatriz = 'no se encontró el botón de matriz';
  }

  // ── Volver al catálogo y abrir una tarjeta ──
  const refCatalogo = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Catálogo[^"]*"/);
  if (refCatalogo) {
    await ui.click(refCatalogo[1]);
    await page.waitForTimeout(1000);
  }

  // ── Verificar que las tarjetas de documento renderizan ──
  const c = await ui.snapshot({ full: true });
  out.tarjetas = {
    hayClaves: /MC-01|OOMRSC-20|PR-CAL-01/.test(c),
    hayImpacto: /CRÍTICO|ALTO|BAJO/.test(c),
    hayCitas: /Citado en|Sin citas/.test(c),
  };

  return out;
}