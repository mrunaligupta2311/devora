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
      } else {
        value += key;
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const password = await hiddenInput('Create test account password (8+ chars): ');
  if (password.length < 8) {
    console.log('Password must be at least 8 characters.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('response', async r => {
    if (r.url().includes('/api/auth/signup')) {
      console.log('SIGNUP API:', r.status(), await r.text().catch(() => ''));
    }
  });
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));

  try {
    await page.goto('http://localhost:5173/#/signup', { waitUntil: 'networkidle' });

    await page.getByLabel('Full name').fill('Devora Test');
    await page.getByLabel('Email address').fill('mrunaligupta23112@gmail.com');
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);

    await page.getByRole('button', { name: /Continue to verification/i }).click();

    await page.waitForTimeout(2500);

    if (await page.evaluate(() => location.hash) === '#/otp') {
      console.log('SUCCESS: Signup request accepted.');
      console.log('OTP requested for: mrunaligupta23112@gmail.com');
    } else {
      const message = await page.locator('body').innerText();
      console.log('CURRENT URL:', page.url());
      console.log('VISIBLE PAGE TEXT:', message);
    }
  } catch (error) {
    console.log('TEST ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
