import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { updateStorage } from '@/lib/plaid/storage';
import { Products, CountryCode } from 'plaid';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

/**
 * POST /api/dashboard/plaid/sandbox-connect
 * Sandbox-only: creates a test institution connection without going through Link UI.
 * Uses Plaid's sandbox/public_token/create endpoint.
 * DELETE THIS ROUTE BEFORE GOING TO PRODUCTION.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (process.env.PLAID_ENV !== 'sandbox') {
    return NextResponse.json({ error: 'Only available in sandbox mode' }, { status: 403 });
  }

  try {
    // Create a sandbox public token for Chase (ins_109508) with Transactions
    const sandboxResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508',
      initial_products: [Products.Transactions],
      options: {
        override_username: 'user_good',
        override_password: 'pass_good',
      },
    });

    const publicToken = sandboxResponse.data.public_token;

    // Exchange for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts.map((acc) => ({
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
      institutionName: 'Chase',
      institutionId: 'ins_109508',
      lastSynced: new Date().toISOString(),
    }));

    // Store (encrypted in Airtable)
    await updateStorage({
      accessToken,
      itemId,
      institutionId: 'ins_109508',
      institutionName: 'Chase',
      accounts,
    });

    return NextResponse.json({
      success: true,
      institutionName: 'Chase',
      accountCount: accounts.length,
      accounts: accounts.map(a => ({ name: a.name, type: a.type, mask: a.mask })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sandbox connect failed';
    console.error('Sandbox connect error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
