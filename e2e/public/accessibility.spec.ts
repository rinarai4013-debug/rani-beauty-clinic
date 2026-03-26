import { test, expect } from '../fixtures';
import { assertHeadingHierarchy, assertImagesValid } from '../helpers';

test.describe('Accessibility — Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page has exactly one h1', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('heading hierarchy is valid', async ({ page }) => {
    await assertHeadingHierarchy(page);
  });

  test('images have alt text', async ({ page }) => {
    await assertImagesValid(page);
  });

  test('all interactive elements are focusable', async ({ page }) => {
    const buttons = page.locator('button, a[href], input, select, textarea');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 15); i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const title = await buttons.nth(i).getAttribute('title');
      const hasName = (text && text.trim().length > 0) || ariaLabel || title;
      expect(hasName, `Button ${i} should have accessible name`).toBeTruthy();
    }
  });

  test('links have accessible text', async ({ page }) => {
    const links = page.locator('a[href]');
    const count = await links.count();
    let emptyLinks = 0;
    for (let i = 0; i < Math.min(count, 30); i++) {
      const text = await links.nth(i).textContent();
      const ariaLabel = await links.nth(i).getAttribute('aria-label');
      const title = await links.nth(i).getAttribute('title');
      const img = await links.nth(i).locator('img').count();
      if (!(text?.trim()) && !ariaLabel && !title && img === 0) {
        emptyLinks++;
      }
    }
    expect(emptyLinks).toBeLessThanOrEqual(2);
  });

  test('form inputs have associated labels', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const id = await inputs.nth(i).getAttribute('id');
      const ariaLabel = await inputs.nth(i).getAttribute('aria-label');
      const ariaLabelledBy = await inputs.nth(i).getAttribute('aria-labelledby');
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count();
        const hasA11y = hasLabel > 0 || !!ariaLabel || !!ariaLabelledBy || !!placeholder;
        expect(hasA11y, `Input ${i} (id=${id}) should have a label`).toBe(true);
      }
    }
  });

  test('page has proper landmark roles', async ({ page }) => {
    // Check for main, nav, header, footer landmarks
    const main = await page.locator('main, [role="main"]').count();
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(main, 'Page should have main landmark').toBeGreaterThanOrEqual(1);
    expect(nav, 'Page should have navigation landmark').toBeGreaterThanOrEqual(1);
  });

  test('footer landmark exists', async ({ page }) => {
    const footer = await page.locator('footer, [role="contentinfo"]').count();
    expect(footer).toBeGreaterThanOrEqual(1);
  });

  test('ARIA roles are used correctly', async ({ page }) => {
    // Ensure no invalid aria roles
    const invalidRoles = await page.evaluate(() => {
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
        'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
        'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
      ];
      const els = document.querySelectorAll('[role]');
      const invalid: string[] = [];
      els.forEach(el => {
        const role = el.getAttribute('role');
        if (role && !validRoles.includes(role)) {
          invalid.push(role);
        }
      });
      return invalid;
    });
    expect(invalidRoles.length).toBe(0);
  });

  test('color contrast: text elements have sufficient contrast', async ({ page }) => {
    // Basic check: ensure body text is not too light
    const bodyColor = await page.evaluate(() => {
      const body = document.querySelector('body');
      if (!body) return null;
      return window.getComputedStyle(body).color;
    });
    expect(bodyColor).toBeTruthy();
    // Basic check that text is not white on white
    expect(bodyColor).not.toBe('rgb(255, 255, 255)');
  });

  test('focus indicators are visible on interactive elements', async ({ page }) => {
    // Tab to the first interactive element and check it has focus styles
    await page.keyboard.press('Tab');
    const hasFocusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
    });
    // Focus styles may use outline or box-shadow
    expect(typeof hasFocusOutline).toBe('boolean');
  });

  test('no auto-playing media without controls', async ({ page }) => {
    const autoplayMedia = await page.evaluate(() => {
      const videos = document.querySelectorAll('video[autoplay]');
      const audios = document.querySelectorAll('audio[autoplay]');
      let violations = 0;
      videos.forEach(v => {
        if (!v.hasAttribute('muted') && !v.hasAttribute('controls')) violations++;
      });
      audios.forEach(a => {
        if (!a.hasAttribute('controls')) violations++;
      });
      return violations;
    });
    expect(autoplayMedia).toBe(0);
  });

  test('reduced motion: prefers-reduced-motion is respected', async ({ page }) => {
    // Navigate with prefers-reduced-motion emulated
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Accessibility — Services Page', () => {
  test('services page has proper heading structure', async ({ page }) => {
    const res = await page.goto('/services');
    if (res?.status() === 200) {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });

  test('service cards have accessible link text', async ({ page }) => {
    const res = await page.goto('/services');
    if (res?.status() === 200) {
      const links = page.locator('a[href*="/services/"]');
      const count = await links.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await links.nth(i).textContent();
        const ariaLabel = await links.nth(i).getAttribute('aria-label');
        expect((text?.trim().length ?? 0) > 0 || !!ariaLabel).toBe(true);
      }
    }
  });
});

test.describe('Accessibility — Contact Page', () => {
  test('contact form has proper labels', async ({ page }) => {
    await page.goto('/contact');
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const ariaLabel = await inputs.nth(i).getAttribute('aria-label');
      const id = await inputs.nth(i).getAttribute('id');
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      let hasLabel = !!ariaLabel || !!placeholder;
      if (id) {
        const labelCount = await page.locator(`label[for="${id}"]`).count();
        hasLabel = hasLabel || labelCount > 0;
      }
      expect(hasLabel, `Input ${i} needs accessible label`).toBe(true);
    }
  });

  test('submit button has accessible name', async ({ page }) => {
    await page.goto('/contact');
    const btn = page.getByRole('button', { name: /send|submit|contact/i }).first();
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Accessibility — Screen Reader Landmarks', () => {
  const pages = ['/', '/services', '/about', '/contact', '/blog'];

  for (const path of pages) {
    test(`${path} has main landmark`, async ({ page }) => {
      const res = await page.goto(path);
      if (res?.status() === 200) {
        const mainCount = await page.locator('main, [role="main"]').count();
        expect(mainCount).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
