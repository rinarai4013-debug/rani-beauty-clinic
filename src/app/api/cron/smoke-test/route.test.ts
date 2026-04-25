import { describe, expect, it } from 'vitest';
import { GET, dynamic, revalidate } from './route';

describe('/api/cron/smoke-test route module', () => {
  it('exports handler and dynamic directives', () => {
    expect(typeof GET).toBe('function');
    expect(dynamic).toBe('force-dynamic');
    expect(revalidate).toBe(0);
  });
});
