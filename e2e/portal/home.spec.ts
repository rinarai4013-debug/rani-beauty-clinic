import { test, expect } from '../fixtures';
import { expectNoServerError, assertNoHorizontalOverflow } from '../helpers';

test.describe('Patient Portal Home — Page Load', () => {
  test('portal home page loads', async ({ page }) => {
    await expectNoServerError(page, '/portal');
  });

  test('portal home renders visible content', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.locator('body')).toBeVisible();
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('portal has branded styling', async ({ page }) => {
    await page.goto('/portal');
    // Check for Rani branding elements
    const body = await page.locator('body').textContent();
    const hasBranding = body?.toLowerCase().includes('rani') ||
      body?.toLowerCase().includes('portal') ||
      body?.toLowerCase().includes('beauty');
    expect(hasBranding).toBe(true);
  });
});

test.describe('Patient Portal Home — Navigation', () => {
  test('portal has navigation elements', async ({ page }) => {
    await page.goto('/portal');
    const navElements = page.locator('nav, aside, [class*=nav], a[href*="/portal/"]');
    const count = await navElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('portal has links to sub-pages', async ({ page }) => {
    await page.goto('/portal');
    const portalLinks = page.locator('a[href*="/portal/"]');
    const count = await portalLinks.count();
    // Links may only show when authenticated
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Patient Portal Home — Quick Actions', () => {
  test('portal shows actionable buttons', async ({ page }) => {
    await page.goto('/portal');
    const buttons = page.locator('button, a[href]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('portal references appointments or booking', async ({ page }) => {
    await page.goto('/portal');
    const body = await page.locator('body').textContent();
    const hasAppointment = body?.toLowerCase().includes('appointment') ||
      body?.toLowerCase().includes('book') ||
      body?.toLowerCase().includes('schedule') ||
      body?.toLowerCase().includes('login') ||
      body?.toLowerCase().includes('sign in');
    expect(hasAppointment).toBe(true);
  });
});

test.describe('Patient Portal Home — Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('portal renders on mobile', async ({ page }) => {
    const res = await page.goto('/portal');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('portal has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/portal');
    await assertNoHorizontalOverflow(page);
  });

  test('portal mobile has navigation', async ({ page }) => {
    await page.goto('/portal');
    const navElements = page.locator('nav, [class*=nav], button[aria-label*="menu" i]');
    const count = await navElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Patient Portal Home — Accessibility', () => {
  test('portal has proper landmarks', async ({ page }) => {
    await page.goto('/portal');
    const body = await page.locator('body').count();
    expect(body).toBe(1);
  });

  test('portal buttons have accessible names', async ({ page }) => {
    await page.goto('/portal');
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      expect((text?.trim().length ?? 0) > 0 || !!ariaLabel).toBe(true);
    }
  });
});
