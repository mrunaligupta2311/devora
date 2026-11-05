const { chromium } = require('playwright');
const readline = require('readline');

function hiddenInput(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    let value = '';
    const stdin = process.stdin;
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
      } else if (key === '\u007f' || key === '\b') value = value.slice(0, -1);
      else value += key;
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const password = await hiddenInput('Test account password: ');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('response', r => {
    if (r.url().includes('/api/auth/login')) {
      console.log('LOGIN RESPONSE:', r.status());
    }
  });

  try {
    await page.goto('http://localhost:5173/#/login');
    await page.getByLabel('Email address').fill('mrunaligupta23112@gmail.com');
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(5000);
    console.log('ROUTE AFTER LOGIN:', await page.evaluate(() => location.hash));
    console.log('PAGE AFTER LOGIN:', (await page.locator('body').innerText()).slice(0, 1200));
    await page.waitForFunction(
      () => ['#/onboarding', '#/dashboard'].includes(location.hash),
      { timeout: 10000 }
    );

    if (await page.evaluate(() => location.hash) === '#/onboarding') {
      await page.getByRole('button', { name: 'Build my dashboard' }).click();
      await page.waitForURL(/#\/dashboard/, { timeout: 30000 });
    }

    const result = await page.evaluate(async () => {
      const token = sessionStorage.getItem('devora.accessToken');
      const base = 'http://localhost:5000/api';
      const get = async path => {
        const response = await fetch(base + path, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${json.message || ''}`);
        return json.data;
      };

      const [profile, preferences, userProjects, dashboard, recommendations, firstPage] =
        await Promise.all([
          get('/users/profile'),
          get('/users/preferences'),
          get('/users/projects'),
          get('/users/dashboard'),
          get('/projects/recommendations'),
          get('/projects?page=1&limit=100')
        ]);

      const allProjects = [...(firstPage.projects || [])];
      for (let p = 2; p <= (firstPage.pagination?.pages || 1); p++) {
        const next = await get(`/projects?page=${p}&limit=100`);
        allProjects.push(...(next.projects || []));
      }

      return {
        profile: !!profile?.id,
        preferences: !!preferences && preferences.onboarded === true,
        userProjects: Array.isArray(userProjects) ? userProjects.length : -1,
        dashboardStats: dashboard?.stats || null,
        recommendations: Array.isArray(recommendations) ? recommendations.length : -1,
        catalogue: allProjects.length,
        paginationTotal: firstPage.pagination?.total ?? null
      };
    });

    console.log('\nDASHBOARD API AUDIT');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nPASS: All read-only dashboard endpoints responded.');
  } catch (error) {
    console.log('AUDIT FAILED:', error.message);
  } finally {
    await browser.close();
  }
})();
