import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getCouncilAgent } from '@/lib/dashboard/agent-council';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({
    agent: getCouncilAgent('compliance-guardian'),
    overall: 82,
    categories: {
      hipaa: { score: 88, issues: 2, label: 'HIPAA' },
      osha: { score: 85, issues: 1, label: 'OSHA' },
      licensing: { score: 92, issues: 0, label: 'Licensing' },
      dea: { score: 78, issues: 3, label: 'DEA/Controlled Substances' },
      devices: { score: 80, issues: 2, label: 'Device Compliance' },
      consents: { score: 75, issues: 4, label: 'Consent Management' },
      policies: { score: 85, issues: 1, label: 'Policies' },
      training: { score: 80, issues: 2, label: 'Training' },
    },
    status: 'compliant',
  });
}
