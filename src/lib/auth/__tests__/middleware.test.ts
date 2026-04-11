import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types/auth';

import * as sessionModule from '../session';
import { requireAuth, unauthorized, forbidden } from '../middleware';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(token?: string) {
    return {
      cookies: {
        get: vi.fn((name: string) => {
          if (name === sessionModule.COOKIE_NAME && token) {
            return { value: token };
          }
          return undefined;
        }),
      },
    } as Parameters<typeof sessionModule.getSessionFromRequest>[0];
  }

  it('returns session payload from request cookie', async () => {
    const payload = { username: 'rina', role: 'ceo', displayName: 'Rina' };
    const sessionSpy = vi.spyOn(sessionModule, 'getSessionFromRequest');
    sessionSpy.mockResolvedValue(payload);

    const request = makeRequest('test-token');

    const result = await requireAuth(request);
    expect(result).toEqual(payload);
  });

  it('passes allowedRoles through to session request helper', async () => {
    const sessionFromRequest = vi.spyOn(sessionModule, 'getSessionFromRequest');
    sessionFromRequest.mockResolvedValue({
      username: 'frontdesk-user',
      role: 'frontdesk',
      displayName: 'Front Desk',
    });

    const request = makeRequest('token');
    const allowedRoles: UserRole[] = ['frontdesk', 'operations'];

    const result = await requireAuth(request, allowedRoles);

    expect(sessionFromRequest).toHaveBeenCalledWith(request, allowedRoles);
    expect(result).toEqual({
      username: 'frontdesk-user',
      role: 'frontdesk',
      displayName: 'Front Desk',
    });
  });

  it('returns null when role guard rejects', async () => {
    const sessionFromRequest = vi.spyOn(sessionModule, 'getSessionFromRequest');
    sessionFromRequest.mockResolvedValue(null);

    const request = makeRequest('token');
    const result = await requireAuth(request, ['ceo']);

    expect(result).toBeNull();
  });
});

describe('auth responses', () => {
  it('returns unauthorized JSON response', () => {
    const response = unauthorized();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
  });

  it('returns forbidden JSON response', () => {
    const response = forbidden();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(403);
  });

  it('returns unauthorized payload', async () => {
    const body = await unauthorized().json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns forbidden payload', async () => {
    const body = await forbidden().json();
    expect(body).toEqual({ error: 'Forbidden' });
  });
});
