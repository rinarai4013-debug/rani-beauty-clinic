import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { readStorage, clearStorage } from '@/lib/plaid/storage';
import { cache } from '@/lib/cache';

export async function POST() {
  const storage = readStorage();

  if (storage.accessToken) {
    try {
      await plaidClient.itemRemove({
        access_token: storage.accessToken,
      });
    } catch {
      // Item may already be removed; continue cleanup
    }
  }

  clearStorage();
  cache.invalidatePrefix('plaid:');

  return NextResponse.json({ success: true });
}
