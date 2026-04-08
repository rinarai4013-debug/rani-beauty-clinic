import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    agent: {
      id: 'finance-strategist',
      name: 'Finance Strategist',
      focus: 'Liquidity, margin protection, and revenue pacing',
    },
    executivePartner: {
      id: 'ceo-chief-of-staff',
      name: 'CEO Chief of Staff',
      focus: 'Executive prioritization and daily action ranking',
    },
    criticalMoves: [
      'Protect liquidity before expanding spend',
      'Track hero-package margin and financed close quality weekly',
      'Use service-line targets instead of one blended revenue number',
    ],
    priorities: [
      'Protect liquidity before expanding spend',
      'Track hero-package margin and financed close quality weekly',
      'Use service-line targets instead of one blended revenue number',
    ],
  });
}
