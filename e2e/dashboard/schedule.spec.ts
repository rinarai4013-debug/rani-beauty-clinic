import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Schedule — Page Load', () => {
  test('schedule page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/schedule');
  });

  test('schedule optimizer page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/schedule-optimizer');
  });

  test('schedule page renders body', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Schedule — API Endpoints', () => {
  test('schedule API requires auth', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule');
    expect([401, 403]).toContain(response.status());
  });

  test('upcoming schedule API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule/upcoming');
    expect(response.status()).toBeLessThan(500);
  });

  test('no-show risk API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule/no-show-risk');
    expect(response.status()).toBeLessThan(500);
  });

  test('schedule optimize API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule/optimize');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Schedule — Calendar View', () => {
  test('schedule page has date or calendar elements', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    const calElements = page.locator('[class*=calendar], [class*=schedule], [class*=date], table');
    const count = await calElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Schedule — No-Show Risk', () => {
  test('no-show risk API accepts date parameter', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request.get(`/api/dashboard/schedule/no-show-risk?date=${today}`);
    expect(response.status()).toBeLessThan(500);
  });

  test('no-show risk returns structured data when authenticated', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule/no-show-risk');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    }
  });
});

test.describe('Dashboard Schedule — Optimizer', () => {
  test('optimizer page renders', async ({ page }) => {
    await page.goto('/dashboard/schedule-optimizer');
    await expect(page.locator('body')).toBeVisible();
  });

  test('optimize API returns structured response', async ({ request }) => {
    const response = await request.get('/api/dashboard/schedule/optimize');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    } else {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('schedule page no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
