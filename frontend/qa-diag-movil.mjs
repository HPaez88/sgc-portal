// Diagnóstico: por qué no aparecen las tarjetas de riesgo en móvil.
export default async function run(page, ui) {
  const out = {};

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) {
    await ui.click(ref[1]);
    await page.waitForTimeout(2000);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);

  out.diagnostico = await page.evaluate(() => {
    const ancho = window.innerWidth;

    // ¿Existe el contenedor de tarjetas?
    const contTarjetas = document.querySelector('.lg\\:hidden.divide-y');
    const contTabla = document.querySelector('.hidden.lg\\:block');

    // El div que se desborda
    const desbordados = Array.from(document.querySelectorAll('div'))
      .filter(el => el.getBoundingClientRect().right > ancho + 2)
      .map(el => ({
        clase: (el.className || '').toString().slice(0, 80),
        right: Math.round(el.getBoundingClientRect().right),
        ancho: Math.round(el.getBoundingClientRect().width),
        hijos: el.children.length,
        texto: (el.innerText || '').slice(0, 60),
      }))
      .slice(0, 6);

    return {
      anchoVentana: ancho,
      existeContenedorTarjetas: !!contTarjetas,
      displayContenedorTarjetas: contTarjetas ? getComputedStyle(contTarjetas).display : null,
      existeContenedorTabla: !!contTabla,
      displayContenedorTabla: contTabla ? getComputedStyle(contTabla).display : null,
      totalTextareas: document.querySelectorAll('textarea').length,
      totalArticles: document.querySelectorAll('article').length,
      desbordados,
    };
  });

  // Navegar de nuevo en móvil para forzar el render de la vista
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForTimeout(500);
  const snap2 = await ui.snapshot();
  const refDash = snap2.match(/@(e\d+) \w+ "[^"]*Panel Principal[^"]*"/);
  if (refDash) {
    await ui.click(refDash[1]);
    await page.waitForTimeout(1200);
  }
  const snap3 = await ui.snapshot();
  const refRiesgos = snap3.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (refRiesgos) {
    await ui.click(refRiesgos[1]);
    await page.waitForTimeout(1500);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);

  out.trasRenavegar = await page.evaluate(() => ({
    totalTextareas: document.querySelectorAll('textarea').length,
    totalArticles: document.querySelectorAll('article').length,
    textoPrimerArticle: document.querySelector('article')?.innerText?.slice(0, 120) || null,
    anchoPrimerTextarea: (() => {
      const t = document.querySelector('textarea');
      return t ? Math.round(t.getBoundingClientRect().width) : null;
    })(),
    altoPrimerTextarea: (() => {
      const t = document.querySelector('textarea');
      return t ? Math.round(t.getBoundingClientRect().height) : null;
    })(),
  }));

  return out;
}