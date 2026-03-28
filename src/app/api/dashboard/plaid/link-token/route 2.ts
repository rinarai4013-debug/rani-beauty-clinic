import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { CountryCode, Products } from 'plaid';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'rani-clinic-ceo' },
      client_name: 'Rani Beauty Clinic',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create link token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
