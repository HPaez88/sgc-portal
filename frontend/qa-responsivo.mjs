// Verifica la responsividad del módulo de Riesgos: sin scroll horizontal
// ni vertical interno, y con el Plan de Acción a ancho completo.
export default async function run(page, ui) {
  const out = {};

  const irAModulo = async (patron) => {
    await page.waitForTimeout(400);
    const snap = await ui.snapshot();
    const ref = snap.match(new RegExp(`@(e\\d+) \\w+ "[^"]*${patron}[^"]*"`));
    if (!ref) return 'no encontrado';
    await ui.click(ref[1]);
    await page.waitForTimeout(1600);
    return 'ok';
  };

  // Navegar primero en el viewport por defecto, antes de redimensionar:
  // los refs mueren al cambiar el tamaño, así que el clic debe ocurrir antes.
  out.nav = await irAModulo('Riesgos');

  // ── MÓVIL (375×667) ──
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(900);

  out.movil = await page.evaluate(() => {
    const contenedor = document.querySelector('main');
    const body = document.body;
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const primerTexto = textareas[0];
    const anchoVista = window.innerWidth;

    return {
      anchoVentana: anchoVista,
      // ¿Hay desbordamiento horizontal en el documento?
      scrollHorizontalPagina: body.scrollWidth > anchoVista + 1,
      anchoScrollBody: body.scrollWidth,
      // ¿Algún elemento se sale del viewport?
      elementosDesbordados: Array.from(document.querySelectorAll('table, div, textarea'))
        .filter(el => el.getBoundingClientRect().right > anchoVista + 2)
        .map(el => `${el.tagName}.${(el.className || '').toString().slice(0, 40)}`)
        .slice(0, 5),
      // ¿Se ve la tabla (escritorio) o las tarjetas (móvil)?
      tablaVisible: (() => {
        const t = document.querySelector('table');
        return t ? getComputedStyle(t.closest('div')).display !== 'none' : false;
      })(),
      // Altura y ancho del plan de acción
      planAccion: primerTexto ? {
        ancho: Math.round(primerTexto.getBoundingClientRect().width),
        alto: Math.round(primerTexto.getBoundingClientRect().height),
        scrollInterno: primerTexto.scrollHeight > primerTexto.clientHeight + 2,
        porcentajeDelAncho: Math.round((primerTexto.getBoundingClientRect().width / anchoVista) * 100),
      } : null,
      // ¿El contenedor principal tiene scroll horizontal?
      contenedorScrollH: contenedor ? contenedor.scrollWidth > contenedor.clientWidth + 1 : null,
    };
  });

  // Ahora en tablet (768)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(700);
  out.tablet = await page.evaluate(() => {
    const anchoVista = window.innerWidth;
    const ta = document.querySelector('textarea');
    return {
      anchoVentana: anchoVista,
      scrollHorizontalPagina: document.body.scrollWidth > anchoVista + 1,
      anchoScrollBody: document.body.scrollWidth,
      planAccionAncho: ta ? Math.round(ta.getBoundingClientRect().width) : null,
      planAccionPorcentaje: ta ? Math.round((ta.getBoundingClientRect().width / anchoVista) * 100) : null,
    };
  });

  // Y en escritorio (1440)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(700);
  out.escritorio = await page.evaluate(() => {
    const anchoVista = window.innerWidth;
    const tabla = document.querySelector('table');
    const ta = document.querySelector('textarea');
    const ths = tabla ? Array.from(tabla.querySelectorAll('thead th')) : [];
    const anchoTabla = tabla ? tabla.getBoundingClientRect().width : 0;
    return {
      anchoVentana: anchoVista,
      scrollHorizontalPagina: document.body.scrollWidth > anchoVista + 1,
      anchoScrollBody: document.body.scrollWidth,
      tablaVisible: tabla ? getComputedStyle(tabla.closest('div')).display !== 'none' : false,
      anchoTabla: Math.round(anchoTabla),
      planAccionAncho: ta ? Math.round(ta.getBoundingClientRect().width) : null,
      planAccionPorcentaje: ta && anchoTabla ? Math.round((ta.getBoundingClientRect().width / anchoTabla) * 100) : null,
      columnas: ths.map(th => ({
        titulo: th.innerText.trim(),
        pct: Math.round((th.getBoundingClientRect().width / anchoTabla) * 100),
      })),
    };
  });

  return out;
}