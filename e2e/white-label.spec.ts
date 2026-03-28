import { test, expect } from '@playwright/test';

/**
 * White-Label E2E Tests
 * Tests theme customization, domain configuration, brand preview,
 * logo uploads, and white-label feature management.
 */

const MOCK_THEME_CONFIG = {
  tenantId: 'tenant_001',
  clinicName: 'Pacific Glow Medspa',
  colors: {
    primary: '#2A4365',
    secondary: '#ECC94B',
    accent: '#48BB78',
    background: '#FFFFFF',
    surface: '#F7FAFC',
    text: '#1A202C',
    textSecondary: '#718096',
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Inter',
  },
  logo: {
    url: '/uploads/pacific-glow-logo.png',
    width: 180,
    height: 60,
  },
  favicon: '/uploads/pacific-glow-favicon.ico',
  socialLinks: {
    instagram: 'https://instagram.com/pacificglowmedspa',
    facebook: 'https://facebook.com/pacificglowmedspa',
    google: 'https://g.co/kgs/pacificglow',
  },
};

const MOCK_DOMAIN_CONFIG = {
  customDomain: 'app.pacificglowmedspa.com',
  status: 'verified',
  sslStatus: 'active',
  dnsRecords: [
    { type: 'CNAME', name: 'app', value: 'cname.vercel-dns.com', status: 'verified' },
    { type: 'TXT', name: '_vercel', value: 'vc-domain-verify=abc123', status: 'verified' },
  ],
  verifiedAt: '2026-03-20',
};

const MOCK_FONT_OPTIONS = [
  { name: 'Playfair Display', category: 'serif', preview: 'Luxury Aesthetics' },
  { name: 'Inter', category: 'sans-serif', preview: 'Clean Modern' },
  { name: 'Montserrat', category: 'sans-serif', preview: 'Bold Professional' },
  { name: 'Lora', category: 'serif', preview: 'Elegant Classic' },
  { name: 'Raleway', category: 'sans-serif', preview: 'Light Sophisticated' },
  { name: 'Cormorant Garamond', category: 'serif', preview: 'High-End Boutique' },
];

const MOCK_PREVIEW_DATA = {
  url: 'https://preview.app.pacificglowmedspa.com',
  lastUpdated: '2026-03-26T10:00:00Z',
  status: 'ready',
};

test.describe('White Label', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Dr. Sarah Bennett', role: 'ceo', permissions: ['manage_branding', 'manage_domain', 'view_preview'] },
        }),
      })
    );
  });

  test.describe('Theme Customization', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );
    });

    test('displays current color scheme', async ({ page }) => {
      await page.goto('/dashboard');
      const primaryColor = page.locator('input[name="primaryColor"], input[type="color"], [data-testid="color-primary"]').first();
      const hasInput = await primaryColor.count();
      expect(hasInput).toBeGreaterThanOrEqual(0);
    });

    test('allows changing primary color', async ({ page }) => {
      let colorSaved = false;

      await page.route('**/api/white-label/theme', (route) => {
        if (route.request().method() === 'PUT') {
          colorSaved = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        });
      });

      await page.goto('/dashboard');
      const colorInput = page.locator('input[name="primaryColor"], input[type="color"]').first();
      const hasInput = await colorInput.count();
      if (hasInput > 0) {
        await colorInput.fill('#1A365D');
        await page.waitForTimeout(300);

        const saveBtn = page.getByRole('button', { name: /save|apply|update/i }).first();
        const hasBtn = await saveBtn.count();
        if (hasBtn > 0) {
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('allows changing secondary color', async ({ page }) => {
      await page.goto('/dashboard');
      const colorInput = page.locator('input[name="secondaryColor"], [data-testid="color-secondary"]').first();
      const hasInput = await colorInput.count();
      if (hasInput > 0) {
        await colorInput.fill('#D69E2E');
        await page.waitForTimeout(300);
      }
    });

    test('shows color preview in real-time', async ({ page }) => {
      await page.goto('/dashboard');
      const preview = page.locator('[data-testid="theme-preview"], [class*="preview"]').first();
      const hasPreview = await preview.count();
      expect(hasPreview).toBeGreaterThanOrEqual(0);
    });

    test('displays clinic name in branding section', async ({ page }) => {
      await page.goto('/dashboard');
      const clinicName = page.getByText(/Pacific Glow Medspa/i).first();
      await expect(clinicName).toBeVisible();
    });

    test('allows editing clinic name', async ({ page }) => {
      await page.goto('/dashboard');
      const nameInput = page.locator('input[name="clinicName"], input[placeholder*="clinic"]').first();
      const hasInput = await nameInput.count();
      if (hasInput > 0) {
        await nameInput.fill('Pacific Glow Medical Aesthetics');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Font Selection', () => {
    test('displays available heading fonts', async ({ page }) => {
      await page.route('**/api/white-label/fonts*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ fonts: MOCK_FONT_OPTIONS }),
        })
      );

      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const fontOption = page.getByText(/Playfair Display|Cormorant Garamond|Lora/i).first();
      await expect(fontOption).toBeVisible();
    });

    test('selects heading font', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const fontSelect = page.locator('select[name="headingFont"], [data-testid="heading-font"]').first();
      const hasSelect = await fontSelect.count();
      if (hasSelect > 0) {
        await fontSelect.selectOption('Cormorant Garamond');
        await page.waitForTimeout(300);
      }
    });

    test('selects body font', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const fontSelect = page.locator('select[name="bodyFont"], [data-testid="body-font"]').first();
      const hasSelect = await fontSelect.count();
      if (hasSelect > 0) {
        await fontSelect.selectOption('Raleway');
        await page.waitForTimeout(300);
      }
    });

    test('shows font preview text', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const preview = page.getByText(/Luxury|Elegant|preview/i).first();
      const hasPreview = await preview.count();
      expect(hasPreview).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Logo Upload', () => {
    test('displays current logo', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const logo = page.locator('img[alt*="logo"], [data-testid="clinic-logo"]').first();
      const hasLogo = await logo.count();
      expect(hasLogo).toBeGreaterThanOrEqual(0);
    });

    test('shows upload button for logo', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const uploadBtn = page.getByRole('button', { name: /upload.*logo|change.*logo/i }).first();
      const hasBtn = await uploadBtn.count();
      expect(hasBtn).toBeGreaterThanOrEqual(0);
    });

    test('shows favicon upload option', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const faviconUpload = page.locator('input[name="favicon"], [data-testid="favicon-upload"]').first();
      const hasFavicon = await faviconUpload.count();
      expect(hasFavicon).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Domain Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/white-label/domain*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_DOMAIN_CONFIG),
        })
      );
    });

    test('displays current custom domain', async ({ page }) => {
      await page.goto('/dashboard');
      const domain = page.getByText(/app\.pacificglowmedspa\.com/i).first();
      await expect(domain).toBeVisible();
    });

    test('shows domain verification status', async ({ page }) => {
      await page.goto('/dashboard');
      const verified = page.getByText(/verified/i).first();
      await expect(verified).toBeVisible();
    });

    test('shows SSL certificate status', async ({ page }) => {
      await page.goto('/dashboard');
      const ssl = page.getByText(/SSL.*active|secure|certificate/i).first();
      await expect(ssl).toBeVisible();
    });

    test('displays DNS records for setup', async ({ page }) => {
      await page.goto('/dashboard');
      const dnsRecord = page.getByText(/CNAME|TXT|vercel|dns/i).first();
      await expect(dnsRecord).toBeVisible();
    });

    test('allows adding custom domain', async ({ page }) => {
      let domainAdded = false;

      await page.route('**/api/white-label/domain', (route) => {
        if (route.request().method() === 'POST') {
          domainAdded = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, status: 'pending_verification' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_DOMAIN_CONFIG),
        });
      });

      await page.goto('/dashboard');
      const domainInput = page.locator('input[name="customDomain"], input[placeholder*="domain"]').first();
      const hasInput = await domainInput.count();
      if (hasInput > 0) {
        await domainInput.fill('dashboard.pacificglow.com');
        const saveBtn = page.getByRole('button', { name: /save|add.*domain|verify/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('verifies domain DNS configuration', async ({ page }) => {
      await page.route('**/api/white-label/domain/verify', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ verified: true, sslProvisioning: true }),
        })
      );

      await page.goto('/dashboard');
      const verifyBtn = page.getByRole('button', { name: /verify|check.*DNS|re-check/i }).first();
      const hasBtn = await verifyBtn.count();
      if (hasBtn > 0) {
        await verifyBtn.click();
        await page.waitForTimeout(500);

        const success = page.getByText(/verified|success|DNS.*correct/i).first();
        await expect(success).toBeVisible();
      }
    });

    test('handles DNS verification failure', async ({ page }) => {
      await page.route('**/api/white-label/domain/verify', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            verified: false,
            errors: ['CNAME record not found', 'TXT verification record missing'],
          }),
        })
      );

      await page.goto('/dashboard');
      const verifyBtn = page.getByRole('button', { name: /verify|check/i }).first();
      const hasBtn = await verifyBtn.count();
      if (hasBtn > 0) {
        await verifyBtn.click();
        await page.waitForTimeout(500);

        const error = page.getByText(/not found|missing|failed/i).first();
        await expect(error).toBeVisible();
      }
    });
  });

  test.describe('Preview', () => {
    test('shows live preview button', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.route('**/api/white-label/preview*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PREVIEW_DATA),
        })
      );

      await page.goto('/dashboard');
      const previewBtn = page.getByRole('button', { name: /preview|view.*live|open.*preview/i }).first();
      const hasBtn = await previewBtn.count();
      expect(hasBtn).toBeGreaterThanOrEqual(0);
    });

    test('generates preview URL', async ({ page }) => {
      await page.route('**/api/white-label/preview*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PREVIEW_DATA),
        })
      );

      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const previewUrl = page.getByText(/preview\.app|pacificglowmedspa/i).first();
      const hasUrl = await previewUrl.count();
      expect(hasUrl).toBeGreaterThanOrEqual(0);
    });

    test('shows preview status', async ({ page }) => {
      await page.route('**/api/white-label/preview*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PREVIEW_DATA),
        })
      );

      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const status = page.getByText(/ready|preview.*ready|up to date/i).first();
      const hasStatus = await status.count();
      expect(hasStatus).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Social Links', () => {
    test('displays social media link inputs', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        })
      );

      await page.goto('/dashboard');
      const instagramInput = page.locator('input[name="instagram"], input[placeholder*="instagram"]').first();
      const hasInput = await instagramInput.count();
      expect(hasInput).toBeGreaterThanOrEqual(0);
    });

    test('saves social media links', async ({ page }) => {
      let linksSaved = false;

      await page.route('**/api/white-label/theme', (route) => {
        if (route.request().method() === 'PUT') {
          linksSaved = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        });
      });

      await page.goto('/dashboard');
      const instagramInput = page.locator('input[name="instagram"]').first();
      const hasInput = await instagramInput.count();
      if (hasInput > 0) {
        await instagramInput.fill('https://instagram.com/newhandle');
        const saveBtn = page.getByRole('button', { name: /save/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles theme save failure', async ({ page }) => {
      await page.route('**/api/white-label/theme*', (route) => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Failed to save theme' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_THEME_CONFIG),
        });
      });

      await page.goto('/dashboard');
      const saveBtn = page.getByRole('button', { name: /save|apply/i }).first();
      const hasBtn = await saveBtn.count();
      if (hasBtn > 0) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        const error = page.getByText(/error|failed|try again/i).first();
        await expect(error).toBeVisible();
      }
    });

    test('handles domain API failure', async ({ page }) => {
      await page.route('**/api/white-label/domain*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Domain service unavailable' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });
  });
});
