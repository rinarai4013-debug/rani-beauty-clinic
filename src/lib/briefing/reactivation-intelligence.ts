import { fetchAll, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

export interface ReactivationOpportunity {
  clientName: string;
  status: string;
  preferredContact: string;
  estimatedValue: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface ReactivationIntelligence {
  totalRecoverableValue: number;
  lapsed30: number;
  lapsed60: number;
  lapsed90: number;
  churned: number;
  highPriorityCount: number;
  topOpportunities: ReactivationOpportunity[];
}

const STATUS_VALUES = ['Lapsed 30', 'Lapsed 60', 'Lapsed 90', 'Churned'] as const;

const RECOVERY_MULTIPLIERS: Record<(typeof STATUS_VALUES)[number], number> = {
  'Lapsed 30': 0.35,
  'Lapsed 60': 0.24,
  'Lapsed 90': 0.14,
  Churned: 0.08,
};

function getPriority(status: string): ReactivationOpportunity['priority'] {
  if (status === 'Lapsed 30') return 'high';
  if (status === 'Lapsed 60') return 'medium';
  return 'low';
}

function getAction(status: string, preferredContact: string): string {
  const channel = preferredContact?.trim() || 'text';
  if (status === 'Lapsed 90') return `Personal ${channel.toLowerCase()} outreach with a strong win-back offer`;
  if (status === 'Lapsed 60') return `Send ${channel.toLowerCase()} reactivation message with consult availability`;
  if (status === 'Lapsed 30') return `Nudge via ${channel.toLowerCase()} before the lapse hardens`;
  return `Test a low-friction ${channel.toLowerCase()} win-back touchpoint`;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchTransactionAmounts(transactionIds: string[]): Promise<Map<string, number>> {
  const entries = new Map<string, number>();
  const uniqueIds = [...new Set(transactionIds)].filter(Boolean);

  if (uniqueIds.length === 0) return entries;

  const batches = await Promise.all(
    chunk(uniqueIds, 25).map((ids) =>
      fetchAll<Record<string, unknown>>(
        Tables.transactions(),
        {
          fields: [FIELDS.transactions.amount, FIELDS.transactions.status],
          filterByFormula: `OR(${ids.map((id) => `RECORD_ID() = '${id}'`).join(',')})`,
        },
        true,
      )
    )
  );

  for (const record of batches.flat()) {
    const status = String(record.fields[FIELDS.transactions.status] || '');
    if (status !== 'Completed') continue;
    entries.set(record.id, Number(record.fields[FIELDS.transactions.amount]) || 0);
  }

  return entries;
}

function getRecoverableValue(status: string, lifetimeValue: number): number {
  const multiplier = RECOVERY_MULTIPLIERS[status as keyof typeof RECOVERY_MULTIPLIERS];
  if (!multiplier || lifetimeValue <= 0) return 0;
  return Math.round(lifetimeValue * multiplier);
}

export async function fetchReactivationIntelligence(): Promise<ReactivationIntelligence> {
  try {
    const formula = `OR(${STATUS_VALUES.map((status) => `{${FIELDS.clients.status}} = '${status}'`).join(',')})`;
    const clients = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {
        filterByFormula: formula,
        fields: [FIELDS.clients.name, FIELDS.clients.status, FIELDS.clients.preferredContact, FIELDS.clients.transactions],
      },
      true,
    );

    const transactionAmounts = await fetchTransactionAmounts(
      clients.flatMap((record) => {
        const linkedTransactions = record.fields[FIELDS.clients.transactions];
        return Array.isArray(linkedTransactions) ? linkedTransactions.map(String) : [];
      }),
    );

    let lapsed30 = 0;
    let lapsed60 = 0;
    let lapsed90 = 0;
    let churned = 0;

    const opportunities: ReactivationOpportunity[] = clients
      .map((record) => {
        const status = String(record.fields[FIELDS.clients.status] || '');
        const preferredContact = String(record.fields[FIELDS.clients.preferredContact] || 'Text');
        const clientName = String(record.fields[FIELDS.clients.name] || 'Unnamed client');

        if (status === 'Lapsed 30') lapsed30 += 1;
        if (status === 'Lapsed 60') lapsed60 += 1;
        if (status === 'Lapsed 90') lapsed90 += 1;
        if (status === 'Churned') churned += 1;

        const linkedTransactions = record.fields[FIELDS.clients.transactions];
        const lifetimeValue = Array.isArray(linkedTransactions)
          ? linkedTransactions.reduce((sum, transactionId) => sum + (transactionAmounts.get(String(transactionId)) || 0), 0)
          : 0;
        const estimatedValue = getRecoverableValue(status, lifetimeValue);

        return {
          clientName,
          status,
          preferredContact,
          estimatedValue,
          priority: getPriority(status),
          action: getAction(status, preferredContact),
        };
      })
      .sort((a, b) => b.estimatedValue - a.estimatedValue);

    return {
      totalRecoverableValue: opportunities.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0),
      lapsed30,
      lapsed60,
      lapsed90,
      churned,
      highPriorityCount: opportunities.filter((opportunity) => opportunity.priority === 'high').length,
      topOpportunities: opportunities.slice(0, 5),
    };
  } catch (error) {
    console.error('[Briefing] Failed to fetch reactivation intelligence:', error);
    return {
      totalRecoverableValue: 0,
      lapsed30: 0,
      lapsed60: 0,
      lapsed90: 0,
      churned: 0,
      highPriorityCount: 0,
      topOpportunities: [],
    };
  }
}
