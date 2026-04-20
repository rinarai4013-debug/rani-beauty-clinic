// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  computeMangomintSignature,
  verifyMangomintSignature,
} from '../mangomint';

describe('mangomint signature helpers', () => {
  it('computes deterministic hmac signature', () => {
    const secret = 'test_secret';
    const payload = JSON.stringify({ hello: 'world' });

    const a = computeMangomintSignature(secret, payload);
    const b = computeMangomintSignature(secret, payload);

    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('accepts valid signature', () => {
    const secret = 'test_secret';
    const payload = JSON.stringify({ event: 'appointment-booked', id: 'apt_1' });
    const signature = computeMangomintSignature(secret, payload);

    expect(verifyMangomintSignature(signature, payload, secret)).toBe(true);
  });

  it('accepts valid signature with sha256= prefix', () => {
    const secret = 'test_secret';
    const payload = JSON.stringify({ event: 'appointment-booked', id: 'apt_1' });
    const signature = `sha256=${computeMangomintSignature(secret, payload)}`;

    expect(verifyMangomintSignature(signature, payload, secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    const secret = 'test_secret';
    const payload = JSON.stringify({ event: 'appointment-booked', id: 'apt_1' });

    expect(verifyMangomintSignature('invalid', payload, secret)).toBe(false);
  });
});
