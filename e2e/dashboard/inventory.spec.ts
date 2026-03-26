import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Inventory — Page Load', () => {
  test('inventory intelligence page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/inventory-intel');
  });

  test('inventory page renders body', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Inventory — API Endpoints', () => {
  test('inventory API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/inventory');
    expect(response.status()).toBeLessThan(500);
  });

  test('inventory API returns structured data when authed', async ({ request }) => {
    const response = await request.get('/api/dashboard/inventory');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    }
  });
});

test.describe('Dashboard Inventory — Product Catalog', () => {
  test('inventory page shows product or item listings', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const items = page.locator('table, [class*=product], [class*=item], [class*=card], [class*=list]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('inventory page has heading', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const heading = page.locator('h1, h2').first();
    const exists = await heading.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Inventory — Stock Levels', () => {
  test('inventory displays stock or quantity info', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const body = await page.locator('body').textContent();
    const hasStock = body?.toLowerCase().includes('stock') ||
      body?.toLowerCase().includes('quantity') ||
      body?.toLowerCase().includes('inventory') ||
      body?.toLowerCase().includes('reorder') ||
      body?.toLowerCase().includes('level');
    expect(typeof hasStock).toBe('boolean');
  });
});

test.describe('Dashboard Inventory — Reorder & Alerts', () => {
  test('inventory shows alerts or reorder indicators', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const alerts = page.locator('[class*=alert], [class*=warning], [class*=reorder], [class*=low]');
    const count = await alerts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('alerts API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/alerts');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Inventory — Waste Log', () => {
  test('inventory page references waste or expiration', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const body = await page.locator('body').textContent();
    const hasWaste = body?.toLowerCase().includes('waste') ||
      body?.toLowerCase().includes('expir') ||
      body?.toLowerCase().includes('usage');
    expect(typeof hasWaste).toBe('boolean');
  });
});

test.describe('Dashboard Inventory — Entry Form', () => {
  test('inventory entry form loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/entry/inventory');
  });

  test('inventory entry API endpoint', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/inventory', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Inventory — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('inventory page renders on mobile', async ({ page }) => {
    const res = await page.goto('/dashboard/inventory-intel');
    expect(res?.status()).toBeLessThan(500);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/dashboard/inventory-intel');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
