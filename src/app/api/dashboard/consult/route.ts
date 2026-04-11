import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  WAR_ROOM_CONSULT_CLOSE_SYSTEM,
  WAR_ROOM_HERO_PACKAGES,
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
    agent: getCouncilAgent('conversion-duchess'),
    consultSystem: WAR_ROOM_CONSULT_CLOSE_SYSTEM,
    heroPackages: WAR_ROOM_HERO_PACKAGES,
  });
}
