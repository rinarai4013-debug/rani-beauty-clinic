// Batch operations for Airtable
// Airtable limits create/update to 10 records per request - this auto-chunks larger batches.

import Airtable from 'airtable';
import { rateLimitedQuery } from './client';

const AIRTABLE_BATCH_SIZE = 10;

type FieldSet = Airtable.FieldSet;

interface BatchResult {
  id: string;
  fields: Record<string, unknown>;
}

/**
 * Chunk an array into groups of the specified size.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Batch-create records. Auto-chunks into groups of 10.
 * Returns the IDs of all created records in order.
 */
export async function batchCreate(
  table: Airtable.Table<FieldSet>,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<BatchResult[]> {
  if (records.length === 0) return [];

  const chunks = chunk(records, AIRTABLE_BATCH_SIZE);
  const results: BatchResult[] = [];

  for (const batch of chunks) {
    const created = await rateLimitedQuery(async () => {
      return table.create(
        batch.map((r) => ({ fields: r.fields as Partial<FieldSet> }))
      );
    });

    for (const record of created) {
      results.push({
        id: record.id,
        fields: record.fields as unknown as Record<string, unknown>,
      });
    }
  }

  return results;
}

/**
 * Batch-update records. Auto-chunks into groups of 10.
 * Each entry requires an id and the fields to update.
 */
export async function batchUpdate(
  table: Airtable.Table<FieldSet>,
  records: Array<{ id: string; fields: Record<string, unknown> }>
): Promise<BatchResult[]> {
  if (records.length === 0) return [];

  const chunks = chunk(records, AIRTABLE_BATCH_SIZE);
  const results: BatchResult[] = [];

  for (const batch of chunks) {
    const updated = await rateLimitedQuery(async () => {
      return table.update(
        batch.map((r) => ({ id: r.id, fields: r.fields as Partial<FieldSet> }))
      );
    });

    for (const record of updated) {
      results.push({
        id: record.id,
        fields: record.fields as unknown as Record<string, unknown>,
      });
    }
  }

  return results;
}

/**
 * Batch-delete records. Auto-chunks into groups of 10.
 * Returns the IDs of all deleted records.
 */
export async function batchDelete(
  table: Airtable.Table<FieldSet>,
  recordIds: string[]
): Promise<string[]> {
  if (recordIds.length === 0) return [];

  const chunks = chunk(recordIds, AIRTABLE_BATCH_SIZE);
  const deleted: string[] = [];

  for (const batch of chunks) {
    const results = await rateLimitedQuery(async () => {
      return table.destroy(batch);
    });

    for (const record of results) {
      deleted.push(record.id);
    }
  }

  return deleted;
}

export { AIRTABLE_BATCH_SIZE, chunk };
