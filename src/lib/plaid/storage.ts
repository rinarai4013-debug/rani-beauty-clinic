import crypto from 'crypto';
import type { PlaidAccount, PlaidTransaction, CategoryMappingRule } from '@/types/plaid';
import { DEFAULT_CATEGORY_MAPPINGS } from './categories';
import { Tables, fetchFirst, createRecord, updateRecord } from '@/lib/airtable/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaidStorageData {
  accessToken: string | null;
  itemId: string | null;
  institutionId: string | null;
  institutionName: string | null;
  cursor: string | null;
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  lastSyncedAt: string | null;
  categoryMappings: CategoryMappingRule[];
  reconciliations: Record<string, { entryId: string; entryType: string }>;
}

const DEFAULT_DATA: PlaidStorageData = {
  accessToken: null,
  itemId: null,
  institutionId: null,
  institutionName: null,
  cursor: null,
  accounts: [],
  transactions: [],
  lastSyncedAt: null,
  categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
  reconciliations: {},
};

// ---------------------------------------------------------------------------
// AES-256-GCM Encryption - key derived from DASHBOARD_JWT_SECRET
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(): Buffer {
  const secret = process.env.DASHBOARD_JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[Plaid Storage] DASHBOARD_JWT_SECRET is not set. ' +
      'Cannot encrypt/decrypt sensitive data without this environment variable.'
    );
  }
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

function decrypt(encryptedStr: string): string {
  const key = deriveKey();
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = Buffer.from(parts[2], 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
}

// ---------------------------------------------------------------------------
// Airtable Alerts table - System Config storage
// Requires a "Notes" Long Text field in the Alerts table.
// ---------------------------------------------------------------------------

const SYSTEM_CONFIG_TYPE = 'System Config';
const PLAID_CONFIG_KEY = 'plaid_connection';

interface AlertsFields {
  Type: string;
  'Metric Name': string;
  Notes: string;
  Status: string;
}

/**
 * Find the Airtable record that stores Plaid connection data.
 * Returns the record id + raw Notes JSON, or null if not found.
 */
async function findConfigRecord(): Promise<{ id: string; notes: string } | null> {
  const records = await fetchFirst<AlertsFields>(
    Tables.alerts(),
    1,
    {
      filterByFormula: `AND({Type}="${SYSTEM_CONFIG_TYPE}", {Metric Name}="${PLAID_CONFIG_KEY}")`,
    },
    true, // skipTestFilter - System Config rows don't have "Is Test"
  );
  if (!records[0]) return null;
  return {
    id: records[0].id,
    notes: (records[0].fields.Notes as string) || '',
  };
}

// ---------------------------------------------------------------------------
// Public API - async replacements for the old fs-based functions
// ---------------------------------------------------------------------------

export async function readStorage(): Promise<PlaidStorageData> {
  try {
    const record = await findConfigRecord();
    if (!record || !record.notes) return { ...DEFAULT_DATA };

    const parsed = JSON.parse(record.notes) as Partial<PlaidStorageData>;

    // Decrypt access token
    if (parsed.accessToken) {
      try {
        parsed.accessToken = decrypt(parsed.accessToken);
      } catch {
        console.error('[Plaid Storage] Failed to decrypt access token - clearing it');
        parsed.accessToken = null;
      }
    }

    // Decrypt itemId if it was encrypted
    if (parsed.itemId && parsed.itemId.includes(':')) {
      try {
        parsed.itemId = decrypt(parsed.itemId);
      } catch {
        // itemId may not have been encrypted (backward compat)
      }
    }

    return { ...DEFAULT_DATA, ...parsed };
  } catch (err) {
    console.error('[Plaid Storage] readStorage error:', err);
    return { ...DEFAULT_DATA };
  }
}

export async function writeStorage(data: PlaidStorageData): Promise<void> {
  // Deep-clone so we don't mutate the caller's object
  const toStore = { ...data };

  // Encrypt sensitive fields before persisting
  if (toStore.accessToken) {
    toStore.accessToken = encrypt(toStore.accessToken);
  }
  if (toStore.itemId) {
    toStore.itemId = encrypt(toStore.itemId);
  }

  const json = JSON.stringify(toStore);

  const existing = await findConfigRecord();
  if (existing) {
    await updateRecord(Tables.alerts(), existing.id, {
      Notes: json,
    });
  } else {
    await createRecord(Tables.alerts(), {
      Type: SYSTEM_CONFIG_TYPE,
      'Metric Name': PLAID_CONFIG_KEY,
      Notes: json,
      Status: 'Active',
    });
  }
}

export async function updateStorage(
  partial: Partial<PlaidStorageData>,
): Promise<PlaidStorageData> {
  const current = await readStorage();
  const updated = { ...current, ...partial };
  await writeStorage(updated);
  return updated;
}

export async function clearStorage(): Promise<void> {
  await writeStorage({ ...DEFAULT_DATA });
}
