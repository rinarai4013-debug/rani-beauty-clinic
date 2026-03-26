// ═══════════════════════════════════════════════════════════════
// QuickBooks Invoice Management — Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInvoice,
  createPaymentPlanInvoices,
  recordPayment,
  getOverdueInvoices,
  getUnpaidInvoices,
  getCustomerInvoices,
  getInvoice,
  getInvoiceAnalytics,
  getPaymentReminders,
  sendInvoice,
  voidInvoice,
} from '../invoice';
import type { ClinicInvoiceInput } from '../types';

/* ─── Mock client ───────────────────────────────────────────── */

vi.mock('../client', () => ({
  qboClient: {
    query: vi.fn(),
    create: vi.fn(),
    read: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { qboClient } from '../client';
const mockQuery = vi.mocked(qboClient.query);
const mockCreate = vi.mocked(qboClient.create);
const mockRead = vi.mocked(qboClient.read);
const mockDelete = vi.mocked(qboClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── Test Data ─────────────────────────────────────────────── */

const SAMPLE_INVOICE_INPUT: ClinicInvoiceInput = {
  clientName: 'Jane Smith',
  clientEmail: 'jane@example.com',
  treatments: [
    { name: 'Sofwave Treatment', quantity: 1, unitPrice: 2750, providerName: 'Mom' },
    { name: 'HydraFacial', quantity: 1, unitPrice: 275 },
  ],
  dueDate: '2026-04-15',
  memo: 'Thank you for choosing Rani Beauty Clinic!',
};

const MOCK_CUSTOMER = {
  Id: '50',
  DisplayName: 'Jane Smith',
  GivenName: 'Jane',
  FamilyName: 'Smith',
  PrimaryEmailAddr: { Address: 'jane@example.com' },
  Balance: 0,
  Active: true,
  MetaData: { CreateTime: '', LastUpdatedTime: '' },
  SyncToken: '0',
};

const MOCK_INVOICE = {
  Id: '100',
  DocNumber: '1001',
  TxnDate: '2026-03-20',
  DueDate: '2026-04-15',
  CustomerRef: { value: '50', name: 'Jane Smith' },
  Line: [{ Amount: 2750, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: { ItemRef: { value: '1' }, UnitPrice: 2750, Qty: 1 } }],
  TotalAmt: 3025,
  Balance: 3025,
  BillEmail: { Address: 'jane@example.com' },
  MetaData: { CreateTime: '', LastUpdatedTime: '' },
  SyncToken: '0',
};

/* ─── Create Invoice Tests ──────────────────────────────────── */

describe('createInvoice', () => {
  it('creates an invoice with customer lookup', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]); // Customer exists
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    const invoice = await createInvoice(SAMPLE_INVOICE_INPUT);
    expect(invoice.Id).toBe('100');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('creates customer if not found', async () => {
    mockQuery.mockResolvedValueOnce([]); // No existing customer
    mockCreate.mockResolvedValueOnce(MOCK_CUSTOMER); // Create customer
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE); // Create invoice

    await createInvoice(SAMPLE_INVOICE_INPUT);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate).toHaveBeenNthCalledWith(1, 'Customer', expect.objectContaining({
      DisplayName: 'Jane Smith',
    }));
  });

  it('includes all treatment line items', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice(SAMPLE_INVOICE_INPUT);

    const createCall = mockCreate.mock.calls[0];
    const invoiceData = createCall[1] as Record<string, unknown>;
    const lines = invoiceData.Line as Array<Record<string, unknown>>;
    expect(lines).toHaveLength(2);
  });

  it('sets online payment options', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice(SAMPLE_INVOICE_INPUT);

    const createCall = mockCreate.mock.calls[0];
    const invoiceData = createCall[1] as Record<string, unknown>;
    expect(invoiceData.AllowOnlinePayment).toBe(true);
    expect(invoiceData.AllowOnlineCreditCardPayment).toBe(true);
    expect(invoiceData.AllowOnlineACHPayment).toBe(true);
  });

  it('includes due date', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice(SAMPLE_INVOICE_INPUT);

    const invoiceData = mockCreate.mock.calls[0][1] as Record<string, unknown>;
    expect(invoiceData.DueDate).toBe('2026-04-15');
  });

  it('sets default due date if not provided', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice({ ...SAMPLE_INVOICE_INPUT, dueDate: undefined });

    const invoiceData = mockCreate.mock.calls[0][1] as Record<string, unknown>;
    expect(invoiceData.DueDate).toBeDefined();
  });

  it('includes provider name in description', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice(SAMPLE_INVOICE_INPUT);

    const invoiceData = mockCreate.mock.calls[0][1] as Record<string, unknown>;
    const lines = invoiceData.Line as Array<{ Description: string }>;
    expect(lines[0].Description).toContain('Mom');
  });

  it('adds payment plan note when applicable', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValueOnce(MOCK_INVOICE);

    await createInvoice({
      ...SAMPLE_INVOICE_INPUT,
      isPaymentPlan: true,
      paymentPlanInstallments: 3,
    });

    const invoiceData = mockCreate.mock.calls[0][1] as Record<string, unknown>;
    expect(invoiceData.PrivateNote).toContain('Payment plan');
  });
});

/* ─── Payment Plan Tests ────────────────────────────────────── */

describe('createPaymentPlanInvoices', () => {
  it('creates correct number of installment invoices', async () => {
    mockQuery.mockResolvedValue([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValue(MOCK_INVOICE);

    const plan = await createPaymentPlanInvoices({
      ...SAMPLE_INVOICE_INPUT,
      paymentPlanInstallments: 3,
    });

    expect(plan.installmentCount).toBe(3);
    expect(plan.schedule).toHaveLength(3);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it('calculates correct installment amounts', async () => {
    mockQuery.mockResolvedValue([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValue(MOCK_INVOICE);

    const plan = await createPaymentPlanInvoices({
      clientName: 'Test',
      clientEmail: 'test@test.com',
      treatments: [{ name: 'Treatment', quantity: 1, unitPrice: 1000 }],
      paymentPlanInstallments: 3,
    });

    const totalInstallments = plan.schedule.reduce((sum, s) => sum + s.amount, 0);
    expect(totalInstallments).toBeCloseTo(1000, 2);
  });

  it('defaults to 3 installments', async () => {
    mockQuery.mockResolvedValue([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValue(MOCK_INVOICE);

    const plan = await createPaymentPlanInvoices(SAMPLE_INVOICE_INPUT);
    expect(plan.installmentCount).toBe(3);
  });

  it('sets monthly due dates', async () => {
    mockQuery.mockResolvedValue([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValue(MOCK_INVOICE);

    const plan = await createPaymentPlanInvoices({
      ...SAMPLE_INVOICE_INPUT,
      paymentPlanInstallments: 3,
    });

    const dates = plan.schedule.map(s => new Date(s.dueDate));
    // Each date should be roughly 1 month after the previous
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i].getTime() - dates[i - 1].getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    }
  });

  it('marks all installments as pending', async () => {
    mockQuery.mockResolvedValue([MOCK_CUSTOMER]);
    mockCreate.mockResolvedValue(MOCK_INVOICE);

    const plan = await createPaymentPlanInvoices(SAMPLE_INVOICE_INPUT);
    expect(plan.schedule.every(s => s.status === 'pending')).toBe(true);
  });
});

/* ─── Payment Recording Tests ───────────────────────────────── */

describe('recordPayment', () => {
  it('records payment against invoice', async () => {
    mockRead.mockResolvedValueOnce(MOCK_INVOICE);
    mockCreate.mockResolvedValueOnce({
      Id: '200',
      TotalAmt: 3025,
      TxnDate: '2026-03-25',
      CustomerRef: { value: '50', name: 'Jane Smith' },
      Line: [{ Amount: 3025, LinkedTxn: [{ TxnId: '100', TxnType: 'Invoice' }] }],
      MetaData: { CreateTime: '', LastUpdatedTime: '' },
      SyncToken: '0',
    });

    const payment = await recordPayment('100', 3025, 'CreditCard', 'REF-123');
    expect(payment.TotalAmt).toBe(3025);
    expect(mockRead).toHaveBeenCalledWith('Invoice', '100');
  });

  it('links payment to invoice', async () => {
    mockRead.mockResolvedValueOnce(MOCK_INVOICE);
    mockCreate.mockResolvedValueOnce({ Id: '201', TotalAmt: 500 });

    await recordPayment('100', 500);

    const paymentData = mockCreate.mock.calls[0][1] as Record<string, unknown>;
    const lines = paymentData.Line as Array<{ LinkedTxn: Array<{ TxnId: string }> }>;
    expect(lines[0].LinkedTxn[0].TxnId).toBe('100');
  });
});

/* ─── Overdue Invoice Tests ─────────────────────────────────── */

describe('getOverdueInvoices', () => {
  it('returns invoices with days overdue', async () => {
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    mockQuery.mockResolvedValue([{
      ...MOCK_INVOICE,
      DueDate: pastDate,
      Balance: 1000,
    }]);

    const overdue = await getOverdueInvoices();
    expect(overdue).toHaveLength(1);
    expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(9);
  });

  it('returns empty array when no overdue invoices', async () => {
    mockQuery.mockResolvedValue([]);
    const overdue = await getOverdueInvoices();
    expect(overdue).toHaveLength(0);
  });
});

/* ─── Unpaid Invoice Tests ──────────────────────────────────── */

describe('getUnpaidInvoices', () => {
  it('queries for invoices with balance > 0', async () => {
    mockQuery.mockResolvedValue([MOCK_INVOICE]);

    const unpaid = await getUnpaidInvoices();
    expect(unpaid).toHaveLength(1);
    expect(mockQuery.mock.calls[0][0]).toContain("Balance > '0'");
  });
});

/* ─── Customer Invoices Tests ───────────────────────────────── */

describe('getCustomerInvoices', () => {
  it('queries invoices for specific customer', async () => {
    mockQuery.mockResolvedValue([MOCK_INVOICE]);

    const invoices = await getCustomerInvoices('50');
    expect(invoices).toHaveLength(1);
    expect(mockQuery.mock.calls[0][0]).toContain("CustomerRef = '50'");
  });
});

/* ─── Invoice Analytics Tests ───────────────────────────────── */

describe('getInvoiceAnalytics', () => {
  it('returns complete analytics object', async () => {
    mockQuery.mockResolvedValueOnce([MOCK_INVOICE]); // Unpaid
    mockQuery.mockResolvedValueOnce([]); // Overdue
    mockQuery.mockResolvedValueOnce([]); // Recent payments

    const analytics = await getInvoiceAnalytics();
    expect(analytics.totalOutstanding).toBeDefined();
    expect(analytics.overdueCount).toBeDefined();
    expect(analytics.invoicesByStatus).toBeDefined();
  });

  it('calculates outstanding correctly', async () => {
    mockQuery.mockResolvedValueOnce([
      { ...MOCK_INVOICE, Balance: 1000 },
      { ...MOCK_INVOICE, Id: '101', Balance: 500 },
    ]); // Unpaid
    mockQuery.mockResolvedValueOnce([]); // Overdue
    mockQuery.mockResolvedValueOnce([]); // Recent payments

    const analytics = await getInvoiceAnalytics();
    expect(analytics.totalOutstanding).toBe(1500);
  });

  it('identifies partial payments', async () => {
    mockQuery.mockResolvedValueOnce([
      { ...MOCK_INVOICE, TotalAmt: 3000, Balance: 1000 }, // Partial
    ]);
    mockQuery.mockResolvedValueOnce([]); // Overdue
    mockQuery.mockResolvedValueOnce([]); // Recent payments

    const analytics = await getInvoiceAnalytics();
    expect(analytics.invoicesByStatus.partial).toBe(1);
  });
});

/* ─── Payment Reminders Tests ───────────────────────────────── */

describe('getPaymentReminders', () => {
  it('categorizes reminders by urgency', async () => {
    const today = new Date();
    const overdue30 = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dueToday = today.toISOString().split('T')[0];
    const upcoming = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    mockQuery.mockResolvedValue([
      { ...MOCK_INVOICE, DueDate: overdue30, Balance: 500 },
      { ...MOCK_INVOICE, Id: '102', DueDate: dueToday, Balance: 300 },
      { ...MOCK_INVOICE, Id: '103', DueDate: upcoming, Balance: 200 },
    ]);

    const reminders = await getPaymentReminders();
    expect(reminders.length).toBeGreaterThan(0);
    // Most urgent first
    const types = reminders.map(r => r.reminderType);
    expect(types.includes('overdue_30') || types.includes('overdue_7')).toBe(true);
  });

  it('returns empty for no unpaid invoices', async () => {
    mockQuery.mockResolvedValue([]);
    const reminders = await getPaymentReminders();
    expect(reminders).toHaveLength(0);
  });
});

/* ─── Send Invoice Tests ────────────────────────────────────── */

describe('sendInvoice', () => {
  it('throws when invoice has no email', async () => {
    mockRead.mockResolvedValue({ ...MOCK_INVOICE, BillEmail: undefined });

    await expect(sendInvoice('100')).rejects.toThrow('no email address');
  });
});

/* ─── Void Invoice Tests ────────────────────────────────────── */

describe('voidInvoice', () => {
  it('deletes the invoice using its sync token', async () => {
    mockRead.mockResolvedValue(MOCK_INVOICE);
    mockDelete.mockResolvedValue(undefined);

    await voidInvoice('100');
    expect(mockDelete).toHaveBeenCalledWith('Invoice', '100', '0');
  });
});
