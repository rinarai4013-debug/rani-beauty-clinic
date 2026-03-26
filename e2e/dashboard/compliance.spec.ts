import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Compliance — Settings Page', () => {
  test('settings page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/settings');
  });

  test('settings page renders body', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Compliance — Alerts', () => {
  test('alerts page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/alerts');
  });

  test('alerts API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts');
    expect(response.status()).toBeLessThan(500);
  });

  test('alert dismiss API exists', async ({ request }) => {
    const response = await request.patch('/api/dashboard/alerts/test-id', {
      data: { dismissed: true },
    });
    // Should be 401 or 404, not 500
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Compliance — Integrations', () => {
  test('integrations page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/integrations');
  });

  test('Mangomint integration API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/integrations/mangomint');
    expect(response.status()).toBeLessThan(500);
  });

  test('Square integration API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/integrations/square');
    expect(response.status()).toBeLessThan(500);
  });

  test('sync-all integrations API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/integrations/sync-all');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Compliance — Security', () => {
  test('no API keys in client-side HTML', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.content();
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
    expect(html).not.toContain('META_ACCESS_TOKEN');
    expect(html).not.toContain('RESEND_API_KEY');
    expect(html).not.toContain('PINECONE_API_KEY');
    expect(html).not.toContain('VAPI_API_KEY');
  });

  test('no stack traces exposed in dashboard pages', async ({ page }) => {
    const dashPages = ['/dashboard', '/dashboard/revenue', '/dashboard/leads'];
    for (const path of dashPages) {
      await page.goto(path);
      const body = await page.locator('body').textContent();
      expect(body).not.toContain('at Object.<anonymous>');
      expect(body).not.toContain('ECONNREFUSED');
    }
  });
});

test.describe('Dashboard Compliance — Audit Trail', () => {
  test('reviews page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/reviews');
  });

  test('reviews page renders', async ({ page }) => {
    await page.goto('/dashboard/reviews');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Compliance — Competitor Intel', () => {
  test('competitor intel page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/competitor-intel');
  });

  test('competitor intel page renders', async ({ page }) => {
    await page.goto('/dashboard/competitor-intel');
    await expect(page.locator('body')).toBeVisible();
  });
});
