const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const unauthorized = [];

  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('response', response => {
    if (response.status() === 401) unauthorized.push(response.url());
  });

  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      results.push(`PASS: ${name}`);
    } catch (e) {
      results.push(`FAIL: ${name} — ${e.message}`);
    }
  }

  try {
    await test('Backend health', async () => {
      const r = await page.request.get('http://localhost:5000/api/health');
      if (!r.ok()) throw new Error(`HTTP ${r.status()}`);
    });

    for (const route of ['/login', '/signup', '/forgot-password']) {
      await test(`${route} renders`, async () => {
        await page.goto(`http://localhost:5173/#${route}`, { waitUntil: 'networkidle' });
        if ((await page.locator('body').innerText()).trim().length < 10) {
          throw new Error('Empty page');
        }
        await page.screenshot({ path: `test-results-${route.slice(1)}.png`, fullPage: true });
      });
    }

    await test('Guest is redirected from dashboard', async () => {
      await page.goto('http://localhost:5173/#/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      if (!page.url().endsWith('#/login')) {
        throw new Error(`Expected #/login, got ${page.url()}`);
      }
    });

    console.log('\n401 ENDPOINTS:');
    console.log([...new Set(unauthorized)].join('\n') || 'None');

    console.log('\nBROWSER ERRORS:');
    console.log(errors.join('\n') || 'None');

  } finally {
    console.log('\n===== RESULTS =====');
    results.forEach(x => console.log(x));
    await browser.close();
  }
})();
