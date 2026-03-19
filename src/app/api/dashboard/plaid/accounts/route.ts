import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { readStorage, updateStorage } from '@/lib/plaid/storage';
import { cache, TTL } from '@/lib/cache';
import type { PlaidAccount, PlaidConnectionState } from '@/types/plaid';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const storage = await readStorage();

  if (!storage.accessToken) {
    const connection: PlaidConnectionState = {
      isConnected: false,
      institutionName: null,
      institutionId: null,
      accountCount: 0,
      lastSync: null,
      syncStatus: 'idle',
      errorMessage: null,
    };
    return NextResponse.json({ accounts: [], connection });
  }

  // Check cache first
  const cacheKey = 'plaid:accounts';
  const cached = cache.get<PlaidAccount[]>(cacheKey);

  let accounts: PlaidAccount[];

  if (cached) {
    accounts = cached;
  } else {
    try {
      const response = await plaidClient.accountsGet({
        access_token: storage.accessToken,
      });

      accounts = response.data.accounts.map((acc) => ({
        id: acc.account_id,
        name: acc.name,
        officialName: acc.official_name,
        type: acc.type as 'depository' | 'credit' | 'loan' | 'investment' | 'other',
        subtype: acc.subtype,
        mask: acc.mask,
        balances: {
          available: acc.balances.available,
          current: acc.balances.current,
          limit: acc.balances.limit,
          isoCurrencyCode: acc.balances.iso_currency_code,
        },
        institutionName: storage.institutionName || 'Unknown',
        institutionId: storage.institutionId || '',
        lastSynced: new Date().toISOString(),
      }));

      cache.set(cacheKey, accounts, TTL.RELAXED);
      await updateStorage({ accounts });
    } catch {
      // Fall back to stored accounts
      accounts = storage.accounts;
    }
  }

  const connection: PlaidConnectionState = {
    isConnected: true,
    institutionName: storage.institutionName,
    institutionId: storage.institutionId,
    accountCount: accounts.length,
    lastSync: storage.lastSyncedAt,
    syncStatus: 'idle',
    errorMessage: null,
  };

  return NextResponse.json({ accounts, connection });
}
