// Verifica que el ejercicio siguiente (2027) esté disponible en ambos selectores.
export default async function run(page, ui) {
  const out = {};

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) {
    await ui.click(ref[1]);
    await page.waitForTimeout(2200);
  }

  // ── Dashboard: opciones del selector de ejercicio ──
  out.dashboardAnios = await page.evaluate(() => {
    const sel = document.querySelector('#selector-anio-riesgos');
    if (!sel) return null;
    return {
      valorActual: sel.value,
      opciones: Array.from(sel.options).map(o => ({ valor: o.value, texto: o.textContent.trim() })),
    };
  });

  // Seleccionar 2027 en el dashboard
  if (out.dashboardAnios?.opciones.some(o => o.valor === '2027')) {
    await page.selectOption('#selector-anio-riesgos', '2027');
    await page.waitForTimeout(1400);
    out.dashboard2027 = await page.evaluate(() => {
      const textos = Array.from(document.querySelectorAll('p, h3')).map(e => e.innerText.trim());
      return {
        avanceMuestra2027: textos.some(t => t.includes('2026') === false && t.includes('Avance del ejercicio')),
        tituloAvance: textos.find(t => t.startsWith('Avance del ejercicio')) || null,
        areasSinIniciar: (() => {
          const i = textos.findIndex(t => t === 'Áreas sin iniciar');
          return i >= 0 ? textos[i + 2] : null;
        })(),
        hayRegistros: textos.some(t => t.includes('registros')),
      };
    });
  }

  // ── Matriz: opciones del selector de ejercicio ──
  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Matriz por área[^"]*"/);
  if (refMatriz) {
    await ui.click(refMatriz[1]);
    await page.waitForTimeout(1000);
  }

  // Seleccionar un área
  await page.selectOption('#selector-area-riesgos', { index: 1 }).catch(() => { });
  await page.waitForTimeout(1400);

  out.matrizAnios = await page.evaluate(() => {
    const sel = document.querySelector('#selector-anio-matriz');
    if (!sel) return null;
    return {
      valorActual: sel.value,
      opciones: Array.from(sel.options).map(o => o.value),
    };
  });

  return out;
}