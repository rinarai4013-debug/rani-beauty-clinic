// In-memory queue for failed Airtable writes
// Auto-retries on next successful request. Deduplicates by table+recordId.

export interface QueuedWrite {
  table: string;
  recordId?: string;          // undefined for creates
  fields: Record<string, unknown>;
  operation: 'create' | 'update';
  enqueuedAt: number;
  retryCount: number;
}

export interface WriteQueueStats {
  size: number;
  maxSize: number;
  oldestEntryAge: number | null; // ms since oldest entry was enqueued
  byTable: Record<string, number>;
}

const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 5;

class WriteQueue {
  private queue: QueuedWrite[] = [];
  private draining = false;

  /** Enqueue a failed write for later retry */
  enqueue(entry: Omit<QueuedWrite, 'enqueuedAt' | 'retryCount'>): boolean {
    // Deduplication: if there's already an entry for same table+recordId, replace it
    if (entry.recordId) {
      const existingIdx = this.queue.findIndex(
        (q) => q.table === entry.table && q.recordId === entry.recordId
      );
      if (existingIdx !== -1) {
        this.queue[existingIdx] = {
          ...entry,
          enqueuedAt: Date.now(),
          retryCount: this.queue[existingIdx].retryCount,
        };
        return true;
      }
    }

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.error(
        `[Airtable:WriteQueue] Queue full (${MAX_QUEUE_SIZE}). Dropping write for "${entry.table}".`
      );
      return false;
    }

    this.queue.push({
      ...entry,
      enqueuedAt: Date.now(),
      retryCount: 0,
    });
    return true;
  }

  /**
   * Drain the queue by retrying each entry with the provided executor.
   * Called after a successful Airtable request as a signal that the API is healthy.
   * Returns the number of successfully retried entries.
   */
  async drain(
    executor: (_entry: QueuedWrite) => Promise<void>
  ): Promise<number> {
    if (this.draining || this.queue.length === 0) return 0;
    this.draining = true;

    let successCount = 0;
    const failed: QueuedWrite[] = [];

    // Process a copy so we can safely mutate
    const batch = [...this.queue];
    this.queue = [];

    for (const entry of batch) {
      try {
        await executor(entry);
        successCount++;
      } catch {
        entry.retryCount++;
        if (entry.retryCount < MAX_RETRIES) {
          failed.push(entry);
        } else {
          console.error(
            `[Airtable:WriteQueue] Max retries reached for "${entry.table}" ${entry.recordId || '(create)'}. Dropping.`
          );
        }
      }
    }

    // Re-enqueue failed entries (front of queue for priority)
    this.queue = [...failed, ...this.queue];
    this.draining = false;

    if (successCount > 0) {
      console.info(
        `[Airtable:WriteQueue] Drained ${successCount}/${batch.length} queued writes.`
      );
    }

    return successCount;
  }

  /** Peek at the current queue (read-only snapshot) */
  peek(): ReadonlyArray<Readonly<QueuedWrite>> {
    return [...this.queue];
  }

  /** Get queue stats */
  getStats(): WriteQueueStats {
    const byTable: Record<string, number> = {};
    for (const entry of this.queue) {
      byTable[entry.table] = (byTable[entry.table] || 0) + 1;
    }

    return {
      size: this.queue.length,
      maxSize: MAX_QUEUE_SIZE,
      oldestEntryAge:
        this.queue.length > 0 ? Date.now() - this.queue[0].enqueuedAt : null,
      byTable,
    };
  }

  /** Get current size */
  size(): number {
    return this.queue.length;
  }

  /** Clear the entire queue */
  clear(): void {
    this.queue = [];
  }

  /** Check if the queue is currently draining */
  isDraining(): boolean {
    return this.draining;
  }
}

// Singleton instance
export const writeQueue = new WriteQueue();

export { MAX_QUEUE_SIZE, MAX_RETRIES };
