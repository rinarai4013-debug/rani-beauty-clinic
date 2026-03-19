import { describe, it, expect } from 'vitest';
import { sanitizeFormulaValue } from './sanitize';

describe('sanitizeFormulaValue', () => {
  it('passes through normal strings', () => {
    expect(sanitizeFormulaValue('John Doe')).toBe('John Doe');
  });

  it('strips quotes to prevent formula injection', () => {
    expect(sanitizeFormulaValue('O"Brien')).toBe('OBrien');
    expect(sanitizeFormulaValue("O'Brien")).toBe('OBrien');
  });

  it('removes backslashes', () => {
    expect(sanitizeFormulaValue('test\\injection')).toBe('testinjection');
  });

  it('removes newlines and carriage returns', () => {
    expect(sanitizeFormulaValue('line1\nline2\rline3')).toBe('line1line2line3');
  });

  it('handles empty strings', () => {
    expect(sanitizeFormulaValue('')).toBe('');
  });

  it('handles strings with special characters', () => {
    const input = 'rec123ABC_xyz';
    expect(sanitizeFormulaValue(input)).toBe(input);
  });
});
