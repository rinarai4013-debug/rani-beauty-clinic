import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { updateStorage } from '@/lib/plaid/storage';

export async function POST(request: NextRequest) {
  try {
    const { publicToken, metadata } = await request.json();

    if (!publicToken) {
      return NextResponse.json({ error: 'Missing publicToken' }, { status: 400 });
    }

    // Exchange public token for access token
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
      institutionName: metadata?.institution?.name || 'Unknown',
      institutionId: metadata?.institution?.institution_id || '',
      lastSynced: new Date().toISOString(),
    }));

    // Store everything
    updateStorage({
      accessToken,
      itemId,
      institutionId: metadata?.institution?.institution_id || null,
      institutionName: metadata?.institution?.name || null,
      accounts,
    });

    return NextResponse.json({
      success: true,
      institutionName: metadata?.institution?.name,
      accountCount: accounts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token exchange failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
