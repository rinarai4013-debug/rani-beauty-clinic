import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    agent: {
      id: 'seo-queen',
      name: 'SEO Queen',
      focus: 'Local search visibility and geo-page growth',
    },
    localSearchFocus: [
      'Service + city pages tied to the hero packages driving the current sprint',
      'Review capture and response loops that build local trust signals',
      'Internal links from educational content into consult and package pages',
    ],
  });
}
