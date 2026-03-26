import { test as base, expect, type Page, type Locator } from '@playwright/test';

// ─── Test Data ───────────────────────────────────────────────────────────────

export const CLINIC = {
  name: 'Rani Beauty Clinic',
  phone: '425',
  city: 'Renton',
  address: '401 Olympia Ave NE',
  state: 'WA',
  zip: '98056',
  email: 'info@ranibeautyclinic.com',
  domain: 'ranibeautyclinic.com',
} as const;

export const SERVICES = [
  { name: 'HydraFacial', slug: 'hydrafacial', price: '$275' },
  { name: 'Botox', slug: 'botox-dysport', price: null },
  { name: 'Sofwave', slug: 'sofwave', price: '$2,750' },
  { name: 'RF Microneedling', slug: 'rf-microneedling', price: '$495' },
  { name: 'Laser Hair Removal', slug: 'laser-hair-removal', price: null },
  { name: 'VI Peel', slug: 'vi-peel', price: '$395' },
  { name: 'PRX-T33', slug: 'prx-t33', price: '$495' },
  { name: 'PicoWay', slug: 'picoway', price: '$350' },
] as const;

export const SERVICE_SLUGS = SERVICES.map(s => s.slug);

export const DASHBOARD_PAGES = [
  { path: '/dashboard', name: 'Overview' },
  { path: '/dashboard/revenue', name: 'Revenue' },
  { path: '/dashboard/leads', name: 'Leads' },
  { path: '/dashboard/schedule', name: 'Schedule' },
  { path: '/dashboard/leaderboard', name: 'Leaderboard' },
  { path: '/dashboard/entry', name: 'Data Entry' },
  { path: '/dashboard/plan-builder', name: 'Plan Builder' },
  { path: '/dashboard/clients', name: 'Clients' },
  { path: '/dashboard/alerts', name: 'Alerts' },
  { path: '/dashboard/pricing', name: 'Pricing' },
  { path: '/dashboard/pnl', name: 'P&L' },
  { path: '/dashboard/schedule-optimizer', name: 'Schedule Optimizer' },
  { path: '/dashboard/inventory-intel', name: 'Inventory' },
  { path: '/dashboard/social', name: 'Social' },
  { path: '/dashboard/meta-ads', name: 'Meta Ads' },
  { path: '/dashboard/consult', name: 'Consult' },
  { path: '/dashboard/knowledge-base', name: 'Knowledge Base' },
  { path: '/dashboard/phone-agent', name: 'Phone Agent' },
  { path: '/dashboard/charting', name: 'Charting' },
  { path: '/dashboard/reviews', name: 'Reviews' },
  { path: '/dashboard/settings', name: 'Settings' },
  { path: '/dashboard/integrations', name: 'Integrations' },
  { path: '/dashboard/finance', name: 'Finance' },
  { path: '/dashboard/ads', name: 'Ads' },
  { path: '/dashboard/reactivation', name: 'Reactivation' },
  { path: '/dashboard/competitor-intel', name: 'Competitor Intel' },
  { path: '/dashboard/glp1', name: 'GLP-1' },
] as const;

export const ENTRY_FORMS = [
  { path: '/dashboard/entry/lead', name: 'Lead' },
  { path: '/dashboard/entry/sale', name: 'Sale' },
  { path: '/dashboard/entry/expense', name: 'Expense' },
  { path: '/dashboard/entry/ceo-note', name: 'CEO Note' },
  { path: '/dashboard/entry/eod-recap', name: 'EOD Recap' },
  { path: '/dashboard/entry/room-issue', name: 'Room Issue' },
  { path: '/dashboard/entry/review', name: 'Review' },
  { path: '/dashboard/entry/inventory', name: 'Inventory' },
  { path: '/dashboard/entry/staff-note', name: 'Staff Note' },
  { path: '/dashboard/entry/consult-notes', name: 'Consult Notes' },
] as const;

export const PORTAL_PAGES = [
  { path: '/portal', name: 'Home' },
  { path: '/portal/appointments', name: 'Appointments' },
  { path: '/portal/treatments', name: 'Treatments' },
  { path: '/portal/plan', name: 'Plan' },
  { path: '/portal/loyalty', name: 'Loyalty' },
  { path: '/portal/referrals', name: 'Referrals' },
  { path: '/portal/profile', name: 'Profile' },
] as const;

export const SEO_PAGE_CATEGORIES = {
  financing: ['hydrafacial', 'botox', 'laser-hair-removal'],
  men: ['botox', 'laser-hair-removal', 'hydrafacial'],
  age: ['20s', '30s', '40s', '50s'],
  combinations: ['botox-hydrafacial', 'sofwave-rf-microneedling'],
  compare: ['hydrafacial-vs-regular-facial'],
  locations: ['renton', 'bellevue', 'seattle'],
} as const;

export const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '4255551234',
  message: 'This is a test message for E2E testing.',
} as const;

export const INVALID_CREDS = {
  username: 'invalid_user_e2e',
  password: 'wrong_password_e2e',
} as const;

// ─── Page Object Helpers ────────────────────────────────────────────────────

export class PublicPage {
  constructor(public readonly page: Page) {}

  get nav() { return this.page.locator('nav, header').first(); }
  get main() { return this.page.locator('main'); }
  get footer() { return this.page.locator('footer'); }
  get h1() { return this.page.locator('h1').first(); }

  navLink(name: RegExp | string) {
    return this.page.getByRole('link', { name: typeof name === 'string' ? new RegExp(name, 'i') : name }).first();
  }

  ctaButton(name?: RegExp) {
    return this.page.getByRole('link', { name: name ?? /book|consult|schedule|get started|learn more/i }).first();
  }

  async metaContent(selector: string): Promise<string | null> {
    return this.page.getAttribute(selector, 'content');
  }

  async jsonLd(): Promise<Record<string, unknown> | null> {
    const el = this.page.locator('script[type="application/ld+json"]').first();
    const count = await this.page.locator('script[type="application/ld+json"]').count();
    if (count === 0) return null;
    const text = await el.textContent();
    return text ? JSON.parse(text) : null;
  }

  async allJsonLd(): Promise<Record<string, unknown>[]> {
    const els = this.page.locator('script[type="application/ld+json"]');
    const count = await els.count();
    const results: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const text = await els.nth(i).textContent();
      if (text) results.push(JSON.parse(text));
    }
    return results;
  }

  async bodyText(): Promise<string> {
    return (await this.main.textContent()) ?? '';
  }
}

export class DashboardLoginPage {
  constructor(public readonly page: Page) {}

  get usernameInput() {
    return this.page.locator('input[type="text"], input[type="email"], input[name="username"]').first();
  }
  get passwordInput() { return this.page.locator('input[type="password"]').first(); }
  get submitButton() {
    return this.page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/login');
  }

  async fillAndSubmit(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

export class PortalPage {
  constructor(public readonly page: Page) {}

  get main() { return this.page.locator('main'); }
  get nav() { return this.page.locator('nav, aside').first(); }

  async goto(path: string) {
    await this.page.goto(path);
  }

  async bodyText(): Promise<string> {
    return (await this.page.locator('body').textContent()) ?? '';
  }
}

// ─── Extended Test Fixture ──────────────────────────────────────────────────

type Fixtures = {
  publicPage: PublicPage;
  dashboardLogin: DashboardLoginPage;
  portalPage: PortalPage;
};

export const test = base.extend<Fixtures>({
  publicPage: async ({ page }, use) => {
    await use(new PublicPage(page));
  },
  dashboardLogin: async ({ page }, use) => {
    await use(new DashboardLoginPage(page));
  },
  portalPage: async ({ page }, use) => {
    await use(new PortalPage(page));
  },
});

export { expect };
