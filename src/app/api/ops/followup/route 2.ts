import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { generateMessage } from '@/lib/medical/voice-engine';
import { getPatientByName } from '@/lib/medical/glp1-pipeline';
import { getDoseInfo } from '@/lib/medical/dose-tracker';
import type { PipelineStage, FollowUpResult, MessagePair } from '@/lib/medical/types';

/**
 * POST /api/ops/followup
 *
 * The /followup command: generates stage-appropriate follow-up messages for a patient.
 * Accepts patient name + pipeline stage, returns SMS + email versions using Rina's voice.
 */

// Pipeline stage SLAs (max days before escalation)
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

// Stage display names
const STAGE_LABELS: Record<PipelineStage, string> = {
  PIPELINE_NEW: 'New in Pipeline',
  LABS_NEEDED: 'Labs Needed',
  GFE_PENDING: 'GFE Pending',
  RX_APPROVED: 'Rx Approved',
  MED_SHIPPED: 'Medication Shipped',
  ACTIVE_FIRST_DOSE: 'First Dose',
  ACTIVE_WEEK_1: 'Week 1 Check-in',
  ACTIVE_WEEK_2_3: 'Week 2-3 Progress',
  ACTIVE_MONTH_1: 'Month 1 Review',
  REFILL_DUE: 'Refill Due',
  AT_RISK: 'At Risk',
  WIN_BACK: 'Win Back',
};

// Urgency levels for follow-up escalation
interface EscalationLevel {
  day: number;
  label: string;
  urgency: 'standard' | 'nudge' | 'escalation' | 'critical';
  tone: string;
}

const LABS_ESCALATION: EscalationLevel[] = [
  { day: 1, label: 'Day 1 - Friendly Reminder', urgency: 'standard', tone: 'warm_encouraging' },
  { day: 3, label: 'Day 3 - Nudge', urgency: 'nudge', tone: 'supportive_urgent' },
  { day: 5, label: 'Day 5 - Escalation', urgency: 'escalation', tone: 'direct_concerned' },
];

const REFILL_ESCALATION: EscalationLevel[] = [
  { day: 0, label: 'Refill Due Today', urgency: 'standard', tone: 'warm_proactive' },
  { day: 3, label: 'Day 3 - Nudge', urgency: 'nudge', tone: 'supportive_urgent' },
  { day: 5, label: 'Day 5 - AT-RISK', urgency: 'critical', tone: 'direct_concerned' },
];

const WIN_BACK_SEQUENCE = [
  { day: 30, label: '30-Day Check-in', tone: 'warm_nostalgic' },
  { day: 60, label: '60-Day Re-engagement', tone: 'value_focused' },
  { day: 90, label: '90-Day Final Reach', tone: 'direct_offer' },
];

interface FollowUpRequestBody {
  patientName: string;
  stage: PipelineStage;
  dayInStage?: number;
  medication?: string;
  doseNumber?: number;
  customContext?: string;
}

async function generateStageMessages(
  body: FollowUpRequestBody
): Promise<{
  sms: string;
  email: string;
  subject: string;
  internalNote: string;
  urgency: string;
  nextAction: string;
  nextActionDate: string;
}> {
  const { patientName, stage, dayInStage = 0, medication, doseNumber } = body;
  const firstName = patientName.split(' ')[0];

  switch (stage) {
    case 'PIPELINE_NEW': {
      const sms = await generateMessage('pipeline_new_sms', {
        patientName: firstName,
      });
      const email = await generateMessage('pipeline_new_email', {
        patientName: firstName,
        fullName: patientName,
      });
      return {
        sms,
        email,
        subject: `Welcome to Rani Beauty Clinic, ${firstName}!`,
        internalNote: `New patient ${patientName} entered pipeline. Welcome sequence initiated.`,
        urgency: 'standard',
        nextAction: 'Send lab order',
        nextActionDate: addDays(0),
      };
    }

    case 'LABS_NEEDED': {
      const escalation = LABS_ESCALATION.find((e) => e.day >= dayInStage) || LABS_ESCALATION[LABS_ESCALATION.length - 1];
      const sms = await generateMessage('labs_needed_sms', {
        patientName: firstName,
        urgency: escalation.urgency,
        tone: escalation.tone,
        dayInStage,
      });
      const email = await generateMessage('labs_needed_email', {
        patientName: firstName,
        fullName: patientName,
        urgency: escalation.urgency,
        tone: escalation.tone,
        dayInStage,
      });
      return {
        sms,
        email,
        subject: dayInStage >= 5
          ? `${firstName}, your labs are needed to move forward`
          : `Quick reminder about your labs, ${firstName}`,
        internalNote: `Lab reminder ${escalation.label} sent to ${patientName}. ${escalation.urgency === 'escalation' ? 'ESCALATION: Consider phone call.' : ''}`,
        urgency: escalation.urgency,
        nextAction: escalation.urgency === 'escalation' ? 'Phone call from Rina' : 'Wait for lab results',
        nextActionDate: escalation.urgency === 'escalation' ? addDays(0) : addDays(2),
      };
    }

    case 'GFE_PENDING': {
      const sms = await generateMessage('gfe_pending_sms', {
        patientName: firstName,
        dayInStage,
      });
      const email = await generateMessage('gfe_pending_email', {
        patientName: firstName,
        fullName: patientName,
        dayInStage,
      });
      return {
        sms,
        email,
        subject: `Your medical evaluation is ready, ${firstName}`,
        internalNote: `GFE completion reminder sent to ${patientName}. Day ${dayInStage} in stage.`,
        urgency: dayInStage >= 3 ? 'nudge' : 'standard',
        nextAction: 'Check Qualiphy for completion',
        nextActionDate: addDays(1),
      };
    }

    case 'RX_APPROVED': {
      const sms = await generateMessage('rx_approved_sms', {
        patientName: firstName,
        medication: medication || 'your medication',
      });
      const email = await generateMessage('rx_approved_email', {
        patientName: firstName,
        fullName: patientName,
        medication: medication || 'your prescribed medication',
      });
      return {
        sms,
        email,
        subject: `Great news, ${firstName}! Your prescription is approved`,
        internalNote: `Rx approval notification sent to ${patientName}. Medication: ${medication || 'TBD'}. Shipping initiated.`,
        urgency: 'standard',
        nextAction: 'Confirm shipment tracking',
        nextActionDate: addDays(1),
      };
    }

    case 'MED_SHIPPED': {
      const sms = await generateMessage('med_shipped_sms', {
        patientName: firstName,
        medication: medication || 'your medication',
      });
      const email = await generateMessage('med_shipped_email', {
        patientName: firstName,
        fullName: patientName,
        medication: medication || 'your medication',
      });
      return {
        sms,
        email,
        subject: `Your medication is on its way, ${firstName}!`,
        internalNote: `Shipping notification sent to ${patientName}. Expected delivery: 3-5 business days.`,
        urgency: 'standard',
        nextAction: 'Confirm delivery + schedule first dose call',
        nextActionDate: addDays(4),
      };
    }

    case 'ACTIVE_FIRST_DOSE': {
      const doseInfo = await getDoseInfo({
        patientName,
        medication: medication || 'semaglutide',
        doseNumber: 1,
      });
      const sms = await generateMessage('first_dose_sms', {
        patientName: firstName,
        medication: medication || 'your medication',
        doseInstructions: doseInfo?.instructions || '',
      });
      const email = await generateMessage('first_dose_email', {
        patientName: firstName,
        fullName: patientName,
        medication: medication || 'your medication',
        doseInstructions: doseInfo?.instructions || '',
        sideEffects: doseInfo?.commonSideEffects || [],
      });
      return {
        sms,
        email,
        subject: `Your injection guide, ${firstName}`,
        internalNote: `First dose instructions sent to ${patientName}. Injection guide + side effects info included.`,
        urgency: 'standard',
        nextAction: 'Week 1 check-in',
        nextActionDate: addDays(7),
      };
    }

    case 'ACTIVE_WEEK_1': {
      const sms = await generateMessage('week1_checkin_sms', {
        patientName: firstName,
      });
      const email = await generateMessage('week1_checkin_email', {
        patientName: firstName,
        fullName: patientName,
      });
      return {
        sms,
        email,
        subject: `How's your first week going, ${firstName}?`,
        internalNote: `Week 1 side effects check-in sent to ${patientName}. Watch for adverse reactions.`,
        urgency: 'standard',
        nextAction: 'Review patient response + Week 2 check-in',
        nextActionDate: addDays(7),
      };
    }

    case 'ACTIVE_WEEK_2_3': {
      const sms = await generateMessage('week2_3_progress_sms', {
        patientName: firstName,
        doseNumber: doseNumber || 2,
      });
      const email = await generateMessage('week2_3_progress_email', {
        patientName: firstName,
        fullName: patientName,
        doseNumber: doseNumber || 2,
      });
      return {
        sms,
        email,
        subject: `Progress check: How are you feeling, ${firstName}?`,
        internalNote: `Week 2-3 progress check sent to ${patientName}. Dose #${doseNumber || 2}.`,
        urgency: 'standard',
        nextAction: 'Month 1 review',
        nextActionDate: addDays(14),
      };
    }

    case 'ACTIVE_MONTH_1': {
      const sms = await generateMessage('month1_review_sms', {
        patientName: firstName,
      });
      const email = await generateMessage('month1_review_email', {
        patientName: firstName,
        fullName: patientName,
        medication: medication || 'your medication',
      });
      return {
        sms,
        email,
        subject: `One month in - let's celebrate your progress, ${firstName}!`,
        internalNote: `Month 1 review sent to ${patientName}. Review results + discuss titration if needed.`,
        urgency: 'standard',
        nextAction: 'Schedule titration review if needed',
        nextActionDate: addDays(7),
      };
    }

    case 'REFILL_DUE': {
      const escalation = REFILL_ESCALATION.find((e) => e.day >= dayInStage) || REFILL_ESCALATION[REFILL_ESCALATION.length - 1];
      const sms = await generateMessage('refill_due_sms', {
        patientName: firstName,
        medication: medication || 'your medication',
        urgency: escalation.urgency,
        tone: escalation.tone,
      });
      const email = await generateMessage('refill_due_email', {
        patientName: firstName,
        fullName: patientName,
        medication: medication || 'your medication',
        urgency: escalation.urgency,
        tone: escalation.tone,
      });
      return {
        sms,
        email,
        subject: dayInStage >= 5
          ? `${firstName}, don't let your progress slip - refill needed`
          : `Time to refill, ${firstName}!`,
        internalNote: `Refill reminder ${escalation.label} sent to ${patientName}. ${escalation.urgency === 'critical' ? 'AT-RISK FLAG: Move to AT_RISK if no response in 48h.' : ''}`,
        urgency: escalation.urgency,
        nextAction: escalation.urgency === 'critical' ? 'Phone call from Rina + move to AT_RISK' : 'Wait for refill confirmation',
        nextActionDate: escalation.urgency === 'critical' ? addDays(0) : addDays(2),
      };
    }

    case 'AT_RISK': {
      const sms = await generateMessage('at_risk_sms', {
        patientName: firstName,
      });
      const email = await generateMessage('at_risk_email', {
        patientName: firstName,
        fullName: patientName,
      });
      return {
        sms,
        email,
        subject: `We miss you, ${firstName} - checking in`,
        internalNote: `AT-RISK: Soft re-engagement sent to ${patientName}. If no response in 7 days, move to WIN_BACK.`,
        urgency: 'critical',
        nextAction: 'Personal phone call from Rina',
        nextActionDate: addDays(2),
      };
    }

    case 'WIN_BACK': {
      const sequence = WIN_BACK_SEQUENCE.find((s) => s.day >= dayInStage) || WIN_BACK_SEQUENCE[WIN_BACK_SEQUENCE.length - 1];
      const sms = await generateMessage('win_back_sms', {
        patientName: firstName,
        sequenceDay: sequence.day,
        tone: sequence.tone,
      });
      const email = await generateMessage('win_back_email', {
        patientName: firstName,
        fullName: patientName,
        sequenceDay: sequence.day,
        tone: sequence.tone,
      });
      return {
        sms,
        email,
        subject: sequence.day <= 30
          ? `${firstName}, your wellness journey doesn't have to pause`
          : sequence.day <= 60
            ? `A special opportunity for you, ${firstName}`
            : `We'd love to welcome you back, ${firstName}`,
        internalNote: `WIN-BACK ${sequence.label} sent to ${patientName}. Tone: ${sequence.tone}. ${sequence.day >= 90 ? 'Final reach - archive if no response.' : ''}`,
        urgency: sequence.day >= 60 ? 'critical' : 'nudge',
        nextAction: sequence.day >= 90 ? 'Archive if no response' : `Send ${sequence.day + 30}-day follow-up`,
        nextActionDate: addDays(sequence.day >= 90 ? 14 : 30),
      };
    }

    default: {
      const _exhaustive: never = stage;
      throw new Error(`Unknown pipeline stage: ${stage}`);
    }
  }
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
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

    const body: FollowUpRequestBody = await request.json();

    if (!body.patientName || !body.stage) {
      return NextResponse.json(
        { error: 'Missing required fields: patientName, stage' },
        { status: 400 }
      );
    }

    const validStages: PipelineStage[] = [
      'PIPELINE_NEW', 'LABS_NEEDED', 'GFE_PENDING', 'RX_APPROVED',
      'MED_SHIPPED', 'ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3',
      'ACTIVE_MONTH_1', 'REFILL_DUE', 'AT_RISK', 'WIN_BACK',
    ];

    if (!validStages.includes(body.stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Valid stages: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Look up patient for context
    const patient = await getPatientByName(body.patientName);

    // Generate stage-appropriate messages
    const messages = await generateStageMessages({
      ...body,
      medication: body.medication || patient?.medication,
      doseNumber: body.doseNumber || patient?.currentDoseNumber,
    });

    const result: FollowUpResult = {
      patient: {
        name: body.patientName,
        stage: body.stage,
        stageLabel: STAGE_LABELS[body.stage],
        dayInStage: body.dayInStage || 0,
        slaMax: STAGE_SLAS[body.stage],
        slaStatus: (body.dayInStage || 0) > STAGE_SLAS[body.stage] ? 'overdue' : 'on_track',
      },
      messages: {
        sms: messages.sms,
        email: messages.email,
        emailSubject: messages.subject,
      },
      internal: {
        note: messages.internalNote,
        urgency: messages.urgency,
        nextAction: messages.nextAction,
        nextActionDate: messages.nextActionDate,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        voiceProfile: 'rina',
        stage: body.stage,
        escalationLevel: messages.urgency,
      },
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[/api/ops/followup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
