import { chromium } from 'playwright';

const BASE_URL = 'https://sgc-portal-933s.onrender.com';
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  pages: []
};

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const jsErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
  });

  page.on('requestfailed', req => {
    pageErrors.push(`FAILED: ${req.url()} - ${req.failure()?.errorText || 'Unknown error'}`);
  });

  const testPages = [
    { name: 'Home/Dashboard', path: '/' },
    { name: 'Clientes', path: '/clientes' },
    { name: 'Proyectos', path: '/proyectos' },
    { name: 'Incidencias', path: '/incidencias' },
    { name: 'Documentos', path: '/documentos' },
    { name: 'Informes', path: '/informes' },
    { name: 'Configuración', path: '/configuracion' },
    { name: 'Usuarios', path: '/usuarios' },
  ];

  for (const testPage of testPages) {
    const pageResult = {
      name: testPage.name,
      url: `${BASE_URL}${testPage.path}`,
      path: testPage.path,
      status: 'unknown',
      loadTime: 0,
      errors: [],
      warnings: [],
      hasContent: false,
      title: '',
      screenshot: null
    };

    consoleErrors.length = 0;
    jsErrors.length = 0;
    pageErrors.length = 0;

    try {
      const startTime = Date.now();
      const response = await page.goto(pageResult.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      pageResult.loadTime = Date.now() - startTime;
      pageResult.status = response?.status() || 'no response';
      pageResult.title = await page.title();

      await page.waitForTimeout(2000);

      const bodyContent = await page.evaluate(() => document.body?.innerText || '');
      pageResult.hasContent = bodyContent.trim().length > 100;

      if (consoleErrors.length > 0) {
        pageResult.errors.push(...consoleErrors.map(e => `Console: ${e.text}`));
      }
      if (jsErrors.length > 0) {
        pageResult.errors.push(...jsErrors.map(e => `JS Error: ${e}`));
      }
      if (pageErrors.length > 0) {
        pageResult.warnings.push(...pageErrors);
      }

      try {
        const screenshot = await page.screenshot({ type: 'png', fullPage: false });
        pageResult.screenshot = `<screenshot ${screenshot.length} bytes>`;
      } catch (e) {
        pageResult.warnings.push(`Screenshot failed: ${e.message}`);
      }

    } catch (err) {
      pageResult.status = 'error';
      pageResult.errors.push(`Navigation error: ${err.message}`);
    }

    results.pages.push(pageResult);
    console.log(`[${pageResult.status}] ${testPage.name} (${pageResult.loadTime}ms)`);
  }

  await browser.close();

  console.log('\n=== SGC PORTAL TEST RESULTS ===\n');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(console.error);