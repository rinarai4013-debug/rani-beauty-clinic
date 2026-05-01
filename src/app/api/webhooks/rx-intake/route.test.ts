import { describe, expect, it } from 'vitest';
import { POST, dynamic, revalidate } from './route';

describe('POST /api/webhooks/rx-intake', () => {
  it('exports handler and dynamic directives', () => {
    expect(typeof POST).toBe('function');
    expect(dynamic).toBe('force-dynamic');
    expect(revalidate).toBe(0);
  });
});
