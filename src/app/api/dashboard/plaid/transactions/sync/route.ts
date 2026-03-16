import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { readStorage, updateStorage } from '@/lib/plaid/storage';
import { categorizeTransaction } from '@/lib/plaid/categories';
import { cache } from '@/lib/cache';
import type { PlaidTransaction } from '@/types/plaid';
import type { RemovedTransaction, TransactionsSyncRequestOptions } from 'plaid';

export async function POST() {
  const storage = readStorage();

  if (!storage.accessToken) {
    return NextResponse.json({ error: 'Not connected' }, { status: 400 });
  }

  try {
    let cursor = storage.cursor;
    let addedRaw: PlaidTransaction[] = [];
    const modifiedIds: string[] = [];
    const removedIds: string[] = [];
    let hasMore = true;

    while (hasMore) {
      const options: TransactionsSyncRequestOptions = {};
      const response = await plaidClient.transactionsSync({
        access_token: storage.accessToken,
        cursor: cursor || undefined,
        options,
      });

      // Transform added transactions
      for (const tx of response.data.added) {
        const raniCategory = categorizeTransaction(
          tx.name,
          tx.merchant_name ?? null,
          tx.personal_finance_category
            ? { primary: tx.personal_finance_category.primary, detailed: tx.personal_finance_category.detailed }
            : null,
        );

        addedRaw.push({
          id: tx.transaction_id,
          accountId: tx.account_id,
          date: tx.date,
          authorizedDate: tx.authorized_date ?? null,
          name: tx.name,
          merchantName: tx.merchant_name ?? null,
          amount: tx.amount,
          isoCurrencyCode: tx.iso_currency_code ?? null,
          category: tx.category || [],
          categoryId: tx.category_id ?? null,
          personalFinanceCategory: tx.personal_finance_category
            ? {
                primary: tx.personal_finance_category.primary,
                detailed: tx.personal_finance_category.detailed,
                confidenceLevel: tx.personal_finance_category.confidence_level || 'UNKNOWN',
              }
            : null,
          paymentChannel: tx.payment_channel as 'online' | 'in store' | 'other',
          pending: tx.pending,
          raniCategory,
          reconciliationStatus: 'unmatched',
          matchedEntryId: null,
          matchedEntryType: null,
        });
      }

      for (const tx of response.data.modified) {
        modifiedIds.push(tx.transaction_id);
      }

      for (const tx of response.data.removed as RemovedTransaction[]) {
        if (tx.transaction_id) removedIds.push(tx.transaction_id);
      }

      hasMore = response.data.has_more;
      cursor = response.data.next_cursor;
    }

    // Merge with existing transactions
    let transactions = [...storage.transactions];

    // Remove deleted ones
    transactions = transactions.filter((tx) => !removedIds.includes(tx.id));

    // Update modified ones (remove old, re-add from Plaid if we have them)
    transactions = transactions.filter((tx) => !modifiedIds.includes(tx.id));

    // Add new ones
    transactions = [...addedRaw, ...transactions];

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Keep last 500 transactions max
    if (transactions.length > 500) {
      transactions = transactions.slice(0, 500);
    }

    const now = new Date().toISOString();

    updateStorage({
      cursor,
      transactions,
      lastSyncedAt: now,
    });

    // Invalidate caches
    cache.invalidatePrefix('plaid:');

    return NextResponse.json({
      added: addedRaw.length,
      modified: modifiedIds.length,
      removed: removedIds.length,
      hasMore: false,
      lastSyncedAt: now,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
