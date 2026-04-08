import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { AGENT_COUNCIL, getCouncilSnapshot } from '@/lib/dashboard/agent-council';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = getCouncilSnapshot();

  return NextResponse.json({
    headline: snapshot.headline,
    summary: snapshot.summary,
    totalAgents: snapshot.totalAgents,
    criticalMoves: snapshot.criticalMoves,
    easyWins: snapshot.easyWins,
    crownTier: AGENT_COUNCIL.filter((agent) => agent.tier === 'crown'),
    revenueTier: AGENT_COUNCIL.filter((agent) => agent.tier === 'revenue'),
    protectionTier: AGENT_COUNCIL.filter((agent) => agent.tier === 'protection'),
  });
}
