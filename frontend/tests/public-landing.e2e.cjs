const { chromium } = require('playwright');

(async () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 }
    });

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto(baseURL, {
      waitUntil: 'networkidle'
    });

    if (!response || !response.ok()) {
      throw new Error(`Landing page returned ${response?.status()}`);
    }

    await page.getByRole('heading', {
      name: /ideas are easy/i
    }).waitFor();

    await page.getByRole('button', {
      name: /create your account/i
    }).waitFor();

    await page.setViewportSize({ width: 390, height: 844 });

    const mobileOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > window.innerWidth
    ));

    if (mobileOverflow) {
      throw new Error('Horizontal overflow detected on mobile viewport.');
    }

    if (pageErrors.length) {
      throw new Error(`Browser errors: ${pageErrors.join('; ')}`);
    }

    console.log('PASS: landing page desktop/mobile smoke test');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
