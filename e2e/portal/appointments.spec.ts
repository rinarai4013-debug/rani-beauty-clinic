import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Patient Portal Appointments — Page Load', () => {
  test('appointments page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/portal/appointments');
  });

  test('appointments page renders body', async ({ page }) => {
    await page.goto('/portal/appointments');
    await expect(page.locator('body')).toBeVisible();
  });

  test('appointments page has content', async ({ page }) => {
    await page.goto('/portal/appointments');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });
});

test.describe('Patient Portal Appointments — Structure', () => {
  test('appointments page shows login or appointment data', async ({ page }) => {
    await page.goto('/portal/appointments');
    const body = await page.locator('body').textContent();
    const hasContent = body?.toLowerCase().includes('appointment') ||
      body?.toLowerCase().includes('booking') ||
      body?.toLowerCase().includes('login') ||
      body?.toLowerCase().includes('sign in') ||
      body?.toLowerCase().includes('schedule');
    expect(hasContent).toBe(true);
  });

  test('appointments page has interactive elements', async ({ page }) => {
    await page.goto('/portal/appointments');
    const elements = page.locator('button, a[href]');
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Patient Portal Appointments — Treatments', () => {
  test('treatments page loads', async ({ page }) => {
    await expectNoServerError(page, '/portal/treatments');
  });

  test('treatments page renders', async ({ page }) => {
    await page.goto('/portal/treatments');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Patient Portal Appointments — Plan', () => {
  test('plan page loads', async ({ page }) => {
    await expectNoServerError(page, '/portal/plan');
  });

  test('plan page renders', async ({ page }) => {
    await page.goto('/portal/plan');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Patient Portal Appointments — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('appointments page renders on mobile', async ({ page }) => {
    const res = await page.goto('/portal/appointments');
    expect(res?.status()).toBeLessThan(500);
  });

  test('treatments page renders on mobile', async ({ page }) => {
    const res = await page.goto('/portal/treatments');
    expect(res?.status()).toBeLessThan(500);
  });
});
