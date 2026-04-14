import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const searchKnowledgeBaseMock = vi.fn();
const getKnowledgeBaseStatsMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    STANDARD: 60,
  },
}));

vi.mock('@/lib/rag/knowledge-base', () => ({
  searchKnowledgeBase: (...args: unknown[]) => searchKnowledgeBaseMock(...args),
  getKnowledgeBaseStats: (...args: unknown[]) => getKnowledgeBaseStatsMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('GET /api/dashboard/knowledge-base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ userId: 'u1', role: 'ceo' });
    cacheGetMock.mockReturnValue(null);
    searchKnowledgeBaseMock.mockReturnValue([{ id: 'doc_1' }]);
    getKnowledgeBaseStatsMock.mockReturnValue({ totalDocuments: 5 });
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/knowledge-base') as never);
    expect(response.status).toBe(401);
  });

  it('rejects overly long query', async () => {
    const longQuery = 'a'.repeat(201);
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const response = await GET(
      new Request(`http://localhost:3000/api/dashboard/knowledge-base?q=${longQuery}`) as never,
    );
    expect(response.status).toBe(400);
  });

  it('rejects control characters in query', async () => {
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/knowledge-base?q=abc%0Adef') as never,
    );
    expect(response.status).toBe(400);
  });

  it('searches and caches when query is present', async () => {
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/knowledge-base?q=Botox') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: 'doc_1' }]);
    expect(searchKnowledgeBaseMock).toHaveBeenCalledWith('Botox');
    expect(cacheSetMock).toHaveBeenCalledWith(
      expect.stringContaining('knowledge-base-search:botox'),
      [{ id: 'doc_1' }],
      60,
    );
  });

  it('returns stats payload when query is absent', async () => {
    const { GET } = await import('@/app/api/dashboard/knowledge-base/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/knowledge-base') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ totalDocuments: 5 });
    expect(getKnowledgeBaseStatsMock).toHaveBeenCalled();
  });
});

describe('GET /api/dashboard/training', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({ userId: 'u1', role: 'ceo' });
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/training/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/training') as never);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid role parameter', async () => {
    const { GET } = await import('@/app/api/dashboard/training/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/training?role=hacker') as never,
    );
    expect(response.status).toBe(400);
  });

  it('accepts role filter case-insensitively and returns only that role', async () => {
    const { GET } = await import('@/app/api/dashboard/training/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/training?role=Provider') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.modules)).toBe(true);
    for (const trainingModule of body.modules) {
      expect(trainingModule.role).toBe('provider');
    }
  });

  it('returns aggregate stats for full listing', async () => {
    const { GET } = await import('@/app/api/dashboard/training/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/training') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toBeDefined();
    expect(body.stats.totalModules).toBeGreaterThan(0);
    expect(body.byRole).toBeDefined();
  });
});
