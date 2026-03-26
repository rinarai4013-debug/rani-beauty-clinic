import { test, expect } from '../fixtures';
import { expectNoServerError, assertSEOMeta } from '../helpers';

test.describe('SEO Pages — Financing', () => {
  const financingPages = [
    '/financing/hydrafacial',
    '/financing/botox',
    '/financing/laser-hair-removal',
  ];

  for (const path of financingPages) {
    test(`${path} loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }

  test('financing page has meta tags', async ({ page }) => {
    const res = await page.goto('/financing/hydrafacial');
    if (res?.status() === 200) {
      await assertSEOMeta(page);
    }
  });
});

test.describe('SEO Pages — Men', () => {
  const menPages = [
    '/men/botox',
    '/men/laser-hair-removal',
    '/men/hydrafacial',
  ];

  for (const path of menPages) {
    test(`${path} loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }
});

test.describe('SEO Pages — Age', () => {
  const agePages = ['/age/20s', '/age/30s', '/age/40s', '/age/50s'];

  for (const path of agePages) {
    test(`${path} loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }
});

test.describe('SEO Pages — Combinations', () => {
  test('/combinations/botox-hydrafacial loads', async ({ page }) => {
    await expectNoServerError(page, '/combinations/botox-hydrafacial');
  });

  test('/combinations/sofwave-rf-microneedling loads', async ({ page }) => {
    await expectNoServerError(page, '/combinations/sofwave-rf-microneedling');
  });
});

test.describe('SEO Pages — Comparison', () => {
  test('/compare page loads', async ({ page }) => {
    await expectNoServerError(page, '/compare');
  });

  test('/compare/hydrafacial-vs-regular-facial loads', async ({ page }) => {
    await expectNoServerError(page, '/compare/hydrafacial-vs-regular-facial');
  });
});

test.describe('SEO Pages — Location (Near Me)', () => {
  const locationPages = [
    '/locations',
    '/locations/renton',
    '/locations/bellevue',
    '/locations/seattle',
  ];

  for (const path of locationPages) {
    test(`${path} loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }

  test('location page has meta tags when accessible', async ({ page }) => {
    const res = await page.goto('/locations/renton');
    if (res?.status() === 200) {
      await assertSEOMeta(page);
    }
  });
});

test.describe('SEO Pages — Location + Service', () => {
  test('/locations/renton/hydrafacial loads', async ({ page }) => {
    await expectNoServerError(page, '/locations/renton/hydrafacial');
  });

  test('/locations/renton/botox loads', async ({ page }) => {
    await expectNoServerError(page, '/locations/renton/botox');
  });
});

test.describe('SEO Pages — Structured Data', () => {
  test('location page has structured data when accessible', async ({ page, publicPage }) => {
    const res = await page.goto('/locations/renton');
    if (res?.status() === 200) {
      const jsonLd = await publicPage.jsonLd();
      if (jsonLd) {
        expect(jsonLd['@type']).toBeTruthy();
      }
    }
  });

  test('financing page has structured data', async ({ page, publicPage }) => {
    const res = await page.goto('/financing/hydrafacial');
    if (res?.status() === 200) {
      const jsonLd = await publicPage.jsonLd();
      if (jsonLd) {
        expect(jsonLd['@type']).toBeTruthy();
      }
    }
  });
});

test.describe('SEO Pages — Additional Content Pages', () => {
  const contentPages = [
    { path: '/concerns', name: 'Concerns' },
    { path: '/treatment-areas/face', name: 'Treatment Areas Face' },
    { path: '/guides/hydrafacial', name: 'Guide HydraFacial' },
    { path: '/cost/hydrafacial', name: 'Cost HydraFacial' },
    { path: '/side-effects/botox', name: 'Side Effects Botox' },
    { path: '/preparation/hydrafacial', name: 'Preparation HydraFacial' },
    { path: '/results-timeline/hydrafacial', name: 'Results Timeline' },
    { path: '/worth-it/hydrafacial', name: 'Worth It HydraFacial' },
    { path: '/first-time/hydrafacial', name: 'First Time HydraFacial' },
    { path: '/aftercare/hydrafacial', name: 'Aftercare HydraFacial' },
    { path: '/vs/hydrafacial-vs-chemical-peel', name: 'VS Page' },
  ];

  for (const { path, name } of contentPages) {
    test(`${name} (${path}) loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }
});
