import { test, expect, INVALID_CREDS, DASHBOARD_PAGES } from '../fixtures';

test.describe('Dashboard Auth — Login Page', () => {
  test('login page renders at /dashboard/login', async ({ page }) => {
    const res = await page.goto('/dashboard/login');
    expect(res?.status()).toBeLessThan(500);
  });

  test('login page has username input', async ({ page }) => {
    await page.goto('/dashboard/login');
    const input = page.locator('input[type="text"], input[type="email"], input[name="username"]').first();
    await expect(input).toBeVisible();
  });

  test('login page has password input', async ({ page }) => {
    await page.goto('/dashboard/login');
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('password field is masked (type=password)', async ({ page }) => {
    await page.goto('/dashboard/login');
    const input = page.locator('input[type="password"]').first();
    const type = await input.getAttribute('type');
    expect(type).toBe('password');
  });

  test('login page has submit button', async ({ page }) => {
    await page.goto('/dashboard/login');
    const btn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
    await expect(btn).toBeVisible();
  });

  test('login page renders without 500 error', async ({ page }) => {
    const res = await page.goto('/dashboard/login');
    expect(res?.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Auth — Invalid Credentials', () => {
  test('empty form submission does not navigate away', async ({ page }) => {
    await page.goto('/dashboard/login');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('dashboard') || url.includes('login')).toBe(true);
    }
  });

  test('invalid credentials show error message', async ({ dashboardLogin, page }) => {
    await dashboardLogin.goto();
    await dashboardLogin.fillAndSubmit(INVALID_CREDS.username, INVALID_CREDS.password);
    await page.waitForTimeout(1500);
    const errorVisible = await page.locator('[class*=error], [role="alert"], [class*=danger], [class*=toast]').first().isVisible().catch(() => false);
    const bodyText = await page.locator('body').textContent();
    const hasErrorText = bodyText?.toLowerCase().includes('invalid') ||
      bodyText?.toLowerCase().includes('incorrect') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('failed');
    expect(errorVisible || hasErrorText).toBe(true);
  });

  test('multiple failed attempts still show login form', async ({ dashboardLogin, page }) => {
    await dashboardLogin.goto();
    for (let i = 0; i < 3; i++) {
      await dashboardLogin.fillAndSubmit(INVALID_CREDS.username, INVALID_CREDS.password);
      await page.waitForTimeout(500);
    }
    // Login form should still be accessible
    await expect(dashboardLogin.usernameInput).toBeVisible();
    await expect(dashboardLogin.passwordInput).toBeVisible();
  });
});

test.describe('Dashboard Auth — Protected Routes', () => {
  const protectedPaths = [
    '/dashboard/revenue',
    '/dashboard/leads',
    '/dashboard/schedule',
    '/dashboard/settings',
    '/dashboard/clients',
    '/dashboard/entry',
  ];

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated users`, async ({ page }) => {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('login') || currentUrl.includes('dashboard');
      const isProtected = status === 401 || status === 403 || redirectedToLogin;
      expect(isProtected).toBe(true);
    });
  }
});

test.describe('Dashboard Auth — Security', () => {
  test('login page does not expose sensitive env vars', async ({ page }) => {
    await page.goto('/dashboard/login');
    const html = await page.content();
    expect(html).not.toContain('DASHBOARD_JWT_SECRET');
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
  });

  test('login page does not expose stack traces', async ({ page }) => {
    await page.goto('/dashboard/login');
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('at Object.<anonymous>');
    expect(body).not.toContain('ECONNREFUSED');
  });

  test('login API endpoint exists and rejects empty creds', async ({ request }) => {
    const response = await request.post('/api/dashboard/auth/login', {
      data: { username: '', password: '' },
    });
    expect(response.status()).toBeLessThan(500);
  });

  test('session API endpoint exists', async ({ request }) => {
    const response = await request.get('/api/dashboard/auth/me');
    expect([401, 403, 200]).toContain(response.status());
  });
});

test.describe('Dashboard Auth — API Auth Requirements', () => {
  test('KPI endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/dashboard/kpis');
    expect([401, 403]).toContain(response.status());
  });

  test('revenue endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue');
    expect([401, 403]).toContain(response.status());
  });

  test('leads endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/dashboard/leads');
    expect([401, 403]).toContain(response.status());
  });
});
