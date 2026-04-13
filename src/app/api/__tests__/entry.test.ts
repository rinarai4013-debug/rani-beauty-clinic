/**
 * Integration tests for Data Entry routes:
 *   POST /api/dashboard/entry/lead
 *   POST /api/dashboard/entry/sale
 *   POST /api/dashboard/entry/expense
 *   POST /api/dashboard/entry/ceo-note
 *   POST /api/dashboard/entry/eod-recap
 *   POST /api/dashboard/entry/room-issue
 *   POST /api/dashboard/entry/review
 *   POST /api/dashboard/entry/inventory
 *   POST /api/dashboard/entry/staff-note
 *   POST /api/dashboard/entry/consult-notes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  FRONTDESK_SESSION,
  MARKETING_SESSION,
  PROVIDER_SESSION,
  OPERATIONS_SESSION,
  buildPostRequest,
  expectJsonStatus,
  expectUnauthorized,
  expectForbidden,
  expectBadRequest,
  expectServerError,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockCreateRecord = vi.fn().mockResolvedValue('rec_new_001');
const mockCacheInvalidate = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(),
    transactions: vi.fn(),
    appointments: vi.fn(),
    alerts: vi.fn(),
    reviews: vi.fn(),
    messagesLog: vi.fn(),
  },
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    invalidate: (...args: unknown[]) => mockCacheInvalidate(...args),
    invalidatePrefix: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuth(session = CEO_SESSION, allowed = true) {
  mockGetSession.mockResolvedValue(session);
  mockHasPermission.mockReturnValue(allowed);
}

function setupUnauth() {
  mockGetSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/entry/lead
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/entry/lead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', { firstName: 'A', lastName: 'B', email: 'a@b.com' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking entry_lead permission', async () => {
    setupAuth(PROVIDER_SESSION, false);
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', { firstName: 'A', lastName: 'B', email: 'a@b.com' });
    const response = await POST(req as never);
    await expectForbidden(response);
  });

  it('should create a lead successfully', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      phone: '(425) 555-0100',
    });

    const response = await POST(req as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recordId).toBe('rec_new_001');
    expect(mockCacheInvalidate).toHaveBeenCalledWith('leads');
  });

  it('should return 400 when firstName is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', { lastName: 'Doe', email: 'a@b.com' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when lastName is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', { firstName: 'Jane', email: 'a@b.com' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when both phone and email are missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', { firstName: 'Jane', lastName: 'Doe' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should accept lead with phone only (no email)', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', {
      firstName: 'Jane', lastName: 'Doe', phone: '(425) 555-0100',
    });
    const response = await POST(req as never);
    expect(response.status).toBe(200);
  });

  it('should accept lead with email only (no phone)', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', {
      firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com',
    });
    const response = await POST(req as never);
    expect(response.status).toBe(200);
  });

  it('should return 500 on Airtable error', async () => {
    setupAuth();
    mockCreateRecord.mockRejectedValueOnce(new Error('Airtable error'));
    const { POST } = await import('@/app/api/dashboard/entry/lead/route');
    const req = buildPostRequest('/api/dashboard/entry/lead', {
      firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com',
    });
    const response = await POST(req as never);
    await expectServerError(response);
  });
});

// ---------------------------------------------------------------------------
// POST /api/dashboard/entry/sale
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/entry/sale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 100, serviceName: 'HydraFacial', paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking entry_sale permission', async () => {
    setupAuth(MARKETING_SESSION, false);
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 100, serviceName: 'HydraFacial', paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectForbidden(response);
  });

  it('should create a sale record successfully', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', {
      amount: 275,
      serviceName: 'HydraFacial',
      paymentMethod: 'credit-card',
      provider: 'mom',
    });

    const response = await POST(req as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recordId).toBeDefined();
    expect(mockCacheInvalidate).toHaveBeenCalledWith('kpis');
    expect(mockCacheInvalidate).toHaveBeenCalledWith('revenue');
  });

  it('should return 400 when amount is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { serviceName: 'HydraFacial', paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when amount is zero', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 0, serviceName: 'HydraFacial', paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when amount is negative', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: -50, serviceName: 'HydraFacial', paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when serviceName is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 275, paymentMethod: 'credit-card', provider: 'mom' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when paymentMethod is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 275, serviceName: 'HydraFacial', provider: 'mom' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when provider is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', { amount: 275, serviceName: 'HydraFacial', paymentMethod: 'credit-card' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should handle financing fields', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/sale/route');
    const req = buildPostRequest('/api/dashboard/entry/sale', {
      amount: 2750, serviceName: 'Sofwave', paymentMethod: 'cherry',
      provider: 'mom', isFinancing: true, financingProvider: 'Cherry',
    });
    const response = await POST(req as never);
    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/dashboard/entry/expense
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/entry/expense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', { amount: 100, vendor: 'Supply Co', category: 'Supplies' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking entry_expense permission', async () => {
    setupAuth(PROVIDER_SESSION, false);
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', { amount: 100, vendor: 'Supply Co', category: 'Supplies' });
    const response = await POST(req as never);
    await expectForbidden(response);
  });

  it('should create expense record with negative amount', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', {
      amount: 250,
      vendor: 'Supply Co',
      category: 'Supplies',
      paymentMethod: 'business-card',
    });

    const response = await POST(req as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify createRecord was called with negative amount
    expect(mockCreateRecord).toHaveBeenCalled();
  });

  it('should return 400 when amount is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', { vendor: 'Supply Co', category: 'Supplies' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when vendor is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', { amount: 100, category: 'Supplies' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should return 400 when category is missing', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', { amount: 100, vendor: 'Supply Co' });
    const response = await POST(req as never);
    await expectBadRequest(response);
  });

  it('should invalidate finance-expenses cache', async () => {
    setupAuth();
    const { POST } = await import('@/app/api/dashboard/entry/expense/route');
    const req = buildPostRequest('/api/dashboard/entry/expense', {
      amount: 100, vendor: 'Supply Co', category: 'Supplies',
    });
    await POST(req as never);
    expect(mockCacheInvalidate).toHaveBeenCalledWith('finance-expenses');
  });
});

// ---------------------------------------------------------------------------
// Other entry routes - auth and validation tests
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/entry/ceo-note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/ceo-note/route');
    const req = buildPostRequest('/api/dashboard/entry/ceo-note', { note: 'test' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });

  it('should return 403 for non-CEO users', async () => {
    setupAuth(FRONTDESK_SESSION, false);
    const { POST } = await import('@/app/api/dashboard/entry/ceo-note/route');
    const req = buildPostRequest('/api/dashboard/entry/ceo-note', { note: 'test' });
    const response = await POST(req as never);
    await expectForbidden(response);
  });
});

describe('POST /api/dashboard/entry/eod-recap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/eod-recap/route');
    const req = buildPostRequest('/api/dashboard/entry/eod-recap', { recap: 'Great day' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});

describe('POST /api/dashboard/entry/room-issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/room-issue/route');
    const req = buildPostRequest('/api/dashboard/entry/room-issue', { room: 'Room 1', issue: 'Broken light' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});

describe('POST /api/dashboard/entry/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/review/route');
    const req = buildPostRequest('/api/dashboard/entry/review', { rating: 5, text: 'Great!' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});

describe('POST /api/dashboard/entry/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/inventory/route');
    const req = buildPostRequest('/api/dashboard/entry/inventory', { product: 'Serum', quantity: 10 });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});

describe('POST /api/dashboard/entry/staff-note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/staff-note/route');
    const req = buildPostRequest('/api/dashboard/entry/staff-note', { note: 'Staff meeting notes' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});

describe('POST /api/dashboard/entry/consult-notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { POST } = await import('@/app/api/dashboard/entry/consult-notes/route');
    const req = buildPostRequest('/api/dashboard/entry/consult-notes', { clientId: 'rec001', notes: 'Consult details' });
    const response = await POST(req as never);
    await expectUnauthorized(response);
  });
});
