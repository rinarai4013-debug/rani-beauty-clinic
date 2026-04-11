import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getCouncilAgent } from '@/lib/dashboard/agent-council';

type Params = {
  params: { agentId: string };
};

const paramsSchema = z.object({
  params: z.object({
    agentId: z.string().trim().min(1),
  }),
});

export async function GET(_request: NextRequest, { params }: Params) {
  const parsedParams = paramsSchema.safeParse({ params });
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid agentId' }, { status: 400 });
  }

  const { agentId } = parsedParams.data.params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agent = getCouncilAgent(agentId);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (!hasPermission(session.role, agent.permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(agent);
}
