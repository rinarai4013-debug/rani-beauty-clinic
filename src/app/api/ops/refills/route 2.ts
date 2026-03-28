import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getRefillsDue, getRefillHistory } from '@/lib/medical/refill-engine';
import { generateMessage } from '@/lib/medical/voice-engine';
import type {
  RefillPatient,
  RefillBatchResult,
  ChurnRiskFlag,
} from '@/lib/medical/types';

/**
 * GET /api/ops/refills
 *
 * The /refills command: lists patients due for refill in the next 7-14 days,
 * generates batch text messages, calculates expected revenue, flags churn risks.
 */

// Churn risk indicators
const CHURN_SIGNALS: Record<string, { weight: number; label: string }> = {
  no_response_3_days: { weight: 30, label: 'No response in 3+ days' },
  no_response_5_days: { weight: 50, label: 'No response in 5+ days' },
  payment_failed: { weight: 40, label: 'Payment issue' },
  missed_last_refill: { weight: 35, label: 'Missed previous refill window' },
  reduced_engagement: { weight: 20, label: 'Reduced message engagement' },
  side_effects_reported: { weight: 25, label: 'Reported side effects' },
  price_concern_mentioned: { weight: 30, label: 'Mentioned cost concerns' },
  no_weight_update: { weight: 15, label: 'No weight update in 30+ days' },
};

interface RefillWindow {
  label: string;
  daysUntilDue: [number, number]; // [min, max]
  urgency: 'upcoming' | 'due_now' | 'overdue';
}

const REFILL_WINDOWS: RefillWindow[] = [
  { label: 'Overdue', daysUntilDue: [-30, -1], urgency: 'overdue' },
  { label: 'Due Today', daysUntilDue: [0, 0], urgency: 'due_now' },
  { label: 'Due This Week', daysUntilDue: [1, 7], urgency: 'due_now' },
  { label: 'Due Next Week', daysUntilDue: [8, 14], urgency: 'upcoming' },
];

function categorizeRefillUrgency(daysUntilDue: number): string {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'due_today';
  if (daysUntilDue <= 3) return 'due_soon';
  if (daysUntilDue <= 7) return 'this_week';
  return 'next_week';
}

function calculateChurnRisk(patient: RefillPatient): {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: ChurnRiskFlag[];
} {
  const flags: ChurnRiskFlag[] = [];
  let totalScore = 0;

  // Check each churn signal
  if (patient.daysSinceLastResponse && patient.daysSinceLastResponse >= 5) {
    const signal = CHURN_SIGNALS.no_response_5_days;
    flags.push({ signal: 'no_response_5_days', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  } else if (patient.daysSinceLastResponse && patient.daysSinceLastResponse >= 3) {
    const signal = CHURN_SIGNALS.no_response_3_days;
    flags.push({ signal: 'no_response_3_days', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  if (patient.paymentStatus === 'failed' || patient.paymentStatus === 'past_due') {
    const signal = CHURN_SIGNALS.payment_failed;
    flags.push({ signal: 'payment_failed', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  if (patient.missedPreviousRefill) {
    const signal = CHURN_SIGNALS.missed_last_refill;
    flags.push({ signal: 'missed_last_refill', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  if (patient.sideEffectsReported) {
    const signal = CHURN_SIGNALS.side_effects_reported;
    flags.push({ signal: 'side_effects_reported', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  if (patient.priceConcern) {
    const signal = CHURN_SIGNALS.price_concern_mentioned;
    flags.push({ signal: 'price_concern_mentioned', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  if (patient.daysSinceWeightUpdate && patient.daysSinceWeightUpdate > 30) {
    const signal = CHURN_SIGNALS.no_weight_update;
    flags.push({ signal: 'no_weight_update', label: signal.label, weight: signal.weight });
    totalScore += signal.weight;
  }

  // Normalize to 0-100
  const normalizedScore = Math.min(100, totalScore);
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (normalizedScore >= 70) level = 'critical';
  else if (normalizedScore >= 50) level = 'high';
  else if (normalizedScore >= 30) level = 'medium';

  return { score: normalizedScore, level, flags };
}

async function generateBatchMessages(
  patients: RefillPatient[]
): Promise<{ patientName: string; message: string; urgency: string }[]> {
  const messages: { patientName: string; message: string; urgency: string }[] = [];

  for (const patient of patients) {
    const firstName = patient.name.split(' ')[0];
    const urgency = categorizeRefillUrgency(patient.daysUntilDue);

    const message = await generateMessage('refill_batch_sms', {
      patientName: firstName,
      medication: patient.medication,
      daysUntilDue: patient.daysUntilDue,
      urgency,
      doseInfo: patient.currentDose,
      monthsActive: patient.monthsActive,
    });

    messages.push({
      patientName: patient.name,
      message,
      urgency,
    });
  }

  return messages;
}

function groupByWindow(patients: RefillPatient[]): Record<string, RefillPatient[]> {
  const grouped: Record<string, RefillPatient[]> = {};

  for (const window of REFILL_WINDOWS) {
    const inWindow = patients.filter(
      (p) =>
        p.daysUntilDue >= window.daysUntilDue[0] &&
        p.daysUntilDue <= window.daysUntilDue[1]
    );
    if (inWindow.length > 0) {
      grouped[window.label] = inWindow;
    }
  }

  return grouped;
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

    const { searchParams } = new URL(request.url);
    const windowDays = parseInt(searchParams.get('window') || '14', 10);

    // Get all patients due for refill within window
    const refillPatients = await getRefillsDue(windowDays);

    // Calculate churn risk for each
    const patientsWithRisk = refillPatients.map((patient) => {
      const churnRisk = calculateChurnRisk(patient);
      return {
        ...patient,
        churnRisk,
      };
    });

    // Sort by urgency: overdue first, then by churn risk
    patientsWithRisk.sort((a, b) => {
      if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
      return b.churnRisk.score - a.churnRisk.score;
    });

    // Group by refill window
    const grouped = groupByWindow(patientsWithRisk);

    // Generate batch messages
    const batchMessages = await generateBatchMessages(patientsWithRisk);

    // Revenue calculations
    const totalExpectedRevenue = patientsWithRisk.reduce(
      (sum, p) => sum + (p.monthlyPrice || 499),
      0
    );

    const atRiskRevenue = patientsWithRisk
      .filter((p) => p.churnRisk.score >= 50)
      .reduce((sum, p) => sum + (p.monthlyPrice || 499), 0);

    const secureRevenue = totalExpectedRevenue - atRiskRevenue;

    // Churn risk summary
    const churnRiskSummary = {
      critical: patientsWithRisk.filter((p) => p.churnRisk.level === 'critical').length,
      high: patientsWithRisk.filter((p) => p.churnRisk.level === 'high').length,
      medium: patientsWithRisk.filter((p) => p.churnRisk.level === 'medium').length,
      low: patientsWithRisk.filter((p) => p.churnRisk.level === 'low').length,
    };

    const result: RefillBatchResult = {
      summary: {
        totalPatients: patientsWithRisk.length,
        totalExpectedRevenue,
        secureRevenue,
        atRiskRevenue,
        windowDays,
        churnRiskSummary,
      },
      byWindow: Object.entries(grouped).map(([label, patients]) => ({
        label,
        count: patients.length,
        revenue: patients.reduce((s, p) => s + (p.monthlyPrice || 499), 0),
        patients: patients.map((p) => ({
          name: p.name,
          medication: p.medication,
          currentDose: p.currentDose,
          monthlyPrice: p.monthlyPrice || 499,
          daysUntilDue: p.daysUntilDue,
          lastCheckIn: p.lastCheckInDate,
          monthsActive: p.monthsActive,
          concerns: p.concerns || [],
          churnRisk: p.churnRisk,
          paymentStatus: p.paymentStatus || 'active',
        })),
      })),
      batchMessages,
      churnRisks: patientsWithRisk
        .filter((p) => p.churnRisk.score >= 30)
        .map((p) => ({
          patientName: p.name,
          score: p.churnRisk.score,
          level: p.churnRisk.level,
          flags: p.churnRisk.flags,
          monthlyRevenue: p.monthlyPrice || 499,
          recommendedAction:
            p.churnRisk.level === 'critical'
              ? 'Immediate phone call from Rina'
              : p.churnRisk.level === 'high'
                ? 'Personal text + follow-up call within 24h'
                : 'Standard refill reminder with extra care',
        })),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/refills] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load refills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
