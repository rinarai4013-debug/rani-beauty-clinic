// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateNPV,
  calculateIRR,
  calculateMonthlyPayment,
  analyzeEquipmentROI,
  analyzeServiceLaunch,
  analyzeStaffHiring,
  analyzeMarketingROI,
  analyzeLocationExpansion,
  analyzeLeaseVsBuy,
  type EquipmentInvestment,
  type ServiceLaunchModel,
  type StaffHiringModel,
  type MarketingChannelModel,
  type LocationExpansionModel,
  type LeaseVsBuyInput,
} from '../investment-analyzer';

// ── Helpers ──

function makeEquipment(overrides: Partial<EquipmentInvestment> = {}): EquipmentInvestment {
  return {
    name: 'Sofwave Device',
    cost: 150000,
    installationCost: 5000,
    trainingCost: 8000,
    monthlyMaintenance: 500,
    usefulLifeYears: 7,
    salvageValue: 15000,
    estimatedTreatmentsPerMonth: 25,
    revenuePerTreatment: 3000,
    costPerTreatment: 200,
    requiredStaffHoursPerTreatment: 1.5,
    staffCostPerHour: 50,
    ...overrides,
  };
}

function makeServiceLaunch(overrides: Partial<ServiceLaunchModel> = {}): ServiceLaunchModel {
  return {
    serviceName: 'CoolSculpting',
    equipmentCost: 80000,
    trainingCost: 5000,
    marketingLaunchBudget: 10000,
    monthlyMarketingBudget: 2000,
    pricePerSession: 800,
    costPerSession: 150,
    sessionsMonth1: 5,
    sessionsMonth3: 15,
    sessionsMonth6: 25,
    monthlyOverhead: 500,
    ...overrides,
  };
}

function makeStaffHiring(overrides: Partial<StaffHiringModel> = {}): StaffHiringModel {
  return {
    role: 'Injection Specialist',
    annualSalary: 85000,
    benefits: 12000,
    trainingCost: 5000,
    rampUpMonths: 3,
    expectedRevenuePerHour: 300,
    hoursPerWeek: 35,
    utilizationTarget: 0.75,
    ...overrides,
  };
}

function makeMarketingChannels(): MarketingChannelModel[] {
  return [
    { channel: 'Meta Ads', monthlySpend: 3000, leadsPerMonth: 60, conversionRate: 0.15, avgFirstVisitRevenue: 350, avgClientLTV: 4200, timeToFirstBooking: 7 },
    { channel: 'Google Ads', monthlySpend: 2000, leadsPerMonth: 40, conversionRate: 0.20, avgFirstVisitRevenue: 450, avgClientLTV: 5000, timeToFirstBooking: 5 },
    { channel: 'Referrals', monthlySpend: 200, leadsPerMonth: 10, conversionRate: 0.50, avgFirstVisitRevenue: 400, avgClientLTV: 6000, timeToFirstBooking: 3 },
  ];
}

function makeLocationExpansion(overrides: Partial<LocationExpansionModel> = {}): LocationExpansionModel {
  return {
    location: 'Bellevue, WA',
    buildOutCost: 150000,
    monthlyRent: 5000,
    monthlyUtilities: 500,
    staffCost: 15000,
    equipmentCost: 200000,
    marketingBudget: 3000,
    projectedRevenue: { month3: 20000, month6: 40000, month12: 65000, month24: 85000 },
    leaseTerm: 60,
    ...overrides,
  };
}

function makeLeaseVsBuy(overrides: Partial<LeaseVsBuyInput> = {}): LeaseVsBuyInput {
  return {
    assetName: 'Laser Device',
    purchasePrice: 80000,
    leaseMonthlyCost: 2200,
    leaseTermMonths: 48,
    leaseBuyoutPrice: 5000,
    maintenanceIfOwned: 3000,
    maintenanceIfLeased: 0,
    usefulLifeYears: 7,
    salvageValue: 10000,
    taxRate: 0.24,
    discountRate: 0.08,
    ...overrides,
  };
}

// ── NPV ──

describe('calculateNPV', () => {
  it('returns present value of zero for no cash flows', () => {
    expect(calculateNPV([], 0.1)).toBe(0);
  });

  it('returns undiscounted sum at 0% rate', () => {
    expect(calculateNPV([-100, 50, 60], 0)).toBe(10);
  });

  it('discounts future cash flows', () => {
    const npv = calculateNPV([-1000, 600, 600], 0.1);
    expect(npv).toBeLessThan(200); // less than undiscounted sum
    expect(npv).toBeGreaterThan(0);
  });

  it('negative NPV for bad investment', () => {
    const npv = calculateNPV([-10000, 100, 100, 100, 100], 0.1);
    expect(npv).toBeLessThan(0);
  });

  it('handles single cash flow', () => {
    expect(calculateNPV([1000], 0.1)).toBe(1000);
  });
});

// ── IRR ──

describe('calculateIRR', () => {
  it('returns ~0 for breakeven investment', () => {
    const irr = calculateIRR([-100, 100]);
    expect(irr).toBeCloseTo(0, 1);
  });

  it('returns positive for profitable investment', () => {
    const irr = calculateIRR([-1000, 400, 400, 400]);
    expect(irr).toBeGreaterThan(0);
  });

  it('handles single cash flow', () => {
    const irr = calculateIRR([100]);
    expect(typeof irr).toBe('number');
  });

  it('returns meaningful rate for standard investment', () => {
    const irr = calculateIRR([-10000, 3000, 3000, 3000, 3000, 3000]);
    expect(irr).toBeGreaterThan(0.1);
    expect(irr).toBeLessThan(0.5);
  });
});

// ── Monthly Payment ──

describe('calculateMonthlyPayment', () => {
  it('divides evenly at 0% rate', () => {
    expect(calculateMonthlyPayment(12000, 0, 12)).toBeCloseTo(1000, 0);
  });

  it('payment increases with interest', () => {
    const noInterest = calculateMonthlyPayment(100000, 0, 60);
    const withInterest = calculateMonthlyPayment(100000, 0.08, 60);
    expect(withInterest).toBeGreaterThan(noInterest);
  });

  it('shorter term = higher payment', () => {
    const long = calculateMonthlyPayment(100000, 0.08, 60);
    const short = calculateMonthlyPayment(100000, 0.08, 36);
    expect(short).toBeGreaterThan(long);
  });

  it('calculates standard mortgage-style payment', () => {
    const payment = calculateMonthlyPayment(150000, 0.06, 60);
    expect(payment).toBeGreaterThan(2800);
    expect(payment).toBeLessThan(3100);
  });
});

// ── Equipment ROI ──

describe('analyzeEquipmentROI', () => {
  it('returns complete result', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r).toHaveProperty('totalInvestment');
    expect(r).toHaveProperty('monthlyRevenue');
    expect(r).toHaveProperty('monthlyProfit');
    expect(r).toHaveProperty('annualROI');
    expect(r).toHaveProperty('paybackMonths');
    expect(r).toHaveProperty('fiveYearNPV');
    expect(r).toHaveProperty('irr');
    expect(r).toHaveProperty('breakEvenTreatments');
    expect(r).toHaveProperty('monthlyBreakdown');
    expect(r).toHaveProperty('recommendation');
  });

  it('calculates positive ROI for profitable equipment', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.annualROI).toBeGreaterThan(0);
    expect(r.monthlyProfit).toBeGreaterThan(0);
  });

  it('calculates payback period', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.paybackMonths).toBeGreaterThan(0);
    expect(r.paybackMonths).toBeLessThan(60);
  });

  it('monthly breakdown shows 60 months', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.monthlyBreakdown).toHaveLength(60);
  });

  it('cumulative profit starts negative', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.monthlyBreakdown[0].cumulativeProfit).toBeLessThan(0);
  });

  it('generates financing analysis when rate provided', () => {
    const r = analyzeEquipmentROI(makeEquipment({ financingRate: 0.08, financingTermMonths: 60 }));
    expect(r.financing).toBeDefined();
    expect(r.financing!.monthlyPayment).toBeGreaterThan(0);
    expect(r.financing!.totalInterest).toBeGreaterThan(0);
  });

  it('no financing without rate', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.financing).toBeUndefined();
  });

  it('provides recommendation', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('handles unprofitable equipment', () => {
    const r = analyzeEquipmentROI(makeEquipment({
      revenuePerTreatment: 50,
      costPerTreatment: 100,
      estimatedTreatmentsPerMonth: 5,
    }));
    expect(r.annualROI).toBeLessThan(0);
    expect(r.paybackMonths).toBe(-1);
  });

  it('calculates NPV and IRR', () => {
    const r = analyzeEquipmentROI(makeEquipment());
    expect(r.fiveYearNPV).toBeGreaterThan(0);
    expect(r.irr).toBeGreaterThan(0);
  });
});

// ── Service Launch ──

describe('analyzeServiceLaunch', () => {
  it('returns complete result', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r).toHaveProperty('totalUpfrontCost');
    expect(r).toHaveProperty('breakEvenMonth');
    expect(r).toHaveProperty('yearOneRevenue');
    expect(r).toHaveProperty('yearOneProfit');
    expect(r).toHaveProperty('yearOneROI');
    expect(r).toHaveProperty('monthlyProjections');
    expect(r).toHaveProperty('riskFactors');
    expect(r).toHaveProperty('recommendation');
  });

  it('upfront cost is sum of equipment + training + launch marketing', () => {
    const m = makeServiceLaunch();
    const r = analyzeServiceLaunch(m);
    expect(r.totalUpfrontCost).toBe(m.equipmentCost + m.trainingCost + m.marketingLaunchBudget);
  });

  it('shows ramp-up in projections', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r.monthlyProjections[0].revenue).toBeLessThan(r.monthlyProjections[5].revenue);
  });

  it('24-month projections', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r.monthlyProjections).toHaveLength(24);
  });

  it('identifies risk factors for low initial volume', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch({ sessionsMonth1: 2 }));
    expect(r.riskFactors.some(f => f.includes('Low initial volume'))).toBe(true);
  });

  it('calculates break-even sessions', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r.breakEvenSessions).toBeGreaterThan(0);
  });

  it('calculates steady-state profit', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r.steadyStateMonthlyProfit).toBeGreaterThan(0);
  });

  it('provides recommendation', () => {
    const r = analyzeServiceLaunch(makeServiceLaunch());
    expect(r.recommendation.length).toBeGreaterThan(0);
  });
});

// ── Staff Hiring ──

describe('analyzeStaffHiring', () => {
  it('returns complete result', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    expect(r).toHaveProperty('totalHiringCost');
    expect(r).toHaveProperty('annualFullCost');
    expect(r).toHaveProperty('expectedAnnualRevenue');
    expect(r).toHaveProperty('expectedAnnualProfit');
    expect(r).toHaveProperty('roi');
    expect(r).toHaveProperty('paybackMonths');
    expect(r).toHaveProperty('utilizationSensitivity');
    expect(r).toHaveProperty('recommendation');
  });

  it('positive ROI for productive provider', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    expect(r.roi).toBeGreaterThan(0);
    expect(r.expectedAnnualRevenue).toBeGreaterThan(r.annualFullCost);
  });

  it('calculates cost per hour', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    expect(r.costPerHour).toBeGreaterThan(0);
    expect(r.profitPerHour).toBe(r.revenuePerHour - r.costPerHour);
  });

  it('utilization sensitivity has 6 levels', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    expect(r.utilizationSensitivity).toHaveLength(6);
  });

  it('higher utilization = higher profit', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    const low = r.utilizationSensitivity[0];
    const high = r.utilizationSensitivity[5];
    expect(high.annualProfit).toBeGreaterThan(low.annualProfit);
  });

  it('handles negative ROI (expensive, low revenue)', () => {
    const r = analyzeStaffHiring(makeStaffHiring({
      annualSalary: 200000,
      expectedRevenuePerHour: 50,
      hoursPerWeek: 20,
    }));
    expect(r.roi).toBeLessThan(0);
  });

  it('provides recommendation', () => {
    const r = analyzeStaffHiring(makeStaffHiring());
    expect(r.recommendation.length).toBeGreaterThan(0);
  });
});

// ── Marketing ROI ──

describe('analyzeMarketingROI', () => {
  it('returns analysis for each channel', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    expect(r.channels).toHaveLength(3);
  });

  it('identifies best and worst channels', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    expect(r.bestChannel.length).toBeGreaterThan(0);
    expect(r.worstChannel.length).toBeGreaterThan(0);
  });

  it('calculates CAC per channel', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    for (const c of r.channels) {
      if (c.monthlyClients > 0) {
        expect(c.cac).toBeGreaterThan(0);
      }
    }
  });

  it('calculates LTV:CAC ratio', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    for (const c of r.channels) {
      if (c.cac > 0) {
        expect(c.ltvCacRatio).toBeGreaterThan(0);
      }
    }
  });

  it('generates optimal allocation', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    expect(r.optimalAllocation).toHaveLength(3);
    const totalSuggested = r.optimalAllocation.reduce((s, a) => s + a.suggestedSpend, 0);
    expect(totalSuggested).toBeCloseTo(r.totalMonthlyBudget, -1);
  });

  it('provides recommendation per channel', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    for (const c of r.channels) {
      expect(c.recommendation.length).toBeGreaterThan(0);
    }
  });

  it('calculates blended ROI', () => {
    const r = analyzeMarketingROI(makeMarketingChannels());
    expect(typeof r.blendedROI).toBe('number');
  });
});

// ── Location Expansion ──

describe('analyzeLocationExpansion', () => {
  it('returns complete result', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(r).toHaveProperty('totalUpfrontCost');
    expect(r).toHaveProperty('breakEvenMonth');
    expect(r).toHaveProperty('yearOneProfit');
    expect(r).toHaveProperty('yearTwoProfit');
    expect(r).toHaveProperty('fiveYearNPV');
    expect(r).toHaveProperty('monthlyProjections');
    expect(r).toHaveProperty('riskFactors');
    expect(r).toHaveProperty('recommendation');
  });

  it('60 months of projections', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(r.monthlyProjections).toHaveLength(60);
  });

  it('revenue ramps over time', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(r.monthlyProjections[11].revenue).toBeGreaterThan(r.monthlyProjections[0].revenue);
  });

  it('identifies risk factors', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(Array.isArray(r.riskFactors)).toBe(true);
  });

  it('calculates 5-year NPV', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(typeof r.fiveYearNPV).toBe('number');
  });

  it('provides recommendation', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('year 2 profit higher than year 1', () => {
    const r = analyzeLocationExpansion(makeLocationExpansion());
    expect(r.yearTwoProfit).toBeGreaterThan(r.yearOneProfit);
  });
});

// ── Lease vs Buy ──

describe('analyzeLeaseVsBuy', () => {
  it('returns complete comparison', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy());
    expect(r).toHaveProperty('leaseTotal');
    expect(r).toHaveProperty('buyTotal');
    expect(r).toHaveProperty('leasePV');
    expect(r).toHaveProperty('buyPV');
    expect(r).toHaveProperty('savings');
    expect(r).toHaveProperty('recommendation');
    expect(r).toHaveProperty('reasoning');
    expect(r).toHaveProperty('comparison');
  });

  it('recommendation is lease or buy', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy());
    expect(['lease', 'buy']).toContain(r.recommendation);
  });

  it('savings positive means buy is cheaper', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy());
    if (r.recommendation === 'buy') {
      expect(r.savings).toBeGreaterThan(0);
    } else {
      expect(r.savings).toBeLessThanOrEqual(0);
    }
  });

  it('comparison table has multiple factors', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy());
    expect(r.comparison.length).toBeGreaterThanOrEqual(5);
  });

  it('high monthly lease favors buying', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy({ leaseMonthlyCost: 5000 }));
    expect(r.recommendation).toBe('buy');
  });

  it('low purchase price favors buying', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy({ purchasePrice: 10000, leaseMonthlyCost: 500 }));
    expect(r.recommendation).toBe('buy');
  });

  it('provides reasoning', () => {
    const r = analyzeLeaseVsBuy(makeLeaseVsBuy());
    expect(r.reasoning.length).toBeGreaterThan(0);
    expect(r.reasoning.includes('$')).toBe(true);
  });

  it('lease total includes payments + maintenance + buyout', () => {
    const input = makeLeaseVsBuy();
    const r = analyzeLeaseVsBuy(input);
    const expectedLease = (input.leaseMonthlyCost * input.leaseTermMonths) +
      (input.maintenanceIfLeased / 12 * input.leaseTermMonths) +
      input.leaseBuyoutPrice;
    expect(r.leaseTotal).toBeCloseTo(expectedLease, -1);
  });
});
