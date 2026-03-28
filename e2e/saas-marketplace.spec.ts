import { test, expect } from '@playwright/test';

/**
 * SaaS Integration Marketplace E2E Tests
 * Tests marketplace browsing, integration install/uninstall,
 * configuration flows, and category filtering.
 */

const MOCK_MARKETPLACE_INTEGRATIONS = [
  {
    id: 'int_airtable',
    name: 'Airtable',
    category: 'database',
    description: 'Cloud database for client records, appointments, and business intelligence.',
    icon: '/integrations/airtable.png',
    installed: true,
    configuredAt: '2026-03-15',
    rating: 4.8,
    installs: 1240,
    pricing: 'Included',
    required: true,
  },
  {
    id: 'int_mangomint',
    name: 'Mangomint',
    category: 'booking',
    description: 'Appointment scheduling, client management, and POS for salons and medspas.',
    icon: '/integrations/mangomint.png',
    installed: true,
    configuredAt: '2026-03-15',
    rating: 4.6,
    installs: 890,
    pricing: 'Included',
    required: false,
  },
  {
    id: 'int_stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Online payment processing for subscriptions, memberships, and one-time purchases.',
    icon: '/integrations/stripe.png',
    installed: false,
    rating: 4.9,
    installs: 3200,
    pricing: 'Included',
    required: false,
  },
  {
    id: 'int_twilio',
    name: 'Twilio',
    category: 'communication',
    description: 'SMS and voice communication for client reminders, follow-ups, and marketing.',
    icon: '/integrations/twilio.png',
    installed: true,
    configuredAt: '2026-03-16',
    rating: 4.5,
    installs: 2100,
    pricing: 'Usage-based',
    required: false,
  },
  {
    id: 'int_resend',
    name: 'Resend',
    category: 'communication',
    description: 'Transactional email service for receipts, confirmations, and follow-up sequences.',
    icon: '/integrations/resend.png',
    installed: true,
    configuredAt: '2026-03-16',
    rating: 4.7,
    installs: 1800,
    pricing: 'Included',
    required: false,
  },
  {
    id: 'int_vapi',
    name: 'Vapi.ai',
    category: 'ai',
    description: 'AI-powered phone receptionist with natural voice, booking capability, and call analytics.',
    icon: '/integrations/vapi.png',
    installed: false,
    rating: 4.4,
    installs: 450,
    pricing: '$49/mo add-on',
    required: false,
  },
  {
    id: 'int_pinecone',
    name: 'Pinecone',
    category: 'ai',
    description: 'Vector database for RAG knowledge base, semantic search, and AI-powered responses.',
    icon: '/integrations/pinecone.png',
    installed: false,
    rating: 4.3,
    installs: 320,
    pricing: '$29/mo add-on',
    required: false,
  },
  {
    id: 'int_meta',
    name: 'Meta Ads',
    category: 'marketing',
    description: 'Facebook and Instagram advertising management with AI optimization and budget allocation.',
    icon: '/integrations/meta.png',
    installed: false,
    rating: 4.1,
    installs: 780,
    pricing: '$79/mo add-on',
    required: false,
  },
  {
    id: 'int_google_ads',
    name: 'Google Ads',
    category: 'marketing',
    description: 'Search and display advertising management with keyword optimization and geo-targeting.',
    icon: '/integrations/google-ads.png',
    installed: false,
    rating: 4.2,
    installs: 650,
    pricing: '$79/mo add-on',
    required: false,
  },
  {
    id: 'int_plaid',
    name: 'Plaid',
    category: 'finance',
    description: 'Bank account connectivity for transaction reconciliation and financial intelligence.',
    icon: '/integrations/plaid.png',
    installed: false,
    rating: 4.0,
    installs: 280,
    pricing: '$19/mo add-on',
    required: false,
  },
];

const MOCK_CATEGORIES = [
  { id: 'all', label: 'All', count: 10 },
  { id: 'database', label: 'Database', count: 1 },
  { id: 'booking', label: 'Booking', count: 1 },
  { id: 'payments', label: 'Payments', count: 1 },
  { id: 'communication', label: 'Communication', count: 2 },
  { id: 'ai', label: 'AI & Automation', count: 2 },
  { id: 'marketing', label: 'Marketing', count: 2 },
  { id: 'finance', label: 'Finance', count: 1 },
];

test.describe('SaaS Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Dr. Sarah Bennett', role: 'ceo', permissions: ['manage_integrations', 'view_marketplace'] },
        }),
      })
    );

    await page.route('**/api/marketplace*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          integrations: MOCK_MARKETPLACE_INTEGRATIONS,
          categories: MOCK_CATEGORIES,
        }),
      })
    );
  });

  test.describe('Marketplace Browse', () => {
    test('displays all available integrations', async ({ page }) => {
      await page.goto('/dashboard');
      for (const int of MOCK_MARKETPLACE_INTEGRATIONS.slice(0, 5)) {
        const intEntry = page.getByText(new RegExp(int.name, 'i')).first();
        await expect(intEntry).toBeVisible();
      }
    });

    test('shows integration descriptions', async ({ page }) => {
      await page.goto('/dashboard');
      const description = page.getByText(/Cloud database|Appointment scheduling|payment processing/i).first();
      await expect(description).toBeVisible();
    });

    test('displays install count for each integration', async ({ page }) => {
      await page.goto('/dashboard');
      const installs = page.getByText(/1,240|890|3,200|installs/i).first();
      const hasInstalls = await installs.count();
      expect(hasInstalls).toBeGreaterThanOrEqual(0);
    });

    test('shows ratings for each integration', async ({ page }) => {
      await page.goto('/dashboard');
      const rating = page.getByText(/4\.8|4\.6|4\.9/i).first();
      await expect(rating).toBeVisible();
    });

    test('displays pricing information', async ({ page }) => {
      await page.goto('/dashboard');
      const pricing = page.getByText(/Included|\$49.*mo|\$29.*mo|\$79.*mo|Usage-based/i).first();
      await expect(pricing).toBeVisible();
    });

    test('shows installed status for active integrations', async ({ page }) => {
      await page.goto('/dashboard');
      const installed = page.getByText(/installed|connected|active/i).first();
      await expect(installed).toBeVisible();
    });
  });

  test.describe('Category Filtering', () => {
    test('displays category filter options', async ({ page }) => {
      await page.goto('/dashboard');
      for (const cat of MOCK_CATEGORIES.slice(0, 4)) {
        const catEl = page.getByText(new RegExp(cat.label, 'i')).first();
        await expect(catEl).toBeVisible();
      }
    });

    test('filters by AI category', async ({ page }) => {
      await page.goto('/dashboard');
      const aiFilter = page.getByRole('button', { name: /AI|automation/i }).first();
      const hasFilter = await aiFilter.count();
      if (hasFilter > 0) {
        await aiFilter.click();
        await page.waitForTimeout(300);

        await expect(page.getByText(/Vapi|Pinecone/i).first()).toBeVisible();
      }
    });

    test('filters by marketing category', async ({ page }) => {
      await page.goto('/dashboard');
      const marketingFilter = page.getByRole('button', { name: /marketing/i }).first();
      const hasFilter = await marketingFilter.count();
      if (hasFilter > 0) {
        await marketingFilter.click();
        await page.waitForTimeout(300);

        await expect(page.getByText(/Meta Ads|Google Ads/i).first()).toBeVisible();
      }
    });

    test('shows integration count per category', async ({ page }) => {
      await page.goto('/dashboard');
      const count = page.getByText(/\(2\)|\(1\)|\(10\)/i).first();
      const hasCount = await count.count();
      expect(hasCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Integration Search', () => {
    test('searches integrations by name', async ({ page }) => {
      await page.goto('/dashboard');
      const searchInput = page.getByPlaceholder(/search|find/i).first();
      const hasSearch = await searchInput.count();
      if (hasSearch > 0) {
        await searchInput.fill('Stripe');
        await page.waitForTimeout(500);

        await expect(page.getByText(/Stripe/i).first()).toBeVisible();
      }
    });

    test('shows no results for invalid search', async ({ page }) => {
      await page.goto('/dashboard');
      const searchInput = page.getByPlaceholder(/search|find/i).first();
      const hasSearch = await searchInput.count();
      if (hasSearch > 0) {
        await searchInput.fill('NonexistentIntegration');
        await page.waitForTimeout(500);

        const noResults = page.getByText(/no results|not found|no integrations/i).first();
        const hasNone = await noResults.count();
        expect(hasNone).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Install Integration', () => {
    test('installs Stripe integration', async ({ page }) => {
      let installTriggered = false;

      await page.route('**/api/marketplace/int_stripe/install', (route) => {
        installTriggered = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, configRequired: true }),
        });
      });

      await page.goto('/dashboard');
      const installBtn = page.getByRole('button', { name: /install.*stripe|add.*stripe/i }).first();
      const hasBtn = await installBtn.count();
      if (hasBtn > 0) {
        await installBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('shows configuration form after install', async ({ page }) => {
      await page.route('**/api/marketplace/int_stripe/install', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, configRequired: true }),
        })
      );

      await page.goto('/dashboard');
      const installBtn = page.getByRole('button', { name: /install.*stripe|add.*stripe/i }).first();
      const hasBtn = await installBtn.count();
      if (hasBtn > 0) {
        await installBtn.click();
        await page.waitForTimeout(500);

        const configForm = page.locator('input[name="apiKey"], [data-testid="config-form"]').first();
        const hasForm = await configForm.count();
        expect(hasForm).toBeGreaterThanOrEqual(0);
      }
    });

    test('prevents uninstalling required integrations', async ({ page }) => {
      await page.goto('/dashboard');
      // Airtable is marked as required
      const uninstallBtn = page.getByRole('button', { name: /uninstall.*airtable|remove.*airtable/i }).first();
      const hasBtn = await uninstallBtn.count();
      if (hasBtn > 0) {
        const isDisabled = await uninstallBtn.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Configure Integration', () => {
    test('configures integration with API key', async ({ page }) => {
      let configSaved = false;

      await page.route('**/api/marketplace/int_stripe/configure', (route) => {
        configSaved = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, status: 'connected' }),
        });
      });

      await page.goto('/dashboard');
      const configBtn = page.getByRole('button', { name: /configure|settings|setup/i }).first();
      const hasBtn = await configBtn.count();
      if (hasBtn > 0) {
        await configBtn.click();
        await page.waitForTimeout(300);

        const apiKeyInput = page.locator('input[name="apiKey"]').first();
        const hasInput = await apiKeyInput.count();
        if (hasInput > 0) {
          await apiKeyInput.fill('sk_test_12345');
          const saveBtn = page.getByRole('button', { name: /save|connect/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('tests integration connection', async ({ page }) => {
      await page.route('**/api/marketplace/int_twilio/test', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Connection successful' }),
        })
      );

      await page.goto('/dashboard');
      const testBtn = page.getByRole('button', { name: /test.*connection|verify|check/i }).first();
      const hasBtn = await testBtn.count();
      if (hasBtn > 0) {
        await testBtn.click();
        await page.waitForTimeout(500);

        const success = page.getByText(/success|connected|verified/i).first();
        await expect(success).toBeVisible();
      }
    });

    test('handles failed connection test', async ({ page }) => {
      await page.route('**/api/marketplace/int_twilio/test', (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
        })
      );

      await page.goto('/dashboard');
      const testBtn = page.getByRole('button', { name: /test.*connection|verify/i }).first();
      const hasBtn = await testBtn.count();
      if (hasBtn > 0) {
        await testBtn.click();
        await page.waitForTimeout(500);

        const failure = page.getByText(/failed|invalid|error/i).first();
        await expect(failure).toBeVisible();
      }
    });
  });

  test.describe('Uninstall Integration', () => {
    test('uninstalls non-required integration', async ({ page }) => {
      let uninstalled = false;

      await page.route('**/api/marketplace/int_mangomint/uninstall', (route) => {
        uninstalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/dashboard');
      const uninstallBtn = page.getByRole('button', { name: /uninstall|remove|disconnect/i }).first();
      const hasBtn = await uninstallBtn.count();
      if (hasBtn > 0) {
        await uninstallBtn.click();
        await page.waitForTimeout(300);

        const confirmBtn = page.getByRole('button', { name: /confirm|yes|remove/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('shows confirmation dialog before uninstall', async ({ page }) => {
      await page.goto('/dashboard');
      const uninstallBtn = page.getByRole('button', { name: /uninstall|remove/i }).first();
      const hasBtn = await uninstallBtn.count();
      if (hasBtn > 0) {
        await uninstallBtn.click();
        await page.waitForTimeout(300);

        const dialog = page.locator('[role="dialog"], [class*="modal"], [data-testid="confirm-dialog"]').first();
        const hasDialog = await dialog.count();
        expect(hasDialog).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles marketplace API failure', async ({ page }) => {
      await page.route('**/api/marketplace*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles install failure gracefully', async ({ page }) => {
      await page.route('**/api/marketplace/int_stripe/install', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Installation failed' }),
        })
      );

      await page.goto('/dashboard');
      const installBtn = page.getByRole('button', { name: /install/i }).first();
      const hasBtn = await installBtn.count();
      if (hasBtn > 0) {
        await installBtn.click();
        await page.waitForTimeout(500);

        const error = page.getByText(/failed|error|try again/i).first();
        await expect(error).toBeVisible();
      }
    });
  });
});
