/**
 * Tax Planning & Optimization Engine
 *
 * Quarterly estimated taxes, Section 179 depreciation, expense categorization,
 * retirement planning, and year-end strategies for Rani Beauty Clinic.
 *
 * Location: Renton, WA — no state income tax, WA B&O tax applies.
 */

// ── TYPES ──

export interface TaxPlanningInput {
  annualRevenue: number;
  annualExpenses: number;
  ytdRevenue: number;
  ytdExpenses: number;
  estimatedTaxesPaid: number; // YTD quarterly payments made
  filingStatus: FilingStatus;
  entityType: EntityType;
  equipment: EquipmentAsset[];
  expenses: TaxExpense[];
  retirementContributions: RetirementContribution;
  healthInsurance: HealthInsuranceDeduction;
  homeOffice?: HomeOfficeDeduction;
  mileage?: MileageDeduction;
  previousYearTax?: number;
  dependents?: number;
}

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
export type EntityType = 'sole_prop' | 'llc_single' | 'llc_multi' | 's_corp' | 'c_corp';

export interface EquipmentAsset {
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLifeYears: number;
  section179Eligible: boolean;
  section179Claimed?: number;
  accumulatedDepreciation?: number;
  category: EquipmentCategory;
}

export type EquipmentCategory =
  | 'laser_device'
  | 'injection_equipment'
  | 'skincare_device'
  | 'computer_equipment'
  | 'furniture'
  | 'vehicle'
  | 'building_improvement'
  | 'other';

export interface TaxExpense {
  description: string;
  amount: number;
  category: TaxExpenseCategory;
  deductible: boolean;
  deductiblePercent: number; // 0-100
  notes?: string;
}

export type TaxExpenseCategory =
  | 'supplies'
  | 'rent'
  | 'utilities'
  | 'insurance'
  | 'marketing'
  | 'professional_fees'
  | 'training_education'
  | 'travel'
  | 'meals'
  | 'office_supplies'
  | 'software'
  | 'payroll'
  | 'vehicle'
  | 'depreciation'
  | 'interest'
  | 'taxes_licenses'
  | 'repairs_maintenance'
  | 'other';

export interface RetirementContribution {
  type: 'sep_ira' | 'solo_401k' | 'simple_ira' | 'none';
  ytdContributions: number;
  employerMatch?: number;
}

export interface HealthInsuranceDeduction {
  monthlyPremium: number;
  coveredMonths: number;
  familyMembers: number;
}

export interface HomeOfficeDeduction {
  method: 'simplified' | 'regular';
  squareFootageOffice: number;
  squareFootageHome: number;
  homeExpenses?: {
    mortgage: number;
    utilities: number;
    insurance: number;
    repairs: number;
  };
}

export interface MileageDeduction {
  businessMiles: number;
  ratePerMile?: number; // defaults to IRS standard
  totalMiles: number;
}

// ── OUTPUT TYPES ──

export interface TaxPlanningResult {
  estimatedTaxes: QuarterlyTaxEstimate;
  section179: Section179Summary;
  depreciationSchedule: DepreciationEntry[];
  expenseSummary: ExpenseCategorySummary;
  deductions: DeductionSummary;
  retirementOptimization: RetirementOptimization;
  yearEndStrategies: YearEndStrategy[];
  alerts: TaxAlert[];
  projectedTaxLiability: ProjectedTaxLiability;
}

export interface QuarterlyTaxEstimate {
  annualProjection: {
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    federalTax: number;
    selfEmploymentTax: number;
    waBOTax: number;
    totalTax: number;
    effectiveRate: number;
  };
  quarterlyPayments: QuarterlyPayment[];
  ytdPaid: number;
  remainingBalance: number;
  safeHarborMet: boolean;
}

export interface QuarterlyPayment {
  quarter: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  status: 'paid' | 'due' | 'upcoming' | 'overdue';
}

export interface Section179Summary {
  totalEligible: number;
  totalClaimed: number;
  remainingAllowance: number;
  assets: {
    name: string;
    cost: number;
    section179Amount: number;
    regularDepreciation: number;
    taxSavings: number;
  }[];
  recommendation: string;
}

export interface DepreciationEntry {
  assetName: string;
  originalCost: number;
  method: 'straight_line' | 'macrs' | 'section_179';
  yearlyDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  remainingYears: number;
}

export interface ExpenseCategorySummary {
  totalDeductible: number;
  totalNonDeductible: number;
  byCategory: {
    category: TaxExpenseCategory;
    totalAmount: number;
    deductibleAmount: number;
    nonDeductibleAmount: number;
    count: number;
  }[];
  topDeductions: { description: string; amount: number; category: TaxExpenseCategory }[];
}

export interface DeductionSummary {
  businessExpenses: number;
  depreciation: number;
  section179: number;
  homeOffice: number;
  healthInsurance: number;
  retirement: number;
  mileage: number;
  selfEmploymentTaxDeduction: number;
  totalDeductions: number;
}

export interface RetirementOptimization {
  currentContribution: number;
  maxAllowable: number;
  additionalContributionRoom: number;
  taxSavingsIfMaxed: number;
  recommendedType: 'sep_ira' | 'solo_401k' | 'simple_ira';
  recommendation: string;
  comparison: {
    type: string;
    maxContribution: number;
    taxSavings: number;
    notes: string;
  }[];
}

export interface YearEndStrategy {
  strategy: string;
  description: string;
  estimatedSavings: number;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  actionItems: string[];
}

export interface TaxAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actionRequired: string;
  deadline?: string;
}

export interface ProjectedTaxLiability {
  federal: number;
  selfEmployment: number;
  waBOTax: number;
  total: number;
  effectiveRate: number;
  marginalRate: number;
}

// ── TAX CONSTANTS (2026 estimates) ──

const FEDERAL_BRACKETS_SINGLE_2026 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const FEDERAL_BRACKETS_MFJ_2026 = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION_2026 = {
  single: 15000,
  married_joint: 30000,
  married_separate: 15000,
  head_of_household: 22500,
};

const SE_TAX_RATE = 0.153; // Social Security (12.4%) + Medicare (2.9%)
const SE_TAX_DEDUCTION = 0.5; // 50% of SE tax is deductible

const WA_BO_TAX_RATE = 0.015; // WA B&O tax: 1.5% of gross receipts for service businesses
const SECTION_179_LIMIT_2026 = 1220000; // Annual Section 179 limit
const IRS_MILEAGE_RATE_2026 = 0.70; // cents per mile

// ── QUARTERLY TAX DEADLINES ──

const QUARTERLY_DEADLINES = [
  { quarter: 1, dueDate: '2026-04-15', periodEnd: '2026-03-31' },
  { quarter: 2, dueDate: '2026-06-16', periodEnd: '2026-06-30' },
  { quarter: 3, dueDate: '2026-09-15', periodEnd: '2026-09-30' },
  { quarter: 4, dueDate: '2027-01-15', periodEnd: '2026-12-31' },
];

// ── CORE FUNCTIONS ──

/**
 * Calculate federal income tax using progressive brackets.
 */
export function calculateFederalTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): number {
  const brackets = filingStatus === 'married_joint'
    ? FEDERAL_BRACKETS_MFJ_2026
    : FEDERAL_BRACKETS_SINGLE_2026;

  let tax = 0;
  let remaining = taxableIncome;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    if (taxableInBracket <= 0) break;
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  return Math.round(tax);
}

/**
 * Get marginal tax rate for given income level.
 */
export function getMarginalRate(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = filingStatus === 'married_joint'
    ? FEDERAL_BRACKETS_MFJ_2026
    : FEDERAL_BRACKETS_SINGLE_2026;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.max) return bracket.rate;
  }
  return 0.37;
}

/**
 * Calculate self-employment tax.
 */
export function calculateSelfEmploymentTax(netSelfEmploymentIncome: number): {
  tax: number;
  deductiblePortion: number;
} {
  // SE tax is on 92.35% of net SE income
  const seBase = netSelfEmploymentIncome * 0.9235;
  // Social Security cap (2026 estimate)
  const ssCap = 168600;
  const ssBase = Math.min(seBase, ssCap);
  const ssTax = ssBase * 0.124;
  const medicareTax = seBase * 0.029;
  // Additional Medicare tax on high earners
  const additionalMedicare = seBase > 200000 ? (seBase - 200000) * 0.009 : 0;

  const totalTax = Math.round(ssTax + medicareTax + additionalMedicare);
  const deductiblePortion = Math.round(totalTax * SE_TAX_DEDUCTION);

  return { tax: totalTax, deductiblePortion };
}

/**
 * Calculate WA Business & Occupation (B&O) tax.
 */
export function calculateWABOTax(grossRevenue: number): number {
  // Small business B&O tax credit for businesses under certain threshold
  // Service and other activities: 1.5%
  return Math.round(grossRevenue * WA_BO_TAX_RATE);
}

/**
 * Calculate Section 179 depreciation for eligible equipment.
 */
export function calculateSection179(equipment: EquipmentAsset[]): Section179Summary {
  const eligible = equipment.filter(e => e.section179Eligible);
  const totalEligible = eligible.reduce((s, e) => s + e.cost, 0);
  const totalClaimed = eligible.reduce((s, e) => s + (e.section179Claimed ?? 0), 0);
  const remainingAllowance = Math.max(0, SECTION_179_LIMIT_2026 - totalClaimed);

  // Estimate marginal tax rate at 24% for savings calculation
  const marginalRate = 0.24;

  const assets = eligible.map(e => {
    const s179Amount = e.section179Claimed ?? 0;
    const regularDepreciation = e.usefulLifeYears > 0
      ? Math.round((e.cost - s179Amount) / e.usefulLifeYears)
      : 0;
    return {
      name: e.name,
      cost: e.cost,
      section179Amount: s179Amount,
      regularDepreciation,
      taxSavings: Math.round(s179Amount * marginalRate),
    };
  });

  let recommendation: string;
  if (remainingAllowance > 50000) {
    recommendation = `You have $${remainingAllowance.toLocaleString()} of Section 179 allowance remaining. Consider purchasing qualifying equipment before year-end to reduce taxable income.`;
  } else if (remainingAllowance > 0) {
    recommendation = `$${remainingAllowance.toLocaleString()} of Section 179 remaining. Plan any equipment purchases to maximize deductions.`;
  } else {
    recommendation = 'Section 179 limit reached for this year. Additional equipment will follow standard depreciation schedules.';
  }

  return {
    totalEligible,
    totalClaimed,
    remainingAllowance,
    assets,
    recommendation,
  };
}

/**
 * Calculate depreciation schedule for all equipment.
 */
export function calculateDepreciation(equipment: EquipmentAsset[]): DepreciationEntry[] {
  const currentYear = new Date().getFullYear();

  return equipment.map(e => {
    const purchaseYear = new Date(e.purchaseDate).getFullYear();
    const yearsOwned = currentYear - purchaseYear;
    const s179 = e.section179Claimed ?? 0;
    const depreciableBase = e.cost - s179;

    const yearlyDepreciation = e.usefulLifeYears > 0
      ? Math.round(depreciableBase / e.usefulLifeYears)
      : 0;

    const accumulated = Math.min(
      depreciableBase,
      e.accumulatedDepreciation ?? (yearlyDepreciation * yearsOwned),
    );

    const bookValue = e.cost - s179 - accumulated;
    const remainingYears = Math.max(0, e.usefulLifeYears - yearsOwned);

    return {
      assetName: e.name,
      originalCost: e.cost,
      method: s179 > 0 ? 'section_179' as const : 'straight_line' as const,
      yearlyDepreciation,
      accumulatedDepreciation: Math.round(accumulated),
      bookValue: Math.round(Math.max(0, bookValue)),
      remainingYears,
    };
  });
}

/**
 * Categorize and summarize expenses for tax purposes.
 */
export function categorizeExpenses(expenses: TaxExpense[]): ExpenseCategorySummary {
  const categoryMap: Record<string, {
    totalAmount: number;
    deductibleAmount: number;
    nonDeductibleAmount: number;
    count: number;
  }> = {};

  let totalDeductible = 0;
  let totalNonDeductible = 0;

  for (const e of expenses) {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { totalAmount: 0, deductibleAmount: 0, nonDeductibleAmount: 0, count: 0 };
    }

    const deductibleAmount = e.deductible ? e.amount * (e.deductiblePercent / 100) : 0;
    const nonDeductibleAmount = e.amount - deductibleAmount;

    categoryMap[e.category].totalAmount += e.amount;
    categoryMap[e.category].deductibleAmount += deductibleAmount;
    categoryMap[e.category].nonDeductibleAmount += nonDeductibleAmount;
    categoryMap[e.category].count++;

    totalDeductible += deductibleAmount;
    totalNonDeductible += nonDeductibleAmount;
  }

  const byCategory = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category: category as TaxExpenseCategory,
      ...data,
      totalAmount: Math.round(data.totalAmount),
      deductibleAmount: Math.round(data.deductibleAmount),
      nonDeductibleAmount: Math.round(data.nonDeductibleAmount),
    }))
    .sort((a, b) => b.deductibleAmount - a.deductibleAmount);

  const topDeductions = expenses
    .filter(e => e.deductible)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(e => ({ description: e.description, amount: Math.round(e.amount), category: e.category }));

  return {
    totalDeductible: Math.round(totalDeductible),
    totalNonDeductible: Math.round(totalNonDeductible),
    byCategory,
    topDeductions,
  };
}

/**
 * Calculate home office deduction.
 */
export function calculateHomeOffice(homeOffice?: HomeOfficeDeduction): number {
  if (!homeOffice) return 0;

  if (homeOffice.method === 'simplified') {
    // $5/sq ft, max 300 sq ft = $1,500 max
    return Math.min(homeOffice.squareFootageOffice * 5, 1500);
  }

  // Regular method
  const percentage = homeOffice.squareFootageHome > 0
    ? homeOffice.squareFootageOffice / homeOffice.squareFootageHome
    : 0;

  const totalExpenses = homeOffice.homeExpenses
    ? (homeOffice.homeExpenses.mortgage + homeOffice.homeExpenses.utilities +
       homeOffice.homeExpenses.insurance + homeOffice.homeExpenses.repairs)
    : 0;

  return Math.round(totalExpenses * percentage);
}

/**
 * Calculate mileage deduction.
 */
export function calculateMileage(mileage?: MileageDeduction): number {
  if (!mileage) return 0;
  const rate = mileage.ratePerMile ?? IRS_MILEAGE_RATE_2026;
  return Math.round(mileage.businessMiles * rate);
}

/**
 * Optimize retirement contributions.
 */
export function optimizeRetirement(
  netSelfEmploymentIncome: number,
  current: RetirementContribution,
  filingStatus: FilingStatus,
): RetirementOptimization {
  const marginalRate = getMarginalRate(netSelfEmploymentIncome, filingStatus);

  // SEP-IRA: 25% of net SE income (after SE tax deduction), max $69,000 (2026 est.)
  const seDeduction = netSelfEmploymentIncome * 0.9235 * SE_TAX_RATE * 0.5;
  const sepBase = netSelfEmploymentIncome - seDeduction;
  const sepMax = Math.min(sepBase * 0.25, 69000);

  // Solo 401(k): employee ($23,000 + $7,500 catch-up if 50+) + employer (25% of net SE income)
  const solo401kEmployee = 23000;
  const solo401kEmployer = Math.min(sepBase * 0.25, 46000);
  const solo401kMax = Math.min(solo401kEmployee + solo401kEmployer, 69000);

  // SIMPLE IRA: $16,000 employee + 3% employer match
  const simpleEmployee = 16000;
  const simpleEmployer = netSelfEmploymentIncome * 0.03;
  const simpleMax = simpleEmployee + simpleEmployer;

  const comparison = [
    {
      type: 'SEP-IRA',
      maxContribution: Math.round(sepMax),
      taxSavings: Math.round(sepMax * marginalRate),
      notes: 'Simple to administer. Employer-only contributions. Good for high earners.',
    },
    {
      type: 'Solo 401(k)',
      maxContribution: Math.round(solo401kMax),
      taxSavings: Math.round(solo401kMax * marginalRate),
      notes: 'Highest contribution limits. Employee + employer contributions. Roth option available.',
    },
    {
      type: 'SIMPLE IRA',
      maxContribution: Math.round(simpleMax),
      taxSavings: Math.round(simpleMax * marginalRate),
      notes: 'Good if you have employees. Lower limits. Mandatory employer match.',
    },
  ];

  // Recommend the one with highest contribution limits
  const best = comparison.sort((a, b) => b.maxContribution - a.maxContribution)[0];
  const recommendedType = best.type === 'Solo 401(k)' ? 'solo_401k'
    : best.type === 'SEP-IRA' ? 'sep_ira'
    : 'simple_ira';

  const maxAllowable = best.maxContribution;
  const additionalRoom = Math.max(0, maxAllowable - current.ytdContributions);
  const taxSavingsIfMaxed = Math.round(additionalRoom * marginalRate);

  const recommendation = additionalRoom > 0
    ? `Contribute an additional $${additionalRoom.toLocaleString()} to your ${best.type} to save $${taxSavingsIfMaxed.toLocaleString()} in taxes.`
    : 'You have maximized your retirement contributions for the year.';

  return {
    currentContribution: current.ytdContributions,
    maxAllowable,
    additionalContributionRoom: additionalRoom,
    taxSavingsIfMaxed,
    recommendedType,
    recommendation,
    comparison,
  };
}

/**
 * Generate year-end tax planning strategies.
 */
export function generateYearEndStrategies(
  projectedIncome: number,
  currentDeductions: number,
  section179Remaining: number,
  retirementRoom: number,
  marginalRate: number,
): YearEndStrategy[] {
  const strategies: YearEndStrategy[] = [];
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  // Equipment purchases (Section 179)
  if (section179Remaining > 10000) {
    strategies.push({
      strategy: 'Accelerate Equipment Purchases',
      description: `Purchase qualifying equipment (laser devices, injection equipment, skincare technology) to claim Section 179 deduction of up to $${section179Remaining.toLocaleString()}.`,
      estimatedSavings: Math.round(Math.min(section179Remaining, 100000) * marginalRate),
      priority: 'high',
      deadline: yearEnd,
      actionItems: [
        'Identify equipment needs for next 6 months',
        'Get quotes from vendors and negotiate year-end deals',
        'Purchase and place in service before December 31',
        'Document business use percentage for each asset',
      ],
    });
  }

  // Retirement contributions
  if (retirementRoom > 5000) {
    strategies.push({
      strategy: 'Maximize Retirement Contributions',
      description: `Contribute remaining $${retirementRoom.toLocaleString()} to retirement account to reduce taxable income.`,
      estimatedSavings: Math.round(retirementRoom * marginalRate),
      priority: 'high',
      deadline: yearEnd,
      actionItems: [
        'Contact retirement account administrator',
        'Calculate optimal contribution amount',
        'Make contribution before deadline (SEP-IRA: tax filing deadline)',
        'Keep contribution receipts for tax filing',
      ],
    });
  }

  // Prepay expenses
  if (projectedIncome > 100000) {
    strategies.push({
      strategy: 'Prepay Business Expenses',
      description: 'Prepay January rent, insurance premiums, and software subscriptions before year-end to accelerate deductions.',
      estimatedSavings: Math.round(15000 * marginalRate),
      priority: 'medium',
      deadline: yearEnd,
      actionItems: [
        'Prepay January rent to landlord',
        'Pay annual software/SaaS subscriptions',
        'Stock up on clinical supplies (injection supplies, skincare products)',
        'Schedule and prepay staff training/certifications',
      ],
    });
  }

  // Income deferral
  if (projectedIncome > 200000) {
    strategies.push({
      strategy: 'Defer Income to Next Year',
      description: 'If revenue is higher than expected, consider deferring some December invoicing to January to shift income to next tax year.',
      estimatedSavings: Math.round(20000 * marginalRate),
      priority: 'medium',
      deadline: yearEnd,
      actionItems: [
        'Review December appointment schedule for late-month bookings',
        'Consider shifting gift card sales timing',
        'Evaluate package sales that could be booked in January',
      ],
    });
  }

  // Charitable giving
  strategies.push({
    strategy: 'Charitable Contributions',
    description: 'Make charitable donations before year-end. Consider donating to community organizations or sponsoring local wellness events.',
    estimatedSavings: Math.round(5000 * marginalRate),
    priority: 'low',
    deadline: yearEnd,
    actionItems: [
      'Identify local charities aligned with wellness mission',
      'Document all donations with receipts',
      'Consider donating unused equipment or supplies',
    ],
  });

  // Review business structure
  if (projectedIncome > 150000) {
    strategies.push({
      strategy: 'Review Entity Structure',
      description: 'At this income level, evaluate whether an S-Corp election could reduce self-employment tax.',
      estimatedSavings: Math.round(projectedIncome * 0.0765 * 0.3),
      priority: 'high',
      deadline: '2027-03-15', // S-Corp election deadline for next year
      actionItems: [
        'Consult with CPA about S-Corp election benefits',
        'Calculate "reasonable salary" for officer compensation',
        'Compare SE tax vs S-Corp tax savings',
        'File Form 2553 by March 15 if beneficial',
      ],
    });
  }

  return strategies.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority] || b.estimatedSavings - a.estimatedSavings;
  });
}

/**
 * Generate quarterly estimated tax payment schedule.
 */
export function calculateQuarterlyTaxes(input: TaxPlanningInput): QuarterlyTaxEstimate {
  const { annualRevenue, ytdRevenue, ytdExpenses, estimatedTaxesPaid, filingStatus } = input;

  // Project full-year numbers
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const annualizationFactor = currentMonth > 0 ? 12 / currentMonth : 1;
  const projectedRevenue = Math.max(annualRevenue, ytdRevenue * annualizationFactor);
  const projectedExpenses = ytdExpenses * annualizationFactor;

  // Calculate deductions
  const homeOfficeDeduction = calculateHomeOffice(input.homeOffice);
  const mileageDeduction = calculateMileage(input.mileage);
  const healthInsuranceDeduction = input.healthInsurance.monthlyPremium * input.healthInsurance.coveredMonths;
  const depreciationDeduction = input.equipment.reduce((s, e) => {
    const s179 = e.section179Claimed ?? 0;
    const depBase = e.cost - s179;
    return s + (e.usefulLifeYears > 0 ? depBase / e.usefulLifeYears : 0) + s179;
  }, 0);

  const grossIncome = projectedRevenue;
  const businessDeductions = projectedExpenses + homeOfficeDeduction + mileageDeduction + depreciationDeduction;

  const netSEIncome = grossIncome - businessDeductions;
  const seTax = calculateSelfEmploymentTax(netSEIncome);

  const totalDeductions = businessDeductions +
    seTax.deductiblePortion +
    healthInsuranceDeduction +
    input.retirementContributions.ytdContributions * annualizationFactor +
    STANDARD_DEDUCTION_2026[filingStatus];

  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const federalTax = calculateFederalTax(taxableIncome, filingStatus);
  const waBOTax = calculateWABOTax(projectedRevenue);
  const totalTax = federalTax + seTax.tax + waBOTax;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  // Quarterly payment schedule
  const quarterlyAmount = Math.round(totalTax / 4);
  const currentQuarter = Math.ceil(currentMonth / 3);

  const quarterlyPayments: QuarterlyPayment[] = QUARTERLY_DEADLINES.map(q => {
    const isPaid = q.quarter < currentQuarter;
    const isDue = q.quarter === currentQuarter;
    const isOverdue = new Date(q.dueDate) < now && !isPaid;

    return {
      quarter: q.quarter,
      dueDate: q.dueDate,
      amount: quarterlyAmount,
      paid: isPaid,
      status: isPaid ? 'paid' : isOverdue ? 'overdue' : isDue ? 'due' : 'upcoming',
    };
  });

  // Safe harbor: pay 100% of prior year tax or 110% if income > $150K
  const safeHarborTarget = input.previousYearTax
    ? (projectedRevenue > 150000 ? input.previousYearTax * 1.1 : input.previousYearTax)
    : totalTax;
  const safeHarborMet = estimatedTaxesPaid >= safeHarborTarget * (currentQuarter / 4);

  return {
    annualProjection: {
      grossIncome: Math.round(grossIncome),
      totalDeductions: Math.round(totalDeductions),
      taxableIncome: Math.round(taxableIncome),
      federalTax,
      selfEmploymentTax: seTax.tax,
      waBOTax,
      totalTax,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
    },
    quarterlyPayments,
    ytdPaid: estimatedTaxesPaid,
    remainingBalance: Math.max(0, totalTax - estimatedTaxesPaid),
    safeHarborMet,
  };
}

/**
 * Main tax planning function.
 */
export function generateTaxPlan(input: TaxPlanningInput): TaxPlanningResult {
  // 1. Quarterly tax estimates
  const estimatedTaxes = calculateQuarterlyTaxes(input);

  // 2. Section 179
  const section179 = calculateSection179(input.equipment);

  // 3. Depreciation schedule
  const depreciationSchedule = calculateDepreciation(input.equipment);

  // 4. Expense categorization
  const expenseSummary = categorizeExpenses(input.expenses);

  // 5. Deductions summary
  const homeOffice = calculateHomeOffice(input.homeOffice);
  const mileage = calculateMileage(input.mileage);
  const healthIns = input.healthInsurance.monthlyPremium * input.healthInsurance.coveredMonths;
  const depTotal = depreciationSchedule.reduce((s, d) => s + d.yearlyDepreciation, 0);
  const seTax = calculateSelfEmploymentTax(input.ytdRevenue - input.ytdExpenses);

  const deductions: DeductionSummary = {
    businessExpenses: expenseSummary.totalDeductible,
    depreciation: Math.round(depTotal),
    section179: section179.totalClaimed,
    homeOffice: Math.round(homeOffice),
    healthInsurance: Math.round(healthIns),
    retirement: input.retirementContributions.ytdContributions,
    mileage: Math.round(mileage),
    selfEmploymentTaxDeduction: seTax.deductiblePortion,
    totalDeductions: 0,
  };
  deductions.totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0) - deductions.totalDeductions;

  // 6. Retirement optimization
  const netSEIncome = input.ytdRevenue - input.ytdExpenses;
  const retirementOptimization = optimizeRetirement(
    netSEIncome * (12 / Math.max(1, new Date().getMonth() + 1)), // annualized
    input.retirementContributions,
    input.filingStatus,
  );

  // 7. Year-end strategies
  const marginalRate = getMarginalRate(
    estimatedTaxes.annualProjection.taxableIncome,
    input.filingStatus,
  );
  const yearEndStrategies = generateYearEndStrategies(
    estimatedTaxes.annualProjection.grossIncome,
    deductions.totalDeductions,
    section179.remainingAllowance,
    retirementOptimization.additionalContributionRoom,
    marginalRate,
  );

  // 8. Tax alerts
  const alerts: TaxAlert[] = [];
  const now = new Date();

  // Check for overdue quarterly payments
  for (const q of estimatedTaxes.quarterlyPayments) {
    if (q.status === 'overdue') {
      alerts.push({
        severity: 'critical',
        message: `Q${q.quarter} estimated tax payment of $${q.amount.toLocaleString()} is overdue`,
        actionRequired: `Pay immediately to avoid IRS penalties. Due date was ${q.dueDate}.`,
        deadline: q.dueDate,
      });
    } else if (q.status === 'due') {
      alerts.push({
        severity: 'warning',
        message: `Q${q.quarter} estimated tax payment of $${q.amount.toLocaleString()} is due`,
        actionRequired: `Submit payment by ${q.dueDate}`,
        deadline: q.dueDate,
      });
    }
  }

  if (!estimatedTaxes.safeHarborMet) {
    alerts.push({
      severity: 'warning',
      message: 'Safe harbor threshold not met — potential underpayment penalty',
      actionRequired: 'Increase remaining quarterly payments to meet safe harbor requirements',
    });
  }

  // Projected tax liability
  const projectedTaxLiability: ProjectedTaxLiability = {
    federal: estimatedTaxes.annualProjection.federalTax,
    selfEmployment: estimatedTaxes.annualProjection.selfEmploymentTax,
    waBOTax: estimatedTaxes.annualProjection.waBOTax,
    total: estimatedTaxes.annualProjection.totalTax,
    effectiveRate: estimatedTaxes.annualProjection.effectiveRate,
    marginalRate: Math.round(marginalRate * 100),
  };

  return {
    estimatedTaxes,
    section179,
    depreciationSchedule,
    expenseSummary,
    deductions,
    retirementOptimization,
    yearEndStrategies,
    alerts,
    projectedTaxLiability,
  };
}
