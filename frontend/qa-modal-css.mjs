// Inspecciona el CSS computado del modal para encontrar por qué no se aplica max-height.
export default async function run(page, ui) {
  await page.setViewportSize({ width: 1366, height: 700 });
  await page.waitForTimeout(500);

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) { await ui.click(ref[1]); await page.waitForTimeout(2000); }

  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Matriz por área[^"]*"/);
  if (refMatriz) { await ui.click(refMatriz[1]); await page.waitForTimeout(900); }
  await page.selectOption('#selector-area-riesgos', { index: 1 }).catch(() => { });
  await page.waitForTimeout(1200);

  const snapB = await ui.snapshot();
  const refN = snapB.match(/@(e\d+) button "[^"]*Nuevo Registro[^"]*"/);
  if (refN) { await ui.click(refN[1]); await page.waitForTimeout(1200); }

  return await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'sin dialog' };

    // El hijo directo del backdrop es el contenedor flex; su hijo es la tarjeta
    const contenedorFlex = dialog.firstElementChild;
    const tarjeta = contenedorFlex?.firstElementChild;

    const info = (el, nombre) => {
      if (!el) return { nombre, ausente: true };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        nombre,
        tag: el.tagName,
        clase: (el.className || '').toString(),
        alto: Math.round(r.height),
        maxHeight: cs.maxHeight,
        minHeight: cs.minHeight,
        height: cs.height,
        display: cs.display,
        flexDirection: cs.flexDirection,
        overflow: cs.overflow,
        // ¿Tiene hijos que lo estiren?
        hijos: el.children.length,
      };
    };

    return {
      altoVista: window.innerHeight,
      dialog: info(dialog, 'backdrop'),
      contenedorFlex: info(contenedorFlex, 'contenedor-flex'),
      tarjeta: info(tarjeta, 'tarjeta-modal'),
      // Clases de Tailwind disponibles para max-h en el CSS generado
      utilidadesMaxH: (() => {
        const encontradas = [];
        for (const hoja of document.styleSheets) {
          try {
            for (const regla of hoja.cssRules || []) {
              const sel = regla.selectorText || '';
              if (sel.includes('max-h-\\[calc\\(100dvh')) encontradas.push(sel);
            }
          } catch { /* hoja cross-origin */ }
        }
        return encontradas;
      })(),
    };
  });
}