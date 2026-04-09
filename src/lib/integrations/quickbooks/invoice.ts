import { qboClient } from './client';
import type {
  ClinicInvoiceInput,
  PaymentPlan,
  QBOCustomer,
  QBOInvoice,
  QBOPayment,
} from './types';

type ReminderType = 'upcoming' | 'due_today' | 'overdue_7' | 'overdue_30';

export interface PaymentReminder {
  invoiceId: string;
  customerName: string;
  email?: string;
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  reminderType: ReminderType;
}

export interface InvoiceAnalytics {
  totalOutstanding: number;
  overdueCount: number;
  unpaidCount: number;
  invoicesByStatus: {
    unpaid: number;
    partial: number;
    paid: number;
  };
  recentPayments: QBOPayment[];
}

type TreatmentInput = ClinicInvoiceInput['treatments'][number];

function toIsoDate(value: Date): string {
  return value.toISOString().split('T')[0];
}

function addDays(base: string, days: number): string {
  const next = new Date(`${base}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return toIsoDate(next);
}

function addMonths(base: string, months: number): string {
  const next = new Date(`${base}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return toIsoDate(next);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

async function findOrCreateCustomer(input: ClinicInvoiceInput): Promise<QBOCustomer> {
  const customers = await qboClient.query<QBOCustomer>(
    `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${input.clientEmail}' MAXRESULTS 1`
  );

  if (customers[0]) return customers[0];

  const [givenName, ...rest] = input.clientName.trim().split(/\s+/);
  const familyName = rest.join(' ');

  return qboClient.create<QBOCustomer>('Customer', {
    DisplayName: input.clientName,
    GivenName: givenName || input.clientName,
    FamilyName: familyName || undefined,
    PrimaryEmailAddr: { Address: input.clientEmail },
    PreferredDeliveryMethod: 'Email',
  });
}

function buildInvoiceLines(treatments: TreatmentInput[]) {
  return treatments.map((treatment, index) => ({
    LineNum: index + 1,
    Amount: roundCurrency(treatment.quantity * treatment.unitPrice),
    DetailType: 'SalesItemLineDetail' as const,
    Description: treatment.providerName
      ? `${treatment.name} — ${treatment.providerName}`
      : treatment.name,
    SalesItemLineDetail: {
      ItemRef: { value: '1', name: treatment.name },
      UnitPrice: treatment.unitPrice,
      Qty: treatment.quantity,
      ...(treatment.serviceDate ? { ServiceDate: treatment.serviceDate } : {}),
    },
  }));
}

function getInvoiceDueDate(input: ClinicInvoiceInput): string {
  return input.dueDate || addDays(toIsoDate(new Date()), 14);
}

export async function createInvoice(input: ClinicInvoiceInput): Promise<QBOInvoice> {
  const customer = await findOrCreateCustomer(input);
  const dueDate = getInvoiceDueDate(input);

  return qboClient.create<QBOInvoice>('Invoice', {
    CustomerRef: { value: customer.Id, name: customer.DisplayName },
    TxnDate: toIsoDate(new Date()),
    DueDate: dueDate,
    BillEmail: { Address: input.clientEmail },
    Line: buildInvoiceLines(input.treatments),
    CustomerMemo: input.memo ? { value: input.memo } : undefined,
    PrivateNote: input.isPaymentPlan
      ? `Payment plan: ${input.paymentPlanInstallments || 3} installments`
      : input.memo,
    AllowOnlinePayment: true,
    AllowOnlineCreditCardPayment: true,
    AllowOnlineACHPayment: true,
  });
}

export async function createPaymentPlanInvoices(input: ClinicInvoiceInput): Promise<PaymentPlan> {
  const installmentCount = input.paymentPlanInstallments || 3;
  const totalAmount = roundCurrency(
    input.treatments.reduce((sum, treatment) => sum + treatment.quantity * treatment.unitPrice, 0)
  );
  const baseInstallment = roundCurrency(totalAmount / installmentCount);
  const firstDueDate = getInvoiceDueDate(input);

  const schedule: PaymentPlan['schedule'] = [];
  let assignedTotal = 0;

  for (let i = 0; i < installmentCount; i += 1) {
    const isLast = i === installmentCount - 1;
    const amount = isLast
      ? roundCurrency(totalAmount - assignedTotal)
      : baseInstallment;
    assignedTotal += amount;

    const dueDate = addMonths(firstDueDate, i);
    schedule.push({ dueDate, amount, status: 'pending' });

    await createInvoice({
      ...input,
      dueDate,
      isPaymentPlan: true,
      paymentPlanInstallments: installmentCount,
      treatments: [
        {
          name: `${input.treatments[0]?.name || 'Treatment'} installment ${i + 1}/${installmentCount}`,
          quantity: 1,
          unitPrice: amount,
          providerName: input.treatments[0]?.providerName,
        },
      ],
    });
  }

  return {
    invoiceId: 'payment-plan',
    totalAmount,
    installmentCount,
    installmentAmount: baseInstallment,
    schedule,
  };
}

export async function getInvoice(invoiceId: string): Promise<QBOInvoice> {
  return qboClient.read<QBOInvoice>('Invoice', invoiceId);
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  paymentMethod = 'Other',
  referenceNumber?: string
): Promise<QBOPayment> {
  const invoice = await getInvoice(invoiceId);
  return qboClient.create<QBOPayment>('Payment', {
    CustomerRef: invoice.CustomerRef,
    TotalAmt: amount,
    TxnDate: toIsoDate(new Date()),
    PrivateNote: paymentMethod,
    ...(referenceNumber ? { PaymentRefNum: referenceNumber } : {}),
    Line: [
      {
        Amount: amount,
        LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }],
      },
    ],
  });
}

function daysBetween(date: string, now = new Date()): number {
  const due = new Date(`${date}T12:00:00Z`);
  return Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
}

export async function getUnpaidInvoices(): Promise<QBOInvoice[]> {
  return qboClient.query<QBOInvoice>(
    "SELECT * FROM Invoice WHERE Balance > '0' MAXRESULTS 1000"
  );
}

export async function getOverdueInvoices(): Promise<Array<QBOInvoice & { daysOverdue: number }>> {
  const unpaid = await getUnpaidInvoices();
  return unpaid
    .map(invoice => ({
      ...invoice,
      daysOverdue: daysBetween(invoice.DueDate),
    }))
    .filter(invoice => invoice.daysOverdue > 0);
}

export async function getCustomerInvoices(customerId: string): Promise<QBOInvoice[]> {
  return qboClient.query<QBOInvoice>(
    `SELECT * FROM Invoice WHERE CustomerRef = '${customerId}' MAXRESULTS 1000`
  );
}

export async function getInvoiceAnalytics(): Promise<InvoiceAnalytics> {
  const unpaid = await getUnpaidInvoices();
  const overdue = await getOverdueInvoices();
  const recentPayments = await qboClient.query<QBOPayment>(
    "SELECT * FROM Payment MAXRESULTS 100"
  );

  return {
    totalOutstanding: roundCurrency(unpaid.reduce((sum, invoice) => sum + (invoice.Balance || 0), 0)),
    overdueCount: overdue.length,
    unpaidCount: unpaid.length,
    invoicesByStatus: {
      unpaid: unpaid.filter(invoice => (invoice.Balance || 0) >= (invoice.TotalAmt || 0)).length,
      partial: unpaid.filter(invoice => (invoice.Balance || 0) > 0 && (invoice.Balance || 0) < (invoice.TotalAmt || 0)).length,
      paid: unpaid.filter(invoice => (invoice.Balance || 0) === 0).length,
    },
    recentPayments,
  };
}

export async function getPaymentReminders(): Promise<PaymentReminder[]> {
  const unpaid = await getUnpaidInvoices();
  return unpaid
    .map(invoice => {
      const daysOverdue = daysBetween(invoice.DueDate);
      let reminderType: ReminderType;
      if (daysOverdue >= 30) reminderType = 'overdue_30';
      else if (daysOverdue >= 7) reminderType = 'overdue_7';
      else if (daysOverdue >= 0) reminderType = 'due_today';
      else reminderType = 'upcoming';

      return {
        invoiceId: invoice.Id,
        customerName: invoice.CustomerRef?.name || 'Unknown Customer',
        email: invoice.BillEmail?.Address,
        amountDue: invoice.Balance || 0,
        dueDate: invoice.DueDate,
        daysOverdue,
        reminderType,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export async function sendInvoice(invoiceId: string): Promise<QBOInvoice> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice.BillEmail?.Address) {
    throw new Error(`Invoice ${invoiceId} has no email address`);
  }
  return invoice;
}

export async function voidInvoice(invoiceId: string): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  await qboClient.delete('Invoice', invoiceId, invoice.SyncToken);
}
