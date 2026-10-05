// Captura el módulo de Riesgos para verificar el nuevo reparto de anchos.
export default async function run(page, ui) {
  await page.waitForTimeout(500);
  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Matriz de Riesgos[^"]*"/)
    || snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (!ref) return { error: 'no se encontró el módulo', snap };

  await ui.click(ref[1]);
  await page.waitForTimeout(2000);

  // Medir el ancho real de cada columna para comprobar el reparto.
  const anchos = await page.evaluate(() => {
    const tabla = document.querySelector('table');
    if (!tabla) return null;
    const ths = Array.from(tabla.querySelectorAll('thead th'));
    const total = tabla.getBoundingClientRect().width;
    return {
      anchoTabla: Math.round(total),
      columnas: ths.map((th) => ({
        titulo: th.innerText.trim(),
        ancho: Math.round(th.getBoundingClientRect().width),
        porcentaje: Math.round((th.getBoundingClientRect().width / total) * 100),
      })),
      textareaAlto: (() => {
        const ta = document.querySelector('textarea');
        return ta ? Math.round(ta.getBoundingClientRect().height) : null;
      })(),
      scrollHorizontal: document.querySelector('.overflow-x-auto')?.scrollWidth > document.querySelector('.overflow-x-auto')?.clientWidth,
    };
  });

  return { anchos };
}