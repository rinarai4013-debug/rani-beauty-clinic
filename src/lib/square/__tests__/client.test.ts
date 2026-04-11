import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    SQUARE_ACCESS_TOKEN: 'square-token',
  },
}));

import {
  listPayments,
  getPayment,
  searchOrders,
  listLocations,
  parsePayment,
  getAll2026Payments,
  isConfigured,
} from '@/lib/square/client';

describe('square/client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('lists payments with the expected query parameters and auth headers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okJson({ payments: [], cursor: 'next-cursor' })
    );

    const result = await listPayments({
      beginTime: '2026-04-01T00:00:00Z',
      endTime: '2026-04-10T00:00:00Z',
      limit: 50,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/payments?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer square-token',
          'Square-Version': '2024-01-18',
        }),
      })
    );
    expect(result.cursor).toBe('next-cursor');
  });

  it('fetches a single payment by id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okJson({ payment: { id: 'pay-1' } })
    );

    await expect(getPayment('pay-1')).resolves.toEqual({
      payment: { id: 'pay-1' },
    });
  });

  it('searches orders with a POST body containing date filters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okJson({ orders: [], cursor: undefined })
    );

    await searchOrders({
      locationIds: ['loc-1'],
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-10T00:00:00Z',
      limit: 25,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders/search'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );

    const requestBody = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string
    );

    expect(requestBody).toMatchObject({
      location_ids: ['loc-1'],
      limit: 25,
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: '2026-04-01T00:00:00Z',
              end_at: '2026-04-10T00:00:00Z',
            },
          },
        },
      },
    });
  });

  it('lists locations from the Square API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okJson({ locations: [{ id: 'loc-1', name: 'Renton' }] })
    );

    await expect(listLocations()).resolves.toEqual({
      locations: [{ id: 'loc-1', name: 'Renton' }],
    });
  });

  it('parses Square payments from cents to dollar totals', () => {
    expect(
      parsePayment({
        id: 'pay-1',
        created_at: '2026-04-10T12:00:00Z',
        updated_at: '2026-04-10T12:00:00Z',
        amount_money: { amount: 27500, currency: 'USD' },
        tip_money: { amount: 2500, currency: 'USD' },
        status: 'COMPLETED',
        source_type: 'CARD',
        card_details: {
          card: {
            card_brand: 'VISA',
            last_4: '4242',
          },
        },
        note: 'Sofwave',
        location_id: 'loc-1',
        receipt_url: 'https://squareup.com/receipt',
      })
    ).toEqual({
      id: 'pay-1',
      date: '2026-04-10T12:00:00Z',
      amount: 275,
      tip: 25,
      total: 300,
      status: 'COMPLETED',
      paymentMethod: 'VISA',
      cardLast4: '4242',
      note: 'Sofwave',
      receiptUrl: 'https://squareup.com/receipt',
      services: [],
    });
  });

  it('paginates through all 2026 payments', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        okJson({
          payments: [
            {
              id: 'pay-1',
              created_at: '2026-01-01T12:00:00Z',
              updated_at: '2026-01-01T12:00:00Z',
              amount_money: { amount: 27500, currency: 'USD' },
              status: 'COMPLETED',
              source_type: 'CARD',
              location_id: 'loc-1',
            },
          ],
          cursor: 'page-2',
        })
      )
      .mockResolvedValueOnce(
        okJson({
          payments: [
            {
              id: 'pay-2',
              created_at: '2026-02-01T12:00:00Z',
              updated_at: '2026-02-01T12:00:00Z',
              amount_money: { amount: 39500, currency: 'USD' },
              status: 'COMPLETED',
              source_type: 'CARD',
              location_id: 'loc-1',
            },
          ],
        })
      );

    const result = await getAll2026Payments();

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(275);
    expect(result[1].amount).toBe(395);
  });

  it('reports configured when the Square access token exists', () => {
    expect(isConfigured()).toBe(true);
  });
});

function okJson(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
}
