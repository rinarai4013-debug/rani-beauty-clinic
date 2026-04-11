import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const verifySession = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  COOKIE_NAME: 'rani-dashboard-session',
  verifySession,
}));

import { requireAuth, unauthorized, forbidden } from '@/lib/auth/middleware';

function makeRequest(token?: string) {
  return {
    cookies: {
      get: vi.fn(() => (token ? { value: token } : undefined)),
    },
  } as unknown as NextRequest;
}

describe('auth/middleware', () => {
  beforeEach(() => {
    verifySession.mockReset();
  });

  describe('requireAuth', () => {
    it('returns null when no cookie is present', async () => {
      const result = await requireAuth(makeRequest());

      expect(result).toBeNull();
      expect(verifySession).not.toHaveBeenCalled();
    });

    it('returns null when session verification fails', async () => {
      verifySession.mockResolvedValueOnce(null);

      const result = await requireAuth(makeRequest('expired-token'));

      expect(result).toBeNull();
      expect(verifySession).toHaveBeenCalledWith('expired-token');
    });

    it('returns the verified session when no role restriction is provided', async () => {
      const session = {
        userId: 'rina-1',
        role: 'admin',
        name: 'Rina',
      };
      verifySession.mockResolvedValueOnce(session);

      const result = await requireAuth(makeRequest('valid-token'));

      expect(result).toEqual(session);
    });

    it('returns the verified session when the role is allowed', async () => {
      const session = {
        userId: 'mom-1',
        role: 'provider',
        name: 'Mom',
      };
      verifySession.mockResolvedValueOnce(session);

      const result = await requireAuth(makeRequest('provider-token'), [
        'provider',
        'admin',
      ]);

      expect(result).toEqual(session);
    });

    it('returns null when the verified role is not allowed', async () => {
      verifySession.mockResolvedValueOnce({
        userId: 'frontdesk-1',
        role: 'frontdesk',
        name: 'Front Desk',
      });

      const result = await requireAuth(makeRequest('frontdesk-token'), [
        'admin',
        'provider',
      ]);

      expect(result).toBeNull();
    });
  });

  describe('response helpers', () => {
    it('unauthorized returns a 401 JSON response', async () => {
      const response = unauthorized();

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: 'Unauthorized',
      });
    });

    it('forbidden returns a 403 JSON response', async () => {
      const response = forbidden();

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: 'Forbidden',
      });
    });
  });
});
