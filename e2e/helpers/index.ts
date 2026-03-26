import { type Page, expect } from '@playwright/test';

/**
 * Checks that a page returns a non-error HTTP status
 */
export async function expectPageLoads(page: Page, path: string, maxStatus = 499) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThanOrEqual(maxStatus);
  return response;
}

/**
 * Checks the page returns exactly 200
 */
export async function expectPageOk(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} returned ${response?.status()}`).toBe(200);
  return response;
}

/**
 * Asserts that no server error (5xx) is returned
 */
export async function expectNoServerError(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(500);
  return response;
}

/**
 * Collects console errors during an action
 */
export async function collectConsoleErrors(page: Page, action: () => Promise<void>): Promise<string[]> {
  const errors: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler);
  await action();
  page.removeListener('console', handler);
  return errors.filter(
    e => !e.includes('favicon') && !e.includes('third-party') && !e.includes('hydration')
  );
}

/**
 * Measures page load time in ms
 */
export async function measureLoadTime(
  page: Page,
  path: string,
  waitUntil: 'domcontentloaded' | 'load' | 'networkidle' = 'domcontentloaded'
): Promise<number> {
  const start = Date.now();
  await page.goto(path, { waitUntil });
  return Date.now() - start;
}

/**
 * Gets CLS (Cumulative Layout Shift) via PerformanceObserver
 */
export async function measureCLS(page: Page, waitMs = 3000): Promise<number> {
  return page.evaluate((ms) => {
    return new Promise<number>((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
            clsValue += (entry as unknown as { value: number }).value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, ms);
    });
  }, waitMs);
}

/**
 * Gets LCP (Largest Contentful Paint) in ms
 */
export async function measureLCP(page: Page, waitMs = 5000): Promise<number> {
  return page.evaluate((ms) => {
    return new Promise<number>((resolve) => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lcpValue = (entry as unknown as { startTime: number }).startTime;
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, ms);
    });
  }, waitMs);
}

/**
 * Asserts that a page has valid meta tags for SEO
 */
export async function assertSEOMeta(page: Page) {
  const title = await page.title();
  expect(title.length, 'Page title should not be empty').toBeGreaterThan(0);

  const desc = await page.getAttribute('meta[name="description"]', 'content');
  expect(desc, 'Meta description should exist').toBeTruthy();
  expect(desc!.length, 'Meta description should be meaningful').toBeGreaterThan(10);
}

/**
 * Asserts that a page has Open Graph tags
 */
export async function assertOpenGraph(page: Page) {
  const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
  const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
  expect(ogTitle, 'og:title should exist').toBeTruthy();
  expect(ogDesc, 'og:description should exist').toBeTruthy();
}

/**
 * Checks images have src and most have alt attributes
 */
export async function assertImagesValid(page: Page, maxMissingAlt = 3) {
  const images = page.locator('img');
  const count = await images.count();
  let missingAlt = 0;
  for (let i = 0; i < Math.min(count, 30); i++) {
    const src = await images.nth(i).getAttribute('src');
    expect(src, `Image ${i} should have src`).toBeTruthy();
    const alt = await images.nth(i).getAttribute('alt');
    if (!alt || alt.trim() === '') missingAlt++;
  }
  expect(missingAlt, 'Too many images missing alt text').toBeLessThanOrEqual(maxMissingAlt);
}

/**
 * Assert heading hierarchy is valid (h1 before h2 before h3 etc.)
 */
export async function assertHeadingHierarchy(page: Page) {
  const headings = await page.evaluate(() => {
    const els = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(els).map(el => parseInt(el.tagName[1]));
  });
  expect(headings.length, 'Page should have at least one heading').toBeGreaterThan(0);
  // First heading should be h1
  expect(headings[0], 'First heading should be h1').toBe(1);
  // No heading should skip more than 1 level
  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i] - headings[i - 1];
    expect(jump, `Heading hierarchy skip at index ${i}`).toBeLessThanOrEqual(1);
  }
}

/**
 * Check no horizontal overflow
 */
export async function assertNoHorizontalOverflow(page: Page, tolerance = 20) {
  const { bodyWidth, viewportWidth } = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(bodyWidth, 'Body should not overflow viewport').toBeLessThanOrEqual(viewportWidth + tolerance);
}

/**
 * API helper: make a request and check status
 */
export async function apiExpectStatus(
  request: { get: (url: string) => Promise<{ status: () => number }>; post: (url: string, options?: object) => Promise<{ status: () => number }> },
  method: 'get' | 'post',
  url: string,
  expectedStatuses: number[],
  body?: object,
) {
  const response = method === 'post'
    ? await request.post(url, { data: body })
    : await request.get(url);
  expect(expectedStatuses, `${method.toUpperCase()} ${url} returned ${response.status()}`).toContain(response.status());
}
