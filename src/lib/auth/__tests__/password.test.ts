import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import { hashPassword } from '../password';

describe('hashPassword', () => {
  it('produces pbkdf2 format', () => {
    const output = hashPassword('secret');
    expect(output).toMatch(/^pbkdf2\$\d+\$[a-f0-9]+\$[a-f0-9]+$/);
  });

  it('uses 100000 iterations', () => {
    const output = hashPassword('secret');
    const [, iterationString] = output.split('$');
    expect(Number(iterationString)).toBe(100_000);
  });

  it('returns a 16-byte hex salt', () => {
    const output = hashPassword('secret');
    const [, , salt] = output.split('$');
    expect(salt).toHaveLength(32);
    expect(salt).toMatch(/^[a-f0-9]{32}$/);
  });

  it('returns a 64-byte hex hash', () => {
    const output = hashPassword('secret');
    const [, , , hash] = output.split('$');
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[a-f0-9]{128}$/);
  });

  it('returns different hashes for the same password because of random salt', () => {
    const first = hashPassword('repro');
    const second = hashPassword('repro');
    expect(first).not.toBe(second);
  });

  it('matches deterministic pbkdf2 output for a captured hash', () => {
    const output = hashPassword('open-sesame');
    const [, iterationString, salt, hash] = output.split('$');
    const iterations = Number(iterationString);
    const expected = crypto.pbkdf2Sync('open-sesame', salt, iterations, 64, 'sha512').toString('hex');
    expect(hash).toBe(expected);
  });
});
