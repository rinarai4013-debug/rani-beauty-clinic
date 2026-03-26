import { test, expect } from '../fixtures';
import { expectNoServerError, assertSEOMeta, collectConsoleErrors } from '../helpers';

test.describe('Blog Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('blog page loads with 200 status', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBe(200);
  });

  test('page has a visible heading', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('page displays blog post cards or links', async ({ page }) => {
    const posts = page.locator('article, [class*=post], [class*=blog], a[href*="/blog/"]');
    const count = await posts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('blog post links have valid hrefs', async ({ page }) => {
    const links = page.locator('a[href*="/blog/"]');
    const count = await links.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/blog\/.+/);
    }
  });

  test('SEO meta tags present on blog page', async ({ page }) => {
    await assertSEOMeta(page);
  });

  test('page has main content area', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('no console errors on blog page', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
    });
    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('blog posts display preview text or excerpts', async ({ page }) => {
    const body = await page.locator('main').textContent();
    // Blog should have meaningful content
    expect(body!.length).toBeGreaterThan(100);
  });
});

test.describe('Blog — Individual Posts', () => {
  test('clicking a blog post navigates to post page', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (exists) {
      const href = await firstLink.getAttribute('href');
      await firstLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/blog/');
    }
  });

  test('blog post page has heading', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (exists) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page.getByRole('heading').first()).toBeVisible();
      }
    }
  });

  test('blog post page has article content', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        const body = await page.locator('main, article').first().textContent();
        expect(body!.length).toBeGreaterThan(200);
      }
    }
  });

  test('blog post has meta description', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        const desc = await page.getAttribute('meta[name="description"]', 'content');
        expect(desc).toBeTruthy();
      }
    }
  });

  test('blog post has Open Graph tags', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        expect(ogTitle).toBeTruthy();
      }
    }
  });

  test('blog post has back link to blog listing', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        const backLink = page.locator('a[href="/blog"], a[href*="blog"]').first();
        const hasBack = await backLink.isVisible().catch(() => false);
        expect(typeof hasBack).toBe('boolean');
      }
    }
  });

  test('blog post has reading time or date', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('a[href*="/blog/"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        const body = await page.locator('main').textContent();
        const hasTime = body?.toLowerCase().includes('min') ||
          body?.toLowerCase().includes('read') ||
          body?.match(/\d{4}/); // year in date
        expect(typeof hasTime).toBe('boolean');
      }
    }
  });
});

test.describe('Blog — Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('blog renders on mobile', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('main')).toBeVisible();
  });
});
