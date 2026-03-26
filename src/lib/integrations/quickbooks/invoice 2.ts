// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Invoice Management
// Create, track, payment plans, reminders
// ═══════════════════════════════════════════════════════════════

import { qboClient } from './client';
import type {
  QBOInvoice,
  QBOInvoiceLine,
  QBOPayment,
  QBOCustomer,
  ClinicInvoiceInput,
  PaymentPlan,
} from './types';

/* ─── Customer Lookup/Create ────────────────────────────────── */

async function findOrCreateCustomer(
  name: string,
  email?: string,
): Promise<QBOCustomer> {
  // Search by display name
  const existing = await qboClient.query<QBOCustomer>(
    `SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}'`,
  );

  if (existing.length > 0) return existing[0];

  // Create new customer
  const nameParts = name.split(' ');
  const customer = await qboClient.create<QBOCustomer>('Customer', {
    DisplayName: name,
    GivenName: nameParts[0],
    FamilyName: nameParts.slice(1).join(' ') || undefined,
    PrimaryEmailAddr: email ? { Address: email } : undefined,
  } as Partial<QBOCustomer>);

  return customer;
}

/* ─── Invoice Creation ──────────────────────────────────────── */

/**
 * Create a QBO invoice from clinic treatment records
 */
export async function createInvoice(input: ClinicInvoiceInput): Promise<QBOInvoice> {
  const customer = await findOrCreateCustomer(input.clientName, input.clientEmail);

  const lines: QBOInvoiceLine[] = input.treatments.map((treatment, idx) => ({
    Amount: treatment.unitPrice * treatment.quantity,
    DetailType: 'SalesItemLineDetail' as const,
    Description: treatment.providerName
      ? `${treatment.name} — Provider: ${treatment.providerName}`
      : treatment.name,
    SalesItemLineDetail: {
      ItemRef: { value: '1', name: treatment.name }, // Will need item lookup in production
      UnitPrice: treatment.unitPrice,
      Qty: treatment.quantity,
      ServiceDate: treatment.serviceDate,
    },
  }));

  const totalAmount = lines.reduce((sum, l) => sum + l.Amount, 0);

  const invoiceData: Partial<QBOInvoice> = {
    CustomerRef: { value: customer.Id, name: customer.DisplayName },
    Line: lines,
    DueDate: input.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    TxnDate: new Date().toISOString().split('T')[0],
    CustomerMemo: input.memo ? { value: input.memo } : undefined,
    BillEmail: input.clientEmail ? { Address: input.clientEmail } : undefined,
    AllowOnlinePayment: true,
    AllowOnlineCreditCardPayment: true,
    AllowOnlineACHPayment: true,
    PrivateNote: input.isPaymentPlan
      ? `Payment plan: ${input.paymentPlanInstallments || 3} installments of $${(totalAmount / (input.paymentPlanInstallments || 3)).toFixed(2)}`
      : undefined,
  };

  const invoice = await qboClient.create<QBOInvoice>('Invoice', invoiceData);
  return invoice;
}

/**
 * Create multiple invoices for a payment plan
 */
export async function createPaymentPlanInvoices(
  input: ClinicInvoiceInput,
): Promise<PaymentPlan> {
  const installments = input.paymentPlanInstallments || 3;
  const totalAmount = input.treatments.reduce((sum, t) => sum + t.unitPrice * t.quantity, 0);
  const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

  // Adjust last installment for rounding
  const lastInstallment = totalAmount - installmentAmount * (installments - 1);

  const schedule: PaymentPlan['schedule'] = [];
  const invoiceIds: string[] = [];

  for (let i = 0; i < installments; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    const amount = i === installments - 1 ? lastInstallment : installmentAmount;

    const invoice = await createInvoice({
      ...input,
      treatments: [{
        name: `${input.treatments[0]?.name || 'Treatment'} — Installment ${i + 1}/${installments}`,
        quantity: 1,
        unitPrice: amount,
      }],
      dueDate: dueDate.toISOString().split('T')[0],
      memo: `Payment ${i + 1} of ${installments} for treatment package`,
    });

    invoiceIds.push(invoice.Id);
    schedule.push({
      dueDate: dueDate.toISOString().split('T')[0],
      amount,
      status: 'pending',
    });
  }

  return {
    invoiceId: invoiceIds[0],
    totalAmount,
    installmentCount: installments,
    installmentAmount,
    schedule,
  };
}

/* ─── Payment Recording ─────────────────────────────────────── */

/**
 * Record a payment against an invoice
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  paymentMethod?: string,
  refNumber?: string,
): Promise<QBOPayment> {
  // Fetch the invoice to get customer ref
  const invoice = await qboClient.read<QBOInvoice>('Invoice', invoiceId);

  const payment = await qboClient.create<QBOPayment>('Payment', {
    TotalAmt: amount,
    CustomerRef: invoice.CustomerRef,
    Line: [{
      Amount: amount,
      LinkedTxn: [{
        TxnId: invoiceId,
        TxnType: 'Invoice',
      }],
    }],
    PaymentRefNum: refNumber,
    TxnDate: new Date().toISOString().split('T')[0],
  } as Partial<QBOPayment>);

  return payment;
}

/* ─── Invoice Queries ───────────────────────────────────────── */

/**
 * Get all overdue invoices
 */
export async function getOverdueInvoices(): Promise<Array<QBOInvoice & { daysOverdue: number }>> {
  const today = new Date().toISOString().split('T')[0];

  const invoices = await qboClient.query<QBOInvoice>(
    `SELECT * FROM Invoice WHERE Balance > '0' AND DueDate < '${today}' ORDERBY DueDate ASC MAXRESULTS 100`,
  );

  const todayDate = new Date(today);
  return invoices.map(inv => ({
    ...inv,
    daysOverdue: Math.floor((todayDate.getTime() - new Date(inv.DueDate || inv.TxnDate).getTime()) / (24 * 60 * 60 * 1000)),
  }));
}

/**
 * Get unpaid invoices
 */
export async function getUnpaidInvoices(): Promise<QBOInvoice[]> {
  return qboClient.query<QBOInvoice>(
    "SELECT * FROM Invoice WHERE Balance > '0' ORDERBY DueDate ASC MAXRESULTS 100",
  );
}

/**
 * Get invoices for a specific customer
 */
export async function getCustomerInvoices(customerId: string): Promise<QBOInvoice[]> {
  return qboClient.query<QBOInvoice>(
    `SELECT * FROM Invoice WHERE CustomerRef = '${customerId}' ORDERBY TxnDate DESC MAXRESULTS 100`,
  );
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<QBOInvoice> {
  return qboClient.read<QBOInvoice>('Invoice', invoiceId);
}

/* ─── Invoice Analytics ─────────────────────────────────────── */

export interface InvoiceAnalytics {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  averageDaysToPayment: number;
  invoicesByStatus: {
    paid: number;
    unpaid: number;
    overdue: number;
    partial: number;
  };
  recentPayments: Array<{
    invoiceId: string;
    customerName: string;
    amount: number;
    date: string;
  }>;
}

export async function getInvoiceAnalytics(): Promise<InvoiceAnalytics> {
  const [unpaid, overdue, recentPayments] = await Promise.all([
    getUnpaidInvoices(),
    getOverdueInvoices(),
    qboClient.query<QBOPayment>(
      "SELECT * FROM Payment ORDERBY TxnDate DESC MAXRESULTS 20",
    ),
  ]);

  const totalOutstanding = unpaid.reduce((sum, inv) => sum + inv.Balance, 0);
  const totalOverdue = overdue.reduce((sum, inv) => sum + inv.Balance, 0);
  const partial = unpaid.filter(inv => inv.Balance < inv.TotalAmt).length;

  return {
    totalOutstanding,
    totalOverdue,
    overdueCount: overdue.length,
    averageDaysToPayment: 0, // Would need historical payment data
    invoicesByStatus: {
      paid: 0, // Would need separate query
      unpaid: unpaid.length - overdue.length - partial,
      overdue: overdue.length,
      partial,
    },
    recentPayments: recentPayments.map(p => ({
      invoiceId: p.Line?.[0]?.LinkedTxn?.[0]?.TxnId || '',
      customerName: p.CustomerRef.name || '',
      amount: p.TotalAmt,
      date: p.TxnDate,
    })),
  };
}

/* ─── Payment Reminders ─────────────────────────────────────── */

export interface PaymentReminder {
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  reminderType: 'upcoming' | 'due_today' | 'overdue_7' | 'overdue_30' | 'overdue_60';
}

export async function getPaymentReminders(): Promise<PaymentReminder[]> {
  const unpaid = await getUnpaidInvoices();
  const today = new Date();
  const reminders: PaymentReminder[] = [];

  for (const invoice of unpaid) {
    const dueDate = new Date(invoice.DueDate || invoice.TxnDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const daysOverdue = -daysUntilDue;

    let reminderType: PaymentReminder['reminderType'];

    if (daysUntilDue > 0 && daysUntilDue <= 3) {
      reminderType = 'upcoming';
    } else if (daysUntilDue === 0) {
      reminderType = 'due_today';
    } else if (daysOverdue > 0 && daysOverdue <= 7) {
      reminderType = 'overdue_7';
    } else if (daysOverdue > 7 && daysOverdue <= 30) {
      reminderType = 'overdue_30';
    } else if (daysOverdue > 30) {
      reminderType = 'overdue_60';
    } else {
      continue; // Not yet due for a reminder
    }

    reminders.push({
      invoiceId: invoice.Id,
      customerName: invoice.CustomerRef.name || '',
      customerEmail: invoice.BillEmail?.Address || '',
      amount: invoice.Balance,
      dueDate: invoice.DueDate || invoice.TxnDate,
      daysOverdue: Math.max(0, daysOverdue),
      reminderType,
    });
  }

  // Sort by urgency
  const urgencyOrder: Record<string, number> = {
    overdue_60: 0, overdue_30: 1, overdue_7: 2, due_today: 3, upcoming: 4,
  };
  reminders.sort((a, b) => urgencyOrder[a.reminderType] - urgencyOrder[b.reminderType]);

  return reminders;
}

/* ─── Send Invoice ──────────────────────────────────────────── */

/**
 * Mark invoice to be emailed via QBO
 */
export async function sendInvoice(invoiceId: string): Promise<void> {
  const invoice = await qboClient.read<QBOInvoice>('Invoice', invoiceId);

  if (!invoice.BillEmail?.Address) {
    throw new Error('Invoice has no email address to send to');
  }

  // QBO send endpoint
  await qboClient.create<QBOInvoice>('Invoice', {
    ...invoice,
    EmailStatus: 'NeedToSend',
  } as Partial<QBOInvoice>);
}

/* ─── Void Invoice ──────────────────────────────────────────── */

export async function voidInvoice(invoiceId: string): Promise<void> {
  const invoice = await qboClient.read<QBOInvoice>('Invoice', invoiceId);
  await qboClient.delete('Invoice', invoiceId, invoice.SyncToken);
}
