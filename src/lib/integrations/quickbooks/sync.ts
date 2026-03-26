// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Data Sync Engine
// Incremental sync, full reconciliation, category mapping
// ═══════════════════════════════════════════════════════════════

import { qboClient } from './client';
import type {
  QBOAccount,
  QBOInvoice,
  QBOPayment,
  QBOBill,
  QBOPurchase,
  QBOCustomer,
  QBOVendor,
  QBOItem,
  QBOClass,
  QBOWebhookNotification,
  ClinicTransaction,
  ClinicExpenseCategory,
  SyncStatus,
} from './types';

/* ─── Category Mapping ──────────────────────────────────────── */

/**
 * Map QBO account names/types to clinic expense categories.
 * Uses keyword matching against account name and sub-type.
 */
const EXPENSE_CATEGORY_MAP: Array<{
  keywords: string[];
  accountSubTypes?: string[];
  category: ClinicExpenseCategory;
}> = [
  {
    keywords: ['rent', 'lease', 'occupancy'],
    accountSubTypes: ['RentOrLeaseOfBuildings'],
    category: 'rent',
  },
  {
    keywords: ['supply', 'supplies', 'consumable', 'product cost', 'skincare', 'filler', 'botox', 'neurotoxin', 'hyaluronic'],
    accountSubTypes: ['SuppliesMaterials'],
    category: 'supplies',
  },
  {
    keywords: ['payroll', 'salary', 'wage', 'compensation', 'bonus', 'commission'],
    accountSubTypes: ['PayrollExpenses'],
    category: 'payroll',
  },
  {
    keywords: ['marketing', 'advertising', 'promotion', 'social media', 'google ads', 'meta ads', 'seo'],
    accountSubTypes: ['AdvertisingPromotional'],
    category: 'marketing',
  },
  {
    keywords: ['insurance', 'malpractice', 'liability', 'workers comp'],
    accountSubTypes: ['Insurance'],
    category: 'insurance',
  },
  {
    keywords: ['equipment', 'laser', 'device', 'machine', 'sofwave', 'picoway', 'hydrafacial'],
    accountSubTypes: ['MachineryAndEquipment', 'FurnitureAndFixtures'],
    category: 'equipment',
  },
  {
    keywords: ['utility', 'utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'telecom'],
    accountSubTypes: ['Utilities'],
    category: 'utilities',
  },
  {
    keywords: ['professional', 'legal', 'accounting', 'consulting', 'license', 'certification', 'training', 'continuing education'],
    accountSubTypes: ['LegalProfessionalFees'],
    category: 'professional_services',
  },
];

export function mapToExpenseCategory(
  accountName: string,
  accountSubType?: string,
): ClinicExpenseCategory {
  const nameLower = accountName.toLowerCase();

  for (const mapping of EXPENSE_CATEGORY_MAP) {
    // Check account sub-type first (most reliable)
    if (accountSubType && mapping.accountSubTypes?.includes(accountSubType)) {
      return mapping.category;
    }
    // Then check keyword match in account name
    if (mapping.keywords.some(kw => nameLower.includes(kw))) {
      return mapping.category;
    }
  }

  // Default fallback based on common patterns
  if (nameLower.includes('cost of goods') || nameLower.includes('cogs')) return 'supplies';
  return 'supplies'; // Safe default for med spa
}

/* ─── Sync State (in-memory — use DB in production) ─────────── */

let syncState: SyncStatus = {
  lastSyncAt: null,
  lastFullSyncAt: null,
  syncInProgress: false,
  recordsSynced: 0,
  errors: [],
  nextSyncAt: null,
};

let transactionCache: ClinicTransaction[] = [];
let accountCache: QBOAccount[] = [];
let customerCache: QBOCustomer[] = [];
let vendorCache: QBOVendor[] = [];
let itemCache: QBOItem[] = [];
let classCache: QBOClass[] = [];

export function getSyncStatus(): SyncStatus {
  return { ...syncState };
}

export function getTransactionCache(): ClinicTransaction[] {
  return [...transactionCache];
}

/* ─── Account Mapping Helpers ───────────────────────────────── */

function findAccountById(id: string): QBOAccount | undefined {
  return accountCache.find(a => a.Id === id);
}

function findClassById(id: string): QBOClass | undefined {
  return classCache.find(c => c.Id === id);
}

function findCustomerById(id: string): QBOCustomer | undefined {
  return customerCache.find(c => c.Id === id);
}

function findVendorById(id: string): QBOVendor | undefined {
  return vendorCache.find(v => v.Id === id);
}

/* ─── Transaction Mapping ───────────────────────────────────── */

function mapInvoiceToTransactions(invoice: QBOInvoice): ClinicTransaction[] {
  const customer = findCustomerById(invoice.CustomerRef.value);
  const cls = invoice.ClassRef ? findClassById(invoice.ClassRef.value) : undefined;

  return [{
    id: `inv-${invoice.Id}`,
    qboId: invoice.Id,
    type: 'income',
    category: 'service_revenue',
    amount: invoice.TotalAmt,
    date: invoice.TxnDate,
    description: `Invoice #${invoice.DocNumber || invoice.Id}`,
    vendorOrCustomer: customer?.DisplayName || invoice.CustomerRef.name,
    className: cls?.Name,
    memo: invoice.CustomerMemo?.value,
    syncedAt: new Date().toISOString(),
  }];
}

function mapPaymentToTransactions(payment: QBOPayment): ClinicTransaction[] {
  const customer = findCustomerById(payment.CustomerRef.value);
  return [{
    id: `pmt-${payment.Id}`,
    qboId: payment.Id,
    type: 'income',
    category: 'service_revenue',
    amount: payment.TotalAmt,
    date: payment.TxnDate,
    description: `Payment ${payment.PaymentRefNum || `#${payment.Id}`}`,
    vendorOrCustomer: customer?.DisplayName || payment.CustomerRef.name,
    syncedAt: new Date().toISOString(),
  }];
}

function mapBillToTransactions(bill: QBOBill): ClinicTransaction[] {
  const vendor = findVendorById(bill.VendorRef.value);

  return bill.Line.map((line, idx) => {
    let accountName = '';
    let accountSubType = '';
    let cls: QBOClass | undefined;

    if (line.AccountBasedExpenseLineDetail) {
      const account = findAccountById(line.AccountBasedExpenseLineDetail.AccountRef.value);
      accountName = account?.Name || '';
      accountSubType = account?.AccountSubType || '';
      if (line.AccountBasedExpenseLineDetail.ClassRef) {
        cls = findClassById(line.AccountBasedExpenseLineDetail.ClassRef.value);
      }
    } else if (line.ItemBasedExpenseLineDetail) {
      if (line.ItemBasedExpenseLineDetail.ClassRef) {
        cls = findClassById(line.ItemBasedExpenseLineDetail.ClassRef.value);
      }
      accountName = line.Description || 'Item expense';
    }

    return {
      id: `bill-${bill.Id}-${idx}`,
      qboId: bill.Id,
      type: 'expense' as const,
      category: mapToExpenseCategory(accountName, accountSubType),
      amount: line.Amount,
      date: bill.TxnDate,
      description: line.Description || `Bill #${bill.DocNumber || bill.Id}`,
      vendorOrCustomer: vendor?.DisplayName || bill.VendorRef.name,
      accountName,
      className: cls?.Name,
      syncedAt: new Date().toISOString(),
    };
  });
}

function mapPurchaseToTransactions(purchase: QBOPurchase): ClinicTransaction[] {
  const vendor = purchase.EntityRef
    ? findVendorById(purchase.EntityRef.value)
    : undefined;

  return purchase.Line.map((line, idx) => {
    let accountName = '';
    let accountSubType = '';

    if (line.AccountBasedExpenseLineDetail) {
      const account = findAccountById(line.AccountBasedExpenseLineDetail.AccountRef.value);
      accountName = account?.Name || '';
      accountSubType = account?.AccountSubType || '';
    }

    return {
      id: `pur-${purchase.Id}-${idx}`,
      qboId: purchase.Id,
      type: 'expense' as const,
      category: mapToExpenseCategory(accountName, accountSubType),
      amount: line.Amount,
      date: purchase.TxnDate,
      description: line.Description || `${purchase.PaymentType} #${purchase.DocNumber || purchase.Id}`,
      vendorOrCustomer: vendor?.DisplayName || purchase.EntityRef?.name,
      accountName,
      syncedAt: new Date().toISOString(),
    };
  });
}

/* ─── Core Sync Functions ───────────────────────────────────── */

/**
 * Sync reference data (accounts, customers, vendors, items, classes)
 */
async function syncReferenceData(): Promise<void> {
  const [accounts, customers, vendors, items, classes] = await Promise.all([
    qboClient.query<QBOAccount>("SELECT * FROM Account WHERE Active = true MAXRESULTS 1000"),
    qboClient.query<QBOCustomer>("SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000"),
    qboClient.query<QBOVendor>("SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000"),
    qboClient.query<QBOItem>("SELECT * FROM Item WHERE Active = true MAXRESULTS 1000"),
    qboClient.query<QBOClass>("SELECT * FROM Class WHERE Active = true MAXRESULTS 1000"),
  ]);

  accountCache = accounts;
  customerCache = customers;
  vendorCache = vendors;
  itemCache = items;
  classCache = classes;
}

/**
 * Incremental sync — fetch only changes since last sync
 */
export async function incrementalSync(): Promise<{
  transactionsAdded: number;
  errors: string[];
}> {
  if (syncState.syncInProgress) {
    return { transactionsAdded: 0, errors: ['Sync already in progress'] };
  }

  syncState.syncInProgress = true;
  syncState.errors = [];
  const errors: string[] = [];
  let added = 0;

  try {
    // Sync reference data first
    await syncReferenceData();

    const since = syncState.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Use CDC to get all changes since last sync
    const cdcResult = await qboClient.cdc(
      ['Invoice', 'Payment', 'Bill', 'Purchase'],
      since,
    );

    const newTransactions: ClinicTransaction[] = [];

    for (const response of cdcResult.CDCResponse) {
      for (const qr of response.QueryResponse) {
        // Process invoices
        if (qr['Invoice']) {
          for (const inv of qr['Invoice'] as unknown as QBOInvoice[]) {
            try {
              newTransactions.push(...mapInvoiceToTransactions(inv));
              added++;
            } catch (err) {
              const msg = `Failed to map invoice ${inv.Id}: ${err}`;
              errors.push(msg);
              syncState.errors.push({ entity: 'Invoice', id: inv.Id, error: msg, timestamp: new Date().toISOString() });
            }
          }
        }

        // Process payments
        if (qr['Payment']) {
          for (const pmt of qr['Payment'] as unknown as QBOPayment[]) {
            try {
              newTransactions.push(...mapPaymentToTransactions(pmt));
              added++;
            } catch (err) {
              const msg = `Failed to map payment ${pmt.Id}: ${err}`;
              errors.push(msg);
              syncState.errors.push({ entity: 'Payment', id: pmt.Id, error: msg, timestamp: new Date().toISOString() });
            }
          }
        }

        // Process bills
        if (qr['Bill']) {
          for (const bill of qr['Bill'] as unknown as QBOBill[]) {
            try {
              newTransactions.push(...mapBillToTransactions(bill));
              added++;
            } catch (err) {
              const msg = `Failed to map bill ${bill.Id}: ${err}`;
              errors.push(msg);
              syncState.errors.push({ entity: 'Bill', id: bill.Id, error: msg, timestamp: new Date().toISOString() });
            }
          }
        }

        // Process purchases/expenses
        if (qr['Purchase']) {
          for (const pur of qr['Purchase'] as unknown as QBOPurchase[]) {
            try {
              newTransactions.push(...mapPurchaseToTransactions(pur));
              added++;
            } catch (err) {
              const msg = `Failed to map purchase ${pur.Id}: ${err}`;
              errors.push(msg);
              syncState.errors.push({ entity: 'Purchase', id: pur.Id, error: msg, timestamp: new Date().toISOString() });
            }
          }
        }
      }
    }

    // Merge with existing cache, replacing updated records
    const existingIds = new Set(newTransactions.map(t => t.id));
    transactionCache = [
      ...transactionCache.filter(t => !existingIds.has(t.id)),
      ...newTransactions,
    ];

    syncState.lastSyncAt = new Date().toISOString();
    syncState.recordsSynced = transactionCache.length;
  } catch (err) {
    const msg = `Sync failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    syncState.errors.push({ entity: 'GLOBAL', id: '', error: msg, timestamp: new Date().toISOString() });
  } finally {
    syncState.syncInProgress = false;
  }

  return { transactionsAdded: added, errors };
}

/**
 * Full reconciliation — pull all data and rebuild cache
 */
export async function fullReconciliation(
  startDate?: string,
  endDate?: string,
): Promise<{ totalTransactions: number; errors: string[] }> {
  if (syncState.syncInProgress) {
    return { totalTransactions: 0, errors: ['Sync already in progress'] };
  }

  syncState.syncInProgress = true;
  syncState.errors = [];
  const errors: string[] = [];

  const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  try {
    // Sync all reference data
    await syncReferenceData();

    // Clear cache for full rebuild
    transactionCache = [];

    // Pull all invoices, payments, bills, purchases within date range
    const [invoices, payments, bills, purchases] = await Promise.all([
      qboClient.query<QBOInvoice>(`SELECT * FROM Invoice WHERE TxnDate >= '${start}' AND TxnDate <= '${end}' MAXRESULTS 1000`),
      qboClient.query<QBOPayment>(`SELECT * FROM Payment WHERE TxnDate >= '${start}' AND TxnDate <= '${end}' MAXRESULTS 1000`),
      qboClient.query<QBOBill>(`SELECT * FROM Bill WHERE TxnDate >= '${start}' AND TxnDate <= '${end}' MAXRESULTS 1000`),
      qboClient.query<QBOPurchase>(`SELECT * FROM Purchase WHERE TxnDate >= '${start}' AND TxnDate <= '${end}' MAXRESULTS 1000`),
    ]);

    for (const inv of invoices) {
      try { transactionCache.push(...mapInvoiceToTransactions(inv)); }
      catch (err) { errors.push(`Invoice ${inv.Id}: ${err}`); }
    }
    for (const pmt of payments) {
      try { transactionCache.push(...mapPaymentToTransactions(pmt)); }
      catch (err) { errors.push(`Payment ${pmt.Id}: ${err}`); }
    }
    for (const bill of bills) {
      try { transactionCache.push(...mapBillToTransactions(bill)); }
      catch (err) { errors.push(`Bill ${bill.Id}: ${err}`); }
    }
    for (const pur of purchases) {
      try { transactionCache.push(...mapPurchaseToTransactions(pur)); }
      catch (err) { errors.push(`Purchase ${pur.Id}: ${err}`); }
    }

    syncState.lastSyncAt = new Date().toISOString();
    syncState.lastFullSyncAt = new Date().toISOString();
    syncState.recordsSynced = transactionCache.length;
  } catch (err) {
    const msg = `Full reconciliation failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
  } finally {
    syncState.syncInProgress = false;
  }

  return { totalTransactions: transactionCache.length, errors };
}

/* ─── Webhook Handler ───────────────────────────────────────── */

/**
 * Process QBO webhook notifications for real-time sync
 */
export async function handleWebhook(
  notification: QBOWebhookNotification,
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  for (const event of notification.eventNotifications) {
    const realmId = event.realmId;
    const currentRealmId = process.env.QBO_REALM_ID;

    if (currentRealmId && realmId !== currentRealmId) {
      errors.push(`Realm ID mismatch: expected ${currentRealmId}, got ${realmId}`);
      continue;
    }

    for (const entity of event.dataChangeEvent.entities) {
      try {
        const { name, id, operation } = entity;

        if (operation === 'Delete' || operation === 'Void') {
          // Remove from cache
          transactionCache = transactionCache.filter(t => t.qboId !== id);
          processed++;
          continue;
        }

        // Fetch the updated entity and re-map
        switch (name) {
          case 'Invoice': {
            const invoice = await qboClient.read<QBOInvoice>('Invoice', id);
            const mapped = mapInvoiceToTransactions(invoice);
            transactionCache = transactionCache.filter(t => !(t.qboId === id && t.id.startsWith('inv-')));
            transactionCache.push(...mapped);
            break;
          }
          case 'Payment': {
            const payment = await qboClient.read<QBOPayment>('Payment', id);
            const mapped = mapPaymentToTransactions(payment);
            transactionCache = transactionCache.filter(t => !(t.qboId === id && t.id.startsWith('pmt-')));
            transactionCache.push(...mapped);
            break;
          }
          case 'Bill': {
            const bill = await qboClient.read<QBOBill>('Bill', id);
            const mapped = mapBillToTransactions(bill);
            transactionCache = transactionCache.filter(t => !(t.qboId === id && t.id.startsWith('bill-')));
            transactionCache.push(...mapped);
            break;
          }
          case 'Purchase': {
            const purchase = await qboClient.read<QBOPurchase>('Purchase', id);
            const mapped = mapPurchaseToTransactions(purchase);
            transactionCache = transactionCache.filter(t => !(t.qboId === id && t.id.startsWith('pur-')));
            transactionCache.push(...mapped);
            break;
          }
          default:
            // Entity types we don't track (Customer, Vendor, etc.) — skip
            break;
        }

        processed++;
      } catch (err) {
        errors.push(`Failed to process ${entity.name} ${entity.id}: ${err}`);
      }
    }
  }

  if (processed > 0) {
    syncState.lastSyncAt = new Date().toISOString();
    syncState.recordsSynced = transactionCache.length;
  }

  return { processed, errors };
}

/* ─── Data Access Helpers ───────────────────────────────────── */

export function getTransactionsByDateRange(start: string, end: string): ClinicTransaction[] {
  return transactionCache.filter(t => t.date >= start && t.date <= end);
}

export function getTransactionsByCategory(category: string): ClinicTransaction[] {
  return transactionCache.filter(t => t.category === category);
}

export function getTransactionsByType(type: 'income' | 'expense'): ClinicTransaction[] {
  return transactionCache.filter(t => t.type === type);
}

export function getAccountCache(): QBOAccount[] {
  return [...accountCache];
}

export function getCustomerCache(): QBOCustomer[] {
  return [...customerCache];
}

export function getVendorCache(): QBOVendor[] {
  return [...vendorCache];
}

export function getItemCache(): QBOItem[] {
  return [...itemCache];
}

export function getClassCache(): QBOClass[] {
  return [...classCache];
}
