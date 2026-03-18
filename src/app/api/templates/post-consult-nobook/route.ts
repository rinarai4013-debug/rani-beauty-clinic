import { NextRequest, NextResponse } from 'next/server';
import {
  getPostConsultNoBookTemplate,
  getAllPostConsultNoBookTemplates,
  type PostConsultNoBookVars,
} from '@/lib/templates/post-consult-nobook';

/**
 * POST /api/templates/post-consult-nobook
 *
 * Called by n8n workflow W16 (Post-Consult Close) to get rendered
 * SMS and email templates for clients who consulted but didn't book.
 *
 * Body:
 * {
 *   step: "48h-recap-financing" | "5d-results-faq" | "10d-personal-followup" | "all",
 *   firstName: string,
 *   treatmentName: string,
 *   providerName: string,
 *   consultDate?: string,
 *   costEstimate?: string,
 *   monthlyPayment?: string,
 *   concerns?: string,
 *   treatmentPlan?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      step,
      firstName,
      treatmentName,
      providerName,
      consultDate,
      costEstimate,
      monthlyPayment,
      concerns,
      treatmentPlan,
    } = body;

    if (!firstName || !treatmentName || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, treatmentName, providerName' },
        { status: 400 }
      );
    }

    const vars: PostConsultNoBookVars = {
      firstName,
      treatmentName,
      providerName,
      consultDate: consultDate || new Date().toLocaleDateString(),
      costEstimate: costEstimate || 'varies by treatment plan',
      monthlyPayment: monthlyPayment || 'affordable monthly payments',
      concerns: concerns || 'your aesthetic goals',
      treatmentPlan,
    };

    if (step === 'all') {
      const templates = getAllPostConsultNoBookTemplates(vars);
      return NextResponse.json({ templates });
    }

    const template = getPostConsultNoBookTemplate(step || '48h-recap-financing', vars);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown step: ${step}. Valid: 48h-recap-financing, 5d-results-faq, 10d-personal-followup` },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Post-consult no-book template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
