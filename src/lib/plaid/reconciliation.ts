import type { PlaidTransaction, ReconciliationMatch } from '@/types/plaid';

interface MatchableEntry {
  id: string;
  type: 'expense' | 'sale';
  amount: number;
  date: string;
  vendor: string;
  category?: string;
}

export function scoreMatch(
  transaction: PlaidTransaction,
  entry: MatchableEntry,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const txAmount = Math.abs(transaction.amount);
  const entryAmount = entry.amount;

  // Amount matching
  if (Math.abs(txAmount - entryAmount) < 0.01) {
    score += 40;
    reasons.push('amount_exact');
  } else if (Math.abs(txAmount - entryAmount) / entryAmount <= 0.05) {
    score += 25;
    reasons.push('amount_close');
  }

  // Date matching
  const txDate = new Date(transaction.date);
  const entryDate = new Date(entry.date);
  const dayDiff = Math.abs(
    (txDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayDiff === 0) {
    score += 30;
    reasons.push('date_exact');
  } else if (dayDiff <= 2) {
    score += 20;
    reasons.push('date_within_2_days');
  } else if (dayDiff <= 7) {
    score += 10;
    reasons.push('date_within_7_days');
  }

  // Vendor / name fuzzy matching
  const txName = (transaction.merchantName || transaction.name).toLowerCase();
  const entryVendor = entry.vendor.toLowerCase();
  if (txName === entryVendor) {
    score += 30;
    reasons.push('vendor_exact');
  } else if (txName.includes(entryVendor) || entryVendor.includes(txName)) {
    score += 20;
    reasons.push('vendor_partial');
  } else {
    // Check word overlap
    const txWords = txName.split(/\s+/);
    const vendorWords = entryVendor.split(/\s+/);
    const overlap = txWords.filter((w) => vendorWords.some((vw) => vw.includes(w) || w.includes(vw)));
    if (overlap.length > 0) {
      score += 10;
      reasons.push('vendor_fuzzy');
    }
  }

  // Category matching
  if (transaction.raniCategory && entry.category) {
    if (transaction.raniCategory === entry.category) {
      score += 10;
      reasons.push('category_match');
    }
  }

  return { score, reasons };
}

export function findMatches(
  transaction: PlaidTransaction,
  entries: MatchableEntry[],
): ReconciliationMatch[] {
  const matches: ReconciliationMatch[] = [];

  for (const entry of entries) {
    const { score, reasons } = scoreMatch(transaction, entry);
    if (score >= 60) {
      matches.push({
        transactionId: transaction.id,
        entryId: entry.id,
        entryType: entry.type,
        confidence: Math.min(score, 100),
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

export function autoReconcile(
  transactions: PlaidTransaction[],
  entries: MatchableEntry[],
): { matched: ReconciliationMatch[]; unmatched: PlaidTransaction[] } {
  const matched: ReconciliationMatch[] = [];
  const usedEntryIds = new Set<string>();
  const matchedTxIds = new Set<string>();

  // Only consider unmatched transactions
  const unreconciled = transactions.filter(
    (tx) => tx.reconciliationStatus === 'unmatched'
  );

  for (const tx of unreconciled) {
    const availableEntries = entries.filter((e) => !usedEntryIds.has(e.id));
    const candidates = findMatches(tx, availableEntries);

    // Auto-match if confidence >= 80
    const bestMatch = candidates[0];
    if (bestMatch && bestMatch.confidence >= 80) {
      matched.push(bestMatch);
      usedEntryIds.add(bestMatch.entryId);
      matchedTxIds.add(tx.id);
    }
  }

  const unmatched = unreconciled.filter((tx) => !matchedTxIds.has(tx.id));
  return { matched, unmatched };
}
