import { describe, it, expect } from 'vitest';
import { rateLimit, getClientIP, RATE_LIMITS } from './rate-limit';

describe('rateLimit', () => {
  it('allows requests within the limit', () => {
    const result = rateLimit('test-allow', '1.2.3.4', { limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests exceeding the limit', () => {
    const config = { limit: 3, windowMs: 60000 };
    rateLimit('test-block', '5.6.7.8', config);
    rateLimit('test-block', '5.6.7.8', config);
    rateLimit('test-block', '5.6.7.8', config);
    const result = rateLimit('test-block', '5.6.7.8', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('isolates different IPs', () => {
    const config = { limit: 1, windowMs: 60000 };
    rateLimit('test-isolate', '10.0.0.1', config);
    const result = rateLimit('test-isolate', '10.0.0.2', config);
    expect(result.allowed).toBe(true);
  });

  it('isolates different route keys', () => {
    const config = { limit: 1, windowMs: 60000 };
    rateLimit('route-a', '20.0.0.1', config);
    const result = rateLimit('route-b', '20.0.0.1', config);
    expect(result.allowed).toBe(true);
  });

  it('RATE_LIMITS presets are defined', () => {
    expect(RATE_LIMITS.FORM.limit).toBe(5);
    expect(RATE_LIMITS.AI.limit).toBe(10);
    expect(RATE_LIMITS.VIEW.limit).toBe(30);
    expect(RATE_LIMITS.WEBHOOK.limit).toBe(100);
  });
});

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(getClientIP(req)).toBe('9.8.7.6');
  });

  it('defaults to 127.0.0.1', () => {
    const req = new Request('http://localhost');
    expect(getClientIP(req)).toBe('127.0.0.1');
  });
});
