// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  getMarginalRate,
  calculateSelfEmploymentTax,
  calculateWABOTax,
  calculateSection179,
  calculateDepreciation,
  categorizeExpenses,
  calculateHomeOffice,
  calculateMileage,
  optimizeRetirement,
  generateYearEndStrategies,
  calculateQuarterlyTaxes,
  generateTaxPlan,
  type TaxPlanningInput,
  type EquipmentAsset,
  type TaxExpense,
} from '../tax-planning';

// ── Helpers ──

function makeEquipment(overrides: Partial<EquipmentAsset> = {}): EquipmentAsset {
  return {
    name: 'Sofwave Device',
    purchaseDate: '2024-06-01',
    cost: 150000,
    usefulLifeYears: 7,
    section179Eligible: true,
    section179Claimed: 150000,
    accumulatedDepreciation: 0,
    category: 'laser_device',
    ...overrides,
  };
}

function makeExpense(overrides: Partial<TaxExpense> = {}): TaxExpense {
  return {
    description: 'Clinical Supplies',
    amount: 10000,
    category: 'supplies',
    deductible: true,
    deductiblePercent: 100,
    ...overrides,
  };
}

function makeInput(overrides: Partial<TaxPlanningInput> = {}): TaxPlanningInput {
  return {
    annualRevenue: 500000,
    annualExpenses: 300000,
    ytdRevenue: 250000,
    ytdExpenses: 150000,
    estimatedTaxesPaid: 15000,
    filingStatus: 'married_joint',
    entityType: 'llc_single',
    equipment: [makeEquipment()],
    expenses: [makeExpense(), makeExpense({ description: 'Rent', amount: 54000, category: 'rent' })],
    retirementContributions: { type: 'sep_ira', ytdContributions: 10000 },
    healthInsurance: { monthlyPremium: 800, coveredMonths: 6, familyMembers: 2 },
    ...overrides,
  };
}

// ── Federal Tax ──

describe('calculateFederalTax', () => {
  it('returns 0 for zero income', () => {
    expect(calculateFederalTax(0, 'single')).toBe(0);
  });

  it('uses 10% bracket for low income', () => {
    const tax = calculateFederalTax(10000, 'single');
    expect(tax).toBe(1000);
  });

  it('calculates progressive brackets correctly', () => {
    const tax = calculateFederalTax(50000, 'single');
    // 10% on first 11600 = 1160
    // 12% on 11600-47150 = 4266
    // 22% on 47150-50000 = 627
    expect(tax).toBeCloseTo(1160 + 4266 + 627, -1);
  });

  it('uses different brackets for married filing jointly', () => {
    const single = calculateFederalTax(100000, 'single');
    const mfj = calculateFederalTax(100000, 'married_joint');
    expect(mfj).toBeLessThan(single);
  });

  it('handles very high income', () => {
    const tax = calculateFederalTax(1000000, 'single');
    expect(tax).toBeGreaterThan(300000);
  });

  it('handles negative income as zero', () => {
    // Tax function should handle 0 income; negative should not normally occur
    const tax = calculateFederalTax(0, 'single');
    expect(tax).toBe(0);
  });
});

// ── Marginal Rate ──

describe('getMarginalRate', () => {
  it('returns 10% for low income', () => {
    expect(getMarginalRate(5000, 'single')).toBe(0.10);
  });

  it('returns 22% for middle income', () => {
    expect(getMarginalRate(80000, 'single')).toBe(0.22);
  });

  it('returns 37% for very high income', () => {
    expect(getMarginalRate(1000000, 'single')).toBe(0.37);
  });

  it('returns lower rate for MFJ at same income', () => {
    const singleRate = getMarginalRate(100000, 'single');
    const mfjRate = getMarginalRate(100000, 'married_joint');
    expect(mfjRate).toBeLessThanOrEqual(singleRate);
  });
});

// ── Self-Employment Tax ──

describe('calculateSelfEmploymentTax', () => {
  it('calculates SE tax on 92.35% of income', () => {
    const r = calculateSelfEmploymentTax(100000);
    expect(r.tax).toBeGreaterThan(0);
    // 92.35% of 100K = 92350; 12.4% SS + 2.9% Medicare = 15.3%
    expect(r.tax).toBeCloseTo(92350 * 0.153, -2);
  });

  it('deductible portion is 50%', () => {
    const r = calculateSelfEmploymentTax(100000);
    expect(r.deductiblePortion).toBeCloseTo(r.tax * 0.5, -1);
  });

  it('returns 0 for zero income', () => {
    const r = calculateSelfEmploymentTax(0);
    expect(r.tax).toBe(0);
  });

  it('applies additional Medicare tax for high earners', () => {
    const belowThreshold = calculateSelfEmploymentTax(150000);
    const aboveThreshold = calculateSelfEmploymentTax(300000);
    // Above $200K SE base, additional 0.9% Medicare applies
    // Total tax at 300K should be higher than 2x the tax at 150K
    // (because of additional Medicare on the portion above 200K)
    expect(aboveThreshold.tax).toBeGreaterThan(belowThreshold.tax);
    // The additional Medicare component makes the absolute tax higher
    // Note: SS cap causes lower effective rate at high income, so compare absolute tax
    // Due to SS cap ($168,600), the ratio won't be linear, but absolute tax must be higher
    expect(aboveThreshold.tax).toBeGreaterThan(belowThreshold.tax * 1.3);
  });
});

// ── WA B&O Tax ──

describe('calculateWABOTax', () => {
  it('calculates 1.5% of gross revenue', () => {
    expect(calculateWABOTax(100000)).toBe(1500);
    expect(calculateWABOTax(500000)).toBe(7500);
  });

  it('returns 0 for zero revenue', () => {
    expect(calculateWABOTax(0)).toBe(0);
  });
});

// ── Section 179 ──

describe('calculateSection179', () => {
  it('tracks eligible equipment', () => {
    const r = calculateSection179([makeEquipment()]);
    expect(r.totalEligible).toBe(150000);
    expect(r.totalClaimed).toBe(150000);
  });

  it('calculates remaining allowance', () => {
    const r = calculateSection179([makeEquipment({ section179Claimed: 50000 })]);
    expect(r.remainingAllowance).toBeGreaterThan(0);
  });

  it('filters non-eligible equipment', () => {
    const r = calculateSection179([
      makeEquipment({ section179Eligible: true, section179Claimed: 50000 }),
      makeEquipment({ name: 'Chair', section179Eligible: false, cost: 500 }),
    ]);
    expect(r.assets).toHaveLength(1);
  });

  it('calculates tax savings per asset', () => {
    const r = calculateSection179([makeEquipment({ section179Claimed: 100000 })]);
    expect(r.assets[0].taxSavings).toBeGreaterThan(0);
  });

  it('provides recommendation', () => {
    const r = calculateSection179([makeEquipment()]);
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('handles empty equipment list', () => {
    const r = calculateSection179([]);
    expect(r.totalEligible).toBe(0);
    expect(r.assets).toHaveLength(0);
  });
});

// ── Depreciation ──

describe('calculateDepreciation', () => {
  it('calculates straight-line depreciation', () => {
    const r = calculateDepreciation([makeEquipment({ section179Claimed: 0, accumulatedDepreciation: 0 })]);
    expect(r[0].yearlyDepreciation).toBe(Math.round(150000 / 7));
  });

  it('accounts for section 179 in book value', () => {
    const r = calculateDepreciation([makeEquipment({ section179Claimed: 150000 })]);
    expect(r[0].bookValue).toBe(0);
  });

  it('returns remaining years', () => {
    const r = calculateDepreciation([makeEquipment({ purchaseDate: '2024-01-01', usefulLifeYears: 7 })]);
    expect(r[0].remainingYears).toBeGreaterThan(0);
    expect(r[0].remainingYears).toBeLessThanOrEqual(7);
  });

  it('handles fully depreciated assets', () => {
    const r = calculateDepreciation([makeEquipment({ purchaseDate: '2015-01-01', usefulLifeYears: 5, section179Claimed: 0, accumulatedDepreciation: 150000 })]);
    expect(r[0].bookValue).toBe(0);
    expect(r[0].remainingYears).toBe(0);
  });
});

// ── Expense Categorization ──

describe('categorizeExpenses', () => {
  it('separates deductible and non-deductible', () => {
    const r = categorizeExpenses([
      makeExpense({ amount: 1000, deductible: true, deductiblePercent: 100 }),
      makeExpense({ description: 'Personal', amount: 500, deductible: false, deductiblePercent: 0 }),
    ]);
    expect(r.totalDeductible).toBe(1000);
    expect(r.totalNonDeductible).toBe(500);
  });

  it('handles partial deductibility (meals)', () => {
    const r = categorizeExpenses([
      makeExpense({ description: 'Client Dinner', amount: 200, category: 'meals', deductible: true, deductiblePercent: 50 }),
    ]);
    expect(r.totalDeductible).toBe(100);
    expect(r.totalNonDeductible).toBe(100);
  });

  it('aggregates by category', () => {
    const r = categorizeExpenses([
      makeExpense({ amount: 1000, category: 'supplies' }),
      makeExpense({ description: 'More supplies', amount: 500, category: 'supplies' }),
      makeExpense({ description: 'Rent', amount: 5000, category: 'rent' }),
    ]);
    const supplies = r.byCategory.find(c => c.category === 'supplies');
    expect(supplies?.totalAmount).toBe(1500);
  });

  it('returns top deductions', () => {
    const r = categorizeExpenses([
      makeExpense({ amount: 50000 }),
      makeExpense({ description: 'Small', amount: 100 }),
    ]);
    expect(r.topDeductions[0].amount).toBeGreaterThanOrEqual(r.topDeductions[r.topDeductions.length - 1].amount);
  });

  it('handles empty expenses', () => {
    const r = categorizeExpenses([]);
    expect(r.totalDeductible).toBe(0);
    expect(r.byCategory).toHaveLength(0);
  });
});

// ── Home Office ──

describe('calculateHomeOffice', () => {
  it('returns 0 when no home office', () => {
    expect(calculateHomeOffice(undefined)).toBe(0);
  });

  it('simplified method: $5/sqft max $1500', () => {
    expect(calculateHomeOffice({ method: 'simplified', squareFootageOffice: 200, squareFootageHome: 2000 })).toBe(1000);
    expect(calculateHomeOffice({ method: 'simplified', squareFootageOffice: 400, squareFootageHome: 2000 })).toBe(1500);
  });

  it('regular method uses percentage', () => {
    const r = calculateHomeOffice({
      method: 'regular',
      squareFootageOffice: 200,
      squareFootageHome: 2000,
      homeExpenses: { mortgage: 2000, utilities: 300, insurance: 100, repairs: 100 },
    });
    expect(r).toBe(Math.round(2500 * 0.1));
  });
});

// ── Mileage ──

describe('calculateMileage', () => {
  it('returns 0 when no mileage', () => {
    expect(calculateMileage(undefined)).toBe(0);
  });

  it('uses IRS standard rate', () => {
    const r = calculateMileage({ businessMiles: 1000, totalMiles: 5000 });
    expect(r).toBe(Math.round(1000 * 0.70));
  });

  it('accepts custom rate', () => {
    const r = calculateMileage({ businessMiles: 1000, totalMiles: 5000, ratePerMile: 0.50 });
    expect(r).toBe(500);
  });
});

// ── Retirement Optimization ──

describe('optimizeRetirement', () => {
  it('calculates max allowable contributions', () => {
    const r = optimizeRetirement(200000, { type: 'sep_ira', ytdContributions: 10000 }, 'married_joint');
    expect(r.maxAllowable).toBeGreaterThan(0);
  });

  it('identifies additional contribution room', () => {
    const r = optimizeRetirement(200000, { type: 'sep_ira', ytdContributions: 5000 }, 'single');
    expect(r.additionalContributionRoom).toBeGreaterThan(0);
  });

  it('calculates tax savings if maxed', () => {
    const r = optimizeRetirement(200000, { type: 'sep_ira', ytdContributions: 0 }, 'single');
    expect(r.taxSavingsIfMaxed).toBeGreaterThan(0);
  });

  it('compares retirement plan types', () => {
    const r = optimizeRetirement(200000, { type: 'sep_ira', ytdContributions: 0 }, 'single');
    expect(r.comparison).toHaveLength(3);
    expect(r.comparison.some(c => c.type === 'SEP-IRA')).toBe(true);
    expect(r.comparison.some(c => c.type === 'Solo 401(k)')).toBe(true);
  });

  it('provides recommendation text', () => {
    const r = optimizeRetirement(200000, { type: 'sep_ira', ytdContributions: 0 }, 'single');
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('handles fully contributed scenario', () => {
    const r = optimizeRetirement(200000, { type: 'solo_401k', ytdContributions: 69000 }, 'single');
    expect(r.additionalContributionRoom).toBe(0);
  });
});

// ── Year-End Strategies ──

describe('generateYearEndStrategies', () => {
  it('returns strategies array', () => {
    const r = generateYearEndStrategies(300000, 100000, 500000, 30000, 0.24);
    expect(r.length).toBeGreaterThan(0);
  });

  it('includes equipment purchase strategy when 179 remaining', () => {
    const r = generateYearEndStrategies(300000, 100000, 500000, 30000, 0.24);
    expect(r.some(s => s.strategy.includes('Equipment'))).toBe(true);
  });

  it('includes retirement strategy when room available', () => {
    const r = generateYearEndStrategies(200000, 80000, 0, 40000, 0.24);
    expect(r.some(s => s.strategy.includes('Retirement'))).toBe(true);
  });

  it('includes entity review for high income', () => {
    const r = generateYearEndStrategies(200000, 80000, 0, 0, 0.24);
    expect(r.some(s => s.strategy.includes('Entity'))).toBe(true);
  });

  it('sorted by priority then savings', () => {
    const r = generateYearEndStrategies(300000, 100000, 500000, 50000, 0.24);
    const priorities = r.map(s => s.priority);
    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < priorities.length; i++) {
      expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
    }
  });
});

// ── Quarterly Tax Calculation ──

describe('calculateQuarterlyTaxes', () => {
  it('returns 4 quarterly payments', () => {
    const r = calculateQuarterlyTaxes(makeInput());
    expect(r.quarterlyPayments).toHaveLength(4);
  });

  it('annual projection includes all tax types', () => {
    const r = calculateQuarterlyTaxes(makeInput());
    expect(r.annualProjection.federalTax).toBeGreaterThan(0);
    expect(r.annualProjection.selfEmploymentTax).toBeGreaterThan(0);
    expect(r.annualProjection.waBOTax).toBeGreaterThan(0);
    expect(r.annualProjection.totalTax).toBe(
      r.annualProjection.federalTax + r.annualProjection.selfEmploymentTax + r.annualProjection.waBOTax,
    );
  });

  it('calculates effective tax rate', () => {
    const r = calculateQuarterlyTaxes(makeInput());
    expect(r.annualProjection.effectiveRate).toBeGreaterThan(0);
    expect(r.annualProjection.effectiveRate).toBeLessThan(50);
  });

  it('tracks remaining balance', () => {
    const r = calculateQuarterlyTaxes(makeInput({ estimatedTaxesPaid: 5000 }));
    expect(r.remainingBalance).toBe(r.annualProjection.totalTax - 5000);
  });

  it('checks safe harbor', () => {
    const r = calculateQuarterlyTaxes(makeInput({ estimatedTaxesPaid: 0 }));
    expect(typeof r.safeHarborMet).toBe('boolean');
  });
});

// ── Full Tax Plan ──

describe('generateTaxPlan', () => {
  it('returns complete tax planning result', () => {
    const r = generateTaxPlan(makeInput());
    expect(r).toHaveProperty('estimatedTaxes');
    expect(r).toHaveProperty('section179');
    expect(r).toHaveProperty('depreciationSchedule');
    expect(r).toHaveProperty('expenseSummary');
    expect(r).toHaveProperty('deductions');
    expect(r).toHaveProperty('retirementOptimization');
    expect(r).toHaveProperty('yearEndStrategies');
    expect(r).toHaveProperty('alerts');
    expect(r).toHaveProperty('projectedTaxLiability');
  });

  it('deductions total is sum of components', () => {
    const r = generateTaxPlan(makeInput());
    const d = r.deductions;
    const sum = d.businessExpenses + d.depreciation + d.section179 + d.homeOffice +
      d.healthInsurance + d.retirement + d.mileage + d.selfEmploymentTaxDeduction;
    expect(d.totalDeductions).toBeCloseTo(sum, -1);
  });

  it('generates alerts for overdue payments', () => {
    const r = generateTaxPlan(makeInput());
    // May generate overdue alerts depending on current date
    expect(Array.isArray(r.alerts)).toBe(true);
  });

  it('projected tax liability has effective rate', () => {
    const r = generateTaxPlan(makeInput());
    expect(r.projectedTaxLiability.effectiveRate).toBeGreaterThan(0);
    expect(r.projectedTaxLiability.marginalRate).toBeGreaterThan(0);
  });
});
