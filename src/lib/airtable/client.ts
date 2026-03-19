import Airtable from 'airtable';

// Validate env vars at module load time
if (!process.env.AIRTABLE_PAT) {
  console.error('[Airtable] AIRTABLE_PAT is missing. Airtable queries will fail.');
}
if (!process.env.AIRTABLE_BASE_ID) {
  console.error('[Airtable] AIRTABLE_BASE_ID is missing. Airtable queries will fail.');
}

// Lazy-initialized to avoid throwing during Next.js build (env vars unavailable at build time)
let _base: ReturnType<InstanceType<typeof Airtable>['base']> | null = null;

function getBase() {
  if (!_base) {
    const airtable = new Airtable({
      apiKey: process.env.AIRTABLE_PAT,
    });
    _base = airtable.base(process.env.AIRTABLE_BASE_ID!);
  }
  return _base;
}

// Rate limiting: Airtable allows 5 req/sec per base
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
const queue: (() => void)[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const next = queue.shift();
    next?.();
    await new Promise((r) => setTimeout(r, 210)); // ~4.7 req/sec
  }
  processing = false;
}

function getStatusCode(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return (err as { statusCode: number }).statusCode;
  }
  return undefined;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = getStatusCode(err);

      if (status === 429 && attempt < MAX_RETRIES) {
        console.warn(`[Airtable] Rate limited (429). Retry ${attempt}/${MAX_RETRIES} after 1s...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (status && status >= 500 && status < 600 && attempt < MAX_RETRIES) {
        console.warn(`[Airtable] Server error (${status}). Retry ${attempt}/${MAX_RETRIES} after 500ms...`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      throw err;
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error('[Airtable] Retry loop exited unexpectedly');
}

export function rateLimitedQuery<T>(fn: () => Promise<T>): Promise<T> {
  if (queue.length >= MAX_QUEUE_SIZE) {
    return Promise.reject(new Error('Airtable queue overflow'));
  }

  return new Promise((resolve, reject) => {
    queue.push(() => {
      withRetry(fn).then(resolve).catch(reject);
    });
    processQueue();
  });
}

export const Tables = {
  clients: () => getBase()('Clients'),
  appointments: () => getBase()('Appointments'),
  transactions: () => getBase()('Transactions'),
  kpis: () => getBase()('KPI Snapshots'),
  alerts: () => getBase()('Alerts'),
  packages: () => getBase()('Packages'),
  memberships: () => getBase()('Memberships'),
  intakes: () => getBase()('Client Intakes'),
  reviews: () => getBase()('Reviews'),
  messagesLog: () => getBase()('Messages Log'),
  competitorIntel: () => getBase()('Competitor Intelligence'),
  intakeIntelligence: () => getBase()('Intake Intelligence'),
  treatmentPlans: () => getBase()('Treatment Plans'),
} as const;

// Helper to fetch all records with pagination
// skipTestFilter: set true for tables without an "Is Test" field (e.g. Clients, Client Intakes)
export async function fetchAll<T = Record<string, unknown>>(
  table: Airtable.Table<Airtable.FieldSet>,
  options?: Airtable.SelectOptions<Airtable.FieldSet>,
  skipTestFilter?: boolean
): Promise<{ id: string; fields: T }[]> {
  const records: { id: string; fields: T }[] = [];
  const formula = skipTestFilter
    ? (options?.filterByFormula || '')
    : options?.filterByFormula
      ? `AND(NOT({Is Test}), ${options.filterByFormula})`
      : 'NOT({Is Test})';
  await rateLimitedQuery(() =>
    new Promise<void>((resolve, reject) => {
      table
        .select({
          ...options,
          ...(formula ? { filterByFormula: formula } : {}),
        })
        .eachPage(
          (pageRecords, fetchNextPage) => {
            pageRecords.forEach((r) => {
              records.push({ id: r.id, fields: r.fields as unknown as T });
            });
            fetchNextPage();
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
    })
  );
  return records;
}

// Helper to fetch first N records
// skipTestFilter: set true for tables without an "Is Test" field
export async function fetchFirst<T = Record<string, unknown>>(
  table: Airtable.Table<Airtable.FieldSet>,
  maxRecords: number,
  options?: Airtable.SelectOptions<Airtable.FieldSet>,
  skipTestFilter?: boolean
): Promise<{ id: string; fields: T }[]> {
  const formula = skipTestFilter
    ? (options?.filterByFormula || '')
    : options?.filterByFormula
      ? `AND(NOT({Is Test}), ${options.filterByFormula})`
      : 'NOT({Is Test})';
  return rateLimitedQuery(async () => {
    const records = await table
      .select({
        maxRecords,
        ...options,
        ...(formula ? { filterByFormula: formula } : {}),
      })
      .firstPage();
    return records.map((r) => ({ id: r.id, fields: r.fields as unknown as T }));
  });
}

// Helper to create a record
export async function createRecord<T = Record<string, unknown>>(
  table: Airtable.Table<Airtable.FieldSet>,
  fields: Partial<T>
): Promise<string> {
  return rateLimitedQuery(async () => {
    const record = await table.create(fields as Partial<Airtable.FieldSet>);
    return record.id;
  });
}

// Helper to update a record
export async function updateRecord<T = Record<string, unknown>>(
  table: Airtable.Table<Airtable.FieldSet>,
  recordId: string,
  fields: Partial<T>
): Promise<void> {
  await rateLimitedQuery(async () => {
    await table.update(recordId, fields as Partial<Airtable.FieldSet>);
  });
}
