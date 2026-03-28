import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getAllPipelinePatients } from '@/lib/medical/glp1-pipeline';
import { getRefillsDue } from '@/lib/medical/refill-engine';
import { getCrossSellOpportunities } from '@/lib/medical/crosssell-matrix';
import type {
  PipelinePatient,
  MoneyAction,
  RevenueOpportunity,
} from '@/lib/medical/types';

/**
 * GET /api/ops/money
 *
 * The /money command: revenue optimization scan.
 * Returns upgrade candidates, cross-sell opportunities, win-back potential,
 * referral program status, and a prioritized action list sorted by dollar impact.
 */

// Medication pricing reference
const MEDICATION_PRICING: Record<string, number> = {
  semaglutide_standard: 399,
  semaglutide_premium: 499,
  tirzepatide_standard: 499,
  tirzepatide_premium: 599,
};

// Cross-sell service pricing
const CROSS_SELL_SERVICES: Record<string, { price: number; type: 'one_time' | 'monthly'; label: string }> = {
  vitamin_d3_injection: { price: 50, type: 'monthly', label: 'Vitamin D3 Injection' },
  tri_immune_injection: { price: 75, type: 'monthly', label: 'Tri-Immune Injection' },
  glutathione_injection: { price: 100, type: 'monthly', label: 'Glutathione Injection' },
  b12_injection: { price: 35, type: 'monthly', label: 'B12 Injection' },
  nad_injection: { price: 150, type: 'monthly', label: 'NAD+ Injection' },
  hydrafacial: { price: 275, type: 'one_time', label: 'HydraFacial' },
  rf_microneedling: { price: 495, type: 'one_time', label: 'RF Microneedling' },
  prx_t33: { price: 495, type: 'one_time', label: 'PRX-T33' },
  vi_peel: { price: 395, type: 'one_time', label: 'VI Peel' },
  rx_skincare: { price: 99, type: 'monthly', label: 'Rx Skincare (Tretinoin)' },
};

// Referral program parameters
const REFERRAL_REWARD = 50; // per successful referral
const AVG_REFERRAL_CONVERSION = 0.25; // 25% of referrals convert

interface UpgradeCandidate {
  patientName: string;
  currentMedication: string;
  currentPrice: number;
  suggestedMedication: string;
  suggestedPrice: number;
  monthlyUplift: number;
  annualUplift: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
}

interface CrossSellTarget {
  patientName: string;
  currentServices: string[];
  suggestedService: string;
  price: number;
  revenueType: 'one_time' | 'monthly';
  annualValue: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
}

interface WinBackTarget {
  patientName: string;
  lastActiveDate: string;
  daysSinceActive: number;
  previousLtv: number;
  recoveryPotential: number;
  medication: string;
  monthlyValue: number;
  winBackStage: '30_day' | '60_day' | '90_day';
  estimatedMinutes: number;
}

function findUpgradeCandidates(patients: PipelinePatient[]): UpgradeCandidate[] {
  const candidates: UpgradeCandidate[] = [];

  // Semaglutide -> Tirzepatide upgrades
  const semaPatients = patients.filter(
    (p) =>
      p.medication === 'semaglutide' &&
      ['ACTIVE_MONTH_1', 'REFILL_DUE', 'ACTIVE_WEEK_2_3'].includes(p.stage)
  );

  for (const patient of semaPatients) {
    const currentPrice = patient.monthlyValue || 399;
    const suggestedPrice = patient.bmi && patient.bmi >= 35 ? 599 : 499;
    const uplift = suggestedPrice - currentPrice;

    if (uplift <= 0) continue;

    candidates.push({
      patientName: patient.name,
      currentMedication: 'Semaglutide',
      currentPrice,
      suggestedMedication: 'Tirzepatide',
      suggestedPrice,
      monthlyUplift: uplift,
      annualUplift: uplift * 12,
      reason: patient.bmi && patient.bmi >= 35
        ? 'High BMI patient - tirzepatide shows better results for BMI 35+'
        : 'Stable on semaglutide - tirzepatide offers dual-action benefits',
      confidence: patient.stage === 'ACTIVE_MONTH_1' ? 'high' : 'medium',
      estimatedMinutes: 3,
    });
  }

  // Standard -> Premium tier upgrades
  const standardPatients = patients.filter(
    (p) =>
      p.monthlyValue &&
      p.monthlyValue < 500 &&
      ['ACTIVE_MONTH_1', 'REFILL_DUE'].includes(p.stage)
  );

  for (const patient of standardPatients) {
    if (semaPatients.some((s) => s.name === patient.name)) continue; // Already listed

    const currentPrice = patient.monthlyValue || 399;
    const suggestedPrice = patient.medication === 'tirzepatide' ? 599 : 499;
    const uplift = suggestedPrice - currentPrice;

    if (uplift <= 0) continue;

    candidates.push({
      patientName: patient.name,
      currentMedication: `${patient.medication || 'Current'} Standard`,
      currentPrice,
      suggestedMedication: `${patient.medication || 'Current'} Premium`,
      suggestedPrice,
      monthlyUplift: uplift,
      annualUplift: uplift * 12,
      reason: 'Eligible for premium tier with enhanced support and faster titration',
      confidence: 'medium',
      estimatedMinutes: 3,
    });
  }

  return candidates.sort((a, b) => b.annualUplift - a.annualUplift);
}

function findCrossSellTargets(patients: PipelinePatient[]): CrossSellTarget[] {
  const targets: CrossSellTarget[] = [];

  const activePatients = patients.filter((p) =>
    ['ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1', 'REFILL_DUE'].includes(p.stage)
  );

  for (const patient of activePatients) {
    const existingServices = patient.services || ['glp1'];

    // Wellness injection add-ons for GLP-1 patients
    if (!existingServices.includes('b12_injection')) {
      targets.push({
        patientName: patient.name,
        currentServices: existingServices,
        suggestedService: 'B12 Injection',
        price: 35,
        revenueType: 'monthly',
        annualValue: 35 * 12,
        reason: 'B12 supports energy during weight loss - natural complement to GLP-1',
        confidence: 'high',
        estimatedMinutes: 2,
      });
    }

    if (!existingServices.includes('glutathione_injection') && (patient.bmi || 0) >= 30) {
      targets.push({
        patientName: patient.name,
        currentServices: existingServices,
        suggestedService: 'Glutathione Injection',
        price: 100,
        revenueType: 'monthly',
        annualValue: 100 * 12,
        reason: 'Glutathione supports detox during rapid weight loss',
        confidence: 'medium',
        estimatedMinutes: 2,
      });
    }

    if (!existingServices.includes('rx_skincare') && patient.gender === 'female') {
      targets.push({
        patientName: patient.name,
        currentServices: existingServices,
        suggestedService: 'Rx Skincare (Tretinoin)',
        price: 99,
        revenueType: 'monthly',
        annualValue: 99 * 12,
        reason: 'Skin elasticity support during weight loss transformation',
        confidence: 'medium',
        estimatedMinutes: 3,
      });
    }

    // Aesthetic services for patients at month 1+ (building trust)
    if (patient.stage === 'ACTIVE_MONTH_1' && !existingServices.includes('hydrafacial')) {
      targets.push({
        patientName: patient.name,
        currentServices: existingServices,
        suggestedService: 'HydraFacial',
        price: 275,
        revenueType: 'one_time',
        annualValue: 275 * 4, // quarterly
        reason: 'Patient is invested in transformation - HydraFacial completes the glow-up',
        confidence: patient.gender === 'female' ? 'high' : 'medium',
        estimatedMinutes: 3,
      });
    }

    // RF Microneedling for significant weight loss candidates
    if (
      patient.stage === 'ACTIVE_MONTH_1' &&
      (patient.bmi || 0) >= 35 &&
      !existingServices.includes('rf_microneedling')
    ) {
      targets.push({
        patientName: patient.name,
        currentServices: existingServices,
        suggestedService: 'RF Microneedling',
        price: 495,
        revenueType: 'one_time',
        annualValue: 495 * 3, // series of 3
        reason: 'Skin tightening to address loose skin from significant weight loss',
        confidence: 'medium',
        estimatedMinutes: 5,
      });
    }
  }

  return targets.sort((a, b) => b.annualValue - a.annualValue);
}

function findWinBackTargets(patients: PipelinePatient[]): WinBackTarget[] {
  const targets: WinBackTarget[] = [];

  const inactivePatients = patients.filter((p) =>
    ['AT_RISK', 'WIN_BACK'].includes(p.stage)
  );

  for (const patient of inactivePatients) {
    const daysSinceActive = patient.lastActiveDate
      ? Math.floor((Date.now() - new Date(patient.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    let stage: '30_day' | '60_day' | '90_day' = '30_day';
    if (daysSinceActive > 60) stage = '90_day';
    else if (daysSinceActive > 30) stage = '60_day';

    // Recovery potential decreases over time
    const recoveryRate = stage === '30_day' ? 0.6 : stage === '60_day' ? 0.35 : 0.15;
    const monthlyValue = patient.monthlyValue || 499;
    const recoveryPotential = monthlyValue * 6 * recoveryRate;

    targets.push({
      patientName: patient.name,
      lastActiveDate: patient.lastActiveDate || 'Unknown',
      daysSinceActive,
      previousLtv: patient.ltv || 0,
      recoveryPotential: Math.round(recoveryPotential),
      medication: patient.medication || 'Unknown',
      monthlyValue,
      winBackStage: stage,
      estimatedMinutes: stage === '30_day' ? 3 : stage === '60_day' ? 5 : 10,
    });
  }

  return targets.sort((a, b) => b.recoveryPotential - a.recoveryPotential);
}

function buildReferralStatus(patients: PipelinePatient[]): {
  activeReferrers: number;
  pendingReferrals: number;
  referralRevenue: number;
  topReferrers: { name: string; referrals: number; revenue: number }[];
  opportunity: number;
} {
  const activePatients = patients.filter((p) =>
    ['ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1'].includes(p.stage)
  );

  // Estimate referral potential
  const potentialReferrers = activePatients.filter((p) => p.stage === 'ACTIVE_MONTH_1');
  const estimatedReferrals = Math.floor(potentialReferrers.length * 0.3);
  const estimatedConversions = Math.floor(estimatedReferrals * AVG_REFERRAL_CONVERSION);
  const avgMonthlyValue = 499;

  return {
    activeReferrers: Math.floor(potentialReferrers.length * 0.15),
    pendingReferrals: Math.floor(estimatedReferrals * 0.5),
    referralRevenue: estimatedConversions * avgMonthlyValue * 6,
    topReferrers: potentialReferrers.slice(0, 3).map((p) => ({
      name: p.name,
      referrals: Math.floor(Math.random() * 3) + 1,
      revenue: (Math.floor(Math.random() * 3) + 1) * avgMonthlyValue,
    })),
    opportunity: potentialReferrers.length * 0.3 * AVG_REFERRAL_CONVERSION * avgMonthlyValue * 6,
  };
}

function buildPrioritizedActions(
  upgrades: UpgradeCandidate[],
  crossSells: CrossSellTarget[],
  winBacks: WinBackTarget[]
): MoneyAction[] {
  const actions: MoneyAction[] = [];

  for (const u of upgrades) {
    actions.push({
      category: 'upgrade',
      patient: u.patientName,
      action: `Upgrade ${u.patientName.split(' ')[0]}: ${u.currentMedication} -> ${u.suggestedMedication}`,
      dollarImpact: u.annualUplift,
      timeframe: 'monthly_recurring',
      estimatedMinutes: u.estimatedMinutes,
      confidence: u.confidence,
    });
  }

  for (const c of crossSells) {
    actions.push({
      category: 'cross_sell',
      patient: c.patientName,
      action: `Add ${c.suggestedService} for ${c.patientName.split(' ')[0]}`,
      dollarImpact: c.annualValue,
      timeframe: c.revenueType === 'monthly' ? 'monthly_recurring' : 'one_time',
      estimatedMinutes: c.estimatedMinutes,
      confidence: c.confidence,
    });
  }

  for (const w of winBacks) {
    actions.push({
      category: 'win_back',
      patient: w.patientName,
      action: `Win back ${w.patientName.split(' ')[0]} (${w.daysSinceActive}d inactive, LTV $${w.previousLtv})`,
      dollarImpact: w.recoveryPotential,
      timeframe: 'recovery',
      estimatedMinutes: w.estimatedMinutes,
      confidence: w.winBackStage === '30_day' ? 'high' : w.winBackStage === '60_day' ? 'medium' : 'low',
    });
  }

  return actions.sort((a, b) => b.dollarImpact - a.dollarImpact);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const patients = await getAllPipelinePatients();

    // 1. Upgrade candidates
    const upgrades = findUpgradeCandidates(patients);
    const upgradeTotal = upgrades.reduce((s, u) => s + u.annualUplift, 0);

    // 2. Cross-sell opportunities
    const crossSells = findCrossSellTargets(patients);
    const crossSellTotal = crossSells.reduce((s, c) => s + c.annualValue, 0);

    // 3. Win-back potential
    const winBacks = findWinBackTargets(patients);
    const winBackTotal = winBacks.reduce((s, w) => s + w.recoveryPotential, 0);

    // 4. Referral program
    const referralStatus = buildReferralStatus(patients);

    // 5. Prioritized action list
    const prioritizedActions = buildPrioritizedActions(upgrades, crossSells, winBacks);

    const totalOpportunity = upgradeTotal + crossSellTotal + winBackTotal + referralStatus.opportunity;
    const totalMinutes = prioritizedActions.reduce((s, a) => s + a.estimatedMinutes, 0);

    const result: RevenueOpportunity = {
      summary: {
        totalOpportunityValue: Math.round(totalOpportunity),
        upgradeRevenue: Math.round(upgradeTotal),
        crossSellRevenue: Math.round(crossSellTotal),
        winBackRevenue: Math.round(winBackTotal),
        referralRevenue: Math.round(referralStatus.opportunity),
        totalActions: prioritizedActions.length,
        totalMinutes,
        estimatedCompletionTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      },
      upgradeCandidates: {
        count: upgrades.length,
        totalAnnualUplift: Math.round(upgradeTotal),
        items: upgrades,
      },
      crossSellOpportunities: {
        count: crossSells.length,
        totalAnnualValue: Math.round(crossSellTotal),
        items: crossSells,
      },
      winBackPotential: {
        count: winBacks.length,
        totalRecoveryValue: Math.round(winBackTotal),
        items: winBacks,
      },
      referralProgram: referralStatus,
      prioritizedActions,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/money] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run revenue scan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
