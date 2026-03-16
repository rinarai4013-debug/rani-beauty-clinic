import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import type { PlaidAccount, PlaidTransaction, CategoryMappingRule } from '@/types/plaid';
import { DEFAULT_CATEGORY_MAPPINGS } from './categories';

const STORAGE_PATH = path.join(process.cwd(), '.plaid-data.json');

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

export function readStorage(): PlaidStorageData {
  if (!existsSync(STORAGE_PATH)) {
    return { ...DEFAULT_DATA };
  }
  try {
    const raw = readFileSync(STORAGE_PATH, 'utf-8');
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function writeStorage(data: PlaidStorageData): void {
  writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function updateStorage(partial: Partial<PlaidStorageData>): PlaidStorageData {
  const current = readStorage();
  const updated = { ...current, ...partial };
  writeStorage(updated);
  return updated;
}

export function clearStorage(): void {
  writeStorage({ ...DEFAULT_DATA });
}
