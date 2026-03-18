import { NextRequest, NextResponse } from 'next/server';
import {
  getIntakeFollowUpTemplate,
  getAllIntakeFollowUpTemplates,
  type IntakeFollowUpVars,
} from '@/lib/templates/intake-followup';

/**
 * POST /api/templates/intake-followup
 *
 * Called by n8n workflow WF2b (No-Booking Follow-Up Ladder) to get rendered
 * SMS and email templates for the intake nurture sequence.
 *
 * Body:
 * {
 *   step: "plan-ready" | "24h-educational" | "72h-urgency" | "7d-social-proof" | "14d-last-chance" | "all",
 *   firstName: string,
 *   treatmentName: string,
 *   treatmentPlan?: string,
 *   costEstimate?: string,
 *   suggestedNextStep?: string,
 *   intakeDate?: string,
 *   concerns?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      step,
      firstName,
      treatmentName,
      treatmentPlan,
      costEstimate,
      suggestedNextStep,
      intakeDate,
      concerns,
    } = body;

    if (!firstName || !treatmentName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, treatmentName' },
        { status: 400 }
      );
    }

    const vars: IntakeFollowUpVars = {
      firstName,
      treatmentName,
      treatmentPlan: treatmentPlan || '',
      costEstimate: costEstimate || 'varies by treatment plan',
      suggestedNextStep: suggestedNextStep || 'Book a complimentary consultation',
      intakeDate: intakeDate || new Date().toLocaleDateString(),
      concerns: concerns || 'your aesthetic goals',
    };

    if (step === 'all') {
      const templates = getAllIntakeFollowUpTemplates(vars);
      return NextResponse.json({ templates });
    }

    const template = getIntakeFollowUpTemplate(step || 'plan-ready', vars);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown step: ${step}. Valid: plan-ready, 24h-educational, 72h-urgency, 7d-social-proof, 14d-last-chance` },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Intake follow-up template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
