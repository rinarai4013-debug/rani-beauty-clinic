import { describe, it, expect } from 'vitest';

describe('/api/cron/smoke-test route module', () => {
  it('exports a GET handler with force-dynamic config', async () => {
    const mod = await import('../route');
    expect(typeof mod.GET).toBe('function');
    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.revalidate).toBe(0);
  });
});
