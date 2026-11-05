const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    sessionStorage.setItem(
      'devora.pendingSignupEmail',
      'mrunaligupta23112@gmail.com'
    );
  });

  const page = await context.newPage();

  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173/#/otp');

  console.log('\nEnter the OTP in the browser window.');

  try {
    await page.waitForFunction(
      () => location.hash === '#/onboarding',
      { timeout: 180000 }
    );

    console.log('\nPASS: OTP verified.');
    console.log('PASS: Account created and onboarding opened.');

    await page.waitForTimeout(3000);
  } catch {
    console.log('\nVerification did not reach onboarding.');
    console.log('Current route:', await page.evaluate(() => location.hash));
    console.log('Page:', await page.locator('body').innerText());
  } finally {
    await browser.close();
  }
})();
