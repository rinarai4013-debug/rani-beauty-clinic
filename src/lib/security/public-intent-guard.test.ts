import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_BASE_URL: 'https://ranibeautyclinic.com',
    NEXT_PUBLIC_SITE_URL: 'https://www.ranibeautyclinic.com',
    CORS_ALLOWED_ORIGINS: 'https://book.ranibeautyclinic.com',
  },
}));

import { enforceAllowedPublicOrigin, enforceContentLength } from './public-intent-guard';

describe('public-intent-guard', () => {
  it('allows configured origins', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'https://ranibeautyclinic.com' },
    });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('rejects unknown origins', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'https://evil.example.com' },
    });
    const response = enforceAllowedPublicOrigin(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: 'Origin not allowed' });
  });

  it('allows non-browser requests without origin headers', () => {
    const request = new Request('http://localhost:3000/api/test', { method: 'POST' });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('rejects oversized payloads', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '2048' },
    });
    const response = enforceContentLength(request, 1024);
    expect(response?.status).toBe(413);
    await expect(response?.json()).resolves.toEqual({ error: 'Request body too large' });
  });
});
