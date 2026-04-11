import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchFirst = vi.fn();
const createRecord = vi.fn();
const updateRecord = vi.fn();

vi.mock('@/lib/env', () => ({
  env: {
    DASHBOARD_JWT_SECRET: 'test-dashboard-secret-at-least-32-characters',
  },
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    alerts: () => 'alerts',
  },
  fetchFirst,
  createRecord,
  updateRecord,
}));

import {
  readStorage,
  writeStorage,
  updateStorage,
  clearStorage,
} from '@/lib/plaid/storage';

describe('plaid/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default storage when no config record exists', async () => {
    fetchFirst.mockResolvedValueOnce([]);

    const result = await readStorage();

    expect(result).toEqual({
      accessToken: null,
      itemId: null,
      institutionId: null,
      institutionName: null,
      cursor: null,
      accounts: [],
      transactions: [],
      lastSyncedAt: null,
      categoryMappings: expect.any(Array),
      reconciliations: {},
    });
  });

  it('creates a config record and encrypts sensitive fields when writing new storage', async () => {
    fetchFirst.mockResolvedValueOnce([]);

    await writeStorage({
      accessToken: 'plaid-access-token',
      itemId: 'item-123',
      institutionId: 'ins_1',
      institutionName: 'Chase',
      cursor: 'cursor-1',
      accounts: [],
      transactions: [],
      lastSyncedAt: '2026-04-10T12:00:00Z',
      categoryMappings: [],
      reconciliations: {},
    });

    expect(createRecord).toHaveBeenCalledWith(
      'alerts',
      expect.objectContaining({
        Type: 'System Config',
        'Metric Name': 'plaid_connection',
        Status: 'Active',
        Notes: expect.any(String),
      })
    );

    const notes = createRecord.mock.calls[0][1].Notes as string;
    expect(notes).not.toContain('plaid-access-token');
    expect(notes).not.toContain('item-123');
  });

  it('reads back encrypted storage and decrypts the token fields', async () => {
    fetchFirst.mockResolvedValueOnce([]);

    await writeStorage({
      accessToken: 'plaid-access-token',
      itemId: 'item-123',
      institutionId: 'ins_1',
      institutionName: 'Chase',
      cursor: 'cursor-1',
      accounts: [],
      transactions: [],
      lastSyncedAt: '2026-04-10T12:00:00Z',
      categoryMappings: [],
      reconciliations: {},
    });

    const notes = createRecord.mock.calls[0][1].Notes;
    fetchFirst.mockResolvedValueOnce([
      {
        id: 'rec-config',
        fields: {
          Notes: notes,
        },
      },
    ]);

    const result = await readStorage();

    expect(result.accessToken).toBe('plaid-access-token');
    expect(result.itemId).toBe('item-123');
    expect(result.institutionName).toBe('Chase');
  });

  it('updates existing storage by merging partial changes', async () => {
    fetchFirst
      .mockResolvedValueOnce([
        {
          id: 'rec-config',
          fields: {
            Notes: createEncryptedNotes({
              accessToken: 'old-token',
              itemId: 'old-item',
              institutionId: 'ins_1',
              institutionName: 'Chase',
              cursor: null,
              accounts: [],
              transactions: [],
              lastSyncedAt: null,
              categoryMappings: [],
              reconciliations: {},
            }),
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'rec-config',
          fields: {
            Notes: '',
          },
        },
      ]);

    const result = await updateStorage({
      cursor: 'cursor-2',
      institutionName: 'BofA',
    });

    expect(updateRecord).toHaveBeenCalledWith(
      'alerts',
      'rec-config',
      expect.objectContaining({
        Notes: expect.any(String),
      })
    );
    expect(result.cursor).toBe('cursor-2');
    expect(result.institutionName).toBe('BofA');
    expect(result.accessToken).toBe('old-token');
  });

  it('clears storage back to the default persisted shape', async () => {
    fetchFirst.mockResolvedValueOnce([
      {
        id: 'rec-config',
        fields: {
          Notes: '',
        },
      },
    ]);

    await clearStorage();

    expect(updateRecord).toHaveBeenCalledWith(
      'alerts',
      'rec-config',
      expect.objectContaining({
        Notes: expect.any(String),
      })
    );
  });
});

function createEncryptedNotes(data: Record<string, unknown>) {
  const secret = 'test-dashboard-secret-at-least-32-characters';
  const payload = {
    ...data,
    accessToken: data.accessToken
      ? encryptField(String(data.accessToken), secret)
      : null,
    itemId: data.itemId
      ? encryptField(String(data.itemId), secret)
      : null,
  };

  return JSON.stringify(payload);

  function encryptField(value: string, sharedSecret: string) {
    const fieldKey = crypto.createHash('sha256').update(sharedSecret).digest();
    const fieldIv = crypto.randomBytes(12);
    const fieldCipher = crypto.createCipheriv('aes-256-gcm', fieldKey, fieldIv, {
      authTagLength: 16,
    });
    const encrypted = Buffer.concat([
      fieldCipher.update(value, 'utf8'),
      fieldCipher.final(),
    ]);
    const tag = fieldCipher.getAuthTag();
    return [
      fieldIv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }
}
