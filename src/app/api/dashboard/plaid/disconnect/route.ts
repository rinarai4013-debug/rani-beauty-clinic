import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { readStorage, clearStorage } from '@/lib/plaid/storage';
import { cache } from '@/lib/cache';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const storage = await readStorage();

  if (storage.accessToken) {
    try {
      await plaidClient.itemRemove({
        access_token: storage.accessToken,
      });
    } catch {
      // Item may already be removed; continue cleanup
    }
  }

  await clearStorage();
  cache.invalidatePrefix('plaid:');

  return NextResponse.json({ success: true });
}
