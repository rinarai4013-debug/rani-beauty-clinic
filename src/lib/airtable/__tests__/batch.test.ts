import { describe, it, expect } from 'vitest';
import { chunk, AIRTABLE_BATCH_SIZE } from '../batch';

describe('batch', () => {
  describe('chunk()', () => {
    it('chunks an array into groups of the specified size', () => {
      const input = [1, 2, 3, 4, 5, 6, 7];
      const result = chunk(input, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('returns a single chunk when length <= size', () => {
      const input = [1, 2, 3];
      const result = chunk(input, 10);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('returns empty array for empty input', () => {
      expect(chunk([], 10)).toEqual([]);
    });

    it('handles exact multiples', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunk(input, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    it('chunks 25 records into 3 batches of 10, 10, 5', () => {
      const input = Array.from({ length: 25 }, (_, i) => i);
      const result = chunk(input, AIRTABLE_BATCH_SIZE);
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(10);
      expect(result[1].length).toBe(10);
      expect(result[2].length).toBe(5);
    });
  });

  describe('AIRTABLE_BATCH_SIZE', () => {
    it('is 10', () => {
      expect(AIRTABLE_BATCH_SIZE).toBe(10);
    });
  });
});
