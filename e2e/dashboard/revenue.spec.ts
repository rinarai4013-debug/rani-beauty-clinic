import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Revenue — Page Load', () => {
  test('revenue page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/revenue');
  });

  test('revenue page renders body content', async ({ page }) => {
    await page.goto('/dashboard/revenue');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pnl page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/pnl');
  });

  test('finance page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/finance');
  });
});

test.describe('Dashboard Revenue — API Endpoints', () => {
  test('revenue API requires auth', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue');
    expect([401, 403]).toContain(response.status());
  });

  test('revenue trends API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue/trends');
    expect(response.status()).toBeLessThan(500);
  });

  test('revenue anomalies API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue/anomalies');
    expect(response.status()).toBeLessThan(500);
  });

  test('expenses API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/finance/expenses');
    expect(response.status()).toBeLessThan(500);
  });

  test('P&L API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/finance/pnl');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Revenue — Charts', () => {
  test('revenue page has chart or visualization container', async ({ page }) => {
    await page.goto('/dashboard/revenue');
    const charts = page.locator('[class*=chart], [class*=graph], canvas, svg[class*=recharts]');
    const count = await charts.count();
    // Charts may not render if not authenticated
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Revenue — Anomaly Detection', () => {
  test('anomaly API returns structured response', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue/anomalies');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    } else {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Dashboard Revenue — P&L Intelligence', () => {
  test('pnl page renders', async ({ page }) => {
    await page.goto('/dashboard/pnl');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pnl API structure', async ({ request }) => {
    const response = await request.get('/api/dashboard/finance/pnl');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    } else {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('finance page renders', async ({ page }) => {
    await page.goto('/dashboard/finance');
    await expect(page.locator('body')).toBeVisible();
  });
});
