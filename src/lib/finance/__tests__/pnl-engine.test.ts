/**
 * P&L Intelligence Engine — Test Suite
 *
 * Covers:
 *   1.  categorizeExpense (keyword tables, precedence, edge cases)
 *   2.  Service cost ratio math (known services, fallback, rounding)
 *   3.  P&L generation (revenue split, COGS, opex, margins, period compare)
 *   4.  Service margin analysis (estimated duration bands, ranking)
 *   5.  Provider profitability (35% cost, hours from unique days)
 *   6.  Cash flow projection (growth compounding, 6-month horizon, runway)
 *   7.  KPI calculation (days, ticket, uniqueClients fallback, break-even)
 *   8.  Financial health score — 5 components (min/mid/max) + weighted overall
 *   9.  Integration: realistic month of Rani transactions
 *   10. Edge cases: zero revenue, all-expense month, negative cash flow
 *
 * Fixture date anchor: 2026-04-10T12:00:00Z (projection month math is TZ-sensitive).
 */

// Lock TZ to UTC before importing the engine so projectCashFlow month
// arithmetic (which uses `new Date()` + `setUTCMonth`) is deterministic.
process.env.TZ = 'UTC';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  categorizeExpense,
  generateFinancialIntelligence,
  type ExpenseEntry,
  type ExpenseCategory,
  type FinanceInput,
  type RevenueEntry,
} from '@/lib/finance/pnl-engine';

// ── Helpers ─────────────────────────────────────────────────────────────

function makeExpense(overrides: Partial<ExpenseEntry> = {}): ExpenseEntry {
  return {
    date: '2026-04-05',
    amount: 100,
    vendor: 'Generic Vendor',
    description: 'Generic description',
    ...overrides,
  };
}

function makeRevenue(overrides: Partial<RevenueEntry> = {}): RevenueEntry {
  return {
    date: '2026-04-05',
    amount: 500,
    service: 'HydraFacial',
    category: 'Facial',
    provider: 'Mom',
    paymentMethod: 'card',
    clientType: 'returning',
    ...overrides,
  };
}

function makeInput(overrides: Partial<FinanceInput> = {}): FinanceInput {
  return {
    revenue: [],
    expenses: [],
    period: { start: '2026-04-01', end: '2026-04-30' },
    memberships: { count: 0, monthlyRevenue: 0 },
    ...overrides,
  };
}

// ── Setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  // 2026-04-10 is a Friday. April 2026 has 30 days.
  vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ════════════════════════════════════════════════════════════════════════
// 1. EXPENSE CATEGORIZATION
// ════════════════════════════════════════════════════════════════════════

describe('categorizeExpense', () => {
  describe('short-circuits on pre-set category', () => {
    it('returns the existing category without keyword scanning', () => {
      const e = makeExpense({
        vendor: 'Allergan',
        description: 'Botox 100u',
        category: 'misc', // would normally classify as supplies
      });
      expect(categorizeExpense(e)).toBe('misc');
    });

    it('honors pre-set category even if vendor/desc are empty', () => {
      const e = makeExpense({ vendor: '', description: '', category: 'rent' });
      expect(categorizeExpense(e)).toBe('rent');
    });
  });

  describe('payroll keywords', () => {
    const cases: [string, string][] = [
      ['Gusto', 'Bi-weekly payroll run'],
      ['ADP', 'Monthly salary deposit'],
      ['Venmo', 'Front desk wages'],
      ['Bonus Pool', 'Q1 bonus compensation'],
      ['Commission Run', 'Mom commission April'],
      ['QBO', '1099 contractor payment'],
      ['QBO', 'W2 payroll tax'],
      ['Team', 'Staff retention bonus'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as payroll', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('payroll');
    });
  });

  describe('rent keywords', () => {
    const cases: [string, string][] = [
      ['Renton Landlord LLC', 'April rent 401 Olympia Ave'],
      ['Property Mgmt Co', 'Lease payment'],
      ['Bank', 'Mortgage on building'],
      ['Olympia Property Holdings', 'Base rent'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as rent', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('rent');
    });
  });

  describe('supplies keywords', () => {
    const cases: [string, string][] = [
      ['Allergan', 'Botox 200u restock'],
      ['Galderma', 'Restylane filler case'],
      ['HydraFacial Co', 'Booster serum'],
      ['Needle Supply Inc', '30g needles box'],
      ['Medline', 'Nitrile gloves case of 1000'],
      ['VI Aesthetics', 'VI peel kits'],
      ['Laser Consumables', 'Laser tips replacement'],
      ['McKesson', 'Medical consumable order'],
      ['Sharps Co', 'Consumable disposal kit'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as supplies', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('supplies');
    });
  });

  describe('marketing keywords', () => {
    const cases: [string, string][] = [
      ['Meta', 'Meta Ads April spend'],
      ['Google', 'Google Ads Search campaign'],
      ['Facebook', 'Facebook boosted post'],
      ['Instagram', 'Instagram creator collab'],
      ['Agency', 'SEO retainer'],
      ['PromoCo', 'Holiday promotion flyers'],
      ['SendGrid', 'SendGrid marketing email'],
      ['Random', 'Brand advertising buy'],
      ['Vendor', 'Influencer campaign'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as marketing', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('marketing');
    });
  });

  describe('insurance keywords', () => {
    const cases: [string, string][] = [
      ['The Doctors Company', 'Malpractice premium'],
      ['Hiscox', 'General liability insurance'],
      ['BCBS', 'Health coverage'],
      ['State Farm', 'Clinic liability premium'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as insurance', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('insurance');
    });
  });

  describe('equipment keywords', () => {
    const cases: [string, string][] = [
      ['Sofwave Inc', 'Sofwave device installation'],
      ['Candela', 'Candela handpiece replacement'],
      ['Cutera', 'Cutera handpiece'],
      ['Tech Repair', 'Device repair visit'],
      ['Service Co', 'Machine maintenance'],
      ['Supplier', 'Equipment down payment'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as equipment', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('equipment');
    });
  });

  describe('software keywords', () => {
    const cases: [string, string][] = [
      ['Mangomint', 'Booking software subscription'],
      ['Vercel', 'Hosting saas'],
      ['Airtable', 'Team plan subscription'],
      ['Stripe', 'Stripe processing fees'],
      ['Plaid', 'Plaid API usage'],
      ['n8n Cloud', 'Automation software'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as software', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('software');
    });
  });

  describe('utilities keywords', () => {
    // NOTE: categorization is substring-based, so vendors whose names
    // contain earlier-iteration keywords (e.g. "Renton" contains "rent")
    // will short-circuit. Keep fixtures here clean of such collisions.
    const cases: [string, string][] = [
      ['PSE', 'Electric bill'],
      ['Water Dept', 'Water utility'],
      ['Comcast', 'Internet + wifi'],
      ['Verizon', 'Office phone line'],
      ['Puget Sound Energy', 'Gas service'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as utilities', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('utilities');
    });
  });

  describe('professional_services keywords', () => {
    const cases: [string, string][] = [
      ['Smith CPA', 'Monthly accounting'],
      ['Law Firm LLP', 'Legal review contract'],
      ['Lawyer', 'Corporate counsel hours'],
      ['HIPAA Pros', 'Compliance audit'],
      ['Advisor', 'Growth consultant retainer'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as professional_services', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('professional_services');
    });
  });

  describe('training keywords', () => {
    const cases: [string, string][] = [
      ['AMSPA', 'Annual conference ticket'],
      ['Allergan Academy', 'Injector certification course'],
      ['Medscape', 'CME education credits'],
      ['Workshop Co', 'Staff training workshop course'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as training', (vendor, description) => {
      // Post-Wave-11: 'staff' is no longer a payroll keyword, so
      // 'Staff training workshop course' now correctly falls through to
      // training. The precedence suite below covers 'staff meeting' → misc.
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('training');
    });
  });

  describe('misc fallback', () => {
    const cases: [string, string][] = [
      ['Costco', 'Break room snacks'],
      ['Amazon', 'Desk organizer'],
      ['Random Vendor', 'Miscellaneous purchase'],
      ['Target', 'Holiday decorations'],
    ];
    it.each(cases)('categorizes vendor=%s / desc=%s as misc', (vendor, description) => {
      expect(categorizeExpense(makeExpense({ vendor, description }))).toBe('misc');
    });

    it('returns misc for empty vendor and description', () => {
      expect(categorizeExpense(makeExpense({ vendor: '', description: '' }))).toBe('misc');
    });
  });

  describe('case insensitivity', () => {
    it('matches BOTOX (uppercase) as supplies', () => {
      expect(categorizeExpense(makeExpense({ vendor: 'ALLERGAN', description: 'BOTOX 100u' }))).toBe('supplies');
    });
    it('matches MiXeDcAsE RENT as rent', () => {
      expect(categorizeExpense(makeExpense({ vendor: 'LaNdLoRd', description: 'ApRiL ReNt' }))).toBe('rent');
    });
  });

  describe('keyword precedence (iteration order)', () => {
    // Iteration order in EXPENSE_KEYWORDS:
    //   payroll → rent → supplies → marketing → insurance →
    //   equipment → software → utilities → professional_services → training → misc
    it('"medical insurance" maps to insurance', () => {
      expect(
        categorizeExpense(makeExpense({ vendor: 'BCBS', description: 'Medical insurance premium' }))
      ).toBe('insurance');
    });

    it('"staff meeting" maps to misc, not payroll', () => {
      expect(
        categorizeExpense(makeExpense({ vendor: 'Restaurant', description: 'Staff meeting lunch' }))
      ).toBe('misc');
    });

    it('"twilio" maps to software', () => {
      expect(
        categorizeExpense(makeExpense({ vendor: 'Twilio', description: 'Monthly SMS invoice' }))
      ).toBe('software');
    });

    it('"space heater" maps to misc', () => {
      expect(
        categorizeExpense(makeExpense({ vendor: 'Amazon', description: 'Space heater for waiting room' }))
      ).toBe('misc');
    });

    it('"compliance training CME" matches professional_services before training', () => {
      // professional_services iterates before training → "compliance" wins.
      expect(
        categorizeExpense(
          makeExpense({ vendor: 'HIPAA Pros', description: 'Compliance training CME course' })
        )
      ).toBe('professional_services');
    });

    it('"laser hair removal" matches supplies ("laser" keyword)', () => {
      // Arguably should be equipment, but "laser" is in supplies.
      expect(
        categorizeExpense(makeExpense({ vendor: 'Candela', description: 'Laser hair removal consumables' }))
      ).toBe('supplies');
    });
  });

  describe('real Rani expense fixtures', () => {
    const real: { vendor: string; description: string; expected: ExpenseCategory }[] = [
      { vendor: 'Allergan', description: 'Botox 200u restock April', expected: 'supplies' },
      { vendor: 'Galderma', description: 'Restylane Lyft filler 3-pack', expected: 'supplies' },
      { vendor: 'Medline', description: 'Nitrile gloves medium 1000ct', expected: 'supplies' },
      { vendor: 'Sofwave Inc', description: 'Monthly device maintenance', expected: 'equipment' },
      { vendor: 'Renton Landlord LLC', description: 'April rent Suite 101', expected: 'rent' },
      { vendor: 'Meta', description: 'Meta Ads April campaign', expected: 'marketing' },
      { vendor: 'Google', description: 'Google Ads Search April', expected: 'marketing' },
      { vendor: 'The Doctors Company', description: 'Malpractice insurance premium', expected: 'insurance' },
      { vendor: 'Mangomint', description: 'Booking software subscription', expected: 'software' },
      { vendor: 'Vercel', description: 'Pro hosting plan', expected: 'software' },
      { vendor: 'Airtable', description: 'Team subscription', expected: 'software' },
      { vendor: 'PSE', description: 'Electric utility bill', expected: 'utilities' },
      { vendor: 'Comcast', description: 'Internet and wifi', expected: 'utilities' },
      { vendor: 'Smith CPA', description: 'Monthly accounting', expected: 'professional_services' },
      { vendor: 'Gusto', description: 'Bi-weekly payroll run', expected: 'payroll' },
    ];
    it.each(real)(
      'Rani fixture: $vendor / $description → $expected',
      ({ vendor, description, expected }) => {
        expect(categorizeExpense({ vendor, description, date: '2026-04-05', amount: 100 })).toBe(expected);
      }
    );
  });
});

// ════════════════════════════════════════════════════════════════════════
// 2. SERVICE COST RATIOS (observed via serviceMargins)
// ════════════════════════════════════════════════════════════════════════

describe('Service cost ratios', () => {
  function singleServiceInput(service: string, amount: number): FinanceInput {
    return makeInput({
      revenue: [makeRevenue({ service, amount })],
    });
  }

  const ratioCases: [string, number, number][] = [
    // [service, revenue, expectedCost (revenue * ratio, rounded)]
    ['HydraFacial', 1000, 250], // 25%
    ['Botox', 1000, 300], // 30%
    ['Fillers', 1000, 350], // 35%
    ['VI Peel', 1000, 200], // 20%
    ['PRX-T33', 1000, 220], // 22%
    ['RF Microneedling', 1000, 200], // 20%
    ['Laser Hair Removal', 1000, 150], // 15%
    ['Sofwave', 1000, 150], // 15%
    ['PicoWay', 1000, 180], // 18%
    ['GLP-1', 1000, 400], // 40%
    ['NAD+', 1000, 300], // 30%
    ['B12', 1000, 150], // 15%
    ['Glutathione', 1000, 200], // 20%
    ['Vitamin D3', 1000, 150], // 15%
    ['Tri-Immune', 1000, 200], // 20%
  ];

  it.each(ratioCases)(
    '%s: revenue=$%i → estimatedCost=$%i',
    (service, revenue, expectedCost) => {
      const result = generateFinancialIntelligence(singleServiceInput(service, revenue));
      const margin = result.serviceMargins.find(s => s.service === service)!;
      expect(margin.estimatedCost).toBe(expectedCost);
      expect(margin.grossProfit).toBe(revenue - expectedCost);
    }
  );

  it('unknown services fall back to 25% cost ratio', () => {
    const result = generateFinancialIntelligence(singleServiceInput('Aura Scan', 400));
    const margin = result.serviceMargins.find(s => s.service === 'Aura Scan')!;
    expect(margin.estimatedCost).toBe(100); // 400 * 0.25
  });

  it('rounds cost to nearest integer', () => {
    const result = generateFinancialIntelligence(singleServiceInput('Botox', 333));
    // 333 * 0.30 = 99.9 → round to 100
    const margin = result.serviceMargins.find(s => s.service === 'Botox')!;
    expect(margin.estimatedCost).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 3. P&L GENERATION
// ════════════════════════════════════════════════════════════════════════

describe('P&L generation', () => {
  it('sums service revenue across non-membership payment methods', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 500, paymentMethod: 'card' }),
        makeRevenue({ amount: 300, paymentMethod: 'cash' }),
        makeRevenue({ amount: 200, paymentMethod: 'financing' }),
        makeRevenue({ amount: 400, paymentMethod: 'package' }),
        makeRevenue({ amount: 999, paymentMethod: 'membership' }), // excluded
      ],
      memberships: { count: 10, monthlyRevenue: 1500 },
    });
    const { pnl } = generateFinancialIntelligence(input);
    // 500 + 300 + 200 + 400 = 1400 (membership entry excluded)
    expect(pnl.revenue.services).toBe(1400);
    expect(pnl.revenue.memberships).toBe(1500); // from input.memberships
    expect(pnl.revenue.packages).toBe(400);
    expect(pnl.revenue.total).toBe(2900); // services + memberships
  });

  it('byCategory breakdown is sorted by amount desc with percentages', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 800, category: 'Injectable' }),
        makeRevenue({ amount: 200, category: 'Injectable' }),
        makeRevenue({ amount: 500, category: 'Facial' }),
        makeRevenue({ amount: 500, category: 'Wellness' }),
      ],
      memberships: { count: 0, monthlyRevenue: 0 },
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.revenue.byCategory[0]).toEqual({ category: 'Injectable', amount: 1000, percentage: 50 });
    expect(pnl.revenue.byCategory[1].amount).toBe(500);
    expect(pnl.revenue.byCategory[2].amount).toBe(500);
  });

  it('byProvider breakdown aggregates and sorts', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 600, provider: 'Mom' }),
        makeRevenue({ amount: 400, provider: 'Mom' }),
        makeRevenue({ amount: 500, provider: 'Rina' }),
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.revenue.byProvider[0].provider).toBe('Mom');
    expect(pnl.revenue.byProvider[0].amount).toBe(1000);
    expect(pnl.revenue.byProvider[1].provider).toBe('Rina');
  });

  it('cost of services sums supplies + payroll categorized expenses', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 2000 }), // supplies
        makeExpense({ vendor: 'Medline', description: 'Gloves', amount: 300 }), // supplies
        makeExpense({ vendor: 'Gusto', description: 'Payroll run', amount: 4000 }), // payroll
        makeExpense({ vendor: 'Renton LLC', description: 'Rent', amount: 5000 }), // rent (not COGS)
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.costOfServices.supplies).toBe(2300);
    expect(pnl.costOfServices.providerCompensation).toBe(4000);
    expect(pnl.costOfServices.total).toBe(6300);
  });

  it('gross profit and margin calculate correctly', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 2000 }),
        makeExpense({ vendor: 'Gusto', description: 'Payroll', amount: 2000 }),
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.grossProfit).toBe(6000);
    expect(pnl.grossMargin).toBe(60); // 6000/10000
  });

  it('operating expenses exclude COGS (supplies + payroll) categories', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 2000 }), // COGS (supplies)
        makeExpense({ vendor: 'Gusto', description: 'Payroll', amount: 2000 }), // COGS (payroll)
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 }),
        makeExpense({ vendor: 'Meta', description: 'Meta Ads', amount: 1000 }),
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    const categories = pnl.operatingExpenses.byCategory.map(c => c.category);
    expect(categories).not.toContain('supplies');
    expect(categories).not.toContain('payroll');
    expect(categories).toContain('rent');
    expect(categories).toContain('marketing');
    expect(pnl.operatingExpenses.total).toBe(6000);
  });

  it('operatingExpenses.byCategory is sorted desc', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Meta', description: 'Meta Ads', amount: 1000 }),
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 }),
        makeExpense({ vendor: 'Mangomint', description: 'Software sub', amount: 300 }),
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.operatingExpenses.byCategory[0].category).toBe('rent');
    expect(pnl.operatingExpenses.byCategory[0].amount).toBe(5000);
    expect(pnl.operatingExpenses.byCategory[1].category).toBe('marketing');
  });

  it('net income = gross profit - opex, net margin rounded', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 1000 }), // supplies
        makeExpense({ vendor: 'Gusto', description: 'Payroll', amount: 1000 }), // payroll
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 3000 }), // rent
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    // gross = 10000 - 2000 = 8000, opex = 3000, net = 5000 → netMargin = 50
    expect(pnl.netIncome).toBe(5000);
    expect(pnl.netMargin).toBe(50);
  });

  describe('period comparison', () => {
    it('computes positive revenue/expense/netIncome change', () => {
      const input = makeInput({
        revenue: [makeRevenue({ amount: 12_000 })],
        expenses: [makeExpense({ vendor: 'Gusto', description: 'Payroll', amount: 4000 })],
        previousPeriod: { revenue: 10_000, expenses: 5000, netIncome: 5000 },
      });
      const { pnl } = generateFinancialIntelligence(input);
      expect(pnl.periodComparison!.revenueChange).toBe(20);
      expect(pnl.periodComparison!.expenseChange).toBe(-20);
      expect(pnl.periodComparison!.netIncomeChange).toBe(60); // (8000-5000)/5000
    });

    it('uses a finite percentage when previous period expenses are zero', () => {
      const input = makeInput({
        revenue: [makeRevenue({ amount: 5_000 })],
        expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 1_000 })],
        previousPeriod: { revenue: 10_000, expenses: 0, netIncome: -2_000 },
      });
      const { pnl } = generateFinancialIntelligence(input);
      expect(pnl.periodComparison!.expenseChange).toBe(100);
    });

    it('handles prev.revenue=0 without dividing by zero', () => {
      const input = makeInput({
        revenue: [makeRevenue({ amount: 5000 })],
        previousPeriod: { revenue: 0, expenses: 0, netIncome: 0 },
      });
      const { pnl } = generateFinancialIntelligence(input);
      expect(pnl.periodComparison!.revenueChange).toBe(0);
      expect(pnl.periodComparison!.expenseChange).toBe(0);
      expect(pnl.periodComparison!.netIncomeChange).toBe(0);
    });

    it('netIncomeChange uses abs(prev) so negative→positive flips display correctly', () => {
      const input = makeInput({
        revenue: [makeRevenue({ amount: 10_000 })],
        expenses: [makeExpense({ vendor: 'Gusto', description: 'Payroll', amount: 2000 })],
        previousPeriod: { revenue: 8000, expenses: 9000, netIncome: -1000 },
      });
      const { pnl } = generateFinancialIntelligence(input);
      // new net = 8000, prev = -1000, change = (8000 - (-1000)) / |-1000| * 100 = 900
      expect(pnl.periodComparison!.netIncomeChange).toBe(900);
    });

    it('is undefined when previousPeriod not supplied', () => {
      const input = makeInput({ revenue: [makeRevenue({ amount: 5000 })] });
      const { pnl } = generateFinancialIntelligence(input);
      expect(pnl.periodComparison).toBeUndefined();
    });
  });

  it('includes period string in ISO form', () => {
    const input = makeInput({
      period: { start: '2026-04-01', end: '2026-04-30' },
      revenue: [makeRevenue({ amount: 1000 })],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.period).toBe('2026-04-01 to 2026-04-30');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 4. SERVICE MARGIN ANALYSIS
// ════════════════════════════════════════════════════════════════════════

describe('Service margin analysis', () => {
  it('ranks services by gross profit descending', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ service: 'HydraFacial', amount: 500 }), // cost 125, profit 375
        makeRevenue({ service: 'Sofwave', amount: 4000 }), // cost 600, profit 3400
        makeRevenue({ service: 'Botox', amount: 1000 }), // cost 300, profit 700
      ],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    expect(serviceMargins[0].service).toBe('Sofwave');
    expect(serviceMargins[0].rank).toBe(1);
    expect(serviceMargins[1].service).toBe('Botox');
    expect(serviceMargins[1].rank).toBe(2);
    expect(serviceMargins[2].service).toBe('HydraFacial');
    expect(serviceMargins[2].rank).toBe(3);
  });

  it('estimatedDuration=90 min for avgTicket > 1000', () => {
    const input = makeInput({
      revenue: [makeRevenue({ service: 'Sofwave', amount: 3000 })],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    // 3000 / 90 = 33.33 → rounded to 33.33
    expect(serviceMargins[0].revenuePerMinute).toBeCloseTo(33.33, 2);
  });

  it('estimatedDuration=60 min for avgTicket in (500, 1000]', () => {
    const input = makeInput({
      revenue: [makeRevenue({ service: 'Botox', amount: 800 })],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    // 800 / 60 = 13.33
    expect(serviceMargins[0].revenuePerMinute).toBeCloseTo(13.33, 2);
  });

  it('estimatedDuration=45 min for avgTicket in (200, 500]', () => {
    const input = makeInput({
      revenue: [makeRevenue({ service: 'HydraFacial', amount: 300 })],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    // 300 / 45 ≈ 6.67
    expect(serviceMargins[0].revenuePerMinute).toBeCloseTo(6.67, 2);
  });

  it('estimatedDuration=30 min for avgTicket <= 200', () => {
    const input = makeInput({
      revenue: [makeRevenue({ service: 'B12', amount: 35 })],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    // 35 / 30 ≈ 1.17
    expect(serviceMargins[0].revenuePerMinute).toBeCloseTo(1.17, 2);
  });

  it('aggregates multiple bookings of same service', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ service: 'Botox', amount: 800 }),
        makeRevenue({ service: 'Botox', amount: 1200 }),
        makeRevenue({ service: 'Botox', amount: 1000 }),
      ],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    const botox = serviceMargins.find(s => s.service === 'Botox')!;
    expect(botox.bookings).toBe(3);
    expect(botox.revenue).toBe(3000);
    expect(botox.avgTicket).toBe(1000);
    expect(botox.estimatedCost).toBe(900); // 3000 * 0.30
  });

  it('inherits category from first revenue entry', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ service: 'Botox', category: 'Injectable', amount: 500 }),
        makeRevenue({ service: 'Botox', category: 'Aesthetic', amount: 500 }), // ignored
      ],
    });
    const { serviceMargins } = generateFinancialIntelligence(input);
    expect(serviceMargins[0].category).toBe('Injectable');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 5. PROVIDER PROFITABILITY
// ════════════════════════════════════════════════════════════════════════

describe('Provider profitability', () => {
  it('applies 35% provider cost ratio', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ provider: 'Mom', amount: 1000, date: '2026-04-01' }),
      ],
    });
    const { providerProfitability } = generateFinancialIntelligence(input);
    const mom = providerProfitability[0];
    expect(mom.estimatedCost).toBe(350);
    expect(mom.grossProfit).toBe(650);
    expect(mom.grossMargin).toBe(65);
  });

  it('calculates hours worked from unique booking dates * 8', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ provider: 'Mom', amount: 500, date: '2026-04-01' }),
        makeRevenue({ provider: 'Mom', amount: 500, date: '2026-04-01' }), // same day
        makeRevenue({ provider: 'Mom', amount: 500, date: '2026-04-02' }),
        makeRevenue({ provider: 'Mom', amount: 500, date: '2026-04-03' }),
      ],
    });
    const { providerProfitability } = generateFinancialIntelligence(input);
    // 3 unique days * 8 hr = 24 hr. Revenue 2000. rph = 2000/24 ≈ 83
    expect(providerProfitability[0].revenuePerHour).toBe(83);
  });

  it('returns top 5 services per provider ordered by revenue', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ provider: 'Mom', service: 'Botox', amount: 1000 }),
        makeRevenue({ provider: 'Mom', service: 'Fillers', amount: 2000 }),
        makeRevenue({ provider: 'Mom', service: 'HydraFacial', amount: 500 }),
        makeRevenue({ provider: 'Mom', service: 'VI Peel', amount: 400 }),
        makeRevenue({ provider: 'Mom', service: 'PRX-T33', amount: 495 }),
        makeRevenue({ provider: 'Mom', service: 'B12', amount: 35 }),
      ],
    });
    const { providerProfitability } = generateFinancialIntelligence(input);
    const top = providerProfitability[0].topServices;
    expect(top).toHaveLength(5);
    expect(top[0]).toEqual({ service: 'Fillers', revenue: 2000 });
    expect(top[4].service).toBe('VI Peel');
    expect(top.find(s => s.service === 'B12')).toBeUndefined();
  });

  it('sorts providers by total revenue desc', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ provider: 'Rina', amount: 500 }),
        makeRevenue({ provider: 'Mom', amount: 1500 }),
      ],
    });
    const { providerProfitability } = generateFinancialIntelligence(input);
    expect(providerProfitability[0].provider).toBe('Mom');
    expect(providerProfitability[1].provider).toBe('Rina');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 6. CASH FLOW PROJECTION
// ════════════════════════════════════════════════════════════════════════

describe('Cash flow projection', () => {
  it('returns exactly 6 months', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      bankBalance: 50_000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    expect(cashFlowProjection).toHaveLength(6);
  });

  it('month strings start at April 2026 and walk forward (Apr–Sep)', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      bankBalance: 50_000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    expect(cashFlowProjection.map(p => p.month)).toEqual([
      'Apr 2026',
      'May 2026',
      'Jun 2026',
      'Jul 2026',
      'Aug 2026',
      'Sep 2026',
    ]);
  });

  it('applies 3% compound revenue growth and 1% expense growth', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 0,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0: rev = round(10000 * 1.03^0) = 10000, exp = round(5000 * 1.01^0) = 5000
    expect(cashFlowProjection[0].projectedRevenue).toBe(10_000);
    expect(cashFlowProjection[0].projectedExpenses).toBe(5000);
    // Month 1: rev = round(10300), exp = round(5050)
    expect(cashFlowProjection[1].projectedRevenue).toBe(10_300);
    expect(cashFlowProjection[1].projectedExpenses).toBe(5050);
    // Month 5: rev = round(10000 * 1.03^5) = round(11592.74) = 11593
    expect(cashFlowProjection[5].projectedRevenue).toBe(11_593);
    // exp = round(5000 * 1.01^5) = round(5255.0502) = 5255
    expect(cashFlowProjection[5].projectedExpenses).toBe(5255);
  });

  it('uses caller-supplied projection growth rates for rev/expense', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 20_000,
      projectionGrowthRates: {
        revenueGrowthRate: 0.05,
        expenseGrowthRate: 0.03,
      },
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0 stays base.
    expect(cashFlowProjection[0].projectedRevenue).toBe(10_000);
    expect(cashFlowProjection[0].projectedExpenses).toBe(5000);
    // Month 1 uses the custom rates: 10k * 1.05 and 5k * 1.03.
    expect(cashFlowProjection[1].projectedRevenue).toBe(10_500);
    expect(cashFlowProjection[1].projectedExpenses).toBe(5_150);
  });

  it('clamps caller-supplied growth rates to safe bounds', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 20_000,
      projectionGrowthRates: {
        revenueGrowthRate: 1.5,
        expenseGrowthRate: -0.9,
      },
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Default clamp caps revenue growth at 30% and floors expense growth at 0%.
    expect(cashFlowProjection[1].projectedRevenue).toBe(13_000);
    expect(cashFlowProjection[1].projectedExpenses).toBe(5_000);
  });

  it('projected balance accumulates net income from starting balance', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 20_000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0: balance = 20000 + (10000-5000) = 25000
    expect(cashFlowProjection[0].projectedBalance).toBe(25_000);
    // Month 1: balance = 25000 + (10300-5050) = 30250
    expect(cashFlowProjection[1].projectedBalance).toBe(30_250);
  });

  it('profitable clinic gets runway = 99 (sentinel for "infinite")', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 2000 })],
      bankBalance: 30_000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    cashFlowProjection.forEach(p => {
      expect(p.runwayMonths).toBe(99);
    });
  });

  it('burning clinic with positive balance gets finite runway', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 5000 })],
      expenses: [
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 8000 }), // rent = opex
        makeExpense({ vendor: 'Meta', description: 'Meta Ads', amount: 2000 }),
      ],
      bankBalance: 50_000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0: rev 5000, exp round(10000 * 1) = 10000, burn 5000.
    // runway uses the starting balance before month burn is applied: 50000/5000 = 10.
    expect(cashFlowProjection[0].projectedNetIncome).toBe(-5000);
    expect(cashFlowProjection[0].projectedBalance).toBe(45_000);
    expect(cashFlowProjection[0].runwayMonths).toBe(10);
  });

  it('burning clinic with zero balance gets runway=0', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 1000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 0,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0: balance = 0 + (1000-5000) = -4000, burn > 0, balance not > 0 → runway 0
    expect(cashFlowProjection[0].runwayMonths).toBe(0);
  });

  it('runwayMonths is clamped to Math.max(0, runway)', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 1000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: -10_000, // underwater
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    expect(cashFlowProjection[0].runwayMonths).toBeGreaterThanOrEqual(0);
  });

  it('defaults bankBalance to 0 when not supplied', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // Month 0 balance = 0 + 5000 = 5000
    expect(cashFlowProjection[0].projectedBalance).toBe(5000);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 7. KPIs
// ════════════════════════════════════════════════════════════════════════

describe('KPI calculation', () => {
  it('days window uses inclusive UTC day count', () => {
    // April 1 to April 30 is 30 calendar days inclusive.
    const input = makeInput({
      period: { start: '2026-04-01', end: '2026-04-30' },
      revenue: [makeRevenue({ amount: 29_000 })],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.avgDailyRevenue).toBe(967); // 29000 / 30
  });

  it('clamps days to minimum of 1 when period has zero length', () => {
    const input = makeInput({
      period: { start: '2026-04-10', end: '2026-04-10' },
      revenue: [makeRevenue({ amount: 500 })],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.avgDailyRevenue).toBe(500); // divided by 1
  });

  it('avgTicketSize divides total revenue by transaction count', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 1000 }),
        makeRevenue({ amount: 500 }),
        makeRevenue({ amount: 300 }),
      ],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.avgTicketSize).toBe(600); // 1800 / 3
  });

  it('avgTicketSize is 0 when no revenue entries', () => {
    const { kpis } = generateFinancialIntelligence(makeInput());
    expect(kpis.avgTicketSize).toBe(0);
  });

  it('revenuePerClient uses unique clientIds when provided', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 500, clientId: 'c1' }),
        makeRevenue({ amount: 500, clientId: 'c1' }),
        makeRevenue({ amount: 500, clientId: 'c2' }),
      ],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.revenuePerClient).toBe(750); // 1500 / 2 unique
  });

  it('revenuePerClient falls back to transaction count when no clientIds', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 500 }),
        makeRevenue({ amount: 500 }),
        makeRevenue({ amount: 500 }),
      ],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.revenuePerClient).toBe(500); // 1500 / 3
  });

  it('membershipRevenuePercent uses memberships.monthlyRevenue / total', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 8000 })],
      memberships: { count: 20, monthlyRevenue: 2000 },
    });
    const { kpis } = generateFinancialIntelligence(input);
    // total = 10000, membership = 2000 → 20%
    expect(kpis.membershipRevenuePercent).toBe(20);
  });

  it('financingAdoptionRate is % of entries with financing payment method', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 500, paymentMethod: 'financing' }),
        makeRevenue({ amount: 500, paymentMethod: 'card' }),
        makeRevenue({ amount: 500, paymentMethod: 'card' }),
        makeRevenue({ amount: 500, paymentMethod: 'card' }),
      ],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.financingAdoptionRate).toBe(25);
  });

  it('newClientRevenuePercent uses clientType=new revenue / total', () => {
    const input = makeInput({
      revenue: [
        makeRevenue({ amount: 3000, clientType: 'new' }),
        makeRevenue({ amount: 7000, clientType: 'returning' }),
      ],
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.newClientRevenuePercent).toBe(30);
  });

  it('breakEvenDaily uses monthlyFixedCosts when provided', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      monthlyFixedCosts: 30_000,
    });
    const { kpis } = generateFinancialIntelligence(input);
    expect(kpis.breakEvenDaily).toBe(1000); // 30000/30
  });

  it('breakEvenDaily falls back to 70% of opex when no monthlyFixedCosts', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 9000 })],
    });
    const { kpis } = generateFinancialIntelligence(input);
    // opex = 9000, fixed = 6300, /30 = 210
    expect(kpis.breakEvenDaily).toBe(210);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 8. FINANCIAL HEALTH SCORE
// ════════════════════════════════════════════════════════════════════════

describe('Financial health score — profitability component', () => {
  function withNetMargin(netMarginPercent: number): FinanceInput {
    // Dial up revenue and a single rent expense so grossMargin stays high
    // (to isolate profitability component). rent is opex so doesn't affect
    // gross margin; profitability is derived from netMargin.
    const revenue = 100_000;
    const opex = revenue - Math.round((netMarginPercent / 100) * revenue);
    return makeInput({
      revenue: [makeRevenue({ amount: revenue })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: opex })],
    });
  }

  const cases: [number, number][] = [
    // [netMargin%, expectedProfitabilityScore]
    [25, 90], // > 20
    [20, 80], // boundary — not > 20
    [18, 80], // > 15
    [15, 70], // not > 15
    [12, 70], // > 10
    [10, 55], // not > 10
    [7, 55], // > 5
    [5, 40], // not > 5
    [3, 40], // > 0
  ];
  it.each(cases)('netMargin=%i%% → profitability=%i', (margin, expected) => {
    const { healthScore } = generateFinancialIntelligence(withNetMargin(margin));
    expect(healthScore.components.profitability).toBe(expected);
  });

  it('operating at a loss: profitability=20 with alert and recommendation', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 15_000 })],
    });
    const { healthScore } = generateFinancialIntelligence(input);
    expect(healthScore.components.profitability).toBe(20);
    expect(healthScore.alerts).toContain('Business is operating at a loss this period');
    expect(healthScore.recommendations.some(r => /cost reduction/i.test(r))).toBe(true);
  });
});

describe('Financial health score — growth component', () => {
  function withRevChange(changePercent: number): FinanceInput {
    const now = 12_000;
    const prev = Math.round(now / (1 + changePercent / 100));
    return makeInput({
      revenue: [makeRevenue({ amount: now })],
      previousPeriod: { revenue: prev, expenses: 5000, netIncome: 5000 },
    });
  }

  it('neutral 50 when no previousPeriod', () => {
    const { healthScore } = generateFinancialIntelligence(
      makeInput({ revenue: [makeRevenue({ amount: 10_000 })] })
    );
    expect(healthScore.components.growth).toBe(50);
  });

  const cases: [number, number][] = [
    [25, 95], // > 20
    [15, 85], // > 10
    [8, 70], // > 5
    [3, 55], // > 0
    [-3, 40], // > -5
  ];
  it.each(cases)('revChange=%i%% → growth=%i', (change, expected) => {
    const { healthScore } = generateFinancialIntelligence(withRevChange(change));
    expect(healthScore.components.growth).toBe(expected);
  });

  it('large decline triggers alert + reactivation recommendation', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 5000 })],
      previousPeriod: { revenue: 10_000, expenses: 5000, netIncome: 5000 },
    });
    const { healthScore } = generateFinancialIntelligence(input);
    expect(healthScore.components.growth).toBe(20);
    expect(healthScore.alerts.some(a => /Revenue declined/.test(a))).toBe(true);
    expect(healthScore.recommendations.some(r => /reactivation/i.test(r))).toBe(true);
  });
});

describe('Financial health score — efficiency component', () => {
  function withGrossMargin(marginPercent: number): FinanceInput {
    // revenue 10000, cogs = 10000 * (1 - margin/100)
    const revenue = 10_000;
    const cogs = revenue - Math.round((marginPercent / 100) * revenue);
    return makeInput({
      revenue: [makeRevenue({ amount: revenue })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox supplies', amount: cogs }),
      ],
    });
  }

  const cases: [number, number][] = [
    [70, 90], // > 65
    [60, 75], // > 55
    [50, 60], // > 45
  ];
  it.each(cases)('grossMargin=%i%% → efficiency=%i', (margin, expected) => {
    const { healthScore } = generateFinancialIntelligence(withGrossMargin(margin));
    expect(healthScore.components.efficiency).toBe(expected);
  });

  it('low gross margin (≤45%) → efficiency=35 with alert', () => {
    const { healthScore } = generateFinancialIntelligence(withGrossMargin(40));
    expect(healthScore.components.efficiency).toBe(35);
    expect(healthScore.alerts.some(a => /Gross margin/.test(a))).toBe(true);
    expect(healthScore.recommendations.some(r => /supplier costs/i.test(r))).toBe(true);
  });
});

describe('Financial health score — stability component', () => {
  function withMembershipPct(pct: number): FinanceInput {
    // total revenue = 10000, memberships = pct%
    const membership = Math.round((pct / 100) * 10_000);
    const service = 10_000 - membership;
    return makeInput({
      revenue: [makeRevenue({ amount: service })],
      memberships: { count: 50, monthlyRevenue: membership },
    });
  }

  const cases: [number, number][] = [
    [35, 85], // > 30
    [25, 70], // > 20
    [15, 55], // > 10
    [5, 35],
  ];
  it.each(cases)('membership=%i%% → stability=%i', (pct, expected) => {
    const { healthScore } = generateFinancialIntelligence(withMembershipPct(pct));
    expect(healthScore.components.stability).toBe(expected);
  });

  it('low membership mix produces recommendation to build recurring revenue', () => {
    const { healthScore } = generateFinancialIntelligence(withMembershipPct(5));
    expect(healthScore.recommendations.some(r => /membership revenue/i.test(r))).toBe(true);
  });
});

describe('Financial health score — cash position component', () => {
  function withCashMonths(months: number): FinanceInput {
    // Revenue 10k, expenses 5k → totalExpenses in KPIs = costOfServices + opex
    // Use rent to keep all in opex so breakdown is predictable.
    return makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 5000 * months,
    });
  }

  const cases: [number, number][] = [
    [7, 95], // > 6 months
    [4, 80], // > 3 months
    [2, 55], // > 1 month
  ];
  it.each(cases)('%i months of runway → cashPosition=%i', (months, expected) => {
    const { healthScore } = generateFinancialIntelligence(withCashMonths(months));
    expect(healthScore.components.cashPosition).toBe(expected);
  });

  it('< 1 month of cash → cashPosition=25 with alert', () => {
    const { healthScore } = generateFinancialIntelligence(withCashMonths(0.5));
    expect(healthScore.components.cashPosition).toBe(25);
    expect(healthScore.alerts.some(a => /Cash reserves/.test(a))).toBe(true);
    expect(healthScore.recommendations.some(r => /cash reserve/i.test(r))).toBe(true);
  });

  it('bankBalance not supplied → cashPosition stays at neutral 50', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
    });
    const { healthScore } = generateFinancialIntelligence(input);
    expect(healthScore.components.cashPosition).toBe(50);
  });

  it('cashPosition treats zero bankBalance as critical cash risk', () => {
    // Zero balance should be treated as a critical alert condition.
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
      bankBalance: 0,
    });
    const { healthScore } = generateFinancialIntelligence(input);
    expect(healthScore.components.cashPosition).toBe(25);
    expect(healthScore.alerts.some(a => /Cash reserves/.test(a))).toBe(true);
    expect(healthScore.recommendations.some(r => /cash reserve/i.test(r))).toBe(true);
  });
});

describe('Financial health score — overall weighted composition', () => {
  it('applies weights 30/20/20/15/15 and rounds', () => {
    // Force each component to a known value via careful fixture construction.
    // Profitability: netMargin > 20 → 90
    // Growth: revChange > 20 → 95
    // Efficiency: grossMargin > 65 → 90
    // Stability: membership > 30% → 85
    // Cash: > 6 months → 95
    const input = makeInput({
      revenue: [makeRevenue({ amount: 60_000 })], // service
      memberships: { count: 300, monthlyRevenue: 40_000 }, // 40% of 100k
      expenses: [
        // Keep cogs tiny → grossMargin ~100%
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 100 }),
        // Some opex but not too much → netMargin still > 20
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 10_000 }),
      ],
      previousPeriod: { revenue: 50_000, expenses: 10_000, netIncome: 40_000 },
      bankBalance: 500_000,
    });
    const { healthScore } = generateFinancialIntelligence(input);
    expect(healthScore.components.profitability).toBe(90);
    expect(healthScore.components.growth).toBe(95);
    expect(healthScore.components.efficiency).toBe(90);
    expect(healthScore.components.stability).toBe(85);
    expect(healthScore.components.cashPosition).toBe(95);
    // overall = 90*.30 + 95*.20 + 90*.20 + 85*.15 + 95*.15 =
    // 27 + 19 + 18 + 12.75 + 14.25 = 91
    expect(healthScore.overall).toBe(91);
  });

  it('floor case: all components at minimum', () => {
    // Loss-making, no previousPeriod (neutral growth 50), gross margin low,
    // no memberships, no bank balance.
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox supplies', amount: 9000 }),
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 10_000 }),
      ],
    });
    const { healthScore } = generateFinancialIntelligence(input);
    // profitability: netMargin = (10000-9000-10000)/10000 = -90% → 20
    // growth: no previousPeriod → 50
    // efficiency: grossMargin 10% → 35
    // stability: membership 0% → 35
    // cashPosition: no balance → 50
    expect(healthScore.components.profitability).toBe(20);
    expect(healthScore.components.growth).toBe(50);
    expect(healthScore.components.efficiency).toBe(35);
    expect(healthScore.components.stability).toBe(35);
    expect(healthScore.components.cashPosition).toBe(50);
    // overall = 20*.30 + 50*.20 + 35*.20 + 35*.15 + 50*.15 =
    // 6 + 10 + 7 + 5.25 + 7.5 = 35.75 → 36
    expect(healthScore.overall).toBe(36);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 9. INTEGRATION: realistic Rani month
// ════════════════════════════════════════════════════════════════════════

describe('Integration — realistic April 2026 month at Rani Beauty Clinic', () => {
  function buildRealMonth(): FinanceInput {
    const revenue: RevenueEntry[] = [
      // Sofwave treatments (high ticket)
      { date: '2026-04-03', amount: 3500, service: 'Sofwave', category: 'Skin Tightening', provider: 'Mom', paymentMethod: 'financing', clientType: 'new', clientId: 'c001' },
      { date: '2026-04-10', amount: 4500, service: 'Sofwave', category: 'Skin Tightening', provider: 'Mom', paymentMethod: 'card', clientType: 'returning', clientId: 'c002' },
      { date: '2026-04-17', amount: 2750, service: 'Sofwave', category: 'Skin Tightening', provider: 'Mom', paymentMethod: 'financing', clientType: 'new', clientId: 'c003' },
      // Botox bread and butter
      { date: '2026-04-02', amount: 800, service: 'Botox', category: 'Injectable', provider: 'Mom', paymentMethod: 'card', clientType: 'returning', clientId: 'c004' },
      { date: '2026-04-05', amount: 1200, service: 'Botox', category: 'Injectable', provider: 'Mom', paymentMethod: 'card', clientType: 'returning', clientId: 'c005' },
      { date: '2026-04-12', amount: 900, service: 'Botox', category: 'Injectable', provider: 'Mom', paymentMethod: 'card', clientType: 'returning', clientId: 'c004' },
      { date: '2026-04-19', amount: 1000, service: 'Botox', category: 'Injectable', provider: 'Mom', paymentMethod: 'card', clientType: 'new', clientId: 'c006' },
      // HydraFacial
      { date: '2026-04-04', amount: 275, service: 'HydraFacial', category: 'Facial', provider: 'Rina', paymentMethod: 'card', clientType: 'returning', clientId: 'c007' },
      { date: '2026-04-11', amount: 275, service: 'HydraFacial', category: 'Facial', provider: 'Rina', paymentMethod: 'membership', clientType: 'member', clientId: 'c008' },
      { date: '2026-04-18', amount: 275, service: 'HydraFacial', category: 'Facial', provider: 'Rina', paymentMethod: 'card', clientType: 'new', clientId: 'c009' },
      // Wellness injections
      { date: '2026-04-06', amount: 150, service: 'NAD+', category: 'Wellness', provider: 'Rina', paymentMethod: 'card', clientType: 'returning', clientId: 'c010' },
      { date: '2026-04-13', amount: 35, service: 'B12', category: 'Wellness', provider: 'Rina', paymentMethod: 'card', clientType: 'returning', clientId: 'c010' },
      { date: '2026-04-20', amount: 100, service: 'Glutathione', category: 'Wellness', provider: 'Rina', paymentMethod: 'card', clientType: 'returning', clientId: 'c011' },
    ];
    const expenses: ExpenseEntry[] = [
      // Product (supplies / COGS)
      { date: '2026-04-01', amount: 4500, vendor: 'Allergan', description: 'Botox 400u restock' },
      { date: '2026-04-01', amount: 2800, vendor: 'Galderma', description: 'Restylane filler case' },
      { date: '2026-04-07', amount: 320, vendor: 'Medline', description: 'Nitrile gloves case' },
      // Equipment — careful: "lease" routes to rent, and "medical" routes
      // to supplies (substring match), so we name this vendor "Sofwave Inc"
      // and describe it as "device maintenance" to land it in equipment.
      { date: '2026-04-01', amount: 2500, vendor: 'Sofwave Inc', description: 'Monthly device maintenance' },
      // Rent
      { date: '2026-04-01', amount: 6500, vendor: 'Renton Landlord LLC', description: 'April rent 401 Olympia Ave' },
      // Marketing
      { date: '2026-04-03', amount: 3000, vendor: 'Meta', description: 'Meta Ads April spend' },
      { date: '2026-04-03', amount: 1500, vendor: 'Google', description: 'Google Ads April' },
      // Insurance
      { date: '2026-04-05', amount: 850, vendor: 'The Doctors Company', description: 'Malpractice premium' },
      // Software
      { date: '2026-04-02', amount: 299, vendor: 'Mangomint', description: 'Booking software subscription' },
      { date: '2026-04-02', amount: 85, vendor: 'Vercel', description: 'Hosting Pro plan' },
      { date: '2026-04-02', amount: 54, vendor: 'Airtable', description: 'Team subscription' },
      // Utilities
      { date: '2026-04-10', amount: 220, vendor: 'PSE', description: 'Electric bill' },
      { date: '2026-04-10', amount: 140, vendor: 'Comcast', description: 'Internet and wifi' },
      // Professional services
      { date: '2026-04-15', amount: 650, vendor: 'Smith CPA', description: 'Monthly accounting' },
      // Payroll
      { date: '2026-04-15', amount: 8500, vendor: 'Gusto', description: 'Bi-weekly payroll run' },
      { date: '2026-04-30', amount: 8500, vendor: 'Gusto', description: 'Bi-weekly payroll run' },
    ];
    return {
      revenue,
      expenses,
      period: { start: '2026-04-01', end: '2026-04-30' },
      memberships: { count: 25, monthlyRevenue: 4750 }, // 25 members × ~$190 avg
      previousPeriod: { revenue: 14_000, expenses: 35_000, netIncome: -21_000 },
      bankBalance: 75_000,
      monthlyFixedCosts: 18_000,
    };
  }

  it('revenue totals add up correctly', () => {
    const { pnl } = generateFinancialIntelligence(buildRealMonth());
    // Non-membership revenue entries: 3500+4500+2750+800+1200+900+1000+275+275+150+35+100 = 15485
    // (The 275 HydraFacial paid via membership is EXCLUDED from services.)
    expect(pnl.revenue.services).toBe(15_485);
    expect(pnl.revenue.memberships).toBe(4750);
    expect(pnl.revenue.total).toBe(20_235);
  });

  it('packages revenue is 0 (no package payments in mix)', () => {
    const { pnl } = generateFinancialIntelligence(buildRealMonth());
    expect(pnl.revenue.packages).toBe(0);
  });

  it('cost of services picks up supplies (7620) + payroll (17000)', () => {
    const { pnl } = generateFinancialIntelligence(buildRealMonth());
    expect(pnl.costOfServices.supplies).toBe(7620); // 4500+2800+320
    expect(pnl.costOfServices.providerCompensation).toBe(17_000); // 8500*2
    expect(pnl.costOfServices.total).toBe(24_620);
  });

  it('opex includes rent, marketing, insurance, equipment, software, utilities, professional_services', () => {
    const { pnl } = generateFinancialIntelligence(buildRealMonth());
    const cats = new Set(pnl.operatingExpenses.byCategory.map(c => c.category));
    expect(cats).toEqual(
      new Set(['rent', 'marketing', 'insurance', 'equipment', 'software', 'utilities', 'professional_services'])
    );
    // rent 6500 + marketing 4500 + insurance 850 + equipment 2500 +
    // software (299+85+54=438) + utilities (220+140=360) + profsvc 650 = 15798
    expect(pnl.operatingExpenses.total).toBe(15_798);
  });

  it('period comparison reflects dramatic MoM turnaround', () => {
    const { pnl } = generateFinancialIntelligence(buildRealMonth());
    // Revenue 20235 vs 14000 → +45%
    expect(pnl.periodComparison!.revenueChange).toBe(45);
    // Expenses (24620+15798=40418) vs 35000 → +15%
    expect(pnl.periodComparison!.expenseChange).toBe(15);
  });

  it('top service by profit is Sofwave (highest revenue, low cost ratio)', () => {
    const { serviceMargins } = generateFinancialIntelligence(buildRealMonth());
    expect(serviceMargins[0].service).toBe('Sofwave');
    expect(serviceMargins[0].rank).toBe(1);
  });

  it('Mom outranks Rina in provider revenue', () => {
    const { providerProfitability } = generateFinancialIntelligence(buildRealMonth());
    expect(providerProfitability[0].provider).toBe('Mom');
    expect(providerProfitability[1].provider).toBe('Rina');
  });

  it('financingAdoptionRate counts the two financing bookings', () => {
    const { kpis } = generateFinancialIntelligence(buildRealMonth());
    // 2 financing / 13 total = 15.38 → round 15
    expect(kpis.financingAdoptionRate).toBe(15);
  });

  it('cash flow projection uses real month totals as month-0 baseline', () => {
    const { pnl, cashFlowProjection } = generateFinancialIntelligence(buildRealMonth());
    const monthlyExp = pnl.costOfServices.total + pnl.operatingExpenses.total;
    expect(cashFlowProjection[0].projectedRevenue).toBe(pnl.revenue.total);
    expect(cashFlowProjection[0].projectedExpenses).toBe(monthlyExp);
  });

  it('insights array is populated', () => {
    const { insights } = generateFinancialIntelligence(buildRealMonth());
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some(i => /Top revenue generator/.test(i))).toBe(true);
  });

  it('returns all 7 result fields shaped correctly', () => {
    const result = generateFinancialIntelligence(buildRealMonth());
    expect(result).toHaveProperty('pnl');
    expect(result).toHaveProperty('serviceMargins');
    expect(result).toHaveProperty('providerProfitability');
    expect(result).toHaveProperty('cashFlowProjection');
    expect(result).toHaveProperty('healthScore');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('kpis');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 10. EDGE CASES
// ════════════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  it('zero revenue: grossMargin and netMargin both 0 (guarded)', () => {
    const input = makeInput({
      revenue: [],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 5000 })],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.revenue.total).toBe(0);
    expect(pnl.grossMargin).toBe(0);
    expect(pnl.netMargin).toBe(0);
    expect(pnl.netIncome).toBe(-5000);
  });

  it('zero-revenue category/provider percentages return 0 rather than NaN', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 0, category: 'Facial' })],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.revenue.byCategory[0].percentage).toBe(0);
    expect(pnl.revenue.byProvider[0].percentage).toBe(0);
  });

  it('all-expense month: negative net income and negative net margin', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 1000 })],
      expenses: [
        makeExpense({ vendor: 'Allergan', description: 'Botox', amount: 500 }),
        makeExpense({ vendor: 'Renton', description: 'Rent', amount: 8000 }),
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.netIncome).toBe(-7500);
    expect(pnl.netMargin).toBe(-750);
  });

  it('negative cash flow: runway reaches 0 and balance goes negative', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 1000 })],
      expenses: [makeExpense({ vendor: 'Renton', description: 'Rent', amount: 10_000 })],
      bankBalance: 5000,
    });
    const { cashFlowProjection } = generateFinancialIntelligence(input);
    // By month 1 or 2 balance should be negative
    const lastPositive = cashFlowProjection.find(p => p.projectedBalance < 0);
    expect(lastPositive).toBeDefined();
  });

  it('no expenses at all: cost of services is 0, gross margin = 100%', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 1000 })],
    });
    const { pnl } = generateFinancialIntelligence(input);
    expect(pnl.costOfServices.total).toBe(0);
    expect(pnl.grossProfit).toBe(1000);
    expect(pnl.grossMargin).toBe(100);
    expect(pnl.netIncome).toBe(1000);
  });

  it('pre-categorized expenses are respected, not re-classified', () => {
    const input = makeInput({
      revenue: [makeRevenue({ amount: 10_000 })],
      expenses: [
        // Vendor/desc looks like rent, but category is pre-set to marketing
        {
          date: '2026-04-01',
          amount: 5000,
          vendor: 'Renton Landlord',
          description: 'April rent',
          category: 'marketing' as ExpenseCategory,
        },
      ],
    });
    const { pnl } = generateFinancialIntelligence(input);
    const marketing = pnl.operatingExpenses.byCategory.find(c => c.category === 'marketing');
    expect(marketing?.amount).toBe(5000);
    const rent = pnl.operatingExpenses.byCategory.find(c => c.category === 'rent');
    expect(rent).toBeUndefined();
  });

  it('single-day period with single expense-free sale produces sensible output', () => {
    const input = makeInput({
      period: { start: '2026-04-10', end: '2026-04-10' },
      revenue: [makeRevenue({ amount: 275, date: '2026-04-10' })],
    });
    const result = generateFinancialIntelligence(input);
    expect(result.pnl.revenue.total).toBe(275);
    expect(result.kpis.avgDailyRevenue).toBe(275); // /1
    expect(result.serviceMargins).toHaveLength(1);
    expect(result.providerProfitability).toHaveLength(1);
  });

  it('empty input produces zero-filled output without throwing', () => {
    expect(() => generateFinancialIntelligence(makeInput())).not.toThrow();
    const result = generateFinancialIntelligence(makeInput());
    expect(result.pnl.revenue.total).toBe(0);
    expect(result.serviceMargins).toEqual([]);
    expect(result.providerProfitability).toEqual([]);
    expect(result.cashFlowProjection).toHaveLength(6);
  });
});
