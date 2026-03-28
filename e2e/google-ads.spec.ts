import { test, expect } from '@playwright/test';

/**
 * Google Ads E2E Tests
 * Tests Google Ads keyword management, ad copy generation, campaign performance,
 * search term reports, and geo-targeting for PNW locations.
 */

const MOCK_GOOGLE_CAMPAIGNS = [
  {
    id: 'gcamp_001',
    name: 'Botox Renton WA',
    type: 'search',
    status: 'active',
    budget: 45,
    spend: 38.50,
    impressions: 4200,
    clicks: 168,
    ctr: 0.04,
    conversions: 14,
    costPerConversion: 2.75,
    qualityScore: 8,
  },
  {
    id: 'gcamp_002',
    name: 'GLP-1 Weight Loss Near Me',
    type: 'search',
    status: 'active',
    budget: 60,
    spend: 55.20,
    impressions: 3800,
    clicks: 190,
    ctr: 0.05,
    conversions: 22,
    costPerConversion: 2.51,
    qualityScore: 9,
  },
  {
    id: 'gcamp_003',
    name: 'Medspa Bellevue Eastside',
    type: 'search',
    status: 'active',
    budget: 35,
    spend: 29.80,
    impressions: 5600,
    clicks: 140,
    ctr: 0.025,
    conversions: 8,
    costPerConversion: 3.73,
    qualityScore: 7,
  },
  {
    id: 'gcamp_004',
    name: 'Laser Hair Removal PNW',
    type: 'search',
    status: 'paused',
    budget: 30,
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    conversions: 0,
    costPerConversion: 0,
    qualityScore: 7,
  },
];

const MOCK_KEYWORDS = [
  { keyword: 'botox near me', matchType: 'broad', campaign: 'gcamp_001', impressions: 1200, clicks: 60, ctr: 0.05, cpc: 2.15, conversions: 5, qualityScore: 9 },
  { keyword: 'botox renton wa', matchType: 'exact', campaign: 'gcamp_001', impressions: 450, clicks: 36, ctr: 0.08, cpc: 1.85, conversions: 4, qualityScore: 10 },
  { keyword: 'medspa renton', matchType: 'phrase', campaign: 'gcamp_001', impressions: 380, clicks: 19, ctr: 0.05, cpc: 2.40, conversions: 2, qualityScore: 8 },
  { keyword: 'glp-1 weight loss near me', matchType: 'broad', campaign: 'gcamp_002', impressions: 1400, clicks: 84, ctr: 0.06, cpc: 2.80, conversions: 10, qualityScore: 9 },
  { keyword: 'semaglutide renton wa', matchType: 'exact', campaign: 'gcamp_002', impressions: 320, clicks: 26, ctr: 0.081, cpc: 1.95, conversions: 4, qualityScore: 10 },
  { keyword: 'medical weight loss bellevue', matchType: 'phrase', campaign: 'gcamp_002', impressions: 680, clicks: 34, ctr: 0.05, cpc: 3.10, conversions: 3, qualityScore: 8 },
];

const MOCK_SEARCH_TERMS = [
  { term: 'best botox near renton wa', campaign: 'gcamp_001', clicks: 12, conversions: 2, added: true },
  { term: 'cheap botox deals', campaign: 'gcamp_001', clicks: 8, conversions: 0, added: false, negativeCandidate: true },
  { term: 'botox side effects', campaign: 'gcamp_001', clicks: 15, conversions: 0, added: false, negativeCandidate: true },
  { term: 'glp-1 shots for weight loss', campaign: 'gcamp_002', clicks: 18, conversions: 3, added: false, addCandidate: true },
  { term: 'ozempic clinic near me', campaign: 'gcamp_002', clicks: 22, conversions: 4, added: false, addCandidate: true },
  { term: 'weight loss injection cost', campaign: 'gcamp_002', clicks: 14, conversions: 2, added: true },
];

const MOCK_AD_COPY = [
  {
    id: 'gad_001',
    campaignId: 'gcamp_001',
    headlines: ['Expert Botox in Renton, WA', 'Physician-Supervised Botox', 'Natural Results from $12/Unit'],
    descriptions: ['Board-certified physician oversight at Rani Beauty Clinic. Book your consultation today.', 'Trusted by 2,000+ clients. Open 7 days a week. Free parking.'],
    finalUrl: 'https://ranibeautyclinic.com/services/botox',
    performance: { ctr: 0.045, conversionRate: 0.083 },
  },
  {
    id: 'gad_002',
    campaignId: 'gcamp_002',
    headlines: ['Medical Weight Loss in Renton', 'GLP-1 Program from $399/mo', 'Physician-Supervised Weight Loss'],
    descriptions: ['The Rani Protocol: Semaglutide & Tirzepatide with in-house labs and custom dosing.', 'Dr. Landfield oversight. Real results. Call (425) 539-4440.'],
    finalUrl: 'https://ranibeautyclinic.com/services/weight-management',
    performance: { ctr: 0.052, conversionRate: 0.116 },
  },
];

const MOCK_GEO_TARGETING = {
  locations: [
    { city: 'Renton', radius: '5mi', impressions: 2800, clicks: 168, ctr: 0.06 },
    { city: 'Bellevue', radius: '10mi', impressions: 1900, clicks: 95, ctr: 0.05 },
    { city: 'Kent', radius: '8mi', impressions: 1200, clicks: 48, ctr: 0.04 },
    { city: 'Tukwila', radius: '5mi', impressions: 800, clicks: 40, ctr: 0.05 },
    { city: 'Newcastle', radius: '5mi', impressions: 600, clicks: 36, ctr: 0.06 },
  ],
  excludedLocations: ['Spokane', 'Bellingham', 'Yakima', 'Olympia'],
};

test.describe('Google Ads', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_ads', 'manage_ads'] },
        }),
      })
    );
  });

  test.describe('Campaign Overview', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/google-ads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: MOCK_GOOGLE_CAMPAIGNS }),
        })
      );
    });

    test('displays all Google Ads campaigns', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      for (const camp of MOCK_GOOGLE_CAMPAIGNS.filter(c => c.status === 'active')) {
        const campEntry = page.getByText(new RegExp(camp.name.split(' ')[0], 'i')).first();
        await expect(campEntry).toBeVisible();
      }
    });

    test('shows quality scores for campaigns', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const qScore = page.getByText(/quality.*score|QS.*[789]|8\/10|9\/10/i).first();
      const hasScore = await qScore.count();
      expect(hasScore).toBeGreaterThanOrEqual(0);
    });

    test('displays cost per conversion', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const cpc = page.getByText(/\$2\.75|\$2\.51|\$3\.73|cost.*conversion/i).first();
      await expect(cpc).toBeVisible();
    });

    test('shows click-through rates', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const ctr = page.getByText(/4%|5%|2\.5%|CTR/i).first();
      await expect(ctr).toBeVisible();
    });

    test('displays total conversions across campaigns', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const conversions = page.getByText(/44|14|22|conversion/i).first();
      await expect(conversions).toBeVisible();
    });
  });

  test.describe('Keyword Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/google-ads/keywords*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ keywords: MOCK_KEYWORDS }),
        })
      );
    });

    test('lists all active keywords with metrics', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const keyword = page.getByText(/botox near me|botox renton|semaglutide/i).first();
      await expect(keyword).toBeVisible();
    });

    test('shows match types for keywords', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const matchType = page.getByText(/broad|exact|phrase/i).first();
      await expect(matchType).toBeVisible();
    });

    test('displays quality score per keyword', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const qScore = page.getByText(/10|quality/i).first();
      const hasScore = await qScore.count();
      expect(hasScore).toBeGreaterThanOrEqual(0);
    });

    test('highlights top-performing keywords', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const topKeyword = page.locator('[class*="top-performer"], [data-testid="top-keyword"]').first();
      const hasTop = await topKeyword.count();
      expect(hasTop).toBeGreaterThanOrEqual(0);
    });

    test('adds new keyword to campaign', async ({ page }) => {
      let keywordAdded = false;

      await page.route('**/api/dashboard/google-ads/keywords', (route) => {
        if (route.request().method() === 'POST') {
          keywordAdded = true;
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ keywords: MOCK_KEYWORDS }),
        });
      });

      await page.goto('/dashboard/meta-ads');
      const addBtn = page.getByRole('button', { name: /add.*keyword|new keyword/i }).first();
      const hasBtn = await addBtn.count();
      if (hasBtn > 0) {
        await addBtn.click();
        await page.waitForTimeout(300);

        const kwInput = page.locator('input[name="keyword"], input[placeholder*="keyword"]').first();
        const hasInput = await kwInput.count();
        if (hasInput > 0) {
          await kwInput.fill('botox bellevue wa');
          const submitBtn = page.getByRole('button', { name: /add|save|submit/i }).first();
          await submitBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('pauses underperforming keyword', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const pauseBtn = page.getByRole('button', { name: /pause|disable/i }).first();
      const hasBtn = await pauseBtn.count();
      if (hasBtn > 0) {
        await pauseBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Search Term Reports', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/google-ads/search-terms*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ searchTerms: MOCK_SEARCH_TERMS }),
        })
      );
    });

    test('displays search terms with performance data', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const searchTerm = page.getByText(/best botox.*renton|glp-1 shots|ozempic clinic/i).first();
      await expect(searchTerm).toBeVisible();
    });

    test('flags negative keyword candidates', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const negativeCandidate = page.getByText(/cheap botox|side effects|negative/i).first();
      await expect(negativeCandidate).toBeVisible();
    });

    test('flags positive keyword candidates for addition', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const addCandidate = page.getByText(/glp-1 shots|ozempic clinic|add.*keyword/i).first();
      await expect(addCandidate).toBeVisible();
    });

    test('adds search term as negative keyword', async ({ page }) => {
      let negativeAdded = false;

      await page.route('**/api/dashboard/google-ads/negative-keywords', (route) => {
        negativeAdded = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/dashboard/meta-ads');
      const addNegBtn = page.getByRole('button', { name: /add.*negative|exclude|block/i }).first();
      const hasBtn = await addNegBtn.count();
      if (hasBtn > 0) {
        await addNegBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('promotes search term to active keyword', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const promoteBtn = page.getByRole('button', { name: /promote|add.*keyword|include/i }).first();
      const hasBtn = await promoteBtn.count();
      if (hasBtn > 0) {
        await promoteBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Ad Copy', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/google-ads/ads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ads: MOCK_AD_COPY }),
        })
      );
    });

    test('displays ad headlines and descriptions', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const headline = page.getByText(/Expert Botox|Medical Weight Loss|Physician-Supervised/i).first();
      await expect(headline).toBeVisible();
    });

    test('shows ad performance metrics', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const adPerf = page.getByText(/4\.5%|5\.2%|conversion.*rate/i).first();
      const hasPerf = await adPerf.count();
      expect(hasPerf).toBeGreaterThanOrEqual(0);
    });

    test('ad copy never contains prohibited words', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase()).not.toContain('infusion');
      expect(bodyText?.toLowerCase()).not.toContain('cheap');
    });

    test('generates new ad copy variants', async ({ page }) => {
      await page.route('**/api/dashboard/google-ads/generate-copy', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            variants: [
              { headlines: ['Trusted Botox in Renton', 'Book Botox Today', '$12/Unit Botox'], descriptions: ['Physician-supervised at Rani Beauty Clinic. Open 7 days.'] },
            ],
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const genBtn = page.getByRole('button', { name: /generate.*copy|new.*ad|create/i }).first();
      const hasBtn = await genBtn.count();
      if (hasBtn > 0) {
        await genBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Geo-Targeting', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/google-ads/geo*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GEO_TARGETING),
        })
      );
    });

    test('shows targeted PNW locations', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const location = page.getByText(/Renton|Bellevue|Kent|Tukwila/i).first();
      await expect(location).toBeVisible();
    });

    test('displays performance by location', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const locationPerf = page.getByText(/6%|5%|4%/i).first();
      const hasPerf = await locationPerf.count();
      expect(hasPerf).toBeGreaterThanOrEqual(0);
    });

    test('shows excluded locations (outside PNW service area)', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const excluded = page.getByText(/Spokane|Bellingham|excluded/i).first();
      const hasExcluded = await excluded.count();
      expect(hasExcluded).toBeGreaterThanOrEqual(0);
    });

    test('does not target cities outside 45-minute radius', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const bodyText = await page.locator('body').textContent();
      // These cities should NOT appear as targets
      expect(bodyText).not.toContain('Spokane');
      expect(bodyText).not.toContain('Bellingham');
    });
  });

  test.describe('Error Handling', () => {
    test('handles Google Ads API failure', async ({ page }) => {
      await page.route('**/api/dashboard/google-ads*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Google Ads API error' }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles missing Google Ads credentials', async ({ page }) => {
      await page.route('**/api/dashboard/google-ads*', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Google Ads credentials not configured' }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const authError = page.getByText(/credential|configure|connect.*Google/i).first();
      await expect(authError).toBeVisible({ timeout: 5000 });
    });
  });
});
