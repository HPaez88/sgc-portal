// QA de los módulos modificados: navega por la app y verifica que cada vista
// monta sin errores y que los elementos nuevos que agregué están presentes.
export default async function run(page, ui) {
  const resultados = {};

  // 1. Login (la app pide sesión al arrancar)
  let snap = await ui.snapshot();
  const botonIngresar = snap.match(/@(e\d+) button "Iniciar Sesión"/)
    || snap.match(/@(e\d+) button "Ingresar"/)
    || snap.match(/@(e\d+) button "Acceder"/);

  if (botonIngresar) {
    await ui.click(botonIngresar[1]);
    await page.waitForTimeout(1500);
    resultados.login = 'ok';
  } else {
    resultados.login = 'sin pantalla de login (sesión ya activa)';
  }

  const irAModulo = async (patron) => {
    await page.waitForTimeout(300);
    const actual = await ui.snapshot();
    const ref = actual.match(new RegExp(`@(e\\d+) \\w+ "[^"]*${patron}[^"]*"`));
    if (!ref) return `no encontrado: ${patron}`;
    await ui.click(ref[1]);
    await page.waitForTimeout(1600);
    return 'ok';
  };

  // 2. Documentos: verifico los elementos de Fase 2
  resultados.documentos_nav = await irAModulo('Documentos');
  snap = await ui.snapshot({ full: true });
  resultados.documentos = {
    titulo: snap.includes('Control Documental'),
    matriz: snap.includes('Matriz') || snap.includes('Trazabilidad'),
    exportar: snap.includes('Exportar Matriz'),
    nuevo: snap.includes('Nuevo Documento'),
  };

  // Pestaña de matriz: verifico el panel de integridad y la paginación
  const refMatriz = (await ui.snapshot()).match(/@(e\d+) button "Matriz de Trazabilidad/);
  if (refMatriz) {
    await ui.click(refMatriz[1]);
    await page.waitForTimeout(1000);
    const snapMatriz = await ui.snapshot({ full: true });
    resultados.documentos.matrizMonta = snapMatriz.includes('Matriz Cruzada')
      || snapMatriz.includes('Total Documentos')
      || snapMatriz.includes('Aguas Arriba');
    resultados.documentos.paginacionMatriz = snapMatriz.includes('Página')
      || snapMatriz.includes('Siguiente')
      || snapMatriz.includes('documentos');
  }

  // 3. Indicadores: verifico paginación, búsqueda y año
  resultados.indicadores_nav = await irAModulo('Indicadores');
  snap = await ui.snapshot();
  resultados.indicadores = {
    busqueda: snap.includes('Buscar indicador'),
    selectorAnio: /combobox "Año de captura"/.test(snap),
    paginacion: snap.includes('Siguiente') || snap.includes('página') || snap.includes('Página'),
  };

  // 4. Riesgos: verifico la nueva columna Acción
  resultados.riesgos_nav = await irAModulo('Matriz de Riesgos');
  snap = await ui.snapshot({ full: true });
  resultados.riesgos = {
    titulo: snap.includes('Riesgo'),
    columnaAccion: snap.includes('Plan de Mejora'),
  };

  // 5. Aprobaciones: verifico las columnas del workflow
  resultados.aprobaciones_nav = await irAModulo('Aprobaciones');
  snap = await ui.snapshot({ full: true });
  resultados.aprobaciones = {
    monta: snap.length > 100,
    estadoSync: snap.includes('Sincronizado') || snap.includes('Sincronizando'),
  };

  // 6. Bitácora y Configuración (donde convertí los alerts a toasts)
  resultados.bitacora_nav = await irAModulo('Bitácora');
  snap = await ui.snapshot({ full: true });
  resultados.bitacora = { monta: snap.length > 100 };

  resultados.settings_nav = await irAModulo('Configuración');
  snap = await ui.snapshot({ full: true });
  resultados.settings = { monta: snap.includes('Configuración') || snap.includes('Catálogo') };

  // 7. Volver al dashboard para confirmar que la navegación no rompió nada
  resultados.dashboard_nav = await irAModulo('Panel Principal');
  const final = await ui.snapshot({ full: true });
  resultados.dashboard_ok = final.includes('Panel Principal') || final.includes('DESEMPEÑO');

  return resultados;
}