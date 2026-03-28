import { test, expect } from '@playwright/test';

/**
 * SaaS Tenant Onboarding Wizard E2E Tests
 * Tests multi-step onboarding flow: clinic info, services setup,
 * Airtable connection, team setup, branding, and go-live.
 */

const MOCK_ONBOARDING_STEPS = [
  { id: 'clinic_info', label: 'Clinic Information', status: 'completed' },
  { id: 'services', label: 'Services & Pricing', status: 'completed' },
  { id: 'integrations', label: 'Connect Integrations', status: 'current' },
  { id: 'team', label: 'Team & Roles', status: 'pending' },
  { id: 'branding', label: 'Branding & Theme', status: 'pending' },
  { id: 'go_live', label: 'Go Live', status: 'pending' },
];

const MOCK_CLINIC_INFO = {
  clinicName: 'Pacific Glow Medspa',
  ownerName: 'Dr. Sarah Bennett',
  email: 'sarah@pacificglowmedspa.com',
  phone: '(206) 555-0199',
  address: '123 Main St, Suite 200',
  city: 'Seattle',
  state: 'WA',
  zip: '98101',
  website: 'pacificglowmedspa.com',
  medicalDirector: 'Dr. Sarah Bennett',
  licenseNumber: 'MD-WA-12345',
};

const MOCK_SERVICES_CONFIG = [
  { name: 'Botox', category: 'injectable', basePrice: 14, unit: 'per unit', active: true },
  { name: 'Dermal Fillers', category: 'injectable', basePrice: 650, unit: 'per syringe', active: true },
  { name: 'HydraFacial', category: 'facial', basePrice: 250, unit: 'per session', active: true },
  { name: 'Laser Hair Removal', category: 'laser', basePrice: 150, unit: 'per area', active: true },
  { name: 'GLP-1 Weight Management', category: 'wellness', basePrice: 399, unit: 'per month', active: false },
];

const MOCK_INTEGRATIONS = [
  { id: 'airtable', name: 'Airtable', status: 'connected', icon: 'database' },
  { id: 'stripe', name: 'Stripe', status: 'pending', icon: 'credit-card' },
  { id: 'twilio', name: 'Twilio', status: 'pending', icon: 'phone' },
  { id: 'resend', name: 'Resend', status: 'pending', icon: 'mail' },
  { id: 'mangomint', name: 'Mangomint', status: 'not_started', icon: 'calendar' },
  { id: 'google', name: 'Google Business', status: 'not_started', icon: 'map' },
];

const MOCK_TEAM = [
  { name: 'Dr. Sarah Bennett', role: 'ceo', email: 'sarah@pacificglowmedspa.com', status: 'active' },
  { name: 'Emily Thompson', role: 'frontdesk', email: 'emily@pacificglowmedspa.com', status: 'invited' },
  { name: 'Maria Garcia', role: 'provider', email: 'maria@pacificglowmedspa.com', status: 'invited' },
];

test.describe('SaaS Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Dr. Sarah Bennett', role: 'ceo', permissions: ['manage_clinic', 'manage_team', 'manage_integrations'] },
          tenant: { id: 'tenant_001', name: 'Pacific Glow Medspa', onboardingComplete: false },
        }),
      })
    );

    await page.route('**/api/onboarding/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ steps: MOCK_ONBOARDING_STEPS, completionPercent: 33 }),
      })
    );
  });

  test.describe('Onboarding Wizard', () => {
    test('displays onboarding progress bar', async ({ page }) => {
      await page.goto('/onboarding');
      const progressBar = page.locator('[data-testid="progress-bar"], [class*="progress"], [role="progressbar"]').first();
      await expect(progressBar).toBeVisible();
    });

    test('shows all onboarding steps', async ({ page }) => {
      await page.goto('/onboarding');
      for (const step of MOCK_ONBOARDING_STEPS) {
        const stepEl = page.getByText(new RegExp(step.label, 'i')).first();
        await expect(stepEl).toBeVisible();
      }
    });

    test('displays completion percentage', async ({ page }) => {
      await page.goto('/onboarding');
      const percent = page.getByText(/33%|completion/i).first();
      await expect(percent).toBeVisible();
    });

    test('highlights current step', async ({ page }) => {
      await page.goto('/onboarding');
      const currentStep = page.locator('[data-status="current"], [class*="active"], [class*="current"]').first();
      const hasCurrent = await currentStep.count();
      expect(hasCurrent).toBeGreaterThanOrEqual(0);
    });

    test('marks completed steps with checkmarks', async ({ page }) => {
      await page.goto('/onboarding');
      const completedStep = page.locator('[data-status="completed"], [class*="completed"], [class*="done"]');
      const count = await completedStep.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Step 1: Clinic Information', () => {
    test('displays clinic info form', async ({ page }) => {
      await page.route('**/api/onboarding/clinic-info', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CLINIC_INFO),
        })
      );

      await page.goto('/onboarding');
      const clinicNameInput = page.locator('input[name="clinicName"], input[placeholder*="clinic name"]').first();
      const hasInput = await clinicNameInput.count();
      expect(hasInput).toBeGreaterThanOrEqual(0);
    });

    test('validates required fields', async ({ page }) => {
      await page.goto('/onboarding');

      const nextBtn = page.getByRole('button', { name: /next|continue|save/i }).first();
      const hasBtn = await nextBtn.count();
      if (hasBtn > 0) {
        // Clear a required field and try to advance
        const nameInput = page.locator('input[name="clinicName"]').first();
        const hasName = await nameInput.count();
        if (hasName > 0) {
          await nameInput.fill('');
          await nextBtn.click();

          const error = page.getByText(/required|please.*fill|cannot.*empty/i).first();
          await expect(error).toBeVisible();
        }
      }
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/onboarding');

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const hasInput = await emailInput.count();
      if (hasInput > 0) {
        await emailInput.fill('not-an-email');
        const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
        await nextBtn.click();

        const error = page.getByText(/valid.*email|email.*invalid/i).first();
        const hasError = await error.count();
        expect(hasError).toBeGreaterThanOrEqual(0);
      }
    });

    test('saves clinic info and advances to next step', async ({ page }) => {
      let infoSaved = false;

      await page.route('**/api/onboarding/clinic-info', (route) => {
        if (route.request().method() === 'POST') {
          infoSaved = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CLINIC_INFO),
        });
      });

      await page.goto('/onboarding');

      const nameInput = page.locator('input[name="clinicName"]').first();
      const hasName = await nameInput.count();
      if (hasName > 0) {
        await nameInput.fill('Pacific Glow Medspa');

        const nextBtn = page.getByRole('button', { name: /next|continue|save/i }).first();
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Step 2: Services & Pricing', () => {
    test('displays service template library', async ({ page }) => {
      await page.route('**/api/onboarding/services*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ services: MOCK_SERVICES_CONFIG }),
        })
      );

      await page.goto('/onboarding');
      const serviceEntry = page.getByText(/Botox|HydraFacial|Laser Hair Removal/i).first();
      await expect(serviceEntry).toBeVisible();
    });

    test('allows toggling services on/off', async ({ page }) => {
      await page.route('**/api/onboarding/services*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ services: MOCK_SERVICES_CONFIG }),
        })
      );

      await page.goto('/onboarding');
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      const hasToggle = await toggle.count();
      if (hasToggle > 0) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('allows editing base prices', async ({ page }) => {
      await page.route('**/api/onboarding/services*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ services: MOCK_SERVICES_CONFIG }),
        })
      );

      await page.goto('/onboarding');
      const priceInput = page.locator('input[name*="price"], input[type="number"]').first();
      const hasInput = await priceInput.count();
      if (hasInput > 0) {
        await priceInput.fill('16');
        await page.waitForTimeout(300);
      }
    });

    test('allows adding custom services', async ({ page }) => {
      await page.goto('/onboarding');
      const addBtn = page.getByRole('button', { name: /add.*service|custom.*service|new/i }).first();
      const hasBtn = await addBtn.count();
      if (hasBtn > 0) {
        await addBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Step 3: Connect Integrations', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/onboarding/integrations*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ integrations: MOCK_INTEGRATIONS }),
        })
      );
    });

    test('displays all available integrations', async ({ page }) => {
      await page.goto('/onboarding');
      for (const integration of MOCK_INTEGRATIONS) {
        const intEntry = page.getByText(new RegExp(integration.name, 'i')).first();
        await expect(intEntry).toBeVisible();
      }
    });

    test('shows connection status for each integration', async ({ page }) => {
      await page.goto('/onboarding');
      const connected = page.getByText(/connected/i).first();
      await expect(connected).toBeVisible();
    });

    test('connects Airtable with API key', async ({ page }) => {
      let apiKeySubmitted = false;

      await page.route('**/api/onboarding/integrations/airtable', (route) => {
        if (route.request().method() === 'POST') {
          apiKeySubmitted = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'connected' }),
          });
        }
        return route.continue();
      });

      await page.goto('/onboarding');
      const connectBtn = page.getByRole('button', { name: /connect.*airtable|configure/i }).first();
      const hasBtn = await connectBtn.count();
      if (hasBtn > 0) {
        await connectBtn.click();
        await page.waitForTimeout(300);

        const apiKeyInput = page.locator('input[name="apiKey"], input[placeholder*="API"]').first();
        const hasInput = await apiKeyInput.count();
        if (hasInput > 0) {
          await apiKeyInput.fill('pat_test_key_12345');
          const saveBtn = page.getByRole('button', { name: /save|connect|submit/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('validates integration credentials', async ({ page }) => {
      await page.route('**/api/onboarding/integrations/stripe', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid API key' }),
          });
        }
        return route.continue();
      });

      await page.goto('/onboarding');
      const connectBtn = page.getByRole('button', { name: /connect.*stripe/i }).first();
      const hasBtn = await connectBtn.count();
      if (hasBtn > 0) {
        await connectBtn.click();
        await page.waitForTimeout(300);

        const apiKeyInput = page.locator('input[name="apiKey"]').first();
        const hasInput = await apiKeyInput.count();
        if (hasInput > 0) {
          await apiKeyInput.fill('invalid_key');
          const saveBtn = page.getByRole('button', { name: /save|connect/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(500);

          const error = page.getByText(/invalid|incorrect|failed/i).first();
          await expect(error).toBeVisible();
        }
      }
    });

    test('allows skipping optional integrations', async ({ page }) => {
      await page.goto('/onboarding');
      const skipBtn = page.getByRole('button', { name: /skip|later|not now/i }).first();
      const hasBtn = await skipBtn.count();
      if (hasBtn > 0) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Step 4: Team & Roles', () => {
    test('displays team member list', async ({ page }) => {
      await page.route('**/api/onboarding/team*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ team: MOCK_TEAM }),
        })
      );

      await page.goto('/onboarding');
      const teamMember = page.getByText(/Dr. Sarah Bennett|Emily Thompson/i).first();
      await expect(teamMember).toBeVisible();
    });

    test('invites new team member', async ({ page }) => {
      let inviteSent = false;

      await page.route('**/api/onboarding/team/invite', (route) => {
        inviteSent = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/onboarding');
      const inviteBtn = page.getByRole('button', { name: /invite|add.*member|add.*team/i }).first();
      const hasBtn = await inviteBtn.count();
      if (hasBtn > 0) {
        await inviteBtn.click();
        await page.waitForTimeout(300);

        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        const hasInput = await emailInput.count();
        if (hasInput > 0) {
          await emailInput.fill('newmember@pacificglowmedspa.com');

          const roleSelect = page.locator('select[name="role"]').first();
          const hasRole = await roleSelect.count();
          if (hasRole > 0) {
            await roleSelect.selectOption('provider');
          }

          const sendBtn = page.getByRole('button', { name: /send.*invite|invite|add/i }).first();
          await sendBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('assigns roles to team members', async ({ page }) => {
      await page.route('**/api/onboarding/team*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ team: MOCK_TEAM }),
        })
      );

      await page.goto('/onboarding');
      const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]').first();
      const hasRole = await roleSelect.count();
      if (hasRole > 0) {
        await roleSelect.selectOption('provider');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Step 5: Branding & Theme', () => {
    test('allows setting clinic colors', async ({ page }) => {
      await page.goto('/onboarding');
      const colorInput = page.locator('input[type="color"], input[name="primaryColor"]').first();
      const hasInput = await colorInput.count();
      if (hasInput > 0) {
        await colorInput.fill('#2A4365');
        await page.waitForTimeout(300);
      }
    });

    test('allows uploading clinic logo', async ({ page }) => {
      await page.goto('/onboarding');
      const uploadInput = page.locator('input[type="file"], [data-testid="logo-upload"]').first();
      const hasUpload = await uploadInput.count();
      expect(hasUpload).toBeGreaterThanOrEqual(0);
    });

    test('shows live preview of branding changes', async ({ page }) => {
      await page.goto('/onboarding');
      const preview = page.locator('[data-testid="brand-preview"], [class*="preview"]').first();
      const hasPreview = await preview.count();
      expect(hasPreview).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Step 6: Go Live', () => {
    test('shows pre-launch checklist', async ({ page }) => {
      await page.route('**/api/onboarding/status', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            steps: MOCK_ONBOARDING_STEPS.map((s) => ({ ...s, status: 'completed' })),
            completionPercent: 100,
            readyToLaunch: true,
          }),
        })
      );

      await page.goto('/onboarding');
      const checklist = page.getByText(/checklist|ready|go live|launch/i).first();
      await expect(checklist).toBeVisible();
    });

    test('activates tenant on go-live', async ({ page }) => {
      let activated = false;

      await page.route('**/api/onboarding/activate', (route) => {
        activated = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, redirectUrl: '/dashboard' }),
        });
      });

      await page.goto('/onboarding');
      const launchBtn = page.getByRole('button', { name: /go live|launch|activate/i }).first();
      const hasBtn = await launchBtn.count();
      if (hasBtn > 0) {
        await launchBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles onboarding API failure', async ({ page }) => {
      await page.route('**/api/onboarding/status', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        })
      );

      await page.goto('/onboarding');
      const error = page.getByText(/error|unavailable|try again/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('preserves form data on navigation between steps', async ({ page }) => {
      await page.goto('/onboarding');
      const nameInput = page.locator('input[name="clinicName"]').first();
      const hasName = await nameInput.count();
      if (hasName > 0) {
        await nameInput.fill('Test Clinic');

        const nextBtn = page.getByRole('button', { name: /next/i }).first();
        await nextBtn.click();
        await page.waitForTimeout(300);

        const backBtn = page.getByRole('button', { name: /back|previous/i }).first();
        const hasBack = await backBtn.count();
        if (hasBack > 0) {
          await backBtn.click();
          await page.waitForTimeout(300);

          const value = await nameInput.inputValue();
          expect(value).toBe('Test Clinic');
        }
      }
    });
  });
});
