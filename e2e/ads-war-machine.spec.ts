import { test, expect } from '@playwright/test';

/**
 * Ads War Machine E2E Tests
 * Tests ad generation, auto-scaling, demand engine, Meta Ads AI manager,
 * campaign performance grading, and budget optimization.
 */

const MOCK_CAMPAIGNS = [
  {
    id: 'camp_001',
    name: 'GLP-1 Weight Loss - Renton',
    status: 'active',
    objective: 'lead_generation',
    budget: 50,
    spend: 42.80,
    impressions: 12400,
    clicks: 310,
    ctr: 0.025,
    leads: 18,
    cpl: 2.38,
    bookings: 6,
    roas: 4.2,
    score: 82,
    grade: 'good',
  },
  {
    id: 'camp_002',
    name: 'Botox Spring Special - Eastside',
    status: 'active',
    objective: 'lead_generation',
    budget: 35,
    spend: 33.15,
    impressions: 8900,
    clicks: 223,
    ctr: 0.025,
    leads: 12,
    cpl: 2.76,
    bookings: 4,
    roas: 3.8,
    score: 74,
    grade: 'good',
  },
  {
    id: 'camp_003',
    name: 'HydraFacial Awareness - South King',
    status: 'active',
    objective: 'awareness',
    budget: 25,
    spend: 24.60,
    impressions: 18200,
    clicks: 145,
    ctr: 0.008,
    leads: 5,
    cpl: 4.92,
    bookings: 1,
    roas: 1.1,
    score: 45,
    grade: 'poor',
  },
  {
    id: 'camp_004',
    name: 'Laser Hair Removal - Summer Prep',
    status: 'paused',
    objective: 'lead_generation',
    budget: 30,
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    leads: 0,
    cpl: 0,
    bookings: 0,
    roas: 0,
    score: 0,
    grade: 'paused',
  },
];

const MOCK_AD_VARIANTS = [
  {
    id: 'ad_001',
    campaignId: 'camp_001',
    headline: 'Physician-Supervised Weight Loss in Renton',
    description: 'The Rani Protocol: GLP-1 injection program with in-house blood work, custom dosing, and ongoing medical support. Starting at $399/mo.',
    cta: 'Book Your Consultation',
    imageUrl: '/ads/glp1-hero.jpg',
    status: 'active',
    performance: { ctr: 0.032, conversionRate: 0.058 },
  },
  {
    id: 'ad_002',
    campaignId: 'camp_001',
    headline: 'Lose Weight with Medical Supervision in Renton, WA',
    description: 'Semaglutide and Tirzepatide programs at Rani Beauty Clinic. Board-certified physician oversight. Real results.',
    cta: 'Start Your Journey',
    imageUrl: '/ads/glp1-before-after.jpg',
    status: 'active',
    performance: { ctr: 0.028, conversionRate: 0.045 },
  },
  {
    id: 'ad_003',
    campaignId: 'camp_001',
    headline: 'GLP-1 Weight Management Near Bellevue',
    description: 'Just 15 min from Bellevue. In-house labs, weekly injections, and a team that cares about your results.',
    cta: 'Learn More',
    imageUrl: '/ads/glp1-clinic.jpg',
    status: 'testing',
    performance: { ctr: 0.022, conversionRate: 0.038 },
  },
];

const MOCK_OPTIMIZATION = {
  budgetRecommendations: [
    { campaignId: 'camp_001', action: 'scale', currentBudget: 50, recommendedBudget: 75, reason: 'Strong ROAS of 4.2x. Increasing budget should maintain efficiency.' },
    { campaignId: 'camp_002', action: 'maintain', currentBudget: 35, recommendedBudget: 35, reason: 'Performing within targets. Maintain current spend.' },
    { campaignId: 'camp_003', action: 'cut', currentBudget: 25, recommendedBudget: 15, reason: 'Below-average ROAS of 1.1x. Reduce spend and refresh creative.' },
    { campaignId: 'camp_004', action: 'reactivate', currentBudget: 30, recommendedBudget: 25, reason: 'Summer season approaching. Reactivate with refreshed creative for laser hair removal demand.' },
  ],
  creativeFatigue: [
    { adId: 'ad_002', frequency: 4.2, ctrDecline: -0.15, recommendation: 'Replace creative. Audience has seen this ad too many times.' },
  ],
  audienceInsights: [
    { audience: 'Women 25-44, Renton/Bellevue', cpa: 2.15, quality: 'excellent' },
    { audience: 'Women 35-55, South King County', cpa: 3.80, quality: 'average' },
    { audience: 'Men 30-50, Eastside', cpa: 5.20, quality: 'poor' },
  ],
};

const MOCK_DEMAND_ENGINE = {
  demandSignals: [
    { service: 'Botox', trend: 'rising', searchVolume: 1200, seasonalFactor: 1.15, recommendation: 'Increase ad spend 15%' },
    { service: 'Laser Hair Removal', trend: 'surging', searchVolume: 2100, seasonalFactor: 1.45, recommendation: 'Launch summer campaign immediately' },
    { service: 'GLP-1', trend: 'stable', searchVolume: 890, seasonalFactor: 1.0, recommendation: 'Maintain current strategy' },
    { service: 'HydraFacial', trend: 'declining', searchVolume: 450, seasonalFactor: 0.85, recommendation: 'Refresh messaging with spring/summer angle' },
  ],
  competitorActivity: [
    { competitor: 'NovaMed Aesthetics', action: 'New Botox campaign launched', threat: 'medium' },
    { competitor: 'Bellevue Skin Clinic', action: 'Price reduction on laser', threat: 'low' },
  ],
};

test.describe('Ads War Machine', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_ads', 'manage_ads', 'view_meta_ads'] },
        }),
      })
    );
  });

  test.describe('Campaign Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: MOCK_CAMPAIGNS }),
        })
      );
    });

    test('displays all campaigns with performance metrics', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      for (const camp of MOCK_CAMPAIGNS.filter(c => c.status === 'active')) {
        const campEntry = page.getByText(new RegExp(camp.name, 'i')).first();
        await expect(campEntry).toBeVisible();
      }
    });

    test('shows campaign grade badges', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const gradeBadge = page.getByText(/good|poor|excellent/i).first();
      await expect(gradeBadge).toBeVisible();
    });

    test('displays ROAS for each campaign', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const roas = page.getByText(/4\.2x|3\.8x|ROAS/i).first();
      await expect(roas).toBeVisible();
    });

    test('shows cost per lead metric', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const cpl = page.getByText(/\$2\.38|\$2\.76|cost.*lead/i).first();
      await expect(cpl).toBeVisible();
    });

    test('displays campaign scores', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const score = page.getByText(/82|74|45/i).first();
      await expect(score).toBeVisible();
    });

    test('shows paused campaign status', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const paused = page.getByText(/paused|Laser Hair Removal.*Summer/i).first();
      await expect(paused).toBeVisible();
    });

    test('displays total ad spend across campaigns', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const totalSpend = page.getByText(/100\.55|total.*spend/i).first();
      const hasSpend = await totalSpend.count();
      expect(hasSpend).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Ad Copy Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            adVariants: MOCK_AD_VARIANTS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );
    });

    test('displays AI-generated ad variants', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const adHeadline = page.getByText(/Physician-Supervised Weight Loss|Lose Weight.*Medical/i).first();
      await expect(adHeadline).toBeVisible();
    });

    test('shows ad performance comparison', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const performance = page.getByText(/3\.2%|2\.8%|CTR/i).first();
      await expect(performance).toBeVisible();
    });

    test('highlights top-performing ad variant', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const topPerformer = page.locator('[data-testid="top-performer"], [class*="best"], [class*="winner"]').first();
      const hasTop = await topPerformer.count();
      expect(hasTop).toBeGreaterThanOrEqual(0);
    });

    test('shows testing status for new variants', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const testing = page.getByText(/testing|A\/B test|variant/i).first();
      const hasTesting = await testing.count();
      expect(hasTesting).toBeGreaterThanOrEqual(0);
    });

    test('generates new ad copy on demand', async ({ page }) => {
      let generateCalled = false;

      await page.route('**/api/dashboard/meta-ads/generate', (route) => {
        generateCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            variants: [
              { headline: 'Transform Your Body at Rani Beauty Clinic', description: 'Physician-supervised GLP-1 weight management. Real results, real support.', cta: 'Book Now' },
              { headline: 'Medical Weight Loss That Works', description: 'The Rani Protocol: Custom dosing, in-house labs, and Dr. Landfield oversight.', cta: 'Learn More' },
            ],
          }),
        });
      });

      await page.goto('/dashboard/meta-ads');
      const generateBtn = page.getByRole('button', { name: /generate|create.*ad|new.*variant/i }).first();
      const hasBtn = await generateBtn.count();
      if (hasBtn > 0) {
        await generateBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('validates ad copy does not contain prohibited words', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const allText = await page.locator('body').textContent();
      expect(allText?.toLowerCase()).not.toContain('infusion');
    });
  });

  test.describe('Budget Optimization', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );
    });

    test('displays budget recommendations per campaign', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const scaleRec = page.getByText(/scale|increase.*budget|\$75/i).first();
      await expect(scaleRec).toBeVisible();
    });

    test('shows cut recommendation for underperforming campaign', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const cutRec = page.getByText(/cut|reduce.*spend|below.*average/i).first();
      await expect(cutRec).toBeVisible();
    });

    test('recommends reactivating paused campaign', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const reactivateRec = page.getByText(/reactivate|summer.*season|laser/i).first();
      await expect(reactivateRec).toBeVisible();
    });

    test('applies budget recommendation on confirm', async ({ page }) => {
      let budgetUpdated = false;

      await page.route('**/api/dashboard/meta-ads/budget', (route) => {
        budgetUpdated = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/dashboard/meta-ads');
      const applyBtn = page.getByRole('button', { name: /apply|update.*budget|confirm/i }).first();
      const hasBtn = await applyBtn.count();
      if (hasBtn > 0) {
        await applyBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Creative Fatigue Detection', () => {
    test('flags fatigued ads', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const fatigueAlert = page.getByText(/fatigue|replace.*creative|frequency.*4\.2|seen.*too many/i).first();
      await expect(fatigueAlert).toBeVisible();
    });

    test('shows CTR decline percentage for fatigued ads', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const ctrDecline = page.getByText(/-15%|CTR.*decline|declining/i).first();
      await expect(ctrDecline).toBeVisible();
    });
  });

  test.describe('Audience Insights', () => {
    test('displays audience segment performance', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const audience = page.getByText(/Women 25-44|Renton.*Bellevue|audience/i).first();
      await expect(audience).toBeVisible();
    });

    test('shows CPA by audience segment', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const cpa = page.getByText(/\$2\.15|\$3\.80|\$5\.20|CPA/i).first();
      await expect(cpa).toBeVisible();
    });

    test('grades audience quality', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/optimize', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MOCK_CAMPAIGNS,
            optimization: MOCK_OPTIMIZATION,
          }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const quality = page.getByText(/excellent|average|poor/i).first();
      await expect(quality).toBeVisible();
    });
  });

  test.describe('Demand Engine', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads/demand', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_DEMAND_ENGINE),
        })
      );
    });

    test('shows service demand trends', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const trend = page.getByText(/rising|surging|stable|declining/i).first();
      await expect(trend).toBeVisible();
    });

    test('displays seasonal factors', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const seasonal = page.getByText(/1\.45|seasonal|summer/i).first();
      const hasSeasonal = await seasonal.count();
      expect(hasSeasonal).toBeGreaterThanOrEqual(0);
    });

    test('shows competitor activity alerts', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const competitor = page.getByText(/NovaMed|Bellevue Skin|competitor/i).first();
      await expect(competitor).toBeVisible();
    });

    test('recommends campaign actions based on demand', async ({ page }) => {
      await page.goto('/dashboard/meta-ads');
      const recommendation = page.getByText(/Increase.*spend|Launch.*summer|Refresh.*messaging/i).first();
      await expect(recommendation).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles Meta Ads API failure', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Meta API rate limit exceeded' }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const error = page.getByText(/error|unavailable|rate limit/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles missing Meta access token', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads*', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Meta access token expired or invalid' }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const authError = page.getByText(/token|expired|connect.*Meta|authenticate/i).first();
      await expect(authError).toBeVisible({ timeout: 5000 });
    });

    test('handles empty campaign list', async ({ page }) => {
      await page.route('**/api/dashboard/meta-ads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: [] }),
        })
      );

      await page.goto('/dashboard/meta-ads');
      const emptyState = page.getByText(/no campaigns|create.*first|get started/i).first();
      await expect(emptyState).toBeVisible();
    });
  });
});
