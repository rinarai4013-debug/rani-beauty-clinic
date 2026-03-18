import { NextRequest, NextResponse } from 'next/server';
import {
  getMembershipPitchTemplate,
  getAllMembershipPitchTemplates,
  type MembershipPitchVars,
} from '@/lib/templates/membership-pitch';

/**
 * POST /api/templates/membership-pitch
 *
 * Called by n8n workflow WF7 (Membership Engine) to get rendered
 * SMS and email templates for the Angel Glow Up membership upsell.
 *
 * Body:
 * {
 *   step: "intro-savings" | "3d-perks" | "7d-urgency" | "all",
 *   firstName: string,
 *   totalVisits: number,
 *   totalSpent?: string,
 *   potentialSavings?: string,
 *   favoriteService?: string,
 *   providerName: string,
 *   membershipPrice?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      step,
      firstName,
      totalVisits,
      totalSpent,
      potentialSavings,
      favoriteService,
      providerName,
      membershipPrice,
    } = body;

    if (!firstName || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, providerName' },
        { status: 400 }
      );
    }

    const vars: MembershipPitchVars = {
      firstName,
      totalVisits: totalVisits || 0,
      totalSpent: totalSpent || '$0',
      potentialSavings: potentialSavings || 'significant savings',
      favoriteService: favoriteService || 'your favorite treatment',
      providerName,
      membershipPrice: membershipPrice || '$199/mo',
    };

    if (step === 'all') {
      const templates = getAllMembershipPitchTemplates(vars);
      return NextResponse.json({ templates });
    }

    const template = getMembershipPitchTemplate(step || 'intro-savings', vars);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown step: ${step}. Valid: intro-savings, 3d-perks, 7d-urgency` },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Membership pitch template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
