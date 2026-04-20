// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateRecord = vi.fn().mockResolvedValue('rec_incident_1');

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
  captureWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/airtable/client', () => ({
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
  Tables: {
    appointments: vi.fn(() => ({ table: 'appointments' })),
    intakes: vi.fn(() => ({ table: 'intakes' })),
  },
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    appointments: {
      date: 'Date',
      time: 'Time',
      service: 'Service Name',
      provider: 'Provider',
      status: 'Status',
      duration: 'Duration',
      bookingSource: 'Booking Source',
    },
  },
}));

import { computeMangomintSignature } from '@/lib/webhooks/mangomint';

const n8nFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

function signedRequest(path: string, payload: Record<string, unknown>, secret: string): Request {
  const raw = JSON.stringify(payload);
  const signature = computeMangomintSignature(secret, raw);

  return new Request(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-mangomint-signature': signature,
    },
    body: raw,
  });
}

describe('mangomint webhook event routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MANGOMINT_WEBHOOK_SECRET = 'webhook_secret';
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com';
    vi.stubGlobal('fetch', n8nFetch);
  });

  it('writes appointment-booked event to Airtable and forwards to n8n', async () => {
    const req = signedRequest(
      '/api/webhooks/mangomint/appointment-booked',
      {
        id: 'apt_100',
        serviceName: 'HydraFacial',
        providerName: 'Mom',
        startAt: '2026-04-19T17:30:00.000Z',
      },
      process.env.MANGOMINT_WEBHOOK_SECRET!,
    );

    const { POST } = await import('@/app/api/webhooks/mangomint/appointment-booked/route');
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    expect(n8nFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/mangomint-appointment-booked',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('writes appointment-completed event to Airtable and forwards to n8n', async () => {
    const req = signedRequest(
      '/api/webhooks/mangomint/appointment-completed',
      {
        id: 'apt_101',
        serviceName: 'Sofwave',
        providerName: 'Rina',
        startAt: '2026-04-19T18:30:00.000Z',
      },
      process.env.MANGOMINT_WEBHOOK_SECRET!,
    );

    const { POST } = await import('@/app/api/webhooks/mangomint/appointment-completed/route');
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    expect(n8nFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/mangomint-appointment-completed',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('writes appointment-cancelled event to Airtable and forwards to n8n', async () => {
    const req = signedRequest(
      '/api/webhooks/mangomint/appointment-cancelled',
      {
        id: 'apt_102',
        serviceName: 'VI Peel',
        providerName: 'Rina',
        startAt: '2026-04-19T19:30:00.000Z',
      },
      process.env.MANGOMINT_WEBHOOK_SECRET!,
    );

    const { POST } = await import('@/app/api/webhooks/mangomint/appointment-cancelled/route');
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    expect(n8nFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/mangomint-appointment-cancelled',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('writes form-submitted event to Airtable intakes and forwards to n8n', async () => {
    const req = signedRequest(
      '/api/webhooks/mangomint/form-submitted',
      {
        id: 'form_500',
        firstName: 'Ava',
        lastName: 'Lane',
        email: 'ava@example.com',
        phone: '(425) 555-1111',
      },
      process.env.MANGOMINT_WEBHOOK_SECRET!,
    );

    const { POST } = await import('@/app/api/webhooks/mangomint/form-submitted/route');
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    expect(n8nFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/mangomint-form-submitted',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns 401 on invalid signature', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/mangomint/appointment-booked', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': 'invalid',
      },
      body: JSON.stringify({ id: 'apt_invalid' }),
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/appointment-booked/route');
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    expect(mockCreateRecord).not.toHaveBeenCalled();
    expect(n8nFetch).not.toHaveBeenCalled();
  });
});
