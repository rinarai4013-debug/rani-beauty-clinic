import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { getAllPipelinePatients } from '@/lib/medical/glp1-pipeline';
import { getRefillsDue } from '@/lib/medical/refill-engine';
import type {
  PipelinePatient,
  PipelineStage,
  MorningBriefing,
  DailyPriority,
} from '@/lib/medical/types';

/**
 * GET /api/ops/morning
 *
 * The /morning command: daily startup briefing formatted as "Good Morning Rina."
 * Combines pipeline status, appointments, revenue pulse, refills, at-risk patients,
 * estimated task time, and top 3 priorities.
 */

// Stage SLAs
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

function daysBetween(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(patient: PipelinePatient): boolean {
  const daysInStage = daysBetween(patient.stageEnteredAt);
  return daysInStage > STAGE_SLAS[patient.stage];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

async function getTodayAppointments(): Promise<{
  total: number;
  consults: number;
  treatments: number;
  glp1Related: number;
  items: {
    time: string;
    service: string;
    clientName: string;
    type: 'consult' | 'treatment' | 'follow_up';
    isGlp1: boolean;
    notes: string;
  }[];
}> {
  try {
    const today = getTodayString();
    const records = await fetchAll<{
      'Service Name': string;
      'Date': string;
      'Time': string;
      'Status': string;
      'Is Consult': boolean;
      'Service Category': string;
    }>(Tables.appointments(), {
      filterByFormula: `{Date} = '${today}'`,
    });

    const items = records.map((r) => {
      const service = r.fields['Service Name'] || 'Unknown';
      const isGlp1 =
        service.toLowerCase().includes('glp') ||
        service.toLowerCase().includes('semaglutide') ||
        service.toLowerCase().includes('tirzepatide') ||
        service.toLowerCase().includes('weight');
      const isConsult = r.fields['Is Consult'] || false;

      return {
        time: r.fields['Time'] || 'TBD',
        service,
        clientName: 'Patient', // Name comes from linked record
        type: (isConsult ? 'consult' : isGlp1 ? 'follow_up' : 'treatment') as 'consult' | 'treatment' | 'follow_up',
        isGlp1,
        notes: '',
      };
    });

    items.sort((a, b) => a.time.localeCompare(b.time));

    return {
      total: items.length,
      consults: items.filter((i) => i.type === 'consult').length,
      treatments: items.filter((i) => i.type === 'treatment').length,
      glp1Related: items.filter((i) => i.isGlp1).length,
      items,
    };
  } catch {
    return { total: 0, consults: 0, treatments: 0, glp1Related: 0, items: [] };
  }
}

async function getOvernightIntakes(): Promise<{
  count: number;
  items: { name: string; email: string; submittedAt: string; medication: string }[];
}> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0); // Since 6pm yesterday

    const records = await fetchAll<{
      'First Name': string;
      'Last Name': string;
      'Email': string;
      'Processing Status': string;
    }>(Tables.intakes(), {
      filterByFormula: `{Processing Status} = 'New'`,
    });

    const items = records.map((r) => ({
      name: `${r.fields['First Name'] || ''} ${r.fields['Last Name'] || ''}`.trim(),
      email: r.fields['Email'] || '',
      submittedAt: 'Overnight',
      medication: 'TBD',
    }));

    return { count: items.length, items };
  } catch {
    return { count: 0, items: [] };
  }
}

async function getRevenuePulse(): Promise<{
  mtdRevenue: number;
  monthlyTarget: number;
  percentToTarget: number;
  projectedMonth: number;
  onTrack: boolean;
  glp1Revenue: number;
  glp1Mrr: number;
  dailyAvg: number;
  comparedToLastMonth: number;
}> {
  try {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const records = await fetchAll<{
      'Amount': number;
      'Date': string;
      'Category': string;
    }>(Tables.transactions(), {
      filterByFormula: `MONTH({Date}) = ${now.getMonth() + 1}`,
    });

    const mtdRevenue = records.reduce((sum, r) => sum + (r.fields['Amount'] || 0), 0);
    const glp1Revenue = records
      .filter((r) =>
        (r.fields['Category'] || '').toLowerCase().includes('glp') ||
        (r.fields['Category'] || '').toLowerCase().includes('weight')
      )
      .reduce((sum, r) => sum + (r.fields['Amount'] || 0), 0);

    const monthlyTarget = 50000; // Configurable
    const dailyAvg = dayOfMonth > 0 ? mtdRevenue / dayOfMonth : 0;
    const projectedMonth = dailyAvg * daysInMonth;
    const percentToTarget = monthlyTarget > 0 ? (mtdRevenue / monthlyTarget) * 100 : 0;

    return {
      mtdRevenue: Math.round(mtdRevenue),
      monthlyTarget,
      percentToTarget: Math.round(percentToTarget),
      projectedMonth: Math.round(projectedMonth),
      onTrack: percentToTarget >= (dayOfMonth / daysInMonth) * 100 * 0.9,
      glp1Revenue: Math.round(glp1Revenue),
      glp1Mrr: 0, // Calculated from active patients
      dailyAvg: Math.round(dailyAvg),
      comparedToLastMonth: 0,
    };
  } catch {
    return {
      mtdRevenue: 0,
      monthlyTarget: 50000,
      percentToTarget: 0,
      projectedMonth: 0,
      onTrack: false,
      glp1Revenue: 0,
      glp1Mrr: 0,
      dailyAvg: 0,
      comparedToLastMonth: 0,
    };
  }
}

function buildFires(patients: PipelinePatient[]): {
  count: number;
  items: { patient: string; issue: string; urgency: 'critical' | 'high'; minutes: number }[];
} {
  const fires: { patient: string; issue: string; urgency: 'critical' | 'high'; minutes: number }[] = [];

  for (const patient of patients) {
    if (!isOverdue(patient)) continue;
    const daysOver = daysBetween(patient.stageEnteredAt) - STAGE_SLAS[patient.stage];
    const firstName = patient.name.split(' ')[0];

    if (patient.stage === 'REFILL_DUE' && daysOver >= 2) {
      fires.push({
        patient: patient.name,
        issue: `${firstName}'s refill is ${daysOver} days overdue - call now`,
        urgency: 'critical',
        minutes: 10,
      });
    } else if (patient.stage === 'AT_RISK') {
      fires.push({
        patient: patient.name,
        issue: `${firstName} is at risk of churning - personal outreach needed`,
        urgency: 'critical',
        minutes: 15,
      });
    } else if (patient.stage === 'LABS_NEEDED' && daysOver >= 3) {
      fires.push({
        patient: patient.name,
        issue: `${firstName} hasn't completed labs (${daysOver} days overdue)`,
        urgency: 'high',
        minutes: 10,
      });
    } else if (patient.stage === 'RX_APPROVED') {
      fires.push({
        patient: patient.name,
        issue: `${firstName}'s Rx is approved - ship medication today`,
        urgency: 'high',
        minutes: 5,
      });
    } else if (patient.stage === 'ACTIVE_FIRST_DOSE') {
      fires.push({
        patient: patient.name,
        issue: `Send injection instructions to ${firstName}`,
        urgency: 'high',
        minutes: 3,
      });
    }
  }

  fires.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'critical' ? -1 : 1;
    return 0;
  });

  return { count: fires.length, items: fires };
}

function buildTopPriorities(
  fires: { count: number; items: { patient: string; issue: string; urgency: string; minutes: number }[] },
  refillsDueToday: number,
  overnightIntakes: number,
  revenuePulse: { onTrack: boolean; percentToTarget: number }
): DailyPriority[] {
  const priorities: DailyPriority[] = [];

  // Priority 1: Fires first
  if (fires.count > 0) {
    priorities.push({
      rank: 1,
      title: `Handle ${fires.count} fire${fires.count > 1 ? 's' : ''}`,
      description: fires.items[0].issue,
      estimatedMinutes: fires.items.reduce((s, f) => s + f.minutes, 0),
      revenueImpact: fires.count * 499,
      type: 'fire',
    });
  }

  // Priority 2: Revenue or refills
  if (refillsDueToday > 0) {
    priorities.push({
      rank: priorities.length + 1,
      title: `Process ${refillsDueToday} refill${refillsDueToday > 1 ? 's' : ''} due today`,
      description: `$${refillsDueToday * 499} in recurring revenue on the line`,
      estimatedMinutes: refillsDueToday * 5,
      revenueImpact: refillsDueToday * 499,
      type: 'money',
    });
  }

  // Priority 3: New intakes or revenue push
  if (overnightIntakes > 0) {
    priorities.push({
      rank: priorities.length + 1,
      title: `Process ${overnightIntakes} new intake${overnightIntakes > 1 ? 's' : ''}`,
      description: 'New patients waiting - first response time matters',
      estimatedMinutes: overnightIntakes * 15,
      revenueImpact: overnightIntakes * 499,
      type: 'growth',
    });
  } else if (!revenuePulse.onTrack) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Revenue push needed',
      description: `At ${revenuePulse.percentToTarget}% of monthly target - find cross-sell or win-back opportunities`,
      estimatedMinutes: 20,
      revenueImpact: 0,
      type: 'money',
    });
  }

  // Fill remaining slots
  while (priorities.length < 3) {
    priorities.push({
      rank: priorities.length + 1,
      title: 'Check-in texts',
      description: 'Send weekly check-in messages to active patients',
      estimatedMinutes: 15,
      revenueImpact: 0,
      type: 'care',
    });
  }

  return priorities.slice(0, 3);
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

    // Gather all data in parallel
    const [patients, appointments, overnightIntakes, revenuePulse, refillPatients] =
      await Promise.all([
        getAllPipelinePatients(),
        getTodayAppointments(),
        getOvernightIntakes(),
        getRevenuePulse(),
        getRefillsDue(7),
      ]);

    // Fires
    const fires = buildFires(patients);

    // Refills due today
    const refillsDueToday = refillPatients.filter((p) => p.daysUntilDue <= 0).length;
    const refillsDueThisWeek = refillPatients.length;
    const refillRevenue = refillPatients.reduce((s, p) => s + (p.monthlyPrice || 499), 0);

    // At-risk patients
    const atRiskPatients = patients.filter((p) =>
      ['AT_RISK', 'WIN_BACK'].includes(p.stage)
    );
    const atRiskRevenue = atRiskPatients.reduce(
      (s, p) => s + (p.monthlyValue || 499) * 6,
      0
    );

    // GLP-1 MRR from active patients
    const activeGlp1 = patients.filter((p) =>
      ['ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1', 'REFILL_DUE'].includes(p.stage)
    );
    const glp1Mrr = activeGlp1.reduce((s, p) => s + (p.monthlyValue || 499), 0);
    revenuePulse.glp1Mrr = glp1Mrr;

    // Pipeline summary counts
    const pipelineCounts: Record<string, number> = {};
    for (const patient of patients) {
      pipelineCounts[patient.stage] = (pipelineCounts[patient.stage] || 0) + 1;
    }

    // Total task time estimate
    const allTaskMinutes =
      fires.items.reduce((s, f) => s + f.minutes, 0) +
      refillsDueToday * 5 +
      overnightIntakes.count * 15 +
      patients.filter((p) => ['ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3'].includes(p.stage)).length * 2;

    // Top 3 priorities
    const priorities = buildTopPriorities(
      fires,
      refillsDueToday,
      overnightIntakes.count,
      revenuePulse
    );

    const result: MorningBriefing = {
      greeting: `${getGreeting()} Rina`,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      appointments,
      overnightIntakes,
      revenuePulse,
      refills: {
        dueToday: refillsDueToday,
        dueThisWeek: refillsDueThisWeek,
        expectedRevenue: refillRevenue,
      },
      atRisk: {
        count: atRiskPatients.length,
        revenueAtStake: atRiskRevenue,
        patients: atRiskPatients.slice(0, 5).map((p) => ({
          name: p.name,
          daysInactive: p.lastActiveDate ? daysBetween(p.lastActiveDate) : 0,
          monthlyValue: p.monthlyValue || 499,
          stage: p.stage,
        })),
      },
      fires,
      pipeline: {
        total: patients.length,
        byStage: pipelineCounts,
        mrr: glp1Mrr,
        overdueCount: patients.filter(isOverdue).length,
      },
      estimatedTaskTime: {
        totalMinutes: allTaskMinutes,
        formatted: `${Math.floor(allTaskMinutes / 60)}h ${allTaskMinutes % 60}m`,
        breakdown: {
          fires: fires.items.reduce((s, f) => s + f.minutes, 0),
          refills: refillsDueToday * 5,
          intakes: overnightIntakes.count * 15,
          checkIns: patients.filter((p) => ['ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3'].includes(p.stage)).length * 2,
        },
      },
      topPriorities: priorities,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/morning] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate morning briefing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
