import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { AirtableTenantStore } from '../resolver';

const selectMock = vi.fn();
const firstPageMock = vi.fn();
const tableResolverMock = vi.fn();
const baseMock = vi.fn();

vi.mock('airtable', () => ({
  default: vi.fn().mockImplementation(() => ({
    base: (...args: unknown[]) => baseMock(...args),
  })),
}));

describe('AirtableTenantStore formula hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RANIOS_MASTER_PAT = 'pat_test';
    process.env.RANIOS_MASTER_BASE_ID = 'app_test';

    firstPageMock.mockResolvedValue([]);
    selectMock.mockReturnValue({
      firstPage: (...args: unknown[]) => firstPageMock(...args),
    });

    tableResolverMock.mockReturnValue({
      select: (...args: unknown[]) => selectMock(...args),
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    });

    baseMock.mockReturnValue(tableResolverMock);
  });

  it('sanitizes tenant id in getById filter formula', async () => {
    const store = new AirtableTenantStore();
    const maliciousId = 'tenant_1" OR TRUE() OR "';

    await store.getById(maliciousId);

    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: `{Tenant ID} = "${sanitizeFormulaValue(maliciousId)}"`,
      }),
    );
  });

  it('sanitizes slug in getBySlug filter formula', async () => {
    const store = new AirtableTenantStore();
    const maliciousSlug = 'my-spa" OR TRUE() OR "';

    await store.getBySlug(maliciousSlug);

    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: `{Slug} = "${sanitizeFormulaValue(maliciousSlug)}"`,
      }),
    );
  });

  it('sanitizes domain in getByCustomDomain filter formula', async () => {
    const store = new AirtableTenantStore();
    const maliciousDomain = 'spa.example.com" OR TRUE() OR "';

    await store.getByCustomDomain(maliciousDomain);

    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: `{Custom Domain} = "${sanitizeFormulaValue(maliciousDomain)}"`,
      }),
    );
  });
});

