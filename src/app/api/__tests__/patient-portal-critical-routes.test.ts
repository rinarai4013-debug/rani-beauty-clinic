import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPatientSessionMock = vi.fn();
const clientsFindMock = vi.fn();
const appointmentsFindMock = vi.fn();
const membershipsFindMock = vi.fn();
const transactionsFindMock = vi.fn();
const rateLimitedQueryMock = vi.fn();
const fetchFirstMock = vi.fn();

vi.mock('@/lib/patient-auth/session', () => ({
  getPatientSession: (...args: unknown[]) => getPatientSessionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({
      find: (...args: unknown[]) => clientsFindMock(...args),
    })),
    appointments: vi.fn(() => ({
      find: (...args: unknown[]) => appointmentsFindMock(...args),
    })),
    memberships: vi.fn(() => ({
      find: (...args: unknown[]) => membershipsFindMock(...args),
    })),
    transactions: vi.fn(() => ({
      find: (...args: unknown[]) => transactionsFindMock(...args),
    })),
    treatmentPlans: vi.fn(() => ({})),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    clients: {
      appointments: 'Appointments',
      memberships: 'Memberships',
      transactions: 'Transactions',
    },
    appointments: {
      service: 'Service',
      date: 'Date',
      time: 'Time',
      duration: 'Duration',
      status: 'Status',
      provider: 'Provider',
      category: 'Category',
      amountPaid: 'Amount Paid',
    },
    memberships: {
      tier: 'Tier',
      monthlyPrice: 'Monthly Price',
      status: 'Status',
      startDate: 'Start Date',
    },
    transactions: {
      date: 'Date',
      amount: 'Amount',
      type: 'Type',
      serviceName: 'Service Name',
      status: 'Status',
      paymentMethod: 'Payment Method',
    },
    treatmentPlans: {
      clientName: 'Client Name',
      status: 'Status',
      createdDate: 'Created Date',
      planTier: 'Plan Tier',
      planValue: 'Plan Value',
      servicesIncluded: 'Services Included',
      planUrl: 'Plan URL',
    },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((value: string) => value),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('patient portal critical routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPatientSessionMock.mockResolvedValue({
      patientId: 'rec_client_1',
      email: 'patient@example.com',
      name: 'Jane Doe',
    });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    clientsFindMock.mockResolvedValue({
      id: 'rec_client_1',
      fields: {
        Appointments: ['apt_1', 'apt_2'],
        Memberships: ['mem_1', 'mem_2'],
        Transactions: ['txn_1', 'txn_2', 'txn_3'],
      },
    });
    appointmentsFindMock.mockImplementation(async (id: string) => {
      const records: Record<string, { id: string; fields: Record<string, unknown> }> = {
        apt_1: {
          id: 'apt_1',
          fields: {
            Service: 'HydraFacial',
            Date: '2099-01-01',
            Time: '10:00',
            Duration: 60,
            Status: 'Booked',
            Provider: 'Rina',
            Category: 'Facial',
            'Amount Paid': 250,
          },
        },
        apt_2: {
          id: 'apt_2',
          fields: {
            Service: 'Botox',
            Date: '2020-01-01',
            Time: '09:00',
            Duration: 30,
            Status: 'Completed',
            Provider: 'Rina',
            Category: 'Injectable',
            'Amount Paid': 450,
          },
        },
      };
      return records[id];
    });
    membershipsFindMock.mockImplementation(async (id: string) => {
      const records: Record<string, { id: string; fields: Record<string, unknown> }> = {
        mem_1: {
          id: 'mem_1',
          fields: {
            Tier: 'Gold',
            'Monthly Price': 199,
            Status: 'Active',
            'Start Date': '2026-01-01',
          },
        },
        mem_2: {
          id: 'mem_2',
          fields: {
            Tier: 'Silver',
            'Monthly Price': 99,
            Status: 'Cancelled',
            'Start Date': '2025-01-01',
          },
        },
      };
      return records[id];
    });
    transactionsFindMock.mockImplementation(async (id: string) => {
      const records: Record<string, { id: string; fields: Record<string, unknown> }> = {
        txn_1: {
          id: 'txn_1',
          fields: {
            Date: '2026-04-01',
            Amount: 199,
            Type: 'Membership Payment',
            'Service Name': 'Gold Membership',
            Status: 'Paid',
            'Payment Method': 'Card',
          },
        },
        txn_2: {
          id: 'txn_2',
          fields: {
            Date: '2026-03-01',
            Amount: 99,
            Type: 'Recurring',
            'Service Name': 'Membership Renewal',
            Status: 'Paid',
            'Payment Method': 'Card',
          },
        },
        txn_3: {
          id: 'txn_3',
          fields: {
            Date: '2026-02-01',
            Amount: 450,
            Type: 'Treatment',
            'Service Name': 'Botox',
            Status: 'Paid',
            'Payment Method': 'Card',
          },
        },
      };
      return records[id];
    });
    fetchFirstMock.mockResolvedValue([
      {
        id: 'plan_1',
        fields: {
          'Plan Tier': 'best',
          'Plan Value': 3500,
          'Services Included': JSON.stringify(['Sofwave', 'HydraFacial']),
          Status: 'Sent',
          'Created Date': '2026-03-01',
          'Plan URL': 'https://example.com/plan',
        },
      },
    ]);
  });

  it('GET /api/patient/appointments returns 401 when unauthenticated', async () => {
    getPatientSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/patient/appointments/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/patient/appointments separates upcoming and past appointments', async () => {
    const { GET } = await import('@/app/api/patient/appointments/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.upcoming).toHaveLength(1);
    expect(body.past).toHaveLength(1);
  });

  it('GET /api/patient/treatments returns only completed treatment history', async () => {
    const { GET } = await import('@/app/api/patient/treatments/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.treatments).toHaveLength(1);
    expect(body.treatments[0].service).toBe('Botox');
  });

  it('GET /api/patient/membership returns active membership first', async () => {
    const { GET } = await import('@/app/api/patient/membership/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.membership).toBeDefined();
    expect(body.membership.tier).toBe('Gold');
  });

  it('GET /api/patient/membership/billing filters billing history to membership transactions', async () => {
    const { GET } = await import('@/app/api/patient/membership/billing/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.billingHistory).toHaveLength(2);
    expect(body.billingHistory.every((entry: { type: string }) => /membership|recurring/i.test(entry.type))).toBe(true);
  });

  it('GET /api/patient/plan returns active treatment plan details', async () => {
    const { GET } = await import('@/app/api/patient/plan/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plan).toBeDefined();
    expect(body.plan.planTier).toBe('best');
    expect(Array.isArray(body.plan.servicesIncluded)).toBe(true);
  });
});
