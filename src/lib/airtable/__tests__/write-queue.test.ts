import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeQueue } from '../write-queue';

describe('WriteQueue', () => {
  beforeEach(() => {
    writeQueue.clear();
  });

  it('starts empty', () => {
    expect(writeQueue.size()).toBe(0);
  });

  it('enqueues a write entry', () => {
    const ok = writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec123',
      fields: { 'Client': 'Jane' },
      operation: 'update',
    });
    expect(ok).toBe(true);
    expect(writeQueue.size()).toBe(1);
  });

  it('deduplicates by table+recordId', () => {
    writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec123',
      fields: { 'Client': 'Jane' },
      operation: 'update',
    });
    writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec123',
      fields: { 'Client': 'Jane Updated' },
      operation: 'update',
    });
    expect(writeQueue.size()).toBe(1);

    const entries = writeQueue.peek();
    expect((entries[0].fields as Record<string, string>)['Client']).toBe('Jane Updated');
  });

  it('does not deduplicate creates (no recordId)', () => {
    writeQueue.enqueue({
      table: 'Clients',
      fields: { 'Client': 'Jane' },
      operation: 'create',
    });
    writeQueue.enqueue({
      table: 'Clients',
      fields: { 'Client': 'John' },
      operation: 'create',
    });
    expect(writeQueue.size()).toBe(2);
  });

  it('drains successfully', async () => {
    writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec1',
      fields: { 'Client': 'Jane' },
      operation: 'update',
    });
    writeQueue.enqueue({
      table: 'Transactions',
      recordId: 'rec2',
      fields: { 'Amount': 100 },
      operation: 'update',
    });

    const executor = vi.fn().mockResolvedValue(undefined);
    const count = await writeQueue.drain(executor);

    expect(count).toBe(2);
    expect(executor).toHaveBeenCalledTimes(2);
    expect(writeQueue.size()).toBe(0);
  });

  it('keeps failed entries in queue during drain', async () => {
    writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec1',
      fields: {},
      operation: 'update',
    });

    const executor = vi.fn().mockRejectedValue(new Error('still down'));
    const count = await writeQueue.drain(executor);

    expect(count).toBe(0);
    expect(writeQueue.size()).toBe(1);
  });

  it('drops entries after max retries', async () => {
    writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec1',
      fields: {},
      operation: 'update',
    });

    const executor = vi.fn().mockRejectedValue(new Error('fail'));

    // Drain 5 times (MAX_RETRIES = 5)
    for (let i = 0; i < 5; i++) {
      await writeQueue.drain(executor);
    }

    expect(writeQueue.size()).toBe(0);
  });

  it('reports stats correctly', () => {
    writeQueue.enqueue({ table: 'Clients', recordId: 'rec1', fields: {}, operation: 'update' });
    writeQueue.enqueue({ table: 'Clients', recordId: 'rec2', fields: {}, operation: 'update' });
    writeQueue.enqueue({ table: 'Transactions', recordId: 'rec3', fields: {}, operation: 'create' });

    const stats = writeQueue.getStats();
    expect(stats.size).toBe(3);
    expect(stats.byTable['Clients']).toBe(2);
    expect(stats.byTable['Transactions']).toBe(1);
    expect(stats.oldestEntryAge).toBeGreaterThanOrEqual(0);
  });

  it('rejects when queue is full', () => {
    // Fill the queue to 100
    for (let i = 0; i < 100; i++) {
      writeQueue.enqueue({
        table: 'Clients',
        recordId: `rec${i}`,
        fields: {},
        operation: 'update',
      });
    }

    const ok = writeQueue.enqueue({
      table: 'Clients',
      recordId: 'rec_overflow',
      fields: {},
      operation: 'update',
    });
    // rec_overflow should deduplicate or fail - since recordId is unique, it should fail
    expect(ok).toBe(false);
    expect(writeQueue.size()).toBe(100);
  });
});
