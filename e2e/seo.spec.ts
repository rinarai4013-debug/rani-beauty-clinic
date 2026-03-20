import { test, expect } from '@playwright/test';

test.describe('SEO Essentials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('meta description exists and is not empty', async ({ page }) => {
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });

  test('Open Graph tags are present', async ({ page }) => {
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();
  });

  test('canonical URL is set', async ({ page }) => {
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
  });

  test('H1 tag exists on homepage', async ({ page }) => {
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('JSON-LD structured data exists', async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);

    const content = await jsonLd.first().textContent();
    const parsed = JSON.parse(content!);
    expect(parsed['@type']).toBeTruthy();
  });

  test('images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    let missingAlt = 0;

    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (!alt || alt.trim() === '') missingAlt++;
    }

    // Allow at most 2 decorative images without alt
    expect(missingAlt).toBeLessThanOrEqual(2);
  });
});
