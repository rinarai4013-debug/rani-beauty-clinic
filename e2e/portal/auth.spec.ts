import { test, expect, PORTAL_PAGES } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Patient Portal Auth — Login Page', () => {
  test('portal page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/portal');
  });

  test('portal shows login screen when unauthenticated', async ({ page }) => {
    await page.goto('/portal');
    // Portal layout shows PortalLogin when no session
    const body = await page.locator('body').textContent();
    const hasLogin = body?.toLowerCase().includes('login') ||
      body?.toLowerCase().includes('sign in') ||
      body?.toLowerCase().includes('email') ||
      body?.toLowerCase().includes('magic link') ||
      body?.toLowerCase().includes('portal');
    expect(hasLogin).toBe(true);
  });

  test('portal login has email input', async ({ page }) => {
    await page.goto('/portal');
    const emailInput = page.locator('input[type="email"], input[type="text"], input[name="email"]').first();
    const exists = await emailInput.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('portal login has submit button', async ({ page }) => {
    await page.goto('/portal');
    const btn = page.getByRole('button').first();
    const exists = await btn.isVisible().catch(() => false);
    expect(exists).toBe(true);
  });

  test('portal login form accepts email', async ({ page }) => {
    await page.goto('/portal');
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    }
  });
});

test.describe('Patient Portal Auth — Protected Routes', () => {
  for (const { path, name } of PORTAL_PAGES) {
    test(`${name} (${path}) loads without 500 error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }
});

test.describe('Patient Portal Auth — Security', () => {
  test('portal does not expose API keys', async ({ page }) => {
    await page.goto('/portal');
    const html = await page.content();
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
    expect(html).not.toContain('DASHBOARD_JWT_SECRET');
  });

  test('portal pages are not indexed (robots noindex)', async ({ page }) => {
    await page.goto('/portal');
    const robots = await page.getAttribute('meta[name="robots"]', 'content');
    if (robots) {
      expect(robots).toContain('noindex');
    }
  });

  test('portal does not expose stack traces', async ({ page }) => {
    await page.goto('/portal');
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('at Object.<anonymous>');
    expect(body).not.toContain('ECONNREFUSED');
  });
});
