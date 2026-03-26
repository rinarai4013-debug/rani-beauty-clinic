import { test, expect, CLINIC, SERVICES } from '../fixtures';
import { expectPageOk, collectConsoleErrors, assertImagesValid, assertSEOMeta } from '../helpers';

test.describe('Homepage — Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('returns 200 status code', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('page title contains clinic name', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(CLINIC.name, 'i'));
  });

  test('main content area is visible', async ({ publicPage }) => {
    await expect(publicPage.main).toBeVisible();
  });

  test('hero section is visible', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('hero has a CTA button with valid href', async ({ publicPage }) => {
    const cta = publicPage.ctaButton();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('hero heading contains relevant keywords', async ({ publicPage }) => {
    const h1Text = await publicPage.h1.textContent();
    expect(h1Text!.length).toBeGreaterThan(5);
  });

  test('navigation bar is visible', async ({ publicPage }) => {
    await expect(publicPage.nav).toBeVisible();
  });

  test('navigation contains Services link', async ({ publicPage }) => {
    await expect(publicPage.navLink('services')).toBeVisible();
  });

  test('navigation contains About link', async ({ publicPage }) => {
    await expect(publicPage.navLink('about')).toBeVisible();
  });

  test('navigation contains Contact link', async ({ publicPage }) => {
    await expect(publicPage.navLink('contact')).toBeVisible();
  });

  test('service highlights section shows at least 3 services', async ({ page }) => {
    const serviceCards = page.locator('[class*=service], [class*=card], [data-service], a[href*="/services/"]');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('page contains known service names', async ({ publicPage }) => {
    const body = await publicPage.bodyText();
    const found = SERVICES.filter(s => body.includes(s.name));
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  test('footer is visible', async ({ publicPage }) => {
    await expect(publicPage.footer).toBeVisible();
  });

  test('footer contains clinic name', async ({ publicPage }) => {
    await expect(publicPage.footer).toContainText(new RegExp(CLINIC.name, 'i'));
  });

  test('footer contains clinic city', async ({ publicPage }) => {
    await expect(publicPage.footer).toContainText(CLINIC.city);
  });

  test('footer contains phone number', async ({ publicPage }) => {
    await expect(publicPage.footer).toContainText(CLINIC.phone);
  });

  test('images have valid src attributes', async ({ page }) => {
    await assertImagesValid(page);
  });

  test('SEO meta tags are present', async ({ page }) => {
    await assertSEOMeta(page);
  });

  test('JSON-LD structured data exists', async ({ publicPage }) => {
    const jsonLd = await publicPage.jsonLd();
    expect(jsonLd).toBeTruthy();
    expect(jsonLd!['@type']).toBeTruthy();
  });

  test('no critical console errors on load', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });
    expect(errors.length).toBeLessThanOrEqual(2);
  });
});

test.describe('Homepage — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu button is visible', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], header button, nav button').first();
    await expect(menuButton).toBeVisible();
  });

  test('page is scrollable on mobile without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
