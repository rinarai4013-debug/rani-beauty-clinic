// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIELDS } from '@/lib/airtable/tables';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

const fetchAllMock = vi.fn();
const clientsTableMock = vi.fn(() => 'Clients');
const transactionsTableMock = vi.fn(() => 'Transactions');

vi.mock('@/lib/airtable/client', () => ({
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  Tables: {
    clients: (...args: unknown[]) => clientsTableMock(...args),
    transactions: (...args: unknown[]) => transactionsTableMock(...args),
  },
}));

describe('fetchReactivationIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sanitizes linked transaction ids before Airtable formula assembly', async () => {
    const riskyTransactionId = "txn' OR TRUE() OR 'x";
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'client_1',
        fields: {
          [FIELDS.clients.name]: 'Client One',
          [FIELDS.clients.status]: 'Lapsed 30',
          [FIELDS.clients.preferredContact]: 'Text',
          [FIELDS.clients.transactions]: [riskyTransactionId],
        },
      },
    ]);
    fetchAllMock.mockResolvedValueOnce([]);

    const { fetchReactivationIntelligence } = await import('../reactivation-intelligence');
    await fetchReactivationIntelligence();

    expect(fetchAllMock).toHaveBeenCalledTimes(2);
    const txCallOptions = fetchAllMock.mock.calls[1]?.[1] as { filterByFormula?: string };
    expect(txCallOptions.filterByFormula).toContain(
      `RECORD_ID() = '${sanitizeFormulaValue(riskyTransactionId)}'`,
    );
    expect(txCallOptions.filterByFormula).not.toContain(
      `RECORD_ID() = '${riskyTransactionId}'`,
    );
  });

  it('returns recoverable totals and priority breakdown from linked client + transaction records', async () => {
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'client_1',
        fields: {
          [FIELDS.clients.name]: 'Client One',
          [FIELDS.clients.status]: 'Lapsed 30',
          [FIELDS.clients.preferredContact]: 'Text',
          [FIELDS.clients.transactions]: ['txn_1'],
        },
      },
      {
        id: 'client_2',
        fields: {
          [FIELDS.clients.name]: 'Client Two',
          [FIELDS.clients.status]: 'Churned',
          [FIELDS.clients.preferredContact]: 'Email',
          [FIELDS.clients.transactions]: ['txn_2'],
        },
      },
    ]);
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'txn_1',
        fields: {
          [FIELDS.transactions.status]: 'Completed',
          [FIELDS.transactions.amount]: 1000,
        },
      },
      {
        id: 'txn_2',
        fields: {
          [FIELDS.transactions.status]: 'Completed',
          [FIELDS.transactions.amount]: 500,
        },
      },
      {
        id: 'txn_3',
        fields: {
          [FIELDS.transactions.status]: 'Refunded',
          [FIELDS.transactions.amount]: 9999,
        },
      },
    ]);

    const { fetchReactivationIntelligence } = await import('../reactivation-intelligence');
    const result = await fetchReactivationIntelligence();

    expect(result.totalRecoverableValue).toBe(390); // 1000*0.35 + 500*0.08
    expect(result.lapsed30).toBe(1);
    expect(result.churned).toBe(1);
    expect(result.highPriorityCount).toBe(1);
    expect(result.topOpportunities[0]).toMatchObject({
      clientName: 'Client One',
      status: 'Lapsed 30',
      priority: 'high',
      estimatedValue: 350,
    });
  });
});
