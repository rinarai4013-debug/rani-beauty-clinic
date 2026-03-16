import { NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { findMatches } from '@/lib/plaid/reconciliation';

export async function GET() {
  const storage = readStorage();

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
