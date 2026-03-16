// Square API client for live payment/transaction data
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const BASE_URL = 'https://connect.squareup.com/v2';

export interface SquarePayment {
  id: string;
  created_at: string;
  updated_at: string;
  amount_money: { amount: number; currency: string };
  tip_money?: { amount: number; currency: string };
  status: string;
  source_type: string;
  card_details?: {
    card: { card_brand: string; last_4: string };
  };
  note?: string;
  order_id?: string;
  customer_id?: string;
  location_id: string;
  receipt_url?: string;
}

export interface SquareOrder {
  id: string;
  created_at: string;
  state: string;
  total_money: { amount: number; currency: string };
  line_items?: Array<{
    name: string;
    quantity: string;
    base_price_money: { amount: number; currency: string };
    total_money: { amount: number; currency: string };
    variation_name?: string;
  }>;
  fulfillments?: Array<{
    type: string;
    state: string;
  }>;
}

export interface ParsedTransaction {
  id: string;
  date: string;
  amount: number;
  tip: number;
  total: number;
  status: string;
  paymentMethod: string;
  cardLast4?: string;
  note?: string;
  receiptUrl?: string;
  services: string[];
}

async function squareFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN not configured');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Square API error: ${res.status} — ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

export async function listPayments(options?: {
  beginTime?: string;
  endTime?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ payments: SquarePayment[]; cursor?: string }> {
  const params = new URLSearchParams();
  if (options?.beginTime) params.set('begin_time', options.beginTime);
  if (options?.endTime) params.set('end_time', options.endTime);
  if (options?.cursor) params.set('cursor', options.cursor);
  params.set('limit', String(options?.limit || 100));
  params.set('sort_order', 'DESC');

  return squareFetch<{ payments: SquarePayment[]; cursor?: string }>(
    `/payments?${params.toString()}`
  );
}

export async function getPayment(paymentId: string): Promise<{ payment: SquarePayment }> {
  return squareFetch(`/payments/${paymentId}`);
}

export async function searchOrders(options?: {
  locationIds?: string[];
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ orders: SquareOrder[]; cursor?: string }> {
  const body: Record<string, unknown> = {
    return_entries: false,
    limit: options?.limit || 100,
  };

  if (options?.locationIds) {
    body.location_ids = options.locationIds;
  }

  const dateFilter: Record<string, unknown> = {};
  if (options?.startDate) {
    dateFilter.start_at = options.startDate;
  }
  if (options?.endDate) {
    dateFilter.end_at = options.endDate;
  }

  if (Object.keys(dateFilter).length > 0) {
    body.query = {
      filter: {
        date_time_filter: {
          created_at: dateFilter,
        },
      },
      sort: {
        sort_field: 'CREATED_AT',
        sort_order: 'DESC',
      },
    };
  }

  if (options?.cursor) {
    body.cursor = options.cursor;
  }

  return squareFetch('/orders/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listLocations(): Promise<{
  locations: Array<{ id: string; name: string; address: Record<string, string> }>;
}> {
  return squareFetch('/locations');
}

export function parsePayment(payment: SquarePayment): ParsedTransaction {
  const amountCents = payment.amount_money?.amount || 0;
  const tipCents = payment.tip_money?.amount || 0;

  return {
    id: payment.id,
    date: payment.created_at,
    amount: amountCents / 100,
    tip: tipCents / 100,
    total: (amountCents + tipCents) / 100,
    status: payment.status,
    paymentMethod: payment.card_details?.card?.card_brand || payment.source_type || 'Unknown',
    cardLast4: payment.card_details?.card?.last_4,
    note: payment.note,
    receiptUrl: payment.receipt_url,
    services: [], // Populated from order line items
  };
}

export async function getAll2026Payments(): Promise<ParsedTransaction[]> {
  const allPayments: ParsedTransaction[] = [];
  let cursor: string | undefined;

  do {
    const result = await listPayments({
      beginTime: '2026-01-01T00:00:00Z',
      endTime: new Date().toISOString(),
      cursor,
      limit: 100,
    });

    if (result.payments) {
      allPayments.push(...result.payments.map(parsePayment));
    }
    cursor = result.cursor;
  } while (cursor);

  return allPayments;
}

export function isConfigured(): boolean {
  return !!SQUARE_ACCESS_TOKEN;
}
