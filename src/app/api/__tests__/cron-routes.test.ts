import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchAllMock = vi.fn();
const updateRecordMock = vi.fn();
const createRecordMock = vi.fn();

const kpisCreateMock = vi.fn();
const tablesTransactionsMock = vi.fn();
const tablesAppointmentsMock = vi.fn();
const tablesIntakesMock = vi.fn();
const tablesKpisMock = vi.fn();
const tablesTreatmentPlansMock = vi.fn();
const tablesMessagesLogMock = vi.fn();

const renderTemplateMock = vi.fn();
const resendSendMock = vi.fn();

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    transactions: (...args: unknown[]) => tablesTransactionsMock(...args),
    appointments: (...args: unknown[]) => tablesAppointmentsMock(...args),
    intakes: (...args: unknown[]) => tablesIntakesMock(...args),
    kpis: (...args: unknown[]) => tablesKpisMock(...args),
    treatmentPlans: (...args: unknown[]) => tablesTreatmentPlansMock(...args),
    messagesLog: (...args: unknown[]) => tablesMessagesLogMock(...args),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
  createRecord: (...args: unknown[]) => createRecordMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      followUpsSent: 'Follow-Ups Sent',
      status: 'Status',
    },
  },
}));

vi.mock('@/lib/plan-builder/follow-up-templates', () => ({
  renderTemplate: (...args: unknown[]) => renderTemplateMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => resendSendMock(...args),
    },
  })),
}));

describe('cron routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.CRON_SECRET = 'cron_secret';
    delete process.env.OWNER_PHONE;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.N8N_WEBHOOK_URL;
    process.env.RESEND_API_KEY = 're_test_key';

    tablesTransactionsMock.mockReturnValue('transactions');
    tablesAppointmentsMock.mockReturnValue('appointments');
    tablesIntakesMock.mockReturnValue('intakes');
    tablesKpisMock.mockReturnValue({ create: (...args: unknown[]) => kpisCreateMock(...args) });
    tablesTreatmentPlansMock.mockReturnValue('treatmentPlans');
    tablesMessagesLogMock.mockReturnValue('messagesLog');

    kpisCreateMock.mockResolvedValue({ id: 'kpi_1' });
    updateRecordMock.mockResolvedValue({ id: 'plan_1' });
    createRecordMock.mockResolvedValue({ id: 'msg_1' });

    renderTemplateMock.mockReturnValue({
      subject: 'Follow-up from Rani',
      body: 'Please review your plan.',
    });

    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'transactions') {
        return [
          { id: 'txn1', fields: { Amount: 100, Status: 'Completed' } },
          { id: 'txn2', fields: { Amount: 200, Status: 'Completed' } },
        ];
      }
      if (table === 'appointments') {
        return [
          { id: 'appt1', fields: { Status: 'completed' } },
          { id: 'appt2', fields: { Status: 'completed' } },
        ];
      }
      if (table === 'intakes') {
        return [{ id: 'lead1', fields: {} }];
      }
      if (table === 'treatmentPlans') {
        return [];
      }
      return [];
    });

    resendSendMock.mockResolvedValue({ id: 'email_1' });
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof global.fetch;
  });

  it('GET /api/cron/daily-kpi enforces CRON_SECRET and returns not_implemented', async () => {
    const { GET } = await import('@/app/api/cron/daily-kpi/route');

    const unauthorized = await GET(
      new Request('http://localhost:3000/api/cron/daily-kpi', {
        headers: { authorization: 'Bearer wrong' },
      }) as never,
    );
    expect(unauthorized.status).toBe(401);

    const ok = await GET(
      new Request('http://localhost:3000/api/cron/daily-kpi', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    expect(ok.status).toBe(501);
  });

  it('GET /api/cron/daily-kpi returns 401 when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const { GET } = await import('@/app/api/cron/daily-kpi/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/daily-kpi') as never,
    );

    expect(response.status).toBe(401);
  });

  it('GET /api/cron/daily-briefing enforces auth and stores KPI snapshot', async () => {
    const { GET } = await import('@/app/api/cron/daily-briefing/route');

    const unauthorized = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing', {
        headers: { authorization: 'Bearer wrong' },
      }) as never,
    );
    expect(unauthorized.status).toBe(401);

    const ok = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await ok.json();

    expect(ok.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.revenue).toBe(300);
    expect(body.bookings).toBe(2);
    expect(body.leads).toBe(1);
    expect(kpisCreateMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/cron/daily-briefing allows execution when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;

    const { GET } = await import('@/app/api/cron/daily-briefing/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(kpisCreateMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/cron/daily-briefing sends Twilio SMS when configured', async () => {
    process.env.OWNER_PHONE = '+14255550100';
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST';
    process.env.TWILIO_AUTH_TOKEN = 'auth';
    process.env.TWILIO_FROM_NUMBER = '+14250000000';

    const { GET } = await import('@/app/api/cron/daily-briefing/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.twilio.com/2010-04-01/Accounts/AC_TEST/Messages.json'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('GET /api/cron/daily-briefing returns 500 when Twilio request fails', async () => {
    process.env.OWNER_PHONE = '+14255550100';
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST';
    process.env.TWILIO_AUTH_TOKEN = 'auth';
    process.env.TWILIO_FROM_NUMBER = '+14250000000';
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('twilio down'));

    const { GET } = await import('@/app/api/cron/daily-briefing/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Briefing failed');
  });

  it('GET /api/cron/daily-briefing returns 500 when KPI snapshot write fails', async () => {
    kpisCreateMock.mockRejectedValueOnce(new Error('kpi table write failed'));

    const { GET } = await import('@/app/api/cron/daily-briefing/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/daily-briefing', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Briefing failed');
  });

  it('GET /api/cron/plan-followups enforces auth and returns empty-summary when no actionable plans', async () => {
    const { GET } = await import('@/app/api/cron/plan-followups/route');

    const unauthorized = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer wrong' },
      }) as never,
    );
    expect(unauthorized.status).toBe(401);

    const ok = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await ok.json();

    expect(ok.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.plansEvaluated).toBe(0);
    expect(body.summary.followUpsSent).toBe(0);
  });

  it('GET /api/cron/plan-followups allows execution when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.plansEvaluated).toBe(0);
  });

  it('GET /api/cron/plan-followups executes reminder flow for stale sent plan', async () => {
    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'treatmentPlans') {
        return [
          {
            id: 'plan_1',
            fields: {
              Status: 'Sent',
              'Client Name': 'Jane Doe',
              'Client Email': 'jane@example.com',
              'Client Phone': '+14255550100',
              'Plan URL': 'https://ranibeautyclinic.com/plan/abc',
              'Sent At': new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
              'Last Viewed At': '',
              'View Count': 0,
              'Follow-Ups Sent': '',
              'Financing Clicked At': '',
              'Intake Record ID': 'int_1',
            },
          },
        ];
      }
      return [];
    });

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.followUpsSent).toBe(1);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
    expect(createRecordMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/cron/plan-followups executes confidence-builder follow-up and status transition', async () => {
    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'treatmentPlans') {
        return [
          {
            id: 'plan_2',
            fields: {
              Status: 'Viewed',
              'Client Name': 'Mia Doe',
              'Client Email': 'mia@example.com',
              'Client Phone': '+14255550100',
              'Plan URL': 'https://ranibeautyclinic.com/plan/xyz',
              'Sent At': new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
              'Last Viewed At': new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
              'View Count': 1,
              'Follow-Ups Sent': '',
              'Financing Clicked At': '',
              'Intake Record ID': 'int_2',
            },
          },
        ];
      }
      return [];
    });

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.followUpsSent).toBe(1);
    expect(body.results[0].templateId).toBe('confidence_builder');
    expect(updateRecordMock).toHaveBeenCalledWith(
      'treatmentPlans',
      'plan_2',
      expect.objectContaining({ Status: 'Needs Follow-Up' }),
    );
  });

  it('GET /api/cron/plan-followups marks missing-email follow-ups as failed without writing records', async () => {
    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'treatmentPlans') {
        return [
          {
            id: 'plan_3',
            fields: {
              Status: 'Viewed',
              'Client Name': 'No Email Client',
              'Client Email': '',
              'Client Phone': '+14255550100',
              'Sent At': new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
              'Last Viewed At': new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
              'View Count': 1,
              'Follow-Ups Sent': '',
              'Financing Clicked At': '',
            },
          },
        ];
      }
      return [];
    });

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.followUpsFailed).toBe(1);
    expect(body.results[0].error).toContain('No email');
    expect(updateRecordMock).not.toHaveBeenCalled();
    expect(createRecordMock).not.toHaveBeenCalled();
  });

  it('GET /api/cron/plan-followups returns failed result when template resolution fails', async () => {
    renderTemplateMock.mockReturnValueOnce(null);
    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'treatmentPlans') {
        return [
          {
            id: 'plan_4',
            fields: {
              Status: 'Viewed',
              'Client Name': 'Template Missing',
              'Client Email': 'missing@example.com',
              'Sent At': new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
              'Last Viewed At': new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
              'View Count': 1,
              'Follow-Ups Sent': '',
              'Financing Clicked At': '',
            },
          },
        ];
      }
      return [];
    });

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.followUpsFailed).toBe(1);
    expect(body.results[0].error).toContain('Template');
    expect(updateRecordMock).not.toHaveBeenCalled();
  });

  it('GET /api/cron/plan-followups posts SMS payload to n8n webhook when configured', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://hooks.n8n.local';
    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'treatmentPlans') {
        return [
          {
            id: 'plan_5',
            fields: {
              Status: 'Sent',
              'Client Name': 'SMS Client',
              'Client Email': 'sms@example.com',
              'Client Phone': '+14255550100',
              'Plan URL': 'https://ranibeautyclinic.com/plan/sms',
              'Sent At': new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
              'Last Viewed At': '',
              'View Count': 0,
              'Follow-Ups Sent': '',
              'Financing Clicked At': '',
              'Intake Record ID': 'int_5',
            },
          },
        ];
      }
      return [];
    });

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.followUpsSent).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://hooks.n8n.local/webhook/plan-followup-sms'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('GET /api/cron/plan-followups returns 500 when plan fetch fails', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('plans table unavailable'));

    const { GET } = await import('@/app/api/cron/plan-followups/route');
    const response = await GET(
      new Request('http://localhost:3000/api/cron/plan-followups', {
        headers: { authorization: 'Bearer cron_secret' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Follow-up cron failed');
  });
});
