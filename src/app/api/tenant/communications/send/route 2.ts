import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { sendMessage } from '@/lib/saas/tenant-dashboard/communications';

export const POST = withTenant(async (request: NextRequest, { tenant, db }) => {
  const body = await request.json();
  const { channel, to, subject, body: messageBody, templateId, variables } = body;

  if (!channel || !to || !messageBody) {
    return NextResponse.json({ error: 'channel, to, and body are required' }, { status: 400 });
  }

  const result = await sendMessage(db, tenant, {
    channel,
    to,
    subject,
    body: messageBody,
    templateId,
    variables,
  });

  return NextResponse.json(result);
});
