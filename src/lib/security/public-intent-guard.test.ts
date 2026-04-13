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
  it('allows NEXT_PUBLIC_BASE_URL origin', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'https://ranibeautyclinic.com' },
    });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('allows NEXT_PUBLIC_SITE_URL origin', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'https://www.ranibeautyclinic.com' },
    });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('allows CORS_ALLOWED_ORIGINS entries', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'https://book.ranibeautyclinic.com' },
    });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('allows localhost dev origins in non-production', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
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

  it('uses referer origin when origin header is missing', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { referer: 'https://ranibeautyclinic.com/some/page' },
    });
    expect(enforceAllowedPublicOrigin(request)).toBeNull();
  });

  it('rejects malformed origin values', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { origin: '%%%not-a-url%%%' },
    });
    const response = enforceAllowedPublicOrigin(request);
    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toEqual({ error: 'Invalid request origin' });
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

  it('rejects malformed content-length header', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': 'not-a-number' },
    });
    const response = enforceContentLength(request, 1024);
    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toEqual({ error: 'Invalid content length' });
  });
});
