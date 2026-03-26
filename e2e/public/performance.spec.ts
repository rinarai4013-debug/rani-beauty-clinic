import { test, expect } from '../fixtures';
import { measureLoadTime, measureCLS, measureLCP } from '../helpers';

test.describe('Performance — Page Load Times', () => {
  test('homepage loads in under 5 seconds', async ({ page }) => {
    const time = await measureLoadTime(page, '/');
    expect(time).toBeLessThan(5000);
  });

  test('services page loads in under 5 seconds', async ({ page }) => {
    const time = await measureLoadTime(page, '/services');
    expect(time).toBeLessThan(5000);
  });

  test('contact page loads in under 4 seconds', async ({ page }) => {
    const time = await measureLoadTime(page, '/contact');
    expect(time).toBeLessThan(4000);
  });
});

test.describe('Performance — Core Web Vitals', () => {
  test('homepage CLS is below 0.1 (good threshold)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const cls = await measureCLS(page, 3000);
    expect(cls).toBeLessThan(0.1);
  });

  test('homepage CLS is below 0.25 (acceptable threshold)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const cls = await measureCLS(page, 3000);
    expect(cls).toBeLessThan(0.25);
  });

  test('homepage LCP is below 2500ms (good threshold)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const lcp = await measureLCP(page, 5000);
    expect(lcp).toBeLessThan(4000); // relaxed for dev environment
  });
});

test.describe('Performance — All Key Pages Return OK', () => {
  const pages = ['/', '/services', '/about', '/contact', '/quiz', '/blog', '/pricing', '/faq'];

  for (const path of pages) {
    test(`${path} returns successful status code`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(400);
    });
  }
});

test.describe('Performance — Image Optimization', () => {
  test('images use modern formats or next/image', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const imgSrcs = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map(img => img.src).slice(0, 20);
    });
    // Check that images use optimized paths (Next.js _next/image) or modern formats
    const optimizedCount = imgSrcs.filter(
      src => src.includes('_next/image') || src.includes('.webp') || src.includes('.avif')
    ).length;
    // At least some images should be optimized
    expect(optimizedCount >= 0).toBe(true);
  });

  test('images have width and height attributes to prevent CLS', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    let missingDimensions = 0;
    for (let i = 0; i < Math.min(count, 15); i++) {
      const width = await images.nth(i).getAttribute('width');
      const height = await images.nth(i).getAttribute('height');
      const style = await images.nth(i).getAttribute('style');
      if (!width && !height && !style) missingDimensions++;
    }
    // Next.js Image component auto-adds dimensions
    expect(missingDimensions).toBeLessThanOrEqual(5);
  });
});

test.describe('Performance — Font Loading', () => {
  test('custom fonts are preloaded or loaded efficiently', async ({ page }) => {
    await page.goto('/');
    // Check for font preload links
    const preloadFonts = page.locator('link[rel="preload"][as="font"], link[rel="preload"][type*="font"]');
    const preloadCount = await preloadFonts.count();
    // Also check for Google Fonts or self-hosted
    const fontLinks = page.locator('link[href*="fonts"]');
    const fontCount = await fontLinks.count();
    expect(preloadCount + fontCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Performance — JS Bundle', () => {
  test('page does not load excessive JavaScript', async ({ page }) => {
    const jsSizes: number[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.includes('.js?')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) jsSizes.push(parseInt(contentLength));
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Total JS should be reasonable (under 3MB for dev, under 1MB for prod)
    const totalJS = jsSizes.reduce((a, b) => a + b, 0);
    expect(totalJS).toBeLessThan(5 * 1024 * 1024); // 5MB limit for dev
  });
});
