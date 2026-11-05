const { chromium } = require('playwright');
const readline = require('readline');

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
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
  const email = await ask('Devora account email: ');
  const password = await askHidden('Password (hidden): ');

  if (!email || !password) {
    console.log('Email and password are required.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiResponses = [];
  const runtimeErrors = [];

  page.on('response', response => {
    if (response.url().includes('localhost:5000/api/')) {
      apiResponses.push({ status: response.status(), url: response.url() });
    }
  });

  page.on('pageerror', error => runtimeErrors.push(error.message));

  try {
    await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForFunction(
      () => ['#/dashboard', '#/onboarding'].includes(window.location.hash)
        || !!document.querySelector('[role="alert"]'),
      { timeout: 30000 }
    );

    const route = await page.evaluate(() => window.location.hash);
    const alert = await page.locator('[role="alert"]').allInnerTexts();

    console.log('\n===== AUTHENTICATION TEST =====');
    if (route === '#/dashboard' || route === '#/onboarding') {
      console.log('PASS: Login successful');
      console.log(`Destination: ${route}`);
    } else {
      console.log('FAIL: Login did not complete');
      console.log(`Message: ${alert.join(' ') || 'No error message shown'}`);
    }

    console.log('\n===== API RESPONSES =====');
    for (const item of apiResponses) {
      console.log(`${item.status} ${item.url}`);
    }

    console.log('\n===== RUNTIME ERRORS =====');
    console.log(runtimeErrors.join('\n') || 'None');

    if (route !== '#/dashboard' && route !== '#/onboarding') process.exitCode = 1;
  } catch (error) {
    console.log(`TEST ERROR: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
