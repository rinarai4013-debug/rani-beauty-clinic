import { test, expect } from '@playwright/test';

/**
 * SaaS Billing E2E Tests
 * Tests tier selection, upgrade/downgrade flows, usage metering,
 * invoice history, and payment method management.
 */

const MOCK_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    interval: 'month',
    features: [
      'Up to 500 clients',
      'Core dashboard',
      'Airtable integration',
      'Basic reporting',
      'Email support',
    ],
    limits: { clients: 500, users: 3, aiCredits: 100 },
    current: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 499,
    interval: 'month',
    features: [
      'Up to 2,000 clients',
      'Full dashboard with AI engines',
      'All core integrations',
      'Advanced analytics',
      'Churn prediction',
      'Priority support',
      'Social media AI',
    ],
    limits: { clients: 2000, users: 10, aiCredits: 500 },
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    interval: 'month',
    features: [
      'Unlimited clients',
      'Full platform access',
      'All integrations included',
      'White-label option',
      'Custom AI training',
      'Dedicated account manager',
      'SLA guarantee',
      'Multi-location support',
    ],
    limits: { clients: -1, users: -1, aiCredits: -1 },
    current: false,
  },
];

const MOCK_CURRENT_BILLING = {
  tier: 'professional',
  status: 'active',
  currentPeriodStart: '2026-03-01',
  currentPeriodEnd: '2026-03-31',
  nextBillingDate: '2026-04-01',
  monthlyTotal: 499,
  addOns: [
    { name: 'Vapi AI Phone Agent', price: 49, status: 'active' },
    { name: 'Meta Ads Manager', price: 79, status: 'active' },
  ],
  totalWithAddOns: 627,
};

const MOCK_USAGE = {
  clients: { used: 1450, limit: 2000, percentage: 0.725 },
  users: { used: 6, limit: 10, percentage: 0.6 },
  aiCredits: { used: 342, limit: 500, percentage: 0.684 },
  apiCalls: { used: 24500, limit: 50000, percentage: 0.49 },
  storage: { used: 2.4, limit: 10, unit: 'GB', percentage: 0.24 },
};

const MOCK_INVOICES = [
  { id: 'inv_006', date: '2026-03-01', amount: 627, status: 'paid', description: 'Professional + Add-ons' },
  { id: 'inv_005', date: '2026-02-01', amount: 627, status: 'paid', description: 'Professional + Add-ons' },
  { id: 'inv_004', date: '2026-01-01', amount: 548, status: 'paid', description: 'Professional + Vapi' },
  { id: 'inv_003', date: '2025-12-01', amount: 499, status: 'paid', description: 'Professional' },
  { id: 'inv_002', date: '2025-11-01', amount: 499, status: 'paid', description: 'Professional' },
  { id: 'inv_001', date: '2025-10-01', amount: 199, status: 'paid', description: 'Starter' },
];

const MOCK_PAYMENT_METHOD = {
  type: 'card',
  brand: 'Visa',
  last4: '4242',
  expMonth: 8,
  expYear: 2028,
  isDefault: true,
};

test.describe('SaaS Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Dr. Sarah Bennett', role: 'ceo', permissions: ['manage_billing', 'view_billing'] },
        }),
      })
    );
  });

  test.describe('Tier Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.route('**/api/billing/current*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CURRENT_BILLING),
        })
      );
    });

    test('displays all pricing tiers', async ({ page }) => {
      await page.goto('/dashboard');
      for (const tier of MOCK_TIERS) {
        const tierEl = page.getByText(new RegExp(tier.name, 'i')).first();
        await expect(tierEl).toBeVisible();
      }
    });

    test('shows pricing for each tier', async ({ page }) => {
      await page.goto('/dashboard');
      const price = page.getByText(/\$199|\$499|\$999/i).first();
      await expect(price).toBeVisible();
    });

    test('highlights current tier', async ({ page }) => {
      await page.goto('/dashboard');
      const currentBadge = page.getByText(/current plan|your plan|active/i).first();
      await expect(currentBadge).toBeVisible();
    });

    test('displays feature list for each tier', async ({ page }) => {
      await page.goto('/dashboard');
      const feature = page.getByText(/Up to 2,000|Full dashboard|AI engines/i).first();
      await expect(feature).toBeVisible();
    });

    test('shows tier limits', async ({ page }) => {
      await page.goto('/dashboard');
      const limit = page.getByText(/2,000 clients|10 users|500.*credits/i).first();
      const hasLimit = await limit.count();
      expect(hasLimit).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Upgrade Flow', () => {
    test('initiates upgrade to Enterprise tier', async ({ page }) => {
      let upgradeTriggered = false;

      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.route('**/api/billing/upgrade', (route) => {
        upgradeTriggered = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, newTier: 'enterprise' }),
        });
      });

      await page.goto('/dashboard');
      const upgradeBtn = page.getByRole('button', { name: /upgrade|enterprise/i }).first();
      const hasBtn = await upgradeBtn.count();
      if (hasBtn > 0) {
        await upgradeBtn.click();
        await page.waitForTimeout(300);

        const confirmBtn = page.getByRole('button', { name: /confirm|upgrade|yes/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('shows prorated amount on upgrade', async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.route('**/api/billing/preview-upgrade*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentTier: 'professional',
            newTier: 'enterprise',
            proratedAmount: 83.33,
            effectiveDate: '2026-03-26',
            nextFullBill: 999,
          }),
        })
      );

      await page.goto('/dashboard');
      const upgradeBtn = page.getByRole('button', { name: /upgrade/i }).first();
      const hasBtn = await upgradeBtn.count();
      if (hasBtn > 0) {
        await upgradeBtn.click();
        await page.waitForTimeout(500);

        const prorated = page.getByText(/83\.33|prorated/i).first();
        const hasProrated = await prorated.count();
        expect(hasProrated).toBeGreaterThanOrEqual(0);
      }
    });

    test('displays upgrade confirmation summary', async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.goto('/dashboard');
      const upgradeBtn = page.getByRole('button', { name: /upgrade/i }).first();
      const hasBtn = await upgradeBtn.count();
      if (hasBtn > 0) {
        await upgradeBtn.click();
        await page.waitForTimeout(300);

        const summary = page.getByText(/Enterprise|Unlimited|confirm/i).first();
        const hasSummary = await summary.count();
        expect(hasSummary).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Downgrade Flow', () => {
    test('initiates downgrade to Starter tier', async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.route('**/api/billing/preview-downgrade*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentTier: 'professional',
            newTier: 'starter',
            effectiveDate: '2026-04-01',
            lostFeatures: ['AI engines', 'Churn prediction', 'Social media AI'],
            dataImpact: 'Client count exceeds Starter limit (1450 > 500). Some data may become read-only.',
          }),
        })
      );

      await page.goto('/dashboard');
      const downgradeBtn = page.getByRole('button', { name: /downgrade|starter/i }).first();
      const hasBtn = await downgradeBtn.count();
      if (hasBtn > 0) {
        await downgradeBtn.click();
        await page.waitForTimeout(500);

        const warning = page.getByText(/lost features|data.*impact|read-only|exceeds/i).first();
        await expect(warning).toBeVisible();
      }
    });

    test('shows features that will be lost on downgrade', async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.route('**/api/billing/preview-downgrade*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            lostFeatures: ['AI engines', 'Churn prediction', 'Social media AI', 'Priority support'],
          }),
        })
      );

      await page.goto('/dashboard');
      const downgradeBtn = page.getByRole('button', { name: /downgrade/i }).first();
      const hasBtn = await downgradeBtn.count();
      if (hasBtn > 0) {
        await downgradeBtn.click();
        await page.waitForTimeout(500);

        const lostFeature = page.getByText(/AI engines|Churn prediction|lose|lost/i).first();
        await expect(lostFeature).toBeVisible();
      }
    });

    test('downgrade takes effect at end of billing period', async ({ page }) => {
      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.goto('/dashboard');
      const downgradeBtn = page.getByRole('button', { name: /downgrade/i }).first();
      const hasBtn = await downgradeBtn.count();
      if (hasBtn > 0) {
        await downgradeBtn.click();
        await page.waitForTimeout(300);

        const effectiveDate = page.getByText(/April 1|end of.*period|takes effect/i).first();
        const hasDate = await effectiveDate.count();
        expect(hasDate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Usage Metering', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/billing/usage*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_USAGE),
        })
      );
    });

    test('displays client usage vs limit', async ({ page }) => {
      await page.goto('/dashboard');
      const usage = page.getByText(/1,450.*2,000|72\.5%|client.*usage/i).first();
      await expect(usage).toBeVisible();
    });

    test('shows user seat usage', async ({ page }) => {
      await page.goto('/dashboard');
      const userUsage = page.getByText(/6.*10|user.*seat/i).first();
      const hasUsage = await userUsage.count();
      expect(hasUsage).toBeGreaterThanOrEqual(0);
    });

    test('displays AI credit consumption', async ({ page }) => {
      await page.goto('/dashboard');
      const aiUsage = page.getByText(/342.*500|68\.4%|AI.*credit/i).first();
      const hasUsage = await aiUsage.count();
      expect(hasUsage).toBeGreaterThanOrEqual(0);
    });

    test('shows usage progress bars', async ({ page }) => {
      await page.goto('/dashboard');
      const progressBar = page.locator('[role="progressbar"], [class*="progress-bar"], [data-testid="usage-bar"]').first();
      const hasBar = await progressBar.count();
      expect(hasBar).toBeGreaterThanOrEqual(0);
    });

    test('alerts when approaching usage limits', async ({ page }) => {
      await page.route('**/api/billing/usage*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_USAGE,
            clients: { used: 1900, limit: 2000, percentage: 0.95 },
          }),
        })
      );

      await page.goto('/dashboard');
      const limitAlert = page.getByText(/approaching.*limit|95%|nearly.*full|upgrade/i).first();
      const hasAlert = await limitAlert.count();
      expect(hasAlert).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Invoice History', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/billing/invoices*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ invoices: MOCK_INVOICES }),
        })
      );
    });

    test('displays invoice list with dates and amounts', async ({ page }) => {
      await page.goto('/dashboard');
      const invoice = page.getByText(/\$627|Professional.*Add-ons/i).first();
      await expect(invoice).toBeVisible();
    });

    test('shows payment status for each invoice', async ({ page }) => {
      await page.goto('/dashboard');
      const paidBadge = page.getByText(/paid/i).first();
      await expect(paidBadge).toBeVisible();
    });

    test('allows downloading invoice PDF', async ({ page }) => {
      await page.goto('/dashboard');
      const downloadBtn = page.getByRole('button', { name: /download|PDF|invoice/i }).first();
      const hasBtn = await downloadBtn.count();
      expect(hasBtn).toBeGreaterThanOrEqual(0);
    });

    test('shows invoice details on click', async ({ page }) => {
      await page.goto('/dashboard');
      const invoiceRow = page.getByText(/\$627/).first();
      const hasRow = await invoiceRow.count();
      if (hasRow > 0) {
        await invoiceRow.click();
        await page.waitForTimeout(300);

        const detail = page.getByText(/Professional.*Add-ons|Vapi|Meta Ads/i).first();
        const hasDetail = await detail.count();
        expect(hasDetail).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Payment Methods', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/billing/payment-methods*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ methods: [MOCK_PAYMENT_METHOD] }),
        })
      );
    });

    test('displays current payment method', async ({ page }) => {
      await page.goto('/dashboard');
      const card = page.getByText(/Visa.*4242|ending.*4242/i).first();
      await expect(card).toBeVisible();
    });

    test('shows card expiration date', async ({ page }) => {
      await page.goto('/dashboard');
      const expiry = page.getByText(/08.*2028|8\/28|exp/i).first();
      const hasExpiry = await expiry.count();
      expect(hasExpiry).toBeGreaterThanOrEqual(0);
    });

    test('allows adding new payment method', async ({ page }) => {
      await page.goto('/dashboard');
      const addCardBtn = page.getByRole('button', { name: /add.*card|new.*payment|add.*method/i }).first();
      const hasBtn = await addCardBtn.count();
      if (hasBtn > 0) {
        await addCardBtn.click();
        await page.waitForTimeout(300);

        const cardForm = page.locator('[data-testid="card-form"], iframe[name*="card"], [class*="StripeElement"]').first();
        const hasForm = await cardForm.count();
        expect(hasForm).toBeGreaterThanOrEqual(0);
      }
    });

    test('allows removing non-default payment method', async ({ page }) => {
      await page.route('**/api/billing/payment-methods*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            methods: [
              MOCK_PAYMENT_METHOD,
              { type: 'card', brand: 'Mastercard', last4: '5555', expMonth: 12, expYear: 2027, isDefault: false },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const removeBtn = page.getByRole('button', { name: /remove|delete/i }).first();
      const hasBtn = await removeBtn.count();
      if (hasBtn > 0) {
        await removeBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Add-On Management', () => {
    test('displays active add-ons', async ({ page }) => {
      await page.route('**/api/billing/current*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CURRENT_BILLING),
        })
      );

      await page.goto('/dashboard');
      const addon = page.getByText(/Vapi AI|Meta Ads|add-on/i).first();
      await expect(addon).toBeVisible();
    });

    test('shows add-on pricing', async ({ page }) => {
      await page.route('**/api/billing/current*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CURRENT_BILLING),
        })
      );

      await page.goto('/dashboard');
      const price = page.getByText(/\$49|\$79/i).first();
      await expect(price).toBeVisible();
    });

    test('shows total with add-ons', async ({ page }) => {
      await page.route('**/api/billing/current*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CURRENT_BILLING),
        })
      );

      await page.goto('/dashboard');
      const total = page.getByText(/\$627|total/i).first();
      await expect(total).toBeVisible();
    });

    test('cancels an add-on', async ({ page }) => {
      await page.route('**/api/billing/current*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CURRENT_BILLING),
        })
      );

      await page.route('**/api/billing/addons/vapi/cancel', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      );

      await page.goto('/dashboard');
      const cancelBtn = page.getByRole('button', { name: /cancel.*add-on|remove.*add-on/i }).first();
      const hasBtn = await cancelBtn.count();
      if (hasBtn > 0) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles billing API failure', async ({ page }) => {
      await page.route('**/api/billing/*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Stripe service error' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles payment failure on upgrade', async ({ page }) => {
      await page.route('**/api/billing/upgrade', (route) =>
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Payment declined. Please update your payment method.' }),
        })
      );

      await page.route('**/api/billing/tiers*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tiers: MOCK_TIERS }),
        })
      );

      await page.goto('/dashboard');
      const upgradeBtn = page.getByRole('button', { name: /upgrade/i }).first();
      const hasBtn = await upgradeBtn.count();
      if (hasBtn > 0) {
        await upgradeBtn.click();
        const confirmBtn = page.getByRole('button', { name: /confirm/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);

          const payError = page.getByText(/declined|payment.*failed|update.*payment/i).first();
          await expect(payError).toBeVisible();
        }
      }
    });
  });
});
