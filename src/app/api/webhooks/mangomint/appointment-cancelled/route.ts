import { NextRequest } from 'next/server';
import { withSentry } from '@/lib/sentry-utils';
import { createMangomintWebhookHandler } from '../_shared';

const handler = createMangomintWebhookHandler('appointment-cancelled');

export async function POST(request: NextRequest) {
  return withSentry('webhook-mangomint-appointment-cancelled', async () => handler(request));
}
