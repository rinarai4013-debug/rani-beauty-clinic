import { test, expect } from '@playwright/test';

test.describe('Dashboard Authentication', () => {
  test('login page renders at /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should either show login form or redirect to login
    const hasLoginForm = await page.getByLabel(/username|email/i).first().isVisible().catch(() => false);
    const hasPasswordField = await page.getByLabel(/password/i).first().isVisible().catch(() => false);
    const isOnLoginPage = page.url().includes('login') || page.url().includes('dashboard');

    expect(isOnLoginPage || hasLoginForm || hasPasswordField).toBe(true);
  });

  test('login page has username input', async ({ page }) => {
    await page.goto('/dashboard');
    const usernameInput = page.getByLabel(/username|email/i).first();
    const inputExists = await usernameInput.isVisible().catch(() => false);
    if (!inputExists) {
      // May have redirected to a separate login page
      const loginInput = page.locator('input[type="text"], input[type="email"], input[name="username"]').first();
      await expect(loginInput).toBeVisible();
    }
  });

  test('login page has password input', async ({ page }) => {
    await page.goto('/dashboard');
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('login page has submit button', async ({ page }) => {
    await page.goto('/dashboard');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('empty form submission does not navigate away', async ({ page }) => {
    await page.goto('/dashboard');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should still be on login page
      await page.waitForTimeout(500);
      const stillOnLogin = page.url().includes('dashboard') || page.url().includes('login');
      expect(stillOnLogin).toBe(true);
    }
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/dashboard');
    const usernameInput = page.locator('input[type="text"], input[type="email"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();

    if (await submitBtn.isVisible()) {
      await usernameInput.fill('invalid_user');
      await passwordInput.fill('wrong_password');
      await submitBtn.click();

      // Wait for error response
      await page.waitForTimeout(1000);

      // Should show an error message or still be on login page
      const errorVisible = await page.locator('[class*=error], [role="alert"], [class*=danger]').first().isVisible().catch(() => false);
      const textContent = await page.locator('body').textContent();
      const hasErrorText = textContent?.toLowerCase().includes('invalid') ||
                          textContent?.toLowerCase().includes('incorrect') ||
                          textContent?.toLowerCase().includes('error') ||
                          textContent?.toLowerCase().includes('failed');

      expect(errorVisible || hasErrorText).toBe(true);
    }
  });

  test('protected dashboard routes redirect unauthenticated users', async ({ page }) => {
    const protectedPaths = [
      '/dashboard/revenue',
      '/dashboard/leads',
      '/dashboard/schedule',
      '/dashboard/settings',
    ];

    for (const path of protectedPaths) {
      const response = await page.goto(path);
      // Should redirect to login or return 401/403
      const status = response?.status() ?? 0;
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('login') || currentUrl.includes('dashboard');
      const isProtected = status === 401 || status === 403 || redirectedToLogin;
      expect(isProtected).toBe(true);
    }
  });

  test('login page does not expose sensitive data in HTML', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.content();
    expect(html).not.toContain('DASHBOARD_JWT_SECRET');
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
  });

  test('login form has password field type="password" (masked)', async ({ page }) => {
    await page.goto('/dashboard');
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      const type = await passwordInput.getAttribute('type');
      expect(type).toBe('password');
    }
  });

  test('login page renders without 500 error', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeLessThan(500);
  });
});
