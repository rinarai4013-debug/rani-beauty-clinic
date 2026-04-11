// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Payroll Integration
// Provider compensation, commissions, labor cost monitoring
// ═══════════════════════════════════════════════════════════════

import { qboClient } from './client';
import { getTransactionsByDateRange, getClassCache } from './sync';
import { getProfitAndLoss } from './reports';
import type {
  QBOEmployee,
  ProviderCompensation,
  PayrollSummary,
} from './types';

/* ─── Provider Configuration ────────────────────────────────── */

export interface ProviderConfig {
  name: string;
  qboClassId?: string; // QBO Class for this provider
  qboEmployeeId?: string;
  baseMonthlySalary: number;
  commissionRate: number; // Percentage of service revenue
  averageHoursPerWeek: number;
  benefitsCostMonthly: number;
}

// Default provider configs — override via setProviderConfigs()
let providerConfigs: ProviderConfig[] = [
  {
    name: 'Mom',
    baseMonthlySalary: 8000,
    commissionRate: 15,
    averageHoursPerWeek: 35,
    benefitsCostMonthly: 800,
  },
];

export function setProviderConfigs(configs: ProviderConfig[]): void {
  providerConfigs = configs;
}

export function getProviderConfigs(): ProviderConfig[] {
  return [...providerConfigs];
}

/* ─── Payroll Tax Rates (Washington State) ──────────────────── */

const PAYROLL_TAX_RATES = {
  socialSecurity: 0.062, // Employer portion
  medicare: 0.0145, // Employer portion
  ficaTotal: 0.0765, // Combined employer FICA
  futa: 0.006, // Federal unemployment (0.6% after credit)
  suiRate: 0.025, // WA state unemployment (varies)
  paidFamilyLeave: 0.0058, // WA PFML (employer portion ~27%)
  workersComp: 0.015, // Varies by classification
} as const;

const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2025 limit

/* ─── Commission Calculation ────────────────────────────────── */

export interface CommissionDetail {
  providerName: string;
  serviceRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  transactions: Array<{
    date: string;
    description: string;
    revenue: number;
    commission: number;
  }>;
}

export function calculateCommissions(
  startDate: string,
  endDate: string,
): CommissionDetail[] {
  const transactions = getTransactionsByDateRange(startDate, endDate)
    .filter(t => t.type === 'income');
  const classes = getClassCache();

  const results: CommissionDetail[] = [];

  for (const config of providerConfigs) {
    // Find matching class
    const cls = config.qboClassId
      ? classes.find(c => c.Id === config.qboClassId)
      : classes.find(c => c.Name.toLowerCase().includes(config.name.toLowerCase()));

    const providerTxns = cls
      ? transactions.filter(t => t.className === cls.Name)
      : transactions.filter(t => t.className?.toLowerCase().includes(config.name.toLowerCase()));

    const serviceRevenue = providerTxns.reduce((sum, t) => sum + t.amount, 0);
    const commissionAmount = serviceRevenue * (config.commissionRate / 100);

    results.push({
      providerName: config.name,
      serviceRevenue,
      commissionRate: config.commissionRate,
      commissionAmount,
      transactions: providerTxns.map(t => ({
        date: t.date,
        description: t.description,
        revenue: t.amount,
        commission: t.amount * (config.commissionRate / 100),
      })),
    });
  }

  return results;
}

/* ─── Payroll Tax Estimation ────────────────────────────────── */

export interface PayrollTaxEstimate {
  period: { start: string; end: string };
  grossPayroll: number;
  socialSecurity: number;
  medicare: number;
  futa: number;
  stateUnemployment: number;
  paidFamilyLeave: number;
  workersComp: number;
  totalEmployerTaxes: number;
  effectiveRate: number;
}

export function estimatePayrollTaxes(
  startDate: string,
  endDate: string,
): PayrollTaxEstimate {
  const commissions = calculateCommissions(startDate, endDate);

  // Calculate months in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);

  let totalGrossPayroll = 0;

  for (const config of providerConfigs) {
    const commission = commissions.find(c => c.providerName === config.name);
    const basePay = config.baseMonthlySalary * months;
    const commissionPay = commission?.commissionAmount || 0;
    totalGrossPayroll += basePay + commissionPay;
  }

  // Apply wage base limits for Social Security
  const ssWages = Math.min(totalGrossPayroll, SOCIAL_SECURITY_WAGE_BASE * providerConfigs.length);

  const socialSecurity = ssWages * PAYROLL_TAX_RATES.socialSecurity;
  const medicare = totalGrossPayroll * PAYROLL_TAX_RATES.medicare;
  const futa = Math.min(totalGrossPayroll, 7000 * providerConfigs.length) * PAYROLL_TAX_RATES.futa;
  const stateUnemployment = totalGrossPayroll * PAYROLL_TAX_RATES.suiRate;
  const paidFamilyLeave = totalGrossPayroll * PAYROLL_TAX_RATES.paidFamilyLeave;
  const workersComp = totalGrossPayroll * PAYROLL_TAX_RATES.workersComp;

  const totalEmployerTaxes = socialSecurity + medicare + futa + stateUnemployment + paidFamilyLeave + workersComp;

  return {
    period: { start: startDate, end: endDate },
    grossPayroll: totalGrossPayroll,
    socialSecurity,
    medicare,
    futa,
    stateUnemployment,
    paidFamilyLeave,
    workersComp,
    totalEmployerTaxes,
    effectiveRate: totalGrossPayroll > 0 ? (totalEmployerTaxes / totalGrossPayroll) * 100 : 0,
  };
}

/* ─── Benefits Cost Allocation ──────────────────────────────── */

export interface BenefitsCost {
  providerName: string;
  healthInsurance: number;
  dentalVision: number;
  retirement: number;
  pto: number;
  other: number;
  totalBenefits: number;
  benefitsAsPercentOfComp: number;
}

export function getBenefitsCostAllocation(
  startDate: string,
  endDate: string,
): BenefitsCost[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);

  return providerConfigs.map(config => {
    const monthlyBenefits = config.benefitsCostMonthly;
    const totalBenefits = monthlyBenefits * months;

    // Estimated breakdown (can be configured per provider)
    const healthInsurance = totalBenefits * 0.60;
    const dentalVision = totalBenefits * 0.10;
    const retirement = totalBenefits * 0.15;
    const pto = totalBenefits * 0.10;
    const other = totalBenefits * 0.05;

    const totalComp = config.baseMonthlySalary * months;
    const benefitsAsPercentOfComp = totalComp > 0 ? (totalBenefits / totalComp) * 100 : 0;

    return {
      providerName: config.name,
      healthInsurance,
      dentalVision,
      retirement,
      pto,
      other,
      totalBenefits,
      benefitsAsPercentOfComp,
    };
  });
}

/* ─── Revenue Per Employee Hour ─────────────────────────────── */

export interface RevenuePerHour {
  providerName: string;
  totalRevenue: number;
  totalHours: number;
  revenuePerHour: number;
  totalCompensation: number;
  compensationPerHour: number;
  revenueToCompRatio: number;
}

export function getRevenuePerEmployeeHour(
  startDate: string,
  endDate: string,
): RevenuePerHour[] {
  const commissions = calculateCommissions(startDate, endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weeks = Math.max(1, (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return providerConfigs.map(config => {
    const commission = commissions.find(c => c.providerName === config.name);
    const totalRevenue = commission?.serviceRevenue || 0;
    const totalHours = config.averageHoursPerWeek * weeks;
    const months = weeks / 4.33;
    const totalCompensation = config.baseMonthlySalary * months + (commission?.commissionAmount || 0);

    return {
      providerName: config.name,
      totalRevenue,
      totalHours: Math.round(totalHours),
      revenuePerHour: totalHours > 0 ? totalRevenue / totalHours : 0,
      totalCompensation,
      compensationPerHour: totalHours > 0 ? totalCompensation / totalHours : 0,
      revenueToCompRatio: totalCompensation > 0 ? totalRevenue / totalCompensation : 0,
    };
  });
}

/* ─── Labor Cost Ratio Monitoring ───────────────────────────── */

export interface LaborCostAnalysis {
  period: { start: string; end: string };
  totalRevenue: number;
  totalLaborCost: number;
  laborCostRatio: number;
  target: number;
  status: 'healthy' | 'warning' | 'critical';
  providers: Array<{
    name: string;
    revenue: number;
    laborCost: number;
    ratio: number;
    status: 'healthy' | 'warning' | 'critical';
  }>;
  trend: Array<{ month: string; ratio: number }>;
}

const LABOR_COST_TARGET = 35; // Target: 35% of revenue
const LABOR_COST_WARNING = 40;
const LABOR_COST_CRITICAL = 50;

function getLaborStatus(ratio: number): 'healthy' | 'warning' | 'critical' {
  if (ratio <= LABOR_COST_TARGET) return 'healthy';
  if (ratio <= LABOR_COST_WARNING) return 'warning';
  return 'critical';
}

export async function getLaborCostAnalysis(
  startDate: string,
  endDate: string,
): Promise<LaborCostAnalysis> {
  const commissions = calculateCommissions(startDate, endDate);
  const taxes = estimatePayrollTaxes(startDate, endDate);
  const benefits = getBenefitsCostAllocation(startDate, endDate);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);

  let totalRevenue = 0;
  let totalLaborCost = 0;

  const providers = providerConfigs.map(config => {
    const commission = commissions.find(c => c.providerName === config.name);
    const benefit = benefits.find(b => b.providerName === config.name);

    const revenue = commission?.serviceRevenue || 0;
    const basePay = config.baseMonthlySalary * months;
    const commissionPay = commission?.commissionAmount || 0;
    const benefitsCost = benefit?.totalBenefits || 0;
    const laborCost = basePay + commissionPay + benefitsCost;

    totalRevenue += revenue;
    totalLaborCost += laborCost;

    const ratio = revenue > 0 ? (laborCost / revenue) * 100 : 100;

    return {
      name: config.name,
      revenue,
      laborCost,
      ratio,
      status: getLaborStatus(ratio),
    };
  });

  // Add employer tax costs
  totalLaborCost += taxes.totalEmployerTaxes;

  const laborCostRatio = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 100;

  // Calculate monthly trend from cached transactions
  const trend: Array<{ month: string; ratio: number }> = [];
  for (let i = 0; i < Math.min(months, 6); i++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    const monthStr = monthStart.toISOString().split('T')[0].substring(0, 7);

    const monthTxns = getTransactionsByDateRange(
      monthStart.toISOString().split('T')[0],
      monthEnd.toISOString().split('T')[0],
    );
    const monthRevenue = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthPayroll = monthTxns.filter(t => t.category === 'payroll').reduce((s, t) => s + t.amount, 0);

    trend.push({
      month: monthStr,
      ratio: monthRevenue > 0 ? (monthPayroll / monthRevenue) * 100 : 0,
    });
  }

  return {
    period: { start: startDate, end: endDate },
    totalRevenue,
    totalLaborCost,
    laborCostRatio,
    target: LABOR_COST_TARGET,
    status: getLaborStatus(laborCostRatio),
    providers,
    trend,
  };
}

/* ─── Full Payroll Summary ──────────────────────────────────── */

export async function getPayrollSummary(
  startDate: string,
  endDate: string,
): Promise<PayrollSummary> {
  const commissions = calculateCommissions(startDate, endDate);
  const taxes = estimatePayrollTaxes(startDate, endDate);
  const benefits = getBenefitsCostAllocation(startDate, endDate);
  const revenuePerHour = getRevenuePerEmployeeHour(startDate, endDate);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
  const weeks = months * 4.33;

  let totalPayroll = 0;
  let totalCommissions = 0;
  let totalBenefits = 0;
  let totalHours = 0;

  const providers: ProviderCompensation[] = providerConfigs.map(config => {
    const commission = commissions.find(c => c.providerName === config.name);
    const benefit = benefits.find(b => b.providerName === config.name);
    const rph = revenuePerHour.find(r => r.providerName === config.name);

    const basePay = config.baseMonthlySalary * months;
    const commissionPay = commission?.commissionAmount || 0;
    const totalComp = basePay + commissionPay;
    const hours = config.averageHoursPerWeek * weeks;

    totalPayroll += basePay;
    totalCommissions += commissionPay;
    totalBenefits += benefit?.totalBenefits || 0;
    totalHours += hours;

    return {
      providerId: config.qboEmployeeId || config.name,
      providerName: config.name,
      baseSalary: basePay,
      commissionRate: config.commissionRate,
      commissionEarned: commissionPay,
      totalCompensation: totalComp,
      serviceRevenue: commission?.serviceRevenue || 0,
      revenuePerHour: rph?.revenuePerHour || 0,
      hoursWorked: Math.round(hours),
      laborCostRatio: (commission?.serviceRevenue || 0) > 0
        ? (totalComp / (commission?.serviceRevenue || 1)) * 100
        : 100,
      period: { start: startDate, end: endDate },
    };
  });

  const totalRevenue = providers.reduce((s, p) => s + p.serviceRevenue, 0);
  const totalLaborCost = totalPayroll + totalCommissions + totalBenefits + taxes.totalEmployerTaxes;

  return {
    period: { start: startDate, end: endDate },
    totalPayroll: totalPayroll + totalCommissions,
    totalCommissions,
    totalBenefits,
    payrollTaxEstimate: taxes.totalEmployerTaxes,
    providers,
    laborCostRatio: totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 100,
    revenuePerEmployeeHour: totalHours > 0 ? totalRevenue / totalHours : 0,
  };
}

/* ─── QBO Employee Sync ─────────────────────────────────────── */

export async function getQBOEmployees(): Promise<QBOEmployee[]> {
  return qboClient.query<QBOEmployee>("SELECT * FROM Employee WHERE Active = true");
}

export async function syncProviderConfigsFromQBO(): Promise<void> {
  const employees = await getQBOEmployees();
  const classes = getClassCache();

  // Match employees to classes by name
  for (const emp of employees) {
    const name = emp.DisplayName;
    const existing = providerConfigs.find(p => p.name === name);
    const cls = classes.find(c => c.Name.toLowerCase().includes(name.toLowerCase()));

    if (!existing) {
      providerConfigs.push({
        name,
        qboClassId: cls?.Id,
        qboEmployeeId: emp.Id,
        baseMonthlySalary: 0, // Must be configured manually
        commissionRate: 10, // Default 10%
        averageHoursPerWeek: 40,
        benefitsCostMonthly: 0,
      });
    } else {
      existing.qboEmployeeId = emp.Id;
      if (cls) existing.qboClassId = cls.Id;
    }
  }
}
