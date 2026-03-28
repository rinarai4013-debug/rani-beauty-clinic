import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { getAllPipelinePatients, getPipelineSLAs } from '@/lib/medical/glp1-pipeline';
import { getRefillsDue } from '@/lib/medical/refill-engine';
import { getCrossSellOpportunities } from '@/lib/medical/crosssell-matrix';
import type {
  PipelineStage,
  PipelinePatient,
  PipelineSnapshot,
  PipelineAction,
  PipelinePriority,
} from '@/lib/medical/types';

/**
 * GET /api/ops/pipeline
 *
 * The /pipeline command: pulls all patients grouped by pipeline stage,
 * flags overdue items per stage SLA, generates prioritized action list.
 *
 * Returns: FIRES, MONEY MOVES, CHECK-INS, and PIPELINE SNAPSHOT sections.
 */

// Stage SLAs in days
const STAGE_SLAS: Record<PipelineStage, number> = {
  PIPELINE_NEW: 1,
  LABS_NEEDED: 5,
  GFE_PENDING: 3,
  RX_APPROVED: 1,
  MED_SHIPPED: 5,
  ACTIVE_FIRST_DOSE: 1,
  ACTIVE_WEEK_1: 7,
  ACTIVE_WEEK_2_3: 14,
  ACTIVE_MONTH_1: 30,
  REFILL_DUE: 5,
  AT_RISK: 7,
  WIN_BACK: 90,
};

// Revenue per stage (monthly value of patient at that point)
const STAGE_REVENUE: Record<PipelineStage, number> = {
  PIPELINE_NEW: 0,
  LABS_NEEDED: 0,
  GFE_PENDING: 0,
  RX_APPROVED: 0,
  MED_SHIPPED: 0,
  ACTIVE_FIRST_DOSE: 499,
  ACTIVE_WEEK_1: 499,
  ACTIVE_WEEK_2_3: 499,
  ACTIVE_MONTH_1: 499,
  REFILL_DUE: 499,
  AT_RISK: 0,
  WIN_BACK: 0,
};

// Stage order for display
const STAGE_ORDER: PipelineStage[] = [
  'PIPELINE_NEW',
  'LABS_NEEDED',
  'GFE_PENDING',
  'RX_APPROVED',
  'MED_SHIPPED',
  'ACTIVE_FIRST_DOSE',
  'ACTIVE_WEEK_1',
  'ACTIVE_WEEK_2_3',
  'ACTIVE_MONTH_1',
  'REFILL_DUE',
  'AT_RISK',
  'WIN_BACK',
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  PIPELINE_NEW: 'New in Pipeline',
  LABS_NEEDED: 'Labs Needed',
  GFE_PENDING: 'GFE Pending',
  RX_APPROVED: 'Rx Approved',
  MED_SHIPPED: 'Med Shipped',
  ACTIVE_FIRST_DOSE: 'First Dose',
  ACTIVE_WEEK_1: 'Week 1',
  ACTIVE_WEEK_2_3: 'Week 2-3',
  ACTIVE_MONTH_1: 'Month 1+',
  REFILL_DUE: 'Refill Due',
  AT_RISK: 'At Risk',
  WIN_BACK: 'Win Back',
};

function daysBetween(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(patient: PipelinePatient): boolean {
  const daysInStage = daysBetween(patient.stageEnteredAt);
  return daysInStage > STAGE_SLAS[patient.stage];
}

function getOverdueSeverity(patient: PipelinePatient): 'green' | 'yellow' | 'red' {
  const daysInStage = daysBetween(patient.stageEnteredAt);
  const sla = STAGE_SLAS[patient.stage];
  if (daysInStage <= sla * 0.5) return 'green';
  if (daysInStage <= sla) return 'yellow';
  return 'red';
}

function estimateMinutes(action: string): number {
  const estimates: Record<string, number> = {
    'send_text': 2,
    'send_email': 3,
    'phone_call': 10,
    'review_labs': 5,
    'process_intake': 15,
    'order_refill': 5,
    'qualiphy_check': 3,
    'update_stage': 1,
    'cross_sell_text': 3,
  };
  return estimates[action] || 5;
}

function buildFires(patients: PipelinePatient[]): PipelineAction[] {
  const fires: PipelineAction[] = [];

  // Overdue patients in critical stages
  for (const patient of patients) {
    if (!isOverdue(patient)) continue;

    const daysOver = daysBetween(patient.stageEnteredAt) - STAGE_SLAS[patient.stage];

    if (patient.stage === 'LABS_NEEDED' && daysOver >= 3) {
      fires.push({
        type: 'fire',
        patient: patient.name,
        stage: patient.stage,
        action: `OVERDUE ${daysOver} days - Call ${patient.name.split(' ')[0]} about labs`,
        actionType: 'phone_call',
        estimatedMinutes: 10,
        revenueImpact: STAGE_REVENUE.ACTIVE_FIRST_DOSE,
        urgency: 'critical',
      });
    }

    if (patient.stage === 'REFILL_DUE' && daysOver >= 2) {
      fires.push({
        type: 'fire',
        patient: patient.name,
        stage: patient.stage,
        action: `REFILL OVERDUE ${daysOver} days - ${patient.name.split(' ')[0]} might churn`,
        actionType: 'phone_call',
        estimatedMinutes: 10,
        revenueImpact: (patient.monthlyValue || 499) * 6,
        urgency: 'critical',
      });
    }

    if (patient.stage === 'AT_RISK') {
      fires.push({
        type: 'fire',
        patient: patient.name,
        stage: patient.stage,
        action: `AT-RISK patient ${patient.name.split(' ')[0]} - personal call needed`,
        actionType: 'phone_call',
        estimatedMinutes: 15,
        revenueImpact: (patient.monthlyValue || 499) * 12,
        urgency: 'critical',
      });
    }

    if (patient.stage === 'RX_APPROVED') {
      fires.push({
        type: 'fire',
        patient: patient.name,
        stage: patient.stage,
        action: `Rx approved for ${patient.name.split(' ')[0]} - ship medication TODAY`,
        actionType: 'update_stage',
        estimatedMinutes: 5,
        revenueImpact: STAGE_REVENUE.ACTIVE_FIRST_DOSE,
        urgency: 'high',
      });
    }

    if (patient.stage === 'ACTIVE_FIRST_DOSE') {
      fires.push({
        type: 'fire',
        patient: patient.name,
        stage: patient.stage,
        action: `Send injection instructions to ${patient.name.split(' ')[0]}`,
        actionType: 'send_text',
        estimatedMinutes: 3,
        revenueImpact: 0,
        urgency: 'high',
      });
    }
  }

  // Sort by urgency then revenue impact
  return fires.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aOrder = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 2;
    const bOrder = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.revenueImpact || 0) - (a.revenueImpact || 0);
  });
}

function buildMoneyMoves(patients: PipelinePatient[]): PipelineAction[] {
  const moves: PipelineAction[] = [];

  // Refills due (direct revenue)
  const refillPatients = patients.filter((p) => p.stage === 'REFILL_DUE');
  for (const patient of refillPatients) {
    moves.push({
      type: 'money',
      patient: patient.name,
      stage: patient.stage,
      action: `Process refill for ${patient.name.split(' ')[0]} - $${patient.monthlyValue || 499}/mo`,
      actionType: 'order_refill',
      estimatedMinutes: 5,
      revenueImpact: patient.monthlyValue || 499,
      urgency: 'high',
    });
  }

  // Intakes ready to advance (potential revenue)
  const gfeReady = patients.filter((p) => p.stage === 'GFE_PENDING');
  for (const patient of gfeReady) {
    moves.push({
      type: 'money',
      patient: patient.name,
      stage: patient.stage,
      action: `Push ${patient.name.split(' ')[0]} through GFE - potential $499/mo`,
      actionType: 'qualiphy_check',
      estimatedMinutes: 3,
      revenueImpact: 499,
      urgency: 'medium',
    });
  }

  // Semaglutide to tirzepatide upgrade candidates
  const upgradeableSema = patients.filter(
    (p) =>
      p.medication === 'semaglutide' &&
      ['ACTIVE_MONTH_1', 'REFILL_DUE'].includes(p.stage)
  );
  for (const patient of upgradeableSema) {
    moves.push({
      type: 'money',
      patient: patient.name,
      stage: patient.stage,
      action: `Upgrade ${patient.name.split(' ')[0]} sema -> tirz = +$100/mo`,
      actionType: 'cross_sell_text',
      estimatedMinutes: 3,
      revenueImpact: 100 * 12,
      urgency: 'medium',
    });
  }

  // Cross-sell on active patients
  const activePatients = patients.filter((p) =>
    ['ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1'].includes(p.stage)
  );
  for (const patient of activePatients) {
    if (patient.crossSellScore && patient.crossSellScore > 70) {
      moves.push({
        type: 'money',
        patient: patient.name,
        stage: patient.stage,
        action: `Cross-sell opportunity for ${patient.name.split(' ')[0]} (score: ${patient.crossSellScore})`,
        actionType: 'cross_sell_text',
        estimatedMinutes: 3,
        revenueImpact: patient.crossSellValue || 200,
        urgency: 'low',
      });
    }
  }

  // Win-back high-value patients
  const winBackPatients = patients
    .filter((p) => p.stage === 'WIN_BACK' && (p.ltv || 0) > 2000)
    .sort((a, b) => (b.ltv || 0) - (a.ltv || 0));
  for (const patient of winBackPatients.slice(0, 5)) {
    moves.push({
      type: 'money',
      patient: patient.name,
      stage: patient.stage,
      action: `Win back ${patient.name.split(' ')[0]} - LTV $${patient.ltv || 0}`,
      actionType: 'send_text',
      estimatedMinutes: 3,
      revenueImpact: (patient.monthlyValue || 499) * 6,
      urgency: 'medium',
    });
  }

  return moves.sort((a, b) => (b.revenueImpact || 0) - (a.revenueImpact || 0));
}

function buildCheckIns(patients: PipelinePatient[]): PipelineAction[] {
  const checkIns: PipelineAction[] = [];

  // Week 1 check-ins
  const week1 = patients.filter((p) => p.stage === 'ACTIVE_WEEK_1');
  for (const patient of week1) {
    checkIns.push({
      type: 'checkin',
      patient: patient.name,
      stage: patient.stage,
      action: `Week 1 side effects check: ${patient.name.split(' ')[0]}`,
      actionType: 'send_text',
      estimatedMinutes: 2,
      revenueImpact: 0,
      urgency: 'standard' as string,
    });
  }

  // Week 2-3 progress checks
  const week23 = patients.filter((p) => p.stage === 'ACTIVE_WEEK_2_3');
  for (const patient of week23) {
    checkIns.push({
      type: 'checkin',
      patient: patient.name,
      stage: patient.stage,
      action: `Progress check: ${patient.name.split(' ')[0]}`,
      actionType: 'send_text',
      estimatedMinutes: 2,
      revenueImpact: 0,
      urgency: 'standard' as string,
    });
  }

  // Month 1 reviews
  const month1 = patients.filter((p) => p.stage === 'ACTIVE_MONTH_1');
  for (const patient of month1) {
    const daysInStage = daysBetween(patient.stageEnteredAt);
    if (daysInStage >= 28 && daysInStage <= 35) {
      checkIns.push({
        type: 'checkin',
        patient: patient.name,
        stage: patient.stage,
        action: `Month 1 review + results celebration: ${patient.name.split(' ')[0]}`,
        actionType: 'send_text',
        estimatedMinutes: 3,
        revenueImpact: 0,
        urgency: 'standard' as string,
      });
    }
  }

  return checkIns;
}

function buildSnapshot(patients: PipelinePatient[]): PipelineSnapshot {
  const stageBreakdown: PipelineSnapshot['stages'] = STAGE_ORDER.map((stage) => {
    const stagePatients = patients.filter((p) => p.stage === stage);
    const overdueCount = stagePatients.filter(isOverdue).length;
    const revenue = stagePatients.reduce(
      (sum, p) => sum + (STAGE_REVENUE[stage] || 0),
      0
    );

    return {
      stage,
      label: STAGE_LABELS[stage],
      count: stagePatients.length,
      overdueCount,
      monthlyRevenue: revenue,
      patients: stagePatients.map((p) => ({
        name: p.name,
        daysInStage: daysBetween(p.stageEnteredAt),
        slaMax: STAGE_SLAS[stage],
        status: getOverdueSeverity(p),
        medication: p.medication,
        monthlyValue: p.monthlyValue || 0,
      })),
    };
  });

  const totalPatients = patients.length;
  const activePatients = patients.filter((p) =>
    ['ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1'].includes(p.stage)
  ).length;
  const mrr = patients
    .filter((p) =>
      ['ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1', 'REFILL_DUE'].includes(p.stage)
    )
    .reduce((sum, p) => sum + (p.monthlyValue || 499), 0);

  const pipelinePatients = patients.filter((p) =>
    ['PIPELINE_NEW', 'LABS_NEEDED', 'GFE_PENDING', 'RX_APPROVED', 'MED_SHIPPED'].includes(p.stage)
  ).length;
  const atRiskPatients = patients.filter((p) =>
    ['AT_RISK', 'WIN_BACK'].includes(p.stage)
  ).length;

  return {
    totalPatients,
    activePatients,
    pipelinePatients,
    atRiskPatients,
    mrr,
    estimatedAnnualRevenue: mrr * 12,
    stages: stageBreakdown,
  };
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

    // Pull all pipeline patients
    const patients = await getAllPipelinePatients();

    // Build each section
    const fires = buildFires(patients);
    const moneyMoves = buildMoneyMoves(patients);
    const checkIns = buildCheckIns(patients);
    const snapshot = buildSnapshot(patients);

    // Calculate total estimated time
    const allActions = [...fires, ...moneyMoves, ...checkIns];
    const totalMinutes = allActions.reduce((sum, a) => sum + (a.estimatedMinutes || 0), 0);
    const totalRevenueOpportunity = [...fires, ...moneyMoves].reduce(
      (sum, a) => sum + (a.revenueImpact || 0),
      0
    );

    const result = {
      fires: {
        count: fires.length,
        items: fires,
        totalMinutes: fires.reduce((s, a) => s + (a.estimatedMinutes || 0), 0),
      },
      moneyMoves: {
        count: moneyMoves.length,
        items: moneyMoves,
        totalRevenueOpportunity: moneyMoves.reduce((s, a) => s + (a.revenueImpact || 0), 0),
      },
      checkIns: {
        count: checkIns.length,
        items: checkIns,
        totalMinutes: checkIns.reduce((s, a) => s + (a.estimatedMinutes || 0), 0),
      },
      snapshot,
      summary: {
        totalActions: allActions.length,
        totalMinutes,
        estimatedCompletionTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
        totalRevenueOpportunity,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/pipeline] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load pipeline', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
