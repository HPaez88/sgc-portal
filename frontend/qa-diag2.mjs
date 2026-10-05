// Diagnóstico fino: por qué el textarea de la vista móvil mide 0.
export default async function run(page, ui) {
  const out = {};

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) {
    await ui.click(ref[1]);
    await page.waitForTimeout(2000);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1500);

  out.detalle = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const primerArticle = articles[0];
    const ta = primerArticle?.querySelector('textarea');
    const contenedor = primerArticle?.parentElement;

    const rectDe = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        ancho: Math.round(r.width),
        alto: Math.round(r.height),
        display: cs.display,
        visibility: cs.visibility,
        heightStyle: el.style.height || '(sin style inline)',
        minHeight: cs.minHeight,
        offsetParent: el.offsetParent ? el.offsetParent.tagName : null,
        clientRects: el.getClientRects().length,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    };

    return {
      totalArticles: articles.length,
      rectArticle: rectDe(primerArticle),
      rectTextarea: rectDe(ta),
      rectContenedor: rectDe(contenedor),
      contenedorClase: contenedor ? (contenedor.className || '').toString().slice(0, 100) : null,
      // ¿Cuál es el padre que decide la visibilidad?
      cadenaDePadres: (() => {
        const cadena = [];
        let el = ta;
        while (el && cadena.length < 8) {
          const cs = getComputedStyle(el);
          cadena.push({
            tag: el.tagName,
            display: cs.display,
            ancho: Math.round(el.getBoundingClientRect().width),
            clase: (el.className || '').toString().slice(0, 55),
          });
          el = el.parentElement;
        }
        return cadena;
      })(),
    };
  });

  return out;
}