import { NextRequest } from 'next/server';
import { withSentry } from '@/lib/sentry-utils';
import { createMangomintWebhookHandler } from '../_shared';

const handler = createMangomintWebhookHandler('form-submitted');

export async function POST(request: NextRequest) {
  return withSentry('webhook-mangomint-form-submitted', async () => handler(request));
}
