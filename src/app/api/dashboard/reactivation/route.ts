import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  WAR_ROOM_OVERDUE_CLIENTS,
  WAR_ROOM_REACTIVATION_CAMPAIGNS,
} from '@/lib/dashboard/war-room';
import { getCouncilAgent } from '@/lib/dashboard/agent-council';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    agent: getCouncilAgent('retention-empress'),
    campaigns: WAR_ROOM_REACTIVATION_CAMPAIGNS,
    overdueClients: WAR_ROOM_OVERDUE_CLIENTS,
    totalEstimatedRecovery: WAR_ROOM_REACTIVATION_CAMPAIGNS.reduce(
      (sum, campaign) => sum + campaign.totalEstimatedRecovery,
      0,
    ),
  });
}
