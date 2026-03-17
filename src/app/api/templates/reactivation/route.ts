import { NextRequest, NextResponse } from 'next/server';
import {
  getAutoReactivationTemplate,
  getReactivationTemplate,
  type ReactivationTier,
  type ReactivationVars,
} from '@/lib/templates/reactivation';

/**
 * POST /api/templates/reactivation
 *
 * Called by n8n WF8 (Reactivation Campaigns) to get rendered
 * SMS and email templates for lapsed clients.
 *
 * Body:
 * {
 *   firstName: string,
 *   lastService: string,
 *   daysSinceLastVisit: number,
 *   membershipTier?: string,
 *   ltv: number,
 *   tier?: "lapsed-30" | "lapsed-60" | "lapsed-90"  // optional, auto-detected if not provided
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { firstName, lastService, daysSinceLastVisit, membershipTier, ltv, tier } = body;

    if (!firstName) {
      return NextResponse.json(
        { error: 'Missing required field: firstName' },
        { status: 400 }
      );
    }

    const vars: ReactivationVars = {
      firstName,
      lastService: lastService || 'your last treatment',
      daysSinceLastVisit: daysSinceLastVisit || 30,
      membershipTier,
      ltv: ltv || 0,
    };

    if (tier) {
      const template = getReactivationTemplate(tier as ReactivationTier, vars);
      return NextResponse.json({ tier, ...template });
    }

    const result = getAutoReactivationTemplate(vars);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reactivation template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
