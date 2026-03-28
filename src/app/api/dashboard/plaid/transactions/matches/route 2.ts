import { NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { findMatches } from '@/lib/plaid/reconciliation';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const storage = await readStorage();

  // Get unmatched transactions
  const unmatched = storage.transactions.filter(
    (tx) => tx.reconciliationStatus === 'unmatched' && !tx.pending
  );

  // For now, we don't have real manual entries stored server-side,
  // so return empty matches. In production, this would query Airtable.
  // The client-side BankMatchSuggestion component handles real-time matching.
  const allMatches = unmatched.flatMap((tx) => {
    return findMatches(tx, []);
  });

  return NextResponse.json({ matches: allMatches });
}
