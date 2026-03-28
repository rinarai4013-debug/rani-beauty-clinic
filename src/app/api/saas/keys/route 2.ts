import { NextRequest, NextResponse } from 'next/server';
import {
  generateApiKey, validateApiKey, revokeKey, rotateKey,
  getKeysByTenant, getKeyById, getKeyUsage, getKeyAuditLog,
  generateWebhookSigningKey, getWebhookKeysByTenant,
  CreateKeySchema,
} from '@/lib/saas/api-gateway/keys';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const tenantId = searchParams.get('tenantId') || '';
  const keyId = searchParams.get('keyId') || '';

  switch (action) {
    case 'list':
      return NextResponse.json({ keys: getKeysByTenant(tenantId) });
    case 'detail':
      return NextResponse.json({ key: getKeyById(keyId) });
    case 'usage':
      return NextResponse.json(getKeyUsage(keyId, parseInt(searchParams.get('days') || '7')));
    case 'audit':
      return NextResponse.json({ entries: getKeyAuditLog({ tenantId }) });
    case 'webhook':
      return NextResponse.json({ keys: getWebhookKeysByTenant(tenantId) });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'create';

    switch (action) {
      case 'create': {
        const parsed = CreateKeySchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const result = generateApiKey(parsed.data);
        return NextResponse.json({ key: result.key, plainTextKey: result.plainTextKey }, { status: 201 });
      }
      case 'validate': {
        const result = validateApiKey(body.apiKey, body.requiredScopes, body.ip);
        return NextResponse.json(result);
      }
      case 'revoke': {
        const success = revokeKey(body.keyId, body.performedBy, body.reason);
        return NextResponse.json({ success });
      }
      case 'rotate': {
        const result = rotateKey(body.keyId, body.performedBy, body.gracePeriodMs);
        if (!result) return NextResponse.json({ error: 'Key not found or not active' }, { status: 404 });
        return NextResponse.json({ key: result.newKey, plainTextKey: result.plainTextKey });
      }
      case 'webhook_key': {
        const key = generateWebhookSigningKey(body.tenantId);
        return NextResponse.json({ key }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
