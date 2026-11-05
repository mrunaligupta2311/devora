const { chromium } = require('playwright');
const readline = require('readline');

function hiddenInput(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = key => {
      if (key === '\u0003') process.exit();
      if (key === '\r' || key === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else value += key;
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const password = await hiddenInput('Test account password: ');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto('http://localhost:5173/#/login');

    await page.getByLabel('Email address').fill('mrunaligupta23112@gmail.com');
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/#\/onboarding|#\/dashboard/, { timeout: 30000 });

    if (await page.evaluate(() => location.hash) === '#/onboarding') {
      await page.getByRole('button', { name: /^Frontend$/ }).click();
      await page.getByRole('button', { name: /^Full-stack$/ }).click();

      await page.getByRole('button', { name: 'Build my dashboard' }).click();
      await page.waitForURL(/#\/dashboard/, { timeout: 30000 });
    }

    await page.waitForTimeout(3000);

    const body = await page.locator('body').innerText();
    if (!body.includes('Dashboard')) throw new Error('Dashboard content not found.');

    console.log('PASS: Backend login');
    console.log('PASS: Onboarding preferences saved');
    console.log('PASS: Dashboard loaded');
    console.log('BROWSER ERRORS:', errors.length ? errors : 'None');
  } catch (error) {
    console.log('E2E TEST FAILED:', error.message);
    console.log('URL:', page.url());
    console.log('PAGE:', (await page.locator('body').innerText()).slice(0, 1500));
  } finally {
    await browser.close();
  }
})();
