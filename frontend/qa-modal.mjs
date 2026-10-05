// Reproduce el bug reportado: abrir el modal desde el fondo de una lista larga
// y verificar que el modal queda SIEMPRE dentro del viewport, con sus botones
// de acción alcanzables sin desplazarse.
export default async function run(page, ui) {
  const out = {};

  // Ventana baja a propósito: es el caso donde el bug aparecía.
  await page.setViewportSize({ width: 1366, height: 700 });
  await page.waitForTimeout(600);

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) {
    await ui.click(ref[1]);
    await page.waitForTimeout(2200);
  }

  // Ir a la pestaña de la matriz y elegir un área (así aparece "Nuevo Registro")
  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Matriz por área[^"]*"/);
  if (refMatriz) {
    await ui.click(refMatriz[1]);
    await page.waitForTimeout(1000);
  }
  await page.selectOption('#selector-area-riesgos', { index: 1 }).catch(() => { });
  await page.waitForTimeout(1400);

  // ── Hacer scroll hasta el FONDO de la página, como el usuario reportó ──
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(800);

  out.scrollAntesDeAbrir = await page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      scrollTop: main ? Math.round(main.scrollTop) : null,
      scrollHeight: main ? Math.round(main.scrollHeight) : null,
      posicionScroll: window.scrollY,
    };
  });

  // ── Abrir el modal con el botón "Nuevo Registro" ──
  const snapBoton = await ui.snapshot();
  const refNuevo = snapBoton.match(/@(e\d+) button "[^"]*Nuevo Registro[^"]*"/);
  if (!refNuevo) return { error: 'no se encontró el botón Nuevo Registro', out };

  await ui.click(refNuevo[1]);
  await page.waitForTimeout(1200);

  // ── Verificar que el modal y sus botones estén VISIBLES ──
  out.modal = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'no hay dialog' };

    const rectDialog = dialog.getBoundingClientRect();
    const altoVista = window.innerHeight;
    const anchoVista = window.innerWidth;

    // Buscar los botones del pie del modal
    const botones = Array.from(dialog.querySelectorAll('button'));
    const botonCancelar = botones.find(b => b.innerText.trim() === 'Cancelar');
    const botonRegistrar = botones.find(b => b.innerText.includes('Registrar'));
    const botonCerrar = dialog.querySelector('button[aria-label="Cerrar"]');

    const visibilidad = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        arriba: Math.round(r.top),
        abajo: Math.round(r.bottom),
        // ¿Está dentro del viewport vertical?
        visible: r.top >= 0 && r.bottom <= altoVista,
        // ¿Es clicable en su centro?
        centroVisible: (() => {
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          if (cy < 0 || cy > altoVista || cx < 0 || cx > anchoVista) return false;
          const el2 = document.elementFromPoint(cx, cy);
          return el2 ? (el === el2 || el.contains(el2) || el2.contains(el)) : false;
        })(),
      };
    };

    return {
      altoVista,
      dialog: {
        arriba: Math.round(rectDialog.top),
        abajo: Math.round(rectDialog.bottom),
        alto: Math.round(rectDialog.height),
        // El modal debe caber en el viewport
        cabeEnViewport: rectDialog.top >= 0 && rectDialog.bottom <= altoVista,
      },
      botonCancelar: visibilidad(botonCancelar),
      botonRegistrar: visibilidad(botonRegistrar),
      botonCerrar: visibilidad(botonCerrar),
      // El body debe estar bloqueado (no debe scrollear detrás)
      bodyBloqueado: getComputedStyle(document.body).overflow === 'hidden',
    };
  });

  // ── Probar que Cancelar realmente cierra ──
  const refCancelar = (await ui.snapshot()).match(/@(e\d+) button "Cancelar"/);
  if (refCancelar) {
    await ui.click(refCancelar[1]);
    await page.waitForTimeout(900);
    out.cancelarFunciona = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  } else {
    out.cancelarFunciona = 'no se encontró el botón Cancelar en el snapshot';
  }

  // ── Repetir con ventana MUY baja para forzar el scroll interno ──
  await page.setViewportSize({ width: 1366, height: 500 });
  await page.waitForTimeout(700);

  const snapBoton2 = await ui.snapshot();
  const refNuevo2 = snapBoton2.match(/@(e\d+) button "[^"]*Nuevo Registro[^"]*"/);
  if (refNuevo2) {
    await ui.click(refNuevo2[1]);
    await page.waitForTimeout(1200);
  }

  out.ventanaBaja = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { error: 'no hay dialog' };
    const r = dialog.getBoundingClientRect();
    const altoVista = window.innerHeight;
    const botones = Array.from(dialog.querySelectorAll('button'));
    const cancelar = botones.find(b => b.innerText.trim() === 'Cancelar');
    const rc = cancelar ? cancelar.getBoundingClientRect() : null;
    const cuerpo = dialog.querySelector('.overflow-y-auto');

    return {
      altoVista,
      dialogCabe: r.top >= 0 && r.bottom <= altoVista,
      dialogArriba: Math.round(r.top),
      dialogAbajo: Math.round(r.bottom),
      cancelarVisible: rc ? (rc.top >= 0 && rc.bottom <= altoVista) : null,
      cuerpoConScrollInterno: cuerpo ? cuerpo.scrollHeight > cuerpo.clientHeight : null,
      // El botón Cancelar está fijo al pie (no se desplaza con el cuerpo)
      pieFijo: rc ? rc.bottom <= r.bottom + 1 : null,
    };
  });

  // Cerrar con Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  out.escapeFunciona = await page.evaluate(() => !document.querySelector('[role="dialog"]'));

  return out;
}