import { NextRequest, NextResponse } from 'next/server';
import { readStorage, updateStorage } from '@/lib/plaid/storage';
import { cache } from '@/lib/cache';
import type { ReconciliationStatus, RaniExpenseCategory } from '@/types/plaid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const storage = readStorage();

  const txIndex = storage.transactions.findIndex((tx) => tx.id === id);
  if (txIndex === -1) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const tx = { ...storage.transactions[txIndex] };

  if ('action' in body && body.action === 'exclude') {
    // Exclude from tracking
    tx.reconciliationStatus = 'excluded' as ReconciliationStatus;
    tx.matchedEntryId = null;
    tx.matchedEntryType = null;
  } else if ('entryId' in body && 'entryType' in body) {
    // Match to a manual entry
    tx.reconciliationStatus = 'manually-matched' as ReconciliationStatus;
    tx.matchedEntryId = body.entryId;
    tx.matchedEntryType = body.entryType;

    // Store reconciliation
    storage.reconciliations[id] = {
      entryId: body.entryId,
      entryType: body.entryType,
    };
  } else if ('category' in body) {
    // Re-categorize
    tx.raniCategory = body.category as RaniExpenseCategory;
    tx.reconciliationStatus = 'categorized' as ReconciliationStatus;
  } else {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const transactions = [...storage.transactions];
  transactions[txIndex] = tx;

  updateStorage({ transactions, reconciliations: storage.reconciliations });
  cache.invalidatePrefix('plaid:');

  return NextResponse.json({ success: true, transaction: tx });
}
