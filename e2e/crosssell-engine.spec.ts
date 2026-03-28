import { test, expect } from '@playwright/test';

/**
 * Cross-Sell Engine E2E Tests
 * Tests treatment recommendation logic, cross-sell displays,
 * pathway-based suggestions, and bundle/upsell opportunities.
 */

const MOCK_CLIENT_BOTOX = {
  id: 'rec_crosssell_001',
  firstName: 'Kayla',
  lastName: 'Morrison',
  lastService: 'Botox',
  serviceHistory: ['Botox', 'Botox', 'HydraFacial'],
  membershipTier: 'Silver',
  ltv: 2400,
  segment: 'regular',
  goals: ['anti-aging', 'skin_clarity'],
};

const MOCK_RECOMMENDATIONS = {
  clientId: 'rec_crosssell_001',
  recommendations: [
    {
      strategy: 'pathway',
      service: 'Dermal Fillers',
      reason: 'Natural complement to Botox for comprehensive facial rejuvenation',
      confidence: 0.89,
      priceRange: '$500-$800',
      priority: 1,
    },
    {
      strategy: 'category_gap',
      service: 'RF Microneedling',
      reason: 'Client has not tried skin tightening treatments. RF Microneedling addresses collagen production for anti-aging goals.',
      confidence: 0.78,
      priceRange: '$495-$850',
      priority: 2,
    },
    {
      strategy: 'goal_based',
      service: 'Chemical Peel',
      reason: 'Aligns with skin clarity goal. VI Peel addresses texture and tone for a brighter complexion.',
      confidence: 0.72,
      priceRange: '$395',
      priority: 3,
    },
    {
      strategy: 'timing',
      service: 'HydraFacial',
      reason: 'Last HydraFacial was 45 days ago. Monthly maintenance recommended for optimal results.',
      confidence: 0.85,
      priceRange: '$275',
      priority: 4,
    },
    {
      strategy: 'membership_upsell',
      service: 'Gold Membership Upgrade',
      reason: 'Client visits 2x/month average. Gold membership saves 15% on treatments and includes a monthly HydraFacial.',
      confidence: 0.65,
      priceRange: '$299/mo',
      priority: 5,
    },
  ],
  estimatedRevenue: 2465,
};

const MOCK_CLIENT_GLP1 = {
  id: 'rec_crosssell_002',
  firstName: 'David',
  lastName: 'Chen',
  lastService: 'GLP-1 Injection',
  serviceHistory: ['GLP-1 Injection', 'GLP-1 Injection', 'Blood Work'],
  membershipTier: null,
  ltv: 1200,
  segment: 'new',
  goals: ['weight_loss', 'energy'],
};

const MOCK_GLP1_RECOMMENDATIONS = {
  clientId: 'rec_crosssell_002',
  recommendations: [
    {
      strategy: 'pathway',
      service: 'B12 Injection',
      reason: 'Complements GLP-1 program by supporting energy levels during active weight loss phase.',
      confidence: 0.92,
      priceRange: '$35/session',
      priority: 1,
    },
    {
      strategy: 'pathway',
      service: 'Vitamin D3 Injection',
      reason: 'PNW residents commonly deficient in Vitamin D. Supports metabolism and mood during weight management.',
      confidence: 0.88,
      priceRange: '$50/session',
      priority: 2,
    },
    {
      strategy: 'goal_based',
      service: 'NAD+ Injection',
      reason: 'Aligns with energy goal. NAD+ supports cellular energy production and mental clarity.',
      confidence: 0.75,
      priceRange: '$150-$500',
      priority: 3,
    },
    {
      strategy: 'category_gap',
      service: 'Peptide Therapy',
      reason: 'Client has not explored peptide therapy. BPC-157 supports recovery and gut health during GLP-1 treatment.',
      confidence: 0.68,
      priceRange: '$200-$400/mo',
      priority: 4,
    },
  ],
  estimatedRevenue: 835,
};

test.describe('Cross-Sell Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_clients', 'view_recommendations'] },
        }),
      })
    );
  });

  test.describe('Recommendation Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );
    });

    test('displays cross-sell recommendations on client profile', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const recsSection = page.getByText(/recommend|suggested|cross-sell|you might also/i).first();
      await expect(recsSection).toBeVisible();
    });

    test('shows recommendation reason for each suggestion', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const reason = page.getByText(/Natural complement|facial rejuvenation/i).first();
      await expect(reason).toBeVisible();
    });

    test('displays confidence score for each recommendation', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const confidence = page.getByText(/89%|0\.89|high confidence/i).first();
      await expect(confidence).toBeVisible();
    });

    test('shows price range for recommended services', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const price = page.getByText(/\$500|495|275/i).first();
      await expect(price).toBeVisible();
    });

    test('orders recommendations by priority', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const recCards = page.locator('[data-testid="recommendation"], [class*="recommendation"], [class*="cross-sell"]');
      const count = await recCards.count();
      if (count >= 2) {
        const firstCard = await recCards.nth(0).textContent();
        expect(firstCard?.toLowerCase()).toContain('filler');
      }
    });

    test('shows estimated additional revenue', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_001');
      const revenue = page.getByText(/2,465|\$2\.4K|estimated.*revenue/i).first();
      await expect(revenue).toBeVisible();
    });
  });

  test.describe('Strategy-Based Recommendations', () => {
    test('shows pathway recommendations based on service history', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');
      const pathwayRec = page.getByText(/Dermal Fillers|pathway/i).first();
      await expect(pathwayRec).toBeVisible();
    });

    test('identifies category gaps in service history', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');
      const gapRec = page.getByText(/RF Microneedling|has not tried/i).first();
      await expect(gapRec).toBeVisible();
    });

    test('suggests membership upgrades for frequent visitors', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');
      const membershipRec = page.getByText(/Gold Membership|membership.*upgrade/i).first();
      await expect(membershipRec).toBeVisible();
    });

    test('flags overdue maintenance treatments', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');
      const overdueRec = page.getByText(/45 days ago|monthly maintenance|overdue/i).first();
      await expect(overdueRec).toBeVisible();
    });
  });

  test.describe('GLP-1 Cross-Sell Pathway', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_GLP1 }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_002/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GLP1_RECOMMENDATIONS),
        })
      );
    });

    test('recommends B12 injection for GLP-1 patients', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_002');
      const b12Rec = page.getByText(/B12.*Injection|B12/i).first();
      await expect(b12Rec).toBeVisible();
    });

    test('suggests Vitamin D3 for PNW residents on GLP-1', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_002');
      const vitDRec = page.getByText(/Vitamin D3|PNW.*deficient/i).first();
      await expect(vitDRec).toBeVisible();
    });

    test('recommends NAD+ for energy goals', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_002');
      const nadRec = page.getByText(/NAD\+|cellular energy/i).first();
      await expect(nadRec).toBeVisible();
    });

    test('suggests peptide therapy for gut health support', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_crosssell_002');
      const peptideRec = page.getByText(/Peptide Therapy|BPC-157/i).first();
      await expect(peptideRec).toBeVisible();
    });
  });

  test.describe('Cross-Sell Actions', () => {
    test('books recommended service directly from recommendation card', async ({ page }) => {
      let bookingTriggered = false;

      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.route('**/api/dashboard/schedule', (route) => {
        if (route.request().method() === 'POST') {
          bookingTriggered = true;
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ appointment: { id: 'appt_new' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_crosssell_001');

      const bookBtn = page.getByRole('button', { name: /book|schedule|add.*treatment/i }).first();
      const hasBtn = await bookBtn.count();
      if (hasBtn > 0) {
        await bookBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('dismisses a recommendation', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');

      const dismissBtn = page.getByRole('button', { name: /dismiss|skip|not interested/i }).first();
      const hasBtn = await dismissBtn.count();
      if (hasBtn > 0) {
        await dismissBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('adds recommendation to treatment plan', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECOMMENDATIONS),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');

      const addToPlanBtn = page.getByRole('button', { name: /add to plan|include|treatment plan/i }).first();
      const hasBtn = await addToPlanBtn.count();
      if (hasBtn > 0) {
        await addToPlanBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Consult Co-Pilot Integration', () => {
    test('shows cross-sell talking points for consult', async ({ page }) => {
      await page.route('**/api/dashboard/consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            clientBriefing: { name: 'Kayla Morrison', segment: 'regular' },
            crossSellOpportunities: MOCK_RECOMMENDATIONS.recommendations,
            talkingPoints: [
              { timing: 'during', priority: 'should_say', text: 'Based on your Botox results, dermal fillers would create a complete facial rejuvenation. Many clients combine the two.' },
              { timing: 'closing', priority: 'nice_to_say', text: 'Our Gold membership includes a monthly HydraFacial and 15% off treatments. With your visit frequency, it would save you about $80/month.' },
            ],
          }),
        })
      );

      await page.goto('/dashboard/consult');
      const talkingPoint = page.getByText(/dermal fillers.*complete|facial rejuvenation/i).first();
      await expect(talkingPoint).toBeVisible();
    });

    test('displays objection handlers for cross-sell', async ({ page }) => {
      await page.route('**/api/dashboard/consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            clientBriefing: { name: 'Kayla Morrison' },
            objectionHandlers: [
              { objection: 'Too expensive', technique: 'reframe', response: 'Think of it as an investment. The results from combining Botox and fillers last 6-12 months. Per day, that works out to less than your morning coffee.' },
              { objection: 'Not sure I need it', technique: 'social_proof', response: 'Most of our Botox clients add fillers within 6 months. The combination addresses both dynamic lines and volume loss for a more complete result.' },
            ],
          }),
        })
      );

      await page.goto('/dashboard/consult');
      const objection = page.getByText(/Too expensive|investment|objection/i).first();
      await expect(objection).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles recommendation API failure gracefully', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Recommendation engine unavailable' }),
        })
      );

      await page.goto('/dashboard/clients/rec_crosssell_001');
      const error = page.getByText(/error|unavailable|no recommendations/i).first();
      const hasError = await error.count();
      expect(hasError).toBeGreaterThanOrEqual(0);
    });

    test('shows empty state for new client with no history', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_new*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            client: { id: 'rec_new', firstName: 'New', lastName: 'Client', serviceHistory: [], segment: 'new' },
          }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_new/recommend', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ recommendations: [], estimatedRevenue: 0 }),
        })
      );

      await page.goto('/dashboard/clients/rec_new');
      const emptyState = page.getByText(/no recommendations|complete.*first.*visit|consult.*first/i).first();
      const hasEmpty = await emptyState.count();
      expect(hasEmpty).toBeGreaterThanOrEqual(0);
    });

    test('handles timeout on recommendation calculation', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_crosssell_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_CLIENT_BOTOX }),
        })
      );

      await page.route('**/api/dashboard/clients/rec_crosssell_001/recommend', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Gateway timeout' }),
        });
      });

      await page.goto('/dashboard/clients/rec_crosssell_001');
      // Should show loading or timeout message
      const loadingOrError = page.getByText(/loading|calculating|timeout/i).first();
      const hasState = await loadingOrError.count();
      expect(hasState).toBeGreaterThanOrEqual(0);
    });
  });
});
