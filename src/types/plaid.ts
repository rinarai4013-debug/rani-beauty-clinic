// Plaid bank feed integration types

export interface PlaidAccount {
  id: string;
  name: string;
  officialName: string | null;
  type: 'depository' | 'credit' | 'loan' | 'investment' | 'other';
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    isoCurrencyCode: string | null;
  };
  institutionName: string;
  institutionId: string;
  lastSynced: string;
}

export interface PlaidTransaction {
  id: string;
  accountId: string;
  date: string;
  authorizedDate: string | null;
  name: string;
  merchantName: string | null;
  amount: number; // positive = debit (money out), negative = credit (money in) — Plaid convention
  isoCurrencyCode: string | null;
  category: string[];
  categoryId: string | null;
  personalFinanceCategory: {
    primary: string;
    detailed: string;
    confidenceLevel: string;
  } | null;
  paymentChannel: 'online' | 'in store' | 'other';
  pending: boolean;
  raniCategory: RaniExpenseCategory | null;
  reconciliationStatus: ReconciliationStatus;
  matchedEntryId: string | null;
  matchedEntryType: 'expense' | 'sale' | null;
}

export type RaniExpenseCategory =
  | 'payroll'
  | 'ad-spend'
  | 'inventory'
  | 'rent'
  | 'device-rental'
  | 'software'
  | 'insurance'
  | 'training'
  | 'marketing'
  | 'revenue-deposit'
  | 'transfer'
  | 'other';

export type ReconciliationStatus =
  | 'unmatched'
  | 'auto-matched'
  | 'manually-matched'
  | 'excluded'
  | 'categorized';

export interface PlaidConnectionState {
  isConnected: boolean;
  institutionName: string | null;
  institutionId: string | null;
  accountCount: number;
  lastSync: string | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage: string | null;
}

export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

export interface PlaidSyncResult {
  added: number;
  modified: number;
  removed: number;
  hasMore: boolean;
  lastSyncedAt: string;
}

export interface ReconciliationMatch {
  transactionId: string;
  entryId: string;
  entryType: 'expense' | 'sale';
  confidence: number;
  matchReasons: string[];
}

export interface BankFeedSummary {
  accounts: PlaidAccount[];
  totalBalance: number;
  totalAvailable: number;
  transactionCount: number;
  unreconciledCount: number;
  lastSync: string | null;
  monthlyInflow: number;
  monthlyOutflow: number;
  weeklycashflow: { week: string; income: number; expenses: number }[];
  expensesByCategory: { category: string; amount: number; pct: number }[];
}

export interface CategoryMappingRule {
  pattern: string;
  plaidCategory?: string;
  raniCategory: RaniExpenseCategory;
  priority: number;
}
