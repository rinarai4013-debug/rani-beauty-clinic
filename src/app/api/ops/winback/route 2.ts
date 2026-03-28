import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getAllPipelinePatients, getPatientByName } from '@/lib/medical/glp1-pipeline';
import { generateMessage } from '@/lib/medical/voice-engine';
import type {
  PipelinePatient,
  WinBackSequence,
  WinBackTouch,
  WinBackResult,
} from '@/lib/medical/types';

/**
 * POST /api/ops/winback
 *
 * The /winback command: generates re-engagement sequences for inactive patients.
 * Single patient: 3-touch sequence (text, email, text) spaced 3 days apart.
 * "All": lists all 30+ day inactive patients by LTV, generates sequences, calculates recovery.
 */

// Recovery probability by days inactive
const RECOVERY_RATES: Record<string, number> = {
  '30': 0.60,
  '45': 0.45,
  '60': 0.35,
  '75': 0.25,
  '90': 0.15,
  '120': 0.08,
};

function getRecoveryRate(daysInactive: number): number {
  if (daysInactive <= 30) return 0.60;
  if (daysInactive <= 45) return 0.45;
  if (daysInactive <= 60) return 0.35;
  if (daysInactive <= 75) return 0.25;
  if (daysInactive <= 90) return 0.15;
  return 0.08;
}

// Win-back tier based on days inactive
function getWinBackTier(daysInactive: number): '30_day' | '60_day' | '90_day' {
  if (daysInactive <= 45) return '30_day';
  if (daysInactive <= 75) return '60_day';
  return '90_day';
}

// Tone profiles for each tier
const TIER_TONES: Record<string, { touch1: string; touch2: string; touch3: string }> = {
  '30_day': {
    touch1: 'warm_check_in',       // Soft, caring, no pressure
    touch2: 'value_reminder',      // Remind them of progress + what they're missing
    touch3: 'gentle_incentive',    // Offer to make it easy to come back
  },
  '60_day': {
    touch1: 'we_miss_you',         // More emotional, reference their journey
    touch2: 'results_focused',     // Show what other patients are achieving
    touch3: 'special_offer',       // Make a compelling offer to return
  },
  '90_day': {
    touch1: 'fresh_start',         // New beginning angle
    touch2: 'testimonial_driven',  // Social proof from similar patients
    touch3: 'final_reach',         // Direct, honest, last attempt
  },
};

async function generateTouchSequence(
  patient: PipelinePatient,
  daysInactive: number
): Promise<WinBackTouch[]> {
  const tier = getWinBackTier(daysInactive);
  const tones = TIER_TONES[tier];
  const firstName = patient.name.split(' ')[0];

  const context = {
    patientName: firstName,
    fullName: patient.name,
    medication: patient.medication || 'your program',
    monthsActive: patient.monthsActive || 0,
    lastKnownWeight: patient.lastWeight || null,
    daysInactive,
    ltv: patient.ltv || 0,
    tier,
  };

  // Touch 1: SMS (Day 0)
  const touch1Sms = await generateMessage('winback_touch1_sms', {
    ...context,
    tone: tones.touch1,
  });

  // Touch 2: Email (Day 3)
  const touch2Email = await generateMessage('winback_touch2_email', {
    ...context,
    tone: tones.touch2,
  });
  const touch2Subject = await generateMessage('winback_touch2_subject', {
    ...context,
    tone: tones.touch2,
  });

  // Touch 3: SMS (Day 6)
  const touch3Sms = await generateMessage('winback_touch3_sms', {
    ...context,
    tone: tones.touch3,
  });

  return [
    {
      touchNumber: 1,
      channel: 'sms',
      scheduledDay: 0,
      tone: tones.touch1,
      message: touch1Sms,
      subject: null,
    },
    {
      touchNumber: 2,
      channel: 'email',
      scheduledDay: 3,
      tone: tones.touch2,
      message: touch2Email,
      subject: touch2Subject,
    },
    {
      touchNumber: 3,
      channel: 'sms',
      scheduledDay: 6,
      tone: tones.touch3,
      message: touch3Sms,
      subject: null,
    },
  ];
}

function calculateRecoveryEstimate(
  patient: PipelinePatient,
  daysInactive: number
): {
  monthlyValue: number;
  sixMonthValue: number;
  probability: number;
  expectedValue: number;
} {
  const monthlyValue = patient.monthlyValue || 499;
  const probability = getRecoveryRate(daysInactive);
  const sixMonthValue = monthlyValue * 6;

  return {
    monthlyValue,
    sixMonthValue,
    probability,
    expectedValue: Math.round(sixMonthValue * probability),
  };
}

async function processSinglePatient(
  patientName: string
): Promise<WinBackSequence | null> {
  const patient = await getPatientByName(patientName);
  if (!patient) return null;

  const daysInactive = patient.lastActiveDate
    ? Math.floor(
        (Date.now() - new Date(patient.lastActiveDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 30;

  const touches = await generateTouchSequence(patient, daysInactive);
  const recovery = calculateRecoveryEstimate(patient, daysInactive);

  return {
    patient: {
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone || '',
      medication: patient.medication || 'Unknown',
      lastActiveDate: patient.lastActiveDate || 'Unknown',
      daysInactive,
      ltv: patient.ltv || 0,
      tier: getWinBackTier(daysInactive),
    },
    touches,
    recovery,
    recommendedApproach:
      daysInactive <= 45
        ? 'Warm personal check-in. This patient is still warm and likely to respond to genuine care.'
        : daysInactive <= 75
          ? 'Value-focused outreach. Remind them of their progress and what other patients are achieving.'
          : 'Fresh start positioning. Acknowledge the gap without guilt. Make returning feel easy and judgment-free.',
    internalNotes: [
      `Last active: ${daysInactive} days ago`,
      `LTV to date: $${patient.ltv || 0}`,
      `Recovery probability: ${Math.round(recovery.probability * 100)}%`,
      `Expected recovery value: $${recovery.expectedValue}`,
      daysInactive > 60 ? 'Consider phone call from Rina after Touch 1' : '',
    ].filter(Boolean),
  };
}

async function processAllInactive(
  patients: PipelinePatient[]
): Promise<{
  sequences: WinBackSequence[];
  totalRecoveryPotential: number;
  byTier: Record<string, { count: number; revenue: number; avgProbability: number }>;
}> {
  const inactivePatients = patients.filter((p) => {
    if (!['AT_RISK', 'WIN_BACK'].includes(p.stage)) return false;
    const daysInactive = p.lastActiveDate
      ? Math.floor(
          (Date.now() - new Date(p.lastActiveDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 30;
    return daysInactive >= 30;
  });

  // Sort by LTV descending
  inactivePatients.sort((a, b) => (b.ltv || 0) - (a.ltv || 0));

  const sequences: WinBackSequence[] = [];
  let totalRecoveryPotential = 0;

  const tierStats: Record<string, { count: number; revenue: number; probabilities: number[] }> = {
    '30_day': { count: 0, revenue: 0, probabilities: [] },
    '60_day': { count: 0, revenue: 0, probabilities: [] },
    '90_day': { count: 0, revenue: 0, probabilities: [] },
  };

  for (const patient of inactivePatients) {
    const daysInactive = patient.lastActiveDate
      ? Math.floor(
          (Date.now() - new Date(patient.lastActiveDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 30;

    const touches = await generateTouchSequence(patient, daysInactive);
    const recovery = calculateRecoveryEstimate(patient, daysInactive);
    const tier = getWinBackTier(daysInactive);

    tierStats[tier].count++;
    tierStats[tier].revenue += recovery.expectedValue;
    tierStats[tier].probabilities.push(recovery.probability);
    totalRecoveryPotential += recovery.expectedValue;

    sequences.push({
      patient: {
        name: patient.name,
        email: patient.email || '',
        phone: patient.phone || '',
        medication: patient.medication || 'Unknown',
        lastActiveDate: patient.lastActiveDate || 'Unknown',
        daysInactive,
        ltv: patient.ltv || 0,
        tier,
      },
      touches,
      recovery,
      recommendedApproach:
        daysInactive <= 45
          ? 'Warm personal check-in'
          : daysInactive <= 75
            ? 'Value-focused outreach'
            : 'Fresh start positioning',
      internalNotes: [
        `LTV: $${patient.ltv || 0}`,
        `Recovery: $${recovery.expectedValue} (${Math.round(recovery.probability * 100)}%)`,
      ],
    });
  }

  const byTier = Object.fromEntries(
    Object.entries(tierStats).map(([tier, stats]) => [
      tier,
      {
        count: stats.count,
        revenue: Math.round(stats.revenue),
        avgProbability:
          stats.probabilities.length > 0
            ? stats.probabilities.reduce((s, p) => s + p, 0) / stats.probabilities.length
            : 0,
      },
    ])
  );

  return {
    sequences,
    totalRecoveryPotential: Math.round(totalRecoveryPotential),
    byTier,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { patientName } = body as { patientName: string };

    if (!patientName) {
      return NextResponse.json(
        { error: 'Missing required field: patientName (use "all" for batch processing)' },
        { status: 400 }
      );
    }

    if (patientName.toLowerCase() === 'all') {
      // Batch mode: all inactive patients
      const allPatients = await getAllPipelinePatients();
      const batchResult = await processAllInactive(allPatients);

      const result: WinBackResult = {
        mode: 'batch',
        summary: {
          totalInactivePatients: batchResult.sequences.length,
          totalRecoveryPotential: batchResult.totalRecoveryPotential,
          byTier: batchResult.byTier,
          totalTouches: batchResult.sequences.length * 3,
          estimatedMinutes: batchResult.sequences.length * 5,
        },
        sequences: batchResult.sequences,
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: result });
    } else {
      // Single patient mode
      const sequence = await processSinglePatient(patientName);

      if (!sequence) {
        return NextResponse.json(
          { error: `Patient not found: ${patientName}` },
          { status: 404 }
        );
      }

      const result: WinBackResult = {
        mode: 'single',
        summary: {
          totalInactivePatients: 1,
          totalRecoveryPotential: sequence.recovery.expectedValue,
          byTier: {
            [sequence.patient.tier]: {
              count: 1,
              revenue: sequence.recovery.expectedValue,
              avgProbability: sequence.recovery.probability,
            },
          },
          totalTouches: 3,
          estimatedMinutes: 5,
        },
        sequences: [sequence],
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: result });
    }
  } catch (error) {
    console.error('[/api/ops/winback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate win-back sequences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
