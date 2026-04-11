import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getCouncilAgent, getCouncilSnapshot } from '@/lib/dashboard/agent-council';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = getCouncilSnapshot();

  return NextResponse.json({
    agent: getCouncilAgent('finance-strategist'),
    executivePartner: getCouncilAgent('ceo-chief-of-staff'),
    criticalMoves: snapshot.criticalMoves.slice(0, 3),
    priorities: [
      'Protect liquidity before expanding spend',
      'Track hero-package margin and financed close quality weekly',
      'Use service-line targets instead of one blended revenue number',
    ],
  });
}
