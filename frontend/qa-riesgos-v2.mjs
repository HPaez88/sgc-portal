// QA del rediseño del módulo de Riesgos: pestañas + filtro obligatorio de área.
export default async function run(page, ui) {
  const out = {};

  const snap = await ui.snapshot();
  const ref = snap.match(/@(e\d+) \w+ "[^"]*Riesgos[^"]*"/);
  if (ref) {
    await ui.click(ref[1]);
    await page.waitForTimeout(2200);
  }

  // ── Pestaña 1: Dashboard de gestión ──
  let full = await ui.snapshot({ full: true });
  out.dashboard = {
    pestanasVisibles: full.includes('Dashboard de gestión') && full.includes('Matriz por área'),
    metricas: full.includes('Cumplimiento de áreas')
      && full.includes('Matrices aprobadas')
      && full.includes('Áreas sin iniciar')
      && full.includes('Riesgos sin plan'),
    avanceEjercicio: full.includes('Avance del ejercicio'),
    tablaVigilancia: full.includes('Vigilancia por Área'),
    selectorAnio: /combobox/.test(full) || full.includes('Ejercicio'),
  };

  // Medir las métricas del dashboard con datos reales
  out.metricasValores = await page.evaluate(() => {
    const textos = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim());
    const idx = textos.findIndex(t => t === 'Cumplimiento de áreas');
    return {
      cumplimiento: idx >= 0 ? textos[idx + 1] : null,
      aprobadas: (() => {
        const i = textos.findIndex(t => t === 'Matrices aprobadas');
        return i >= 0 ? textos[i + 1] : null;
      })(),
      sinIniciar: (() => {
        const i = textos.findIndex(t => t === 'Áreas sin iniciar');
        return i >= 0 ? textos[i + 1] : null;
      })(),
      sinPlan: (() => {
        const i = textos.findIndex(t => t === 'Riesgos sin plan');
        return i >= 0 ? textos[i + 1] : null;
      })(),
    };
  });

  // ── Pestaña 2: Matriz por área (debe estar vacía sin selección) ──
  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Matriz por área[^"]*"/);
  if (refMatriz) {
    await ui.click(refMatriz[1]);
    await page.waitForTimeout(1200);
  }

  full = await ui.snapshot({ full: true });
  out.matrizSinArea = {
    selectorPresente: full.includes('Seleccionar área para revisar'),
    estadoVacio: full.includes('Selecciona un área para revisar su matriz'),
    // No debe haber ninguna tabla de riesgos visible
    sinTabla: await page.evaluate(() => {
      const hayTabla = document.querySelectorAll('table').length > 0;
      const hayTarjetas = document.querySelectorAll('article').length > 0;
      return { hayTabla, hayTarjetas };
    }),
    sinBotonNuevo: !full.includes('Nuevo Registro'),
  };

  // ── Seleccionar un área y verificar que aparecen datos ──
  const refSelect = (await ui.snapshot()).match(/@(e\d+) combobox "Área"/);
  if (refSelect) {
    await page.selectOption(`[aria-label="Área"]`, { index: 1 }).catch(() => { });
    await page.waitForTimeout(1500);
  } else {
    // Intentar por id
    await page.selectOption('#selector-area-riesgos', { index: 1 }).catch(() => { });
    await page.waitForTimeout(1500);
  }

  full = await ui.snapshot({ full: true });
  out.matrizConArea = {
    tieneStats: full.includes('Riesgos Altos') && full.includes('Oportunidades'),
    tieneTablaOTarjetas: await page.evaluate(() => ({
      tablas: document.querySelectorAll('table').length,
      tarjetas: document.querySelectorAll('article').length,
      textareas: document.querySelectorAll('textarea').length,
    })),
    botonNuevo: full.includes('Nuevo Registro'),
    estadoBadge: /Sin iniciar|En captura|Aprobada|Enviada/.test(full),
  };

  // ── Volver al dashboard ──
  const refDash = (await ui.snapshot()).match(/@(e\d+) button "[^"]*Dashboard de gestión[^"]*"/);
  if (refDash) {
    await ui.click(refDash[1]);
    await page.waitForTimeout(1000);
  }
  out.volverAlDashboard = (await ui.snapshot({ full: true })).includes('Vigilancia por Área');

  // ── Verificar ausencia de scroll horizontal ──
  out.sinScrollHorizontal = await page.evaluate(() => ({
    body: document.body.scrollWidth <= window.innerWidth + 1,
    anchoBody: document.body.scrollWidth,
    anchoVentana: window.innerWidth,
  }));

  return out;
}